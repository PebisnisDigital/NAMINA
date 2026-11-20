# NAMINA Template Factory v1

Separate endpoint: https://namina.biz.id/api/mcp-templates. A template-only key starts with nmt_. It cannot access website or partner tools. Store the key in the R&D Hermes profile's secret environment. Never paste it in chat.

Admin review: /studio/templates. A real active superadmin session is required. Draft demos use this private page; released versions have /template-demo/<slug>/<version>. Published catalog entries are available in both existing Studio pickers. Website instances copy the document and persist the version key; future revisions do not modify existing websites.

## Daily agent workflow
1. Propose one original design concept for a target audience.
2. Call get_seed, then create a complete spec using the returned editable document. Use fictional sample identities and licensed public media only. No actual client records, secrets, copied proprietary assets or real contact links.
3. Set supported style tokens (layoutPreset, fonts, color, typography, spacing, columns, borders, menu labels), demo copy and media. Use create_template, validate_template and create_demo.
4. Check schema. Do not claim screenshots or browser QA were run when they were not. Ask the human to test demo desktop/mobile and Studio editability.
5. Call request_publish with current updated_at. Send the private review URL and concise report. Never claim the template was released before approval.
6. Human reviews and approves in Studio; archived releases are not offered in the current catalog. Existing website copies are unchanged.

## Scope
V1 is a declarative Original-layout template factory, not arbitrary code generation. It supports existing render/editor components and their style controls, not unrestricted blocks, new interactions, custom scripts, or automatic media generation. New component families require reviewed GitHub changes. No production migration/activation before CI, role isolation tests, authenticated review and visual QA; use the staged SQL then record the migration. Enable NAMINA_TEMPLATE_MCP_ENABLED=true only after release checks. The actual Hermes device and schedule must be configured separately.
