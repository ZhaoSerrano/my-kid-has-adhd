/* ================= two modes, one clear goal at a time =================
   🎯 Test prep: a test is coming (within TEST_WINDOW days, or a test with no date). Everything is about that test.
   📚 School year: no test coming. The daily adventure walks through the whole kindergarten year.
   Grown-ups can switch it by hand with P.focus = 'auto' | 'test' (on; P.focusId picks one test) | 'year' (off). The built-in example test never switches
   test prep on by itself. Each day is 3 short stops (about 5 questions each), saved in
   P.today = {date, mode, unit, stops, i (next stop), did (skill ids practiced)}. */
const TEST_WINDOW=14;
const PATH_ORDER=['letterName','count','shape','letterSound','findNum','rhyme','beginSound','moreFewer','nextNum','syllable','pattern','add',
  'category','compareNum','story','subtract','feelings','weather','traceLetter','oneMore','alive','safety','measure','jobs','subitize','traceNum',
  'listenDo','make10','senses','teen','breakApart','timeWords','graph','position','rules','needs','habits','order','robot','pushPull','sky',
  'animalBody','helpers','longAgo','maps','needWant','upDown','fastSlow','beats','loudSoft','debug'];
const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`};
const tried=id=>(P.skills[id]||[]).length>0;
const playable=id=>SKILLS[id]&&!SKILLS[id].unitOnly;
const boxOf=k=>{const it=P.items&&P.items[k];return it?it.b:0};

/* ---- which mode ---- */
const testResult=u=>P.testResults&&P.testResults[u.id];
// The test to focus on right now, or null for school-year mode.
// Grown-ups switch test prep on (P.focus='test', optionally for one test: P.focusId) or off (P.focus='year').
function focusUnit(){const f=P.focus||'auto';if(f==='year')return null;
  if(f==='test'&&P.focusId){const pick=visibleUnits().find(u=>u.id===P.focusId&&!testResult(u));if(pick)return pick}
  const us=visibleUnits().filter(u=>!testResult(u)&&(f==='test'||!u.example)).filter(u=>{const d=daysUntil(u.testDate);
    return d==null||(d>=0&&(f==='test'||d<=TEST_WINDOW))});
  return us.sort((a,b)=>(daysUntil(a.testDate)??99)-(daysUntil(b.testDate)??99))[0]||null}
// Tests whose date has passed and nobody has said how they went (asked on the grown-up screen)
const resultPending=()=>visibleUnits().filter(u=>!u.example&&!testResult(u)&&(daysUntil(u.testDate)??0)<0);

/* ---- test readiness: per section of the test, how much is answered right on the first try ---- */
function readiness(u){
  const rows=unitSections(u).map(([id,title,,pic])=>{let ready=0,total=0;
    if(id==='vocab'){total=u.words.length;ready=u.words.filter(w=>boxOf('vocab:vo'+w.word)>=2).length}
    else if(id==='letterSound'){total=u.letters.length;ready=u.letters.filter(l=>boxOf('letterSound:ls'+l)>=2).length}
    else if(id==='story'){total=u.stories.length;ready=u.stories.filter(s=>boxOf('story:st'+s.question)>=2).length}
    else if(id==='teacherQ'){total=u.questions.length;ready=u.questions.filter(q=>boxOf('teacherQ:tq'+q.ask)>=2).length}
    else{const m=mastery(id).lvl;total=1;ready=m==='got'?1:m==='mid'?.5:0;return {id,title,pic,ready,total,pct:ready,skill:true}}
    return {id,title,pic,ready,total,pct:total?ready/total:0}});
  return {rows,pct:rows.length?Math.round(rows.reduce((a,r)=>a+r.pct,0)/rows.length*100):0}}
// Test sections with an answer missed recently, so the warm-up brings those back first
function missedSections(u){const ids=unitSections(u).map(s=>s[0]);
  return ids.filter(id=>Object.entries(P.items||{}).some(([k,v])=>v.b===1&&k.startsWith(id+':')))}

/* ---- school-year mode helpers ---- */
function weakSkills(){return Object.keys(P.skills).filter(id=>playable(id)&&tried(id))
  .map(id=>{const a=P.skills[id];return [id,a.reduce((x,y)=>x+y,0)/a.length]}).sort((a,b)=>a[1]-b[1])}
function missedSkills(){const s=new Set();Object.entries(P.items||{}).forEach(([k,v])=>{const id=k.split(':')[0];if(v.b===1&&playable(id))s.add(id)});return [...s]}
const nextNewSkill=(skip=[])=>PATH_ORDER.find(id=>playable(id)&&!tried(id)&&!skip.includes(id));
// Skills mastered ("Got it") out of all, per subject, for the year map
function subjectProgress(sub){const ids=Object.keys(SKILLS).filter(id=>SKILLS[id].sub===sub&&playable(id));
  return {got:ids.filter(id=>mastery(id).lvl==='got').length,total:ids.length}}

/* ---- the day's 3 stops ---- */
function buildYearDay(){const stops=[];
  let warm=[...new Set([...missedSkills(),...weakSkills().map(x=>x[0])])].slice(0,3);
  if(!warm.length)warm=['letterName','count'];   // the very first day: easy, familiar starts
  stops.push({kind:'warm',title:'Warm-up',pic:'🔥',skills:warm});
  const w=weakSkills().find(x=>x[1]<.8&&!warm.includes(x[0])),pid=w?w[0]:nextNewSkill(warm)||'pattern';
  stops.push({kind:'practice',title:'Practice',pic:SKILLS[pid].pic,skills:[pid]});
  const used=stops.flatMap(s=>s.skills),nw=nextNewSkill(used)||weakSkills().map(x=>x[0]).find(id=>!used.includes(id))||'robot';
  stops.push({kind:'new',title:'Something new',pic:SKILLS[nw].pic,skills:[nw]});
  return {stops}}
function buildTestDay(u){const rows=readiness(u).rows,weak=[...rows].sort((a,b)=>a.pct-b.pct).map(r=>r.id);
  const warm=[...new Set([...missedSections(u),...weak])].slice(0,3),prac=weak[0],d=daysUntil(u.testDate),fin=d!=null&&d<=1;
  return {stops:[
    {kind:'tw',title:'Warm-up',pic:'🔥',unit:u.id,skills:warm},
    {kind:'tp',title:'Practice',pic:(rows.find(r=>r.id===prac)||{}).pic||'✏️',unit:u.id,skills:[prac]},
    {kind:'mini',title:fin?'Full practice test':'Mini test',pic:'⭐',unit:u.id,full:fin}]}}
function today(){const u=focusUnit(),mode=u?'test':'year',uid=u?u.id:null;
  if(!P.today||P.today.date!==todayKey()||P.today.mode!==mode||P.today.unit!==uid){
    P.today=Object.assign(u?buildTestDay(u):buildYearDay(),{date:todayKey(),mode,unit:uid,i:0,did:[]});saveP()}
  return P.today}
// The questions for one stop
function stopSet(s){const u=s.unit&&allUnits().find(x=>x.id===s.unit),ctx=u?unitCtx(u):{};
  if(s.kind==='mini'){if(!u)return {list:Array(5).fill('letterName'),ctx:{}};const t=shuffle(unitTest(u));return {list:s.full?t:t.slice(0,6),ctx}}
  const n=s.skills.length===1?(SKILLS[s.skills[0]].n||5):5;
  return {list:shuffle(Array.from({length:n},(_,i)=>s.skills[i%s.skills.length])),ctx}}
// The line under a stop's title
function stopLabel(s){if(s.kind==='mini')return s.full?'The whole test':'Just like the real test';
  const u=s.unit&&allUnits().find(x=>x.id===s.unit),name=id=>{const sec=u&&unitSections(u).find(x=>x[0]===id);return sec?sec[1]:SKILLS[id].kid};
  return s.skills.map(name).join(', ')}
// A sticker from the child's favorite things, new ones first
function newSticker(){const have=new Set(P.stickers||[]),pool=theme().items.map(x=>x[0]),fresh=pool.filter(e=>!have.has(e));
  const s=one(fresh.length?fresh:pool);P.stickers=[...(P.stickers||[]),s].slice(-60);saveP();return s}
// After a game picked by hand: suggest something not tried yet, in the same subject if possible
function suggestNew(fromSkill){const sub=SKILLS[fromSkill]&&SKILLS[fromSkill].sub;
  return PATH_ORDER.find(id=>playable(id)&&!tried(id)&&SKILLS[id].sub===sub)||nextNewSkill()||null}
