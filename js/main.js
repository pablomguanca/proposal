const CONFIG = {
  cliente: 'Hadges Negocios Inmobiliarios',
  clienteCorto: 'Hadges',
  zona: 'Quilmes, Buenos Aires',
  fecha: 'Septiembre 2026',
  validez: '31 de octubre de 2026',
  montoSetup: 'A definir',
  montoMensual: 'A definir',
  montoPauta: 'A definir',
  whatsapp: '5491100000000',
  whatsappVisible: '+54 9 11 0000-0000',
  whatsappMensaje: 'Hola Pablo y Carolina, leímos la propuesta para Hadges y queremos avanzar.'
};

const ROUTES = {
  A: {
    tag: 'Camino A',
    title: 'Visita a la propiedad consultada',
    owner: 'Un asesor de la inmobiliaria, con la ficha completa del lead',
    text: (op, plazo) => plazo === 'mes'
      ? `Llega con el capital y quiere resolver ya. Es la consulta que más vale: pasa directo a agenda para que la ${op} avance esta misma semana.`
      : `Llega con el capital pero no tiene apuro. Se agenda la visita y el sistema lo acompaña para que la inmobiliaria sea la primera opción cuando decida.`,
    steps: (op) => [
      'Respuesta automática en minutos con la ficha de la propiedad.',
      'Propuesta de días y horarios de visita por WhatsApp.',
      `Aviso al asesor con presupuesto, forma de pago y plazo de la ${op}.`,
      'Recordatorio de la visita y seguimiento posterior.'
    ]
  },
  B: {
    tag: 'Camino B',
    title: 'Opciones de la cartera en su rango',
    owner: 'El sistema primero, el asesor cuando elige una opción',
    text: (op) => `No llega a la propiedad que vio, pero tiene intención real. En lugar de perderse, recibe propiedades en ${op === 'compra' ? 'venta' : 'alquiler'} de la cartera que sí entran en su presupuesto.`,
    steps: (op) => [
      'Respuesta en minutos agradeciendo la consulta.',
      `Envío de dos o tres propiedades en ${op === 'compra' ? 'venta' : 'alquiler'} acordes a su capacidad.`,
      op === 'compra' ? 'Orientación sobre crédito hipotecario si lo necesita.' : 'Detalle de requisitos y garantías para cada opción.',
      'Pasa a visita en cuanto marca interés en una de ellas.'
    ]
  },
  C: {
    tag: 'Camino C',
    title: 'Seguimiento hasta que esté listo',
    owner: 'El sistema, hasta que el lead vuelva a levantar la mano',
    text: (op, plazo, capacidad) => capacidad === 'llega'
      ? `Tiene el capital pero todavía está mirando. Queda marcado como prioridad: cuando se active, la inmobiliaria ya es su referencia.`
      : `Todavía no está para operar. Queda en una ruta de seguimiento que lo acompaña hasta que la ${op} sea posible, con la inmobiliaria siempre presente.`,
    steps: () => [
      'Respuesta en minutos y registro en el CRM con su segmento.',
      'Contenido útil por email y WhatsApp: barrio, precios, pasos de la operación.',
      'Aviso automático cuando entra una propiedad que encaja.',
      'Recontacto programado para chequear si cambió su situación.'
    ]
  }
};

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function applyConfig() {
  qsa('[data-config]').forEach((el) => {
    const value = CONFIG[el.dataset.config];
    if (value) el.textContent = value;
  });
  const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.whatsappMensaje)}`;
  qsa('[data-whatsapp]').forEach((link) => { link.href = url; });
}

function initProgressAndSpy() {
  const bar = qs('[data-progress]');
  const topbar = qs('[data-topbar]');
  const current = qs('[data-current-section]');
  const sections = qsa('[data-spy]');
  const links = qsa('[data-spy-link]');

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    bar.style.setProperty('--progress', ratio.toFixed(4));
    topbar.classList.toggle('is-scrolled', window.scrollY > 8);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.dataset.spy;
      current.textContent = entry.target.dataset.spyLabel;
      links.forEach((link) => {
        const active = link.dataset.spyLink === id;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach((section) => observer.observe(section));
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initIndexPanel() {
  const toggle = qs('[data-index-toggle]');
  const panel = qs('[data-index-panel]');

  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => setOpen(panel.hidden));
  qsa('a', panel).forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });
}

function initDaySwitch() {
  const timeline = qs('[data-day-timeline]');
  const options = qsa('[data-day-mode]');
  const switcher = qs('.day__switch');

  const setMode = (mode) => {
    timeline.dataset.mode = mode;
    switcher.dataset.mode = mode;
    options.forEach((option) => {
      const active = option.dataset.dayMode === mode;
      option.classList.toggle('is-active', active);
      option.setAttribute('aria-checked', String(active));
    });
  };

  options.forEach((option) => option.addEventListener('click', () => setMode(option.dataset.dayMode)));
  switcher.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const next = timeline.dataset.mode === 'hoy' ? 'sistema' : 'hoy';
    setMode(next);
    qs(`[data-day-mode="${next}"]`).focus();
  });
  setMode('hoy');
}

function initTabs({ tabSelector, panelSelector, key, onChange }) {
  const tabs = qsa(tabSelector);
  const panels = qsa(panelSelector);

  const select = (index, focus = false) => {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    panels.forEach((panel) => {
      const active = Number(panel.dataset[key]) === index;
      panel.hidden = !active;
      if (active) {
        panel.classList.remove('is-entering');
        void panel.offsetWidth;
        panel.classList.add('is-entering');
      }
    });
    if (onChange) onChange(index);
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') select((i + 1) % tabs.length, true);
      if (event.key === 'ArrowLeft') select((i - 1 + tabs.length) % tabs.length, true);
    });
  });

  return select;
}

function initPillars() {
  const nodes = qsa('[data-cycle-node]');
  const arcs = qsa('[data-cycle-arc]');

  const select = initTabs({
    tabSelector: '[data-pillar-tab]',
    panelSelector: '[data-pillar-panel]',
    key: 'pillarPanel',
    onChange: (index) => {
      nodes.forEach((node, i) => node.classList.toggle('is-active', i === index));
      arcs.forEach((arc, i) => arc.classList.toggle('is-active', i === index));
    }
  });

  nodes.forEach((node, i) => node.addEventListener('click', () => select(i)));
  select(0);
}

function initWorkflow() {
  const stepper = qs('.stepper');
  const steps = qsa('[data-stage-tab]');

  initTabs({
    tabSelector: '[data-stage-tab]',
    panelSelector: '[data-stage-panel]',
    key: 'stagePanel',
    onChange: (index) => {
      stepper.dataset.active = String(index);
      steps.forEach((step, i) => step.classList.toggle('is-done', i < index));
    }
  })(0);
}

function resolveRoute({ capacidad, plazo }) {
  if (capacidad === 'llega') return plazo === 'mirando' ? 'C' : 'A';
  if (capacidad === 'falta') return plazo === 'mirando' ? 'C' : 'B';
  return plazo === 'mes' ? 'B' : 'C';
}

function animateDot(dot, path) {
  const length = path.getTotalLength();
  const trunk = qs('.flow__path--trunk');
  const trunkLength = trunk.getTotalLength();
  const total = trunkLength + length;
  const duration = prefersReducedMotion ? 0 : 1100;
  const start = performance.now();

  const place = (point) => {
    dot.setAttribute('cx', point.x);
    dot.setAttribute('cy', point.y);
  };

  if (!duration) {
    place(path.getPointAtLength(length));
    return;
  }

  const step = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const distance = eased * total;
    place(distance <= trunkLength
      ? trunk.getPointAtLength(distance)
      : path.getPointAtLength(distance - trunkLength));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initRouter() {
  const form = qs('[data-router-form]');
  const dot = qs('[data-flow-dot]');
  const paths = qsa('[data-flow-path]');
  const dests = qsa('[data-flow-dest]');
  const routeItems = qsa('[data-route]');
  const result = qs('[data-router-result]');
  const tag = qs('[data-result-tag]');
  const title = qs('[data-result-title]');
  const text = qs('[data-result-text]');
  const steps = qs('[data-result-steps]');
  const owner = qs('[data-result-owner]');

  const update = () => {
    const data = Object.fromEntries(new FormData(form));
    const key = resolveRoute(data);
    const route = ROUTES[key];

    paths.forEach((path) => path.classList.toggle('is-active', path.dataset.flowPath === key));
    dests.forEach((dest) => dest.classList.toggle('is-active', dest.dataset.flowDest === key));
    routeItems.forEach((item) => item.classList.toggle('is-active', item.dataset.route === key));

    tag.textContent = route.tag;
    title.textContent = route.title;
    text.textContent = route.text(data.operacion, data.plazo, data.capacidad);
    owner.textContent = route.owner;
    steps.replaceChildren(...route.steps(data.operacion).map((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      return li;
    }));

    result.dataset.route = key;
    result.classList.remove('is-entering');
    void result.offsetWidth;
    result.classList.add('is-entering');

    animateDot(dot, qs(`[data-flow-path="${key}"]`));
  };

  form.addEventListener('change', update);
  form.addEventListener('submit', (event) => event.preventDefault());
  update();
}

function initIncludes() {
  const filters = qsa('[data-filter]');
  const items = qsa('[data-includes] .deliverable');

  qsa('[data-filter-count]').forEach((count) => {
    const pillar = count.dataset.filterCount;
    count.textContent = pillar === 'todos'
      ? items.length
      : items.filter((item) => item.dataset.pillar === pillar).length;
  });

  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      const value = filter.dataset.filter;
      filters.forEach((f) => {
        const active = f === filter;
        f.classList.toggle('is-active', active);
        f.setAttribute('aria-pressed', String(active));
      });
      items.forEach((item) => {
        const match = value === 'todos' || item.dataset.pillar === value;
        item.classList.toggle('is-dimmed', !match);
      });
    });
  });
}

function initReveal() {
  if (prefersReducedMotion || !('IntersectionObserver' in window)) return;
  const viewportBottom = window.innerHeight;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  qsa('[data-reveal]').forEach((el) => {
    if (el.getBoundingClientRect().top > viewportBottom) observer.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  applyConfig();
  initProgressAndSpy();
  initIndexPanel();
  initDaySwitch();
  initPillars();
  initWorkflow();
  initRouter();
  initIncludes();
  initReveal();
});
