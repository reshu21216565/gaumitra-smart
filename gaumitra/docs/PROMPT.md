# Prompt: build "Gaumitra" – cattle-farm marketplace + admin portal

Build ONE self-contained HTML file (vanilla JS, hash routing, no frameworks, no external scripts; Google Fonts only) for **Gaumitra**, a one-stop online platform for cattle farmers in India: buy and sell cattle, and buy feed, medicines, tools, dairy products, manure and vet services. It includes a storefront and an admin portal at `#admin` (Editors only) that share one database. It must work for children, elderly people, busy people, new phone users and people with basic education.

## Design
- Professional commercial look, not cartoonish: white and warm-grey surfaces, one deep green accent (#14452C; lighter green in dark mode), thin line icons, no emoji or clip-art, neutral grey product image panels with a small uppercase category label.
- Inter (plus Noto Sans Devanagari and Noto Sans Telugu). Large tap targets (44px+), clear focus rings, responsive (filters collapse on phones), dark mode toggle, respects reduced motion and safe-area insets.
- The supplied logo appears in the header, footer and admin sidebar. The supplied doodle illustration is a faint fixed full-page background behind everything (much fainter in dark mode, hidden in print) and never reduces readability.

## Storefront
- Top strip: "Free delivery above ₹999 · Call: [PHONE]", language buttons EN / हिं / తె, Listen (speech synthesis), theme toggle. Header: logo, search with category picker and suggestions, Account, Wishlist, Cart (badges). Category bar: Cattle, Feed, Medicine, Tools, Dairy, Manure, Vet services, Offers, Help (plus Admin for editors).
- Home: headline, shop and sell buttons, popular searches, category cards with counts, deals of the day, top rated, recently viewed, trust points.
- Category and search pages: left filter panel (price ranges, rating, brand or location, type or breed), sort (popular, price, rating), result count, clear filters.
- Product page: image, brand, rating, price/MRP/% off, stock badge, quantity, add to cart, buy now, wishlist, delivery pincode check, details table, reviews (read and write), related and recently viewed. Cattle pages instead have make-an-offer, call and share.
- Cart with quantity change and remove, coupon codes, delivery fee (free above the threshold), checkout with address and payment choice (UPI, cash on delivery, card – demo, no real payment), order tracking timeline (placed, packed, out for delivery, delivered), cancel before shipping, return request after delivery, printable summary.
- Vet booking (service, date, time slot, address, phone) with its own tracking timeline.
- Sell your animal: animal, breed, age, milk per day, price, city, phone, description, photo upload (compressed in the browser); posted ads go live immediately; "My ads" page to mark sold or delete.
- Account (profile saved on the device, orders, wishlist, ads, enquiries), Offers page (coupons), Help centre (FAQ, contact form, bulk quote request).
- AI assistant button (chat in the selected language, simple words, no drug doses, suggests booking a vet for sick animals).
- Do NOT include any "verified cattle" feature, button, badge or page.

## Stock behaviour
- Available stock = admin-set stock minus quantities in non-cancelled orders placed after the admin last set the stock. Customers never write to products.
- Available 0: "Out of stock" badge and a disabled add/buy button. Available 1–4: "Only N left". Cap quantities at available stock (product page, cart, add) and re-check at checkout. Cattle ads and vet services are not stock-tracked.

## Languages
Full English, Hindi and Telugu for every label, message, product name and description, filters, FAQ, forms, coupons and footer. Brand names, coupon codes and phone/email placeholders stay as they are.

## Admin portal (route `#admin`, same page, own scoped CSS and namespaced JS)
Sidebar: Dashboard, Orders, Products, Cattle ads, Vet appointments, Reviews, Inquiries, Coupons, Customers, Settings, "Back to store".
- Dashboard: revenue, orders, open orders, average order value, low-or-out-of-stock count, live cattle ads; 7-day revenue bars, orders-by-status bars, recent orders, needs-attention list. Empty state with "Load sample data".
- Orders: status chips and search; change status from a dropdown; detail dialog (items, customer, address, payment) with advance, cancel and print.
- Products: search and category filter; add/edit dialog (name, category, brand, price, MRP, stock, description, photo upload via assets); inline stock editing that shows available stock with Out of stock / Limited badges; visibility toggle; delete (built-in products are hidden instead). New products get a pid from `meta/counter` (1000 + n).
- Cattle ads: Live and Hidden tabs, hide/show, remove. No verification step.
- Vet appointments (status dropdown), Reviews (hide/show/delete), Inquiries (mark resolved), Coupons (percent or flat, minimum order, active, delete), Customers (derived from orders), Settings (store name, phone, email, free-delivery limit, delivery fee, CSV export of orders and products, reload sample data with confirmation).
- Everyone who can open it sees a read-only view unless they have Editor access. Destructive actions ask for confirmation.

## Shared database (Firestore-style API: collection/doc, onSnapshot, set, update, delete)
Collections and fields: products, orders, ordersPII, appts, ads, reviews, inquiries, coupons, settings/store, meta/counter (see docs/README.md). The store reads products, ads, orders, appts, reviews, coupons and settings live, overlays them on the built-in catalogue (ids 0–31; admin-created products use ids >= 1000, ads >= 2000), and writes orders, order contact details, appointments, reviews, inquiries and ads. Order ids must be unique per customer. If the database or write access is missing, fall back to local mode and tell the customer the order is saved on the device only.
Access rules: products, coupons, settings, meta – read all, write admin; orders, appts, reviews, ads – read all, write contributors; ordersPII, inquiries – read and write contributors.

## Quality bar
Test every route in all three languages, the admin flows (seed, change status, edit stock, add product, hide ad), the stock badges and limits, and the order from store to admin to tracking page, with no console errors.
