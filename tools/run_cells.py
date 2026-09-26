"""Run DAA lab code cells like a notebook and report their output as JSON.

Called by tools/build-daa-outputs.mjs:  python run_cells.py <cells.json> <site-root>
Each lab's cells share one namespace, run from daa/datasets/ (like /content in
Colab). The value of a cell's last expression is shown, as Jupyter does.
Charts are saved to daa/img/<lab>-<cell>-<n>.png.
"""
import ast
import contextlib
import io
import json
import os
import random
import shutil
import sys
import tempfile
import traceback

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt  # noqa: E402


def long_path(p):
    """Windows paths over 260 characters need the \\\\?\\ prefix."""
    p = os.path.abspath(p)
    return '\\\\?\\' + p if os.name == 'nt' and not p.startswith('\\\\?\\') else p


jobs = json.load(open(long_path(sys.argv[1]), encoding='utf-8'))
root = sys.argv[2]
img_dir = long_path(os.path.join(root, 'daa', 'img'))
shutil.rmtree(img_dir, ignore_errors=True)   # charts are regenerated from scratch
os.makedirs(img_dir, exist_ok=True)

# Run from a short temporary folder holding copies of the datasets, so the
# cells' relative paths (e.g. 'titanic.csv') work however deep the repo is.
work_dir = tempfile.mkdtemp(prefix='daa-cells-')
data_dir = os.path.join(work_dir, 'data')
chart_dir = os.path.join(work_dir, 'charts')
shutil.copytree(long_path(os.path.join(root, 'daa', 'datasets')), data_dir)
os.makedirs(chart_dir)

try:
    import pandas as pd
    pd.set_option('display.width', 100)
    pd.set_option('display.max_columns', 12)
except ImportError:
    pass


def run_cell(src, ns, label):
    images = []

    def show(*_a, **_k):
        for num in plt.get_fignums():
            fig = plt.figure(num)
            name = f'{label}-{len(images) + 1}.png'
            fig.savefig(os.path.join(chart_dir, name), dpi=80, bbox_inches='tight')
            shutil.copyfile(os.path.join(chart_dir, name), os.path.join(img_dir, name))
            images.append('img/' + name)
        plt.close('all')

    plt.show = show
    buf = io.StringIO()
    error = None
    tree = ast.parse(src)
    last = tree.body[-1] if tree.body and isinstance(tree.body[-1], ast.Expr) else None
    body = tree.body[:-1] if last else tree.body
    with contextlib.redirect_stdout(buf):
        try:
            exec(compile(ast.Module(body=body, type_ignores=[]), label, 'exec'), ns)
            if last is not None:
                value = eval(compile(ast.Expression(last.value), label, 'eval'), ns)
                if value is not None:
                    print(repr(value))
        except Exception:
            error = traceback.format_exc(limit=0).strip()
    if plt.get_fignums():
        show()
    text = buf.getvalue().rstrip('\n')
    return text, images, error


def display(*objs):
    """Stand-in for IPython's display(): show each object's text form."""
    for obj in objs:
        print(repr(obj))
        print()


results = {}
for lab, cells in jobs.items():
    os.chdir(data_dir)
    random.seed(42)
    ns = {'__name__': '__main__', 'display': display}
    out = []
    for i, cell in enumerate(cells):
        text, images, error = run_cell(cell['content'], ns, f'{lab}-{i + 1}')
        entry = {'text': text, 'images': images}
        if error:
            entry['text'] = (text + '\n' if text else '') + error
            if not cell.get('expectError'):
                entry['error'] = error
        out.append(entry)
    results[lab] = out

os.chdir(tempfile.gettempdir())
shutil.rmtree(work_dir, ignore_errors=True)
sys.stdout.write(json.dumps(results))
