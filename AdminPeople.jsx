import React, { useState } from "react";
import { useApp } from "./AppContext.jsx";
import { T } from "./theme.js";
import { formatSecretForDisplay, generateBase32Secret, isValidIndianMobile } from "./security.js";
import { EmptyState, Field, Modal, PasswordField, StatusBadge } from "./CommonUI.jsx";
import { nowISO, uid } from "./database.js";
import { ADMIN_BASELINE_SECTIONS, adminSections } from "./AdminLayout.jsx";
import { DualSecurityGate } from "./AuthScreens.jsx";
import { callOpenAI, friendlyAIError, parseJSONFromClaude } from "./helpers.js";

export function AdminDashboard() {
    const { t: tt } = useApp();
    const { db } = useApp();
    const totalRevenue = db.orders.filter(o => o.status !== "cancelled").reduce((a, o) => a + o.total, 0);
    const stats = [
        ["Total Users", db.users.filter(u => u.role === "customer").length],
        ["Total Sellers", db.sellers.length],
        ["Pending Seller Approvals", db.sellers.filter(s => s.status === "pending").length],
        ["Total Products", db.products.length],
        ["Pending Product Approvals", db.products.filter(p => !p.approved).length],
        ["Total Orders", db.orders.length],
        ["Total Revenue", `₹${totalRevenue.toFixed(0)}`],
        ["Pending Withdrawals", db.withdrawals.filter(w => w.status === "pending").length],
    ];
    return (<div><div style={{ fontWeight: 700, fontSize: 20, marginBottom: 14 }}>{tt("ui_dashboard")}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 12 }}>{stats.map(([label, val]) => (<div key={label} className="jb-card" style={{ padding: 16 }}><div style={{ fontSize: 12, color: "#8a7360" }}>{label}</div><div style={{ fontSize: 22, fontWeight: 700, color: T.maroon }}>{val}</div></div>))}</div></div>);
}

export function AdminUsers() {
    const { t: tt } = useApp();
    const { db, update, notify, logAudit } = useApp();
    const [editing, setEditing] = useState(null);
    const openEdit = (u) => setEditing({ id: u.id, name: u.name || "", mobile: u.mobile || "", email: u.email || "" });
    const saveEdit = () => {
        const name = editing.name.trim(), mobile = editing.mobile.trim(), email = editing.email.trim();
        if (!name)
            return notify(tt("m_naam_bharein"), "error");
        if (!mobile && !email)
            return notify(tt("m_mobile_ya_email_me_se_kuch_t"), "error");
        if (mobile && !isValidIndianMobile(mobile))
            return notify(tt("m_valid_10_digit_mobile_number"), "error");
        const taken = db.users.some(u => u.id !== editing.id && ((mobile && u.mobile === mobile) || (email && u.email && u.email.toLowerCase() === email.toLowerCase()))) || db.sellers.some(s => mobile && s.mobile === mobile);
        if (taken)
            return notify(tt("m_ye_mobile_email_pehle_se_kis"), "error");
        update(d => { const u = d.users.find(x => x.id === editing.id); u.name = name; u.mobile = mobile; if (email || u.email !== undefined)
            u.email = email; });
        logAudit && logAudit("user-edit", editing.id);
        notify(tt("m_user_update_ho_gaya"), "success");
        setEditing(null);
    };
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_all_users")}</div><div style={{ overflowX: "auto" }} className="jb-scroll"><table className="jb-table"><thead><tr><th>{tt("ui_name")}</th><th>{tt("ui_mobile")}</th><th>{tt("ui_address_2")}</th><th>{tt("ui_location")}</th><th>{tt("ui_orders")}</th><th>{tt("ui_actions")}</th></tr></thead><tbody>{db.users.filter(u => u.role === "customer").map(u => (<tr key={u.id}><td>{u.name}</td><td>{u.mobile}</td><td>{(u.address || []).length}</td><td>{u.location ? <a href={`https://maps.google.com/?q=${u.location.lat},${u.location.lng}`} target="_blank" rel="noopener noreferrer" style={{ color: T.maroon }}>{tt("x_dekhein_e64a")}</a> : "—"}</td><td>{db.orders.filter(o => o.customerId === u.id).length}</td><td style={{ display: "flex", gap: 6 }}><button className="jb-btn jb-btn-ghost" onClick={() => openEdit(u)}>{tt("ui_edit")}</button><button className="jb-btn jb-btn-ghost" style={{ color: T.danger }} onClick={() => { if (confirm(tt("m_user_remove_karein"))) {
                                update(d => d.users = d.users.filter(x => x.id !== u.id));
                                notify(tt("m_user_removed"), "success");
                            } }}>Remove</button></td></tr>))}</tbody></table></div>{editing && (<Modal onClose={() => setEditing(null)} width={380}><div style={{ fontWeight: 700, marginBottom: 10 }}>{tt("ui_edit_user")}</div><Field label={tt("x_name_49ee")} value={editing.name} onChange={e => setEditing(x => ({ ...x, name: e.target.value }))} /><Field label={tt("x_mobile_87d1")} value={editing.mobile} onChange={e => setEditing(x => ({ ...x, mobile: e.target.value }))} /><Field label={tt("x_email_optional_ea59")} value={editing.email} onChange={e => setEditing(x => ({ ...x, email: e.target.value }))} /><div style={{ display: "flex", gap: 8 }}><button className="jb-btn jb-btn-primary" onClick={saveEdit}>{tt("ui_save")}</button><button className="jb-btn jb-btn-ghost" onClick={() => setEditing(null)}>{tt("ui_cancel")}</button></div></Modal>)}</div>);
}

export function AdminResellers() {
    const { t: tt } = useApp();
    const { db, update, notify } = useApp();
    const applicants = db.users.filter(u => u.role === "customer" && u.resellerStatus && u.resellerStatus !== "none");
    const approve = (u) => update(d => {
        const user = d.users.find(x => x.id === u.id);
        const code = "R" + (user.name || "USR").slice(0, 3).toUpperCase() + Math.floor(Math.random() * 9000 + 1000);
        user.isReseller = true;
        user.resellerStatus = "approved";
        user.resellerCode = code;
        user.resellerWalletBalance = user.resellerWalletBalance || 0;
        d.notifications.unshift({ id: uid("n"), userId: u.id, text: "Aapki Reseller application approve ho gayi! Ab Reseller Dashboard use kar sakte hain.", at: nowISO(), read: false });
    });
    const reject = (u) => {
        const reason = prompt(tt("m_reject_karne_ka_reason_batay"));
        if (!reason)
            return;
        update(d => {
            const user = d.users.find(x => x.id === u.id);
            user.isReseller = false;
            user.resellerStatus = "rejected";
            if (user.resellerKyc)
                user.resellerKyc.rejectReason = reason;
            d.notifications.unshift({ id: uid("n"), userId: u.id, text: `Aapki Reseller application reject ho gayi: ${reason}`, at: nowISO(), read: false });
        });
        notify(tt("m_reject_ho_gaya"), "success");
    };
    const revoke = (u) => {
        if (!confirm(tt("mt_x_ka_reseller_status_hataaye").replace("{0}", (u.name))))
            return;
        update(d => { const user = d.users.find(x => x.id === u.id); user.isReseller = false; user.resellerStatus = "none"; });
        notify(tt("m_reseller_status_hata_diya_ga"), "success");
    };
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{tt("ui_reseller_applications")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{tt("ui_kyc_check_karke_approve_reje")}</div>{applicants.length === 0 ? <EmptyState text={tt("x_koi_reseller_application_6cde")} /> : applicants.map(u => {
            var _a, _b, _c;
            return (<div key={u.id} className="jb-card" style={{ padding: 14, marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between" }}><b>{u.name}</b><StatusBadge status={u.resellerStatus === "approved" ? "approved" : u.resellerStatus === "rejected" ? "rejected" : "pending"} /></div><div style={{ fontSize: 12, color: "#8a7360", margin: "4px 0" }}>{u.mobile}{" • PAN: "}{((_a = u.resellerKyc) === null || _a === void 0 ? void 0 : _a.pan) || "—"}{" • Aadhaar: "}{((_b = u.resellerKyc) === null || _b === void 0 ? void 0 : _b.aadhaar) || "—"}</div>{u.resellerStatus === "rejected" && ((_c = u.resellerKyc) === null || _c === void 0 ? void 0 : _c.rejectReason) && <div style={{ fontSize: 12, color: T.danger }}>{"Reason: "}{u.resellerKyc.rejectReason}</div>}{u.resellerCode && <div style={{ fontSize: 12 }}>{"Reseller Code: "}<b>{u.resellerCode}</b>{" • Wallet: ₹"}{u.resellerWalletBalance || 0}</div>}<div style={{ display: "flex", gap: 8, marginTop: 8 }}>{u.resellerStatus === "pending" && <><button className="jb-btn jb-btn-primary" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => { approve(u); notify(tt("m_reseller_approved"), "success"); }}>{tt("ui_approve")}</button><button className="jb-btn jb-btn-danger" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => reject(u)}>{tt("ui_reject")}</button></>}{u.resellerStatus === "approved" && <button className="jb-btn jb-btn-ghost" style={{ fontSize: 12, padding: "6px 10px", color: T.danger }} onClick={() => revoke(u)}>{tt("ui_reseller_status_hataayein")}</button>}</div></div>);
        })}</div>);
}

export function AdminSellers() {
    const { t: tt } = useApp();
    const { db, update, notify, logAudit } = useApp();
    const [editing, setEditing] = useState(null);
    const openEdit = (s) => setEditing({ id: s.id, shopName: s.shopName || "", ownerName: s.ownerName || "", mobile: s.mobile || "", area: s.area || "" });
    const saveEdit = () => {
        const shopName = editing.shopName.trim(), ownerName = editing.ownerName.trim(), mobile = editing.mobile.trim();
        if (!shopName || !ownerName)
            return notify(tt("m_shop_ka_naam_aur_owner_ka_na"), "error");
        if (!isValidIndianMobile(mobile))
            return notify(tt("m_valid_10_digit_mobile_number"), "error");
        if (db.sellers.some(x => x.id !== editing.id && x.mobile === mobile) || db.users.some(u => u.mobile === mobile))
            return notify(tt("m_ye_mobile_pehle_se_kisi_aur_"), "error");
        update(d => { const x = d.sellers.find(v => v.id === editing.id); x.shopName = shopName; x.ownerName = ownerName; x.mobile = mobile; x.area = editing.area.trim(); });
        logAudit && logAudit("seller-edit", editing.id);
        notify(tt("m_seller_update_ho_gaya"), "success");
        setEditing(null);
    };
    const setStatus = (id, status) => {
        update(d => {
            d.sellers.find(s => s.id === id).status = status;
            d.notifications.unshift({ id: uid("n"), userId: id, text: `Aapka seller account ${status === "approved" ? "approve" : status === "blocked" ? "block" : status} kar diya gaya hai.`, at: nowISO(), read: false });
        });
        logAudit("seller-status", `${id} -> ${status}`);
        notify(`Seller ${status}`, "success");
    };
    const verifyKyc = (id, field) => update(d => { const s = d.sellers.find(s => s.id === id); s[field].verified = true; });
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_sellers")}</div>{db.sellers.map(s => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
            return (<div key={s.id} className="jb-card" style={{ padding: 14, marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between" }}><div><b>{s.shopName}</b>{" — "}{s.ownerName}{" ("}{s.mobile})</div><StatusBadge status={s.status} /></div><div style={{ fontSize: 12, color: "#8a7360", margin: "6px 0" }}>{"KYC: "}{((_a = s.kyc) === null || _a === void 0 ? void 0 : _a.verified) ? "✓ Verified" : ((_b = s.kyc) === null || _b === void 0 ? void 0 : _b.pan) ? "Pending review" : "Not submitted"}{" •"}{" "}{((_c = s.kyc) === null || _c === void 0 ? void 0 : _c.gst) && <>{"GST: "}{s.kyc.gst}{" •"}{" "}</>}{"Bank: "}{((_d = s.bank) === null || _d === void 0 ? void 0 : _d.verified) ? "✓ Verified" : ((_e = s.bank) === null || _e === void 0 ? void 0 : _e.accountNo) ? "Pending review" : "Not submitted"}{" •"}{" "}{"UPI: "}{((_f = s.upi) === null || _f === void 0 ? void 0 : _f.verified) ? "✓ Verified" : ((_g = s.upi) === null || _g === void 0 ? void 0 : _g.id) ? "Pending review" : "Not submitted"}</div>{s.location && (<div style={{ fontSize: 12, marginBottom: 6 }}>{"📍 "}<a href={`https://maps.google.com/?q=${s.location.lat},${s.location.lng}`} target="_blank" rel="noopener noreferrer" style={{ color: T.maroon }}>Register location dekhein ({s.location.lat.toFixed(3)}{", "}{s.location.lng.toFixed(3)})</a></div>)}<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button className="jb-btn jb-btn-outline" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => openEdit(s)}>{tt("ui_edit")}</button>{s.status !== "approved" && <button className="jb-btn jb-btn-primary" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setStatus(s.id, "approved")}>{tt("ui_approve")}</button>}{s.status !== "blocked" && <button className="jb-btn jb-btn-danger" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setStatus(s.id, "blocked")}>{tt("ui_block")}</button>}{s.status === "blocked" && <button className="jb-btn jb-btn-outline" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setStatus(s.id, "approved")}>{tt("ui_unblock")}</button>}{((_h = s.kyc) === null || _h === void 0 ? void 0 : _h.pan) && !((_j = s.kyc) === null || _j === void 0 ? void 0 : _j.verified) && <button className="jb-btn jb-btn-outline" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => verifyKyc(s.id, "kyc")}>{tt("ui_verify_kyc")}</button>}{((_k = s.bank) === null || _k === void 0 ? void 0 : _k.accountNo) && !((_l = s.bank) === null || _l === void 0 ? void 0 : _l.verified) && <button className="jb-btn jb-btn-outline" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => verifyKyc(s.id, "bank")}>{tt("ui_verify_bank")}</button>}{((_m = s.upi) === null || _m === void 0 ? void 0 : _m.id) && !((_o = s.upi) === null || _o === void 0 ? void 0 : _o.verified) && <button className="jb-btn jb-btn-outline" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => verifyKyc(s.id, "upi")}>{tt("ui_verify_upi")}</button>}</div></div>);
        })}{editing && (<Modal onClose={() => setEditing(null)} width={380}><div style={{ fontWeight: 700, marginBottom: 10 }}>{tt("ui_edit_seller")}</div><Field label={tt("x_shop_name_9127")} value={editing.shopName} onChange={e => setEditing(x => ({ ...x, shopName: e.target.value }))} /><Field label={tt("x_owner_name_b7db")} value={editing.ownerName} onChange={e => setEditing(x => ({ ...x, ownerName: e.target.value }))} /><Field label={tt("x_mobile_87d1")} value={editing.mobile} onChange={e => setEditing(x => ({ ...x, mobile: e.target.value }))} /><Field label={tt("x_area_deec")} value={editing.area} onChange={e => setEditing(x => ({ ...x, area: e.target.value }))} /><div style={{ display: "flex", gap: 8 }}><button className="jb-btn jb-btn-primary" onClick={saveEdit}>{tt("ui_save")}</button><button className="jb-btn jb-btn-ghost" onClick={() => setEditing(null)}>{tt("ui_cancel")}</button></div></Modal>)}</div>);
}

export function AdminStaff() {
    const { t: tt } = useApp();
    const { db, update, notify, session } = useApp();
    const me = db.users.find(u => u.id === (session === null || session === void 0 ? void 0 : session.id));
    const [form, setForm] = useState({ name: "", mobile: "", password: "", permissions: [] });
    const [newStaffSecret, setNewStaffSecret] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [detailEdit, setDetailEdit] = useState(null);
    // Staff ka password change karna ab isolated aur gated flow hai (details-edit se alag) —
    // Admin ko apna khud ka Authenticator code AUR ek Real SMS OTP dono verify karna hoga tabhi change hoga.
    const [pwChangeFor, setPwChangeFor] = useState(null); // { id, name, newPassword, stage: "enter" | "verify" }
    const saveDetails = () => {
        const name = detailEdit.name.trim(), mobile = detailEdit.mobile.trim();
        if (!name)
            return notify(tt("m_naam_bharein"), "error");
        if (!isValidIndianMobile(mobile))
            return notify(tt("m_valid_10_digit_mobile_number"), "error");
        if (db.users.some(u => u.id !== detailEdit.id && u.mobile === mobile) || db.sellers.some(x => x.mobile === mobile))
            return notify(tt("m_ye_mobile_pehle_se_kisi_aur_"), "error");
        update(d => { const u = d.users.find(x => x.id === detailEdit.id); u.name = name; u.mobile = mobile; });
        notify(tt("m_staff_details_update_ho_gayi"), "success");
        setDetailEdit(null);
    };
    const startPwChange = (s) => setPwChangeFor({ id: s.id, name: s.name, newPassword: "", stage: "enter" });
    const continuePwChange = () => {
        if (!pwChangeFor.newPassword || pwChangeFor.newPassword.length < 6)
            return notify(tt("m_password_kam_se_kam_6_charac"), "error");
        setPwChangeFor(x => ({ ...x, stage: "verify" }));
    };
    const applyStaffPassword = () => {
        update(d => { const u = d.users.find(x => x.id === pwChangeFor.id); if (u)
            u.password = pwChangeFor.newPassword; });
        notify(`${pwChangeFor.name} ka password change ho gaya.`, "success");
        setPwChangeFor(null);
    };
    const staffOnly = db.users.filter(u => u.role === "admin" && u.level !== "super_admin");
    const superAdmins = db.users.filter(u => u.role === "admin" && u.level === "super_admin");
    const togglePerm = (key) => setForm(f => ({ ...f, permissions: f.permissions.includes(key) ? f.permissions.filter(k => k !== key) : [...f.permissions, key] }));
    const add = () => {
        if (!form.name || !form.mobile || !form.password)
            return notify(tt("m_sabhi_fields_bharein"), "error");
        if (!isValidIndianMobile(form.mobile))
            return notify(tt("m_valid_10_digit_mobile_number"), "error");
        if (db.users.some(u => u.mobile === form.mobile))
            return notify(tt("m_ye_mobile_pehle_se_hai"), "error");
        if (form.permissions.length === 0)
            return notify(tt("m_kam_se_kam_ek_permission_sel"), "error");
        const secret = generateBase32Secret();
        update(d => d.users.push({ id: uid("u"), role: "admin", level: "staff", name: form.name, mobile: form.mobile, password: form.password, authSecret: secret, permissions: form.permissions, createdAt: nowISO() }));
        setNewStaffSecret({ name: form.name, secret });
        setForm({ name: "", mobile: "", password: "", permissions: [] });
        notify(tt("m_staff_account_ban_gaya_sirf_"), "success");
    };
    const remove = (id) => {
        if (id === (session === null || session === void 0 ? void 0 : session.id))
            return notify(tt("m_aap_khud_ko_remove_nahi_kar_"), "error");
        if (confirm(tt("m_ye_staff_account_remove_kare")))
            update(d => d.users = d.users.filter(u => u.id !== id));
    };
    const savePermissions = (id) => {
        update(d => { d.users.find(u => u.id === id).permissions = form.permissions; });
        setEditingId(null);
        notify(tt("m_permissions_update_ho_gayi"), "success");
    };
    const startEdit = (s) => { setEditingId(s.id); setForm(f => ({ ...f, permissions: s.permissions || [] })); };
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{tt("ui_admin_staff_management")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 12 }}>{"Sirf "}<b>{tt("ui_ek_super_admin")}</b>{" hota hai — poora system control uske paas hai. Staff ko sirf wahi sections dikhte hain jo unhe assign kiye gaye hain, baaki kuch nahi."}</div><div className="jb-card" style={{ padding: 12, marginBottom: 14, background: T.cream, border: "none" }}><div style={{ fontSize: 12 }}>{"👑 Super Admin: "}<b>{superAdmins.map(s => s.name).join(", ") || "—"}</b></div></div>{newStaffSecret && (<div className="jb-card" style={{ padding: 14, marginBottom: 14, background: T.cream, border: "none" }}><div style={{ fontWeight: 700, marginBottom: 6 }}>{"📱 "}{newStaffSecret.name}{" ke liye Google Authenticator Key"}</div><div style={{ fontSize: 12, marginBottom: 4 }}>{"Ye key "}<b>{newStaffSecret.name}</b>{" ko surakshit tarike se dein — wo apne Google Authenticator app mein \"Enter a setup key\" se (Account: Jila Bazar Admin, Type: Time based) daal ke login kar payenge."}</div><div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1, color: T.maroon, wordBreak: "break-all" }}>{formatSecretForDisplay(newStaffSecret.secret)}</div><button className="jb-btn jb-btn-ghost" style={{ marginTop: 6 }} onClick={() => setNewStaffSecret(null)}>{tt("ui_close_ye_dobara_nahi_dikhega")}</button></div>)}<div style={{ fontWeight: 600, margin: "14px 0 8px" }}>{tt("ui_staff_accounts")}</div>{staffOnly.length === 0 ? <EmptyState text={tt("x_abhi_koi_staff_account_n_e0c5")} /> : staffOnly.map(s => (<div key={s.id} className="jb-card" style={{ padding: 12, marginBottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span>{s.name}{" — "}{s.mobile}</span><div style={{ display: "flex", gap: 6 }}><button className="jb-btn jb-btn-outline" style={{ fontSize: 12 }} onClick={() => setDetailEdit({ id: s.id, name: s.name, mobile: s.mobile })}>{tt("ui_details_edit")}</button><button className="jb-btn jb-btn-outline" style={{ fontSize: 12 }} onClick={() => startEdit(s)}>{tt("ui_permissions_edit")}</button><button className="jb-btn jb-btn-outline" style={{ fontSize: 12 }} onClick={() => startPwChange(s)}>🔑 Password Badlein</button><button className="jb-btn jb-btn-ghost" style={{ color: T.danger }} onClick={() => remove(s.id)}>{tt("ui_remove")}</button></div></div><div style={{ fontSize: 11, color: "#8a7360", marginTop: 6 }}>{"Access: "}{(s.permissions || []).length === 0 ? "Koi nahi" : (s.permissions || []).map(p => { var _a; return (_a = adminSections(tt).find(([k]) => k === p)) === null || _a === void 0 ? void 0 : _a[1]; }).filter(Boolean).join(", ")}</div>{editingId === s.id && (<div style={{ marginTop: 10, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 6, marginBottom: 10 }}>{adminSections(tt).filter(([k]) => !ADMIN_BASELINE_SECTIONS.includes(k) && k !== "admin-staff" && k !== "admin-aisettings" && k !== "admin-security").map(([k, label]) => (<label key={k} style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={form.permissions.includes(k)} onChange={() => togglePerm(k)} />{" "}{label}</label>))}</div><button className="jb-btn jb-btn-primary" style={{ fontSize: 12 }} onClick={() => savePermissions(s.id)}>{tt("ui_save_permissions")}</button><button className="jb-btn jb-btn-ghost" style={{ fontSize: 12 }} onClick={() => setEditingId(null)}>{tt("ui_cancel")}</button></div>)}</div>))}<div className="jb-card" style={{ padding: 14, marginTop: 16 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_naya_staff_account_banayein")}</div><Field label={tt("x_name_49ee")} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /><Field label={tt("x_mobile_87d1")} value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} /><PasswordField label={tt("x_password_dc64")} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /><div style={{ marginBottom: 12 }}><span className="jb-label">{tt("ui_kaunse_sections_ka_access_de")}</span><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 6, marginTop: 6 }}>{adminSections(tt).filter(([k]) => !ADMIN_BASELINE_SECTIONS.includes(k) && k !== "admin-staff" && k !== "admin-aisettings" && k !== "admin-security").map(([k, label]) => (<label key={k} style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={form.permissions.includes(k)} onChange={() => togglePerm(k)} />{" "}{label}</label>))}</div></div><button className="jb-btn jb-btn-primary" onClick={add}>{tt("ui_create_staff_account")}</button></div>{detailEdit && (<Modal onClose={() => setDetailEdit(null)} width={380}><div style={{ fontWeight: 700, marginBottom: 10 }}>{tt("ui_edit_staff_details")}</div><Field label={tt("x_name_49ee")} value={detailEdit.name} onChange={e => setDetailEdit(x => ({ ...x, name: e.target.value }))} /><Field label={tt("x_mobile_87d1")} value={detailEdit.mobile} onChange={e => setDetailEdit(x => ({ ...x, mobile: e.target.value }))} /><div style={{ display: "flex", gap: 8 }}><button className="jb-btn jb-btn-primary" onClick={saveDetails}>{tt("ui_save")}</button><button className="jb-btn jb-btn-ghost" onClick={() => setDetailEdit(null)}>{tt("ui_cancel")}</button></div></Modal>)}{pwChangeFor && (<Modal onClose={() => setPwChangeFor(null)} width={380}><div style={{ fontWeight: 700, marginBottom: 10 }}>{"🔑 "}{pwChangeFor.name}{" ka password change karein"}</div>{pwChangeFor.stage === "enter" ? (<><PasswordField label="Naya Password (kam se kam 6 characters)" value={pwChangeFor.newPassword} onChange={e => setPwChangeFor(x => ({ ...x, newPassword: e.target.value }))} /><div style={{ fontSize: 11, color: "#8a7360", marginBottom: 10 }}>Aage badhne par aapko apna (Admin ka) Authenticator code aur mobile par aaya real SMS OTP verify karna hoga.</div><div style={{ display: "flex", gap: 8 }}><button className="jb-btn jb-btn-primary" onClick={continuePwChange}>Aage Badhein</button><button className="jb-btn jb-btn-ghost" onClick={() => setPwChangeFor(null)}>{tt("ui_cancel")}</button></div></>) : (<DualSecurityGate authSecret={me === null || me === void 0 ? void 0 : me.authSecret} mobile={me === null || me === void 0 ? void 0 : me.mobile} accountLabel={me === null || me === void 0 ? void 0 : me.name} purpose="staff-password-change" onSuccess={applyStaffPassword} onCancel={(msg) => { setPwChangeFor(null); if (msg)
                    notify(msg, "error"); }} />)}</Modal>)}</div>);
}

export function AdminFraudCheck() {
    const { t: tt } = useApp();
    const { db, notify } = useApp();
    const [scanning, setScanning] = useState(false);
    const [flags, setFlags] = useState(null);
    const runScan = async () => {
        setScanning(true);
        setFlags(null);
        try {
            const sellersSummary = db.sellers.map(s => { var _a; return `${s.shopName} (${s.id}): status=${s.status}, commissionPct=${s.commissionPct}, walletBalance=₹${s.walletBalance}, KYC verified=${(_a = s.kyc) === null || _a === void 0 ? void 0 : _a.verified}, created=${s.createdAt}`; }).join("\n");
            const ordersSummary = db.orders.slice(0, 60).map(o => `Order ${o.id.slice(-6)}: customer=${o.customerName}, total=₹${o.total}, status=${o.status}, payMode=${o.payMode}, items=${o.items.length}, date=${o.createdAt}`).join("\n");
            const withdrawalsSummary = db.withdrawals.map(w => `${w.shopName}: ₹${w.amount}, status=${w.status}, at=${w.requestedAt}`).join("\n");
            const prompt = `Aap ek e-commerce marketplace ke liye fraud-detection assistant hain. Neeche diye gaye data mein suspicious patterns dhoondein — jaise: bahut naye seller ka achanak bahut bada order/withdrawal, unusual repeat orders same customer se same din, withdrawal amount jo wallet se zyada lage, ya koi aur anomaly.

Sellers:
${sellersSummary || "(koi seller nahi)"}

Recent Orders:
${ordersSummary || "(koi order nahi)"}

Withdrawals:
${withdrawalsSummary || "(koi withdrawal nahi)"}

Respond with ONLY a JSON array of flags, each { "severity": "high"|"medium"|"low", "subject": "kis seller/order ke baare mein", "reason": "kyun suspicious lagta hai (Hinglish mein, 1 sentence)" }. Agar kuch suspicious na mile, khaali array [] bhejein.`;
            const text = await callOpenAI(prompt, db.openaiApiKey, 900);
            const parsed = parseJSONFromClaude(text);
            setFlags(Array.isArray(parsed) ? parsed : []);
        }
        catch (e) {
            notify(friendlyAIError(e), "error");
            setFlags(null); // scan failed — leave as "not scanned", not "clean", to avoid a false sense of safety
        }
        finally {
            setScanning(false);
        }
    };
    const sevColor = { high: T.danger, medium: "#A15A1F", low: "#8a7360" };
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{tt("x_ai_fraud_detection_4b1e")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{tt("ui_sellers_orders_aur_withdrawa")}</div><button className="jb-btn jb-btn-primary" disabled={scanning} onClick={runScan}>{scanning ? "Scan ho raha hai..." : tt("x_scan_chalayein_16d1")}</button>{flags && (<div style={{ marginTop: 16 }}>{flags.length === 0 ? <EmptyState text={tt("x_koi_suspicious_activity__a505")} /> : flags.map((f, i) => (<div key={i} className="jb-card" style={{ padding: 12, marginBottom: 8, borderLeft: `4px solid ${sevColor[f.severity] || T.border}` }}><div style={{ display: "flex", justifyContent: "space-between" }}><b style={{ fontSize: 13 }}>{f.subject}</b><span className="jb-badge" style={{ background: `${sevColor[f.severity]}22`, color: sevColor[f.severity] }}>{f.severity}</span></div><div style={{ fontSize: 12, color: "#5a4a3a", marginTop: 4 }}>{f.reason}</div></div>))}</div>)}</div>);
}
