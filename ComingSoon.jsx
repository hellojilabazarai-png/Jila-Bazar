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
    ["sellerDashboard", "Seller - Dashboard", (v) => v === "seller-dashboard"],
    ["sellerKyc", "Seller - KYC / Bank / UPI", (v) => v === "seller-kyc"],
    ["sellerAddProduct", "Seller - Add Product", (v) => v === "seller-add-product"],
    ["sellerProducts", "Seller - Product Management", (v) => v === "seller-products"],
    ["sellerOrders", "Seller - Orders", (v) => v === "seller-orders"],
    ["sellerEarnings", "Seller - Earnings Report", (v) => v === "seller-earnings"],
    ["sellerInventoryAI", "Seller - AI Inventory Manager", (v) => v === "seller-inventory-ai"],
    ["sellerWithdrawal", "Seller - Withdrawal", (v) => v === "seller-withdrawal"],
    ["sellerReviews", "Seller - Product Reviews", (v) => v === "seller-reviews"],
    ["resellerApply", "Reseller - Apply / Join", (v) => v === "reseller-apply"],
    ["resellerDashboard", "Reseller - Dashboard", (v) => v === "reseller-dashboard"],
    ["resellerWithdrawal", "Reseller - Withdrawal", (v) => v === "reseller-withdrawal"],
    ["smsOtp", "Mobile SMS OTP (Registration par) - ON: OTP nahi, OFF: Real OTP", null],
];

// Jin features ko Admin ne kabhi touch nahi kiya, unka default yahan set hai (smsOtp: Real OTP abhi Coming Soon).
const CS_DEFAULT_ON = { smsOtp: true };
export const csOn = (db, key) => {
    const v = db && db.comingSoon && db.comingSoon.features ? db.comingSoon.features[key] : undefined;
    return v === undefined ? !!CS_DEFAULT_ON[key] : !!v;
};

// Kisi bhi screen (view) par Coming Soon lagna chahiye ya nahi: "seller"/"reseller" (poora panel) ya us screen ka apna switch ON ho.
export function comingSoonForView(db, view, session) {
    // Admin ne is seller ke liye koi function alag se band kiya ho (SellerActivity panel) to wo bhi Coming Soon dikhega
    const seller = session && session.role === "seller" && db ? (db.sellers || []).find(x => x.id === session.id) : null;
    const blockedForSeller = (k) => !!(seller && seller.disabledFeatures && seller.disabledFeatures[k]);
    return COMING_SOON_FEATURES.some(([k, , test]) => test && test(view) && (csOn(db, k) || blockedForSeller(k)));
}

export function featureForView(view) { const f = COMING_SOON_FEATURES.find(([, , test]) => test && test(view)); return f ? f[0] : null; }

export function ComingSoonScreen({ setView }) {
    const { db, t, session, logout } = useApp();
    return (<div style={{ maxWidth: 420, margin: "60px auto", padding: 16, textAlign: "center" }}><div className="jb-card" style={{ padding: 28 }}><div style={{ fontSize: 52 }}>🚧</div><div className="jb-display" style={{ fontSize: 24, margin: "10px 0 6px", color: T.maroon }}>{t("coming_soon")}</div><div style={{ fontSize: 14, color: "#5a4a3a", marginBottom: 18, whiteSpace: "pre-wrap" }}>{(db.comingSoon && db.comingSoon.message) || t("coming_soon_msg")}</div><button className="jb-btn jb-btn-primary" onClick={() => setView("home")}>{t("go_home")}</button>{session && session.role === "seller" && <div><button className="jb-btn jb-btn-ghost" style={{ marginTop: 8 }} onClick={() => { logout(); setView("home"); }}>{t("logout")}</button></div>}</div></div>);
}
