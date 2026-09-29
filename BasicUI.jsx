import React from "react";
import { T } from "./theme.js";

// App ka logo/icon — header, loading screen, aur admin/seller panels mein hamesha yahi use hota hai.
export function JBIcon({ size = 32 }) {
    return (<svg width={size} height={size} viewBox="0 0 380 380" style={{ flexShrink: 0 }} aria-hidden="true"><rect x="0" y="0" width="380" height="380" rx="76" fill="#0B2A59" /><path d="M 152 100 A 34 34 0 0 1 220 100" fill="none" stroke="#F5A000" strokeWidth="14" strokeLinecap="round" /><path d="M 128 118 L 244 118 L 224 158 L 148 158 Z" fill="#F5A000" /><path d="M 224 158 L 224 250 C 224 268 214 280 196 280 L 190 280 L 190 316 L 196 316 C 246 316 268 284 268 250 L 268 158 Z" fill="#18B83A" /><circle cx="118" cy="292" r="72" fill="#FFFFFF" /><circle cx="140" cy="292" r="62" fill="#0B2A59" /><path d="M 96 268 L 118 268 L 130 306 L 176 306 L 186 278 L 122 278" fill="none" stroke="#0B2A59" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" /><circle cx="132" cy="320" r="8" fill="#0B2A59" /><circle cx="168" cy="320" r="8" fill="#0B2A59" /></svg>);
}

export function DefaultAvatarIcon({ size = 60 }) {
    return (<svg width={size} height={size} viewBox="0 0 100 100" style={{ flexShrink: 0 }} aria-hidden="true"><circle cx="50" cy="50" r="50" fill="#FFE9D6" /><path d="M 43 30 C 43 22 47 16 50 16 C 53 16 57 22 57 30 L 57 52 L 43 52 Z" fill="#D98B4A" /><path d="M 50 16 L 50 52" stroke="#B5702F" strokeWidth="1.2" /><path d="M 34 58 C 34 52 38 48 43 48 L 57 48 C 62 48 66 52 66 58 L 66 66 C 66 68 64 70 62 70 L 38 70 C 36 70 34 68 34 66 Z" fill="#D98B4A" /><rect x="37" y="62" width="10" height="4" rx="2" fill="#8A4B22" /><rect x="53" y="62" width="10" height="4" rx="2" fill="#8A4B22" /></svg>);
}

export const GlobalStyle = () => (<style>{`
    @import url('https://fonts.googleapis.com/css2?family=Yatra+One&family=Poppins:wght@300;400;500;600;700&display=swap');
    * { box-sizing: border-box; }
    body, html { margin:0; padding:0; overflow-x: hidden; max-width: 100%; }
    .jb-root {
      font-family: 'Poppins', sans-serif;
      background: ${T.cream};
      color: ${T.ink};
      min-height: 100vh;
      background-image:
        radial-gradient(circle at 10% 10%, ${T.goldLight}22 0%, transparent 40%),
        radial-gradient(circle at 90% 20%, ${T.rose}22 0%, transparent 40%);
    }
    .jb-display { font-family: 'Yatra One', cursive; letter-spacing: 0.5px; }
    .jb-btn {
      border: none; cursor: pointer; border-radius: 8px; padding: 10px 18px;
      font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 14px;
      transition: transform .15s ease, box-shadow .15s ease, filter .15s ease; display:inline-flex; align-items:center; gap:6px;
    }
    .jb-btn:active { transform: scale(0.97); }
    .jb-btn-primary { background: ${T.maroon}; color: #fff; box-shadow: 0 2px 6px rgba(19,25,33,0.25); }
    .jb-btn-primary:hover { background: ${T.maroonDark}; box-shadow: 0 4px 12px rgba(19,25,33,0.35); transform: translateY(-1px); }
    .jb-btn-gold { background: linear-gradient(180deg, ${T.goldLight}, ${T.gold}); color: ${T.ink}; box-shadow: 0 2px 6px rgba(255,153,0,0.35); border: 1px solid #a86400; }
    .jb-btn-gold:hover { filter: brightness(1.04); transform: translateY(-1px); }
    .jb-btn-outline { background: transparent; border: 1.5px solid ${T.maroon}; color: ${T.maroon}; }
    .jb-btn-outline:hover { background: ${T.maroon}11; }
    .jb-btn-ghost { background: transparent; color: ${T.maroon}; padding: 6px 10px; }
    .jb-btn-danger { background: ${T.danger}; color: #fff; box-shadow: 0 2px 8px rgba(204,12,57,0.25); }
    .jb-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; transform: none; }
    .jb-card {
      background: #fff; border-radius: 8px; border: 1px solid ${T.border};
      box-shadow: 0 1px 2px rgba(15,17,17,0.08);
      transition: box-shadow .2s ease, transform .2s ease;
    }
    .jb-input {
      width: 100%; padding: 11px 12px; border-radius: 8px; border: 1.5px solid ${T.border};
      transition: border-color .15s ease, box-shadow .15s ease;
      font-family: 'Poppins', sans-serif; font-size: 14px; background: #fff; color: ${T.ink};
    }
    .jb-input:focus { outline: none; border-color: ${T.gold}; box-shadow: 0 0 0 3px ${T.gold}33; }
    .jb-card-hover { cursor: pointer; }
    .jb-card-hover:hover { box-shadow: 0 10px 28px rgba(122,30,42,0.16); transform: translateY(-3px); }
    .jb-label { font-size: 12px; font-weight: 600; color: ${T.maroonDark}; margin-bottom: 4px; display:block; }
    .jb-badge {
      display:inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
    }
    .jb-scroll::-webkit-scrollbar { height: 6px; width:6px; }
    .jb-scroll::-webkit-scrollbar-thumb { background: ${T.goldLight}; border-radius: 10px; }
    .jb-tab {
      padding: 9px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;
      color: ${T.maroonDark}; white-space: nowrap; transition: background .15s ease, color .15s ease;
    }
    .jb-tab.active { background: ${T.maroon}; color: #fff; }
    table.jb-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    table.jb-table th { text-align:left; padding: 8px 10px; background: ${T.cream}; color: ${T.maroonDark}; font-size:11px; text-transform:uppercase; letter-spacing: .5px; }
    table.jb-table td { padding: 8px 10px; border-top: 1px solid ${T.border}; }
    .jb-modal-backdrop {
      position: fixed; inset: 0; background: rgba(42,27,18,0.55); display:flex; align-items:center; justify-content:center; z-index: 200; padding: 16px;
    }
    ::selection { background: ${T.goldLight}; }
    @keyframes jb-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .jb-view-fade { animation: jb-fade-in .25s ease; }
  `}</style>);

export function Toast({ toast }) {
    const bg = toast.type === "error" ? T.danger : toast.type === "success" ? T.success : T.maroon;
    return (<div style={{
            position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
            background: bg, color: "#fff", padding: "10px 18px", borderRadius: 10, fontSize: 13,
            fontWeight: 600, zIndex: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.25)", maxWidth: "90vw",
        }}>{toast.msg}</div>);
}
