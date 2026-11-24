const http = require('http');
const DAY = 24 * 60 * 60 * 1000;
const LOAN_DAYS = 14;

// Données en mémoire
let books = [
  { id: 1, titre: 'Les Misérables', auteur: 'Victor Hugo', categorie: 'Roman' },
  { id: 2, titre: 'Clean Code', auteur: 'Robert C. Martin', categorie: 'Informatique' },
  { id: 3, titre: 'Le Petit Prince', auteur: 'Saint-Exupéry', categorie: 'Conte' }
];
let members = [
  { id: 1, nom: 'Ali Ben Salah' },
  { id: 2, nom: 'Sarra Mejri' }
];
// Un prêt en retard pour la démonstration
let loans = [
  { id: 1, bookId: 2, memberId: 1, date: Date.now() - 20 * DAY, retour: null }
];

// ---------- Fonctions utiles ----------
const esc = s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
const fmt = t => new Date(t).toLocaleDateString('fr-FR');
const due = l => l.date + LOAN_DAYS * DAY;
const isLate = l => !l.retour && Date.now() > due(l);
const activeLoan = bookId => loans.find(l => l.bookId === bookId && !l.retour);
const bookOf = id => books.find(b => b.id === id);
const memberOf = id => members.find(m => m.id === id);
const nextId = arr => (arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1);

// ---------- Mise en page commune ----------
function layout(title, content) {
  const late = loans.filter(isLate);
  const alerts = late.map(l =>
    `<p class="alert">⚠ Retard : « ${esc(bookOf(l.bookId).titre)} » emprunté par ${esc(memberOf(l.memberId).nom)} (retour prévu le ${fmt(due(l))})</p>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>${title} - Smart Library</title>
<style>
  body { font-family: Arial, sans-serif; background: #f4f6f8; margin: 0; }
  nav { background: #2c3e50; padding: 15px; text-align: center; }
  nav a { color: white; text-decoration: none; margin: 0 15px; font-weight: bold; }
  nav a:hover { text-decoration: underline; }
  main { max-width: 850px; margin: 20px auto; padding: 0 15px; }
  table { width: 100%; border-collapse: collapse; background: white; }
  th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
  th { background: #3498db; color: white; }
  form.box { background: white; padding: 12px; margin-top: 15px; border-radius: 8px; }
  input, select, button { padding: 8px; margin: 4px 0; }
  button { background: #27ae60; color: white; border: none; cursor: pointer; border-radius: 4px; }
  .alert { background: #fdecea; border-left: 5px solid #e74c3c; color: #c0392b; padding: 10px; margin: 5px 0; }
  .red { color: #c0392b; font-weight: bold; } .green { color: #27ae60; font-weight: bold; }
  .cards { display: flex; gap: 10px; }
  .card { flex: 1; background: white; padding: 20px; text-align: center; border-radius: 8px; }
  .card b { display: block; font-size: 32px; color: #2c3e50; }
</style></head>
<body>
  <nav>
    <a href="/">Accueil</a><a href="/books">Livres</a><a href="/members">Abonnés</a><a href="/loans">Emprunts</a>
  </nav>
  <main>
    <h1>${title}</h1>
    ${alerts}
    ${content}
  </main>
</body></html>`;
}

// ---------- Pages ----------
function home() {
  const borrowed = books.filter(b => activeLoan(b.id)).length;
  const late = loans.filter(isLate).length;
  return layout('📚 Smart Library', `
    <div class="cards">
      <div class="card"><b>${books.length}</b>Livres</div>
      <div class="card"><b>${books.length - borrowed}</b>Disponibles</div>
      <div class="card"><b>${borrowed}</b>Empruntés</div>
      <div class="card"><b>${late}</b>En retard</div>
    </div>
    <p>Abonnés inscrits : ${members.length}</p>`);
}

function booksPage() {
  const rows = books.map(b => `
    <tr><td>${b.id}</td><td>${esc(b.titre)}</td><td>${esc(b.auteur)}</td><td>${esc(b.categorie)}</td>
    <td>${activeLoan(b.id) ? '<span class="red">Emprunté</span>' : '<span class="green">Disponible</span>'}</td></tr>`).join('');
  return layout('Livres', `
    <table><tr><th>#</th><th>Titre</th><th>Auteur</th><th>Catégorie</th><th>Statut</th></tr>${rows}</table>
    <form class="box" method="POST" action="/books">
      <b>Ajouter un livre</b><br>
      <input name="titre" placeholder="Titre" required>
      <input name="auteur" placeholder="Auteur" required>
      <input name="categorie" placeholder="Catégorie" required>
      <button>Ajouter</button>
    </form>`);
}

function membersPage() {
  const rows = members.map(m => `<tr><td>${m.id}</td><td>${esc(m.nom)}</td></tr>`).join('');
  return layout('Abonnés', `
    <table><tr><th>#</th><th>Nom</th></tr>${rows}</table>
    <form class="box" method="POST" action="/members">
      <b>Ajouter un abonné</b><br>
      <input name="nom" placeholder="Nom complet" required>
      <button>Ajouter</button>
    </form>`);
}

function loansPage() {
  const rows = loans.slice().reverse().map(l => {
    const etat = l.retour
      ? 'Retourné le ' + fmt(l.retour)
      : (isLate(l) ? '<span class="red">En retard</span>' : 'En cours');
    const action = l.retour ? '' :
      `<form method="POST" action="/return"><input type="hidden" name="id" value="${l.id}"><button>Retourner</button></form>`;
    return `<tr><td>${esc(bookOf(l.bookId).titre)}</td><td>${esc(memberOf(l.memberId).nom)}</td>
      <td>${fmt(l.date)}</td><td>${fmt(due(l))}</td><td>${etat}</td><td>${action}</td></tr>`;
  }).join('');

  const bookOptions = books.filter(b => !activeLoan(b.id))
    .map(b => `<option value="${b.id}">${esc(b.titre)}</option>`).join('');
  const memberOptions = members.map(m => `<option value="${m.id}">${esc(m.nom)}</option>`).join('');

  return layout('Emprunts', `
    <table><tr><th>Livre</th><th>Abonné</th><th>Emprunté le</th><th>Retour prévu</th><th>État</th><th></th></tr>${rows}</table>
    <form class="box" method="POST" action="/borrow">
      <b>Nouvel emprunt</b><br>
      <select name="bookId">${bookOptions || '<option value="">Aucun livre disponible</option>'}</select>
      <select name="memberId">${memberOptions}</select>
      <button>Emprunter</button>
    </form>`);
}

const routes = { '/': home, '/books': booksPage, '/members': membersPage, '/loans': loansPage };

// ---------- Serveur ----------
const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    if (req.url === '/health') return res.end('ok');
    if (req.url === '/api/books') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(books.map(b => ({ ...b, disponible: !activeLoan(b.id) }))));
    }
    if (req.url === '/api/loans') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(loans.map(l => ({ ...l, enRetard: isLate(l) }))));
    }
    if (routes[req.url]) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(routes[req.url]());
    }
    res.writeHead(404);
    return res.end('Page introuvable');
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      const p = new URLSearchParams(body);
      let back = '/';

      if (req.url === '/books') {
        books.push({ id: nextId(books), titre: p.get('titre'), auteur: p.get('auteur'), categorie: p.get('categorie') });
        back = '/books';
      } else if (req.url === '/members') {
        members.push({ id: nextId(members), nom: p.get('nom') });
        back = '/members';
      } else if (req.url === '/borrow') {
        const bookId = Number(p.get('bookId')), memberId = Number(p.get('memberId'));
        if (bookOf(bookId) && memberOf(memberId) && !activeLoan(bookId)) {
          loans.push({ id: nextId(loans), bookId, memberId, date: Date.now(), retour: null });
        }
        back = '/loans';
      } else if (req.url === '/return') {
        const l = loans.find(x => x.id === Number(p.get('id')));
        if (l && !l.retour) l.retour = Date.now();
        back = '/loans';
      }

      res.writeHead(303, { Location: back });
      res.end();
    });
    return;
  }

  res.writeHead(405);
  res.end();
});

server.listen(3000, '0.0.0.0', () => console.log('Server running on port 3000'));