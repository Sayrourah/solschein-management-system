# Member 1 — WhatsApp Customer Ordering & Pickup

**Owner:** _(assign)_
**Spec sections:** Customer Journey · Choosing Products · Fulfillment Method · Pickup from the Café

## Scope

The WhatsApp front door. Everything from first customer contact through product selection and the full pickup flow. Hand off to Member 2 when delivery is chosen; hand off to Member 3 for payment.

## Tasks

### 1.1 Welcome & main menu
- WhatsApp webhook receives inbound message.
- Send welcome with 4 options: New order · Track current order · Reorder last · Talk to staff.
- Route each option to its flow.

### 1.2 Menu display
- Show menu sections: Matcha, Coffee, Desserts, Add-ons, Offers.
- Pull products from shared DB (menu owned by Member 4 dashboard).
- Respect "Product Unavailable" flag (disabled products hidden/blocked).

### 1.3 Product selection
Capture per item:
- Product, quantity, milk type, sugar level, ice amount, add-ons, special notes.
- Build cart in session state.

### 1.4 Fulfillment choice
- Offer: Pickup from café OR Delivery.
- Delivery route: pass cart to Member 2 flow.
- Pickup route: continue below.

### 1.5 Pickup flow
- Show: order summary, product total, estimated prep time, café location, payment link (link from Member 3).
- After paid: create order in dashboard (status Paid, channel WhatsApp).
- When order ready: send "ready for pickup" message.
- Customer replies "I'm here" → notify café owners in dashboard.

### 1.6 Reorder & track
- Reorder last: fetch customer's last order, re-add to cart.
- Track: read order status from DB, reply with current status.

## Interfaces / handoffs
- **Cart object** → shared with Member 2 (delivery) and Member 3 (pricing/payment). Agree schema early.
- **Order record** → written to shared DB read by Member 4 dashboard.
- **Session state** — how you persist mid-order (customer WhatsApp number as key).

## Dependencies
- Menu + product availability from Member 4.
- Payment link from Member 3.

## Done when
- Customer can order start→pickup→paid→ready→"I'm here" fully over WhatsApp.

---

## Built

Same pattern as Member 4: conversation flow + n8n node structure documented here;
Code-node logic in `node`-checkable JS files. Storage = M4 Data Tables (no new DB).
Session persists keyed by WhatsApp number.

### Cart schema (M1↔M2↔M3 contract — agreed here)

```
session  = { number, state, fulfillment, cart:[ cartItem ] }
cartItem = { sku, qty, options:{ milk, sugar, ice }, addons:[sku], notes }
```

- `options` (milk/sugar/ice) are WhatsApp customizations. On order-write they fold
  into the item `notes` string, so **M4 `orders.items` `[{sku,qty,addons,notes}]`
  stays unchanged** — no schema change asked of M4.
- `addons` are `products` rows with `is_addon=true` (own price, own recipe).
- **M1 computes `product_total`** (sum of menu prices only). Member 3 owns discounts,
  delivery price, and final `total` — M1 leaves `total=null` on delivery orders.

### Session state machine

`menu → selecting → fulfillment → (pickup | →M2 delivery) → awaiting_payment(M3) → paid → ready → here`

Distinct from M4 order `status` (that's the café-side lifecycle). Session state = where
the customer is in the chat. Store on n8n workflow static data or a `sessions` Data Table,
key = `customer_number`.

### n8n node structure (wire in the instance)

1. **Webhook** (WhatsApp inbound) → **Code: load session** (by number) → **Switch on state**.
2. **Main menu** (1.1): send 4 options; `routeMainMenu()` maps reply → New order / Track /
   Reorder / Staff.
3. **Menu display** (1.2): read `products` Data Table → `menuBySection()` (drops
   `available=false`, so M4 auto-disable + manual "Product Unavailable" both honored) →
   `renderMenu()` → WhatsApp send.
4. **Product selection** (1.3): capture product/qty/milk/sugar/ice/addons/notes →
   `buildCartItem()` → `addToCart()` → save session.
5. **Fulfillment** (1.4): pickup → step 6; delivery → hand `session.cart` to Member 2 flow.
6. **Pickup** (1.5): `cartTotals()` for summary + `product_total`; show café location + prep
   time (M4 sets prep) + **payment link from Member 3**. After paid → `cartToOrder()` →
   insert into `orders` (status `Paid`, channel `whatsapp`). On status `Ready` → send
   "ready for pickup". Customer replies "I'm here" → set flag / notify owners in dashboard.
7. **Reorder & track** (1.6): Reorder → fetch customer's last `orders` row →
   `rebuildCartFromOrder()` → back to cart. Track → read `status` for their open order → reply.

### Live workflow (built in n8n)

**Workflow:** `Solschein — WhatsApp Ordering (M1)` — id `K9ktjkAH1IYK5jh4`
(project `JET1jtVaCxN3vMTy`, `http://localhost:5678/workflow/K9ktjkAH1IYK5jh4`). **Inactive**
until WhatsApp creds attached (below). Implementation chose an **AI agent (Gemini)** over a
hand-built Switch state machine — the sub-dialog (product → qty → milk/sugar/ice → add-ons)
is far less brittle as an agent, and the Gemini credential already exists on the instance.

Nodes: `WhatsApp Trigger` → `Only Inbound Text` (filter: drops status updates / non-text) →
`Order Assistant` (agent) → `Reply To Customer` (WhatsApp send). Agent sub-nodes: `Gemini Model`
(gemini-2.5-flash), `Customer Memory` (buffer window, session key = sender number = the M1
session-state store), and three Data Table tools:
- **get_menu** → `products` table, `available=true` only (honors M4 auto-disable + manual flag).
- **get_my_orders** → `orders` filtered to the sender (plumbed, not agent-controlled), newest 5 → Track + Reorder.
- **create_order** → inserts an `orders` row. `customer_number`/`order_no`/`created_at` plumbed;
  `items`/`product_total`/`total`/`fulfillment` filled by the agent via `$fromAI`. Writes status
  **`Awaiting payment`** — M3's payment flow flips it to `Paid` and triggers M4 inventory deduct.

The JS reference files remain the deterministic spec for the cart contract + a fallback if the
agent path is ever replaced:
- [member1_cart.js](member1_cart.js) — cart/session, totals, order-row build, reorder. Check passes.
- [member1_menu.js](member1_menu.js) — menu grouping, availability, main-menu router. Check passes.

### Handoffs / open items

- **To M2 (delivery):** agent stops on delivery choice; `session.cart` (schema above) is the handoff.
- **To/from M3:** M3 supplies the payment link + flips `Awaiting payment` → `Paid`; owns delivery/final `total`.
- **Manual steps to go live (user):** create a **Meta WhatsApp Business** credential, attach it to
  `WhatsApp Trigger` + `Reply To Customer`, set the send node's **phone number ID** (placeholder),
  then activate so n8n registers + verifies the Meta webhook. Then "ready for pickup" push and the
  "I'm here" notify (status-change triggered) are a small follow-up flow.
- **Deferred (`ponytail:`):** "Offers" menu section until M3 seeds discount products; the ready/here
  outbound-notify flow.
