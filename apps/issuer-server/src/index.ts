/**
 * @eudi-wallet/issuer-server
 *
 * OID4VCI-compliant credential issuer — reference implementation.
 *
 * Endpoints:
 *   GET  /.well-known/openid-credential-issuer  — issuer metadata
 *   POST /offer                                  — create credential offer (admin)
 *   GET  /offer/:id                              — fetch credential offer (wallet)
 *   POST /token                                  — exchange pre-auth code for access token
 *   POST /credential                             — issue credential (requires access token)
 *   GET  /status/:id                             — Status List 2021 (revocation)
 *   GET  /health                                 — health check
 */
import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { config } from "./config/index.js"
import { errorHandler } from "./middleware/error-handler.js"
import { corsMiddleware } from "./middleware/cors.js"
import { metadataRoutes } from "./routes/metadata.js"
import { offerRoutes } from "./routes/offer.js"
import { tokenRoutes } from "./routes/token.js"
import { credentialRoutes } from "./routes/credential.js"
import { statusRoutes } from "./routes/status.js"
import { healthRoutes } from "./routes/health.js"

const app = new Hono()

// Global middleware
app.use("*", errorHandler)
app.use("*", corsMiddleware)

// Mount routes
app.route("/", metadataRoutes(config))
app.route("/", offerRoutes(config))
app.route("/", tokenRoutes(config))
app.route("/", credentialRoutes(config))
app.route("/", statusRoutes(config))
app.route("/", healthRoutes())

// 404 catch-all
app.notFound((c) =>
  c.json({ error: "not_found", error_description: `Route ${c.req.method} ${c.req.path} not found` }, 404),
)

// Start server
serve({ fetch: app.fetch, port: config.port }, ({ address, port }) => {
  console.log(`[eudi-issuer] Running at http://${address}:${port}`)
  console.log(`[eudi-issuer] Issuer URL: ${config.issuerUrl}`)
  console.log(`[eudi-issuer] Metadata:   ${config.issuerUrl}/.well-known/openid-credential-issuer`)
})

export default app
