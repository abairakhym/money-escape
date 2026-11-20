import * as E from './engine.js';
import { connect, online } from './net.js';

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = E.fmt;
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

let T = null, me = null, g = null, code = null;
let busy = false, qtyFor = -1, lastNoteN = null, noteQ = [];
const shownPos = {};
let lastDiceN = 0, lastLogN = null, lastFreedN = 0, lastBankruptN = 0, sheetKey = '', sheetMode = null, qty = 1;

const app = $('#app');
const sheet = $('#sheet');

// ---------- общие помощники ----------
function toast(text, bad) {
  const t = document.createElement('div');
  t.className = 'toast' + (bad ? ' bad' : '');
  t.textContent = text;
  $('#toasts').append(t);
  setTimeout(() => t.remove(), bad ? 4200 : 3200);
}
async function act(a) {
  if (busy) return;
  busy = true;
  try {
    const r = await T.act(a);
    if (r.error) toast(r.error, true);
    return r;
  } catch (e) {
    toast('Нет связи. Проверь интернет.', true);
    return { error: e.message };
  } finally { busy = false; }
}
const myP = () => g?.players?.[me];
const myPS = () => myP()?.ps;
const nameOf = (id) => esc(g.players[id]?.name || 'Игрок');
const dreamOf = (id) => E.DREAMS.find((d) => d.id === g.players[id]?.dream);
const isHost = () => g?.host === me;
function link() { return location.origin + location.pathname + '?r=' + code; }

function confetti() {
  const box = document.createElement('div');
  box.className = 'confetti';
  const colors = ['#16A06A', '#F2B705', '#2F7DE1', '#E5484D', '#8B5CF6', '#EC4899'];
  for (let i = 0; i < 70; i++) {
    const c = document.createElement('i');
    c.style.left = Math.random() * 100 + '%';
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 1.8 + Math.random() * 1.8 + 's';
    c.style.animationDelay = Math.random() * 0.6 + 's';
    box.append(c);
  }
  document.body.append(box);
  setTimeout(() => box.remove(), 4500);
}

// ---------- главная ----------
function renderHome(prefill = '') {
  closeSheet();
  const name = store.get('me-name') || '';
  app.innerHTML = `
    <div class="hero">
      <div class="coins">💸🏃‍♂️💨</div>
      <h1 class="logo">Money <span class="m">Escape</span></h1>
      <p class="muted">Начни с обычной работы, покупай то, что приносит деньги, и сбеги из денежной гонки первым.</p>
    </div>
    ${online ? '' : '<div class="demo">⚠️ Демо-режим: онлайн ещё не подключён, играть можно только во вкладках этого браузера.</div>'}
    <div class="card stack">
      <label class="small muted" for="nm">Как тебя зовут?</label>
      <input id="nm" class="field" maxlength="16" placeholder="Имя" value="${esc(name)}" autocomplete="nickname">
      <button id="create" class="btn primary big wide">Создать комнату</button>
      <div class="or">или войди к другу по коду</div>
      <div class="row">
        <input id="cd" class="field code grow" maxlength="4" placeholder="КОД" value="${esc(prefill)}" autocomplete="off">
        <button id="join" class="btn gold">Войти</button>
      </div>
    </div>
    <details class="card rules">
      <summary>Как играть</summary>
      <p>🎲 Бросай кубик и иди по «Улице жизни». Каждая клетка — событие.</p>
      <p>💰 Проходишь «Зарплату» — получаешь зарплату минус расходы.</p>
      <p>🏠 «Сделка» — можно купить квартиру, ларёк или акции. Они приносят деньги каждый месяц.</p>
      <p>💸 Траты, 👶 ребёнок и 💼 увольнение мешают копить.</p>
      <p>📈 На бирже можно купить и продать акции в любой момент. Цены прыгают после каждого броска.</p>
      <p>🏦 В банке можно взять кредит, но за него платишь каждый месяц.</p>
      <p>🏁 Ты свободен, когда <b>пассивный доход больше расходов</b>.</p>
      <p>🏆 Потом накопи на свою мечту и купи её. Кто первым — победил!</p>
    </details>`;
  const nm = $('#nm'), cd = $('#cd');
  const needName = () => {
    const v = nm.value.trim();
    if (!v) { toast('Сначала напиши имя', true); nm.focus(); return null; }
    store.set('me-name', v);
    return v;
  };
  $('#create').onclick = async () => {
    const n = needName(); if (!n) return;
    $('#create').disabled = true;
    try { const c = await T.create(); await enter(c, n); } catch (e) { toast(e.message, true); $('#create').disabled = false; }
  };
  $('#join').onclick = async () => {
    const n = needName(); if (!n) return;
    const c = cd.value.trim().toUpperCase();
    if (c.length !== 4) return toast('Код — это 4 буквы или цифры', true);
    if (!(await T.exists(c))) return toast('Нет такой комнаты. Проверь код.', true);
    await enter(c, n);
  };
  cd.oninput = () => (cd.value = cd.value.toUpperCase());
}

async function enter(c, name) {
  code = c;
  store.set('me-room', c);
  history.replaceState(null, '', '?r=' + c);
  let joined = false;
  T.watch(c, async (state) => {
    g = state;
    if (!g) { toast('Комната закрыта', true); store.set('me-room', ''); return renderHome(); }
    if (!joined && g.phase === 'lobby' && !g.players[me]) { joined = true; await act({ type: 'join', name }); return; }
    joined = true;
    render();
  });
}

// ---------- лобби ----------
function renderLobby() {
  closeSheet();
  const ids = Object.keys(g.players).sort((a, b) => g.players[a].joined - g.players[b].joined);
  const mine = myP();
  app.innerHTML = `
    <div class="card" style="text-align:center">
      <div class="small muted">Код комнаты</div>
      <div class="roomcode">${esc(code)}</div>
      <div class="btns" style="margin-top:10px"><button id="share" class="btn">📤 Позвать друзей</button></div>
    </div>
    <div class="card">
      <h3 style="font-size:16px;margin-bottom:6px">Игроки · ${ids.length}/6</h3>
      <ul class="players">${ids.map((id) => {
        const p = g.players[id], d = dreamOf(id);
        return `<li style="color:${p.color}"><span class="dot" style="background:${p.color}"></span>
          <span class="grow" style="color:var(--ink);font-weight:600">${esc(p.name)}${id === me ? ' <span class="muted small">(ты)</span>' : ''}</span>
          ${d ? `<span title="${esc(d.name)}">${d.icon}</span>` : ''}
          ${id === g.host ? '<span class="tag host">хозяин</span>' : ''}</li>`;
      }).join('')}</ul>
    </div>
    ${mine ? `<div class="card">
      <h3 style="font-size:16px;margin-bottom:10px">Твоя мечта</h3>
      <div class="dreams">${E.DREAMS.map((d) => `<button data-d="${d.id}" class="${mine.dream === d.id ? 'on' : ''}"><span>${d.icon}</span>${esc(d.name)}<i class="muted" style="font-style:normal">${fmt(d.price)}</i></button>`).join('')}</div>
      <p class="small muted" style="margin:10px 0 0">Сначала выберись из денежной гонки, потом накопи на мечту. Кто первым купит мечту — победил. Дорогая мечта — сложнее! Профессию раздадут случайно.</p>
    </div>` : '<div class="card muted">Игра уже началась без тебя. Подожди следующую.</div>'}
    ${isHost()
      ? `<button id="start" class="btn primary big wide">Старт ▶</button>
         <p class="small muted" style="text-align:center">Нажми, когда все друзья зайдут.</p>`
      : `<div class="card" style="text-align:center"><div class="boot" style="margin:0;font-size:34px">⏳</div>Ждём, пока <b>${nameOf(g.host)}</b> нажмёт «Старт»</div>`}
    <button id="leave" class="btn ghost wide">Выйти из комнаты</button>`;
  $('#share').onclick = share;
  app.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => act({ type: 'dream', dream: b.dataset.d })));
  $('#start') && ($('#start').onclick = () => act({ type: 'start' }));
  $('#leave').onclick = async () => { await act({ type: 'leave' }); leaveRoom(); };
}
async function share() {
  const url = link();
  try {
    if (navigator.share) await navigator.share({ title: 'Money Escape', text: `Заходи играть! Код комнаты: ${code}`, url });
    else { await navigator.clipboard.writeText(url); toast('Ссылка скопирована — отправь друзьям'); }
  } catch {}
}
function leaveRoom() {
  store.set('me-room', '');
  history.replaceState(null, '', location.pathname);
  code = null; g = null;
  renderHome();
}

// ---------- поле ----------
function cellXY(i) {
  if (i <= 6) return [i, 0];
  if (i <= 12) return [6, i - 6];
  if (i <= 18) return [18 - i, 6];
  return [0, 24 - i];
}
function boardHTML() {
  const cells = E.BOARD.map((t, i) => {
    const [c, r] = cellXY(i), info = E.CELL[t];
    return `<div class="cell c-${t}" style="grid-column:${c + 1};grid-row:${r + 1}" title="${info.name}">${info.icon}<small>${info.name}</small></div>`;
  }).join('');
  return `<div class="board" id="board">${cells}<div class="center" id="center"></div></div>`;
}
function placeTokens() {
  const board = $('#board'); if (!board) return;
  board.querySelectorAll('.token').forEach((t) => t.remove());
  const at = {};
  for (const id of g.order) {
    const pos = shownPos[id] ?? g.players[id].ps.pos;
    const k = (at[pos] = (at[pos] || 0) + 1) - 1;
    const [c, r] = cellXY(pos);
    const t = document.createElement('i');
    t.className = 'token' + (id === me ? ' me' : '');
    t.id = 'tok-' + id;
    t.style.background = g.players[id].color;
    t.style.left = `calc(6px + (100% - 12px) * ${(c + 0.5) / 7} - 2.1% + ${(k % 3 - 1) * 7}px)`;
    t.style.top = `calc(6px + (100% - 12px) * ${(r + 0.5) / 7} - 2.1% + ${(Math.floor(k / 3) * 2 - 1) * 6 + 8}px)`;
    board.append(t);
  }
}
let animating = false;
function animateMoves(done) {
  const moving = g.order.filter((id) => shownPos[id] !== undefined && shownPos[id] !== g.players[id].ps.pos);
  for (const id of g.order) if (shownPos[id] === undefined) shownPos[id] = g.players[id].ps.pos;
  if (!moving.length) { animating = false; placeTokens(); return done(); }
  animating = true;
  const step = () => {
    let left = false;
    for (const id of moving) {
      if (shownPos[id] !== g.players[id].ps.pos) { shownPos[id] = (shownPos[id] + 1) % 24; left = true; }
    }
    placeTokens();
    if (left) setTimeout(step, 210);
    else { animating = false; done(); }
  };
  setTimeout(step, 550);
}

function finances(id) {
  const ps = g.players[id].ps, p = E.prof(ps.prof);
  const pas = E.passive(ps, g.stocks), exp = E.expenses(ps), flow = E.cashflow(ps, g.stocks);
  const d = dreamOf(id);
  return { ps, p, pas, exp, flow, d, pct: Math.min(100, Math.round((pas / Math.max(1, exp)) * 100)), dpct: Math.max(0, Math.min(100, Math.round((ps.cash / d.price) * 100))) };
}

function renderGame() {
  const cur = E.currentId(g);
  const meIn = !!myPS();
  const late = Date.now() - (g.turnAt || 0) > 45000;
  const f = meIn ? finances(me) : null;
  app.innerHTML = `
    <div class="topbar">
      <span class="dot" style="background:${g.players[cur].color};color:${g.players[cur].color}"></span>
      <span class="grow who">${cur === me ? 'Твой ход!' : 'Ходит ' + nameOf(cur)}</span>
      <span class="tag">${esc(code)}</span>
      <button class="btn" id="share" style="min-height:36px;padding:6px 10px">📤</button>
    </div>
    ${offerHTML()}
    ${boardHTML()}
    ${f ? `<div class="card">
      <div class="row" style="margin-bottom:10px">
        <div class="grow"><div class="small muted">${f.p.icon} ${esc(f.p.name)} · мечта ${dreamOf(me)?.icon || ''}</div>
          <div class="cashbig">${fmt(f.ps.cash)}</div></div>
        <div style="text-align:right"><div class="small muted">Поток в месяц</div><b class="${f.flow >= 0 ? 'pos' : 'neg'}" style="font-size:20px">${f.flow >= 0 ? '+' : ''}${fmt(f.flow)}</b></div>
      </div>
      <div class="money">
        <div class="stat"><span>Зарплата</span><b>${f.ps.fired ? '<s>' + fmt(f.ps.salary) + '</s>' : fmt(f.ps.salary)}</b></div>
        <div class="stat"><span>Пассивный доход</span><b class="pos">${fmt(f.pas)}</b></div>
        <div class="stat"><span>Расходы</span><b class="neg">${fmt(f.exp)}</b></div>
        <div class="stat"><span>Кредит банка</span><b>${fmt(f.ps.loan || 0)}</b></div>
      </div>
      <div style="margin:14px 0 6px" class="row"><span class="grow small"><b>До свободы</b> — пассивный доход покрывает расходы</span><b>${f.pct}%</b></div>
      <div class="bar"><i style="width:${f.pct}%"></i></div>
      ${f.ps.free ? dreamBlock(f) : ''}
      <div class="btns" style="margin-top:14px">
        <button class="btn" id="bank">🏦 Банк</button>
        <button class="btn" id="assets">💼 Активы · ${f.ps.assets.length}</button>
        <button class="btn" id="market">📈 Биржа</button>
      </div>
    </div>` : '<div class="card muted">Ты смотришь эту игру со стороны.</div>'}
    <div class="card">
      <h3 style="font-size:15px;margin-bottom:4px">Игроки</h3>
      <ul class="list">${g.order.map((id) => {
        const x = finances(id);
        return `<li><span class="dot" style="background:${g.players[id].color};color:${g.players[id].color}"></span>
          <div class="grow"><div class="row"><b class="grow">${nameOf(id)} ${x.p.icon}${x.ps.free ? ' 🏁' : ''}</b><span class="small">${fmt(x.ps.cash)}</span></div>
          <div class="bar thin" style="margin-top:5px"><i style="width:${x.ps.free ? x.dpct : x.pct}%;${x.ps.free ? 'background:var(--gold)' : ''}"></i></div></div>
          <span style="font-size:20px">${dreamOf(id)?.icon || ''}</span></li>`;
      }).join('')}</ul>
      ${isHost() && late && cur !== me && g.phase === 'play' ? '<button id="skip" class="btn ghost wide" style="margin-top:10px">⏭ Пропустить ход ' + nameOf(cur) + '</button>' : ''}
    </div>
    <div class="card">
      <h3 style="font-size:15px;margin-bottom:4px">Что происходит</h3>
      <ul class="list log">${g.log.slice(-8).reverse().map((l) => `<li>${esc(l.t)}</li>`).join('')}</ul>
    </div>
    ${isHost() ? '<button id="restart" class="btn ghost wide">↺ Новая игра с теми же игроками</button>' : ''}`;
  $('#share').onclick = share;
  $('#bank') && ($('#bank').onclick = () => openSheet('bank'));
  $('#assets') && ($('#assets').onclick = () => openSheet('assets'));
  $('#market') && ($('#market').onclick = () => openSheet('market'));
  $('#buydream') && ($('#buydream').onclick = () => act({ type: 'buyDream' }));
  $('#skip') && ($('#skip').onclick = () => act({ type: 'skip' }));
  $('#restart') && ($('#restart').onclick = () => openSheet('restart'));
  placeTokens();
  renderCenter();
}

function renderCenter() {
  const c = $('#center'); if (!c) return;
  const cur = E.currentId(g);
  const d = g.dice?.d || [];
  const myTurn = cur === me && !g.pending && !animating && g.phase === 'play';
  const ps = myPS();
  let html = `<div class="dice">${(d.length ? d : [1]).map((v) => `<div class="die${d.length ? '' : ' muted'}">${d.length ? v : '?'}</div>`).join('')}</div>`;
  if (g.phase === 'end') html += `<div class="turn">🏁 Игра окончена</div>`;
  else if (myTurn) html += `<button id="roll" class="btn primary big">🎲 Бросить${ps?.charity > 0 ? ' 2' : ''}</button>${ps?.charity > 0 ? `<div class="small muted">Ещё ${ps.charity} хода с двумя кубиками</div>` : ''}`;
  else if (g.pending && g.pending.by !== me && !animating) {
    const v = cardView(g.pending, false);
    html += `<div class="watch"><div style="font-size:26px">${v.ico}</div><b>${esc(v.title)}</b><div class="small muted">${nameOf(g.pending.by)} решает…</div></div>`;
  } else html += `<div class="turn muted">${cur === me ? 'Ход…' : 'Ходит ' + nameOf(cur)}</div>`;
  c.innerHTML = html;
  $('#roll') && ($('#roll').onclick = async () => { $('#roll').disabled = true; await act({ type: 'roll', two: true }); });
}

// ---------- предложение для всех ----------
function offerHTML() {
  const o = g.offer, ps = myPS();
  if (!o || !ps) return '';
  if (o.type === 'buyer') {
    if (g.pending?.type === 'buyer' && g.pending.by === me) return '';
    const list = ps.assets.map((a, i) => ({ a, i })).filter(({ a }) => E.buyerWants(o, a));
    if (!list.length) return '';
    return `<div class="card" style="border:2px solid var(--violet)"><b>📢 ${esc(o.text)}</b><div class="small muted">Можно продать до конца круга</div>
      <ul class="list">${list.map(({ a, i }) => { const d = E.deal(a.deal); return `<li><span style="font-size:22px">${d.icon}</span><span class="grow">${esc(d.name)}</span>
      <button class="btn primary" data-o="sell:${i}">+${fmt(E.buyerPays(o, a))}</button></li>`; }).join('')}</ul></div>`;
  }
  if (o.type === 'deal') {
    const d = E.deal(o.deal);
    if (o.from === me) return `<div class="card small muted">🤝 Ты отдал(а) сделку «${esc(d.name)}». Ждём, заберёт ли кто-нибудь.</div>`;
    return `<div class="card" style="border:2px solid var(--blue)"><div class="row"><span style="font-size:32px">${d.icon}</span><div class="grow">
      <b>${nameOf(o.from)} отдаёт сделку: ${esc(d.name)}</b><div class="small muted">Взнос ${fmt(d.down)} · доход ${d.income >= 0 ? '+' : ''}${fmt(d.income)}/мес · цена ${fmt(d.price)}</div></div></div>
      <div class="btns" style="margin-top:10px"><button class="btn primary" data-o="take" ${ps.cash < d.down ? 'disabled' : ''}>${ps.cash < d.down ? 'Не хватает на взнос — возьми кредит' : (d.price > d.down ? 'Взнос ' : 'Забрать за ') + fmt(d.down)}</button>
      ${d.price > d.down && ps.cash >= d.price ? `<button class="btn gold" data-o="takefull">Целиком ${fmt(d.price)}</button>` : ''}</div></div>`;
  }
  return '';
}
app.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-o]'); if (!b || b.disabled) return;
  b.disabled = true;
  if (b.dataset.o === 'take' || b.dataset.o === 'takefull') await act({ type: 'takeDeal', full: b.dataset.o === 'takefull' });
  else await act({ type: 'sellOffer', asset: Number(b.dataset.o.split(':')[1]) });
});

// ---------- карточки ----------
function cardView(p, mine) {
  const ps = g.players[p.by].ps;
  switch (p.type) {
    case 'pay': return { ico: '💰', bg: 'var(--cash-soft)', title: 'Зарплата!', text: `Поток за месяц: ${p.flow >= 0 ? '+' : ''}${fmt(p.flow)}. Деньги уже в кошельке.`, btns: [['ok', 'Отлично', 'primary']] };
    case 'deal': return { ico: '🏠', bg: 'var(--blue-soft)', title: 'Сделка', text: 'Какую сделку посмотреть? Маленькие дешевле, крупные дороже, но приносят больше.', btns: [['small', 'Маленькая', 'primary'], ['big', 'Крупная', 'gold']] };
    case 'offer': {
      const d = E.deal(p.deal);
      return { ico: d.icon, bg: 'var(--blue-soft)', title: d.name, deal: d, btns: [['buy', 'Купить', 'primary'], ...(g.order.length > 1 ? [['give', 'Отдать другим', 'ghost']] : []), ['skip', 'Пропустить', '']] };
    }
    case 'stock': {
      const s = E.STOCKS.find((x) => x.id === p.stock);
      return { ico: s.icon, bg: 'var(--violet-soft)', title: 'Акции «' + s.name + '»', stock: s, text: `Цена сейчас ${fmt(g.stocks[s.id])} за штуку.${s.div ? ' Платит дивиденды каждый месяц.' : ' Дохода в месяц нет — заработать можно, только продав дороже.'}` };
    }
    case 'scam': return { ico: '🕴️', bg: 'var(--gray-soft)', title: 'Очень выгодное предложение', text: `Незнакомец в чате: «Дай ${fmt(p.amount)} — через неделю верну вдвое больше! Гарантия 100%!»`, btns: [['buy', 'Вложить', 'danger'], ['skip', 'Не верю', 'primary']] };
    case 'scamResult': return { ico: '🚨', bg: 'var(--red-soft)', title: 'Это был обман', text: `Незнакомец пропал вместе с ${fmt(p.amount)}. Запомни: если обещают удвоить деньги быстро — это мошенники.`, btns: [['ok', 'Понятно', '']] };
    case 'spend': return { ico: p.icon, bg: 'var(--red-soft)', title: p.text, text: `Нужно заплатить ${fmt(p.amount)}.` + (mine && ps.cash < p.amount ? ' Денег не хватает — банк или продажа имущества закроют дыру.' : ''), btns: [['ok', 'Заплатить ' + fmt(p.amount), 'danger']] };
    case 'baby': return { ico: '👶', bg: 'var(--pink-soft)', title: 'Родился малыш!', text: `Поздравляем! Расходы растут на ${fmt(p.add)} в месяц.`, btns: [['ok', 'Ура!', 'primary']] };
    case 'fired': return { ico: '💼', bg: 'var(--gray-soft)', title: 'Сокращение на работе', text: 'Следующие 2 зарплаты придут без оклада. Выручит только пассивный доход.', btns: [['ok', 'Эх…', '']] };
    case 'charity': return { ico: '🤝', bg: 'var(--gold-soft)', title: 'Помочь приюту', text: `Пожертвуй ${fmt(p.amount)} — и следующие 3 хода бросай 2 кубика.`, btns: [['buy', 'Помочь', 'gold'], ['skip', 'Не сейчас', '']] };
    case 'marketInfo': return { ico: '📈', bg: 'var(--violet-soft)', title: 'Новости рынка', text: p.text, btns: [['ok', 'Ясно', 'primary']] };
    case 'buyer': return { ico: '🤝', bg: 'var(--violet-soft)', title: 'Покупатель!', text: p.text + '. Что продашь?', buyer: true };
  }
  return { ico: '❔', title: 'Карточка', text: '', btns: [['ok', 'Ок', '']] };
}

function cardHTML(p) {
  const v = cardView(p, true);
  const ps = myPS();
  let body = v.text ? `<p>${esc(v.text)}</p>` : '';
  let btns = v.btns || [];
  if (v.deal) {
    const d = v.deal;
    body += `<div class="kv"><span>Цена</span><b>${fmt(d.price)}</b><span>Первый взнос</span><b>${fmt(d.down)}</b>
      <span>Остаток в ипотеке</span><b>${fmt(d.price - d.down)}</b><span>Доход с ипотекой</span><b class="${d.income >= 0 ? 'pos' : 'neg'}">${d.income >= 0 ? '+' : ''}${fmt(d.income)}/мес</b>
      ${d.price > d.down ? `<span>Доход, если купить целиком</span><b class="pos">+${fmt(E.makeAsset(d, true).income)}/мес</b>` : ''}</div>
      ${d.price > d.down ? `<p class="small muted">Взнос + ипотека — платишь мало сейчас, но часть дохода уходит банку. Целиком — дорого сейчас, зато весь доход твой. Ипотеку можно погасить позже в «Активах».</p>` : ''}
      <p class="small muted">${d.income > 0 ? 'Окупится примерно за ' + Math.ceil(d.down / d.income) + ' мес.' : d.kind === 'land' ? 'Земля не приносит денег каждый месяц' + (d.income < 0 ? ' и даже стоит ' + fmt(-d.income) + '/мес по ипотеке' : '') + ', зато её можно дорого продать, когда придёт покупатель на «Рынке».' : ''} У тебя ${fmt(ps.cash)}.</p>`;
    if (ps.cash >= d.down) btns = [['buy', d.price > d.down ? 'Взнос ' + fmt(d.down) : 'Купить ' + fmt(d.price), 'primary'],
      ...(d.price > d.down && ps.cash >= d.price ? [['buyFull', 'Целиком ' + fmt(d.price), 'gold']] : []), ...btns.filter(([a]) => a !== 'buy')];
    if (ps.cash < d.down) {
      const need = Math.ceil((d.down - ps.cash) / 1000) * 1000;
      if (need <= E.maxLoan(ps, g.stocks)) {
        body += `<div class="hint">Не хватает ${fmt(d.down - ps.cash)}. Можно взять кредит ${fmt(need)} — платёж ${fmt(need / 10)}/мес, а доход сделки +${fmt(d.income)}/мес.</div>`;
        btns = [['loanbuy:' + need, 'Кредит и купить', 'gold'], ...(g.order.length > 1 ? [['give', 'Отдать другим', 'ghost']] : []), ['skip', 'Пропустить', '']];
      } else {
        body += `<div class="hint">Не хватает денег, и банк столько не даст. Пропусти — будут другие сделки.</div>`;
        btns = [...(g.order.length > 1 ? [['give', 'Отдать другим', 'gold']] : []), ['skip', 'Пропустить', 'primary']];
      }
    }
  }
  if (v.stock) {
    const s = v.stock, price = g.stocks[s.id], have = ps.stocks[s.id] || 0;
    const maxBuy = Math.floor(ps.cash / price);
    qty = Math.max(1, Math.min(qty, Math.max(maxBuy, have, 1)));
    body += `<p class="small muted">У тебя: ${have} шт. Можешь купить до ${maxBuy} шт.</p>
      <div class="stepper"><button data-q="-10">−10</button><button data-q="-1">−</button><b id="qty">${qty}</b><button data-q="1">+</button><button data-q="10">+10</button></div>
      <div style="text-align:center"><button class="btn ghost" data-q="max" style="min-height:36px;padding:6px 14px">На все деньги</button></div>
      <p class="small muted" style="text-align:center;margin-top:-4px">= ${fmt(qty * price)}</p>`;
    btns = [['stockBuy', 'Купить', 'primary'], ...(have ? [['stockSell', 'Продать', 'gold']] : []), ['skip', 'Пропустить', '']];
  }
  if (v.buyer) {
    const list = ps.assets.map((a, i) => ({ a, i })).filter(({ a }) => E.buyerWants(p, a));
    body += `<ul class="list">${list.map(({ a, i }) => {
      const d = E.deal(a.deal), got = E.buyerPays(p, a);
      return `<li><span style="font-size:24px">${d.icon}</span><div class="grow"><b>${esc(d.name)}</b><div class="small muted">купил за ${fmt(a.price)}${a.income ? ', доход ' + fmt(a.income) + '/мес' : ''}</div></div>
        <button class="btn primary" data-a="sell:${i}">+${fmt(got)}</button></li>`;
    }).join('')}</ul>`;
    if (!list.length) body += `<p class="muted">У тебя такого нет. Но покупатель подождёт круг — может, продаст кто-то из друзей.</p>`;
    else body += `<p class="small muted">Можно продать несколько. Друзья тоже могут продать ему своё до конца круга.</p>`;
    btns = [['skip', 'Готово', 'primary']];
  }
  return `<div class="panel"><div class="cardhead"><div class="ico" style="background:${v.bg}">${v.ico}</div><h3>${esc(v.title)}</h3></div>
    ${body}<div class="btns" style="margin-top:12px">${btns.map(([a, t, c]) => `<button class="btn ${c}" data-a="${a}">${esc(t)}</button>`).join('')}</div></div>`;
}

async function cardAction(a) {
  const p = g.pending;
  sheet.querySelectorAll('button').forEach((b) => (b.disabled = true));
  if (a.startsWith('loanbuy:')) {
    const r = await act({ type: 'loan', amount: Number(a.split(':')[1]) });
    if (!r?.error) await act({ type: 'resolve', choice: 'buy' });
  } else if (a.startsWith('sell:')) { await act({ type: 'sellOffer', asset: Number(a.split(':')[1]) }); sheetKey = ''; renderSheet(); }
  else if (p.type === 'deal' || ['small', 'big'].includes(a)) await act({ type: 'resolve', choice: a });
  else await act({ type: 'resolve', choice: a, qty });
  sheet.querySelectorAll('button').forEach((b) => (b.disabled = false));
}

function dreamBlock(f) {
  const can = f.ps.cash >= f.d.price;
  return `<div style="margin-top:14px;padding:12px;border-radius:14px;background:var(--gold-soft)">
    <div class="row"><span style="font-size:30px">${f.d.icon}</span><div class="grow"><b>Ты свободен! Копи на мечту</b><div class="small">${esc(f.d.name)}: ${fmt(f.ps.cash)} из ${fmt(f.d.price)}</div></div><b>${f.dpct}%</b></div>
    <div class="bar" style="margin-top:8px"><i style="width:${f.dpct}%;background:var(--gold)"></i></div>
    ${can ? `<button id="buydream" class="btn gold big wide" style="margin-top:10px">${f.d.icon} Купить мечту и победить!</button>` : ''}</div>`;
}

// ---------- банк, активы ----------
function bankHTML() {
  const ps = myPS(), max = E.maxLoan(ps, g.stocks);
  return `<div class="panel"><div class="cardhead"><div class="ico" style="background:var(--blue-soft)">🏦</div><h3>Банк</h3></div>
    <p class="small muted">Кредит выдаётся по ${fmt(1000)}. За каждую тысячу платишь ${fmt(100)} в месяц, пока не вернёшь.</p>
    <div class="kv"><span>Твой кредит</span><b>${fmt(ps.loan || 0)}</b><span>Банк может дать ещё</span><b>${fmt(max)}</b><span>Наличные</span><b>${fmt(ps.cash)}</b></div>
    <div class="btns">
      <button class="btn gold" data-b="loan:1000" ${max < 1000 ? 'disabled' : ''}>+ Взять ${fmt(1000)}</button>
      <button class="btn" data-b="repay:1000" ${(ps.loan || 0) < 1000 || ps.cash < 1000 ? 'disabled' : ''}>Вернуть ${fmt(1000)}</button>
      ${(ps.loan || 0) > 1000 ? `<button class="btn primary" data-b="repayall" ${ps.cash < ps.loan ? 'disabled' : ''}>Вернуть всё ${fmt(ps.loan)}</button>` : ''}
    </div>
    <h3 style="font-size:15px;margin:16px 0 4px">Твои долги</h3>
    <p class="small muted" style="margin:0">Закроешь долг целиком — его платёж навсегда исчезнет из расходов. Выгоднее всего закрывать те, где платёж большой, а остаток маленький.</p>
    <ul class="list">${ps.debts.map((d) => { const T = E.DEBT_TYPES[d.t]; return `<li><span style="font-size:22px">${T.icon}</span>
      <div class="grow"><b>${T.name}</b><div class="small muted">${d.left > 0 ? 'осталось ' + fmt(d.left) + ' · платёж ' + fmt(d.pay) + '/мес' : 'закрыт ✅'}</div></div>
      ${d.left > 1000 ? `<button class="btn" data-b="debtpart:${d.t}" ${ps.cash < 1000 ? 'disabled' : ''} title="Внести часть">−${fmt(1000)}</button>` : ''}
      ${d.left > 0 ? `<button class="btn primary" data-b="debt:${d.t}" ${ps.cash < d.left ? 'disabled' : ''}>Закрыть</button>` : ''}</li>`; }).join('')}</ul>
    <button class="btn ghost wide" data-b="close" style="margin-top:14px">Закрыть</button></div>`;
}
function assetsHTML() {
  const ps = myPS();
  const st = E.STOCKS.filter((s) => ps.stocks[s.id]);
  return `<div class="panel"><div class="cardhead"><div class="ico" style="background:var(--cash-soft)">💼</div><h3>Твои активы</h3></div>
    ${!ps.assets.length && !st.length ? '<p class="muted">Пока ничего нет. Ищи клетки «Сделка» 🏠 — там можно купить то, что приносит деньги.</p>' : ''}
    <ul class="list">${ps.assets.map((a, i) => {
      const d = E.deal(a.deal), got = Math.round(a.price * 0.8 - a.mortgage);
      return `<li><span style="font-size:24px">${d.icon}</span><div class="grow"><b>${esc(d.name)}</b><div class="small ${a.income >= 0 ? 'pos' : 'neg'}">${a.income >= 0 ? '+' : ''}${fmt(a.income)}/мес</div></div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:stretch">
        ${a.mortgage ? `<button class="btn primary" data-b="mort:${i}" ${ps.cash < a.mortgage ? 'disabled' : ''} title="Погасить ипотеку: доход +${fmt(E.mortPay(a.mortgage))}/мес">Ипотека ${fmt(a.mortgage)} ✕</button>` : '<span class="small muted" style="text-align:right">без ипотеки ✅</span>'}
        <button class="btn" data-b="sell:${i}" title="Срочная продажа за 80% цены">Продать ${fmt(got)}</button></div></li>`;
    }).join('')}
    ${st.map((s) => `<li><span style="font-size:24px">${s.icon}</span><div class="grow"><b>${esc(s.name)}</b><div class="small muted">${ps.stocks[s.id]} шт. × ${fmt(g.stocks[s.id])} = ${fmt(ps.stocks[s.id] * g.stocks[s.id])}</div></div></li>`).join('')}</ul>
    ${ps.assets.length ? '<p class="small muted">Срочная продажа — за 80% цены минус ипотека. Лучше ждать покупателя на клетке «Рынок» 📈.</p>' : ''}
    <button class="btn ghost wide" data-b="close" style="margin-top:10px">Закрыть</button></div>`;
}
function marketHTML() {
  const ps = myPS();
  const worth = E.STOCKS.reduce((t, s) => t + (ps.stocks[s.id] || 0) * g.stocks[s.id], 0);
  return `<div class="panel"><div class="cardhead"><div class="ico" style="background:var(--violet-soft)">📈</div><div><h3>Биржа</h3><div class="small muted">Наличные ${fmt(ps.cash)} · акций на ${fmt(worth)}</div></div></div>
    <p class="small muted">Цены меняются после каждого броска кубика. Покупай дешевле, продавай дороже — но угадать нельзя никогда. У КосмоЛёта самые сильные скачки.</p>
    <ul class="list">${E.STOCKS.map((s) => {
      const p = g.stocks[s.id], prev = g.prevStocks?.[s.id] ?? p, have = ps.stocks[s.id] || 0;
      const ch = p - prev, pc = prev ? Math.round((ch / prev) * 100) : 0;
      return `<li style="display:block"><div class="row"><span style="font-size:26px">${s.icon}</span><div class="grow"><b>${esc(s.name)}</b>
        <div class="small muted">${s.div ? 'дивиденды $' + s.div + '/мес за акцию · ' : ''}у тебя ${have} шт.</div></div>
        <div style="text-align:right"><b>${fmt(p)}</b><div class="small ${ch > 0 ? 'pos' : ch < 0 ? 'neg' : 'muted'}">${ch > 0 ? '▲ +' : ch < 0 ? '▼ ' : ''}${ch ? pc + '%' : 'без изменений'}</div></div></div>
        <div class="btns quad" style="margin-top:8px">
          <button class="btn" data-t="${s.id}:buy:1" ${ps.cash < p ? 'disabled' : ''}>+1</button>
          <button class="btn" data-t="${s.id}:buy:10" ${ps.cash < p * 10 ? 'disabled' : ''}>+10</button>
          <button class="btn" data-t="${s.id}:sell:1" ${!have ? 'disabled' : ''}>−1</button>
          <button class="btn gold" data-t="${s.id}:sell:all" ${!have ? 'disabled' : ''}>Продать все</button>
        </div></li>`;
    }).join('')}</ul>
    <button class="btn ghost wide" data-b="close" style="margin-top:10px">Закрыть</button></div>`;
}
function restartHTML() {
  return `<div class="panel"><h3 style="margin-bottom:10px">Начать заново?</h3><p class="muted">Все вернутся в комнату ожидания с теми же именами.</p>
    <div class="btns"><button class="btn danger" data-b="restart">Да, заново</button><button class="btn" data-b="close">Нет</button></div></div>`;
}

function openSheet(mode) { sheetMode = mode; sheetKey = ''; renderSheet(); }
function closeSheet() { sheetMode = null; sheetKey = ''; sheet.hidden = true; sheet.innerHTML = ''; }
function renderSheet() {
  const p = g?.pending;
  const cardMine = g?.phase === 'play' && p && p.by === me && !animating;
  if (sheetMode === 'note' || sheetMode === 'party') return;
  if (noteQ.length && !animating) {
    const x = noteQ.shift();
    sheetMode = 'note';
    sheet.innerHTML = `<div class="panel"><div class="cardhead"><div class="ico" style="background:var(--red-soft)">${x.icon}</div><h3>${esc(x.title)}</h3></div>
      <p>${esc(x.text)}</p><button class="btn primary wide" data-b="close">Понятно</button></div>`;
    sheet.hidden = false;
    return;
  }
  if (cardMine && !['bank', 'assets', 'market'].includes(sheetMode)) sheetMode = 'card';
  if (sheetMode === 'card' && !cardMine) sheetMode = null;
  if (!sheetMode) { sheet.hidden = true; sheet.innerHTML = ''; sheetKey = ''; return; }
  const key = sheetMode + ':' + g.seq;
  if (key === sheetKey) return;
  if (sheetMode === 'card' && qtyFor !== g.seq) { qty = 1; qtyFor = g.seq; }
  sheetKey = key;
  sheet.innerHTML = sheetMode === 'card' ? cardHTML(p) : sheetMode === 'bank' ? bankHTML() : sheetMode === 'assets' ? assetsHTML() : sheetMode === 'market' ? marketHTML() : restartHTML();
  sheet.hidden = false;
}
sheet.addEventListener('click', async (e) => {
  if (e.target === sheet && sheetMode !== 'card') return closeSheet();
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  if (b.dataset.q) {
    const s = E.STOCKS.find((x) => x.id === g.pending.stock), ps = myPS();
    const lim = Math.max(Math.floor(ps.cash / g.stocks[s.id]), ps.stocks[s.id] || 0, 1);
    qty = b.dataset.q === 'max' ? Math.max(1, Math.floor(ps.cash / g.stocks[s.id])) : Math.max(1, Math.min(lim, qty + Number(b.dataset.q)));
    sheetKey = ''; renderSheet();
    return;
  }
  if (b.dataset.a) return cardAction(b.dataset.a);
  if (b.dataset.t) {
    const [stock, side, n] = b.dataset.t.split(':');
    await act({ type: 'trade', stock, side, qty: Number(n) || 0, all: n === 'all' });
    sheetKey = ''; return renderSheet();
  }
  const v = b.dataset.b; if (!v) return;
  if (v === 'close') { closeSheet(); if (g?.phase === 'play') renderSheet(); return; }
  const [kind, arg] = v.split(':');
  if (kind === 'loan') await act({ type: 'loan', amount: Number(arg) });
  if (kind === 'repay') await act({ type: 'repay', amount: Number(arg) });
  if (kind === 'debt') await act({ type: 'repay', what: 'debt', t: arg, all: true });
  if (kind === 'debtpart') await act({ type: 'repay', what: 'debt', t: arg, amount: 1000 });
  if (kind === 'repayall') await act({ type: 'repay', all: true });
  if (kind === 'mort') await act({ type: 'payMortgage', asset: Number(arg) });
  if (kind === 'sell') await act({ type: 'sell', asset: Number(arg) });
  if (kind === 'restart') { await act({ type: 'restart' }); return closeSheet(); }
  sheetKey = ''; renderSheet();
});

// ---------- финал ----------
function renderEnd() {
  closeSheet();
  const score = (id) => (id === g.winner ? 1e9 : 0) + (g.players[id].ps.free ? 1e6 + finances(id).dpct : finances(id).pct);
  const rank = [...g.order].sort((a, b) => score(b) - score(a));
  const w = g.winner, wd = dreamOf(w);
  app.innerHTML = `<div class="card party"><div class="big">${wd?.icon || '🏆'}</div><h2>${w === me ? 'Ты победил!' : nameOf(w) + ' победил(а)!'}</h2>
    <p class="muted">${nameOf(w)} купил(а) мечту «${esc(wd?.name)}» за ${g.players[w].ps.dreamAt} мес.</p>
    <ul class="list" style="text-align:left">${rank.map((id, i) => { const x = finances(id); return `<li><b style="width:26px">${['🥇', '🥈', '🥉'][i] || i + 1 + '.'}</b><span class="grow">${nameOf(id)} ${x.p.icon}</span>
      <span class="small muted">${id === w ? 'мечта ' + x.d.icon : x.ps.free ? 'свободен, мечта ' + x.dpct + '%' : 'до свободы ' + x.pct + '%'}</span></li>`; }).join('')}</ul></div>
    ${isHost() ? '<button id="again" class="btn primary big wide">Играть ещё ↺</button>' : '<p class="muted" style="text-align:center">Хозяин может начать новую игру.</p>'}
    <button id="out" class="btn ghost wide" style="margin-top:10px">Выйти</button>`;
  $('#again') && ($('#again').onclick = () => act({ type: 'restart' }));
  $('#out').onclick = leaveRoom;
}

// ---------- общий рендер ----------
function notices() {
  if (lastNoteN === null) lastNoteN = Math.max(0, ...(g.notes || []).map((x) => x.n));
  for (const x of g.notes || []) if (x.n > lastNoteN && x.to === me) noteQ.push(x);
  lastNoteN = Math.max(lastNoteN, ...(g.notes || []).map((x) => x.n));
  if (lastLogN === null) { lastLogN = g.log.at(-1)?.n || 0; lastFreedN = g.freedNote?.n || 0; lastBankruptN = g.bankruptNote?.n || 0; lastDiceN = g.dice?.n || 0; return; }
  for (const l of g.log) if (l.n > lastLogN && !(myP() && l.t.startsWith(myP().name))) toast(l.t);
  lastLogN = g.log.at(-1)?.n || lastLogN;
  if (g.freedNote && g.freedNote.n > lastFreedN) {
    lastFreedN = g.freedNote.n;
    const id = g.freedNote.by, d = dreamOf(id);
    confetti();
    setTimeout(() => {
      sheetMode = 'party';
      sheet.innerHTML = `<div class="panel party"><div class="big">${d?.icon || '🎉'}</div><h2>${id === me ? 'Ты свободен!' : nameOf(id) + ' свободен(на)!'}</h2>
        <p class="muted">Пассивный доход больше расходов — деньги работают сами. Теперь последний рывок: накопить ${d ? fmt(d.price) + ' на мечту «' + esc(d.name) + '»' : 'на мечту'}. Кто первым купит мечту — победит!</p>
        <button class="btn primary wide" data-b="close">Круто!</button></div>`;
      sheet.hidden = false;
    }, 1300);
  }
  if (g.bankruptNote && g.bankruptNote.n > lastBankruptN) { lastBankruptN = g.bankruptNote.n; if (g.bankruptNote.by === me) toast('Ты разорился. Не беда: новый старт с бонусом!', true); }
}

function render() {
  if (!g) return;
  if (g.phase === 'lobby') { lastLogN = null; for (const k in shownPos) delete shownPos[k]; return renderLobby(); }
  if (g.phase === 'end') { notices(); return renderEnd(); }
  const diceNew = g.dice && g.dice.n > lastDiceN;
  notices();
  if (sheetMode === 'party') { renderGame(); return; }
  renderGame();
  if (diceNew) {
    lastDiceN = g.dice.n;
    app.querySelectorAll('.die').forEach((el) => el.classList.add('roll'));
  }
  animateMoves(() => { renderCenter(); renderSheet(); });
  if (!animating) renderSheet();
}
setInterval(() => { if (g?.phase === 'play' && !animating && sheetMode !== 'party' && !document.activeElement?.matches('input')) { const y = scrollY; renderGame(); scrollTo(0, y); } }, 10000);

// ---------- запуск ----------
(async () => {
  try { T = await connect(); } catch (e) {
    app.innerHTML = `<div class="card"><h3>Не получилось подключиться</h3><p class="muted">${esc(e.message)}</p><button class="btn primary" onclick="location.reload()">Ещё раз</button></div>`;
    return;
  }
  me = T.uid;
  const q = new URLSearchParams(location.search).get('r')?.toUpperCase() || '';
  const name = store.get('me-name');
  const last = store.get('me-room');
  const target = q || last;
  if (target && name && (await T.exists(target))) return enter(target, name);
  renderHome(q);
})();
