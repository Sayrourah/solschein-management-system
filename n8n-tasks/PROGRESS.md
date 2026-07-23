# Solschein — Build Progress

Tracker for the 4-member split of [SOLSHEIN_BR_EN.md](../SOLSHEIN_BR_EN.md).

Status: ⬜ not started · 🟨 in progress · ✅ done · ⛔ blocked

## Members

| # | Area | File | Owner |
|---|---|---|---|
| 1 | WhatsApp ordering & pickup | [MEMBER_1](MEMBER_1_customer_ordering.md) | _tbd_ |
| 2 | Delivery & couriers | [MEMBER_2](MEMBER_2_delivery_couriers.md) | _tbd_ |
| 3 | Pricing, payment, HungerStation | [MEMBER_3](MEMBER_3_pricing_payment_hungerstation.md) | _tbd_ |
| 4 | Dashboard, inventory, profit | [MEMBER_4](MEMBER_4_dashboard_inventory_profit.md) | _tbd_ |

## Task status

### Member 1 — Ordering
- ⬜ 1.1 Welcome & main menu
- ⬜ 1.2 Menu display
- ⬜ 1.3 Product selection
- ⬜ 1.4 Fulfillment choice
- ⬜ 1.5 Pickup flow
- ⬜ 1.6 Reorder & track

### Member 2 — Delivery
- ⬜ 2.1 Receive location
- ⬜ 2.2 Courier bidding
- ⬜ 2.3 Courier selection
- ⬜ 2.4 Confirmation fan-out
- ⬜ 2.5 Command-driven delivery flow
- ⬜ 2.6 Courier log
- ⬜ 2.7 Problem handling

### Member 3 — Pricing & Payment
- ⬜ 3.1 Delivery discount tiers
- ⬜ 3.2 Cart upsell nudge
- ⬜ 3.3 Final price confirmation
- ⬜ 3.4 Payment
- ⬜ 3.5 HungerStation channel

### Member 4 — Dashboard
- ⬜ 4.1 Data model (**blocker — do first**)
- ⬜ 4.2 Local web dashboard
- ⬜ 4.3 Order statuses
- ⬜ 4.4 Inventory
- ⬜ 4.5 Cost & profit
- ⬜ 4.6 Management screens

## Cross-cutting decisions (agree before coding)
- ⛔ **DB schema** (Member 4 owns, blocks 1–3) — deliver first.
- ⬜ Cart object schema (M1 ↔ M2 ↔ M3).
- ⬜ Event contract: "paid"/"received" → inventory + courier fan-out.
- ⬜ Session state store (WhatsApp number as key).
- ⬜ Payment gateway choice (Apple Pay/Mada).
- ⬜ Maps/geocoding API (distance).
- ⬜ Who generates the 4-digit delivery code (recommend M2).
- ⬜ HungerStation menu-mapping table (M3 ↔ M4).

## Milestones
1. ⬜ Schema + shared contracts locked.
2. ⬜ WhatsApp pickup happy path (M1 + M3 payment + M4 dashboard).
3. ⬜ Delivery happy path (M2 + M3).
4. ⬜ HungerStation channel (M3 + M4).
5. ⬜ Inventory + cost/profit live.
6. ⬜ Problem-handling paths.
