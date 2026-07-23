# Member 1 — Customer Ordering & WhatsApp Conversation

**Owns:** everything the customer sees before a payment link is generated — the WhatsApp
entry point, the menu, product configuration, the cart, and the pickup flow.

BR sections covered: بدء الطلب, اختيار المنتجات, اختيار طريقة الاستلام, الاستلام من المقهى,
تشجيع العميل على زيادة السلة (message side).

---

## Responsibilities

- Own the **WhatsApp inbound webhook** and message router (buttons, list replies, text,
  location messages).
- Own the **central Arabic message template list** (welcome, menu, summaries, prompts).
- Build the guided ordering conversation and the shopping cart.
- Build the **pickup** flow end-to-end (summary → time → café location → hand off to M3 for payment).

## n8n workflows to build

1. **`m1-whatsapp-inbound`** — single webhook that receives all WhatsApp events, verifies
   the signature, loads/creates the customer `session` (Member 4 table), and routes to the
   right sub-workflow based on session state + message type.
2. **`m1-welcome-menu`** — sends welcome message with 4 reply buttons:
   `طلب جديد` / `متابعة طلب حالي` / `إعادة آخر طلب` / `التواصل مع موظف`.
3. **`m1-menu-browse`** — sends menu categories as an interactive **list** (ماتشا، قهوة،
   حلويات، إضافات، عروض), then products within a category. Reads products from Member 4's DB
   (only `is_available = true`).
4. **`m1-product-configure`** — per selected product, collect: quantity, milk type, sugar
   level, ice amount, extras, notes. Store the configured line item in the cart.
5. **`m1-cart`** — show cart, allow add-more / remove / continue; compute product subtotal;
   hand the cart to M3 for upsell nudge, then to the fulfillment choice.
6. **`m1-fulfillment-choice`** — ask pickup vs delivery; branch to pickup flow (here) or
   emit event to Member 2 (delivery).
7. **`m1-pickup-flow`** — show order summary + product total + prep time + café location +
   trigger M3 payment link. After paid: send "طلبك جاهز للاستلام" when café marks ready,
   accept customer `وصلت`, notify dashboard.

## Key details from the BR

- Welcome options: طلب جديد / متابعة طلب حالي / إعادة آخر طلب / التواصل مع موظف.
- Product options: الكمية، نوع الحليب، مستوى السكر، كمية الثلج، الإضافات، الملاحظات.
- "إعادة آخر طلب" reloads the customer's last order into the cart (needs M4 order history).
- Pickup: on ready → notify customer; customer sends `وصلت` → dashboard notification.

## Dependencies

- **Member 4**: `sessions`, `products`, `customers`, `orders` tables + read APIs/queries.
- **Member 3**: "create payment link" sub-workflow, upsell nudge, order-status setter.
- **Member 2**: delivery entry event (pass the cart + customer session).

## Deliverables

- [ ] Exported workflows in `/workflows/m1-*.json`
- [ ] Central template file `/content/messages.ar.md` (all Arabic copy)
- [ ] Session state diagram for the conversation router

## Task checklist

- [ ] WhatsApp Cloud API app + number connected; webhook verified in n8n
- [ ] `m1-whatsapp-inbound` router with signature verification + session load
- [ ] Welcome message with 4 buttons
- [ ] Menu categories list + product list (DB-driven, availability-aware)
- [ ] Product configuration (qty, milk, sugar, ice, extras, notes)
- [ ] Cart view + subtotal + add/remove
- [ ] "إعادة آخر طلب" reorder path
- [ ] Fulfillment choice (pickup vs delivery) with correct branching
- [ ] Pickup flow: summary, prep time, café location, payment handoff
- [ ] Pickup post-payment: "جاهز للاستلام" + customer `وصلت` → dashboard
- [ ] "التواصل مع موظف" handoff path
- [ ] All copy sourced from central template file
