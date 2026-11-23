// Kinglet 24/7 Intelligent AI Concierge & Helpline Engine
// Supports Fluent Bengali (বাংলা), English, and Banglish (রোমান বাংলা)
// Polite, respectful, empathetic, and culturally accurate for Bangladesh luxury furniture

import { BRAND_INFO, PRODUCTS } from "../data/kingletData.js";

/**
 * Detect language style of the user prompt
 * @param {string} text
 * @returns {'bangla' | 'banglish' | 'english'}
 */
export function detectLanguage(text = "") {
  // Check for Bengali Unicode characters
  const hasBengaliChar = /[\u0980-\u09FF]/.test(text);
  if (hasBengaliChar) return "bangla";

  const lower = text.toLowerCase();

  // Common Banglish stopwords and phonetics
  const banglishPatterns = [
    /\b(koto|kemon|ache|achen|apnader|apnar|hobe|chai|bhai|bhaia|kivabe|kibhabe|ki|shomoy|somoy|somossa|shomossha)\b/,
    /\b(kath|kat|dam|khoroch|khata|khat|palla|lagbe|parbo|deya|diben|dhaka|dhakar|baire|chabi|almirah|almari)\b/,
    /\b(ei|eta|oita|amader|amar|janan|bolen|dorkar|valo|bhalo|segun|mehegoni|mehogoni|jam|kalo)\b/,
    /\b(kothay|kokhon|asbe|pathaben|thikana|bari|basha|poshondo|kinbo|kiste|kisti)\b/
  ];

  const isBanglish = banglishPatterns.some(pattern => pattern.test(lower));
  if (isBanglish) return "banglish";

  return "english";
}

/**
 * Smart Response Generator
 * @param {string} userInput
 * @returns {{ reply: string, suggestions: string[], actionType?: string }}
 */
export function getChatbotResponse(userInput = "") {
  const cleanInput = userInput.trim();
  if (!cleanInput) {
    return {
      reply: "আসসালামু আলাইকুম! Kinglet Furniture 24/7 হেল্পলাইনে আপনাকে স্বাগতম। আপনি কীভাবে সহায়তা চান জানাতে পারেন — বাংলা, English বা Banglish-এ প্রশ্ন করতে পারেন।",
      suggestions: ["খাটের সাইজ ও দাম", "ডেলিভারি চার্জ ও সময়", "শোরুমের ঠিকানা", "সমস্যা রিপোর্ট করুন"]
    };
  }

  const lang = detectLanguage(cleanInput);
  const lower = cleanInput.toLowerCase();

  // Normalize phonetic variations in Banglish/English
  const norm = lower
    .replace(/[?!.,;:]/g, "")
    .replace(/\s+/g, " ");

  // 1. GREETINGS
  if (
    /^(hi|hello|hey|salam|assalam|assalamu|kemon achen|kemon asen|halo|good morning|good evening)\b/.test(norm) ||
    /^(হ্যালো|সালাম|আসসালামু আলাইকুম|কেমন আছেন|নমস্কার)/.test(cleanInput)
  ) {
    if (lang === "bangla") {
      return {
        reply: "ওয়ালাইকুম আসসালাম! কিংলেট ফার্নিচার ২৪/৭ হেল্পলাইনে আপনাকে স্বাগতম। আমি আপনার ভার্চুয়াল কনসিয়ার্জ। আমাদের অথেনটিক মেটেরিয়াল, বেড ও আলমারির সাইজ, ডেলিভারি, ইএমআই বা যেকোনো সার্ভিস নিয়ে প্রশ্ন করতে পারেন।",
        suggestions: ["বেড ও সাইজ অপশন", "মেটেরিয়াল ও কাঠ", "ঢাকার বাইরে ডেলিভারি", "সমস্যা রিপোর্ট করুন"]
      };
    } else if (lang === "banglish") {
      return {
        reply: "Walaikum Assalam! Kinglet Furniture-er 24/7 helpline-e apnake shagotom. Ami apnake kivabe help korte pari? Bed er size, almari, delivery, EMI ba showroom niye jekono prosno korte paren.",
        suggestions: ["Bed er size & dam", "Showroom er thikana", "Delivery charge koto?", "Problem report kora"]
      };
    } else {
      return {
        reply: "Greetings from Kinglet Furniture 24/7 Helpline! How may I assist you today? Feel free to ask about our premium bedroom & living suites, dimensions, materials, 0% EMI, or delivery.",
        suggestions: ["Bed Sizes & Sizing", "Showroom Location & Hours", "Delivery & Assembly", "Report an Issue"]
      };
    }
  }

  // 2. MATERIALS & WOOD (Authentic 5 materials strictly, zero Teak/Segun)
  if (
    norm.includes("material") || norm.includes("wood") || norm.includes("kath") || norm.includes("kat") ||
    norm.includes("timber") || norm.includes("mehegony") || norm.includes("mahogany") ||
    norm.includes("black plum") || norm.includes("kalo jam") || norm.includes("jam kath") ||
    norm.includes("veneer") || norm.includes("oak") || norm.includes("engineering") ||
    norm.includes("processed") || norm.includes("segun") || norm.includes("teak") ||
    cleanInput.includes("কাঠ") || cleanInput.includes("মেটেরিয়াল") || cleanInput.includes("সেগুন") || cleanInput.includes("মেহগনি")
  ) {
    if (norm.includes("segun") || norm.includes("teak") || cleanInput.includes("সেগুন")) {
      if (lang === "bangla") {
        return {
          reply: "একটি গুরুত্বপূর্ণ তথ্য: কিংলেট ফার্নিচারে সেগুন কাঠ ব্যবহার করা হয় না। আমাদের প্রতিটি ফার্নিচার শতভাগ অথেনটিক ৫টি বাছাইকৃত কাঠের সমন্বয়ে তৈরি:\n\n১. Seasoned Mahogany (সিজনড মেহগনি)\n২. Black Plum Wood (কালো জাম কাঠ)\n৩. Canadian Oak Veneer (কানাডিয়ান ওক ভিনিয়ার)\n৪. German Oak Veneer Wood (জার্মান ওক ভিনিয়ার কাঠ)\n৫. Engineering Processed Wood (প্রসেসড ইঞ্জিনিয়ারিং উড)\n\nপ্রতিটি কাঠ কেমিক্যাল ভ্যাকিউম প্রেশার ট্রিটমেন্ট ও কিল্ন ড্রাইড করা এবং এতে ১০ বছরের অ্যান্টি-ঘুণ ও উইপোকা গ্যারান্টি রয়েছে।",
          suggestions: ["মেহগনি খাটের কালেকশন", "১০ বছরের ওয়ারেন্টি পলিসি", "শোরুমে কাঠ দেখতে চাই"]
        };
      } else if (lang === "banglish") {
        return {
          reply: "Polite clarification: Kinglet Furniture-e Segun / Teak wood use kora hoy na. Amader shob furniture 5-ti premium authentic material diye toiri:\n\n1. Seasoned Mahogany\n2. Black Plum Wood (Kalo Jam Kath)\n3. Canadian Oak Veneer\n4. German Oak Veneer Wood\n5. Engineering Processed Wood\n\nShobgulo timber kiln-seasoned and 100% termite proof with 10-Year Timber Warranty!",
          suggestions: ["Bed er dam & size", "Warranty kivabe pabo?", "Showroom location"]
        };
      } else {
        return {
          reply: "Please note: Kinglet Furniture does NOT use Segun / Teak wood. We handcraft our furniture exclusively with 5 authentic, legally verified materials:\n\n1. Seasoned Mahogany\n2. Black Plum Wood\n3. Canadian Oak Veneer\n4. German Oak Veneer Wood\n5. Engineering Processed Wood\n\nAll timbers are vacuum-pressure treated and kiln-dried to 10% moisture with a 10-Year Timber Warranty.",
          suggestions: ["View Bedroom Suites", "Warranty Terms", "Visit Mirpur Showroom"]
        };
      }
    }

    if (lang === "bangla") {
      return {
        reply: "কিংলেট ফার্নিচারের সকল পণ্য ৫টি সার্টিফায়েড মেটেরিয়াল দ্বারা তৈরি:\n• Seasoned Mahogany (মেহগনি)\n• Black Plum Wood (কালো জাম কাঠ)\n• Canadian Oak Veneer (কানাডিয়ান ওক ভিনিয়ার)\n• German Oak Veneer Wood (জার্মান ওক ভিনিয়ার)\n• Engineering Processed Wood (ইঞ্জিনিয়ারিং উড)\n\nএগুলোর সাথে ব্যবহার করা হয় জার্মান হাইড্রোলিক সফট-ক্লোজ ফিটিংস এবং ৫-লেয়ার ইতালিয়ান পিইউ পলিশ।",
        suggestions: ["১০ বছরের ওয়ারেন্টি নিয়ম", "বেডের সাইজসমূহ", "কাস্টম সাইজ তৈরি সম্ভব?"]
      };
    } else if (lang === "banglish") {
      return {
        reply: "Kinglet Furniture-er authentic 5-ti material:\n1. Seasoned Mahogany\n2. Black Plum Wood (Kalo Jam Kath)\n3. Canadian Oak Veneer\n4. German Oak Veneer Wood\n5. Engineering Processed Wood\n\nShob kathi 100% seasoned, Italian PU finish ebong German hydraulic soft-close hardware shoh toiri.",
        suggestions: ["Bed er collection", "Showroom visit", "0% EMI information"]
      };
    } else {
      return {
        reply: "Kinglet Furniture utilizes 5 authentic, kiln-seasoned materials:\n1. Seasoned Mahogany\n2. Black Plum Wood\n3. Canadian Oak Veneer\n4. German Oak Veneer Wood\n5. Engineering Processed Wood\n\nPaired with German hydraulic soft-close hardware and Italian PU lacquer finishes.",
        suggestions: ["View Bed Catalog", "10-Year Warranty Details", "Direct WhatsApp Chat"]
      };
    }
  }

  // 3. BED SIZES & PRICING
  if (
    norm.includes("bed") || norm.includes("khat") || norm.includes("king size") || norm.includes("queen size") ||
    cleanInput.includes("খাট") || cleanInput.includes("বেড") || cleanInput.includes("কিং সাইজ") || cleanInput.includes("কুইন সাইজ")
  ) {
    if (lang === "bangla") {
      return {
        reply: "আমাদের সকল খাটের সাইজ সুনির্দিষ্টভাবে দুই প্রকারে তৈরি হয়:\n\n• King Size: ৬.৫ ফিট × ৬.০ ফিট (মাস্টার বেডরুমের জন্য আদর্শ)\n• Queen Size: ৬.৫ ফিট × ৫.০ ফিট (স্ট্যান্ডার্ড ফ্যামিলি সাইজ)\n\nপ্রতিটি খাটের সাথে ম্যাচিং সাইড টেবিল ও ড্রেসিং ইউনিট নেওয়া সম্ভব। দাম শুরু হয় ৳৪২,০০০ থেকে। আপনি কি কোনো নির্দিষ্ট মডেলের ছবি বা ভিডিও দেখতে চান?",
        suggestions: ["হোয়াটসঅ্যাপে ভিডিও দেখুন", "পিউর ভিনিয়ার বেড", "উডোরা কিং বেড", "ডেলিভারি চার্জ"]
      };
    } else if (lang === "banglish") {
      return {
        reply: "Kinglet-er shob bed 2-ti standard size-e paben:\n• King Size: 6.5 ft x 6.0 ft\n• Queen Size: 6.5 ft x 5.0 ft\n\nBed er starting price shuru ৳42,000 theke. Seasoned Mahogany & Oak Veneer-e toiri with 10-Year Warranty. Apni WhatsApp-e showroom theke live video dekhte paren!",
        suggestions: ["Pure Veneer Bed", "Woodora Bed", "WhatsApp Video Desk", "Showroom er thikana"]
      };
    } else {
      return {
        reply: "All Kinglet beds are crafted in two standardized dimensions:\n• King Size: 6.5 ft x 6.0 ft (Luxurious master bedroom spec)\n• Queen Size: 6.5 ft x 5.0 ft (Standard apartment spec)\n\nPricing starts from ৳42,000 with genuine Italian PU finish and 10-Year timber warranty.",
        suggestions: ["Pure Veneer Bed (Queen)", "Grain Craft King Bed", "Ask for Showroom Video"]
      };
    }
  }

  // 4. ALMIRAH & WARDROBE (2 Part, 3 Part, 4 Part)
  if (
    norm.includes("almirah") || norm.includes("almira") || norm.includes("wardrobe") ||
    norm.includes("almari") || norm.includes("part") || norm.includes("palla") || norm.includes("door") ||
    cleanInput.includes("আলমারি") || cleanInput.includes("ওয়ারড্রব") || cleanInput.includes("পাল্লা") || cleanInput.includes("পার্ট")
  ) {
    if (lang === "bangla") {
      return {
        reply: "কিংলেটের আলমারি ও ওয়ারড্রব ৩টি নির্ধারিত পার্ট কনফিগারেশনে পাওয়া যায়:\n\n• 2 Part (২ পাল্লা): কম্প্যাক্ট বেডরুমের জন্য উপযোগী (৩.৫ - ৪.০ ফিট চওড়া)\n• 3 Part (৩ পাল্লা): স্ট্যান্ডার্ড ফ্যামিলি স্পেসিফিকেশন (৪.৫ - ৫.০ ফিট চওড়া)\n• 4 Part (৪ পাল্লা): মাস্টার স্যুইট লাক্সারি (৬.০ ফিট চওড়া × ৬.৫ ফিট উচ্চতা)\n\nপ্রতিটিতে গোপন লকার ভল্ট, নরম ড্রয়ার এবং জার্মান হাইড্রোলিক সফট-ক্লোজ কব্জা অন্তর্ভুক্ত।",
        suggestions: ["সানফ্লোরা ৪-পার্ট আলমারি", "ভেরোনা ৩-পার্ট আলমারি", "ইম্পেরিয়াল স্লাইডিং আলমারি"]
      };
    } else if (lang === "banglish") {
      return {
        reply: "Kinglet Almirah & Wardrobe 3-ti standard configuration-e toiri hoy:\n• 2 Part (2-Door): Compact size\n• 3 Part (3-Door): Standard family size\n• 4 Part (4-Door): Master bedroom luxury\n\nShob almirah-te internal locker, hanger section ebong soft-close hinges thake. Dam shuru ৳54,000 theke.",
        suggestions: ["Sunflora 4 Part Almira", "Verona 3 Part Almirah", "Showroom er location"]
      };
    } else {
      return {
        reply: "Kinglet wardrobes and almirahs come in 3 factory configurations:\n• 2 Part (2-Door): Compact bedrooms (3.5 - 4.0 ft W)\n• 3 Part (3-Door): Standard family sizing (4.5 - 5.0 ft W)\n• 4 Part (4-Door): Grand master suites (6.0 ft W x 6.5 ft H)\n\nEach includes internal security lockers and German soft-close hydraulic fittings.",
        suggestions: ["Sunflora 4-Door Almirah", "Crown 3-Door Wardrobe", "0% EMI Details"]
      };
    }
  }

  // 5. REPORT A PROBLEM / COMPLAINT / ISSUE (Highest Priority Customer Care)
  if (
    norm.includes("problem") || norm.includes("complain") || norm.includes("complaint") ||
    norm.includes("somossa") || norm.includes("shomossha") || norm.includes("damage") ||
    norm.includes("scratch") || norm.includes("bhanga") || norm.includes("kharap") ||
    norm.includes("late") || norm.includes("delay") || norm.includes("repurt") || norm.includes("report") ||
    cleanInput.includes("সমস্যা") || cleanInput.includes("অভিযোগ") || cleanInput.includes("রিপোর্ট") || cleanInput.includes("ভাঙা")
  ) {
    if (lang === "bangla") {
      return {
        reply: "আমরা অত্যন্ত আন্তরিকভাবে দুঃখিত যেকোনো অসুবিধার জন্য! কিংলেট কাস্টমার স্যাটিসফ্যাকশনকে সর্বোচ্চ গুরুত্ব দেয়।\n\nআপনি উপরের 'Report an Issue' ট্যাবে গিয়ে সরাসরি আপনার অভিযোগ বা সমস্যা সাবমিট করতে পারেন অথবা এখনই আমাদের কাস্টমার কেয়ার প্রধানের সাথে কথা বলতে পারেন। প্রতিটি অভিযোগের একটি অফিসিয়াল টিকিট আইডি ইস্যু করা হয় এবং ২৪ ঘণ্টার মধ্যে সমাধান করা হয়।",
        suggestions: ["সমস্যা রিপোর্ট ফরম খুলুন", "হোয়াটসঅ্যাপে দ্রুত সমাধান", "ম্যানেজারকে সরাসরি কল"]
      };
    } else if (lang === "banglish") {
      return {
        reply: "Apnar shomosshar jonno amra ontor theke dukhito! Kinglet Customer Care shob shomoy apnar pashe ache.\n\nUpore 'Report an Issue' tab theke apnar problem-ti submit korle ekta official Ticket ID generate hobe ebong 24 ghontar moddhe solve kora hobe. Hotline-eo sorasori kotha bolte paren.",
        suggestions: ["Report Issue Form", "Direct WhatsApp Escalation", "Call Customer Support"]
      };
    } else {
      return {
        reply: "We sincerely apologize for any inconvenience caused. At Kinglet, customer satisfaction is our top commitment.\n\nYou can submit an urgent service request using the 'Report an Issue' tab above to generate an official Ticket ID, or contact our support supervisor directly on WhatsApp for immediate priority resolution.",
        suggestions: ["Open Problem Report Form", "Urgent WhatsApp Escalation", "Call Manager Directly"]
      };
    }
  }

  // 6. DELIVERY, TIMELINES & CHARGES
  if (
    norm.includes("delivery") || norm.includes("shipping") || norm.includes("charge") ||
    norm.includes("dhaka") || norm.includes("baire") || norm.includes("courier") ||
    norm.includes("fitting") || norm.includes("assembly") || norm.includes("mistri") ||
    cleanInput.includes("ডেলিভারি") || cleanInput.includes("খরচ") || cleanInput.includes("ফিটিং") || cleanInput.includes("শিপিং")
  ) {
    if (lang === "bangla") {
      return {
        reply: "কিংলেট ফার্নিচারের ডেলিভারি পলিসি:\n\n• ঢাকা সিটির ভেতরে:\n- সময়: ২৪ থেকে ৪৮ ঘণ্টার মধ্যে।\n- ডেলিভারি চার্জ: আপনার লোকেশনের ওপর ভিত্তি করে নির্ধারিত (Delivery Fee: Based on your location)।\n- ক্যাশ অন ডেলিভারি (COD) প্রযোজ্য।\n\n• ঢাকা সিটির বাইরে (সারা বাংলাদেশ):\n- সময়: ৩ থেকে ৫ কার্যদিবস (সুন্দরবন/এসএ পরিবহন/স্পেশাল কাভার্ড ভ্যান)।\n- ডেলিভারি চার্জ: Based on location / district।\n- প্রিমিয়াম মাল্টি-লেয়ার প্রটেক্টিভ র‍্যাপিং যাতে কোনো স্ক্র্যাচ বা ক্ষতি না হয়।",
        suggestions: ["অর্ডার ট্র্যাক করুন", "হোয়াটসঅ্যাপে ডেলিভারি ডেস্কে কথা বলুন", "পেমেন্ট মেথড"]
      };
    } else if (lang === "banglish") {
      return {
        reply: "Kinglet Delivery Information:\n\n• Inside Dhaka:\n- 24 to 48 hours delivery time.\n- Delivery Fee: Based on your location.\n- Cash on Delivery available.\n\n• Outside Dhaka (All Bangladesh):\n- 3 to 5 days via dedicated courier/covered van.\n- Delivery Fee: Based on location / district.\n- Premium multi-layer protective wrapping for scratch-free transit.",
        suggestions: ["Track my order", "WhatsApp Hotline", "Showroom address"]
      };
    } else {
      return {
        reply: "Kinglet Delivery Terms:\n\n• Inside Dhaka City:\n- Delivery within 24 to 48 hours.\n- Delivery Fee: Based on your location.\n- Cash on Delivery available.\n\n• Outside Dhaka City (All Districts):\n- 3 to 5 business days via SA Paribahan / Sundarban / Covered Van.\n- Delivery Fee: Based on location / district.\n- Premium multi-layer protective wrapping for scratch-free safe transit.",
        suggestions: ["Track Your Order", "Call Delivery Desk", "Payment Methods"]
      };
    }
  }

  // 6. SHOWROOM LOCATION & VISITING HOURS
  if (
    norm.includes("showroom") || norm.includes("location") || norm.includes("thikana") ||
    norm.includes("address") || norm.includes("mirpur") || norm.includes("shewrapara") ||
    norm.includes("branch") || norm.includes("kothay") || norm.includes("visit") ||
    norm.includes("open") || norm.includes("time") || norm.includes("shomoy") ||
    cleanInput.includes("শোরুম") || cleanInput.includes("ঠিকানা") || cleanInput.includes("মিরপুর") || cleanInput.includes("খোলা")
  ) {
    if (lang === "bangla") {
      return {
        reply: "আমাদের ফ্ল্যাগশিপ শোরুম ও ফ্যাক্টরি হাবের ঠিকানা:\n\n📍 ৭৫২/২, পশ্চিম শেওড়াপাড়া, বেগম রোকেয়া সরণি, মিরপুর, ঢাকা-১২১৬।\n(মিরপুর শেওড়াপাড়া মেট্রোরেল স্টেশন পিলারের নিকটবর্তী)\n\n⏰ খোলার সময়: রবিবার ব্যতীত প্রতিদিন সকাল ৯:০০ টা থেকে রাত ১০:০০ টা পর্যন্ত খোলা।\n📞 শোরুম হটলাইন: +8801676900442 / 01707073414\n\nআপনি শোরুমে এসে কাঠের স্যাম্পল এবং ফিনিশিং সরাসরি পরখ করতে পারেন।",
        suggestions: ["গুগল ম্যাপ ডিরেকশন", "হোয়াটসঅ্যাপে ভিডিও কল", "বুক শোরুম ভিজিট"]
      };
    } else if (lang === "banglish") {
      return {
        reply: "Kinglet Showroom & Factory Hub Address:\n📍 752/2, West Shewrapara, Begum Rokeya Sarani, Mirpur, Dhaka-1216.\n(Near Shewrapara Metro Rail Station)\n\n⏰ Opening Hours: Everyday except Sunday: 9:00 AM – 10:00 PM.\n📞 Hotline: +8801676900442 / 01707073414\n\nApni sorasori eshe wood sample & finishing check korte paren!",
        suggestions: ["Google Maps Link", "WhatsApp Call", "Showroom Booking"]
      };
    } else {
      return {
        reply: "Kinglet Flagship Showroom & Factory Hub:\n📍 752/2, West Shewrapara, Begum Rokeya Sarani, Mirpur, Dhaka-1216, Bangladesh.\n(Adjacent to Shewrapara Metro Rail Station)\n\n⏰ Visiting Hours: Everyday except Sunday: 9:00 AM – 10:00 PM.\n📞 Primary Hotline: +8801676900442\nSecondary Hotline: 01707073414",
        suggestions: ["Open in Google Maps", "Schedule a Visit", "Call Hotline Now"]
      };
    }
  }

  // 7. WARRANTY & ANTI-BORER GUARANTEE
  if (
    norm.includes("warranty") || norm.includes("guarantee") || norm.includes("ghun") ||
    norm.includes("termite") || norm.includes("borer") || norm.includes("nosto") ||
    norm.includes("bochor") || norm.includes("years") ||
    cleanInput.includes("ওয়ারেন্টি") || cleanInput.includes("গ্যারান্টি") || cleanInput.includes("ঘুণ") || cleanInput.includes("উইপোকা")
  ) {
    if (lang === "bangla") {
      return {
        reply: "কিংলেটের প্রতিটি সলিড উড ও ভিনিয়ার ফার্নিচারে রয়েছে ১০ বছরের অফিসিয়াল টিম্বার রিপ্লেসমেন্ট ওয়ারেন্টি:\n\n• ১০০% অ্যান্টি-ঘুণ ও উইপোকা মুক্ত গ্যারান্টি।\n• কেমিক্যাল ভ্যাকুয়াম প্রেশার ট্রিটমেন্ট ও কিল্ন ড্রাইং দ্বারা সিজনড।\n• ওয়ারেন্টি মেয়াদে কোনো উইপোকা বা স্ট্রাকচারাল সমস্যা দেখা দিলে আমাদের নিজস্ব টিম এসে ফ্রি সার্ভিসিং অথবা পার্টস রিপ্লেস করে দেয়।\n\nওয়ারেন্টি ক্লেইম করতে কেবল ইনভয়েস নাম্বার বা ক্রয়ের ফোন নাম্বার থাকলেই যথেষ্ট।",
        suggestions: ["ওয়ারেন্টি সার্টিফিকেট পলিসি", "সমস্যা রিপোর্ট করুন", "কাস্টমার কেয়ার কল"]
      };
    } else if (lang === "banglish") {
      return {
        reply: "Kinglet-er shob timber furniture-e 10 Years Timber Warranty & Anti-Borer Guarantee royeche!\n\nChemical vacuum pressure impregnation and kiln-drying kora thakay ghun ba termite dhorar kono chance nei. Konorokom shomossha hole Kinglet team free service ba part replacement kore dey.",
        suggestions: ["Problem report kora", "Showroom visit", "Hotline-e kotha bola"]
      };
    } else {
      return {
        reply: "Every Kinglet solid wood and veneer creation comes with a comprehensive 10-Year Timber Warranty:\n\n• 100% Anti-Borer & Termite Immunity.\n• Vacuum-pressure chemical treated & kiln-dried timber.\n• Full on-site inspection and free replacement/repair for any verified structural issues during the 10-year term.",
        suggestions: ["Read Warranty Terms", "Report a Warranty Issue", "Call Customer Support"]
      };
    }
  }

  // 8. 0% EMI & PAYMENT METHODS
  if (
    norm.includes("emi") || norm.includes("installment") || norm.includes("kisti") ||
    norm.includes("bank") || norm.includes("credit card") || norm.includes("bkash") ||
    norm.includes("cash on delivery") || norm.includes("cod") || norm.includes("advance") ||
    cleanInput.includes("ইএমআই") || cleanInput.includes("কিস্তি") || cleanInput.includes("পেমেন্ট") || cleanInput.includes("বিকাশ")
  ) {
    if (lang === "bangla") {
      return {
        reply: "পেমেন্ট এবং ০% ইএমআই সুবিধা:\n\n• ০% ইন্টারেস্ট ইএমআই (৩ থেকে ১২ মাস পর্যন্ত):\n১৮টি শীর্ষস্থানীয় ব্যাংকের ক্রেডিট কার্ডে পাওয়া যায় (City Bank Amex, BRAC Bank, SCB, EBL, DBBL, MTB, Prime Bank ইত্যাদি)।\n\n• অন্যান্য পেমেন্ট মেথড:\n- ক্যাশ অন ডেলিভারি (ঢাকার ভেতরে)\n- বিকাশ, নগদ, রকেট\n- ভিসা, মাস্টারকার্ড, অ্যামেক্স পয়েন্ট অফ সেল (POS) মেশিন হোম ডেলিভারিতে বহন করা হয়।",
        suggestions: ["ইএমআই ক্যালকুলেটর দেখুন", "চেকআউট পেজে যান", "হোয়াটসঅ্যাপে ইএমআই অর্ডার"]
      };
    } else if (lang === "banglish") {
      return {
        reply: "Kinglet-e 0% EMI facility ache up to 12 months for 18 leading Bangladeshi banks (City Amex, BRAC, EBL, SCB, DBBL etc.)!\n\nAdditionally, Cash on Delivery inside Dhaka, bKash, Nagad, and Card on Delivery POS machines are supported.",
        suggestions: ["0% EMI Calculator", "Proceed to Checkout", "WhatsApp Inquiry"]
      };
    } else {
      return {
        reply: "Kinglet Payment & 0% EMI Facilities:\n\n• 0% Interest EMI up to 12 months with 18 major Bangladeshi banks (City Bank Amex, BRAC Bank, Standard Chartered, EBL, DBBL, MTB, Prime Bank, etc.).\n• Accepted payments: Cash on Delivery (inside Dhaka), bKash, Nagad, POS Card swipe on delivery, Bank wire transfer.",
        suggestions: ["Open EMI Calculator", "Checkout Now", "Call Accounts Desk"]
      };
    }
  }

  // 9. ORDER TRACKING
  if (
    norm.includes("track") || norm.includes("tracking") || norm.includes("order status") ||
    norm.includes("kothay ache") || norm.includes("kokhon ashbe") || norm.includes("invoice") ||
    cleanInput.includes("ট্র্যাক") || cleanInput.includes("অর্ডার স্ট্যাটাস") || cleanInput.includes("কখন আসবে")
  ) {
    if (lang === "bangla") {
      return {
        reply: "আপনার অর্ডার ট্র্যাক করতে চান? আমাদের ওয়েবসাইটে ডেডিকেটেড লাইভ ট্র্যাকিং পেজ রয়েছে। আপনার ইনভয়েস নাম্বার (যেমন: KL-9842) দিয়ে তাৎক্ষণিক স্ট্যাটাস দেখতে পারবেন। অথবা আপনার ইনভয়েস নাম্বারটি এখানে লিখুন, আমি এখনই চেক করে দিচ্ছি।",
        suggestions: ["লাইভ অর্ডার ট্র্যাকার পেজ", "হোয়াটসঅ্যাপে স্ট্যাটাস জানুন", "হটলাইনে কল করুন"]
      };
    } else if (lang === "banglish") {
      return {
        reply: "Apnar order track korte amader Live Order Tracker use korte paren. Apnar Invoice No (e.g. KL-9842) ba phone number bolen, ami check kore dibo! Niche click kore direct tracking page-eo dekhte paren.",
        suggestions: ["Order Tracking Page", "WhatsApp Dispatcher", "Call Delivery Desk"]
      };
    } else {
      return {
        reply: "You can track your real-time production, seasoning, polish, and delivery status using your Kinglet Invoice Code (e.g. KL-9842) on our Track Order page.",
        suggestions: ["Open Track Order Page", "WhatsApp Dispatch Desk", "Call Hotline"]
      };
    }
  }

  // 11. TALK TO HUMAN AGENT / CALL
  if (
    norm.includes("human") || norm.includes("agent") || norm.includes("manush") ||
    norm.includes("call") || norm.includes("phone") || norm.includes("number") ||
    norm.includes("kotha bolbo") || norm.includes("kotha bolte chai") || norm.includes("hotline") ||
    cleanInput.includes("মানুষ") || cleanInput.includes("কথা বলতে চাই") || cleanInput.includes("কল") || cleanInput.includes("ফোন")
  ) {
    if (lang === "bangla") {
      return {
        reply: `আমাদের হিউম্যান সাপোর্ট টিম এখন লাইভ রয়েছেন। আপনি সরাসরি ফোন করতে পারেন:\n\n📞 প্রাইমারি হটলাইন: ${BRAND_INFO.hotlinePrimary}\n📞 ফ্যাক্টরি ও শোরুম হেল্পলাইন: ${BRAND_INFO.hotlineSecondary}\n💬 হোয়াটসঅ্যাপ ডিরেক্ট সাপোর্ট: ${BRAND_INFO.whatsapp}\n\nসকাল ৯টা থেকে রাত ১০টা পর্যন্ত আমাদের স্পেশালিস্টরা কল রিসিভ করতে প্রস্তুত।`,
        suggestions: ["হোয়াটসঅ্যাপে মেসেজ পাঠান", "সরাসরি ডায়াল করুন", "শোরুমের অবস্থান"]
      };
    } else if (lang === "banglish") {
      return {
        reply: `Amader human customer care agent-er shathe sorasori kotha bolte paren:\n\n📞 Primary Hotline: ${BRAND_INFO.hotlinePrimary}\n📞 Showroom Helpline: ${BRAND_INFO.hotlineSecondary}\n💬 WhatsApp Desk: ${BRAND_INFO.whatsapp}\n\n9:00 AM theke 10:00 PM porjonto amader team shobshomoy ready!`,
        suggestions: ["Direct Call Now", "WhatsApp Live Chat", "Showroom Thikana"]
      };
    } else {
      return {
        reply: `Our human specialists are available to assist you right now:\n\n📞 Primary Hotline: ${BRAND_INFO.hotlinePrimary}\n📞 Showroom & Factory Desk: ${BRAND_INFO.hotlineSecondary}\n💬 WhatsApp Concierge: ${BRAND_INFO.whatsapp}\n\nLines are open everyday (except Sunday) from 9:00 AM to 10:00 PM.`,
        suggestions: ["Call Primary Hotline", "Chat on WhatsApp", "Visit Showroom"]
      };
    }
  }

  // 12. FALLBACK / GENERAL HELPFUL RESPONSE
  if (lang === "bangla") {
    return {
      reply: `ধন্যবাদ আপনার বার্তার জন্য! কিংলেট ফার্নিচার ২৪/৭ হেল্পলাইন আপনার সেবায় নিয়োজিত। আপনি মেহগনি ও ওক ভিনিয়ার বেড, ৩/৪ পার্ট আলমারি, ডাইনিং সেট, ডেলিভারি তথ্য (Delivery Fee: Based on your location), ১০ বছরের অ্যান্টি-ঘুণ গ্যারান্টি বা শোরুম ভিজিট নিয়ে যেকোনো কিছু জানতে পারেন। আমি কীভাবে আপনাকে আরো তথ্য দিয়ে সাহায্য করতে পারি?`,
      suggestions: ["খাটের সাইজ ও দাম", "আলমারি কনফিগারেশন", "ডেলিভারি চার্জ", "হিউম্যান এজেন্টের সাথে কথা বলুন"]
    };
  } else if (lang === "banglish") {
    return {
      reply: `Dhonnobad apnar question er jonno! Kinglet Furniture-er Seasoned Mahogany, Black Plum Wood & Oak Veneer bedroom suites, almirah (2/3/4 part), 10-Year Timber Warranty, delivery (based on location) ba 0% EMI niye jekono info bolte pari. Apni ki showroom visit korte chan naki online order korte chan?`,
      suggestions: ["Bed er size & dam", "Delivery & Timeline", "Showroom er thikana", "Problem report kora"]
    };
  } else {
    return {
      reply: `Thank you for contacting Kinglet Furniture! We craft authentic solid wood furniture from seasoned Mahogany, Black Plum Wood, and Canadian/German Oak Veneer. How can we best assist you with products, custom dimensions, 0% EMI, or delivery?`,
      suggestions: ["Bed Sizes & Pricing", "Almirah Configurations", "Delivery & Timeline", "Speak with Human Agent"]
    };
  }
}
