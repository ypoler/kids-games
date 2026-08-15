/**
 * Later phase (not wired in v1): client-only Google Sheets writes.
 *
 * When you are ready:
 * 1. Create a Sheet with tabs `sessions` and `words`.
 * 2. Share: Editors = parent Google accounts; anyone-with-link can view.
 * 3. Enable Sheets API + OAuth Web client ID for this origin.
 * 4. Parent corner signs in with Google Identity Services (spreadsheets scope)
 *    and calls spreadsheets.values.append with the user's access token.
 * 5. Flush `state.outbox` (already session-shaped) and drop published client_ids.
 *
 * No Apps Script / Cloud Functions. Hosting stays static.
 */
export const SHEETS_NOT_CONFIGURED = true
