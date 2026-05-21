import type { Context, Next } from "hono"

export async function errorHandler(c: Context, next: Next) {
  try {
    await next()
  } catch (err) {
    console.error("[issuer-server]", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return c.json({ error: "server_error", error_description: message }, 500)
  }
}
