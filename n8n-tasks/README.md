# Solschein — WhatsApp Café Ordering & Delivery (n8n Build)

This folder breaks the [SOLSHEIN_BR.md](../SOLSHEIN_BR.md) requirements into a build plan
for **4 team members** using **n8n** as the orchestration engine.

- Source of truth (requirements): [../SOLSHEIN_BR.md](../SOLSHEIN_BR.md)
- Live status board: [PROGRESS.md](PROGRESS.md)

---

## System at a glance

A customer talks to the café's WhatsApp number. The system lets them browse the menu,
build an order, choose **pickup** or **delivery**, get a delivery quote from a small pool
of couriers (all over WhatsApp — no courier app), pay via an Apple Pay / Mada link, and
track the order to delivery. The café manages everything from a simple dashboard.

## Recommended stack

| Concern | Recommendation | Notes |
| --- | --- | --- |
| Orchestration | **n8n** (self-hosted or cloud) | All flows are n8n workflows triggered by webhooks. |
| WhatsApp | **Meta WhatsApp Cloud API** (or 360dialog) | Needs interactive **list** + **reply button** messages. |
| Database | **Postgres** | Orders, products, couriers, customers, sessions. |
| Payments | **Moyasar / Tap / HyperPay** | Must support Apple Pay + Mada; webhook back to n8n. |
| Dashboard | **NocoDB / Baserow on Postgres** (MVP) | Fast admin UI over the same DB; upgrade later. |
| Maps/Distance | **Google Distance Matrix** (or Mapbox) | Café ↔ customer distance + neighborhood. |

> These are defaults so members can start. Swap freely, but keep the **DB contract**
> (see Member 4) stable so everyone integrates cleanly.

---

## Team division

| Member | Area | File |
| --- | --- | --- |
| **1** | Customer ordering & WhatsApp conversation | [MEMBER_1_customer_ordering.md](MEMBER_1_customer_ordering.md) |
| **2** | Delivery logic & courier coordination | [MEMBER_2_delivery_couriers.md](MEMBER_2_delivery_couriers.md) |
| **3** | Pricing, payment & order state machine | [MEMBER_3_pricing_payment_state.md](MEMBER_3_pricing_payment_state.md) |
| **4** | Dashboard, database & courier registry | [MEMBER_4_dashboard_data.md](MEMBER_4_dashboard_data.md) |

## How the pieces connect

```
WhatsApp ─▶ [M1] Conversation & cart ─▶ pickup? ─▶ [M3] Payment ─▶ [M4] Dashboard
                                       └ delivery? ─▶ [M2] Courier quotes ─▶ [M3] Discount+Price+Pay
                                                                              │
[M2] Courier tracking (وصلت/استلمت/قريب/تسليم) ◀──────────────────────────────┘
All state changes ─▶ [M3] Order State Machine ─▶ [M4] Dashboard + [M4] Courier registry
```

## Shared conventions (all members follow)

- **Order status** is a single enum owned by Member 3 (16 states in the BR). Never write
  a status string ad-hoc — call M3's "set status" sub-workflow.
- **Session state** per customer WhatsApp number lives in a `sessions` table (Member 4).
- **Message templates** in Arabic are stored centrally (Member 1 owns the template list)
  so wording stays consistent.
- **Courier privacy rule**: customer name/number/exact location/order contents are NOT
  sent to couriers during quoting — only after pickup is confirmed (see M2).
- Each n8n workflow is exported to `/workflows/<member>-<name>.json` and committed.

## Definition of done (whole system — Phase 1)

Matches "المرحلة الأولى" in the BR: order via WhatsApp → menu → pickup/delivery → customer
location → rough quote → broadcast to limited couriers → collect prices → pick best →
cart-based delivery discount → customer approval → payment link → order on dashboard →
courier arrival → share customer data after pickup → delivery confirmed by 4-digit code.
