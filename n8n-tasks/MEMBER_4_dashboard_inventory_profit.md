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
