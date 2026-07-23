# Member 3 — Pricing, Payment & HungerStation Channel

**Owner:** _(assign)_
**Spec sections:** Delivery Discount (tiers) · Encouraging Bigger Cart · Confirming Price · Payment · Payment Failed · Ordering via HungerStation

## Scope

All money and the second order channel. Delivery-support math, upsell nudges, final price confirmation, the payment gateway, and the full HungerStation API integration.

## Tasks

### 3.1 Delivery discount (café support) tiers
On product value only, before delivery fee:

| Cart value | Café covers |
|---|---|
| < 30 SAR | 0 |
| 30–44.99 | 2 SAR |
| 45–59.99 | 4 SAR |
| 60–79.99 | 6 SAR |
| ≥ 80 | 8 SAR |

- `customer delivery price = courier price − café support` (floor at 0).
- Courier still receives full price.

### 3.2 Cart upsell nudge
- Before confirm: compute gap to next tier.
- "Add 3 SAR to get 4 SAR discount instead of 2." Suggest high-margin items (cookie, brownie, add-on, extra shot).

### 3.3 Final price confirmation
- Send summary: product value, courier price, café discount, delivery after discount, total, estimated time.
- Ask to confirm. **Payment link only after approval.**

### 3.4 Payment
- Generate payment link supporting Apple Pay, Mada, bank cards.
- Gateway webhook confirms payment (no transfer screenshots).
- On success: order → dashboard, café starts prep, courier confirmed (signal Member 2), deduct inventory (Member 4).
- Payment failed → no prep; send new link or hand to staff.

### 3.5 HungerStation channel
Shorter flow (HungerStation owns customer, payment, delivery):
1. Receive new order via HungerStation API webhook (order no., items, add-ons, qty, notes).
2. Create order in dashboard labeled **HungerStation**; deduct ingredients (Member 4).
3. Café prepares.
4. Café marks ready → HungerStation courier collects.
5. Record sale for profit (Member 4).

- Send status back to HungerStation (accepted, preparing, ready...) as API supports.
- **Menu mapping:** each HungerStation item → café product (for correct inventory + profit). Unmatched → order still shows, flagged for manual mapping.
- Reduced status set: New, Preparing, Ready, Delivered, Cancelled.
- **Assumption to confirm:** HungerStation handles its own payment/delivery.

## Interfaces / handoffs
- **Courier price in** from Member 2 → discount math → **customer price out**.
- **"Paid" event** → Member 2 (courier fan-out) + Member 4 (inventory deduct + sale record).
- **Payment link** → Member 1 (pickup) & Member 2 (delivery).
- **Order record + channel label** → shared DB / Member 4.

## Dependencies
- Payment gateway account (Apple Pay/Mada support — e.g. Moyasar/HyperPay, confirm).
- HungerStation API access + credentials.
- Menu mapping table (with Member 4).

## Done when
- Delivery price correct across all 4 spec examples; payment link → confirmed → order flows; HungerStation order lands in dashboard with inventory deducted.
