# GauMitra – Cattle, Feed, Medicines & Equipment Platform

A comprehensive Indian dairy & livestock platform featuring a full customer storefront, integrated merchant/admin management portal, and an intelligent multilingual AI farm assistant powered by Groq.

---

## 🌟 Key Features

### 1. Storefront & Cattle Marketplace
- **Live Cattle & Buffaloes**: Browse verified cows (Gir, Sahiwal, Jersey), high-yielding Murrah buffaloes, and calves with breed details, milk yield, and seller contact.
- **Cattle Feed & Nutrition**: Balanced dairy pellets, mineral lick blocks, green fodder (Napier grass), silage bales, and calf starter feed.
- **Veterinary Medicines**: Liquid calcium supplements, dewormers, FMD vaccine doses, tick control sprays, and probiotics.
- **Equipment & Tools**: Electric chaff cutters, 2-cow milking machines, stainless steel milk cans, and water troughs.
- **Dairy Products & Biogas**: Farm fresh ghee, paneer, curd, cow dung cakes, vermicompost, and small-scale biogas kits.
- **Doctor Appointments**: Schedule verified veterinarian visits for routine checkups, vaccinations, and 24/7 emergencies.
- **Cart & Checkout**: Real-time order placement with UPI, Cards, and Cash on Delivery (COD).

### 2. Intelligent Multilingual AI Farm Assistant
- **AI Engine**: Powered by Groq API (`qwen/qwen3.8-27b`) for real-time natural language understanding.
- **Multilingual Support**: Fluently converses and understands **Telugu (తెలుగు)**, **Hindi (हिन्दी)**, **Tamil (தமிழ்)**, **Kannada (ಕನ್ನಡ)**, **Malayalam (മലയാളം)**, and **English**, including Romanized variants (Hinglish, Teluglish, Tanglish).
- **Strict Domain Guardrails**: Dedicated to cattle farming, dairy, livestock nutrition, medicines, and farm equipment. Politely declines off-topic questions (e.g. computer coding).
- **Dynamic Product Cards**: Renders interactive product card carousels directly inside the chat window with direct navigation to `#p-${id}` and one-click cart additions.
- **Smart Catalog Matching**: Dynamically queries the catalog database to recommend appropriate feeds, mineral supplements, or breeds without hardcoded static responses.

### 3. Integrated Admin Portal
- Accessible at `/admin.html` or `/#admin-dash`.
- Real-time revenue analytics, order management, status updates (Placed, Packed, Out for delivery, Delivered).
- Product inventory management with stock count, visibility toggling, and price editing.
- Cattle ad moderation (show/hide/delete listings).
- Coupon creation and customer management.
- Dual Database Mode: Runs on local offline storage or syncs in real-time with Firebase Firestore.

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- Groq API Key (get free at [console.groq.com](https://console.groq.com/))

### 2. Installation & Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd gaumitra-website-and-admin

# Configure environment variables
cp .env.example .env
```

Edit `.env` and add your Groq API key:
```env
GROQ_API_KEY=gsk_your_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b
PORT=3000
```

### 3. Run the Server
```bash
node server.js
```

Open your browser at:
- **Storefront & AI Chatbot**: [http://localhost:3000/](http://localhost:3000/)
- **Admin Portal**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

---

## 📁 Project Structure

```
gaumitra-website-and-admin/
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules (protects API keys)
├── package.json            # Project metadata and start script
├── README.md               # Project documentation
├── server.js               # Node.js HTTP server & Groq AI endpoint
└── gaumitra/               # Frontend web application
    ├── index.html          # Main storefront & AI chatbot interface
    ├── admin.html          # Standalone admin portal
    ├── firebase-config.js  # Optional Firebase Firestore integration
    ├── firestore.rules     # Firestore security rules
    ├── docs/               # Documentation assets
    ├── gaumitra-admin/     # Admin source components
    └── source/             # Stylesheets and modules
```

---

## 🔒 Security
- API keys are handled strictly on the backend in `server.js` and loaded from `.env`.
- `.env` is excluded in `.gitignore` to prevent leaking credentials to version control.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
