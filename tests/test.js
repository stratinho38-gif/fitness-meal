const fs = require('fs');
const html = fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const cut = script.indexOf('/* ---------- Render');
const logic = script.slice(0, cut);
const factory = new Function(logic + '\n;return {sanitizeState, clampCat, escapeHtml, fmtCost, emptyState, loadState, persist, DATA, LIMITS, getState:()=>state};');

let store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k,v) => { if (global.__quotaFail) throw new Error('QuotaExceeded'); store[k]=String(v); },
  removeItem: k => { delete store[k]; }
};
global.document = { getElementById: () => ({ textContent:'', className:'' }) };

let pass=0, fail=0;
function t(name, cond){ if(cond){pass++;} else {fail++; console.log('FAIL: '+name);} }
function fresh(){ store={}; global.__quotaFail=false; return factory(); }

let m = fresh();
t('garbage null', JSON.stringify(m.sanitizeState(null)) === JSON.stringify(m.emptyState()));
t('garbage array', m.sanitizeState([1,2]).custom.length === 0);
t('garbage string', m.sanitizeState("hack").version === 4);

let s = m.sanitizeState({custom:[{uid:'x',cat:0,item:'A'.repeat(500),qty:'B'.repeat(500),note:'C'.repeat(500)}]});
t('item trunc 80', s.custom[0].item.length === 80);
t('qty trunc 60', s.custom[0].qty.length === 60);
t('note trunc 120', s.custom[0].note.length === 120);

t('clampCat 99', m.clampCat(99) === m.DATA.length-1);
t('clampCat abc', m.clampCat('abc') === m.DATA.length-1);
t('clampCat 2', m.clampCat('2') === 2);
t('clampCat neg', m.clampCat(-5) === m.DATA.length-1);

s = m.sanitizeState({costs:{a:-1, b:99999, c:'3.456', d:'x', e:2.5}});
t('cost neg dropped', s.costs.a === undefined);
t('cost huge dropped', s.costs.b === undefined);
t('cost string parsed+rounded', s.costs.c === 3.46);
t('cost NaN dropped', s.costs.d === undefined);
t('cost ok', s.costs.e === 2.5);

s = m.sanitizeState({checked:{a:true,b:false,c:'yes'}, removed:{x:true,y:0}});
t('checked only true', Object.keys(s.checked).length===1 && s.checked.a===true);
t('removed only true', Object.keys(s.removed).length===1);

t('escapeHtml', m.escapeHtml('<img src=x onerror="a">&\'') === '&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;');

// Migration from v3
store = {};
store['lista_psonon_v3'] = JSON.stringify({'b|kreas|0':true});
store['lista_psonon_custom_v3'] = JSON.stringify([{uid:'u1',cat:1,item:'Γάλα αμυγδάλου',qty:'1λ',note:''}]);
store['lista_psonon_removed_v3'] = JSON.stringify({'b|gala|2':true});
m = factory();
t('migration checked', m.getState().checked['b|kreas|0']===true);
t('migration custom', m.getState().custom.length===1 && m.getState().custom[0].item==='Γάλα αμυγδάλου');
t('migration removed', m.getState().removed['b|gala|2']===true);
t('migration wrote v4', store['lista_psonon_v4'] !== undefined);
t('legacy keys kept', store['lista_psonon_v3'] !== undefined);

// Corrupted v4
store = {'lista_psonon_v4': '{{{not json'};
m = factory();
t('corrupt v4 → empty state', m.getState().version===4 && m.getState().custom.length===0);

// persist failure
m = fresh(); global.__quotaFail = true;
t('persist quota → false', m.persist() === false);
global.__quotaFail = false;

// v4 roundtrip
m = fresh();
m.getState().checked['b|kreas|0']=true; m.getState().costs['b|kreas|0']=12.5; m.persist();
m = factory();
t('v4 roundtrip', m.getState().checked['b|kreas|0']===true && m.getState().costs['b|kreas|0']===12.5);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
