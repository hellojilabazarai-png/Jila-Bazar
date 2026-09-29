import React from "react";
import { useApp } from "./AppContext.jsx";
import { T } from "./theme.js";

export const COMING_SOON_FEATURES = [
    ["seller", "Seller Panel (Dashboard, Products, Orders...)", (v) => v.startsWith("seller-")],
    ["sellerSignup", "Seller Registration / Login (Auth screen par Seller tab)", null],
    ["reseller", "Reseller Program (Apply / Dashboard)", (v) => v.startsWith("reseller-")],
    ["wishlist", "Wishlist", (v) => v === "wishlist"],
    ["referral", "Refer & Earn", (v) => v === "referral"],
    ["categories", "Categories Screen", (v) => v === "categories"],
    ["aiSearch", "AI Search & AI Recommendations", null],
    ["flashSale", "Flash Sale section (Home)", null],
];

export const csOn = (db, key) => !!(db && db.comingSoon && db.comingSoon.features && db.comingSoon.features[key]);

export function featureForView(view) { const f = COMING_SOON_FEATURES.find(([, , test]) => test && test(view)); return f ? f[0] : null; }

export function ComingSoonScreen({ setView }) {
    const { db, t, session, logout } = useApp();
    return (<div style={{ maxWidth: 420, margin: "60px auto", padding: 16, textAlign: "center" }}><div className="jb-card" style={{ padding: 28 }}><div style={{ fontSize: 52 }}>🚧</div><div className="jb-display" style={{ fontSize: 24, margin: "10px 0 6px", color: T.maroon }}>{t("coming_soon")}</div><div style={{ fontSize: 14, color: "#5a4a3a", marginBottom: 18, whiteSpace: "pre-wrap" }}>{(db.comingSoon && db.comingSoon.message) || t("coming_soon_msg")}</div><button className="jb-btn jb-btn-primary" onClick={() => setView("home")}>{t("go_home")}</button>{session && session.role === "seller" && <div><button className="jb-btn jb-btn-ghost" style={{ marginTop: 8 }} onClick={() => { logout(); setView("home"); }}>{t("logout")}</button></div>}</div></div>);
}
