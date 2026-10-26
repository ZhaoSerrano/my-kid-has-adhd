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
/* Light or dark: 'auto' follows the device. Saved as mkha_appearance; index.html applies it before the page draws. */
const appearance=()=>{const a=store.get('mkha_appearance','auto');return a==='light'||a==='dark'?a:'auto'};
function setAppearance(a){if(a==='light'||a==='dark'){document.documentElement.dataset.theme=a;store.set('mkha_appearance',a)}
  else{delete document.documentElement.dataset.theme;store.del('mkha_appearance')}}
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
let pref={name:'',rate:.92,natural:false,nvoice:'af_heart'};try{Object.assign(pref,JSON.parse(localStorage.getItem('u3voice')||'{}'))}catch(e){}
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
/* ---- natural voice (optional) ----
   Kokoro, a free open-source AI voice that runs inside the browser. It downloads once (about 100 MB,
   then the browser caches it) and the words it reads never leave the device. English only: Chinese
   and Spanish keep the device voice. On any problem, or if a sentence takes too long, the device voice reads it. */
const NV_LIB='https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js',NV_MODEL='onnx-community/Kokoro-82M-v1.0-ONNX',NV_WAIT=1500;
const NV_VOICES=[['af_heart','Heart (warm)'],['af_bella','Bella (bright)'],['af_nicole','Nicole (soft)'],['bf_emma','Emma (British)'],['am_michael','Michael'],['am_puck','Puck']];
const NV={state:'off',pct:0,worker:null,cache:new Map(),queue:[],idle:[],busy:false,src:null,onchange:null};
const nvSet=(s,pct=0)=>{NV.state=s;NV.pct=pct;NV.onchange&&NV.onchange()};
const nvOn=()=>pref.natural&&NV.state==='ready';
// If loading crashed the tab last time (e.g. an older iPad ran out of memory), don't auto-load again.
const nvCrashed=()=>store.get('mkha_nv_trying',false);
// The voice runs in a background worker (made from a Blob, so it also works from file://); otherwise each line freezes the page for seconds.
const NV_WORKER=`let tts;
self.onmessage=async e=>{const m=e.data;try{
  if(m.type==='load'){const {KokoroTTS}=await import(m.lib);
    tts=await KokoroTTS.from_pretrained(m.model,{dtype:'q8',device:'wasm',progress_callback:p=>{if(p.status==='progress'&&p.total)self.postMessage({type:'progress',file:p.file,loaded:p.loaded,total:p.total})}});
    self.postMessage({type:'ready'})}
  else if(m.type==='gen'){const a=await tts.generate(m.text,{voice:m.voice,speed:m.speed});self.postMessage({type:'audio',id:m.id,data:a.audio,rate:a.sampling_rate},[a.audio.buffer])}
}catch(err){self.postMessage({type:'error',id:m.id,msg:String(err&&err.message||err)})}};`;
let nvSeq=0;const nvWait=new Map();
function nvGen(text,voice,speed){return new Promise((res,rej)=>{const id=++nvSeq;nvWait.set(id,{res,rej});NV.worker.postMessage({type:'gen',id,text,voice,speed})})}
function nvLoad(){if(NV.state==='loading'||NV.state==='ready')return;nvSet('loading');store.set('mkha_nv_trying',true);
  const fail=e=>{console.warn('Natural voice could not load:',e);store.del('mkha_nv_trying');if(NV.worker)NV.worker.terminate();NV.worker=null;
    nvWait.forEach(w=>w.rej(new Error('voice stopped')));nvWait.clear();nvSet('failed')};
  try{const files={},w=NV.worker=new Worker(URL.createObjectURL(new Blob([NV_WORKER],{type:'text/javascript'})),{type:'module'});
    w.onerror=e=>fail(e.message||'worker error');
    w.onmessage=({data:m})=>{
      if(m.type==='progress'){files[m.file]=[m.loaded,m.total];let l=0,t=0;for(const [a,b] of Object.values(files)){l+=a;t+=b}nvSet('loading',Math.round(l/t*100))}
      else if(m.type==='ready'){store.del('mkha_nv_trying');nvSet('ready');nvWarm();nvPump()}
      else if(m.type==='audio'){const p=nvWait.get(m.id);nvWait.delete(m.id);p&&p.res({data:m.data,rate:m.rate})}
      else if(m.type==='error'){const p=nvWait.get(m.id);if(p){nvWait.delete(m.id);p.rej(new Error(m.msg))}else fail(m.msg)}};
    w.postMessage({type:'load',lib:NV_LIB,model:NV_MODEL})}
  catch(e){fail(e)}}
const nvKey=t=>`${pref.nvoice}|${pref.rate}|${t}`;
/* Generated lines are kept on the device (IndexedDB, newest NV_KEEP lines), so a line heard once plays instantly after that. */
const NV_KEEP=800;
const nvDB=(()=>{let p=null;return ()=>p||(p=new Promise(res=>{try{const r=indexedDB.open('mkha-voice',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('clips');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)}catch(e){res(null)}}))})();
const nvReq=(mode,fn)=>nvDB().then(db=>db&&new Promise(res=>{try{const q=fn(db.transaction('clips',mode).objectStore('clips'));q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null)}catch(e){res(null)}}));
async function nvLoadClip(k){const c=await nvReq('readonly',s=>s.get(k));return c&&{data:Float32Array.from(c.d,x=>x/32767),rate:c.r}}
function nvSaveClip(k,d){const i=new Int16Array(d.data.length);for(let n=0;n<i.length;n++)i[n]=Math.max(-1,Math.min(1,d.data[n]))*32767;
  nvReq('readwrite',s=>s.put({r:d.rate,d:i},k));const keys=store.get('mkha_nv_keys',[]);keys.push(k);
  while(keys.length>NV_KEEP){const old=keys.shift();nvReq('readwrite',s=>s.delete(old))}store.set('mkha_nv_keys',keys)}
/* One synthesis at a time, by priority: 0 = about to be spoken, 1 = coming up soon (this round), 2 = idle warm-up. */
function nvAudio(text,lv=1){const k=nvKey(text);let j=NV.cache.get(k);
  if(!j){j={k,text,voice:pref.nvoice,speed:pref.rate,lv:9};j.p=new Promise((res,rej)=>{j.res=res;j.rej=rej});j.p.catch(()=>NV.cache.delete(k));NV.cache.set(k,j);
    if(NV.cache.size>150)for(const [kk,jj] of NV.cache)if(jj.settled){NV.cache.delete(kk);break}}
  if(!j.settled&&lv<j.lv){j.lv=lv;if(!j.running){NV.queue=NV.queue.filter(x=>x!==j);NV.idle=NV.idle.filter(x=>x!==j);
    lv===0?NV.queue.unshift(j):lv===1?NV.queue.push(j):NV.idle.push(j);nvPump()}}
  return j.p}
async function nvPump(){if(NV.busy||!nvOn())return;const j=NV.queue.shift()||NV.idle.shift();if(!j)return;NV.busy=true;j.running=true;
  try{let d=await nvLoadClip(j.k);
    if(!d){d=await nvGen(j.text,j.voice,j.speed);nvSaveClip(j.k,d)}
    j.settled=true;j.d=d;j.res(d);if(j.lv===2)NV.cache.delete(j.k)}   // warm-up lines live on disk, not in memory
  catch(e){j.settled=true;j.rej(e)}
  NV.busy=false;nvPump()}
// Is this line already made (in memory or saved on the device)? Loads it into memory if so.
async function nvHas(text){const k=nvKey(text),j=NV.cache.get(k);if(j&&j.d)return true;
  const d=await nvLoadClip(k);if(!d)return false;
  if(j&&!j.settled&&!j.running){NV.queue=NV.queue.filter(x=>x!==j);NV.idle=NV.idle.filter(x=>x!==j);j.settled=true;j.d=d;j.res(d)}
  else if(!j)NV.cache.set(k,{k,text,lv:9,settled:true,d,p:Promise.resolve(d)});
  return true}
const nvText=parts=>(Array.isArray(parts)?parts:[parts]).filter(p=>typeof p==='string'&&p.trim());
function nvPrefetch(parts,lv=1){if(nvOn())nvText(parts).forEach(t=>nvAudio(t,lv))}
// In idle time, get ahead on what this child will hear most: feedback, their tests, and letter sounds.
function nvWarm(){if(!nvOn()||!P)return;const L=[],add=p=>L.push(...nvText(p));
  add(['Yes! Great job!','Yes! You got it!','Hmm.','Try again.',"Let's try this one again.",'Wow! All the stars! Great job.','Wiggle break!','Great moving! Your body is ready to learn.']);
  visibleUnits().forEach(u=>{
    (u.words||[]).forEach(w=>add([w.word+'.',...sentences(w.meaning),...sentences(w.good),...sentences(w.silly),`Is the word ${w.word} used the right way?`]));
    if((u.words||[]).length)add(['Happy face for yes.','Sad face for no.','Sad face.','Happy face!','Here is a sentence that makes sense.']);
    if((u.stories||[]).length)add(['Listen to the story.','Listen to the story again.']);
    (u.stories||[]).forEach(s=>add([...sentences(s.story),s.question]));
    (u.questions||[]).forEach(q=>add([...sentences(q.ask),...q.answers.map(a=>a.text+'.')]));
    (u.letters||[]).forEach(l=>PHON[l]&&add([PHON[l][0],`Like ${PHON[l][1]}.`]))});
  add(['What letter makes this sound?','Listen.','Which one starts with a different sound?']);
  P.letters.forEach(l=>PHON[l]&&add([PHON[l][0],`Like ${PHON[l][1]}.`]));
  [...new Set(L)].forEach(t=>nvAudio(t,2))}
function nvPlay(d,cb){const a=typeof ac==='function'&&ac();if(!a){cb(false);return}
  try{const b=a.createBuffer(1,d.data.length,d.rate);b.copyToChannel(d.data,0);const s=a.createBufferSource();s.buffer=b;s.connect(a.destination);
    NV.src=s;let fired=false;const fin=()=>{if(fired)return;fired=true;if(NV.src===s)NV.src=null;cb(true)};
    s.onended=fin;s.start();setTimeout(fin,b.duration*1000+800)}catch(e){cb(false)}}
function nvStop(){if(NV.src){try{NV.src.stop()}catch(e){}NV.src=null}}

let sayId=0;
function say(parts,done){
  const id=++sayId,list=Array.isArray(parts)?parts:[parts];
  if(synth)try{synth.cancel()}catch(e){}nvStop();
  let i=0,nat=false;
  const step=()=>{if(id!==sayId)return;if(i>=list.length){done&&done();return}
    const p=list[i++];if(typeof p==='number'){setTimeout(step,p);return}
    if(typeof p==='function'){let ms=0;try{ms=p()||0}catch(e){}setTimeout(step,ms);return}
    const txt=typeof p==='object'?p.t:p,lang=typeof p==='object'?p.lang:null;
    speakOne(txt,()=>{if(id===sayId)setTimeout(step,120)},lang,nat)};
  // A child never waits for the natural voice: it reads only when every line is already made.
  // Otherwise the device voice reads now, and the natural voice gets these lines ready for next time.
  const lines=nvOn()?nvText(list):[];
  if(!lines.length){setTimeout(step,synth?60:0);return}
  let started=false;const go=()=>{if(started||id!==sayId)return;started=true;if(!nat)lines.forEach(t=>nvAudio(t,1));step()};
  Promise.all(lines.map(nvHas)).then(r=>{nat=r.every(Boolean);go()},go);setTimeout(go,400);
}
function hush(){sayId++;if(synth)try{synth.cancel()}catch(e){}nvStop()}
function voiceFor(lang){const pre=lang==='zh'?/^zh[-_](CN|Hans)/i:/^es[-_](US|MX|419)/i,any=lang==='zh'?/^(zh|cmn)/i:/^es/i;
  const sc=v=>(/natural|neural|premium|enhanced|online/i.test(v.name)?100:0)+(pre.test(v.lang)?30:0)-(NOVELTY.test(v.name)?200:0);
  return allVoices.filter(v=>any.test(v.lang)).sort((a,b)=>sc(b)-sc(a))[0]||null}
function speakOne(text,cb,lang,nat){
  if(!lang&&nat&&nvOn()){const id=sayId;let fell=false;
    // safety net: if the line somehow isn't ready, the device voice reads it instead of leaving a silence
    const late=setTimeout(()=>{fell=true;deviceSpeak(text,cb,lang)},NV_WAIT);
    nvAudio(text,0).then(d=>{if(fell)return;clearTimeout(late);if(id!==sayId){cb();return}nvPlay(d,ok=>ok?cb():deviceSpeak(text,cb,lang))},
      ()=>{if(fell)return;clearTimeout(late);deviceSpeak(text,cb,lang)});
    return}
  deviceSpeak(text,cb,lang)}
function deviceSpeak(text,cb,lang){
  if(!synth){cb();return}
  try{const u=new SpeechSynthesisUtterance(text),v=lang?voiceFor(lang):voice;u.rate=pref.rate*(lang?.85:1);u.pitch=1;
    if(v){u.voice=v;u.lang=v.lang}else u.lang=lang==='zh'?'zh-CN':lang==='es'?'es-MX':'en-US';
    let fired=false;const fin=()=>{if(!fired){fired=true;clearTimeout(t);cb()}};
    u.onend=fin;u.onerror=fin;synth.speak(u);
    const t=setTimeout(fin,2500+text.length*110/pref.rate);
  }catch(e){cb()}
}
const sentences=s=>s.split(/(?<=[.!?])\s+/).flatMap((x,k,a)=>k<a.length-1?[x,550]:[x]);

