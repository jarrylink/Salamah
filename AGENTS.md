<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Salamah development guardrails

- Develop Salamah incrementally. Preserve existing Git checkpoints and avoid unrelated changes.
- The existing signed, HTTP-only session authentication is working; do not replace it casually. Dashboard rendering is role-aware: the layout protects dashboard routes and manages global shell concerns, while route pages select the appropriate role workspace.
- Authentication answers who the user is. Authorization answers what the user may access. UI visibility and sidebar links are never a security boundary; future privileged modules must enforce server-side authorization before exposing sensitive data or operations.
- The current role enum is a foundation only. RBAC will later evolve to roles, permissions, user-role assignments, and audit logs; do not prematurely implement that system.
- Do not create the future school-management schema merely to populate navigation or placeholders. Model student academic placement with enrollment/history records rather than overwriting a student's historical class.
- The Super Admin sidebar is future information architecture, not a request to implement every module now. Keep dashboard demo content clearly distinct from database-backed school data.
- Preserve the Salamah design system and existing Neon configuration. Do not change database configuration blindly or run destructive database operations.
