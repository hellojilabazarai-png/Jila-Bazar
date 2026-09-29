import React, { useState, useEffect } from "react";
import { useApp } from "./AppContext.jsx";
import { T } from "./theme.js";
import { Field, PasswordField } from "./CommonUI.jsx";
import { BACKEND_URL } from "./helpers.js";
import { MAX_ATTEMPTS, checkLockout, formatSecretForDisplay, isStrongEnoughPassword, isValidEmail, isValidIndianMobile, recordFailedAttempt, resetAttempts, verifyTOTP } from "./security.js";
import { nowISO, uid } from "./database.js";
import { csOn } from "./ComingSoon.jsx";

/* ============================================================================
   AUTH SCREENS (Customer / Seller) — Register, Login, Forgot Password
   ============================================================================ */
export function ConfirmationCodeGate({ onSuccess, onCancel, purpose }) {
    const { t: tt } = useApp();
    const { notify } = useApp();
    const [genCode] = useState(() => String(Math.floor(100000 + Math.random() * 900000)));
    const [input, setInput] = useState("");
    const [tries, setTries] = useState(0);
    const confirm = () => {
        if (input.trim() !== genCode) {
            const t = tries + 1;
            setTries(t);
            if (t >= 3) {
                onCancel && onCancel("Bahut zyada galat attempts.");
                return;
            }
            notify(tt("mt_code_galat_hai_x_attempts_ba").replace("{0}", (3 - t)), "error");
            return;
        }
        onSuccess();
    };
    return (<><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 10 }}>{"Aapne 2FA on nahi kiya hai, isliye is "}{purpose || "action"}{" ko confirm karne ke liye neeche diya gaya code daalein (galti se ho jaane se bachne ke liye):"}</div><div className="jb-card" style={{ padding: 12, marginBottom: 12, background: T.cream, border: "none", textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, color: T.maroon }}>{genCode}</div></div><Field label={tt("l_ye_code_yahan_type_karein")} value={input} onChange={e => setInput(e.target.value)} placeholder="123456" /><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={confirm}>{tt("ui_confirm_karein")}</button><div style={{ fontSize: 10, color: "#aaa", marginTop: 10, textAlign: "center" }}>{tt("ui_tip_security_settings_se_rea")}</div>{onCancel && <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: T.maroon, cursor: "pointer" }} onClick={() => onCancel()}>{tt("ui_cancel")}</div>}</>);
}

// Registration ke liye REAL SMS OTP — sirf naye account ki mobile verify karne ke liye use hota hai.
// Forgot Password ka OTP aur Withdrawal confirm karne wala ConfirmationCodeGate isse bilkul alag hain, unhe yahan touch nahi kiya gaya.
// Backend par ye do endpoints banane honge: POST /api/send-otp aur POST /api/verify-otp (body: { mobile, otp?, purpose: "registration" }).
export function RegistrationSmsOtpGate({ mobile, onSuccess, onCancel }) {
    const { t: tt, notify } = useApp();
    const [stage, setStage] = useState("sending"); // sending | verify
    const [otp, setOtp] = useState("");
    const [busy, setBusy] = useState(false);
    const [tries, setTries] = useState(0);
    const sendSmsOtp = async () => {
        setBusy(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile, purpose: "registration" }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.error)
                throw new Error(data.error || `OTP bhejne mein dikkat hui (status ${res.status})`);
            setStage("verify");
            notify(`OTP aapke mobile ${mobile} par bhej diya gaya hai.`, "info");
        }
        catch (e) {
            notify(e.message || "OTP bhejne mein dikkat hui, dobara try karein.", "error");
            onCancel && onCancel();
        }
        finally {
            setBusy(false);
        }
    };
    useEffect(() => { sendSmsOtp(); }, []); // component khulte hi apne aap OTP bhej deta hai
    const verify = async () => {
        if (!otp)
            return notify(tt("l_enter_otp") || "OTP daalein", "error");
        setBusy(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile, otp, purpose: "registration" }),
            });
            const data = await res.json().catch(() => ({}));
            setBusy(false);
            if (!res.ok || !data.verified) {
                const t = tries + 1;
                setTries(t);
                if (t >= 3) {
                    onCancel && onCancel("Bahut zyada galat attempts.");
                    return;
                }
                notify((data && data.error) || tt("m_otp_galat_hai") || "OTP galat hai", "error");
                return;
            }
            onSuccess();
        }
        catch (e) {
            setBusy(false);
            notify(e.message || "OTP verify karne mein dikkat hui.", "error");
        }
    };
    return (<><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 10 }}>{stage === "sending" ? `Aapke mobile number ${mobile} par SMS OTP bheja ja raha hai...` : `Aapke mobile number ${mobile} par bheja gaya OTP neeche daalein:`}</div>{stage === "verify" && (<><Field label={tt("l_enter_otp") || "OTP daalein"} value={otp} onChange={e => setOtp(e.target.value)} placeholder="1234" /><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={busy} onClick={verify}>{busy ? "Verifying..." : (tt("ui_confirm_karein") || "Confirm")}</button><div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: T.maroon, cursor: busy ? "default" : "pointer" }} onClick={() => !busy && sendSmsOtp()}>OTP dobara bhejein</div></>)}{onCancel && <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: T.maroon, cursor: "pointer" }} onClick={() => onCancel()}>{tt("ui_cancel")}</div>}</>);
}

// Generic REAL SMS OTP verifier — password-change jaisi sensitive actions ke liye reusable.
// RegistrationSmsOtpGate se alag hai taaki registration wala flow bilkul na chhide;
// dono same backend endpoints (/api/send-otp, /api/verify-otp) use karte hain, bas "purpose" alag jaata hai.
export function SmsOtpGate({ mobile, purpose, onSuccess, onCancel }) {
    const { t: tt, notify } = useApp();
    const [stage, setStage] = useState("sending"); // sending | verify
    const [otp, setOtp] = useState("");
    const [busy, setBusy] = useState(false);
    const [tries, setTries] = useState(0);
    const sendSmsOtp = async () => {
        setBusy(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile, purpose: purpose || "verify" }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.error)
                throw new Error(data.error || `OTP bhejne mein dikkat hui (status ${res.status})`);
            setStage("verify");
            notify(`OTP aapke mobile ${mobile} par bhej diya gaya hai.`, "info");
        }
        catch (e) {
            notify(e.message || "OTP bhejne mein dikkat hui, dobara try karein.", "error");
            onCancel && onCancel();
        }
        finally {
            setBusy(false);
        }
    };
    useEffect(() => { sendSmsOtp(); }, []);
    const verify = async () => {
        if (!otp)
            return notify(tt("l_enter_otp") || "OTP daalein", "error");
        setBusy(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile, otp, purpose: purpose || "verify" }),
            });
            const data = await res.json().catch(() => ({}));
            setBusy(false);
            if (!res.ok || !data.verified) {
                const t = tries + 1;
                setTries(t);
                if (t >= 3) {
                    onCancel && onCancel("Bahut zyada galat attempts.");
                    return;
                }
                notify((data && data.error) || tt("m_otp_galat_hai") || "OTP galat hai", "error");
                return;
            }
            onSuccess();
        }
        catch (e) {
            setBusy(false);
            notify(e.message || "OTP verify karne mein dikkat hui.", "error");
        }
    };
    return (<><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 10 }}>{stage === "sending" ? `Aapke mobile number ${mobile} par SMS OTP bheja ja raha hai...` : `Aapke mobile number ${mobile} par bheja gaya OTP neeche daalein:`}</div>{stage === "verify" && (<><Field label={tt("l_enter_otp") || "OTP daalein"} value={otp} onChange={e => setOtp(e.target.value)} placeholder="1234" /><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={busy} onClick={verify}>{busy ? "Verifying..." : (tt("ui_confirm_karein") || "Confirm")}</button><div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: T.maroon, cursor: busy ? "default" : "pointer" }} onClick={() => !busy && sendSmsOtp()}>OTP dobara bhejein</div></>)}{onCancel && <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: T.maroon, cursor: "pointer" }} onClick={() => onCancel()}>{tt("ui_cancel")}</div>}</>);
}

// Sabse sakht gate: Authenticator code AUR Real SMS OTP — dono pass honi chahiye tabhi onSuccess chalta hai.
// Password-change jaisi high-risk actions ke liye use hota hai.
export function DualSecurityGate({ authSecret, mobile, accountLabel, purpose, onSuccess, onCancel }) {
    const [step, setStep] = useState(authSecret ? "totp" : "sms");
    return step === "totp"
        ? <><div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: T.maroonDark }}>Step 1/2 — Authenticator Code</div><TotpGate secret={authSecret} mode="verify" accountLabel={accountLabel} onSuccess={() => setStep("sms")} onCancel={onCancel} /></>
        : <><div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: T.maroonDark }}>{authSecret ? "Step 2/2 \u2014 SMS OTP" : "SMS OTP"}</div><SmsOtpGate mobile={mobile} purpose={purpose} onSuccess={onSuccess} onCancel={onCancel} /></>;
}

export function TotpGate({ secret, mode, onSuccess, onCancel, accountLabel }) {
    const { t: tt } = useApp();
    // mode: "setup" (show key + verify) | "verify" (just ask for code)
    const { notify } = useApp();
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState(false);
    const [tries, setTries] = useState(0);
    const confirm = async () => {
        setBusy(true);
        const ok = await verifyTOTP(secret, code);
        setBusy(false);
        if (!ok) {
            const t = tries + 1;
            setTries(t);
            if (mode === "verify" && t >= 3) {
                onCancel && onCancel("Bahut zyada galat attempts. Dobara login karein.");
                return;
            }
            notify(`Code galat hai${mode === "verify" ? ` (${3 - t} attempts bache hain)` : ""}`, "error");
            return;
        }
        onSuccess();
    };
    return (<>{mode === "setup" && (<><div style={{ fontSize: 12, color: "#8a7360", marginBottom: 10 }}>{tt("x_google_authenticator_app_20f8")}</div><div className="jb-card" style={{ padding: 12, marginBottom: 12, background: T.cream, border: "none" }}><div style={{ fontSize: 12 }}><b>{tt("ui_account_name")}</b>{" "}{accountLabel}</div><div style={{ fontSize: 12, marginTop: 4 }}><b>{tt("ui_key")}</b></div><div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1, color: T.maroon, wordBreak: "break-all", margin: "4px 0" }}>{formatSecretForDisplay(secret)}</div><div style={{ fontSize: 12 }}><b>{tt("ui_type")}</b>{" Time based"}</div></div><div style={{ fontSize: 11, color: "#aaa", marginBottom: 8 }}>{tt("l_ye_key_kahin_surakshit_not")}</div></>)}{mode === "verify" && <div style={{ fontSize: 12, color: "#8a7360", marginBottom: 10 }}>{"Google Authenticator mein "}{accountLabel}{" ke saamne jo 6-digit code dikh raha hai, wo daalein:"}</div>}<Field label={tt("l_authenticator_code")} placeholder="123456" value={code} onChange={e => setCode(e.target.value)} /><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={busy} onClick={confirm}>{busy ? "Verifying..." : mode === "setup" ? "Verify & Activate" : tt("x_verify_login_1abb")}</button>{onCancel && <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: T.maroon, cursor: "pointer" }} onClick={() => onCancel()}>{tt("ui_cancel")}</div>}</>);
}

export function AuthGate({ setView }) {
    const { t: tt } = useApp();
    const { db, update, login, notify, lang, t } = useApp();
    const [mode, setMode] = useState("login"); // login | register | forgot
    const [role, setRole] = useState("customer");
    const [form, setForm] = useState({ name: "", mobile: "", email: "", password: "", confirmPassword: "", shopName: "", ownerName: "", area: "" });
    const [otpStage, setOtpStage] = useState(false);
    const [otp, setOtp] = useState("");
    const [genOtp, setGenOtp] = useState(null);
    const [busy, setBusy] = useState(false);
    const [stage, setStage] = useState("form"); // form | totp-setup | totp-verify
    const [pendingAccount, setPendingAccount] = useState(null); // { role, record, secret } for register
    const [matchedAccount, setMatchedAccount] = useState(null); // { role, record } for login
    const [regLocation, setRegLocation] = useState(null); // sirf tab set hota hai jab user khud button dabaye
    const [locating, setLocating] = useState(false);
    // Location sirf tab maangi jaati hai jab user khud "Location detect karein" button dabaye —
    // register form khulte hi automatically/silently kabhi nahi maangi jaati.
    const detectRegLocation = () => {
        if (!navigator.geolocation)
            return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition((pos) => { setRegLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, capturedAt: nowISO() }); setLocating(false); }, () => { setLocating(false); notify && notify(tt("m_location_detect_nahi_ho_payi"), "error"); }, { timeout: 8000 });
    };
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
    const finishLogin = (acc) => {
        if (acc.role === "customer") {
            login({ role: "customer", id: acc.record.id, name: acc.record.name, mobile: acc.record.mobile });
            notify(tt("mt_welcome_back_x").replace("{0}", (acc.record.name)), "success");
            setView("home");
        }
        else {
            login({ role: "seller", id: acc.record.id, name: acc.record.ownerName, shopName: acc.record.shopName, mobile: acc.record.mobile });
            notify(tt("mt_welcome_back_x_").replace("{0}", (acc.record.shopName)), "success");
            setView("seller-dashboard");
        }
    };
    const doLogin = async () => {
        if (role === "seller" && csOn(db, "sellerSignup"))
            return notify(t("coming_soon"), "error");
        const loginId = String(form.mobile || "").trim(); // ye field ab Mobile Number ya Email dono accept karta hai
        if (!loginId)
            return notify(tt("m_mobile_number_ya_email_daale"), "error");
        const lockKey = `${role}:${loginId}`;
        const lock = checkLockout(lockKey);
        if (lock.locked)
            return notify(tt("mt_bahut_zyada_galat_attempts_x").replace("{0}", (Math.ceil(lock.remaining / 60))), "error");
        setBusy(true);
        // Local check — sab data isi browser ke localStorage mein hai, koi backend call nahi.
        const arr = role === "seller" ? db.sellers : db.users;
        const found = (arr || []).find(rec => rec.role === role && (rec.mobile === loginId || (rec.email && rec.email === loginId)) && rec.password === form.password);
        setBusy(false);
        if (!found) {
            const rec = recordFailedAttempt(lockKey);
            const left = MAX_ATTEMPTS - rec.count;
            return notify(left > 0 ? `Invalid mobile/email ya password (${left} attempts bache hain)` : "Bahut zyada attempts — 5 minute ke liye lock ho gaya", "error");
        }
        resetAttempts(lockKey);
        const u = found;
        if (role === "seller" && u.status === "blocked")
            return notify(tt("m_aapka_seller_account_blocked"), "error");
        if (u.authSecret) {
            setMatchedAccount({ role, record: u });
            setStage("totp-verify");
        }
        else {
            finishLogin({ role, record: u });
        }
    };
    // Registration local hi complete hoti hai — koi backend nahi, record seedha localStorage db mein jaata hai.
    const finalizeRegister = async (roleArg, record) => record;
    const doRegister = async () => {
        var _a;
        if (role === "seller" && csOn(db, "sellerSignup"))
            return notify(t("coming_soon"), "error");
        if (!form.password || !form.confirmPassword || (role === "customer" ? !form.name : !form.shopName)) {
            return notify(tt("m_sabhi_zaroori_fields_bharein"), "error");
        }
        if (!form.mobile && !form.email)
            return notify(tt("m_mobile_number_ya_email_mein_"), "error");
        if (form.mobile && !isValidIndianMobile(form.mobile))
            return notify(tt("m_valid_10_digit_mobile_number"), "error");
        if (form.email && !isValidEmail(form.email))
            return notify(tt("m_valid_email_address_daalein"), "error");
        if (form.password !== form.confirmPassword)
            return notify(tt("m_password_aur_confirm_passwor"), "error");
        if (!isStrongEnoughPassword(form.password))
            return notify(tt("m_password_kam_se_kam_6_charac"), "error");
        if (role === "customer") {
            // Customer 2FA (Authenticator) is OPTIONAL. Mobile OTP verification tabhi hoti hai jab mobile diya gaya ho —
            // email-only registration seedha complete ho jaati hai.
            if (form.mobile && db.users.some(u => u.mobile === form.mobile))
                return notify(tt("m_ye_mobile_number_pehle_se_re"), "error");
            if (form.email && db.users.some(u => u.email === form.email))
                return notify(tt("m_ye_email_pehle_se_registered"), "error");
            const u = {
                id: uid("u"), role: "customer", name: form.name, mobile: form.mobile, email: form.email || "", password: form.password,
                address: [], wishlist: [], referralCode: form.name.slice(0, 4).toUpperCase() + Math.floor(Math.random() * 900 + 100),
                isReseller: false, resellerCode: null, resellerWalletBalance: 0, resellerStatus: "none", resellerKyc: null,
                location: regLocation, authSecret: null, createdAt: nowISO(),
            };
            if (form.mobile) {
                setPendingAccount({ role: "customer", record: u, secret: null });
                setStage("phone-verify");
            }
            else {
                // Email-only registration — no mobile to OTP-verify, so complete registration right away.
                setBusy(true);
                const safeUser = await finalizeRegister("customer", u);
                setBusy(false);
                if (!safeUser)
                    return;
                update(d => d.users.push(safeUser));
                login({ role: "customer", id: safeUser.id, name: safeUser.name, mobile: safeUser.mobile });
                notify(tt("m_registration_successful_welc"), "success");
                setView("home");
            }
        }
        else {
            // Seller 2FA (Authenticator) is OPTIONAL too — jaise customer, baad mein Security Settings se on kar sakte hain.
            // Mobile OTP verification tabhi hoti hai jab mobile diya gaya ho — email-only registration seedha complete ho jaati hai.
            if (form.mobile && db.sellers.some(s => s.mobile === form.mobile))
                return notify(tt("m_ye_mobile_number_pehle_se_re"), "error");
            if (form.email && db.sellers.some(s => s.email === form.email))
                return notify(tt("m_ye_email_pehle_se_registered"), "error");
            const s = {
                id: uid("s"), userId: uid("u"), shopName: form.shopName, area: form.area || "", ownerName: form.ownerName || form.name,
                mobile: form.mobile, email: form.email || "", password: form.password, status: "pending",
                kyc: { pan: "", aadhaar: "", verified: false }, bank: { accountNo: "", ifsc: "", holder: "", verified: false },
                upi: { id: "", verified: false }, commissionPct: (_a = db.defaultCommissionPct) !== null && _a !== void 0 ? _a : 10, walletBalance: 0,
                location: regLocation, authSecret: null, createdAt: nowISO(), address: "",
            };
            if (form.mobile) {
                setPendingAccount({ role: "seller", record: s, secret: null });
                setStage("phone-verify");
            }
            else {
                setBusy(true);
                const safeUser = await finalizeRegister("seller", s);
                setBusy(false);
                if (!safeUser)
                    return;
                update(d => d.sellers.push(safeUser));
                login({ role: "seller", id: safeUser.id, name: safeUser.ownerName, shopName: safeUser.shopName, mobile: safeUser.mobile });
                notify(tt("m_seller_registration_submit_h"), "success");
                setView("seller-kyc");
            }
        }
    };
    const onTotpSetupSuccess = async () => {
        setBusy(true);
        const safeUser = await finalizeRegister(pendingAccount.role, pendingAccount.record);
        setBusy(false);
        if (!safeUser) {
            setStage("form");
            setPendingAccount(null);
            return;
        }
        if (pendingAccount.role === "customer") {
            update(d => d.users.push(safeUser));
            login({ role: "customer", id: safeUser.id, name: safeUser.name, mobile: safeUser.mobile });
            notify(tt("m_registration_successful_aur_"), "success");
            setView("home");
        }
        else {
            update(d => d.sellers.push(safeUser));
            login({ role: "seller", id: safeUser.id, name: safeUser.ownerName, shopName: safeUser.shopName, mobile: safeUser.mobile });
            notify(tt("m_seller_registration_submit_h"), "success");
            setView("seller-kyc");
        }
        setStage("form");
        setPendingAccount(null);
    };
    const sendOtp = () => {
        if (!form.mobile)
            return notify(tt("m_pehle_mobile_number_daalein"), "error");
        const code = String(Math.floor(1000 + Math.random() * 9000));
        setGenOtp(code);
        setOtpStage(true);
        notify(tt("mt_otp_x_sms_gateway_abhi_conne").replace("{0}", (code)), "info");
    };
    const resetPassword = async () => {
        if (otp !== genOtp)
            return notify(tt("m_otp_galat_hai"), "error");
        if (!form.password)
            return notify(tt("m_naya_password_daalein"), "error");
        if (form.password.length < 6)
            return notify(tt("m_password_kam_se_kam_6_charac"), "error");
        setBusy(true);
        // Local reset — seedha localStorage db ke andar us account ka password update karta hai.
        const arrayKey = role === "seller" ? "sellers" : "users";
        const found = (db[arrayKey] || []).some(rec => rec.role === role && (rec.mobile === form.mobile || (rec.email && rec.email === form.mobile)));
        setBusy(false);
        if (!found)
            return notify(tt("m_ye_mobile_email_registered_n"), "error");
        update(d => {
            const idx = d[arrayKey].findIndex(rec => rec.role === role && (rec.mobile === form.mobile || (rec.email && rec.email === form.mobile)));
            if (idx !== -1)
                d[arrayKey][idx].password = form.password;
        });
        notify(tt("m_password_reset_ho_gaya_ab_lo"), "success");
        setMode("login");
        setOtpStage(false);
        setOtp("");
        setGenOtp(null);
    };
    if (stage === "phone-verify" && pendingAccount) {
        return (<div style={{ maxWidth: 420, margin: "40px auto", padding: "0 16px" }}><div className="jb-card" style={{ padding: 24 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: T.maroonDark }}>{tt("l_mobile_number_verify_karei")}</div><RegistrationSmsOtpGate mobile={pendingAccount.record.mobile} onSuccess={async () => {
                        setBusy(true);
                        const safeUser = await finalizeRegister(pendingAccount.role, pendingAccount.record);
                        setBusy(false);
                        if (!safeUser) {
                            setStage("form");
                            setPendingAccount(null);
                            return;
                        }
                        if (pendingAccount.role === "customer") {
                            update(d => d.users.push(safeUser));
                            login({ role: "customer", id: safeUser.id, name: safeUser.name, mobile: safeUser.mobile });
                            notify(tt("m_registration_successful_welc"), "success");
                            setView("home");
                        }
                        else {
                            update(d => d.sellers.push(safeUser));
                            login({ role: "seller", id: safeUser.id, name: safeUser.ownerName, shopName: safeUser.shopName, mobile: safeUser.mobile });
                            notify(tt("m_seller_registration_submit_h"), "success");
                            setView("seller-kyc");
                        }
                        setStage("form");
                        setPendingAccount(null);
                    }} onCancel={(msg) => { setStage("form"); setPendingAccount(null); if (msg)
                        notify(msg, "error"); }} /></div></div>);
    }
    if (stage === "totp-setup" && pendingAccount) {
        return (<div style={{ maxWidth: 420, margin: "40px auto", padding: "0 16px" }}><div className="jb-card" style={{ padding: 24 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: T.maroonDark }}>📱 2FA Setup ({pendingAccount.role === "customer" ? "Customer" : "Seller"})</div><TotpGate secret={pendingAccount.secret} mode="setup" accountLabel={`Jila Bazar ${pendingAccount.role === "customer" ? pendingAccount.record.name : pendingAccount.record.shopName}`} onSuccess={onTotpSetupSuccess} onCancel={() => { setStage("form"); setPendingAccount(null); }} /></div></div>);
    }
    if (stage === "totp-verify" && matchedAccount) {
        return (<div style={{ maxWidth: 420, margin: "40px auto", padding: "0 16px" }}><div className="jb-card" style={{ padding: 24 }}><div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: T.maroonDark }}>{tt("l_2fa_verification")}</div><TotpGate secret={matchedAccount.record.authSecret} mode="verify" accountLabel={matchedAccount.role === "customer" ? matchedAccount.record.name : matchedAccount.record.shopName} onSuccess={() => { finishLogin(matchedAccount); setStage("form"); setMatchedAccount(null); }} onCancel={(msg) => { setStage("form"); setMatchedAccount(null); if (msg)
                        notify(msg, "error"); }} /></div></div>);
    }
    return (<div style={{ maxWidth: 420, margin: "40px auto", padding: "0 16px" }}><div className="jb-card" style={{ padding: 24 }}><div style={{ textAlign: "center", marginBottom: 16 }}><div className="jb-display" style={{ fontSize: 28, color: T.maroon }}>{t("brand_name")}</div><div style={{ fontSize: 12, color: "#8a7360" }}>{t("tagline")}</div></div><div style={{ display: "flex", gap: 8, marginBottom: 16, background: T.cream, borderRadius: 10, padding: 4 }}><div className={`jb-tab ${role === "customer" ? "active" : ""}`} style={{ flex: 1, textAlign: "center" }} onClick={() => setRole("customer")}>{t("customer")}</div><div className={`jb-tab ${role === "seller" ? "active" : ""}`} style={{ flex: 1, textAlign: "center" }} onClick={() => setRole("seller")}>{t("seller")}</div></div>{role === "seller" && csOn(db, "sellerSignup") && <div style={{ background: T.cream, borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 13, textAlign: "center", color: T.maroonDark }}>{"🚧 "}{t("coming_soon")}{" — "}{(db.comingSoon && db.comingSoon.message) || t("coming_soon_msg")}</div>}{mode === "login" && (<><Field label={t("mobileLabel")} placeholder={t("mobilePlaceholder")} value={form.mobile} onChange={set("mobile")} /><PasswordField label={t("passwordLabel")} placeholder={t("passwordLabel")} value={form.password} onChange={set("password")} /><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={doLogin}>{t("loginBtn")}</button><div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 12 }}><span style={{ color: T.maroon, cursor: "pointer" }} onClick={() => setMode("register")}>{t("registerLink")}</span><span style={{ color: T.maroon, cursor: "pointer" }} onClick={() => setMode("forgot")}>{t("resetLink")}</span></div></>)}{mode === "register" && (<>{role === "customer" ? (<Field label={tt("l_full_name")} placeholder={tt("m_aapka_naam")} value={form.name} onChange={set("name")} />) : (<><Field label={tt("m_dukaan_ka_naam")} placeholder={tt("m_dukaan_ka_naam")} value={form.shopName} onChange={set("shopName")} /><Field label={tt("l_area_locality")} placeholder={tt("m_jaise_boring_road_patna")} value={form.area || ""} onChange={set("area")} /><Field label={tt("m_malik_ka_naam")} placeholder={tt("m_malik_ka_naam")} value={form.ownerName} onChange={set("ownerName")} /></>)}<Field label={tt("l_mobile_number_optional_aga")} placeholder={tt("m_10_digit_mobile")} value={form.mobile} onChange={set("mobile")} /><Field label={tt("l_email_optional_agar_mobile")} placeholder="aapka@email.com" value={form.email} onChange={set("email")} /><PasswordField label={tt("passwordLabel")} placeholder={tt("m_password_banayein")} value={form.password} onChange={set("password")} /><PasswordField label={tt("l_confirm_password")} placeholder={tt("m_password_dobara_likhein")} value={form.confirmPassword} onChange={set("confirmPassword")} /><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={doRegister}>{tt("ui_register")}</button><div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: T.maroon, cursor: "pointer" }} onClick={() => setMode("login")}>{tt("ui_pehle_se_account_hai_login_k")}</div></>)}{mode === "forgot" && (<><Field label={tt("registered_mobile_label")} placeholder={tt("m_10_digit_mobile")} value={form.mobile} onChange={set("mobile")} />{!otpStage ? (<button className="jb-btn jb-btn-gold" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={sendOtp}>{tt("ui_send_otp")}</button>) : (<><Field label={tt("l_enter_otp")} placeholder={tt("m_4_digit_otp")} value={otp} onChange={(e) => setOtp(e.target.value)} /><PasswordField label={tt("m_naya_password")} placeholder={tt("m_naya_password")} value={form.password} onChange={set("password")} /><button className="jb-btn jb-btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={resetPassword}>{tt("ui_reset_password")}</button></>)}<div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: T.maroon, cursor: "pointer" }} onClick={() => setMode("login")}>{"\u2190 " + tt("back_to_login")}</div></>)}</div></div>);
}
