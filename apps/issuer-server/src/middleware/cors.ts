import type { Context, Next } from "hono"

/** Permissive CORS for development. Tighten allowed origins in production. */
export async function corsMiddleware(c: Context, next: Next) {
  await next()
  c.header("Access-Control-Allow-Origin", "*")
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
}
