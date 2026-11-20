// Сеть: одна комната = один объект состояния. Firebase, если есть настройки, иначе «демо» в одном браузере.
import { apply, newGame } from './engine.js';
import { firebaseConfig } from './firebase-config.js';

const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const makeCode = () => Array.from({ length: 4 }, () => ALPH[Math.floor(Math.random() * ALPH.length)]).join('');
export const online = !!(firebaseConfig && firebaseConfig.apiKey);

// Firebase выбрасывает пустые массивы/объекты — возвращаем их на место
export function normalize(g) {
  if (!g) return null;
  g.players ||= {};
  g.order ||= [];
  g.log ||= [];
  g.pending ||= null;
  g.offer ||= null;
  g.notes = g.notes ? Object.values(g.notes) : [];
  g.stocks ||= {};
  for (const p of Object.values(g.players)) {
    if (p.ps) {
      p.ps.assets = p.ps.assets ? Object.values(p.ps.assets) : [];
      p.ps.stocks ||= {};
      p.ps.debts = p.ps.debts ? Object.values(p.ps.debts) : [];
    }
  }
  if (!Array.isArray(g.log)) g.log = Object.values(g.log);
  if (!Array.isArray(g.order)) g.order = Object.values(g.order);
  return g;
}
const clean = (g) => JSON.parse(JSON.stringify(g));

// ---------- Firebase ----------
async function firebaseTransport() {
  const V = '10.12.2';
  const [{ initializeApp }, A, D] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-database.js`),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const cred = await A.signInAnonymously(auth);
  const db = D.getDatabase(app);
  const uid = cred.user.uid;
  let unsub = null, ref = null;
  return {
    uid,
    async create() {
      for (let i = 0; i < 8; i++) {
        const code = makeCode();
        const r = D.ref(db, 'rooms/' + code);
        const res = await D.runTransaction(r, (cur) => (cur ? undefined : clean(newGame(code, uid))), { applyLocally: false });
        if (res.committed) return code;
      }
      throw new Error('Не получилось создать комнату, попробуй ещё раз.');
    },
    async exists(code) {
      const s = await D.get(D.ref(db, 'rooms/' + code));
      return s.exists();
    },
    watch(code, cb) {
      unsub?.();
      ref = D.ref(db, 'rooms/' + code);
      unsub = D.onValue(ref, (s) => cb(normalize(s.val())));
    },
    async act(action) {
      let error = null;
      const res = await D.runTransaction(ref, (cur) => {
        if (!cur) return cur; // кэш ещё пуст — Firebase повторит с данными сервера
        const n = apply(normalize(cur), uid, action);
        if (n.error) { error = n.error; return; }
        error = null;
        return clean(n);
      });
      if (error) return { error };
      if (!res.committed) return { error: 'Не получилось, попробуй ещё раз.' };
      return {};
    },
  };
}

// ---------- демо: несколько вкладок одного браузера ----------
function localTransport() {
  let uid = sessionStorage.getItem('me-uid');
  if (!uid) { uid = 'u' + Math.random().toString(36).slice(2, 10); sessionStorage.setItem('me-uid', uid); }
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel('money-escape') : null;
  const key = (c) => 'me-room-' + c;
  const read = (c) => normalize(JSON.parse(localStorage.getItem(key(c)) || 'null'));
  let code = null, cb = null;
  const fire = () => cb && cb(read(code));
  bc && (bc.onmessage = (e) => e.data === code && fire());
  window.addEventListener('storage', (e) => e.key === key(code) && fire());
  return {
    uid,
    async create() {
      let c; do c = makeCode(); while (localStorage.getItem(key(c)));
      localStorage.setItem(key(c), JSON.stringify(newGame(c, uid)));
      return c;
    },
    async exists(c) { return !!localStorage.getItem(key(c)); },
    watch(c, f) { code = c; cb = f; fire(); },
    async act(action) {
      const cur = read(code);
      if (!cur) return { error: 'Комната пропала.' };
      const n = apply(cur, uid, action);
      if (n.error) return n;
      localStorage.setItem(key(code), JSON.stringify(n));
      bc?.postMessage(code);
      fire();
      return {};
    },
  };
}

export async function connect() {
  return online ? firebaseTransport() : localTransport();
}
