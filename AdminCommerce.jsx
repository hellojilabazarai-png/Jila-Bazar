import React, { useState } from "react";
import { useApp } from "./AppContext.jsx";
import { nowISO, uid } from "./database.js";
import { EmptyState, Field, Modal, OrderDetailModal, PlatformBankCard, StarRating, StatusBadge } from "./CommonUI.jsx";
import { T } from "./theme.js";
import { isValidIndianMobile } from "./security.js";
import { downloadCSV } from "./helpers.js";

export function AdminProducts() {
    const { t: tt } = useApp();
    const { db, update, notify, logAudit } = useApp();
    const [editing, setEditing] = useState(null);
    const setApproval = (id, approved) => {
        update(d => {
            const p = d.products.find(p => p.id === id);
            p.approved = approved;
            d.notifications.unshift({ id: uid("n"), userId: p.sellerId, text: `Product "${p.name}" ${approved ? "approve ho gaya hai aur ab live hai." : "reject kar diya gaya hai. Details check karke dobara submit karein."}`, at: nowISO(), read: false });
        });
        notify(approved ? "Product approved" : "Product rejected", "success");
    };
    const toggleFeatured = (id) => update(d => { const p = d.products.find(p => p.id === id); p.featured = !p.featured; });
    const del = (id) => { if (confirm(tt("m_delete_product")))
        update(d => d.products = d.products.filter(p => p.id !== id)); };
    const openEdit = (p) => setEditing({ id: p.id, name: p.name || "", desc: p.desc || "", price: p.price, mrp: p.mrp || p.price, stock: p.stock || 0, category: p.category || "", images: (p.images || []).join("\n"), comingSoon: !!p.comingSoon });
    const saveEdit = () => {
        const price = Number(editing.price), mrp = Number(editing.mrp), stock = Number(editing.stock);
        if (!editing.name.trim())
            return notify(tt("m_product_ka_naam_bharein"), "error");
        if (!(price > 0))
            return notify(tt("m_sahi_price_daalein"), "error");
        if (!(mrp >= price))
            return notify(tt("m_mrp_price_se_kam_nahi_ho_sak"), "error");
        if (!(stock >= 0))
            return notify(tt("m_sahi_stock_daalein"), "error");
        update(d => {
            const p = d.products.find(x => x.id === editing.id);
            p.name = editing.name.trim();
            p.desc = editing.desc;
            p.price = price;
            p.mrp = mrp;
            p.stock = Math.floor(stock);
            p.category = editing.category;
            p.images = editing.images.split("\n").map(x => x.trim()).filter(Boolean);
            p.comingSoon = !!editing.comingSoon;
        });
        logAudit && logAudit("product-edit", editing.id);
        notify(tt("m_product_update_ho_gaya"), "success");
        setEditing(null);
    };
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_product_approval_management")}</div><div style={{ overflowX: "auto" }} className="jb-scroll"><table className="jb-table"><thead><tr><th>{tt("ui_name")}</th><th>{tt("ui_seller")}</th><th>{tt("ui_price")}</th><th>{tt("ui_status")}</th><th>{tt("ui_featured")}</th><th>{tt("ui_actions")}</th></tr></thead><tbody>{db.products.map(p => {
                const seller = db.sellers.find(s => s.id === p.sellerId);
                return (<tr key={p.id}><td>{p.name}</td><td>{seller === null || seller === void 0 ? void 0 : seller.shopName}</td><td>₹{p.price}</td><td><StatusBadge status={p.approved ? "approved" : "pending"} />{p.comingSoon && <div style={{ fontSize: 11, color: T.maroon }}>{tt("x_coming_soon_fb61")}</div>}</td><td><input type="checkbox" checked={!!p.featured} onChange={() => toggleFeatured(p.id)} /></td><td style={{ display: "flex", gap: 6 }}><button className="jb-btn jb-btn-ghost" onClick={() => openEdit(p)}>{tt("ui_edit")}</button>{!p.approved && <button className="jb-btn jb-btn-ghost" style={{ color: T.success }} onClick={() => setApproval(p.id, true)}>{tt("ui_approve")}</button>}{p.approved && <button className="jb-btn jb-btn-ghost" style={{ color: T.danger }} onClick={() => setApproval(p.id, false)}>{tt("ui_reject")}</button>}<button className="jb-btn jb-btn-ghost" style={{ color: T.danger }} onClick={() => del(p.id)}>{tt("ui_delete")}</button></td></tr>);
            })}</tbody></table></div>{editing && (<Modal onClose={() => setEditing(null)} width={460}><div style={{ fontWeight: 700, marginBottom: 10 }}>{tt("ui_edit_product")}</div><Field label={tt("x_name_49ee")} value={editing.name} onChange={e => setEditing(x => ({ ...x, name: e.target.value }))} /><span className="jb-label">{tt("ui_description")}</span><textarea className="jb-input" rows={3} style={{ marginBottom: 12 }} value={editing.desc} onChange={e => setEditing(x => ({ ...x, desc: e.target.value }))} /><div style={{ display: "flex", gap: 8 }}><div style={{ flex: 1 }}><Field label={tt("x_price_6e2a")} type="number" value={editing.price} onChange={e => setEditing(x => ({ ...x, price: e.target.value }))} /></div><div style={{ flex: 1 }}><Field label="MRP (₹)" type="number" value={editing.mrp} onChange={e => setEditing(x => ({ ...x, mrp: e.target.value }))} /></div><div style={{ flex: 1 }}><Field label={tt("x_stock_27ce")} type="number" value={editing.stock} onChange={e => setEditing(x => ({ ...x, stock: e.target.value }))} /></div></div><span className="jb-label">{tt("ui_category")}</span><select className="jb-input" style={{ marginBottom: 12 }} value={editing.category} onChange={e => setEditing(x => ({ ...x, category: e.target.value }))}><option value="">—</option>{db.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}{editing.category && !db.categories.some(c => c.name === editing.category) && <option value={editing.category}>{editing.category}</option>}</select><label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 12 }}><input type="checkbox" checked={!!editing.comingSoon} onChange={e => setEditing(x => ({ ...x, comingSoon: e.target.checked }))} />🚧 Coming Soon (customers dekh sakte hain, kharid nahi sakte)</label><span className="jb-label">{tt("ui_image_urls_ek_line_mein_ek")}</span><textarea className="jb-input" rows={3} style={{ marginBottom: 12 }} value={editing.images} onChange={e => setEditing(x => ({ ...x, images: e.target.value }))} /><div style={{ display: "flex", gap: 8 }}><button className="jb-btn jb-btn-primary" onClick={saveEdit}>{tt("ui_save")}</button><button className="jb-btn jb-btn-ghost" onClick={() => setEditing(null)}>{tt("ui_cancel")}</button></div></Modal>)}</div>);
}

export function AdminOrders() {
    const { t: tt } = useApp();
    const { db, update, notify } = useApp();
    const [otpInput, setOtpInput] = useState({});
    const [detailOrder, setDetailOrder] = useState(null);
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState(null);
    const openEdit = (o) => { const a = o.address || {}; setEditing({ id: o.id, customerName: o.customerName || "", label: a.label || "", line1: a.line1 || "", city: a.city || "", pincode: a.pincode || "", phone: a.phone || "", deliveryPartner: o.deliveryPartner || "" }); };
    const saveEdit = () => {
        if (!editing.customerName.trim())
            return notify(tt("m_customer_ka_naam_bharein"), "error");
        if (!editing.line1.trim() || !editing.pincode.trim())
            return notify(tt("m_address_aur_pincode_bharein"), "error");
        update(d => {
            const o = d.orders.find(x => x.id === editing.id);
            o.customerName = editing.customerName.trim();
            o.address = { ...(o.address || {}), label: editing.label, line1: editing.line1.trim(), city: editing.city.trim(), pincode: editing.pincode.trim(), phone: editing.phone.trim() };
            o.deliveryPartner = editing.deliveryPartner || o.deliveryPartner;
            o.timeline.push({ status: "details edited (by admin)", at: nowISO() });
        });
        notify(tt("m_order_details_update_ho_gayi"), "success");
        setEditing(null);
    };
    const verifyAndDeliver = (o) => {
        const entered = otpInput[o.id];
        if (entered !== o.deliveryOtp)
            return notify(tt("m_otp_match_nahi_kar_raha"), "error");
        update(d => {
            const ord = d.orders.find(x => x.id === o.id);
            ord.status = "delivered";
            ord.timeline.push({ status: "delivered", at: nowISO() });
            ord.items.forEach(it => {
                var _a;
                const seller = d.sellers.find(s => s.id === it.sellerId);
                const sellerDue = ((_a = it.basePrice) !== null && _a !== void 0 ? _a : it.price) * it.qty;
                if (seller)
                    seller.walletBalance += sellerDue * (1 - (seller.commissionPct || 0) / 100);
                if (it.resellerId && it.resellerMargin > 0) {
                    const reseller = d.users.find(u => u.id === it.resellerId);
                    if (reseller) {
                        reseller.resellerWalletBalance = (reseller.resellerWalletBalance || 0) + it.resellerMargin * it.qty;
                        d.notifications.unshift({ id: uid("n"), userId: reseller.id, text: `Aapko ₹${it.resellerMargin * it.qty} margin mila "${it.name}" ki sale se!`, at: nowISO(), read: false });
                    }
                }
            });
        });
        notify(tt("m_delivery_otp_verified_order_"), "success");
    };
    const verifyPayment = (o) => update(d => {
        const ord = d.orders.find(x => x.id === o.id);
        ord.paymentVerified = true;
        ord.timeline.push({ status: "payment-verified (by admin)", at: nowISO() });
    });
    const filteredOrders = db.orders.filter(o => { var _a; return !search || o.id.slice(-6).includes(search.toLowerCase()) || ((_a = o.customerName) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(search.toLowerCase())); });
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_order_monitoring")}</div><input className="jb-input" style={{ marginBottom: 12, maxWidth: 300 }} placeholder={tt("m_order_id_ya_customer_naam_se")} value={search} onChange={e => setSearch(e.target.value)} /><div style={{ overflowX: "auto" }} className="jb-scroll"><table className="jb-table"><thead><tr><th>{tt("ui_order_2")}</th><th>{tt("ui_customer_2")}</th><th>{tt("ui_items")}</th><th>{tt("ui_total")}</th><th>{tt("ui_status")}</th><th>{tt("ui_payment_2")}</th><th>{tt("ui_delivery_otp_verification")}</th><th>{tt("ui_detail")}</th></tr></thead><tbody>{filteredOrders.map(o => {
                    var _a;
                    return (<tr key={o.id}><td>#{o.id.slice(-6)}</td><td>{o.customerName}</td><td>{o.items.length}</td><td>₹{o.total}</td><td><StatusBadge status={o.status} /></td><td>{o.payMode === "cod" ? "COD" : (<div><div style={{ fontSize: 11 }}>{(_a = o.payMode) === null || _a === void 0 ? void 0 :
                                _a.toUpperCase()}{" "}{o.paymentRef && `(${o.paymentRef})`}</div>{o.paymentVerified
                                ? <span style={{ fontSize: 11, color: T.success }}>{tt("x_verified_bb31")}</span>
                                : <button className="jb-btn jb-btn-primary" style={{ fontSize: 11, padding: "4px 8px", background: T.success }} onClick={() => verifyPayment(o)}>{tt("ui_mark_verified")}</button>}</div>)}</td><td>{o.status === "shipped" ? (<div style={{ display: "flex", gap: 6 }}><input className="jb-input" style={{ width: 80 }} placeholder="OTP" value={otpInput[o.id] || ""} onChange={e => setOtpInput(s => ({ ...s, [o.id]: e.target.value }))} /><button className="jb-btn jb-btn-primary" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => verifyAndDeliver(o)}>{tt("ui_verify_deliver")}</button></div>) : o.status === "delivered" ? "✓ Delivered" : "—"}</td><td><div style={{ display: "flex", gap: 6 }}><button className="jb-btn jb-btn-outline" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setDetailOrder(o)}>{tt("ui_view")}</button><button className="jb-btn jb-btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => openEdit(o)}>{tt("ui_edit")}</button></div></td></tr>);
                })}</tbody></table></div><OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />{editing && (<Modal onClose={() => setEditing(null)} width={420}><div style={{ fontWeight: 700, marginBottom: 4 }}>{tt("ui_edit_order") + editing.id.slice(-6)}</div><div style={{ fontSize: 11, color: "#8a7360", marginBottom: 10 }}>{tt("ui_sirf_customer_delivery_detai")}</div><Field label={tt("x_customer_name_2ea9")} value={editing.customerName} onChange={e => setEditing(x => ({ ...x, customerName: e.target.value }))} /><Field label={tt("x_address_label_df21")} value={editing.label} onChange={e => setEditing(x => ({ ...x, label: e.target.value }))} /><Field label={tt("x_address_dd7b")} value={editing.line1} onChange={e => setEditing(x => ({ ...x, line1: e.target.value }))} /><div style={{ display: "flex", gap: 8 }}><div style={{ flex: 1 }}><Field label={tt("x_city_57d0")} value={editing.city} onChange={e => setEditing(x => ({ ...x, city: e.target.value }))} /></div><div style={{ flex: 1 }}><Field label={tt("x_pincode_b24b")} value={editing.pincode} onChange={e => setEditing(x => ({ ...x, pincode: e.target.value }))} /></div></div><Field label={tt("x_phone_bcc2")} value={editing.phone} onChange={e => setEditing(x => ({ ...x, phone: e.target.value }))} /><span className="jb-label">{tt("ui_delivery_partner_2")}</span><select className="jb-input" style={{ marginBottom: 12 }} value={editing.deliveryPartner} onChange={e => setEditing(x => ({ ...x, deliveryPartner: e.target.value }))}><option value="">—</option>{db.deliveryPartners.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}{editing.deliveryPartner && !db.deliveryPartners.some(p => p.name === editing.deliveryPartner) && <option value={editing.deliveryPartner}>{editing.deliveryPartner}</option>}</select><div style={{ display: "flex", gap: 8 }}><button className="jb-btn jb-btn-primary" onClick={saveEdit}>{tt("ui_save")}</button><button className="jb-btn jb-btn-ghost" onClick={() => setEditing(null)}>{tt("ui_cancel")}</button></div></Modal>)}</div>);
}

export function AdminRevenue() {
    const { t: tt } = useApp();
    const { db } = useApp();
    const valid = db.orders.filter(o => o.status !== "cancelled");
    const totalRevenue = valid.reduce((a, o) => a + o.total, 0);
    const totalCommission = valid.reduce((a, o) => a + o.items.reduce((b, it) => {
        var _a;
        const s = db.sellers.find(s => s.id === it.sellerId);
        return b + ((_a = it.basePrice) !== null && _a !== void 0 ? _a : it.price) * it.qty * (((s === null || s === void 0 ? void 0 : s.commissionPct) || 0) / 100);
    }, 0), 0);
    const adRevenue = db.adRequests.filter(a => a.status === "approved").reduce((a, r) => a + r.amount, 0);
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_revenue_monitoring")}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}><div className="jb-card" style={{ padding: 16 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_total_gmv")}</div><div style={{ fontSize: 22, fontWeight: 700 }}>₹{totalRevenue.toFixed(0)}</div></div><div className="jb-card" style={{ padding: 16 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_platform_commission_earned")}</div><div style={{ fontSize: 22, fontWeight: 700, color: T.success }}>₹{totalCommission.toFixed(0)}</div></div><div className="jb-card" style={{ padding: 16 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_ad_promotion_revenue")}</div><div style={{ fontSize: 22, fontWeight: 700, color: T.success }}>₹{adRevenue.toFixed(0)}</div></div><div className="jb-card" style={{ padding: 16 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_total_orders")}</div><div style={{ fontSize: 22, fontWeight: 700 }}>{valid.length}</div></div></div></div>);
}

export function AdminWithdrawals() {
    const { t: tt } = useApp();
    const { db, update, notify } = useApp();
    const setStatus = (id, status) => update(d => {
        const w = d.withdrawals.find(w => w.id === id);
        w.status = status;
        if (status === "rejected") {
            if (w.type === "reseller") {
                const u = d.users.find(u => u.id === w.resellerId);
                if (u)
                    u.resellerWalletBalance = (u.resellerWalletBalance || 0) + w.amount;
            }
            else {
                const s = d.sellers.find(s => s.id === w.sellerId);
                if (s)
                    s.walletBalance += w.amount;
            }
        }
        d.notifications.unshift({ id: uid("n"), userId: w.sellerId || w.resellerId, text: `Aapki withdrawal request ₹${w.amount} ${status} ho gayi hai.`, at: nowISO(), read: false });
    });
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_withdrawal_approval")}</div><PlatformBankCard />{db.withdrawals.length === 0 ? <EmptyState text={tt("x_koi_withdrawal_request_n_70cc")} /> : db.withdrawals.map(w => (<div key={w.id} className="jb-card" style={{ padding: 14, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><b>{w.shopName}</b>{" "}{w.type === "reseller" && <span className="jb-badge" style={{ background: "#E2EEFB", color: "#1D5B8A" }}>{tt("ui_reseller")}</span>}{" — ₹"}{w.amount}{" "}<div style={{ fontSize: 11, color: "#8a7360" }}>{new Date(w.requestedAt).toLocaleString()}</div></div><div style={{ display: "flex", gap: 6, alignItems: "center" }}><StatusBadge status={w.status} />{w.status === "pending" && <><button className="jb-btn jb-btn-primary" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => { setStatus(w.id, "approved"); notify(tt("m_withdrawal_approved"), "success"); }}>{tt("ui_approve")}</button><button className="jb-btn jb-btn-danger" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => { setStatus(w.id, "rejected"); notify(tt("m_withdrawal_rejected"), "success"); }}>{tt("ui_reject")}</button></>}</div></div>))}</div>);
}

export function AdminBanners() {
    const { t: tt } = useApp();
    const { db, update, notify } = useApp();
    const [form, setForm] = useState({ title: "", subtitle: "" });
    const [editing, setEditing] = useState(null);
    const saveEdit = () => {
        if (!editing.title.trim())
            return notify(tt("m_title_bharein"), "error");
        update(d => { const b = d.banners.find(x => x.id === editing.id); b.title = editing.title.trim(); b.subtitle = editing.subtitle; });
        notify(tt("m_banner_update_ho_gaya"), "success");
        setEditing(null);
    };
    const add = () => { if (!form.title)
        return notify(tt("m_title_bharein"), "error"); update(d => d.banners.push({ id: uid("b"), ...form, active: true })); setForm({ title: "", subtitle: "" }); };
    const toggle = (id) => update(d => { const b = d.banners.find(b => b.id === id); b.active = !b.active; });
    const del = (id) => update(d => d.banners = d.banners.filter(b => b.id !== id));
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_banner_management")}</div>{db.banners.map(b => (<div key={b.id} className="jb-card" style={{ padding: 12, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><b>{b.title}</b><div style={{ fontSize: 12, color: "#8a7360" }}>{b.subtitle}</div></div><div style={{ display: "flex", gap: 6 }}><button className="jb-btn jb-btn-ghost" onClick={() => setEditing({ id: b.id, title: b.title || "", subtitle: b.subtitle || "" })}>{tt("ui_edit")}</button><button className="jb-btn jb-btn-outline" style={{ fontSize: 12 }} onClick={() => toggle(b.id)}>{b.active ? "Deactivate" : tt("x_activate_a133")}</button><button className="jb-btn jb-btn-ghost" style={{ color: T.danger }} onClick={() => del(b.id)}>{tt("ui_delete")}</button></div></div>))}<div className="jb-card" style={{ padding: 14, marginTop: 12 }}><Field label={tt("x_title_b78a")} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /><Field label={tt("x_subtitle_035f")} value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} /><button className="jb-btn jb-btn-primary" onClick={add}>{tt("ui_add_banner")}</button></div>{editing && (<Modal onClose={() => setEditing(null)} width={380}><div style={{ fontWeight: 700, marginBottom: 10 }}>{tt("ui_edit_banner")}</div><Field label={tt("x_title_b78a")} value={editing.title} onChange={e => setEditing(x => ({ ...x, title: e.target.value }))} /><Field label={tt("x_subtitle_035f")} value={editing.subtitle} onChange={e => setEditing(x => ({ ...x, subtitle: e.target.value }))} /><div style={{ display: "flex", gap: 8 }}><button className="jb-btn jb-btn-primary" onClick={saveEdit}>{tt("ui_save")}</button><button className="jb-btn jb-btn-ghost" onClick={() => setEditing(null)}>{tt("ui_cancel")}</button></div></Modal>)}</div>);
}

export function AdminCategories() {
    const { t: tt } = useApp();
    const { db, update, notify, logAudit } = useApp();
    const [form, setForm] = useState({ name: "", icon: "🛍️" });
    const [editing, setEditing] = useState(null);
    const add = () => { if (!form.name)
        return notify(tt("m_naam_bharein"), "error"); update(d => d.categories.push({ id: uid("c"), ...form })); setForm({ name: "", icon: "🛍️" }); };
    const del = (id) => update(d => d.categories = d.categories.filter(c => c.id !== id));
    const openEdit = (c) => setEditing({ id: c.id, oldName: c.name, name: c.name, icon: c.icon || "", subs: JSON.parse(JSON.stringify(c.subcategories || [])) });
    const setSub = (i, field, v) => setEditing(x => ({ ...x, subs: x.subs.map((s, idx) => idx === i ? { ...s, [field]: v } : s) }));
    const saveEdit = () => {
        const name = editing.name.trim();
        if (!name)
            return notify(tt("m_category_ka_naam_bharein"), "error");
        if (db.categories.some(c => c.id !== editing.id && c.name.toLowerCase() === name.toLowerCase()))
            return notify(tt("m_is_naam_ki_category_pehle_se"), "error");
        const subs = editing.subs.filter(s => (s.name || "").trim()).map(s => ({ ...s, name: s.name.trim() }));
        update(d => {
            const c = d.categories.find(x => x.id === editing.id);
            c.name = name;
            c.icon = editing.icon;
            c.subcategories = subs;
            if (name !== editing.oldName)
                d.products.forEach(p => { if (p.category === editing.oldName)
                    p.category = name; });
        });
        logAudit && logAudit("category-edit", editing.id);
        notify(tt("m_category_update_ho_gayi"), "success");
        setEditing(null);
    };
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_category_management")}</div>{db.categories.map(c => (<div key={c.id} className="jb-card" style={{ padding: 12, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span>{c.icon}{" "}{c.name}<span style={{ fontSize: 11, color: "#8a7360" }}>{` (${(c.subcategories || []).length} sub)`}</span></span><span style={{ display: "flex", gap: 6 }}><button className="jb-btn jb-btn-ghost" onClick={() => openEdit(c)}>{tt("ui_edit")}</button><button className="jb-btn jb-btn-ghost" style={{ color: T.danger }} onClick={() => del(c.id)}>{tt("ui_delete")}</button></span></div>))}<div className="jb-card" style={{ padding: 14, marginTop: 12, display: "flex", gap: 8, alignItems: "flex-end" }}><div style={{ flex: 1 }}><Field label={tt("x_icon_emoji_659b")} value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} /></div><div style={{ flex: 2 }}><Field label={tt("x_category_name_9912")} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div><button className="jb-btn jb-btn-primary" style={{ marginBottom: 12 }} onClick={add}>{tt("ui_add_2")}</button></div>{editing && (<Modal onClose={() => setEditing(null)} width={440}><div style={{ fontWeight: 700, marginBottom: 10 }}>{tt("ui_edit_category")}</div><div style={{ display: "flex", gap: 8 }}><div style={{ flex: 1 }}><Field label={tt("x_icon_8174")} value={editing.icon} onChange={e => setEditing(x => ({ ...x, icon: e.target.value }))} /></div><div style={{ flex: 3 }}><Field label={tt("x_name_49ee")} value={editing.name} onChange={e => setEditing(x => ({ ...x, name: e.target.value }))} /></div></div><span className="jb-label">{tt("ui_subcategories")}</span>{editing.subs.map((s, i) => (<div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}><input className="jb-input" style={{ width: 60 }} value={s.icon || ""} placeholder="🛍️" onChange={e => setSub(i, "icon", e.target.value)} /><input className="jb-input" value={s.name || ""} placeholder={tt("m_subcategory_name")} onChange={e => setSub(i, "name", e.target.value)} /><button className="jb-btn jb-btn-ghost" style={{ color: T.danger }} onClick={() => setEditing(x => ({ ...x, subs: x.subs.filter((_, idx) => idx !== i) }))}>✕</button></div>))}<button className="jb-btn jb-btn-outline" style={{ marginBottom: 12 }} onClick={() => setEditing(x => ({ ...x, subs: [...x.subs, { name: "", icon: "" }] }))}>{tt("x_subcategory_fab1")}</button><div style={{ display: "flex", gap: 8 }}><button className="jb-btn jb-btn-primary" onClick={saveEdit}>{tt("ui_save")}</button><button className="jb-btn jb-btn-ghost" onClick={() => setEditing(null)}>{tt("ui_cancel")}</button></div></Modal>)}</div>);
}

export function AdminCommission() {
    const { t: tt } = useApp();
    var _a;
    const { db, update, notify } = useApp();
    const setPct = (id, pct) => update(d => { d.sellers.find(s => s.id === id).commissionPct = Math.max(0, Math.min(100, Number(pct))); });
    const [defaultPct, setDefaultPct] = useState((_a = db.defaultCommissionPct) !== null && _a !== void 0 ? _a : 10);
    const saveDefault = () => { update(d => { d.defaultCommissionPct = Math.max(0, Math.min(100, Number(defaultPct))); }); notify(tt("m_naye_sellers_ke_liye_default"), "success"); };
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{tt("ui_commission_management")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{tt("ui_platform_commission_aap_jila")}</div><div className="jb-card" style={{ padding: 14, marginBottom: 16, maxWidth: 420 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_naye_sellers_ke_liye_default")}</div><div style={{ display: "flex", gap: 8, alignItems: "center" }}><input className="jb-input" style={{ width: 90 }} type="number" min={0} max={100} value={defaultPct} onChange={e => setDefaultPct(e.target.value)} /><span style={{ fontSize: 13 }}>{"% platform rakhega (seller ko "}{100 - Number(defaultPct || 0)}% milega)</span></div><button className="jb-btn jb-btn-primary" style={{ marginTop: 8 }} onClick={saveDefault}>{tt("ui_save_default")}</button></div><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_per_seller_commission_overri")}</div><table className="jb-table"><thead><tr><th>{tt("ui_seller")}</th><th>{tt("ui_platform_commission")}</th><th>{tt("ui_seller_gets")}</th></tr></thead><tbody>{db.sellers.map(s => (<tr key={s.id}><td>{s.shopName}</td><td><input className="jb-input" style={{ width: 80 }} type="number" min={0} max={100} defaultValue={s.commissionPct} onBlur={e => { setPct(s.id, e.target.value); notify(tt("m_commission_update_ho_gaya"), "success"); }} />%</td><td style={{ color: T.success, fontWeight: 600 }}>{100 - s.commissionPct}%</td></tr>))}</tbody></table></div>);
}

export function AdminDelivery() {
    const { t: tt } = useApp();
    const { db, update, notify } = useApp();
    const [base, setBase] = useState(db.deliveryCharge.base);
    const [freeAbove, setFreeAbove] = useState(db.deliveryCharge.freeAbove);
    const [supportNum, setSupportNum] = useState(db.supportWhatsapp || "");
    const save = () => { update(d => { d.deliveryCharge = { base: Number(base), freeAbove: Number(freeAbove) }; }); notify(tt("m_delivery_charges_update_ho_g"), "success"); };
    const saveSupport = () => {
        if (supportNum && !isValidIndianMobile(supportNum))
            return notify(tt("m_valid_10_digit_mobile_number"), "error");
        update(d => { d.supportWhatsapp = supportNum; });
        notify(tt("m_support_whatsapp_number_save"), "success");
    };
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_delivery_charge_management")}</div><div className="jb-card" style={{ padding: 16, maxWidth: 360, marginBottom: 16 }}><Field label={tt("x_base_delivery_charge_7cfb")} type="number" value={base} onChange={e => setBase(e.target.value)} /><Field label={tt("x_free_delivery_above_b73d")} type="number" value={freeAbove} onChange={e => setFreeAbove(e.target.value)} /><button className="jb-btn jb-btn-primary" onClick={save}>{tt("ui_save")}</button></div><div className="jb-card" style={{ padding: 16, maxWidth: 360 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("x_customer_support_whatsap_8a70")}</div><div style={{ fontSize: 11, color: "#8a7360", marginBottom: 8 }}>{tt("x_customers_ko_help_suppor_bbde")}</div><Field label={tt("x_support_mobile_number_7ea7")} value={supportNum} onChange={e => setSupportNum(e.target.value)} placeholder={tt("m_10_digit_mobile")} /><button className="jb-btn jb-btn-primary" onClick={saveSupport}>{tt("ui_save_support_number")}</button></div></div>);
}

export function AdminAnalytics() {
    const { t: tt } = useApp();
    const { db } = useApp();
    const soldCount = (pid) => db.orders.reduce((a, o) => a + o.items.filter(it => it.productId === pid).reduce((b, it) => b + it.qty, 0), 0);
    const productRows = [...db.products].map(p => ({ ...p, sold: soldCount(p.id) })).sort((a, b) => (b.views || 0) - (a.views || 0));
    const topSellers = [...db.sellers].sort((a, b) => b.walletBalance - a.walletBalance).slice(0, 5);
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_analytics_reports")}</div><div className="jb-card" style={{ padding: 14, marginBottom: 16 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_product_analytics")}</div><table className="jb-table"><thead><tr><th>{tt("ui_product")}</th><th>{tt("ui_views")}</th><th>{tt("ui_sold")}</th><th>{tt("ui_conversion")}</th><th>{tt("ui_rating")}</th></tr></thead><tbody>{productRows.map(p => (<tr key={p.id}><td>{p.name}</td><td>{p.views || 0}</td><td>{p.sold}</td><td>{p.views ? ((p.sold / p.views) * 100).toFixed(1) : "0"}%</td><td><StarRating value={p.rating} /></td></tr>))}</tbody></table></div><div className="jb-card" style={{ padding: 14 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_top_sellers_by_wallet")}</div>{topSellers.map(s => <div key={s.id} style={{ fontSize: 13, marginBottom: 4 }}>{s.shopName}{" — ₹"}{s.walletBalance}</div>)}</div></div>);
}

export function AdminCoupons() {
    const { t: tt } = useApp();
    const { db, update, notify } = useApp();
    const [form, setForm] = useState({ code: "", type: "percent", value: 10, minOrderValue: 0, expiryDate: "", usageLimit: 100 });
    const [editing, setEditing] = useState(null);
    const openEdit = (c) => setEditing({ id: c.id, code: c.code, type: c.type, value: c.value, minOrderValue: c.minOrderValue || 0, expiryDate: c.expiryDate ? String(c.expiryDate).slice(0, 10) : "", usageLimit: c.usageLimit || 0 });
    const saveEdit = () => {
        const code = editing.code.trim().toUpperCase();
        if (!code)
            return notify(tt("m_coupon_code_daalein"), "error");
        if (db.coupons.some(c => c.id !== editing.id && c.code === code))
            return notify(tt("m_ye_code_pehle_se_hai"), "error");
        if (!(Number(editing.value) > 0))
            return notify(tt("m_valid_discount_value_daalein"), "error");
        if (editing.type === "percent" && Number(editing.value) > 100)
            return notify(tt("m_percent_100_se_zyada_nahi_ho"), "error");
        update(d => { const c = d.coupons.find(x => x.id === editing.id); c.code = code; c.type = editing.type; c.value = Number(editing.value); c.minOrderValue = Number(editing.minOrderValue) || 0; c.expiryDate = editing.expiryDate || null; c.usageLimit = Number(editing.usageLimit) || 0; });
        notify(tt("m_coupon_update_ho_gaya"), "success");
        setEditing(null);
    };
    const add = () => {
        if (!form.code.trim())
            return notify(tt("m_coupon_code_daalein"), "error");
        const code = form.code.trim().toUpperCase();
        if (db.coupons.some(c => c.code === code))
            return notify(tt("m_ye_code_pehle_se_hai"), "error");
        if (!form.value || form.value <= 0)
            return notify(tt("m_valid_discount_value_daalein"), "error");
        update(d => d.coupons.push({
            id: uid("cp"), code, type: form.type, value: Number(form.value), minOrderValue: Number(form.minOrderValue) || 0,
            expiryDate: form.expiryDate || null, usageLimit: Number(form.usageLimit) || 0, usedCount: 0, active: true, createdAt: nowISO(),
        }));
        setForm({ code: "", type: "percent", value: 10, minOrderValue: 0, expiryDate: "", usageLimit: 100 });
        notify(tt("m_coupon_ban_gaya"), "success");
    };
    const toggle = (id) => update(d => { const c = d.coupons.find(c => c.id === id); c.active = !c.active; });
    const del = (id) => { if (confirm(tt("m_coupon_delete_karein")))
        update(d => d.coupons = d.coupons.filter(c => c.id !== id)); };
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_coupon_discount_codes")}</div>{db.coupons.length === 0 ? <EmptyState text={tt("x_koi_coupon_nahi_bana_fcd9")} /> : db.coupons.map(c => (<div key={c.id} className="jb-card" style={{ padding: 12, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}><div><b style={{ fontSize: 15 }}>{c.code}</b><div style={{ fontSize: 12, color: "#8a7360" }}>{c.type === "percent" ? `${c.value}% off` : `₹${c.value} off`}{c.minOrderValue > 0 && ` • Min order ₹${c.minOrderValue}`}{c.expiryDate && ` • Expiry: ${new Date(c.expiryDate).toLocaleDateString()}`}{" • Used: "}{c.usedCount}/{c.usageLimit || "∞"}</div></div><div style={{ display: "flex", gap: 6, alignItems: "center" }}><StatusBadge status={c.active ? "approved" : "blocked"} /><button className="jb-btn jb-btn-ghost" onClick={() => openEdit(c)}>{tt("ui_edit")}</button><button className="jb-btn jb-btn-outline" style={{ fontSize: 12 }} onClick={() => toggle(c.id)}>{c.active ? "Deactivate" : tt("x_activate_a133")}</button><button className="jb-btn jb-btn-ghost" style={{ color: T.danger }} onClick={() => del(c.id)}>{tt("ui_delete")}</button></div></div>))}<div className="jb-card" style={{ padding: 14, marginTop: 12 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_naya_coupon_banayein")}</div><Field label={tt("x_coupon_code_9d46")} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="JILA50" /><div style={{ display: "flex", gap: 8 }}><div style={{ flex: 1 }}><span className="jb-label">{tt("ui_type_2")}</span><select className="jb-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option value="percent">{tt("ui_percent")}</option><option value="flat">{tt("x_flat_e38a")}</option></select></div><div style={{ flex: 1 }}><Field label={tt("x_value_6892")} type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /></div></div><Field label={tt("x_minimum_order_value_opti_3f1f")} type="number" value={form.minOrderValue} onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))} /><Field label={tt("x_expiry_date_optional_b201")} type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} /><Field label={tt("x_usage_limit_kitni_baar_t_0e30")} type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} /><button className="jb-btn jb-btn-primary" onClick={add}>{tt("ui_coupon_banayein")}</button></div>{editing && (<Modal onClose={() => setEditing(null)} width={400}><div style={{ fontWeight: 700, marginBottom: 10 }}>{tt("ui_edit_coupon")}</div><Field label={tt("x_coupon_code_9d46")} value={editing.code} onChange={e => setEditing(x => ({ ...x, code: e.target.value }))} /><div style={{ display: "flex", gap: 8 }}><div style={{ flex: 1 }}><span className="jb-label">{tt("ui_type_2")}</span><select className="jb-input" value={editing.type} onChange={e => setEditing(x => ({ ...x, type: e.target.value }))}><option value="percent">{tt("ui_percent")}</option><option value="flat">{tt("x_flat_e38a")}</option></select></div><div style={{ flex: 1 }}><Field label={tt("x_value_6892")} type="number" value={editing.value} onChange={e => setEditing(x => ({ ...x, value: e.target.value }))} /></div></div><Field label={tt("x_minimum_order_value_5575")} type="number" value={editing.minOrderValue} onChange={e => setEditing(x => ({ ...x, minOrderValue: e.target.value }))} /><Field label={tt("x_expiry_date_optional_b201")} type="date" value={editing.expiryDate} onChange={e => setEditing(x => ({ ...x, expiryDate: e.target.value }))} /><Field label={tt("x_usage_limit_0_unlimited_1c7d")} type="number" value={editing.usageLimit} onChange={e => setEditing(x => ({ ...x, usageLimit: e.target.value }))} /><div style={{ display: "flex", gap: 8 }}><button className="jb-btn jb-btn-primary" onClick={saveEdit}>{tt("ui_save")}</button><button className="jb-btn jb-btn-ghost" onClick={() => setEditing(null)}>{tt("ui_cancel")}</button></div></Modal>)}</div>);
}

export function AdminFlashSale() {
    const { t: tt } = useApp();
    const { db, update, notify } = useApp();
    const products = db.products.filter(p => p.approved);
    const [target, setTarget] = useState(null);
    const [dealPrice, setDealPrice] = useState("");
    const [hours, setHours] = useState(24);
    const isActive = (p) => { var _a; return ((_a = p.flashSale) === null || _a === void 0 ? void 0 : _a.active) && p.flashSale.endsAt && new Date(p.flashSale.endsAt) > new Date(); };
    const startSale = () => {
        if (!dealPrice || Number(dealPrice) <= 0 || Number(dealPrice) >= target.price)
            return notify(tt("m_deal_price_original_price_se"), "error");
        const endsAt = new Date(Date.now() + Number(hours) * 3600 * 1000).toISOString();
        update(d => { d.products.find(p => p.id === target.id).flashSale = { active: true, dealPrice: Number(dealPrice), endsAt }; });
        notify(tt("m_flash_sale_shuru_ho_gaya"), "success");
        setTarget(null);
        setDealPrice("");
        setHours(24);
    };
    const endSale = (pid) => update(d => { d.products.find(p => p.id === pid).flashSale = { active: false, dealPrice: null, endsAt: null }; });
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{tt("ui_flash_sale_deal_of_the_day")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{tt("x_kisi_product_par_time_li_91b5")}</div><table className="jb-table"><thead><tr><th>{tt("ui_product")}</th><th>{tt("ui_price")}</th><th>{tt("ui_flash_sale")}</th><th>{tt("ui_action")}</th></tr></thead><tbody>{products.map(p => (<tr key={p.id}><td>{p.name}</td><td>₹{p.price}</td><td>{isActive(p) ? <span className="jb-badge" style={{ background: "#FFE9D6", color: "#A15A1F" }}>₹{p.flashSale.dealPrice}{" tak "}{new Date(p.flashSale.endsAt).toLocaleString()}</span> : "—"}</td><td>{isActive(p) ? (<button className="jb-btn jb-btn-danger" style={{ fontSize: 12, padding: "5px 8px" }} onClick={() => endSale(p.id)}>{tt("ui_end_sale")}</button>) : (<button className="jb-btn jb-btn-gold" style={{ fontSize: 12, padding: "5px 8px" }} onClick={() => { setTarget(p); setDealPrice(""); setHours(24); }}>{tt("x_start_sale_956c")}</button>)}</td></tr>))}</tbody></table>{target && (<Modal onClose={() => setTarget(null)} width={380}><div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, color: T.maroonDark }}>{"⚡ Flash Sale — "}{target.name}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 10 }}>Original price: ₹{target.price}</div><Field label={tt("x_deal_price_a174")} type="number" value={dealPrice} onChange={e => setDealPrice(e.target.value)} /><div style={{ marginBottom: 12 }}><span className="jb-label">{tt("ui_kitne_ghante_ke_liye")}</span><select className="jb-input" value={hours} onChange={e => setHours(e.target.value)}><option value={6}>{tt("ui_6_ghante")}</option><option value={12}>{tt("ui_12_ghante")}</option><option value={24}>{tt("ui_24_ghante_1_din")}</option><option value={72}>{tt("ui_72_ghante_3_din")}</option></select></div><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={startSale}>{tt("ui_flash_sale_shuru_karein")}</button></Modal>)}</div>);
}

export function AdminAds() {
    const { t: tt } = useApp();
    const { db, update, notify } = useApp();
    const requests = db.adRequests;
    const totalAdRevenue = requests.filter(a => a.status === "approved").reduce((a, r) => a + r.amount, 0);
    const approve = (ad) => update(d => {
        const a = d.adRequests.find(x => x.id === ad.id);
        a.status = "approved";
        a.approvedAt = nowISO();
        const p = d.products.find(p => p.id === ad.productId);
        if (p) {
            const base = p.sponsoredUntil && new Date(p.sponsoredUntil) > new Date() ? new Date(p.sponsoredUntil) : new Date();
            base.setDate(base.getDate() + ad.days);
            p.sponsoredUntil = base.toISOString();
        }
        d.notifications.unshift({ id: uid("n"), userId: ad.sellerId, text: `Aapki "${ad.productName}" ki promote request approve ho gayi! ${ad.days} din ke liye Sponsored rahega.`, at: nowISO(), read: false });
    });
    const reject = (ad) => update(d => {
        const a = d.adRequests.find(x => x.id === ad.id);
        a.status = "rejected";
        d.notifications.unshift({ id: uid("n"), userId: ad.sellerId, text: `Aapki "${ad.productName}" ki promote request reject kar di gayi.`, at: nowISO(), read: false });
    });
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{tt("ui_product_promotion_ads_reques")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{"Total Ad Revenue: "}<b style={{ color: T.success }}>₹{totalAdRevenue}</b></div>{requests.length === 0 ? <EmptyState text={tt("x_koi_promote_request_nahi_eb83")} /> : requests.map(ad => (<div key={ad.id} className="jb-card" style={{ padding: 14, marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between" }}><b>{ad.productName}</b><StatusBadge status={ad.status} /></div><div style={{ fontSize: 12, color: "#8a7360", margin: "4px 0" }}>{ad.shopName}{" • "}{ad.days}{" din • ₹"}{ad.amount}{" • "}{new Date(ad.requestedAt).toLocaleDateString()}</div>{ad.status === "pending" && (<div style={{ display: "flex", gap: 8, marginTop: 8 }}><button className="jb-btn jb-btn-primary" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => { approve(ad); notify(tt("m_ad_approved_product_ab_spons"), "success"); }}>{tt("ui_approve")}</button><button className="jb-btn jb-btn-danger" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => { reject(ad); notify(tt("m_ad_rejected"), "success"); }}>{tt("ui_reject")}</button></div>)}</div>))}</div>);
}

export function AdminReturns() {
    const { t: tt } = useApp();
    const { db, update, notify } = useApp();
    const returned = db.orders.filter(o => o.returnRequest);
    const approveReturn = (o) => update(d => {
        const ord = d.orders.find(x => x.id === o.id);
        ord.returnRequest.status = "approved";
        ord.refund = { amount: ord.total, status: "processing", at: nowISO() };
        d.refunds.unshift({ id: uid("rf"), orderId: o.id, customerId: o.customerId, amount: o.total, status: "processing", at: nowISO() });
        d.notifications.unshift({ id: uid("n"), userId: o.customerId, text: `Return approved for order #${o.id.slice(-6)}. Refund of ₹${o.total} is processing.`, at: nowISO(), read: false });
        // Return approve hote hi product wapas seller ke stock mein jud jata hai.
        ord.items.forEach(it => {
            const prod = d.products.find(p => p.id === it.productId);
            if (prod)
                prod.stock = (prod.stock || 0) + it.qty;
        });
    });
    const rejectReturn = (o) => update(d => {
        const ord = d.orders.find(x => x.id === o.id);
        ord.returnRequest.status = "rejected";
        ord.status = "delivered";
        d.notifications.unshift({ id: uid("n"), userId: o.customerId, text: `Return request rejected for order #${o.id.slice(-6)}.`, at: nowISO(), read: false });
    });
    const markRefunded = (o) => update(d => {
        const ord = d.orders.find(x => x.id === o.id);
        ord.refund.status = "refunded";
        ord.status = "refunded";
        const rf = d.refunds.find(r => r.orderId === o.id);
        if (rf)
            rf.status = "refunded";
        d.notifications.unshift({ id: uid("n"), userId: o.customerId, text: `₹${o.total} refunded for order #${o.id.slice(-6)}.`, at: nowISO(), read: false });
    });
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_returns_refund_system")}</div>{returned.length === 0 ? <EmptyState text={tt("x_koi_return_request_nahi__7b7f")} /> : returned.map(o => {
            var _a;
            return (<div key={o.id} className="jb-card" style={{ padding: 14, marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between" }}><b>#{o.id.slice(-6)}{" — "}{o.customerName}</b><StatusBadge status={o.returnRequest.status} /></div><div style={{ fontSize: 12, color: "#8a7360", margin: "4px 0" }}>{"Reason: "}{o.returnRequest.reason}{" • Amount: ₹"}{o.total}</div>{o.refund && <div style={{ fontSize: 12 }}>{"Refund status: "}<StatusBadge status={o.refund.status} /></div>}<div style={{ display: "flex", gap: 8, marginTop: 8 }}>{o.returnRequest.status === "pending" && <><button className="jb-btn jb-btn-primary" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => approveReturn(o)}>{tt("ui_approve_return")}</button><button className="jb-btn jb-btn-danger" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => rejectReturn(o)}>{tt("ui_reject")}</button></>}{((_a = o.refund) === null || _a === void 0 ? void 0 : _a.status) === "processing" && <button className="jb-btn jb-btn-outline" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => { markRefunded(o); notify(tt("m_refund_marked_complete"), "success"); }}>{tt("ui_mark_as_refunded")}</button>}</div></div>);
        })}</div>);
}

export function AdminDeliveryPartners() {
    const { t: tt } = useApp();
    const { db, update, notify } = useApp();
    const [form, setForm] = useState({ name: "", phone: "" });
    const [editing, setEditing] = useState(null);
    const saveEdit = () => {
        const name = editing.name.trim(), phone = editing.phone.trim();
        if (!name || !phone)
            return notify(tt("m_naam_aur_phone_bharein"), "error");
        if (!isValidIndianMobile(phone))
            return notify(tt("m_valid_10_digit_phone_daalein"), "error");
        update(d => {
            const p = d.deliveryPartners.find(x => x.id === editing.id);
            const old = p.name;
            p.name = name;
            p.phone = phone;
            if (old !== name)
                d.orders.forEach(o => { if (o.deliveryPartner === old)
                    o.deliveryPartner = name; });
        });
        notify(tt("m_partner_update_ho_gaya"), "success");
        setEditing(null);
    };
    const packedOrders = db.orders.filter(o => o.status === "packed");
    const add = () => { if (!form.name || !form.phone)
        return notify(tt("m_naam_aur_phone_bharein"), "error"); update(d => d.deliveryPartners.push({ id: uid("dp"), ...form, active: true })); setForm({ name: "", phone: "" }); };
    const toggleActive = (id) => update(d => { const p = d.deliveryPartners.find(p => p.id === id); p.active = !p.active; });
    const assign = (orderId, partnerName) => update(d => {
        const o = d.orders.find(o => o.id === orderId);
        o.deliveryPartner = partnerName;
        o.status = "shipped";
        o.timeline.push({ status: "shipped", at: nowISO() });
        d.notifications.unshift({ id: uid("n"), userId: o.customerId, text: `Order #${o.id.slice(-6)} shipped via ${partnerName}. Delivery OTP: ${o.deliveryOtp}`, at: nowISO(), read: false });
    });
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_delivery_partner_assignment")}</div><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("x_packed_orders_assign_a_p_8d94")}</div>{packedOrders.length === 0 ? <EmptyState text={tt("x_koi_packed_order_nahi_ha_4661")} /> : packedOrders.map(o => {
            var _a;
            return (<div key={o.id} className="jb-card" style={{ padding: 12, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}><span style={{ fontSize: 13 }}>#{o.id.slice(-6)}{" — "}{o.customerName}{" ("}{(_a = o.address) === null || _a === void 0 ? void 0 :
                    _a.city})</span><select className="jb-input" style={{ width: 200 }} onChange={e => e.target.value && assign(o.id, e.target.value)} defaultValue=""><option value="" disabled={true}>{tt("ui_assign_partner")}</option>{db.deliveryPartners.filter(p => p.active).map(p => <option key={p.id} value={p.name}>{p.name}{" ("}{p.phone})</option>)}</select></div>);
        })}<div style={{ fontWeight: 600, margin: "16px 0 8px" }}>{tt("ui_manage_partners")}</div>{db.deliveryPartners.map(p => (<div key={p.id} className="jb-card" style={{ padding: 12, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span>{p.name}{" — "}{p.phone}</span><div style={{ display: "flex", gap: 8, alignItems: "center" }}><StatusBadge status={p.active ? "approved" : "blocked"} /><button className="jb-btn jb-btn-ghost" onClick={() => setEditing({ id: p.id, name: p.name, phone: p.phone })}>{tt("ui_edit")}</button><button className="jb-btn jb-btn-outline" style={{ fontSize: 12 }} onClick={() => toggleActive(p.id)}>{p.active ? "Deactivate" : tt("x_activate_a133")}</button></div></div>))}<div className="jb-card" style={{ padding: 14, marginTop: 12, display: "flex", gap: 8, alignItems: "flex-end" }}><div style={{ flex: 1 }}><Field label={tt("x_partner_name_af2e")} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div><div style={{ flex: 1 }}><Field label={tt("x_phone_bcc2")} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div><button className="jb-btn jb-btn-primary" style={{ marginBottom: 12 }} onClick={add}>{tt("ui_add_partner")}</button></div>{editing && (<Modal onClose={() => setEditing(null)} width={380}><div style={{ fontWeight: 700, marginBottom: 10 }}>{tt("ui_edit_delivery_partner")}</div><Field label={tt("x_partner_name_af2e")} value={editing.name} onChange={e => setEditing(x => ({ ...x, name: e.target.value }))} /><Field label={tt("x_phone_bcc2")} value={editing.phone} onChange={e => setEditing(x => ({ ...x, phone: e.target.value }))} /><div style={{ display: "flex", gap: 8 }}><button className="jb-btn jb-btn-primary" onClick={saveEdit}>{tt("ui_save")}</button><button className="jb-btn jb-btn-ghost" onClick={() => setEditing(null)}>{tt("ui_cancel")}</button></div></Modal>)}</div>);
}

export function AdminReports() {
    const { t: tt } = useApp();
    const { db, notify } = useApp();
    const exportUsers = () => downloadCSV("users.csv", db.users.filter(u => u.role === "customer").map(u => ({
        Name: u.name, Mobile: u.mobile, Addresses: (u.address || []).map(a => `${a.line1}, ${a.city} - ${a.pincode}`).join(" | "),
        Orders: db.orders.filter(o => o.customerId === u.id).length,
    })));
    const exportSellers = () => downloadCSV("sellers.csv", db.sellers.map(s => {
        var _a, _b, _c;
        return ({
            Shop: s.shopName, Owner: s.ownerName, Mobile: s.mobile, Status: s.status, Address: s.address,
            KYC: ((_a = s.kyc) === null || _a === void 0 ? void 0 : _a.verified) ? "Verified" : "Pending", GST: ((_b = s.kyc) === null || _b === void 0 ? void 0 : _b.gst) || "", Bank: ((_c = s.bank) === null || _c === void 0 ? void 0 : _c.verified) ? "Verified" : "Pending",
            Commission: s.commissionPct, WalletBalance: s.walletBalance,
        });
    }));
    const exportProducts = () => downloadCSV("products.csv", db.products.map(p => {
        var _a;
        return ({
            Name: p.name, Seller: (_a = db.sellers.find(s => s.id === p.sellerId)) === null || _a === void 0 ? void 0 : _a.shopName, Category: p.category,
            Price: p.price, Stock: p.stock, Approved: p.approved, Views: p.views || 0,
        });
    }));
    const exportOrders = () => downloadCSV("orders.csv", db.orders.map(o => ({
        OrderId: o.id, Customer: o.customerName, Total: o.total, Status: o.status, Date: o.createdAt,
    })));
    const exportWithdrawals = () => downloadCSV("withdrawals.csv", db.withdrawals.map(w => ({
        Shop: w.shopName, Amount: w.amount, Status: w.status, RequestedAt: w.requestedAt,
    })));
    const items = [
        ["All Users (Name, Mobile, Address, Orders)", exportUsers],
        ["All Sellers (KYC, Bank, Commission, Wallet)", exportSellers],
        ["All Products (Stock, Views, Approval)", exportProducts],
        ["All Orders (Status, Revenue)", exportOrders],
        ["Withdrawal Requests", exportWithdrawals],
    ];
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{tt("ui_reports_export_csv")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{tt("x_excel_mein_khol_sakte_ha_a57b")}</div>{items.map(([label, fn]) => (<div key={label} className="jb-card" style={{ padding: 14, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 13 }}>{label}</span><button className="jb-btn jb-btn-gold" style={{ fontSize: 12 }} onClick={() => { fn(); notify(tt("m_csv_download_ho_gaya"), "success"); }}>{tt("ui_download_csv")}</button></div>))}</div>);
}
