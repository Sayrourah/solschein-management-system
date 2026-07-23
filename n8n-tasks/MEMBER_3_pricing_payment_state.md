# Member 3 — Pricing, Payment & Order State Machine

**Owns:** the money and the truth of an order — delivery discount rules, upsell logic, final
price summary, payment links + webhooks, the 4-digit delivery code, and the **single source
of order status** for the whole system.

BR sections covered: خصم التوصيل حسب قيمة السلة, تشجيع العميل على زيادة السلة (calculation),
تأكيد السعر مع العميل, الدفع, تأكيد التسليم (code), حالات الطلب, معالجة (فشل الدفع / المنتج غير متوفر).

---

## Responsibilities

- Compute **café delivery support** from cart value and the customer's final delivery price.
- Provide the **upsell nudge** calculation ("أضف بـ 3 ريال لتحصل على خصم 4").
- Send the **final price summary** and capture explicit customer approval.
- Generate **payment links** (Apple Pay / Mada / cards) and handle the **payment webhook**.
- Generate + validate the **4-digit delivery code**.
- Own the **Order State Machine** (16 statuses) — the only component allowed to change status.

## Delivery support table (BR)

| Cart product value | Café support |
| --- | --- |
| < 30 | 0 |
| 30 – 44.99 | 2 |
| 45 – 59.99 | 4 |
| 60 – 79.99 | 6 |
| ≥ 80 | 8 |

`customer_delivery_price = courier_price − café_support` (floor at 0). Courier still receives
the full courier price. **Discount is on product value only, before delivery fees.**

## Order statuses (the enum — do not deviate)

1. طلب جديد · 2. بانتظار موقع العميل · 3. جاري البحث عن مندوب · 4. بانتظار موافقة العميل على السعر ·
5. بانتظار الدفع · 6. تم الدفع · 7. جاري تجهيز الطلب · 8. الطلب جاهز · 9. المندوب في الطريق إلى المقهى ·
10. المندوب وصل إلى المقهى · 11. المندوب استلم الطلب · 12. الطلب في الطريق إلى العميل ·
13. المندوب قريب · 14. تم التسليم · 15. طلب ملغي · 16. توجد مشكلة.

## n8n workflows to build

1. **`m3-set-status`** — the shared sub-workflow every member calls to change an order's
   status. Validates allowed transitions, writes to `orders`, emits an event for M4 dashboard.
2. **`m3-delivery-discount`** — input cart value + courier price → support + final delivery
   price + totals.
3. **`m3-upsell-nudge`** — given cart value, compute amount needed to reach the next support
   tier; return suggestion text (high-margin items: cookie, brownie, extras, extra shot).
4. **`m3-final-summary`** — send the "ملخص طلبك" (products, courier price, café discount,
   delivery after discount, total, ETA) + confirm buttons. On approval → payment link.
5. **`m3-payment-link`** — create gateway payment (Moyasar/Tap/HyperPay), send link,
   set status "بانتظار الدفع".
6. **`m3-payment-webhook`** — gateway webhook → verify → on success set "تم الدفع", trigger
   café prep + M2 courier confirmation; on failure run failure flow (new link / staff handoff).
7. **`m3-delivery-code`** — generate 4-digit code at the right stage, send to customer with
   the "لا ترسل الرمز إلا بعد الاستلام" warning; expose a validation call for M2's `تسليم`.
8. **`m3-order-problems`** — product unavailable (replace / remove / refund difference /
   cancel); payment failure handling.

## Rules

- Payment relies on the **gateway webhook**, never on a transfer screenshot from the customer.
- Payment link is sent **only after** the customer approves the final price.
- Support never makes customer delivery price negative (floor 0).

## Dependencies

- **Member 4**: `orders` table (status, amounts, code), payments log, products (for unavailable flow).
- **Member 2**: courier price in; payment-confirmed + code-validation events out.
- **Member 1**: cart subtotal in; payment link for pickup; upsell text out.

## Deliverables

- [ ] Exported workflows in `/workflows/m3-*.json`
- [ ] Status transition map (allowed transitions) documented
- [ ] Pricing worked examples reproduced from BR (the 4 examples) as tests

## Task checklist

- [ ] `m3-set-status` shared sub-workflow + transition validation + dashboard event
- [ ] Delivery support calculation (table + floor-at-0)
- [ ] Verify BR examples: 27→42, 38→51, 52→65, 83→91
- [ ] Upsell nudge calculation + suggestion text
- [ ] Final price summary message + approval capture
- [ ] Payment gateway integration (Apple Pay / Mada / cards)
- [ ] Payment webhook: success → paid + triggers; failure → recovery flow
- [ ] 4-digit code generation + validation endpoint
- [ ] Product-unavailable flow (replace/remove/refund/cancel)
- [ ] Full 16-status machine wired to all callers
