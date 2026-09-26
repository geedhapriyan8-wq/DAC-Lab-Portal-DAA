# Maintainer tools

Everything Vercel serves is in `public/`. The API is in `api/` and `lib/`. This folder is not deployed.

## Quiz answers (`quiz-keys.mjs`)

Quiz answers are kept on the server in `lib/quiz-keys.js`, so students can't read them in the
browser. To add or change a quiz:

1. Write it in the lab file as usual, with `answer: N` (0-based option index) on every question.
2. Run `node tools/quiz-keys.mjs`.

The script copies the answers into `lib/quiz-keys.js` and removes them from the lab file. If you edit
a quiz that has no answers in the lab file (already moved), keep the same number of questions or add
`answer:` to every question again. The script refuses to run otherwise.

## DAA labs

- `public/js/daa/daa-progress.js`: the curriculum (topics, lab titles, levels) and badge display.
- `public/js/daa/labs/daa-NN-*.js`: one file per topic; each lab is `window.DAA_LAB_DATA['daa-NN_labN']`.
- A code block with `run: true` is executed by the build script below, and its real output
  (text and charts) is shown when students click "Show Output". Add `expectError: true` for
  cells that are meant to raise an error.
- `public/js/daa/labs/daa-outputs.js` and `public/daa/img/*.png` are generated. Don't edit them by hand.

### Regenerate expected outputs

Run this after changing any lab code or dataset:

```bash
python -m pip install pandas==2.3.3 numpy scikit-learn matplotlib seaborn beautifulsoup4 requests nltk wordcloud langgraph
node tools/build-daa-outputs.mjs python
```

pandas is pinned to 2.x so text output matches Google Colab. The web-scraping lab fetches live
pages, so its outputs change from run to run. The script exits with an error if any cell fails.

## Local preview (`dev-server.mjs`)

`npm run dev` serves the site and API at http://localhost:5173 with a local database in `.dev-db/`.
The User ID `admin` is an admin locally; set `ADMIN_USER_IDS` to change that.
