// Kthen fragmentet HTML (hero, seksionet, footer) nga e njëjta logjikë që përdor shfletuesi.
// Përdorim: node scripts/render-fragments.js <cats.json>   (shkruan JSON në stdout)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const defaults = JSON.parse(fs.readFileSync(path.join(root, 'src', 'home-defaults.json'), 'utf8'));
const cats = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
// package.json është "type":"module" → ngarko site-render.js (UMD) në një sandbox
const vm = require('vm');
const sandbox = { module: { exports: {} }, globalThis: {} };
sandbox.globalThis = sandbox;
vm.runInNewContext(fs.readFileSync(path.join(root, 'js', 'site-render.js'), 'utf8'), sandbox);
const S = sandbox.module.exports;

const city = defaults.cities[0];
const ctx = { city: city.name, minutes: city.minutes, hours: city.hours, freeThreshold: city.freeThreshold };
const cfg = S.deepFill(S.buildConfig(defaults, {}), ctx);
const contact = S.deepFill(S.contactFrom(defaults, {}, city), ctx);
const hero = S.F.hero(S.deepFill(S.activeHero(defaults.hero), ctx));

const out = {
  heroSlides: hero.slides,
  heroDots: hero.dots,
  strip: S.F.strip(cfg),
  marquee: S.F.marquee(cfg),
  categories: S.F.categories(cfg.sections.categories),
  offers: S.F.offers(cfg.sections.offers),
  best: S.F.best(cfg.sections.best),
  steps: S.F.steps(cfg.sections.steps),
  why: S.F.why(cfg.sections.why),
  cta: S.F.cta(cfg.sections.cta, contact),
  footer: S.F.footer(contact, cats),
  order: Object.fromEntries(Object.entries(cfg.sections).map(([k, v]) => [k, v.order])),
};
process.stdout.write(JSON.stringify(out));
