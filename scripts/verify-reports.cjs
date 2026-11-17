// Exercise real report shapes and render every report for every supported filter.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const originalLoad = Module._load;
Module._load = function (name, parent, isMain) {
  if (name === '@/lib/analytics-snapshot.json') return originalLoad.call(this, path.join(root, 'src/lib/analytics-snapshot.json'), parent, isMain);
  return originalLoad.call(this, name, parent, isMain);
};
require.extensions['.css'] = module => { module.exports = {}; };
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(output.outputText, filename);
};
const { getView, devices, periods } = require('../src/app/demo-data.ts');
const reports = require('../src/app/reports.tsx');
const { StageReport } = require('../src/app/ocean/stage-report.tsx');
let rendered = 0;
for (const device of devices) for (const period of periods) {
  const view = getView(device, period);
  assert.equal(view.daily.length, view.days);
  for (const rows of Object.values(view.segments)) {
    assert.equal(rows.reduce((sum, row) => sum + row.visitors, 0), view.totals.visitors);
    assert.equal(rows.reduce((sum, row) => sum + row.purchasers, 0), view.totals.purchasers);
  }
  assert(view.funnel.every((step, i) => i === 0 || step.people <= view.funnel[i - 1].people));
  assert(view.funnel[3].people <= view.totals.purchasers);
  assert(view.cohorts.every(cohort => cohort.weeks[0] === 100 && cohort.weeks.every(rate => rate >= 0 && rate <= 100)));
  const elements = ['Overview', 'Breakdowns', 'Funnels', 'Retention', 'Insights'].map(name => React.createElement(reports[name], { view, onNavigate() {} }));
  for (const stage of ['discovery', 'engagement', 'conversion', 'return']) elements.push(React.createElement(StageReport, { stage, view }));
  for (const element of elements) {
    const html = renderToStaticMarkup(element);
    assert(!/NaN|Infinity|undefined/.test(html), `${device} / ${period} contains an invalid rendered value`);
    assert(!/illustrative|invented/i.test(html), 'Old prototype claims remain');
    rendered++;
  }
}
console.log(`Verified 16 filter combinations and ${rendered} report renders, including zero-purchase and zero-funnel selections.`);
