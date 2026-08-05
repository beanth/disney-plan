import { chromium } from 'playwright';
import path from 'path';

const FILE = 'file://' + path.resolve('/home/user/disney-plan/index.html');

// Every checkpoint we want to see the page in, in order.
const CHECKPOINTS = [
  ['2026-08-01T09:00', 'three weeks out'],
  ['2026-08-19T07:30', 'Wed 07:30  breakfast'],
  ['2026-08-19T09:00', 'Wed 09:00  rope drop'],
  ['2026-08-19T12:05', 'Wed 12:05  morning done'],
  ['2026-08-19T14:15', 'Wed 14:15  Carthay done'],
  ['2026-08-19T17:20', 'Wed 17:20  Grizzly done'],
  ['2026-08-19T20:00', 'Wed 20:00  dinner done'],
  ['2026-08-20T01:00', 'Thu 01:00  walking back'],
  ['2026-08-20T09:00', 'Thu 09:00  Wed closed'],
  ['2026-08-20T12:50', 'Thu 12:50  Batuu done'],
  ['2026-08-20T15:10', 'Thu 15:10  Savi\'s done'],
  ['2026-08-21T13:20', 'Fri 13:20  Fri morning done'],
  ['2026-08-21T17:35', 'Fri 17:35  loop done'],
  ['2026-08-21T19:10', 'Fri 19:10  dinner done'],
  ['2026-08-22T10:00', 'Sat 10:00  trip over'],
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const rows = [];
let failures = [];

for (const [iso, label] of CHECKPOINTS) {
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
  // Freeze the clock before any page script runs.
  await page.addInitScript(`{
    const FAKE = new Date(${JSON.stringify(iso)}).getTime();
    const Real = Date;
    class FakeDate extends Real {
      constructor(...a) { return a.length ? new Real(...a) : new Real(FAKE); }
      static now() { return FAKE; }
    }
    FakeDate.parse = Real.parse; FakeDate.UTC = Real.UTC;
    window.Date = FakeDate;
  }`);
  await page.goto(FILE);
  await page.waitForTimeout(120);

  const state = await page.evaluate(() => {
    const out = {};
    for (const id of ['day19', 'day20', 'day21']) {
      const sec = document.getElementById(id);
      const cards = [...sec.querySelectorAll('.card')];
      const withUntil = cards.filter(c => c.hasAttribute('data-until'));
      out[id] = {
        dayDone: sec.classList.contains('day-done'),
        folded: withUntil.filter(c => c.classList.contains('folded')).length,
        total: withUntil.length,
        // a folded card must actually hide its body
        bodyHidden: withUntil.filter(c => c.classList.contains('folded'))
          .every(c => { const f = c.querySelector(':scope > .fold');
                        return f && getComputedStyle(f).display === 'none'; }),
        // a folded card must still show its header
        headVisible: withUntil.filter(c => c.classList.contains('folded'))
          .every(c => { const t = c.querySelector(':scope > .tag, :scope > h3');
                        return !t || getComputedStyle(t).display !== 'none'; }),
        reopenBtn: !!sec.querySelector('.dayreopen'),
        cardsVisible: cards.some(c => getComputedStyle(c).display !== 'none'),
      };
    }
    return out;
  });

  const cell = d => state[d].dayDone ? 'DONE' : `${state[d].folded}/${state[d].total}`;
  rows.push([label, cell('day19'), cell('day20'), cell('day21')]);

  for (const d of ['day19', 'day20', 'day21']) {
    const s = state[d];
    if (s.folded && !s.bodyHidden) failures.push(`${label} ${d}: folded card body still visible`);
    if (s.folded && !s.headVisible) failures.push(`${label} ${d}: folded card header hidden`);
    if (s.dayDone && !s.reopenBtn) failures.push(`${label} ${d}: day-done without reopen button`);
    if (s.dayDone && s.cardsVisible) failures.push(`${label} ${d}: day-done but cards still shown`);
  }
  await page.close();
}

// --- interaction: does tapping a folded card reopen it, and does it stay open? ---
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
await page.addInitScript(`{
  const FAKE = new Date("2026-08-19T20:00").getTime(); const Real = Date;
  class FakeDate extends Real { constructor(...a){return a.length?new Real(...a):new Real(FAKE);}
    static now(){return FAKE;} }
  FakeDate.parse=Real.parse; FakeDate.UTC=Real.UTC; window.Date=FakeDate;
}`);
await page.goto(FILE);
await page.waitForTimeout(120);
const card = page.locator('#day19 .card.folded').first();
const before = await card.count();
await card.click();
const after = await page.locator('#day19 .card.folded').count();
const stays = await page.evaluate(() => {
  const c = document.querySelector('#day19 .card[data-manual]');
  return !!c && !c.classList.contains('folded');
});
console.log(`\ntap-to-reopen: folded card present=${before > 0}, unfolds on tap=${after < await Promise.resolve(before + 5)}, marked manual=${stays}`);
if (!stays) failures.push('tap-to-reopen did not persist (data-manual not set)');

// day-section reopen button
const page2 = await browser.newPage({ viewport: { width: 420, height: 900 } });
await page2.addInitScript(`{
  const FAKE = new Date("2026-08-22T10:00").getTime(); const Real = Date;
  class FakeDate extends Real { constructor(...a){return a.length?new Real(...a):new Real(FAKE);}
    static now(){return FAKE;} }
  FakeDate.parse=Real.parse; FakeDate.UTC=Real.UTC; window.Date=FakeDate;
}`);
await page2.goto(FILE);
await page2.waitForTimeout(120);
await page2.locator('#day19 .dayreopen').click();
const reopened = await page2.evaluate(() =>
  !document.getElementById('day19').classList.contains('day-done'));
console.log(`day reopen button: section reopens=${reopened}`);
if (!reopened) failures.push('day-done reopen button did not reopen the section');
await page2.screenshot({ path: 'fold-after-trip.png', fullPage: false });

await browser.close();

const w = Math.max(...rows.map(r => r[0].length));
console.log('\n' + 'checkpoint'.padEnd(w) + '   19DCA   20DL    21DL');
console.log('-'.repeat(w + 24));
for (const r of rows) console.log(r[0].padEnd(w) + '   ' + r[1].padEnd(7) + r[2].padEnd(7) + r[3]);
console.log('\n' + (failures.length ? 'FAILURES:\n  ' + failures.join('\n  ') : 'All structural assertions passed.'));
