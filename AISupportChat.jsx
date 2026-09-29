import React, { useState, useEffect, useRef } from "react";
import { useApp } from "./AppContext.jsx";
import { nowISO, uid } from "./database.js";
import { callOpenAI, friendlyAIError } from "./helpers.js";
import { T } from "./theme.js";

/* ============================================================================
   MAIN APP — ROUTING
   ============================================================================ */
export function AISupportChat({ open, onClose }) {
    const { t: tt } = useApp();
    const { db, session, update } = useApp();
    const [messages, setMessages] = useState([
        { role: "assistant", text: tt("ai_greeting") },
    ]);
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const scrollRef = useRef(null);
    useEffect(() => { var _a; (_a = scrollRef.current) === null || _a === void 0 ? void 0 : _a.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);
    const persistLog = (allMessages) => {
        if (!session)
            return; // only log conversations from logged-in accounts (customer/seller/reseller)
        update(d => {
            let log = d.aiChatLogs.find(l => l.userId === session.id);
            const userLabel = session.role === "seller" ? session.shopName : session.name;
            if (!log) {
                log = { id: uid("ac"), userId: session.id, userRole: session.role, userName: userLabel, messages: [], resolved: false, updatedAt: nowISO() };
                d.aiChatLogs.unshift(log);
            }
            log.messages = allMessages;
            log.updatedAt = nowISO();
            log.resolved = false; // any new activity reopens it for admin review
        });
    };
    const send = async () => {
        if (!input.trim() || busy)
            return;
        const userMsg = input.trim();
        setInput("");
        const afterUser = [...messages, { role: "user", text: userMsg }];
        setMessages(afterUser);
        setBusy(true);
        try {
            const user = db.users.find(u => u.id === (session === null || session === void 0 ? void 0 : session.id));
            const myOrders = (session === null || session === void 0 ? void 0 : session.role) === "customer" ? db.orders.filter(o => o.customerId === session.id).slice(0, 5).map(o => `Order #${o.id.slice(-6)}: ${o.status}, ₹${o.total}, items: ${o.items.map(it => it.name).join(", ")}`).join("\n") : "N/A";
            const history = afterUser.slice(-6).map(m => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.text}`).join("\n");
            const prompt = `Aap Jila Bazar (ek hyperlocal e-commerce marketplace) ke friendly customer support assistant hain. Hinglish mein, chhote aur helpful jawab dein.

Policies: Return/refund delivered order ke baad request kar sakte hain (Order History se). Delivery OTP delivery ke waqt dikhana hota hai. COD aur online dono payment available hain. Order cancel sirf "processing" status mein ho sakta hai.

Customer ke recent orders:
${myOrders}

Conversation ab tak:
${history}

Customer: ${userMsg}

Sirf apna reply dein (Assistant: prefix ke bina), 2-4 sentences mein.`;
            const reply = await callOpenAI(prompt, db.openaiApiKey, 300);
            const finalMsgs = [...afterUser, { role: "assistant", text: reply.trim() || "Maaf kijiye, samajh nahi paaya. Dobara try karein ya Help & Support (WhatsApp) use karein." }];
            setMessages(finalMsgs);
            persistLog(finalMsgs);
        }
        catch (e) {
            const errText = friendlyAIError(e) + " Ya Help & Support (WhatsApp) use karein.";
            const finalMsgs = [...afterUser, { role: "assistant", text: errText }];
            setMessages(finalMsgs);
            persistLog(finalMsgs);
        }
        finally {
            setBusy(false);
        }
    };
    if (!open)
        return null;
    return (<div className="jb-modal-backdrop" style={{ alignItems: "flex-end", justifyContent: "flex-end", padding: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget)
            onClose(); }}><div className="jb-card" style={{ width: "100%", maxWidth: 380, height: "70vh", margin: 16, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}><div style={{ background: T.maroon, color: "#fff", padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontWeight: 700 }}>{"\u2728 " + tt("ai_support")}</div><span onClick={onClose} style={{ cursor: "pointer", fontSize: 18 }}>✕</span></div><div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14 }} className="jb-scroll">{messages.map((m, i) => (<div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}><div style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: 12, fontSize: 13, background: m.role === "user" ? T.maroon : T.cream, color: m.role === "user" ? "#fff" : T.ink }}>{m.text}</div></div>))}{busy && <div style={{ fontSize: 12, color: "#8a7360" }}>{tt("ui_ai_type_kar_raha_hai")}</div>}</div><div style={{ display: "flex", gap: 6, padding: 10, borderTop: `1px solid ${T.border}` }}><input className="jb-input" placeholder={tt("m_apna_sawal_likhein")} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} /><button className="jb-btn jb-btn-primary" disabled={busy} onClick={send}>➤</button></div></div></div>);
}
