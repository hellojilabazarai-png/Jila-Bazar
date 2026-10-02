import React from "react";
import { useApp } from "./AppContext.jsx";
import { Modal } from "./CommonUI.jsx";
import { csOn } from "./ComingSoon.jsx";

// Seller ke wo function jinhe Admin har seller ke liye alag se chalu/band kar sakta hai
export const SELLER_FUNCTION_KEYS = ["sellerDashboard", "sellerKyc", "sellerAddProduct", "sellerProducts", "sellerOrders", "sellerEarnings", "sellerInventoryAI", "sellerWithdrawal", "sellerReviews"];

const DAY = 24 * 3600 * 1000;
const fill = (s, ...args) => args.reduce((acc, v, i) => acc.split("{" + i + "}").join(String(v)), s);

// Seller ke kaam ka hisaab: products, orders, withdrawals, aakhri activity
export function sellerSummary(db, s) {
    const products = db.products.filter(p => p.sellerId === s.id);
    const orders = db.orders.filter(o => o.items.some(it => it.sellerId === s.id));
    const wds = (db.withdrawals || []).filter(w => w.sellerId === s.id);
    const delivered = orders.filter(o => o.status === "delivered").length;
    const cancelled = orders.filter(o => o.status === "cancelled").length;
    const stale = orders.filter(o => o.status === "processing" && Date.now() - new Date(o.createdAt).getTime() > DAY).length;
    const times = [...products.map(p => p.createdAt), ...orders.map(o => o.createdAt), ...wds.map(w => w.requestedAt)]
        .filter(Boolean).map(d => new Date(d).getTime()).filter(n => !isNaN(n));
    return {
        products: products.length,
        approvedProducts: products.filter(p => p.approved).length,
        pendingProducts: products.filter(p => !p.approved).length,
        orders: orders.length, delivered, cancelled, inProgress: orders.length - delivered - cancelled, stale,
        withdrawals: wds.length, pendingWithdrawals: wds.filter(w => w.status === "pending").length,
        last: times.length ? Math.max(...times) : null,
    };
}

export function SellerActivityModal({ sellerId, onClose }) {
    const { t: tt, db, update, notify, logAudit } = useApp();
    const s = db.sellers.find(x => x.id === sellerId);
    if (!s)
        return null;
    const sum = sellerSummary(db, s);
    const blocked = s.disabledFeatures || {};
    const toggle = (key, off) => {
        update(d => {
            const x = d.sellers.find(v => v.id === s.id);
            x.disabledFeatures = x.disabledFeatures || {};
            if (off)
                x.disabledFeatures[key] = true;
            else
                delete x.disabledFeatures[key];
        });
        logAudit && logAudit("seller-function", `${s.id}:${key}:${off ? "off" : "on"}`);
        notify(tt("m_pages_update_ho_gayi"), "success");
    };
    const stateOf = (key) => (csOn(db, key) || csOn(db, "seller")) ? "global" : blocked[key] ? "blocked" : "active";
    const stLabel = { active: tt("sa_st_active"), global: tt("sa_st_global"), blocked: tt("sa_st_blocked") };
    const stColor = { active: "#1b7a3a", global: "#9a6a00", blocked: "#b3261e" };
    // "Kya nahi kar raha / dhyan dein" ki list
    const alerts = [];
    if (s.status !== "approved")
        alerts.push(fill(tt("sa_a_status"), s.status));
    if (!(s.kyc && s.kyc.verified))
        alerts.push(tt("sa_a_kyc"));
    if (!(s.bank && s.bank.verified))
        alerts.push(tt("sa_a_bank"));
    if (!(s.upi && s.upi.verified))
        alerts.push(tt("sa_a_upi"));
    if (sum.products === 0)
        alerts.push(tt("sa_a_noprod"));
    if (sum.pendingProducts > 0)
        alerts.push(fill(tt("sa_a_pendprod"), sum.pendingProducts));
    if (sum.products > 0 && sum.orders === 0)
        alerts.push(tt("sa_a_noorders"));
    if (sum.stale > 0)
        alerts.push(fill(tt("sa_a_stale"), sum.stale));
    if (sum.last && Date.now() - sum.last > 14 * DAY)
        alerts.push(fill(tt("sa_a_inactive"), Math.floor((Date.now() - sum.last) / DAY)));
    const row = { fontSize: 13, marginBottom: 6 };
    return (<Modal onClose={onClose} width={420}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{s.shopName}</div>
        <div style={{ fontSize: 12, color: "#8a7360", marginBottom: 12 }}>{s.ownerName}{" ("}{s.mobile}{")"}</div>

        <div style={{ fontWeight: 700, marginBottom: 6 }}>{tt("sa_functions")}</div>
        {SELLER_FUNCTION_KEYS.map(key => {
            const st = stateOf(key);
            return (<div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #eee" }}>
                <div style={{ fontSize: 13, flex: 1 }}>{tt("cs_" + key)}<div style={{ fontSize: 11, color: stColor[st], fontWeight: 600 }}>{stLabel[st]}</div></div>
                <label style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                    <input type="checkbox" checked={!!blocked[key]} onChange={e => toggle(key, e.target.checked)} />{tt("sa_block_label")}
                </label>
            </div>);
        })}

        <div style={{ fontWeight: 700, margin: "14px 0 6px" }}>{tt("sa_activity")}</div>
        <div style={row}>{fill(tt("sa_products"), sum.products, sum.approvedProducts, sum.pendingProducts)}</div>
        <div style={row}>{fill(tt("sa_orders"), sum.orders, sum.delivered, sum.cancelled, sum.inProgress)}</div>
        <div style={row}>{fill(tt("sa_wallet"), s.walletBalance || 0, sum.withdrawals, sum.pendingWithdrawals)}</div>
        <div style={row}>{fill(tt("sa_last"), sum.last ? new Date(sum.last).toLocaleDateString() : tt("sa_never"))}</div>

        <div style={{ fontWeight: 700, margin: "14px 0 6px" }}>{tt("sa_notdoing")}</div>
        {alerts.length === 0
            ? <div style={{ fontSize: 13, color: "#1b7a3a" }}>{tt("sa_all_good")}</div>
            : alerts.map((a, i) => (<div key={i} style={{ fontSize: 13, marginBottom: 4, color: "#b3261e" }}>{"⚠️ "}{a}</div>))}

        <button className="jb-btn jb-btn-ghost" style={{ marginTop: 14 }} onClick={onClose}>{tt("ui_cancel")}</button>
    </Modal>);
}
