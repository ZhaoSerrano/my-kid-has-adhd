# My Kid Has ADHD: Quiz Prep (kids see "Wiggle & Win")

An open-source, tap-to-answer practice app that helps kids with ADHD prepare for school tests and learn the skills behind them. Parents add their child's real tests from the teacher's study guide. The project and repo are called **my-kid-has-adhd**.

## Names (decided Oct 26, 2026; renamed from "Learning Lab")
- **Parent-facing: "My Kid Has ADHD: Quiz Prep"**, used in the README, GitHub description, search/meta description and share-preview tags (`og:*`, `twitter:*` in `index.html`). It must say ADHD and quiz prep so parents find it and get it.
- **Kid-facing: "Wiggle & Win"**, used in `<title>`, the home-screen icon name, the app header ("Alex's Wiggle & Win") and the AI prompt. **A child never sees "ADHD"** on kid screens. The grown-up screen and the welcome screen (for the grown-up) may mention it.
- Tone: a game to get through, not a test to ace. Avoid score-pressure words ("ace", "perfect").
- Trademarks: all three names are claimed by Qianyu Zhao-Serrano (™, see `TRADEMARKS.md`); not registered yet. A web search on Oct 26, 2026 found no existing "Wiggle & Win" app or mark; the closest is The Wiggles' "WIGGLE AND LEARN". Have an attorney check that before filing.

## Goals, in priority order
1. **Pass the test.** Practice the exact things on the teacher's study guide (unit packs).
2. **Learn, don't just score.** A wrong answer shows the right one and explains *why* in one kid-level sentence that is read aloud.
3. **Practice what's weak, skip what's known.** Missed items come back, in the same round and in later sessions. Mastered items show up rarely.
4. **Use what the kid loves.** The theme (cars, robots, dinosaurs, space, castles, animals, sports) swaps the pictures in math and the robot game.

Ship the 80/20 version, put it in front of parents, and iterate on their feedback.

## Hard constraints
- **Static site, no build step, no backend, no accounts, no analytics.** All progress lives in `localStorage` on the device. This keeps it free to host (GitHub Pages) and avoids collecting children's data (COPPA).
- Plain JS with global functions, loaded by `<script>` tags in order. Do not add a bundler or framework.
- It must also work when `index.html` is opened from disk (`file://`), so never `fetch()` local files. Content lives in `.js` files.
- **No child names in the code.** Names come from in-app profiles stored on the device.
- **Themes use generic things only** (a princess, a race car). No branded or licensed characters.
- **No medical or efficacy claims.** Say "designed for kids with ADHD," never "treats" or "improves ADHD."
- **ADHD design rules:** 3–5 minute rounds, one question per screen, everything read aloud, answers by tapping (works for kids who don't talk much), instant feedback, visible progress dots, stars.
- Every screen must work at phone width (390px) and on an iPad, in light and dark mode.

## Files (load order matters)
| File | What's in it |
|---|---|
| `index.html` | Markup shell plus the script tags |
| `styles.css` | All styles. Colors are CSS tokens with light and dark values |
| `js/content.js` | Content banks: phonics, pictures, stories, science, social studies, health, languages, `THEMES`, `theme()`, `themeItems()` |
| `js/core.js` | Helpers, profile and progress storage (`P`, `record`, `mastery`), speech (`say`, `hush`, `voiceFor`) |
| `js/skills.js` | Question generators `g*()`, Web Audio for music, `SKILLS` registry, `SUBJECTS`, `MIXN`, `makeQ`, `makeSet`, `mixList` |
| `js/units.js` | Units (tests): `EXAMPLE_UNIT` (kindergarten "Unit 3 Reading Test"), storage, `unitCtx`, `unitSections`, `unitTest`, the AI prompt `aiPrompt()`, and `parseUnit()` validation |
| `js/app.js` | Profiles (welcome, theme picker, who's playing), navigation/screens, round runner with explanations and retries, wiggle breaks, `MOUNTS` (`choose`, `sequence`, `robot`, `trace`, `debug`), grown-up screen, Add a test, `start()` |

### Question object contract (returned by every generator)
```js
{
  key: 'unique id for de-duping',
  prompt: ['Spoken text', 600, 'More text', {t:'红色', lang:'zh'}, playSoundFn], // numbers = pause in ms; functions play a sound and return its duration in ms
  top: '<html shown above the answers>',          // optional
  options: [{html, cls, label, ok:true|false}],   // 'choose' mode; 'sequence' mode uses seq:0,1,2 (-1 = distractor)
  ansCls: 'four',                                 // optional layout hint
  why: ['Speech explaining the right answer'],    // read when the kid misses twice
  grown: 'Hint line for the grown-up (HTML)',
  mode: 'choose'|'sequence'|'robot'|'trace'|'debug',
  after(stageEl){}                                // optional hook after render
}
```
`SKILLS[id] = {sub, std, name, kid, pic, n?, unitOnly?, gen(ctx,k)}`. `ctx` carries unit data (`unit`, `letters`, `stories`).

Optional question fields: `whyText` (screen text when it differs from the spoken `why`), `item` (stable id for spaced practice; defaults to `key`; `null` opts out, e.g. robot/debug).

### Storage keys
- `mkha_profiles` = `[{id,name,theme}]`; `mkha_last` = last profile id.
- `lab_<profileId>` holds the profile's progress (`stars`, `skills{id:[1,0,…last 10]}`, `items{skill:item:{b,l}}`, `letters`, `lcase`, `maxCount`, `robotLevel`). Defaults live in `freshProgress()` in `js/core.js` (also used by Reset): all 26 letters, `lcase:'both'`, counting to 10. `lcase` ('lower' | 'upper' | 'both') sets how letters look in letter sounds, find the letter and tracing (`upperNow()`); with 'both' each question picks a case at random. Old `lab_*` keys with no `mkha_profiles` are migrated to profiles on first start.
- `mkha_units` = parent-added units (schema below, plus `id` and optional `for` = profile id). `mkha_hidden` = hidden unit ids (the built-in example can be hidden, not deleted).
- `u3voice` holds voice preferences (`name`, `rate`, `natural`, `nvoice`).
- `mkha_appearance` = `"light"` or `"dark"` (JSON-encoded; absent = Auto, follows the device). A small inline script in `index.html` sets `data-theme` on `<html>` before the page draws.
- Natural voice: generated lines are saved in IndexedDB `mkha-voice` (store `clips`, Int16 audio, key `voice|rate|text`); `mkha_nv_keys` lists them oldest first (newest 800 kept). `mkha_nv_trying` is set while the model loads, so a crash during loading (an older iPad out of memory) doesn't auto-retry on the next start.

### Natural voice (optional, in `js/core.js`)
- Kokoro-82M via `kokoro-js@1.2.1` (Apache 2.0), q8 on WASM (~92 MB model, cached by the browser). WebGPU with q8 tested about 4× slower, so it isn't used.
- It runs in a module Web Worker built from a Blob (works from `file://`). On the main thread each line froze the page for 2–4 s.
- Speed measured on an 8-core Mac: about 1.6 s of compute per second of speech single-threaded, about 0.9 s with cross-origin isolation (multithreaded). GitHub Pages can't send the COOP/COEP headers; a coi-serviceworker would be needed. Not done yet.
- Rule: **a child never waits.** `say()` uses the natural voice only when every line is already made (memory or IndexedDB); otherwise the device voice reads it and the lines are queued for next time.
- Queue priorities: 0 = speaking now, 1 = this round's prompts and whys (`runRound`, `showQ`), 2 = idle warm-up (`nvWarm`: feedback phrases, visible units' words, stories and questions, letter sounds). Chinese and Spanish always use the device voice.
- Not yet tested on a real iPad or iPhone.

## Status

### Done
- 10 subjects, 50+ skills, each mapped to an Indiana kindergarten standard: Reading, Writing (finger tracing), Math (2026 Indiana K standards), Science, Social Studies, Coding (robot path plus debugging), Feelings & Safety, Music (Web Audio), Chinese and Spanish.
- Grown-up progress screen, letters-learned and counting-range settings, voice picker.
- Mastery per skill (last 10 tries). "Play a mix" weights toward weak skills.
- Child's name removed from the code.
- **v1 tasks 1–8 done (Oct 26, 2026).** Profiles and theme picker; explanation panel with Next; rewritten `why`s; in-round retries and item boxes; themes in math, patterns and robot/debug; Add-a-test flow (`aiPrompt`, `parseUnit`, `unitSections`, `unitTest` in `js/units.js`); wiggle breaks; Common Core/NGSS codes (`cc` on `SKILLS`); README, PROMPT, LICENSE, CONTRIBUTING. Tested in the browser: ~11k generated questions, every subject mix, unit tests, and the grown-up screens with zero page errors, at 390×844 and 820×1180 in light and dark.
- Licenses confirmed by the founder (Oct 26, 2026): MIT for code (`LICENSE`), CC BY 4.0 for content (`LICENSE-CONTENT.md`). Copyright holder: Qianyu Zhao-Serrano. CONTRIBUTING says contributions come in under the same licenses.
- **Deployed (Oct 26, 2026):** public repo `github.com/ZhaoSerrano/my-kid-has-adhd`, GitHub Pages from `main` / root. Custom domain **https://wiggleandwin.com/** (`CNAME` file; set up Oct 26, 2026). HTTPS enforced; the old `zhaoserrano.github.io/my-kid-has-adhd/` and `www.wiggleandwin.com` redirect there. **mykidhasadhd.com** is also owned (Cloudflare) but intentionally unused for now; the founder is saving it for something else, so don't point it at the app. Both domains are registered at Cloudflare (DNS there; GitHub records must stay "DNS only", grey cloud). Moving domains changes the browser origin, so on-device progress doesn't carry over from the old address. Pushes are done by the founder from the Mac Terminal app (`git push`), where her GitHub login works.
- Parent feedback: GitHub issue form `.github/ISSUE_TEMPLATE/parent-feedback.yml` (label `feedback`), linked from the grown-up screen (`FEEDBACK_URL` in `js/app.js`), README and CONTRIBUTING. It tracks the two numbers that matter: did the kid pass, and did the kid choose to play.

### v1 tasks (done except 9; kept for reference)
1. **Profiles.**
   - First run: a grown-up enters an optional name. Then the kid picks a theme on a big-tile "What do you like best?" screen, read aloud.
   - Support several kids, with a "Who's playing?" picker and "+ Add child". Store `mkha_profiles=[{id,name,theme}]`.
   - Keep the migration from existing `lab_*` keys.
   - Theme can also be changed on the grown-up screen.
2. **Explanations (goal 2).**
   - When a question ends wrong: circle the right answer, show an explanation panel (✓ plus `whyText`), read `why` aloud, and wait for a big **Next →** button. No auto-advance.
   - Add optional `whyText` for screen text when the speech differs (e.g. emoji in patterns). Default: join the string parts of `why`.
   - Rewrite weak `why`s so each one states the answer *and* the reason. Examples:
     - First sounds: "Dog and duck both start with duh. Map starts with mmm."
     - Count: count aloud "1, 2, 3… there are 5."
     - Add: count on from the first number: "Start at 3, count up 2: 4, 5."
     - Subtract: "Start with 7, take away 3, 4 are left."
     - Shapes: name the attributes, e.g. "A triangle has 3 sides and 3 corners."
     - Compare: "8 is bigger than 5. 8 comes after 5 when you count."
     - Vocab, wrong-usage sentence: give the meaning, then read the good sentence.
     - Story: give the answer, then replay the story.
     - Categories: use `CATS.one/many`.
     - Long ago: "Long ago people used a candle. Today we use a lamp."
     - Alive: "A dog eats, grows, and breathes."
     - Wire in the data reasons listed under Done.
3. **Adaptive practice (goal 3).**
   - *In round:* a missed question is re-queued at the end with options reshuffled and the prompt prefixed "Let's try this one again." At most 2 extras per round.
   - *Across sessions:* item-level boxes stored in `P.items[skill+':'+item] = {b:1|2|3, l:label}`. Wrong sets box 1. Right on first try moves up one box (max 3). Use `q.item`; default is `q.key`. Strip theme words from keys so items are stable (`'cn'+n`, not `'cn'+n+itemName`).
   - In `makeSet`, generate about 6 candidates per slot and pick by weight: box 1 = 6, unseen = 3, box 2 = 2, box 3 = 0.5.
   - Skill-level mix weights: needs practice 4, getting there 2, new 2, got it 0.5.
   - Grown-up screen: add a "Working on now" list of box-1 items.
4. **Themes (goal 4).**
   - Use `themeItems()` wherever `ITEMS` is used: count, more/fewer, add, subtract, break apart.
   - Patterns: 60% chance to use `theme().pats`.
   - Robot and debug games: use `theme().hero` and `theme().goal` (emoji and spoken name) instead of 🤖 and ⭐.
5. **Tests from the teacher's study guide (goal 1). This is the core of "adapt it to your kid."**
   - Unit JSON schema, below. Convert the built-in example to it.
   - Grown-up screen → **Add a test**:
     1. Show the steps: photograph the study guide, paste the prompt and photo into Claude, ChatGPT or Gemini, then paste the result back.
     2. A **Copy the AI prompt** button. Build the prompt text from `SKILLS` so the list of skill ids never goes stale.
     3. A paste box. Strip code fences, validate with plain-language errors, show a preview ("10 words, 5 letters, 4 stories"), then save to `mkha_units` in `localStorage`.
     4. Let the parent delete or hide units, including the built-in example.
   - Home shows a banner per unit with a countdown ("Test in 3 days") when `testDate` is set.
   - Unit sections come from the data:
     - words → Word cards + Words quiz (happy/sad face)
     - letters → Letter sounds
     - skills → those built-in skills
     - stories → Stories
     - questions → "Teacher's questions"
   - Practice test: about 2 per section, 3 for words.
6. **Wiggle breaks.** After every 2nd round, the done screen shows one movement card ("Jump 5 times!", "Touch your toes 5 times", "Stretch up tall like a tree"). It is read aloud and has an "I did it!" button.
7. **Common Core / NGSS codes** next to the Indiana codes on the grown-up screen. Leave blank where none exists.
   - letterName RF.K.1d · letterSound RF.K.3a · beginSound RF.K.2d · rhyme RF.K.2a · syllable RF.K.2b · category L.K.5a · story RL.K.1/RL.K.3 · vocab L.K.6
   - traceLetter L.K.1a · traceNum K.CC.A.3
   - count K.CC.B.4/K.CC.B.5 · findNum K.CC.A.3 · nextNum K.CC.A.2 · oneMore K.CC.B.4c · moreFewer K.CC.C.6 · compareNum K.CC.C.7 · teen K.NBT.A.1 · add/subtract K.OA.A.2 · breakApart K.OA.A.3 · make10 K.OA.A.4 · shape K.G.A.2 · measure K.MD.A.2 · graph K.MD.B.3
   - weather K-ESS2-1 · alive/needs K-LS1-1 · pushPull K-PS2-1
   - Make the standards copy generic ("Indiana and Common Core"); remove family-specific wording.
8. **Docs.**
   - `README.md` for parents: what it is, a "use it in 3 steps" section, an "add your kid's test in 3 steps" section, privacy (nothing leaves the device), and no-medical-claims wording.
   - `PROMPT.md`, generated from the same function as the in-app prompt.
   - `LICENSE` (MIT, code) plus a note that content is CC BY 4.0.
   - A short `CONTRIBUTING.md` covering how to add a theme, a skill, or a state's standards.
9. **Deploy.** Push to `github.com/ZhaoSerrano/my-kid-has-adhd`, enable GitHub Pages (main branch, root), and put the live link in the README.

### Unit JSON schema (v1)
```json
{
  "title": "Unit 3 Reading Test",
  "grade": "K",
  "testDate": "2026-10-30",
  "words":   [{"word":"burrow","emoji":"🐇","meaning":"A hole an animal digs to live in.","good":"The rabbit dug a burrow under the ground.","silly":"The bird flew up into the burrow in the sky."}],
  "letters": ["s","m","d","p","a"],
  "skills":  ["beginSound"],
  "stories": [{"story":"…","question":"…","answers":[{"text":"umbrella","emoji":"☂️","correct":true},{"text":"ball","emoji":"⚽"}]}],
  "questions": [{"ask":"Spoken question","show":"🍎🍎🍎","answers":[{"text":"3","correct":true},{"text":"4"}],"why":"Kid-level reason."}]
}
```
Every section is optional except `title`. Each story or question has exactly one correct answer and 2–4 answers in total.

## Testing
No test framework. Use the preinstalled Playwright + Chromium:
- Load `index.html`.
- Call every generator about 200 times and assert exactly one `ok` option (or a valid `seq` set) and unique labels.
- Click through each subject's mix, the unit practice test and the grown-up screen.
- Assert zero `pageerror` events.
- Screenshot at 390×844 and 820×1180, in light and dark mode.

## Standards sources
- Indiana Academic Standards: https://www.in.gov/doe/students/indiana-academic-standards/
- 2026 K Math: https://www.in.gov/doe/students/indiana-academic-standards/files/2026%20Indiana%20Academic%20Standards%20-%20Kindergarten%20Mathematics.pdf (Indiana schools implement it starting 2027–28)
- 2023 K ELA: https://secure.in.gov/doe/files/2023-IAS-Correlation-Guide_-ELA-Kindergarten.pdf
- K–2 Computer Science: https://codehs.com/standards/framework/IN_K-2_CS_2023/mapping/1840/print
- K Science: https://secure.in.gov/doe/files/Kindergarten-Science-Content-Connectors-Revised.pdf

## Evidence behind the design (cite these modestly in the README)
- Interest-based personalization helped students learn faster, and struggling students most (Walkington, SMU): https://kqed.org/mindshift/32768/to-learn-algebra-the-not-so-secret-way-to-students-hearts
- Spaced retrieval beats re-study for young children's word learning (Haebig et al.): https://pmc.ncbi.nlm.nih.gov/articles/PMC6802889
- Computer-assisted practice improved fluency and on-task behavior for kids with ADHD, in small studies: https://blogs.ubc.ca/jturco/files/2010/05/Final-Assignment-Literature-Review-Final.pdf
