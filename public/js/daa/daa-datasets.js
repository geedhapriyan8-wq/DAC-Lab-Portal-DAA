/* ============================================================
   Data Analytics Academy — Dataset catalogue (daa-datasets.js)
   Files live in /daa/datasets/. Lab steps reference them by key.
   ============================================================ */

const DAADatasets = {
  retail:      { file: 'retail_sales_dataset.csv',     label: 'Retail sales',            size: '51 KB',  usedIn: 'EDA Lab 1' },
  cars:        { file: 'car_sales_data.csv',           label: 'Car sales',               size: '1.9 MB', usedIn: 'EDA Lab 2' },
  ricciardo:   { file: 'daniel_ricciardo.csv',         label: 'Daniel Ricciardo F1',     size: '21 KB',  usedIn: 'EDA Lab 2' },
  recruitment: { file: 'recruitment_bias_updated.csv', label: 'Recruitment bias',        size: '30 KB',  usedIn: 'AI Ethics Lab 1' },
  boston:      { file: 'Boston.csv',                   label: 'Boston housing',          size: '34 KB',  usedIn: 'Intro to ML Lab 1' },
  titanic:     { file: 'titanic.csv',                  label: 'Titanic passengers',      size: '60 KB',  usedIn: 'ML Algorithms Lab 1' },
};

/* Path from a page in /daa/ to a dataset file */
function daaDatasetUrl(key) {
  const d = DAADatasets[key];
  return d ? `datasets/${encodeURIComponent(d.file)}` : '#';
}

/* A download button for a dataset, used by the dashboard and lab steps */
function daaDatasetButton(key) {
  const d = DAADatasets[key];
  if (!d) return '';
  return `<a class="daa-resource-btn" href="${daaDatasetUrl(key)}" download="${d.file}">⬇️ ${d.file} <span style="opacity:0.7">(${d.size})</span></a>`;
}
