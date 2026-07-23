# Member 4 — Dashboard, Database & Courier Registry

**Owns:** the data foundation everyone builds on, the café control panel, the courier
registry, and reporting. This member unblocks the other three, so **the schema ships first.**

BR sections covered: لوحة تحكم المقهى, حالات الطلب (display), سجل المندوبين.

---

## Responsibilities

- Design and own the **database schema** (the integration contract for M1–M3).
- Build the **café dashboard**: live orders, statuses, payment state, prep-time entry,
  courier arrival notifications, price/support visibility, product & price management.
- Build the **courier registry** (per WhatsApp number) with performance history.
- Build **reporting**: order history + total sales.

## Database schema (initial contract — coordinate before changing)

- **`customers`** — id, wa_number, name, created_at.
- **`sessions`** — wa_number, state, cart (jsonb), current_order_id, updated_at.
- **`products`** — id, category, name, price, options (jsonb: milk/sugar/ice/extras), `is_available`.
- **`orders`** — id, customer_id, items (jsonb), product_subtotal, fulfillment (pickup/delivery),
  status (M3 enum), courier_id, courier_price, cafe_support, customer_delivery_price, total,
  delivery_code, location (jsonb), payment_status, prep_minutes, created_at, updated_at.
- **`couriers`** — id, name, wa_number, areas (jsonb), avg_response_time, avg_price,
  completed_count, cancel_count, on_time_rate, rating, notes.
- **`payments`** — id, order_id, gateway_ref, amount, status, method, raw (jsonb), created_at.
- **`order_events`** — id, order_id, from_status, to_status, actor, created_at (audit trail).

## Dashboard features (BR: لوحة تحكم المقهى)

- View new orders + each order's status (16-state board) + payment status.
- See products/extras of each order; set/adjust prep time.
- Receive courier-arrival notification; see courier price + delivery support amount.
- Update order status; toggle products out-of-stock; edit prices.
- Manage courier list; review past orders; see total sales.

**MVP approach:** run **NocoDB or Baserow directly on the Postgres DB** for the admin UI, plus
n8n workflows for push notifications (courier arrival, new order) to the café's device/WhatsApp.
Upgrade to a custom frontend later.

## Courier registry (BR: سجل المندوبين)

Per courier (keyed by WhatsApp number): name, phone, areas served, response speed, average
delivery price, completed orders, cancellations, on-time rate, customer rating, notes/complaints.
Couriers need no app/account — Member 2 reads/updates these fields as orders complete.

## n8n workflows to build

1. **`m4-db-migrations`** — schema creation + seed products/couriers.
2. **`m4-order-feed`** — event consumer that keeps the dashboard/board current from
   `order_events` (emitted by M3's `set-status`).
3. **`m4-cafe-notifications`** — new order, payment received, courier arrived → push to café.
4. **`m4-courier-stats`** — update courier registry metrics on order completion/cancellation.
5. **`m4-reports`** — daily/weekly sales totals + order history export.

## Dependencies

- Consumed by **all** members. **Deliver the schema + seed data first** so M1–M3 can integrate.
- **Member 3**: `order_events` / status changes feed the board.
- **Member 2**: courier stat updates.

## Deliverables

- [ ] `/db/schema.sql` + seed data committed
- [ ] Dashboard (NocoDB/Baserow) live over the DB
- [ ] Exported workflows in `/workflows/m4-*.json`
- [ ] Schema contract doc shared with M1–M3

## Task checklist

- [ ] Finalize + publish schema (customers, sessions, products, orders, couriers, payments, order_events)
- [ ] Migrations + seed products/couriers
- [ ] Dashboard: live orders + 16-status board + payment status
- [ ] Dashboard: order details (items/extras), set prep time
- [ ] Dashboard: courier price + delivery support visibility
- [ ] Dashboard: update status, toggle out-of-stock, edit prices
- [ ] Café push notifications (new order / paid / courier arrived)
- [ ] Courier registry CRUD + performance metrics
- [ ] Courier stats auto-update on completion/cancellation
- [ ] Reports: total sales + order history
