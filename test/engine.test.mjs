import * as E from '../engine.js';
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } else console.log('ok', m); };
let g = E.newGame('ABCD', 'a');
for (const [id, n] of [['a', 'Аня'], ['b', 'Боря'], ['c', 'Вика']]) g = E.apply(g, id, { type: 'join', name: n }, rnd);
ok(Object.keys(g.players).length === 3, 'трое в лобби');
ok(E.apply(g, 'b', { type: 'start' }, rnd).error, 'не-хозяин не стартует');
g = E.apply(g, 'a', { type: 'start' }, rnd);
ok(g.phase === 'play' && g.order.length === 3, 'старт');
const profs = new Set(g.order.map((id) => g.players[id].ps.prof));
ok(profs.size === 3, 'разные профессии');
for (const id of g.order) { const ps = g.players[id].ps, p = E.prof(ps.prof); ok(E.expenses(ps) === p.expenses, `расходы ${p.name} = ${p.expenses}`); }
ok(E.apply(g, 'b', { type: 'roll' }, rnd).error, 'чужой ход нельзя');
// сыграем 400 ходов случайно разумной стратегией
let freeSeen = false, bankrupt = 0, turnsLog = [], T0 = 0;
for (let t = 0; t < 1500 && g.phase === 'play'; t++) {
  const id = E.currentId(g);
  let r = E.apply(g, id, { type: 'roll', two: true }, rnd);
  if (r.error) { console.error('roll error', r.error); process.exitCode = 1; break; }
  g = r;
  let guard = 0;
  while (g.pending && g.pending.by === id && guard++ < 5) {
    const p = g.pending, ps = g.players[id].ps;
    let a = { type: 'resolve', choice: 'ok' };
    if (p.type === 'deal') a.choice = ps.cash > 8000 ? 'big' : 'small';
    if (p.type === 'offer') a.choice = 'buy';
    if (p.type === 'stock') { a.choice = 'stockBuy'; a.qty = Math.floor(ps.cash / 4 / g.stocks[p.stock]); if (!a.qty) a.choice = 'skip'; }
    if (p.type === 'scam') a.choice = 'skip';
    if (p.type === 'charity') a.choice = ps.cash > p.amount * 3 ? 'buy' : 'skip';
    if (p.type === 'buyer') { a.choice = 'sell'; a.asset = ps.assets.findIndex((x) => E.buyerWants(p, x)); }
    r = E.apply(g, id, a, rnd);
    if (r.error && p.type === 'offer') { const L = E.maxLoan(ps, g.stocks); const need = Math.ceil((E.deal(p.deal).down - ps.cash) / 1000) * 1000; if (need <= L) { g = E.apply(g, id, { type: 'loan', amount: need }, rnd); r = E.apply(g, id, a, rnd); } if (r.error) r = E.apply(g, id, { type: 'resolve', choice: 'skip' }, rnd); }
    if (r.error) { console.error('resolve error', p.type, r.error); process.exitCode = 1; break; }
    g = r;
  }
  for (const pid of g.order) { const P = g.players[pid]; const d = E.DREAMS.find((x) => x.id === P.dream); if (P.ps.free && P.ps.cash >= d.price) { const r2 = E.apply(g, pid, { type: 'buyDream' }, rnd); if (r2.error) { console.error(r2.error); process.exitCode = 1; } else g = r2; break; } }
  for (const pid of g.order) if (g.players[pid].ps.restarts) bankrupt = Math.max(bankrupt, g.players[pid].ps.restarts);
  if (g.winner) freeSeen = true;
  if (t % 50 === 0) turnsLog.push(t);
}
for (const id of g.order) { const ps = g.players[id].ps; console.log(g.players[id].name, E.prof(ps.prof).name, 'месяцев', ps.months, 'свободен', ps.free, 'на месяце', ps.freeAt, 'нал', ps.cash, 'пассив', E.passive(ps, g.stocks), 'расх', E.expenses(ps), 'активов', ps.assets.length, 'банкротств', ps.restarts || 0); }
ok(g.phase === 'end' && g.winner, 'кто-то купил мечту: ' + g.players[g.winner]?.name + ' ходов всего ' + g.log.length);
for (const id of g.order) console.log(g.players[id].name, 'мечта', g.players[id].dream, 'свободен на', g.players[id].ps.freeAt, 'мечта на', g.players[id].ps.dreamAt);
ok(JSON.stringify(g).length < 60000, 'состояние компактное: ' + JSON.stringify(g).length);
