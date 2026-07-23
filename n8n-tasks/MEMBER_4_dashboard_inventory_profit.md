# Member 4 — Dashboard, Inventory & Cost/Profit

**Owner:** _(assign)_
**Spec sections:** Inventory Management · Cost and Profit Calculation · Local Web Dashboard · Order Statuses · Café Dashboard

## Scope

The shared data layer + the local web app everyone else reads/writes through. Owns the DB schema, inventory, recipes, cost/profit engine, and the dashboard UI.

## Tasks

### 4.1 Data model (do first — everyone depends on it)
Define + share schema: products, menu, orders (with **channel** + status), order items, couriers, inventory items, recipes, purchase receipts. This is the contract for Members 1–3.

### 4.2 Local web dashboard
- Local web app on café PC/server (e.g. `http://cafe-pc:8080`), any-browser, responsive, data stays local.
- Simple staff login; optional owner/staff roles later (edit prices/recipes/purchases).
- Shows: orders (both channels + status), courier info + delivery support, inventory + low-stock, product cost/profit/margin, sales+profit per period.

### 4.3 Order statuses
Full set (16) for WhatsApp: New, Awaiting location, Searching courier, Awaiting price approval, Awaiting payment, Paid, Preparing, Ready, Courier→café, Courier arrived, Picked up, On the way, Courier near, Delivered, Cancelled, Problem.
Reduced set for HungerStation: New, Preparing, Ready, Delivered, Cancelled.
- Owners can update status manually; set prep time.

### 4.4 Inventory
- Items: ingredients (matcha, beans, milk, syrups, ice) + consumables (cups, lids, sleeves, straws, napkins, bags). Each: name, unit (g/ml/pieces), qty in stock, low-stock threshold.
- Recipes (BOM): per product, items consumed per unit. Add-ons have own small recipes, deducted on top.
- Deduct on paid (WhatsApp) / received (HungerStation): recipe qty × ordered qty, subtract from stock.
- Restock via purchase receipt (same entry feeds cost).
- Low-stock warning; at zero → auto-disable every product needing it (reuse "Product Unavailable"), until restocked.

### 4.5 Cost & profit
- `unit cost = total price ÷ quantity bought` from purchase receipts.
- Product cost = Σ(recipe qty × unit cost) across all items (full recipe, not just headline ingredient).
- `profit = sale − cost`; `margin = profit ÷ sale × 100`.
- Per order = Σ item profit. Per period = totals per day/week/month + per product.
- Dashboard: cost/sale/profit/margin per product, profit per order, revenue/COGS/profit per day, best-selling & most profitable.

### 4.6 Café management screens
View new orders, statuses, payment status, product/add-on data, set prep time, courier-arrival notifications, courier price, delivery support, update status, disable products, edit prices, manage courier list, review past orders, total sales, order channel, inventory levels + alerts, enter purchase receipts, manage recipes, view cost/profit/margin, period totals, open from any network device.

## Interfaces / handoffs
- **Publishes DB schema** → Members 1, 2, 3 (blocker — deliver early).
- **Reads** order/status writes from all channels.
- **Menu + availability** → Member 1.
- **Inventory deduct + sale record** triggered by Member 3 "paid"/"received" events.
- **Courier list** shared with Member 2.

## Dependencies
- DB choice (Postgres/SQLite local). Coordinate hosting on café machine.

## Done when
- Dashboard shows live orders both channels, inventory deducts on sale, low-stock auto-disables, cost/profit matches spec Iced Matcha Latte example (cost 3.80, margin 62%).

---

## Built

Storage = **n8n Data Tables** (native; no external DB). Project `JET1jtVaCxN3vMTy` (personal). Data Tables are flat — types string/number/boolean/date only — so lists (order items, product recipes) live in **JSON-string** columns, parsed in a Code node. `ponytail:` native Data Tables over standing up Postgres; revisit if reporting needs SQL joins.

**Schema contract (M1–M3 build against this):**

| Table | ID | Columns |
|---|---|---|
| products | `bgJbtTjZ6oGjWJNB` | sku, name, section, sale_price, available(bool), is_addon(bool), recipe(JSON `[{item,qty}]`) |
| inventory | `oSXZXOU4SvH6f5OS` | name, unit, qty_in_stock, low_threshold, unit_cost |
| orders | `hWfPbrXmGYFK3ZNW` | order_no, channel, status, customer_number, fulfillment, items(JSON `[{sku,qty,addons,notes}]`), product_total, courier_price, cafe_support, delivery_price, total, courier_number, delivery_code, created_at |
| couriers | `zdaBo4Uw6U6dSS15` | number, name, neighborhoods, completed_orders, cancellations, avg_price, rating, punctual, notes |
| purchases | `3FkHAa8Xpeqg6upr` | item, qty_bought, unit, total_price, created_at |

- **channel**: `whatsapp` \| `hungerstation`. **status**: the spec status strings (16 for WhatsApp, 5-subset for HungerStation).
- Add-ons are `products` rows with `is_addon=true` and their own recipe.
- Seeded: 6 inventory rows + Iced Matcha Latte (validates schema + cost example).

**Logic delivered (drop bodies into Code nodes):**
- [member4_costprofit.js](member4_costprofit.js) — `costProfit(product, inventoryByName)` → {cost, profit, margin}. Check passes (3.80 / 6.20 / 62%).
- [member4_inventory.js](member4_inventory.js) — `deductOrder(order, productsBySku, inventoryByName)` → deductions, newStock, disable[], warn[]. Runs on order paid/received. Check passes.
- **Restock / unit cost** (trivial, no separate file): on a purchase row, `unit_cost = total_price / qty_bought` and `qty_in_stock += qty_bought`. Same receipt feeds cost + restock.

**Live workflows (both ACTIVE — Data Tables only, no external creds):**
- **Café Dashboard** `gCEvSL04reabbDfq` — GET `http://localhost:5678/webhook/dashboard` server-renders one self-contained HTML page: KPIs (orders/revenue/profit/pending/low-stock), sales+profit by period (today/7d/30d), orders table (both channels, colored status, per-order profit), product cost/profit/margin, inventory + low-stock. Reads all Data Tables at request time; reload to refresh. Cost/profit verified live (Iced Matcha Latte 3.80 / 6.20 / 62%). Covers spec 4.2 + the view side of 4.6; edit actions still via the built-in Data Table UI. Staff login deferred (local network).
- **Order Events / Inventory** `1jNMPpXDyhlt99B8` — webhooks `internal/order-paid` (WhatsApp) + `internal/order-received` (HungerStation), fired by Member 3. Reads order items → product recipes → deducts inventory (incl. add-on recipes) → auto-disables any product whose ingredient hit ≤0. Implements task 4.4 end-to-end; mirrors [member4_inventory.js](member4_inventory.js). Tested: matcha-style order 100−14=86, zero-stock item → product disabled.

**Deferred (question before building):**
- Edit-side dashboard UI (change prep time, prices, recipes, enter purchases) — still via n8n's built-in Data Table editor; build custom forms only when the café outgrows it.
- Best-selling / most-profitable ranking views — add to the dashboard when someone needs them.

**Not Member 4's job** (called out to avoid overlap): delivery-support discount math lives in Member 3; courier bidding/selection in Member 2. Member 4 only stores the resulting numbers on the order row.
