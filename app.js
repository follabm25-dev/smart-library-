const http = require('http');
const { URL } = require('url');
const DAY = 24 * 60 * 60 * 1000;
const LOAN_DAYS = 14;

// ---------- Données en mémoire ----------
let books = [
  { id: 1, titre: 'Clean Code', auteur: 'Robert C. Martin', categorie: 'Informatique', tag: 'TAG-001', color: '#0b1f4d' },
  { id: 2, titre: 'Python', auteur: 'Guido van Rossum', categorie: 'Informatique', tag: 'TAG-002', color: '#1d4ed8' },
  { id: 3, titre: 'Deep Learning', auteur: 'Ian Goodfellow', categorie: 'IA', tag: 'TAG-003', color: '#0e7490' },
  { id: 4, titre: 'Flutter', auteur: 'Google', categorie: 'Mobile', tag: 'TAG-004', color: '#60a5fa' }
];
let members = [
  { id: 1, nom: 'Folla Ben Mahmoud', uid: 'CARD-001' },
  { id: 2, nom: 'Sarra Mejri', uid: 'CARD-002' }
];
let loans = [
  { id: 1, bookId: 1, memberId: 1, date: Date.now() - 20 * DAY, retour: null }, // en retard
  { id: 2, bookId: 4, memberId: 2, date: Date.now() - 12 * DAY, retour: null }  // bientôt à rendre
];

// ---------- Utilitaires ----------
const esc = s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
const fmt = t => new Date(t).toLocaleDateString('fr-FR');
const due = l => l.date + LOAN_DAYS * DAY;
const isLate = l => !l.retour && Date.now() > due(l);
const soon = l => !l.retour && !isLate(l) && due(l) - Date.now() < 3 * DAY;
const activeLoan = bookId => loans.find(l => l.bookId === bookId && !l.retour);
const bookOf = id => books.find(b => b.id === id);
const memberOf = id => members.find(m => m.id === id);
const nextId = arr => (arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1);

function notifications() {
  const list = [];
  loans.filter(isLate).forEach(l => list.push({ type: 'late',
    text: `« ${bookOf(l.bookId).titre} » est en retard (${memberOf(l.memberId).nom}), retour prévu le ${fmt(due(l))}` }));
  loans.filter(soon).forEach(l => list.push({ type: 'soon',
    text: `Pensez à rendre « ${bookOf(l.bookId).titre} » avant le ${fmt(due(l))} (${memberOf(l.memberId).nom})` }));
  return list;
}

// ---------- Mise en page ----------
const CSS = `
*{box-sizing:border-box}
body{margin:0;font-family:Segoe UI,Arial,sans-serif;background:#eef4ff;color:#0f2447;display:flex;min-height:100vh}
aside{width:230px;background:linear-gradient(180deg,#0a1f44,#0b3a8a);color:#fff;padding:20px 12px;flex-shrink:0}
aside h2{text-align:center;margin:0 0 4px;font-size:22px;letter-spacing:1px}
aside small{display:block;text-align:center;opacity:.8;margin-bottom:20px}
aside a{display:flex;justify-content:space-between;align-items:center;color:#fff;text-decoration:none;padding:12px 14px;border-radius:8px;margin:4px 0}
aside a:hover,aside a.on{background:#1d6fe8}
.badge{background:#ef4444;color:#fff;border-radius:50%;padding:2px 8px;font-size:12px}
main{flex:1;padding:24px;max-width:1100px}
h1{margin:0 0 4px;color:#0a2a8a}
.sub{color:#5a6b8c;font-style:italic;margin-bottom:18px}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
.card{color:#fff;border-radius:10px;padding:18px}
.card b{display:block;font-size:34px}
.c1{background:#1d6fe8}.c2{background:#16a34a}.c3{background:#f59e0b}.c4{background:#dc2626}
.box{background:#fff;border-radius:10px;padding:16px;margin-bottom:18px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
table{width:100%;border-collapse:collapse}
th{background:#1d6fe8;color:#fff;text-align:left;padding:10px}
td{padding:10px;border-bottom:1px solid #e5eaf3;vertical-align:middle}
.cover{display:inline-block;width:34px;height:46px;border-radius:4px;vertical-align:middle;margin-right:10px}
.ok{background:#dcfce7;color:#15803d;padding:3px 10px;border-radius:12px;font-weight:bold;font-size:13px}
.ko{background:#fee2e2;color:#b91c1c;padding:3px 10px;border-radius:12px;font-weight:bold;font-size:13px}
.red{color:#b91c1c;font-weight:bold}
input,select{padding:9px;border:1px solid #c5d3ee;border-radius:6px;margin:3px 0}
button{background:#1d6fe8;color:#fff;border:none;padding:9px 14px;border-radius:6px;cursor:pointer;font-weight:bold}
button.g{background:#16a34a}
.alert{background:#fee2e2;border-left:5px solid #dc2626;color:#991b1b;padding:10px 14px;border-radius:6px;margin-bottom:8px}
.info{background:#e0edff;border-left:5px solid #1d6fe8;color:#1e3a8a;padding:10px 14px;border-radius:6px;margin-bottom:8px}
.status{background:#dcfce7;border:1px solid #86efac;border-radius:10px;padding:14px;color:#166534;font-weight:bold}
form.inline{display:inline}
`;

function layout(active, title, content) {
  const n = notifications().length;
  const link = (href, label, extra = '') =>
    `<a href="${href}" class="${active === href ? 'on' : ''}"><span>${label}</span>${extra}</a>`;
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} - Smart Library</title><style>${CSS}</style></head>
<body>
<aside>
  <h2>📚 SMART LIBRARY</h2><small>Bibliothèque Intelligente v1.0</small>
  ${link('/', '🏠 Tableau de bord')}
  ${link('/search', '🔍 Recherche')}
  ${link('/books', '📖 Livres')}
  ${link('/loans', '🔁 Emprunts')}
  ${link('/members', '👥 Abonnés')}
  ${link('/notifications', '🔔 Notifications', n ? `<span class="badge">${n}</span>` : '')}
</aside>
<main>
  <h1>${title}</h1>
  <div class="sub">Accédez · Cherchez · Empruntez facilement</div>
  ${content}
</main></body></html>`;
}

function bookRow(b) {
  const l = activeLoan(b.id);
  return `<tr>
    <td><span class="cover" style="background:${b.color || '#1d6fe8'}"></span><b>${esc(b.titre)}</b></td>
    <td>${esc(b.auteur)}</td><td>${esc(b.categorie)}</td><td>${esc(b.tag)}</td>
    <td>${l ? '<span class="ko">Emprunté</span>' : '<span class="ok">Disponible</span>'}</td></tr>`;
}

// ---------- Pages ----------
function home() {
  const active = loans.filter(l => !l.retour).length;
  const late = loans.filter(isLate).length;
  const recent = books.slice(0, 4).map(bookRow).join('');
  const notifs = notifications().slice(0, 3)
    .map(x => `<div class="${x.type === 'late' ? 'alert' : 'info'}">${esc(x.text)}</div>`).join('') || '<p>Aucune notification.</p>';
  return layout('/', 'Tableau de bord', `
    <div class="cards">
      <div class="card c1"><b>${books.length}</b>Livres</div>
      <div class="card c2"><b>${members.length}</b>Lecteurs inscrits</div>
      <div class="card c3"><b>${active}</b>Emprunts actifs</div>
      <div class="card c4"><b>${late}</b>En retard</div>
    </div>
    <div class="status">✅ Système opérationnel — La bibliothèque est en ligne</div>
    <div class="box"><h3>Catalogue des livres</h3>
      <table><tr><th>Titre</th><th>Auteur</th><th>Catégorie</th><th>Tag RFID</th><th>Statut</th></tr>${recent}</table></div>
    <div class="box"><h3>Notifications</h3>${notifs}</div>`);
}

function searchPage(q) {
  const term = (q || '').toLowerCase();
  const found = books.filter(b => !term ||
    [b.titre, b.auteur, b.categorie].some(x => x.toLowerCase().includes(term)));
  return layout('/search', 'Rechercher un livre', `
    <div class="box">
      <form method="GET" action="/search">
        <input name="q" value="${esc(q || '')}" placeholder="Titre, auteur ou catégorie..." style="width:70%">
        <button>🔍 Rechercher</button>
      </form>
    </div>
    <div class="box"><table>
      <tr><th>Titre</th><th>Auteur</th><th>Catégorie</th><th>Tag RFID</th><th>Statut</th></tr>
      ${found.map(bookRow).join('') || '<tr><td colspan="5">Aucun résultat.</td></tr>'}
    </table></div>`);
}

function booksPage() {
  return layout('/books', 'Catalogue des livres', `
    <div class="box"><table>
      <tr><th>Titre</th><th>Auteur</th><th>Catégorie</th><th>Tag RFID</th><th>Statut</th></tr>
      ${books.map(bookRow).join('')}</table></div>
    <form class="box" method="POST" action="/books">
      <b>Ajouter un livre</b><br>
      <input name="titre" placeholder="Titre" required>
      <input name="auteur" placeholder="Auteur" required>
      <input name="categorie" placeholder="Catégorie" required>
      <input name="tag" placeholder="Tag RFID (ex: TAG-005)" required>
      <button>Ajouter</button>
    </form>`);
}

function membersPage() {
  const rows = members.map(m => `<tr><td>${m.id}</td><td>${esc(m.nom)}</td><td>${esc(m.uid)}</td></tr>`).join('');
  return layout('/members', 'Abonnés', `
    <div class="box"><table><tr><th>#</th><th>Nom</th><th>Carte RFID</th></tr>${rows}</table></div>
    <form class="box" method="POST" action="/members">
      <b>Ajouter un abonné</b><br>
      <input name="nom" placeholder="Nom complet" required>
      <input name="uid" placeholder="Carte RFID (ex: CARD-003)" required>
      <button>Ajouter</button>
    </form>`);
}

function loansPage() {
  const rows = loans.slice().reverse().map(l => {
    const etat = l.retour ? 'Retourné le ' + fmt(l.retour)
      : isLate(l) ? '<span class="red">⚠ En retard</span>' : 'En cours';
    const actions = l.retour ? '' : `
      <form class="inline" method="POST" action="/return"><input type="hidden" name="id" value="${l.id}"><button class="g">Retourner</button></form>
      <form class="inline" method="POST" action="/extend"><input type="hidden" name="id" value="${l.id}"><button>Prolonger</button></form>`;
    return `<tr><td>${esc(bookOf(l.bookId).titre)}</td><td>${esc(memberOf(l.memberId).nom)}</td>
      <td>${fmt(l.date)}</td><td>${fmt(due(l))}</td><td>${etat}</td><td>${actions}</td></tr>`;
  }).join('');
  const bookOpts = books.filter(b => !activeLoan(b.id)).map(b => `<option value="${b.id}">${esc(b.titre)}</option>`).join('');
  const memOpts = members.map(m => `<option value="${m.id}">${esc(m.nom)}</option>`).join('');
  return layout('/loans', 'Mes emprunts', `
    <div class="box"><table>
      <tr><th>Livre</th><th>Abonné</th><th>Emprunté le</th><th>À rendre avant</th><th>État</th><th></th></tr>${rows}</table></div>
    <form class="box" method="POST" action="/borrow">
      <b>Nouvel emprunt</b><br>
      <select name="bookId">${bookOpts || '<option value="">Aucun livre disponible</option>'}</select>
      <select name="memberId">${memOpts}</select>
      <button>Emprunter</button>
    </form>`);
}

function notifPage() {
  const list = notifications();
  return layout('/notifications', 'Notifications', `
    <div class="box">${list.map(x => `<div class="${x.type === 'late' ? 'alert' : 'info'}">${esc(x.text)}</div>`).join('')
      || '<p>Aucune notification.</p>'}</div>`);
}

const pages = {
  '/': home, '/books': booksPage, '/members': membersPage,
  '/loans': loansPage, '/notifications': notifPage
};

// ---------- API ----------
function json(res, data, code = 200) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// Simulation ESP32 + RFID : /api/scan?uid=CARD-001&book=TAG-003
// Si le livre est disponible -> emprunt, sinon -> retour
function scan(uid, tag) {
  const m = members.find(x => x.uid === uid);
  const b = books.find(x => x.tag === tag);
  if (!m || !b) return { ok: false, message: 'Carte ou tag inconnu' };
  const l = activeLoan(b.id);
  if (l) { l.retour = Date.now(); return { ok: true, action: 'retour', livre: b.titre }; }
  loans.push({ id: nextId(loans), bookId: b.id, memberId: m.id, date: Date.now(), retour: null });
  return { ok: true, action: 'emprunt', livre: b.titre, abonne: m.nom };
}

// ---------- Serveur ----------
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  if (req.method === 'GET') {
    if (path === '/health') return json(res, { status: 'ok' });
    if (path === '/api/books') return json(res, books.map(b => ({ ...b, disponible: !activeLoan(b.id) })));
    if (path === '/api/loans') return json(res, loans.map(l => ({ ...l, enRetard: isLate(l) })));
    if (path === '/api/scan') return json(res, scan(url.searchParams.get('uid'), url.searchParams.get('book')));
    if (path === '/search') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(searchPage(url.searchParams.get('q')));
    }
    if (pages[path]) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(pages[path]());
    }
    res.writeHead(404); return res.end('Page introuvable');
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      const p = new URLSearchParams(body);
      let back = '/';
      if (path === '/books') {
        books.push({ id: nextId(books), titre: p.get('titre'), auteur: p.get('auteur'),
          categorie: p.get('categorie'), tag: p.get('tag'), color: '#1d6fe8' });
        back = '/books';
      } else if (path === '/members') {
        members.push({ id: nextId(members), nom: p.get('nom'), uid: p.get('uid') });
        back = '/members';
      } else if (path === '/borrow') {
        const bookId = Number(p.get('bookId')), memberId = Number(p.get('memberId'));
        if (bookOf(bookId) && memberOf(memberId) && !activeLoan(bookId))
          loans.push({ id: nextId(loans), bookId, memberId, date: Date.now(), retour: null });
        back = '/loans';
      } else if (path === '/return') {
        const l = loans.find(x => x.id === Number(p.get('id')));
        if (l && !l.retour) l.retour = Date.now();
        back = '/loans';
      } else if (path === '/extend') {
        const l = loans.find(x => x.id === Number(p.get('id')));
        if (l && !l.retour) l.date += 7 * DAY; // +7 jours
        back = '/loans';
      }
      res.writeHead(303, { Location: back });
      res.end();
    });
    return;
  }
  res.writeHead(405); res.end();
});

server.listen(3000, '0.0.0.0', () => console.log('Server running on port 3000'));