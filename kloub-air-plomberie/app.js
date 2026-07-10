const CONFIG = Object.freeze({
  backendEnabled: false,
  sheetsUrl: '',
  storageKey: 'kloub-air-plomberie-demo-requests-v2',
});

const statusFlow = ['Nouveau', 'Qualifié', 'A rappeler', 'Planifié', 'En intervention', 'Terminé'];
const priorityFlow = ['Critique', 'Haute', 'Moyenne', 'Basse'];

const statusMeta = {
  Nouveau: { label: 'Nouveau', action: 'Qualifier', next: 'Qualifié' },
  Qualifié: { label: 'Qualifié', action: 'Planifier', next: 'Planifié' },
  'A rappeler': { label: 'A rappeler', action: 'Relancé', next: 'Qualifié' },
  Planifié: { label: 'Planifié', action: 'Envoyer', next: 'En intervention' },
  'En intervention': { label: 'En intervention', action: 'Clôturer', next: 'Terminé' },
  Terminé: { label: 'Terminé', action: 'Archivé', next: 'Terminé' },
};

const seedRequests = [
  {
    id: 'demo-1',
    client: 'Mme Martin',
    phone: '06 18 42 70 11',
    service: 'Dépannage urgent',
    priority: 'Critique',
    slot: "Aujourd'hui 09h30",
    status: 'Nouveau',
    source: 'Téléphone',
    note: 'Fuite active sous évier, couper arrivée conseillé.',
  },
  {
    id: 'demo-2',
    client: 'SCI Les Pins',
    phone: '04 92 00 14 80',
    service: 'Climatisation',
    priority: 'Moyenne',
    slot: "Aujourd'hui 14h00",
    status: 'Planifié',
    source: 'Formulaire',
    note: 'Contrôle split bureaux, accès gardien.',
  },
  {
    id: 'demo-3',
    client: 'M. Bernard',
    phone: '06 77 10 45 32',
    service: 'Plomberie',
    priority: 'Haute',
    slot: 'Demain 08h00',
    status: 'A rappeler',
    source: 'Message vocal',
    note: 'Confirmer disponibilité et modèle de robinet.',
  },
  {
    id: 'demo-4',
    client: 'Cabinet médical Nord',
    phone: '04 93 12 70 20',
    service: 'Chauffage',
    priority: 'Haute',
    slot: 'Vendredi 10h30',
    status: 'Qualifié',
    source: 'Email',
    note: 'Chaudière en défaut, devis à valider avant intervention.',
  },
  {
    id: 'demo-5',
    client: 'Mme Roux',
    phone: '06 01 88 23 90',
    service: 'Plomberie',
    priority: 'Basse',
    slot: 'Lundi 16h00',
    status: 'Terminé',
    source: 'Téléphone',
    note: 'Remplacement flexible terminé.',
  },
  {
    id: 'demo-6',
    client: 'Restaurant Le Quai',
    phone: '04 93 88 10 42',
    service: 'Dépannage urgent',
    priority: 'Critique',
    slot: 'Dès que possible',
    status: 'En intervention',
    source: 'Téléphone',
    note: 'Évacuation cuisine bouchée, service du soir menacé.',
  },
];

let requests = loadRequests();

const panels = document.querySelectorAll('.panel');
const navItems = document.querySelectorAll('.nav-item');
const kpiGrid = document.getElementById('kpi-grid');
const urgencyBoard = document.getElementById('urgency-board');
const priorityList = document.getElementById('priority-list');
const serviceChart = document.getElementById('service-chart');
const todayCount = document.getElementById('today-count');
const requestRows = document.getElementById('request-rows');
const statusFilter = document.getElementById('status-filter');
const timeline = document.getElementById('timeline');
const dialog = document.getElementById('request-dialog');
const form = document.getElementById('request-form');

function normalizeRequest(request, index = 0) {
  return {
    id: request.id || `saved-${index}-${Date.now()}`,
    client: request.client || 'Client sans nom',
    phone: request.phone || '',
    service: request.service || 'Plomberie',
    priority: priorityFlow.includes(request.priority) ? request.priority : 'Moyenne',
    slot: request.slot || 'A planifier',
    status: statusFlow.includes(request.status) ? request.status : 'Nouveau',
    source: request.source || 'Saisie locale',
    note: request.note || '',
  };
}

function loadRequests() {
  const saved = localStorage.getItem(CONFIG.storageKey);
  if (!saved) return seedRequests.map(normalizeRequest);

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.map(normalizeRequest) : seedRequests.map(normalizeRequest);
  } catch {
    return seedRequests.map(normalizeRequest);
  }
}

function saveRequests() {
  localStorage.setItem(CONFIG.storageKey, JSON.stringify(requests));
}

function priorityRank(priority) {
  const index = priorityFlow.indexOf(priority);
  return index === -1 ? priorityFlow.length : index;
}

function statusRank(status) {
  const index = statusFlow.indexOf(status);
  return index === -1 ? statusFlow.length : index;
}

function byOperationalPriority(a, b) {
  return priorityRank(a.priority) - priorityRank(b.priority) || statusRank(a.status) - statusRank(b.status);
}

function priorityClass(priority) {
  return `pill priority-${priority.toLowerCase().replaceAll(' ', '-')}`;
}

function statusClass(status) {
  return `status-badge status-${status.toLowerCase().replaceAll(' ', '-')}`;
}

function escHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function countWhere(predicate) {
  return requests.filter(predicate).length;
}

function activeRequests() {
  return requests.filter((request) => request.status !== 'Terminé');
}

function nextStatus(status) {
  return statusMeta[status]?.next || 'Nouveau';
}

function nextAction(status) {
  return statusMeta[status]?.action || 'Traiter';
}

function movePriority(priority, direction) {
  const index = priorityRank(priority);
  const nextIndex = Math.max(0, Math.min(priorityFlow.length - 1, index + direction));
  return priorityFlow[nextIndex];
}

function renderKpis() {
  const waiting = countWhere((request) => ['Nouveau', 'Qualifié', 'A rappeler'].includes(request.status));
  const critical = countWhere((request) => request.priority === 'Critique' && request.status !== 'Terminé');
  const callbacks = countWhere((request) => request.status === 'A rappeler');
  const planned = countWhere((request) => ['Planifié', 'En intervention'].includes(request.status));

  kpiGrid.innerHTML = [
    ['A traiter', waiting],
    ['Critiques', critical],
    ['A rappeler', callbacks],
    ['Terrain', planned],
  ].map(([label, value]) => `<article class="kpi-card"><span>${label}</span><strong>${value}</strong></article>`).join('');
}

function renderUrgencyBoard() {
  urgencyBoard.innerHTML = priorityFlow.map((priority) => {
    const items = activeRequests()
      .filter((request) => request.priority === priority)
      .sort(byOperationalPriority)
      .slice(0, 3);

    return `
      <article class="urgency-lane urgency-${priority.toLowerCase()}">
        <div class="lane-header">
          <span>${escHtml(priority)}</span>
          <strong>${items.length}</strong>
        </div>
        <div class="lane-list">
          ${items.map((request) => `
            <button class="lane-item" type="button" data-jump="requests">
              <strong>${escHtml(request.client)}</strong>
              <span>${escHtml(request.service)} · ${escHtml(request.status)}</span>
            </button>
          `).join('') || '<p class="empty-lane">Aucune demande</p>'}
        </div>
      </article>
    `;
  }).join('');
}

function renderPriorities() {
  const priorityRequests = activeRequests().sort(byOperationalPriority).slice(0, 5);

  todayCount.textContent = `${priorityRequests.length} demande${priorityRequests.length > 1 ? 's' : ''}`;
  priorityList.innerHTML = priorityRequests.map((request) => `
    <article class="request-card">
      <div>
        <strong>${escHtml(request.client)}</strong>
        <p>${escHtml(request.service)} · ${escHtml(request.slot)}</p>
        <small>${escHtml(request.note || request.source)}</small>
      </div>
      <div class="card-meta">
        <span class="${priorityClass(request.priority)}">${escHtml(request.priority)}</span>
        <span class="${statusClass(request.status)}">${escHtml(nextAction(request.status))}</span>
      </div>
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
  const visibleRequests = (selectedStatus === 'all'
    ? requests
    : requests.filter((request) => request.status === selectedStatus)
  ).sort(byOperationalPriority);

  requestRows.innerHTML = visibleRequests.map((request) => `
    <tr data-id="${escHtml(request.id)}">
      <td>
        <strong>${escHtml(request.client)}</strong>
        <span class="muted-line">${escHtml(request.phone || request.source)}</span>
        <span class="muted-line">${escHtml(request.service)}</span>
      </td>
      <td>
        <strong>${escHtml(nextAction(request.status))}</strong>
        <span class="muted-line">${escHtml(request.note || 'Aucune note')}</span>
      </td>
      <td><span class="${priorityClass(request.priority)}">${escHtml(request.priority)}</span></td>
      <td>${escHtml(request.slot)}</td>
      <td><span class="${statusClass(request.status)}">${escHtml(request.status)}</span></td>
      <td>
        <div class="row-actions">
          <button type="button" class="table-action" data-action="advance">${escHtml(nextAction(request.status))}</button>
          <button type="button" class="table-action" data-action="recall">Rappel</button>
          <button type="button" class="table-action" data-action="escalate">Urgence +</button>
          <button type="button" class="table-action" data-action="deescalate">Urgence -</button>
          <button type="button" class="table-action danger" data-action="delete">Supprimer</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderTimeline() {
  timeline.innerHTML = activeRequests()
    .sort(byOperationalPriority)
    .map((request) => `
      <article class="timeline-item">
        <div>
          <strong>${escHtml(request.slot)}</strong>
          <p>${escHtml(request.client)} · ${escHtml(request.service)}</p>
        </div>
        <div class="timeline-meta">
          <span class="${priorityClass(request.priority)}">${escHtml(request.priority)}</span>
          <span class="${statusClass(request.status)}">${escHtml(request.status)}</span>
        </div>
      </article>
    `).join('');
}

function render() {
  renderKpis();
  renderUrgencyBoard();
  renderPriorities();
  renderChart();
  renderRows();
  renderTimeline();
}

function openPanel(panelId) {
  navItems.forEach((navItem) => navItem.classList.toggle('is-active', navItem.dataset.panel === panelId));
  panels.forEach((panel) => panel.classList.toggle('is-active', panel.id === panelId));
}

navItems.forEach((item) => {
  item.addEventListener('click', () => openPanel(item.dataset.panel));
});

urgencyBoard.addEventListener('click', (event) => {
  if (!event.target.closest('[data-jump]')) return;
  openPanel('requests');
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
  } else {
    requests = requests.map((request) => {
      if (request.id !== id) return request;
      if (button.dataset.action === 'advance') return { ...request, status: nextStatus(request.status) };
      if (button.dataset.action === 'recall') return { ...request, status: 'A rappeler' };
      if (button.dataset.action === 'escalate') return { ...request, priority: movePriority(request.priority, -1) };
      if (button.dataset.action === 'deescalate') return { ...request, priority: movePriority(request.priority, 1) };
      return request;
    });
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
  requests = seedRequests.map(normalizeRequest);
  saveRequests();
  statusFilter.value = 'all';
  render();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  requests = [
    normalizeRequest({
      id: `local-${Date.now()}`,
      client: data.get('client').trim(),
      phone: data.get('phone').trim(),
      service: data.get('service'),
      priority: data.get('priority'),
      slot: data.get('slot').trim(),
      status: 'Nouveau',
      source: 'Saisie locale',
      note: data.get('note').trim(),
    }),
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
