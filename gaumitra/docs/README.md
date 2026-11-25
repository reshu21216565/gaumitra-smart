# Gaumitra – cattle farm marketplace + admin portal

One self-contained file: `index.html` (store and admin together, hash routing, vanilla JS, no build step).

## Files
- `index.html` – the complete site (store and integrated admin portal at `#admin`).
- `admin.html` – the dedicated standalone admin portal.
- `gaumitra-admin/` – the standalone modular admin package (`admin.js`, `admin.css`, `index.html`, `README.md`).
- `source/admin-module.js`, `source/admin-module.css` – the admin portal module code (namespaced under `window.ADM` and `#adm`).
- `source/logo.png`, `source/background.webp` – logo and doodle background assets.
- `docs/PROMPT.md` – prompt that rebuilds the whole project from scratch.
- `docs/capabilities-and-db-rules.json` – platform capabilities and database access rules.

## Running it
- **Locally on any HTTP server (e.g. localhost:3000):** Both the store and admin run in an interactive local mode with a persistent `localStorage` database. Customer orders placed in the store appear in the admin in real time, and admin product edits, stock changes, and order status updates sync back to the store immediately. Photo uploads are supported via in-browser canvas compression, and CSV reports download directly.
- **On claude.ai (as published):** the page uses `claude.use("db" | "user" | "assets" | "downloads" | "sample")`. Publish it with the capabilities in `docs/capabilities-and-db-rules.json`. Share the page with **Contributor** access so customers can place orders; give yourself and staff **Editor** access for the admin.
- **On your own hosting:** replace the `claude.use("db")` layer (search `async function connect()` and `ADM.init`) with your backend. The code uses `collection(name).onSnapshot / doc(id).set / update / delete`, so Firebase Firestore or a REST + WebSocket server maps over directly.

## Data model (collections)
| Collection | Written by | Fields |
|---|---|---|
| products | admin | pid, c (category), n, b (brand), p (price), m (MRP), stock, stockAt, d, img (asset id), active, ts |
| orders | customers | id, kind, ts, items [{id,n,q,p}], total, pay, st (0 placed, 1 packed, 2 out for delivery, 3 delivered, -1 cancelled), ret |
| ordersPII | customers | cust, phone, addr (keyed by order id) |
| appts | customers | like orders, kind "appt", when, st (0 requested … 3 completed) |
| ads | sellers | no (numeric id >= 2000), n, b (city), p, s (breed), d, img (data URL), ts, hidden, sold |
| reviews | customers | pid, pn, name, r (1-5), tx, ts, hidden |
| inquiries | customers | type (contact / bulk / offer), name, phone, msg, done, ts |
| coupons | admin | pct or flat, min, active (doc id = code) |
| settings/store | admin | name, phone, email, freeAbove, shipFee |
| meta/counter | admin | n (admin-created products get pid = 1000 + n) |

## Stock rules
- Available = `stock` minus quantity ordered (not cancelled) after `stockAt`. The admin sets the current stock; the store never writes to products.
- Available 0 shows "Out of stock" (add button disabled). Available 1–4 shows "Only N left". Quantities are capped at the available amount and checkout re-checks.
- Cattle ads and vet services have no stock.

## Known limits
- Anyone with Contributor access can read order contact details (the platform requires read access to be no higher than write access). Encrypt those fields or use a real backend before a public launch.
- Payments are not real. The local sample order's status is simulated (a step every 15 seconds); real orders follow the admin's status.
- The six built-in cattle listings are fixed; only seller-posted ads are manageable in the admin.
