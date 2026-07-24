// Member 4 - menu inventory seed extracted from SOLSCHEIN_Menu_New_Complete (1).xlsx.
//
// Use this file as the canonical starting point for n8n Data Tables:
// - inventory rows: name, unit, qty_in_stock, low_threshold, unit_cost
// - product rows: sku, name, section, sale_price, available, is_addon, recipe(JSON)
//
// qty_in_stock and unit_cost are intentionally zero here. The cafe fills
// real stock and costs from purchase receipts before go-live.

const DEFAULT_INVENTORY_ITEMS = [
  { name: 'matcha', label: 'Matcha powder', unit: 'g', qty_in_stock: 0, low_threshold: 100, unit_cost: 0 },
  { name: 'coffee-beans', label: 'Coffee beans', unit: 'g', qty_in_stock: 0, low_threshold: 350, unit_cost: 0 },
  { name: 'instant-coffee-tsp', label: 'Nescafe Gold', unit: 'tsp', qty_in_stock: 0, low_threshold: 80, unit_cost: 0 },

  { name: 'cow-milk', label: 'Cow milk', unit: 'ml', qty_in_stock: 0, low_threshold: 4400, unit_cost: 0 },
  { name: 'oat-milk', label: 'Oatly oat milk', unit: 'ml', qty_in_stock: 0, low_threshold: 4400, unit_cost: 0 },
  { name: 'vanilla-alpro-milk', label: 'Alpro vanilla milk', unit: 'ml', qty_in_stock: 0, low_threshold: 2640, unit_cost: 0 },
  { name: 'coconut-alpro-milk', label: 'Alpro coconut milk', unit: 'ml', qty_in_stock: 0, low_threshold: 2640, unit_cost: 0 },
  { name: 'protein-vanilla-milk', label: 'Almarai vanilla protein milk', unit: 'ml', qty_in_stock: 0, low_threshold: 2640, unit_cost: 0 },

  { name: 'ice', label: 'Ice', unit: 'g', qty_in_stock: 0, low_threshold: 8800, unit_cost: 0 },
  { name: 'vanilla-syrup', label: 'Prepared vanilla syrup', unit: 'ml', qty_in_stock: 0, low_threshold: 460, unit_cost: 0 },
  { name: 'caramel-syrup', label: 'Caramel syrup', unit: 'ml', qty_in_stock: 0, low_threshold: 100, unit_cost: 0 },
  { name: 'secret-solschein-syrup', label: 'Secret Solschein syrup', unit: 'ml', qty_in_stock: 0, low_threshold: 460, unit_cost: 0 },
  { name: 'strawberry-syrup', label: 'Prepared strawberry syrup', unit: 'ml', qty_in_stock: 0, low_threshold: 600, unit_cost: 0 },

  { name: 'cold-cup-16oz', label: '16 oz cold cup', unit: 'pieces', qty_in_stock: 0, low_threshold: 50, unit_cost: 0 },
  { name: 'hot-cup-12oz', label: '12 oz hot cup', unit: 'pieces', qty_in_stock: 0, low_threshold: 30, unit_cost: 0 },
  { name: 'cold-lid', label: 'Cold cup lid', unit: 'pieces', qty_in_stock: 0, low_threshold: 50, unit_cost: 0 },
  { name: 'hot-lid', label: 'Hot cup lid', unit: 'pieces', qty_in_stock: 0, low_threshold: 30, unit_cost: 0 },
  { name: 'sleeve', label: 'Hot cup sleeve', unit: 'pieces', qty_in_stock: 0, low_threshold: 30, unit_cost: 0 },
  { name: 'straw', label: 'Straw', unit: 'pieces', qty_in_stock: 0, low_threshold: 50, unit_cost: 0 },
  { name: 'napkin', label: 'Napkin', unit: 'pieces', qty_in_stock: 0, low_threshold: 100, unit_cost: 0 },
  { name: 'bag', label: 'Packaging bag', unit: 'pieces', qty_in_stock: 0, low_threshold: 25, unit_cost: 0 },

  { name: 'chocolate-cookie', label: 'Chocolate Cookie', unit: 'pieces', qty_in_stock: 0, low_threshold: 10, unit_cost: 0 },
  { name: 'brownie-pack-9-mini', label: 'Brownie - 9 mini pieces', unit: 'pieces', qty_in_stock: 0, low_threshold: 10, unit_cost: 0 },
  { name: 'chocolate-muffin', label: 'Chocolate Muffin', unit: 'pieces', qty_in_stock: 0, low_threshold: 10, unit_cost: 0 },
  { name: 'blueberry-muffin', label: 'Blueberry Muffin', unit: 'pieces', qty_in_stock: 0, low_threshold: 10, unit_cost: 0 },
];

const coldCup = [
  { item: 'cold-cup-16oz', qty: 1 },
  { item: 'cold-lid', qty: 1 },
  { item: 'straw', qty: 1 },
];

const hotCup = [
  { item: 'hot-cup-12oz', qty: 1 },
  { item: 'hot-lid', qty: 1 },
  { item: 'sleeve', qty: 1 },
];

const napkin = [{ item: 'napkin', qty: 1 }];

const MENU_PRODUCT_RECIPES = [
  {
    sku: 'vanilla-matcha',
    name: 'Vanilla Matcha',
    section: 'Matcha',
    sale_price: 25,
    available: true,
    is_addon: false,
    recipe: [
      { item: 'matcha', qty: 4 },
      { item: 'vanilla-alpro-milk', qty: 220 },
      { item: 'vanilla-syrup', qty: 23 },
      { item: 'ice', qty: 220 },
      ...coldCup,
    ],
  },
  {
    sku: 'latte-matcha',
    name: 'Latte matcha',
    section: 'Matcha',
    sale_price: 25,
    available: true,
    is_addon: false,
    recipe: [
      { item: 'matcha', qty: 4 },
      { item: 'cow-milk', qty: 220 },
      { item: 'ice', qty: 220 },
      ...coldCup,
    ],
  },
  {
    sku: 'strawberry-matcha',
    name: 'Strawberry Matcha',
    section: 'Matcha',
    sale_price: 26,
    available: true,
    is_addon: false,
    source_note: 'Menu says Vanilla Matcha with homemade strawberry syrup.',
    recipe: [
      { item: 'matcha', qty: 4 },
      { item: 'vanilla-alpro-milk', qty: 220 },
      { item: 'vanilla-syrup', qty: 23 },
      { item: 'strawberry-syrup', qty: 30 },
      { item: 'ice', qty: 220 },
      ...coldCup,
    ],
  },
  {
    sku: 'coconut-matcha',
    name: 'Coconut Matcha',
    section: 'Matcha',
    sale_price: 25,
    available: true,
    is_addon: false,
    recipe: [
      { item: 'matcha', qty: 4 },
      { item: 'coconut-alpro-milk', qty: 220 },
      { item: 'ice', qty: 220 },
      ...coldCup,
    ],
  },
  {
    sku: 'protein-matcha',
    name: 'Protein Matcha',
    section: 'Matcha',
    sale_price: 30,
    available: true,
    is_addon: false,
    recipe: [
      { item: 'matcha', qty: 4 },
      { item: 'protein-vanilla-milk', qty: 220 },
      { item: 'ice', qty: 220 },
      ...coldCup,
    ],
  },
  {
    sku: 'hot-coffee-of-the-day',
    name: 'Hot Coffee of the Day',
    section: 'Coffee',
    sale_price: 12,
    available: true,
    is_addon: false,
    recipe: [{ item: 'coffee-beans', qty: 14 }, ...hotCup, ...napkin],
  },
  {
    sku: 'iced-coffee-of-the-day',
    name: 'Iced Coffee of the Day',
    section: 'Coffee',
    sale_price: 13,
    available: true,
    is_addon: false,
    recipe: [{ item: 'coffee-beans', qty: 14 }, { item: 'ice', qty: 220 }, ...coldCup],
  },
  {
    sku: 'americano-hot',
    name: 'Americano - Hot',
    section: 'Coffee',
    sale_price: 13,
    available: true,
    is_addon: false,
    recipe: [{ item: 'coffee-beans', qty: 17 }, ...hotCup, ...napkin],
  },
  {
    sku: 'americano-iced',
    name: 'Americano - Iced',
    section: 'Coffee',
    sale_price: 13,
    available: true,
    is_addon: false,
    recipe: [{ item: 'coffee-beans', qty: 17 }, { item: 'ice', qty: 220 }, ...coldCup],
  },
  {
    sku: 'hot-latte',
    name: 'Hot Latte',
    section: 'Coffee',
    sale_price: 14,
    available: true,
    is_addon: false,
    source_note: 'Menu does not specify the Nescafe Gold quantity for hot latte; confirm before go-live.',
    option_substitutions: [{ option: 'oat milk', replace_item: 'cow-milk', with_item: 'oat-milk', qty: 120 }],
    recipe: [{ item: 'cow-milk', qty: 120 }, ...hotCup, ...napkin],
  },
  {
    sku: 'iced-latte-vanilla',
    name: 'Iced Latte - Vanilla',
    section: 'Coffee',
    sale_price: 16,
    available: true,
    is_addon: false,
    option_substitutions: [{ option: 'oat milk', replace_item: 'cow-milk', with_item: 'oat-milk', qty: 220 }],
    recipe: [
      { item: 'cow-milk', qty: 220 },
      { item: 'instant-coffee-tsp', qty: 4 },
      { item: 'vanilla-syrup', qty: 23 },
      { item: 'ice', qty: 220 },
      ...coldCup,
    ],
  },
  {
    sku: 'iced-latte-caramel',
    name: 'Iced Latte - Caramel',
    section: 'Coffee',
    sale_price: 16,
    available: true,
    is_addon: false,
    option_substitutions: [{ option: 'oat milk', replace_item: 'cow-milk', with_item: 'oat-milk', qty: 220 }],
    recipe: [
      { item: 'cow-milk', qty: 220 },
      { item: 'instant-coffee-tsp', qty: 4 },
      { item: 'caramel-syrup', qty: 5 },
      { item: 'ice', qty: 220 },
      ...coldCup,
    ],
  },
  {
    sku: 'iced-latte-secret',
    name: 'Iced Latte - Secret Solschein',
    section: 'Coffee',
    sale_price: 16,
    available: true,
    is_addon: false,
    option_substitutions: [{ option: 'oat milk', replace_item: 'cow-milk', with_item: 'oat-milk', qty: 220 }],
    recipe: [
      { item: 'cow-milk', qty: 220 },
      { item: 'instant-coffee-tsp', qty: 4 },
      { item: 'secret-solschein-syrup', qty: 23 },
      { item: 'ice', qty: 220 },
      ...coldCup,
    ],
  },
  {
    sku: 'chocolate-cookie',
    name: 'Chocolate Cookie',
    section: 'Desserts',
    sale_price: 11,
    available: true,
    is_addon: false,
    recipe: [{ item: 'chocolate-cookie', qty: 1 }, ...napkin],
  },
  {
    sku: 'brownie',
    name: 'Brownie',
    section: 'Desserts',
    sale_price: 10,
    available: true,
    is_addon: false,
    recipe: [{ item: 'brownie-pack-9-mini', qty: 1 }, ...napkin],
  },
  {
    sku: 'chocolate-muffin',
    name: 'Chocolate Muffin',
    section: 'Desserts',
    sale_price: 10,
    available: true,
    is_addon: false,
    recipe: [{ item: 'chocolate-muffin', qty: 1 }, ...napkin],
  },
  {
    sku: 'blueberry-muffin',
    name: 'Blueberry Muffin',
    section: 'Desserts',
    sale_price: 10,
    available: true,
    is_addon: false,
    recipe: [{ item: 'blueberry-muffin', qty: 1 }, ...napkin],
  },
  {
    sku: 'extra-matcha',
    name: 'Extra Matcha',
    section: 'Add-ons',
    sale_price: 4,
    available: true,
    is_addon: true,
    recipe: [{ item: 'matcha', qty: 4 }],
  },
  {
    sku: 'extra-espresso-shot',
    name: 'Extra Espresso Shot',
    section: 'Add-ons',
    sale_price: 3,
    available: true,
    is_addon: true,
    source_note: 'Menu says one shot; using the Americano 17 g coffee standard until confirmed.',
    recipe: [{ item: 'coffee-beans', qty: 17 }],
  },
  {
    sku: 'extra-vanilla-syrup',
    name: 'Extra Vanilla Syrup',
    section: 'Add-ons',
    sale_price: 2,
    available: true,
    is_addon: true,
    recipe: [{ item: 'vanilla-syrup', qty: 23 }],
  },
  {
    sku: 'extra-caramel-syrup',
    name: 'Extra Caramel Syrup',
    section: 'Add-ons',
    sale_price: 2,
    available: true,
    is_addon: true,
    recipe: [{ item: 'caramel-syrup', qty: 5 }],
  },
  {
    sku: 'extra-secret-solschein-syrup',
    name: 'Extra Secret Solschein Syrup',
    section: 'Add-ons',
    sale_price: 2,
    available: true,
    is_addon: true,
    recipe: [{ item: 'secret-solschein-syrup', qty: 23 }],
  },
  {
    sku: 'extra-strawberry-syrup',
    name: 'Extra Strawberry Syrup',
    section: 'Add-ons',
    sale_price: 2,
    available: true,
    is_addon: true,
    recipe: [{ item: 'strawberry-syrup', qty: 30 }],
  },
  {
    sku: 'external-ice',
    name: 'External Ice',
    section: 'Add-ons',
    sale_price: 0,
    available: true,
    is_addon: true,
    source_note: 'Added from inventory rule: external ice counts as one cup-equivalent.',
    recipe: [{ item: 'ice', qty: 220 }, { item: 'cold-cup-16oz', qty: 1 }, { item: 'cold-lid', qty: 1 }],
  },
];

function toDataTableInventory(rows = DEFAULT_INVENTORY_ITEMS) {
  return rows.map(({ label, ...row }) => ({ ...row }));
}

function toDataTableProducts(rows = MENU_PRODUCT_RECIPES) {
  return rows.map(({ source_note, option_substitutions, recipe, ...row }) => ({
    ...row,
    recipe: JSON.stringify(recipe),
  }));
}

function indexByName(rows) {
  return Object.fromEntries(rows.map((row) => [row.name, row]));
}

function lowStockInventoryRows(rows) {
  return rows.filter((row) => row.qty_in_stock <= row.low_threshold);
}

if (require.main === module) {
  const assert = require('assert');
  const inventoryRows = toDataTableInventory();
  const productRows = toDataTableProducts();

  const latteMatcha = MENU_PRODUCT_RECIPES.find((p) => p.sku === 'latte-matcha');
  assert.strictEqual(latteMatcha.recipe.find((r) => r.item === 'matcha').qty, 4);
  assert.strictEqual(latteMatcha.recipe.find((r) => r.item === 'cow-milk').qty, 220);
  assert.strictEqual(latteMatcha.recipe.find((r) => r.item === 'ice').qty, 220);

  const inventoryByName = indexByName(inventoryRows);
  assert.strictEqual(inventoryByName.matcha.low_threshold, 100);
  assert.ok(productRows.find((p) => p.sku === 'extra-strawberry-syrup').recipe.includes('strawberry-syrup'));
  assert.ok(lowStockInventoryRows([{ name: 'matcha', qty_in_stock: 90, low_threshold: 100 }]).length === 1);

  console.log('OK', { inventory_rows: inventoryRows.length, product_rows: productRows.length });
}

module.exports = {
  DEFAULT_INVENTORY_ITEMS,
  MENU_PRODUCT_RECIPES,
  toDataTableInventory,
  toDataTableProducts,
  indexByName,
  lowStockInventoryRows,
};
