const CONFIG = Object.freeze({
  backendEnabled: false,
  sheetsUrl: '',
  storageKey: 'kloub-air-plomberie-demo-requests-v1',
});

const seedRequests = [
  { id: 'demo-1', client: 'Mme Martin', service: 'Dépannage urgent', priority: 'Haute', slot: "Aujourd'hui 09h30", status: 'Nouveau' },
  { id: 'demo-2', client: 'SCI Les Pins', service: 'Climatisation', priority: 'Moyenne', slot: "Aujourd'hui 14h00", status: 'A planifier' },
  { id: 'demo-3', client: 'M. Bernard', service: 'Plomberie', priority: 'Haute', slot: 'Demain 08h00', status: 'En cours' },
  { id: 'demo-4', client: 'Cabinet médical Nord', service: 'Chauffage', priority: 'Moyenne', slot: 'Vendredi 10h30', status: 'A planifier' },
  { id: 'demo-5', client: 'Mme Roux', service: 'Plomberie', priority: 'Basse', slot: 'Lundi 16h00', status: 'Terminé' },
];

const statusFlow = ['Nouveau', 'A planifier', 'En cours', 'Terminé'];

let requests = loadRequests();

const panels = document.querySelectorAll('.panel');
const navItems = document.querySelectorAll('.nav-item');
const kpiGrid = document.getElementById('kpi-grid');
const priorityList = document.getElementById('priority-list');
const serviceChart = document.getElementById('service-chart');
const todayCount = document.getElementById('today-count');
const requestRows = document.getElementById('request-rows');
const statusFilter = document.getElementById('status-filter');
const timeline = document.getElementById('timeline');
const dialog = document.getElementById('request-dialog');
const form = document.getElementById('request-form');

function loadRequests() {
  const saved = localStorage.getItem(CONFIG.storageKey);
  if (!saved) return [...seedRequests];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed)
      ? parsed.map((request, index) => ({ id: request.id || `saved-${index}-${Date.now()}`, ...request }))
      : [...seedRequests];
  } catch {
    return [...seedRequests];
  }
}

function saveRequests() {
  localStorage.setItem(CONFIG.storageKey, JSON.stringify(requests));
}

function byPriority(a, b) {
  const weights = { Haute: 0, Moyenne: 1, Basse: 2 };
  return weights[a.priority] - weights[b.priority];
}

function priorityClass(priority) {
  return priority === 'Haute' ? 'pill high' : 'pill';
}

function escHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nextStatus(status) {
  const currentIndex = statusFlow.indexOf(status);
  return statusFlow[Math.min(currentIndex + 1, statusFlow.length - 1)] || statusFlow[0];
}

function renderKpis() {
  const active = requests.filter((request) => request.status !== 'Terminé').length;
  const urgent = requests.filter((request) => request.priority === 'Haute').length;
  const planned = requests.filter((request) => request.status === 'A planifier').length;
  const done = requests.filter((request) => request.status === 'Terminé').length;

  kpiGrid.innerHTML = [
    ['Demandes actives', active],
    ['Urgences', urgent],
    ['A planifier', planned],
    ['Terminées', done],
  ].map(([label, value]) => `<article class="kpi-card"><span>${label}</span><strong>${value}</strong></article>`).join('');
}

function renderPriorities() {
  const priorityRequests = [...requests]
    .filter((request) => request.status !== 'Terminé')
    .sort(byPriority)
    .slice(0, 4);

  todayCount.textContent = `${priorityRequests.length} demande${priorityRequests.length > 1 ? 's' : ''}`;
  priorityList.innerHTML = priorityRequests.map((request) => `
    <article class="request-card">
      <div>
        <strong>${escHtml(request.client)}</strong>
        <p>${escHtml(request.service)} · ${escHtml(request.slot)}</p>
      </div>
      <span class="${priorityClass(request.priority)}">${escHtml(request.priority)}</span>
    </article>
  `).join('');
}

function renderChart() {
  const counts = requests.reduce((acc, request) => {
    acc[request.service] = (acc[request.service] || 0) + 1;
    return acc;
  }, {});
  const max = Math.max(...Object.values(counts), 1);

  serviceChart.innerHTML = Object.entries(counts).map(([service, count]) => `
    <div class="chart-row">
      <span>${escHtml(service)}</span>
      <div class="bar"><span style="width: ${(count / max) * 100}%"></span></div>
      <strong>${count}</strong>
    </div>
  `).join('');
}

function renderRows() {
  const selectedStatus = statusFilter.value;
  const visibleRequests = selectedStatus === 'all'
    ? requests
    : requests.filter((request) => request.status === selectedStatus);

  requestRows.innerHTML = visibleRequests.map((request) => `
    <tr data-id="${escHtml(request.id)}">
      <td>${escHtml(request.client)}</td>
      <td>${escHtml(request.service)}</td>
      <td><span class="${priorityClass(request.priority)}">${escHtml(request.priority)}</span></td>
      <td>${escHtml(request.slot)}</td>
      <td>${escHtml(request.status)}</td>
      <td>
        <div class="row-actions">
          <button type="button" class="table-action" data-action="advance">${request.status === 'Terminé' ? 'Archivé' : 'Avancer'}</button>
          <button type="button" class="table-action danger" data-action="delete">Supprimer</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderTimeline() {
  timeline.innerHTML = [...requests]
    .filter((request) => request.status !== 'Terminé')
    .sort(byPriority)
    .map((request) => `
      <article class="timeline-item">
        <strong>${escHtml(request.slot)}</strong>
        <p>${escHtml(request.client)} · ${escHtml(request.service)} · ${escHtml(request.status)}</p>
      </article>
    `).join('');
}

function render() {
  renderKpis();
  renderPriorities();
  renderChart();
  renderRows();
  renderTimeline();
}

navItems.forEach((item) => {
  item.addEventListener('click', () => {
    navItems.forEach((navItem) => navItem.classList.remove('is-active'));
    panels.forEach((panel) => panel.classList.remove('is-active'));
    item.classList.add('is-active');
    document.getElementById(item.dataset.panel).classList.add('is-active');
  });
});

statusFilter.addEventListener('change', renderRows);

requestRows.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const row = button.closest('tr[data-id]');
  const id = row?.dataset.id;
  if (!id) return;

  if (button.dataset.action === 'delete') {
    requests = requests.filter((request) => request.id !== id);
  }

  if (button.dataset.action === 'advance') {
    requests = requests.map((request) => (
      request.id === id ? { ...request, status: nextStatus(request.status) } : request
    ));
  }

  saveRequests();
  render();
});

document.getElementById('add-request').addEventListener('click', () => {
  dialog.showModal();
});

document.getElementById('cancel-dialog').addEventListener('click', () => {
  dialog.close();
});

document.getElementById('reset-demo').addEventListener('click', () => {
  requests = [...seedRequests];
  saveRequests();
  statusFilter.value = 'all';
  render();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  requests = [
    {
      id: `local-${Date.now()}`,
      client: data.get('client').trim(),
      service: data.get('service'),
      priority: data.get('priority'),
      slot: data.get('slot').trim(),
      status: 'Nouveau',
    },
    ...requests,
  ];
  saveRequests();
  form.reset();
  dialog.close();
  render();
});

if (CONFIG.backendEnabled || CONFIG.sheetsUrl) {
  throw new Error('Backend must stay disabled for the Kloub Air first frontend deployment.');
}

render();
