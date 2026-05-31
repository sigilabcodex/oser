import { createServer, type Server } from "node:http";
import { handleStudioRequest } from "./routes";
import { studioHost, studioPort } from "./studioProject";

export type StartStudioServerOptions = {
  host?: string;
  port?: number;
};

export function startStudioServer(options: StartStudioServerOptions = {}): Server {
  const host = options.host ?? process.env.OSER_STUDIO_HOST ?? studioHost;
  const port = options.port ?? Number(process.env.OSER_STUDIO_PORT ?? studioPort);
  const server = createServer((request, response) => {
    handleStudioRequest(request, response).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      response.statusCode = 500;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(`${JSON.stringify({ error: { code: "studio-server-error", message } }, null, 2)}\n`);
    });
  });

  server.listen(port, host, () => {
    process.stdout.write(`OSER Studio server listening at http://${host}:${port}\n`);
  });

  return server;
}

if (require.main === module) {
  startStudioServer();
}
