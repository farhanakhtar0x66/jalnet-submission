import { createServer } from "node:http";
import { ApiFailure, Application } from "../core/application.js";
import { dispatch, errorResponse, parseRequestBody } from "../core/http.js";
import { CedarReportAuthorizer } from "../providers/cedar-authorization.js";
import {
  LocalAnalysis,
  LocalEvidence,
  LocalRoutes,
} from "../providers/local.js";
import { LocalRepository } from "../providers/local-repository.js";

export async function createLocalServer(options: {
  stateFile?: string;
  evidenceDirectory: string;
  evidenceBaseUrl: string;
  policies?: Readonly<Record<string, string>>;
}) {
  // Initialization must succeed before a server is even created. No fallback.
  const authorizer = await CedarReportAuthorizer.create(
    options.policies ? { policies: options.policies } : {},
  );
  const repository = new LocalRepository(options.stateFile);
  await repository.load();
  const evidence = new LocalEvidence(
    options.evidenceDirectory,
    options.evidenceBaseUrl,
  );
  const app = new Application(
    repository,
    evidence,
    new LocalAnalysis(),
    new LocalRoutes(),
    undefined,
    authorizer,
  );
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const chunks: Uint8Array[] = [];
      let length = 0;
      for await (const chunk of req) {
        length += chunk.length;
        if (length > 4_000_000)
          throw new ApiFailure("UPLOAD_TOO_LARGE", 413, "Body too large");
        chunks.push(chunk);
      }
      const bytes = Buffer.concat(chunks);
      const upload = url.pathname.match(/^\/local\/evidence\/([\w-]+)$/);
      if (req.method === "PUT" && upload?.[1]) {
        // Redeems only a short-lived capability issued after authorization.
        await evidence.upload(upload[1], bytes);
        res.writeHead(204);
        res.end();
        return;
      }
      const token = req.headers.authorization;
      const userId =
        token === "Bearer LOCAL_DEMO_ALICE"
          ? "local-alice"
          : token === "Bearer LOCAL_DEMO_BOB"
            ? "local-bob"
            : "";
      const result = await dispatch(
        app,
        {
          method: req.method ?? "GET",
          path: url.pathname,
          userId,
          query: Object.fromEntries(url.searchParams),
          body: parseRequestBody(bytes.toString()),
        },
        async (id) => {
          await app.analyze(id);
        },
      );
      res.writeHead(200, {
        "content-type": "application/json",
        "x-jalnet-provider": "LOCAL_DEMO",
      });
      res.end(JSON.stringify(result));
    } catch (error) {
      const result = errorResponse(error);
      res.writeHead(result.status, { "content-type": "application/json" });
      res.end(JSON.stringify(result.body));
    }
  });
  return { server, app, repository, evidence, authorizer };
}
