// Member 2 — delivery & courier coordination (tasks 2.1–2.7)
// Reference logic. Drop bodies into n8n Code nodes. Reads/writes M4 Data Tables
// `couriers` (zdaBo4Uw6U6dSS15) and `orders` (hWfPbrXmGYFK3ZNW). Money/discount
// is Member 3 — M2 only produces the *courier* price and hands it over.
// Order status strings match M4's 16-status set (task 4.3).
//
// Run check: node member2_delivery.js

// Café origin (placeholder — set to the real café coords before go-live). ponytail:
// hardcoded constant, move to a config Data Table only if a second branch opens.
const CAFE = { lat: 24.7136, lon: 46.6753 }; // Riyadh

// --- 2.1 location -> distance, price estimate, time ---------------------------
function haversineKm(a, b) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// Preliminary estimate shown to customer before real bids come in.
// low = base + perKm; high = low + courier spread. Travel 0.5 km/min (~30 km/h).
function estimateDelivery(distanceKm, { prepMin = 10 } = {}) {
  const low = Math.round(6 + 2.8 * distanceKm);
  const high = low + 5;
  const minutes = prepMin + Math.round(distanceKm / 0.5);
  return { distanceKm: +distanceKm.toFixed(2), low, high, minutes };
}

function estimateFromLocation(loc, opts) {
  return estimateDelivery(haversineKm(CAFE, loc), opts);
}

// --- 2.2 bidding -------------------------------------------------------------
// Pick 3–5 couriers: prefer ones serving the neighborhood, best rating / fewest
// cancellations first; top up with best others if the neighborhood is thin.
function selectBidCouriers(couriers, neighborhood, n = 5) {
  const serves = (c) =>
    (c.neighborhoods || '')
      .toLowerCase()
      .split(/[,;/]/)
      .map((s) => s.trim())
      .includes((neighborhood || '').toLowerCase());
  const rank = (a, b) =>
    (b.rating || 0) - (a.rating || 0) ||
    (a.cancellations || 0) - (b.cancellations || 0) ||
    (b.completed_orders || 0) - (a.completed_orders || 0);
  const local = couriers.filter(serves).sort(rank);
  const rest = couriers.filter((c) => !serves(c)).sort(rank);
  return [...local, ...rest].slice(0, n);
}

// Bid request sent to couriers. MUST NOT leak customer PII (name/number/exact
// location) or order contents at this stage (task 2.2).
function bidRequestMessage({ requestNo, neighborhood, distanceKm, readyInMin }) {
  return (
    `Solschein delivery request #${requestNo}\n` +
    `Pickup: Café Solschein\n` +
    `Drop-off: ${neighborhood} (~${distanceKm.toFixed(1)} km)\n` +
    `Ready in: ${readyInMin} min\n` +
    `Reply with your price + arrival time (e.g. "15 SAR, arrive in 10 min").`
  );
}

// Parse a courier reply like "15 SAR, arrive in 10 min" -> {price, etaMin}.
function parseBid(text) {
  const t = String(text);
  const priceM = t.match(/(\d+(?:\.\d+)?)\s*(?:sar|ريال|ر\.?\s*س)/i) || t.match(/(\d+(?:\.\d+)?)/);
  const etaM = t.match(/(\d+)\s*(?:min|minute|mins|m\b|دقيق)/i);
  if (!priceM) return null;
  return { price: +priceM[1], etaMin: etaM ? +etaM[1] : null };
}

// --- 2.3 selection -----------------------------------------------------------
// Lower score = better. Cheapest is NOT always chosen: rating and cancellations
// are weighted so a reliable courier beats a slightly cheaper flaky one.
function scoreOffer(offer, stats = {}) {
  const price = offer.price ?? 999;
  const eta = offer.etaMin ?? 30;
  const rating = stats.rating ?? 3; // unknown courier = neutral
  const cancels = stats.cancellations ?? 0;
  return price * 1.0 + eta * 0.5 + (5 - rating) * 2.0 + cancels * 3.0;
}

function chooseCourier(offers, statsByNumber = {}) {
  if (!offers.length) return { winner: null, losers: [], scored: [] };
  const scored = offers
    .map((o) => ({ ...o, score: +scoreOffer(o, statsByNumber[o.courier_number]).toFixed(2) }))
    .sort((a, b) => a.score - b.score);
  const [winner, ...losers] = scored;
  return { winner, losers, scored };
}

// --- 2.4 confirmation fan-out ------------------------------------------------
function confirmMessage({ requestNo, orderNo, readyInMin, pickupLink }) {
  return (
    `Request #${requestNo} confirmed ✅\n` +
    `Pickup: Café Solschein${pickupLink ? ` — ${pickupLink}` : ''}\n` +
    `Ready in: ${readyInMin} min\n` +
    `On arrival at the café send: arrived ${orderNo}`
  );
}
const rejectMessage = ({ requestNo }) =>
  `Request #${requestNo} was assigned to another courier. Thank you 🙏`;

// --- 2.5 command-driven delivery flow ----------------------------------------
// Parse courier WhatsApp commands keyed by order no. Returns null for non-commands
// (e.g. a bid reply) so the router can fall through.
function parseCommand(text) {
  const t = String(text).trim().toLowerCase();
  let m;
  if ((m = t.match(/^arrived\s+(\d+)/))) return { cmd: 'arrived', orderNo: m[1] };
  if ((m = t.match(/^picked\s*up\s+(\d+)/))) return { cmd: 'picked up', orderNo: m[1] };
  if ((m = t.match(/^near\s+(\d+)/))) return { cmd: 'near', orderNo: m[1] };
  if ((m = t.match(/^deliver\s+(\d+)\s+(\d{4})\b/)))
    return { cmd: 'deliver', orderNo: m[1], code: m[2] };
  return null;
}

const CMD_STATUS = {
  arrived: 'Courier arrived',
  'picked up': 'Picked up',
  near: 'Courier near',
  deliver: 'Delivered',
};
const commandToStatus = (cmd) => CMD_STATUS[cmd] || null;

// 4-digit delivery code: generated + sent to customer, validated on `deliver`.
const genCode = () => String(Math.floor(1000 + Math.random() * 9000));
const validateCode = (order, code) => String(order.delivery_code) === String(code).trim();

// --- 2.6 courier log ---------------------------------------------------------
// Update stats after an order closes. avg_price / rating are running means over
// completed orders; cancels increment on cancel.
function updateCourierStats(c, { outcome, price, rating, punctual, note } = {}) {
  const next = { ...c };
  if (outcome === 'completed') {
    const n = c.completed_orders || 0;
    if (price != null) next.avg_price = +(((c.avg_price || 0) * n + price) / (n + 1)).toFixed(2);
    if (rating != null) next.rating = +(((c.rating || 0) * n + rating) / (n + 1)).toFixed(2);
    next.completed_orders = n + 1;
    if (punctual != null) next.punctual = punctual;
  } else if (outcome === 'cancelled') {
    next.cancellations = (c.cancellations || 0) + 1;
  }
  if (note) next.notes = [c.notes, note].filter(Boolean).join(' | ');
  return next;
}

// --- 2.7 problem handling ----------------------------------------------------
const NO_BID_OPTIONS = [
  'Wait a little longer for a courier',
  'Offer a higher delivery price',
  'Switch to pickup from the café',
  'Cancel the order',
];
const noBidOptions = () => [...NO_BID_OPTIONS];

// Courier cancelled: pick a replacement from remaining offers; re-approve with the
// customer (via M3) only if the new courier price differs from the approved one.
function onCourierCancel(order, remainingOffers, statsByNumber = {}) {
  const { winner } = chooseCourier(remainingOffers, statsByNumber);
  if (!winner) return { winner: null, reapprove: false, options: noBidOptions() };
  return { winner, reapprove: winner.price !== order.courier_price, newCourierPrice: winner.price };
}

// --- checks ------------------------------------------------------------------
if (require.main === module) {
  const assert = require('assert');

  // 2.1 distance + estimate. Point ~2.5 km from café.
  const near = { lat: 24.7136, lon: 46.6753 + 0.0247 }; // ~2.5 km east
  const est = estimateFromLocation(near);
  assert.ok(est.distanceKm > 2.3 && est.distanceKm < 2.7, `dist ${est.distanceKm}`);
  assert.strictEqual(est.high - est.low, 5);

  // 2.2 bid parse + no-PII bid message
  assert.deepStrictEqual(parseBid('15 SAR, arrive in 10 min'), { price: 15, etaMin: 10 });
  assert.deepStrictEqual(parseBid('12 ريال خلال 8 دقيقة'), { price: 12, etaMin: 8 });
  const bidMsg = bidRequestMessage({ requestNo: 154, neighborhood: 'Al Malqa', distanceKm: 2.5, readyInMin: 12 });
  assert.ok(!/9665|customer|name/i.test(bidMsg), 'bid message must not leak PII');

  // 2.2 courier selection prefers neighborhood + rating
  const couriers = [
    { number: '1', neighborhoods: 'Al Malqa, Al Yasmin', rating: 4.8, cancellations: 0, completed_orders: 50 },
    { number: '2', neighborhoods: 'Olaya', rating: 4.9, cancellations: 0, completed_orders: 80 },
    { number: '3', neighborhoods: 'Al Malqa', rating: 3.0, cancellations: 5, completed_orders: 10 },
  ];
  const picked = selectBidCouriers(couriers, 'Al Malqa', 5).map((c) => c.number);
  assert.strictEqual(picked[0], '1', 'best local courier first');

  // 2.3 reliable beats cheapest
  const offers = [
    { courier_number: 'A', price: 12, etaMin: 15 }, // cheap but flaky
    { courier_number: 'B', price: 15, etaMin: 10 }, // pricier, reliable
  ];
  const stats = {
    A: { rating: 2.5, cancellations: 4 },
    B: { rating: 4.9, cancellations: 0 },
  };
  assert.strictEqual(chooseCourier(offers, stats).winner.courier_number, 'B', 'cheapest not always chosen');

  // 2.5 command parsing + status + code
  assert.deepStrictEqual(parseCommand('arrived 154'), { cmd: 'arrived', orderNo: '154' });
  assert.deepStrictEqual(parseCommand('picked up 154'), { cmd: 'picked up', orderNo: '154' });
  assert.deepStrictEqual(parseCommand('deliver 154 4832'), { cmd: 'deliver', orderNo: '154', code: '4832' });
  assert.strictEqual(parseCommand('15 SAR arrive 10 min'), null); // bid, not a command
  assert.strictEqual(commandToStatus('near'), 'Courier near');
  assert.ok(/^\d{4}$/.test(genCode()));
  assert.ok(validateCode({ delivery_code: '4832' }, '4832'));
  assert.ok(!validateCode({ delivery_code: '4832' }, '0000'));

  // 2.6 courier log running means
  const c0 = { completed_orders: 1, avg_price: 10, rating: 4, cancellations: 0 };
  const c1 = updateCourierStats(c0, { outcome: 'completed', price: 20, rating: 5 });
  assert.strictEqual(c1.completed_orders, 2);
  assert.strictEqual(c1.avg_price, 15); // (10+20)/2
  assert.strictEqual(c1.rating, 4.5); // (4+5)/2
  assert.strictEqual(updateCourierStats(c0, { outcome: 'cancelled' }).cancellations, 1);

  // 2.7 cancel -> replacement + reapprove only on price change
  const rep = onCourierCancel({ courier_price: 15 }, [{ courier_number: 'C', price: 18, etaMin: 12 }]);
  assert.strictEqual(rep.reapprove, true);
  assert.strictEqual(onCourierCancel({ courier_price: 15 }, [{ courier_number: 'C', price: 15, etaMin: 12 }]).reapprove, false);

  console.log('OK', { est, winner: 'B' });
}

module.exports = {
  CAFE, haversineKm, estimateDelivery, estimateFromLocation,
  selectBidCouriers, bidRequestMessage, parseBid,
  scoreOffer, chooseCourier, confirmMessage, rejectMessage,
  parseCommand, commandToStatus, genCode, validateCode,
  updateCourierStats, noBidOptions, onCourierCancel,
};
