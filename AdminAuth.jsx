import React, { useState } from "react";
import { useApp } from "./AppContext.jsx";
import { MAX_ATTEMPTS, checkLockout, formatSecretForDisplay, generateBase32Secret, generateRecoveryKey, isStrongEnoughPassword, isValidIndianMobile, recordFailedAttempt, resetAttempts, sha256Hex, verifyTOTP } from "./security.js";
import { nowISO, uid } from "./database.js";
import { T } from "./theme.js";
import { Field, PasswordField } from "./CommonUI.jsx";
import { JBIcon } from "./BasicUI.jsx";

/* ============================================================================
   ADMIN PANEL — accessible ONLY via hidden logo-tap trigger (see Header)
   Never linked from any public-facing nav/menu.
   ============================================================================ */
export function AdminSetup({ setView }) {
    const { t: tt } = useApp();
    const { update, login, notify } = useApp();
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [stage, setStage] = useState("form"); // form | totp-setup | recovery-key
    const [secret, setSecret] = useState("");
    const [verifyCode, setVerifyCode] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [pendingAdmin, setPendingAdmin] = useState(null);
    const [recoveryKey, setRecoveryKey] = useState("");
    const create = () => {
        if (!name || !mobile || !password)
            return notify(tt("m_sabhi_fields_bharein"), "error");
        if (!isValidIndianMobile(mobile))
            return notify(tt("m_valid_10_digit_mobile_number"), "error");
        if (password.length < 6)
            return notify(tt("m_password_kam_se_kam_6_charac"), "error");
        if (password !== confirm)
            return notify(tt("m_password_match_nahi_kar_raha"), "error");
        const newSecret = generateBase32Secret();
        setSecret(newSecret);
        setPendingAdmin({ id: uid("u"), role: "admin", level: "super_admin", name, mobile, password, authSecret: newSecret, createdAt: nowISO() });
        setStage("totp-setup");
    };
    const confirmTotp = async () => {
        setVerifying(true);
        const ok = await verifyTOTP(secret, verifyCode);
        setVerifying(false);
        if (!ok)
            return notify(tt("m_code_galat_hai_google_authen"), "error");
        const key = generateRecoveryKey();
        const hash = await sha256Hex(key);
        setRecoveryKey(key);
        setPendingAdmin(a => ({ ...a, recoveryKeyHash: hash }));
        setStage("recovery-key");
    };
    const finishSetup = async () => {
        setVerifying(true);
        // Local hi banta hai — koi backend nahi, seedha localStorage db mein add hota hai.
        update(d => d.users.push(pendingAdmin));
        setVerifying(false);
        login({ role: "admin", id: pendingAdmin.id, name: pendingAdmin.name, level: "super_admin" });
        notify(tt("m_super_admin_account_ban_gaya"), "success");
        setView("admin-dashboard");
    };
    if (stage === "totp-setup") {
        return (<div className="jb-modal-backdrop"><div className="jb-card" style={{ width: "100%", maxWidth: 400, padding: 24 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: T.maroonDark }}>{tt("x_google_authenticator_set_6c4a")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{tt("x_ye_ek_baar_ka_setup_hai__f65b")}</div><div className="jb-card" style={{ padding: 12, marginBottom: 12, background: T.cream, border: "none" }}><div style={{ fontSize: 12 }}><b>{tt("ui_account_name")}</b>{" Jila Bazar Admin"}</div><div style={{ fontSize: 12, marginTop: 4 }}><b>{tt("ui_key")}</b></div><div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1, color: T.maroon, wordBreak: "break-all", margin: "4px 0" }}>{formatSecretForDisplay(secret)}</div><div style={{ fontSize: 12 }}><b>{tt("ui_type")}</b>{" Time based"}</div></div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 10 }}>{tt("ui_setup_karne_ke_baad_app_mein")}</div><Field label={tt("x_6_digit_code_4a8a")} value={verifyCode} onChange={e => setVerifyCode(e.target.value)} placeholder="123456" /><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={verifying} onClick={confirmTotp}>{verifying ? "Verifying..." : tt("x_verify_continue_71c5")}</button></div></div>);
    }
    if (stage === "recovery-key") {
        return (<div className="jb-modal-backdrop"><div className="jb-card" style={{ width: "100%", maxWidth: 400, padding: 24 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: T.maroonDark }}>{tt("x_recovery_key_bahut_zaroo_c5ac")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{"Agar aap kabhi password bhool jayein YA phone kho jaye (Google Authenticator ke saath), to "}<b>{tt("ui_sirf_yahi_key")}</b>{" aapko wapas account access dilayegi. Ye sirf "}<b>{tt("ui_ek_baar")}</b>{" dikhegi — kahin surakshit likh ke rakhein (kaagaz par, ya kisi trusted jagah)."}</div><div className="jb-card" style={{ padding: 14, marginBottom: 14, background: T.cream, border: "none", textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1, color: T.maroon, wordBreak: "break-all" }}>{recoveryKey}</div></div><button className="jb-btn jb-btn-gold" style={{ width: "100%", justifyContent: "center", marginBottom: 8 }} onClick={() => { var _a; (_a = navigator.clipboard) === null || _a === void 0 ? void 0 : _a.writeText(recoveryKey); notify(tt("m_copy_ho_gaya"), "success"); }}>{tt("ui_copy_key")}</button><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={finishSetup}>{tt("ui_maine_save_kar_liya_hai_cont")}</button></div></div>);
    }
    return (<div className="jb-modal-backdrop"><div className="jb-card" style={{ width: "100%", maxWidth: 380, padding: 24 }}><div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><JBIcon size={44} /></div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: T.maroonDark }}>{tt("x_super_admin_setup_82a2")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 16 }}>{tt("x_ye_first_time_setup_hai__7058")}</div><Field label={tt("x_aapka_naam_153d")} value={name} onChange={e => setName(e.target.value)} /><Field label={tt("x_mobile_number_a4c7")} value={mobile} onChange={e => setMobile(e.target.value)} /><PasswordField label={tt("x_password_min_6_character_844d")} value={password} onChange={e => setPassword(e.target.value)} /><PasswordField label={tt("x_confirm_password_887f")} value={confirm} onChange={e => setConfirm(e.target.value)} /><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={create}>{tt("ui_continue_to_2fa_setup")}</button><div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: T.maroon, cursor: "pointer" }} onClick={() => setView("home")}>{tt("ui_cancel")}</div></div></div>);
}

export function AdminLogin({ setView }) {
    const { t: tt } = useApp();
    const { db, update, login, notify } = useApp();
    const [mobile, setMobile] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [stage, setStage] = useState("creds"); // creds | totp | recover-request | recover-newpass | recover-totp | recover-key
    const [matchedAdmin, setMatchedAdmin] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [otpTries, setOtpTries] = useState(0);
    // Recovery flow state
    const [recMobile, setRecMobile] = useState("");
    const [recKeyInput, setRecKeyInput] = useState("");
    const [recNewPass, setRecNewPass] = useState("");
    const [recNewPassConfirm, setRecNewPassConfirm] = useState("");
    const [recSecret, setRecSecret] = useState("");
    const [recVerifyCode, setRecVerifyCode] = useState("");
    const [recNewKey, setRecNewKey] = useState("");
    const submitCreds = async () => {
        if (!isValidIndianMobile(mobile))
            return notify(tt("m_valid_mobile_number_daalein"), "error");
        const lockKey = `admin:${mobile}`;
        const lock = checkLockout(lockKey);
        if (lock.locked)
            return notify(tt("mt_bahut_zyada_galat_attempts_x").replace("{0}", (Math.ceil(lock.remaining / 60))), "error");
        setVerifying(true);
        // Local check — koi backend nahi.
        const admin = db.users.find(u => u.role === "admin" && u.mobile === mobile && u.password === password);
        setVerifying(false);
        if (!admin) {
            const rec = recordFailedAttempt(lockKey);
            const left = MAX_ATTEMPTS - rec.count;
            return notify(left > 0 ? `Invalid admin credentials (${left} attempts bache hain)` : "Bahut zyada attempts — 5 minute ke liye lock ho gaya", "error");
        }
        resetAttempts(lockKey);
        setMatchedAdmin(admin);
        setStage("totp");
    };
    const submitOtp = async () => {
        setVerifying(true);
        const ok = await verifyTOTP(matchedAdmin.authSecret, otp);
        setVerifying(false);
        if (!ok) {
            const tries = otpTries + 1;
            setOtpTries(tries);
            if (tries >= 3) {
                setStage("creds");
                setOtpTries(0);
                return notify(tt("m_code_3_baar_galat_dobara_log"), "error");
            }
            return notify(tt("mt_code_galat_hai_x_attempts_ba_").replace("{0}", (3 - tries)), "error");
        }
        const admin = matchedAdmin;
        login({ role: "admin", id: admin.id, name: admin.name, level: admin.level || "staff" });
        notify(`Admin login successful (${admin.level === "super_admin" ? "Super Admin" : "Staff"})`, "success");
        setView("admin-dashboard");
    };
    const submitRecoveryRequest = async () => {
        if (!isValidIndianMobile(recMobile))
            return notify(tt("m_valid_mobile_number_daalein"), "error");
        if (!recKeyInput.trim())
            return notify(tt("m_recovery_key_daalein"), "error");
        const admin = db.users.find(u => u.role === "admin" && u.mobile === recMobile);
        if (!admin || !admin.recoveryKeyHash)
            return notify(tt("m_is_mobile_ke_liye_recovery_k"), "error");
        const hash = await sha256Hex(recKeyInput.trim().toUpperCase());
        if (hash !== admin.recoveryKeyHash)
            return notify(tt("m_recovery_key_galat_hai"), "error");
        setMatchedAdmin(admin);
        setStage("recover-newpass");
    };
    const submitNewPassword = () => {
        if (!isStrongEnoughPassword(recNewPass))
            return notify(tt("m_password_kam_se_kam_6_charac"), "error");
        if (recNewPass !== recNewPassConfirm)
            return notify(tt("m_password_match_nahi_kar_raha"), "error");
        const newSecret = generateBase32Secret();
        setRecSecret(newSecret);
        setStage("recover-totp");
    };
    const confirmRecoveryTotp = async () => {
        setVerifying(true);
        const ok = await verifyTOTP(recSecret, recVerifyCode);
        if (!ok) {
            setVerifying(false);
            return notify(tt("m_code_galat_hai"), "error");
        }
        const newKey = generateRecoveryKey();
        const newHash = await sha256Hex(newKey);
        // Local update — seedha localStorage db ke andar admin record update hota hai.
        update(d => {
            const idx = d.users.findIndex(u => u.role === "admin" && u.mobile === matchedAdmin.mobile);
            if (idx !== -1) {
                d.users[idx].password = recNewPass;
                d.users[idx].authSecret = recSecret;
                d.users[idx].recoveryKeyHash = newHash;
            }
        });
        setVerifying(false);
        setRecNewKey(newKey);
        setMatchedAdmin(m => ({ ...m, password: recNewPass, authSecret: recSecret, recoveryKeyHash: newHash }));
        setStage("recover-key");
    };
    const finishRecovery = () => {
        login({ role: "admin", id: matchedAdmin.id, name: matchedAdmin.name, level: matchedAdmin.level || "staff" });
        notify(tt("m_account_recover_ho_gaya_naye"), "success");
        setView("admin-dashboard");
    };
    if (stage === "recover-request") {
        return (<div className="jb-modal-backdrop"><div className="jb-card" style={{ width: "100%", maxWidth: 380, padding: 24 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: T.maroonDark }}>{tt("x_account_recovery_392e")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{tt("ui_apna_registered_mobile_aur_w")}</div><Field label={tt("x_admin_mobile_350a")} value={recMobile} onChange={e => setRecMobile(e.target.value)} /><Field label={tt("x_recovery_key_02b3")} value={recKeyInput} onChange={e => setRecKeyInput(e.target.value)} placeholder="XXXXX-XXXXX-XXXXX-XXXXX" /><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={submitRecoveryRequest}>{tt("ui_verify_recovery_key")}</button><div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: T.maroon, cursor: "pointer" }} onClick={() => setStage("creds")}>{tt("x_login_par_wapas_jayein_be38")}</div></div></div>);
    }
    if (stage === "recover-newpass") {
        return (<div className="jb-modal-backdrop"><div className="jb-card" style={{ width: "100%", maxWidth: 380, padding: 24 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: T.maroonDark }}>{tt("ui_naya_password_set_karein")}</div><PasswordField label={tt("x_naya_password_min_6_char_1b1f")} value={recNewPass} onChange={e => setRecNewPass(e.target.value)} /><PasswordField label={tt("x_confirm_password_887f")} value={recNewPassConfirm} onChange={e => setRecNewPassConfirm(e.target.value)} /><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={submitNewPassword}>{tt("ui_continue_to_2fa_reset")}</button></div></div>);
    }
    if (stage === "recover-totp") {
        return (<div className="jb-modal-backdrop"><div className="jb-card" style={{ width: "100%", maxWidth: 400, padding: 24 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: T.maroonDark }}>{tt("x_naya_google_authenticato_65f1")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{tt("x_purani_2fa_key_kaam_nahi_5c1b")}</div><div className="jb-card" style={{ padding: 12, marginBottom: 12, background: T.cream, border: "none" }}><div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1, color: T.maroon, wordBreak: "break-all" }}>{formatSecretForDisplay(recSecret)}</div></div><Field label={tt("x_6_digit_code_4a8a")} value={recVerifyCode} onChange={e => setRecVerifyCode(e.target.value)} placeholder="123456" /><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={verifying} onClick={confirmRecoveryTotp}>{verifying ? "Verifying..." : tt("x_verify_continue_71c5")}</button></div></div>);
    }
    if (stage === "recover-key") {
        return (<div className="jb-modal-backdrop"><div className="jb-card" style={{ width: "100%", maxWidth: 400, padding: 24 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: T.maroonDark }}>{tt("x_naya_recovery_key_9587")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 14 }}>{tt("ui_purani_key_ab_kaam_nahi_kare")}</div><div className="jb-card" style={{ padding: 14, marginBottom: 14, background: T.cream, border: "none", textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1, color: T.maroon, wordBreak: "break-all" }}>{recNewKey}</div></div><button className="jb-btn jb-btn-gold" style={{ width: "100%", justifyContent: "center", marginBottom: 8 }} onClick={() => { var _a; (_a = navigator.clipboard) === null || _a === void 0 ? void 0 : _a.writeText(recNewKey); notify(tt("m_copy_ho_gaya"), "success"); }}>{tt("ui_copy_key")}</button><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={finishRecovery}>{tt("ui_maine_save_kar_liya_login_ka")}</button></div></div>);
    }
    return (<div className="jb-modal-backdrop"><div className="jb-card" style={{ width: "100%", maxWidth: 380, padding: 24 }}><div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><JBIcon size={44} /></div><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: T.maroonDark }}>{tt("x_admin_access_7072")}</div><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 16 }}>{tt("ui_restricted_area_authorized_p")}</div>{stage === "creds" ? (<><Field label={tt("x_admin_mobile_350a")} value={mobile} onChange={e => setMobile(e.target.value)} /><PasswordField label={tt("x_password_dc64")} value={password} onChange={e => setPassword(e.target.value)} /><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={submitCreds}>{tt("ui_continue")}</button><div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: T.maroon, cursor: "pointer" }} onClick={() => setStage("recover-request")}>{tt("ui_password_bhool_gaye_ya_phone")}</div></>) : (<><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 10 }}>{tt("x_google_authenticator_app_415f")}</div><Field label={tt("x_authenticator_code_9cf3")} value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" /><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={verifying} onClick={submitOtp}>{verifying ? "Verifying..." : tt("x_verify_login_1abb")}</button></>)}<div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: T.maroon, cursor: "pointer" }} onClick={() => setView("home")}>{tt("ui_cancel")}</div></div></div>);
}
