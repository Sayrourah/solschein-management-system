# Solschein — n8n workflow exports

One system — **Solschein Management System** — split across 6 n8n workflows (the M1–M4 codes were
just how the build was divided between developers; the running system is one product). All 6 live
in project `JET1jtVaCxN3vMTy`, carry the tag **`Solschein System`**, and are wired together (see
"How they link" below). Exported from the live n8n SQLite DB. Import: n8n → **Workflows → Import
from File**.

| File | Workflow | ID | Active | Nodes |
|---|---|---|---|---|
| [m1_whatsapp_ordering.json](m1_whatsapp_ordering.json) | Solschein · WhatsApp Ordering | `K9ktjkAH1IYK5jh4` | gated | 10 |
| [m2_delivery_couriers.json](m2_delivery_couriers.json) | Solschein · Delivery & Couriers | `d4wPbpvRZlCp2k0D` | gated | 19 |
| [m3_pricing_payment.json](m3_pricing_payment.json) | Solschein · Pricing & Payment | `MFvdPL38Og8eJk1j` | gated | 23 |
| [m3_hungerstation.json](m3_hungerstation.json) | Solschein · HungerStation Orders | `a5p3DJqxI5ycGAae` | gated | 11 |
| [m4_order_events.json](m4_order_events.json) | Solschein · Inventory Events | `1jNMPpXDyhlt99B8` | **ACTIVE** | 9 |
| [m4_dashboard.json](m4_dashboard.json) | Solschein · Dashboard | `gCEvSL04reabbDfq` | **ACTIVE** | 7 |

## How they link (one system, many flows)
- **Ordering → Payment:** WhatsApp Ordering agent calls `POST /webhook/m3/checkout` (pickup) via its `send_payment_request` tool.
- **Payment → Inventory:** on paid, Pricing & Payment `POST /webhook/internal/order-paid` → Inventory Events deducts stock + auto-disables zero-stock products.
- **HungerStation → Inventory:** on received, HungerStation Orders `POST /webhook/internal/order-received` → same deduction.
- **Dashboard** reads every shared Data Table and shows the whole system (orders both channels, cost/profit, inventory).
- Kept as separate workflows on purpose: independent activation (the Inventory + Dashboard pair runs live with no credentials, while the WhatsApp/gateway flows stay gated until their creds are attached) and independent editing. Merging onto one canvas would force a single active toggle and take the live pair offline until every credential exists.

## After importing
- **Data Tables:** all workflows reference the 5 shared Data Tables by ID (orders `hWfPbrXmGYFK3ZNW`,
  products `bgJbtTjZ6oGjWJNB`, inventory `oSXZXOU4SvH6f5OS`, couriers `zdaBo4Uw6U6dSS15`,
  purchases `3FkHAa8Xpeqg6upr`). Re-point if importing to a different instance.
- **Credentials to attach (gated workflows):** Meta WhatsApp (M1/M2/M3 send nodes + phoneNumberId),
  payment gateway on M3 *Create Payment Link*, HungerStation API on M3 HS HTTP nodes.
- **Cross-workflow URLs** use `http://localhost:5678/webhook/<path>` (no id prefix). Change the host
  if the instance moves.

Exported as `{name, nodes, connections, settings, pinData, meta}` — the standard n8n import shape.
