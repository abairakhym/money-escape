// Money Escape — правила игры. Чистые функции: (состояние, действие) -> новое состояние.
// Работают одинаково в браузере и в node (для тестов). Никакого DOM и сети здесь нет.

export const PROFESSIONS = [
  { id: 'courier', name: 'Курьер', icon: '🛵', salary: 1500, expenses: 1100, cash: 600, kid: 100, debt: { name: 'Кредит за скутер', amount: 2000 } },
  { id: 'seller', name: 'Продавец', icon: '🛒', salary: 1800, expenses: 1350, cash: 700, kid: 120, debt: { name: 'Телефон в кредит', amount: 1500 } },
  { id: 'teacher', name: 'Учитель', icon: '📚', salary: 2200, expenses: 1650, cash: 800, kid: 150, debt: { name: 'Кредит за учёбу', amount: 4000 } },
  { id: 'firefighter', name: 'Пожарный', icon: '🚒', salary: 2400, expenses: 1750, cash: 900, kid: 180, debt: { name: 'Кредит за машину', amount: 4000 } },
  { id: 'cook', name: 'Повар', icon: '🍳', salary: 2600, expenses: 1900, cash: 900, kid: 200, debt: { name: 'Кредит за машину', amount: 5000 } },
  { id: 'blogger', name: 'Блогер', icon: '🎥', salary: 3000, expenses: 2300, cash: 1000, kid: 200, debt: { name: 'Кредит за технику', amount: 6000 } },
  { id: 'builder', name: 'Строитель', icon: '🏗️', salary: 3200, expenses: 2400, cash: 1100, kid: 220, debt: { name: 'Кредит за машину', amount: 8000 } },
  { id: 'programmer', name: 'Программист', icon: '💻', salary: 4200, expenses: 3100, cash: 1500, kid: 300, debt: { name: 'Ипотека', amount: 30000 } },
  { id: 'pilot', name: 'Пилот', icon: '✈️', salary: 5500, expenses: 4200, cash: 1800, kid: 350, debt: { name: 'Ипотека', amount: 45000 } },
  { id: 'doctor', name: 'Врач', icon: '🩺', salary: 6500, expenses: 5000, cash: 2000, kid: 400, debt: { name: 'Ипотека', amount: 60000 } },
];

export const DREAMS = [
  // этап 2: выйдя на свободу, копишь на мечту. Кто первым купит — победил.
  { id: 'world', name: 'Кругосветка', icon: '🌍', price: 25000 },
  { id: 'yacht', name: 'Яхта', icon: '🛥️', price: 40000 },
  { id: 'castle', name: 'Замок', icon: '🏰', price: 50000 },
  { id: 'island', name: 'Свой остров', icon: '🏝️', price: 60000 },
  { id: 'team', name: 'Своя футбольная команда', icon: '⚽', price: 70000 },
  { id: 'space', name: 'Полёт в космос', icon: '🚀', price: 80000 },
];

export const COLORS = ['#2F7DE1', '#E5484D', '#16A06A', '#F2A20C', '#8B5CF6', '#EC4899'];

// Улица жизни: 24 клетки по кругу. Порядок задаёт ритм: зарплата раз в 6 клеток.
// pay — зарплата, deal — сделка, spend — траты, market — рынок, baby, fired, charity
export const BOARD = [
  'pay', 'deal', 'spend', 'deal', 'market', 'deal',
  'pay', 'spend', 'deal', 'baby', 'deal', 'spend',
  'pay', 'deal', 'market', 'spend', 'charity', 'deal',
  'pay', 'spend', 'deal', 'fired', 'market', 'deal',
];

export const CELL = {
  pay: { name: 'Зарплата', icon: '💰' },
  deal: { name: 'Сделка', icon: '🏠' },
  spend: { name: 'Траты', icon: '💸' },
  market: { name: 'Рынок', icon: '📈' },
  baby: { name: 'Ребёнок', icon: '👶' },
  fired: { name: 'Увольнение', icon: '💼' },
  charity: { name: 'Добро', icon: '🤝' },
};

// Сделки. income — чистый доход в месяц (платёж по ипотеке уже вычтен). mortgage = price - down.
export const DEALS = [
  { id: 'vending', size: 'small', name: 'Вендинговый автомат', icon: '🥤', kind: 'biz', price: 1000, down: 1000, income: 80 },
  { id: 'garage', size: 'small', name: 'Гараж под сдачу', icon: '🚗', kind: 'home', price: 3000, down: 600, income: 120 },
  { id: 'room', size: 'small', name: 'Комната под сдачу', icon: '🛏️', kind: 'home', price: 5000, down: 1000, income: 200 },
  { id: 'kiosk', size: 'small', name: 'Ларёк с шаурмой', icon: '🌯', kind: 'biz', price: 4000, down: 2000, income: 250 },
  { id: 'flat', size: 'small', name: 'Однушка под сдачу', icon: '🏢', kind: 'home', price: 9000, down: 1800, income: 300 },
  { id: 'carwash', size: 'big', name: 'Автомойка', icon: '🧽', kind: 'biz', price: 20000, down: 5000, income: 900 },
  { id: 'cafe', size: 'big', name: 'Кафе', icon: '☕', kind: 'biz', price: 30000, down: 8000, income: 1300 },
  { id: 'shop', size: 'big', name: 'Магазин у дома', icon: '🏪', kind: 'biz', price: 40000, down: 10000, income: 1700 },
  { id: 'fourplex', size: 'big', name: 'Дом на 4 квартиры', icon: '🏘️', kind: 'home', price: 60000, down: 12000, income: 2400 },
  { id: 'hotel', size: 'big', name: 'Мини-отель', icon: '🏨', kind: 'biz', price: 90000, down: 20000, income: 3600 },
];

// Акции: цены меняют карточки рынка
export const STOCKS = [
  { id: 'bread', name: 'ХлебЗавод', icon: '🥖', start: 20, div: 0.5, vol: 0.06, drift: 0.01 }, // спокойная, маленькие дивиденды
  { id: 'games', name: 'ИгроСтудия', icon: '🎮', start: 15, div: 0, vol: 0.14, drift: 0.015 },
  { id: 'rocket', name: 'КосмоЛёт', icon: '🛰️', start: 10, div: 0, vol: 0.28, drift: 0.02 },
];

// Неожиданные траты: базовая сумма для курьера, у остальных больше
export const SPENDS = [
  { text: 'Разбил телефон', icon: '📱', base: 150 },
  { text: 'Штраф за парковку', icon: '🅿️', base: 50 },
  { text: 'Подарок другу на день рождения', icon: '🎁', base: 100 },
  { text: 'Кот заболел, ветеринар', icon: '🐱', base: 150 },
  { text: 'Новые кроссовки «потому что захотелось»', icon: '👟', base: 100 },
  { text: 'Сломалась стиральная машина', icon: '🧺', base: 200 },
  { text: 'Забытые подписки', icon: '🔁', base: 50 },
  { text: 'Отпуск на море', icon: '🏖️', base: 300 },
  { text: 'Новая игровая приставка', icon: '🕹️', base: 250 },
  { text: 'Ремонт машины', icon: '🔧', base: 200 },
  { text: 'Ужин в ресторане', icon: '🍝', base: 80 },
  { text: 'Свадьба друга', icon: '💍', base: 150 },
];

export const MARKETS = [
  { kind: 'buyer', who: 'home', mult: 1.6, text: 'Покупатель ищет жильё и предлагает 160% цены' },
  { kind: 'buyer', who: 'biz', mult: 1.5, text: 'Инвестор хочет купить бизнес за 150% цены' },
  { kind: 'buyer', who: 'home', mult: 2, text: 'Город строит метро рядом: жильё дорожает вдвое' },
  { kind: 'stock', id: 'games', mult: 2, text: 'ИгроСтудия выпустила хит — акции x2!' },
  { kind: 'stock', id: 'games', mult: 0.4, text: 'Игра ИгроСтудии провалилась — акции падают' },
  { kind: 'stock', id: 'rocket', mult: 3, text: 'КосмоЛёт долетел до Луны — акции x3!' },
  { kind: 'stock', id: 'rocket', mult: 0.3, text: 'Ракета КосмоЛёта взорвалась — акции рухнули' },
  { kind: 'stock', id: 'bread', mult: 1.3, text: 'Хлеб подорожал — акции ХлебЗавода растут' },
  { kind: 'crash', text: 'Кризис! Акции всех компаний падают вдвое' },
];

const LOAN_RATE = 0.1; // 1000 долга = 100 в месяц
const START_DEBT_RATE = 0.03;

// ---------- помощники ----------
export const round10 = (n) => Math.round(n / 10) * 10;
const clone = (o) => JSON.parse(JSON.stringify(o));
export const prof = (id) => PROFESSIONS.find((p) => p.id === id);
export const deal = (id) => DEALS.find((d) => d.id === id);

export function passive(ps, stocks) {
  let sum = 0;
  for (const a of ps.assets || []) sum += a.income;
  for (const s of STOCKS) sum += Math.round(((ps.stocks || {})[s.id] || 0) * s.div);
  return sum;
}
export function loanPayment(ps) {
  return Math.round((ps.loan || 0) * LOAN_RATE);
}
export function expenses(ps) {
  const p = prof(ps.prof);
  return ps.baseExp + (ps.kids || 0) * p.kid + loanPayment(ps) + (ps.debtLeft > 0 ? ps.debtPay : 0);
}
export function cashflow(ps, stocks) {
  return (ps.salary || 0) + passive(ps, stocks) - expenses(ps);
}
// Свободен, когда пассивный доход покрывает все расходы
export function isFree(ps, stocks) {
  return passive(ps, stocks) >= expenses(ps);
}
// Сколько можно ещё взять в долг: месячный поток после кредита не уходит в минус
export function maxLoan(ps, stocks) {
  const flow = cashflow(ps, stocks);
  return Math.max(0, Math.floor(flow / (1000 * LOAN_RATE)) * 1000);
}
function spendFactor(ps) {
  return 1 + (ps.salary - 1500) / 2500;
}

export function newPlayerState(profId) {
  const p = prof(profId);
  const debtPay = Math.round(p.debt.amount * START_DEBT_RATE);
  return {
    prof: p.id,
    salary: p.salary,
    baseExp: p.expenses - debtPay, // в расходы профессии уже входит платёж по стартовому долгу
    debtPay,
    debtLeft: p.debt.amount,
    cash: p.cash,
    kids: 0,
    loan: 0,
    assets: [],
    stocks: {},
    pos: 0,
    fired: 0,
    charity: 0,
    free: false,
    freeAt: 0,
  };
}

export function newGame(code, hostId) {
  return {
    v: 1,
    code,
    host: hostId,
    phase: 'lobby',
    players: {},
    order: [],
    turn: 0,
    month: 1,
    stocks: Object.fromEntries(STOCKS.map((s) => [s.id, s.start])),
    pending: null,
    dice: null,
    log: [],
    winner: null,
    seq: 0,
  };
}

function log(g, text) {
  g.log = [...(g.log || []), { t: text, n: g.seq }].slice(-30);
}

export function currentId(g) {
  return g.order[g.turn % Math.max(1, g.order.length)];
}

// ---------- действия ----------
// Каждое действие: apply(g, by, action, rnd) -> новое состояние или { error }
// rnd — функция случайных чисел [0,1), чтобы тесты были повторяемыми.

const ACTIONS = {
  join(g, by, a) {
    if (g.phase !== 'lobby') return err('Игра уже идёт. Подожди следующую.');
    if (Object.keys(g.players).length >= 6 && !g.players[by]) return err('В комнате уже 6 игроков.');
    const used = Object.values(g.players).map((p) => p.color);
    const color = g.players[by]?.color || COLORS.find((c) => !used.includes(c)) || COLORS[0];
    const name = String(a.name || 'Игрок').trim().slice(0, 16) || 'Игрок';
    g.players[by] = { name, color, dream: g.players[by]?.dream || null, joined: g.players[by]?.joined || Date.now() };
    return g;
  },
  leave(g, by) {
    if (g.phase !== 'lobby') return err('Во время игры выйти нельзя — можно просто закрыть страницу.');
    delete g.players[by];
    if (g.host === by) g.host = Object.keys(g.players)[0] || null;
    return g;
  },
  dream(g, by, a) {
    if (!g.players[by]) return err('Сначала войди в комнату.');
    if (!DREAMS.find((d) => d.id === a.dream)) return err('Нет такой мечты.');
    g.players[by].dream = a.dream;
    return g;
  },
  start(g, by, a, rnd) {
    if (g.host !== by) return err('Начать игру может только хозяин комнаты.');
    if (g.phase !== 'lobby') return err('Игра уже идёт.');
    const ids = Object.keys(g.players).sort((x, y) => g.players[x].joined - g.players[y].joined);
    if (!ids.length) return err('В комнате никого нет.');
    // профессии раздаются случайно и без повторов
    const pool = PROFESSIONS.map((p) => p.id);
    for (const id of ids) {
      const k = Math.floor(rnd() * pool.length);
      const pid = pool.splice(k, 1)[0];
      g.players[id].ps = newPlayerState(pid);
      if (!g.players[id].dream) g.players[id].dream = DREAMS[Math.floor(rnd() * DREAMS.length)].id;
    }
    g.order = ids;
    g.turn = 0;
    g.phase = 'play';
    g.startedAt = Date.now();
    g.turnAt = Date.now();
    log(g, `Игра началась! Ходит ${g.players[ids[0]].name}.`);
    return g;
  },
  roll(g, by, a, rnd) {
    if (g.phase !== 'play') return err('Игра не идёт.');
    if (currentId(g) !== by) return err('Сейчас не твой ход.');
    if (g.pending) return err('Сначала реши, что делать с карточкой.');
    const pl = g.players[by];
    const ps = pl.ps;
    const two = a.two && ps.charity > 0;
    const d1 = 1 + Math.floor(rnd() * 6);
    const d2 = two ? 1 + Math.floor(rnd() * 6) : 0;
    const steps = d1 + d2;
    g.dice = { by, d: two ? [d1, d2] : [d1], n: g.seq + 1 };
    // биржа живёт: после каждого броска цены немного меняются (у ракет — сильно)
    g.prevStocks = { ...g.stocks };
    for (const s of STOCKS) {
      const p = g.stocks[s.id], pull = 0.08 * (s.start / p - 1); // слишком дешёвые тянутся вверх, дорогие — вниз
      g.stocks[s.id] = Math.max(2, Math.round(p * (1 + s.drift + pull + (rnd() * 2 - 1) * s.vol)));
    }
    if (ps.charity > 0) ps.charity -= 1;
    // проходим клетки: каждая «Зарплата» по пути приносит месячный поток
    let pos = ps.pos;
    for (let i = 1; i <= steps; i++) {
      pos = (pos + 1) % BOARD.length;
      if (BOARD[pos] === 'pay') payday(g, by, pos === (ps.pos + steps) % BOARD.length);
    }
    ps.pos = pos;
    const cell = BOARD[pos];
    g.pending = drawCard(g, by, cell, rnd);
    if (!g.pending) endTurn(g);
    return g;
  },
  // ответ на карточку: buy / skip / ok / sell / stockBuy (qty) / stockSell (qty)
  resolve(g, by, a, rnd) {
    const p = g.pending;
    if (!p || p.by !== by) return err('Сейчас нечего решать.');
    const ps = g.players[by].ps;
    const name = g.players[by].name;
    switch (p.type) {
      case 'deal': {
        if (a.choice === 'small' || a.choice === 'big') {
          // выбор колоды сделки
          const list = DEALS.filter((d) => d.size === a.choice);
          const scam = a.choice === 'small' && rnd() < 0.12;
          const stock = a.choice === 'small' && !scam && rnd() < 0.3;
          if (scam) g.pending = { by, type: 'scam', amount: round10(800 * spendFactor(ps)) };
          else if (stock) {
            const s = STOCKS[Math.floor(rnd() * STOCKS.length)];
            g.pending = { by, type: 'stock', stock: s.id };
          } else {
            const d = list[Math.floor(rnd() * list.length)];
            g.pending = { by, type: 'offer', deal: d.id };
          }
          return g;
        }
        return err('Выбери: маленькая или крупная сделка.');
      }
      case 'offer': {
        const d = deal(p.deal);
        if (a.choice === 'buy') {
          if (ps.cash < d.down) return err(`Нужно ${fmt(d.down)} на первый взнос, у тебя ${fmt(ps.cash)}. Возьми кредит в банке или пропусти.`);
          ps.cash -= d.down;
          ps.assets = [...(ps.assets || []), { deal: d.id, price: d.price, mortgage: d.price - d.down, income: d.income, kind: d.kind, n: g.seq + 1 }];
          log(g, `${name} купил(а): ${d.icon} ${d.name} (+${fmt(d.income)}/мес)`);
          checkFree(g, by);
        } else log(g, `${name} пропускает сделку «${d.name}»`);
        g.pending = null;
        endTurn(g);
        return g;
      }
      case 'stock': {
        const price = g.stocks[p.stock];
        const s = STOCKS.find((x) => x.id === p.stock);
        const qty = Math.max(0, Math.floor(Number(a.qty) || 0));
        if (a.choice === 'stockBuy') {
          if (qty <= 0) return err('Сколько акций купить?');
          if (qty * price > ps.cash) return err(`Не хватает денег: ${qty} × ${fmt(price)} = ${fmt(qty * price)}.`);
          ps.cash -= qty * price;
          ps.stocks = { ...(ps.stocks || {}), [s.id]: ((ps.stocks || {})[s.id] || 0) + qty };
          log(g, `${name} купил(а) ${qty} акций ${s.icon} ${s.name} по ${fmt(price)}`);
        } else if (a.choice === 'stockSell') {
          const have = (ps.stocks || {})[s.id] || 0;
          const q = Math.min(qty || have, have);
          if (q <= 0) return err('Нечего продавать.');
          ps.cash += q * price;
          ps.stocks = { ...ps.stocks, [s.id]: have - q };
          log(g, `${name} продал(а) ${q} акций ${s.icon} ${s.name} по ${fmt(price)}`);
        }
        g.pending = null;
        endTurn(g);
        return g;
      }
      case 'scam': {
        if (a.choice === 'buy') {
          if (ps.cash < p.amount) return err('Не хватает денег — и это к лучшему.');
          ps.cash -= p.amount;
          g.pending = { by, type: 'scamResult', amount: p.amount };
          log(g, `${name} поверил(а) мошеннику и потерял(а) ${fmt(p.amount)}`);
          return g;
        }
        log(g, `${name} не поверил(а) мошеннику 👏`);
        ps.scamDodged = (ps.scamDodged || 0) + 1;
        g.pending = null;
        endTurn(g);
        return g;
      }
      case 'spend':
      case 'pay':
      case 'baby':
      case 'fired':
      case 'scamResult':
      case 'freed':
      case 'marketInfo': {
        if (p.type === 'spend') {
          // не хватает - банк и продажа активов закрывают дыру (см. bankrupt)
          ps.cash -= p.amount;
          log(g, `${name}: ${p.text} −${fmt(p.amount)}`);
          if (ps.cash < 0) bankrupt(g, by);
        }
        g.pending = null;
        endTurn(g);
        return g;
      }
      case 'charity': {
        if (a.choice === 'buy') {
          if (ps.cash < p.amount) return err('Не хватает денег на пожертвование.');
          ps.cash -= p.amount;
          ps.charity = 3;
          log(g, `${name} помог(ла) приюту (${fmt(p.amount)}) и 3 хода бросает 2 кубика`);
        }
        g.pending = null;
        endTurn(g);
        return g;
      }
      case 'buyer': {
        if (a.choice === 'sell') {
          const idx = Number(a.asset);
          const asset = (ps.assets || [])[idx];
          if (!asset || asset.kind !== p.who) return err('Выбери, что продать.');
          const got = Math.round(asset.price * p.mult - asset.mortgage);
          ps.cash += got;
          ps.assets = ps.assets.filter((_, i) => i !== idx);
          log(g, `${name} продал(а) ${deal(asset.deal).icon} ${deal(asset.deal).name} и получил(а) ${fmt(got)}`);
        }
        g.pending = null;
        endTurn(g);
        return g;
      }
    }
    return err('Непонятный ответ.');
  },
  // банк: в свой ход, когда угодно
  loan(g, by, a) {
    if (g.phase !== 'play') return err('Игра не идёт.');
    const ps = g.players[by]?.ps;
    if (!ps) return err('Ты не в игре.');
    const amount = Math.floor((Number(a.amount) || 0) / 1000) * 1000;
    if (amount <= 0) return err('Кредит берётся по 1 000.');
    if (amount > maxLoan(ps, g.stocks)) return err(`Банк даст не больше ${fmt(maxLoan(ps, g.stocks))}: платить по кредиту нужно из месячного потока.`);
    ps.loan = (ps.loan || 0) + amount;
    ps.cash += amount;
    log(g, `${g.players[by].name} взял(а) кредит ${fmt(amount)} (платёж +${fmt(amount * LOAN_RATE)}/мес)`);
    return g;
  },
  repay(g, by, a) {
    const ps = g.players[by]?.ps;
    if (!ps) return err('Ты не в игре.');
    const target = a.what === 'debt' ? 'debt' : 'loan';
    if (target === 'loan') {
      const amount = Math.min(Math.floor((Number(a.amount) || 0) / 1000) * 1000, ps.loan || 0);
      if (amount <= 0) return err('Нечего гасить или сумма меньше 1 000.');
      if (ps.cash < amount) return err('Не хватает денег.');
      ps.cash -= amount;
      ps.loan -= amount;
      log(g, `${g.players[by].name} погасил(а) кредит ${fmt(amount)}`);
    } else {
      if (ps.debtLeft <= 0) return err('Этот долг уже закрыт.');
      if (ps.cash < ps.debtLeft) return err(`Чтобы закрыть долг, нужно ${fmt(ps.debtLeft)}.`);
      ps.cash -= ps.debtLeft;
      log(g, `${g.players[by].name} закрыл(а) «${prof(ps.prof).debt.name}» — расходы −${fmt(ps.debtPay)}/мес`);
      ps.debtLeft = 0;
    }
    checkFree(g, by);
    return g;
  },
  sell(g, by, a) {
    const ps = g.players[by]?.ps;
    if (!ps) return err('Ты не в игре.');
    const idx = Number(a.asset);
    const asset = (ps.assets || [])[idx];
    if (!asset) return err('Нечего продавать.');
    const got = Math.round(asset.price * 0.8 - asset.mortgage);
    ps.cash += got;
    ps.assets = ps.assets.filter((_, i) => i !== idx);
    log(g, `${g.players[by].name} срочно продал(а) ${deal(asset.deal).name} за ${fmt(got)}`);
    return g;
  },
  // биржа: купить или продать акции можно в любой момент по текущей цене
  trade(g, by, a) {
    if (g.phase !== 'play') return err('Игра не идёт.');
    const pl = g.players[by], ps = pl?.ps;
    if (!ps) return err('Ты не в игре.');
    const s = STOCKS.find((x) => x.id === a.stock);
    if (!s) return err('Нет такой компании.');
    const price = g.stocks[s.id], have = (ps.stocks || {})[s.id] || 0;
    let q = Math.floor(Number(a.qty) || 0);
    if (a.side === 'sell') {
      if (a.all) q = have;
      q = Math.min(q, have);
      if (q <= 0) return err('Нечего продавать.');
      ps.cash += q * price;
      ps.stocks = { ...ps.stocks, [s.id]: have - q };
      log(g, `${pl.name} продал(а) ${q} шт. ${s.icon} ${s.name} по ${fmt(price)}`);
    } else {
      if (a.all) q = Math.floor(ps.cash / price);
      if (q <= 0) return err('Не хватает денег даже на одну акцию.');
      if (q * price > ps.cash) return err(`Не хватает денег: нужно ${fmt(q * price)}.`);
      ps.cash -= q * price;
      ps.stocks = { ...(ps.stocks || {}), [s.id]: have + q };
      log(g, `${pl.name} купил(а) ${q} шт. ${s.icon} ${s.name} по ${fmt(price)}`);
    }
    checkFree(g, by);
    return g;
  },
  // этап 2: купить мечту и победить
  buyDream(g, by) {
    if (g.phase !== 'play') return err('Игра не идёт.');
    const pl = g.players[by], ps = pl?.ps;
    if (!ps) return err('Ты не в игре.');
    if (!ps.free) return err('Сначала выберись из денежной гонки: пассивный доход должен быть больше расходов.');
    const d = DREAMS.find((x) => x.id === pl.dream);
    if (ps.cash < d.price) return err(`На мечту нужно ${fmt(d.price)}, у тебя ${fmt(ps.cash)}.`);
    ps.cash -= d.price;
    ps.dreamAt = ps.months || 0;
    g.winner = by;
    g.pending = null;
    g.phase = 'end';
    log(g, `🏆 ${pl.name} купил(а) мечту: ${d.icon} ${d.name}! Победа!`);
    return g;
  },
  // хозяин может пропустить ход игрока, который ушёл
  skip(g, by) {
    if (g.host !== by) return err('Пропустить чужой ход может только хозяин.');
    if (Date.now() - (g.turnAt || 0) < 45000) return err('Подожди немного: игрок может ещё вернуться.');
    const who = g.players[currentId(g)];
    log(g, `${who.name} пропускает ход`);
    g.pending = null;
    endTurn(g);
    return g;
  },
  restart(g, by) {
    if (g.host !== by) return err('Начать заново может только хозяин.');
    const fresh = newGame(g.code, g.host);
    for (const [id, p] of Object.entries(g.players)) fresh.players[id] = { name: p.name, color: p.color, dream: p.dream, joined: p.joined };
    return fresh;
  },
};

function err(message) {
  return { error: message };
}
export function fmt(n) {
  const s = Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
  return (n < 0 ? '−$' : '$') + s;
}

function payday(g, by, landed) {
  const ps = g.players[by].ps;
  const name = g.players[by].name;
  const salary = ps.fired > 0 ? 0 : ps.salary;
  if (ps.fired > 0) ps.fired -= 1;
  const flow = salary + passive(ps, g.stocks) - expenses(ps);
  ps.cash += flow;
  // стартовый долг понемногу гасится платежами
  if (ps.debtLeft > 0) ps.debtLeft = Math.max(0, ps.debtLeft - ps.debtPay);
  ps.months = (ps.months || 0) + 1;
  log(g, `${name}: зарплата ${flow >= 0 ? '+' : ''}${fmt(flow)}${salary === 0 ? ' (без зарплаты)' : ''}`);
  if (ps.cash < 0) bankrupt(g, by);
}

function bankrupt(g, by) {
  const ps = g.players[by].ps;
  // порядок спасения: акции -> кредит банка -> продажа имущества -> новый старт
  for (const s of STOCKS) {
    if (ps.cash >= 0) break;
    const q = (ps.stocks || {})[s.id] || 0;
    ps.cash += q * g.stocks[s.id];
    if (ps.stocks) ps.stocks[s.id] = 0;
  }
  if (ps.cash < 0) {
    const room = maxLoan(ps, g.stocks);
    const need = Math.ceil(-ps.cash / 1000) * 1000;
    if (need <= room) {
      ps.loan = (ps.loan || 0) + need;
      ps.cash += need;
      log(g, `${g.players[by].name}: банк выдал вынужденный кредит ${fmt(need)}`);
    }
  }
  while (ps.cash < 0 && (ps.assets || []).length) {
    const a = ps.assets.pop();
    ps.cash += Math.round(a.price * 0.8 - a.mortgage);
    log(g, `${g.players[by].name}: пришлось срочно продать ${deal(a.deal).name}`);
  }
  if (ps.cash < 0) {
    {
      // мягкое банкротство: новый старт с той же профессией и бонусом
      const fresh = newPlayerState(ps.prof);
      fresh.cash += 500;
      fresh.pos = ps.pos;
      fresh.restarts = (ps.restarts || 0) + 1;
      g.players[by].ps = fresh;
      log(g, `${g.players[by].name} разорился(ась) и начинает заново с бонусом +${fmt(500)}`);
      g.bankruptNote = { by, n: g.seq + 1 };
    }
  }
}

function drawCard(g, by, cell, rnd) {
  const ps = g.players[by].ps;
  const name = g.players[by].name;
  switch (cell) {
    case 'pay':
      return { by, type: 'pay', flow: cashflow(ps, g.stocks) };
    case 'deal':
      return { by, type: 'deal' };
    case 'spend': {
      const s = SPENDS[Math.floor(rnd() * SPENDS.length)];
      return { by, type: 'spend', text: s.text, icon: s.icon, amount: round10(s.base * spendFactor(ps)) };
    }
    case 'baby': {
      if ((ps.kids || 0) >= 3) return { by, type: 'marketInfo', text: 'У тебя уже трое детей — в этот раз без пополнения 🙂' };
      ps.kids = (ps.kids || 0) + 1;
      log(g, `${name}: родился малыш! 👶 Расходы +${fmt(prof(ps.prof).kid)}/мес`);
      return { by, type: 'baby', add: prof(ps.prof).kid };
    }
    case 'fired': {
      ps.fired = 2;
      log(g, `${name}: сокращение на работе, 2 зарплаты без оклада`);
      return { by, type: 'fired' };
    }
    case 'charity':
      return { by, type: 'charity', amount: round10(ps.salary * 0.1) };
    case 'market': {
      const m = MARKETS[Math.floor(rnd() * MARKETS.length)];
      if (m.kind === 'stock') {
        g.stocks[m.id] = Math.max(1, Math.round(g.stocks[m.id] * m.mult));
        log(g, `📈 ${m.text}`);
        return { by, type: 'marketInfo', text: m.text };
      }
      if (m.kind === 'crash') {
        for (const s of STOCKS) g.stocks[s.id] = Math.max(1, Math.round(g.stocks[s.id] * 0.5));
        log(g, `📉 ${m.text}`);
        return { by, type: 'marketInfo', text: m.text };
      }
      const owns = (ps.assets || []).some((a) => a.kind === m.who);
      if (!owns) return { by, type: 'marketInfo', text: m.text + ' — но у тебя такого нет.' };
      return { by, type: 'buyer', who: m.who, mult: m.mult, text: m.text };
    }
  }
  return null;
}

function checkFree(g, by) {
  const pl = g.players[by];
  const ps = pl.ps;
  if (!ps.free && isFree(ps, g.stocks)) {
    ps.free = true;
    ps.freeAt = ps.months || 0;
    log(g, `🎉 ${pl.name} сбежал(а) из денежной гонки! Теперь копит на мечту.`);
    g.freedNote = { by, n: g.seq + 1 };
  }
}

function endTurn(g) {
  for (const id of g.order) checkFree(g, id);
  if (g.phase !== 'play') return;
  g.turn = (g.turn + 1) % g.order.length;
  g.turnAt = Date.now();
}

export function apply(state, by, action, rnd = Math.random) {
  const fn = ACTIONS[action?.type];
  if (!fn) return { error: 'Неизвестное действие.' };
  const g = clone(state);
  const res = fn(g, by, action, rnd);
  if (res && res.error) return res;
  res.seq = (state.seq || 0) + 1;
  return res;
}
