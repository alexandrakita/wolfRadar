import "dotenv/config";

import app from "./app.js";

const port = Number(process.env.PORT) || 3333;

const server = app.listen(port, () => {
  console.log(`stocky backend listening on ${port}`);
});

function shutdown(signal) {
  console.log(`${signal}: closing`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
