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
    sitePages: {}, // About/Terms/Privacy ka default text sitePages.js mein hai (hi/en/bn); Admin ne badla ho to wahi save hota hai
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
