import cors from "cors";
import express from "express";
import morgan from "morgan";

import { errorHandler } from "./middleware/error-handler.js";
import routes from "./routes/index.js";

const app = express();

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

export default app;
