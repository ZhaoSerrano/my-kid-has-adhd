# Contributing

Thanks for helping! Learning Lab is a static site: plain JavaScript, loaded with `<script>` tags in order, with no build step, backend or framework. Keep it that way, so it stays free to host and never collects children's data. It must also work when `index.html` is opened straight from disk, so never `fetch()` local files.

Run it locally by opening `index.html`, or with any static server, for example `python3 -m http.server`.

## Ground rules

- **No child names** in code or content. Names come only from profiles saved on the device.
- **Generic pictures only** (a princess, a race car). No branded or licensed characters.
- **No medical or efficacy claims.** Say "designed for kids with ADHD," never "treats" or "improves ADHD."
- **ADHD design rules:** one question per screen, everything read aloud, answers by tapping, instant feedback, short rounds.
- Every screen must work at phone width (390px) and on an iPad, in light and dark mode.

## Add a theme

Themes live in `THEMES` in `js/content.js`. Copy a block and change it:

```js
trains:{name:'Trains',pic:'🚂',
  items:[['🚂','train','trains'],['🚃','train car','train cars'],['🛤️','track','tracks']], // [emoji, one, many] for counting and adding
  hero:['🚂','train'],   // moves in the robot game: [emoji, spoken name]
  goal:['🚉','station'], // where the hero goes
  pats:[['🚂','🚃','🛤️']]}, // optional pattern sets, 3 emoji each
```

Give `items` at least 6 entries, so "Which group has more?" can show two different things.

## Add a skill

1. Write a generator in `js/skills.js`. It returns a question object (the full contract is in `CLAUDE.md`). Every choose-mode question needs exactly one option with `ok:true`, and a `why` that states the answer **and** the reason in one or two kid-level sentences, like `['Start at 3.', 300, 'Count up 2: 4, 5.']`.
2. Keep `key` (or `item`) stable and free of theme words, so missed questions can come back in later sessions. For example, use `'cn'+n`, not `'cn'+n+itemName`.
3. Register it in `SKILLS` with its subject, standard codes and a kid-facing name:
   ```js
   rhyme:{sub:'reading',std:'K.RF.4',cc:'RF.K.2a',name:'Rhyming',kid:'Rhymes',pic:'🎩',gen:gRhyme},
   ```
   The AI prompt in the app picks up new skills automatically. Then refresh `PROMPT.md` from the app (**For grown-ups → Tests → + Add a test → Show the prompt**).

## Add your state's standards

Each skill has `std` (currently Indiana) and `cc` (Common Core for reading, writing and math, or NGSS for science). To add another state, add a field such as `tx:'K.2(B)'` to the skills it covers, and show it in `stdLine()` in `js/app.js`. Link your sources in the pull request.

## Add a built-in test

Write it in the unit JSON schema (see `PROMPT.md`) and add it next to `EXAMPLE_UNIT` in `js/units.js`. Most families should add tests in the app instead.

## Before you open a pull request

There's no test framework. In the browser console:

- Call every generator about 200 times and check that there is exactly one correct option (or a valid sequence) and that the labels are unique.
- Click through each subject's mix, a unit's practice test and the grown-up screen with zero console errors.
- Check 390×844 and 820×1180, in light and dark mode.
