# Statistics: audience summaries and author browser exclusion

Approved scope: option A, aggregate audience information and exclusion of the
author's own browser. Retain GA4 and the existing read-only Google authorization.

## Behavior and boundaries

- Add a browser-local persistent exclusion control to `/stats/` and both locales,
  available without Google authorization. Display included/excluded/checking/error
  states. Saving a change reloads the page (and therefore clears the in-memory
  Google connection); explain this beside the control before activation.
- Before loading the Google tag, read the preference and set GA4's official
  `ga-disable-G-6S2MZXN5QQ` flag for excluded browsers. Do not load the tag in that
  case. On toggle, disable immediately and reload; synchronize other open tabs
  through storage events. Storage failures show an actionable error and do not
  claim persistence. Local development and previews remain excluded by hostname.
- This applies only to future visits from the same browser profile and origin;
  other devices and incognito profiles require separate setup. Clearing site
  data resets the preference. Already sent events cannot be recalled or reliably
  removed from historical reports. Do not automatically exclude every visitor
  opening the public statistics page.
- Add top-ten country summaries, country/region/city summaries, device categories,
  browsers, and session source/medium rankings for the existing 7/30-day ranges.
  Use active users for geographic/device/browser summaries and sessions for
  source/medium. Do not sum dimension-level users into a sitewide unique count.
  Use full geographic hierarchy so identical city names remain distinguishable.
- Locations are approximate network-derived aggregates, not individual visitor
  records or street addresses. Unavailable values display as unknown; privacy
  limitations and top-ten truncation remain visible. Location/device data do not
  establish that a visit belongs to the author or to a distinct human.

## Data flow and failures

- Reuse the existing validated report parsing and request transport. Fetch the
  five new reports in a separate GA4 batch (maximum five reports per batch),
  independent of the four existing historical reports and realtime request.
- A separate audience remote state owns loading, data, errors, fetch time and
  limitation metadata. Audience failure leaves successful overview and realtime
  reports visible. Disconnect, range changes, expiration and disposal cancel or
  invalidate all three request groups; a 401 expires the complete session.
- Tokens and reports remain in memory. Only the boolean exclusion preference is
  persisted. No new backend, IP service, geolocation permission or tracking ID.
- Unknown/empty data are distinct from request failures; malformed headers,
  values and report counts fail validation. Preserve API labels and counts;
  localized presentation may translate known device and unavailable labels.

## Implementation and validation

1. Implement exclusion storage helpers, pre-tag check and standalone bilingual
   control; verify flag timing, storage failures, reload and cross-tab behavior.
2. Add audience request/response types and an independent session request group;
   verify dimensions/metrics, five-report limit, count validation, partial failure
   and stale-response/authorization isolation.
3. Render audience summaries using existing ranking styles, clear units and
   explanations. Check English/Chinese layouts at desktop and 320px.
4. Update README, analytics documentation, privacy notice and changelog. Run the
   full Vitest suite and static production build. Live GA4 acceptance requires
   the user's existing authorization; fixture checks are not proof of real
   audience records or deployed tracking behavior.
