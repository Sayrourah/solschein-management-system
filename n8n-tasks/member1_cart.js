// Member 1 — cart + session state (tasks 1.3, 1.5, 1.6)
// Reference logic. Drop bodies into n8n Code nodes; session persists keyed by
// WhatsApp number (n8n static data or a `sessions` Data Table).
// Cart schema is the M1<->M2<->M3 contract. Order row targets M4 `orders`.
//
// Run check: node member1_cart.js

// --- Cart schema (shared with Member 2 delivery, Member 3 pricing) -----------
// session = { number, state, fulfillment, cart:[ cartItem ] }
// cartItem = { sku, qty, options:{milk,sugar,ice}, addons:[sku], notes }
// options are WhatsApp customizations; addons are `products` rows is_addon=true.

function newSession(number) {
  return { number, state: 'menu', fulfillment: null, cart: [] };
}

function buildCartItem({ sku, qty = 1, options = {}, addons = [], notes = '' }) {
  if (!sku) throw new Error('cart item needs sku');
  if (qty < 1) throw new Error('qty must be >= 1');
  return { sku, qty, options, addons: [...addons], notes };
}

function addToCart(session, item) {
  session.cart.push(item);
  return session;
}

// product_total = sum over lines of (product price + addon prices) * qty.
// Member 3 owns discounts/delivery/final price; M1 only sums menu prices.
function cartTotals(cart, productsBySku) {
  const lines = cart.map((it) => {
    const p = productsBySku[it.sku];
    if (!p) throw new Error(`cart sku not in products: ${it.sku}`);
    const addonSum = it.addons.reduce((s, a) => {
      const ap = productsBySku[a];
      if (!ap) throw new Error(`addon sku not in products: ${a}`);
      return s + ap.sale_price;
    }, 0);
    const lineTotal = +((p.sale_price + addonSum) * it.qty).toFixed(2);
    return { sku: it.sku, name: p.name, qty: it.qty, lineTotal };
  });
  const product_total = +lines.reduce((s, l) => s + l.lineTotal, 0).toFixed(2);
  return { product_total, lines };
}

// Flatten a cartItem to the M4 orders.items shape {sku,qty,addons,notes}.
// options (milk/sugar/ice) fold into notes so M4 schema stays unchanged.
function itemToOrderItem(it) {
  const opt = it.options || {};
  const parts = [];
  if (opt.milk) parts.push(`Milk: ${opt.milk}`);
  if (opt.sugar) parts.push(`Sugar: ${opt.sugar}`);
  if (opt.ice) parts.push(`Ice: ${opt.ice}`);
  if (it.notes) parts.push(it.notes);
  return { sku: it.sku, qty: it.qty, addons: it.addons, notes: parts.join(' | ') };
}

// Build the M4 `orders` row. Called after payment (1.5): status Paid, pickup.
function cartToOrder(session, { order_no, productsBySku, status = 'Paid', now = new Date() }) {
  const { product_total } = cartTotals(session.cart, productsBySku);
  return {
    order_no,
    channel: 'whatsapp',
    status,
    customer_number: session.number,
    fulfillment: session.fulfillment || 'pickup',
    items: JSON.stringify(session.cart.map(itemToOrderItem)),
    product_total,
    courier_price: 0,
    cafe_support: 0,
    delivery_price: 0,
    total: session.fulfillment === 'delivery' ? null : product_total, // M3 sets delivery total
    courier_number: '',
    delivery_code: '',
    created_at: now.toISOString(),
  };
}

// Reorder (1.6): rebuild a cart from a past order row's items JSON.
function rebuildCartFromOrder(orderRow) {
  const items = JSON.parse(orderRow.items); // [{sku,qty,addons,notes}]
  return items.map((it) =>
    buildCartItem({ sku: it.sku, qty: it.qty, addons: it.addons || [], notes: it.notes || '' })
  );
}

// --- checks ------------------------------------------------------------------
if (require.main === module) {
  const assert = require('assert');
  const products = {
    'matcha-iced-latte': { sku: 'matcha-iced-latte', name: 'Iced Matcha Latte', sale_price: 10 },
    'extra-shot': { sku: 'extra-shot', name: 'Extra Shot', sale_price: 2, is_addon: true },
  };

  const s = newSession('966500000000');
  addToCart(
    s,
    buildCartItem({
      sku: 'matcha-iced-latte',
      qty: 2,
      options: { milk: 'oat', sugar: '50%', ice: 'light' },
      addons: ['extra-shot'],
      notes: 'no straw',
    })
  );

  const t = cartTotals(s.cart, products);
  assert.strictEqual(t.product_total, 24, `total ${t.product_total}`); // (10+2)*2

  s.fulfillment = 'pickup';
  const order = cartToOrder(s, { order_no: 'W-1001', productsBySku: products });
  assert.strictEqual(order.channel, 'whatsapp');
  assert.strictEqual(order.status, 'Paid');
  assert.strictEqual(order.total, 24);
  const oi = JSON.parse(order.items)[0];
  assert.strictEqual(oi.notes, 'Milk: oat | Sugar: 50% | Ice: light | no straw');
  assert.deepStrictEqual(oi.addons, ['extra-shot']);

  // reorder round-trips back into a cart with same sku/qty
  const cart2 = rebuildCartFromOrder(order);
  assert.strictEqual(cart2[0].sku, 'matcha-iced-latte');
  assert.strictEqual(cart2[0].qty, 2);
  assert.strictEqual(cartTotals(cart2, products).product_total, 24);

  console.log('OK', { total: t.product_total, order_no: order.order_no });
}

module.exports = {
  newSession, buildCartItem, addToCart, cartTotals,
  itemToOrderItem, cartToOrder, rebuildCartFromOrder,
};
