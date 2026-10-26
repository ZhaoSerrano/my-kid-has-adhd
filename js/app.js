/* ================= navigation ================= */
let backFn=null;
function setHeader(title,back){$('#hdrTitle').textContent=title;backFn=back||null;$('#backBtn').hidden=!back;window.scrollTo(0,0)}
$('#backBtn').onclick=()=>{hush();backFn&&backFn()};
const speakName=s=>s.replace(/&/g,'and');

function start(){loadProfiles();if(pref.natural&&!nvCrashed())nvLoad();
  const go=()=>{if(!PROFILES.length){welcome();return}if(PROFILES.length===1){enter(PROFILES[0]);return}picker()};
  splash(go)}
// One big first tap: it says "start here", and it wakes up the voice (browsers stay silent until a tap).
function splash(next){
  setHeader('');const p=PROFILES.length===1?PROFILES[0]:null,pic=p&&p.theme?THEMES[p.theme].pic:'🎈';
  view.innerHTML=`<div class="splash"><div class="splashpic">${pic}</div><h1>${p&&p.name?`Hi, ${esc(p.name)}!`:'Wiggle &amp; Win'}</h1>
    <button class="playbig" id="go">▶ Let's play!</button></div>`;
  $('#go').onclick=next}
function enter(p){loadProfile(p.id);p.theme?home():pickTheme(p,home)}

/* ---- profiles: first run, theme picker, who's playing ---- */
function welcome(){
  setHeader(PROFILES.length?'Add a child':'Welcome!',PROFILES.length?picker:null);
  view.innerHTML=`<div class="col"><div class="panel">
    <h1>Hi, grown-up!</h1>
    <p class="small" style="font-size:1rem"><b>Wiggle &amp; Win™</b> turns quiz prep into a game. Everything is read aloud, and your child answers by tapping. Progress stays on this device. Nothing is sent anywhere.</p>
    <label class="field"><span>Child's first name or nickname <i>(optional)</i></span><input id="nm" maxlength="30" autocomplete="off" autocapitalize="words" spellcheck="false"></label>
    <div class="btnrow left"><button class="primary" id="go1">Next →</button></div>
    <p class="small">Next, hand the device to your child to pick what they like best.</p>
    <p class="small">New here? Read the ${extLink(GUIDE_URL,'3-step guide')}. Later, find it under <b>For grown-ups</b>.</p></div></div>`;
  const nm=$('#nm');nm.focus();nm.onkeydown=e=>{if(e.key==='Enter')$('#go1').click()};
  $('#go1').onclick=()=>{const p=addProfile(nm.value);loadProfile(p.id);pickTheme(p,home)};
}
function pickTheme(p,after,back){
  setHeader('What do you like best?',back);
  const ks=Object.keys(THEMES),intro=['What do you like best?',500,'Tap a picture.'];
  view.innerHTML=`<div class="col"><button class="listen" id="hear" style="align-self:center">${SPK} Hear it</button>
    <div class="themes">${ks.map(k=>`<button class="themetile ${p.theme===k?'on':''}" data-t="${k}"><span class="pic">${THEMES[k].pic}</span><b>${THEMES[k].name}</b></button>`).join('')}</div></div>`;
  const all=[...intro,700,...ks.flatMap(k=>[speakName(THEMES[k].name)+'.',350])];
  $('#hear').onclick=()=>say(all);say(all);
  view.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{p.theme=b.dataset.t;saveProfiles();
    if(P&&P.id===p.id)P.meta=p;say(`${speakName(THEMES[p.theme].name)}! Great pick.`);after()});
}
const kidLabel=(p,i)=>p.name||`Player ${i+1}`;
function picker(){
  setHeader("Who's playing?");
  view.innerHTML=`<div class="col"><div class="subjects">${PROFILES.map((p,i)=>`<button class="subj" style="--h:${(i*67+200)%360}" data-p="${p.id}"><span class="pic">${p.theme?THEMES[p.theme].pic:'🙂'}</span><b>${esc(kidLabel(p,i))}</b></button>`).join('')}
    <button class="subj addkid" id="addKid"><span class="pic">＋</span><b>Add child</b></button></div></div>`;
  say("Who's playing?");
  view.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>enter(PROFILES.find(p=>p.id===b.dataset.p)));
  $('#addKid').onclick=welcome;
}

/* Home shows one goal at a time: 🎯 Test prep when a test is coming, otherwise 📚 the school year.
   Either way: 3 stops and one big Play button. Everything else is one level down. */
function home(){
  const nm=kidName();setHeader(nm?`${nm}'s Wiggle & Win`:'Wiggle & Win',PROFILES.length>1?picker:null);
  const T=today(),test=T.mode==='test',u=test&&allUnits().find(x=>x.id===T.unit),fin=T.i>=T.stops.length,hero=theme().hero,stk=P.stickers||[];
  const trail=T.stops.map((s,k)=>`<li class="stop ${k<T.i?'done':k===T.i?'now':''}">${k===T.i?`<span class="me" aria-hidden="true">${hero[0]}</span>`:''}
    <span class="bub">${k<T.i?'✓':s.pic}</span><b>${esc(s.title)}</b><small>${esc(stopLabel(s))}</small></li>`).join('');
  const rd=test&&readiness(u),d=test&&daysUntil(u.testDate);
  const meter=test?`<div class="ready"><div class="readytop"><b>Ready for the test</b><span>${rd.pct}%</span></div><div class="bar"><i style="width:${rd.pct}%"></i></div>
    <ul>${rd.rows.map(r=>`<li><span>${r.pic}</span>${esc(r.title)}<em>${r.skill?(r.pct>=1?'✓ Got it':r.pct>0?'Getting there':'Not yet'):`${r.ready}/${r.total}`}</em></li>`).join('')}</ul></div>`:'';
  const pend=resultPending().length;
  view.innerHTML=`<div class="col">
    <div class="modechip ${test?'test':'year'}">${test?'🎯 Test prep':'📚 School year'}</div>
    <section class="adventure ${test?'testmode':''}">
      ${test?`<h2>Get ready for your test!</h2><p class="testname">📝 ${esc(u.title)}<small>${esc(countdown(u))}</small></p>${meter}`
        :`<h2>${fin?'Adventure done! 🎉':"Today's adventure"}</h2>`}
      <ol class="trail">${trail}</ol>
      ${fin?`<p class="sub">${test?(d!=null&&d<=1?"You're ready! 🌟 Good luck on your test!":'Great practice today. Come back tomorrow.'):'Come back tomorrow for a new one.'}</p>`:''}
      <button class="playbig" id="play">${fin?(test?'▶ Practice more':'📚 My school year'):'▶ Play'}</button></section>
    ${test?'<button class="secondary pick" id="pick">📚 Explore the school year</button>':fin?'':'<button class="secondary pick" id="pick">📚 My school year</button>'}
    ${stk.length?`<div class="stickers" aria-label="my stickers"><b>My stickers</b><span>${stk.slice(-12).join('')}</span></div>`:''}
    <button class="grownbtn" id="grownBtn">${pend?'For grown-ups: how did the test go? 📝':'For grown-ups: progress, tests &amp; settings'}</button>
  </div>`;
  $('#play').onclick=fin?(test?()=>unitHome(u):pickGame):runStop;if($('#pick'))$('#pick').onclick=pickGame;$('#grownBtn').onclick=grown;
  const hi=nm?`Hi, ${nm}!`:'Hi!';
  say(test?[hi,300,...(fin?(d!=null&&d<=1?["You're ready for your test!",300,'Good luck!']:['Great practice today!'])
      :[d===1?'Tomorrow is your test!':d===0?'Your test is today!':"Let's get ready for your test.",400,'Tap Play.'])]
    :fin?[hi,300,'You finished today\'s adventure!',400,'Come back tomorrow for a new one.']
    :[hi,300,T.i===0?"Let's start today's adventure.":`Next stop: ${T.stops[T.i].title}.`,400,'Tap Play.']);
  nvWarm();
}
function runStop(){const T=today(),s=T.stops[T.i];if(!s){home();return}const {list,ctx}=stopSet(s);
  runRound(s.title,()=>makeSet(list,ctx),home,{stop:T.i})}
// 📚 My school year: every subject with how much is mastered, plus any tests. One level below home.
function pickGame(){
  setHeader('My school year',home);const units=visibleUnits();
  const tiles=g=>Object.entries(SUBJECTS).filter(([,s])=>s.group===g).map(([k,s])=>{const p=subjectProgress(k);
    return `<button class="subj" style="--h:${s.h}" data-s="${k}"><span class="pic">${s.pic}</span><b>${s.name}</b>
      <span class="subjbar" aria-label="${p.got} of ${p.total} mastered"><i style="width:${p.total?p.got/p.total*100:0}%"></i></span><small class="subjcount">⭐ ${p.got}/${p.total}</small></button>`}).join('');
  view.innerHTML=`<div class="col">
    ${units.map(u=>`<button class="banner" data-u="${u.id}"><span class="pic">📝</span><span><small>${countdown(u)}</small><b>${esc(u.title)}</b></span></button>`).join('')}
    <div class="subjects">${tiles('school')}</div>
    <p class="grouplabel">More to explore</p>
    <div class="subjects four">${tiles('more')}</div>
  </div>`;
  view.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>unitHome(allUnits().find(u=>u.id===b.dataset.u)));
  view.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>subject(b.dataset.s));
}
function subject(sub){
  const S=SUBJECTS[sub],ids=Object.keys(SKILLS).filter(id=>SKILLS[id].sub===sub&&!SKILLS[id].unitOnly);
  setHeader(S.name,pickGame);
  view.innerHTML=`<div class="col">
    <button class="mix" style="--h:${S.h}" id="mix">▶ Play a mix</button>
    <div class="menu">${S.lang?`<button class="tile" data-x="cards"><span class="pic">🃏</span><b>Word cards</b><small>Hear every word</small></button>`:''}
    ${ids.map(id=>{const s=SKILLS[id],m=mastery(id);return `<button class="tile" data-k="${id}"><i class="dot ${m.lvl}"></i><span class="pic">${id==='robot'?theme().hero[0]:s.pic}</span><b>${s.kid}</b>${id==='robot'?`<small>Level ${P.robotLevel+1}</small>`:''}</button>`}).join('')}</div>
  </div>`;
  $('#mix').onclick=()=>runRound(`${S.name} mix`,()=>makeSet(mixList(sub,MIXN[sub]||6),{}),()=>subject(sub));
  if(S.lang)view.querySelector('[data-x="cards"]').onclick=()=>deck(`${S.name} words`,langDeck(S.lang),0,()=>subject(sub));
  view.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const id=b.dataset.k,n=SKILLS[id].n||5;runRound(SKILLS[id].kid,()=>makeSet(Array(n).fill(id),{}),()=>subject(sub))});
}
function langDeck(lg){const L=LANG[lg];return Object.values(L.cats).flatMap(c=>c[2].map(it=>({
  big:typeof it[1]==='number'?`<div class="bigpic" style="font:700 5rem var(--f-read)">${it[1]}</div>`:`<div class="bigpic" style="font-size:5rem">${it[1]}</div>`,
  word:`<div class="foreign" lang="${L.tag}">${it[0]}</div>${it[3]?`<div class="pinyin">${it[3]}</div>`:''}`,def:it[2],
  speak:[{t:it[0],lang:lg},700,it[2]+'.',700,{t:it[0],lang:lg}]})))}
function unitHome(u){
  if(!u){pickGame();return}
  setHeader(u.title,pickGame);const ctx=unitCtx(u),secs=unitSections(u),words=u.words||[];
  view.innerHTML=`<div class="col"><p class="sub" style="text-align:center">${countdown(u)}</p><div class="menu">
      ${words.length?`<button class="tile" data-x="cards"><span class="pic">🃏</span><b>Word cards</b><small>Learn the ${words.length} words</small></button>`:''}
      ${secs.map(([id,t,d,pic])=>`<button class="tile" data-k="${id}"><i class="dot ${mastery(id).lvl}"></i><span class="pic">${pic}</span><b>${esc(t)}</b><small>${esc(d)}</small></button>`).join('')}
      <button class="tile" data-x="test" style="border-color:var(--read)"><span class="pic">⭐</span><b>Practice test</b><small>A little of everything</small></button>
    </div></div>`;
  if(words.length)view.querySelector('[data-x="cards"]').onclick=()=>deck('Word cards',words.map(v=>({big:`<div class="bigpic" style="font-size:5rem">${esc(v.emoji)}</div>`,word:`<div class="lined word">${esc(v.word)}</div>`,def:esc(v.meaning),ex:`“${esc(v.good)}”`,
    speak:[v.word+'.',800,...sentences(v.meaning),900,...sentences(v.good)]})),0,()=>unitHome(u));
  view.querySelector('[data-x="test"]').onclick=()=>runRound('Practice test',()=>makeSet(unitTest(u),ctx),()=>unitHome(u));
  view.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const id=b.dataset.k;runRound(SKILLS[id].kid,()=>makeSet(Array(SKILLS[id].n||(id==='vocab'?6:5)).fill(id),ctx),()=>unitHome(u))});
}
function deck(title,items,i,back){
  setHeader(title,back);const it=items[i];
  view.innerHTML=`<div class="col">
    ${items.length<=16?`<div class="progress">${items.map((_,k)=>`<i class="${k<i?'done':''} ${k===i?'now':''}"></i>`).join('')}</div>`:`<p class="sub" style="text-align:center;font-variant-numeric:tabular-nums">${i+1} of ${items.length}</p>`}
    <div class="stage">${it.big}${it.word}${it.def?`<p class="def">${it.def}</p>`:''}${it.ex?`<p class="ex">${it.ex}</p>`:''}<button class="listen" id="hear">${SPK} Hear it</button></div>
    <div class="cardnav"><button id="prev" ${i===0?'disabled':''}>← Back</button><button id="next">${i===items.length-1?'Done ✓':'Next →'}</button></div></div>`;
  const read=()=>say(it.speak);$('#hear').onclick=read;read();if(items[i+1])nvPrefetch(items[i+1].speak);
  $('#prev').onclick=()=>i>0&&deck(title,items,i-1,back);
  $('#next').onclick=()=>i<items.length-1?deck(title,items,i+1,back):(hush(),back());
}

/* ================= round runner ================= */
let R=null,roundsDone=0;
const MAX_EXTRAS=2;
// opts.stop: index of today's adventure stop this round belongs to (absent for games picked by hand)
function runRound(title,make,back,opts={}){hush();R={title,make,back,opts,qs:make(),i:0,res:[],extras:0};R.qs.forEach(q=>nvPrefetch(q.prompt));showQ()}
// A missed question comes back once at the end of the round, reshuffled (at most MAX_EXTRAS per round).
function requeue(q){if(q.again||q.mode==='robot'||R.extras>=MAX_EXTRAS)return;R.extras++;
  R.qs.push(Object.assign({},q,{again:true,key:q.key+'#again',options:q.options&&shuffle(q.options),prompt:["Let's try this one again.",500,...q.prompt]}))}
const whyText=q=>q.whyText||(q.why||[]).map(p=>typeof p==='string'?p:p&&p.t||'').filter(Boolean).join(' ');
function showQ(){
  const q=R.qs[R.i];setHeader(R.title,R.back);
  view.innerHTML=`<div class="col">
    <div class="progress">${R.qs.map((_,k)=>`<i class="${k<R.i?(R.res[k]?'done':'miss'):''} ${k===R.i?'now':''}"></i>`).join('')}</div>
    <div class="stage" id="stage"></div><p class="grownup">${q.grown||''}</p></div>`;
  const st=$('#stage');let ended=false;const myR=R,myI=R.i,go=()=>{if(R===myR&&R.i===myI)nextQ()};
  const fb=(t,c)=>{const f=st.querySelector('#fb');if(f){f.className='feedback '+c;f.textContent=t}};
  const api={
    win(first){if(ended)return;ended=true;R.res[R.i]=first;
      if(q.again)record(null,false,first);else{record(q.skill,first);markItem(q,first)}
      const s=$('.stars');s.classList.remove('pop');void s.offsetWidth;if(first)s.classList.add('pop');
      fb(first?'Yes! ⭐':'Yes, you got it!','good');say(first?'Yes! Great job!':'Yes! You got it!',()=>setTimeout(go,700))},
    // Wrong twice: show the right answer and why, read it aloud, and wait for Next.
    lose(){if(ended)return;ended=true;R.res[R.i]=false;
      if(!q.again){record(q.skill,false);markItem(q,false)}requeue(q);
      const w=q.why&&q.why.length?q.why:['Here is the answer.'];fb('','');
      st.insertAdjacentHTML('beforeend',`<div class="why" role="status"><span class="ck" aria-hidden="true">✓</span><p>${esc(whyText(q)||'Here is the answer.')}</p>
        <button class="listen icon" id="whyHear" aria-label="hear why again">${SPK}</button></div>
        <button class="primary nextbtn" id="nextBtn">Next →</button>`);
      st.querySelector('#whyHear').onclick=()=>say(w);
      st.querySelector('#nextBtn').onclick=()=>{hush();go()};
      st.querySelector('#nextBtn').scrollIntoView({block:'nearest',behavior:'smooth'});
      say(w)},
    retry(){fb('Hmm, listen one more time.','try');say(['Hmm.',300,'Try again.',800,...q.prompt])},
    fb,
  };
  (MOUNTS[q.mode||'choose'])(q,st,api);
  // get the natural voice ready for what's likely next: the explanation, then the next question
  nvPrefetch(q.why);
}
function nextQ(){R.i++;R.i<R.qs.length?showQ():done()}
const WIGGLES=[['🦘','Jump 5 times!'],['🙆','Touch your toes 5 times.'],['🌳','Stretch up tall like a tree.'],['🐸','Hop like a frog 3 times.'],['👏','Clap your hands 10 times.'],
  ['🦩','Stand on one foot like a flamingo. Count to 5.'],['🏃','Run in place. Count to 10.'],['🐻','Give yourself a big bear hug.'],['🌬️','Take 3 slow, deep breaths.'],['🙌','Reach up high, then touch the floor. Do it 3 times.']];
/* End of a round: celebrate, then point forward. The big button is always the next new thing;
   "Play again" is small, because doing the same thing again is not what keeps a kid learning. */
function done(){
  const got=R.res.filter(Boolean).length,n=R.qs.length;setHeader(R.title,R.back);roundsDone++;
  const skills=[...new Set(R.qs.filter(q=>!q.again).map(q=>q.skill))];
  // a round that's part of today's adventure moves the adventure forward
  let next=null,label='',T=null;
  if(R.opts.stop!=null){T=today();if(T.i===R.opts.stop){T.did=[...new Set([...T.did,...skills])];T.i++;saveP()}
    if(T.i>=T.stops.length){recap(got,n);return}
    const s=T.stops[T.i];label=`Next: ${s.title}`;next=runStop;
  }else{T=today();
    if(T.i<T.stops.length){label="Back to today's adventure";next=home}
    else{const id=suggestNew(skills[0]);if(id){label=`Try something new: ${SKILLS[id].kid}`;next=()=>runRound(SKILLS[id].kid,()=>makeSet(Array(SKILLS[id].n||5).fill(id),{}),pickGame)}}}
  const wig=roundsDone%2===0?one(WIGGLES):null;
  const cheer=got===n?'Wow! All the stars!':got>=n/2?'You did great!':'Good effort! You are learning.';
  view.innerHTML=`<div class="col"><div class="stage done"><h1>${cheer}</h1>
    <div class="row">${R.res.map(r=>STAR.replace('<svg',`<svg class="${r?'':'off'}"`)).join('')}</div>
    ${wig?`<div class="wiggle" id="wig"><div class="bigpic">${wig[0]}</div><h2>Wiggle break!</h2><p>${wig[1]}</p><button class="go" id="did">I did it!</button></div>`:''}
    ${next?`<button class="playbig" id="next">${esc(label)} →</button>`:`<button class="playbig" id="next">Done ✓</button>`}
    <div class="btnrow"><button class="secondary sm" id="again">↻ Play again</button>${R.opts.stop!=null||!next?'':`<button class="secondary sm" id="back2">Done</button>`}</div></div></div>`;
  const forward=next?(label.startsWith('Next')?[label+'!']:['Want to try something new?',300,'Tap the big button.']):[];
  say(wig?[cheer,600,'Wiggle break!',400,wig[1]]:[cheer,500,...forward]);
  if(wig)$('#did').onclick=()=>{$('#wig').innerHTML='<div class="bigpic">🎉</div><h2>Great moving!</h2>';say(['Great moving!',400,...forward])};
  $('#next').onclick=()=>{hush();(next||R.back)()};
  $('#again').onclick=()=>runRound(R.title,R.make,R.back,R.opts);
  if($('#back2'))$('#back2').onclick=()=>{hush();R.back()};
}
// The end of today's adventure: what they practiced, a sticker, and a clear stop.
function recap(got,n){
  const T=today(),st=newSticker(),names=T.did.filter(id=>SKILLS[id]).map(id=>SKILLS[id]);
  const u=T.mode==='test'&&allUnits().find(x=>x.id===T.unit),rd=u&&readiness(u),d=u&&daysUntil(u.testDate),last=u&&d!=null&&d<=1;
  const title=u?(last?"You're ready for your test! 🌟":'Great test practice!'):"You finished today's adventure!";
  setHeader(u?'Test prep':"Today's adventure",home);
  view.innerHTML=`<div class="col"><div class="stage done recap"><h1>${title}</h1>
    <div class="sticker" aria-label="new sticker">${st}</div><p class="sub">New sticker!</p>
    ${u?`<div class="ready"><div class="readytop"><b>Ready for the test</b><span>${rd.pct}%</span></div><div class="bar"><i style="width:${rd.pct}%"></i></div></div>`:''}
    ${names.length?`<div class="learned"><b>Today you practiced</b><ul>${names.map(s=>`<li><span>${s.pic}</span>${esc(s.kid)}</li>`).join('')}</ul></div>`:''}
    <button class="playbig" id="bye">${last?'Good luck! 🍀':'See you tomorrow! 👋'}</button>
    <div class="btnrow"><button class="secondary sm" id="more">📚 Keep playing</button></div></div></div>`;
  const list=names.map(s=>s.kid.toLowerCase());
  say(['Hooray!',300,title.replace(/ 🌟$/,''),500,...(list.length?[`Today you practiced ${andList(list)}.`,500]:[]),'You earned a new sticker!']);
  $('#bye').onclick=()=>{hush();home()};$('#more').onclick=()=>{hush();pickGame()};
}

const hearBtn=`<button class="listen" id="hear">${SPK} Hear it again</button>`;
const optsHTML=q=>`<div class="answers ${q.ansCls||''}">${q.options.map((o,k)=>`<button class="opt ${o.cls}" data-k="${k}" aria-label="${esc(o.label)}">${o.html}</button>`).join('')}</div>`;
function shake(b){b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake')}
const cellHTML=(lv,pos,trail,bump)=>{const {hero,goal}=theme();let h='';
  for(let r=0;r<lv.size;r++)for(let c=0;c<lv.size;c++){const isR=pos[0]===r&&pos[1]===c,isG=lv.goal[0]===r&&lv.goal[1]===c,rock=lv.rocks.some(x=>x[0]===r&&x[1]===c),tr=trail.some(x=>x[0]===r&&x[1]===c),bp=bump&&bump[0]===r&&bump[1]===c;
    h+=`<div class="cell ${tr?'trail':''} ${isG?'goal':''} ${bp?'bump':''}">${isR?hero[0]:isG?goal[0]:rock?'🪨':''}</div>`}
  return h};
const MOUNTS={
  choose(q,st,api){
    st.innerHTML=`${q.top||''}${hearBtn}${optsHTML(q)}<div class="feedback" id="fb" aria-live="polite"></div>`;
    st.querySelector('#hear').onclick=()=>say(q.prompt);say(q.prompt);q.after&&q.after(st);
    let tries=0,locked=false;const btns=[...st.querySelectorAll('.opt')];
    btns.forEach(b=>b.onclick=()=>{if(locked)return;const o=q.options[+b.dataset.k];
      if(o.ok){locked=true;b.classList.add('right','pop');api.win(tries===0)}
      else{tries++;b.classList.add('wrong');shake(b);
        if(tries<2)api.retry();else{locked=true;btns[q.options.findIndex(x=>x.ok)].classList.add('circled');api.lose()}}});
  },
  sequence(q,st,api){
    st.innerHTML=`${q.top||''}${hearBtn}${optsHTML(q)}<div class="feedback" id="fb" aria-live="polite"></div>`;
    st.querySelector('#hear').onclick=()=>say(q.prompt);say(q.prompt);
    const total=q.options.filter(o=>o.seq>=0).length;let nextI=0,miss=0,locked=false;const btns=[...st.querySelectorAll('.opt')];
    const mark=(b,n)=>{b.classList.add('right');b.insertAdjacentHTML('beforeend',`<i class="badge">${n}</i>`)};
    btns.forEach(b=>b.onclick=()=>{if(locked||b.classList.contains('right'))return;const o=q.options[+b.dataset.k];
      if(o.seq===nextI){nextI++;mark(b,nextI);if(q.seqSpeak)say(['One','Two','Three','Four'][nextI-1]);
        if(nextI===total){locked=true;api.win(miss===0)}}
      else{miss++;shake(b);
        if(miss<2)api.retry();else{locked=true;q.options.forEach((x,k)=>{if(x.seq>=nextI)mark(btns[k],x.seq+1)});api.lose()}}});
  },
  robot(q,st,api){
    const lv=q.level;let pos=lv.start.slice(),prog=[],tries=0,running=false,trail=[],bump=null,cur=-1;
    st.innerHTML=`<div class="robo-grid" id="grid" style="--n:${lv.size}"></div><div class="prog" id="prog"></div>
      <div class="pad"><span></span><button data-d="U" aria-label="up">↑</button><button class="undo" data-a="undo" aria-label="remove last">⌫</button><button data-d="L" aria-label="left">←</button><button data-d="D" aria-label="down">↓</button><button data-d="R" aria-label="right">→</button></div>
      <div class="gorow"><button class="go" id="go">▶ Go</button><button class="listen" id="hear" aria-label="hear again" style="padding:12px 16px">${SPK}</button></div>
      <div class="feedback" id="fb" aria-live="polite"></div>`;
    const grid=st.querySelector('#grid'),pe=st.querySelector('#prog');
    const draw=()=>{grid.innerHTML=cellHTML(lv,pos,trail,bump)};
    const drawP=()=>{pe.innerHTML=prog.length?prog.map((d,i)=>`<span class="chip ${i===cur?'now':''}">${DIRS[d][2]}</span>`).join(''):'<span class="hint">Tap the arrows to build a path</span>'};
    draw();drawP();say(q.prompt);
    st.querySelector('#hear').onclick=()=>say(q.prompt);
    st.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{if(running||prog.length>=14)return;prog.push(b.dataset.d);drawP();say(DIRS[b.dataset.d][3])});
    st.querySelector('[data-a="undo"]').onclick=()=>{if(running)return;prog.pop();drawP()};
    st.querySelector('#go').onclick=()=>{
      if(running)return;if(!prog.length){say('Tap the arrows first.');return}
      running=true;pos=lv.start.slice();trail=[];bump=null;cur=-1;api.fb('','');draw();
      const sim=simulate(lv,prog);let k=0;
      const tick=()=>{if(k>=sim.steps.length){cur=-1;drawP();finish(sim);return}const s=sim.steps[k++];cur=s.i;
        if(s.bump){bump=s.bump.map((v,j)=>Math.max(0,Math.min(lv.size-1,v)));}else{trail.push(pos.slice());pos=s.pos}draw();drawP();setTimeout(tick,520)};
      setTimeout(tick,300);
    };
    const finish=sim=>{running=false;
      if(sim.reached){if(q.lvIdx>=P.robotLevel){P.robotLevel=q.lvIdx+1;saveP()}api.win(tries===0);return}
      tries++;
      if(tries>=3){prog=bfs(lv).slice();drawP();api.fb("Here's one way. Press Go!",'try');say(["Here's one way to do it.",400,'Press Go.']);tries=99;return}
      api.fb(sim.bumped?'Bump! Fix the arrows.':'Almost! Fix the arrows.','try');
      say([sim.bumped?'Bump!':'Not quite.',400,'Fix the arrows and press Go again.']);
    };
    // a hinted solve counts as not-first-try
    const origWin=api.win;api.win=f=>origWin(tries===99?false:f);
  },
  trace(q,st,api){
    st.innerHTML=`<div class="tracewrap"><canvas id="cv" width="600" height="600" aria-label="tracing area"></canvas></div>
      <div class="btnrow"><button class="secondary" id="clr">Clear</button><button class="go" id="ok">Done ✓</button><button class="listen" id="hear" aria-label="hear again" style="padding:12px 16px">${SPK}</button></div>
      <div class="feedback" id="fb" aria-live="polite"></div>`;
    const W=600,cv=st.querySelector('#cv'),c=cv.getContext('2d');
    const mk=()=>{const x=document.createElement('canvas');x.width=x.height=W;return x};
    const ink=mk(),ik=ink.getContext('2d'),mask=mk(),mc=mask.getContext('2d'),dil=mk(),dc=dil.getContext('2d');
    const cs=getComputedStyle(document.documentElement),tok=n=>cs.getPropertyValue(n).trim()||'#888';
    const size=q.glyph.length>1?320:420,base=480,top=base-size*.72,mid=(top+base)/2,font=`400 ${size}px Andika, "Century Gothic", sans-serif`;
    const glyph=x=>{x.font=font;x.textAlign='center';x.textBaseline='alphabetic';x.fillText(q.glyph,W/2,base)};
    const bg=()=>{c.fillStyle=tok('--paper');c.fillRect(0,0,W,W);c.lineWidth=4;
      c.strokeStyle=tok('--rule-blue');c.setLineDash([]);c.beginPath();c.moveTo(20,top);c.lineTo(W-20,top);c.stroke();
      c.setLineDash([18,14]);c.beginPath();c.moveTo(20,mid);c.lineTo(W-20,mid);c.stroke();c.setLineDash([]);
      c.strokeStyle=tok('--rule-red');c.beginPath();c.moveTo(20,base);c.lineTo(W-20,base);c.stroke();
      c.fillStyle=tok('--edge');glyph(c);c.drawImage(ink,0,0)};
    const prep=()=>{mc.clearRect(0,0,W,W);dc.clearRect(0,0,W,W);mc.fillStyle='#000';glyph(mc);dc.fillStyle='#000';dc.strokeStyle='#000';dc.lineWidth=80;dc.lineJoin='round';glyph(dc);dc.strokeText(q.glyph,W/2,base);bg()};
    bg();Promise.resolve(document.fonts&&document.fonts.load?document.fonts.load(font):0).catch(()=>{}).then(prep);
    let drawing=false,last=null,inked=0,tries=0,locked=false;
    const pt=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*W/r.height]};
    const line=(a,b)=>{ik.strokeStyle=tok('--accent');ik.lineWidth=40;ik.lineCap='round';ik.lineJoin='round';ik.beginPath();ik.moveTo(a[0],a[1]);ik.lineTo(b[0],b[1]);ik.stroke();inked++;bg()};
    cv.addEventListener('pointerdown',e=>{if(locked)return;e.preventDefault();drawing=true;try{cv.setPointerCapture(e.pointerId)}catch(_){}last=pt(e);line(last,[last[0]+.5,last[1]])});
    cv.addEventListener('pointermove',e=>{if(!drawing)return;e.preventDefault();const p=pt(e);line(last,p);last=p});
    ['pointerup','pointercancel','pointerleave'].forEach(t=>cv.addEventListener(t,()=>{drawing=false}));
    const score=()=>{const I=ik.getImageData(0,0,W,W).data,M=mc.getImageData(0,0,W,W).data,D=dc.getImageData(0,0,W,W).data;let m=0,cov=0,n=0,out=0;
      for(let y=0;y<W;y+=4)for(let x=0;x<W;x+=4){const i=(y*W+x)*4+3,a=I[i]>40;if(M[i]>40){m++;if(a)cov++}if(a){n++;if(D[i]<=40)out++}}
      return{cov:m?cov/m:0,out:n?out/n:1}};
    const clear=()=>{ik.clearRect(0,0,W,W);inked=0;bg()};
    st.querySelector('#clr').onclick=clear;
    st.querySelector('#hear').onclick=()=>say(q.prompt);say(q.prompt);
    st.querySelector('#ok').onclick=()=>{if(locked)return;if(inked<4){say('Trace it with your finger first.');return}
      const s=score();if(s.cov>=.5&&s.out<=.35){locked=true;api.win(tries===0);return}
      tries++;if(tries>=3){locked=true;api.lose();return}
      api.fb(s.cov<.5?'Trace all of it.':'Stay on the gray shape.','try');
      say(['Good try!',300,s.cov<.5?'Trace all of it.':'Stay on the gray shape.',400,'Try again.']);clear()};
  },
  debug(q,st,api){
    const lv=q.level;let pos=lv.start.slice(),trail=[],bump=null,cur=-1,tries=0,locked=true,prog=q.prog.slice(),fixed=-1;
    st.innerHTML=`<div class="robo-grid" id="grid" style="--n:${lv.size}"></div><div class="prog" id="prog"></div>
      <button class="listen" id="hear">${SPK} Watch again</button><div class="feedback" id="fb" aria-live="polite"></div>`;
    const grid=st.querySelector('#grid'),pe=st.querySelector('#prog');
    const draw=()=>{grid.innerHTML=cellHTML(lv,pos,trail,bump)};
    const drawP=()=>{pe.innerHTML=prog.map((d,i)=>`<button class="chip ${i===cur?'now':''} ${i===fixed?'good':''}" data-i="${i}" aria-label="arrow ${i+1}">${DIRS[d][2]}</button>`).join('');
      pe.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>tap(+b.dataset.i))};
    const play=(after)=>{pos=lv.start.slice();trail=[];bump=null;draw();const sim=simulate(lv,prog);let k=0;
      const tick=()=>{if(k>=sim.steps.length){cur=-1;drawP();after&&after(sim);return}const s=sim.steps[k++];cur=s.i;
        if(s.bump)bump=s.bump.map(v=>Math.max(0,Math.min(lv.size-1,v)));else{trail.push(pos.slice());pos=s.pos}draw();drawP();setTimeout(tick,520)};setTimeout(tick,300)};
    const intro=()=>{locked=true;say(['Uh oh.',300,`The ${theme().hero[1]} has a bug in its arrows.`,500,'Watch.']);play(()=>{locked=false;say(q.prompt)})};
    draw();drawP();intro();
    st.querySelector('#hear').onclick=()=>{if(!locked)intro()};
    const tap=i=>{if(locked)return;const b=pe.querySelector(`[data-i="${i}"]`);
      if(i===q.bug){locked=true;prog[i]=q.sol[i];fixed=i;drawP();say(['You found the bug!',400,'Watch it work.']);play(()=>api.win(tries===0))}
      else{tries++;b.classList.add('bad');shake(b);
        if(tries<2){api.fb('Not that one. Watch again.','try');intro()}
        else{locked=true;prog[q.bug]=q.sol[q.bug];fixed=q.bug;drawP();api.fb('','');play(()=>api.lose())}}};
  },
};

/* ================= grown-ups ================= */
function fillVoiceSel(sel){
  if(!voices.length){sel.innerHTML='<option>Default voice</option>';sel.disabled=true;return}
  sel.disabled=false;sel.innerHTML=voices.slice(0,12).map(v=>`<option value="${esc(v.name)}" ${voice&&v.name===voice.name?'selected':''}>${esc(v.name.replace(/\s*\(.*?English.*?\)/,''))}</option>`).join('');
}
const stdLine=s=>{if(/^(Unit|World)/.test(s.std))return s.std;
  const cc=s.cc?` · ${/^K-[A-Z]/.test(s.cc)?'NGSS':'Common Core'} ${s.cc}`:'';return `Indiana ${s.std}${cc}`};
const fmtDate=iso=>{const [y,m,d]=iso.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})};
const caseLabel=l=>P.lcase==='upper'?l.toUpperCase():P.lcase==='lower'?l:l.toUpperCase()+l;
// Links for grown-ups only (never on kid screens). They open in a new tab so the app stays put.
const REPO_URL='https://github.com/ZhaoSerrano/my-kid-has-adhd',GUIDE_URL=REPO_URL+'#use-it-in-3-steps',TEST_GUIDE_URL=REPO_URL+'#add-your-kids-test-in-3-steps';
const FEEDBACK_URL=REPO_URL+'/issues/new?template=parent-feedback.yml';
// How a test went, asked on the grown-up screen after the test date (the number that matters most: did they pass?)
const RESULTS=[['great','🎉 Went great'],['ok','🙂 Okay'],['hard','😕 Hard']];
// Bump with every push, together with a CHANGELOG.md entry and a git tag (see CLAUDE.md → Releases).
const APP_VERSION='2.0.0',CHANGELOG_URL=REPO_URL+'/blob/main/CHANGELOG.md';
const extLink=(url,text)=>`<a href="${url}" target="_blank" rel="noopener">${text}</a>`;
function twoTap(btn,msg,fn){let armed=false;btn.onclick=()=>{if(!armed){armed=true;btn.textContent=msg;return}fn()}}
function grown(){
  setHeader('For grown-ups',home);const me=P.meta,idx=PROFILES.findIndex(p=>p.id===P.id);
  const sec=sub=>{const ids=Object.keys(SKILLS).filter(id=>SKILLS[id].sub===sub);const got=ids.filter(id=>mastery(id).lvl==='got').length,tried=ids.filter(id=>(P.skills[id]||[]).length).length;
    return `<details class="panel"><summary><h2>${SUBJECTS[sub].pic} ${SUBJECTS[sub].name}</h2><span class="small">${got}/${ids.length} got it · ${tried} tried</span></summary>
      <div>${ids.map(id=>{const m=mastery(id);return `<div class="skillrow"><span class="nm">${SKILLS[id].name}${id==='robot'?` · level ${P.robotLevel+1}`:''}</span><span class="pill ${m.lvl}">${m.label}</span><span class="cd">${stdLine(SKILLS[id])}</span></div>`}).join('')}</div></details>`};
  const working=Object.entries(P.items||{}).filter(([,v])=>v.b===1).reverse().slice(0,15);
  const hidden=hiddenUnits(),who=u=>!u.for?'All kids':(PROFILES.find(p=>p.id===u.for)||{}).name||'One child',fu=focusUnit();
  const vz=voiceFor('zh'),ve=voiceFor('es');
  view.innerHTML=`<div class="col">
    <nav class="linkrow" aria-label="Guide">📖 ${extLink(GUIDE_URL,'How to use it')}<span>·</span>${extLink(TEST_GUIDE_URL,'How to add a test')}<span>·</span>${extLink(REPO_URL,'Project on GitHub')}</nav>
    <div class="panel"><h2>${fu?'🎯':'📚'} Test prep</h2>
      ${resultPending().map(u=>`<div class="msg warn"><b>How did “${esc(u.title)}” go?</b><div class="btnrow left">${RESULTS.map(([k,t])=>`<button class="secondary sm" data-res="${u.id}|${k}">${t}</button>`).join('')}</div></div>`).join('')}
      <div class="seg" id="focusSeg">${[['auto','Auto'],['test','🎯 On'],['year','📚 Off']].map(([k,t])=>`<button data-f="${k}" class="${(P.focus||'auto')===k?'on':''}" aria-pressed="${(P.focus||'auto')===k}">${t}</button>`).join('')}</div>
      <p class="small"><b>Right now:</b> ${fu?`🎯 test prep for “${esc(fu.title)}” (${esc(countdown(fu))}), ${readiness(fu).pct}% ready. Every stop is about this test.`
        :`📚 school year: the daily adventure covers the whole year.${(P.focus||'auto')==='test'?' There is no test to practice yet. Add one below.':''}`}</p>
      <p class="small"><b>Auto</b> turns test prep on within ${TEST_WINDOW} days of a test date, or for a test with no date (the example test doesn't count). <b>On</b> practices only the test. <b>Off</b> practices the whole school year. Use <b>🎯 Focus</b> on a test below to pick which one.</p></div>
    <div class="panel"><h2>Child</h2>
      <label class="field"><span>Name (optional, stays on this device)</span><input id="kidName" maxlength="30" autocomplete="off" value="${esc(me.name||'')}"></label>
      <div><span class="small">Favorite things (pictures in math and the robot game)</span>
        <div class="themerow" id="themeRow">${Object.entries(THEMES).map(([k,t])=>`<button data-t="${k}" class="${(me.theme||'mix')===k?'on':''}" aria-pressed="${(me.theme||'mix')===k}" title="${t.name}"><span>${t.pic}</span><small>${t.name}</small></button>`).join('')}</div></div>
      <div class="btnrow left">${PROFILES.length>1?'<button class="secondary" id="switchKid">Switch child</button>':''}<button class="secondary" id="addKid">+ Add a child</button>
        ${PROFILES.length>1?`<button class="secondary danger" id="rmKid">Remove ${esc(kidLabel(me,idx))}</button>`:''}</div></div>
    <div class="panel"><h2>Tests</h2>
      <p class="small">Turn the teacher's study guide into practice. When a test is coming, the app switches to 🎯 Test prep (see above).</p>
      ${allUnits().map(u=>`<div class="unitrow ${hidden.includes(u.id)?'off':''}"><div><b>${esc(u.title)}</b>${u.example?' <span class="tag">example</span>':''}<br>
        <span class="small">${unitSummary(u)}${u.testDate?` · ${fmtDate(u.testDate)}`:''}${PROFILES.length>1?` · ${esc(who(u))}`:''}${testResult(u)?` · Result: ${(RESULTS.find(r=>r[0]===testResult(u).r)||['',''])[1]}`:''}${fu&&fu.id===u.id?' · <b>🎯 practicing now</b>':''}</span></div>
        <div class="btnrow">${testResult(u)||(fu&&fu.id===u.id)?'':`<button class="secondary sm" data-focus="${u.id}">🎯 Focus</button>`}<button class="secondary sm" data-hide="${u.id}">${hidden.includes(u.id)?'Show':'Hide'}</button>${u.example?'':`<button class="secondary sm danger" data-del="${u.id}">Delete</button>`}</div></div>`).join('')}
      <div class="btnrow left"><button class="primary" id="addTest">+ Add a test</button></div></div>
    <div class="panel"><h2>Working on now</h2>
      ${working.length?`<ul class="worklist">${working.map(([id,v])=>`<li><b>${(SKILLS[id.split(':')[0]]||{name:''}).name}</b> ${esc(v.l||'')}</li>`).join('')}</ul>
      <p class="small">These were missed recently. They come up more often until they're answered right on the first try.</p>`
      :'<p class="small">Nothing yet. Questions missed in practice show up here and come back more often until they stick.</p>'}</div>
    <p class="small"><b>How “Got it” works:</b> 80% or more right on the first try over the last 10 tries in that skill, with at least 5 tries. 50–79% is “Getting there.” <b>Play a mix</b> gives more turns to the skills that need practice. Tap a subject to see each skill.</p>
    ${Object.keys(SUBJECTS).map(sec).join('')}
    <p class="small"><b>About the standards:</b> Skills are mapped to Indiana's kindergarten standards and, where one exists, the matching Common Core code (reading, writing and math) or NGSS code (science). Math uses Indiana's 2026 standards, which schools start teaching in 2027–28. Science, social studies, health and music cover the kindergarten pieces that work as tap-to-answer questions. Chinese and Spanish are enrichment, not a kindergarten requirement.</p>
    <div class="panel"><h2>Letters learned so far</h2><p class="small">Letter-sound practice in Reading uses only these, and letter tracing favors them. Tests use their own letters. Turn off letters the class hasn't covered yet.</p>
      <div class="letters" id="letters">${ALPHA.map(l=>`<button data-l="${l}" class="${P.letters.includes(l)?'on':''}" aria-pressed="${P.letters.includes(l)}">${caseLabel(l)}</button>`).join('')}</div>
      <h3>Letter case</h3><div class="seg" id="lcase">${[['lower','lowercase'],['upper','UPPERCASE'],['both','Both']].map(([k,t])=>`<button data-c="${k}" class="${P.lcase===k?'on':''}" aria-pressed="${P.lcase===k}">${t}</button>`).join('')}</div>
      <p class="small">How letters look in Letter sounds, Find the letter and Trace letters. <b>Both</b> mixes big and small letters so your child learns both shapes.</p></div>
    <div class="panel"><h2>Counting range</h2><div class="seg" id="seg">${[10,20].map(n=>`<button data-n="${n}" class="${P.maxCount===n?'on':''}">Up to ${n}</button>`).join('')}</div>
      <p class="small">Kindergarten builds to 20 by spring. Start at 10.</p></div>
    <div class="panel"><h2>Light or dark</h2><div class="seg" id="look">${[['auto','Auto'],['light','☀️ Light'],['dark','🌙 Dark']].map(([k,t])=>`<button data-a="${k}" class="${appearance()===k?'on':''}" aria-pressed="${appearance()===k}">${t}</button>`).join('')}</div>
      <p class="small">Auto follows this device's setting. The choice is saved on this device for every child.</p></div>
    <div class="panel"><h2>Voice</h2>
      <label class="switch"><input type="checkbox" id="nvOn" ${pref.natural?'checked':''}><span><b>Natural voice</b> <span class="tag">beta</span></span></label>
      <p class="small">A free, open-source AI voice that sounds much more like a person. It downloads once (about 100 MB, so use Wi-Fi), then runs on this device. The words it reads never leave the device. English only.</p>
      <div class="vrow" id="nvRow"><label for="nvSel">Natural voice</label><select id="nvSel">${NV_VOICES.map(([id,nm])=>`<option value="${id}" ${pref.nvoice===id?'selected':''}>${nm}</option>`).join('')}</select></div>
      <p class="small" id="nvStatus" aria-live="polite"></p>
      <div class="vrow"><label for="voiceSel">Device voice</label><select id="voiceSel"></select></div>
      <p class="small" id="voiceCheck" aria-live="polite"></p>
      <div class="vrow"><label for="rate">Speed</label><input type="range" id="rate" min="0.7" max="1.1" step="0.05"><span id="rateVal" style="min-width:3.2em;font-variant-numeric:tabular-nums"></span></div>
      <div class="btnrow" style="justify-content:flex-start"><button class="secondary" id="testVoice">Test English</button><button class="secondary" id="testZh">Test 中文</button><button class="secondary" id="testEs">Test Español</button></div>
      <p class="small">Chinese voice: <b>${vz?esc(vz.name):'none on this device'}</b>. Spanish voice: <b>${ve?esc(ve.name):'none on this device'}</b>.</p>
      <p class="small">On iPhone or iPad, add better voices in Settings › Accessibility › Spoken Content › Voices. Pick English (Ava or Zoe Premium), Chinese, and Spanish, download them, then reopen this page.</p></div>
    <div class="panel"><h2>Tell us how it went</h2>
      <p class="small">Did it help on a test? Did your child choose to play? What should change? Your answers decide what we build next.</p>
      <div class="btnrow left"><a class="primary" href="${FEEDBACK_URL}" target="_blank" rel="noopener">Give feedback</a></div>
      <p class="small">Opens a short form on GitHub (a free account is needed). The form is public, so leave out your child's name and other private details.</p></div>
    <p class="small"><b>Privacy:</b> names, progress and tests are saved only in this browser on this device. Nothing is sent anywhere. Wiggle &amp; Win™ (My Kid Has ADHD™: Quiz Prep) is designed for kids with ADHD; it is practice, not a treatment.</p>
    <button class="secondary" id="reset" style="align-self:center">Reset ${esc(kidLabel(me,idx))}'s progress</button>
    <p class="small" style="text-align:center">Version ${APP_VERSION} · ${extLink(CHANGELOG_URL,"What's new")}</p>
  </div>`;
  $('#kidName').onchange=e=>{me.name=e.target.value.trim().slice(0,30);saveProfiles()};
  $('#themeRow').querySelectorAll('button').forEach(b=>b.onclick=()=>{me.theme=b.dataset.t;saveProfiles();
    $('#themeRow').querySelectorAll('button').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b)})});
  if($('#switchKid'))$('#switchKid').onclick=picker;
  $('#addKid').onclick=welcome;
  if($('#rmKid'))twoTap($('#rmKid'),`Tap again to remove ${kidLabel(me,idx)} and their progress`,()=>{removeProfile(me.id);P=null;start()});
  view.querySelectorAll('[data-hide]').forEach(b=>b.onclick=()=>{const id=b.dataset.hide;setUnitHidden(id,!hiddenUnits().includes(id));grown()});
  // test prep on / off / auto, which test to focus on, and how a test went
  $('#focusSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{P.focus=b.dataset.f;if(P.focus!=='test')P.focusId=null;saveP();grown()});
  view.querySelectorAll('[data-focus]').forEach(b=>b.onclick=()=>{P.focus='test';P.focusId=b.dataset.focus;saveP();grown()});
  view.querySelectorAll('[data-res]').forEach(b=>b.onclick=()=>{const [id,r]=b.dataset.res.split('|');
    P.testResults=Object.assign({},P.testResults,{[id]:{r,at:todayKey()}});if(P.focusId===id){P.focusId=null;if(P.focus==='test')P.focus='auto'}saveP();grown()});
  view.querySelectorAll('[data-del]').forEach(b=>twoTap(b,'Tap to delete',()=>{deleteUnit(b.dataset.del);grown()}));
  $('#addTest').onclick=addTest;
  $('#letters').querySelectorAll('button').forEach(b=>b.onclick=()=>{const l=b.dataset.l,on=P.letters.includes(l);
    if(on&&P.letters.length===1)return;P.letters=on?P.letters.filter(x=>x!==l):[...P.letters,l];b.classList.toggle('on',!on);b.setAttribute('aria-pressed',!on);saveP()});
  $('#lcase').querySelectorAll('button').forEach(b=>b.onclick=()=>{P.lcase=b.dataset.c;saveP();
    $('#lcase').querySelectorAll('button').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b)});
    $('#letters').querySelectorAll('button').forEach(x=>{x.textContent=caseLabel(x.dataset.l)})});
  $('#seg').querySelectorAll('button').forEach(b=>b.onclick=()=>{P.maxCount=+b.dataset.n;saveP();$('#seg').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))});
  $('#look').querySelectorAll('button').forEach(b=>b.onclick=()=>{setAppearance(b.dataset.a);
    $('#look').querySelectorAll('button').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b)})});
  fillVoiceSel($('#voiceSel'));
  $('#voiceSel').onchange=e=>{pref.name=e.target.value;voice=voices.find(v=>v.name===pref.name)||voice;savePref();testV()};
  const r=$('#rate');r.value=pref.rate;$('#rateVal').textContent=pref.rate.toFixed(2)+'×';
  r.oninput=()=>{pref.rate=+r.value;$('#rateVal').textContent=pref.rate.toFixed(2)+'×';savePref()};
  const SAMPLE=['Hi!',400,'The rabbit dug a burrow under the ground.',900,'Is the word burrow used the right way?',900,'What letter makes this sound?',700,'sss',600,'sss',800,'Like sun.'];
  // the sample always waits for the natural voice, so a grown-up hears the real thing
  const testV=()=>{if(!nvOn()){say(SAMPLE);return}const s=$('#nvStatus');s.textContent='Getting the sample ready… (a few seconds the first time)';
    Promise.all(nvText(SAMPLE).map(t=>nvAudio(t,0))).then(()=>{nvShow();say(SAMPLE)},()=>{nvShow();say(SAMPLE)})};
  const nvShow=()=>{const s=$('#nvStatus');if(!s)return;$('#nvRow').hidden=!pref.natural;
    s.textContent=!pref.natural?'':NV.state==='loading'?`Downloading the natural voice… ${NV.pct}%`:NV.state==='ready'?'Natural voice is ready. Tap “Test English” to hear it.'
      :NV.state==='failed'?"The natural voice couldn't load on this device, so the device voice is used. Check the internet connection and try again."
      :nvCrashed()?"Last time the natural voice didn't finish loading, so it wasn't started automatically. Turn it off and on to try again.":''};
  NV.onchange=nvShow;nvShow();
  // Is the device voice really talking in this browser? Tells a grown-up what to do when it isn't.
  const vcShow=()=>{const e=$('#voiceCheck');if(!e)return;
    e.innerHTML=voiceHealth.last==='stuck'?"⚠️ <b>The device voice isn't responding in this browser.</b> Quit the browser completely and reopen it, or turn on <b>Natural voice</b> above, which plays a different way."
      :voiceHealth.ok?'✓ The device voice is working.':'Tap <b>Test English</b> to check the voice.'};
  vcShow();$('#testVoice').addEventListener('click',()=>setTimeout(vcShow,4000));
  $('#nvOn').onchange=e=>{pref.natural=e.target.checked;savePref();if(pref.natural){store.del('mkha_nv_trying');if(NV.state==='failed')NV.state='off';nvLoad();nvWarm();nvPump()}else nvStop();nvShow()};
  $('#nvSel').onchange=e=>{pref.nvoice=e.target.value;savePref();if(nvOn())testV()};
  $('#testVoice').onclick=testV;
  $('#testZh').onclick=()=>say([{t:'你好！我是熊猫。',lang:'zh'}]);
  $('#testEs').onclick=()=>say([{t:'¡Hola! Me gusta el perro.',lang:'es'}]);
  // A fresh start for this child: stars, practice history, robot level, letters and counting range. Name, theme and tests stay.
  twoTap($('#reset'),'Tap again to start fresh: resets stars, progress and letter settings',()=>{Object.assign(P,freshProgress());saveP();updStars();grown();
    const b=$('#reset');b.insertAdjacentHTML('beforebegin',`<div class="msg good" role="status">Done. ${esc(kidLabel(me,idx))} is starting fresh: 0 stars, all 26 letters on, letters shown both ways, counting up to 10.</div>`);
    b.scrollIntoView({block:'center'})});
}

/* ---- add a test from the teacher's study guide ---- */
function addTest(){
  setHeader('Add a test',grown);const prompt=aiPrompt();
  view.innerHTML=`<div class="col">
    <div class="panel"><h2>Turn the study guide into practice</h2>
      <ol class="steps">
        <li><b>Take a photo</b> of the teacher's study guide.</li>
        <li><b>Copy the AI prompt</b> and paste it into Claude, ChatGPT or Gemini. Attach the photo and send.</li>
        <li><b>Copy the AI's whole answer</b> and paste it in the box below.</li></ol>
      <p class="small">Stuck? See the ${extLink(TEST_GUIDE_URL,'step-by-step guide')}.</p>
      <div class="btnrow left"><button class="primary" id="copyP">Copy the AI prompt</button></div>
      <p class="small" id="copyMsg" aria-live="polite"></p>
      <details id="promptBox"><summary class="small">Show the prompt</summary><textarea readonly class="code" id="promptTxt" rows="10">${esc(prompt)}</textarea></details>
      <p class="small">Only the study guide goes to the AI. Don't include your child's name or other private details.</p></div>
    <div class="panel"><h2>Paste the AI's answer</h2>
      <textarea id="paste" class="code" rows="8" placeholder='{ "title": "Unit 3 Reading Test", … }' spellcheck="false"></textarea>
      <div class="btnrow left"><button class="primary" id="check">Check it</button></div>
      <div id="result" aria-live="polite"></div></div>
  </div>`;
  $('#copyP').onclick=()=>{const ok=()=>{$('#copyMsg').textContent='Copied! Now paste it into the AI chat.'};
    const fallback=()=>{const t=$('#promptTxt');$('#promptBox').open=true;t.focus();t.select();let did=false;try{did=document.execCommand('copy')}catch(e){}
      $('#copyMsg').textContent=did?'Copied! Now paste it into the AI chat.':'Select all the text in the box below and copy it.'};
    try{navigator.clipboard.writeText(prompt).then(ok,fallback)}catch(e){fallback()}};
  $('#check').onclick=()=>{const {unit,errors,warnings}=parseUnit($('#paste').value),out=$('#result');
    const warn=warnings.length?`<div class="msg warn"><b>Heads up:</b><ul>${warnings.map(w=>`<li>${w}</li>`).join('')}</ul></div>`:'';
    if(!unit){out.innerHTML=`<div class="msg bad"><b>Almost there. Please fix:</b><ul>${errors.map(e=>`<li>${e}</li>`).join('')}</ul></div>${warn}`;return}
    out.innerHTML=`<div class="msg good"><b>${esc(unit.title)}</b>${unit.grade?` · grade ${esc(unit.grade)}`:''}<br>${unitSummary(unit)}${unit.testDate?`<br>Test on ${fmtDate(unit.testDate)}`:''}</div>${warn}
      ${PROFILES.length>1?`<label class="field"><span>Who is this test for?</span><select id="forKid">${PROFILES.map((p,i)=>`<option value="${p.id}" ${p.id===P.id?'selected':''}>${esc(kidLabel(p,i))}</option>`).join('')}<option value="">All kids</option></select></label>`:''}
      <div class="btnrow left"><button class="primary" id="save">Save test</button></div>`;
    $('#save').onclick=()=>{const f=$('#forKid');if(f&&f.value)unit.for=f.value;saveUnit(unit);
      out.innerHTML=`<div class="msg good"><b>Saved!</b> “${esc(unit.title)}” is on the home screen.</div><div class="btnrow left"><button class="primary" id="open">Practice it now</button><button class="secondary" id="toGrown">Back to grown-ups</button></div>`;
      $('#open').onclick=()=>unitHome(unit);$('#toGrown').onclick=grown}};
}

start();
