// Member 1 — pickup "ready" -> customer "I'm here" -> notify owners (tail of 1.5)
// Reference logic for n8n Code nodes. Closes the pickup loop after payment:
//   paid -> (cafe marks Ready) -> "ready for pickup" msg -> customer "I'm here"
//   -> owner notification on the M4 dashboard.
// Session state machine (M1): ... -> paid -> ready -> here
//
// Run check: node member1_pickup.js

// Customer "I'm here" reply, bilingual. Matched loosely (trim + lowercase).
const HERE_PHRASES = ['وصلت', 'انا هنا', 'أنا هنا', "i'm here", 'im here', 'here', 'arrived'];

function isHereReply(text) {
  if (!text) return false;
  const t = String(text).trim().toLowerCase();
  return HERE_PHRASES.some((p) => t === p || t.includes(p));
}

// Café marks the order Ready in the dashboard -> M1 pushes this to the customer.
// Only valid once the order is paid; guards against premature "ready" pings.
function readyForPickupMessage(order) {
  if (order.status !== 'Ready') throw new Error(`order ${order.order_no} not Ready (${order.status})`);
  return (
    `✅ طلبك رقم ${order.order_no} جاهز للاستلام / Order ${order.order_no} is ready for pickup.\n` +
    `تفضل بالمرور على المقهى. عند وصولك أرسل "وصلت".\n` +
    `Come by the café — reply "I'm here" when you arrive.`
  );
}

// Session transition on café "Ready": paid -> ready. Returns the outbound message.
function markReady(session, order) {
  if (session.state !== 'paid') throw new Error(`cannot mark ready from state ${session.state}`);
  session.state = 'ready';
  return { session, message: readyForPickupMessage(order) };
}

// Owner-facing dashboard notification when the customer arrives. Modeled as an
// event on the same internal bus M4 already consumes (see PROGRESS event contract)
// -> no new orders column required.
function ownerArrivalEvent(order, { now = new Date() } = {}) {
  return {
    type: 'customer_arrived',
    order_no: order.order_no,
    channel: order.channel || 'whatsapp',
    customer_number: order.customer_number,
    fulfillment: 'pickup',
    message: `📍 وصل العميل لاستلام الطلب رقم ${order.order_no} / Customer arrived for order ${order.order_no}.`,
    at: now.toISOString(),
  };
}

// Customer sent "I'm here". Valid only after the order is Ready (state 'ready').
// Returns { ok, session, event?, reply }. If they arrive too early, we tell them.
function handleHereReply(session, order, opts = {}) {
  if (session.state === 'ready') {
    session.state = 'here';
    return {
      ok: true,
      session,
      event: ownerArrivalEvent(order, opts),
      reply: 'شكرًا! أبلغنا المقهى بوصولك / Thanks! We let the café know you have arrived.',
    };
  }
  // Paid but not yet marked ready -> reassure, no owner ping.
  return {
    ok: false,
    session,
    reply: 'طلبك قيد التجهيز، سنخبرك فور جاهزيته / Your order is still being prepared — we\'ll message you when it\'s ready.',
  };
}

// --- checks ------------------------------------------------------------------
if (require.main === module) {
  const assert = require('assert');

  // reply detection: bilingual, tolerant of surrounding text/case
  assert.ok(isHereReply('وصلت'));
  assert.ok(isHereReply("I'm Here"));
  assert.ok(isHereReply('  here  '));
  assert.ok(isHereReply('انا هنا عند الباب'));
  assert.ok(!isHereReply('كم يستغرق الطلب؟'));
  assert.ok(!isHereReply(''));

  const order = { order_no: 'W-1001', channel: 'whatsapp', customer_number: '966500000000', status: 'Paid' };

  // premature "I'm here" (paid, not ready) -> no owner event
  let session = { number: order.customer_number, state: 'paid', fulfillment: 'pickup', cart: [] };
  const early = handleHereReply(session, order);
  assert.strictEqual(early.ok, false);
  assert.strictEqual(early.event, undefined);
  assert.strictEqual(session.state, 'paid');

  // café marks Ready -> ready message + state moves
  order.status = 'Ready';
  const ready = markReady(session, order);
  assert.strictEqual(session.state, 'ready');
  assert.ok(ready.message.includes('W-1001'));

  // customer "I'm here" after Ready -> owner event fires, state -> here
  const arrived = handleHereReply(session, order, { now: new Date('2026-07-24T10:00:00Z') });
  assert.strictEqual(arrived.ok, true);
  assert.strictEqual(session.state, 'here');
  assert.strictEqual(arrived.event.type, 'customer_arrived');
  assert.strictEqual(arrived.event.order_no, 'W-1001');
  assert.strictEqual(arrived.event.at, '2026-07-24T10:00:00.000Z');

  // guard: can't mark ready twice / from wrong state
  assert.throws(() => markReady(session, order));

  console.log('OK', { state: session.state, event: arrived.event.type });
}

module.exports = {
  HERE_PHRASES, isHereReply, readyForPickupMessage,
  markReady, ownerArrivalEvent, handleHereReply,
};
