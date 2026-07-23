# Member 2 — Delivery & Courier Coordination

**Owner:** _(assign)_
**Spec sections:** Delivery to the Customer · Communicating with Couriers · Choosing the Courier · Courier Confirmation/Arrival/Pickup · Sharing Customer Data · Confirming Delivery · Courier Log · Handling Problems (courier/location)

## Scope

Everything delivery-side that isn't money. Location, courier bidding over WhatsApp, courier selection, the arrival→pickup→delivery command flow, and the courier log. Money/discount belongs to Member 3.

## Tasks

### 2.1 Receive location
- Prompt customer to send WhatsApp geo-location.
- Compute: distance café↔customer, neighborhood/area, approx delivery price, estimated time.
- Send preliminary estimate ("13 to 18 SAR ... finding best courier").

### 2.2 Courier bidding
- Send request to limited set (3–5) of couriers from courier log.
- Message: request no., pickup=café, delivery=neighborhood, approx distance, ready-in time. Ask for price + arrival time.
- **NOT sent** at this stage: customer name, number, exact location, order contents, product total.
- Parse courier replies ("15 SAR, arrive in 10 min").

### 2.3 Courier selection
- Wait window (~2 min).
- Score offers: price, arrival speed, reliability, cancellations, complaints. Cheapest not always chosen.
- Pass chosen courier price to Member 3 for final customer price.

### 2.4 Confirmation fan-out (after customer pays — signal from Member 3)
- Chosen courier: "request confirmed", pickup link, ready-in time, send `arrived 154` on arrival.
- Other couriers: "assigned to another courier, thank you."

### 2.5 Command-driven delivery flow
Parse courier WhatsApp commands, update order status, notify dashboard/customer:
- `arrived 154` → dashboard "courier arrived".
- `picked up 154` → status "picked up, on the way".
- After pickup: send courier exact location, arrival instructions, building/apt, delivery notes.
- `near 154` → send courier customer number + final instructions; notify customer "courier near".
- `deliver 154 4832` → validate 4-digit code (code generated + sent to customer); if match → status **Delivered**, thank-you + rating request to customer.

### 2.6 Courier log
Per courier (keyed by WhatsApp number): name, mobile, neighborhoods, response speed, avg price, completed orders, cancellations, punctuality, ratings, notes/complaints. No app/account for couriers.

### 2.7 Problem handling
- No courier responded → offer customer: wait, higher price, switch to pickup, cancel.
- Courier cancelled → resend to others; if price changes, re-approve with customer (via Member 3).
- Incorrect location → ask resend before payment.

## Interfaces / handoffs
- **Chosen courier price** → Member 3 (computes customer delivery price + discount).
- **"Customer paid" signal** → triggers 2.4 fan-out. Agree event with Member 3.
- **Order status updates** → shared DB / Member 4 dashboard.
- **Delivery code** — decide who generates (recommend Member 2 at 2.5).

## Dependencies
- Courier log storage (shared DB, coordinate with Member 4 dashboard "manage couriers").
- Distance/geocoding: pick a maps API early.

## Done when
- Delivery order: location→bid→select→pay→arrived→picked up→near→delivered-with-code works end to end over WhatsApp.
