/* ================= question generators ================= */
// Each returns {key, prompt:[...], grown, mode, why, ...}. mode: choose | sequence | robot | trace | debug
// `why` states the answer AND the reason, in one or two kid-level sentences. It is read aloud after a miss.
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const MASS=/^(candy|water|food|air|clothes|sunlight|milk|rice|popcorn|socks|pants|books|grapes)$/;
const art=w=>MASS.test(w)?w:(/^[aeiou]/i.test(w)?'an ':'a ')+w;
const andList=a=>a.length<3?a.join(' and '):a.slice(0,-1).join(', ')+', and '+a[a.length-1];
const countAloud=n=>Array.from({length:n},(_,i)=>i+1).join(', ');
const plural=(n,it)=>n===1?it[1]:it[2];

function gLetterName(){
  const L=one(ALPHA),up=Math.random()<.5,f=x=>up?x.toUpperCase():x;
  const opts=shuffle([L,...pick(ALPHA.filter(x=>x!==L),2)]);
  return {key:'ln'+L+up,prompt:[`Find the ${up?'big':'small'} letter`,250,`${L.toUpperCase()}.`],
    grown:`Find the ${up?'uppercase':'lowercase'} <b>${f(L)}</b>.`,
    options:opts.map(l=>({html:`<span class="lined">${f(l)}</span>`,cls:'letter',label:'letter '+l,ok:l===L})),
    why:[`This is the ${up?'big':'small'} letter ${L.toUpperCase()}.`],whyText:`This is ${up?'big':'small'} ${f(L)}.`};
}
function gLetterSound(ctx){
  const pool=(ctx.letters&&ctx.letters.length?ctx.letters:P.letters.length?P.letters:['s','m','d','p','a']);
  const t=one(pool),[snd,clue]=PHON[t];
  const clash=l=>PHON[l][0]===snd;
  const others=shuffle([...pool.filter(x=>x!==t),...ALPHA]).filter((x,i,a)=>x!==t&&!clash(x)&&a.indexOf(x)===i);
  const opts=shuffle([t,...others.slice(0,2)]);
  return {key:'ls'+t,prompt:['What letter makes this sound?',700,snd,600,snd,800,`Like ${clue}.`],
    grown:`Sound <b>/${t}/</b> as in “${clue}”. On the test the teacher says only the sound.`,
    options:opts.map(l=>({html:`<span class="lined">${l}</span>`,cls:'letter',label:'letter '+l,ok:l===t})),
    why:[`The letter ${t.toUpperCase()} says`,200,snd,300,`like ${clue}.`],whyText:`The letter ${t} says /${snd}/, like ${clue}.`};
}
function gBegin(){
  const groups={};PICS.forEach(p=>(groups[p[2]]=groups[p[2]]||[]).push(p));
  const big=Object.keys(groups).filter(k=>groups[k].length>=2);
  const s=one(big),pair=pick(groups[s],2),odd=one(PICS.filter(p=>p[2]!==s));
  const words=shuffle([...pair,odd]),[x,y]=pair,ss=PHON[s][0],os=PHON[odd[2]][0];
  return {key:'bs'+words.map(w=>w[0]).join(),prompt:['Listen.',600,...words.flatMap(w=>[w[0]+'.',900]),300,'Which one starts with a different sound?'],
    grown:`Words: <b>${words.map(w=>w[0]).join(', ')}</b>. Different one: ${odd[0]}.`,
    options:words.map(w=>({html:`<div class="e">${w[1]}</div><span>${w[0]}</span>`,cls:'pic',label:w[0],ok:w===odd})),
    why:[`${cap(x[0])} and ${y[0]} both start with`,200,ss+'.',500,`${cap(odd[0])} starts with`,200,os+'.'],
    whyText:`${cap(x[0])} and ${y[0]} both start with /${ss}/. ${cap(odd[0])} starts with /${os}/.`};
}
function gRhyme(){
  const G=one(RHYMES),[t,m]=pick(G,2);
  const dis=pick(RHYMES.filter(g=>g!==G),2).map(g=>one(g));
  const opts=shuffle([m,...dis]);
  return {key:'rh'+t[0]+m[0],top:`<div class="bigpic">${t[1]}</div><div class="lined word">${t[0]}</div>`,
    prompt:[`Which one rhymes with ${t[0]}?`,700,...opts.flatMap(o=>[o[0]+'.',600])],
    grown:`<b>${t[0]}</b> rhymes with <b>${m[0]}</b>.`,
    options:opts.map(o=>({html:`<div class="e">${o[1]}</div><span>${o[0]}</span>`,cls:'pic',label:o[0],ok:o===m})),
    why:[`${cap(t[0])} and ${m[0]} rhyme.`,300,'They sound the same at the end.',400,`${t[0]}, ${m[0]}.`]};
}
function gSyll(){
  const w=one(SYLL),n=w[2].split('-').length,lo=n===4?2:1;
  const opts=[lo,lo+1,lo+2],claps=`${n} ${n===1?'clap':'claps'}`;
  return {key:'sy'+w[0],top:`<div class="bigpic">${w[1]}</div><div class="lined word">${w[0]}</div>`,
    prompt:["Let's clap it.",500,w[0],900,w[0],700,'How many claps?'],
    grown:`Clap it together: <b>${w[2]}</b> = ${n}.`,
    options:opts.map(k=>({html:`<b style="font:700 2.6rem var(--f-read)">${k}</b><span>${'👏'.repeat(k)}</span>`,cls:'pic',label:k+' claps',ok:k===n})),
    why:[w[2].split('-').join('. ')+'.',400,`${cap(w[0])} has ${claps}.`],whyText:`${w[2]}: ${claps}.`};
}
function gCategory(){
  const keys=Object.keys(CATS),k=one(keys),C=CATS[k];
  if(Math.random()<.5){
    const right=one(C.items),wrong=pick(keys.filter(x=>x!==k),2).map(x=>one(CATS[x].items));
    const opts=shuffle([right,...wrong]);
    return {key:'ca'+right[0],prompt:[C.q,600,...opts.flatMap(o=>[o[0]+'.',500])],grown:`Answer: <b>${right[0]}</b>.`,
      options:opts.map(o=>({html:`<div class="e">${o[1]}</div><span>${o[0]}</span>`,cls:'pic',label:o[0],ok:o===right})),why:[`${cap(right[0])}.`,200,`That is ${art(C.one)}.`]};
  }
  const same=pick(C.items,3),odd=one(CATS[one(keys.filter(x=>x!==k))].items),opts=shuffle([...same,odd]);
  return {key:'co'+odd[0]+k,item:'co'+odd[0],ansCls:'four',prompt:['Which one does not belong?',600,...opts.flatMap(o=>[o[0]+'.',500])],grown:`Odd one out: <b>${odd[0]}</b>.`,
    options:opts.map(o=>({html:`<div class="e">${o[1]}</div><span>${o[0]}</span>`,cls:'pic',label:o[0],ok:o===odd})),
    why:[`${cap(andList(same.map(x=>x[0])))} are all ${C.many}.`,300,`${cap(odd[0])} is not.`]};
}
function gStory(ctx){
  const st=one(ctx.stories||STORIES),o=shuffle(st.o),ans=st.o.find(x=>x[2]);
  return {key:'st'+st.q,top:'<div class="bigpic">📖</div>',prompt:['Listen to the story.',700,...sentences(st.s),1300,st.q],
    grown:`Story: <b>“${esc(st.s)}”</b> Question: ${esc(st.q)}`,
    options:o.map(x=>({html:`${x[1]?`<div class="e">${esc(x[1])}</div>`:''}<span>${esc(x[0])}</span>`,cls:'pic',label:x[0],ok:x===ans})),
    why:[`The answer is ${ans[0]}.`,600,'Listen to the story again.',400,...sentences(st.s)],whyText:`The answer is ${ans[0]}. “${st.s}”`};
}
function gListenDo(){
  const six=pick(PICS.filter((p,i,a)=>a.findIndex(q=>q[1]===p[1])===i),6),[a,b]=six;
  const opts=shuffle(six);
  return {key:'ld'+a[0]+b[0],mode:'sequence',ansCls:'four',prompt:['Listen.',400,`Tap the ${a[0]}.`,700,`Then tap the ${b[0]}.`],
    grown:`Tap the <b>${a[0]}</b>, then the <b>${b[0]}</b>. (Two-step directions.)`,
    options:opts.map(o=>({html:`<div class="e">${o[1]}</div><span>${o[0]}</span>`,cls:'pic',label:o[0],seq:o===a?0:o===b?1:-1})),
    why:[`First the ${a[0]}.`,300,`Then the ${b[0]}.`]};
}
function gVocab(ctx){
  const v=one(ctx.unit.words),y=Math.random()<.5,s=y?v.good:v.silly;
  return {key:'vo'+v.word+y,item:'vo'+v.word,top:`<div class="bigpic">${esc(v.emoji)}</div><div class="lined word">${esc(v.word)}</div>`,
    prompt:[...sentences(s),1200,`Is the word ${v.word} used the right way?`,500,'Happy face for yes.',350,'Sad face for no.'],
    grown:`Sentence: <b>“${esc(s)}”</b>`,
    options:[{html:FACE(true),cls:'face happy',label:'happy face',ok:y},{html:FACE(false),cls:'face sad',label:'sad face',ok:!y}],
    why:y?['Happy face!',300,`${cap(v.word)} means:`,200,...sentences(v.meaning),400,'That sentence uses it the right way.']
         :['Sad face.',300,`${cap(v.word)} means:`,200,...sentences(v.meaning),500,'Here is a sentence that makes sense.',400,...sentences(v.good)],
    whyText:y?`Happy face! “${v.word}” means: ${v.meaning} That sentence uses it the right way.`
             :`Sad face. “${v.word}” means: ${v.meaning} A sentence that makes sense: “${v.good}”`};
}
/* --- math --- */
const numOpts=(ans,lo,hi)=>nearNums(ans,lo,hi).map(n=>({html:String(n),cls:'num',label:String(n),ok:n===ans}));
function gCount(){
  const n=rnd(1,P.maxCount),it=one(themeItems());
  return {key:'cn'+n,top:`<div class="emojirow">${Array.from({length:n},()=>`<button class="cnt" aria-label="${it[1]}">${it[0]}</button>`).join('')}</div>`,
    prompt:[`How many ${it[2]}?`,500,'Touch each one and count.'],grown:`Let them touch each one as they count. Answer: <b>${n}</b>.`,
    options:numOpts(n,1,P.maxCount),why:[countAloud(n)+'.',400,`There ${n===1?'is':'are'} ${n} ${plural(n,it)}.`],
    after(st){let c=0;st.querySelectorAll('.cnt').forEach(b=>b.onclick=()=>{if(b.classList.contains('on'))return;b.classList.add('on');say(String(++c))})}};
}
const DICE={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
const tenframe=n=>`<div class="tenframe">${Array.from({length:10},(_,i)=>`<i class="${i<n?'on':''}"></i>`).join('')}</div>`;
function gSubitize(){
  const n=rnd(1,P.maxCount>10?10:6);
  const top=n<=6?`<div class="dice">${Array.from({length:9},(_,i)=>`<i class="${DICE[n].includes(i)?'on':''}"></i>`).join('')}</div>`:tenframe(n);
  return {key:'su'+n,top,prompt:['How many dots?',300,'Look quick!'],grown:`Try to answer without counting one by one. Answer: <b>${n}</b>.`,options:numOpts(n,1,10),
    why:[countAloud(n)+'.',300,`There ${n===1?'is 1 dot':`are ${n} dots`}.`]};
}
function gFindNum(){const t=rnd(0,P.maxCount);return {key:'fn'+t,prompt:[`Find the number ${t}.`],grown:`Find <b>${t}</b>.`,options:numOpts(t,0,Math.max(P.maxCount,5)),
  why:[`This is ${t}.`,...(t>0?[300,`${t} comes after ${t-1} when you count.`]:[])]}}
function gNextNum(){
  const s=rnd(1,P.maxCount>10?26:7),ans=s+3;
  return {key:'nn'+s,top:`<div class="numseq"><span>${s}</span><span>${s+1}</span><span>${s+2}</span><span class="blank">?</span></div>`,
    prompt:[`${s}.`,250,`${s+1}.`,250,`${s+2}.`,500,'What comes next?'],grown:`Count on: ${s}, ${s+1}, ${s+2}, <b>${ans}</b>.`,options:numOpts(ans,1,ans+3),
    why:[`${s}, ${s+1}, ${s+2},`,200,`${ans}.`,400,`${ans} comes next.`]};
}
function gMoreFewer(){
  let a=rnd(1,9),b=rnd(1,9);while(b===a)b=rnd(1,9);
  const items=themeItems(),more=Math.random()<.5,it=one(items),it2=one(items.filter(x=>x!==it)),ans=more?(a>b?0:1):(a<b?0:1);
  const n=ans===0?a:b,o=ans===0?b:a;
  const g=(n,i)=>`<div class="emojirow" style="font-size:1.9rem">${Array.from({length:n},()=>i[0]).join('')}</div>`;
  return {key:'mf'+a+b+more,prompt:[`Which group has ${more?'more':'fewer'}?`],grown:`${a} vs ${b}: tap the group with <b>${more?'more':'fewer'}</b>.`,
    options:[[a,it],[b,it2]].map(([n,i],k)=>({html:g(n,i),cls:'group',label:`group of ${n}`,ok:k===ans})),
    why:[`This group has ${n}. The other group has ${o}.`,300,more?`${n} is more than ${o}.`:`${n} is less than ${o}, so it has fewer.`]};
}
function gCompare(){let a=rnd(1,P.maxCount),b=rnd(1,P.maxCount);while(a===b)b=rnd(1,P.maxCount);const big=Math.max(a,b),small=Math.min(a,b);
  return {key:'cp'+a+b,item:'cp'+small+'-'+big,prompt:['Which number is bigger?'],grown:`${a} or ${b}? Bigger: <b>${big}</b>.`,
    options:[a,b].map(n=>({html:String(n),cls:'num',label:String(n),ok:n===big})),why:[`${big} is bigger than ${small}.`,300,`${big} comes after ${small} when you count.`]}}
function gAdd(){const a=rnd(1,5),b=rnd(1,Math.min(5,10-a)),it=one(themeItems()),steps=Array.from({length:b},(_,i)=>a+i+1);
  return {key:'ad'+a+b,top:`<div class="eq"><div class="emojirow">${Array.from({length:a},()=>it[0]).join('')}</div><span class="op">+</span><div class="emojirow">${Array.from({length:b},()=>it[0]).join('')}</div></div>`,
    prompt:[`${a} ${plural(a,it)}.`,500,`${b} more ${plural(b,it)} come.`,500,`How many ${it[2]} in all?`],grown:`${a} + ${b} = <b>${a+b}</b>`,options:numOpts(a+b,1,10),
    why:[`Start at ${a}.`,300,`Count up ${b}:`,200,steps.join(', ')+'.',400,`${a} and ${b} make ${a+b}.`]}}
function gSub(){const a=rnd(2,9),b=rnd(1,a-1),it=one(themeItems());
  return {key:'sb'+a+b,top:`<div class="emojirow">${Array.from({length:a},(_,i)=>`<span class="${i>=a-b?'gone':''}">${it[0]}</span>`).join('')}</div>`,
    prompt:[`There are ${a} ${it[2]}.`,500,`${b} go away.`,500,'How many are left?'],grown:`${a} − ${b} = <b>${a-b}</b>`,options:numOpts(a-b,0,9),
    why:[`Start with ${a}.`,300,`Take away ${b}.`,300,`${a-b} ${a-b===1?'is':'are'} left.`]}}
function gMake10(){const n=rnd(1,9);return {key:'m10'+n,top:tenframe(n),prompt:['How many more to make ten?',300,'Count the empty boxes.'],grown:`${n} + <b>${10-n}</b> = 10`,options:numOpts(10-n,1,9),
  why:[`There ${10-n===1?'is 1 empty box':`are ${10-n} empty boxes`}.`,300,`${n} and ${10-n} make ten.`]}}
const PATSETS=[['🔴','🔵','🟡'],['🍎','🍌','🍇'],['⭐','🌙','☀️'],['🐶','🐱','🐭'],['🟥','🟩','🟦']];
function gPattern(){const tp=theme().pats,set=tp.length&&Math.random()<.6?one(tp):one(PATSETS),unit=one(['AB','AAB','ABB','ABC']),map={A:set[0],B:set[1],C:set[2]};
  const seq=[];for(let i=0;seq.length<unit.length*2+1;i++)seq.push(map[unit[i%unit.length]]);
  const ans=map[unit[seq.length%unit.length]],opts=shuffle([...new Set([ans,...set])]).slice(0,3);if(!opts.includes(ans))opts[0]=ans;
  const core=unit.split('').map(c=>map[c]).join('');
  return {key:'pt'+unit+set[0],item:'pt'+unit,top:`<div class="patrow">${seq.map(x=>`<span>${x}</span>`).join('')}<span class="q">?</span></div>`,
    prompt:['What comes next in the pattern?'],grown:`Pattern ${unit}. Say it together out loud.`,
    options:shuffle(opts).map(x=>({html:`<div class="e">${x}</div>`,cls:'pic',label:x,ok:x===ans})),
    why:['The pattern repeats.',300,'Find the part that repeats.',400,'This one comes next.'],whyText:`The pattern repeats: ${core} ${core} … so ${ans} comes next.`}}
function shapeSVG(k,col,rot){const f=`fill="var(${col})"`;let s;
  if(k==='circle')s=`<circle cx="50" cy="50" r="34" ${f}/>`;
  else if(k==='square')s=`<rect x="20" y="20" width="60" height="60" ${f}/>`;
  else if(k==='rectangle')s=`<rect x="10" y="30" width="80" height="40" ${f}/>`;
  else if(k==='triangle')s=`<polygon points="50,14 88,82 12,82" ${f}/>`;
  else s=`<polygon points="30,16 70,16 90,50 70,84 30,84 10,50" ${f}/>`;
  return `<svg viewBox="0 0 100 100"><g transform="rotate(${rot} 50 50)">${s}</g></svg>`}
const SHAPEWHY={circle:'A circle is round. It has no sides and no corners.',square:'A square has 4 sides that are all the same size, and 4 corners.',
  rectangle:'A rectangle has 4 sides and 4 corners. Two sides are long and two are short.',triangle:'A triangle has 3 sides and 3 corners.',hexagon:'A hexagon has 6 sides and 6 corners.'};
const SOLIDWHY={sphere:'It is round all over, so it rolls.',cube:'It has 6 flat faces, and each one is a square.',cone:'It has a round bottom and a point on top.',cylinder:'It has a flat circle on the top and on the bottom.'};
function gShape(){
  if(Math.random()<.35){const s=one(SOLIDS),w=pick(SOLIDS.filter(x=>x!==s),2);
    return {key:'s3'+s[0],prompt:[`Find the ${s[0]}.`],grown:`A ${s[2]} is shaped like a <b>${s[0]}</b>.`,options:shuffle([s,...w]).map(o=>({html:`<div class="e">${o[1]}</div><span>${o[2]}</span>`,cls:'pic',label:o[2],ok:o===s})),
      why:[`The ${s[2]} is ${art(s[0])}.`,300,SOLIDWHY[s[0]]]}}
  const all=['circle','square','rectangle','triangle','hexagon'],t=one(all),opts=shuffle([t,...pick(all.filter(x=>x!==t),2)]);
  return {key:'sh'+t,prompt:[`Find the ${t}.`],grown:`Find the <b>${t}</b>. Shapes can be turned and still be the same shape.`,
    options:opts.map(k=>({html:shapeSVG(k,one(['--c1','--c2','--c3','--c4']),k==='circle'?0:one([0,0,15,30,-20,90])),cls:'svgopt',label:k,ok:k===t})),why:[`This is the ${t}.`,300,SHAPEWHY[t]]}}
const MEAS=[['heavier','lighter',['elephant','🐘'],['mouse','🐭']],['heavier','lighter',['rock','🪨'],['leaf','🍃']],['heavier','lighter',['truck','🚚'],['bike','🚲']],['warmer','colder',['fire','🔥'],['ice','🧊']],['warmer','colder',['sun','☀️'],['snowman','⛄']],['holds more','holds less',['bathtub','🛁'],['cup','☕']]];
function gMeasure(){
  if(Math.random()<.45){const tall=Math.random()<.5,a=rnd(2,7);let b=rnd(2,7);while(b===a)b=rnd(2,7);const askBig=Math.random()<.5;
    const word=tall?(askBig?'taller':'shorter'):(askBig?'longer':'shorter');const ans=askBig?(a>b?0:1):(a<b?0:1),n=ans===0?a:b,o=ans===0?b:a;
    const draw=n=>tall?`<svg viewBox="0 0 60 100">${Array.from({length:n},(_,i)=>`<rect x="15" y="${88-i*12}" width="30" height="11" rx="2" fill="var(--c${(i%4)+1})"/>`).join('')}</svg>`
      :`<svg viewBox="0 0 100 60"><rect x="6" y="22" width="${n*12}" height="16" rx="3" fill="var(--c3)"/><polygon points="${6+n*12},22 ${16+n*12},30 ${6+n*12},38" fill="var(--c1)"/></svg>`;
    return {key:'ms'+word+a+b,item:'ms'+word+Math.min(a,b)+Math.max(a,b),prompt:[`Which one is ${word}?`],grown:`Tap the <b>${word}</b> one.`,options:[a,b].map((n,k)=>({html:draw(n),cls:'svgopt',label:`${n} long`,ok:k===ans})),
      why:[`This one is ${word}.`,300,tall?`It is ${n} blocks tall. The other one is ${o} blocks tall.`:`It is ${n} blocks long. The other one is ${o} blocks long.`]};}
  const m=one(MEAS),askBig=Math.random()<.5,word=askBig?m[0]:m[1],right=askBig?m[2]:m[3],other=askBig?m[3]:m[2],opts=shuffle([m[2],m[3]]);
  const holds=word.startsWith('holds'),q=holds?`Which one ${word}?`:`Which one is ${word}?`;
  return {key:'mm'+word+m[2][0],prompt:[q],grown:`${q.replace('?','')}: <b>${right[0]}</b>.`,options:opts.map(o=>({html:`<div class="e">${o[1]}</div><span>${o[0]}</span>`,cls:'pic',label:o[0],ok:o===right})),
    why:[`The ${right[0]} ${holds?word:'is '+word} than the ${other[0]}.`]};
}
/* --- coding --- */
function gOrder(){const o=one(ORDERS),opts=shuffle(o.s);
  return {key:'or'+o.t,mode:'sequence',seqSpeak:true,prompt:['What happens first?',500,'Tap them in order.'],grown:`Order: ${o.s.map(x=>x[0]).join(' → ')} (${o.t}).`,
    options:opts.map(x=>({html:`<div class="e">${x[1]}</div><span>${x[0]}</span>`,cls:'pic',label:x[0],seq:o.s.indexOf(x)})),why:[`When ${o.t}:`,300,o.s.map(x=>x[0]).join(', then ')+'.']}}
const DIRS={U:[-1,0,'↑','up'],D:[1,0,'↓','down'],L:[0,-1,'←','left'],R:[0,1,'→','right']};
const LEVELS=[{start:[2,0],goal:[2,2],rocks:[]},{start:[2,0],goal:[2,4],rocks:[]},{start:[0,2],goal:[3,2],rocks:[]},{start:[4,1],goal:[1,1],rocks:[]},{start:[0,0],goal:[2,2],rocks:[]},{start:[2,0],goal:[2,4],rocks:[[2,2]]},{start:[4,0],goal:[0,4],rocks:[[2,2],[3,3],[1,1]]},{start:[0,4],goal:[4,0],rocks:[[0,2],[2,2],[4,2]]}].map(l=>({size:5,...l}));
function bfs(lv){const N=lv.size,key=(r,c)=>r*N+c,rocks=new Set(lv.rocks.map(([r,c])=>key(r,c))),prev=new Map([[key(...lv.start),null]]),q=[lv.start];
  while(q.length){const [r,c]=q.shift();if(r===lv.goal[0]&&c===lv.goal[1]){const path=[];let k=key(r,c);while(prev.get(k)){const [pk,d]=prev.get(k);path.unshift(d);k=pk}return path}
    for(const d of 'URDL'){const nr=r+DIRS[d][0],nc=c+DIRS[d][1];if(nr<0||nc<0||nr>=N||nc>=N)continue;const nk=key(nr,nc);if(rocks.has(nk)||prev.has(nk))continue;prev.set(nk,[key(r,c),d]);q.push([nr,nc])}}
  return null}
function genLevel(minL,maxL,nRocks){for(let g=0;g<400;g++){const s=[rnd(0,4),rnd(0,4)],t=[rnd(0,4),rnd(0,4)],rocks=[];
    while(rocks.length<nRocks){const r=[rnd(0,4),rnd(0,4)];if(!(r[0]===s[0]&&r[1]===s[1])&&!(r[0]===t[0]&&r[1]===t[1])&&!rocks.some(x=>x[0]===r[0]&&x[1]===r[1]))rocks.push(r)}
    const lv={size:5,start:s,goal:t,rocks},p=bfs(lv);if(p&&p.length>=minL&&p.length<=maxL)return lv}
  return LEVELS[1]}
const levelAt=i=>i<LEVELS.length?LEVELS[i]:genLevel(5,Math.min(9,5+((i-LEVELS.length)>>1)),Math.min(6,3+((i-LEVELS.length)>>2)));
function gRobot(ctx,k){const idx=P.robotLevel+(k||0),lv=levelAt(idx),{hero,goal}=theme();
  return {key:'rb'+idx,item:null,mode:'robot',level:lv,lvIdx:idx,
    prompt:idx===0?[`Help the ${hero[1]} get to the ${goal[1]}.`,600,'Tap the arrows to make a path.',500,'Then press Go.']:[`Get the ${hero[1]} to the ${goal[1]}.`],
    grown:`Level ${idx+1}. Let them build the whole path before pressing Go. Shortest path: ${bfs(lv).map(d=>DIRS[d][2]).join(' ')}`}}
function gDebug(){
  for(let g=0;g<50;g++){const lv=genLevel(3,5,rnd(0,2)),sol=bfs(lv),i=rnd(0,sol.length-1),wrong=one('URDL'.split('').filter(d=>d!==sol[i]));
    const prog=sol.slice();prog[i]=wrong;const sim=simulate(lv,prog);if(sim.reached)continue;
    return {key:'db'+g+sol.join(''),item:null,mode:'debug',level:lv,prog,sol,bug:i,prompt:['One arrow is wrong.',400,'Tap the wrong arrow.'],
      grown:`The wrong arrow is number ${i+1}. It should be ${DIRS[sol[i]][2]}.`,
      why:[`Arrow ${i+1} was the bug.`,300,`It should go ${DIRS[sol[i]][3]}.`],whyText:`Arrow ${i+1} was the bug. It should go ${DIRS[sol[i]][3]} ${DIRS[sol[i]][2]}.`}}
  return gOrder();
}
function simulate(lv,prog){let [r,c]=lv.start;const steps=[];
  for(let i=0;i<prog.length;i++){const nr=r+DIRS[prog[i]][0],nc=c+DIRS[prog[i]][1];
    if(nr<0||nc<0||nr>=lv.size||nc>=lv.size||lv.rocks.some(x=>x[0]===nr&&x[1]===nc)){steps.push({i,bump:[nr,nc]});return{steps,reached:false,bumped:true}}
    r=nr;c=nc;steps.push({i,pos:[r,c]});if(r===lv.goal[0]&&c===lv.goal[1])return{steps,reached:true}}
  return{steps,reached:false}}

/* --- shared helpers for picture questions --- */
const picOpt=(a,ok)=>({html:`<div class="e">${a[1]}</div><span>${a[0]}</span>`,cls:'pic',label:a[0],ok});
function mcq(key,prompt,grown,right,wrongs,why,read){
  const all=shuffle([right,...wrongs]);
  return {key,prompt:read?[...prompt,600,...all.flatMap(o=>[o[0]+'.',450])]:prompt,grown,
    options:all.map(a=>picOpt(a,a===right)),ansCls:all.length>3?'four':'',why:why||[`${cap(right[0])}.`]};
}
const faceOpts=yes=>[{html:FACE(true),cls:'face happy',label:'happy face',ok:yes},{html:FACE(false),cls:'face sad',label:'sad face',ok:!yes}];

/* --- writing --- */
function gTraceLetter(){const L=Math.random()<.6&&P.letters.length?one(P.letters):one(ALPHA),up=Math.random()<.5,g=up?L.toUpperCase():L;
  return {key:'tl'+g,mode:'trace',glyph:g,prompt:['Trace the',200,up?'big letter':'small letter',200,`${L.toUpperCase()}.`],
    grown:`Trace <b>${g}</b> with one finger. Start at the top. Any reasonable trace passes.`,why:['Good try!',300,"Let's do another one."]}}
function gTraceNum(){const n=rnd(0,P.maxCount>10?20:9);
  return {key:'tn'+n,mode:'trace',glyph:String(n),prompt:['Trace the number',200,`${n}.`],grown:`Trace <b>${n}</b>. Start at the top.`,why:['Good try!',300,"Let's do another one."]}}

/* --- extra math (2026 K standards) --- */
function gOneMore(){const n=rnd(1,P.maxCount-1),more=Math.random()<.6,ans=more?n+1:n-1;
  return {key:'om'+n+more,top:`<div class="numseq"><span>${n}</span></div>`,prompt:[`What is one ${more?'more':'less'} than ${n}?`],
    grown:`One ${more?'more':'less'} than ${n} is <b>${ans}</b>.`,options:numOpts(ans,0,P.maxCount),
    why:[`One ${more?'more':'less'} than ${n} is ${ans}.`,300,more?`${ans} comes right after ${n} when you count.`:`${ans} comes right before ${n} when you count.`]}}
function gTeen(){const n=rnd(11,19);
  return {key:'tt'+n,top:`<div class="eq">${tenframe(10)}${tenframe(n-10)}</div>`,prompt:['How many dots in all?',400,'One full ten, and some more.'],
    grown:`10 and ${n-10} make <b>${n}</b>.`,options:numOpts(n,10,20),why:[`One full ten and ${n-10} more.`,300,`Ten and ${n-10} make ${n}.`]}}
function gBreak(){const t=rnd(3,10),a=rnd(1,t-1),b=t-a,it=one(themeItems());
  return {key:'bk'+t+a,top:`<div class="eq"><div class="emojirow">${Array.from({length:a},()=>it[0]).join('')}</div><span class="op">+</span><span class="bigpic" style="font-size:3rem">🧺</span></div>`,
    prompt:[`There are ${t} ${it[2]} in all.`,500,`${a} ${a===1?'is':'are'} outside the basket.`,500,'How many are inside the basket?'],
    grown:`${t} = ${a} + <b>${b}</b>`,options:numOpts(b,0,10),why:[`There are ${t} in all.`,300,`${a} and ${b} make ${t},`,200,`so ${b} ${b===1?'is':'are'} in the basket.`]}}
function gTime(){const t=one(TIMEQ),order=['morning','afternoon','night'];
  return {key:'ti'+t[0],prompt:[t[0],600,'Morning,',300,'afternoon,',300,'or night?'],grown:`Answer: <b>${t[1]}</b>.`,
    options:order.map(k=>picOpt(TIMES[k],k===t[1])),why:[t[2]]}}
function gGraph(){const rows=pick(PETS,3),counts=pick([1,2,3,4,5,6],3),v=one(['most','fewest','count']);
  const top=`<div class="picto" aria-label="picture graph">${rows.map((r,i)=>`<div><b>${r[1]}</b>${Array.from({length:counts[i]},()=>r[1]).join('')}</div>`).join('')}</div>`;
  if(v==='count'){const i=rnd(0,2),c=counts[i];return {key:'gc'+rows[i][0]+c,top,prompt:['Look at the graph.',400,`How many ${rows[i][2]}?`],grown:`Count the ${rows[i][2]} row: <b>${c}</b>.`,options:numOpts(c,1,7),
    why:[countAloud(c)+'.',300,`There ${c===1?'is':'are'} ${c} ${c===1?rows[i][0]:rows[i][2]}.`]}}
  const best=v==='most'?counts.indexOf(Math.max(...counts)):counts.indexOf(Math.min(...counts));
  return {key:'g'+v+rows.map(r=>r[0]).join(),prompt:['This graph shows our class pets.',500,`Which pet has the ${v}?`],top,grown:`The ${v}: <b>${rows[best][2]}</b>.`,
    options:rows.map((r,i)=>picOpt(r,i===best)),why:[`The ${rows[best][0]} row is the ${v==='most'?'longest':'shortest'}.`,300,`There ${counts[best]===1?'is':'are'} ${counts[best]} ${counts[best]===1?rows[best][0]:rows[best][2]}.`]}}

/* --- science --- */
function gWeather(){
  if(Math.random()<.5){const w=one(WEATHER);return mcq('we'+w[0],[`Which picture is ${w[0]}?`],`Find <b>${w[0]}</b>.`,w,pick(WEATHER.filter(x=>x!==w),2),[`This picture is ${w[0]}.`])}
  const it=one(WEAR);return mcq('wr'+it.q,[it.q],`Answer: <b>${it.r[0]}</b>.`,it.r,it.x,[it.why],true)}
function gSky(){const night=Math.random()<.5,r=one(SKY[night?'night':'day']);
  const q=`Which one do we see in the ${night?'night sky':'daytime sky'}?`;
  return mcq('sk'+r[0],[q],`Answer: <b>${r[0]}</b>.`,r,[one(SKY[night?'day':'night']),one(SKY.other)],[`We see the ${r[0]} in the ${night?'night sky':'daytime sky'}.`],true)}
const PLANTS=/^(tree|flower)$/;
function gAlive(){const yes=Math.random()<.5,r=one(yes?ALIVE:NOTALIVE),A=cap(art(r[0]));
  const why=yes?(PLANTS.test(r[0])?`${A} drinks water, grows, and needs sunlight. It is alive.`:`${A} eats, grows, and breathes. It is alive.`)
    :`${A} does not eat, grow, or breathe. It is not alive.`;
  return mcq('al'+r[0],[yes?'Which one is alive?':'Which one is not alive?'],`${yes?'Alive':'Not alive'}: <b>${r[0]}</b>.`,r,pick(yes?NOTALIVE:ALIVE,2),[why],true)}
function gNeeds(){const it=one(NEEDS),r=one(it.r);return mcq('nd'+it.q+r[0],[it.q],`Answer: <b>${r[0]}</b>.`,r,pick(it.x,2),[it.why],true)}
function gBody(){const f=one(BODYF),r=one(f[1]);
  return mcq('bf'+r[0],[`Which animal has ${f[0]}?`],`A ${r[0]} has ${f[0]}.`,r,pick(BODYF.filter(x=>x!==f),2).map(x=>one(x[1])),[`The ${r[0]} has ${f[0]}.`],true)}
function gPushPull(){const it=one(PUSHPULL),push=it[2]==='push';
  return {key:'pp'+it[0],top:`<div class="bigpic">${it[1]}</div>`,prompt:[`${it[0]}.`,700,'Is that a push or a pull?'],
    grown:`${it[0]}: <b>${it[2]}</b>. A push moves things away; a pull brings them closer.`,
    options:[{html:'<div class="e">👐</div><span>push (away)</span>',cls:'pic',label:'push',ok:push},{html:'<div class="e">🫳</div><span>pull (closer)</span>',cls:'pic',label:'pull',ok:!push}],
    why:[`That is a ${it[2]}.`,300,push?'A push moves something away from you.':'A pull brings something closer to you.']}}
function gSenses(){const s=one(SENSES);
  const sc=SENSEQ.find(x=>x[1]===s[0]),useSc=Math.random()<.5;
  const prompt=useSc?[sc[0],600,'Which part of your body do you use?']:[`What do you use to ${s[0]}?`];
  return mcq('se'+s[0]+useSc,prompt,`Answer: <b>${s[2]}</b>.`,[s[2],s[1]],pick(SENSES.filter(x=>x!==s),2).map(x=>[x[2],x[1]]),[`You use your ${s[2]} to ${s[0]}.`])}

/* --- social studies --- */
function gJobs(){const j=one(JOBS),others=pick(JOBS.filter(x=>x!==j),2),A=cap(art(j[0]));
  if(Math.random()<.5)return mcq('jw'+j[0],[`Who ${j[2]}?`],`Answer: <b>${j[0]}</b>.`,[j[0],j[1]],others.map(o=>[o[0],o[1]]),[`${A} ${j[2]}.`],true);
  const m=mcq('jt'+j[0],[`Which tool does ${art(j[0])} use?`],`${A} uses <b>${art(j[4])}</b>.`,[j[4],j[3]],others.map(o=>[o[4],o[3]]),[`${A} uses ${art(j[4])}.`],true);
  m.top=`<div class="bigpic">${j[1]}</div>`;return m}
function gPosition(){const o=one(POSOBJ),p=one(POSPLACE),t=one(['on','under','next to']);
  const pic=k=>k==='on'?`<div class="posbox col"><span>${o[1]}</span><span>${p[1]}</span></div>`:k==='under'?`<div class="posbox col"><span>${p[1]}</span><span>${o[1]}</span></div>`:`<div class="posbox"><span>${p[1]}</span><span>${o[1]}</span></div>`;
  const words={on:'on top of',under:'under','next to':'next to'};
  return {key:'po'+o[0]+p[0]+t,prompt:[`Find the ${o[0]} ${words[t]} the ${p[0]}.`],grown:`Position words: <b>${words[t]}</b>.`,
    options:shuffle(['on','under','next to']).map(k=>({html:pic(k),cls:'pic',label:words[k],ok:k===t})),why:[`Here the ${o[0]} is ${words[t]} the ${p[0]}.`]}}
function gRules(){const r=one(RULES);return mcq('ru'+r.q,[r.q],`Answer: <b>${r.r[0]}</b>.`,r.r,r.x,[`${cap(r.r[0])}.`,200,r.why],true)}
function gLongAgo(){const pr=one(LONGAGO),old=Math.random()<.5,r=old?pr[0]:pr[1];
  return mcq('la'+r[0],[old?'Which one is from long ago?':'Which one do we use today?'],`${old?'Long ago':'Today'}: <b>${r[0]}</b>.`,r,[old?pr[1]:pr[0]],
    [`Long ago, people used ${art(pr[0][0])}.`,300,`Today we use ${art(pr[1][0])}.`],true)}
function gMaps(){const m=one(MAPQ);return mcq('mp'+m.q,[m.q],`Answer: <b>${m.r[0]}</b>.`,m.r,m.x,[m.why],true)}
function gNeedWant(){const need=Math.random()<.5,r=one(need?NEEDW.needs:NEEDW.wants);
  return mcq('nw'+r[0],need?['Which one do people need to live?']:['Which one is a want?',400,"Something fun, but you don't need it to live."],`${need?'Need':'Want'}: <b>${r[0]}</b>.`,r,pick(need?NEEDW.wants:NEEDW.needs,2),
    need?[`${cap(r[0])} ${/s$/.test(r[0])?'are':'is'} a need.`,200,'People need it to live.']:[`${cap(art(r[0]))} is a want.`,200,'It is fun, but you do not need it to live.'],true)}

/* --- feelings & safety --- */
function gFeel(){
  if(Math.random()<.5){const f=one(FEEL);return mcq('ff'+f[0],[`Find the ${f[0]} face.`],`Find <b>${f[0]}</b>.`,f,pick(FEEL.filter(x=>x!==f),2),[`This face is ${f[0]}.`])}
  const sc=one(FEELSC),f=FEEL.find(x=>x[0]===sc[1]);
  return mcq('fs'+sc[0],[sc[0],700,'How do they feel?'],`${esc(sc[0])} → <b>${f[0]}</b>. Ask them to point to how they would feel, too.`,f,pick(FEEL.filter(x=>x!==f),2),[sc[0],400,`That would make someone feel ${f[0]}.`],true)}
function gSafe(){const s=one(SAFE);
  return {key:'sf'+s[0],top:`<div class="bigpic">${s[2]}</div>`,prompt:[s[0],900,'Is that safe?',400,'Happy face for safe.',300,'Sad face for not safe.'],
    grown:`“${esc(s[0])}” — <b>${s[1]?'safe':'not safe'}</b>.`,options:faceOpts(!!s[1]),why:[s[1]?'Happy face. That is safe.':'Sad face. That is not safe.',300,s[3]]}}
function gHelpers(){const h=one(HELPERS);return mcq('hp'+h.q,[h.q],`Answer: <b>${h.r[0]}</b>.`,h.r,h.x,[h.why],true)}
function gHabits(){const h=one(HABITS);return mcq('hb'+h.q+h.r[0],[h.q],`Answer: <b>${h.r[0]}</b>.`,h.r,h.x,[`${cap(h.r[0])}.`,200,h.why],true)}

/* --- music (Web Audio) --- */
let AC=null;
function ac(){try{if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C()}if(AC.state==='suspended')AC.resume()}catch(e){return null}return AC}
document.addEventListener('pointerdown',()=>ac(),{capture:true});
function tone(f,start,dur,vol=.4){const a=ac();if(!a)return;const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+start;
  o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur+.05)}
function drum(start,vol=.8){const a=ac();if(!a)return;const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+start;
  o.type='sine';o.frequency.setValueAtTime(170,t);o.frequency.exponentialRampToValueAtTime(55,t+.18);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+.25);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+.3)}
const NOTES=[262,294,330,349,392,440,494,523,587,659];
function gUpDown(){const up=Math.random()<.5,i=rnd(0,4),j=i+rnd(3,5),a=up?NOTES[i]:NOTES[j],b=up?NOTES[j]:NOTES[i];
  const play=()=>{tone(a,0,.6);tone(b,.75,.7);return 1600};
  return {key:'ud'+a+b,item:'ud'+up,prompt:['Listen.',400,play,400,'Did the sound go up or down?'],grown:`It went <b>${up?'up (low to high)':'down (high to low)'}</b>. Try showing it with your hand.`,
    options:[{html:'<div class="e">⬆️</div><span>up</span>',cls:'pic',label:'up',ok:up},{html:'<div class="e">⬇️</div><span>down</span>',cls:'pic',label:'down',ok:!up}],
    why:['Listen again.',300,play,300,up?'It went up, from low to high.':'It went down, from high to low.']}}
function gFastSlow(){const fast=Math.random()<.5,gap=fast?.2:.75,n=6,play=()=>{for(let i=0;i<n;i++)drum(i*gap);return n*gap*1000+300};
  return {key:'fs'+fast+rnd(0,99),item:'fs'+fast,prompt:['Listen.',400,play,400,'Was that fast or slow?'],grown:`That beat was <b>${fast?'fast':'slow'}</b>.`,
    options:[{html:'<div class="e">🐇</div><span>fast</span>',cls:'pic',label:'fast',ok:fast},{html:'<div class="e">🐢</div><span>slow</span>',cls:'pic',label:'slow',ok:!fast}],
    why:['Listen again.',300,play,300,fast?'It was fast, like a bunny.':'It was slow, like a turtle.']}}
function gLoudSoft(){const firstLoud=Math.random()<.5,mel=v=>()=>{[392,330,392].forEach((f,k)=>tone(f,k*.3,.28,v));return 1100};
  const p1=mel(firstLoud?.8:.06),p2=mel(firstLoud?.06:.8);
  return {key:'lo'+firstLoud+rnd(0,99),item:'lo'+firstLoud,prompt:['Listen to two sounds.',500,'Number one.',300,p1,500,'Number two.',300,p2,500,'Which one was louder?'],
    grown:`Number <b>${firstLoud?1:2}</b> was louder. Turn the device volume up for this one.`,
    options:[1,2].map(k=>({html:`<b style="font:700 2.6rem var(--f-read)">${k}</b><span>${k===1?'first':'second'}</span>`,cls:'pic',label:k===1?'first':'second',ok:(k===1)===firstLoud})),
    why:[`Number ${firstLoud?'one':'two'} was louder.`]}}
function gBeats(){const n=rnd(2,5),play=()=>{for(let i=0;i<n;i++)drum(i*.55);return n*550+300};
  return {key:'bt'+n,top:'<div class="bigpic">🥁</div>',prompt:['Count the drum beats.',500,play,400,'How many beats?'],grown:`There were <b>${n}</b> beats. Clap them together.`,
    options:numOpts(n,1,7),why:['Listen again.',300,play,300,`${n} beats.`]}}

/* --- languages --- */
function gLang(lg,cat){const L=LANG[lg],items=L.cats[cat][2],it=one(items),num=typeof it[1]==='number',w={t:it[0],lang:lg};
  const others=pick(items.filter(x=>x!==it),2);
  return {key:lg+cat+it[0],top:`<div class="foreign" lang="${L.tag}">${it[0]}</div>${it[3]?`<div class="pinyin">${it[3]}</div>`:''}`,
    prompt:['Find',250,w,800,w],grown:`<b>${it[0]}</b>${it[3]?' ('+it[3]+')':''} = ${it[2]}`,
    options:num?numOpts(it[1],1,10):shuffle([it,...others]).map(o=>({html:`<div class="e">${o[1]}</div><span>${o[2]}</span>`,cls:'pic',label:o[2],ok:o===it})),
    why:[w,500,`means ${it[2]}.`]}}

/* --- teacher's questions (from the unit JSON) --- */
function gTeacherQ(ctx){const t=one(ctx.unit.questions),o=shuffle(t.answers),right=t.answers.find(a=>a.correct);
  return {key:'tq'+t.ask,top:t.show?`<div class="showbox">${esc(t.show)}</div>`:'',
    prompt:[...sentences(t.ask),600,...o.flatMap(a=>[a.text+'.',450])],grown:`${esc(t.ask)} Answer: <b>${esc(right.text)}</b>.`,
    options:o.map(a=>({html:a.emoji?`<div class="e">${esc(a.emoji)}</div><span>${esc(a.text)}</span>`:`<b class="anstext">${esc(a.text)}</b>`,cls:'pic',label:a.text,ok:a===right})),
    ansCls:o.length>3?'four':'',why:[`The answer is ${right.text}.`,...(t.why?[300,...sentences(t.why)]:[])]}}

/* std = Indiana code; cc = Common Core (reading, writing, math) or NGSS (science) code, blank where none exists */
const SKILLS={
 letterName:{sub:'reading',std:'K.RF.3',cc:'RF.K.1d',name:'Letter names',kid:'Find the letter',pic:'🔤',gen:gLetterName},
 letterSound:{sub:'reading',std:'K.RF.7',cc:'RF.K.3a',name:'Letter sounds',kid:'Letter sounds',pic:'🗣️',gen:gLetterSound},
 beginSound:{sub:'reading',std:'K.RF.6',cc:'RF.K.2d',name:'Beginning sounds',kid:'First sounds',pic:'🐶',gen:gBegin},
 rhyme:{sub:'reading',std:'K.RF.4',cc:'RF.K.2a',name:'Rhyming',kid:'Rhymes',pic:'🎩',gen:gRhyme},
 syllable:{sub:'reading',std:'K.RF.5',cc:'RF.K.2b',name:'Syllables (clapping)',kid:'Clap it',pic:'👏',gen:gSyll},
 category:{sub:'reading',std:'K.RC.7',cc:'L.K.5a',name:'Sorting into categories',kid:'What goes together',pic:'🍇',gen:gCategory},
 story:{sub:'reading',std:'K.RC.1 · K.RC.3',cc:'RL.K.1 · RL.K.3',name:'Listening comprehension',kid:'Stories',pic:'📖',n:4,gen:gStory},
 listenDo:{sub:'reading',std:'K.CC.5',name:'Two-step directions',kid:'Listen and tap',pic:'👂',n:4,gen:gListenDo},
 vocab:{sub:'reading',std:'Unit words',cc:'L.K.6',name:'Vocabulary (current test)',kid:'Words',pic:'😊',unitOnly:true,gen:gVocab},
 teacherQ:{sub:'reading',std:'Unit questions',name:"Teacher's questions (current test)",kid:"Teacher's questions",pic:'🍎',unitOnly:true,gen:gTeacherQ},
 traceLetter:{sub:'writing',std:'K.W.1',cc:'L.K.1a',name:'Writing letters',kid:'Trace letters',pic:'✍️',n:4,gen:gTraceLetter},
 traceNum:{sub:'writing',std:'Math K.NS.2',cc:'K.CC.A.3',name:'Writing numbers',kid:'Trace numbers',pic:'🔢',n:4,gen:gTraceNum},
 count:{sub:'math',std:'K.NS.3',cc:'K.CC.B.4 · K.CC.B.5',name:'Counting objects',kid:'How many?',pic:'🍎',gen:gCount},
 subitize:{sub:'math',std:'K.NS.4',name:'Quick look (dot patterns)',kid:'Dots',pic:'🎲',gen:gSubitize},
 findNum:{sub:'math',std:'K.NS.2',cc:'K.CC.A.3',name:'Reading numbers',kid:'Find the number',pic:'🔢',gen:gFindNum},
 nextNum:{sub:'math',std:'K.NS.1',cc:'K.CC.A.2',name:'Counting on',kid:'What comes next?',pic:'➡️',gen:gNextNum},
 oneMore:{sub:'math',std:'K.NS.1',cc:'K.CC.B.4c',name:'One more, one less',kid:'One more, one less',pic:'☝️',gen:gOneMore},
 moreFewer:{sub:'math',std:'K.NS.5',cc:'K.CC.C.6',name:'More, fewer, same',kid:'Which has more?',pic:'🧺',gen:gMoreFewer},
 compareNum:{sub:'math',std:'K.NS.6',cc:'K.CC.C.7',name:'Comparing numbers',kid:'Bigger number',pic:'🐘',gen:gCompare},
 teen:{sub:'math',std:'K.NS.7',cc:'K.NBT.A.1',name:'Teen numbers (a ten and ones)',kid:'Ten and more',pic:'🔟',gen:gTeen},
 add:{sub:'math',std:'K.CA.1',cc:'K.OA.A.2',name:'Adding within 10',kid:'Add',pic:'➕',gen:gAdd},
 subtract:{sub:'math',std:'K.CA.1',cc:'K.OA.A.2',name:'Taking away within 10',kid:'Take away',pic:'➖',gen:gSub},
 breakApart:{sub:'math',std:'K.CA.2',cc:'K.OA.A.3',name:'Breaking numbers apart',kid:'Hidden in the basket',pic:'🧺',gen:gBreak},
 make10:{sub:'math',std:'K.CA.3',cc:'K.OA.A.4',name:'Making 10',kid:'Make 10',pic:'🙌',gen:gMake10},
 pattern:{sub:'math',std:'K.CA.4',name:'Patterns',kid:'Patterns',pic:'🔴',gen:gPattern},
 shape:{sub:'math',std:'K.G.1',cc:'K.G.A.2',name:'2D and 3D shapes',kid:'Shapes',pic:'🔺',gen:gShape},
 measure:{sub:'math',std:'K.M.1',cc:'K.MD.A.2',name:'Compare size, weight, temperature',kid:'Bigger or smaller',pic:'📏',gen:gMeasure},
 timeWords:{sub:'math',std:'K.M.2',name:'Time of day',kid:'Morning or night?',pic:'🌅',gen:gTime},
 graph:{sub:'math',std:'K.DA.1',cc:'K.MD.B.3',name:'Reading picture graphs',kid:'Graphs',pic:'📊',gen:gGraph},
 weather:{sub:'science',std:'K.ESS.3',cc:'K-ESS2-1',name:'Weather',kid:'Weather',pic:'🌦️',gen:gWeather},
 sky:{sub:'science',std:'K.ESS.2',name:'Day and night sky',kid:'Day and night',pic:'🌙',gen:gSky},
 alive:{sub:'science',std:'K.LS.3',cc:'K-LS1-1',name:'Living or not living',kid:'Is it alive?',pic:'🌱',gen:gAlive},
 needs:{sub:'science',std:'K.LS.3',cc:'K-LS1-1',name:'What living things need',kid:'What it needs',pic:'💧',gen:gNeeds},
 animalBody:{sub:'science',std:'K.LS.2',name:'Animal body parts',kid:'Animal bodies',pic:'🐢',gen:gBody},
 pushPull:{sub:'science',std:'K.PS.3',cc:'K-PS2-1',name:'Push or pull',kid:'Push or pull?',pic:'🛒',gen:gPushPull},
 senses:{sub:'science',std:'K.PS.1',name:'Five senses',kid:'Five senses',pic:'👀',gen:gSenses},
 jobs:{sub:'social',std:'K.E.2',name:'Community jobs and tools',kid:'Community helpers',pic:'🧑‍🚒',gen:gJobs},
 position:{sub:'social',std:'K.G.1',name:'Position words',kid:'On, under, next to',pic:'📦',gen:gPosition},
 rules:{sub:'social',std:'K.C.1',name:'School rules',kid:'Rules',pic:'🙋',gen:gRules},
 longAgo:{sub:'social',std:'K.H.1',name:'Long ago and today',kid:'Long ago',pic:'🕯️',gen:gLongAgo},
 maps:{sub:'social',std:'K.G.2',name:'Maps and globes',kid:'Maps',pic:'🗺️',gen:gMaps},
 needWant:{sub:'social',std:'K.E.1',name:'Needs and wants',kid:'Need or want?',pic:'🏠',gen:gNeedWant},
 feelings:{sub:'health',std:'H&W K-2.4.3',name:'Naming feelings',kid:'Feelings',pic:'😀',gen:gFeel},
 safety:{sub:'health',std:'H&W K-2.1.4 · K-2.7.2',name:'Safe or not safe',kid:'Safe or not?',pic:'⛑️',gen:gSafe},
 helpers:{sub:'health',std:'H&W K-2.3.1 · K-2.4.6',name:'Trusted adults who help',kid:'Who can help?',pic:'🤝',gen:gHelpers},
 habits:{sub:'health',std:'H&W K-2.1.1 · K-2.1.3',name:'Healthy habits',kid:'Healthy habits',pic:'🧼',gen:gHabits},
 upDown:{sub:'music',std:'Music Lr.6.2.2',name:'Melody up or down',kid:'Up or down?',pic:'⬆️',gen:gUpDown},
 fastSlow:{sub:'music',std:'Music Lr.5.2.1',name:'Fast or slow',kid:'Fast or slow?',pic:'🐇',gen:gFastSlow},
 loudSoft:{sub:'music',std:'Music Lr.5.2.1',name:'Loud or quiet',kid:'Loud or quiet?',pic:'🔊',gen:gLoudSoft},
 beats:{sub:'music',std:'Music Lr.6.2.1',name:'Counting steady beats',kid:'Count the beats',pic:'🥁',gen:gBeats},
 order:{sub:'coding',std:'K-2.PA.5',name:'Steps in order',kid:'What comes first?',pic:'🌱',gen:gOrder},
 robot:{sub:'coding',std:'K-2.PA.1 · K-2.PA.3',name:'Programming a path',kid:'Robot path',pic:'🤖',n:3,gen:gRobot},
 debug:{sub:'coding',std:'K-2.PA.4',name:'Finding bugs',kid:'Fix the bug',pic:'🐞',n:3,gen:gDebug},
};
for(const lg of ['zh','es'])for(const cat of Object.keys(LANG[lg].cats)){const [nm,pic]=LANG[lg].cats[cat];
  SKILLS[lg+'_'+cat]={sub:lg,std:'World Languages (enrichment)',name:nm,kid:nm,pic,gen:()=>gLang(lg,cat)}}
const SUBJECTS={
 reading:{name:'Reading',pic:'📚',h:220,group:'school'},
 writing:{name:'Writing',pic:'✏️',h:25,group:'school'},
 math:{name:'Math',pic:'🔢',h:160,group:'school'},
 science:{name:'Science',pic:'🔬',h:190,group:'school'},
 social:{name:'Social Studies',pic:'🏘️',h:10,group:'school'},
 coding:{name:'Coding',pic:'🤖',h:265,group:'school'},
 health:{name:'Feelings & Safety',pic:'💛',h:330,group:'more'},
 music:{name:'Music',pic:'🎵',h:45,group:'more'},
 zh:{name:'中文',pic:'🐼',h:0,group:'more',lang:'zh'},
 es:{name:'Español',pic:'🌮',h:35,group:'more',lang:'es'},
};
const MIXN={coding:4,writing:4,music:5};

function makeQ(id,ctx={},k){const q=SKILLS[id].gen(ctx,k);q.skill=id;return q}
// For each slot, make a few different candidates and pick by item box: missed items come back, known ones rarely.
const BOXW={0:3,1:6,2:2,3:.5};
function makeSet(list,ctx){const out=[],seen=new Set(),cnt={};
  list.forEach(id=>{const k=cnt[id]=(cnt[id]??-1)+1,c=[];
    for(let t=0;t<12&&c.length<6;t++){const q=makeQ(id,ctx,k);if(!seen.has(q.key)&&!c.some(x=>x.key===q.key))c.push(q)}
    if(!c.length)c.push(makeQ(id,ctx,k));
    const w=c.map(q=>BOXW[itemBox(q)]);let r=Math.random()*w.reduce((a,b)=>a+b,0),q=c[c.length-1];
    for(let i=0;i<c.length;i++){r-=w[i];if(r<=0){q=c[i];break}}
    seen.add(q.key);out.push(q)});
  return out}
function weightOf(id){const l=mastery(id).lvl;return l==='got'?.5:l==='mid'?2:l==='low'?4:2}
function mixList(sub,n){const ids=Object.keys(SKILLS).filter(id=>SKILLS[id].sub===sub&&!SKILLS[id].unitOnly);const out=[];
  for(let i=0;i<n;i++){const tot=ids.reduce((s,id)=>s+weightOf(id),0);let r=Math.random()*tot,ch=ids[0];for(const id of ids){r-=weightOf(id);if(r<=0){ch=id;break}}out.push(ch)}
  return out}
