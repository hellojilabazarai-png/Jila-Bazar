import React, { useState } from "react";
import { useApp } from "./AppContext.jsx";
import { I18N } from "./translations.js";
import { COMING_SOON_FEATURES, csOn } from "./ComingSoon.jsx";
import { T } from "./theme.js";
import { EmptyState, Field, Modal, PasswordField, StatusBadge } from "./CommonUI.jsx";
import { DEFAULT_FAQS } from "./CustomerScreens.jsx";
import { isValidIndianMobile } from "./security.js";
import { DualSecurityGate } from "./AuthScreens.jsx";

export function AdminTexts() {
    const { t: tt } = useApp();
    const { db, update, notify } = useApp();
    const [langTab, setLangTab] = useState("hi");
    const [q, setQ] = useState("");
    const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(db.i18nOverrides || {})));
    const langNames = { hi: "हिंदी", en: "English", bn: "বাংলা" };
    const keys = Object.keys(I18N.hi).filter(k => {
        const s = q.trim().toLowerCase();
        if (!s)
            return true;
        return k.toLowerCase().includes(s) || (I18N[langTab][k] || "").toLowerCase().includes(s) || ((draft[langTab] || {})[k] || "").toLowerCase().includes(s);
    });
    const setVal = (k, v) => setDraft(d => ({ ...d, [langTab]: { ...(d[langTab] || {}), [k]: v } }));
    const saveAll = () => {
        const clean = {};
        Object.keys(draft).forEach(l => { Object.keys(draft[l] || {}).forEach(k => { const v = (draft[l][k] || "").trim(); if (v && v !== I18N[l][k]) { clean[l] = clean[l] || {}; clean[l][k] = v; } }); });
        update(d => { d.i18nOverrides = clean; });
        setDraft(clean);
        notify(tt("m_app_texts_update_ho_gaye"), "success");
    };
    const resetAll = () => { if (confirm(tt("m_saare_custom_texts_hata_kar_"))) {
        update(d => { d.i18nOverrides = {}; });
        setDraft({});
        notify(tt("m_original_texts_wapas_aa_gaye"), "success");
    } };
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{tt("ui_app_texts_language_editor")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 12 }}>{tt("ui_app_ke_buttons_labels_aur_me")}</div><div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>{["hi", "en", "bn"].map(l => <div key={l} className={`jb-tab ${langTab === l ? "active" : ""}`} onClick={() => setLangTab(l)}>{langNames[l]}</div>)}<input className="jb-input" style={{ maxWidth: 220 }} placeholder={tt("m_search")} value={q} onChange={e => setQ(e.target.value)} /></div><div className="jb-card" style={{ padding: 12, marginBottom: 12 }}>{keys.map(k => (<div key={k} style={{ marginBottom: 10 }}><div style={{ fontSize: 11, color: "#8a7360" }}>{k}</div><input className="jb-input" value={(draft[langTab] || {})[k] ?? ""} placeholder={I18N[langTab][k]} onChange={e => setVal(k, e.target.value)} /></div>))}</div><div style={{ display: "flex", gap: 8 }}><button className="jb-btn jb-btn-primary" onClick={saveAll}>{tt("ui_save_texts")}</button><button className="jb-btn jb-btn-ghost" onClick={resetAll}>{tt("ui_sab_original_par_reset")}</button></div></div>);
}

export function AdminComingSoon() {
    const { t: tt } = useApp();
    const { db, update, notify } = useApp();
    const [msg, setMsg] = useState((db.comingSoon && db.comingSoon.message) || "");
    const toggleFeature = (key) => update(d => { d.comingSoon = d.comingSoon || { features: {}, message: "" }; d.comingSoon.features = d.comingSoon.features || {}; d.comingSoon.features[key] = !d.comingSoon.features[key]; });
    const toggleProduct = (id) => update(d => { const p = d.products.find(x => x.id === id); p.comingSoon = !p.comingSoon; });
    const saveMsg = () => { update(d => { d.comingSoon = d.comingSoon || { features: {}, message: "" }; d.comingSoon.message = msg; }); notify(tt("m_coming_soon_message_save_ho_"), "success"); };
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{tt("ui_coming_soon_control")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{tt("x_jo_feature_ya_product_ab_7e9c")}</div><div className="jb-card" style={{ padding: 14, marginBottom: 14 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_features_screens")}</div>{COMING_SOON_FEATURES.map(([k, label]) => (<label key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}><input type="checkbox" checked={csOn(db, k)} onChange={() => toggleFeature(k)} /><span style={{ flex: 1 }}>{tt("cs_" + k)}</span>{csOn(db, k) && <span style={{ fontSize: 11, color: T.maroon, fontWeight: 700 }}>{tt("x_coming_soon_6d6d")}</span>}</label>))}</div><div className="jb-card" style={{ padding: 14, marginBottom: 14, maxWidth: 480 }}><div style={{ fontWeight: 600, marginBottom: 6 }}>{tt("ui_coming_soon_message_optional")}</div><textarea className="jb-input" rows={2} value={msg} onChange={e => setMsg(e.target.value)} placeholder={tt("m_khaali_chhodne_par_default_m")} /><button className="jb-btn jb-btn-primary" style={{ marginTop: 8 }} onClick={saveMsg}>{tt("ui_save_message")}</button></div><div className="jb-card" style={{ padding: 14 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_products")}</div>{db.products.length === 0 ? <EmptyState text={tt("x_koi_product_nahi_hai_dbed")} /> : db.products.map(p => (<label key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}><input type="checkbox" checked={!!p.comingSoon} onChange={() => toggleProduct(p.id)} /><span style={{ flex: 1 }}>{p.name}</span>{p.comingSoon && <span style={{ fontSize: 11, color: T.maroon, fontWeight: 700 }}>{tt("x_coming_soon_6d6d")}</span>}</label>))}</div></div>);
}

export function AdminHelp() {
    const { t: tt } = useApp();
    const { db, update, notify } = useApp();
    const [faqs, setFaqs] = useState(() => JSON.parse(JSON.stringify(Array.isArray(db.helpFaqs) ? db.helpFaqs : DEFAULT_FAQS)));
    const [supportNum, setSupportNum] = useState(db.supportWhatsapp || "");
    const [waMsg, setWaMsg] = useState(db.helpWhatsappMsg || "");
    const [links, setLinks] = useState({ orders: true, about: true, terms: true, privacy: true, ...(db.helpLinks || {}) });
    const [langTab, setLangTab] = useState("hi");
    const langNames = { hi: "हिंदी", en: "English", bn: "বাংলা" };
    const setField = (i, field, v) => setFaqs(list => list.map((f, idx) => idx === i ? { ...f, [field]: v } : f));
    const move = (i, dir) => setFaqs(list => { const j = i + dir; if (j < 0 || j >= list.length) return list; const c = [...list]; [c[i], c[j]] = [c[j], c[i]]; return c; });
    const remove = (i) => { if (confirm(tt("m_ye_faq_delete_karein"))) setFaqs(list => list.filter((_, idx) => idx !== i)); };
    const addFaq = () => setFaqs(list => [...list, { q_hi: "", a_hi: "", q_en: "", a_en: "", q_bn: "", a_bn: "" }]);
    const saveAll = () => {
        if (supportNum && !isValidIndianMobile(supportNum))
            return notify(tt("m_valid_10_digit_mobile_number"), "error");
        const clean = faqs.filter(f => (f.q_hi || f.q_en || f.q_bn || "").trim());
        update(d => { d.helpFaqs = clean; d.supportWhatsapp = supportNum; d.helpWhatsappMsg = waMsg; d.helpLinks = links; });
        setFaqs(clean);
        notify(tt("m_help_support_update_ho_gaya"), "success");
    };
    const resetDefaults = () => { if (confirm(tt("m_saare_faqs_default_par_wapas")))
        setFaqs(JSON.parse(JSON.stringify(DEFAULT_FAQS))); };
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{tt("ui_help_support_management")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{tt("ui_customer_app_ke_help_screen_")}</div><div className="jb-card" style={{ padding: 14, marginBottom: 14, maxWidth: 480 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("x_whatsapp_support_44c6")}</div><Field label={tt("x_support_mobile_number_7ea7")} value={supportNum} onChange={e => setSupportNum(e.target.value)} placeholder={tt("m_10_digit_mobile")} /><label style={{ fontSize: 12, fontWeight: 600 }}>{tt("ui_whatsapp_par_pehle_se_likha_")}</label><textarea className="jb-input" rows={2} value={waMsg} onChange={e => setWaMsg(e.target.value)} placeholder={tt("m_khaali_chhodne_par_default_m_")} /></div><div className="jb-card" style={{ padding: 14, marginBottom: 14, maxWidth: 480 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_quick_links_help_page_par_di")}</div>{[["orders", tt("x_mere_orders_e007")], ["about", tt("x_about_us_9e66")], ["terms", tt("x_terms_6f1b")], ["privacy", tt("x_privacy_c5f2")]].map(([k, label]) => (<label key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 4 }}><input type="checkbox" checked={!!links[k]} onChange={e => setLinks(l => ({ ...l, [k]: e.target.checked }))} />{label}</label>))}</div><div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}><div style={{ fontWeight: 600 }}>{tt("ui_faqs")}</div>{["hi", "en", "bn"].map(l => <div key={l} className={`jb-tab ${langTab === l ? "active" : ""}`} onClick={() => setLangTab(l)}>{langNames[l]}</div>)}</div>{faqs.map((f, i) => (<div key={i} className="jb-card" style={{ padding: 12, marginBottom: 10 }}><div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginBottom: 6 }}><button className="jb-btn jb-btn-ghost" style={{ fontSize: 12, padding: "4px 8px" }} onClick={() => move(i, -1)}>↑</button><button className="jb-btn jb-btn-ghost" style={{ fontSize: 12, padding: "4px 8px" }} onClick={() => move(i, 1)}>↓</button><button className="jb-btn jb-btn-ghost" style={{ fontSize: 12, padding: "4px 8px", color: T.danger }} onClick={() => remove(i)}>{tt("ui_delete")}</button></div><input className="jb-input" style={{ marginBottom: 6 }} placeholder={`Sawal (${langNames[langTab]})`} value={f["q_" + langTab] || ""} onChange={e => setField(i, "q_" + langTab, e.target.value)} /><textarea className="jb-input" rows={3} placeholder={`Jawab (${langNames[langTab]})`} value={f["a_" + langTab] || ""} onChange={e => setField(i, "a_" + langTab, e.target.value)} /></div>))}<div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}><button className="jb-btn jb-btn-outline" onClick={addFaq}>{tt("ui_naya_faq")}</button><button className="jb-btn jb-btn-ghost" onClick={resetDefaults}>{tt("ui_default_par_reset")}</button><button className="jb-btn jb-btn-primary" onClick={saveAll}>{tt("ui_save_help_support")}</button></div></div>);
}

export function AdminAISettings() {
    const { t: tt } = useApp();
    const { db, update, notify } = useApp();
    const [key, setKey] = useState(db.openaiApiKey || "");
    const [show, setShow] = useState(false);
    const save = () => {
        update(d => { d.openaiApiKey = key.trim(); });
        notify(tt("m_openai_api_key_save_ho_gayi"), "success");
    };
    const clear = () => {
        setKey("");
        update(d => { d.openaiApiKey = ""; });
        notify(tt("m_api_key_hata_di_gayi_ai_feat"), "success");
    };
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{tt("x_ai_settings_openai_84b2")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{tt("x_ai_search_product_descri_9a70")}</div><div className="jb-card" style={{ padding: 14, marginBottom: 14, background: "#FFF6E5", border: "none" }}><div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{tt("x_ye_key_sirf_ek_jagah_use_0ab0")}</div><div style={{ fontSize: 12 }}>{tt("x_sirf_photo_se_ai_descrip_deb2")}</div></div><div className="jb-card" style={{ padding: 14 }}><div style={{ position: "relative" }}><input className="jb-input" style={{ paddingRight: 38, marginBottom: 12 }} type={show ? "text" : "password"} placeholder="sk-..." value={key} onChange={e => setKey(e.target.value)} /><span onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 10, top: 10, cursor: "pointer", fontSize: 15, color: "#8a7360" }}>{show ? "🙈" : "👁️"}</span></div><div style={{ display: "flex", gap: 8 }}><button className="jb-btn jb-btn-primary" onClick={save}>{tt("ui_save_key")}</button>{db.openaiApiKey && <button className="jb-btn jb-btn-danger" onClick={clear}>{tt("ui_remove_key_ai_off")}</button>}</div><div style={{ fontSize: 11, color: "#8a7360", marginTop: 10 }}>{"Key nahi hai? "}<a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: T.maroon }}>{tt("ui_platform_openai_com_api_keys")}</a>{" par jaake banayein (paisa lagta hai, per-use)."}</div></div></div>);
}

export function AdminSecurity() {
    const { t: tt } = useApp();
    const { db, update, notify, session } = useApp();
    const me = db.users.find(u => u.id === (session === null || session === void 0 ? void 0 : session.id));
    // Admin khud apna password badal sakta hai — lekin sirf tabhi jab apna Authenticator code
    // AUR ek Real SMS OTP dono verify ho jaayein. { newPassword, stage: "enter" | "verify" } | null
    const [selfPwChange, setSelfPwChange] = useState(null);
    const continueSelfPwChange = () => {
        if (!selfPwChange.newPassword || selfPwChange.newPassword.length < 6)
            return notify(tt("m_password_kam_se_kam_6_charac"), "error");
        setSelfPwChange(x => ({ ...x, stage: "verify" }));
    };
    const applySelfPassword = () => {
        update(d => { const u = d.users.find(x => x.id === (session === null || session === void 0 ? void 0 : session.id)); if (u)
            u.password = selfPwChange.newPassword; });
        notify("Aapka password change ho gaya.", "success");
        setSelfPwChange(null);
    };
    const [keyword, setKeyword] = useState(db.adminSecretKeyword || "");
    const [urlSecret, setUrlSecret] = useState(db.adminUrlSecret || "");
    const [staffKeyword, setStaffKeyword] = useState(db.adminStaffSecretKeyword || "");
    const [staffUrlSecret, setStaffUrlSecret] = useState(db.adminStaffUrlSecret || "");
    const [showKeyword, setShowKeyword] = useState(false);
    const [showUrl, setShowUrl] = useState(false);
    const [showStaffKeyword, setShowStaffKeyword] = useState(false);
    const [showStaffUrl, setShowStaffUrl] = useState(false);
    const randomSecret = (len = 10) => {
        const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let out = "";
        for (let i = 0; i < len; i++)
            out += chars[Math.floor(Math.random() * chars.length)];
        return out;
    };
    const saveKeyword = () => {
        const v = keyword.trim();
        if (v.length < 6)
            return notify(tt("m_keyword_kam_se_kam_6_charact"), "error");
        update(d => { d.adminSecretKeyword = v; });
        notify(tt("m_secret_keyword_update_ho_gay"), "success");
    };
    const saveUrlSecret = () => {
        const v = urlSecret.trim();
        if (v.length < 6)
            return notify(tt("m_url_code_kam_se_kam_6_charac"), "error");
        update(d => { d.adminUrlSecret = v; });
        notify(tt("m_secret_url_code_update_ho_ga"), "success");
    };
    const saveStaffKeyword = () => {
        const v = staffKeyword.trim();
        if (v.length < 6)
            return notify(tt("m_keyword_kam_se_kam_6_charact"), "error");
        update(d => { d.adminStaffSecretKeyword = v; });
        notify(tt("m_staff_secret_keyword_update_"), "success");
    };
    const saveStaffUrlSecret = () => {
        const v = staffUrlSecret.trim();
        if (v.length < 6)
            return notify(tt("m_url_code_kam_se_kam_6_charac"), "error");
        update(d => { d.adminStaffUrlSecret = v; });
        notify(tt("m_staff_secret_url_code_update"), "success");
    };
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{tt("x_security_admin_entry_fb44")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{tt("x_admin_panel_kholne_ke_ch_e321")}</div><div className="jb-card" style={{ padding: 14, marginBottom: 20 }}><div style={{ fontWeight: 600, marginBottom: 6 }}>🔑 Apna Password Badlein</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 10 }}>Apna login password change karne ke liye Authenticator code aur mobile par aaya Real SMS OTP, dono verify karne honge.</div>{!selfPwChange ? (<button className="jb-btn jb-btn-outline" onClick={() => setSelfPwChange({ newPassword: "", stage: "enter" })}>Password Badlein</button>) : selfPwChange.stage === "enter" ? (<><PasswordField label="Naya Password (kam se kam 6 characters)" value={selfPwChange.newPassword} onChange={e => setSelfPwChange(x => ({ ...x, newPassword: e.target.value }))} /><div style={{ display: "flex", gap: 8 }}><button className="jb-btn jb-btn-primary" onClick={continueSelfPwChange}>Aage Badhein</button><button className="jb-btn jb-btn-ghost" onClick={() => setSelfPwChange(null)}>{tt("ui_cancel")}</button></div></>) : (<DualSecurityGate authSecret={me === null || me === void 0 ? void 0 : me.authSecret} mobile={me === null || me === void 0 ? void 0 : me.mobile} accountLabel={me === null || me === void 0 ? void 0 : me.name} purpose="self-password-change" onSuccess={applySelfPassword} onCancel={(msg) => { setSelfPwChange(null); if (msg)
                    notify(msg, "error"); }} />)}</div><div style={{ fontWeight: 700, fontSize: 14, margin: "16px 0 8px", color: T.maroonDark }}>{tt("x_super_admin_entry_ce47")}</div><div className="jb-card" style={{ padding: 14, marginBottom: 14 }}><div style={{ fontWeight: 600, marginBottom: 6 }}>{tt("ui_1_search_box_secret_keyword")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 10 }}>{tt("ui_home_page_ke_search_box_mein")}</div><div style={{ position: "relative" }}><input className="jb-input" style={{ paddingRight: 38, marginBottom: 10 }} type={showKeyword ? "text" : "password"} value={keyword} onChange={e => setKeyword(e.target.value)} /><span onClick={() => setShowKeyword(s => !s)} style={{ position: "absolute", right: 10, top: 10, cursor: "pointer", fontSize: 15, color: "#8a7360" }}>{showKeyword ? "🙈" : "👁️"}</span></div><div style={{ display: "flex", gap: 8 }}><button className="jb-btn jb-btn-primary" onClick={saveKeyword}>{tt("ui_save")}</button><button className="jb-btn jb-btn-outline" onClick={() => setKeyword(randomSecret(10))}>{tt("x_random_generate_6bc0")}</button></div></div><div className="jb-card" style={{ padding: 14, marginBottom: 20 }}><div style={{ fontWeight: 600, marginBottom: 6 }}>{tt("ui_2_secret_url_code")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 10 }}>{"Ye link kholne se bhi admin panel khulta hai: "}<code>{tt("ui_jb_gate_ye_code")}</code>{" — apne app ke URL ke end mein jodein."}</div><div style={{ position: "relative" }}><input className="jb-input" style={{ paddingRight: 38, marginBottom: 10 }} type={showUrl ? "text" : "password"} value={urlSecret} onChange={e => setUrlSecret(e.target.value)} /><span onClick={() => setShowUrl(s => !s)} style={{ position: "absolute", right: 10, top: 10, cursor: "pointer", fontSize: 15, color: "#8a7360" }}>{showUrl ? "🙈" : "👁️"}</span></div><div style={{ display: "flex", gap: 8 }}><button className="jb-btn jb-btn-primary" onClick={saveUrlSecret}>{tt("ui_save")}</button><button className="jb-btn jb-btn-outline" onClick={() => setUrlSecret(randomSecret(12))}>{tt("x_random_generate_6bc0")}</button></div></div><div style={{ fontWeight: 700, fontSize: 14, margin: "16px 0 8px", color: T.maroonDark }}>{tt("x_staff_entry_super_admin__89d3")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 10 }}>{tt("ui_ye_secrets_sirf_staff_ko_bat")}</div><div className="jb-card" style={{ padding: 14, marginBottom: 14 }}><div style={{ fontWeight: 600, marginBottom: 6 }}>{tt("ui_3_staff_secret_keyword")}</div><div style={{ position: "relative" }}><input className="jb-input" style={{ paddingRight: 38, marginBottom: 10 }} type={showStaffKeyword ? "text" : "password"} value={staffKeyword} onChange={e => setStaffKeyword(e.target.value)} /><span onClick={() => setShowStaffKeyword(s => !s)} style={{ position: "absolute", right: 10, top: 10, cursor: "pointer", fontSize: 15, color: "#8a7360" }}>{showStaffKeyword ? "🙈" : "👁️"}</span></div><div style={{ display: "flex", gap: 8 }}><button className="jb-btn jb-btn-primary" onClick={saveStaffKeyword}>{tt("ui_save")}</button><button className="jb-btn jb-btn-outline" onClick={() => setStaffKeyword(randomSecret(10))}>{tt("x_random_generate_6bc0")}</button></div></div><div className="jb-card" style={{ padding: 14 }}><div style={{ fontWeight: 600, marginBottom: 6 }}>{tt("ui_4_staff_secret_url_code")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 10 }}>{"Staff ke liye link: "}<code>{tt("ui_jb_staff_gate_ye_code")}</code></div><div style={{ position: "relative" }}><input className="jb-input" style={{ paddingRight: 38, marginBottom: 10 }} type={showStaffUrl ? "text" : "password"} value={staffUrlSecret} onChange={e => setStaffUrlSecret(e.target.value)} /><span onClick={() => setShowStaffUrl(s => !s)} style={{ position: "absolute", right: 10, top: 10, cursor: "pointer", fontSize: 15, color: "#8a7360" }}>{showStaffUrl ? "🙈" : "👁️"}</span></div><div style={{ display: "flex", gap: 8 }}><button className="jb-btn jb-btn-primary" onClick={saveStaffUrlSecret}>{tt("ui_save")}</button><button className="jb-btn jb-btn-outline" onClick={() => setStaffUrlSecret(randomSecret(12))}>{tt("x_random_generate_6bc0")}</button></div></div></div>);
}

export function AdminPages() {
    const { t: tt } = useApp();
    var _a, _b, _c, _d;
    const { db, update, notify } = useApp();
    const [about, setAbout] = useState(((_a = db.sitePages) === null || _a === void 0 ? void 0 : _a.about) || "");
    const [terms, setTerms] = useState(((_b = db.sitePages) === null || _b === void 0 ? void 0 : _b.terms) || "");
    const [privacy, setPrivacy] = useState(((_c = db.sitePages) === null || _c === void 0 ? void 0 : _c.privacy) || "");
    const [resellerTerms, setResellerTerms] = useState(((_d = db.sitePages) === null || _d === void 0 ? void 0 : _d.resellerTerms) || "");
    const save = () => {
        update(d => { d.sitePages = { about, terms, privacy, resellerTerms }; });
        notify(tt("m_pages_update_ho_gayi"), "success");
    };
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{tt("ui_site_pages_about_terms_priva")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{tt("x_ye_content_customer_app__5803")}</div><div className="jb-card" style={{ padding: 14, marginBottom: 14 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_about_us")}</div><textarea className="jb-input" rows={6} value={about} onChange={e => setAbout(e.target.value)} placeholder={tt("m_apne_business_ke_baare_mein_")} /></div><div className="jb-card" style={{ padding: 14, marginBottom: 14 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_terms_conditions")}</div><textarea className="jb-input" rows={6} value={terms} onChange={e => setTerms(e.target.value)} placeholder={tt("m_terms_conditions_likhein")} /></div><div className="jb-card" style={{ padding: 14, marginBottom: 14 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_privacy_policy")}</div><textarea className="jb-input" rows={6} value={privacy} onChange={e => setPrivacy(e.target.value)} placeholder={tt("m_privacy_policy_likhein")} /></div><div className="jb-card" style={{ padding: 14, marginBottom: 14 }}><div style={{ fontWeight: 600, marginBottom: 8 }}>{tt("ui_reseller_agreement_reseller_")}</div><textarea className="jb-input" rows={6} value={resellerTerms} onChange={e => setResellerTerms(e.target.value)} placeholder={tt("m_reseller_ke_liye_terms_condi")} /></div><button className="jb-btn jb-btn-primary" onClick={save}>{tt("ui_save_all_pages")}</button></div>);
}

export function AdminAuditLog() {
    const { t: tt } = useApp();
    const { db } = useApp();
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{tt("ui_audit_log")}</div>{db.auditLogs.length === 0 ? <EmptyState text={tt("x_koi_log_nahi_8f9d")} /> : db.auditLogs.map(l => (<div key={l.id} style={{ fontSize: 12, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>[{new Date(l.at).toLocaleString()}{"] "}{l.by}{": "}{l.action}{" — "}{l.detail}</div>))}</div>);
}

export function AdminAIChatLogs() {
    const { t: tt } = useApp();
    const { db, update, notify } = useApp();
    const [openLog, setOpenLog] = useState(null);
    const logs = [...db.aiChatLogs].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const roleLabel = { customer: "Customer", seller: "Seller" };
    const markResolved = (id) => update(d => { const l = d.aiChatLogs.find(l => l.id === id); l.resolved = true; });
    const contactUser = (log) => {
        var _a, _b;
        const mobile = ((_a = db.users.find(u => u.id === log.userId)) === null || _a === void 0 ? void 0 : _a.mobile) || ((_b = db.sellers.find(s => s.id === log.userId)) === null || _b === void 0 ? void 0 : _b.mobile);
        if (!mobile)
            return notify(tt("m_mobile_number_nahi_mila"), "error");
        window.open(`https://wa.me/91${mobile}`, "_blank");
    };
    return (<div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{tt("x_ai_chat_logs_fea9")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{tt("ui_yahan_dekhein_customer_selle")}</div>{logs.length === 0 ? <EmptyState text={tt("x_abhi_koi_ai_chat_convers_623c")} /> : logs.map(log => {
            var _a, _b;
            return (<div key={log.id} className="jb-card" style={{ padding: 14, marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><b>{log.userName}</b>{" "}<span style={{ fontSize: 11, color: "#8a7360" }}>({roleLabel[log.userRole] || log.userRole})</span></div><StatusBadge status={log.resolved ? "approved" : "pending"} /></div><div style={{ fontSize: 12, color: "#8a7360", margin: "4px 0" }}>{log.messages.length}{" messages • Last: "}{new Date(log.updatedAt).toLocaleString()}</div><div style={{ fontSize: 12, color: "#5a4a3a", fontStyle: "italic" }}>"{(_b = (_a = log.messages[log.messages.length - 1]) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 :
                    _b.slice(0, 100)}..."</div><div style={{ display: "flex", gap: 8, marginTop: 8 }}><button className="jb-btn jb-btn-outline" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setOpenLog(log)}>{tt("ui_poora_conversation_dekhein")}</button><button className="jb-btn" style={{ background: "#25D366", color: "#fff", fontSize: 12, padding: "6px 10px" }} onClick={() => contactUser(log)}>{tt("x_whatsapp_contact_9071")}</button>{!log.resolved && <button className="jb-btn jb-btn-primary" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => { markResolved(log.id); notify(tt("m_resolved_mark_ho_gaya"), "success"); }}>{tt("ui_mark_resolved")}</button>}</div></div>);
        })}{openLog && (<Modal onClose={() => setOpenLog(null)} width={420}><div style={{ fontWeight: 700, marginBottom: 10 }}>{openLog.userName}{" — Conversation"}</div><div style={{ maxHeight: 400, overflowY: "auto" }} className="jb-scroll">{openLog.messages.map((m, i) => (<div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}><div style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: 12, fontSize: 13, background: m.role === "user" ? T.maroon : T.cream, color: m.role === "user" ? "#fff" : T.ink }}>{m.text}</div></div>))}</div></Modal>)}</div>);
}
