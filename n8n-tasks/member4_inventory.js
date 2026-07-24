// Member 4 — inventory deduct + low-stock/auto-disable (task 4.4)
// Reference logic for the n8n Code node that runs on order paid/received.
// order.items = JSON string [{sku, qty}]; products/inventory from Data Tables.
//
// Run check: node member4_inventory.js

const CUP_ITEM = 'cup';
const BAG_ITEM = 'bag';

function applyPackagingBagRule(deductions, inventoryByName) {
  const cupEquivalents = deductions[CUP_ITEM] || 0;
  if (cupEquivalents <= 0 || !inventoryByName[BAG_ITEM]) return;

  // One bag carries up to two cup-equivalent items. External ice should
  // include one `cup` in its recipe so it naturally increases this count.
  deductions[BAG_ITEM] = Math.ceil(cupEquivalents / 2);
}

// Returns { deductions: {item: qtyUsed}, newStock: {item: qty}, disable: [item], warn: [item] }
function deductOrder(order, productsBySku, inventoryByName) {
  const items = JSON.parse(order.items); // [{sku, qty}]
  const deductions = {};
  for (const line of items) {
    const product = productsBySku[line.sku];
    if (!product) throw new Error(`order sku not in products: ${line.sku}`);
    const recipe = JSON.parse(product.recipe); // [{item, qty}]
    for (const r of recipe) {
      deductions[r.item] = (deductions[r.item] || 0) + r.qty * line.qty;
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

// --- check: 2x Iced Matcha Latte + external ice -> cups 3, bags 2 ---
const assert = require('assert');
const products = {
  'matcha-iced-latte': {
    recipe: '[{"item":"matcha","qty":5},{"item":"milk","qty":200},{"item":"ice","qty":100},{"item":"cup","qty":1},{"item":"lid","qty":1},{"item":"straw","qty":1}]',
  },
  'external-ice': {
    recipe: '[{"item":"ice","qty":100},{"item":"cup","qty":1},{"item":"lid","qty":1}]',
  },
};
const inventory = {
  matcha: { qty_in_stock: 1000, low_threshold: 100 },
  milk: { qty_in_stock: 5000, low_threshold: 1000 },
  ice: { qty_in_stock: 10000, low_threshold: 1000 },
  cup: { qty_in_stock: 200, low_threshold: 50 },
  bag: { qty_in_stock: 10, low_threshold: 5 },
  lid: { qty_in_stock: 4, low_threshold: 50 },   // low -> warn
  straw: { qty_in_stock: 1, low_threshold: 50 }, // hits 0 → disable
};
const order = { items: '[{"sku":"matcha-iced-latte","qty":2},{"sku":"external-ice","qty":1}]' };
const r = deductOrder(order, products, inventory);
assert.strictEqual(r.deductions.matcha, 10);
assert.strictEqual(r.deductions.milk, 400);
assert.strictEqual(r.deductions.cup, 3);
assert.strictEqual(r.deductions.bag, 2);
assert.deepStrictEqual(r.disable, ['straw']); // 1 - 2 = -1
assert.ok(r.warn.includes('lid'));            // 3 - 2 = 1 < 50
console.log('OK', r);

module.exports = { deductOrder };
