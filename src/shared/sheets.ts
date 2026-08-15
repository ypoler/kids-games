/**
 * Parent Google *identity* is in settings (GIS ID token). Sheet *writes* are still later:
 * request spreadsheets scope, values.append, flush `state.outbox`.
 *
 * No Apps Script / Cloud Functions. Hosting stays static.
 */
export const SHEETS_NOT_CONFIGURED = true
