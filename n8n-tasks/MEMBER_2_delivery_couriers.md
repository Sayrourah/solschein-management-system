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

---

## Built

Same pattern as M1/M4: deterministic logic in a `node`-checkable JS file + an n8n
workflow wiring it into Code nodes over the M4 Data Tables. Storage reuses M4
`couriers` (`zdaBo4Uw6U6dSS15`) and `orders` (`hWfPbrXmGYFK3ZNW`) — no new tables.
Courier commands are deterministic (`arrived 154`), so the courier side is a Code/Switch
router, **not** an AI agent (unlike M1's ordering dialog).

### Deterministic logic (the spec + fallback)

[member2_delivery.js](member2_delivery.js) — all of 2.1–2.7's pure logic, `node`-checked:
- **2.1** `haversineKm`, `estimateDelivery` (matches spec "13 to 18 SAR"), `estimateFromLocation`.
- **2.2** `selectBidCouriers` (neighborhood + rating rank), `bidRequestMessage` (asserts **no customer PII**), `parseBid`.
- **2.3** `scoreOffer`/`chooseCourier` — weighted price+eta+rating+cancellations; cheapest not always chosen.
- **2.4** `confirmMessage`/`rejectMessage`.
- **2.5** `parseCommand` (arrived/picked up/near/deliver+code), `commandToStatus` (→ M4's 16-status set), `genCode`/`validateCode`.
- **2.6** `updateCourierStats` — running avg_price/rating means, cancel increment.
- **2.7** `noBidOptions`, `onCourierCancel` (re-approve only if courier price changed).

Run check: `node member2_delivery.js` → OK.

### Live workflow (built in n8n)

**Workflow:** `Solschein — Delivery & Couriers (M2)` — id `d4wPbpvRZlCp2k0D`
(project `JET1jtVaCxN3vMTy`, `http://localhost:5678/workflow/d4wPbpvRZlCp2k0D`). **Inactive**
until a Meta WhatsApp credential is attached (same gate as M1). 19 nodes.

Flow: `WhatsApp Trigger` → `Classify Inbound` (Code: parse from/text/location + `parseCommand`/`parseBid`
→ `route`) → `Route Inbound` (Switch) into three paths:
- **location** → `Read Couriers` → `Estimate & Fan-Out Bids` (Code: distance/estimate, `selectBidCouriers`,
  saves pending bid to workflow static data) → `Send Location Messages` (estimate to customer + bid request per courier).
- **command** → `Read Order` → `Apply Command` (Code: validate code on deliver, map to status, build notifications)
  which fans out to → `Update Order Status`, → `Expand Notifications` → `Send Command Notifications`,
  and → `Delivered OK?` (Filter) → `Read Courier` → `Bump Courier Stats` → `Update Courier` (2.6 log).
- **bid** → `Collect & Score Bids` (Code: accumulate offers in static data, on 2-min window / all-in →
  `chooseCourier`, generate 4-digit code) → `Send Bid Outcome` (confirm winner + reject losers + code to customer).

Pending bids persist in `$getWorkflowStaticData('global')` keyed by customer number — no new table (`ponytail:`).

### Handoffs / open items (documented on-canvas as sticky notes)

- **Delivery code:** M2 generates it (in `Collect & Score Bids`) — resolves the open cross-member question.
- **To M3:** chosen **courier price** is the handoff; M3 owns the customer delivery price (courier price − café support).
- **v1 simplification:** the confirmation fan-out (2.4) fires on **bid-close** for a self-contained demo. At
  go-live it should fire on **M3's "paid" event**, use the real `order_no`, apply M3's customer price, and write
  `courier_number`/`courier_price`/`delivery_code` onto the `orders` row.
- **Single webhook:** couriers + customers hit the same WhatsApp number. Two workflows can't own one Meta webhook —
  at go-live either merge M2's routing into M1's trigger, or give couriers a separate ops number.
- **Geocoding:** neighborhood-aware courier ranking needs a maps API; v1 ranks all couriers by rating.
- **Deferred (`ponytail:`):** 2.7 problem-handling paths (no-bid options, courier-cancel re-approve) exist in
  `member2_delivery.js` but aren't wired as workflow nodes yet; avg_price/rating/cancellation stat updates
  (only `completed_orders` bumps on delivery so far).
