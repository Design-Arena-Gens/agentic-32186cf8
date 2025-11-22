const state = {
  all: [],
  view: [],
  categories: new Set(),
  wilayas: new Set(),
};

function normalize(str) {
  return (str || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function loadData() {
  const res = await fetch('./data/companies.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Impossible de charger les donn?es');
  const data = await res.json();
  state.all = data;
  state.view = data;
  for (const c of data) {
    if (c.category) state.categories.add(c.category);
    if (c.wilaya) state.wilayas.add(c.wilaya);
  }
}

function populateFilters() {
  const categorySelect = document.getElementById('category');
  const wilayaSelect = document.getElementById('wilaya');

  [...state.categories].sort().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat; opt.textContent = cat; categorySelect.appendChild(opt);
  });
  [...state.wilayas].sort().forEach(w => {
    const opt = document.createElement('option');
    opt.value = w; opt.textContent = w; wilayaSelect.appendChild(opt);
  });
}

function applyFilters() {
  const q = normalize(document.getElementById('q').value);
  const cat = document.getElementById('category').value;
  const wilaya = document.getElementById('wilaya').value;
  const sort = document.getElementById('sort').value;

  let list = state.all.filter(item => {
    const matchesQ = !q || [
      item.name,
      item.description,
      item.city,
      item.wilaya,
      item.category,
      item.type,
    ].some(v => normalize(v).includes(q));

    const matchesCat = !cat || item.category === cat;
    const matchesWilaya = !wilaya || item.wilaya === wilaya;
    return matchesQ && matchesCat && matchesWilaya;
  });

  const [key, dir] = sort.split('-');
  list.sort((a,b) => {
    const av = normalize(a[key] || '');
    const bv = normalize(b[key] || '');
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });

  state.view = list;
  render();
}

function render() {
  const container = document.getElementById('results');
  const count = document.getElementById('count');
  container.innerHTML = '';
  count.textContent = `${state.view.length} r?sultat${state.view.length > 1 ? 's' : ''}`;

  const tpl = document.getElementById('card-template');
  for (const c of state.view) {
    const node = tpl.content.cloneNode(true);
    node.querySelector('.company__name').textContent = c.name;
    node.querySelector('.company__category').textContent = c.category || '?';
    node.querySelector('.company__desc').textContent = c.description || '';
    node.querySelector('.company__city').textContent = c.city || '?';
    node.querySelector('.company__wilaya').textContent = c.wilaya || '?';
    node.querySelector('.company__type').textContent = c.type || '?';

    const link = node.querySelector('a');
    if (c.website) {
      link.href = c.website;
    } else {
      link.textContent = 'Aucune URL';
      link.classList.add('btn-secondary');
      link.removeAttribute('href');
    }
    container.appendChild(node);
  }
}

function bindUI() {
  const inputs = ['q', 'category', 'wilaya', 'sort'].map(id => document.getElementById(id));
  for (const el of inputs) el.addEventListener('input', applyFilters);
  document.getElementById('reset').addEventListener('click', () => {
    for (const el of inputs) el.value = '';
    document.getElementById('sort').value = 'name-asc';
    applyFilters();
  });
}

(async function init() {
  try {
    await loadData();
    populateFilters();
    bindUI();
    applyFilters();
  } catch (e) {
    const container = document.getElementById('results');
    container.innerHTML = `<div class="card">Erreur: ${e.message}</div>`;
  }
})();
