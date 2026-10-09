import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
  type TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";
import {
  eventSchema,
  ledgerEntrySchema,
  type SavedRoute,
  savedRouteSchema,
} from "../../packages/contracts/src/events.js";
import {
  type Report,
  reportSchema,
} from "../../packages/contracts/src/index.js";
import {
  coveringCells,
  viewportCells,
} from "../../packages/geo/src/coverage.js";
import { distanceM, type Point } from "../../packages/geo/src/index.js";
import type { Commit, Repository } from "../core/ports.js";

export interface Tables {
  reports: string;
  events: string;
  routes: string;
  ledger: string;
}
const conditional = (error: unknown) =>
  error instanceof Error &&
  ["ConditionalCheckFailedException", "TransactionCanceledException"].includes(
    error.name,
  );
export class DynamoRepository implements Repository {
  private readonly client: DynamoDBDocumentClient;
  constructor(
    private readonly tables: Tables,
    region: string,
    profile?: "jalnet",
  ) {
    this.client = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region,
        maxAttempts: 2,
        ...(profile ? { profile } : {}),
      }),
      { marshallOptions: { removeUndefinedValues: true } },
    );
  }
  async getReport(id: string) {
    const response = await this.client.send(
      new GetCommand({
        TableName: this.tables.reports,
        Key: { id },
        ConsistentRead: true,
      }),
    );
    return response.Item ? reportSchema.parse(response.Item) : undefined;
  }
  async putReport(report: Report, expected?: Report["status"]) {
    try {
      await this.client.send(
        new PutCommand({
          TableName: this.tables.reports,
          Item: report,
          ConditionExpression: expected
            ? "#s = :expected"
            : "attribute_not_exists(id)",
          ...(expected
            ? {
                ExpressionAttributeNames: { "#s": "status" },
                ExpressionAttributeValues: { ":expected": expected },
              }
            : {}),
        }),
      );
      return true;
    } catch (error) {
      if (conditional(error)) return false;
      throw error;
    }
  }
  async getEvent(id: string) {
    const response = await this.client.send(
      new GetCommand({
        TableName: this.tables.events,
        Key: { id },
        ConsistentRead: true,
      }),
    );
    return response.Item
      ? eventSchema.parse(this.stripGeo(response.Item))
      : undefined;
  }
  private stripGeo(item: Record<string, unknown>) {
    const { h3R8: _h3, lastSeenAtIndex: _last, ...event } = item;
    return event;
  }
  private async cells(cells: string[]) {
    const events = new Map<string, ReturnType<typeof eventSchema.parse>>();
    // Bound concurrency and page every queried cell; never silently truncate a cell.
    for (let start = 0; start < cells.length; start += 8)
      await Promise.all(
        cells.slice(start, start + 8).map(async (cell) => {
          let cursor: Record<string, unknown> | undefined;
          let pages = 0;
          do {
            const response = await this.client.send(
              new QueryCommand({
                TableName: this.tables.events,
                IndexName: "ByH3",
                KeyConditionExpression: "h3R8 = :cell",
                ExpressionAttributeValues: { ":cell": cell },
                Limit: 100,
                ...(cursor ? { ExclusiveStartKey: cursor } : {}),
              }),
            );
            for (const item of response.Items ?? []) {
              const event = eventSchema.parse(this.stripGeo(item));
              events.set(event.id, event);
              if (events.size > 1000)
                throw new Error(
                  "Spatial candidates exceed bounded result budget",
                );
            }
            cursor = response.LastEvaluatedKey;
            pages++;
            if (pages >= 5 && cursor)
              throw new Error("Spatial result exceeds query page cap");
          } while (cursor);
        }),
      );
    return [...events.values()];
  }
  async nearby(point: Point, radiusM: number) {
    return (await this.cells(coveringCells(point, radiusM))).filter(
      (e) => distanceM(point, e.location) <= radiusM,
    );
  }
  async viewport(bbox: readonly [number, number, number, number]) {
    const [w, s, e, n] = bbox;
    return (await this.cells(viewportCells(bbox))).filter(
      (event) =>
        event.location.lon >= w &&
        event.location.lon <= e &&
        event.location.lat >= s &&
        event.location.lat <= n,
    );
  }
  async counter(key: string) {
    const response = await this.client.send(
      new GetCommand({
        TableName: this.tables.ledger,
        Key: { id: `guard:${key}` },
        ConsistentRead: true,
      }),
    );
    return Number(response.Item?.value ?? 0);
  }
  async commit(change: Commit) {
    const items: NonNullable<TransactWriteCommandInput["TransactItems"]> = [];
    if (change.report)
      items.push({
        Put: {
          TableName: this.tables.reports,
          Item: change.report,
          ConditionExpression: change.expectedReportStatus
            ? "#s = :s"
            : "attribute_not_exists(id)",
          ...(change.expectedReportStatus
            ? {
                ExpressionAttributeNames: { "#s": "status" },
                ExpressionAttributeValues: {
                  ":s": change.expectedReportStatus,
                },
              }
            : {}),
        },
      });
    if (change.event)
      items.push({
        Put: {
          TableName: this.tables.events,
          Item: { ...change.event, h3R8: change.event.location.h3R8 },
          ConditionExpression: change.expectedEventCount
            ? "reportCount = :count AND #attrs.#rev = :revision"
            : "attribute_not_exists(id)",
          ...(change.expectedEventCount
            ? {
                ExpressionAttributeNames: {
                  "#attrs": "attributes",
                  "#rev": "revision",
                },
                ExpressionAttributeValues: {
                  ":revision": change.expectedEventRevision ?? 0,
                  ":count": change.expectedEventCount,
                },
              }
            : {}),
        },
      });
    for (const entry of change.ledger)
      items.push({
        Put: {
          TableName: this.tables.ledger,
          Item: {
            ...entry,
            id: `award:${entry.idempotencyKey}`,
            entryId: entry.id,
          },
          ConditionExpression: "attribute_not_exists(id)",
        },
      });
    for (const guard of change.guards)
      items.push({
        Put: {
          TableName: this.tables.ledger,
          Item: { id: `guard:${guard.key}`, value: guard.value },
          ConditionExpression:
            guard.expected === 0 ? "attribute_not_exists(id)" : "#v = :v",
          ...(guard.expected === 0
            ? {}
            : {
                ExpressionAttributeNames: { "#v": "value" },
                ExpressionAttributeValues: { ":v": guard.expected },
              }),
        },
      });
    try {
      await this.client.send(
        new TransactWriteCommand({ TransactItems: items }),
      );
      return true;
    } catch (error) {
      if (conditional(error)) return false;
      throw error;
    }
  }
  private async byUser(table: string, userId: string, index?: string) {
    const items: Record<string, unknown>[] = [];
    let cursor: Record<string, unknown> | undefined;
    do {
      const result = await this.client.send(
        new QueryCommand({
          TableName: table,
          ...(index ? { IndexName: index } : {}),
          KeyConditionExpression: "userId = :user",
          ExpressionAttributeValues: { ":user": userId },
          ...(cursor ? { ExclusiveStartKey: cursor } : {}),
        }),
      );
      items.push(...(result.Items ?? []));
      cursor = result.LastEvaluatedKey;
    } while (cursor);
    return items;
  }
  async routes(userId: string) {
    return (await this.byUser(this.tables.routes, userId)).map((item) =>
      savedRouteSchema.parse(item),
    );
  }
  async saveRoute(route: SavedRoute) {
    await this.client.send(
      new PutCommand({
        TableName: this.tables.routes,
        Item: route,
        ConditionExpression: "attribute_not_exists(id)",
      }),
    );
  }
  async deleteRoute(userId: string, id: string) {
    await this.client.send(
      new DeleteCommand({ TableName: this.tables.routes, Key: { userId, id } }),
    );
  }
  async ledger(userId: string) {
    return (await this.byUser(this.tables.ledger, userId, "ByUser")).map(
      (item) => {
        const { entryId, ...entry } = item;
        return ledgerEntrySchema.parse({ ...entry, id: entryId });
      },
    );
  }
}
