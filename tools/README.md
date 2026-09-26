# DAA lab tooling

The Data Analytics Academy (DAA) section lives in `daa/` (pages, datasets, charts) and
`js/daa/` (logic and lab content). This folder is excluded from Vercel deploys via `.vercelignore`.

## How DAA labs are structured

- `js/daa/daa-progress.js`: the curriculum (topics, lab titles, levels) and progress/badge logic.
- `js/daa/labs/daa-NN-*.js`: one file per topic; each lab is `window.DAA_LAB_DATA['daa-NN_labN']`.
- A code block with `run: true` is executed by the build script below, and its real output
  (text and charts) is shown when students click "Show Output". Add `expectError: true` for
  cells that are meant to raise an error.
- `js/daa/labs/daa-outputs.js` and `daa/img/*.png` are generated. Don't edit them by hand.

## Regenerate expected outputs

Run this after changing any lab code or dataset:

```bash
python -m pip install pandas==2.3.3 numpy scikit-learn matplotlib seaborn beautifulsoup4 requests nltk wordcloud langgraph
node tools/build-daa-outputs.mjs python
```

pandas is pinned to 2.x so text output matches Google Colab. The web-scraping lab fetches live
pages, so its outputs change from run to run. The script exits with an error if any cell fails.

## Programme gate

Each account stores `program: 'dsa' | 'daa'` (chosen at registration). `Auth.requireAuth(program, root)`
sends students from the other programme to their own dashboard. Accounts without a programme are
treated as DSA. To move a student between programmes, change `program` on their account record.
