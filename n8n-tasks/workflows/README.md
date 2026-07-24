# Solschein — n8n workflow exports

Importable JSON for every workflow in project `JET1jtVaCxN3vMTy`, exported from the live n8n
SQLite DB. Import: n8n → **Workflows → Import from File**.

| File | Workflow | ID | Active | Nodes |
|---|---|---|---|---|
| [m1_whatsapp_ordering.json](m1_whatsapp_ordering.json) | WhatsApp Ordering (M1) | `K9ktjkAH1IYK5jh4` | gated | 10 |
| [m2_delivery_couriers.json](m2_delivery_couriers.json) | Delivery & Couriers (M2) | `d4wPbpvRZlCp2k0D` | gated | 19 |
| [m3_pricing_payment.json](m3_pricing_payment.json) | Pricing & Payment (M3) | `MFvdPL38Og8eJk1j` | gated | 23 |
| [m3_hungerstation.json](m3_hungerstation.json) | HungerStation Channel (M3) | `a5p3DJqxI5ycGAae` | gated | 11 |
| [m4_order_events.json](m4_order_events.json) | Order Events / Inventory (M4) | `1jNMPpXDyhlt99B8` | **ACTIVE** | 9 |
| [m4_dashboard.json](m4_dashboard.json) | Café Dashboard (M4) | `gCEvSL04reabbDfq` | **ACTIVE** | 7 |

## After importing
- **Data Tables:** all workflows reference the 5 shared Data Tables by ID (orders `hWfPbrXmGYFK3ZNW`,
  products `bgJbtTjZ6oGjWJNB`, inventory `oSXZXOU4SvH6f5OS`, couriers `zdaBo4Uw6U6dSS15`,
  purchases `3FkHAa8Xpeqg6upr`). Re-point if importing to a different instance.
- **Credentials to attach (gated workflows):** Meta WhatsApp (M1/M2/M3 send nodes + phoneNumberId),
  payment gateway on M3 *Create Payment Link*, HungerStation API on M3 HS HTTP nodes.
- **Cross-workflow URLs** use `http://localhost:5678/webhook/<path>` (no id prefix). Change the host
  if the instance moves.

Exported as `{name, nodes, connections, settings, pinData, meta}` — the standard n8n import shape.
