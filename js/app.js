/* ================= navigation ================= */
let backFn=null;
function setHeader(title,back){$('#hdrTitle').textContent=title;backFn=back||null;$('#backBtn').hidden=!back;window.scrollTo(0,0)}
$('#backBtn').onclick=()=>{hush();backFn&&backFn()};
const speakName=s=>s.replace(/&/g,'and');

function start(){loadProfiles();
  if(!PROFILES.length){welcome();return}
  if(PROFILES.length===1){enter(PROFILES[0]);return}
  picker()}
function enter(p){loadProfile(p.id);p.theme?home():pickTheme(p,home)}

/* ---- profiles: first run, theme picker, who's playing ---- */
function welcome(){
  setHeader(PROFILES.length?'Add a child':'Welcome!',PROFILES.length?picker:null);
  view.innerHTML=`<div class="col"><div class="panel">
    <h1>Hi, grown-up!</h1>
    <p class="small" style="font-size:1rem">Learning Lab is tap-to-answer practice. Everything is read aloud, and your child answers by tapping. Progress stays on this device. Nothing is sent anywhere.</p>
    <label class="field"><span>Child's first name or nickname <i>(optional)</i></span><input id="nm" maxlength="30" autocomplete="off" autocapitalize="words" spellcheck="false"></label>
    <div class="btnrow left"><button class="primary" id="go1">Next →</button></div>
    <p class="small">Next, hand the device to your child to pick what they like best.</p></div></div>`;
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

function home(){
  const nm=kidName();setHeader(nm?`${nm}'s Learning Lab`:'Learning Lab',PROFILES.length>1?picker:null);
  const units=visibleUnits();
  const tiles=g=>Object.entries(SUBJECTS).filter(([,s])=>s.group===g).map(([k,s])=>`<button class="subj" style="--h:${s.h}" data-s="${k}"><span class="pic">${s.pic}</span><b>${s.name}</b></button>`).join('');
  view.innerHTML=`<div class="col">
    ${units.map(u=>`<button class="banner" data-u="${u.id}"><span class="pic">📝</span><span><small>${countdown(u)}</small><b>${esc(u.title)}</b></span></button>`).join('')}
    <div class="subjects">${tiles('school')}</div>
    <p class="grouplabel">More to explore</p>
    <div class="subjects four">${tiles('more')}</div>
    <button class="grownbtn" id="grownBtn">For grown-ups: progress, tests &amp; settings</button>
  </div>`;
  view.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>unitHome(allUnits().find(u=>u.id===b.dataset.u)));
  view.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>subject(b.dataset.s));
  $('#grownBtn').onclick=grown;
}
function subject(sub){
  const S=SUBJECTS[sub],ids=Object.keys(SKILLS).filter(id=>SKILLS[id].sub===sub&&!SKILLS[id].unitOnly);
  setHeader(S.name,home);
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
  if(!u){home();return}
  setHeader(u.title,home);const ctx=unitCtx(u),secs=unitSections(u),words=u.words||[];
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
  const read=()=>say(it.speak);$('#hear').onclick=read;read();
  $('#prev').onclick=()=>i>0&&deck(title,items,i-1,back);
  $('#next').onclick=()=>i<items.length-1?deck(title,items,i+1,back):(hush(),back());
}

/* ================= round runner ================= */
let R=null,roundsDone=0;
const MAX_EXTRAS=2;
function runRound(title,make,back){hush();R={title,make,back,qs:make(),i:0,res:[],extras:0};showQ()}
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
}
function nextQ(){R.i++;R.i<R.qs.length?showQ():done()}
const WIGGLES=[['🦘','Jump 5 times!'],['🙆','Touch your toes 5 times.'],['🌳','Stretch up tall like a tree.'],['🐸','Hop like a frog 3 times.'],['👏','Clap your hands 10 times.'],
  ['🦩','Stand on one foot like a flamingo. Count to 5.'],['🏃','Run in place. Count to 10.'],['🐻','Give yourself a big bear hug.'],['🌬️','Take 3 slow, deep breaths.'],['🙌','Reach up high, then touch the floor. Do it 3 times.']];
function done(){
  const got=R.res.filter(Boolean).length,n=R.qs.length;setHeader(R.title,R.back);roundsDone++;
  const wig=roundsDone%2===0?one(WIGGLES):null;
  view.innerHTML=`<div class="col"><div class="stage done"><h1>All done!</h1>
    <div class="row">${R.res.map(r=>STAR.replace('<svg',`<svg class="${r?'':'off'}"`)).join('')}</div>
    <p class="sub" style="font-size:1.15rem">${got} of ${n} on the first try</p>
    <div class="btnrow"><button class="primary" id="again">Play again</button><button class="secondary" id="back2">Done</button></div></div>
    ${wig?`<div class="wiggle" id="wig"><div class="bigpic">${wig[0]}</div><h2>Wiggle break!</h2><p>${wig[1]}</p><button class="go" id="did">I did it!</button></div>`:''}</div>`;
  const cheer=got===n?'Wow! All the stars! Great job.':`Great work! You got ${got} ${got===1?'star':'stars'}.`;
  say(wig?[cheer,800,'Wiggle break!',400,wig[1]]:cheer);
  if(wig)$('#did').onclick=()=>{$('#wig').innerHTML='<div class="bigpic">🎉</div><h2>Great moving!</h2>';say('Great moving! Your body is ready to learn.')};
  $('#again').onclick=()=>runRound(R.title,R.make,R.back);$('#back2').onclick=()=>{hush();R.back()};
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
function twoTap(btn,msg,fn){let armed=false;btn.onclick=()=>{if(!armed){armed=true;btn.textContent=msg;return}fn()}}
function grown(){
  setHeader('For grown-ups',home);const me=P.meta,idx=PROFILES.findIndex(p=>p.id===P.id);
  const sec=sub=>{const ids=Object.keys(SKILLS).filter(id=>SKILLS[id].sub===sub);const got=ids.filter(id=>mastery(id).lvl==='got').length,tried=ids.filter(id=>(P.skills[id]||[]).length).length;
    return `<details class="panel"><summary><h2>${SUBJECTS[sub].pic} ${SUBJECTS[sub].name}</h2><span class="small">${got}/${ids.length} got it · ${tried} tried</span></summary>
      <div>${ids.map(id=>{const m=mastery(id);return `<div class="skillrow"><span class="nm">${SKILLS[id].name}${id==='robot'?` · level ${P.robotLevel+1}`:''}</span><span class="pill ${m.lvl}">${m.label}</span><span class="cd">${stdLine(SKILLS[id])}</span></div>`}).join('')}</div></details>`};
  const working=Object.entries(P.items||{}).filter(([,v])=>v.b===1).reverse().slice(0,15);
  const hidden=hiddenUnits(),who=u=>!u.for?'All kids':(PROFILES.find(p=>p.id===u.for)||{}).name||'One child';
  const vz=voiceFor('zh'),ve=voiceFor('es');
  view.innerHTML=`<div class="col">
    <div class="panel"><h2>Child</h2>
      <label class="field"><span>Name (optional, stays on this device)</span><input id="kidName" maxlength="30" autocomplete="off" value="${esc(me.name||'')}"></label>
      <div><span class="small">Favorite things (pictures in math and the robot game)</span>
        <div class="themerow" id="themeRow">${Object.entries(THEMES).map(([k,t])=>`<button data-t="${k}" class="${(me.theme||'mix')===k?'on':''}" aria-pressed="${(me.theme||'mix')===k}" title="${t.name}"><span>${t.pic}</span><small>${t.name}</small></button>`).join('')}</div></div>
      <div class="btnrow left">${PROFILES.length>1?'<button class="secondary" id="switchKid">Switch child</button>':''}<button class="secondary" id="addKid">+ Add a child</button>
        ${PROFILES.length>1?`<button class="secondary danger" id="rmKid">Remove ${esc(kidLabel(me,idx))}</button>`:''}</div></div>
    <div class="panel"><h2>Tests</h2>
      <p class="small">Turn the teacher's study guide into practice. Each test gets its own banner on the home screen.</p>
      ${allUnits().map(u=>`<div class="unitrow ${hidden.includes(u.id)?'off':''}"><div><b>${esc(u.title)}</b>${u.example?' <span class="tag">example</span>':''}<br>
        <span class="small">${unitSummary(u)}${u.testDate?` · ${fmtDate(u.testDate)}`:''}${PROFILES.length>1?` · ${esc(who(u))}`:''}</span></div>
        <div class="btnrow"><button class="secondary sm" data-hide="${u.id}">${hidden.includes(u.id)?'Show':'Hide'}</button>${u.example?'':`<button class="secondary sm danger" data-del="${u.id}">Delete</button>`}</div></div>`).join('')}
      <div class="btnrow left"><button class="primary" id="addTest">+ Add a test</button></div></div>
    <div class="panel"><h2>Working on now</h2>
      ${working.length?`<ul class="worklist">${working.map(([id,v])=>`<li><b>${(SKILLS[id.split(':')[0]]||{name:''}).name}</b> ${esc(v.l||'')}</li>`).join('')}</ul>
      <p class="small">These were missed recently. They come up more often until they're answered right on the first try.</p>`
      :'<p class="small">Nothing yet. Questions missed in practice show up here and come back more often until they stick.</p>'}</div>
    <p class="small"><b>How “Got it” works:</b> 80% or more right on the first try over the last 10 tries in that skill, with at least 5 tries. 50–79% is “Getting there.” <b>Play a mix</b> gives more turns to the skills that need practice. Tap a subject to see each skill.</p>
    ${Object.keys(SUBJECTS).map(sec).join('')}
    <p class="small"><b>About the standards:</b> Skills are mapped to Indiana's kindergarten standards and, where one exists, the matching Common Core code (reading, writing and math) or NGSS code (science). Math uses Indiana's 2026 standards, which schools start teaching in 2027–28. Science, social studies, health and music cover the kindergarten pieces that work as tap-to-answer questions. Chinese and Spanish are enrichment, not a kindergarten requirement.</p>
    <div class="panel"><h2>Letters learned so far</h2><p class="small">Letter-sound practice asks only about these, and letter tracing favors them. Turn on new letters as the class covers them.</p>
      <div class="letters" id="letters">${ALPHA.map(l=>`<button data-l="${l}" class="${P.letters.includes(l)?'on':''}" aria-pressed="${P.letters.includes(l)}">${l}</button>`).join('')}</div></div>
    <div class="panel"><h2>Counting range</h2><div class="seg" id="seg">${[10,20].map(n=>`<button data-n="${n}" class="${P.maxCount===n?'on':''}">Up to ${n}</button>`).join('')}</div>
      <p class="small">Kindergarten builds to 20 by spring. Start at 10.</p></div>
    <div class="panel"><h2>Voice</h2>
      <div class="vrow"><label for="voiceSel">English voice</label><select id="voiceSel"></select></div>
      <div class="vrow"><label for="rate">Speed</label><input type="range" id="rate" min="0.7" max="1.1" step="0.05"><span id="rateVal" style="min-width:3.2em;font-variant-numeric:tabular-nums"></span></div>
      <div class="btnrow" style="justify-content:flex-start"><button class="secondary" id="testVoice">Test English</button><button class="secondary" id="testZh">Test 中文</button><button class="secondary" id="testEs">Test Español</button></div>
      <p class="small">Chinese voice: <b>${vz?esc(vz.name):'none on this device'}</b>. Spanish voice: <b>${ve?esc(ve.name):'none on this device'}</b>.</p>
      <p class="small">On iPhone or iPad, add better voices in Settings › Accessibility › Spoken Content › Voices. Pick English (Ava or Zoe Premium), Chinese, and Spanish, download them, then reopen this page.</p></div>
    <p class="small"><b>Privacy:</b> names, progress and tests are saved only in this browser on this device. Nothing is sent anywhere. Learning Lab is designed for kids with ADHD; it is practice, not a treatment.</p>
    <button class="secondary" id="reset" style="align-self:center">Reset ${esc(kidLabel(me,idx))}'s progress</button>
  </div>`;
  $('#kidName').onchange=e=>{me.name=e.target.value.trim().slice(0,30);saveProfiles()};
  $('#themeRow').querySelectorAll('button').forEach(b=>b.onclick=()=>{me.theme=b.dataset.t;saveProfiles();
    $('#themeRow').querySelectorAll('button').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b)})});
  if($('#switchKid'))$('#switchKid').onclick=picker;
  $('#addKid').onclick=welcome;
  if($('#rmKid'))twoTap($('#rmKid'),`Tap again to remove ${kidLabel(me,idx)} and their progress`,()=>{removeProfile(me.id);P=null;start()});
  view.querySelectorAll('[data-hide]').forEach(b=>b.onclick=()=>{const id=b.dataset.hide;setUnitHidden(id,!hiddenUnits().includes(id));grown()});
  view.querySelectorAll('[data-del]').forEach(b=>twoTap(b,'Tap to delete',()=>{deleteUnit(b.dataset.del);grown()}));
  $('#addTest').onclick=addTest;
  $('#letters').querySelectorAll('button').forEach(b=>b.onclick=()=>{const l=b.dataset.l,on=P.letters.includes(l);
    if(on&&P.letters.length===1)return;P.letters=on?P.letters.filter(x=>x!==l):[...P.letters,l];b.classList.toggle('on',!on);b.setAttribute('aria-pressed',!on);saveP()});
  $('#seg').querySelectorAll('button').forEach(b=>b.onclick=()=>{P.maxCount=+b.dataset.n;saveP();$('#seg').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))});
  fillVoiceSel($('#voiceSel'));
  $('#voiceSel').onchange=e=>{pref.name=e.target.value;voice=voices.find(v=>v.name===pref.name)||voice;savePref();testV()};
  const r=$('#rate');r.value=pref.rate;$('#rateVal').textContent=pref.rate.toFixed(2)+'×';
  r.oninput=()=>{pref.rate=+r.value;$('#rateVal').textContent=pref.rate.toFixed(2)+'×';savePref()};
  const testV=()=>say(['Hi!',400,'The rabbit dug a burrow under the ground.',900,'Is the word burrow used the right way?']);
  $('#testVoice').onclick=testV;
  $('#testZh').onclick=()=>say([{t:'你好！我是熊猫。',lang:'zh'}]);
  $('#testEs').onclick=()=>say([{t:'¡Hola! Me gusta el perro.',lang:'es'}]);
  twoTap($('#reset'),'Tap again to erase stars and progress',()=>{P.stars=0;P.skills={};P.items={};P.robotLevel=0;saveP();updStars();grown()});
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
