import React, { useState, useEffect } from "react";
import { useApp } from "./AppContext.jsx";
import { useIsMobile } from "./helpers.js";
import { T } from "./theme.js";

// Every admin section available for assignment. Super Admin always sees all of these.
// Staff/other-admin accounts only see the ones explicitly granted in their `permissions` array.
export const ALL_ADMIN_SECTIONS_BASE = [
    ["admin-dashboard", "Dashboard"], ["admin-users", "Users"], ["admin-sellers", "Sellers"], ["admin-resellers", "Reseller Applications"],
    ["admin-products", "Product Approval"], ["admin-orders", "Orders"], ["admin-returns", "Returns & Refunds"],
    ["admin-ads", "Promotions (Ads)"], ["admin-coupons", "Coupons"], ["admin-flashsale", "Flash Sale"],
    ["admin-delivery-partners", "Delivery Partners"], ["admin-revenue", "Revenue"],
    ["admin-withdrawals", "Withdrawals"], ["admin-banners", "Banners"], ["admin-categories", "Categories"],
    ["admin-commission", "Commission"], ["admin-delivery", "Delivery Charges"], ["admin-analytics", "Analytics"],
    ["admin-pages", "About/Terms/Privacy"], ["admin-help", "Help & Support"], ["admin-texts", "App Texts (Language)"], ["admin-comingsoon", "Coming Soon Control"],
    ["admin-staff", "Staff Management"], ["admin-audit", "Audit Log"], ["admin-reports", "Reports Export"],
    ["admin-fraud", "AI Fraud Check"], ["admin-aichats", "AI Chat Logs"], ["admin-aisettings", "AI Settings"],
    ["admin-security", "Security / Admin Entry"],
];

export const adminSections = (tf) => ALL_ADMIN_SECTIONS_BASE.map(([k, l]) => { const key = "as_" + String(l).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); const v = tf(key); return [k, v === key ? l : v]; });

// Always accessible regardless of assigned permissions (baseline for any admin account).
export const ADMIN_BASELINE_SECTIONS = ["admin-dashboard", "admin-notifications"];

export function hasAdminPermission(session, sectionKey) {
    if (!session || session.role !== "admin")
        return false;
    if (session.level === "super_admin")
        return true;
    if (sectionKey === "admin-staff" || sectionKey === "admin-aisettings" || sectionKey === "admin-security")
        return false; // only Super Admin can manage staff/permissions, API credentials, or admin-entry security
    if (ADMIN_BASELINE_SECTIONS.includes(sectionKey))
        return true;
    return (session.permissions || []).includes(sectionKey);
}

export function AdminShell({ setView, children, active }) {
    const { t: tt } = useApp();
    var _a;
    const { logout, session } = useApp();
    const isSuperAdmin = (session === null || session === void 0 ? void 0 : session.level) === "super_admin";
    const allTabs = [...adminSections(tt), ["admin-notifications", tt("x_my_notifications_7cae")]];
    const tabs = isSuperAdmin ? allTabs : allTabs.filter(([k]) => hasAdminPermission(session, k));
    const isMobile = useIsMobile();
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
    useEffect(() => { setSidebarOpen(!isMobile); }, [isMobile]);
    const sidebar = (<div style={{
            width: isMobile ? "80vw" : 200, maxWidth: 260, background: T.maroonDark, color: "#fff", padding: 12, flexShrink: 0,
            position: isMobile ? "fixed" : "static", top: 0, left: 0, bottom: 0, zIndex: 200, overflowY: "auto",
            boxShadow: isMobile ? "4px 0 20px rgba(0,0,0,0.3)" : "none",
        }} className="jb-scroll"><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}><div className="jb-display" style={{ fontSize: 18, padding: "0 6px" }}>{tt("ui_admin_panel")}</div>{isMobile && <span onClick={() => setSidebarOpen(false)} style={{ cursor: "pointer", fontSize: 18, padding: "0 6px" }}>✕</span>}</div><div style={{ fontSize: 10, color: T.goldLight, padding: "0 6px", marginBottom: 10 }}>{isSuperAdmin ? "Super Admin" : "Staff"}{" — "}{session === null || session === void 0 ? void 0 :
            session.name}</div><div onClick={() => setView("home")} style={{ padding: "8px 10px", marginBottom: 10, borderRadius: 8, cursor: "pointer", fontSize: 12, background: "rgba(255,255,255,0.08)", color: T.goldLight }}>{tt("x_website_par_jayein_6920")}</div>{tabs.map(([k, label]) => (<div key={k} onClick={() => { setView(k); if (isMobile)
                setSidebarOpen(false); }} style={{ padding: "9px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, marginBottom: 2, background: active === k ? T.gold : "transparent", color: active === k ? T.ink : "#fff", fontWeight: active === k ? 700 : 400 }}>{label}</div>))}<div onClick={() => { logout(); setView("home"); }} style={{ padding: "9px 10px", marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 13, color: "#f5c6c6" }}>{tt("ui_logout")}</div></div>);
    return (<div style={{ display: "flex", minHeight: "80vh", position: "relative" }}>{isMobile && (<div style={{ position: "sticky", top: 0, zIndex: 150, background: T.maroonDark, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}><span onClick={() => setSidebarOpen(true)} style={{ cursor: "pointer", fontSize: 20, color: "#fff" }}>☰</span><span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{((_a = adminSections(tt).find(([k]) => k === active)) === null || _a === void 0 ? void 0 : _a[1]) || tt("x_admin_panel_a0e0")}</span></div>)}{sidebarOpen && sidebar}{isMobile && sidebarOpen && (<div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 190 }} />)}<div style={{ flex: 1, padding: 20, overflowX: "auto", minWidth: 0 }}>{children}</div></div>);
}
