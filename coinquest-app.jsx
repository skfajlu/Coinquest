import { useState, useEffect } from "react";

// ── Storage helpers ─────────────────────────────────────────────────────────
const STORAGE_KEY = "coinquest_v2_users";
const SESSION_KEY = "coinquest_v2_session";
const loadUsers = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; } };
const saveUsers = (u) => localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
const loadSession = () => localStorage.getItem(SESSION_KEY);
const saveSession = (u) => localStorage.setItem(SESSION_KEY, u);
const clearSession = () => localStorage.removeItem(SESSION_KEY);
const today = () => new Date().toDateString();
const genReferCode = (name) => name.slice(0,3).toUpperCase() + Math.floor(1000+Math.random()*9000);

// ── Constants ───────────────────────────────────────────────────────────────
const COINS_PER_RUPEE = 100;

const REDEEM_CODES = {
  "EARN50":   { coins: 50,  label: "₹5 Bonus" },
  "BOOST100": { coins: 100, label: "₹10 Bonus" },
  "VIP200":   { coins: 200, label: "₹20 VIP" },
  "LAUNCH25": { coins: 25,  label: "₹2.5 Gift" },
};

// ── Offer Providers (replace IDs with your real keys after registration) ────
const OFFER_PROVIDERS = [
  {
    id: "timewall",
    name: "Timewall",
    icon: "⏱️",
    color: "#00c9a7",
    desc: "Surveys, Offers & More",
    category: "survey",
    getUrl: (userId) => `https://offers.timewall.io/wall?app_token=28b223808f624003&user_id=${userId}`,
    coinsLabel: "5–500 coins per offer",
    status: "active",
  },
  {
    id: "bitlabs",
    name: "BitLabs Surveys",
    icon: "📋",
    color: "#6c63ff",
    desc: "High-paying surveys",
    category: "survey",
    // Replace YOUR_BITLABS_TOKEN from bitlabs.ai
    getUrl: (userId) => `https://web.bitlabs.ai?token=YOUR_BITLABS_TOKEN&uid=${userId}`,
    coinsLabel: "20–500 coins per survey",
    status: "setup_needed",
  },
  {
    id: "adgate",
    name: "AdGate Offers",
    icon: "🎯",
    color: "#ff6b35",
    desc: "App installs & offers",
    category: "offers",
    // Replace YOUR_ADGATE_ID from adgatemedia.com
    getUrl: (userId) => `https://wall.adgaterewards.com/YOUR_ADGATE_ID/${userId}`,
    coinsLabel: "10–300 coins per task",
    status: "setup_needed",
  },
  {
    id: "adjoe",
    name: "Adjoe Games",
    icon: "🎮",
    color: "#f72585",
    desc: "Play games & earn",
    category: "games",
    // Replace YOUR_ADJOE_APP_KEY from adjoe.io
    getUrl: (userId) => `https://app.adjoe.zone/wall?sdk=YOUR_ADJOE_APP_KEY&user_id=${userId}`,
    coinsLabel: "50–1000 coins per game",
    status: "setup_needed",
  },
  {
    id: "ogads",
    name: "OGAds",
    icon: "🛍️",
    color: "#ffd60a",
    desc: "Shopping & install offers",
    category: "offers",
    // Replace YOUR_OGADS_KEY from ogads.com
    getUrl: (userId) => `https://ogads-pa.com/wall/YOUR_OGADS_KEY?user_id=${userId}`,
    coinsLabel: "15–200 coins per offer",
    status: "setup_needed",
  },
  {
    id: "pubscale",
    name: "Pubscale Ads",
    icon: "📺",
    color: "#4cc9f0",
    desc: "Watch video ads",
    category: "video",
    // Replace YOUR_PUBSCALE_ID from pubscale.com
    getUrl: (userId) => `https://ads.pubscale.com/wall?pub_id=YOUR_PUBSCALE_ID&uid=${userId}`,
    coinsLabel: "5–30 coins per video",
    status: "setup_needed",
  },
  {
    id: "pollfish",
    name: "Pollfish",
    icon: "🐟",
    color: "#00b4d8",
    desc: "Quick polls & surveys",
    category: "survey",
    // Replace YOUR_POLLFISH_KEY from pollfish.com
    getUrl: (userId) => `https://wss.pollfish.com/v2/device/register/true?api_key=YOUR_POLLFISH_KEY&debug=true&user_id=${userId}`,
    coinsLabel: "10–150 coins per poll",
    status: "setup_needed",
  },
  {
    id: "adcolony",
    name: "AdColony Videos",
    icon: "🎬",
    color: "#e63946",
    desc: "Premium video rewards",
    category: "video",
    // Replace YOUR_ADCOLONY_KEY from adcolony.com
    getUrl: (userId) => `https://adc3.adcolony.com/v4/user_ads?adc_pub=YOUR_ADCOLONY_KEY&user_id=${userId}`,
    coinsLabel: "10–50 coins per video",
    status: "setup_needed",
  },
];

const CATEGORIES = [
  { id: "all",     label: "All",      icon: "⚡" },
  { id: "survey",  label: "Surveys",  icon: "📋" },
  { id: "offers",  label: "Offers",   icon: "🎯" },
  { id: "games",   label: "Games",    icon: "🎮" },
  { id: "video",   label: "Videos",   icon: "📺" },
];

const DAILY_TASKS = [
  { id: "checkin",  icon: "☀️", label: "Daily Check-in",  coins: 10, desc: "Har roz login karo" },
  { id: "watch1",   icon: "📺", label: "Watch Ad Video",   coins: 15, desc: "Short video dekho" },
  { id: "quiz",     icon: "🧠", label: "Daily Quiz",       coins: 25, desc: "Sahi jawab do" },
];

const QUIZ = {
  q: "India ki capital kya hai?",
  opts: ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
  ans: 1,
};

// ── Small Components ────────────────────────────────────────────────────────
function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2800); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)",
      background:"#0d0d1a", color:"#00f5a0", border:"1.5px solid #00f5a044",
      borderRadius:14, padding:"12px 24px", fontFamily:"'Rajdhani',sans-serif",
      fontWeight:700, fontSize:"1rem", zIndex:9999, boxShadow:"0 4px 32px #00f5a022",
      whiteSpace:"nowrap", animation:"toastIn .3s ease",
    }}>{msg}</div>
  );
}

function CoinBurst({ x, y }) {
  return (
    <div style={{
      position:"fixed", left:x-16, top:y-16, pointerEvents:"none", zIndex:9998,
      fontSize:"1.6rem", animation:"burst 1s ease forwards",
    }}>🪙</div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{
      background: color+"22", color, border:`1px solid ${color}44`,
      borderRadius:6, padding:"2px 8px", fontSize:".7rem",
      fontFamily:"'Rajdhani',sans-serif", fontWeight:700,
    }}>{label}</span>
  );
}

// ── Auth Screen ─────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [ref, setRef] = useState("");
  const [err, setErr] = useState("");

  const handle = () => {
    setErr("");
    const users = loadUsers();
    if (!name.trim() || !pass.trim()) { setErr("Naam aur password dono dalo!"); return; }
    if (mode === "login") {
      const u = users[name];
      if (!u || u.password !== pass) { setErr("Galat naam ya password!"); return; }
      saveSession(name); onLogin(u, name);
    } else {
      if (users[name]) { setErr("Yeh naam le liya gaya hai!"); return; }
      let bonus = 0, referrerName = null;
      if (ref.trim()) {
        const r = Object.entries(users).find(([, v]) => v.referCode === ref.trim().toUpperCase());
        if (!r) { setErr("Galat referral code!"); return; }
        bonus = 30; referrerName = r[0];
        users[referrerName].coins += 50;
      }
      const newUser = {
        password: pass, coins: 20 + bonus,
        referCode: genReferCode(name),
        tasksToday: {}, tasksDone: {}, redeemHistory: [],
        referredBy: referrerName, joinedDate: today(),
        usedCodes: [],
      };
      users[name] = newUser;
      saveUsers(users); saveSession(name); onLogin(newUser, name);
    }
  };

  const inp = (ph, val, set, type="text") => (
    <input type={type} placeholder={ph} value={val} onChange={e=>set(e.target.value)}
      onKeyDown={e=>e.key==="Enter"&&handle()}
      style={{
        width:"100%", padding:"13px 16px", borderRadius:12,
        border:"1.5px solid #00f5a033", background:"#060612",
        color:"#e0ffe0", fontFamily:"'Rajdhani',sans-serif",
        fontSize:"1rem", outline:"none", marginBottom:12,
      }} />
  );

  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"radial-gradient(ellipse at 40% 30%,#001a0f 0%,#060612 70%)",
    }}>
      <div style={{
        width:360, background:"#0a0a1888", backdropFilter:"blur(20px)",
        border:"1.5px solid #00f5a022", borderRadius:24,
        padding:"40px 32px", boxShadow:"0 8px 64px #00f5a011",
      }}>
        <div style={{textAlign:"center", marginBottom:32}}>
          <div style={{fontSize:"3rem", marginBottom:6}}>🪙</div>
          <div style={{fontFamily:"'Rajdhani',sans-serif", fontWeight:800,
            fontSize:"2.2rem", color:"#00f5a0", letterSpacing:3}}>COINQUEST</div>
          <div style={{color:"#4a9a6a", fontSize:".82rem", marginTop:4}}>
            Task karo · Coins kamao · Paise lo
          </div>
        </div>

        <div style={{display:"flex", gap:8, marginBottom:22}}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setErr("");}} style={{
              flex:1, padding:"10px 0", borderRadius:10, border:"none", cursor:"pointer",
              fontFamily:"'Rajdhani',sans-serif", fontWeight:800, fontSize:"1rem",
              background: mode===m ? "#00f5a0" : "transparent",
              color: mode===m ? "#060612" : "#00f5a0",
              outline: mode===m ? "none" : "1.5px solid #00f5a033",
              transition:"all .2s",
            }}>{m==="login" ? "LOGIN" : "SIGN UP"}</button>
          ))}
        </div>

        {inp("Username", name, setName)}
        {inp("Password", pass, setPass, "password")}
        {mode==="signup" && inp("Referral Code (optional)", ref, setRef)}
        {err && <div style={{color:"#ff6b6b", fontFamily:"'Rajdhani',sans-serif",
          marginBottom:10, fontSize:".88rem"}}>⚠️ {err}</div>}

        <button onClick={handle} style={{
          width:"100%", padding:"14px 0", borderRadius:12, border:"none", cursor:"pointer",
          background:"linear-gradient(135deg,#00f5a0,#00b4d8)", color:"#060612",
          fontFamily:"'Rajdhani',sans-serif", fontWeight:800, fontSize:"1.1rem",
          boxShadow:"0 4px 24px #00f5a033", letterSpacing:1,
        }}>
          {mode==="login" ? "LOGIN →" : "SIGN UP & GET 20 COINS 🎁"}
        </button>

        {mode==="signup" && (
          <div style={{
            marginTop:14, padding:"10px 14px", borderRadius:10,
            background:"#00f5a011", border:"1px solid #00f5a022",
            fontSize:".78rem", color:"#4a9a6a", fontFamily:"'Rajdhani',sans-serif",
          }}>
            🎁 Signup bonus: 20 coins<br/>
            👥 Referral se join: +30 bonus coins<br/>
            💰 1000 coins = ₹10
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────────────────────
const TABS = [
  { label:"Earn",    icon:"⚡" },
  { label:"Offers",  icon:"🏪" },
  { label:"Redeem",  icon:"💸" },
  { label:"History", icon:"📜" },
  { label:"Profile", icon:"👤" },
];

export default function App() {
  const [username, setUsername] = useState(null);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState(null);
  const [bursts, setBursts] = useState([]);
  const [category, setCategory] = useState("all");
  const [quizOpen, setQuizOpen] = useState(false);
  const [redeemInput, setRedeemInput] = useState("");
  const [upiInput, setUpiInput] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [offerOpen, setOfferOpen] = useState(null);

  useEffect(() => {
    const sn = loadSession();
    if (sn) { const u = loadUsers(); if (u[sn]) { setUsername(sn); setUser(u[sn]); } }
  }, []);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700;800&family=Space+Mono&display=swap');
      @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      @keyframes burst { 0%{opacity:1;transform:scale(1) translateY(0)} 100%{opacity:0;transform:scale(2) translateY(-60px)} }
      @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
      * { box-sizing:border-box; }
      ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:#00f5a033;border-radius:3px}
      input::placeholder{color:#2a6a4a}
    `;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  const persist = (updated) => {
    const users = loadUsers();
    users[username] = updated;
    saveUsers(users);
    setUser({ ...updated });
  };

  const showToast = (msg) => setToast(msg);

  const spawnBurst = (e) => {
    const rect = e?.currentTarget?.getBoundingClientRect?.() ?? { left:150, top:300, width:100 };
    const p = { id: Date.now(), x: rect.left + rect.width / 2, y: rect.top + 10 };
    setBursts(b => [...b, p]);
    setTimeout(() => setBursts(b => b.filter(x => x.id !== p.id)), 1100);
  };

  const doTask = (task, e) => {
    const td = user.tasksToday || {};
    if (td[task.id] === today()) { showToast("Yeh task aaj ho chuka! Kal wapas aana ☀️"); return; }
    if (task.id === "quiz") { setQuizOpen(true); return; }
    const updated = { ...user, coins: user.coins + task.coins, tasksToday: { ...td, [task.id]: today() } };
    persist(updated); spawnBurst(e); showToast(`+${task.coins} coins! 🎉`);
  };

  const doQuiz = (idx) => {
    setQuizOpen(false);
    const td = user.tasksToday || {};
    if (td["quiz"] === today()) return;
    if (idx !== QUIZ.ans) { showToast("Galat jawab! Agli baar try karna 😅"); return; }
    const updated = { ...user, coins: user.coins + 25, tasksToday: { ...td, quiz: today() } };
    persist(updated); showToast("+25 coins! Sahi jawab! 🧠🎉");
  };

  const openOffer = (provider) => {
    if (provider.status === "setup_needed") {
      showToast(`${provider.name} ke liye API key setup karo! 🔧`);
      return;
    }
    setOfferOpen(provider);
  };

  const redeemCode = () => {
    const code = redeemInput.trim().toUpperCase();
    if (!code) return;
    const used = user.usedCodes || [];
    if (used.includes(code)) { showToast("Yeh code pehle use ho chuka! ❌"); return; }
    const prize = REDEEM_CODES[code];
    if (!prize) { showToast("Galat redeem code! ❌"); return; }
    const updated = {
      ...user, coins: user.coins + prize.coins,
      usedCodes: [...used, code],
      redeemHistory: [...(user.redeemHistory||[]), {
        type:"code", code, coins: prize.coins, label: prize.label, date: today()
      }],
    };
    persist(updated); setRedeemInput(""); showToast(`+${prize.coins} coins! ${prize.label} 🎁`);
  };

  const withdrawUPI = () => {
    const amt = parseInt(withdrawAmt);
    if (!upiInput.trim()) { showToast("UPI ID dalo!"); return; }
    if (!amt || amt < 50) { showToast("Minimum ₹50 withdraw karo!"); return; }
    const need = amt * COINS_PER_RUPEE;
    if (user.coins < need) { showToast(`${need} coins chahiye! Tumhare paas ${user.coins} hain`); return; }
    const updated = {
      ...user, coins: user.coins - need,
      redeemHistory: [...(user.redeemHistory||[]), {
        type:"upi", upi: upiInput, rupees: amt, coins: need, date: today()
      }],
    };
    persist(updated); setUpiInput(""); setWithdrawAmt("");
    showToast(`₹${amt} withdraw request sent! ✅`);
  };

  const logout = () => { clearSession(); setUser(null); setUsername(null); };

  if (!user) return <AuthScreen onLogin={(u,n)=>{ setUser(u); setUsername(n); }} />;

  const coins = user.coins || 0;
  const rupees = (coins / COINS_PER_RUPEE).toFixed(1);
  const filteredProviders = category==="all" ? OFFER_PROVIDERS : OFFER_PROVIDERS.filter(p=>p.category===category);

  const C = {
    bg:"radial-gradient(ellipse at 20% 0%,#001a0f 0%,#060612 60%)",
    card:{ background:"#0a0a1888", backdropFilter:"blur(10px)",
      border:"1.5px solid #00f5a018", borderRadius:18,
      padding:"16px 18px", marginBottom:14, boxShadow:"0 2px 20px #00000066" },
    green:"#00f5a0", dim:"#2a6a4a", text:"#c0e8d0",
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Rajdhani',sans-serif",
      color:C.text, paddingBottom:80 }}>

      {bursts.map(b => <CoinBurst key={b.id} x={b.x} y={b.y} />)}
      {toast && <Toast msg={toast} onClose={()=>setToast(null)} />}

      {/* Quiz Modal */}
      {quizOpen && (
        <div style={{ position:"fixed", inset:0, background:"#000a", zIndex:500,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ ...C.card, width:320, border:"1.5px solid #00f5a055",
            padding:"28px 24px", margin:0 }}>
            <div style={{ color:C.green, fontWeight:800, fontSize:"1.15rem", marginBottom:16 }}>
              🧠 Daily Quiz
            </div>
            <div style={{ marginBottom:18, fontSize:"1rem" }}>{QUIZ.q}</div>
            {QUIZ.opts.map((o, i) => (
              <button key={i} onClick={() => doQuiz(i)} style={{
                display:"block", width:"100%", padding:"11px 14px", borderRadius:10,
                border:"1.5px solid #00f5a033", background:"transparent", color:C.green,
                fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:".95rem",
                cursor:"pointer", marginBottom:8, textAlign:"left", transition:"background .15s",
              }}>{o}</button>
            ))}
            <button onClick={()=>setQuizOpen(false)} style={{
              marginTop:4, background:"transparent", border:"none",
              color:"#666", cursor:"pointer", fontFamily:"'Rajdhani',sans-serif",
            }}>✕ Band karo</button>
          </div>
        </div>
      )}

      {/* Offer iframe modal */}
      {offerOpen && (
        <div style={{ position:"fixed", inset:0, background:"#000d", zIndex:600,
          display:"flex", flexDirection:"column" }}>
          <div style={{ background:"#0a0a18", padding:"12px 16px",
            display:"flex", justifyContent:"space-between", alignItems:"center",
            borderBottom:"1px solid #00f5a022" }}>
            <div style={{ fontWeight:800, color:C.green }}>
              {offerOpen.icon} {offerOpen.name}
            </div>
            <button onClick={()=>setOfferOpen(null)} style={{
              background:"transparent", border:"1px solid #ff6b6b55", color:"#ff6b6b",
              borderRadius:8, padding:"6px 12px", cursor:"pointer",
              fontFamily:"'Rajdhani',sans-serif", fontWeight:700,
            }}>✕ Close</button>
          </div>
          <iframe
            src={offerOpen.getUrl(username)}
            style={{ flex:1, border:"none", width:"100%" }}
            title={offerOpen.name}
          />
        </div>
      )}

      {/* Header */}
      <div style={{ background:"#060612cc", borderBottom:"1px solid #00f5a018",
        padding:"16px 20px 12px", position:"sticky", top:0, zIndex:100,
        backdropFilter:"blur(20px)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:"1.4rem", color:C.green, letterSpacing:2 }}>
              🪙 COINQUEST
            </div>
            <div style={{ fontSize:".75rem", color:C.dim, marginTop:1 }}>
              Hey <span style={{color:C.green}}>{username}</span>! 👋
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{
              fontWeight:800, fontSize:"1.7rem", color:C.green,
              fontFamily:"'Space Mono',monospace",
            }}>{coins}🪙</div>
            <div style={{ fontSize:".75rem", color:C.dim }}>≈ ₹{rupees}</div>
          </div>
        </div>
      </div>

      <div style={{ padding:"16px 14px", maxWidth:480, margin:"0 auto" }}>

        {/* ── TAB: EARN ── */}
        {tab===0 && (
          <div>
            <div style={{ color:C.dim, fontWeight:700, letterSpacing:1,
              fontSize:".85rem", marginBottom:12 }}>⚡ DAILY TASKS</div>

            {DAILY_TASKS.map(task => {
              const done = (user.tasksToday||{})[task.id] === today();
              return (
                <div key={task.id} style={{ ...C.card, opacity: done ? .5 : 1,
                  display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ fontSize:"1.9rem" }}>{task.icon}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:"1rem" }}>{task.label}</div>
                      <div style={{ fontSize:".75rem", color:C.dim, marginTop:1 }}>{task.desc}</div>
                    </div>
                  </div>
                  <button onClick={e=>doTask(task,e)} disabled={done} style={{
                    padding:"8px 14px", borderRadius:9, border:"none", cursor: done?"not-allowed":"pointer",
                    background: done ? "#1a2a1a" : "linear-gradient(135deg,#00f5a0,#00b4d8)",
                    color: done ? "#2a5a2a" : "#060612",
                    fontFamily:"'Rajdhani',sans-serif", fontWeight:800, fontSize:".9rem",
                    flexShrink:0, transition:"transform .1s",
                  }}>
                    {done ? "✓ Done" : `+${task.coins}🪙`}
                  </button>
                </div>
              );
            })}

            {/* Refer card */}
            <div style={{ ...C.card, textAlign:"center", marginTop:4,
              border:"1.5px solid #00f5a033" }}>
              <div style={{ color:C.green, fontWeight:800, marginBottom:10 }}>
                👥 Referral Code — Dosto Ko Share Karo
              </div>
              <div style={{
                fontFamily:"'Space Mono',monospace", fontSize:"1.6rem", letterSpacing:5,
                color:"#fff", background:"#060612", borderRadius:10, padding:"12px 0",
                border:"1.5px dashed #00f5a033",
              }}>{user.referCode}</div>
              <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:10, flexWrap:"wrap" }}>
                <Badge label="Unhe: +30 coins" color="#00f5a0" />
                <Badge label="Tumhe: +50 coins" color="#00b4d8" />
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:4 }}>
              {[
                { label:"Total Coins", val:`${coins}🪙`, color:"#00f5a0" },
                { label:"Total Value", val:`₹${rupees}`, color:"#00b4d8" },
                { label:"Tasks Done Today", val:`${Object.values(user.tasksToday||{}).filter(v=>v===today()).length}`, color:"#f72585" },
                { label:"Redeemed", val:`${(user.redeemHistory||[]).length}`, color:"#ffd60a" },
              ].map((s,i) => (
                <div key={i} style={{ ...C.card, margin:0, textAlign:"center", padding:"14px 10px" }}>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontWeight:800,
                    fontSize:"1.3rem", color:s.color }}>{s.val}</div>
                  <div style={{ fontSize:".72rem", color:C.dim, marginTop:3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: OFFERS (Offerwall Providers) ── */}
        {tab===1 && (
          <div>
            <div style={{ color:C.dim, fontWeight:700, letterSpacing:1,
              fontSize:".85rem", marginBottom:12 }}>🏪 OFFER PROVIDERS</div>

            {/* Category filter */}
            <div style={{ display:"flex", gap:8, marginBottom:16, overflowX:"auto",
              paddingBottom:4 }}>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={()=>setCategory(c.id)} style={{
                  padding:"7px 14px", borderRadius:20, border:"none", cursor:"pointer",
                  background: category===c.id ? C.green : "#0a0a18",
                  color: category===c.id ? "#060612" : C.dim,
                  fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:".85rem",
                  outline: category===c.id ? "none" : "1px solid #00f5a022",
                  whiteSpace:"nowrap", flexShrink:0, transition:"all .2s",
                }}>{c.icon} {c.label}</button>
              ))}
            </div>

            {/* Setup notice */}
            <div style={{ ...C.card, background:"#1a0a0088",
              border:"1.5px solid #ffd60a33", marginBottom:16 }}>
              <div style={{ color:"#ffd60a", fontWeight:800, marginBottom:6 }}>
                🔧 Setup Guide
              </div>
              <div style={{ fontSize:".8rem", color:"#a09060", lineHeight:1.5 }}>
                In providers pe register karo aur API key lo. Phir code mein
                <span style={{color:"#ffd60a",fontFamily:"'Space Mono',monospace",fontSize:".75rem"}}> YOUR_XXXX_ID </span>
                replace karo apni real key se. Tab paise milna shuru hoga! 💰
              </div>
            </div>

            {filteredProviders.map(provider => (
              <div key={provider.id} style={{ ...C.card,
                border:`1.5px solid ${provider.color}22` }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{
                      width:46, height:46, borderRadius:12, background:`${provider.color}22`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:"1.5rem", flexShrink:0,
                    }}>{provider.icon}</div>
                    <div>
                      <div style={{ fontWeight:800, fontSize:"1rem", color:"#e0ffe0" }}>
                        {provider.name}
                      </div>
                      <div style={{ fontSize:".75rem", color:C.dim, marginTop:2 }}>
                        {provider.desc}
                      </div>
                      <div style={{ marginTop:4 }}>
                        <Badge label={provider.coinsLabel} color={provider.color} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
                    <button onClick={()=>openOffer(provider)} style={{
                      padding:"8px 14px", borderRadius:9, border:"none", cursor:"pointer",
                      background: provider.status==="setup_needed"
                        ? "#1a1a0a" : `linear-gradient(135deg,${provider.color},${provider.color}99)`,
                      color: provider.status==="setup_needed" ? "#665533" : "#060612",
                      fontFamily:"'Rajdhani',sans-serif", fontWeight:800, fontSize:".85rem",
                      outline: provider.status==="setup_needed" ? `1px solid ${provider.color}33` : "none",
                      whiteSpace:"nowrap",
                    }}>
                      {provider.status==="setup_needed" ? "Setup ⚙️" : "Open →"}
                    </button>
                    {provider.status==="setup_needed" && (
                      <span style={{ fontSize:".65rem", color:"#665533" }}>API key needed</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: REDEEM ── */}
        {tab===2 && (
          <div>
            <div style={{ color:C.dim, fontWeight:700, letterSpacing:1,
              fontSize:".85rem", marginBottom:12 }}>💸 COINS REDEEM KARO</div>

            {/* Balance */}
            <div style={{ ...C.card, textAlign:"center", border:"1.5px solid #00f5a044",
              background:"linear-gradient(135deg,#001a0f,#060612)" }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"2.8rem",
                fontWeight:800, color:C.green }}>{coins}</div>
              <div style={{ color:C.dim, fontSize:".85rem" }}>coins = ₹{rupees}</div>
              <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:10,flexWrap:"wrap" }}>
                <Badge label="1000 coins = ₹10" color="#00f5a0" />
                <Badge label="Min withdraw ₹50" color="#00b4d8" />
              </div>
            </div>

            {/* Redeem Code */}
            <div style={{ ...C.card, marginBottom:14 }}>
              <div style={{ fontWeight:800, color:C.green, marginBottom:12, fontSize:"1rem" }}>
                🎁 Redeem Code
              </div>
              <input placeholder="Code enter karo (e.g. EARN50)"
                value={redeemInput} onChange={e=>setRedeemInput(e.target.value.toUpperCase())}
                style={{
                  width:"100%", padding:"12px 14px", borderRadius:10,
                  border:"1.5px solid #00f5a033", background:"#060612",
                  color:C.green, fontFamily:"'Space Mono',monospace",
                  fontSize:"1rem", outline:"none", marginBottom:10, letterSpacing:2,
                }} />
              <button onClick={redeemCode} style={{
                width:"100%", padding:"12px 0", borderRadius:10, border:"none", cursor:"pointer",
                background:"linear-gradient(90deg,#00f5a0,#00b4d8)", color:"#060612",
                fontFamily:"'Rajdhani',sans-serif", fontWeight:800, fontSize:"1rem",
              }}>REDEEM CODE 🎁</button>
              <div style={{ fontSize:".72rem", color:C.dim, marginTop:8, textAlign:"center" }}>
                Demo codes: EARN50, BOOST100, VIP200, LAUNCH25
              </div>
            </div>

            {/* UPI Withdraw */}
            <div style={{ ...C.card }}>
              <div style={{ fontWeight:800, color:"#00b4d8", marginBottom:12, fontSize:"1rem" }}>
                💸 UPI / Paytm Withdraw
              </div>
              {[
                ["UPI ID (e.g. name@paytm)", upiInput, setUpiInput, "text"],
                ["Amount in ₹ (min ₹50)", withdrawAmt, setWithdrawAmt, "number"],
              ].map(([ph,val,set,type],i)=>(
                <input key={i} type={type} placeholder={ph} value={val}
                  onChange={e=>set(e.target.value)} style={{
                    width:"100%", padding:"12px 14px", borderRadius:10,
                    border:"1.5px solid #00b4d833", background:"#060612",
                    color:"#00e5f0", fontFamily:"'Rajdhani',sans-serif",
                    fontSize:"1rem", outline:"none", marginBottom:10,
                  }} />
              ))}
              {withdrawAmt && (
                <div style={{ fontSize:".82rem", marginBottom:10,
                  color: user.coins >= parseInt(withdrawAmt||0)*COINS_PER_RUPEE ? "#00f5a0" : "#ff6b6b" }}>
                  ₹{withdrawAmt} = {parseInt(withdrawAmt||0)*COINS_PER_RUPEE} coins
                  {user.coins >= parseInt(withdrawAmt||0)*COINS_PER_RUPEE
                    ? " ✓ Enough balance!" : " ✗ Coins kam hain!"}
                </div>
              )}
              <button onClick={withdrawUPI} style={{
                width:"100%", padding:"12px 0", borderRadius:10, border:"none", cursor:"pointer",
                background:"linear-gradient(90deg,#00b4d8,#0077b6)", color:"#fff",
                fontFamily:"'Rajdhani',sans-serif", fontWeight:800, fontSize:"1rem",
              }}>WITHDRAW 💸</button>
            </div>
          </div>
        )}

        {/* ── TAB: HISTORY ── */}
        {tab===3 && (
          <div>
            <div style={{ color:C.dim, fontWeight:700, letterSpacing:1,
              fontSize:".85rem", marginBottom:12 }}>📜 HISTORY</div>
            {!(user.redeemHistory?.length) ? (
              <div style={{ ...C.card, textAlign:"center", padding:"40px 0", color:"#2a4a2a" }}>
                Koi transactions nahi abhi.<br/>Tasks karo coins kamao! ⚡
              </div>
            ) : [...user.redeemHistory].reverse().map((h,i) => (
              <div key={i} style={{ ...C.card,
                display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:700,
                    color: h.type==="upi" ? "#ff6b6b" : C.green }}>
                    {h.type==="code" ? `🎁 ${h.code}` : `💸 UPI: ${h.upi}`}
                  </div>
                  {h.label && <div style={{ fontSize:".75rem", color:C.dim }}>{h.label}</div>}
                  <div style={{ fontSize:".72rem", color:"#2a4a2a", marginTop:2 }}>{h.date}</div>
                </div>
                <div style={{ textAlign:"right", fontFamily:"'Space Mono',monospace",
                  fontWeight:800 }}>
                  <div style={{ color: h.type==="upi" ? "#ff6b6b" : C.green }}>
                    {h.type==="code" ? `+${h.coins}🪙` : `-${h.coins}🪙`}
                  </div>
                  {h.type==="upi" && <div style={{ color:"#00b4d8", fontSize:".85rem" }}>₹{h.rupees}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: PROFILE ── */}
        {tab===4 && (
          <div>
            <div style={{ color:C.dim, fontWeight:700, letterSpacing:1,
              fontSize:".85rem", marginBottom:12 }}>👤 PROFILE</div>

            <div style={{ ...C.card, textAlign:"center", border:"1.5px solid #00f5a033" }}>
              <div style={{
                width:72, height:72, borderRadius:"50%",
                background:"linear-gradient(135deg,#00f5a0,#00b4d8)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"2rem", margin:"0 auto 12px", fontWeight:800, color:"#060612",
                fontFamily:"'Space Mono',monospace",
              }}>{username[0].toUpperCase()}</div>
              <div style={{ fontWeight:800, fontSize:"1.3rem", color:C.green }}>{username}</div>
              <div style={{ color:C.dim, fontSize:".8rem", marginTop:3 }}>
                Member since {user.joinedDate}
              </div>
              {user.referredBy && (
                <div style={{ marginTop:6 }}>
                  <Badge label={`Referred by: ${user.referredBy}`} color="#ffd60a" />
                </div>
              )}
            </div>

            {[
              { icon:"🪙", label:"Total Coins", val:`${coins}`, color:C.green },
              { icon:"💰", label:"Wallet Value", val:`₹${rupees}`, color:"#00b4d8" },
              { icon:"✅", label:"Total Redeemed", val:`${(user.redeemHistory||[]).length}`, color:"#f72585" },
              { icon:"💸", label:"Withdrawn", val:`₹${(user.redeemHistory||[]).filter(h=>h.type==="upi").reduce((a,h)=>a+(h.rupees||0),0)}`, color:"#ffd60a" },
              { icon:"👥", label:"Your Refer Code", val:user.referCode, color:"#00f5a0" },
            ].map((s,i) => (
              <div key={i} style={{ ...C.card,
                display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:"1.3rem" }}>{s.icon}</span>
                  <span style={{ color:C.dim, fontSize:".9rem" }}>{s.label}</span>
                </div>
                <span style={{ fontWeight:800, color:s.color,
                  fontFamily:"'Space Mono',monospace", fontSize:".9rem" }}>{s.val}</span>
              </div>
            ))}

            <button onClick={logout} style={{
              width:"100%", padding:"13px 0", borderRadius:11,
              border:"1px solid #ff6b6b44", background:"transparent",
              color:"#ff6b6b", cursor:"pointer",
              fontFamily:"'Rajdhani',sans-serif", fontWeight:800, fontSize:"1rem", marginTop:4,
            }}>LOGOUT 🚪</button>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0,
        background:"#060612ee", borderTop:"1px solid #00f5a018",
        display:"flex", backdropFilter:"blur(20px)", zIndex:200,
      }}>
        {TABS.map((t, i) => (
          <button key={t.label} onClick={()=>setTab(i)} style={{
            flex:1, padding:"11px 0 9px", border:"none", cursor:"pointer",
            background:"transparent",
            color: tab===i ? C.green : "#2a4a2a",
            fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:".72rem",
            display:"flex", flexDirection:"column", alignItems:"center", gap:3,
            transition:"color .2s", letterSpacing:.5,
            borderTop: tab===i ? `2px solid ${C.green}` : "2px solid transparent",
          }}>
            <span style={{ fontSize:"1.25rem" }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
