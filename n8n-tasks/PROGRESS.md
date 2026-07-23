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
Live workflow `K9ktjkAH1IYK5jh4` (AI agent + Gemini). Inactive until WhatsApp/Meta creds attached.
- 🟨 1.1 Welcome & main menu — agent handles 4-option routing; needs WhatsApp creds to go live.
- ✅ 1.2 Menu display — `get_menu` tool over `products`, `available=true` only.
- ✅ 1.3 Product selection — agent captures item + customizations; cart schema in [member1_cart.js](member1_cart.js).
- 🟨 1.4 Fulfillment choice — pickup built; delivery hands `session.cart` to M2 (agent stops).
- 🟨 1.5 Pickup flow — `create_order` → M4 `orders` (status `Awaiting payment`); M3 payment link + ready/"I'm here" push pending.
- ✅ 1.6 Reorder & track — `get_my_orders` tool (sender-scoped).

### Member 2 — Delivery
Live workflow `d4wPbpvRZlCp2k0D` (Code/Switch router, not agent — courier commands are deterministic). Inactive until WhatsApp creds attached. Logic in [member2_delivery.js](member2_delivery.js) (`node`-checked).
- 🟨 2.1 Receive location — distance/estimate built (matches spec 13–18 SAR); neighborhood ranking needs a geocoding API.
- 🟨 2.2 Courier bidding — `selectBidCouriers` + fan-out + `parseBid`; PII-free bid message asserted.
- ✅ 2.3 Courier selection — weighted scoring (cheapest not always chosen).
- 🟨 2.4 Confirmation fan-out — built, but fires on bid-close (v1); should fire on M3 "paid" event at go-live.
- ✅ 2.5 Command-driven delivery flow — `arrived/picked up/near/deliver+code`, status → M4 set, code validated.
- 🟨 2.6 Courier log — storage exists; only `completed_orders` bumps on delivery (avg/rating/cancel in JS, unwired).
- ⬜ 2.7 Problem handling — logic in `member2_delivery.js` (`noBidOptions`, `onCourierCancel`), not wired as nodes yet.

### Member 3 — Pricing & Payment
Two live workflows: `Solschein — Pricing & Payment (M3)` `MFvdPL38Og8eJk1j` (23 nodes) and `Solschein — HungerStation Channel (M3)` `a5p3DJqxI5ycGAae` (11 nodes). Inactive until WhatsApp + payment-gateway + HungerStation creds attached. Money/mapping logic in [member3_pricing.js](member3_pricing.js) (`node`-checked, all 4 spec examples pass).
- ✅ 3.1 Delivery discount tiers — `cafeSupport`/`deliveryPricing`; all 4 spec examples + tier boundaries pass; live in Compute Price node.
- ✅ 3.2 Cart upsell nudge — `upsellNudge`; matches spec wording exactly ("Add just 3 SAR... 4 SAR instead of 2 SAR").
- ✅ 3.3 Final price confirmation — `priceSummary` + approval gate; payment link only after Approve Webhook (customer YES).
- 🟨 3.4 Payment — link (Moyasar-shaped) + callback → Paid + paid event built; needs a real gateway credential + callback host. Payment-failed branch wired.
- 🟨 3.5 HungerStation channel — order webhook maps items → order + received signal + status back; status-push webhook. Needs HS API creds + real MENU_MAP (empty inline placeholder).

### Member 4 — Dashboard
- ✅ 4.1 Data model — 5 n8n Data Tables live (see [MEMBER_4](MEMBER_4_dashboard_inventory_profit.md#built)). Contract unblocked for M1–M3.
- ✅ 4.2 Local web dashboard — **live workflow `gCEvSL04reabbDfq` (ACTIVE)**, GET `http://localhost:5678/webhook/dashboard` server-renders one HTML page (KPIs, period totals, orders both channels, inventory+low-stock, product cost/profit/margin). CRUD-edit still via built-in Data Table UI. Staff login deferred (local network).
- ✅ 4.3 Order statuses — enumerated in schema (`orders.status`), see MEMBER_4.
- ✅ 4.4 Inventory — deduct + low-stock/auto-disable **now live** in Order Events workflow `1jNMPpXDyhlt99B8` (ACTIVE); reference logic [member4_inventory.js](member4_inventory.js).
- ✅ 4.5 Cost & profit — engine in [member4_costprofit.js](member4_costprofit.js); live in dashboard (verified 3.80 / 6.20 / 62%).
- ✅ 4.6 Management screens — dashboard covers view/report (orders, statuses, channel, cost/profit/margin, period totals, low-stock). Edit actions (prep time, disable, prices, recipes, purchases) via built-in Data Table UI.

### System wiring (all members linked)
- ✅ **M3 → M4 event bus (LIVE):** M3 paid → `POST /webhook/internal/order-paid`; M3 HungerStation received → `POST /webhook/internal/order-received` → M4 Events workflow deducts inventory + auto-disables zero-stock products. Endpoint tested live (200) + deduct math verified.
- ✅ **M1 → M3:** M1 agent has a `send_payment_request` HTTP tool → `POST /webhook/m3/checkout` (pickup, courier 0).
- ✅ **M3 payment gateway callback** points at the real `/webhook/m3/payment-callback`.
- 🟨 **M2 → M3:** courier price handoff to `m3/checkout` for delivery — still WhatsApp-gated + needs M2 to carry product_total; documented seam.

## Cross-cutting decisions (agree before coding)
- ✅ **DB schema** (Member 4 owns, blocks 1–3) — done, 5 Data Tables live.
- ✅ Cart object schema (M1 ↔ M2 ↔ M3) — defined by M1, see [MEMBER_1](MEMBER_1_customer_ordering.md#cart-schema-m1m2m3-contract--agreed-here). M2/M3 build against it.
- ✅ Event contract: "paid"/"received" → inventory + courier fan-out. **M4 receiver LIVE** (`internal/order-paid` + `internal/order-received` → deduct + auto-disable). Event = {type,order_no,channel,customer_number,courier_number,delivery_price,items}. M2 courier fan-out on paid still WhatsApp-gated.
- 🟨 Payment gateway choice — Moyasar assumed (Apple Pay/Mada/cards); confirm before go-live.
- 🟨 Session state store (WhatsApp number as key) — M1 keys session on `customer_number`; n8n static data vs `sessions` Data Table TBD.
- ⬜ Maps/geocoding API (distance).
- ✅ Who generates the 4-digit delivery code — M2 (in `Collect & Score Bids`).
- 🟨 HungerStation menu-mapping table (M3 ↔ M4) — M3 reads an inline `MENU_MAP` (empty) in Map HS Order; unmatched items save flagged. Promote to a shared Data Table with M4.

## Milestones
1. ✅ Schema + shared contracts locked.
2. 🟨 WhatsApp pickup happy path (M1 + M3 payment + M4 dashboard) — wired end-to-end; WhatsApp + gateway creds gate go-live.
3. 🟨 Delivery happy path (M2 + M3) — M3 side built; M2→M3 courier-price handoff still to wire.
4. 🟨 HungerStation channel (M3 + M4) — built + wired to inventory; HS API creds + menu map gate go-live.
5. ✅ Inventory + cost/profit live — Order Events workflow deducts on paid/received; dashboard shows cost/profit/margin.
6. ⬜ Problem-handling paths.

## Live workflows (all in project `JET1jtVaCxN3vMTy`)
| Workflow | ID | Active | Entry |
|---|---|---|---|
| M1 WhatsApp Ordering | `K9ktjkAH1IYK5jh4` | gated | WhatsApp trigger |
| M2 Delivery & Couriers | `d4wPbpvRZlCp2k0D` | gated | WhatsApp trigger |
| M3 Pricing & Payment | `MFvdPL38Og8eJk1j` | gated | `webhook/m3/checkout`·`m3/approve`·`m3/payment-callback` |
| M3 HungerStation | `a5p3DJqxI5ycGAae` | gated | `webhook/m3/hungerstation`·`m3/hungerstation-status` |
| M4 Order Events / Inventory | `1jNMPpXDyhlt99B8` | **ACTIVE** | `webhook/internal/order-paid`·`order-received` |
| M4 Café Dashboard | `gCEvSL04reabbDfq` | **ACTIVE** | `webhook/dashboard` (GET) |

"gated" = built + inactive until WhatsApp / payment-gateway / HungerStation creds attached. Registered webhook URLs drop the id prefix: `http://localhost:5678/webhook/<path>`.
