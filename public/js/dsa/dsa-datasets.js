/* ============================================================
   DSA Lab Portal — Dataset catalogue (dsa-datasets.js)
   Files live in /dsa/datasets/. Lab steps reference them by key.
   ============================================================ */

const DSADatasets = {
  titanic:   { file: 'titanic.csv',                         label: 'Titanic passengers dataset',     size: '60 KB',  usedIn: 'Topic 03 (ML Pipeline)' },
  feedback:  { file: 'unstructured_customer_feedback.json', label: 'Unstructured customer feedback', size: '2.0 KB', usedIn: 'Topic 08 (NLP)' },
  knowledge: { file: 'knowledge_base_articles.json',        label: 'Corporate knowledge base',       size: '2.2 KB', usedIn: 'Topic 08 (NLP) & Topic 09 (RAG)' },
};

/* Path from a page in /dsa/ to a dataset file */
function dsaDatasetUrl(key) {
  const d = DSADatasets[key];
  return d ? `datasets/${encodeURIComponent(d.file)}` : '#';
}

/* A download button for a dataset, used by the dashboard and lab steps */
function dsaDatasetButton(key) {
  const d = DSADatasets[key];
  if (!d) return '';
  return `<a class="daa-resource-btn" href="${dsaDatasetUrl(key)}" download="${d.file}">⬇️ ${d.file} <span style="opacity:0.7">(${d.size})</span></a>`;
}
