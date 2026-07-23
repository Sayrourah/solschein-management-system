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
