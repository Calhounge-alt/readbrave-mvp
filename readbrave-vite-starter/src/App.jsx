
import React, { useEffect, useMemo, useRef, useState } from "react";

// --- Minimal data ---
const AVATARS = [
  { id: "benjamin", name: "Benjamin", emoji: "🧢" },
  { id: "ruby", name: "Ruby", emoji: "🎒" },
  { id: "joshua", name: "Joshua", emoji: "🧩" },
  
const STICKERS = [
  { id: "star_shades", name: "Star Shades", emoji: "🕶️", cost: 25, rarity: "common" },
  { id: "rainbow_hat", name: "Rainbow Hat", emoji: "🎩", cost: 40, rarity: "rare" },
  { id: "music_notes", name: "Music Notes", emoji: "🎵", cost: 30, rarity: "common" },
  { id: "magic_wand", name: "Magic Wand", emoji: "🪄", cost: 35, rarity: "epic", limited: { start: "2025-10-01", end: "2025-11-15" } },
];

const QUESTS = [
  { id: "tap5",    title: "Tap 5 tricky words", goal: 5,  reward: 5,  desc: "Use the Lens 5 times." },
  { id: "finish1", title: "Finish 1 passage",   goal: 1,  reward: 10, desc: "Play Read-With-Me to the end." },
  { id: "beeps30", title: "Beat the beeps ×30", goal: 30, reward: 7,  desc: "Stay with the rhythm 30 ticks." },
];

const SKILLS = { magic_e:{id:"magic_e",name:"Magic-e"}, ai_ay:{id:"ai_ay",name:"AI/AY"} };
const PASSAGES = [
  const PASSAGES = [
  { id:"p1", title:"Train in the Rain", body:[ ... ] },
  { id:"p2", title:"Home Time", body:[ ... ] },
  { id:"p3", title:"Skate at the Lake", body:[ ... ] },
  { id:"p4", title:"Blend Friends", body:[ ... ] },
  { id:"p5", title:"Magic-e Time", body:[ ... ] }
];
  
const PHONEME_MAP = { ai:"ei", ay:"ei", a_e:"ei", i_e:"ai", o_e:"oo" };
const IPA_LOOKUP  = { train:"/t r eɪ n/", rain:"/r eɪ n/", day:"/d eɪ/" };

const tokenize = (lines)=>{
  const text = Array.isArray(lines) ? lines.join(" ") : String(lines||"");
  const parts=[]; let token="";
  for(const ch of text){
    if(/\s/.test(ch)){ if(token){ parts.push(token); token=""; } }
    else if(/[.,!?;:]/.test(ch)){ if(token){ parts.push(token); token=""; } parts.push(ch); }
    else token += ch;
  }
  if(token) parts.push(token); return parts;
};
const splitGraphemes = (word)=>{
  if(!word) return [];
  const w=String(word).toLowerCase(); const tiles=[];
  if(/ai|ay/.test(w)){ const m=w.match(/(.*?)(ai|ay)(.*)/);
    if(m){ if(m[1]) tiles.push({t:m[1],type:"letter"}); tiles.push({t:m[2],type:"grapheme"}); if(m[3]) tiles.push({t:m[3],type:"letter"}); return tiles; } }
  if(/^[a-z]e$/.test(w)) tiles.push({t:w[0]+"_e",type:"grapheme"});
  for(const ch of w) tiles.push({t:ch,type:"letter"});
  return tiles;
};
const makePhrasesFromBody = (body)=> (Array.isArray(body)?body:[String(body||"")]).flatMap(s=>s.split(/(?<=[.!?])\s+/)).filter(Boolean);
const speak = (text, rate=1, voice)=>{ try{ const u=new SpeechSynthesisUtterance(String(text).replace(/\*\*/g,"")); if(voice) u.voice=voice; u.rate=rate; window.speechSynthesis?.cancel?.(); window.speechSynthesis?.speak?.(u);}catch{} };

export default function App(){
  const [view,setView]=useState("reader");
  const [selectedPassageId,setSelectedPassageId]=useState(PASSAGES[0].id);
  const [wpm,setWpm]=useState(140);
  const [ttsRate,setTtsRate]=useState(1);
  const [voice,setVoice]=useState(null);
  const [openLens,setOpenLens]=useState(null);
  const [points,setPoints]=useState(()=>parseInt(localStorage.getItem("rb_points")||"0",10));
  const [inventory,setInventory]=useState(()=>JSON.parse(localStorage.getItem("rb_inv")||"[]"));
  const [equipped,setEquipped]=useState(()=>JSON.parse(localStorage.getItem("rb_eq")||"[]"));
  const [questProgress,setQuestProgress]=useState(()=>JSON.parse(localStorage.getItem("rb_quests_prog")||"{}"));
  const [questClaimed,setQuestClaimed]=useState(()=>JSON.parse(localStorage.getItem("rb_quests_claim")||"{}"));

  useEffect(()=>{ const onVoices=()=>{const vs=window.speechSynthesis?.getVoices?.()||[]; setVoice(vs.find(v=>/en-?US|English/i.test(v.lang))||vs[0]||null);}; onVoices(); window.speechSynthesis?.addEventListener?.("voiceschanged",onVoices); return ()=>window.speechSynthesis?.removeEventListener?.("voiceschanged",onVoices); },[]);

  useEffect(()=>{ localStorage.setItem("rb_points",String(points)); localStorage.setItem("rb_inv",JSON.stringify(inventory)); localStorage.setItem("rb_eq",JSON.stringify(equipped)); },[points,inventory,equipped]);
  useEffect(()=>{ localStorage.setItem("rb_quests_prog",JSON.stringify(questProgress)); localStorage.setItem("rb_quests_claim",JSON.stringify(questClaimed)); },[questProgress,questClaimed]);

  const passage = useMemo(()=> PASSAGES.find(p=>p.id===selectedPassageId) || PASSAGES[0], [selectedPassageId]);

  const addPoints=(n)=>setPoints(p=>p+n);
  const toggleEquip=(id)=>setEquipped(prev=> prev.includes(id)? prev.filter(x=>x!==id) : [...prev,id]);
  const buySticker=(id,cost)=>{ if(points<cost) return alert("Not enough stars yet!"); if(inventory.includes(id)) return toggleEquip(id); setPoints(p=>p-cost); setInventory(inv=>[...inv,id]); toggleEquip(id); };

  const recordQuest=(type)=>{
    const u={...questProgress};
    if(type==="tap_word") u.tap5=Math.min((u.tap5||0)+1,5);
    if(type==="finish_read") u.finish1=1;
    if(type==="game_tick") u.beeps30=Math.min((u.beeps30||0)+1,30);
    setQuestProgress(u);
  };

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",color:"#0f172a"}}>
      <header style={{position:"sticky",top:0,background:"white",borderBottom:"1px solid #e2e8f0"}}>
        <div style={{maxWidth:960,margin:"0 auto",padding:"12px 16px",display:"flex",gap:12,alignItems:"center"}}>
          <div style={{width:40,height:40,background:"#4f46e5",color:"white",display:"grid",placeContent:"center",borderRadius:16,fontWeight:700}}>RB</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:600}}>ReadBrave – Dyslexia Support</div>
            <div style={{fontSize:12,color:"#64748b"}}>“Differences aren’t deficits — they’re directions.”</div>
          </div>
          {["reader","game","coach","earn","shop","settings"].map(tab=>(
            <button key={tab} onClick={()=>setView(tab)} style={{padding:"8px 12px",borderRadius:12,border:"1px solid #cbd5e1",background: view===tab?"#0f172a":"white", color: view===tab?"white":"#0f172a", fontSize:13}}>
              {tab[0].toUpperCase()+tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <main style={{maxWidth:960, margin:"0 auto", padding:"16px"}}>
        {view==="reader" && (
          <Reader passage={passage} wpm={wpm} ttsRate={ttsRate} voice={voice}
            onWordTap={(w)=>{ setOpenLens({word:w}); recordQuest("tap_word"); addPoints(1);}}
            onFinish={()=>{ recordQuest("finish_read"); addPoints(10);}}
          />
        )}

        {view==="game" && (
          <BeatTheBeeps phrases={passage.phrases||makePhrasesFromBody(passage.body)} defaultWpm={wpm}
            onEvent={(e)=> e?.type==="game_tick" && recordQuest("game_tick") } />
        )}

        {view==="coach" && <CoachChat voice={voice} ttsRate={ttsRate} onAward={(n)=>addPoints(n)} />}

        {view==="earn" && <Earn questProgress={questProgress} questClaimed={questClaimed} setQuestClaimed={setQuestClaimed} addPoints={addPoints} />}

        {view==="shop" && <Shop points={points} inventory={inventory} equipped={equipped} onBuy={buySticker} onToggleEquip={toggleEquip} />}

        {view==="settings" && (
          <div style={{background:"white",border:"1px solid #e2e8f0",borderRadius:16,padding:16}}>
            <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>TTS Rate</div>
            <input type="range" min={0.6} max={1.4} step={0.05} value={ttsRate} onChange={e=>setTtsRate(+e.target.value)} />
            <div style={{fontSize:12,color:"#64748b",marginTop:12}}>WPM (Game)</div>
            <input type="range" min={80} max={220} value={wpm} onChange={e=>setWpm(+e.target.value)} />
          </div>
        )}
      </main>

      {!!openLens && <LensModal word={openLens.word} onClose={()=>setOpenLens(null)} ttsRate={ttsRate} voice={voice} />}
    </div>
  );
}

function Card({title,children}){
  return (
    <div style={{background:"white",border:"1px solid #e2e8f0",borderRadius:16,padding:16, marginBottom:16}}>
      {title && <h2 style={{marginTop:0}}>{title}</h2>}
      {children}
    </div>
  );
}
function Label({children}){ return <div style={{fontSize:12,color:"#64748b",marginBottom:4}}>{children}</div>; }

function Reader({ passage, wpm, ttsRate, voice, onWordTap, onFinish }){
  const [isPlaying,setIsPlaying]=useState(false);
  const [currentIndex,setCurrentIndex]=useState(-1);
  const words = useMemo(()=> tokenize(passage.body), [passage]);
  const timerRef = useRef(null);

  const stopAll=()=>{ try{window.speechSynthesis?.cancel?.();}catch{} clearInterval(timerRef.current); setIsPlaying(false); setCurrentIndex(-1); };
  const play=()=>{
    stopAll(); setIsPlaying(true);
    const utter=new SpeechSynthesisUtterance(words.join(" ")); if(voice) utter.voice=voice; utter.rate=ttsRate; window.speechSynthesis?.speak?.(utter);
    const msPerWord = Math.max(120, Math.round(60000/Math.max(60,wpm))); let i=-1;
    timerRef.current=setInterval(()=>{ i++; setCurrentIndex(i); if(i>=words.length-1){ clearInterval(timerRef.current); setTimeout(()=>{ setIsPlaying(false); onFinish?.(); },200);} }, msPerWord);
  };
  useEffect(()=>()=>stopAll(),[]);

  return (
    <Card title={`Read‑With‑Me: ${passage.title}`}>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12}}>
        <button onClick={play} style={{padding:"8px 12px",borderRadius:12,background:"#0f172a",color:"white",border:"none"}}>Play</button>
        <button onClick={stopAll} style={{padding:"8px 12px",borderRadius:12,background:"white",border:"1px solid #cbd5e1"}}>Stop</button>
        <span style={{fontSize:12,color:"#64748b"}}>Tap any word to open the lens.</span>
      </div>
      <div style={{lineHeight:"2rem",fontSize:"1.125rem",padding:16,border:"1px solid #e2e8f0",borderRadius:16,background:"white",maxHeight:360,overflowY:"auto"}}>
        {words.map((w,i)=> <Word key={i} text={w} active={i===currentIndex} onClick={()=>onWordTap(w)} /> )}
      </div>
      <div style={{fontSize:12,color:"#64748b",marginTop:12}}>Targets: {passage.target_skills.map(s=>SKILLS[s]?.name).join(", ")}</div>
    </Card>
  );
}
function Word({text,active,onClick}){
  if(/[.,!?;:]/.test(text)) return <span>{text} </span>;
  return <button onClick={onClick} style={{padding:"0 6px",borderRadius:6,background:active?"#fde68a":"transparent"}}>{text} </button>;
}

function LensModal({ word, onClose, ttsRate, voice }){
  const tiles = splitGraphemes(word);
  const speakSlow = ()=>speak(`${word}`, Math.max(0.6, ttsRate-0.3), voice);
  const speakNormal = ()=>speak(`${word}`, ttsRate, voice);
  const ipa = IPA_LOOKUP[word?.toLowerCase?.()] || "/" + tiles.map(t=> PHONEME_MAP[t.t] || t.t).join(" ") + "/";

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"grid",placeItems:"center",padding:16}} role="dialog" aria-modal>
      <div style={{background:"white",borderRadius:16,padding:20,maxWidth:560,width:"100%",border:"1px solid #e2e8f0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
          <h3 style={{margin:0}}>Sound‑It‑Out Lens</h3>
          <button onClick={onClose} style={{padding:"6px 10px",borderRadius:10,border:"1px solid #cbd5e1",background:"white"}}>Close</button>
        </div>
        <div style={{marginTop:12,fontSize:24,fontWeight:700}}>{word}</div>
        <div style={{marginTop:6,fontSize:14,color:"#475569"}}>{ipa}</div>
        <div style={{marginTop:12,display:"flex",gap:8,flexWrap:"wrap"}}>
          {tiles.map((tile,idx)=>(
            <span key={idx} style={{padding:"6px 10px",borderRadius:12,border:"1px solid #e2e8f0",background:tile.type==="grapheme"?"#ecfeff":"#f8fafc",fontWeight:600}}>{tile.t}</span>
          ))}
        </div>
        <div style={{marginTop:12,display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={speakSlow} style={{padding:"8px 12px",borderRadius:12,background:"#0f172a",color:"white",border:"none"}}>Play Slow</button>
          <button onClick={speakNormal} style={{padding:"8px 12px",borderRadius:12,background:"white",border:"1px solid #cbd5e1"}}>Play Normal</button>
          <span style={{fontSize:12,color:"#64748b"}}>Listen slow → normal.</span>
        </div>
      </div>
    </div>
  );
}

function BeatTheBeeps({ phrases, defaultWpm=140, onEvent }){
  const [index,setIndex]=useState(0);
  const [running,setRunning]=useState(false);
  const [wpm,setWpm]=useState(defaultWpm);
  const timerRef=useRef(null);
  const start=()=>{
    setRunning(True=>true); onEvent?.({type:"game_start",wpm});
    const msPerPhrase = Math.max(600, Math.round(60000/Math.max(60,wpm)*3));
    timerRef.current=setInterval(()=>{ new AudioBeep().play(); setIndex(i=>(i+1)%phrases.length); onEvent?.({type:"game_tick"}); }, msPerPhrase);
  };
  const stop=()=>{ setRunning(false); clearInterval(timerRef.current); onEvent?.({type:"game_stop"}); };
  return (
    <Card title="Fluency: Beat the Beeps">
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12}}>
        {!running ? <button onClick={start} style={{padding:"8px 12px",borderRadius:12,background:"#0f172a",color:"white",border:"none"}}>Start</button>
                   : <button onClick={stop} style={{padding:"8px 12px",borderRadius:12,background:"white",border:"1px solid #cbd5e1"}}>Stop</button>}
        <div style={{marginLeft:12}}>
          <div style={{fontSize:12,color:"#64748b",marginBottom:4}}>WPM</div>
          <input type="range" min={80} max={220} value={wpm} onChange={e=>setWpm(+e.target.value)} />
        </div>
      </div>
      <div style={{padding:24,fontSize:20,lineHeight:"2.25rem",border:"1px solid #e2e8f0",borderRadius:16,background:"white",minHeight:140,display:"grid",placeItems:"center"}}>
        <span style={{padding:"6px 10px",borderRadius:10,background:"#fef9c3",border:"1px solid #fde68a"}}>{phrases[index]}</span>
      </div>
      <p style={{marginTop:8,fontSize:12,color:"#64748b"}}>Read each phrase in rhythm with the beep. Increase WPM as confidence grows.</p>
    </Card>
  );
}

class AudioBeep{ play(){ try{ const ctx=new (window.AudioContext||window.webkitAudioContext)(); const o=ctx.createOscillator(); const g=ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type="sine"; o.frequency.value=880; g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime+0.01); o.start(); o.stop(ctx.currentTime+0.08);}catch{}} }

function Shop({ points, inventory, equipped, onBuy, onToggleEquip }){
  const isAvail = (item) => true; // simplified availability

  return (
    <Card title="Sticker Shop – Spend ⭐ to style your avatar">
      <div style={{marginBottom:8,fontSize:14}}>Your Stars: <b>{points}</b></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
        {STICKERS.map(item=>{
          const owned = inventory.includes(item.id);
          const wearing = equipped.includes(item.id);
          return (
            <div key={item.id} style={{border:"1px solid #e2e8f0",borderRadius:16,padding:12,background:"white"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:24}}>{item.emoji}</div>
                <div style={{fontSize:12,background:"#fef9c3",border:"1px solid #fde68a",padding:"2px 6px",borderRadius:8}}>{item.cost} ⭐</div>
              </div>
              <div style={{marginTop:6,fontSize:14,fontWeight:600}}>{item.name}</div>
              {!owned ? <button onClick={()=>onBuy(item.id,item.cost)} style={{marginTop:8,width:"100%",padding:"8px 12px",borderRadius:12,background:"#4f46e5",color:"white",border:"none"}}>Buy</button>
                      : <button onClick={()=>onToggleEquip(item.id)} style={{marginTop:8,width:"100%",padding:"8px 12px",borderRadius:12,background:"white",border:"1px solid #cbd5e1"}}>{wearing?"Unequip":"Equip"}</button>}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Earn({ questProgress, questClaimed, setQuestClaimed, addPoints }){
  const claim=(q)=>{ if(questClaimed[q.id]) return; const done=(questProgress[q.id]||0)>=q.goal; if(!done) return; addPoints(q.reward); setQuestClaimed(prev=>({...prev,[q.id]:true})); };
  return (
    <Card title="Earn ⭐ – Mini‑Quests">
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
        {QUESTS.map(q=>{ const prog=Math.min(q.goal, questProgress[q.id]||0); const pct=Math.round((prog/q.goal)*100); const done=prog>=q.goal; const claimed=!!questClaimed[q.id];
          return (
            <div key={q.id} style={{border:"1px solid #e2e8f0",borderRadius:16,padding:12,background:"white"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}><div style={{fontWeight:600}}>{q.title}</div><span style={{fontSize:12,background:"#fef9c3",border:"1px solid #fde68a",padding:"2px 6px",borderRadius:8}}>{q.reward} ⭐</span></div>
              <div style={{fontSize:12,color:"#64748b",marginTop:4}}>{q.desc}</div>
              <div style={{height:8,background:"#f1f5f9",borderRadius:8,marginTop:8,overflow:"hidden"}}><div style={{height:"100%",background:"#34d399",width:`${pct}%`}}/></div>
              <div style={{fontSize:12,color:"#475569",marginTop:6}}>{prog} / {q.goal}</div>
              <button onClick={()=>claim(q)} disabled={!done||claimed} style={{marginTop:8,width:"100%",padding:"8px 12px",borderRadius:12, background: done&&!claimed? "#0f172a":"white", color: done&&!claimed? "white":"#0f172a", border:"1px solid #cbd5e1"}}>{claimed?"Claimed": done?"Claim ⭐":"Keep going"}</button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function CoachChat({ voice, ttsRate, onAward }){
  const [messages,setMessages]=useState([{role:"coach", text:"Hey! I’m BridgeMind. Ask me to help sound out a word, explain magic‑e or ai/ay, or cheer you on!"}]);
  const [input,setInput]=useState("");
  const reply=(text)=>{
    const t=text.toLowerCase();
    const m=t.match(/help (me )?(with )?([a-zA-Z]+)/);
    if(m){ const w=m[3]; const tiles=splitGraphemes(w).map(x=>x.t).join(" ‧ "); return `Let’s chunk **${w}** → ${tiles}. Say it slow, then normal.`; }
    if(/magic[- ]?e|a_e|e_e|i_e|o_e/.test(t)) return "Magic‑e makes the vowel say its name: a_e → /eɪ/, i_e → /aɪ/, o_e → /oʊ/.";
    if(/\bai\b|\bay\b|ai\/ay|vowel team/.test(t)) return "AI/AY usually say /eɪ/: rain, train, day, play. ai in middle; ay at the end.";
    if(/cheer|encourage|nervous|hard|tired/.test(t)) return "Breathe in 3… out 4. You’re a pattern spotter. Two lines together, then the beeps game!";
    return "Tell me a word (e.g., 'help with train') or a pattern (magic‑e, ai/ay).";
  };
  const send=()=>{ const text=input.trim(); if(!text) return; const kid={role:"kid",text}; const coach={role:"coach", text: reply(text)}; setMessages(m=>[...m,kid,coach]); setInput(""); onAward?.(2); speak(coach.text, ttsRate, voice); };
  return (
    <Card title="AI Coach – BridgeMind Kids">
      <div style={{height:320,overflowY:"auto",border:"1px solid #e2e8f0",borderRadius:16,padding:12,background:"white"}}>
        {messages.map((m,i)=>(
          <div key={i} style={{margin:"8px 0"}}>
            <div style={{display:"inline-block",padding:"8px 12px",borderRadius:16, fontSize:14, background: m.role==="coach"?"#eef2ff":"#fef9c3", border:"1px solid #e2e8f0"}}>
              <b>{m.role==="coach"?"BridgeMind:":"You:"}</b> {m.text}
            </div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Try: help with train / explain magic‑e" style={{flex:1,padding:"8px 12px",borderRadius:12,border:"1px solid #cbd5e1"}}/>
        <button onClick={send} style={{padding:"8px 12px",borderRadius:12,background:"#0f172a",color:"white",border:"none"}}>Send</button>
      </div>
    </Card>
  );
}
