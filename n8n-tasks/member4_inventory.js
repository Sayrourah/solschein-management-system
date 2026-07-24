// Member 4 — inventory deduct + low-stock/auto-disable (task 4.4)
// Reference logic for the n8n Code node that runs on order paid/received.
// order.items = JSON string [{sku, qty}]; products/inventory from Data Tables.
//
// Run check: node member4_inventory.js

const BAG_ITEM = 'bag';
const CUP_EQUIVALENT_ITEMS = new Set(['cup', 'cold-cup-16oz', 'hot-cup-12oz']);

function parseRecipe(product) {
  return typeof product.recipe === 'string' ? JSON.parse(product.recipe) : product.recipe;
}

function addRecipeDeductions(sku, qty, productsBySku, deductions) {
  const product = productsBySku[sku];
  if (!product) throw new Error(`order sku not in products: ${sku}`);
  const recipe = parseRecipe(product); // [{item, qty}]
  for (const r of recipe) {
    deductions[r.item] = (deductions[r.item] || 0) + r.qty * qty;
  }
}

function applyPackagingBagRule(deductions, inventoryByName) {
  const cupEquivalents = Object.entries(deductions).reduce(
    (sum, [item, qty]) => sum + (CUP_EQUIVALENT_ITEMS.has(item) ? qty : 0),
    0
  );
  if (cupEquivalents <= 0 || !inventoryByName[BAG_ITEM]) return;

  // One bag carries up to two cup-equivalent items. External ice should
  // include one `cup` in its recipe so it naturally increases this count.
  deductions[BAG_ITEM] = Math.ceil(cupEquivalents / 2);
}

function buildAdminLowStockAlerts(result, inventoryByName) {
  const lowItems = [...new Set([...(result.warn || []), ...(result.disable || [])])];
  return lowItems.map((item) => {
    const inv = inventoryByName[item];
    const qty = result.newStock[item];
    const unit = inv.unit || '';
    const threshold = inv.low_threshold;
    const status = qty <= 0 ? 'out' : 'low';
    return {
      item,
      status,
      qty_in_stock: qty,
      low_threshold: threshold,
      message: status === 'out'
        ? `Out of stock: ${item} reached ${qty} ${unit}. Products that need it should be disabled.`
        : `Low stock: ${item} has ${qty} ${unit} left, below the ${threshold} ${unit} threshold.`,
    };
  });
}

// Returns { deductions: {item: qtyUsed}, newStock: {item: qty}, disable: [item], warn: [item] }
function deductOrder(order, productsBySku, inventoryByName) {
  const items = JSON.parse(order.items); // [{sku, qty}]
  const deductions = {};
  for (const line of items) {
    addRecipeDeductions(line.sku, line.qty, productsBySku, deductions);
    for (const addonSku of line.addons || []) {
      addRecipeDeductions(addonSku, line.qty, productsBySku, deductions);
    }
  }
  applyPackagingBagRule(deductions, inventoryByName);

  const newStock = {}, disable = new Set(), warn = [];
  for (const [item, used] of Object.entries(deductions)) {
    const inv = inventoryByName[item];
    if (!inv) throw new Error(`recipe item not in inventory: ${item}`);
    newStock[item] = inv.qty_in_stock - used;
    if (newStock[item] <= 0) disable.add(item);
    else if (newStock[item] < inv.low_threshold) warn.push(item);
  }
  return { deductions, newStock, disable: [...disable], warn };
}

// --- check: 2x Matcha Latte + Extra Matcha + external ice -> cups 3, bags 2 ---
const assert = require('assert');
const products = {
  'latte-matcha': {
    recipe: '[{"item":"matcha","qty":4},{"item":"milk","qty":220},{"item":"ice","qty":220},{"item":"cup","qty":1},{"item":"lid","qty":1},{"item":"straw","qty":1}]',
  },
  'extra-matcha': {
    recipe: '[{"item":"matcha","qty":4}]',
  },
  'external-ice': {
    recipe: '[{"item":"ice","qty":220},{"item":"cup","qty":1},{"item":"lid","qty":1}]',
  },
};
const inventory = {
  matcha: { qty_in_stock: 120, low_threshold: 110, unit: 'g' },
  milk: { qty_in_stock: 5000, low_threshold: 1000 },
  ice: { qty_in_stock: 10000, low_threshold: 1000 },
  cup: { qty_in_stock: 200, low_threshold: 50 },
  bag: { qty_in_stock: 10, low_threshold: 5 },
  lid: { qty_in_stock: 4, low_threshold: 50 },   // low -> warn
  straw: { qty_in_stock: 1, low_threshold: 50 }, // hits 0 → disable
};
const order = {
  items: '[{"sku":"latte-matcha","qty":2,"addons":["extra-matcha"]},{"sku":"external-ice","qty":1}]',
};
const r = deductOrder(order, products, inventory);
assert.strictEqual(r.deductions.matcha, 16);
assert.strictEqual(r.deductions.milk, 440);
assert.strictEqual(r.deductions.ice, 660);
assert.strictEqual(r.deductions.cup, 3);
assert.strictEqual(r.deductions.bag, 2);
assert.deepStrictEqual(r.disable, ['straw']); // 1 - 2 = -1
assert.ok(r.warn.includes('matcha'));         // 120 - 16 = 104 < 110
assert.ok(r.warn.includes('lid'));            // 4 - 3 = 1 < 50
const alerts = buildAdminLowStockAlerts(r, inventory);
assert.ok(alerts.some((a) => a.item === 'matcha' && a.message.includes('Low stock')));
console.log('OK', r);

module.exports = { deductOrder, buildAdminLowStockAlerts };
