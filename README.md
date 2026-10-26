# My Kid Has ADHD: Learning Lab

**Free, tap-to-answer test practice built from your kid's actual study guide. Designed for kids with ADHD.**

👉 **Open the app:** https://zhaoserrano.github.io/my-kid-has-adhd/

Learning Lab started with one kindergarten study guide: "How can I help my child prepare for the Unit 3 Reading test?" It grew into practice that fits how many kids learn best:

- **Built from your kid's real homework.** Snap the teacher's study guide, and an AI turns it into a practice test.
- **Tap-only answers, everything read aloud.** It works for kids who aren't reading yet or don't talk much. Tapping is just like circling on the test.
- **Explains mistakes.** After a miss, it shows the right answer and says *why* in kid words. Then the missed question comes back until it sticks.
- **Their favorite things.** Pick cars, robots, dinosaurs, space, castles, animals or sports, and the math and coding games use those pictures.
- **Short rounds** of 3 to 5 minutes, with stars and wiggle breaks.
- **A whole kindergarten year** across reading, writing, math, science, social studies, coding, feelings and safety, music, Chinese and Spanish. Skills are mapped to Indiana and Common Core standards, so you can see what's covered.

## Use it in 3 steps

1. **Open the app** on a phone, tablet or computer: https://zhaoserrano.github.io/my-kid-has-adhd/. On an iPad or iPhone, tap Share → **Add to Home Screen** so it opens like an app.
2. **Type your child's name** (optional), then hand it over so they can pick what they like best.
3. **Tap a subject, or the test banner at the top**, and play. Check **For grown-ups** to see what's solid and what needs practice.

**Want a more natural voice?** Turn on **Natural voice** in **For grown-ups → Voice**. It's a free, open-source AI voice ([Kokoro](https://huggingface.co/hexgrad/Kokoro-82M)) that runs right in the browser. It downloads once (about 100 MB, so use Wi-Fi). Lines it hasn't prepared yet are read by the device voice so your child never waits; test content, feedback and letter sounds are prepared ahead of time, and anything heard once is saved for next time. Or, on iPhone and iPad, download a better device voice in Settings › Accessibility › Spoken Content › Voices (for example, English "Ava (Premium)").

## Add your kid's test in 3 steps

1. **Take a photo** of the teacher's study guide.
2. In Learning Lab, go to **For grown-ups → Tests → + Add a test**, tap **Copy the AI prompt**, and paste it into Claude, ChatGPT or Gemini along with the photo. (The prompt is also in [PROMPT.md](PROMPT.md).)
3. **Copy the AI's whole answer** and paste it back into Learning Lab. It checks the answer, shows what it found ("10 words, 5 letters, 4 stories"), and puts the test on the home screen with a countdown to test day.

Each test gets Word cards, a Words quiz, Letter sounds, Stories, the teacher's own questions, and a Practice test, depending on what the study guide covers.

## Privacy

- **No account, no sign-up, no ads, no tracking.**
- Names, progress and tests are saved **only in the browser on your device**. Nothing is sent to us or anyone else.
- The only time anything leaves your device is when *you* paste the prompt and photo into an AI chat yourself. Don't include your child's name or private details there.
- If you turn on **Natural voice**, the app downloads the voice files from public hosts (jsDelivr and Hugging Face). That's a download only: the words it reads are made on your device and never sent anywhere.
- Clearing the browser's website data erases the progress.

## What it is, and what it isn't

Learning Lab is **designed for kids with ADHD** and for any kid who struggles to sit through worksheets. It is practice, not therapy. It does **not** treat ADHD or any condition, and it doesn't replace teachers, IEP or 504 plans, speech therapy, or medical advice.

## Why it works this way

We kept the design close to what research supports, and we're careful not to overclaim:

- Matching problems to a child's interests helped students learn faster, and struggling students the most ([Walkington, via KQED MindShift](https://kqed.org/mindshift/32768/to-learn-algebra-the-not-so-secret-way-to-students-hearts)).
- Being asked again (retrieval practice) helps young children learn words better than just hearing them again ([Haebig et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC6802889)).
- In small studies, computer-based practice improved fluency and on-task behavior for kids with ADHD ([literature review](https://blogs.ubc.ca/jturco/files/2010/05/Final-Assignment-Literature-Review-Final.pdf)).

## Feedback

Did it help your kid on a test? What should change? Open an [issue on GitHub](https://github.com/ZhaoSerrano/my-kid-has-adhd/issues). We especially want to hear from parents.

## For developers

It's a static site: plain HTML, CSS and JavaScript, with no build step and no backend. Open `index.html` in a browser, or serve the folder with any static server. See [CONTRIBUTING.md](CONTRIBUTING.md) to add a theme, a skill, or your state's standards.

## License

Code: [MIT](LICENSE). Content (questions, stories, explanations, word lists): [CC BY 4.0](LICENSE-CONTENT.md). The optional natural voice uses [kokoro-js](https://github.com/hexgrad/kokoro) and the Kokoro-82M model, both Apache 2.0, loaded from a CDN, not bundled here.
