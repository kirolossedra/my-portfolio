# Availability Polls

`kirolos.dev` includes a deliberately narrow visual availability-polling feature for small trusted groups such as academic committees.

## Architecture decisions

### Canonical representation

The canonical definition is the validated TypeScript/JSON `PollDefinition` in `shared/poll.ts`:

```json
{
  "schemaVersion": 1,
  "title": "MASc examination",
  "description": "Please indicate every slot that works.",
  "timezone": "America/Toronto",
  "participantNames": ["Professor A", "Professor B"],
  "dates": ["2026-09-22", "2026-09-24"],
  "timeRanges": [{ "startTime": "09:00", "endTime": "17:00" }],
  "slotWidthMinutes": 90
}
```

D1 stores the same model relationally. XML is an import/export serialization only; it maps into this exact definition and is never a second persistence model. V1 intentionally has no external calendar integration, so XML is not converted into a calendar event.

### Public links

Each poll has an internal numeric D1 ID and an independent 128-bit random public token generated from 16 bytes of `crypto.getRandomValues()` and encoded as 32 lowercase hexadecimal characters. Participant URLs use:

```text
/poll/<public-token>
```

The token is a bearer capability. Possession of the link plus participant integrity is the V1 trust model. It is **not participant authentication**. Anyone holding the link can see the expected participant names and can select one of them. Because the dropdown is identification by convention rather than authentication, a link holder could deliberately select another expected participant and view or edit that participant's response. V1 accepts that risk explicitly for a small trusted committee; the interface must not describe the dropdown as identity verification. The implementation deliberately does not collect email, phone, analytics identity, or user accounts merely to create the appearance of stronger assurance.

Admin can explicitly regenerate the bearer link; rotation immediately invalidates the previous token. Admin endpoints remain protected by the existing GitHub OAuth Admin session. Public poll APIs never return Admin tokens, unrelated portfolio data, aggregate Admin response views, or internal configuration.

### Time model

V1 accepts only `America/Toronto`. Poll dates are `YYYY-MM-DD` Toronto calendar dates and slot times are `HH:mm` Toronto wall-clock times. Slot generation uses integer wall-clock minutes rather than browser-local `Date` arithmetic, so a participant in another timezone sees the same Toronto slot labels. Generated slot boundaries are also checked against `Intl` in `America/Toronto`; nonexistent spring-forward times and ambiguous fall-back times are rejected instead of being silently reinterpreted.

For each time range, only complete slots are generated. If the remaining tail is shorter than the global slot width, it is discarded. For example, 09:00–17:00 with a 90-minute width creates five slots ending at 16:30 and discards the final 30 minutes.

### Response identity and overwrite safety

`availability_poll_responses` has a unique `(poll_id, expected_participant_id)` constraint. Returning participants load that single response instead of creating duplicates.

Every response also has an integer `revision`. Updates use optimistic concurrency: the submitted revision must match the current revision. If another browser tab or earlier session changed the response, the API returns a conflict instead of silently overwriting newer availability.

### Editing after responses

Title and description remain editable. Dates, time ranges, slot width, and expected participants are structurally locked once responses exist, because changing them would invalidate saved availability. Structural edits are also locked after finalization. Admin can delete an invalid/test response without deleting the expected participant.

## API boundary

Admin, existing OAuth required:

- `GET /api/admin/polls`
- `POST /api/admin/polls`
- `GET /api/admin/polls/:id`
- `PUT /api/admin/polls/:id`
- `DELETE /api/admin/polls/:id`
- `PUT /api/admin/polls/:id/status`
- `POST /api/admin/polls/:id/rotate-link`
- `DELETE /api/admin/polls/:id/responses/:participantId`
- `PUT /api/admin/polls/:id/finalize`
- `GET /api/admin/polls/:id/export.json`
- `GET /api/admin/polls/:id/export.xml`
- `GET /api/admin/polls/:id/pdf`

Participant, bearer poll token:

- `GET /api/polls/:publicToken`
- `GET /api/polls/:publicToken/responses/:participantId`
- `PUT /api/polls/:publicToken/responses/:participantId`

Poll endpoints are `no-store` and browser-origin restricted to the configured kirolos.dev frontend. Participant writes reuse the existing Cloudflare rate-limit binding with a separate `poll:<client-ip>` key namespace. The public token remains the actual participant capability; origin checking and rate limiting are defense in depth, not identity verification. `/poll/*` pages also send `Referrer-Policy: no-referrer` and `X-Robots-Tag: noindex, nofollow, noarchive` from Netlify.

## Mobile grid interaction

The grid remains a grid on phones. Rather than nesting horizontal scrolling inside the page's vertical scrolling, the mobile layout shows one date column at a time with previous/next date controls while retaining the time column. The page remains the single vertical scroll owner.

Participants select a paint mode (`Unavailable`, `Online`, `In person`, or `Either`) and then tap cells. Desktop mouse drag painting is supported as a convenience, but touch interaction does not depend on drag gestures. Every cell has a spoken date/time/state label, visible focus state, text/symbol state, and color as a secondary cue.

## Intersection semantics

The denominator is the full expected-participant list, not only people who already responded. Each generated slot retains:

- available count / expected count
- percentage
- online count
- in-person count
- either count
- participant names and modes

Filters are deterministic:

- `100%`: available count equals expected count
- threshold: percentage is greater than or equal to the chosen threshold
- highest below 100%: all slots tied for the maximum positive count below full attendance are returned; if nobody is available anywhere yet, the result is empty rather than presenting zero-overlap cells as recommendations

## PDF

PDF output is generated server-side from poll data, not from a screenshot. It includes poll metadata, expected/responded status, finalized meeting details when present, strongest overlaps, and a text representation of the availability matrix. The implementation uses a small standards-compliant PDF writer so the Worker does not gain a large PDF dependency.

## Deliberate V1 limits

- no participant authentication
- no email invitations or reminders
- no Google/Outlook/ICS synchronization
- no organization accounts
- no AI scheduling
- no per-date time-range overrides (V1 ranges apply to all selected dates)
- no attempt to infer or pressure preferred attendance behavior

These limits keep the system focused on making committee participation legible and low-friction rather than turning people into an optimization target or expanding into generic scheduling SaaS.
