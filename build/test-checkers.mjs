/* Verifies the Checkers rules engine by extracting it from games/checkers.html
   and simulating full games.   node build/test-checkers.mjs  */
import fs from 'node:fs';

const html = fs.readFileSync('games/checkers.html', 'utf8');
const start = html.indexOf('var EMPTY = 0;');
const end = html.indexOf('/* ============ bot ============ */');
if (start < 0 || end < 0) { console.error('could not locate engine'); process.exit(1); }
const engineSrc = html.slice(start, end);

const api = new Function(engineSrc + `
  return { newBoard, allMoves, applyMove, pieceMoves, side, isKing, r, c, dark };
`)();

const { newBoard, allMoves, applyMove } = api;

function playGame() {
  let b = newBoard();
  let turn = 1;
  let plies = 0;
  while (plies < 400) {
    const moves = allMoves(b, turn);
    if (!moves.length) return { winner: -turn, plies, counts: count(b) };
    const m = moves[Math.floor(Math.random() * moves.length)];
    applyMove(b, m);
    /* forced continuation after a jump */
    let again = moves.filter(x => x.from === m.from && x.to === m.to)[0];
    if (m.jump != null && again) {
      let cur = b, side2 = turn, guard = 0;
      while (guard++ < 12) {
        const more = allMoves(cur, side2, m.to).filter(x => x.jump != null);
        if (!more.length) break;
        applyMove(cur, more[0]);
      }
      b = cur;
    }
    turn = -turn;
    plies++;
    if (count(b)[0] === 0 || count(b)[1] === 0) return { winner: count(b)[0] === 0 ? -1 : 1, plies, counts: count(b) };
  }
  return { winner: 0, plies, counts: count(b) };
}
function count(b) { let r1 = 0, b1 = 0; b.forEach(p => { if (p > 0) r1++; else if (p < 0) b1++; }); return [r1, b1]; }

/* --- structural checks --- */
const b0 = newBoard();
const checks = [];
checks.push(['64 squares', b0.length === 64]);
checks.push(['24 pieces at start', count(b0)[0] === 12 && count(b0)[1] === 12]);
checks.push(['pieces only on dark squares', b0.every((p, i) => !p || api.dark(i))]);
const opening = allMoves(b0, 1);
checks.push(['red has 7 opening moves', opening.length === 7]);
checks.push(['black has 7 opening moves', allMoves(b0, -1).length === 7]);
checks.push(['no captures at the start', allMoves(b0, 1).every(m => m.jump == null)]);

/* kings move both ways */
const kb = new Array(64).fill(0);
kb[27] = 2;                        /* r3 c3 */
checks.push(['king has 4 diagonal moves', api.pieceMoves(kb, 27, false).length === 4]);

/* forced capture */
const cb = new Array(64).fill(0);
cb[40] = 1; cb[33] = -1;           /* red r5c0, black r4c1 */
const forced = allMoves(cb, 1);
checks.push(['capture is compulsory', forced.length === 1 && forced[0].jump === 33]);
const nb = cb.slice(); applyMove(nb, forced[0]);
checks.push(['jump removes the piece', nb[33] === 0 && nb[26] === 1]);

/* promotion */
const pb = new Array(64).fill(0);
pb[9] = 1;                         /* red r1c1 */
const mv = allMoves(pb, 1)[0];
applyMove(pb, mv);
checks.push(['red promotes to king on row 0', pb[2] === 2 || pb[0] === 2]);
const pbb = new Array(64).fill(0);
pbb[54] = -1;                      /* black r6c6 */
applyMove(pbb, allMoves(pbb, -1)[0]);
checks.push(['black promotes to king on row 7', pbb.slice(56).some(p => p === -2)]);

let bad = 0;
for (const [name, ok] of checks) { if (!ok) { bad++; console.log('  FAIL ' + name); } else console.log('  ok   ' + name); }

/* --- simulate games --- */
let wins = { 1: 0, '-1': 0, 0: 0 }, maxPlies = 0;
for (let i = 0; i < 300; i++) {
  const res = playGame();
  wins[res.winner]++;
  maxPlies = Math.max(maxPlies, res.plies);
}
console.log('\nsimulated 300 games — red ' + wins[1] + ', black ' + wins[-1] + ', drawn ' + wins[0] + ', longest ' + maxPlies + ' plies');
console.log(bad ? '\nFAILURES: ' + bad : '\nall rules checks passed');
process.exit(bad ? 1 : 0);
