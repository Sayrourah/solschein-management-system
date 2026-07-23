// Member 3 — pricing, payment & HungerStation channel (tasks 3.1–3.5)
// Reference logic. Drop bodies into n8n Code nodes. Consumes the *courier price*
// from Member 2 and the cart total from Member 1; writes the M4 `orders` row and
// emits the "paid"/"received" event that fans out to Member 2 (courier) + Member 4
// (inventory deduct). Money lives here; M1/M2/M4 only store the resulting numbers.
//
// Run check: node member3_pricing.js

// --- 3.1 delivery discount (café support) tiers ------------------------------
// Support is on PRODUCT value only, before the delivery fee. Table from spec.
// Descending by min so the first match wins.
const SUPPORT_TIERS = [
  { min: 80, support: 8 },
  { min: 60, support: 6 },
  { min: 45, support: 4 },
  { min: 30, support: 2 },
  { min: 0, support: 0 },
];

function cafeSupport(productTotal) {
  const tier = SUPPORT_TIERS.find((t) => productTotal >= t.min);
  return tier ? tier.support : 0;
}

// customer delivery price = courier price − café support, floored at 0.
// Courier still receives the FULL courier price (café eats the support).
function deliveryPricing(productTotal, courierPrice) {
  const support = cafeSupport(productTotal);
  const delivery_price = Math.max(0, +(courierPrice - support).toFixed(2));
  return {
    product_total: productTotal,
    courier_price: courierPrice,
    cafe_support: support,
    delivery_price,
    total: +(productTotal + delivery_price).toFixed(2),
  };
}

// --- 3.2 cart upsell nudge ---------------------------------------------------
// Gap to the next support tier + high-margin item suggestions. null at top tier.
const UPSELL_ITEMS = ['cookie', 'brownie', 'add-on', 'extra shot'];

function upsellNudge(productTotal) {
  const current = cafeSupport(productTotal);
  // tiers ascending; first one that both raises support AND sits above the cart
  const next = [...SUPPORT_TIERS]
    .reverse()
    .find((t) => t.support > current && t.min > productTotal);
  if (!next) return null; // already at the top tier
  const gap = +(next.min - productTotal).toFixed(2);
  return {
    gap,
    from_support: current,
    to_support: next.support,
    message: `Add just ${gap} SAR of products to get a ${next.support} SAR delivery discount instead of ${current} SAR.`,
    suggest: UPSELL_ITEMS,
  };
}

// --- 3.3 final price confirmation --------------------------------------------
// Summary sent BEFORE payment. Payment link only goes out after the customer
// approves this (task 3.3 / spec: "payment link only after approval").
function priceSummary(p, { estimatedMin } = {}) {
  const lines = [
    'Order summary',
    `Product value: ${p.product_total} SAR`,
    `Courier price: ${p.courier_price} SAR`,
    `Café delivery discount: ${p.cafe_support} SAR`,
    `Delivery after discount: ${p.delivery_price} SAR`,
    `Total: ${p.total} SAR`,
  ];
  if (estimatedMin != null) lines.push(`Estimated time: ${estimatedMin} min`);
  lines.push('', 'Reply YES to confirm and receive the payment link.');
  return lines.join('\n');
}

// \b is unreliable after Arabic letters, so anchor on start + a trailing
// non-letter or end instead.
const isApproval = (text) => /^\s*(yes|y|نعم|أوافق|موافق|ok|confirm)(\s|$|[.!،])/i.test(String(text).trim() + ' ');

// --- 3.4 payment -------------------------------------------------------------
// Payment-link request payload (Moyasar-shaped; amount in halalas = SAR*100).
// Apple Pay / Mada / cards are toggled on the gateway account, not per request.
// ponytail: single gateway shape; add an adapter only if a 2nd gateway appears.
function paymentRequest(order, { callbackUrl }) {
  return {
    amount: Math.round(order.total * 100),
    currency: 'SAR',
    description: `Solschein order ${order.order_no}`,
    callback_url: callbackUrl,
    metadata: { order_no: order.order_no, channel: order.channel },
  };
}

// Gateway webhook → { paid, order_no, status }. Tolerates a top-level or
// data-nested payload (gateways differ). paid:false → no prep; resend link
// or hand to staff (spec: Payment Failed).
function paymentResult(webhook) {
  const d = webhook.data || webhook;
  const status = d.status;
  const order_no = (d.metadata || {}).order_no;
  return { paid: status === 'paid', order_no, status };
}

// --- 3.5 HungerStation channel ----------------------------------------------
// Reduced status set (spec): New, Preparing, Ready, Delivered, Cancelled.
const HS_STATUS = {
  accepted: 'New',
  preparing: 'Preparing',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

// Map HS line items to café products via menuMap { hsId|hsName: cafeSku }.
// Unmatched items STILL land on the order (sku null + hs_ref), flagged for
// manual mapping so inventory/profit can be reconciled later (task 3.5).
function mapHsItems(hsItems, menuMap) {
  const items = [];
  const unmatched = [];
  for (const it of hsItems) {
    const key = it.id != null ? it.id : it.name;
    const sku = menuMap[key] || null;
    const line = { sku, qty: it.qty != null ? it.qty : 1, addons: it.addons || [], notes: it.notes || '' };
    if (!sku) {
      line.hs_ref = key;
      unmatched.push(key);
    }
    items.push(line);
  }
  return { items, unmatched, needsMapping: unmatched.length > 0 };
}

// Build the M4 `orders` row for a HungerStation order. HS owns customer/payment/
// delivery, so those fields stay empty and status starts at New.
function hsToOrder(hsOrder, menuMap, { now = new Date() } = {}) {
  const mapped = mapHsItems(hsOrder.items || [], menuMap);
  const order = {
    order_no: `HS-${hsOrder.order_no}`,
    channel: 'hungerstation',
    status: 'New',
    customer_number: '',
    fulfillment: 'delivery',
    items: JSON.stringify(mapped.items),
    product_total: hsOrder.total || 0,
    courier_price: 0,
    cafe_support: 0,
    delivery_price: 0,
    total: hsOrder.total || 0,
    courier_number: '',
    delivery_code: '',
    created_at: now.toISOString(),
  };
  return { order, needsMapping: mapped.needsMapping, unmatched: mapped.unmatched };
}

// --- shared "paid"/"received" event (fan-out to M2 + M4) ---------------------
// The event contract other members consume. M4 deducts inventory from
// order.items; M2 fans confirmation out to the courier (delivery orders only).
function orderEvent(order, type) {
  return {
    type, // 'paid' (whatsapp) | 'received' (hungerstation)
    order_no: order.order_no,
    channel: order.channel,
    customer_number: order.customer_number || '',
    courier_number: order.courier_number || '',
    delivery_price: order.delivery_price || 0,
    items: order.items,
  };
}

// --- checks ------------------------------------------------------------------
if (require.main === module) {
  const assert = require('assert');

  // 3.1 — all 4 spec examples (product, courier → support, delivery, total)
  const cases = [
    [27, 15, 0, 15, 42],
    [38, 15, 2, 13, 51],
    [52, 17, 4, 13, 65],
    [83, 16, 8, 8, 91],
  ];
  for (const [prod, cour, support, del, total] of cases) {
    const p = deliveryPricing(prod, cour);
    assert.strictEqual(p.cafe_support, support, `support @${prod}`);
    assert.strictEqual(p.delivery_price, del, `delivery @${prod}`);
    assert.strictEqual(p.total, total, `total @${prod}`);
  }

  // 3.1 — tier boundaries
  assert.strictEqual(cafeSupport(29.99), 0);
  assert.strictEqual(cafeSupport(30), 2);
  assert.strictEqual(cafeSupport(44.99), 2);
  assert.strictEqual(cafeSupport(45), 4);
  assert.strictEqual(cafeSupport(79.99), 6);
  assert.strictEqual(cafeSupport(80), 8);
  // support never pushes customer delivery below 0
  assert.strictEqual(deliveryPricing(80, 5).delivery_price, 0);

  // 3.2 — upsell matches spec wording exactly, null at top tier
  const nudge = upsellNudge(42);
  assert.strictEqual(nudge.gap, 3);
  assert.strictEqual(
    nudge.message,
    'Add just 3 SAR of products to get a 4 SAR delivery discount instead of 2 SAR.'
  );
  assert.strictEqual(upsellNudge(85), null);

  // 3.3 — summary + approval gate
  const summary = priceSummary(deliveryPricing(52, 17), { estimatedMin: 25 });
  assert.ok(summary.includes('Delivery after discount: 13 SAR'));
  assert.ok(summary.includes('Total: 65 SAR'));
  assert.ok(isApproval('yes') && isApproval('نعم') && !isApproval('no'));

  // 3.4 — payment payload + webhook result
  const order = { order_no: 'W-1001', channel: 'whatsapp', total: 65, delivery_price: 13 };
  const req = paymentRequest(order, { callbackUrl: 'https://x/cb' });
  assert.strictEqual(req.amount, 6500); // halalas
  assert.strictEqual(req.metadata.order_no, 'W-1001');
  assert.deepStrictEqual(paymentResult({ status: 'paid', metadata: { order_no: 'W-1001' } }), {
    paid: true, order_no: 'W-1001', status: 'paid',
  });
  assert.strictEqual(paymentResult({ data: { status: 'failed', metadata: {} } }).paid, false);

  // 3.5 — HS mapping keeps unmatched, flags it; reduced status set
  const menuMap = { 'hs-101': 'matcha-iced-latte' };
  const hs = { order_no: '5567', total: 24, items: [
    { id: 'hs-101', qty: 2 },
    { id: 'hs-999', name: 'Mystery Drink', qty: 1 },
  ] };
  const { order: hsOrder, needsMapping, unmatched } = hsToOrder(hs, menuMap);
  assert.strictEqual(hsOrder.order_no, 'HS-5567');
  assert.strictEqual(hsOrder.channel, 'hungerstation');
  assert.strictEqual(hsOrder.status, 'New');
  const hsItems = JSON.parse(hsOrder.items);
  assert.strictEqual(hsItems[0].sku, 'matcha-iced-latte');
  assert.strictEqual(hsItems[1].sku, null);
  assert.strictEqual(hsItems[1].hs_ref, 'hs-999');
  assert.ok(needsMapping && unmatched.includes('hs-999'));
  assert.strictEqual(HS_STATUS.ready, 'Ready');

  // shared event
  const ev = orderEvent({ order_no: 'W-1001', channel: 'whatsapp', delivery_price: 13, courier_number: 'C7' }, 'paid');
  assert.strictEqual(ev.type, 'paid');
  assert.strictEqual(ev.courier_number, 'C7');

  console.log('OK', { examples: cases.length, upsell: nudge.gap, hs: hsOrder.order_no });
}

module.exports = {
  SUPPORT_TIERS, cafeSupport, deliveryPricing,
  upsellNudge, priceSummary, isApproval,
  paymentRequest, paymentResult,
  HS_STATUS, mapHsItems, hsToOrder, orderEvent,
};
