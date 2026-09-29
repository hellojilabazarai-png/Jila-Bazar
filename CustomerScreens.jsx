import React, { useState, useEffect } from "react";
import { useApp } from "./AppContext.jsx";
import { BACKEND_URL, callOpenAI, effectivePrice, friendlyAIError, parseJSONFromClaude, resolveItemPricing, useIsMobile } from "./helpers.js";
import { APP_VERSION, T } from "./theme.js";
import { Countdown, EmptyState, Field, InvoiceModal, Modal, ProductCard, StarRating, StatusBadge } from "./CommonUI.jsx";
import { csOn } from "./ComingSoon.jsx";
import { catName, nowISO, uid } from "./database.js";
import { memStorage } from "./storage.js";
import { TotpGate } from "./AuthScreens.jsx";
import { generateBase32Secret } from "./security.js";
import { DefaultAvatarIcon, JBIcon } from "./BasicUI.jsx";

export function AIRecommendations({ setView, setActiveProduct, cartApi }) {
    const { t: tt } = useApp();
    const { db, session, notify, update } = useApp();
    const [recIds, setRecIds] = useState(null); // null = not loaded, [] = loaded but empty
    const [loading, setLoading] = useState(false);
    const [errored, setErrored] = useState(false);
    useEffect(() => {
        if (!session || session.role !== "customer")
            return;
        const products = db.products.filter(p => p.approved);
        if (products.length < 3)
            return; // not enough catalog to bother
        const user = db.users.find(u => u.id === session.id);
        const orderedNames = db.orders.filter(o => o.customerId === session.id).flatMap(o => o.items.map(it => it.name));
        const wishlistNames = ((user === null || user === void 0 ? void 0 : user.wishlist) || []).map(pid => { var _a; return (_a = db.products.find(p => p.id === pid)) === null || _a === void 0 ? void 0 : _a.name; }).filter(Boolean);
        if (orderedNames.length === 0 && wishlistNames.length === 0)
            return; // no signal yet — nothing personalized to show
        let cancelled = false;
        setLoading(true);
        setErrored(false);
        const catalogText = products.map(p => `${p.id}: ${p.name} (${p.category}, ₹${effectivePrice(p)})`).join("\n");
        const prompt = `Aap ek Indian hyperlocal marketplace "Jila Bazar" ke liye shopping assistant hain.
Customer ne pehle ye products khareede hain: ${orderedNames.join(", ") || "(kuch nahi)"}
Customer ki wishlist mein ye hai: ${wishlistNames.join(", ") || "(kuch nahi)"}

Available product catalog (id: name (category, price)):
${catalogText}

Customer ki past activity ke hisaab se, catalog mein se 4-6 sabse relevant products suggest karein jo unhe pasand aa sakte hain (khud khareede hue products dobara suggest mat karein).
Respond with ONLY a JSON array of product id strings, nothing else. Example: ["p_1","p_2"]`;
        fetch(`${BACKEND_URL}/api/ai`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, maxTokens: 500 }),
        })
            .then(r => r.json())
            .then(data => {
            if (cancelled)
                return;
            if (data.error)
                throw new Error(data.error);
            const text = data.text || "";
            const clean = text.replace(/```json|```/g, "").trim();
            const ids = JSON.parse(clean);
            setRecIds(Array.isArray(ids) ? ids.filter(id => products.some(p => p.id === id)) : []);
        })
            .catch(() => { if (!cancelled) {
            setErrored(true);
            setRecIds([]);
        } })
            .finally(() => { if (!cancelled)
            setLoading(false); });
        return () => { cancelled = true; };
    }, [session === null || session === void 0 ? void 0 : session.id]);
    if (!session || session.role !== "customer")
        return null;
    if (!loading && (!recIds || recIds.length === 0))
        return null;
    const recProducts = (recIds || []).map(id => db.products.find(p => p.id === id)).filter(Boolean);
    const currentUser = db.users.find(u => u.id === (session === null || session === void 0 ? void 0 : session.id));
    const toggleWishlist = (pid) => {
        update(d => {
            const u = d.users.find(u => u.id === session.id);
            if (!u.wishlist)
                u.wishlist = [];
            if (u.wishlist.includes(pid))
                u.wishlist = u.wishlist.filter(x => x !== pid);
            else
                u.wishlist.push(pid);
        });
    };
    return (<div style={{ marginBottom: 20 }}><div style={{ fontWeight: 700, marginBottom: 10, color: T.maroonDark }}>{tt("l_aapke_liye_suggested")}</div>{loading ? (<div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_aapke_liye_recommendations_l")}</div>) : errored ? null : (<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>{recProducts.map(p => {
            var _a;
            return (<ProductCard key={p.id} p={p} onOpen={() => { setActiveProduct(p.id); setView("product"); }} onAdd={() => { cartApi.add(p.id); notify(tt("cart_added"), "success"); }} onWishlist={() => toggleWishlist(p.id)} wished={(_a = currentUser === null || currentUser === void 0 ? void 0 : currentUser.wishlist) === null || _a === void 0 ? void 0 : _a.includes(p.id)} />);
        })}</div>)}</div>);
}

export function CustomerHome({ setView, setActiveProduct, cartApi, searchTerm }) {
    const { t: tt } = useApp();
    const { db, session, update, notify, t, lang } = useApp();
    const [activeCat, setActiveCat] = useState(null);
    const [aiSearchIds, setAiSearchIds] = useState(null); // null = not active, [] or [ids] = AI search result
    const [aiSearching, setAiSearching] = useState(false);
    const [sortBy, setSortBy] = useState("relevance");
    const [priceFilter, setPriceFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const [inStockOnly, setInStockOnly] = useState(false);
    const isSponsored = (p) => p.sponsoredUntil && new Date(p.sponsoredUntil) > new Date();
    const user = db.users.find(u => u.id === (session === null || session === void 0 ? void 0 : session.id));
    const priceInRange = (p) => {
        const pr = effectivePrice(p);
        if (priceFilter === "under500")
            return pr < 500;
        if (priceFilter === "500-1000")
            return pr >= 500 && pr <= 1000;
        if (priceFilter === "1000-2000")
            return pr >= 1000 && pr <= 2000;
        if (priceFilter === "above2000")
            return pr > 2000;
        return true;
    };
    const products = db.products.filter(p => p.approved);
    const filtered = products
        .filter(p => (!activeCat || p.category === activeCat) &&
        (aiSearchIds ? aiSearchIds.includes(p.id) : (!searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()))) &&
        priceInRange(p) && (!inStockOnly || p.stock > 0))
        .sort((a, b) => {
        if (sortBy === "price-asc")
            return effectivePrice(a) - effectivePrice(b);
        if (sortBy === "price-desc")
            return effectivePrice(b) - effectivePrice(a);
        if (sortBy === "newest")
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        return (isSponsored(b) ? 1 : 0) - (isSponsored(a) ? 1 : 0);
    });
    const featured = products.filter(p => p.featured);
    useEffect(() => { setAiSearchIds(null); }, [searchTerm]);
    const runAISearch = async () => {
        if (!(searchTerm === null || searchTerm === void 0 ? void 0 : searchTerm.trim()))
            return notify(t("type_search_first"), "error");
        setAiSearching(true);
        try {
            const catalogText = products.map(p => `${p.id}: ${p.name} (${p.category}, ₹${effectivePrice(p)})`).join("\n");
            const prompt = `Customer ne ye search kiya hai: "${searchTerm}"\n\nCatalog:\n${catalogText}\n\nIs query ke hisaab se (price range, category, keywords sab samjhein) sabse relevant product ids nikalein. Respond with ONLY a JSON array of product id strings, jaise ["p_1","p_2"]. Agar kuch match na ho to [] bhejein.`;
            const text = await callOpenAI(prompt, db.openaiApiKey, 500);
            const ids = parseJSONFromClaude(text);
            setAiSearchIds(Array.isArray(ids) ? ids : []);
            if (!ids || ids.length === 0)
                notify(tt("m_ai_ko_is_search_se_koi_match"), "info");
        }
        catch (e) {
            notify(friendlyAIError(e), "error");
        }
        finally {
            setAiSearching(false);
        }
    };
    const toggleWishlist = (pid) => {
        if (!session)
            return notify(t("login_for_wishlist"), "error");
        update(d => {
            const u = d.users.find(u => u.id === session.id);
            if (!u.wishlist)
                u.wishlist = [];
            if (u.wishlist.includes(pid))
                u.wishlist = u.wishlist.filter(x => x !== pid);
            else
                u.wishlist.push(pid);
        });
    };
    const activeBanner = db.banners.find(b => b.active);
    const flashSaleProducts = products.filter(p => { var _a; return ((_a = p.flashSale) === null || _a === void 0 ? void 0 : _a.active) && p.flashSale.endsAt && new Date(p.flashSale.endsAt) > new Date(); });
    return (<div style={{ maxWidth: 1100, margin: "0 auto", padding: 0 }}>{activeBanner && (<div style={{
                padding: "36px 20px", marginBottom: 16, background: `linear-gradient(120deg, ${T.maroon}, ${T.maroonDark})`,
                color: "#fff", borderBottom: `4px solid ${T.gold}`, textAlign: "center",
            }}><div className="jb-display" style={{ fontSize: 30, fontWeight: 800 }}>{activeBanner.title}</div><div style={{ fontSize: 14, opacity: 0.9, marginTop: 6 }}>{activeBanner.subtitle}</div></div>)}{!(user === null || user === void 0 ? void 0 : user.location) && (<div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: T.cream, borderBottom: `1px solid ${T.border}`, cursor: "pointer" }} onClick={() => setView(session ? "address" : "auth")}><span style={{ fontSize: 18 }}>📍</span><span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: T.maroonDark }}>{t("add_delivery_location")}</span><span style={{ color: T.maroonDark }}>»»»</span></div>)}<div style={{ padding: 16 }}>{csOn(db, "flashSale") && <div className="jb-card" style={{ padding: 16, marginBottom: 18, background: "#172033", border: "none", color: "#fff", textAlign: "center" }}>{"⚡ "}{t("flash_sale")}{" — "}{t("coming_soon")}</div>}{flashSaleProducts.length > 0 && !csOn(db, "flashSale") && (<div className="jb-card" style={{ padding: 16, marginBottom: 18, background: "#172033", border: "none" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{"⚡ "}{t("flash_sale")}</div></div><div style={{ display: "flex", gap: 12, overflowX: "auto" }} className="jb-scroll">{flashSaleProducts.map(p => {
                var _a;
                return (<div key={p.id} style={{ minWidth: 140, background: "#fff", borderRadius: 10, padding: 10, cursor: "pointer" }} onClick={() => { setActiveProduct(p.id); setView("product"); }}><div style={{ height: 80, borderRadius: 8, background: T.cream, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 6, overflow: "hidden" }}>{((_a = p.images) === null || _a === void 0 ? void 0 : _a[0]) ? <img src={p.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🧺"}</div><div style={{ fontSize: 12, fontWeight: 600, height: 32, overflow: "hidden" }}>{p.name}</div><div style={{ fontSize: 13, fontWeight: 700, color: T.maroon }}>₹{p.flashSale.dealPrice}{" "}<span style={{ fontSize: 10, textDecoration: "line-through", color: "#999", fontWeight: 400 }}>₹{p.price}</span></div><Countdown endsAt={p.flashSale.endsAt} /></div>);
            })}</div></div>)}<div style={{ display: "flex", gap: 16, overflowX: "auto", marginBottom: 20, paddingBottom: 4 }} className="jb-scroll"><div style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", flexShrink: 0, width: 60 }} onClick={() => setView("categories")}><div style={{ width: 48, height: 48, borderRadius: "50%", background: T.cream, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 4 }}>☷</div><div style={{ fontSize: 10, textAlign: "center", color: T.ink }}>{t("categories")}</div></div>{db.categories.map(c => (<div key={c.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", flexShrink: 0, width: 60 }} onClick={() => setActiveCat(activeCat === c.name ? null : c.name)}><div style={{ width: 48, height: 48, borderRadius: "50%", background: activeCat === c.name ? T.gold : T.cream, border: `1px solid ${activeCat === c.name ? T.gold : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 4 }}>{c.icon}</div><div style={{ fontSize: 10, textAlign: "center", color: activeCat === c.name ? T.maroonDark : T.ink, fontWeight: activeCat === c.name ? 700 : 500, lineHeight: 1.2 }}>{catName(tt, c.name)}</div></div>))}</div>{!activeCat && !searchTerm && !csOn(db, "aiSearch") && <AIRecommendations setView={setView} setActiveProduct={setActiveProduct} cartApi={cartApi} />}{!activeCat && !searchTerm && featured.length > 0 && (<div style={{ marginBottom: 20 }}><div style={{ fontWeight: 700, marginBottom: 10, color: T.maroonDark }}>{"⭐ "}{t("featured_products")}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>{featured.map(p => {
                var _a, _b;
                return (<ProductCard key={p.id} p={p} onOpen={() => { setActiveProduct(p.id); setView("product"); }} onAdd={() => { cartApi.add(p.id); notify(t("cart_added"), "success"); }} onWishlist={() => toggleWishlist(p.id)} wished={(session === null || session === void 0 ? void 0 : session.role) === "customer" && ((_b = (_a = db.users.find(u => u.id === session.id)) === null || _a === void 0 ? void 0 : _a.wishlist) === null || _b === void 0 ? void 0 : _b.includes(p.id))} />);
            })}</div></div>)}<div className="jb-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: T.ink }}>{aiSearchIds ? `✨ ${t("ai_search_prefix")}: "${catName(t, searchTerm)}"` : searchTerm ? `${t("search_prefix")}: "${catName(t, searchTerm)}"` : activeCat || t("products_for_you")}</div><div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }} className="jb-scroll"><select className="jb-input" style={{ width: "auto", fontSize: 12, padding: "6px 8px", flexShrink: 0 }} value={sortBy} onChange={e => setSortBy(e.target.value)}><option value="relevance">{"↕↑ "}{t("sort_word")}</option><option value="price-asc">{t("price_low_high")}</option><option value="price-desc">{t("price_high_low")}</option><option value="newest">{t("newest_first")}</option></select><select className="jb-input" style={{ width: "auto", fontSize: 12, padding: "6px 8px", flexShrink: 0 }} value={activeCat || ""} onChange={e => setActiveCat(e.target.value || null)}><option value="">{t("category_word")}</option>{db.categories.map(c => <option key={c.id} value={c.name}>{catName(tt, c.name)}</option>)}</select><select className="jb-input" style={{ width: "auto", fontSize: 12, padding: "6px 8px", flexShrink: 0 }} value={priceFilter} onChange={e => setPriceFilter(e.target.value)}><option value="all">{t("price_word")}</option><option value="under500">{t("under_500")}</option><option value="500-1000">{t("price_500_1000")}</option><option value="1000-2000">{t("price_1000_2000")}</option><option value="above2000">{t("above_2000")}</option></select><button className="jb-btn jb-btn-outline" style={{ fontSize: 12, padding: "6px 10px", flexShrink: 0, whiteSpace: "nowrap" }} onClick={() => setShowFilters(s => !s)}>{"☰ "}{t("filters_word")}</button></div>{showFilters && (<div className="jb-card" style={{ padding: 12, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}><label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}><input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} />{t("in_stock_only")}</label>{(priceFilter !== "all" || inStockOnly || sortBy !== "relevance") && <button className="jb-btn jb-btn-ghost" style={{ fontSize: 12 }} onClick={() => { setPriceFilter("all"); setInStockOnly(false); setSortBy("relevance"); }}>{t("clear_filters")}</button>}</div>)}{searchTerm && !aiSearchIds && (<div style={{ marginBottom: 10 }}><button className="jb-btn jb-btn-gold" style={{ fontSize: 12, padding: "6px 10px" }} disabled={aiSearching || csOn(db, "aiSearch")} onClick={runAISearch}>{csOn(db, "aiSearch") ? `✨ ${t("coming_soon")}` : (aiSearching ? t("ai_thinking") : `✨ ${t("ai_search_btn")}`)}</button></div>)}{aiSearchIds && <div style={{ marginBottom: 10 }}><button className="jb-btn jb-btn-ghost" style={{ fontSize: 12 }} onClick={() => setAiSearchIds(null)}>{t("normal_search")}</button></div>}{filtered.length === 0 ? <EmptyState icon="🔍" text={t("no_products")} subtitle={t("no_products_subtitle")} /> : (<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>{filtered.map(p => {
            var _a, _b;
            return (<ProductCard key={p.id} p={p} onOpen={() => { setActiveProduct(p.id); setView("product"); }} onAdd={() => { cartApi.add(p.id); notify(t("cart_added"), "success"); }} onWishlist={() => toggleWishlist(p.id)} wished={(session === null || session === void 0 ? void 0 : session.role) === "customer" && ((_b = (_a = db.users.find(u => u.id === session.id)) === null || _a === void 0 ? void 0 : _a.wishlist) === null || _b === void 0 ? void 0 : _b.includes(p.id))} />);
        })}</div>)}</div></div>);
}

export const DEFAULT_FAQS = [
    { q_hi: "ऑर्डर कहाँ ट्रैक करें?", a_hi: "नीचे 'ऑर्डर' टैब खोलें, ऑर्डर पर टैप करके लाइव स्टेटस देख सकते हैं।",
      q_en: "Where can I track my order?", a_en: "Open the 'Orders' tab at the bottom, tap an order to see its live status.",
      q_bn: "অর্ডার কোথায় ট্র্যাক করব?", a_bn: "নিচের 'অর্ডার' ট্যাব খুলুন, অর্ডারে ট্যাপ করে লাইভ স্ট্যাটাস দেখুন।" },
    { q_hi: "रिटर्न/रिफ़ंड कैसे होगा?", a_hi: "खराब या गलत प्रोडक्ट मिलने पर डिलीवरी के 24-48 घंटे के अंदर रिटर्न अनुरोध करें — विवरण अकाउंट > गोपनीयता/शर्तें में हैं।",
      q_en: "How do returns/refunds work?", a_en: "For damaged or wrong items, request a return within 24-48 hours of delivery — details are under Account > Privacy/Terms.",
      q_bn: "রিটার্ন/রিফান্ড কীভাবে হবে?", a_bn: "ক্ষতিগ্রস্ত বা ভুল পণ্যের জন্য ডেলিভারির ২৪-৪৮ ঘণ্টার মধ্যে রিটার্ন রিকোয়েস্ট করুন — বিস্তারিত অ্যাকাউন্ট > গোপনীয়তা/শর্তাবলিতে আছে।" },
    { q_hi: "भुगतान के विकल्प क्या हैं?", a_hi: "कैश ऑन डिलीवरी हमेशा उपलब्ध है; ऑनलाइन भुगतान वहाँ जहाँ विक्रेता ने चालू किया हो।",
      q_en: "What payment options are there?", a_en: "Cash on Delivery is always available; online payment where the seller has enabled it.",
      q_bn: "পেমেন্ট অপশন কী কী?", a_bn: "ক্যাশ অন ডেলিভারি সবসময় উপলব্ধ; অনলাইন পেমেন্ট যেখানে বিক্রেতা চালু করেছেন।" },
    { q_hi: "विक्रेता कैसे बनें?", a_hi: "लॉगिन/रजिस्टर स्क्रीन पर 'विक्रेता' विकल्प चुनकर अपनी दुकान रजिस्टर करें।",
      q_en: "How do I become a Seller?", a_en: "Choose the 'Seller' option on the Login/Register screen and register your shop.",
      q_bn: "বিক্রেতা কীভাবে হবেন?", a_bn: "লগইন/রেজিস্টার স্ক্রিনে 'বিক্রেতা' অপশন বেছে আপনার দোকান রেজিস্টার করুন।" },
];

export function HelpScreen({ setView }) {
    const { t: tt } = useApp();
    const { db, t, lang } = useApp();
    const links = { orders: true, about: true, terms: true, privacy: true, ...(db.helpLinks || {}) };
    const faqSource = (Array.isArray(db.helpFaqs) ? db.helpFaqs : DEFAULT_FAQS);
    const faqs = faqSource.map(f => ({ q: f["q_" + lang] || f.q_hi || f.q_en || "", a: f["a_" + lang] || f.a_hi || f.a_en || "" })).filter(f => f.q);
    const waMsg = db.helpWhatsappMsg || tt("x_namaste_mujhe_jila_bazar_1796");
    return (<div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}><div className="jb-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 14, color: T.ink }}>{t("help_support")}</div>{db.supportWhatsapp && (<div className="jb-card" style={{ padding: 14, marginBottom: 14, cursor: "pointer", background: "#25D366", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => window.open(`https://wa.me/91${db.supportWhatsapp}?text=${encodeURIComponent(waMsg)}`, "_blank")}><span>{"💬 "}{t("whatsapp_instant_help")}</span><span>→</span></div>)}<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 18 }}>{links.orders && <div className="jb-card" style={{ padding: 14, textAlign: "center", cursor: "pointer" }} onClick={() => setView("orders")}>{"📦 "}{t("my_orders_card")}</div>}{links.about && <div className="jb-card" style={{ padding: 14, textAlign: "center", cursor: "pointer" }} onClick={() => setView("about")}>{"ℹ️ "}{t("about_us")}</div>}{links.terms && <div className="jb-card" style={{ padding: 14, textAlign: "center", cursor: "pointer" }} onClick={() => setView("terms")}>{tt("ui_terms")}</div>}{links.privacy && <div className="jb-card" style={{ padding: 14, textAlign: "center", cursor: "pointer" }} onClick={() => setView("privacy")}>{tt("ui_privacy")}</div>}</div>{faqs.length > 0 && <div style={{ fontWeight: 700, marginBottom: 8, color: T.ink }}>{t("faq_heading")}</div>}{faqs.map((f, i) => (<div key={i} className="jb-card" style={{ padding: 14, marginBottom: 8 }}><div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: T.ink }}>{f.q}</div><div style={{ fontSize: 13, color: "#5a4a3a", whiteSpace: "pre-wrap" }}>{f.a}</div></div>))}</div>);
}

export function CategoriesScreen({ setView, setSearch }) {
    const { t: tt } = useApp();
    const { db } = useApp();
    const cats = db.categories || [];
    const [activeIdx, setActiveIdx] = useState(0);
    const active = cats[activeIdx];
    const goToSearch = (term) => { setSearch(term); setView("home"); };
    return (<div style={{ display: "flex", minHeight: "70vh", background: "#fff" }}><div style={{ width: 84, flexShrink: 0, borderRight: `1px solid ${T.border}`, overflowY: "auto" }}>{cats.map((c, i) => (<div key={c.id} onClick={() => setActiveIdx(i)} style={{
                    padding: "12px 6px", textAlign: "center", cursor: "pointer",
                    background: i === activeIdx ? "#fff" : T.cream,
                    borderLeft: i === activeIdx ? `3px solid ${T.gold}` : "3px solid transparent",
                    borderBottom: `1px solid ${T.border}`,
                }}><div style={{
                        width: 38, height: 38, borderRadius: "50%", margin: "0 auto 5px", display: "flex",
                        alignItems: "center", justifyContent: "center", fontSize: 18,
                        background: i === activeIdx ? T.goldLight + "44" : "#fff",
                        border: `1px solid ${T.border}`,
                    }}>{c.icon}</div><div style={{
                        fontSize: 10, fontWeight: i === activeIdx ? 700 : 500,
                        color: i === activeIdx ? T.maroon : T.ink,
                    }}>{catName(tt, c.name)}</div></div>))}</div><div style={{ flex: 1, padding: 16, overflowY: "auto" }}>{active && <><div style={{ fontSize: 10, color: "#767676", textTransform: "uppercase", letterSpacing: 0.5 }}>{tt("ui_popular")}</div><div className="jb-display" style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: T.ink }}>{catName(tt, active.name)}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>{(active.subcategories || []).map((s, idx) => <div key={idx} onClick={() => goToSearch(s.name)} style={{ textAlign: "center", cursor: "pointer" }}><div style={{
                            width: 48, height: 48, borderRadius: "50%", margin: "0 auto 5px", display: "flex",
                            alignItems: "center", justifyContent: "center", fontSize: 20,
                            background: T.cream, border: `1px solid ${T.border}`,
                        }}>{s.icon}</div><div style={{ fontSize: 11, color: T.ink, lineHeight: 1.25 }}>{catName(tt, s.name)}</div></div>)}</div><div className="jb-btn jb-btn-outline" style={{ marginTop: 16, width: "100%", justifyContent: "center", fontSize: 12, padding: "8px 10px" }} onClick={() => goToSearch(active.name)}>{tt("full_catalog").replace("{name}", catName(tt, active.name))}</div></>}</div></div>);
}

export function ProductDetail({ productId, setView, cartApi }) {
    var _a, _b, _c, _d;
    const { db, session, update, notify, t } = useApp();
    const p = db.products.find(p => p.id === productId);
    const seller = db.sellers.find(s => s.id === (p === null || p === void 0 ? void 0 : p.sellerId));
    const [reviewText, setReviewText] = useState("");
    const [reviewRating, setReviewRating] = useState(5);
    const [translatedDesc, setTranslatedDesc] = useState(null);
    const [translating, setTranslating] = useState(false);
    useEffect(() => { if (productId)
        update(d => { const prod = d.products.find(x => x.id === productId); if (prod)
            prod.views = (prod.views || 0) + 1; }); }, [productId]);
    useEffect(() => { setTranslatedDesc(null); }, [productId]);
    if (!p)
        return <EmptyState text={t("product_not_found")} />;
    const translateDesc = async () => {
        if (translatedDesc) {
            setTranslatedDesc(null);
            return;
        } // toggle back to original
        setTranslating(true);
        try {
            const text = await callOpenAI(`Translate this Indian e-commerce product description to natural English. Reply with ONLY the translated text, nothing else:\n\n${p.desc}`, db.openaiApiKey, 300);
            setTranslatedDesc(text.trim());
        }
        catch (e) {
            notify(friendlyAIError(e), "error");
        }
        finally {
            setTranslating(false);
        }
    };
    const submitReview = () => {
        if (!session || session.role !== "customer")
            return notify(t("login_for_review"), "error");
        if (!reviewText.trim())
            return notify(t("write_review_first"), "error");
        update(d => {
            const prod = d.products.find(x => x.id === productId);
            if (!prod.reviews)
                prod.reviews = [];
            prod.reviews.push({ id: uid("rv"), user: session.name, rating: reviewRating, text: reviewText, at: nowISO() });
            prod.rating = prod.reviews.reduce((a, r) => a + r.rating, 0) / prod.reviews.length;
        });
        setReviewText("");
        notify(t("review_submitted"), "success");
    };
    const [activeImg, setActiveImg] = useState(0);
    return (<div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}><div className="jb-card" style={{ padding: 20 }}><div style={{ height: 220, borderRadius: 10, background: T.cream, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, marginBottom: 8, overflow: "hidden" }}>{((_a = p.images) === null || _a === void 0 ? void 0 : _a[activeImg]) ? <img src={p.images[activeImg]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} /> : "🧺"}</div>{((_b = p.images) === null || _b === void 0 ? void 0 : _b.length) > 1 && (<div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }} className="jb-scroll">{p.images.map((url, i) => (<div key={i} onClick={() => setActiveImg(i)} style={{ width: 44, height: 44, borderRadius: 6, overflow: "hidden", border: `2px solid ${activeImg === i ? T.gold : T.border}`, cursor: "pointer", flexShrink: 0 }}><img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} /></div>))}</div>)}<div style={{ fontSize: 20, fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 12, color: "#8a7360", marginTop: 2 }}>{t("sold_by")}{" "}{(seller === null || seller === void 0 ? void 0 : seller.shopName) || t("default_seller_name")}</div><div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}><StarRating value={p.rating} />{" "}<span style={{ fontSize: 12, color: "#8a7360" }}>{((_c = p.reviews) === null || _c === void 0 ? void 0 : _c.length) || 0}{" "}{t("reviews_word")}</span></div><div style={{ fontSize: 24, fontWeight: 700, color: T.maroon }}>₹{effectivePrice(p)}{" "}{(p.mrp > effectivePrice(p) || effectivePrice(p) !== p.price) && <span style={{ textDecoration: "line-through", fontSize: 14, color: "#999" }}>₹{effectivePrice(p) !== p.price ? p.price : p.mrp}</span>}</div>{((_d = p.flashSale) === null || _d === void 0 ? void 0 : _d.active) && new Date(p.flashSale.endsAt) > new Date() && <div style={{ marginTop: 4 }}><Countdown endsAt={p.flashSale.endsAt} /></div>}<div style={{ fontSize: 13, color: "#5a4a3a", margin: "10px 0" }}>{translatedDesc || p.desc}</div>{p.desc && (<button className="jb-btn jb-btn-ghost" style={{ fontSize: 11, padding: "4px 8px", marginBottom: 8 }} disabled={translating} onClick={translateDesc}>{translating ? t("translating") : translatedDesc ? `🌐 ${t("view_original_hindi")}` : `🌐 ${t("translate_to_english")}`}</button>)}<div style={{ fontSize: 12, color: p.stock > 0 ? T.success : T.danger }}>{p.stock > 0 ? `${p.stock} ${t("available")}` : t("out_of_stock")}</div><div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}><button className="jb-btn jb-btn-outline" disabled={p.stock <= 0 || !!p.comingSoon} onClick={() => { cartApi.add(p.id); notify(t("cart_added"), "success"); }}>{p.comingSoon ? t("coming_soon") : t("add_to_cart")}</button><button className="jb-btn jb-btn-primary" disabled={p.stock <= 0 || !!p.comingSoon} onClick={() => { cartApi.add(p.id); setView("checkout"); }}>{p.comingSoon ? t("coming_soon") : t("buy_now")}</button>{(seller === null || seller === void 0 ? void 0 : seller.mobile) && (<button className="jb-btn" style={{ background: "#25D366", color: "#fff" }} onClick={() => {
                        const msg = `Namaste! Mujhe "${p.name}" (₹${effectivePrice(p)}) ke baare mein poochna tha — Jila Bazar par dekha.`;
                        window.open(`https://wa.me/91${seller.mobile}?text=${encodeURIComponent(msg)}`, "_blank");
                    }}>{"💬 "}{t("chat_with_seller")}</button>)}<button className="jb-btn" style={{ background: "#25D366", color: "#fff" }} onClick={() => {
                        const msg = `${p.name}\n₹${effectivePrice(p)}${p.mrp > effectivePrice(p) ? ` (MRP ₹${p.mrp})` : ""}\n\nDekhein Jila Bazar par: ${window.location.href}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                    }}>{"📤 "}{t("share_on_whatsapp")}</button></div><div style={{ marginTop: 24, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}><div style={{ fontWeight: 700, marginBottom: 10 }}>{t("reviews_ratings")}</div>{(p.reviews || []).length === 0 && <EmptyState text={t("no_reviews_yet")} />}{(p.reviews || []).map(r => (<div key={r.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}><div style={{ display: "flex", justifyContent: "space-between" }}><b style={{ fontSize: 13 }}>{r.user}</b><StarRating value={r.rating} /></div><div style={{ fontSize: 13, color: "#5a4a3a" }}>{r.text}</div>{r.sellerReply && <div style={{ fontSize: 12, color: T.maroon, marginTop: 6, background: T.cream, padding: 8, borderRadius: 8 }}>{"🏪 "}{t("seller")}{": "}{r.sellerReply}</div>}</div>))}<div style={{ marginTop: 12 }}><select className="jb-input" style={{ marginBottom: 8 }} value={reviewRating} onChange={e => setReviewRating(Number(e.target.value))}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n}{" "}{t("star_word")}</option>)}</select><textarea className="jb-input" rows={2} placeholder={t("write_review_placeholder")} value={reviewText} onChange={e => setReviewText(e.target.value)} style={{ marginBottom: 8 }} /><button className="jb-btn jb-btn-gold" onClick={submitReview}>{t("submit_review")}</button></div></div></div></div>);
}

export function CartView({ cartApi, setView }) {
    const { db, t } = useApp();
    const items = cartApi.cart.map(i => ({ ...i, product: db.products.find(p => p.id === i.productId) })).filter(i => i.product);
    const subtotal = items.reduce((a, i) => a + resolveItemPricing(db, i.product).price * i.qty, 0);
    const mrpTotal = items.reduce((a, i) => a + (i.product.mrp || i.product.price) * i.qty, 0);
    const savings = Math.max(0, mrpTotal - subtotal);
    const dc = db.deliveryCharge || { base: 0, freeAbove: 0 };
    const deliveryFee = subtotal >= dc.freeAbove ? 0 : dc.base;
    const amountToFreeDelivery = Math.max(0, dc.freeAbove - subtotal);
    const grandTotal = subtotal + deliveryFee;
    return (<div style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{t("my_cart")}</div>{items.length === 0 ? (<EmptyState icon="🛍️" text={t("empty_cart")} subtitle={t("empty_cart_subtitle")} actionLabel={t("continue_shopping")} onAction={() => setView("home")} />) : (<>{items.map(i => (<div key={i.productId} className="jb-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><div style={{ width: 48, height: 48, borderRadius: 8, background: T.cream, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🧺</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{i.product.name}</div><div style={{ fontSize: 12, color: T.maroon }}>₹{resolveItemPricing(db, i.product).price}{" x "}{i.qty}</div></div><div style={{ display: "flex", alignItems: "center", gap: 6 }}><button className="jb-btn jb-btn-ghost" style={{ padding: "2px 8px" }} onClick={() => cartApi.setQty(i.productId, i.qty - 1)}>-</button><span>{i.qty}</span><button className="jb-btn jb-btn-ghost" style={{ padding: "2px 8px" }} onClick={() => cartApi.setQty(i.productId, i.qty + 1)}>+</button></div><button className="jb-btn jb-btn-ghost" style={{ color: T.danger }} onClick={() => cartApi.remove(i.productId)}>✕</button></div>))}<div className="jb-card" style={{ padding: 14, marginTop: 12 }}>{amountToFreeDelivery > 0 ? (<div style={{ fontSize: 12, color: T.maroon, background: T.cream, padding: 8, borderRadius: 8, marginBottom: 10 }}>🚚 ₹{amountToFreeDelivery}{` ${t("more_for_free_delivery")}`}</div>) : (<div style={{ fontSize: 12, color: T.success, background: "#EAF6EC", padding: 8, borderRadius: 8, marginBottom: 10 }}>{"🎉 "}{t("free_delivery_unlocked")}</div>)}<div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, color: "#5a4a3a" }}><span>{t("subtotal")}</span><span>₹{subtotal}</span></div>{savings > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, color: T.success }}><span>{t("discount")}</span><span>-₹{savings}</span></div>}<div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8, color: "#5a4a3a" }}><span>{t("delivery_charge")}</span><span>{deliveryFee === 0 ? t("free_word") : `₹${deliveryFee}`}</span></div><div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15 }}><span>{t("total")}</span><span>₹{grandTotal}</span></div>{savings > 0 && <div style={{ fontSize: 11, color: T.success, marginTop: 6 }}>🎉 ₹{savings}{` ${t("you_saved")}`}</div>}</div><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12, marginTop: 12 }} onClick={() => setView("checkout")}>{t("checkout")}</button></>)}</div>);
}

export function CheckoutView({ cartApi, setView }) {
    const { t: tt } = useApp();
    var _a, _b, _c;
    const { db, session, update, notify, t } = useApp();
    const user = db.users.find(u => u.id === (session === null || session === void 0 ? void 0 : session.id));
    const items = cartApi.cart.map(i => ({ ...i, product: db.products.find(p => p.id === i.productId) })).filter(i => i.product);
    const subtotal = items.reduce((a, i) => a + resolveItemPricing(db, i.product).price * i.qty, 0);
    const dc = db.deliveryCharge;
    const deliveryFee = subtotal >= dc.freeAbove ? 0 : dc.base;
    const [addrIdx, setAddrIdx] = useState(0);
    const [payMode, setPayMode] = useState("cod");
    const [paymentRef, setPaymentRef] = useState("");
    const [couponInput, setCouponInput] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const sellerIdsInCart = [...new Set(items.map(i => i.product.sellerId))];
    const payingUpi = sellerIdsInCart.length === 1 ? (_b = (_a = db.sellers.find(s => s.id === sellerIdsInCart[0])) === null || _a === void 0 ? void 0 : _a.upi) === null || _b === void 0 ? void 0 : _b.id : (((_c = db.platformBankAccount) === null || _c === void 0 ? void 0 : _c.upi) || null);
    const discount = appliedCoupon ? (appliedCoupon.type === "percent" ? Math.round(subtotal * appliedCoupon.value / 100) : Math.min(appliedCoupon.value, subtotal)) : 0;
    const total = Math.max(0, subtotal + deliveryFee - discount);
    if (!session || session.role !== "customer")
        return <EmptyState text={t("login_for_checkout")} />;
    if (items.length === 0)
        return <EmptyState text={t("cart_empty_period")} />;
    const addresses = (user === null || user === void 0 ? void 0 : user.address) || [];
    const applyCoupon = () => {
        const code = couponInput.trim().toUpperCase();
        if (!code)
            return notify(t("enter_coupon_code"), "error");
        const c = db.coupons.find(c => c.code === code);
        if (!c)
            return notify(t("invalid_coupon"), "error");
        if (!c.active)
            return notify(t("coupon_not_active"), "error");
        if (c.expiryDate && new Date(c.expiryDate) < new Date())
            return notify(t("coupon_expired"), "error");
        if (c.usageLimit && c.usedCount >= c.usageLimit)
            return notify(t("coupon_limit_reached"), "error");
        if (subtotal < c.minOrderValue)
            return notify(tt("mt_is_coupon_ke_liye_minimum_x_").replace("{0}", (c.minOrderValue)), "error");
        setAppliedCoupon(c);
        notify(t("coupon_applied_success"), "success");
    };
    const placeOrder = () => {
        if (items.some(i => i.product.comingSoon))
            return notify(t("coming_soon_cart"), "error");
        if (addresses.length === 0)
            return notify(t("add_address_first"), "error");
        if (payMode !== "cod" && !paymentRef.trim())
            return notify(t("enter_payment_ref"), "error");
        // Overselling se bachne ke liye — order place karne se pehle check karo ki itna stock available hai ya nahi
        // (ho sakta hai cart mein daalne ke baad kisi aur ne wo item kharid liya ho aur stock kam ho gaya ho).
        for (const it of items) {
            const liveProduct = db.products.find(p => p.id === it.productId);
            if (!liveProduct || liveProduct.stock < it.qty) {
                return notify(tt("mt_x_ab_sirf_x_stock_mein_hai_c").replace("{0}", (it.product.name)).replace("{1}", ((liveProduct === null || liveProduct === void 0 ? void 0 : liveProduct.stock) || 0)), "error");
            }
        }
        const order = {
            id: uid("ord"), customerId: user.id, customerName: user.name, items: items.map(i => {
                const pricing = resolveItemPricing(db, i.product);
                return { productId: i.productId, name: i.product.name, price: pricing.price, basePrice: effectivePrice(i.product), qty: i.qty, sellerId: i.product.sellerId, resellerId: pricing.resellerId, resellerMargin: pricing.margin };
            }),
            subtotal, deliveryFee, couponCode: (appliedCoupon === null || appliedCoupon === void 0 ? void 0 : appliedCoupon.code) || null, discount, total, address: addresses[addrIdx], payMode, status: "processing",
            paymentRef: payMode === "cod" ? null : paymentRef.trim(),
            paymentVerified: payMode === "cod" ? null : false, // null = COD (no verification needed), false = pending, true = verified by Seller/Admin
            deliveryOtp: String(Math.floor(1000 + Math.random() * 9000)),
            deliveryPartner: null, cancelReason: null, returnRequest: null, createdAt: nowISO(),
            timeline: [{ status: "processing", at: nowISO() }],
        };
        update(d => {
            d.orders.unshift(order);
            order.items.forEach(it => {
                const prod = d.products.find(p => p.id === it.productId);
                if (prod)
                    prod.stock = Math.max(0, prod.stock - it.qty);
            });
            if (appliedCoupon) {
                const c = d.coupons.find(c => c.id === appliedCoupon.id);
                if (c)
                    c.usedCount += 1;
            }
            d.notifications.unshift({ id: uid("n"), userId: user.id, text: `Order #${order.id.slice(-6)} placed successfully.`, at: nowISO(), read: false });
        });
        cartApi.clear();
        memStorage.removeItem("jilabazar_active_ref"); // reseller link is single-use — don't let it silently apply to unrelated future orders
        notify(t("order_placed_success"), "success");
        setView("orders");
    };
    return (<div style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{t("checkout")}</div><div style={{ display: "flex", alignItems: "center", marginBottom: 16, fontSize: 12 }}>{[t("step_address"), t("step_payment"), t("step_review")].map((step, i) => (<React.Fragment key={step}><div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}><div style={{
                        width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        background: (i === 0 && addresses.length > 0) || i === 1 ? T.maroon : T.border,
                        color: (i === 0 && addresses.length > 0) || i === 1 ? "#fff" : "#8a7360", fontWeight: 700, fontSize: 12,
                    }}>{i + 1}</div><div style={{ marginTop: 4, color: T.maroonDark, fontWeight: 600 }}>{step}</div></div>{i < 2 && <div style={{ flex: 1, height: 2, background: T.border, marginBottom: 18 }} />}</React.Fragment>))}</div><div className="jb-card" style={{ padding: 14, marginBottom: 12 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{t("delivery_address")}</div>{addresses.length === 0 ? (<div><EmptyState text={t("no_address_found")} /><button className="jb-btn jb-btn-outline" onClick={() => setView("address")}>{t("add_address")}</button></div>) : (addresses.map((a, i) => (<label key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: 8, border: `1px solid ${addrIdx === i ? T.gold : T.border}`, borderRadius: 8, marginBottom: 6, cursor: "pointer" }}><input type="radio" checked={addrIdx === i} onChange={() => setAddrIdx(i)} /><div style={{ fontSize: 13 }}><b>{a.label}</b>{" — "}{a.line1}{", "}{a.city}{", "}{a.pincode}<br />{"📞 "}{a.phone}</div></label>)))}</div><div className="jb-card" style={{ padding: 14, marginBottom: 12 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{t("payment_mode")}</div>{["cod", "upi", "card"].map(m => (<label key={m} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}><input type="radio" checked={payMode === m} onChange={() => setPayMode(m)} />{m === "cod" ? t("cash_on_delivery") : m.toUpperCase()}</label>))}{payMode !== "cod" && (<div style={{ marginTop: 10, padding: 10, background: T.cream, borderRadius: 8 }}><div style={{ fontSize: 12, marginBottom: 6 }}>{payingUpi ? <>{t("pay_at_upi")}{" "}<b>{payingUpi}</b></> : t("seller_upi_not_set")}</div><div style={{ fontSize: 11, color: "#8a7360", marginBottom: 6 }}>{t("payment_ref_instruction")}</div><input className="jb-input" placeholder={t("upi_ref_placeholder")} value={paymentRef} onChange={e => setPaymentRef(e.target.value)} /></div>)}</div><div className="jb-card" style={{ padding: 14, marginBottom: 12 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{t("coupon_code_label")}</div>{appliedCoupon ? (<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 13, color: T.success }}>✓ "{appliedCoupon.code}{`" ${t("applied_word")} \u2014 \u20B9`}{discount}{` ${t("off_word")}`}</span><button className="jb-btn jb-btn-ghost" style={{ color: T.danger, fontSize: 12 }} onClick={() => { setAppliedCoupon(null); setCouponInput(""); }}>{t("remove_word")}</button></div>) : (<div style={{ display: "flex", gap: 8 }}><input className="jb-input" placeholder={t("coupon_placeholder")} value={couponInput} onChange={e => setCouponInput(e.target.value)} /><button className="jb-btn jb-btn-outline" onClick={applyCoupon}>{t("apply_word")}</button></div>)}</div><div className="jb-card" style={{ padding: 14, marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>{t("subtotal")}</span><span>₹{subtotal}</span></div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>{t("delivery_word")}</span><span>{deliveryFee === 0 ? t("free_word") : `₹${deliveryFee}`}</span></div>{discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.success }}><span>{t("coupon_discount")}</span><span>-₹{discount}</span></div>}<div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: 6, borderTop: `1px solid ${T.border}`, paddingTop: 6 }}><span>{t("total")}</span><span>₹{total}</span></div></div><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={placeOrder}>{t("place_order")}</button></div>);
}

export function OrderHistory({ setView, setActiveOrder }) {
    const { db, session, update, notify, t } = useApp();
    const orders = db.orders.filter(o => o.customerId === (session === null || session === void 0 ? void 0 : session.id));
    const [invoiceOrder, setInvoiceOrder] = useState(null);
    const [returnFlow, setReturnFlow] = useState(null); // { orderId, reason }
    const cancelOrder = (id, reason) => update(d => {
        const o = d.orders.find(o => o.id === id);
        o.status = "cancelled";
        o.cancelReason = reason;
        o.timeline.push({ status: "cancelled", at: nowISO() });
        // Cancelled order ka stock seller ke paas wapas add karo, taaki dusre customers use kharid sakein.
        o.items.forEach(it => {
            const prod = d.products.find(p => p.id === it.productId);
            if (prod)
                prod.stock = (prod.stock || 0) + it.qty;
        });
    });
    const requestReturn = (id, reason) => update(d => {
        const o = d.orders.find(o => o.id === id);
        o.returnRequest = { reason, status: "pending", at: nowISO() };
        o.status = "return-requested";
        o.timeline.push({ status: "return-requested", at: nowISO() });
        d.notifications.unshift({ id: uid("n"), userId: "admin-broadcast", text: `Return request for order #${o.id.slice(-6)}: ${reason}`, at: nowISO(), read: false });
    });
    const user = db.users.find(u => u.id === (session === null || session === void 0 ? void 0 : session.id));
    return (<div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{t("order_history")}</div>{orders.length === 0 ? <EmptyState text={t("no_order_found")} /> : orders.map(o => (<div key={o.id} className="jb-card" style={{ padding: 14, marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><b style={{ fontSize: 13 }}>{t("order_hash")}{o.id.slice(-6)}</b><StatusBadge status={o.status} /></div><div style={{ fontSize: 12, color: "#8a7360", margin: "4px 0" }}>{new Date(o.createdAt).toLocaleDateString()}{" • "}{o.items.length}{` ${t("items_word")} \u2022 \u20B9`}{o.total}</div>{o.items.map(it => <div key={it.productId} style={{ fontSize: 12 }}>{"• "}{it.name}{" x"}{it.qty}</div>)}{o.returnRequest && (<div style={{ fontSize: 12, marginTop: 6, background: T.cream, padding: 8, borderRadius: 8 }}>{t("return_label")}{" "}{o.returnRequest.reason}{" — "}<StatusBadge status={o.returnRequest.status} />{o.refund && <div style={{ marginTop: 4 }}>{t("refund_label")}{" ₹"}{o.refund.amount}{": "}<StatusBadge status={o.refund.status} /></div>}</div>)}<div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}><button className="jb-btn jb-btn-outline" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => { setActiveOrder(o.id); setView("tracking"); }}>{t("track_order")}</button><button className="jb-btn jb-btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setInvoiceOrder(o)}>{t("invoice_word")}</button>{["processing"].includes(o.status) && (<button className="jb-btn jb-btn-danger" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => { const r = prompt(t("cancel_reason_prompt")); if (r) {
                        cancelOrder(o.id, r);
                        notify(t("order_cancelled"), "success");
                    } }}>{t("cancel_order")}</button>)}{o.status === "delivered" && !o.returnRequest && (<button className="jb-btn jb-btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => {
                        const r = prompt(t("return_refund_reason_prompt"));
                        if (!r)
                            return;
                        if (user === null || user === void 0 ? void 0 : user.authSecret)
                            setReturnFlow({ orderId: o.id, reason: r });
                        else {
                            requestReturn(o.id, r);
                            notify(t("return_refund_sent"), "success");
                        }
                    }}>{t("return_refund_request")}</button>)}</div></div>))}{invoiceOrder && <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />}{returnFlow && (<Modal onClose={() => setReturnFlow(null)} width={380}><div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: T.maroonDark }}>{"🔐 "}{t("refund_verification")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 12 }}>{t("refund_verification_subtitle")}</div><TotpGate secret={user === null || user === void 0 ? void 0 : user.authSecret} mode="verify" accountLabel={user === null || user === void 0 ? void 0 : user.name} onSuccess={() => { requestReturn(returnFlow.orderId, returnFlow.reason); notify(t("return_refund_sent"), "success"); setReturnFlow(null); }} onCancel={(msg) => { setReturnFlow(null); if (msg)
                    notify(msg, "error"); }} /></Modal>)}</div>);
}

export function OrderTracking({ orderId, setView }) {
    const { db, t } = useApp();
    const o = db.orders.find(o => o.id === orderId);
    if (!o)
        return <EmptyState text={t("order_not_found")} />;
    const stages = ["processing", "packed", "shipped", "delivered"];
    const currentIdx = stages.indexOf(o.status);
    return (<div style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{t("track_order")}{" #"}{o.id.slice(-6)}</div><div className="jb-card" style={{ padding: 16 }}>{["processing", "packed", "shipped", "delivered"].includes(o.status) ? (<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>{stages.map((s, i) => (<div key={s} style={{ textAlign: "center", flex: 1 }}><div style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", background: i <= currentIdx ? T.maroon : T.border, color: "#fff", fontSize: 13 }}>{i <= currentIdx ? "✓" : i + 1}</div><div style={{ fontSize: 11, marginTop: 4, textTransform: "capitalize" }}>{s}</div></div>))}</div>) : <StatusBadge status={o.status} />}{o.deliveryPartner && <div style={{ fontSize: 13, marginBottom: 8 }}>{"🛵 "}{t("delivery_partner_label")}{" "}<b>{o.deliveryPartner}</b></div>}{o.status === "shipped" && <div style={{ fontSize: 13, background: T.cream, padding: 10, borderRadius: 8 }}>{t("delivery_otp_label")}{" "}<b style={{ fontSize: 18, color: T.maroon }}>{o.deliveryOtp}</b></div>}<div style={{ marginTop: 14, fontSize: 12 }}>{o.timeline.map((tl, i) => <div key={i} style={{ marginBottom: 4 }}>{"• "}{tl.status}{" — "}{new Date(tl.at).toLocaleString()}</div>)}</div></div><button className="jb-btn jb-btn-outline" style={{ marginTop: 12 }} onClick={() => setView("orders")}>{"← "}{t("back_to_order_history")}</button></div>);
}

export function WishlistView({ setView, setActiveProduct, cartApi }) {
    const { db, session, update, notify, t } = useApp();
    const user = db.users.find(u => u.id === (session === null || session === void 0 ? void 0 : session.id));
    const items = db.products.filter(p => { var _a; return (_a = user === null || user === void 0 ? void 0 : user.wishlist) === null || _a === void 0 ? void 0 : _a.includes(p.id); });
    const remove = (pid) => update(d => { const u = d.users.find(u => u.id === session.id); u.wishlist = u.wishlist.filter(x => x !== pid); });
    return (<div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{t("wishlist")}</div>{items.length === 0 ? (<EmptyState icon="❤️" text={t("wishlist_empty")} subtitle={t("wishlist_empty_subtitle")} actionLabel={t("browse_products")} onAction={() => setView("home")} />) : (<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>{items.map(p => <ProductCard key={p.id} p={p} onOpen={() => { setActiveProduct(p.id); setView("product"); }} onAdd={() => { cartApi.add(p.id); notify(t("cart_added"), "success"); }} onWishlist={() => remove(p.id)} wished={true} />)}</div>)}</div>);
}

export function AddressBook({ setView }) {
    const { t: tt } = useApp();
    const { db, session, update, notify, t } = useApp();
    const user = db.users.find(u => u.id === (session === null || session === void 0 ? void 0 : session.id));
    const [form, setForm] = useState({ label: tt("home_word"), line1: "", city: "", pincode: "", phone: "" });
    const [locating, setLocating] = useState(false);
    const detectLocation = () => {
        if (!navigator.geolocation)
            return notify(t("location_not_supported"), "error");
        setLocating(true);
        navigator.geolocation.getCurrentPosition((pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, capturedAt: nowISO() };
            update(d => { d.users.find(u => u.id === session.id).location = loc; });
            notify(`${t("current_location_saved")} (${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)})`, "success");
            setLocating(false);
        }, () => { notify(t("location_access_failed"), "error"); setLocating(false); }, { timeout: 8000 });
    };
    const add = () => {
        if (!form.line1 || !form.pincode || !form.phone)
            return notify(t("fill_all_fields"), "error");
        update(d => { const u = d.users.find(u => u.id === session.id); if (!u.address)
            u.address = []; u.address.push(form); });
        setForm({ label: tt("home_word"), line1: "", city: "", pincode: "", phone: "" });
        notify(t("address_added"), "success");
    };
    const remove = (i) => update(d => { const u = d.users.find(u => u.id === session.id); u.address.splice(i, 1); });
    return (<div style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{t("address_book")}</div>{((user === null || user === void 0 ? void 0 : user.address) || []).map((a, i) => (<div key={i} className="jb-card" style={{ padding: 12, marginBottom: 8, display: "flex", justifyContent: "space-between" }}><div style={{ fontSize: 13 }}><b>{a.label}</b><br />{a.line1}{", "}{a.city}{" - "}{a.pincode}<br />{"📞 "}{a.phone}</div><button className="jb-btn jb-btn-ghost" style={{ color: T.danger }} onClick={() => remove(i)}>{t("delete_word")}</button></div>))}{(user === null || user === void 0 ? void 0 : user.location) && <div style={{ fontSize: 11, color: "#8a7360", marginBottom: 8 }}>{"📍 "}{t("current_location_saved")}{" "}{user.location.lat.toFixed(3)}{", "}{user.location.lng.toFixed(3)}</div>}<button className="jb-btn jb-btn-outline" style={{ marginBottom: 12, width: "100%", justifyContent: "center" }} disabled={locating} onClick={detectLocation}>{"📍 "}{locating ? t("detecting") : t("use_current_location")}</button><div className="jb-card" style={{ padding: 14, marginTop: 12 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{t("add_new_address")}</div><select className="jb-input" style={{ marginBottom: 8 }} value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}><option>{t("home_word")}</option><option>{t("work_word")}</option><option>{t("other_word")}</option></select><Field placeholder={t("house_no_placeholder")} value={form.line1} onChange={e => setForm(f => ({ ...f, line1: e.target.value }))} /><Field placeholder={t("city_placeholder")} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /><Field placeholder={t("pincode_placeholder")} value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} /><Field placeholder={t("phone_placeholder")} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={add}>{t("save_address")}</button></div></div>);
}

export function SecuritySettings({ setView }) {
    const { db, session, update, notify, t } = useApp();
    const user = db.users.find(u => u.id === (session === null || session === void 0 ? void 0 : session.id));
    const [stage, setStage] = useState("view"); // view | setup | disable-verify
    const [secret, setSecret] = useState("");
    const startEnable = () => {
        setSecret(generateBase32Secret());
        setStage("setup");
    };
    const onEnabled = () => {
        update(d => { d.users.find(u => u.id === session.id).authSecret = secret; });
        notify(t("two_fa_enabled"), "success");
        setStage("view");
    };
    const onDisabled = () => {
        update(d => { d.users.find(u => u.id === session.id).authSecret = null; });
        notify(t("two_fa_disabled"), "success");
        setStage("view");
    };
    return (<div style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{"🔐 "}{t("two_fa_title")}</div>{stage === "view" && (<div className="jb-card" style={{ padding: 16 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><div style={{ fontWeight: 600 }}>{t("two_fa")}</div><StatusBadge status={(user === null || user === void 0 ? void 0 : user.authSecret) ? "approved" : "blocked"} /></div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 12 }}>{(user === null || user === void 0 ? void 0 : user.authSecret) ? t("two_fa_on_desc") : t("two_fa_off_desc")}</div>{(user === null || user === void 0 ? void 0 : user.authSecret) ? (<button className="jb-btn jb-btn-danger" onClick={() => setStage("disable-verify")}>{t("two_fa_off_btn")}</button>) : (<button className="jb-btn jb-btn-primary" onClick={startEnable}>{t("two_fa_on_btn")}</button>)}</div>)}{stage === "setup" && (<div className="jb-card" style={{ padding: 16 }}><div style={{ fontWeight: 700, marginBottom: 4, color: T.maroonDark }}>{t("two_fa_setup")}</div><TotpGate secret={secret} mode="setup" accountLabel={user === null || user === void 0 ? void 0 : user.name} onSuccess={onEnabled} onCancel={() => setStage("view")} /></div>)}{stage === "disable-verify" && (<div className="jb-card" style={{ padding: 16 }}><div style={{ fontWeight: 700, marginBottom: 4, color: T.maroonDark }}>{t("two_fa_disable_verify")}</div><TotpGate secret={user === null || user === void 0 ? void 0 : user.authSecret} mode="verify" accountLabel={user === null || user === void 0 ? void 0 : user.name} onSuccess={onDisabled} onCancel={() => setStage("view")} /></div>)}</div>);
}

export function ProfileMenu({ setView }) {
    const { t: tt } = useApp();
    var _a, _b;
    const { db, session, update, notify, logout } = useApp();
    const isMobile = useIsMobile();
    const user = db.users.find(u => u.id === (session === null || session === void 0 ? void 0 : session.id));
    const [name, setName] = useState((user === null || user === void 0 ? void 0 : user.name) || "");
    const wrapStyle = { maxWidth: 640, margin: "0 auto", padding: isMobile ? 16 : 32 };
    const accountHeader = <div style={{
            position: "sticky", top: 0, zIndex: 90, background: "#fff",
            borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center",
            gap: 12, padding: "14px 16px",
        }}><button onClick={() => setView("home")} aria-label={tt("x_back_0557")} style={{
                background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.ink,
                display: "flex", alignItems: "center", padding: 4, lineHeight: 1,
            }}>←</button><div style={{ fontSize: 15, fontWeight: 700, color: T.ink, letterSpacing: 0.6 }}>{tt("ui_account")}</div></div>;
    if (!session) {
        const guestItems = [
            { label: tt("help"), icon: "?", color: "#5B7FE0", view: "help" },
            { label: tt("l_become_a_supplier"), icon: "\uD83D\uDCBC", color: "#F2A93B", view: "auth" },
            { label: tt("l_legal_and_policies"), icon: "\u2696\uFE0F", color: "#E2823C", view: "terms" },
            { label: tt("l_delete_account"), icon: null, color: null, view: null, action: "delete" },
        ];
        return (<>{accountHeader}<div style={wrapStyle}><div className="jb-card" style={{ padding: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 14 }}><DefaultAvatarIcon size={56} /><div style={{ flex: 1 }}><button className="jb-btn jb-btn-gold" style={{ marginBottom: 6 }} onClick={() => setView("auth")}>{tt("ui_sign_up")}</button><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_view_and_update_your_profile")}</div></div></div><div className="jb-card" style={{ marginBottom: 12, overflow: "hidden" }}>{guestItems.map((it, idx) => <div key={it.label} style={{
                            padding: "16px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer",
                            borderBottom: idx < guestItems.length - 1 ? `1px solid ${T.border}` : "none",
                        }} onClick={() => it.action === "delete" ? notify(tt("m_account_delete_karne_ke_liye"), "error") : setView(it.view)}><div style={{
                                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                background: it.color || "transparent",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 18, color: "#fff", fontWeight: 700,
                            }}>{it.icon || ""}</div><span style={{ flex: 1, fontSize: 15, color: T.ink }}>{it.label}</span></div>)}</div></div></>);
    }
    const items = [
        { label: tt("edit_profile"), icon: "✏️", view: null, action: "editing" },
        { label: tt("address_book"), icon: "📍", view: "address" },
        { label: tt("order_history"), icon: "📦", view: "orders" },
        { label: tt("wishlist"), icon: "♡", view: "wishlist" },
        { label: tt("l_invite_referral"), icon: "🎁", view: "referral" },
        { label: tt("ui_notifications"), icon: "🔔", view: "notifications" },
        (user === null || user === void 0 ? void 0 : user.isReseller) ? { label: tt("l_reseller_dashboard"), icon: "🛍️", view: "reseller-dashboard" } : null,
        { label: tt("l_security_settings_2fa"), icon: "🔐", view: "security" },
        { label: tt("help_support"), icon: "❓", view: "help" },
        { label: tt("about_us"), icon: "ℹ️", view: "about" },
        { label: tt("ui_terms_conditions"), icon: "📄", view: "terms" },
        { label: tt("ui_privacy_policy"), icon: "🔒", view: "privacy" },
    ].filter(Boolean);
    const [editing, setEditing] = useState(false);
    const saveName = () => { update(d => { d.users.find(u => u.id === session.id).name = name; }); notify(tt("m_profile_update_ho_gaya"), "success"); setEditing(false); };
    const deleteAccount = () => {
        if (!confirm(tt("m_pakka_apna_account_delete_de")))
            return;
        update(d => { d.users = d.users.filter(u => u.id !== session.id); });
        logout();
        setView("home");
        notify(tt("m_account_delete_ho_gaya"), "success");
    };
    return (<>{accountHeader}<div style={wrapStyle}><div className="jb-card" style={{ padding: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 14 }}><DefaultAvatarIcon size={56} />{editing ? (<div style={{ flex: 1, display: "flex", gap: 6, flexWrap: "wrap" }}><input className="jb-input" style={{ maxWidth: 200 }} value={name} onChange={e => setName(e.target.value)} /><button className="jb-btn jb-btn-primary" onClick={saveName}>{tt("ui_save")}</button></div>) : (<div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{user === null || user === void 0 ? void 0 : user.name}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 6 }}>{user === null || user === void 0 ? void 0 : user.mobile}</div><button className="jb-btn jb-btn-ghost" style={{ fontSize: 12 }} onClick={() => setEditing(true)}>{tt("ui_edit_name")}</button></div>)}</div>{!(user === null || user === void 0 ? void 0 : user.isReseller) && ((user === null || user === void 0 ? void 0 : user.resellerStatus) || "none") === "none" && (<div className="jb-card" style={{ padding: 16, marginBottom: 12, background: `linear-gradient(120deg, ${T.maroon}, ${T.maroonDark})`, border: "none", color: "#fff", textAlign: "center" }}><div style={{ fontWeight: 700, marginBottom: 4 }}>{tt("l_bina_stock_ke_bhi_kamayein")}</div><div style={{ fontSize: 12, opacity: 0.9, marginBottom: 10 }}>{tt("l_products_apne_price_par_li")}</div><button className="jb-btn jb-btn-gold" onClick={() => setView("reseller-apply")}>{tt("ui_reseller_ke_liye_apply_karei")}</button></div>)}{!(user === null || user === void 0 ? void 0 : user.isReseller) && (user === null || user === void 0 ? void 0 : user.resellerStatus) === "pending" && (<div className="jb-card" style={{ padding: 16, marginBottom: 12, background: "#FFF3CD", border: "none", textAlign: "center" }}><div style={{ fontWeight: 700, marginBottom: 4 }}>{tt("l_reseller_application_pendi")}</div><div style={{ fontSize: 12, color: "#8A6D1D" }}>{tt("ui_aapka_kyc_admin_ke_paas_revi")}</div></div>)}{!(user === null || user === void 0 ? void 0 : user.isReseller) && (user === null || user === void 0 ? void 0 : user.resellerStatus) === "rejected" && (<div className="jb-card" style={{ padding: 16, marginBottom: 12, background: "#FBE1DC", border: "none", textAlign: "center" }}><div style={{ fontWeight: 700, marginBottom: 4 }}>{tt("l_reseller_application_rejec")}</div><div style={{ fontSize: 12, color: T.danger, marginBottom: 10 }}>{((_b = user === null || user === void 0 ? void 0 : user.resellerKyc) === null || _b === void 0 ? void 0 : _b.rejectReason) || tt("x_details_check_karke_doba_30ed")}</div><button className="jb-btn jb-btn-outline" onClick={() => setView("reseller-apply")}>{tt("ui_dobara_apply_karein")}</button></div>)}<div className="jb-card" style={{ marginBottom: 12, overflow: "hidden" }}>{items.map((it, idx) => (<div key={it.label} style={{
                    padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
                    borderBottom: idx < items.length - 1 ? `1px solid ${T.border}` : "none",
                }} onClick={() => it.view && setView(it.view)}><span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{it.icon}</span><span style={{ flex: 1, fontSize: 14, color: T.ink }}>{it.label}</span><span style={{ color: "#bbb" }}>→</span></div>))}</div>{db.supportWhatsapp && (<div className="jb-card" style={{ padding: 14, marginBottom: 8, cursor: "pointer", background: "#25D366", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => window.open(`https://wa.me/91${db.supportWhatsapp}?text=${encodeURIComponent(tt("x_namaste_mujhe_jila_bazar_1796"))}`, "_blank")}>{tt("l_help_support_whatsapp")}</div>)}<button className="jb-btn jb-btn-danger" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} onClick={deleteAccount}>{tt("ui_delete_deactivate_account")}</button></div></>);
}

export function ReferralPage() {
    const { t: tt } = useApp();
    const { db, session, notify, t } = useApp();
    const user = db.users.find(u => u.id === (session === null || session === void 0 ? void 0 : session.id));
    const link = `https://jilabazar.in/invite/${(user === null || user === void 0 ? void 0 : user.referralCode) || "JB000"}`;
    const shareMsg = `${t("brand_name")} — Aapka apna hyperlocal bazar! Silk, electronics, groceries sab yahan milega. Mera referral link se join karein aur discount paayein:\n${link}`;
    return (<div style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}><div className="jb-card" style={{ padding: 20, textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{tt("l_dost_ko_bulayein_dono_ko_f")}</div><div style={{ fontSize: 13, color: "#8a7360", marginBottom: 16 }}>{tt("l_har_successful_referral_pa")}</div><div className="jb-input" style={{ marginBottom: 10, fontSize: 12, wordBreak: "break-all" }}>{link}</div><div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}><button className="jb-btn jb-btn-gold" onClick={() => { var _a; (_a = navigator.clipboard) === null || _a === void 0 ? void 0 : _a.writeText(link); notify(tt("m_link_copy_ho_gaya"), "success"); }}>{tt("ui_copy_link")}</button><button className="jb-btn" style={{ background: "#25D366", color: "#fff" }} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg)}`, "_blank")}>{tt("l_app_share_karein_whatsapp")}</button></div></div></div>);
}

export function AboutUsPage({ page = "about", setView }) {
    const { t: tt } = useApp();
    var _a;
    const { db, t } = useApp();
    const titles = { about: t("about_us"), terms: tt("ui_terms_conditions"), privacy: tt("ui_privacy_policy") };
    const content = ((_a = db.sitePages) === null || _a === void 0 ? void 0 : _a[page]) || "";
    return (<div style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}>{page === "about" && (<div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 18 }}><JBIcon size={64} /><div className="jb-display" style={{ fontSize: 20, marginTop: 8 }}>{t("brand_name")}</div><div style={{ fontSize: 11, color: "#8a7360", marginTop: 2 }}>{"Version "}{APP_VERSION}</div></div>)}<div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{titles[page]}</div><div className="jb-card" style={{ padding: 18 }}>{content ? <div style={{ fontSize: 14, color: "#5a4a3a", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{content}</div> : <EmptyState text={tt("x_abhi_content_add_nahi_hu_6113")} />}</div>{page === "about" && (<>{db.supportWhatsapp && (<div className="jb-card" style={{ padding: 18, marginTop: 14 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_sampark_karein_contact_us")}</div><button className="jb-btn" style={{ background: "#25D366", color: "#fff", width: "100%", justifyContent: "center" }} onClick={() => window.open(`https://wa.me/91${db.supportWhatsapp}?text=${encodeURIComponent(tt("x_namaste_mujhe_jila_bazar_dbed"))}`, "_blank")}>{tt("l_whatsapp_par_sampark_karei")}</button></div>)}<div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14, fontSize: 12 }}><span style={{ color: T.maroon, cursor: "pointer", textDecoration: "underline" }} onClick={() => setView && setView("terms")}>{tt("ui_terms_conditions")}</span><span style={{ color: "#c9b8a3" }}>|</span><span style={{ color: T.maroon, cursor: "pointer", textDecoration: "underline" }} onClick={() => setView && setView("privacy")}>{tt("ui_privacy_policy")}</span></div></>)}</div>);
}

export function NotificationsView({ adminBroadcast }) {
    const { t: tt } = useApp();
    const { db, session, update } = useApp();
    const items = db.notifications
        .filter(n => n.userId === (session === null || session === void 0 ? void 0 : session.id) || (adminBroadcast && n.userId === "admin-broadcast"))
        .sort((a, b) => new Date(b.at) - new Date(a.at));
    useEffect(() => { update(d => { d.notifications.forEach(n => { if (n.userId === (session === null || session === void 0 ? void 0 : session.id) || (adminBroadcast && n.userId === "admin-broadcast"))
        n.read = true; }); }); }, []);
    return (<div style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_notifications")}</div>{items.length === 0 ? <EmptyState text={tt("x_koi_notification_nahi_7967")} /> : items.map(n => (<div key={n.id} className="jb-card" style={{ padding: 12, marginBottom: 8, fontSize: 13 }}>{n.text}<div style={{ fontSize: 11, color: "#8a7360", marginTop: 4 }}>{new Date(n.at).toLocaleString()}</div></div>))}</div>);
}
