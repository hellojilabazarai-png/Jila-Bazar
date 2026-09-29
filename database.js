import { memStorage } from "./storage.js";

/* ---------------------------- STORAGE LAYER ---------------------------- */
/* Mirrors a future Firebase Firestore structure:
   collections/users, collections/sellers, collections/products,
   collections/orders, collections/categories, collections/banners,
   collections/withdrawals, collections/notifications, collections/reviews,
   collections/tickets, collections/auditLogs
*/
export const DB_KEY = "jilabazar_db_v2_live";

 // ab sirf offline/error fallback backup ke liye use hota hai
export const SESSION_KEY = "jilabazar_session";

 // login session sirf isi device/browser tak rehta hai, Firebase mein kabhi nahi jaata
export function uid(prefix = "id") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nowISO() { return new Date().toISOString(); }

export const SEED = {
    users: [],
    sellers: [],
    products: [],
    categories: [
        { id: "c_1", name: "Popular", icon: "⭐", subcategories: [
            { name: "Trending Now", icon: "🔥" }, { name: "Top Rated", icon: "🌟" }, { name: "New Arrivals", icon: "🆕" },
        ] },
        { id: "c_2", name: "Women", icon: "👗", subcategories: [
            { name: "Sarees", icon: "🥻" }, { name: "Kurti & Suits", icon: "👘" }, { name: "Lehenga", icon: "👗" },
            { name: "Tops & Tunics", icon: "👚" }, { name: "Dresses", icon: "👗" }, { name: "Bottomwear", icon: "👖" },
        ] },
        { id: "c_3", name: "Men", icon: "👕", subcategories: [
            { name: "T-Shirts", icon: "👕" }, { name: "Shirts", icon: "👔" }, { name: "Jeans & Trousers", icon: "👖" },
            { name: "Ethnic Wear", icon: "🧥" }, { name: "Innerwear", icon: "🩲" },
        ] },
        { id: "c_4", name: "Kids & Toys", icon: "🧸", subcategories: [
            { name: "Boys Clothing", icon: "👦" }, { name: "Girls Clothing", icon: "👧" }, { name: "Toys", icon: "🧸" },
            { name: "Baby Care", icon: "🍼" },
        ] },
        { id: "c_5", name: "Beauty & Personal Care", icon: "💄", subcategories: [
            { name: "Makeup", icon: "💄" }, { name: "Skincare", icon: "🧴" }, { name: "Haircare", icon: "💇" },
            { name: "Fragrances", icon: "🌸" },
        ] },
        { id: "c_6", name: "Electronics", icon: "📱", subcategories: [
            { name: "Mobiles", icon: "📱" }, { name: "Earphones", icon: "🎧" }, { name: "Chargers & Cables", icon: "🔌" },
            { name: "Smart Watch", icon: "⌚" }, { name: "Speakers", icon: "🔊" },
        ] },
        { id: "c_7", name: "Footwear", icon: "👟", subcategories: [
            { name: "Men Footwear", icon: "👞" }, { name: "Women Footwear", icon: "👠" }, { name: "Kids Footwear", icon: "👟" },
        ] },
        { id: "c_8", name: "Bags", icon: "👜", subcategories: [
            { name: "Handbags", icon: "👜" }, { name: "Backpacks", icon: "🎒" }, { name: "Wallets", icon: "👛" },
        ] },
        { id: "c_9", name: "Jewellery", icon: "💍", subcategories: [
            { name: "Earrings", icon: "💎" }, { name: "Necklaces", icon: "📿" }, { name: "Bangles", icon: "💫" },
        ] },
        { id: "c_10", name: "Grocery", icon: "🛒", subcategories: [
            { name: "Atta, Rice & Dal", icon: "🌾" }, { name: "Masale & Oil", icon: "🧂" }, { name: "Snacks", icon: "🍪" },
            { name: "Beverages", icon: "🥤" }, { name: "Dairy", icon: "🥛" },
        ] },
        { id: "c_11", name: "Home & Living", icon: "🏠", subcategories: [
            { name: "Bedsheets", icon: "🛏️" }, { name: "Curtains", icon: "🪟" }, { name: "Home Decor", icon: "🪔" },
        ] },
        { id: "c_12", name: "Kitchen & Appliances", icon: "🍳", subcategories: [
            { name: "Cookware", icon: "🍳" }, { name: "Storage & Containers", icon: "🧴" }, { name: "Small Appliances", icon: "🔋" },
        ] },
        { id: "c_13", name: "Healthcare", icon: "💊", subcategories: [
            { name: "Personal Care", icon: "🧼" }, { name: "Health Devices", icon: "🩺" }, { name: "Wellness", icon: "🌿" },
        ] },
        { id: "c_14", name: "Stationery", icon: "✏️", subcategories: [
            { name: "Notebooks", icon: "📓" }, { name: "Pens & Pencils", icon: "✏️" }, { name: "School Supplies", icon: "🎒" },
        ] },
        { id: "c_15", name: "Local Products", icon: "📍", subcategories: [
            { name: "Local Specials", icon: "🌟" }, { name: "Handmade", icon: "🧵" }, { name: "Local Food", icon: "🍱" },
        ] },
    ],
    banners: [],
    orders: [],
    withdrawals: [],
    refunds: [],
    adRequests: [],
    coupons: [],
    resellerListings: [],
    aiChatLogs: [],
    notifications: [],
    tickets: [],
    auditLogs: [],
    deliveryPartners: [],
    deliveryCharge: { base: 30, freeAbove: 999 },
    platformBankAccount: { holder: "", accountNo: "", ifsc: "", upi: "" },
    supportWhatsapp: "",
    comingSoon: { features: {}, message: "" }, // Admin > Coming Soon Control se: features { seller, sellerSignup, reseller, wishlist, referral, categories, aiSearch, flashSale }
    i18nOverrides: {}, // Admin > App Texts se custom text overrides { hi:{key:text}, en:{...}, bn:{...} }
    helpFaqs: null, // null = default FAQs; Admin > Help & Support se edit karne par list yahan save hoti hai
    helpWhatsappMsg: "",
    helpLinks: { orders: true, about: true, terms: true, privacy: true },
    openaiApiKey: "",
    sitePages: {
        about: "जिला बाजार — aapka apna hyperlocal bazar. Hum local sellers ko customers se seedha judte hain, taaki aapko apne shehar/jile ki achhi cheezein aasani se milein.\n\nAccount Security: Register karte waqt agar mobile number diya ho to OTP se verify karna hoga. 2FA (Google Authenticator) optional hai — jab chahein Profile > Security Settings se on/off kar sakte hain.",
        terms: "जिला बाजार — नियम एवं शर्तें (Terms & Conditions)\n\n1. सामान्य\nजिला बाजार (\"हम\", \"प्लेटफॉर्म\") एक hyperlocal marketplace app hai jo local sellers ko customers se judta hai. App use karke aap in sharton se sehmat hote hain.\n\n2. Account\n- Aapko sahi jaankari (naam, mobile/email) deni hogi.\n- Aapka password/account secret hai, isse kisi aur ke saath share na karein.\n- Galat jaankari ya fraud paaye jaane par account block kiya ja sakta hai.\n\n3. Order aur Payment\n- Order confirm hone ke baad Seller usse process karega.\n- Cash on Delivery (COD) aur online payment (jab enable ho) available hain.\n- Price aur availability बदल sakte hain, order confirm hone tak final nahi mana jayega.\n\n4. Cancellation Policy\n- Order 'processing' status mein hote hue customer cancel kar sakta hai.\n- Ek baar 'shipped'/'out for delivery' ho jaane ke baad cancellation possible nahi hoga — sirf delivery ke baad Return/Refund process use karein.\n- Seller bhi valid reason (stock na hona, address issue) par order cancel kar sakta hai.\n\n5. Return & Refund Policy\n- Damaged/wrong product milne par delivery ke 24-48 ghante ke andar return request karein.\n- Return approve hone ke baad refund COD ke liye bank transfer se aur online payment ke liye original payment method mein 5-7 working din mein process hoga.\n- Kuch categories (perishable/food items, agar applicable ho) return-eligible nahi ho sakti.\n\n6. Shipping & Delivery\n- Delivery time seller/location ke hisaab se alag ho sakta hai, app mein estimate dikhaya jata hai.\n- Delivery charge order value ke hisaab se lagta hai (kam order par lag sakta hai, bade order par free ho sakta hai — app mein current rates dikhte hain).\n- Delay ki स्थिति mein hum order status app mein update karte rahenge.\n\n7. Seller Responsibilities\n- Product ki quality, sahi jaankari, aur time par packing/handover Seller ki zimmedari hai.\n- Fake/prohibited items list nahi kar sakte.\n- Commission har sale par platform policy ke hisaab se katega.\n\n8. Reseller\n- Reseller-specific terms alag se \"Reseller Agreement\" section mein diye gaye hain.\n\n9. Limitation of Liability\n- Jila Bazar ek marketplace hai — product ki quality/delivery ki final zimmedari Seller ki hoti hai. Hum dispute resolution mein madad karte hain lekin guarantee nahi de sakte.\n\n10. Badlaav\n- Ye terms samay-samay par update ho sakte hain, badi cheezein app mein notify ki jayengi.\n\n(Ye ek starting template hai — asli business launch se pehle isse ek lawyer se review karwana recommended hai, khaaskar payment/refund clauses ke liye.)",
        privacy: "जिला बाजार — Privacy Policy\n\n1. Hum kya data collect karte hain\n- Account info: naam, mobile number, email (agar diya ho), password (hashed/secure form mein)\n- Order info: delivery address, order history\n- Location: sirf jab aap khud 'Location Add Karein' button dabayein ya delivery address set karein — automatically/silently kabhi nahi li jaati\n- Payment info: hum khud card/UPI details store nahi karte, payment gateway (jab enable ho) secure tareeke se handle karega\n\n2. Data ka use kaise hota hai\n- Order process karne, delivery karwane, aur customer support ke liye\n- Nearby products/sellers dikhane ke liye (agar location di ho)\n- Account security (jaise 2FA) ke liye\n\n3. Data kisse share hota hai\n- Order fulfil karne ke liye zaroori jaankari (naam, address, phone) concerned Seller/Delivery Partner ke saath share hoti hai\n- Hum aapka data kisi third-party ko bechte nahi hain\n\n4. Data Security\n- Password hashed form mein store hota hai, plain text mein kabhi nahi\n- Sensitive admin/financial actions 2FA se protected hain\n\n5. Aapke Rights\n- Aap apna data Profile se dekh/update kar sakte hain\n- Account delete/data removal ke liye Support (WhatsApp) par contact karein\n\n6. Cookies/Storage\n- App aapke device par sirf zaroori session information store karta hai (jaise login session), tracking cookies nahi.\n\n7. Contact\n- Kisi bhi privacy-related sawal ke liye About Us page ke WhatsApp Support link se sampark karein.\n\n(Ye bhi ek starting template hai — production launch se pehle lawyer review recommended hai.)",
        resellerTerms: "1. Reseller apna khud ka price set kar sakta hai, jo original price se kam nahi ho sakta.\n2. Reseller ko sirf margin (apni price - original price) milता hai, product ka poora paisa nahi.\n3. Product ki quality, delivery, aur return ki zimmedari asal Seller ki hoti hai, Reseller ki nahi.\n4. Galat jaankari ya fraud paaye jaane par Reseller account turant band kiya ja sakta hai.\n5. KYC (PAN/Aadhaar) submit karna aur Admin approval zaroori hai.",
    },
    defaultCommissionPct: 10,
    adminSecretKeyword: "SuperAdminjilabazarAk@$%", // search box mein ye type karne se admin panel khulta hai — sirf Super Admin ke liye (Admin > Security se badla ja sakta hai)
    adminUrlSecret: "p9v2mZk1Q7", // ?jb_gate=<isse> wala link khol kar bhi admin panel khulta hai — sirf Super Admin ke liye
    adminStaffSecretKeyword: "jilabazarindia=@$", // Staff ke liye alag secret keyword — isse hamesha seedha "Admin Login" khulta hai (setup nahi)
    adminStaffUrlSecret: "jbStaffQ8mN4", // ?jb_staff_gate=<isse> wala link — Staff ke liye alag entry
};

export function loadDB() {
    try {
        const raw = memStorage.getItem(DB_KEY);
        if (!raw) {
            memStorage.setItem(DB_KEY, JSON.stringify(SEED));
            return structuredClone(SEED);
        }
        const parsed = JSON.parse(raw);
        // Merge in any new collections/fields added in later app versions so old saved data doesn't break.
        const merged = { ...structuredClone(SEED), ...parsed };
        Object.keys(SEED).forEach(k => { if (merged[k] === undefined)
            merged[k] = structuredClone(SEED[k]); });
        return merged;
    }
    catch (e) {
        return structuredClone(SEED);
    }
}

export function saveDB(db) { memStorage.setItem(DB_KEY, JSON.stringify(db)); }

/* ---------------------------- SECURITY HELPERS ---------------------------- */
/* Brute-force protection: tracks failed login attempts per (role+mobile) key.
   After MAX_ATTEMPTS failures, that key is locked out for LOCKOUT_MS. */
export const ATTEMPTS_KEY = "jilabazar_login_attempts";

export const catName = (tf, n) => { try { const k = "cat_" + String(n).toLowerCase().replace(/&/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); const v = tf(k); return v === k ? n : v; } catch (e) { return n; } };

export const LANG_KEY = "jilabazar_lang";
