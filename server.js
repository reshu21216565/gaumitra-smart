const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Simple .env parser (zero external dependencies)
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    } catch (e) {
      console.warn('Could not parse .env file:', e.message);
    }
  }
}

loadEnv();

const PORT = parseInt(process.env.PORT, 10) || 3000;
const STATIC_DIR = path.join(__dirname, 'gaumitra');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

// Website structure and knowledge base
const WEBSITE_PAGES = {
  home: { hash: '#home', title: 'Home', desc: 'Featured feed, medicines, deals of the day, top rated products, and quick categories' },
  cattle: { hash: '#c-cattle', title: 'Cattle & Buffaloes', desc: 'Verified live cows, buffaloes, bulls, and calves for sale across India' },
  feed: { hash: '#c-feed', title: 'Cattle Feed', desc: 'Mineral mix, dairy pellets, mineral lick blocks, green fodder bundles, silage bales, and calf starter feed' },
  med: { hash: '#c-med', title: 'Veterinary Medicines', desc: 'Calcium liquid for milk yield, dewormers, FMD vaccines, tick sprays, and probiotic powders' },
  tools: { hash: '#c-tools', title: 'Equipment & Tools', desc: 'Electric chaff cutters, 2-cow milking machines, steel milk cans, and water troughs' },
  dairy: { hash: '#c-dairy', title: 'Farm Fresh Dairy', desc: 'Pure cow ghee, fresh farm paneer, raw cow milk, and fresh curd' },
  manure: { hash: '#c-manure', title: 'Organic Manure & Biogas', desc: 'Vermicompost bags, cow dung cakes, and small farm biogas kits' },
  doctor: { hash: '#c-doctor', title: 'Vet Services', desc: 'Book farm health check-ups, vaccination visits, 24-hour emergency visits, and phone consultations' },
  sell: { hash: '#sell', title: 'Sell Cattle / Post Free Ad', desc: 'Farmers and sellers can post live cattle or buffalo listings with photos and milk yield' },
  book: { hash: '#book', title: 'Book a Vet', desc: 'Schedule a certified veterinarian visit or consultation' },
  orders: { hash: '#orders', title: 'Track Orders', desc: 'Check status of your delivery or appointment' },
  help: { hash: '#help', title: 'Help & Bulk Quotes', desc: 'Contact customer support, read FAQs, and submit bulk purchase quote requests' },
  offers: { hash: '#offers', title: 'Offers & Coupons', desc: 'Active promo codes like GAUMITRA10 and WELCOME50' }
};

// Stop words that should never trigger product search matches
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'should',
  'would', 'may', 'might', 'must', 'shall', 'will', 'to', 'of', 'in',
  'for', 'on', 'with', 'at', 'by', 'from', 'up', 'about', 'into', 'over',
  'after', 'under', 'above', 'i', 'me', 'my', 'myself', 'we', 'our',
  'ours', 'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her',
  'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom',
  'this', 'that', 'these', 'those', 'am', 'and', 'but', 'if', 'or',
  'because', 'as', 'until', 'while', 'tell', 'show', 'give', 'help',
  'want', 'need', 'find', 'get', 'getting', 'please', 'any', 'some',
  'available', 'good', 'best', 'ok', 'okay', 'canyou', 'also', 'those'
]);

// Off-topic query detector to guarantee strict cattle farming domain guardrails
function isOffTopicQuery(query) {
  const q = (query || '').toLowerCase().trim();
  const offTopicPatterns = [
    /\b(center|centre)\s+a?\s*div\b/i,
    /\bhow\s+to\s+(center|centre)\b/i,
    /\b(flexbox|css|html|javascript|typescript|python|react|vue|angular|django|flask|sql|java|c\+\+|rust|golang|docker|kubernetes)\b/i,
    /\b(coding|programming|write\s+code|source\s+code|algorithm|binary\s+search|homework|calculus|linear\s+algebra)\b/i
  ];
  return offTopicPatterns.some(p => p.test(q));
}

function getOffTopicRefusal(lang) {
  if (lang === 'te') {
    return 'నమస్కారం! నేను గౌమిత్ర పశుసంరక్షణ మరియు పాడి పరిశ్రమ AI సహాయకుడను. నేను పశువులు, గేదెలు, దాణా, మందులు, పరికరాలు మరియు గౌమిత్ర సేవలపై మాత్రమే మీకు సహాయం చేయగలను. ప్రోగ్రామింగ్ లేదా ఇతర వ్యవసాయేతర విషయాలకు సహాయం చేయలేను. పశువుల పోషణ లేదా మందుల గురించి దయచేసి నన్ను అడగండి!';
  } else if (lang === 'hi') {
    return 'नमस्ते! मैं गौमित्र का पशुपालन और डेयरी AI सहायक हूँ। मैं केवल मवेशियों, भैंसों, चारे, दवाइयों, कृषि उपकरणों और गौमित्र की सेवाओं में आपकी सहायता कर सकता हूँ। मैं कोडिंग या गैर-कृषि विषयों में मदद नहीं कर सकता। कृपया पशुपालन, चारा या दवाइयों से संबंधित प्रश्न पूछें!';
  } else if (lang === 'ta') {
    return 'வணக்கம்! நான் கௌமித்ரா கால்நடை மற்றும் பால்பண்ணை AI உதவியாளர். என்னால் மாடுகள், எருமைகள், தீவனம், மருந்துகள் மற்றும் பண்ணை சேவைகள் தொடர்பான கேள்விகளுக்கு மட்டுமே உதவ முடியும். கணினி நிரலாக்கம் (Coding) அல்லது விவசாயம் அல்லாத பிற தலைப்புகளுக்கு என்னால் உதவ முடியாது.';
  } else if (lang === 'kn') {
    return 'ನಮಸ್ಕಾರ! ನಾನು ಗೌಮಿತ್ರದ ಪಶುಸಂಗೋಪನೆ ಮತ್ತು ಡೈರಿ AI ಸಹಾಯಕ. ನಾನು ಹಸುಗಳು, ಎಮ್ಮೆಗಳು, ಮೇವು, ಔಷಧಿಗಳು ಮತ್ತು ಕೃಷಿ ಸಲಕರಣೆಗಳ ಬಗ್ಗೆ ಮಾತ್ರ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಕಂಪ್ಯೂಟರ್ ಕೋಡಿಂಗ್ ಅಥವಾ ಇತರ ವಿಷಯಗಳಿಗೆ ಉತ್ತರಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.';
  } else if (lang === 'ml') {
    return 'നമസ്കാരം! ഞാൻ ഗൗമിത്ര കന്നുകാലി-ക്ഷീര ഫാം AI സഹായിയാണ്. പശുക്കൾ, എരുമകൾ, തീറ്റ, മരുന്നുകൾ, ഫാം ഉപകരണങ്ങൾ എന്നിവയെക്കുറിച്ചുള്ള ചോദ്യങ്ങൾക്ക് മാത്രമേ എനിക്ക് സഹായിക്കാനാകൂ. കമ്പ്യൂട്ടർ കോഡിംഗ് അല്ലെങ്കിൽ മറ്റ് വിഷയങ്ങൾക്ക് മറുപടി നൽകാൻ കഴിയില്ല.';
  }
  return "I am GauMitra's dedicated cattle farming assistant. I can only assist with cattle, buffaloes, animal feed & nutrition, veterinary medicines, farm equipment, and GauMitra store services. I cannot assist with computer programming or non-farming topics. How can I help you with your cattle or dairy farm today?";
}

// Smart keyword & category match to ensure dynamic product discovery
function searchProducts(query, products) {
  if (!Array.isArray(products) || !products.length) return [];
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];

  // Punctuation-stripped raw tokens
  const rawTokens = q.replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, ' ').split(/\s+/).filter(Boolean);
  const tokens = rawTokens.filter(t => !STOP_WORDS.has(t) && (t.length >= 3 || /[^\u0000-\u007F]/.test(t)));

  // Synonyms and category expansion map across English, Telugu, Hindi, Tamil, Kannada, Malayalam
  const SYNONYMS = {
    'buffalo': [
      'buffalo', 'murrah', 'buffalos', 'buffaloes', 'bhains', 'bhais',
      'గేదె', 'బర్రె', 'ముర్రా',
      'भैंस', 'मुर्रा',
      'எருமை', 'முர்ரா',
      'ಎಮ್ಮೆ', 'ಕೋಣ', 'ಮುರ್ರಾ',
      'എരുമ', 'പോത്ത്', 'മുറ'
    ],
    'cow': [
      'cow', 'cows', 'gir', 'sahiwal', 'jersey', 'ongole', 'gai', 'gaay', 'cattle',
      'ఆవు', 'గిర్', 'సాహివాల్', 'జెర్సీ', 'ఒంగోలు',
      'गाय', 'गीर', 'साहीवाल', 'जर्सी',
      'பசு', 'மாடு', 'கிர்',
      'ಹಸು', 'ಗಿರ್',
      'പശു', 'ഗിർ'
    ],
    'calf': [
      'calf', 'calves', 'bachhda', 'bachhiya',
      'దూడ', 'బచ్చా', 'बछड़ा', 'बछिया', 'கன்று', 'ಕರು', 'കിടാവ്'
    ],
    'milk': [
      'milk', 'ghee', 'paneer', 'curd', 'dairy', 'milking', 'yield', 'lactation', 'calcium',
      'పాలు', 'నెయ్యి', 'పెరుగు', 'పాల',
      'दूध', 'घी', 'पनीर', 'दही', 'दुग्ध',
      'பால்', 'நெய்', 'தயிர்',
      'ಹಾಲು', 'ತುಪ್ಪ', 'ಮೊಸರು',
      'പാൽ', 'നെയ്യ്', 'തൈര്'
    ],
    'nutrition': [
      'feed', 'mineral', 'pellets', 'fodder', 'silage', 'mix', 'nutrition', 'starter', 'calcium', 'food', 'diet', 'eating',
      'పోషణ', 'ఆహారం', 'దాణా', 'గడ్డి', 'ఖనిజం',
      'पोषण', 'आहार', 'चारा', 'खनिज',
      'ஊட்டச்சத்து', 'தீவனம்', 'மினரல்',
      'ಪೋಷಣೆ', 'ಮೇವು', 'ಖನಿಜ',
      'പോഷണം', 'തീറ്റ', 'ധാതുക്കൾ'
    ],
    'feed': [
      'feed', 'fodder', 'silage', 'pellets', 'chara', 'daana', 'mineral', 'food', 'diet', 'ration', 'grass',
      'దాణా', 'గడ్డి', 'సైలేజ్', 'పెల్లెట్స్',
      'चारा', 'दाना', 'साइलेज',
      'தீவனம்', 'புல்', 'சைலேஜ்',
      'ಮೇವು', 'ಹುಲ್ಲು',
      'തീറ്റ', 'പുല്ല്'
    ],
    'medicine': [
      'med', 'medicine', 'medicines', 'dawa', 'calcium', 'dewormer', 'vaccine', 'fmd', 'tick', 'spray', 'probiotic', 'health', 'sick',
      'మందు', 'మందులు', 'టీకా', 'కాల్షియం',
      'दवा', 'दवाई', 'टीका', 'कैल्शियम',
      'மருந்து', 'தடுப்பூசி',
      'ಔಷಧಿ', 'ಲಸಿಕೆ',
      'മരുന്ന്', 'കുത്തിവയ്പ്പ്'
    ],
    'doctor': [
      'doctor', 'vet', 'appointment', 'visit', 'checkup', 'vaccination', 'emergency', 'consultation',
      'డాక్టర్', 'వైద్యుడు', 'సందర్శన',
      'डॉक्टर', 'पशु चिकित्सक',
      'மருத்துவர்', 'கால்நடை மருத்துவர்',
      'ವೈದ್ಯ', 'ಪಶು ವೈದ್ಯ',
      'ഡോക്ടർ', 'മൃഗഡോക്ടർ'
    ],
    'tool': [
      'tool', 'tools', 'machine', 'chaff', 'cutter', 'milk can', 'trough', 'equipment',
      'యంత్రం', 'మిషన్', 'కట్టర్', 'పరికరం',
      'मशीन', 'उपकरण', 'कटर',
      'இயந்திரம்', 'கருவி',
      'ಯಂತ್ರ', 'ಉಪಕರಣ',
      'യന്ത്രം', 'ഉപകരണം'
    ],
    'manure': [
      'manure', 'vermicompost', 'dung', 'compost', 'biogas', 'khat', 'fertilizer',
      'ఎరువు', 'పేడ', 'బయోగ్యాస్',
      'खाद', 'गोबर', 'बायोगैस',
      'உரம்', 'சாணம்',
      'ಗೊಬ್ಬರ', 'ಸಗಣಿ',
      'വളം', 'ചാണകം'
    ]
  };

  const expandedTerms = new Set(tokens);
  tokens.forEach(tok => {
    Object.keys(SYNONYMS).forEach(cat => {
      if (SYNONYMS[cat].some(syn => syn === tok || (syn.includes(' ') && q.includes(syn)))) {
        SYNONYMS[cat].forEach(syn => expandedTerms.add(syn));
        expandedTerms.add(cat);
      }
    });
  });

  // Food / feed query detection: if user wants food/feed, exclude tools/machines
  const isFoodQuery = /(food|feed|nutrition|diet|chara|daana|fodder|silage|pellet|ఆహారం|దాణా|గడ్డి|चारा|दाना|தீவனம்|மேವು|തീറ്റ)/i.test(q);
  const isToolQuery = /(machine|tool|cutter|chaff|milking|trough|మిషన్|యంత్రం|उपकरण|இயந்திரம்|ಉಪಕರಣ|യന്ത്രം)/i.test(q);
  const isYieldQuery = /(yield|production|increase|boost|badhane|penchadaniki|adhigarikka|hecchisa|koottan|పెంచ|बढ़ा|அதிகரிக்க|ಹೆಚ್ಚಿಸಲು|കൂട്ടാൻ|lactat)/i.test(q);

  const termList = Array.from(expandedTerms);

  const scored = products
    .filter(p => p && p.active !== false && !p.x && !p.hidden && !p.del)
    .map(p => {
      let score = 0;
      const name = (p.n || '').toLowerCase();
      const cat = (p.c || '').toLowerCase();
      const brand = (p.b || '').toLowerCase();
      const breed = (p.s || '').toLowerCase();
      const desc = (p.d || '').toLowerCase();
      const fullText = `${name} ${cat} ${brand} ${breed} ${desc}`;

      // If user asks for food/feed, penalize tools/machines unless user also asked for tools
      if (isFoodQuery && !isToolQuery && (cat === 'tools' || name.includes('machine') || name.includes('cutter'))) {
        return { product: p, score: -100 };
      }

      // If user asks about boosting milk yield/production, prioritize calcium & feed, penalize machines
      if (isYieldQuery && !isToolQuery && (cat === 'tools' || name.includes('machine'))) {
        return { product: p, score: -100 };
      }

      // Exact phrase match
      if (fullText.includes(q)) score += 30;

      // Token matches
      tokens.forEach(t => {
        if (name.includes(t)) score += 15;
        if (breed.includes(t)) score += 15;
        if (cat.includes(t)) score += 10;
        if (brand.includes(t)) score += 8;
        if (desc.includes(t)) score += 5;
      });

      // Expanded synonym matches
      termList.forEach(term => {
        if (name.includes(term)) score += 5;
        if (breed.includes(term)) score += 5;
        if (cat.includes(term)) score += 3;
        if (desc.includes(term)) score += 2;
      });

      return { product: p, score };
    });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(item => item.product);
}

// Generate intelligent local fallback response when Grok API is not configured or fails
function generateFallbackResponse(userQuery, matchedProducts, language) {
  const q = (userQuery || '').toLowerCase();
  const lang = language || 'en';

  const isHindi = lang === 'hi';
  const isTelugu = lang === 'te';
  const isTamil = lang === 'ta';
  const isKannada = lang === 'kn';
  const isMalayalam = lang === 'ml';

  // Specific intents
  if (q.includes('buffalo') || q.includes('murrah') || q.includes('bhains') || q.includes('గేదె') || q.includes('எருமை') || q.includes('ಎಮ್ಮೆ') || q.includes('എരുമ')) {
    const ids = matchedProducts.length ? matchedProducts.map(p => p.id) : [1, 12, 6];
    let reply = `Here are the top buffalo options and high-yielding Murrah breeds available on GauMitra, along with calcium and feed for buffaloes:`;
    if (isHindi) reply = `गौमित्र पर उच्च दुग्ध उत्पादन के लिए मुर्रा भैंस और पूरक आहार उपलब्ध हैं:`;
    if (isTelugu) reply = `ఎక్కువ పాల దిగుబడి ఇచ్చే ముర్రా గేదెలు మరియు సంబంధిత దాణా ఉత్పత్తులు ఇక్కడ ఉన్నాయి:`;
    if (isTamil) reply = `கௌமித்ராவில் அதிக பால் தரும் முர்ரா எருமைகள் மற்றும் எருமை தீவனங்கள்:`;
    if (isKannada) reply = `ಗೌಮಿತ್ರದಲ್ಲಿ ಹೆಚ್ಚು ಹಾಲು ನೀಡುವ ಮುರ್ರಾ ಎಮ್ಮೆಗಳು ಮತ್ತು ಪೂರಕ ಮೇವು ಉತ್ಪನ್ನಗಳು ಇಲ್ಲಿವೆ:`;
    if (isMalayalam) reply = `ഗൗമിത്രയിൽ കൂടുതൽ പാൽ നൽകുന്ന മുറ എരുമകളും തീറ്റ ഉൽപ്പന്നങ്ങളും:`;
    return { reply, productIds: ids };
  }

  if (q.includes('milk') || q.includes('yield') || q.includes('production') || q.includes('doodh') || q.includes('పాలు') || q.includes('பால்') || q.includes('ಹಾಲು') || q.includes('പാൽ')) {
    const ids = matchedProducts.length ? matchedProducts.map(p => p.id) : [12, 6, 7];
    let reply = `To boost milk yield and support healthy lactation, we recommend our proven calcium liquid supplements and balanced mineral mixes:`;
    if (isHindi) reply = `दूध का उत्पादन और वसा (Fat) बढ़ाने के लिए निम्नलिखित उच्च-कैल्शियम और खनिज उत्पाद सर्वोत्तम हैं:`;
    if (isTelugu) reply = `పాల దిగుబడిని పెంచడానికి ఉత్తమమైన కాల్షియం మరియు మినరల్ మిశ్రమాలు ఇక్కడ ఉన్నాయి:`;
    if (isTamil) reply = `பால் உற்பத்தியை அதிகரிக்க கால்சியம் திரவம் மற்றும் தாது கலவை தீவனம் பரிந்துரைக்கப்படுகிறது:`;
    if (isKannada) reply = `ಹಾಲಿನ ಉತ್ಪಾದನೆ ಹೆಚ್ಚಿಸಲು ಕ್ಯಾಲ್ಸಿಯಂ ದ್ರವ ಮತ್ತು ಮಿನರಲ್ ಮಿಕ್ಸ್ ಅತ್ಯುತ್ತಮ:`;
    if (isMalayalam) reply = `പാൽ ഉത്പാദനം വർദ്ധിപ്പിക്കുന്നതിന് കാൽസ്യം ദ്രാവകവും മിനറൽ മിശ്രിതവും:`;
    return { reply, productIds: ids };
  }

  if (q.includes('nutrition') || q.includes('feed') || q.includes('chara') || q.includes('pellet') || q.includes('fodder') || q.includes('silage') || q.includes('దాణా') || q.includes('चारा') || q.includes('தீவனம்') || q.includes('ಮೇವು') || q.includes('തീറ്റ')) {
    const ids = matchedProducts.length ? matchedProducts.map(p => p.id) : [6, 7, 8, 9, 10];
    let reply = `For complete cattle nutrition, balanced dairy pellets, mineral lick blocks, and quality fodder are essential. Here are the top choices:`;
    if (isHindi) reply = `पशु पोषण और संतुलित आहार के लिए गौमित्र पर उपलब्ध मुख्य चारा और खनिज उत्पाद:`;
    if (isTelugu) reply = `పశువుల సంపూర్ణ పోషణకు సమతుల్య దాణా మరియు ఖనిజ ఉత్పత్తులు ఇక్కడ ఉన్నాయి:`;
    if (isTamil) reply = `கால்நடை முழுமையான ஊட்டச்சத்துக்கு சிறந்த தீவனம் மற்றும் தாதுப் பொருட்கள்:`;
    if (isKannada) reply = `ಪಶುಗಳ ಸಮಗ್ರ ಪೋಷಣೆಗೆ ಗುಣಮಟ್ಟದ ಮೇವು ಮತ್ತು ಮಿನರಲ್ ಉತ್ಪನ್ನಗಳು:`;
    if (isMalayalam) reply = `കന്നുകാലികളുടെ സമീകൃത പോഷണത്തിന് ഗുണമേന്മയുള്ള തീറ്റയും ധാതുക്കളും:`;
    return { reply, productIds: ids };
  }

  if (q.includes('cow') || q.includes('cattle') || q.includes('gai') || q.includes('gir') || q.includes('sahiwal') || q.includes('jersey') || q.includes('ఆవు') || q.includes('பசு') || q.includes('ಹಸು') || q.includes('പശു')) {
    const ids = matchedProducts.length ? matchedProducts.map(p => p.id) : [0, 2, 4, 5];
    let reply = `Here are the verified cows and cattle listings available on GauMitra:`;
    if (isHindi) reply = `गौमित्र पर उपलब्ध प्रमाणित गायें और संबंधित पशुधन:`;
    if (isTelugu) reply = `గౌమిత్రలో లభించే ధృవీకరించబడిన ఆవులు ఇక్కడ ఉన్నాయి:`;
    if (isTamil) reply = `கௌமித்ராவில் சரிபார்க்கப்பட்ட கறவை மாடுகள்:`;
    if (isKannada) reply = `ಗೌಮಿತ್ರದಲ್ಲಿ ಲಭ್ಯವಿರುವ ಪರಿಶೀಲಿತ ಹಸುಗಳು:`;
    if (isMalayalam) reply = `ഗൗമിത്രയിൽ ലഭ്യമായ മികച്ച പശുക്കൾ:`;
    return { reply, productIds: ids };
  }

  if (q.includes('which') && (q.includes('best') || q.includes('better') || q.includes('nutrition') || q.includes('good'))) {
    const ids = matchedProducts.length ? matchedProducts.map(p => p.id) : [6, 7, 12];
    let reply = `For daily nutrition, **Dairy mineral mix 25 kg** and **Cattle feed pellets** are best for consistent yield. If your animal needs an immediate lactation boost, **Calcium liquid 1 L** is the most effective choice:`;
    if (isHindi) reply = `दैनिक पोषण के लिए 'Dairy mineral mix' और 'Cattle feed pellets' सर्वोत्तम हैं, जबकि तुरंत दूध बढ़ाने के लिए 'Calcium liquid' सबसे प्रभावी है:`;
    if (isTelugu) reply = `రోజువారీ పోషణకు 'Dairy mineral mix' మరియు పాల దిగుబడికి 'Calcium liquid' ఉత్తమమైనవి:`;
    if (isTamil) reply = `தினசரி ஊட்டச்சத்துக்கு 'Dairy mineral mix' மற்றும் உடனடி பால் உற்பத்திக்கு 'Calcium liquid' சிறந்தது:`;
    if (isKannada) reply = `ದೈನಂದಿನ ಪೋಷಣೆಗೆ 'Dairy mineral mix' ಮತ್ತು ಹಾಲಿನ ಇಳುವರಿಗೆ 'Calcium liquid' ಉತ್ತಮ:`;
    if (isMalayalam) reply = `ദിവസേനയുള്ള പോഷണത്തിന് 'Dairy mineral mix' ഉം പാൽ വർദ്ധിപ്പിക്കാൻ 'Calcium liquid' ഉം ഉത്തമം:`;
    return { reply, productIds: ids };
  }

  if (matchedProducts.length > 0) {
    let intro = `Here are the matching products and services available on GauMitra for your request:`;
    if (isHindi) intro = `गौमित्र पर आपकी खोज के अनुसार निम्नलिखित उत्पाद उपलब्ध हैं:`;
    if (isTelugu) intro = `మీ శోధన ప్రకారం గౌమిత్రలో లభించే ఉత్పత్తులు ఇక్కడ ఉన్నాయి:`;
    if (isTamil) intro = `உங்கள் கேள்விக்கு ஏற்ப கௌமித்ராவில் கிடைக்கும் பொருட்கள்:`;
    if (isKannada) intro = `ನಿಮ್ಮ ಹುಡುಕಾಟಕ್ಕೆ ಸೂಕ್ತವಾದ ಗೌಮಿತ್ರ ಉತ್ಪನ್ನಗಳು:`;
    if (isMalayalam) intro = `നിങ്ങളുടെ അന്വേഷണത്തിന് അനുയോജ്യമായ ഉൽപ്പന്നങ്ങൾ:`;
    return {
      reply: intro,
      productIds: matchedProducts.map(p => p.id)
    };
  }

  // Question about vet / doctor
  if (q.includes('doctor') || q.includes('vet') || q.includes('appointment') || q.includes('emergency') || q.includes('sick')) {
    if (isHindi) {
      return {
        reply: `गौमित्र पर आप घर बैठे पशु चिकित्सक (Vet Doctor) बुक कर सकते हैं।\n\n• नियमित स्वास्थ्य जांच: ₹300\n• टीकाकरण (Vaccination): ₹250\n• 24-घंटे आपातकालीन सेवा: ₹800\n• फ़ोन परामर्श: ₹99\n\nडॉक्टर बुक करने के लिए मेनू में 'Book a vet' (#book) पर जाएं।`,
        productIds: []
      };
    } else if (isTelugu) {
      return {
        reply: `గౌమిత్రలో మీరు వెటర్నరీ డాక్టర్‌ను బుక్ చేసుకోవచ్చు.\n\n• ఆరోగ్య పరీక్ష: ₹300\n• టీకాలు: ₹250\n• 24 గంటల అత్యవసర సేవ: ₹800\n• ఫోన్ సంప్రదింపులు: ₹99\n\nబుక్ చేయడానికి 'Book a vet' (#book) విభాగం చూడండి.`,
        productIds: []
      };
    } else if (isTamil) {
      return {
        reply: `கௌமித்ராவில் நீங்கள் கால்நடை மருத்துவரை முன்பதிவு செய்யலாம்.\n\n• பொது சுகாதார பரிசோதனை: ₹300\n• தடுப்பூசி: ₹250\n• 24 மணி நேர அவசர சிகிச்சை: ₹800\n• தொலைபேசி ஆலோசனை: ₹99\n\nமுன்பதிவு செய்ய 'Book a vet' (#book) செல்லவும்.`,
        productIds: []
      };
    } else if (isKannada) {
      return {
        reply: `ಗೌಮಿತ್ರದಲ್ಲಿ ನೀವು ಪಶು ವೈದ್ಯರನ್ನು ಬುಕ್ ಮಾಡಬಹುದು.\n\n• ನಿಯಮಿತ ತಪಾಸಣೆ: ₹300\n• ಲಸಿಕೆ: ₹250\n• 24 ಗಂಟೆಗಳ ತುರ್ತು ಸೇವೆ: ₹800\n• ಫೋನ್ ಸಮಾಲೋಚನೆ: ₹99\n\nಬುಕ್ ಮಾಡಲು 'Book a vet' (#book) ನೋಡಿ.`,
        productIds: []
      };
    } else if (isMalayalam) {
      return {
        reply: `ഗൗമിത്രയിൽ മൃഗഡോക്ടറെ ബുക്ക് ചെയ്യാം.\n\n• പതിവ് പരിശോധന: ₹300\n• വാക്സിനേഷൻ: ₹250\n• 24 മണിക്കൂർ അടിയന്തര സേവനം: ₹800\n• ഫോൺ കൺസൾട്ടേഷൻ: ₹99\n\nഡോക്ടറെ ബുക്ക് ചെയ്യാൻ 'Book a vet' (#book) സന്ദർശിക്കുക.`,
        productIds: []
      };
    } else {
      return {
        reply: `You can easily book certified veterinary doctors on GauMitra:\n\n• Routine farm health visit: ₹300\n• Cattle vaccination visit: ₹250\n• 24-Hour Emergency visit: ₹800\n• Quick phone consultation: ₹99\n\nTo schedule a visit right away, navigate to the **Book a vet** section (#book).`,
        productIds: []
      };
    }
  }

  // Selling cattle
  if (q.includes('sell') || q.includes('list') || q.includes('bechna') || q.includes('అమ్మ') || q.includes('விற்பனை') || q.includes('ಮಾರಾಟ') || q.includes('വിൽക്കുക')) {
    if (isHindi) {
      return {
        reply: `आप अपनी गाय या भैंस को गौमित्र पर मुफ्त में बेच सकते हैं। बस 'Sell' (#sell) बटन पर क्लिक करें, पशु की फोटो, नस्ल, दूध की मात्रा और अपनी कीमत दर्ज करें।`,
        productIds: []
      };
    } else if (isTelugu) {
      return {
        reply: `మీరు మీ ఆవు లేదా గేదెను గౌమిత్రలో ఉచితంగా అమ్మవచ్చు. 'Sell' (#sell) బటన్ క్లిక్ చేసి, ఫోటో, జాతి, పాల దిగుబడి మరియు ధర వివరాలు నమోదు చేయండి.`,
        productIds: []
      };
    } else if (isTamil) {
      return {
        reply: `உங்கள் மாடு அல்லது எருமையை கௌமித்ராவில் இலவசமாக விற்கலாம். 'Sell' (#sell) பிரிவுக்குச் சென்று புகைப்படம் மற்றும் பால் விவரங்களை பதிவிடவும்.`,
        productIds: []
      };
    } else if (isKannada) {
      return {
        reply: `ನಿಮ್ಮ ಹಸು ಅಥವಾ ಎಮ್ಮೆಯನ್ನು ಗೌಮಿತ್ರದಲ್ಲಿ ಉಚಿತವಾಗಿ ಮಾರಾಟ ಮಾಡಬಹುದು. 'Sell' (#sell) ಕ್ಲಿಕ್ ಮಾಡಿ ಫೋಟೋ ಮತ್ತು ವಿವರಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.`,
        productIds: []
      };
    } else if (isMalayalam) {
      return {
        reply: `നിങ്ങളുടെ പശുവിനെയോ എരുമയെയോ ഗൗമിത്രയിൽ സൗജന്യമായി വിൽക്കാം. 'Sell' (#sell) ക്ലിക്ക് ചെയ്ത് ഫോട്ടോയും വിശദാംശങ്ങളും ചേർക്കുക.`,
        productIds: []
      };
    } else {
      return {
        reply: `You can sell your cattle or buffalo directly to buyers on GauMitra for free! Simply navigate to the **Sell your animal** section (#sell), upload a photo, specify breed and milk yield, and set your asking price.`,
        productIds: []
      };
    }
  }

  // Delivery & policies
  if (q.includes('delivery') || q.includes('ship') || q.includes('payment') || q.includes('upi') || q.includes('cod')) {
    if (isHindi) {
      return {
        reply: `गौमित्र पर ₹999 से अधिक के ऑर्डर पर मुफ़्त डिलीवरी उपलब्ध है। आप UPI, कार्ड या कैश ऑन डिलीवरी (COD) द्वारा भुगतान कर सकते हैं।`,
        productIds: []
      };
    } else if (isTelugu) {
      return {
        reply: `గౌమిత్రలో ₹999 కంటే ఎక్కువ ఆర్డర్‌లపై ఉచిత డెలివరీ లభిస్తుంది. UPI, కార్డులు లేదా డెలివరీ సమయంలో నగదు (COD) ద్వారా చెల్లించవచ్చు.`,
        productIds: []
      };
    } else {
      return {
        reply: `GauMitra provides delivery straight to your cattle shed! Orders above ₹999 qualify for Free Delivery (standard delivery fee is ₹60). We accept UPI, Debit/Credit Cards, and Cash on Delivery (COD).`,
        productIds: []
      };
    }
  }

  // General assistance
  if (isHindi) {
    return {
      reply: `नमस्ते! मैं गौमित्र AI सहायक हूँ। मैं पशु आहार (Feed), दवाइयाँ (Medicines), दूध निकालने की मशीनें (Milking Machines), डेयरी उत्पाद, जैविक खाद और पशु चिकित्सक (Vet Doctor) सेवाओं के बारे में जानकारी दे सकता हूँ। आप किस बारे में जानना चाहते हैं?`,
      productIds: []
    };
  } else if (isTelugu) {
    return {
      reply: `నమస్కారం! నేను గౌమిత్ర AI సహాయకుడను. పశువుల దాణా, మందులు, పరికరాలు, పాల ఉత్పత్తులు మరియు పశువైద్యుల సేవల గురించి నేను మీకు సహాయపడగలను. మీకు ఏమి కావాలి?`,
      productIds: []
    };
  } else if (isTamil) {
    return {
      reply: `வணக்கம்! நான் கௌமித்ரா AI பண்ணை உதவியாளர். கால்நடை தீவனம், மருந்துகள், கறவை இயந்திரங்கள் மற்றும் மருத்துவர் சேவைகளுக்கு நான் உங்களுக்கு உதவ முடியும். உங்களுக்கு என்ன வேண்டும்?`,
      productIds: []
    };
  } else if (isKannada) {
    return {
      reply: `ನಮಸ್ಕಾರ! ನಾನು ಗೌಮಿತ್ರ AI ಕೃಷಿ ಸಹಾಯಕ. ಪಶು ಆಹಾರ, ಔಷಧಿಗಳು, ಹಾಲು ಕರೆಯುವ ಯಂತ್ರಗಳು ಮತ್ತು ಪಶುವೈದ್ಯರ ಸೇವೆಗಳ ಬಗ್ಗೆ ನಾನು ನಿಮಗೆ ಮಾಹಿತಿ ನೀಡಬಲ್ಲೆ. ನಿಮಗೆ ಏನು ಬೇಕು?`,
      productIds: []
    };
  } else if (isMalayalam) {
    return {
      reply: `നമസ്കാരം! ഞാൻ ഗൗമിത്ര AI ഫാം സഹായിയാണ്. കന്നുകാലി തീറ്റ, മരുന്നുകൾ, കറവ യന്ത്രങ്ങൾ, മൃഗഡോക്ടർ സേവനങ്ങൾ എന്നിവയിൽ സഹായിക്കാം. നിങ്ങൾക്ക് എന്താണ് വേണ്ടത്?`,
      productIds: []
    };
  } else {
    return {
      reply: `Hello! I am GauMitra's AI farm assistant. I can help you discover buffaloes, cows, balanced feeds, milk-boosting mineral mixes, veterinary medicines, milking machines, and certified vet doctor visits. How can I help you today?`,
      productIds: []
    };
  }
}

// Call Grok / Groq API with live website context and search matches
async function callGrokAPI(userQuery, conversation, language, allProducts, storeInfo) {
  const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  if (!apiKey || apiKey === 'your_grok_api_key_here') {
    return null; // Signals fallback
  }

  const isGroq = apiKey.startsWith('gsk_');
  const endpoint = isGroq
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://api.x.ai/v1/chat/completions';
  const defaultModel = isGroq ? 'openai/gpt-oss-120b' : 'grok-beta';
  const model = (isGroq ? process.env.GROQ_MODEL : process.env.GROK_MODEL) || defaultModel;
  const langNames = {
    en: 'English',
    hi: 'Hindi (हिन्दी)',
    te: 'Telugu (తెలుగు)',
    ta: 'Tamil (தமிழ்)',
    kn: 'Kannada (ಕನ್ನಡ)',
    ml: 'Malayalam (മലയാളം)'
  };
  const langName = langNames[language] || 'English';

  // Find most relevant products to feed as context
  const relevantProducts = searchProducts(userQuery, allProducts);

  // Compact summary of all product catalog for full awareness
  const catalogSummary = allProducts
    .filter(p => p && p.active !== false && !p.x && !p.hidden && !p.del)
    .slice(0, 60)
    .map(p => `#${p.id}: ${p.n} [Category: ${p.c}, Breed/Type: ${p.s || '-'}, Brand: ${p.b || '-'}, Price: ₹${p.p}, Stock: ${p.stock ?? 'Available'}] - ${p.d || ''}`)
    .join('\n');

  const systemPrompt = `You are GauMitra's dedicated AI farm assistant and cattle livestock specialist for Indian farmers, dairy owners, and cattle buyers.
The context is ALWAYS dairy livestock: cattle, buffaloes (भैंस / గేదె / எருமை / ಎಮ್ಮೆ / എരുമ), cows (गाय / ఆవు / பசு / ಹಸು / പശു), bulls, and calves.

CRITICAL DOMAIN GUARDRAILS (STRICT REFUSAL RULE):
You ONLY assist with cattle farming, dairy, livestock, cattle feed & nutrition, veterinary care, farm equipment, organic manure/biogas, and GauMitra website services/orders.
If the user asks ANY question outside this domain (such as computer programming, HTML/CSS coding like 'how to center a div', software, algorithms, homework, politics, non-farming topics, or general chit-chat):
POLITELY AND FIRMLY REFUSE in the user's language. State clearly that you are GauMitra's cattle farming assistant and can only help with cattle, feed, medicines, and farm equipment. Guide them back to cattle, feed, or dairy farming. NEVER answer coding questions under any circumstances.

CRITICAL MULTILINGUAL INSTRUCTION:
You are fully fluent in:
- Telugu (తెలుగు)
- Hindi (हिन्दी)
- Tamil (தமிழ்)
- Kannada (ಕನ್ನಡ)
- Malayalam (മലയാളം)
- English
AUTOMATIC LANGUAGE MATCHING: Detect the language and script of the user message.
Always respond in that EXACT same language:
- If user writes in Telugu (తెలుగు or Teluglish), reply in natural, fluent Telugu.
- If user writes in Hindi (हिन्दी or Hinglish), reply in natural, fluent Hindi.
- If user writes in Tamil (தமிழ் or Tanglish), reply in natural, fluent Tamil.
- If user writes in Kannada (ಕನ್ನಡ or Kanglish), reply in natural, fluent Kannada.
- If user writes in Malayalam (മലയാളം or Manglish), reply in natural, fluent Malayalam.
- If user writes in English, reply in professional, warm Indian English.
If the query language is ambiguous, use the user's selected preference: ${langName}.
Keep answers helpful, direct, and concise (at most 2 to 3 sentences). NEVER output markdown tables.

CURRENT GAUMITRA CATALOG (LIVE DATABASE):
${catalogSummary}

WEBSITE SECTIONS:
- Cattle Marketplace (#c-cattle): Live cows (Gir, Sahiwal, Jersey), buffaloes (Murrah), bulls (Ongole), and calves.
- Cattle Feed & Nutrition (#c-feed): Mineral mixes, pellets, mineral lick blocks, green fodder, silage bales, calf starter feed.
- Medicines (#c-med): Calcium liquids (for high milk yield), dewormers, FMD vaccines, tick sprays, probiotic powders.
- Equipment & Tools (#c-tools): Electric chaff cutters, milking machines (2 cow), steel milk cans, water troughs.
- Dairy Products (#c-dairy): Pure cow ghee, fresh paneer, raw cow milk, curd.
- Organic Manure & Biogas (#c-manure): Vermicompost, cow dung cakes, biogas kits.
- Vet Services (#c-doctor or #book): Routine health visits (₹300), vaccination visits (₹250), 24-hr emergency visits (₹800), phone consultations (₹99).
- Post Free Cattle Ad (#sell): Farmers can sell animals with photos and milk details.
- Store Policies: Free delivery above ₹${storeInfo.freeAbove || 999} (delivery fee ₹${storeInfo.shipFee || 60}). Payment via UPI, Cards, and Cash on Delivery (COD).

RULES FOR RECOMMENDING PRODUCTS:
1. When recommending or displaying products, ALWAYS include their numeric IDs from the LIVE CATALOG in this EXACT format at the very end of your response:
   [PRODUCTS: id1, id2, ...]
   For example: "For your buffalo, we recommend balanced pellets and fresh green fodder: [PRODUCTS: 7, 9, 8]"
2. If the user asks about food, feed, or nutrition for an animal, recommend feed items like pellets (ID 7), mineral mix (ID 6), green fodder (ID 9), silage (ID 10), or lick blocks (ID 8). NEVER recommend milking machines or tools for food/feed questions.
3. If the user asks about increasing milk production, recommend Calcium liquid (ID 12) and Dairy mineral mix (ID 6).
4. For follow-up questions (e.g., "Which one is best for nutrition?"), explain the difference between the previously mentioned products.
5. If an animal is sick, give gentle first-aid care and strongly recommend booking a certified vet via #book. Never give dangerous drug dosages.
6. If a product does not exist in the catalog, clearly state that it is currently unavailable on GauMitra.
7. For off-topic or refused questions, DO NOT include any [PRODUCTS: ...] tag.`;

  // Build message chain for Grok / Groq
  const grokMessages = [
    { role: 'system', content: systemPrompt }
  ];

  // Include recent conversation history (up to last 8 messages)
  if (Array.isArray(conversation)) {
    const recent = conversation.slice(-8);
    recent.forEach(msg => {
      if (msg && msg.role && msg.content) {
        // Strip previous [PRODUCTS: ...] tags from historical assistant messages
        const cleanContent = msg.content.replace(/\[PRODUCTS:.*?\]/gi, '').trim();
        grokMessages.push({
          role: msg.role === 'u' || msg.role === 'user' ? 'user' : 'assistant',
          content: cleanContent
        });
      }
    });
  }

  // Add the current user query
  grokMessages.push({ role: 'user', content: userQuery });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: grokMessages,
        temperature: 0.4,
        max_tokens: 350
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`AI API Error from ${endpoint} (${response.status}):`, errText);
      return null;
    }

    const data = await response.json();
    const rawReply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';

    // Extract [PRODUCTS: 1, 2, 3] tags
    let productIds = [];
    const match = rawReply.match(/\[PRODUCTS?:\s*([0-9,\s]+)\]/i);
    if (match) {
      productIds = match[1].split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    }

    // Clean up reply text: remove tag, remove any accidental table syntax
    let cleanReply = rawReply.replace(/\[PRODUCTS?:\s*([0-9,\s]+)\]/gi, '').trim();
    cleanReply = cleanReply.replace(/\|.*\|/g, '').replace(/\n\s*[-|:]+\s*\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

    // If AI didn't tag products but relevant products were found from search, include top matches
    if (!productIds.length && relevantProducts.length > 0) {
      const isSearchIntent = /(show|find|product|buy|buffalo|cow|feed|calcium|medicine|price|cost|equipment|machine|ghee|dung|visit|vaccine|food|chara|nutrition)/i.test(userQuery);
      if (isSearchIntent) {
        productIds = relevantProducts.slice(0, 4).map(p => p.id);
      }
    }

    return {
      reply: cleanReply,
      productIds: productIds
    };
  } catch (error) {
    console.error('Failed to communicate with AI API:', error.message);
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: Health / Status
  if (pathname === '/api/health' && req.method === 'GET') {
    const key = process.env.GROQ_API_KEY || process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    const hasKey = !!(key && key !== 'your_grok_api_key_here');
    const isGroq = key && key.startsWith('gsk_');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      configured: hasKey,
      provider: isGroq ? 'Groq' : 'Grok (xAI)',
      model: isGroq ? (process.env.GROQ_MODEL || 'openai/gpt-oss-120b') : (process.env.GROK_MODEL || 'grok-beta'),
      version: '2.0.0'
    }));
    return;
  }

  // API: Chatbot
  if (pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2e6) { // 2MB max
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const userQuery = (payload.message || '').trim();
        const conversation = payload.conversation || [];
        const language = payload.language || 'en';
        const products = Array.isArray(payload.products) ? payload.products : [];
        const storeInfo = payload.storeInfo || {};

        if (!userQuery) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Message is required' }));
          return;
        }

        // Strict Domain Guardrail: immediately decline coding / non-farming questions
        if (isOffTopicQuery(userQuery)) {
          const refusal = getOffTopicRefusal(language);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            reply: refusal,
            productIds: [],
            products: [],
            isGrok: false
          }));
          return;
        }

        // 1. Try Grok / Groq API
        const grokResult = await callGrokAPI(userQuery, conversation, language, products, storeInfo);

        let finalReply = '';
        let finalProductIds = [];

        if (grokResult && grokResult.reply) {
          finalReply = grokResult.reply;
          finalProductIds = grokResult.productIds || [];
        } else {
          // 2. Intelligent local engine fallback
          const searchMatches = searchProducts(userQuery, products);
          const fallback = generateFallbackResponse(userQuery, searchMatches, language);
          finalReply = fallback.reply;
          finalProductIds = fallback.productIds || [];
        }

        // Map product IDs to full product objects from the live catalog
        const resolvedProducts = finalProductIds
          .map(id => products.find(p => p && p.id === id))
          .filter(Boolean);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          reply: finalReply,
          productIds: finalProductIds,
          products: resolvedProducts,
          isGrok: !!grokResult
        }));
      } catch (err) {
        console.error('Error handling /api/chat:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error', details: err.message }));
      }
    });
    return;
  }

  // Static File Serving from gaumitra/
  let filePath = path.join(STATIC_DIR, pathname === '/' ? 'index.html' : pathname);
  
  // Security check: prevent directory traversal
  if (!filePath.startsWith(STATIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If path has no extension and index.html exists, serve index.html for SPA routing
      if (!path.extname(filePath)) {
        filePath = path.join(STATIC_DIR, 'index.html');
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error reading file');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`GauMitra Web & AI Server running at http://localhost:${PORT}/`);
  const hasKey = !!(process.env.GROK_API_KEY || process.env.XAI_API_KEY);
  console.log(`Grok API Key configured: ${hasKey ? 'YES (' + (process.env.GROK_MODEL || 'grok-beta') + ')' : 'NO (Running in smart local fallback mode until GROK_API_KEY is set in .env)'}`);
});
