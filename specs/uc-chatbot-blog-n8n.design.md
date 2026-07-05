# Feature: User Chatbot, Blog Content, And CSKH Handoff

## Requirements

- While a guest or signed-in customer chats with Velura, the system shall store chat sessions and messages in Supabase.
- While the assistant recommends products, the API shall return text plus `metadata.product_ids`, and the frontend shall render buyable product preview cards from real catalog data.
- While N8N webhook configuration is present, the API shall call the workflow for the assistant answer; otherwise it shall use a deterministic catalog fallback.
- While a customer asks for a human agent, the assistant shall stop product advice, create a CSKH support ticket, queue an email alert, and show the ticket in the admin CSKH screen.
- While blog, about, and policy pages load, the user web shall be able to fetch static content from the API backed by Supabase content tables.

## Architecture

- Backend: add `apps/api/src/chatbot/*` for chat session/message CRUD, N8N orchestration, catalog lookup, AI logging, and support escalation.
- Backend: add `apps/api/src/content/*` for public blog/about/policy content retrieval.
- Frontend user web: replace the localStorage-only chatbot controller with API-backed sessions, messages, product cards, quick chips, and cart actions.
- Frontend admin web: reuse the existing `support_ticket` CSKH tab and enrich ticket rows/details with chatbot session context.
- Database: extend `chat_session` and `chat_message`, harden direct RLS access, add content tables, and add indexes for admin support review.

## Security

- The frontend never receives Supabase service-role keys, N8N bearer tokens, SMTP app passwords, or workflow secrets.
- Chat APIs validate `guestId`, session ownership, message length, product IDs, and support handoff state server-side.
- User supplied chat text is escaped in frontend rendering and is stored as plain text.
- The API writes chat data with service role but filters every read by authenticated user ID or stable guest ID to prevent cross-session access.
- Email delivery uses `email_outbox`; SMTP credentials are read only from environment variables.

## Verification

- `npm run test:api`
- `npm run check:js`
- `npm run build`
- `npm run verify:chatbot:supabase`
