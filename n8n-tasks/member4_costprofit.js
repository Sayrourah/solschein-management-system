// Member 4 — cost/profit engine (task 4.5)
// Reference logic. Drop the body of costProfit() into an n8n Code node;
// inventory[] and product come from the `inventory` + `products` Data Tables.
// recipe is the JSON string stored on the product row.
//
// Run check: node member4_costprofit.js

function costProfit(product, inventoryByName) {
  const recipe = JSON.parse(product.recipe); // [{item, qty}]
  const cost = recipe.reduce((sum, line) => {
    const inv = inventoryByName[line.item];
    if (!inv) throw new Error(`recipe item not in inventory: ${line.item}`);
    return sum + line.qty * inv.unit_cost;
  }, 0);
  const profit = product.sale_price - cost;
  const margin = product.sale_price ? (profit / product.sale_price) * 100 : 0;
  return {
    cost: +cost.toFixed(2),
    profit: +profit.toFixed(2),
    margin: +margin.toFixed(2),
  };
}

// --- check: spec Iced Matcha Latte → cost 3.80, profit 6.20, margin 62% ---
const assert = require('assert');
const inv = {
  matcha: { unit_cost: 0.2 },
  milk: { unit_cost: 0.01 },
  ice: { unit_cost: 0 },
  cup: { unit_cost: 0.5 },
  lid: { unit_cost: 0.2 },
  straw: { unit_cost: 0.1 },
};
const product = {
  sale_price: 10,
  recipe: '[{"item":"matcha","qty":5},{"item":"milk","qty":200},{"item":"ice","qty":100},{"item":"cup","qty":1},{"item":"lid","qty":1},{"item":"straw","qty":1}]',
};
const r = costProfit(product, inv);
assert.strictEqual(r.cost, 3.8, `cost ${r.cost}`);
assert.strictEqual(r.profit, 6.2, `profit ${r.profit}`);
assert.strictEqual(r.margin, 62, `margin ${r.margin}`);
console.log('OK', r);

module.exports = { costProfit };
