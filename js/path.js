/* ================= today's adventure (the guided path) =================
   Kids get one clear next step instead of a menu. Each day is 3 short stops (about 5 questions each):
   1. Warm-up: things played before, missed ones first. Being asked again later is what makes learning stick.
   2. Test practice when a test is coming up; otherwise the skill that needs the most practice.
   3. Something new: the next skill not tried yet, in teaching order.
   Saved per child per day in P.today = {date, stops, i (next stop), did (skill ids practiced)}. */
const PATH_ORDER=['letterName','count','shape','letterSound','findNum','rhyme','beginSound','moreFewer','nextNum','syllable','pattern','add',
  'category','compareNum','story','subtract','feelings','weather','traceLetter','oneMore','alive','safety','measure','jobs','subitize','traceNum',
  'listenDo','make10','senses','teen','breakApart','timeWords','graph','position','rules','needs','habits','order','robot','pushPull','sky',
  'animalBody','helpers','longAgo','maps','needWant','upDown','fastSlow','beats','loudSoft','debug'];
const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`};
const tried=id=>(P.skills[id]||[]).length>0;
const playable=id=>SKILLS[id]&&!SKILLS[id].unitOnly;
// Tried skills, weakest first, as [id, share right on first try]
function weakSkills(){return Object.keys(P.skills).filter(id=>playable(id)&&tried(id))
  .map(id=>{const a=P.skills[id];return [id,a.reduce((x,y)=>x+y,0)/a.length]}).sort((a,b)=>a[1]-b[1])}
// Skills with an item missed recently (box 1), so the warm-up brings those back first
function missedSkills(){const s=new Set();Object.entries(P.items||{}).forEach(([k,v])=>{const id=k.split(':')[0];if(v.b===1&&playable(id))s.add(id)});return [...s]}
const nextNewSkill=(skip=[])=>PATH_ORDER.find(id=>playable(id)&&!tried(id)&&!skip.includes(id));
// The nearest test that hasn't happened yet (or has no date)
function soonUnit(){const us=visibleUnits().filter(u=>{const d=daysUntil(u.testDate);return d==null||d>=0});
  return us.sort((a,b)=>(daysUntil(a.testDate)??99)-(daysUntil(b.testDate)??99))[0]||null}
function buildToday(){
  const stops=[];
  let warm=[...new Set([...missedSkills(),...weakSkills().map(x=>x[0])])].slice(0,3);
  if(!warm.length)warm=['letterName','count'];   // the very first day: easy, familiar starts
  stops.push({kind:'warm',title:'Warm-up',pic:'🔥',skills:warm});
  const u=soonUnit();
  if(u)stops.push({kind:'test',title:'Test practice',pic:'📝',unit:u.id});
  else{const w=weakSkills().find(x=>x[1]<.8&&!warm.includes(x[0])),id=w?w[0]:nextNewSkill(warm)||'pattern';
    stops.push({kind:'practice',title:'Practice',pic:SKILLS[id].pic,skills:[id]})}
  const used=stops.flatMap(s=>s.skills||[]),nw=nextNewSkill(used)||weakSkills().map(x=>x[0]).find(id=>!used.includes(id))||'robot';
  stops.push({kind:'new',title:'Something new',pic:SKILLS[nw].pic,skills:[nw]});
  return {date:todayKey(),stops,i:0,did:[]}}
function today(){if(!P.today||P.today.date!==todayKey()){P.today=buildToday();saveP()}return P.today}
// The questions for one stop: about 5, mixed when the stop covers several skills
function stopSet(s){
  if(s.kind==='test'){const u=allUnits().find(x=>x.id===s.unit);
    if(u)return {list:shuffle(unitTest(u)).slice(0,5),ctx:unitCtx(u)};return {list:Array(5).fill('letterName'),ctx:{}}}
  const n=s.skills.length===1?(SKILLS[s.skills[0]].n||5):5;
  return {list:shuffle(Array.from({length:n},(_,i)=>s.skills[i%s.skills.length])),ctx:{}}}
// What a stop is called under its title, e.g. "Rhymes" or the test's countdown
function stopLabel(s){if(s.kind==='test'){const u=allUnits().find(x=>x.id===s.unit);return u?countdown(u):''}
  return s.skills.length===1?SKILLS[s.skills[0]].kid:s.skills.map(id=>SKILLS[id].kid).join(', ')}
// A sticker from the child's favorite things, new ones first
function newSticker(){const have=new Set(P.stickers||[]),pool=theme().items.map(x=>x[0]),fresh=pool.filter(e=>!have.has(e));
  const s=one(fresh.length?fresh:pool);P.stickers=[...(P.stickers||[]),s].slice(-60);saveP();return s}
// After a game picked by hand: suggest something not tried yet, in the same subject if possible
function suggestNew(fromSkill){const sub=SKILLS[fromSkill]&&SKILLS[fromSkill].sub;
  return PATH_ORDER.find(id=>playable(id)&&!tried(id)&&SKILLS[id].sub===sub)||nextNewSkill()||null}
