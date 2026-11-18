# NAMINA AI Connect pilot

Production is OFF unless NAMINA_MCP_ENABLED=true. OAuth additionally requires NAMINA_MCP_OAUTH_ENABLED=true and NAMINA_MCP_OAUTH_SECRET (independent random secret, minimum 32 bytes, server-only). Never commit secret values. The current OAuth issuer and resource are fixed to https://namina.biz.id and https://namina.biz.id/api/mcp; staging must use a separate reviewed configuration/domain before enabling OAuth there.

## Test and release gates

1. Confirm CI and Vercel preview are READY for the same commit.
2. On a separate staging database, apply supabase/mcp-preview.sql then supabase/mcp-oauth-preview.sql, verify privileges/RLS and run security advisors. Generate reviewed migrations before production. Never enable production against unapplied SQL.
3. Use two synthetic partner accounts and exercise create draft, cross-tenant denial, read-only denial, quota and expired subscription, Magic Link rotation, concurrent edits, and key revocation. Do not use actual client data.
4. Check OAuth metadata, approved redirect allowlist, PKCE S256, client and resource binding, one-time code use, expiration, rejected callbacks, denial and explicit consent. Test actual ChatGPT and Claude connectors, including reconnect after expiry.
5. Verify desktop/mobile consent and partner panel. Deploy disabled first; enable after staging and review. Roll back by disabling both flags.

## Pilot limitations

- OAuth uses dynamic registration for approved ChatGPT/Claude callbacks only. Static signed client registrations are not stored; changing the OAuth secret invalidates them.
- Explicit consent requires a current Studio partner session. Mitra without one must open their existing Magic Link/login and reload the consent page.
- OAuth access tokens are opaque NAMINA-only tokens, not Supabase access tokens. They expire after 30 days and appear in the same revocable key list.
- Refresh token grants, CIMD, scope-upgrade handling, full OAuth client compatibility and administrative MCP tools are not yet implemented. No automatic publication or deletion.
- Existing API-key agents use the /api/mcp endpoint and Authorization: Bearer <NAMINA key>. Do not send credentials in chat or query strings.
- Database SQL is deliberately staged, not applied to production. Local CI is not evidence of live connector compatibility.
