/* ================= units (test prep) =================
   A unit is one school test, written in the Unit JSON schema (see CLAUDE.md / PROMPT.md).
   Parents add their own on the grown-up screen; those are saved in localStorage as mkha_units.
   The built-in example below uses the same schema. */
const EXAMPLE_UNIT={id:'example',example:true,title:'Unit 3 Reading Test',grade:'K',
  words:[
   {word:'predict',emoji:'🌧️',meaning:'To guess what will happen next.',good:'I predict it will rain, because the sky is full of dark clouds.',silly:'I ate a big predict for lunch.'},
   {word:'clump',emoji:'🟤',meaning:'A bunch of things stuck together.',good:'There was a clump of mud stuck on my shoe.',silly:'I clump my teeth before bed.'},
   {word:'temperature',emoji:'🌡️',meaning:'How hot or cold something is.',good:'We check the temperature to see if it is hot or cold outside.',silly:'The temperature barked at the cat.'},
   {word:'tool',emoji:'🔨',meaning:'Something that helps you do a job.',good:'A hammer is a tool that helps us build.',silly:'I drank a cup of tool.'},
   {word:'moist',emoji:'💧',meaning:'A little bit wet.',good:'The grass is moist after the rain.',silly:'I put on my moist and went outside.'},
   {word:'struggle',emoji:'💪',meaning:'To try really, really hard.',good:'The boy had to struggle to lift the heavy box.',silly:'I struggled a cookie and ate it.'},
   {word:'burrow',emoji:'🐇',meaning:'A hole an animal digs to live in.',good:'The rabbit dug a burrow under the ground.',silly:'The bird flew high up into the burrow in the sky.'},
   {word:'warn',emoji:'⚠️',meaning:'To tell someone before something might happen.',good:'Mom warned me that the stove is hot.',silly:'I warn my socks on my feet.'},
   {word:'report',emoji:'📺',meaning:'News that is told to everyone.',good:'The weather report said it will snow tomorrow.',silly:'The report hopped across the pond like a frog.'},
   {word:'cozy',emoji:'🛏️',meaning:'Warm and comfortable. Snug.',good:'I feel cozy under my warm blanket.',silly:'Standing in the cold rain with no coat felt cozy.'}],
  letters:['s','m','d','p','a'],
  skills:['beginSound'],
  stories:STORIES.map(st=>({story:st.s,question:st.q,answers:st.o.map(([text,emoji,ok])=>ok?{text,emoji,correct:true}:{text,emoji})})),
  questions:[]};

/* ---- storage ---- */
const userUnits=()=>{const u=store.get('mkha_units',[]);return Array.isArray(u)?u:[]};
const allUnits=()=>[EXAMPLE_UNIT,...userUnits()];
const hiddenUnits=()=>store.get('mkha_hidden',[]);
function setUnitHidden(id,h){const s=new Set(hiddenUnits());h?s.add(id):s.delete(id);store.set('mkha_hidden',[...s])}
function saveUnit(u){store.set('mkha_units',[...userUnits().filter(x=>x.id!==u.id),u])}
function deleteUnit(id){store.set('mkha_units',userUnits().filter(x=>x.id!==id))}
// Units this kid sees: not hidden, and made for this kid or for everyone.
const visibleUnits=()=>allUnits().filter(u=>!hiddenUnits().includes(u.id)&&(!u.for||u.for===P.id));

function daysUntil(iso){if(!iso)return null;const [y,m,d]=iso.split('-').map(Number),t=new Date(y,m-1,d),n=new Date();n.setHours(0,0,0,0);return Math.round((t-n)/864e5)}
function countdown(u){const d=daysUntil(u.testDate);if(d==null)return u.example?'Example test':'Test coming up';
  return d<0?'Test is done':d===0?'Test is today!':d===1?'Test is tomorrow':`Test in ${d} days`}

/* Data the question generators read (ctx). Stories become the internal {s,q,o} shape gStory uses. */
function unitCtx(u){return {unit:u,letters:u.letters,
  stories:u.stories&&u.stories.length?u.stories.map(s=>({s:s.story,q:s.question,o:s.answers.map(a=>[a.text,a.emoji||'',a.correct?1:0])})):null}}
// Sections come from the data: [skill id, title, subtitle, picture]
function unitSections(u){const out=[];
  if(u.words&&u.words.length)out.push(['vocab','Words quiz','Happy or sad face?','😊']);
  if(u.letters&&u.letters.length)out.push(['letterSound','Letter sounds',u.letters.join(', '),'🔤']);
  (u.skills||[]).forEach(id=>SKILLS[id]&&out.push([id,SKILLS[id].kid,SKILLS[id].name,SKILLS[id].pic]));
  if(u.stories&&u.stories.length)out.push(['story','Stories','Listen, pick the picture','📖']);
  if(u.questions&&u.questions.length)out.push(['teacherQ',"Teacher's questions",`${u.questions.length} from the study guide`,'🍎']);
  return out}
// Practice test: about 2 per section, 3 for words; skills share their turns when there are many.
function unitTest(u){const per=(u.skills||[]).length>3?1:2;
  return unitSections(u).flatMap(([id])=>Array(id==='vocab'?3:id in SKILLS&&(u.skills||[]).includes(id)?per:2).fill(id))}
function unitSummary(u){const n=(k,one,many)=>{const c=(u[k]||[]).length;return c?`${c} ${c===1?one:many}`:''};
  return [n('words','word','words'),n('letters','letter','letters'),n('skills','skill','skills'),n('stories','story','stories'),n('questions','question','questions')].filter(Boolean).join(', ')}

/* ---- the AI prompt (also written to PROMPT.md) ---- */
function aiPrompt(){
  const skills=Object.entries(SKILLS).filter(([id,s])=>!s.unitOnly&&!SUBJECTS[s.sub].lang).map(([id,s])=>`  - ${id}: ${s.name} (${SUBJECTS[s.sub].name})`).join('\n');
  return `You are helping a parent turn their child's school study guide into practice for a free kids' learning app called Learning Lab. The child may have ADHD and may be a young or early reader, so everything is read aloud and answered by tapping a picture.

I will attach a photo (or paste the text) of the teacher's study guide. Read it and reply with ONE JSON object and nothing else, in exactly this shape:

{
  "title": "Unit 3 Reading Test",
  "grade": "K",
  "testDate": "2026-10-30",
  "words": [{"word": "burrow", "emoji": "🐇", "meaning": "A hole an animal digs to live in.", "good": "The rabbit dug a burrow under the ground.", "silly": "The bird flew up into the burrow in the sky."}],
  "letters": ["s", "m", "d", "p", "a"],
  "skills": ["beginSound"],
  "stories": [{"story": "Mia saw dark clouds. She grabbed something to stay dry.", "question": "What did Mia take?", "answers": [{"text": "umbrella", "emoji": "☂️", "correct": true}, {"text": "sunglasses", "emoji": "🕶️"}, {"text": "ball", "emoji": "⚽"}]}],
  "questions": [{"ask": "How many apples are there?", "show": "🍎🍎🍎", "answers": [{"text": "3", "correct": true}, {"text": "4"}, {"text": "2"}], "why": "Count them: 1, 2, 3. There are 3 apples."}]
}

Rules:
- "title" is required. Every other section is optional: include only what the study guide actually covers, and leave a section out if it does not apply.
- "testDate": the test date as YYYY-MM-DD if the guide shows one; otherwise leave it out.
- "grade": the grade as a short label, like "K", "1" or "2".
- "words": vocabulary words. "meaning" is one short sentence a young child understands. "good" is a sentence that uses the word correctly. "silly" uses the word in an obviously wrong, funny way, so a child can tell it is wrong. Pick one emoji that shows the word.
- "letters": letters whose sounds are on the test, lowercase, one letter each.
- "skills": general skills on the test that the app already practices. Use only ids from this list:
${skills}
- "stories": short listening stories (2 to 4 sentences) with one question each, like the ones on the test.
- "questions": any other test questions. "ask" is read aloud. "show" is optional: emoji or a few words shown on screen. "why" is one kid-level sentence that gives the answer and the reason.
- Every story and question has 2 to 4 answers, and exactly one has "correct": true. Give answers an emoji whenever a picture helps a child who cannot read yet.
- Use simple words a young child knows. Do not use real children's names, brand names, or licensed characters.
- Reply with the JSON only. No explanation before or after it.`}

/* ---- checking pasted JSON ---- */
function parseUnit(text){
  const errors=[],warnings=[];let raw=String(text||'').replace(/```[a-z]*\s*/gi,'').replace(/```/g,'').trim();
  const a=raw.indexOf('{'),b=raw.lastIndexOf('}');
  if(!raw)return {errors:['The box is empty. Paste the answer from the AI first.'],warnings};
  if(a<0||b<a)return {errors:["That doesn't look like the AI's answer. It should start with { and end with }."],warnings};
  let j;try{j=JSON.parse(raw.slice(a,b+1))}catch(e){return {errors:["Part of the answer is missing or broken. Copy the AI's whole reply, from the first { to the last }, and paste it again. If that doesn't work, ask the AI: “Please send the JSON again, and make sure it is valid.”"],warnings}}
  if(!j||typeof j!=='object'||Array.isArray(j))return {errors:['Paste one test at a time.'],warnings};
  const str=v=>typeof v==='string'&&v.trim()?v.trim():'';
  const u={id:'u'+Date.now().toString(36),title:str(j.title).slice(0,60)};
  if(!u.title)errors.push('The test needs a "title", like "Unit 3 Reading Test".');
  if(str(j.grade))u.grade=str(j.grade).slice(0,12);
  if(j.testDate!=null&&j.testDate!==''){const d=str(j.testDate);
    if(/^\d{4}-\d{2}-\d{2}$/.test(d)&&!isNaN(new Date(d)))u.testDate=d;else warnings.push(`The test date “${esc(d)}” isn't in the form 2026-10-30, so it was left out.`)}
  const list=(k,label)=>{if(j[k]==null)return [];if(!Array.isArray(j[k])){errors.push(`“${label}” should be a list.`);return []}return j[k]};
  const words=list('words','words').map((w,i)=>{const o={word:str(w&&w.word),emoji:str(w&&w.emoji)||'📘',meaning:str(w&&w.meaning),good:str(w&&w.good),silly:str(w&&w.silly)};
    const miss=['word','meaning','good','silly'].filter(k=>!o[k]);if(miss.length){errors.push(`Word ${i+1}${o.word?` (“${esc(o.word)}”)`:''} is missing: ${miss.join(', ')}.`);return null}return o}).filter(Boolean);
  if(words.length)u.words=words;
  const letters=[];list('letters','letters').forEach(l=>{const s=str(l).toLowerCase();if(/^[a-z]$/.test(s)){if(!letters.includes(s))letters.push(s)}else warnings.push(`“${esc(String(l))}” isn't a single letter, so it was left out.`)});
  if(letters.length)u.letters=letters;
  const skills=[];list('skills','skills').forEach(s=>{const id=str(s);if(SKILLS[id]&&!SKILLS[id].unitOnly){if(!skills.includes(id))skills.push(id)}else warnings.push(`The app doesn't have a skill called “${esc(String(s))}”, so it was left out.`)});
  if(skills.length)u.skills=skills;
  const answers=(arr,where)=>{if(!Array.isArray(arr)||arr.length<2||arr.length>4){errors.push(`${where} needs 2 to 4 answers.`);return null}
    const out=arr.map(x=>({text:str(x&&x.text),emoji:str(x&&x.emoji),correct:!!(x&&x.correct===true)}));
    if(out.some(x=>!x.text&&!x.emoji)){errors.push(`${where} has an empty answer.`);return null}
    const ok=out.filter(x=>x.correct).length;if(ok!==1){errors.push(`${where} needs exactly one correct answer (it has ${ok}).`);return null}
    if(new Set(out.map(x=>x.text+x.emoji)).size!==out.length){errors.push(`${where} has the same answer twice.`);return null}
    return out.map(x=>{const o={text:x.text||x.emoji};if(x.emoji)o.emoji=x.emoji;if(x.correct)o.correct=true;return o})};
  const stories=list('stories','stories').map((s,i)=>{const o={story:str(s&&s.story),question:str(s&&s.question)};
    if(!o.story||!o.question){errors.push(`Story ${i+1} needs both a “story” and a “question”.`);return null}
    const an=answers(s.answers,`Story ${i+1}`);return an?{...o,answers:an}:null}).filter(Boolean);
  if(stories.length)u.stories=stories;
  const questions=list('questions','questions').map((q,i)=>{const o={ask:str(q&&q.ask)};
    if(!o.ask){errors.push(`Question ${i+1} needs an “ask” (the question that is read aloud).`);return null}
    if(str(q.show))o.show=str(q.show).slice(0,80);if(str(q.why))o.why=str(q.why);
    const an=answers(q.answers,`Question ${i+1}${o.ask?` (“${esc(o.ask.slice(0,40))}”)`:''}`);return an?{...o,answers:an}:null}).filter(Boolean);
  if(questions.length)u.questions=questions;
  if(!errors.length&&!unitSections(u).length)errors.push('The test has a title but nothing to practice yet. It needs at least one of: words, letters, skills, stories, questions.');
  return {unit:errors.length?null:u,errors,warnings};
}
