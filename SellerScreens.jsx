import React, { useState } from "react";
import { useApp } from "./AppContext.jsx";
import { EmptyState, Field, InvoiceModal, Modal, OrderDetailModal, StarRating, StatusBadge } from "./CommonUI.jsx";
import { T } from "./theme.js";
import { callOpenAIVision, fetchImageAsBase64, friendlyAIError } from "./helpers.js";
import { nowISO, uid } from "./database.js";
import { TotpGate } from "./AuthScreens.jsx";

/* ============================================================================
   SELLER PANEL
   ============================================================================ */
export function SellerKYC({ setView }) {
    const { t: tt } = useApp();
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const { db, session, update, notify } = useApp();
    const seller = db.sellers.find(s => s.id === (session === null || session === void 0 ? void 0 : session.id));
    const [pan, setPan] = useState(((_a = seller === null || seller === void 0 ? void 0 : seller.kyc) === null || _a === void 0 ? void 0 : _a.pan) || "");
    const [aadhaar, setAadhaar] = useState(((_b = seller === null || seller === void 0 ? void 0 : seller.kyc) === null || _b === void 0 ? void 0 : _b.aadhaar) || "");
    const [gst, setGst] = useState(((_c = seller === null || seller === void 0 ? void 0 : seller.kyc) === null || _c === void 0 ? void 0 : _c.gst) || "");
    const [accountNo, setAccountNo] = useState(((_d = seller === null || seller === void 0 ? void 0 : seller.bank) === null || _d === void 0 ? void 0 : _d.accountNo) || "");
    const [ifsc, setIfsc] = useState(((_e = seller === null || seller === void 0 ? void 0 : seller.bank) === null || _e === void 0 ? void 0 : _e.ifsc) || "");
    const [holder, setHolder] = useState(((_f = seller === null || seller === void 0 ? void 0 : seller.bank) === null || _f === void 0 ? void 0 : _f.holder) || "");
    const [upi, setUpi] = useState(((_g = seller === null || seller === void 0 ? void 0 : seller.upi) === null || _g === void 0 ? void 0 : _g.id) || "");
    const submitKyc = () => {
        if (!pan || !aadhaar)
            return notify(tt("m_pan_aur_aadhaar_bharein"), "error");
        if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(pan.trim().toUpperCase()))
            return notify(tt("m_pan_number_ka_format_galat_h"), "error");
        const aadhaarDigits = aadhaar.replace(/[\s-]/g, "");
        if (!/^\d{12}$/.test(aadhaarDigits))
            return notify(tt("m_aadhaar_number_12_digit_ka_h"), "error");
        if (gst && !/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]$/.test(gst.trim().toUpperCase()))
            return notify(tt("m_gst_number_ka_format_galat_l"), "error");
        update(d => { const s = d.sellers.find(s => s.id === seller.id); s.kyc = { pan: pan.trim().toUpperCase(), aadhaar: aadhaarDigits, gst: gst.trim().toUpperCase(), verified: false }; });
        notify(tt("m_kyc_submit_ho_gaya_verificat"), "success");
    };
    const submitBank = () => {
        if (!accountNo || !ifsc || !holder)
            return notify(tt("m_sabhi_bank_fields_bharein"), "error");
        update(d => { const s = d.sellers.find(s => s.id === seller.id); s.bank = { accountNo, ifsc, holder, verified: false }; });
        notify(tt("m_bank_details_submit_ho_gayi_"), "success");
    };
    const submitUpi = () => {
        if (!upi)
            return notify(tt("m_upi_id_bharein"), "error");
        update(d => { const s = d.sellers.find(s => s.id === seller.id); s.upi = { id: upi, verified: false }; });
        notify(tt("m_upi_submit_ho_gaya_verificat"), "success");
    };
    if (!seller)
        return <EmptyState text={tt("x_seller_session_nahi_mila_dc7c")} />;
    return (<div style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{tt("ui_seller_kyc_verification")}</div><div style={{ marginBottom: 12 }}><StatusBadge status={seller.status} /></div><div className="jb-card" style={{ padding: 14, marginBottom: 12 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{"KYC Documents "}{((_h = seller.kyc) === null || _h === void 0 ? void 0 : _h.verified) && <span style={{ color: T.success, fontSize: 12 }}>{tt("x_verified_bb31")}</span>}</div><Field label={tt("x_pan_number_ab5f")} value={pan} onChange={e => setPan(e.target.value)} placeholder="ABCDE1234F" maxLength={10} /><Field label={tt("x_aadhaar_number_c031")} value={aadhaar} onChange={e => setAadhaar(e.target.value)} placeholder="XXXX-XXXX-XXXX" maxLength={14} /><Field label={tt("x_gst_number_optional_0167")} value={gst} onChange={e => setGst(e.target.value)} placeholder="22AAAAA0000A1Z5" maxLength={15} /><div style={{ fontSize: 11, color: "#8a7360", marginBottom: 10, marginTop: -6 }}>{tt("x_chhoti_dukaanon_ke_liye__53ea")}</div><button className="jb-btn jb-btn-primary" onClick={submitKyc}>{tt("ui_submit_kyc")}</button></div><div className="jb-card" style={{ padding: 14, marginBottom: 12 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{"Bank Account "}{((_j = seller.bank) === null || _j === void 0 ? void 0 : _j.verified) && <span style={{ color: T.success, fontSize: 12 }}>{tt("x_verified_bb31")}</span>}</div><Field label={tt("x_account_holder_name_4628")} value={holder} onChange={e => setHolder(e.target.value)} /><Field label={tt("x_account_number_2fce")} value={accountNo} onChange={e => setAccountNo(e.target.value)} /><Field label={tt("x_ifsc_code_7ebe")} value={ifsc} onChange={e => setIfsc(e.target.value)} /><button className="jb-btn jb-btn-primary" onClick={submitBank}>{tt("ui_submit_bank_details")}</button></div><div className="jb-card" style={{ padding: 14, marginBottom: 12 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{"UPI "}{((_k = seller.upi) === null || _k === void 0 ? void 0 : _k.verified) && <span style={{ color: T.success, fontSize: 12 }}>{tt("x_verified_bb31")}</span>}</div><Field label="UPI ID" value={upi} onChange={e => setUpi(e.target.value)} placeholder="name@upi" /><button className="jb-btn jb-btn-primary" onClick={submitUpi}>{tt("ui_submit_upi")}</button></div><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_admin_dwara_verify_hone_ke_b")}</div><button className="jb-btn jb-btn-outline" style={{ marginTop: 12 }} onClick={() => setView("seller-dashboard")}>{tt("x_dashboard_ff7b")}</button></div>);
}

export function SellerDashboard({ setView }) {
    const { t: tt } = useApp();
    const { db, session } = useApp();
    const seller = db.sellers.find(s => s.id === (session === null || session === void 0 ? void 0 : session.id));
    const myProducts = db.products.filter(p => p.sellerId === (seller === null || seller === void 0 ? void 0 : seller.id));
    const myOrders = db.orders.filter(o => o.items.some(it => it.sellerId === (seller === null || seller === void 0 ? void 0 : seller.id)));
    const totalSales = myOrders.reduce((a, o) => a + o.items.filter(it => it.sellerId === (seller === null || seller === void 0 ? void 0 : seller.id)).reduce((b, it) => { var _a; return b + ((_a = it.basePrice) !== null && _a !== void 0 ? _a : it.price) * it.qty; }, 0), 0);
    const commission = totalSales * ((seller === null || seller === void 0 ? void 0 : seller.commissionPct) || 0) / 100;
    const tiles = [
        { label: tt("x_products_068f"), value: myProducts.length, view: "seller-products" },
        { label: tt("x_orders_7442"), value: myOrders.length, view: "seller-orders" },
        { label: tt("x_total_sales_6d8e"), value: `₹${totalSales.toFixed(0)}`, view: "seller-earnings" },
        { label: tt("x_wallet_balance_bdd0"), value: `₹${(seller === null || seller === void 0 ? void 0 : seller.walletBalance) || 0}`, view: "seller-withdrawal" },
    ];
    return (<div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><div><div style={{ fontWeight: 700, fontSize: 20 }}>{seller === null || seller === void 0 ? void 0 : seller.shopName}</div><StatusBadge status={seller === null || seller === void 0 ? void 0 : seller.status} /><div style={{ fontSize: 11, color: "#8a7360", marginTop: 4 }}>{tt("x_aapko_har_sale_ka_b5b2")}{100 - ((seller === null || seller === void 0 ? void 0 : seller.commissionPct) || 0)}{tt("x_milta_hai_platform_edcc")}{(seller === null || seller === void 0 ? void 0 : seller.commissionPct) || 0}{tt("x_commission_leta_hai_8376")}</div></div><button className="jb-btn jb-btn-outline" onClick={() => setView("seller-kyc")}>{tt("ui_kyc_bank")}</button></div>{(seller === null || seller === void 0 ? void 0 : seller.status) === "pending" && <div className="jb-card" style={{ padding: 12, marginBottom: 12, background: "#FFF3CD", border: "none", fontSize: 13 }}>{tt("ui_aapka_seller_account_admin_a")}</div>}{(seller === null || seller === void 0 ? void 0 : seller.status) === "blocked" && <div className="jb-card" style={{ padding: 12, marginBottom: 12, background: "#FBE1DC", border: "none", fontSize: 13 }}>{tt("ui_aapka_account_block_kar_diya")}</div>}<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>{tiles.map(t => (<div key={t.label} className="jb-card" style={{ padding: 16, cursor: "pointer" }} onClick={() => setView(t.view)}><div style={{ fontSize: 12, color: "#8a7360" }}>{t.label}</div><div style={{ fontSize: 22, fontWeight: 700, color: T.maroon }}>{t.value}</div></div>))}</div><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button className="jb-btn jb-btn-primary" onClick={() => setView("seller-add-product")}>{tt("ui_add_product")}</button><button className="jb-btn jb-btn-outline" onClick={() => setView("seller-products")}>{tt("ui_manage_products")}</button><button className="jb-btn jb-btn-outline" onClick={() => setView("seller-orders")}>{tt("ui_view_orders")}</button><button className="jb-btn jb-btn-outline" onClick={() => setView("seller-earnings")}>{tt("ui_earnings_report")}</button><button className="jb-btn jb-btn-outline" onClick={() => setView("seller-inventory-ai")}>{tt("x_ai_inventory_manager_c61a")}</button><button className="jb-btn jb-btn-outline" onClick={() => setView("seller-withdrawal")}>{tt("ui_withdrawal")}</button><button className="jb-btn jb-btn-outline" onClick={() => setView("seller-reviews")}>{tt("ui_product_reviews")}</button><button className="jb-btn jb-btn-outline" onClick={() => setView("seller-notifications")}>{tt("x_notifications_84be")}</button></div></div>);
}

export function SellerAddProduct({ setView, editId }) {
    const { t: tt } = useApp();
    var _a;
    const { db, session, update, notify } = useApp();
    const seller = db.sellers.find(s => s.id === (session === null || session === void 0 ? void 0 : session.id));
    const existing = editId ? db.products.find(p => p.id === editId) : null;
    const [form, setForm] = useState(existing ? { ...existing } : {
        name: "", category: ((_a = db.categories[0]) === null || _a === void 0 ? void 0 : _a.name) || "", price: "", mrp: "", stock: "", desc: "", images: [],
    });
    const [imgUrl, setImgUrl] = useState("");
    const [descGenerating, setDescGenerating] = useState(false);
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
    const generateDescFromPhoto = async () => {
        if (!form.images || form.images.length === 0)
            return notify(tt("m_pehle_kam_se_kam_ek_photo_ad"), "error");
        setDescGenerating(true);
        try {
            const { data, mediaType } = await fetchImageAsBase64(form.images[0]);
            const text = await callOpenAIVision(`Product ka naam "${form.name || 'ye product'}" hai. Is photo ke hisaab se ek achha, aakarshak e-commerce product description likhein Hinglish mein (2-3 sentences), jo customer ko kharidne ke liye convince kare. Sirf description text dein, kuch aur nahi (no preamble).`, data, mediaType, db.openaiApiKey, 400);
            if (!text.trim())
                throw new Error("empty");
            setForm(f => ({ ...f, desc: text.trim() }));
            notify(tt("m_ai_ne_description_likh_diya_"), "success");
        }
        catch (e) {
            const isApiIssue = /API key|exceeded_limit|rate.?limit|429|401|invalid.*key/i.test((e === null || e === void 0 ? void 0 : e.message) || "");
            notify(isApiIssue ? friendlyAIError(e) : "Photo se description nahi ban paya — ho sakta hai ye URL se image access na ho paayi. Manually likh dein.", "error");
        }
        finally {
            setDescGenerating(false);
        }
    };
    const addImage = () => {
        if (!imgUrl.trim())
            return notify(tt("m_photo_url_daalein"), "error");
        if (!/^https?:\/\//i.test(imgUrl.trim()))
            return notify(tt("m_sirf_http_ya_https_url_allow"), "error");
        setForm(f => ({ ...f, images: [...(f.images || []), imgUrl.trim()] }));
        setImgUrl("");
    };
    const removeImage = (i) => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
    const save = () => {
        if (!form.name || !form.price || !form.stock)
            return notify(tt("m_zaroori_fields_bharein"), "error");
        if (existing) {
            update(d => { const p = d.products.find(p => p.id === existing.id); Object.assign(p, { ...form, price: Number(form.price), mrp: Number(form.mrp || form.price), stock: Number(form.stock), approved: false }); });
            notify(tt("m_product_update_ho_gaya_admin"), "success");
        }
        else {
            const p = { id: uid("p"), sellerId: seller.id, name: form.name, category: form.category, price: Number(form.price), mrp: Number(form.mrp || form.price), stock: Number(form.stock), images: form.images || [], approved: false, featured: false, rating: 0, reviews: [], views: 0, desc: form.desc, createdAt: nowISO() };
            update(d => d.products.push(p));
            notify(tt("m_product_add_ho_gaya_admin_ap"), "success");
        }
        setView("seller-products");
    };
    return (<div style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{existing ? "Edit Product" : tt("x_add_product_f06c")}</div><div className="jb-card" style={{ padding: 14 }}><Field label={tt("x_product_name_b9ae")} value={form.name} onChange={set("name")} /><div style={{ marginBottom: 12 }}><span className="jb-label">{tt("ui_category")}</span><select className="jb-input" value={form.category} onChange={set("category")}>{db.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div><div style={{ display: "flex", gap: 8 }}><Field label={tt("x_price_6e2a")} type="number" value={form.price} onChange={set("price")} /><Field label="MRP (₹)" type="number" value={form.mrp} onChange={set("mrp")} /></div><Field label={tt("x_stock_quantity_f766")} type="number" value={form.stock} onChange={set("stock")} /><div style={{ marginBottom: 12 }}><span className="jb-label">{tt("ui_description")}</span><textarea className="jb-input" rows={3} value={form.desc} onChange={set("desc")} style={{ marginBottom: 6 }} /><button className="jb-btn jb-btn-gold" style={{ fontSize: 12 }} disabled={descGenerating} onClick={generateDescFromPhoto}>{descGenerating ? "✨ AI likh raha hai..." : tt("x_photo_se_ai_description__d5f0")}</button></div><div style={{ marginBottom: 12 }}><span className="jb-label">{tt("ui_product_photos_multiple")}</span><div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>{(form.images || []).map((url, i) => (<div key={i} style={{ position: "relative", width: 56, height: 56, borderRadius: 8, background: T.cream, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, overflow: "hidden", border: `1px solid ${T.border}` }}><img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} /><span onClick={() => removeImage(i)} style={{ position: "absolute", top: -4, right: -4, background: T.danger, color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>✕</span></div>))}</div><div style={{ display: "flex", gap: 6 }}><input className="jb-input" placeholder={tt("m_photo_url_paste_karein")} value={imgUrl} onChange={e => setImgUrl(e.target.value)} /><button className="jb-btn jb-btn-outline" onClick={addImage}>{tt("ui_add")}</button></div><div style={{ fontSize: 11, color: "#8a7360", marginTop: 4 }}>{tt("ui_direct_file_upload_firebase_")}</div></div><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={save}>{existing ? "Update Product" : tt("x_submit_for_approval_d50d")}</button></div></div>);
}

export function SellerProducts({ setView, setEditId }) {
    const { t: tt } = useApp();
    const { db, session, update, notify } = useApp();
    const seller = db.sellers.find(s => s.id === (session === null || session === void 0 ? void 0 : session.id));
    const products = db.products.filter(p => p.sellerId === (seller === null || seller === void 0 ? void 0 : seller.id));
    const soldCount = (pid) => db.orders.reduce((a, o) => a + o.items.filter(it => it.productId === pid).reduce((b, it) => b + it.qty, 0), 0);
    const updateStock = (id, stock) => update(d => { d.products.find(p => p.id === id).stock = Math.max(0, Number(stock)); });
    const updatePrice = (id, price) => update(d => { d.products.find(p => p.id === id).price = Math.max(0, Number(price)); });
    const del = (id) => { if (confirm(tt("m_product_delete_karein"))) {
        update(d => { d.products = d.products.filter(p => p.id !== id); });
        notify(tt("m_product_delete_ho_gaya"), "success");
    } };
    const [promoteProduct, setPromoteProduct] = useState(null);
    const [days, setDays] = useState(7);
    const [amount, setAmount] = useState(100);
    const isSponsored = (p) => p.sponsoredUntil && new Date(p.sponsoredUntil) > new Date();
    const pendingAdFor = (pid) => db.adRequests.find(a => a.productId === pid && a.status === "pending");
    const submitPromoteRequest = () => {
        if (!amount || amount <= 0)
            return notify(tt("m_valid_amount_daalein"), "error");
        update(d => {
            d.adRequests.unshift({
                id: uid("ad"), productId: promoteProduct.id, productName: promoteProduct.name, sellerId: seller.id, shopName: seller.shopName,
                days: Number(days), amount: Number(amount), status: "pending", requestedAt: nowISO(),
            });
            d.notifications.unshift({ id: uid("n"), userId: "admin-broadcast", text: `${seller.shopName} ne "${promoteProduct.name}" promote karne ki request bheji hai (${days} din, ₹${amount}).`, at: nowISO(), read: false });
        });
        setPromoteProduct(null);
        notify(tt("m_promote_request_admin_ko_bhe"), "success");
    };
    return (<div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}><div style={{ fontWeight: 700, fontSize: 18 }}>{tt("ui_my_products")}</div><button className="jb-btn jb-btn-primary" onClick={() => { setEditId(null); setView("seller-add-product"); }}>{tt("ui_add_product")}</button></div>{products.length === 0 ? <EmptyState text={tt("x_koi_product_nahi_hai_dbed")} /> : (<div style={{ overflowX: "auto" }} className="jb-scroll"><table className="jb-table"><thead><tr><th>{tt("ui_name")}</th><th>{tt("ui_status")}</th><th>{tt("ui_price")}</th><th>{tt("ui_stock")}</th><th>{tt("ui_views")}</th><th>{tt("ui_sold")}</th><th>{tt("ui_promotion")}</th><th>{tt("ui_actions")}</th></tr></thead><tbody>{products.map(p => (<tr key={p.id}><td>{p.name}</td><td><StatusBadge status={p.approved ? "approved" : "pending"} /></td><td><input className="jb-input" style={{ width: 80 }} type="number" defaultValue={p.price} onBlur={e => updatePrice(p.id, e.target.value)} /></td><td><input className="jb-input" style={{ width: 70 }} type="number" defaultValue={p.stock} onBlur={e => updateStock(p.id, e.target.value)} /></td><td>{p.views || 0}</td><td>{soldCount(p.id)}</td><td>{isSponsored(p) ? (<span className="jb-badge" style={{ background: "#FFE9D6", color: "#A15A1F" }}>{"Sponsored tak "}{new Date(p.sponsoredUntil).toLocaleDateString()}</span>) : pendingAdFor(p.id) ? (<StatusBadge status="pending" />) : (<button className="jb-btn jb-btn-gold" style={{ fontSize: 11, padding: "5px 8px" }} onClick={() => { setPromoteProduct(p); setDays(7); setAmount(100); }}>{tt("x_promote_e79e")}</button>)}</td><td style={{ display: "flex", gap: 6 }}><button className="jb-btn jb-btn-ghost" onClick={() => { setEditId(p.id); setView("seller-add-product"); }}>{tt("ui_edit")}</button><button className="jb-btn jb-btn-ghost" style={{ color: T.danger }} onClick={() => del(p.id)}>{tt("ui_delete")}</button></td></tr>))}</tbody></table></div>)}{promoteProduct && (<Modal onClose={() => setPromoteProduct(null)} width={400}><div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: T.maroonDark }}>📢 Promote "{promoteProduct.name}"</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{tt("x_approve_hone_ke_baad_ye__33c2")}</div><div style={{ marginBottom: 12 }}><span className="jb-label">{tt("ui_kitne_din_ke_liye")}</span><select className="jb-input" value={days} onChange={e => setDays(e.target.value)}><option value={7}>{tt("ui_7_din")}</option><option value={15}>{tt("ui_15_din")}</option><option value={30}>{tt("ui_30_din")}</option></select></div><Field label={tt("x_kitna_paisa_dene_ko_taiy_4075")} type="number" value={amount} onChange={e => setAmount(e.target.value)} /><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={submitPromoteRequest}>{tt("ui_admin_ko_request_bhejein")}</button></Modal>)}</div>);
}

export function SellerOrders() {
    const { t: tt } = useApp();
    const { db, session, update, notify } = useApp();
    const seller = db.sellers.find(s => s.id === (session === null || session === void 0 ? void 0 : session.id));
    const orders = db.orders.filter(o => o.items.some(it => it.sellerId === (seller === null || seller === void 0 ? void 0 : seller.id)));
    const [invoiceOrder, setInvoiceOrder] = useState(null);
    const [detailOrder, setDetailOrder] = useState(null);
    // Seller can only pack the order; admin assigns delivery partner (shipped) and delivery OTP confirms "delivered"
    const markPacked = (o) => update(d => {
        const ord = d.orders.find(x => x.id === o.id);
        ord.status = "packed";
        ord.timeline.push({ status: "packed", at: nowISO() });
        d.notifications.unshift({ id: uid("n"), userId: "admin-broadcast", text: `Order #${o.id.slice(-6)} packed by ${seller.shopName}, ready for delivery partner assignment.`, at: nowISO(), read: false });
    });
    const verifyPayment = (o) => update(d => {
        const ord = d.orders.find(x => x.id === o.id);
        ord.paymentVerified = true;
        ord.timeline.push({ status: "payment-verified (by seller)", at: nowISO() });
    });
    return (<div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_orders")}</div>{orders.length === 0 ? <EmptyState text={tt("x_koi_order_nahi_mila_3408")} /> : orders.map(o => {
            var _a, _b, _c;
            return (<div key={o.id} className="jb-card" style={{ padding: 14, marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between" }}><b>#{o.id.slice(-6)}{" — "}{o.customerName}</b><StatusBadge status={o.status} /></div><div style={{ fontSize: 12, color: "#8a7360" }}>{(_a = o.address) === null || _a === void 0 ? void 0 :
                    _a.city}{", "}{(_b = o.address) === null || _b === void 0 ? void 0 :
                    _b.pincode}</div><div style={{ fontSize: 12, marginTop: 2 }}>{"💳 Payment: "}<b>{(_c = o.payMode) === null || _c === void 0 ? void 0 : _c.toUpperCase()}</b>{o.payMode !== "cod" && (o.paymentVerified ? <span style={{ color: T.success }}>{tt("x_verified_2315")}</span> : <span style={{ color: T.danger }}>{tt("x_pending_verification_2158")}</span>)}</div>{o.payMode !== "cod" && o.paymentRef && <div style={{ fontSize: 11, color: "#8a7360" }}>{"Ref: "}{o.paymentRef}</div>}{o.payMode !== "cod" && o.status === "processing" && (<div style={{ fontSize: 11, color: T.danger, background: "#FDECEA", padding: "4px 8px", borderRadius: 6, marginTop: 4 }}>{tt("x_ye_payment_app_se_automa_8cc1")}</div>)}{o.items.filter(it => it.sellerId === seller.id).map(it => { var _a; return <div key={it.productId} style={{ fontSize: 12 }}>{"• "}{it.name}{" x"}{it.qty}{" = ₹"}{((_a = it.basePrice) !== null && _a !== void 0 ? _a : it.price) * it.qty}</div>; })}{o.deliveryPartner && <div style={{ fontSize: 12, marginTop: 4 }}>{"🛵 Assigned: "}{o.deliveryPartner}</div>}<div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>{o.payMode !== "cod" && !o.paymentVerified && <button className="jb-btn jb-btn-primary" style={{ fontSize: 12, padding: "6px 10px", background: T.success }} onClick={() => verifyPayment(o)}>{tt("x_mark_payment_verified_19db")}</button>}{o.status === "processing" && <button className="jb-btn jb-btn-primary" style={{ fontSize: 12, padding: "6px 10px" }} disabled={o.payMode !== "cod" && !o.paymentVerified} onClick={() => markPacked(o)}>{tt("ui_mark_as_packed")}</button>}{o.status === "packed" && <span style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_admin_dwara_delivery_partner")}</span>}<button className="jb-btn jb-btn-outline" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setInvoiceOrder(o)}>{tt("ui_view_print_invoice")}</button><button className="jb-btn jb-btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setDetailOrder(o)}>{tt("ui_poora_tracking_dekhein")}</button></div></div>);
        })}{invoiceOrder && <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} sellerView={seller} />}<OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} /></div>);
}

export function SellerEarnings() {
    const { t: tt } = useApp();
    const { db, session } = useApp();
    const seller = db.sellers.find(s => s.id === (session === null || session === void 0 ? void 0 : session.id));
    const orders = db.orders.filter(o => o.items.some(it => it.sellerId === (seller === null || seller === void 0 ? void 0 : seller.id)));
    const rows = orders.map(o => {
        const mine = o.items.filter(it => it.sellerId === seller.id);
        const gross = mine.reduce((a, it) => { var _a; return a + ((_a = it.basePrice) !== null && _a !== void 0 ? _a : it.price) * it.qty; }, 0);
        const commission = gross * (seller.commissionPct / 100);
        return { id: o.id, date: o.createdAt, gross, commission, net: gross - commission, status: o.status };
    });
    const totalGross = rows.reduce((a, r) => a + r.gross, 0);
    const totalCommission = rows.reduce((a, r) => a + r.commission, 0);
    const myWithdrawals = db.withdrawals.filter(w => w.sellerId === (seller === null || seller === void 0 ? void 0 : seller.id));
    const pendingWithdrawal = myWithdrawals.filter(w => w.status === "pending").reduce((a, w) => a + w.amount, 0);
    const totalWithdrawn = myWithdrawals.filter(w => w.status === "approved" || w.status === "paid").reduce((a, w) => a + w.amount, 0);
    return (<div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_earnings_commission_report")}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 12 }}><div className="jb-card" style={{ padding: 14 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_gross_sales")}</div><div style={{ fontSize: 20, fontWeight: 700 }}>₹{totalGross.toFixed(0)}</div></div><div className="jb-card" style={{ padding: 14 }}><div style={{ fontSize: 12, color: "#8a7360" }}>Commission ({seller.commissionPct}%)</div><div style={{ fontSize: 20, fontWeight: 700, color: T.danger }}>-₹{totalCommission.toFixed(0)}</div></div><div className="jb-card" style={{ padding: 14 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_net_earnings")}</div><div style={{ fontSize: 20, fontWeight: 700, color: T.success }}>₹{(totalGross - totalCommission).toFixed(0)}</div></div></div><div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: "#8a7360" }}>{tt("ui_wallet_status")}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 16 }}><div className="jb-card" style={{ padding: 14 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_available_withdrawable")}</div><div style={{ fontSize: 20, fontWeight: 700, color: T.success }}>₹{(seller.walletBalance || 0).toFixed(0)}</div></div><div className="jb-card" style={{ padding: 14 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_pending_withdrawal")}</div><div style={{ fontSize: 20, fontWeight: 700, color: T.gold }}>₹{pendingWithdrawal.toFixed(0)}</div></div><div className="jb-card" style={{ padding: 14 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_total_withdrawn_lifetime")}</div><div style={{ fontSize: 20, fontWeight: 700 }}>₹{totalWithdrawn.toFixed(0)}</div></div></div><div style={{ overflowX: "auto" }} className="jb-scroll"><table className="jb-table"><thead><tr><th>{tt("ui_order_2")}</th><th>{tt("ui_date")}</th><th>{tt("ui_gross")}</th><th>{tt("ui_commission")}</th><th>{tt("ui_net")}</th><th>{tt("ui_status")}</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td>#{r.id.slice(-6)}</td><td>{new Date(r.date).toLocaleDateString()}</td><td>₹{r.gross}</td><td>₹{r.commission.toFixed(0)}</td><td>₹{r.net.toFixed(0)}</td><td><StatusBadge status={r.status} /></td></tr>)}</tbody></table></div></div>);
}

export function SellerInventoryAI() {
    const { t: tt } = useApp();
    const { db, session } = useApp();
    const seller = db.sellers.find(s => s.id === (session === null || session === void 0 ? void 0 : session.id));
    const myProducts = db.products.filter(p => p.sellerId === (seller === null || seller === void 0 ? void 0 : seller.id));
    const since30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const relevantOrders = db.orders.filter(o => o.status !== "cancelled" && new Date(o.createdAt).getTime() >= since30);
    const stats = myProducts.map(p => {
        const soldLast30 = relevantOrders.reduce((a, o) => a + o.items.filter(it => it.productId === p.id).reduce((s, it) => s + it.qty, 0), 0);
        const dailyRate = soldLast30 / 30;
        const daysToStockout = dailyRate > 0 ? Math.round(p.stock / dailyRate) : Infinity;
        let movement = "Slow Moving";
        if (soldLast30 === 0)
            movement = "Dead Stock";
        else if (soldLast30 >= 15)
            movement = "Fast Moving";
        const reorderQty = dailyRate > 0 ? Math.max(0, Math.ceil(dailyRate * 30 - p.stock)) : 0;
        return {
            ...p, soldLast30, dailyRate, daysToStockout, movement, reorderQty,
            forecast7: Math.round(dailyRate * 7), forecast30: Math.round(dailyRate * 30), forecast90: Math.round(dailyRate * 90),
        };
    });
    const lowStock = stats.filter(p => p.stock > 0 && p.stock <= 5);
    const outOfStock = stats.filter(p => p.stock <= 0);
    const needsReorder = stats.filter(p => p.daysToStockout !== Infinity && p.daysToStockout <= 14 && p.stock > 0);
    const inventoryValue = myProducts.reduce((a, p) => a + p.stock * p.price, 0);
    const fastMoving = stats.filter(p => p.movement === "Fast Moving").length;
    const deadStock = stats.filter(p => p.movement === "Dead Stock").length;
    // Stock Health Score: zyada out-of-stock/low-stock/dead-stock hone par score kam hota hai (100 = sabse healthy)
    const totalP = Math.max(1, myProducts.length);
    const healthScore = Math.max(0, Math.round(100 - (outOfStock.length / totalP) * 40 - (lowStock.length / totalP) * 20 - (deadStock / totalP) * 20));
    const movementColor = { "Fast Moving": T.success, "Slow Moving": T.gold, "Dead Stock": T.danger };
    return (<div style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{tt("x_ai_inventory_manager_c61a")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{tt("ui_pichhle_30_din_ki_sales_ke_b")}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 16 }}><div className="jb-card" style={{ padding: 14 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_stock_health_score")}</div><div style={{ fontSize: 24, fontWeight: 700, color: healthScore >= 70 ? T.success : healthScore >= 40 ? T.gold : T.danger }}>{healthScore}/100</div></div><div className="jb-card" style={{ padding: 14 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_inventory_value")}</div><div style={{ fontSize: 20, fontWeight: 700 }}>₹{inventoryValue.toFixed(0)}</div></div><div className="jb-card" style={{ padding: 14 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_low_stock_items")}</div><div style={{ fontSize: 20, fontWeight: 700, color: T.danger }}>{lowStock.length}</div></div><div className="jb-card" style={{ padding: 14 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_fast_moving_products")}</div><div style={{ fontSize: 20, fontWeight: 700, color: T.success }}>{fastMoving}</div></div></div>{(outOfStock.length > 0 || needsReorder.length > 0) && (<div className="jb-card" style={{ padding: 14, marginBottom: 16, borderLeft: `4px solid ${T.danger}` }}><div style={{ fontWeight: 700, marginBottom: 8 }}>{tt("x_turant_dhyan_dein_25e5")}</div>{outOfStock.map(p => <div key={p.id} style={{ fontSize: 13, marginBottom: 4 }}>{"❌ "}<b>{p.name}</b>{" — Out of Stock, turant restock karein"}</div>)}{needsReorder.map(p => <div key={p.id} style={{ fontSize: 13, marginBottom: 4 }}>{"⚠️ "}<b>{p.name}</b>{" — sirf "}{p.daysToStockout}{" din ka stock bacha hai. Suggested reorder: "}<b>{p.reorderQty}{" units"}</b></div>)}</div>)}<div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_product_wise_analysis")}</div><div style={{ overflowX: "auto" }} className="jb-scroll"><table className="jb-table"><thead><tr><th>{tt("ui_product")}</th><th>{tt("ui_stock")}</th><th>{tt("ui_sold_30d")}</th><th>{tt("ui_movement")}</th><th>{tt("ui_7_day_forecast")}</th><th>{tt("ui_30_day_forecast")}</th><th>{tt("ui_90_day_forecast")}</th><th>{tt("ui_days_to_stockout")}</th></tr></thead><tbody>{stats.map(p => (<tr key={p.id}><td>{p.name}</td><td>{p.stock}</td><td>{p.soldLast30}</td><td><span style={{ color: movementColor[p.movement], fontWeight: 600 }}>{p.movement}</span></td><td>{p.forecast7}</td><td>{p.forecast30}</td><td>{p.forecast90}</td><td>{p.daysToStockout === Infinity ? "—" : `${p.daysToStockout} din`}</td></tr>))}</tbody></table></div>{stats.length === 0 && <EmptyState icon="📦" text={tt("x_abhi_koi_product_nahi_ha_7065")} subtitle={tt("x_product_add_karne_ke_baa_6914")} />}</div>);
}

export function SellerReviews() {
    const { t: tt } = useApp();
    const { db, session, update, notify } = useApp();
    const seller = db.sellers.find(s => s.id === (session === null || session === void 0 ? void 0 : session.id));
    const products = db.products.filter(p => p.sellerId === (seller === null || seller === void 0 ? void 0 : seller.id) && (p.reviews || []).length > 0);
    const [replyDraft, setReplyDraft] = useState({});
    const submitReply = (productId, reviewId) => {
        const text = replyDraft[reviewId];
        if (!(text === null || text === void 0 ? void 0 : text.trim()))
            return notify(tt("m_reply_likhein"), "error");
        update(d => {
            const p = d.products.find(p => p.id === productId);
            const r = p.reviews.find(r => r.id === reviewId);
            r.sellerReply = text;
        });
        setReplyDraft(s => ({ ...s, [reviewId]: "" }));
        notify(tt("m_reply_post_ho_gaya"), "success");
    };
    return (<div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_product_reviews")}</div>{products.length === 0 ? <EmptyState text={tt("x_abhi_koi_review_nahi_mil_38a1")} /> : products.map(p => (<div key={p.id} className="jb-card" style={{ padding: 14, marginBottom: 12 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{p.name}{" "}<StarRating value={p.rating} /></div>{p.reviews.map(r => (<div key={r.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}><div style={{ display: "flex", justifyContent: "space-between" }}><b style={{ fontSize: 13 }}>{r.user}</b><StarRating value={r.rating} /></div><div style={{ fontSize: 13, color: "#5a4a3a" }}>{r.text}</div>{r.sellerReply ? (<div style={{ fontSize: 12, color: T.maroon, marginTop: 6, background: T.cream, padding: 8, borderRadius: 8 }}>{"Aapka reply: "}{r.sellerReply}</div>) : (<div style={{ display: "flex", gap: 6, marginTop: 6 }}><input className="jb-input" placeholder={tt("m_reply_likhein_")} value={replyDraft[r.id] || ""} onChange={e => setReplyDraft(s => ({ ...s, [r.id]: e.target.value }))} /><button className="jb-btn jb-btn-outline" style={{ fontSize: 12 }} onClick={() => submitReply(p.id, r.id)}>{tt("ui_reply")}</button></div>)}</div>))}</div>))}</div>);
}

export function SellerWithdrawal() {
    const { t: tt } = useApp();
    var _a, _b;
    const { db, session, update, notify } = useApp();
    const seller = db.sellers.find(s => s.id === (session === null || session === void 0 ? void 0 : session.id));
    const [amount, setAmount] = useState("");
    const [showTotp, setShowTotp] = useState(false);
    const myRequests = db.withdrawals.filter(w => w.sellerId === (seller === null || seller === void 0 ? void 0 : seller.id));
    const canWithdraw = ((_a = seller === null || seller === void 0 ? void 0 : seller.bank) === null || _a === void 0 ? void 0 : _a.verified) || ((_b = seller === null || seller === void 0 ? void 0 : seller.upi) === null || _b === void 0 ? void 0 : _b.verified);
    const requestClicked = () => {
        if (!canWithdraw)
            return notify(tt("m_withdrawal_ke_liye_bank_upi_"), "error");
        const amt = Number(amount);
        if (!amt || amt > seller.walletBalance)
            return notify(tt("m_valid_amount_daalein_wallet_"), "error");
        setShowTotp(true);
    };
    const confirmWithdrawal = () => {
        const amt = Number(amount);
        update(d => {
            d.withdrawals.unshift({ id: uid("w"), sellerId: seller.id, shopName: seller.shopName, amount: amt, status: "pending", requestedAt: nowISO() });
            d.sellers.find(s => s.id === seller.id).walletBalance -= amt;
        });
        setAmount("");
        setShowTotp(false);
        notify(tt("m_withdrawal_request_bhej_diya"), "success");
    };
    return (<div style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_withdrawal")}</div><div className="jb-card" style={{ padding: 14, marginBottom: 12 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_available_balance")}</div><div style={{ fontSize: 24, fontWeight: 700, color: T.maroon }}>₹{(seller === null || seller === void 0 ? void 0 : seller.walletBalance) || 0}</div>{!canWithdraw && <div style={{ fontSize: 12, color: T.danger, marginTop: 6 }}>{tt("ui_bank_ya_upi_verify_karein_wi")}</div>}<div style={{ display: "flex", gap: 8, marginTop: 10 }}><input className="jb-input" type="number" placeholder={tt("m_amount")} value={amount} onChange={e => setAmount(e.target.value)} /><button className="jb-btn jb-btn-primary" onClick={requestClicked}>{tt("ui_request")}</button></div></div><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_request_history")}</div>{myRequests.length === 0 ? <EmptyState text={tt("x_koi_withdrawal_request_n_70cc")} /> : myRequests.map(w => (<div key={w.id} className="jb-card" style={{ padding: 12, marginBottom: 8, display: "flex", justifyContent: "space-between" }}><span>₹{w.amount}{" — "}{new Date(w.requestedAt).toLocaleDateString()}</span><StatusBadge status={w.status} /></div>))}{showTotp && (<Modal onClose={() => setShowTotp(false)} width={380}><div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: T.maroonDark }}>{tt("x_withdrawal_verification_5f5d")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 12 }}>₹{amount}{" withdraw karne se pehle apna Google Authenticator code confirm karein."}</div><TotpGate secret={seller.authSecret} mode="verify" accountLabel={seller.shopName} onSuccess={confirmWithdrawal} onCancel={(msg) => { setShowTotp(false); if (msg)
                    notify(msg, "error"); }} /></Modal>)}</div>);
}
