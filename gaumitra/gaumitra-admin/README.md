# Gaumitra admin portal

Files
- index.html  standalone admin page (open or publish this one)
- admin.js    the admin module on its own (window.ADM with render() and init())
- admin.css   admin styles, all scoped under #adm

Run it
Publish index.html as an artifact on claude.ai with these capabilities:
{"db":{"rules":[
  {"path":"products","read":"view","write":"admin"},
  {"path":"coupons","read":"view","write":"admin"},
  {"path":"settings","read":"view","write":"admin"},
  {"path":"meta","read":"view","write":"admin"},
  {"path":"orders","read":"view","write":"interact"},
  {"path":"ordersPII","read":"interact","write":"interact"},
  {"path":"appts","read":"view","write":"interact"},
  {"path":"reviews","read":"view","write":"interact"},
  {"path":"inquiries","read":"interact","write":"interact"},
  {"path":"ads","read":"view","write":"interact"}]},
 "user":{},"assets":{},"downloads":true}
Only people with Editor access can change data. The first time, open Dashboard and press "Load sample data".

Collections
- products   {pid,c,n,b,p,m,stock,stockAt,d,img,active,ts}   pid 6-31 = built-in store items, 1001+ = added in admin
- orders     {id,kind,items:[{id,n,q,p}],total,pay,st,ts}      st: 0 placed, 1 packed, 2 out for delivery, 3 delivered, -1 cancelled
- ordersPII  {cust,phone,addr}                                 same id as the order or appointment
- appts      {id,kind:"appt",items,total,st,when,pay,ts}       st: 0 requested, 1 confirmed, 2 vet on the way, 3 completed
- ads        {no,n,b,p,s,d,img,hidden,sold,ts}                 cattle ads posted by sellers
- reviews    {pid,pn,name,r,tx,hidden,ts}
- inquiries  {type:"contact|bulk|offer",name,phone,msg,done,ts}
- coupons    {pct or flat,min,active}   doc id is the code
- settings   store: {name,phone,email,freeAbove,shipFee}
- meta       counter: {n}   used to number new products

Stock rule
Available = stock - units sold in non-cancelled orders placed after stockAt.
0 shows "Out of stock", fewer than 5 shows "Only N left" in the store.
Editing stock in the admin sets stock to the new number and stockAt to now.

Known limits
- Customer names, phones and addresses sit in ordersPII, which any contributor can read. Add encryption or a real backend before a public launch.
- Photos use the assets capability (product form) and are stored as /_blob/<id>.
- The same module also runs inside the storefront page at #admin (storefront file gaumitra-pro.html).
