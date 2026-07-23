// Member 1 — menu display + main-menu routing (tasks 1.1, 1.2)
// Reference logic for n8n Code nodes. Products come from M4 `products` Data Table.
//
// Run check: node member1_menu.js

const SECTIONS = ['Matcha', 'Coffee', 'Desserts', 'Add-ons', 'Offers'];

// Respect the "Product Unavailable" flag. M4 sets available=false on zero stock
// (auto-disable), so this one check covers both manual and auto disabling.
function isAvailable(p) {
  return p.available === true;
}

// Group available products by section. Add-ons section = is_addon rows.
// Empty sections are dropped. Offers is M3 territory (discounts) — omit unless seeded.
function menuBySection(products) {
  const grouped = {};
  for (const p of products) {
    if (!isAvailable(p)) continue;
    const section = p.is_addon ? 'Add-ons' : p.section;
    (grouped[section] ||= []).push(p);
  }
  return SECTIONS.filter((s) => grouped[s]).map((s) => ({ section: s, items: grouped[s] }));
}

// WhatsApp menu text.
function renderMenu(grouped) {
  return grouped
    .map(({ section, items }) => {
      const lines = items.map((p) => `  • ${p.name} — ${p.sale_price} SAR`).join('\n');
      return `*${section}*\n${lines}`;
    })
    .join('\n\n');
}

// 1.1 main menu router. Maps the customer's reply to the next flow.
const MAIN_MENU = [
  { key: '1', label: 'New order', route: 'menu' },
  { key: '2', label: 'Track current order', route: 'track' },
  { key: '3', label: 'Reorder last', route: 'reorder' },
  { key: '4', label: 'Talk to staff', route: 'staff' },
];

function routeMainMenu(reply) {
  const hit = MAIN_MENU.find((o) => o.key === String(reply).trim());
  return hit ? hit.route : null; // null => re-prompt
}

// --- checks ------------------------------------------------------------------
if (require.main === module) {
  const assert = require('assert');
  const products = [
    { sku: 'm1', name: 'Iced Matcha Latte', section: 'Matcha', sale_price: 10, available: true, is_addon: false },
    { sku: 'm2', name: 'Matcha Frappe', section: 'Matcha', sale_price: 12, available: false, is_addon: false }, // hidden
    { sku: 'c1', name: 'Flat White', section: 'Coffee', sale_price: 9, available: true, is_addon: false },
    { sku: 'a1', name: 'Extra Shot', section: 'Add-ons', sale_price: 2, available: true, is_addon: true },
  ];

  const grouped = menuBySection(products);
  assert.deepStrictEqual(grouped.map((g) => g.section), ['Matcha', 'Coffee', 'Add-ons']);
  assert.strictEqual(grouped[0].items.length, 1); // unavailable Frappe excluded
  assert.ok(renderMenu(grouped).includes('Iced Matcha Latte — 10 SAR'));

  assert.strictEqual(routeMainMenu('3'), 'reorder');
  assert.strictEqual(routeMainMenu(' 1 '), 'menu');
  assert.strictEqual(routeMainMenu('9'), null);

  console.log('OK', { sections: grouped.map((g) => g.section) });
}

module.exports = { SECTIONS, isAvailable, menuBySection, renderMenu, MAIN_MENU, routeMainMenu };
