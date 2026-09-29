import React, { useState, useEffect, createContext, useContext } from "react";
import { memStorage } from "./storage.js";
import { LANG_KEY, SEED, SESSION_KEY, loadDB, nowISO, saveDB, uid } from "./database.js";
import { I18N } from "./translations.js";
import { T } from "./theme.js";
import { JBIcon, Toast } from "./BasicUI.jsx";

/* ---------------------------- APP CONTEXT ---------------------------- */
export const AppCtx = createContext(null);

export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }) {
    const [db, setDb] = useState(null);
    const [dbLoaded, setDbLoaded] = useState(false);
    const [session, setSession] = useState(() => {
        try {
            return JSON.parse(memStorage.getItem(SESSION_KEY) || "null");
        }
        catch {
            return null;
        }
    });
    const [toast, setToast] = useState(null);
    const [lang, setLangState] = useState(() => memStorage.getItem(LANG_KEY) || "hi");
    const setLang = (l) => { setLangState(l); memStorage.setItem(LANG_KEY, l); };
    const t = (key) => { var _o; const ov = (_o = db.i18nOverrides) === null || _o === void 0 ? void 0 : _o[lang]; return (ov && ov[key]) || (I18N[lang] && I18N[lang][key]) || I18N.hi[key] || key; };
    // App start par Firebase (Firestore) se JilaBazar ka SHARED data load hota hai — taake sab
    // devices/browsers ek hi data dekhein. Agar Firebase available na ho (config missing, offline,
    // ya rules block kar dein) to app localStorage pe fallback ho jaati hai, taake testing rukey nahi.
    const FIREBASE_DOC_PATH = ["jilabazar", "database"];
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const fb = window.__jbFirestore;
            if (!fb) {
                setDb(loadDB());
                setDbLoaded(true);
                return;
            }
            try {
                const ref = fb.doc(fb.db, ...FIREBASE_DOC_PATH);
                const snap = await fb.getDoc(ref);
                if (cancelled)
                    return;
                if (snap.exists()) {
                    const parsed = snap.data();
                    const merged = { ...structuredClone(SEED), ...parsed };
                    Object.keys(SEED).forEach(k => { if (merged[k] === undefined)
                        merged[k] = structuredClone(SEED[k]); });
                    setDb(merged);
                }
                else {
                    const initial = loadDB(); // agar localStorage mein purana data ho to usi se Firebase seed karein
                    await fb.setDoc(ref, initial);
                    if (!cancelled)
                        setDb(initial);
                }
            }
            catch (e) {
                console.error("Firebase load failed, falling back to local data:", e);
                if (!cancelled)
                    setDb(loadDB());
            }
            finally {
                if (!cancelled)
                    setDbLoaded(true);
            }
        })();
        return () => { cancelled = true; };
    }, []);
    // Har update Firebase mein save hoti hai (sab devices ke liye shared), aur localStorage mein bhi
    // (fallback backup, taake Firebase down ho tab bhi kaam na ruke).
    useEffect(() => {
        if (!dbLoaded || !db)
            return;
        const timer = setTimeout(() => {
            saveDB(db); // local backup — hamesha turant
            const fb = window.__jbFirestore;
            if (fb) {
                const ref = fb.doc(fb.db, ...FIREBASE_DOC_PATH);
                fb.setDoc(ref, db).catch(e => console.error("Firebase save failed:", e));
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [db, dbLoaded]);
    const update = (fn) => setDb(prev => {
        if (!prev)
            return prev;
        const next = structuredClone(prev);
        fn(next);
        return next;
    });
    const notify = (msg, type = "info") => {
        setToast({ msg, type, id: uid("t") });
        setTimeout(() => setToast(t => (t && t.msg === msg ? null : t)), 3000);
    };
    // Session sirf isi device/browser mein rehta hai — Firebase ke shared document mein NAHI jaata,
    // warna site par aane wale sabhi logon ko ek hi account se logged-in dikhega.
    const login = (s) => { setSession(s); memStorage.setItem(SESSION_KEY, JSON.stringify(s)); };
    const logout = () => {
        setSession(null);
        memStorage.removeItem(SESSION_KEY);
        memStorage.removeItem("jilabazar_cart"); // avoid leaking one account's cart into the next login on a shared device
    };
    const logAudit = (action, detail) => update(d => {
        d.auditLogs.unshift({ id: uid("log"), action, detail, at: nowISO(), by: (session === null || session === void 0 ? void 0 : session.name) || "system" });
    });
    if (db === null) {
        return (<div style={{
                minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
                fontFamily: "'Poppins', sans-serif", color: T.maroon, fontSize: 15, background: T.cream,
            }}><JBIcon size={64} />Loading जिला बाज़ार...</div>);
    }
    const value = { db, update, session, login, logout, notify, logAudit, lang, setLang, t };
    return <AppCtx.Provider value={value}>{children}{toast && <Toast toast={toast} />}</AppCtx.Provider>;
}
