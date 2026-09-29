import React, { useState, useEffect } from "react";
import { T } from "./theme.js";
import { useApp } from "./AppContext.jsx";
import { effectivePrice } from "./helpers.js";

/* ---------------------------- SHARED UI ---------------------------- */
export function Field({ label, ...props }) {
    return (<div style={{ marginBottom: 12 }}>{label && <span className="jb-label">{label}</span>}<input className="jb-input" {...props} /></div>);
}

export function PasswordField({ label, ...props }) {
    const [show, setShow] = useState(false);
    return (<div style={{ marginBottom: 12 }}>{label && <span className="jb-label">{label}</span>}<div style={{ position: "relative" }}><input className="jb-input" style={{ paddingRight: 38 }} type={show ? "text" : "password"} {...props} /><span onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: 15, userSelect: "none", color: "#8a7360" }}>{show ? "🙈" : "👁️"}</span></div></div>);
}

export function Modal({ children, onClose, width = 420 }) {
    return (<div className="jb-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget)
            onClose && onClose(); }}><div className="jb-card" style={{ width: "100%", maxWidth: width, padding: 20, maxHeight: "90vh", overflowY: "auto" }}>{children}</div></div>);
}

export function StatusBadge({ status }) {
    const map = {
        pending: { bg: "#FFF3CD", c: "#8A6D1D" },
        approved: { bg: "#DDF3E1", c: T.success },
        rejected: { bg: "#FBE1DC", c: T.danger },
        blocked: { bg: "#FBE1DC", c: T.danger },
        delivered: { bg: "#DDF3E1", c: T.success },
        shipped: { bg: "#E2EEFB", c: "#1D5B8A" },
        processing: { bg: "#FFF3CD", c: "#8A6D1D" },
        cancelled: { bg: "#FBE1DC", c: T.danger },
        "return-requested": { bg: "#FFE9D6", c: "#A15A1F" },
        refunded: { bg: "#E2EEFB", c: "#1D5B8A" },
    };
    const s = map[status] || { bg: "#EEE", c: "#555" };
    return <span className="jb-badge" style={{ background: s.bg, color: s.c }}>{status}</span>;
}

export function StarRating({ value }) {
    const full = Math.round(value || 0);
    return <span style={{ color: T.gold, fontSize: 13 }}>{"★".repeat(full)}{"☆".repeat(5 - full)}</span>;
}

export function Countdown({ endsAt }) {
    const { t: tt } = useApp();
    const [remaining, setRemaining] = useState(new Date(endsAt) - new Date());
    useEffect(() => {
        const t = setInterval(() => setRemaining(new Date(endsAt) - new Date()), 1000);
        return () => clearInterval(t);
    }, [endsAt]);
    if (remaining <= 0)
        return <div style={{ fontSize: 10, color: T.danger }}>{tt("ui_sale_khatam")}</div>;
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    return <div style={{ fontSize: 10, color: T.danger, fontWeight: 700 }}>{"⏱ "}{String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</div>;
}

export function EmptyState({ text, icon = "📭", subtitle, actionLabel, onAction }) {
    return (<div style={{ textAlign: "center", padding: "48px 20px" }}><div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div><div style={{ color: T.maroonDark, fontSize: 15, fontWeight: 600 }}>{text}</div>{subtitle && <div style={{ color: "#8a7360", fontSize: 13, marginTop: 6, maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>{subtitle}</div>}{actionLabel && onAction && (<button className="jb-btn jb-btn-primary" style={{ marginTop: 16 }} onClick={onAction}>{actionLabel}</button>)}</div>);
}

export function ProductCard({ p, onOpen, onAdd, onWishlist, wished }) {
    var _a, _b;
    const { db, t } = useApp();
    const seller = db.sellers.find(s => s.id === p.sellerId);
    const effPrice = effectivePrice(p);
    const discount = p.mrp > effPrice ? Math.round(100 - (effPrice / p.mrp) * 100) : 0;
    const onFlashSale = effPrice !== p.price;
    const isSponsored = p.sponsoredUntil && new Date(p.sponsoredUntil) > new Date();
    return (<div className="jb-card jb-card-hover" style={{ padding: 10, position: "relative" }}>{isSponsored && !p.comingSoon && <span className="jb-badge" style={{ position: "absolute", top: 8, left: 8, background: "#FFE9D6", color: "#A15A1F", zIndex: 1 }}>{t("sponsored")}</span>}{p.comingSoon && <span className="jb-badge" style={{ position: "absolute", top: 8, left: 8, background: T.maroon, color: "#fff", zIndex: 1 }}>{"🚧 "}{t("coming_soon")}</span>}<div onClick={onWishlist} style={{ position: "absolute", top: 14, right: 14, cursor: "pointer", fontSize: 16, color: wished ? T.maroon : "#bbb" }}>{wished ? "♥" : "♡"}</div><div onClick={onOpen} style={{ cursor: "pointer" }}><div style={{ height: 110, borderRadius: 8, background: T.cream, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 8, overflow: "hidden" }}>{((_a = p.images) === null || _a === void 0 ? void 0 : _a[0]) ? <img src={p.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} /> : "🧺"}</div>{seller && <div style={{ fontSize: 10, color: "#8a7360", marginBottom: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{"🏪 "}{seller.shopName}{seller.area ? ` · ${seller.area}` : ""}</div>}{seller && <div style={{ fontSize: 10, color: T.success, fontWeight: 600, marginBottom: 4 }}>{"📍 "}{t("available_nearby")}</div>}<div style={{ fontSize: 13, fontWeight: 600, height: 34, overflow: "hidden" }}>{p.name}</div><div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}><StarRating value={p.rating} /><span style={{ fontSize: 11, color: "#8a7360" }}>({((_b = p.reviews) === null || _b === void 0 ? void 0 : _b.length) || 0})</span></div><div style={{ marginTop: 4 }}><span style={{ fontWeight: 700, color: onFlashSale ? T.danger : T.ink }}>₹{effPrice}</span>{" "}{(discount > 0 || onFlashSale) && <><span style={{ textDecoration: "line-through", fontSize: 11, color: "#999" }}>₹{onFlashSale ? p.price : p.mrp}</span>{" "}<span style={{ fontSize: 11, color: T.success }}>{discount}{"% "}{t("discount")}</span></>}</div><div style={{ fontSize: 11, color: p.stock > 0 ? T.success : T.danger, marginTop: 2 }}>{p.stock > 0 ? `${p.stock} ${t("in_stock")}` : t("out_of_stock")}</div>{p.stock > 0 && <div style={{ fontSize: 10, color: "#8a7360", marginTop: 2 }}>{"🚚 "}{t("delivery_2_3_days")}</div>}</div><button className="jb-btn jb-btn-gold" disabled={p.stock <= 0 || !!p.comingSoon} style={{ width: "100%", justifyContent: "center", marginTop: 8, fontSize: 12, padding: 8 }} onClick={onAdd}>{p.comingSoon ? t("coming_soon") : t("add_to_cart")}</button></div>);
}

/* ---------------------------- INVOICE ---------------------------- */
export function OrderDetailModal({ order, onClose }) {
    const { t: tt } = useApp();
    var _a, _b, _c, _d, _e;
    const { db } = useApp();
    if (!order)
        return null;
    return (<Modal onClose={onClose} width={480}><div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: T.maroonDark }}>Order #{order.id.slice(-6)}{" — Poora Detail"}</div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><span style={{ fontSize: 12, color: "#8a7360" }}>{new Date(order.createdAt).toLocaleString()}</span><StatusBadge status={order.status} /></div><div className="jb-card" style={{ padding: 12, marginBottom: 10, background: T.cream, border: "none" }}><div style={{ fontSize: 12 }}><b>{tt("ui_customer")}</b>{" "}{order.customerName}</div><div style={{ fontSize: 12 }}><b>{tt("ui_address")}</b>{" "}{(_a = order.address) === null || _a === void 0 ? void 0 :
                _a.line1}{", "}{(_b = order.address) === null || _b === void 0 ? void 0 :
                _b.city}{" - "}{(_c = order.address) === null || _c === void 0 ? void 0 :
                _c.pincode}</div><div style={{ fontSize: 12 }}><b>{tt("ui_phone")}</b>{" "}{(_d = order.address) === null || _d === void 0 ? void 0 :
                _d.phone}</div><div style={{ fontSize: 12 }}><b>{tt("ui_payment")}</b>{" "}{(_e = order.payMode) === null || _e === void 0 ? void 0 :
                _e.toUpperCase()}</div>{order.deliveryPartner && <div style={{ fontSize: 12 }}><b>{tt("ui_delivery_partner")}</b>{" "}{order.deliveryPartner}</div>}<div style={{ fontSize: 12 }}><b>{tt("ui_delivery_otp")}</b>{" "}{order.deliveryOtp}</div></div><div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{tt("ui_items")}</div>{order.items.map(it => {
            const seller = db.sellers.find(s => s.id === it.sellerId);
            return (<div key={it.productId} style={{ fontSize: 12, marginBottom: 4 }}>{"• "}{it.name}{" x"}{it.qty}{" — ₹"}{it.price}{" "}{seller && <span style={{ color: "#8a7360" }}>{"(Seller: "}{seller.shopName})</span>}{it.resellerId && <span style={{ color: "#1D5B8A" }}>{" · Reseller sale (margin ₹"}{it.resellerMargin})</span>}</div>);
        })}<div style={{ fontWeight: 600, fontSize: 13, margin: "12px 0 6px" }}>{tt("ui_timeline")}</div>{order.timeline.map((t, i) => (<div key={i} style={{ fontSize: 12, marginBottom: 3 }}>{"• "}{t.status}{" — "}{new Date(t.at).toLocaleString()}</div>))}{order.cancelReason && (<div className="jb-card" style={{ padding: 10, marginTop: 10, background: "#FBE1DC", border: "none" }}><div style={{ fontSize: 12 }}><b>{tt("ui_cancel_reason")}</b>{" "}{order.cancelReason}</div></div>)}{order.returnRequest && (<div className="jb-card" style={{ padding: 10, marginTop: 10, background: "#FFE9D6", border: "none" }}><div style={{ fontSize: 12 }}><b>{tt("ui_return_reason")}</b>{" "}{order.returnRequest.reason}</div><div style={{ fontSize: 12 }}>{"Status: "}<StatusBadge status={order.returnRequest.status} /></div>{order.refund && <div style={{ fontSize: 12, marginTop: 4 }}>Refund ₹{order.refund.amount}{": "}<StatusBadge status={order.refund.status} /></div>}</div>)}</Modal>);
}

export function InvoiceModal({ order, onClose, sellerView }) {
    const { t: tt } = useApp();
    var _a, _b, _c, _d;
    const { db, t } = useApp();
    const items = sellerView ? order.items.filter(it => it.sellerId === sellerView.id) : order.items;
    const itemsTotal = items.reduce((a, it) => a + it.price * it.qty, 0);
    const sellerIds = [...new Set(items.map(it => it.sellerId))];
    const sellers = sellerView ? [sellerView] : sellerIds.map(id => db.sellers.find(s => s.id === id)).filter(Boolean);
    const isFullOrder = !sellerView; // customer-side invoice shows full order totals; seller-side shows only their items
    const paymentStatusLabel = order.payMode === "cod"
        ? (order.status === "delivered" ? "Paid (Cash on Delivery)" : "Pending (Cash on Delivery)")
        : "Paid Online";
    return (<Modal onClose={onClose} width={480}><div id="invoice-print"><div style={{ textAlign: "center", marginBottom: 12 }}><div className="jb-display" style={{ fontSize: 20, color: T.maroon }}>{t("brand_name")}</div><div style={{ fontSize: 11, color: "#8a7360" }}>{tt("ui_tax_invoice")}</div></div><div style={{ fontSize: 12, marginBottom: 8 }}><div><b>{tt("ui_invoice")}</b>: INV-{order.id.slice(-6)}</div><div><b>{tt("ui_order")}</b>{": "}{order.id.slice(-6)}</div><div><b>{tt("ui_date")}</b>{": "}{new Date(order.createdAt).toLocaleDateString()}</div><div><b>{tt("ui_sold_by")}</b>{": "}{sellers.map(s => s.shopName).join(", ") || "—"}</div><div><b>{tt("ui_bill_to")}</b>{": "}{order.customerName}{", "}{(_a = order.address) === null || _a === void 0 ? void 0 :
                    _a.line1}{", "}{(_b = order.address) === null || _b === void 0 ? void 0 :
                    _b.city}{" - "}{(_c = order.address) === null || _c === void 0 ? void 0 :
                    _c.pincode}</div><div><b>{tt("ui_payment_status")}</b>{": "}{paymentStatusLabel}</div></div><div style={{ overflowX: "auto" }} className="jb-scroll"><table className="jb-table" style={{ marginBottom: 10 }}><thead><tr><th>{tt("ui_item")}</th><th>{tt("ui_qty")}</th><th>{tt("ui_price")}</th><th>{tt("ui_total")}</th></tr></thead><tbody>{items.map(it => <tr key={it.productId}><td>{it.name}</td><td>{it.qty}</td><td>₹{it.price}</td><td>₹{it.price * it.qty}</td></tr>)}</tbody></table></div><div style={{ fontSize: 12 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>{tt("ui_items_total")}</span><span>₹{itemsTotal}</span></div>{isFullOrder && order.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: T.success }}><span>{tt("ui_coupon_discount")}</span><span>-₹{order.discount}</span></div>}{isFullOrder && <div style={{ display: "flex", justifyContent: "space-between" }}><span>{tt("ui_delivery_charge")}</span><span>{order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}</span></div>}<div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14, borderTop: `1px solid ${T.border}`, marginTop: 4, paddingTop: 4 }}><span>{tt("ui_grand_total")}</span><span>₹{isFullOrder ? order.total : itemsTotal}</span></div></div><div style={{ fontSize: 10, color: "#aaa", marginTop: 10, textAlign: "center" }}>{"Payment mode: "}{(_d = order.payMode) === null || _d === void 0 ? void 0 :
                _d.toUpperCase()}</div></div><div style={{ display: "flex", gap: 8, marginTop: 14 }}><button className="jb-btn jb-btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => window.print()}>{tt("ui_print_save_as_pdf")}</button><button className="jb-btn jb-btn-outline" onClick={onClose}>{tt("ui_close")}</button></div></Modal>);
}

export function PlatformBankCard() {
    const { t: tt } = useApp();
    var _a;
    const { db, update, notify } = useApp();
    const [form, setForm] = useState(db.platformBankAccount || { holder: "", accountNo: "", ifsc: "", upi: "" });
    const [editing, setEditing] = useState(!((_a = db.platformBankAccount) === null || _a === void 0 ? void 0 : _a.accountNo));
    const save = () => {
        if (!form.holder || !form.accountNo || !form.ifsc)
            return notify(tt("m_holder_name_account_number_a"), "error");
        update(d => { d.platformBankAccount = form; });
        setEditing(false);
        notify(tt("m_platform_bank_account_save_h"), "success");
    };
    return (<div className="jb-card" style={{ padding: 14, marginBottom: 16, background: T.cream, border: "none" }}><div style={{ fontWeight: 700, marginBottom: 8 }}>{tt("x_platform_bank_account_ad_88ef")}</div><div style={{ fontSize: 11, color: "#8a7360", marginBottom: 10 }}>{tt("ui_ye_account_seller_payouts_wi")}</div>{editing ? (<><Field label={tt("x_account_holder_name_4628")} value={form.holder} onChange={e => setForm(f => ({ ...f, holder: e.target.value }))} /><Field label={tt("x_account_number_2fce")} value={form.accountNo} onChange={e => setForm(f => ({ ...f, accountNo: e.target.value }))} /><Field label={tt("x_ifsc_code_7ebe")} value={form.ifsc} onChange={e => setForm(f => ({ ...f, ifsc: e.target.value }))} /><Field label={tt("x_upi_id_optional_a698")} value={form.upi} onChange={e => setForm(f => ({ ...f, upi: e.target.value }))} /><button className="jb-btn jb-btn-primary" onClick={save}>{tt("ui_save_bank_account")}</button></>) : (<><div style={{ fontSize: 13 }}>{form.holder}{" — "}{form.accountNo}{" ("}{form.ifsc}){form.upi ? ` • UPI: ${form.upi}` : ""}</div><button className="jb-btn jb-btn-ghost" style={{ marginTop: 6 }} onClick={() => setEditing(true)}>{tt("ui_edit")}</button></>)}</div>);
}
