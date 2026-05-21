import { Hono } from "hono"

export function healthRoutes() {
  const app = new Hono()

  app.get("/health", (c) =>
    c.json({ status: "ok", timestamp: new Date().toISOString(), service: "eudi-issuer-server" }),
  )

  return app
}
