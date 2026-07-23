# Member 2 — Delivery Logic & Courier Coordination

**Owns:** everything about getting the order from the café to the customer — location
handling, delivery quoting, courier broadcast/selection, and the WhatsApp-only courier
tracking commands.

BR sections covered: التوصيل إلى العميل, التواصل مع المندوبين, اختيار المندوب, رسالة تأكيد
المندوب, وصول المندوب, مشاركة بيانات العميل مع المندوب, تأكيد التسليم, معالجة (المندوب/لا يرد).

---

## Responsibilities

- Receive and validate the customer's **WhatsApp location**.
- Compute distance, neighborhood, rough delivery price and ETA.
- **Broadcast** the delivery request to a limited set of couriers (3–5) — **never** to all.
- Collect courier quotes over WhatsApp, run **selection logic**, confirm the winner,
  and politely release the others.
- Drive courier tracking commands: `وصلت`, `استلمت`, `قريب`, `تسليم`.
- Enforce the **privacy rule** on what couriers can see, and when.

## n8n workflows to build

1. **`m2-receive-location`** — accept WhatsApp location; if invalid, ask again (BR: الموقع غير
   صحيح). Compute distance + neighborhood + rough price range + ETA via Distance Matrix.
   Send the customer the preliminary "تكلفة التوصيل المتوقعة من X إلى Y" message.
2. **`m2-broadcast-couriers`** — select 3–5 eligible couriers from Member 4's registry
   (by area, rating, cancel rate) and message them the **anonymized** request
   (pickup=café, area, ~distance, ready-in). No customer name/number/exact location/contents/prices.
3. **`m2-collect-quotes`** — parse courier replies ("15 ريال، أصل خلال 10 دقائق") into
   price + ETA; wait a short window (~2 min).
4. **`m2-select-courier`** — rank by price, speed to café, past commitment, cancellations,
   complaints (not always cheapest). Output chosen courier → hand price to M3 for discount + customer approval.
5. **`m2-confirm-courier`** — after customer pays (event from M3): send winner the
   confirmation (order #, café location link, ready-in, "أرسل عند وصولك: وصلت 154") and send
   losers "تم إسناد الطلب لمندوب آخر".
6. **`m2-courier-tracking`** — parse and act on:
   - `وصلت 154` → status "المندوب وصل"; dashboard notification.
   - `استلمت 154` → status "المندوب استلم/في الطريق"; **release exact customer location + access notes + building/apartment + delivery notes**.
   - `قريب 154` → send courier customer number + final instructions + delivery code method; notify customer "المندوب قريب".
   - `تسليم 154 4832` → validate 4-digit code (from M3); if valid → status "تم التسليم" → thank-you + rating request.
7. **`m2-delivery-problems`** — no courier replied (offer: wait / higher price / switch to
   pickup / cancel); courier canceled (rebroadcast; if price changes, re-approve with customer via M3).

## Privacy rule (critical)

| Stage | Courier may see |
| --- | --- |
| Broadcast / quoting | Pickup=café, area, ~distance, ready-in only |
| After pickup (`استلمت`) | Exact location, access notes, building/apartment, delivery notes |
| Just before arrival (`قريب`) | Customer phone number + delivery code method |

## Dependencies

- **Member 4**: `couriers` registry (area, rating, cancel rate, history) + read/update.
- **Member 3**: delivery price → discount + approval; payment-confirmed event; 4-digit code
  generation/validation; status setter.
- **Member 1**: delivery entry event (cart + session) from fulfillment choice.

## Deliverables

- [ ] Exported workflows in `/workflows/m2-*.json`
- [ ] Courier eligibility + ranking rules documented
- [ ] Courier command parser spec (وصلت / استلمت / قريب / تسليم NNNN CCCC)

## Task checklist

- [ ] Receive + validate WhatsApp location; re-ask on invalid
- [ ] Distance + neighborhood + rough price/ETA; preliminary message to customer
- [ ] Eligible-courier selection (3–5) from registry
- [ ] Anonymized broadcast message (privacy rule enforced)
- [ ] Quote parsing (price + ETA) with ~2 min window
- [ ] Selection logic (price/speed/history, not always cheapest)
- [ ] Winner confirmation + loser release (after payment)
- [ ] `وصلت` handling → dashboard
- [ ] `استلمت` handling → release location/access data
- [ ] `قريب` handling → release phone + final instructions
- [ ] `تسليم NNN CCCC` → code validation → delivered → rating request
- [ ] No-courier problem flow
- [ ] Courier-canceled flow (rebroadcast + re-approval on price change)
