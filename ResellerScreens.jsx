import React, { useState } from "react";
import { useApp } from "./AppContext.jsx";
import { nowISO, uid } from "./database.js";
import { EmptyState, Field, Modal, StatusBadge } from "./CommonUI.jsx";
import { T } from "./theme.js";
import { effectivePrice } from "./helpers.js";
import { ConfirmationCodeGate, TotpGate } from "./AuthScreens.jsx";

export function ResellerApply({ setView }) {
    const { t: tt } = useApp();
    var _a;
    const { db, session, update, notify } = useApp();
    const user = db.users.find(u => u.id === (session === null || session === void 0 ? void 0 : session.id));
    const [pan, setPan] = useState("");
    const [aadhaar, setAadhaar] = useState("");
    const [agreed, setAgreed] = useState(false);
    const submit = () => {
        if (!pan || !aadhaar)
            return notify(tt("m_pan_aur_aadhaar_bharein"), "error");
        if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(pan.trim().toUpperCase()))
            return notify(tt("m_pan_number_ka_format_galat_h"), "error");
        const aadhaarDigits = aadhaar.replace(/[\s-]/g, "");
        if (!/^\d{12}$/.test(aadhaarDigits))
            return notify(tt("m_aadhaar_number_12_digit_ka_h"), "error");
        if (!agreed)
            return notify(tt("m_reseller_agreement_accept_ka"), "error");
        update(d => {
            const u = d.users.find(u => u.id === session.id);
            u.resellerStatus = "pending";
            u.resellerKyc = { pan: pan.trim().toUpperCase(), aadhaar: aadhaarDigits, agreedAt: nowISO(), rejectReason: null };
            d.notifications.unshift({ id: uid("n"), userId: "admin-broadcast", text: `${u.name} ne Reseller banne ke liye apply kiya hai (KYC review chahiye).`, at: nowISO(), read: false });
        });
        notify(tt("m_application_submit_ho_gayi_a"), "success");
        setView("profile");
    };
    return (<div style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_reseller_banne_ke_liye_apply")}</div><div className="jb-card" style={{ padding: 14, marginBottom: 14 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_kyc_documents")}</div><Field label={tt("x_pan_number_ab5f")} value={pan} onChange={e => setPan(e.target.value)} placeholder="ABCDE1234F" maxLength={10} /><Field label={tt("x_aadhaar_number_c031")} value={aadhaar} onChange={e => setAadhaar(e.target.value)} placeholder="XXXX-XXXX-XXXX" maxLength={14} /></div><div className="jb-card" style={{ padding: 14, marginBottom: 14 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_reseller_agreement")}</div><div style={{ fontSize: 12, color: "#5a4a3a", whiteSpace: "pre-wrap", maxHeight: 180, overflowY: "auto", marginBottom: 10, background: T.cream, padding: 10, borderRadius: 8 }} className="jb-scroll">{((_a = db.sitePages) === null || _a === void 0 ? void 0 : _a.resellerTerms) || tt("x_terms_abhi_available_nah_2b6f")}</div><label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, cursor: "pointer" }}><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2 }} />Maine upar diye gaye Reseller Agreement ko padh liya hai aur maanta hoon.</label></div><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={submit}>{tt("ui_application_submit_karein")}</button><div style={{ fontSize: 11, color: "#8a7360", marginTop: 8, textAlign: "center" }}>{tt("ui_admin_approve_karne_ke_baad_")}</div></div>);
}

export function ResellerDashboard({ setView, setActiveProduct }) {
    const { t: tt } = useApp();
    const { db, session, update, notify } = useApp();
    const user = db.users.find(u => u.id === (session === null || session === void 0 ? void 0 : session.id));
    const myListings = db.resellerListings.filter(r => r.resellerId === (session === null || session === void 0 ? void 0 : session.id));
    const allProducts = db.products.filter(p => p.approved);
    const [browsing, setBrowsing] = useState(false);
    const [priceInputs, setPriceInputs] = useState({});
    const myOrders = db.orders.filter(o => o.items.some(it => it.resellerId === (session === null || session === void 0 ? void 0 : session.id)));
    if (!(user === null || user === void 0 ? void 0 : user.isReseller))
        return <EmptyState text={tt("x_aap_abhi_approved_resell_a534")} />;
    const totalEarnings = myOrders.reduce((a, o) => a + o.items.filter(it => it.resellerId === session.id).reduce((b, it) => b + (it.resellerMargin || 0) * it.qty, 0), 0);
    const listProduct = (product) => {
        const price = Number(priceInputs[product.id]);
        if (!price || price < effectivePrice(product))
            return notify(tt("mt_price_kam_se_kam_x_honi_chah").replace("{0}", (effectivePrice(product))), "error");
        update(d => {
            d.resellerListings.push({ id: uid("rl"), resellerId: session.id, productId: product.id, resellerPrice: price, createdAt: nowISO() });
        });
        notify(tt("m_product_list_ho_gaya_aapke_s"), "success");
    };
    const unlist = (id) => update(d => { d.resellerListings = d.resellerListings.filter(r => r.id !== id); });
    const shareLink = (listing) => {
        const product = db.products.find(p => p.id === listing.productId);
        const link = `${window.location.origin}${window.location.pathname}?ref=${user.resellerCode}&pid=${listing.productId}`;
        const msg = `${product === null || product === void 0 ? void 0 : product.name}\n₹${listing.resellerPrice}\n\nDekhein aur order karein:\n${link}`;
        return { link, msg };
    };
    return (<div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}><div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{tt("x_reseller_dashboard_04af")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 16 }}>{"Aapka Reseller Code: "}<b>{user.resellerCode}</b></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 12, marginBottom: 18 }}><div className="jb-card" style={{ padding: 14 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_wallet_balance")}</div><div style={{ fontSize: 20, fontWeight: 700, color: T.maroon }}>₹{user.resellerWalletBalance || 0}</div></div><div className="jb-card" style={{ padding: 14 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_total_earnings")}</div><div style={{ fontSize: 20, fontWeight: 700, color: T.success }}>₹{totalEarnings.toFixed(0)}</div></div><div className="jb-card" style={{ padding: 14 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_my_listings")}</div><div style={{ fontSize: 20, fontWeight: 700 }}>{myListings.length}</div></div><div className="jb-card" style={{ padding: 14, cursor: "pointer" }} onClick={() => setView("reseller-withdrawal")}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("x_withdrawal_ab74")}</div></div></div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><div style={{ fontWeight: 700 }}>{tt("ui_meri_listings")}</div><button className="jb-btn jb-btn-primary" onClick={() => setBrowsing(b => !b)}>{browsing ? "Close" : tt("x_naya_product_list_karein_9ca7")}</button></div>{browsing && (<div className="jb-card" style={{ padding: 14, marginBottom: 16 }}><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 10 }}>{tt("ui_product_chunein_aur_apni_pri")}</div><div style={{ maxHeight: 320, overflowY: "auto" }} className="jb-scroll">{allProducts.filter(p => !myListings.some(l => l.productId === p.id)).map(p => (<div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${T.border}` }}><div style={{ flex: 1, fontSize: 13 }}>{p.name}{" "}<span style={{ color: "#8a7360" }}>(Original: ₹{effectivePrice(p)})</span></div><input className="jb-input" style={{ width: 90 }} type="number" placeholder={tt("m_aapka_price")} value={priceInputs[p.id] || ""} onChange={e => setPriceInputs(s => ({ ...s, [p.id]: e.target.value }))} /><button className="jb-btn jb-btn-gold" style={{ fontSize: 12 }} onClick={() => listProduct(p)}>{tt("ui_list_karein")}</button></div>))}</div></div>)}{myListings.length === 0 ? <EmptyState text={tt("x_abhi_koi_product_list_na_17f1")} /> : myListings.map(l => {
            const product = db.products.find(p => p.id === l.productId);
            if (!product)
                return null;
            const margin = l.resellerPrice - effectivePrice(product);
            const { link, msg } = shareLink(l);
            return (<div key={l.id} className="jb-card" style={{ padding: 14, marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between" }}><b>{product.name}</b><button className="jb-btn jb-btn-ghost" style={{ color: T.danger, fontSize: 12 }} onClick={() => unlist(l.id)}>{tt("ui_remove")}</button></div><div style={{ fontSize: 12, color: "#8a7360", margin: "4px 0" }}>Aapka price: ₹{l.resellerPrice}{" • Margin: "}<span style={{ color: T.success, fontWeight: 600 }}>₹{margin}</span>{" per sale"}</div><div style={{ display: "flex", gap: 8, marginTop: 8 }}><button className="jb-btn jb-btn-outline" style={{ fontSize: 12 }} onClick={() => { var _a; (_a = navigator.clipboard) === null || _a === void 0 ? void 0 : _a.writeText(link); notify(tt("m_link_copy_ho_gaya"), "success"); }}>{tt("ui_copy_link")}</button><button className="jb-btn" style={{ background: "#25D366", color: "#fff", fontSize: 12 }} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank")}>{tt("x_whatsapp_dc39")}</button></div></div>);
        })}</div>);
}

export function ResellerWithdrawal() {
    const { t: tt } = useApp();
    const { db, session, update, notify } = useApp();
    const user = db.users.find(u => u.id === (session === null || session === void 0 ? void 0 : session.id));
    const [amount, setAmount] = useState("");
    const [showVerify, setShowVerify] = useState(false);
    const myRequests = db.withdrawals.filter(w => w.resellerId === (session === null || session === void 0 ? void 0 : session.id));
    const requestClicked = () => {
        const amt = Number(amount);
        if (!amt || amt > (user.resellerWalletBalance || 0))
            return notify(tt("m_valid_amount_daalein_wallet_"), "error");
        setShowVerify(true); // Withdrawal verification is ALWAYS required — real 2FA if enabled, confirmation code otherwise.
    };
    const confirmWithdrawal = () => {
        const amt = Number(amount);
        update(d => {
            d.withdrawals.unshift({ id: uid("w"), resellerId: user.id, shopName: `${user.name} (Reseller)`, amount: amt, status: "pending", requestedAt: nowISO(), type: "reseller" });
            d.users.find(u => u.id === user.id).resellerWalletBalance -= amt;
        });
        setAmount("");
        setShowVerify(false);
        notify(tt("m_withdrawal_request_bhej_diya"), "success");
    };
    return (<div style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_reseller_withdrawal")}</div><div className="jb-card" style={{ padding: 14, marginBottom: 12 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_available_balance")}</div><div style={{ fontSize: 24, fontWeight: 700, color: T.maroon }}>₹{(user === null || user === void 0 ? void 0 : user.resellerWalletBalance) || 0}</div><div style={{ display: "flex", gap: 8, marginTop: 10 }}><input className="jb-input" type="number" placeholder={tt("m_amount")} value={amount} onChange={e => setAmount(e.target.value)} /><button className="jb-btn jb-btn-primary" onClick={requestClicked}>{tt("ui_request")}</button></div></div><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_request_history")}</div>{myRequests.length === 0 ? <EmptyState text={tt("x_koi_withdrawal_request_n_70cc")} /> : myRequests.map(w => (<div key={w.id} className="jb-card" style={{ padding: 12, marginBottom: 8, display: "flex", justifyContent: "space-between" }}><span>₹{w.amount}{" — "}{new Date(w.requestedAt).toLocaleDateString()}</span><StatusBadge status={w.status} /></div>))}{showVerify && (<Modal onClose={() => setShowVerify(false)} width={380}><div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: T.maroonDark }}>{tt("x_withdrawal_verification_5f5d")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 12 }}>₹{amount}{" withdraw karne se pehle verify karein."}</div>{user.authSecret ? (<TotpGate secret={user.authSecret} mode="verify" accountLabel={user.name} onSuccess={confirmWithdrawal} onCancel={(msg) => { setShowVerify(false); if (msg)
                    notify(msg, "error"); }} />) : (<ConfirmationCodeGate purpose="withdrawal" onSuccess={confirmWithdrawal} onCancel={(msg) => { setShowVerify(false); if (msg)
                    notify(msg, "error"); }} />)}</Modal>)}</div>);
}
