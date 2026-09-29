import React, { useState, useEffect } from "react";
import { memStorage } from "./storage.js";
import { I18N } from "./translations.js";
import { LANG_KEY } from "./database.js";

export function effectivePrice(p) {
    var _a;
    if (((_a = p.flashSale) === null || _a === void 0 ? void 0 : _a.active) && p.flashSale.endsAt && new Date(p.flashSale.endsAt) > new Date())
        return p.flashSale.dealPrice;
    return p.price;
}

export function getActiveResellerRef() {
    try {
        return JSON.parse(memStorage.getItem("jilabazar_active_ref") || "null");
    }
    catch {
        return null;
    }
}

// Resolves the price to charge for a cart line, and (if bought via a reseller's link) who earns the margin.
export function resolveItemPricing(db, product) {
    const base = effectivePrice(product);
    const ref = getActiveResellerRef();
    const refExpired = ref && (Date.now() - new Date(ref.capturedAt).getTime()) > 7 * 24 * 3600 * 1000;
    if (ref && !refExpired && ref.productId === product.id) {
        const reseller = db.users.find(u => u.role === "customer" && u.isReseller && u.resellerCode === ref.resellerCode);
        const listing = reseller && db.resellerListings.find(l => l.resellerId === reseller.id && l.productId === product.id);
        if (reseller && listing)
            return { price: listing.resellerPrice, resellerId: reseller.id, margin: listing.resellerPrice - base };
    }
    return { price: base, resellerId: null, margin: 0 };
}

/* ============================================================================
   CUSTOMER PANEL
   ============================================================================ */
export function useCart(getStock) {
    const [cart, setCart] = useState(() => {
        try {
            return JSON.parse(memStorage.getItem("jilabazar_cart") || "[]");
        }
        catch {
            return [];
        }
    });
    useEffect(() => { memStorage.setItem("jilabazar_cart", JSON.stringify(cart)); }, [cart]);
    const stockOf = (pid) => { var _a; return (_a = (getStock ? getStock(pid) : Infinity)) !== null && _a !== void 0 ? _a : Infinity; };
    const add = (productId, qty = 1) => setCart(c => {
        const stock = stockOf(productId);
        const ex = c.find(i => i.productId === productId);
        if (ex)
            return c.map(i => i.productId === productId ? { ...i, qty: Math.min(i.qty + qty, stock) } : i);
        return [...c, { productId, qty: Math.min(qty, stock) }];
    });
    const setQty = (productId, qty) => setCart(c => {
        const capped = Math.min(qty, stockOf(productId));
        return capped <= 0 ? c.filter(i => i.productId !== productId) : c.map(i => i.productId === productId ? { ...i, qty: capped } : i);
    });
    const remove = (productId) => setCart(c => c.filter(i => i.productId !== productId));
    const clear = () => setCart([]);
    return { cart, add, setQty, remove, clear };
}

export async function fetchImageAsBase64(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    const mediaType = blob.type || "image/jpeg";
    const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
    return { data, mediaType };
}

export const BACKEND_URL = "https://jilabazar-backend-v2.vercel.app";

 // humara secure backend (Vercel) — passwords hash aur AI key yahin chhupi rehti hai
export async function callOpenAI(prompt, apiKey, maxTokens = 800) {
    // Ab seedha OpenAI ko nahi, apne secure backend ko call karte hain — API key ab kabhi browser mein nahi aati.
    const response = await fetch(`${BACKEND_URL}/api/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, maxTokens }),
    });
    const data = await response.json();
    if (!response.ok || data.error)
        throw new Error(data.error || `Backend error (status ${response.status})`);
    return data.text || "";
}

export async function callOpenAIVision(prompt, base64Image, mediaType, apiKey, maxTokens = 400) {
    var _a, _b, _c, _d;
    if (!apiKey)
        throw new Error("OpenAI API key set nahi hai. Admin Panel → AI Settings mein jaake add karein.");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: "gpt-4o-mini", max_tokens: maxTokens,
            messages: [{ role: "user", content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64Image}` } },
                    ] }],
        }),
    });
    const data = await response.json();
    if (!response.ok || data.error)
        throw new Error(((_a = data.error) === null || _a === void 0 ? void 0 : _a.message) || `API error (status ${response.status})`);
    return ((_d = (_c = (_b = data.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) || "";
}

export function friendlyAIError(e) {
    const msg = (e === null || e === void 0 ? void 0 : e.message) || "";
    if (/API key set nahi hai/i.test(msg))
        return "AI abhi setup nahi hui hai — Admin Panel → AI Settings mein OpenAI API key add karwayein.";
    if (/exceeded_limit|rate.?limit|429/i.test(msg))
        return "AI abhi thoda busy hai (usage limit) — thodi der baad try karein.";
    if (/401|invalid.*key|incorrect.*key/i.test(msg))
        return "AI key galat lag rahi hai — Admin Panel → AI Settings mein check karwayein.";
    return (I18N[memStorage.getItem(LANG_KEY) || "hi"] || I18N.hi).ai_unavailable || I18N.hi.ai_unavailable;
}

export function parseJSONFromClaude(text) {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
}

export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 720 : false);
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 720);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);
    return isMobile;
}

export function downloadCSV(filename, rows) {
    if (!rows.length)
        return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => { var _a; return `"${String((_a = r[h]) !== null && _a !== void 0 ? _a : "").replace(/"/g, '""')}"`; }).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
