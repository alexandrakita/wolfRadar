import { HttpError } from "../lib/http-error.js";

/** @param {unknown} err */
function resolveStatus(err) {
  if (err && typeof err === "object") {
    const o = /** @type {{ status?: unknown, statusCode?: unknown }} */ (err);
    if (typeof o.status === "number" && o.status >= 400 && o.status < 600) return o.status;
    if (typeof o.statusCode === "number" && o.statusCode >= 400 && o.statusCode < 600) {
      return o.statusCode;
    }
  }
  if (err instanceof HttpError) return err.status;
  return 500;
}

/** @param {unknown} err @param {number} status */
function resolveMessage(err, status) {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Server error";
  if (status >= 500 && process.env.NODE_ENV === "production") return "Server error";
  return typeof raw === "string" && raw.trim() ? raw : "Server error";
}

/** @type {import("express").ErrorRequestHandler} */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }
  const status = resolveStatus(err);
  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  } else if (status >= 500) {
    console.error(err instanceof Error ? err.stack ?? err.message : err);
  }
  res.status(status).json({ error: resolveMessage(err, status) });
}
