import "dotenv/config";

import cors from "cors";
import express from "express";
import morgan from "morgan";

import { errorHandler } from "./middleware/error-handler.js";
import routes from "./routes/index.js";

const app = express();
const port = Number(process.env.PORT) || 3333;

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  }),
);

app.use("/api", routes);
app.use(errorHandler);

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
