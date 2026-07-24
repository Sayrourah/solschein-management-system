# Initial WhatsApp Ordering & Delivery System for the Café

## System Concept

Build a simple way to receive café orders through WhatsApp, suitable for a café in its early days while its order volume is still limited.

The customer can:

* View the menu.
* Choose products and add-ons.
* Choose pickup from the café or delivery.
* Send their location via WhatsApp.
* Know the delivery cost.
* Pay through a link that supports Apple Pay.
* Track the order status through WhatsApp messages.

The café owners receive all orders in a dedicated dashboard.

Orders arrive from two channels — WhatsApp and the HungerStation API — and both appear in the same dashboard. The dashboard also tracks inventory, calculates cost and profit, and runs as a local web application reachable from any device on the café's network.

---

## Customer Journey

### 1. Starting the Order

The customer contacts the café's number via WhatsApp.

The system sends a welcome message containing the following options:

1. New order.
2. Track a current order.
3. Reorder the last order.
4. Talk to a staff member.

---

### 2. Choosing Products

The system displays the menu sections, such as:

* Matcha.
* Coffee.
* Desserts.
* Add-ons.
* Offers.

The customer selects:

* The product.
* The quantity.
* The milk type.
* The sugar level.
* The amount of ice.
* The add-ons.
* Special notes.

---

### 3. Choosing the Fulfillment Method

After finishing product selection, the system offers the customer two options:

* Pickup from the café.
* Delivery to the customer's location.

---

# Pickup from the Café

When pickup is selected, the system displays:

* Order summary.
* Product total.
* Estimated preparation time.
* Café location.
* Payment link.

After successful payment, the order arrives in the café dashboard.

When the order is ready, the system sends the customer:

> Your order is now ready for pickup.

The customer can reply:

> I'm here.

so that a notification reaches the café owners that the customer is at the location.

---

# Delivery to the Customer

## 1. Receiving the Customer's Location

When delivery is selected, the system asks the customer to send their geographic location via WhatsApp.

After receiving the location, the system calculates:

* The distance between the café and the customer.
* The neighborhood or area.
* The approximate delivery price.
* The estimated delivery time.

The system sends the customer a preliminary message such as:

> Estimated delivery cost is 13 to 18 SAR.
> We're now finding the best courier, and the final price will be confirmed before payment.

---

## 2. Communicating with Couriers

The courier does not need a dedicated app or an account in the system.

Communication happens entirely through WhatsApp.

The system sends the delivery request to a limited number of couriers, such as 3 to 5 couriers, instead of sending it to all couriers.

The message looks like:

> **New delivery request No. 154**
>
> Pickup: The café
> Delivery: Al-Safa neighborhood
> Approximate distance: 5.5 km
> Order ready in: 15 minutes
>
> Send your delivery price and your estimated time to reach the café.

The courier replies, for example:

> 15 SAR, and I'll arrive in 10 minutes.

At this stage, the following are NOT sent:

* Customer name.
* Customer number.
* Customer's exact location.
* Order contents.
* Product total.

---

## 3. Choosing the Courier

The system waits for courier replies for a short period, such as two minutes.

It then picks the best offer based on:

* Delivery price.
* Courier's speed of arrival at the café.
* Courier's reliability on previous orders.
* Number of cancellations.
* Any prior complaints.

Choosing the cheapest courier is not always required.

### Example

| Courier        |     Price | Arrival time at café |
| -------------- | --------: | -------------------: |
| First courier  |    13 SAR |           35 minutes |
| Second courier |    15 SAR |           10 minutes |

The second courier can be chosen; they are faster, and the price difference is small.

---

# Delivery Discount Based on Cart Value

To lower the delivery price for the customer, the café covers part of the delivery cost based on the value of the products in the cart.

The discount is calculated on the product value only, before adding the delivery fee.

## Suggested Tiers for the Café at the Start

| Product cart value       | Amount the café covers of delivery |
| ------------------------ | ---------------------------------: |
| Less than 30 SAR         |                       No support |
| 30 to 44.99 SAR          |                    2 SAR discount |
| 45 to 59.99 SAR          |                    4 SAR discount |
| 60 to 79.99 SAR          |                    6 SAR discount |
| 80 SAR and above         |                    8 SAR discount |

## Calculation Method

```text
customer delivery price = courier price - café support
```

The customer delivery price must not go below zero.

---

## Delivery Discount Examples

### Example One

* Product value: 27 SAR.
* Courier price: 15 SAR.
* Café support: 0 SAR.

The customer pays:

```text
27 + 15 = 42 SAR
```

---

### Example Two

* Product value: 38 SAR.
* Courier price: 15 SAR.
* Café support: 2 SAR.

The customer pays for delivery:

```text
15 - 2 = 13 SAR
```

Total:

```text
38 + 13 = 51 SAR
```

The courier still receives the full delivery amount, 15 SAR.

---

### Example Three

* Product value: 52 SAR.
* Courier price: 17 SAR.
* Café support: 4 SAR.

The customer pays for delivery:

```text
17 - 4 = 13 SAR
```

Total:

```text
52 + 13 = 65 SAR
```

---

### Example Four

* Product value: 83 SAR.
* Courier price: 16 SAR.
* Café support: 8 SAR.

The customer pays for delivery:

```text
16 - 8 = 8 SAR
```

Total:

```text
83 + 8 = 91 SAR
```

---

# Encouraging the Customer to Increase the Cart

Before confirming the order, the system can tell the customer the remaining amount needed to get a bigger delivery discount.

### Example

If the cart value is 42 SAR, the system sends:

> Add just 3 SAR of products to get a 4 SAR delivery discount instead of 2 SAR.

Or:

> Add a cookie and get an extra delivery discount.

The suggested products should have a suitable profit margin, such as:

* Cookies.
* Brownies.
* Add-ons.
* An extra drink.
* An extra matcha or espresso shot.

---

# Confirming the Price with the Customer

After choosing the courier and applying the café support, the system sends the customer the final summary.

### Example

> **Your order summary**
>
> Product value: 52 SAR
> Courier price: 17 SAR
> Café delivery discount: 4 SAR
> Delivery after discount: 13 SAR
> Total: 65 SAR
> Estimated time: 35 to 45 minutes
>
> Would you like to confirm the order?

The payment link is only sent after the customer approves the final price.

---

# Payment

After the customer approves, the system sends an electronic payment link that supports:

* Apple Pay.
* Mada.
* Bank cards.

After successful payment, an automatic confirmation message arrives at the system from the payment gateway.

The system does not rely on a transfer screenshot sent by the customer.

After the transaction is confirmed:

* The order appears in the café dashboard.
* The café starts preparing the order.
* The chosen courier is confirmed.

---

# Courier Confirmation Message

After the customer's payment succeeds, the system sends the courier:

> Delivery request No. 154 has been confirmed.
>
> Pickup location: café location link
> Order ready in: 15 minutes
>
> Send on arrival:
>
> `arrived 154`

And the system sends the remaining couriers:

> Order No. 154 has been assigned to another courier, thank you.

---

# Courier Arrival at the Café

When the courier arrives, they send via WhatsApp:

```text
arrived 154
```

The system identifies:

* The courier number.
* The order number.
* The arrival time.

A notification then appears in the café dashboard:

> The courier for order No. 154 has arrived.

When the courier picks up the order, they send:

```text
picked up 154
```

The order status is then updated to:

> The courier picked up the order and is on the way to the customer.

---

# Sharing Customer Data with the Courier

To protect the customer's privacy, their full data is not sent to the courier from the start.

After the courier confirms picking up the order, the system sends them:

* The customer's exact location.
* Arrival instructions.
* Building or apartment number.
* Delivery notes.

As for the customer's number, it can be sent to the courier a short while before arrival.

The courier sends:

```text
near 154
```

The system then sends:

* The customer's number.
* Final instructions.
* A delivery confirmation code or method.

And the customer receives a notification:

> Your order's courier is now near your location.

---

# Confirming Order Delivery

The system sends the customer a four-digit delivery code.

Example:

> Your order pickup code is: 4832
> Do not give the code to the courier until you receive the order.

After delivery, the courier sends:

```text
deliver 154 4832
```

If the code is correct, the order status is updated to:

> Delivered.

And the system sends the customer a thank-you message and a request for a rating.

---

# Ordering via HungerStation

The system receives orders from two channels:

* WhatsApp (described above).
* The HungerStation API.

Both channels feed the same dashboard, the same inventory, and the same profit calculations. Each order is labeled with its channel so the café knows where it came from.

## How HungerStation Orders Differ

HungerStation is a delivery aggregator: it owns the customer relationship, the payment, and the delivery. For orders coming from HungerStation, the café does not run the courier bidding, the delivery-support discount, the payment link, or the delivery-code steps — HungerStation handles those.

So a HungerStation order uses a shorter flow:

1. HungerStation sends the order to the system through its API (webhook).
2. The system creates the order in the dashboard, labeled **HungerStation**, and deducts its ingredients from inventory.
3. The café prepares the order.
4. The café marks the order **ready**, and the HungerStation courier collects it.
5. The system records the sale for profit calculation.

## What the System Needs from the HungerStation API

* Receive new orders (order number, items, add-ons, quantities, notes).
* Send order status back to HungerStation (accepted, preparing, ready, etc.), as the API supports.
* Keep the menu and prices in sync, or map HungerStation items to the café's own products so inventory and profit are calculated correctly.

## Menu Mapping

Each HungerStation item must map to a product in the café's menu, so that:

* Inventory deducts the correct ingredients.
* Profit uses the correct cost and sale price.

If an item cannot be matched, the order still appears in the dashboard but is flagged for the café to map manually.

> **Assumption:** HungerStation handles payment and delivery for its own orders. If the café instead wants to fulfill HungerStation orders with its own couriers, the WhatsApp delivery flow can be reused; this needs to be confirmed against HungerStation's integration model.

---

# Inventory Management

The system tracks inventory by deducting from stock every time an order is sold, across both channels.

## Inventory Items

Inventory covers two kinds of items:

* **Ingredients** — matcha, coffee beans, milk, syrups, ice, etc.
* **Consumables** — cups, lids, sleeves, straws, napkins, bags, etc.

Each item has:

* Name.
* Unit (grams, milliliters, pieces, or a recipe-specific unit such as teaspoons when the menu uses spoon measures).
* Current quantity in stock.
* Low-stock threshold.

## Menu-Derived Recipe Weights and Admin Reminders

The starting recipes and low-stock thresholds are seeded from the approved menu spreadsheet. This lets the dashboard warn the admin before an ingredient actually reaches zero.

Examples from the menu:

* Matcha drinks consume 4 g of matcha per cup, plus 20 ml water.
* Most cold milk drinks consume 220 ml milk per cup.
* Cold drinks consume 220 g ice per cup.
* Coffee of the day consumes 14 g coffee beans per cup.
* Americano consumes 17 g coffee beans per cup.
* Vanilla and Secret Solschein syrup servings use up to 23 ml per cup.
* Caramel syrup uses up to 5 ml per cup.
* Strawberry syrup uses up to about 30 ml per cup.

Suggested first thresholds:

| Inventory item | Suggested low-stock threshold | Approximate coverage |
| -------------- | ----------------------------: | -------------------- |
| Matcha         |                         100 g | About 25 matcha cups |
| Milk           |                       4,400 ml | About 20 milk drinks |
| Ice            |                       8,800 g | About 40 cold drinks |
| Coffee beans   |                         350 g | About 20 Americanos |
| Vanilla syrup  |                         460 ml | About 20 servings |
| Caramel syrup  |                         100 ml | About 20 servings |
| Strawberry syrup |                       600 ml | About 20 servings |

When an item reaches or drops below its threshold, the dashboard shows an admin reminder, for example:

> Low stock: matcha has 90 g left, below the 100 g threshold.

## Recipes (Bill of Materials)

Each menu product has a recipe: the inventory items it consumes per unit, and how much of each.

### Example — Iced Matcha Latte

| Inventory item | Quantity per cup |
| -------------- | ---------------: |
| Matcha         |             5 g |
| Milk           |          200 ml |
| Ice            |          100 g |
| Cup            |         1 piece |
| Lid            |         1 piece |
| Straw          |         1 piece |

Add-ons (extra matcha shot, extra syrup, etc.) have their own small recipes and are deducted on top of the base product when the customer selects them.

## Packaging Bag Rule

Bags are deducted at the order level, based on the total number of cup-equivalent items in the order, not as a fixed recipe quantity per drink.

* One bag can carry up to 2 cups.
* Bag usage is calculated as:

```text
bags used = ceil(cup-equivalent count / 2)
```

* If the order has 1 cup, the system deducts 1 bag.
* If the order has 3 cups, the system deducts 2 bags.
* External ice counts as 1 cup-equivalent item because it occupies cup space in the bag.

## Deducting from Stock

When an order is confirmed as paid (WhatsApp) or received (HungerStation), the system:

* Reads each product and add-on in the order.
* Multiplies each recipe quantity by the ordered quantity.
* Calculates bag consumption from the total cup-equivalent count for the order.
* Subtracts the totals from current stock.

### Example

Order: 2 × Iced Matcha Latte.

```text
Matcha used = 5 g × 2 = 10 g
Milk used   = 200 ml × 2 = 400 ml
Cups used   = 1 × 2 = 2 pieces
Bags used   = ceil(2 ÷ 2) = 1 piece
```

If the order contains 2 drinks plus 1 external ice, the cup-equivalent count is 3 and the system deducts 2 bags.

## Restocking

When the café buys new stock, it adds the purchased quantity to the item. This uses the same purchase receipt that feeds the profit calculation (below), so entering a purchase once both restocks inventory and updates cost.

## Low-Stock Alerts and Auto-Disable

* When an item drops below its low-stock threshold, the dashboard shows a warning.
* When an item reaches zero, every product that needs it is automatically disabled so customers cannot order it, until the café restocks. This reuses the existing "Product Unavailable" handling.

---

# Cost and Profit Calculation

The system calculates the cost and profit of every product and every order, and shows the totals on the dashboard.

## Purchase Receipts → Unit Cost

The café enters what it buys as purchase receipts. Each line records:

* Item.
* Quantity bought (with unit).
* Total price paid.

From this the system computes the **unit cost**:

```text
unit cost = total price ÷ quantity bought
```

### Example

Buy 1 kg (1000 g) of matcha for 200 SAR:

```text
unit cost = 200 ÷ 1000 = 0.20 SAR per gram
```

## Cost per Product

Using the recipe, the cost of a product is the sum of (recipe quantity × unit cost) for every item it consumes.

### Example — Iced Matcha Latte

| Item           | Quantity | Unit cost      |         Cost |
| -------------- | -------: | -------------- | -----------: |
| Matcha         |      5 g | 0.20 SAR/g     |     1.00 SAR |
| Milk           |   200 ml | 0.01 SAR/ml    |     2.00 SAR |
| Cup            |  1 piece | 0.50 SAR/piece |     0.50 SAR |
| Lid            |  1 piece | 0.20 SAR/piece |     0.20 SAR |
| Straw          |  1 piece | 0.10 SAR/piece |     0.10 SAR |
| **Total cost** |          |                | **3.80 SAR** |

## Profit per Product

```text
profit = sale price - cost
margin = profit ÷ sale price × 100%
```

### Example

Sell the Iced Matcha Latte for 10 SAR:

```text
profit = 10 - 3.80 = 6.20 SAR
margin = 6.20 ÷ 10 × 100% = 62%
```

Counting only the 5 g of matcha (1 SAR) would suggest a 9 SAR profit; the full recipe gives the true profit of 6.20 SAR.

## Profit per Order and per Period

* **Per order:** the sum of the profit of every item in the order.
* **Per period:** the dashboard totals cost, revenue, and profit per day, week, and month, and per product, so the café sees its best and worst margins.

## What the Dashboard Shows

* Cost, sale price, profit, and margin for each product.
* Profit per order.
* Revenue, cost of goods, and profit for the day (and other periods).
* Best-selling and most profitable products.

---

# Local Web-Based Dashboard

The dashboard is a **local web application**: it runs on the café's own computer or local server and is opened in a normal web browser.

* Reachable from any device on the café's network — phone, tablet, laptop, or the counter screen.
* No dedicated app to install; any browser works.
* Responsive layout that adapts to small and large screens.
* The data stays on the café's local machine.

## Access

* The café opens the dashboard at a local address (for example `http://cafe-pc:8080`) from any device on the same network.
* Simple login so only staff can open it.
* Optional roles later (owner vs. staff) to limit who can edit prices, recipes, and purchases.

## Everything in One Place

The same dashboard shows all of the system's information:

* Orders from both WhatsApp and HungerStation, with their statuses.
* Courier information and delivery support (WhatsApp orders).
* Inventory levels and low-stock alerts.
* Product cost, profit, and margin.
* Sales and profit totals per period.

---

# Order Statuses in the Dashboard

Orders appear in the café dashboard under the following statuses:

1. New order.
2. Awaiting customer location.
3. Searching for a courier.
4. Awaiting customer price approval.
5. Awaiting payment.
6. Paid.
7. Preparing the order.
8. Order ready.
9. Courier on the way to the café.
10. Courier arrived at the café.
11. Courier picked up the order.
12. Order on the way to the customer.
13. Courier is near.
14. Delivered.
15. Cancelled order.
16. There is a problem.

Each order also carries its **channel** (WhatsApp or HungerStation). HungerStation orders use a reduced set of statuses — New order, Preparing the order, Order ready, Delivered, Cancelled order — because HungerStation handles payment and delivery.

---

# Handling Problems

## No Courier Responded

The customer is informed of the following options:

* Wait a few extra minutes.
* Search at a slightly higher delivery price.
* Switch the order to pickup from the café.
* Cancel the order.

---

## The Courier Cancelled the Order

The system resends the delivery request to the other couriers.

If the delivery price changes, the customer must be informed and their approval taken before continuing.

---

## Payment Failed

The café does not start preparing the order.

The system sends the customer a new payment link or transfers the conversation to a staff member.

---

## Product Unavailable

The system offers the customer:

* Replace the product.
* Remove the product.
* Refund the price difference.
* Cancel the order.

---

## Incorrect Location

The system asks the customer to resend the location before payment.

---

# Café Dashboard

The dashboard allows the café owners to:

* View new orders.
* Know the status of each order.
* Know the payment status.
* View product and add-on data.
* Set the order preparation time.
* Receive a courier-arrival notification.
* Know the courier price.
* Know the delivery support amount.
* Update the order status.
* Disable unavailable products.
* Edit prices.
* Manage the courier list.
* Review previous orders.
* Know total sales.
* See the order channel (WhatsApp or HungerStation).
* View current inventory levels and low-stock alerts.
* Enter purchase receipts to restock and update costs.
* Manage product recipes (ingredients and consumables per product).
* View cost, profit, and margin per product and per order.
* View sales and profit totals per day, week, and month.
* Open the dashboard from any device on the café's network through a browser.

---

# Courier Log

The system keeps an internal log for each courier based on their WhatsApp number, including:

* Name.
* Mobile number.
* Neighborhoods they work in.
* Response speed.
* Average delivery price.
* Number of completed orders.
* Number of cancellations.
* Punctuality.
* Customer ratings.
* Notes and complaints.

The courier does not need an account or an app to be part of this log.

---

# Suitable First Phase for the Café

Since the café is new, the first version includes:

1. Receiving the order from WhatsApp.
2. Displaying the menu.
3. Choosing pickup or delivery.
4. Receiving the customer's location.
5. Giving an approximate delivery price.
6. Sending the delivery request to a limited number of couriers.
7. Receiving courier prices via WhatsApp.
8. Choosing the best offer.
9. Applying the delivery discount based on cart value.
10. Taking the customer's approval.
11. Sending the payment link.
12. Sending the order to the café dashboard.
13. Receiving the courier-arrival message.
14. Sending customer data after order pickup.
15. Confirming delivery with a code.

Alongside the ordering flow above, the first version also includes the HungerStation channel, inventory tracking, the cost-and-profit module, and the local web dashboard described in their own sections.

---

# Features to Add Later

After the number of orders grows, the following can be added:

* Economy and express delivery.
* Merging nearby orders.
* Fixed delivery rounds.
* Group ordering.
* Loyalty points.
* Monthly delivery subscription.
* Discount coupons.
* Free delivery with conditions.
* Neighborhood pickup points.
* Advanced reports.
* Automatic courier selection based on performance.
* Automatic inventory reorder suggestions and supplier purchase orders.
* Fulfilling HungerStation orders with the café's own couriers.
* Detailed profit and inventory reports with charts.

---

# Summary

The most suitable approach for the café at the start is:

* Receive orders via WhatsApp.
* Request delivery prices from a limited number of couriers.
* Choose the best price and time.
* Have the café cover part of the delivery based on cart value.
* Send the final price to the customer before payment.
* Manage the order through a simple dashboard.
* Keep all courier interaction entirely through WhatsApp messages.
