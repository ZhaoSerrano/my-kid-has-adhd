/* ================= helpers ================= */
const $=s=>document.querySelector(s), view=$('#view');
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const pick=(a,n)=>shuffle(a).slice(0,n);
const one=a=>a[Math.random()*a.length|0];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function nearNums(ans,lo,hi,k=3){const s=new Set([ans]);let g=0;
  while(s.size<k&&g++<80){const v=ans+one([-3,-2,-1,1,2,3]);if(v>=lo&&v<=hi)s.add(v)}
  for(let v=lo;s.size<k&&v<=hi;v++)s.add(v);return shuffle([...s])}
const STAR='<svg viewBox="0 0 24 24"><path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/></svg>';
const SPK='<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
const FACE=h=>`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"><circle cx="50" cy="50" r="44"/><circle cx="35" cy="40" r="4" fill="currentColor"/><circle cx="65" cy="40" r="4" fill="currentColor"/>${h?'<path d="M30 60 Q50 80 70 60"/>':'<path d="M30 74 Q50 56 70 74"/>'}</svg>`;

/* ================= profiles & progress ================= */
// Profiles live only on this device: mkha_profiles=[{id,name,theme}]. Progress per kid is in lab_<id>.
const store={get(k,d){try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
let PROFILES=[],P=null;
function loadProfiles(){
  PROFILES=store.get('mkha_profiles',[]);if(!Array.isArray(PROFILES))PROFILES=[];
  if(!PROFILES.length){
    // migrate progress saved before profiles existed: one profile per lab_* key, theme picked on next start
    let keys=[];try{keys=Object.keys(localStorage).filter(k=>k.startsWith('lab_'))}catch(e){}
    PROFILES=keys.map(k=>({id:k.slice(4),name:'',theme:''}));if(PROFILES.length)saveProfiles();
  }
}
function saveProfiles(){store.set('mkha_profiles',PROFILES)}
function addProfile(name){const p={id:'k'+Date.now().toString(36)+rnd(10,99),name:(name||'').trim().slice(0,30),theme:''};PROFILES.push(p);saveProfiles();return p}
function removeProfile(id){PROFILES=PROFILES.filter(p=>p.id!==id);saveProfiles();store.del('lab_'+id);if(store.get('mkha_last','')===id)store.del('mkha_last')}
function loadProfile(id){
  const d=store.get('lab_'+id,{});
  P=Object.assign({stars:0,skills:{},items:{},letters:['s','m','d','p','a'],maxCount:10,robotLevel:0},d,{id});
  P.meta=PROFILES.find(p=>p.id===id)||{id,name:'',theme:''};store.set('mkha_last',id);updStars();
}
function saveP(){try{const {meta,...rest}=P;localStorage.setItem('lab_'+P.id,JSON.stringify(rest))}catch(e){}}
function updStars(){$('#starCount').textContent=P?P.stars:0}
const kidName=()=>P&&P.meta.name||'';
function record(id,ok,star=ok){
  if(id){const a=P.skills[id]||(P.skills[id]=[]);a.push(ok?1:0);if(a.length>10)a.shift()}
  if(star)P.stars++;saveP();updStars()}
/* Item-level boxes (spaced practice). 1 = missed, practice soon; 2 = right once; 3 = known, show rarely. */
const itemId=q=>q.item===null?null:q.skill+':'+(q.item||q.key);
const itemBox=q=>{const id=itemId(q),it=id&&P.items[id];return it?it.b:0};
const plain=h=>String(h||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
function markItem(q,firstOk){const id=itemId(q);if(!id)return;const cur=P.items[id];
  P.items[id]={b:firstOk?Math.min(3,(cur?cur.b:1)+1):1,l:plain(q.grown).slice(0,90)};saveP()}
function mastery(id){const a=P.skills[id]||[];
  if(a.length<5)return{lvl:'new',label:a.length?`Started (${a.length})`:'Not tried'};
  const r=a.reduce((x,y)=>x+y,0),p=r/a.length,t=`${r}/${a.length}`;
  return p>=.8?{lvl:'got',label:'Got it · '+t}:p>=.5?{lvl:'mid',label:'Getting there · '+t}:{lvl:'low',label:'Needs practice · '+t}}

/* ================= speech ================= */
const synth=window.speechSynthesis;let voice=null,voices=[],allVoices=[];
let pref={name:'',rate:.92};try{Object.assign(pref,JSON.parse(localStorage.getItem('u3voice')||'{}'))}catch(e){}
function savePref(){try{localStorage.setItem('u3voice',JSON.stringify(pref))}catch(e){}}
const NOVELTY=/bells|bubbles|zarvox|whisper|bad news|good news|albert|jester|trinoids|organ|cellos|boing|superstar|wobble|bahh|fred|junior|kathy|ralph|grandma|grandpa|rocko|shelley|flo|eddy|reed|sandy/i;
function vscore(v){let s=0;const n=v.name;
  if(/natural|neural|premium|enhanced|online/i.test(n))s+=100;
  if(/ava|zoe|evan|nathan|aria|jenny|guy|michelle|google us english|samantha|allison|susan|tom/i.test(n))s+=40;
  if(/^en[-_]US/i.test(v.lang))s+=20;else if(/^en/i.test(v.lang))s+=5;
  if(NOVELTY.test(n))s-=200;return s}
function loadVoices(){if(!synth)return;allVoices=synth.getVoices();
  voices=allVoices.filter(v=>/^en/i.test(v.lang)).sort((a,b)=>vscore(b)-vscore(a));
  voice=voices.find(v=>v.name===pref.name)||voices[0]||null;
  const sel=document.getElementById('voiceSel');if(sel)fillVoiceSel(sel)}
if(synth){loadVoices();synth.onvoiceschanged=loadVoices;setTimeout(loadVoices,600)}
let sayId=0;
function say(parts,done){
  const id=++sayId,list=Array.isArray(parts)?parts:[parts];
  if(synth)try{synth.cancel()}catch(e){}
  let i=0;
  const step=()=>{if(id!==sayId)return;if(i>=list.length){done&&done();return}
    const p=list[i++];if(typeof p==='number'){setTimeout(step,p);return}
    if(typeof p==='function'){let ms=0;try{ms=p()||0}catch(e){}setTimeout(step,ms);return}
    const txt=typeof p==='object'?p.t:p,lang=typeof p==='object'?p.lang:null;
    speakOne(txt,()=>{if(id===sayId)setTimeout(step,120)},lang)};
  setTimeout(step,synth?60:0);
}
function hush(){sayId++;if(synth)try{synth.cancel()}catch(e){}}
function voiceFor(lang){const pre=lang==='zh'?/^zh[-_](CN|Hans)/i:/^es[-_](US|MX|419)/i,any=lang==='zh'?/^(zh|cmn)/i:/^es/i;
  const sc=v=>(/natural|neural|premium|enhanced|online/i.test(v.name)?100:0)+(pre.test(v.lang)?30:0)-(NOVELTY.test(v.name)?200:0);
  return allVoices.filter(v=>any.test(v.lang)).sort((a,b)=>sc(b)-sc(a))[0]||null}
function speakOne(text,cb,lang){
  if(!synth){cb();return}
  try{const u=new SpeechSynthesisUtterance(text),v=lang?voiceFor(lang):voice;u.rate=pref.rate*(lang?.85:1);u.pitch=1;
    if(v){u.voice=v;u.lang=v.lang}else u.lang=lang==='zh'?'zh-CN':lang==='es'?'es-MX':'en-US';
    let fired=false;const fin=()=>{if(!fired){fired=true;clearTimeout(t);cb()}};
    u.onend=fin;u.onerror=fin;synth.speak(u);
    const t=setTimeout(fin,2500+text.length*110/pref.rate);
  }catch(e){cb()}
}
const sentences=s=>s.split(/(?<=[.!?])\s+/).flatMap((x,k,a)=>k<a.length-1?[x,550]:[x]);

