import React, { useEffect } from "react";
import { useApp } from "./AppContext.jsx";
import { useIsMobile } from "./helpers.js";
import { T } from "./theme.js";
import { JBIcon } from "./BasicUI.jsx";

/* ---------------------------- HEADER + HIDDEN ADMIN TRIGGER ---------------------------- */
// Admin panel ka koi bhi visible button, icon, ya hint app mein kahin nahi hai — poori tarah invisible.
// Sirf 2 chhupe hue tareeke se khulta hai, dono mein koi on-screen feedback nahi milta. Actual values
// db.adminSecretKeyword aur db.adminUrlSecret mein rehte hain (default SEED mein) — Admin > Security se
// koi bhi Super Admin inhe kabhi bhi badal sakta hai:
//   1) db.adminSecretKeyword search box mein type karna
//   2) ?jb_gate=<db.adminUrlSecret> wala link open karna
export function Header({ view, setView, cartCount, onSearch, showBack, onBack, searchValue }) {
    const { t: tt } = useApp();
    var _a;
    const { session, logout, db, lang, setLang, t } = useApp();
    const isMobile = useIsMobile();
    const openAdminEntry = () => {
        const hasAdmin = db.users.some(u => u.role === "admin");
        setView(hasAdmin ? "admin-login" : "admin-setup");
    };
    // Secret keyword anywhere on the page (ignored while typing in an input/textarea) — no visual feedback at all.
    // Two separate keywords: Super Admin's (can open first-time setup too) and Staff's (always goes straight to Admin Login, never setup).
    useEffect(() => {
        let buffer = "";
        const superKeyword = (db.adminSecretKeyword || "").toLowerCase();
        const staffKeyword = (db.adminStaffSecretKeyword || "").toLowerCase();
        const maxLen = Math.max(superKeyword.length, staffKeyword.length);
        const onKeyDown = (e) => {
            var _a;
            if (!superKeyword && !staffKeyword)
                return;
            const tag = (_a = document.activeElement) === null || _a === void 0 ? void 0 : _a.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA")
                return;
            if (e.key.length !== 1)
                return;
            buffer = (buffer + e.key.toLowerCase()).slice(-maxLen);
            if (superKeyword && buffer.endsWith(superKeyword)) {
                buffer = "";
                openAdminEntry();
            }
            else if (staffKeyword && buffer.endsWith(staffKeyword)) {
                buffer = "";
                setView("admin-login"); // Staff kabhi setup nahi karta, seedha login
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);

    }, [db]);
    const searchBar = view === "home" && (<div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", minWidth: isMobile ? "100%" : 120, order: isMobile ? 3 : 0 }}><input placeholder={t("search_placeholder")} value={searchValue || ""} onChange={(e) => {
                const v = e.target.value;
                if (db.adminSecretKeyword && v.toLowerCase() === db.adminSecretKeyword.toLowerCase()) {
                    onSearch && onSearch("");
                    openAdminEntry();
                    return;
                }
                if (db.adminStaffSecretKeyword && v.toLowerCase() === db.adminStaffSecretKeyword.toLowerCase()) {
                    onSearch && onSearch("");
                    setView("admin-login");
                    return;
                }
                onSearch && onSearch(v);
            }} style={{
                flex: 1, padding: "8px 34px 8px 12px", borderRadius: 20, border: "none", fontSize: 13,
                fontFamily: "'Poppins', sans-serif", width: "100%", color: T.ink, background: "#fff",
            }} />{searchValue && (<span onClick={() => onSearch && onSearch("")} style={{
                position: "absolute", right: 10, cursor: "pointer", color: "#8a7360",
                fontSize: 15, fontWeight: 700, lineHeight: 1, userSelect: "none",
            }} aria-label="Clear search">✕</span>)}</div>);
    return (<div style={{ position: "sticky", top: 0, zIndex: 100, background: T.maroon, color: "#fff" }}><div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 16px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, rowGap: 8 }}>{showBack ? (<button className="jb-btn-ghost jb-btn" style={{ color: "#fff", background: "rgba(255,255,255,0.1)" }} onClick={onBack}>{"\u2190 " + tt("back_word")}</button>) : null}<div className="jb-display" style={{ fontSize: 22, flexShrink: 0, padding: 6, margin: -6, display: "flex", alignItems: "center", gap: 8 }} title={t("brand_name")}><JBIcon size={30} />{t("brand_name")}</div>{!isMobile && searchBar}{!isMobile && <div style={{ flex: view === "home" ? 0 : 1 }} />}{isMobile && <div style={{ flex: 1 }} />}<select value={lang} onChange={(e) => setLang(e.target.value)} style={{
                    background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.35)",
                    borderRadius: 8, fontSize: 12, padding: "6px 6px", fontFamily: "'Poppins', sans-serif", cursor: "pointer",
                }} title={t("language")}><option value="hi" style={{ color: "#000" }}>हिंदी</option><option value="en" style={{ color: "#000" }}>{tt("ui_english")}</option><option value="bn" style={{ color: "#000" }}>বাংলা</option></select>{(session === null || session === void 0 ? void 0 : session.role) === "customer" && (<><button className="jb-btn jb-btn-ghost" style={{ color: "#fff" }} onClick={() => setView("wishlist")}>♡</button><button className="jb-btn jb-btn-ghost" style={{ color: "#fff", position: "relative" }} onClick={() => setView("cart")}>{"🛒 "}{cartCount > 0 && <span style={{
                            position: "absolute", top: -4, right: -4, background: T.gold, color: T.ink,
                            borderRadius: 10, fontSize: 10, padding: "1px 5px", fontWeight: 700,
                        }}>{cartCount}</span>}</button><button className="jb-btn jb-btn-ghost" style={{ color: "#fff" }} onClick={() => setView("profile")}>👤{isMobile ? "" : " " + ((_a = session.name) === null || _a === void 0 ? void 0 : _a.split(" ")[0])}</button></>)}{(session === null || session === void 0 ? void 0 : session.role) === "seller" && (<button className="jb-btn jb-btn-ghost" style={{ color: "#fff" }} onClick={() => setView("seller-dashboard")}>🏪{isMobile ? "" : " " + session.shopName}</button>)}{session && (<button className="jb-btn jb-btn-outline" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.6)", padding: isMobile ? "6px 10px" : undefined }} onClick={() => { logout(); setView("home"); }}>{isMobile ? "⎋" : t("logout")}</button>)}{isMobile && searchBar}</div></div>);
}

export function BottomNav({ view, setView, session, cartCount }) {
    const { t: tt } = useApp();
    const { t } = useApp();
    const items = [
        { key: "home", label: t("home"), isLogo: true },
        { key: "home-categories", label: t("categories"), icon: "📂", targetView: "categories" },
        { key: "orders", label: t("orders"), icon: "📦" },
        { key: "help", label: t("help"), icon: "💬" },
        { key: "profile", label: t("account"), icon: "👤" },
    ];
    const go = (item) => {
        if (item.key === "orders" && !session)
            return setView("auth");
        setView(item.targetView || item.key);
    };
    const isActive = (item) => (item.targetView || item.key) === view;
    return (<div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 95, background: "#fff",
            borderTop: `1px solid ${T.border}`, display: "flex", boxShadow: "0 -2px 10px rgba(0,0,0,0.06)",
        }}>{items.map(item => (<div key={item.key} onClick={() => go(item)} style={{
            flex: 1, textAlign: "center", padding: "8px 0 6px", cursor: "pointer",
            color: isActive(item) ? T.maroon : "#9a8a78",
        }}><div style={{ fontSize: 18, position: "relative", display: "flex", justifyContent: "center" }}>{item.isLogo ? <JBIcon size={22} /> : item.icon}</div><div style={{ fontSize: 10, fontWeight: isActive(item) ? 700 : 500, marginTop: 2 }}>{item.label}</div></div>))}</div>);
}
