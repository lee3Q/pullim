import { createPullimServer } from "./workbench-server.ts";

const port = Number(process.env.PORT || 3147);
const host = process.env.HOST || "127.0.0.1";

const server = createPullimServer();
server.listen(port, host, () => {
  console.log(`🌿 Pullim (풀림) Open-Source Workbench running at http://${host}:${port}`);
});
