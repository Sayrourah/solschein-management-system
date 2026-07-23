# Progress Board — Solschein n8n Build

Update this file as tasks move. Status legend: ⬜ Not started · 🟡 In progress · ✅ Done · ⛔ Blocked

Last updated: 2026-07-23

---

## Build order (dependencies)

1. **Member 4** ships DB schema + seed data → unblocks everyone.
2. **Member 3** ships `set-status` + pricing → unblocks M1/M2 integration.
3. **Member 1** & **Member 2** build in parallel on top.

---

## Milestones

| # | Milestone | Owner | Status |
| --- | --- | --- | --- |
| M0 | DB schema + seed data published | M4 | ⬜ |
| M1 | Order status machine + `set-status` live | M3 | ⬜ |
| M2 | WhatsApp inbound + welcome menu working | M1 | ⬜ |
| M3 | Menu → cart → pickup flow (end to end) | M1 | ⬜ |
| M4 | Payment link + webhook (paid orders on dashboard) | M3 | ⬜ |
| M5 | Delivery: location → quote → broadcast → select | M2 | ⬜ |
| M6 | Courier tracking (وصلت/استلمت/قريب/تسليم) + code | M2+M3 | ⬜ |
| M7 | Dashboard live (orders, statuses, notifications) | M4 | ⬜ |
| M8 | Full Phase-1 happy path (pickup + delivery) demo | All | ⬜ |

---

## Per-member status

### Member 1 — Customer Ordering & WhatsApp  → [details](MEMBER_1_customer_ordering.md)
| Task | Status |
| --- | --- |
| WhatsApp Cloud API + webhook verified | ⬜ |
| Inbound router + session load | ⬜ |
| Welcome message (4 buttons) | ⬜ |
| Menu categories + product lists (DB-driven) | ⬜ |
| Product configuration (qty/milk/sugar/ice/extras/notes) | ⬜ |
| Cart + subtotal | ⬜ |
| Reorder ("إعادة آخر طلب") | ⬜ |
| Fulfillment choice branching | ⬜ |
| Pickup flow end-to-end | ⬜ |
| Central Arabic template file | ⬜ |

### Member 2 — Delivery & Couriers  → [details](MEMBER_2_delivery_couriers.md)
| Task | Status |
| --- | --- |
| Receive + validate location | ⬜ |
| Distance/neighborhood/rough quote | ⬜ |
| Eligible-courier selection (3–5) | ⬜ |
| Anonymized broadcast (privacy rule) | ⬜ |
| Quote parsing + wait window | ⬜ |
| Selection logic | ⬜ |
| Winner confirm + loser release | ⬜ |
| `وصلت` / `استلمت` / `قريب` / `تسليم` handling | ⬜ |
| No-courier flow | ⬜ |
| Courier-canceled flow | ⬜ |

### Member 3 — Pricing, Payment & State  → [details](MEMBER_3_pricing_payment_state.md)
| Task | Status |
| --- | --- |
| `set-status` + transition validation | ⬜ |
| Delivery support calculation | ⬜ |
| BR pricing examples verified | ⬜ |
| Upsell nudge | ⬜ |
| Final price summary + approval | ⬜ |
| Payment gateway integration | ⬜ |
| Payment webhook (success/failure) | ⬜ |
| 4-digit code gen + validation | ⬜ |
| Product-unavailable flow | ⬜ |
| 16-status machine wired | ⬜ |

### Member 4 — Dashboard, DB & Registry  → [details](MEMBER_4_dashboard_data.md)
| Task | Status |
| --- | --- |
| Schema published (contract) | ⬜ |
| Migrations + seed data | ⬜ |
| Dashboard: orders + status board | ⬜ |
| Dashboard: order details + prep time | ⬜ |
| Dashboard: price/support visibility | ⬜ |
| Dashboard: status/stock/price controls | ⬜ |
| Café push notifications | ⬜ |
| Courier registry + metrics | ⬜ |
| Reports (sales + history) | ⬜ |

---

## Blockers / notes

- _(none yet — log here: `YYYY-MM-DD — <who> blocked on <what>`)_

## Decisions log

- 2026-07-23 — Stack defaults chosen (see [README](README.md)): n8n + WhatsApp Cloud API +
  Postgres + Moyasar/Tap/HyperPay + NocoDB/Baserow. Revisit before Phase 2.
