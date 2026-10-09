import { createConnection } from "node:net";

export async function requireStoppedDemoServer() {
  const running = await new Promise<boolean>((resolve, reject) => {
    const socket = createConnection({ host: "127.0.0.1", port: 8787 });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", (error: NodeJS.ErrnoException) => {
      socket.destroy();
      if (error.code === "ECONNREFUSED") resolve(false);
      else reject(error);
    });
    socket.setTimeout(1000, () => {
      socket.destroy();
      reject(new Error("Could not verify that the demo server is stopped"));
    });
  });
  if (running)
    throw new Error(
      "Stop the localhost demo server before seed/reset to avoid overwriting its in-memory state",
    );
}
