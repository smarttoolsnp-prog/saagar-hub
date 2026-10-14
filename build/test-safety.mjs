#!/usr/bin/env node
/* Headless tests for assets/safety.js — runs the real shipped file in a
   sandbox with minimal browser stubs, so the filter rules are actually
   exercised rather than assumed.  Run: node build/test-safety.mjs */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const code = readFileSync(ROOT + 'assets/safety.js', 'utf8');

function sandbox(storeInit = {}) {
  const mem = { ...storeInit };
  const el = () => ({
    className: '', style: { cssText: '' }, textContent: '', innerHTML: '',
    setAttribute() {}, appendChild() {}, remove() {}, focus() {},
    querySelector: () => null, querySelectorAll: () => [], onclick: null
  });
  const document = {
    readyState: 'complete', head: el(), body: el(),
    getElementById: () => null,
    createElement: el,
    addEventListener() {},
    querySelector: () => null
  };
  const ctx = {
    console,
    document,
    localStorage: {
      getItem: (k) => (k in mem ? mem[k] : null),
      setItem: (k, v) => { mem[k] = v; },
      removeItem: (k) => { delete mem[k]; }
    },
    location: { search: '' },
    setTimeout,
    Math,
    Date,
    RegExp,
    String
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return { api: ctx.SAAGAR_SAFETY, mem };
}

let pass = 0, fail = 0;
function t(name, cond, detail) {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  → ' + detail : '')); }
}

/* ---------- 1. filter ---------- */
console.log('\nfilter');
{
  const { api } = sandbox();
  const ok = (s) => api.check(s).ok;

  t('plain friendly message passes', ok('hello, want to play ludo?'));
  t('Nepali friendly message passes', ok('फेरि खेलौं!'));
  t('Roman Nepali friendly passes', ok('ramro khel thiyo'));

  const bad1 = api.check('you are a murkh');
  t('Roman Nepali insult is masked, not blocked', bad1.ok && bad1.warned, JSON.stringify(bad1));
  const bad2 = api.check('तँ मूर्ख होस्');
  t('Devanagari insult is masked', bad2.ok && bad2.warned, JSON.stringify(bad2));
  const bad3 = api.check('what the fuck');
  t('English profanity masked', bad3.ok && bad3.warned, JSON.stringify(bad3));
  const bad4 = api.check('you 4ssh0le');   /* leetspeak obfuscation */
  t('leetspeak obfuscation is caught', bad4.warned === true, JSON.stringify(bad4));

  const links = api.check('check http://freestuff.com now');
  t('links are blocked', links.ok === false && /link/.test(links.why), JSON.stringify(links));
  const phone = api.check('call me 9812345678');
  t('phone numbers blocked', phone.ok === false && /phone/.test(phone.why), JSON.stringify(phone));
  const bet = api.check('join my satta betting group');
  t('gambling offers blocked', bet.ok === false && /gambling/.test(bet.why), JSON.stringify(bet));
  const crypto = api.check('double your money with crypto');
  t('money schemes blocked', crypto.ok === false, JSON.stringify(crypto));

  /* false-positive guards: normal words that contain rude substrings */
  t('"class" is not a false positive', ok('I have a class at 10'));
  t('"assam" style words are not caught', ok('I am from Assam in India'));
  t('"analysis" is not caught', ok('my analysis of the game'));
  t('empty message rejected', api.check('   ').ok === false);
}

/* ---------- 2. rate limiting ---------- */
console.log('\nrate limiting');
{
  const { api } = sandbox();
  let blocked = 0, allowed = 0;
  for (let i = 0; i < 8; i++) {
    const g = api.allowSend();
    if (g.ok) { allowed++; api.noteSent('message ' + i); } else blocked++;
  }
  t('burst of 8 messages is limited', blocked >= 3, `allowed=${allowed} blocked=${blocked}`);
  t('first message always allowed', allowed >= 1);

  /* duplicate spam detection */
  const { api: api2 } = sandbox();
  let repeatsOk = [];
  for (let i = 0; i < 5; i++) repeatsOk.push(api2.noteSent('same text again'));
  t('4th+ identical message is rejected', repeatsOk[3] === false || repeatsOk[4] === false, JSON.stringify(repeatsOk));
}

/* ---------- 3. age gate + kill switches ---------- */
console.log('\nage gate and flags');
{
  const { api } = sandbox();
  t('no age set → not minor, voice allowed', api.isMinor() === false && api.voiceAllowed() === true);

  const { api: api2, mem } = sandbox({ 'saagar.ageGroup': '"u16"' });
  t('under-16 → voice refused', api2.voiceAllowed() === false);
  t('under-16 flagged as minor', api2.isMinor() === true);

  const { api: api3 } = sandbox({ 'saagar.flags': '{"chat":false,"voice":false}' });
  t('stored flags make chat off', api3.flag('chat') === false);
  t('stored flags make voice off', api3.voiceAllowed() === false);
  const room = sandbox().api;
  room.applyRoomFlags({ chat: false });
  t('per-room flag overrides global', room.flag('chat') === false);

  /* URL flags for testing without a deploy */
  const urlCtx = sandbox();
  urlCtx.api.setFlag('voice', false);
  t('setFlag persists a switch', urlCtx.api.flag('voice') === false);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
