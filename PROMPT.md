# The AI prompt for adding a test

Copy everything inside the box below, paste it into Claude, ChatGPT or Gemini, attach a photo of the teacher's study guide, and send. Then paste the AI's answer into Wiggle & Win: **For grown-ups → Tests → + Add a test**.

The app has a **Copy the AI prompt** button that copies this same text. It is built by `aiPrompt()` in `js/units.js`, so the skill list always matches the app. If you change skills, update this file from the app: open **Add a test → Show the prompt** and copy it here.

````text
You are helping a parent turn their child's school study guide into practice for a free kids' learning app called Wiggle & Win (My Kid Has ADHD: Quiz Prep). The child may have ADHD and may be a young or early reader, so everything is read aloud and answered by tapping a picture.

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
  - letterName: Letter names (Reading)
  - letterSound: Letter sounds (Reading)
  - beginSound: Beginning sounds (Reading)
  - rhyme: Rhyming (Reading)
  - syllable: Syllables (clapping) (Reading)
  - category: Sorting into categories (Reading)
  - story: Listening comprehension (Reading)
  - listenDo: Two-step directions (Reading)
  - traceLetter: Writing letters (Writing)
  - traceNum: Writing numbers (Writing)
  - count: Counting objects (Math)
  - subitize: Quick look (dot patterns) (Math)
  - findNum: Reading numbers (Math)
  - nextNum: Counting on (Math)
  - oneMore: One more, one less (Math)
  - moreFewer: More, fewer, same (Math)
  - compareNum: Comparing numbers (Math)
  - teen: Teen numbers (a ten and ones) (Math)
  - add: Adding within 10 (Math)
  - subtract: Taking away within 10 (Math)
  - breakApart: Breaking numbers apart (Math)
  - make10: Making 10 (Math)
  - pattern: Patterns (Math)
  - shape: 2D and 3D shapes (Math)
  - measure: Compare size, weight, temperature (Math)
  - timeWords: Time of day (Math)
  - graph: Reading picture graphs (Math)
  - weather: Weather (Science)
  - sky: Day and night sky (Science)
  - alive: Living or not living (Science)
  - needs: What living things need (Science)
  - animalBody: Animal body parts (Science)
  - pushPull: Push or pull (Science)
  - senses: Five senses (Science)
  - jobs: Community jobs and tools (Social Studies)
  - position: Position words (Social Studies)
  - rules: School rules (Social Studies)
  - longAgo: Long ago and today (Social Studies)
  - maps: Maps and globes (Social Studies)
  - needWant: Needs and wants (Social Studies)
  - feelings: Naming feelings (Feelings & Safety)
  - safety: Safe or not safe (Feelings & Safety)
  - helpers: Trusted adults who help (Feelings & Safety)
  - habits: Healthy habits (Feelings & Safety)
  - upDown: Melody up or down (Music)
  - fastSlow: Fast or slow (Music)
  - loudSoft: Loud or quiet (Music)
  - beats: Counting steady beats (Music)
  - order: Steps in order (Coding)
  - robot: Programming a path (Coding)
  - debug: Finding bugs (Coding)
- "stories": short listening stories (2 to 4 sentences) with one question each, like the ones on the test.
- "questions": any other test questions. "ask" is read aloud. "show" is optional: emoji or a few words shown on screen. "why" is one kid-level sentence that gives the answer and the reason.
- Every story and question has 2 to 4 answers, and exactly one has "correct": true. Give answers an emoji whenever a picture helps a child who cannot read yet.
- Use simple words a young child knows. Do not use real children's names, brand names, or licensed characters.
- Reply with the JSON only. No explanation before or after it.
````
