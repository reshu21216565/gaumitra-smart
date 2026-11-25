// Netlify serverless function for GauMitra AI & Backend APIs
const DEFAULT_KEY = process.env.GROQ_API_KEY || process.env.GROK_API_KEY || '';
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

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

function searchProducts(query, products) {
  if (!Array.isArray(products) || !products.length) return [];
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];

  const rawTokens = q.replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, ' ').split(/\s+/).filter(Boolean);
  const tokens = rawTokens.filter(t => !STOP_WORDS.has(t) && (t.length >= 3 || /[^\u0000-\u007F]/.test(t)));

  const SYNONYMS = {
    'buffalo': ['buffalo', 'murrah', 'buffalos', 'buffaloes', 'bhains', 'bhais', 'గేదె', 'బర్రె', 'ముర్రా', 'भैंस', 'मुर्रा', 'எருமை', 'முர்ரா', 'ಎಮ್ಮೆ', 'ಕೋಣ', 'ಮುರ್ರಾ', 'എരുമ', 'പോത്ത്', 'മുറ'],
    'cow': ['cow', 'cows', 'gir', 'sahiwal', 'jersey', 'ongole', 'gai', 'gaay', 'cattle', 'ఆవు', 'గిర్', 'సాహివాల్', 'జెర్సీ', 'ఒంగోలు', 'गाय', 'गीर', 'साहीवाल', 'जर्सी', 'பசு', 'மாடு', 'கிர்', 'ಹಸು', 'ಗಿರ್', 'പശു', 'ഗിർ'],
    'calf': ['calf', 'calves', 'bachhda', 'bachhiya', 'దూడ', 'బచ్చా', 'बछड़ा', 'बछिया', 'கன்று', 'ಕರು', 'കിടാവ്'],
    'milk': ['milk', 'ghee', 'paneer', 'curd', 'dairy', 'milking', 'yield', 'lactation', 'calcium', 'పాలు', 'నెయ్యి', 'పెరుగు', 'పాల', 'दूध', 'घी', 'पनीर', 'दही', 'दुग्ध', 'பால்', 'நெய்', 'தயிர்', 'ಹಾಲು', 'ತುಪ್ಪ', 'ಮೊಸರು', 'പാൽ', 'നെയ്യ്', 'തൈര്'],
    'nutrition': ['feed', 'mineral', 'pellets', 'fodder', 'silage', 'mix', 'nutrition', 'starter', 'calcium', 'food', 'diet', 'పోషణ', 'ఆహారం', 'దాణా', 'గడ్డి', 'ఖనిజం', 'पोषण', 'आहार', 'चारा', 'खनिज', 'ஊட்டச்சத்து', 'தீவனம்', 'மினரல்', 'ಪೋಷಣೆ', 'ಮೇವು', 'ಖನಿಜ', 'പോഷണം', 'തീറ്റ', 'ധാതുക്കൾ'],
    'feed': ['feed', 'fodder', 'silage', 'pellets', 'chara', 'daana', 'mineral', 'food', 'diet', 'ration', 'grass', 'దాణా', 'గడ్డి', 'సైలేజ్', 'పెల్లెట్స్', 'चारा', 'दाना', 'साइलेज', 'தீவனம்', 'புல்', 'சைலேஜ்', 'ಮೇವು', 'ಹುಲ್ಲು', 'തീറ്റ', 'പുല്ല്'],
    'medicine': ['med', 'medicine', 'medicines', 'dawa', 'calcium', 'dewormer', 'vaccine', 'fmd', 'tick', 'spray', 'probiotic', 'health', 'sick', 'మందు', 'మందులు', 'టీకా', 'కాల్షియం', 'दवा', 'दवाई', 'टीका', 'कैल्शियम', 'மருந்து', 'தடுப்பூசி', 'ಔಷಧಿ', 'ಲಸಿಕೆ', 'മരുന്ന്', 'കുത്തിവയ്പ്പ്'],
    'doctor': ['doctor', 'vet', 'appointment', 'visit', 'checkup', 'vaccination', 'emergency', 'consultation', 'డాక్టర్', 'వైద్యుడు', 'సందర్శన', 'डॉक्टर', 'पशु चिकित्सक', 'மருத்துவர்', 'கால்நடை மருத்துவர்', 'ವೈದ್ಯ', 'ಪಶು ವೈದ್ಯ', 'ഡോക്ടർ', 'മൃഗഡോക്ടർ'],
    'tool': ['tool', 'tools', 'machine', 'chaff', 'cutter', 'milk can', 'trough', 'equipment', 'యంత్రం', 'మిషన్', 'కట్టర్', 'పరికరం', 'मशीन', 'उपकरण', 'कटर', 'இயந்திரம்', 'கருவி', 'ಯಂತ್ರ', 'ಉಪಕರಣ', 'യന്ത്രം', 'ഉപകരണം'],
    'manure': ['manure', 'vermicompost', 'dung', 'compost', 'biogas', 'khat', 'fertilizer', 'ఎరువు', 'పేడ', 'బయోగ్యాస్', 'खाद', 'गोबर', 'बायोगैस', 'உரம்', 'சாணம்', 'ಗೊಬ್ಬರ', 'ಸಗಣಿ', 'വളം', 'ചാണകം']
  };

  const expandedTerms = new Set(tokens);
  tokens.forEach(tok => {
    Object.keys(SYNONYMS).forEach(cat => {
      if (SYNONYMS[cat].some(syn => syn === tok || (syn.includes(' ') && q.includes(syn)))) {
        expandedTerms.add(syn);
        expandedTerms.add(cat);
      }
    });
  });

  const isFoodQuery = /(food|feed|nutrition|diet|chara|daana|fodder|silage|pellet|ఆహారం|దాణా|గడ్డి|चारा|दाना|தீவனம்|மேவு|തീറ്റ)/i.test(q);
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

      if (isFoodQuery && !isToolQuery && (cat === 'tools' || name.includes('machine') || name.includes('cutter'))) {
        return { product: p, score: -100 };
      }

      if (isYieldQuery && !isToolQuery && (cat === 'tools' || name.includes('machine'))) {
        return { product: p, score: -100 };
      }

      if (fullText.includes(q)) score += 30;

      tokens.forEach(t => {
        if (name.includes(t)) score += 15;
        if (breed.includes(t)) score += 15;
        if (cat.includes(t)) score += 10;
        if (brand.includes(t)) score += 8;
        if (desc.includes(t)) score += 5;
      });

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

function generateFallbackResponse(userQuery, matchedProducts, language) {
  const q = (userQuery || '').toLowerCase();
  const lang = language || 'en';

  if (q.includes('buffalo') || q.includes('murrah') || q.includes('bhains') || q.includes('గేదె') || q.includes('எருமை') || q.includes('ಎಮ್ಮೆ') || q.includes('എരുമ')) {
    const ids = matchedProducts.length ? matchedProducts.map(p => p.id) : [1, 12, 6];
    let reply = `Here are the top buffalo options and high-yielding Murrah breeds available on GauMitra:`;
    if (lang === 'hi') reply = `गौमित्र पर उच्च दुग्ध उत्पादन के लिए मुर्रा भैंस और पूरक आहार उपलब्ध हैं:`;
    if (lang === 'te') reply = `ఎక్కువ పాల దిగుబడి ఇచ్చే ముర్రా గేదెలు మరియు సంబంధిత దాణా ఉత్పత్తులు ఇక్కడ ఉన్నాయి:`;
    if (lang === 'ta') reply = `கௌமித்ராவில் அதிக பால் தரும் முர்ரா எருமைகள் மற்றும் எருமை தீவனங்கள்:`;
    if (lang === 'kn') reply = `ಗೌಮಿತ್ರದಲ್ಲಿ ಹೆಚ್ಚು ಹಾಲು ನೀಡುವ ಮುರ್ರಾ ಎಮ್ಮೆಗಳು ಮತ್ತು ಪೂರಕ ಮೇವು ಉತ್ಪನ್ನಗಳು ಇಲ್ಲಿವೆ:`;
    if (lang === 'ml') reply = `ഗൗമിത്രയിൽ കൂടുതൽ പാൽ നൽകുന്ന മുറ എരുമകളും തീറ്റ ഉൽപ്പന്നങ്ങളും:`;
    return { reply, productIds: ids };
  }

  if (q.includes('milk') || q.includes('yield') || q.includes('production') || q.includes('doodh') || q.includes('పాలు') || q.includes('பால்') || q.includes('ಹಾಲು') || q.includes('പാൽ')) {
    const ids = matchedProducts.length ? matchedProducts.map(p => p.id) : [12, 6, 7];
    let reply = `To boost milk yield and support healthy lactation, we recommend our proven calcium liquid supplements and balanced mineral mixes:`;
    if (lang === 'hi') reply = `दूध का उत्पादन और वसा (Fat) बढ़ाने के लिए निम्नलिखित उच्च-कैल्शियम और खनिज उत्पाद सर्वोत्तम हैं:`;
    if (lang === 'te') reply = `పాల దిగుబడిని పెంచడానికి ఉత్తమమైన కాల్షియం మరియు మినరల్ మిశ్రమాలు ఇక్కడ ఉన్నాయి:`;
    if (lang === 'ta') reply = `பால் உற்பத்தியை அதிகரிக்க கால்சியம் திரவம் மற்றும் தாது கலவை தீவனம் பரிந்துரைக்கப்படுகிறது:`;
    if (lang === 'kn') reply = `ಹಾಲಿನ ಉತ್ಪಾದನೆ ಹೆಚ್ಚಿಸಲು ಕ್ಯಾಲ್ಸಿಯಂ ದ್ರವ ಮತ್ತು ಮಿನರಲ್ ಮಿಕ್ಸ್ ಅತ್ಯುತ್ತಮ:`;
    if (lang === 'ml') reply = `പാൽ ഉത്പാദനം വർദ്ധിപ്പിക്കുന്നതിന് കാൽസ്യം ദ്രാവകവും മിനറൽ മിശ്രിതവും:`;
    return { reply, productIds: ids };
  }

  if (matchedProducts.length > 0) {
    let intro = `Here are the matching products and services available on GauMitra for your request:`;
    if (lang === 'hi') intro = `गौमित्र पर आपकी खोज के अनुसार निम्नलिखित उत्पाद उपलब्ध हैं:`;
    if (lang === 'te') intro = `మీ శోధన ప్రకారం గౌమిత్రలో లభించే ఉత్పత్తులు ఇక్కడ ఉన్నాయి:`;
    if (lang === 'ta') intro = `உங்கள் கேள்விக்கு ஏற்ப கௌமித்ராவில் கிடைக்கும் பொருட்கள்:`;
    if (lang === 'kn') intro = `ನಿಮ್ಮ ಹುಡುಕಾಟಕ್ಕೆ ಸೂಕ್ತವಾದ ಗೌಮಿತ್ರ ಉತ್ಪನ್ನಗಳು:`;
    if (lang === 'ml') intro = `നിങ്ങളുടെ അന്വേഷണത്തിന് അനുയോജ്യമായ ഉൽപ്പന്നങ്ങൾ:`;
    return { reply: intro, productIds: matchedProducts.map(p => p.id) };
  }

  return {
    reply: `Hello! I am GauMitra's AI farm assistant. I can help you discover buffaloes, cows, balanced feeds, milk-boosting mineral mixes, veterinary medicines, milking machines, and certified vet doctor visits. How can I help you today?`,
    productIds: []
  };
}

async function callGrokAPI(userQuery, conversation, language, allProducts, storeInfo) {
  const apiKey = DEFAULT_KEY;
  if (!apiKey) return null;

  const isGroq = apiKey.startsWith('gsk_');
  const endpoint = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.x.ai/v1/chat/completions';
  const model = DEFAULT_MODEL;

  const relevantProducts = searchProducts(userQuery, allProducts);

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
Keep answers helpful, direct, and concise (at most 2 to 3 sentences). NEVER output markdown tables.

CURRENT GAUMITRA CATALOG (LIVE DATABASE):
${catalogSummary}

RULES FOR RECOMMENDING PRODUCTS:
1. When recommending or displaying products, ALWAYS include their numeric IDs from the LIVE CATALOG in this EXACT format at the very end of your response:
   [PRODUCTS: id1, id2, ...]
2. If the user asks about food, feed, or nutrition for an animal, recommend feed items like pellets, mineral mix, green fodder, silage, or lick blocks. NEVER recommend milking machines, chaff cutters, or equipment for food/feed questions.
3. If the user asks about increasing milk production, recommend Calcium liquid and Dairy mineral mix.
4. For off-topic or refused questions, DO NOT include any [PRODUCTS: ...] tag.`;

  const grokMessages = [{ role: 'system', content: systemPrompt }];

  if (Array.isArray(conversation)) {
    conversation.slice(-8).forEach(msg => {
      if (msg && msg.role && msg.content) {
        grokMessages.push({
          role: msg.role === 'u' || msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content.replace(/\[PRODUCTS:.*?\]/gi, '').trim()
        });
      }
    });
  }

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

    if (!response.ok) return null;

    const data = await response.json();
    const rawReply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';

    let productIds = [];
    const match = rawReply.match(/\[PRODUCTS?:\s*([0-9,\s]+)\]/i);
    if (match) {
      productIds = match[1].split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    }

    let cleanReply = rawReply.replace(/\[PRODUCTS?:\s*([0-9,\s]+)\]/gi, '').trim();
    cleanReply = cleanReply.replace(/\|.*\|/g, '').replace(/\n\s*[-|:]+\s*\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

    if (!productIds.length && relevantProducts.length > 0) {
      const isSearchIntent = /(show|find|product|buy|buffalo|cow|feed|calcium|medicine|price|cost|equipment|machine|ghee|dung|visit|vaccine|food|chara|nutrition)/i.test(userQuery);
      if (isSearchIntent) {
        productIds = relevantProducts.slice(0, 4).map(p => p.id);
      }
    }

    return { reply: cleanReply, productIds };
  } catch (error) {
    return null;
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const path = event.path || '';

  // GET /api/health
  if (event.httpMethod === 'GET' || path.endsWith('/health')) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        configured: !!DEFAULT_KEY,
        provider: 'Groq',
        model: DEFAULT_MODEL,
        platform: 'Netlify Functions'
      })
    };
  }

  // POST /api/chat
  if (event.httpMethod === 'POST') {
    try {
      const payload = JSON.parse(event.body || '{}');
      const userQuery = (payload.message || '').trim();
      const conversation = payload.conversation || [];
      const language = payload.language || 'en';
      const products = Array.isArray(payload.products) ? payload.products : [];
      const storeInfo = payload.storeInfo || {};

      if (!userQuery) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message is required' }) };
      }

      if (isOffTopicQuery(userQuery)) {
        const refusal = getOffTopicRefusal(language);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ reply: refusal, productIds: [], products: [], isGrok: false })
        };
      }

      const grokResult = await callGrokAPI(userQuery, conversation, language, products, storeInfo);

      let finalReply = '';
      let finalProductIds = [];

      if (grokResult && grokResult.reply) {
        finalReply = grokResult.reply;
        finalProductIds = grokResult.productIds || [];
      } else {
        const searchMatches = searchProducts(userQuery, products);
        const fallback = generateFallbackResponse(userQuery, searchMatches, language);
        finalReply = fallback.reply;
        finalProductIds = fallback.productIds || [];
      }

      const resolvedProducts = finalProductIds
        .map(id => products.find(p => p && p.id === id))
        .filter(Boolean);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          reply: finalReply,
          productIds: finalProductIds,
          products: resolvedProducts,
          isGrok: !!grokResult
        })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Internal server error', details: err.message })
      };
    }
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Not found' })
  };
};
