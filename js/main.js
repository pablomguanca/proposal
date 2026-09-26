const CONFIG = {
  cliente: 'Hadjes Negocios Inmobiliarios',
  clienteCorto: 'Hadjes',
  zona: 'Quilmes, Buenos Aires',
  fecha: 'Septiembre 2026',
  validez: '31 de octubre de 2026',
  montoSetup: '',
  montoMensual: '',
  montoPauta: '',
  whatsapp: '5491169152671',
  whatsappVisible: '+54 9 11 6915-2671',
  whatsappMensaje: 'Hola Atenea, leímos la propuesta para Hadjes y queremos avanzar.'
};

const PAGO_TEXT = {
  compra: { contado: 'paga de contado', credito: 'tiene el crédito aprobado' },
  alquiler: { contado: 'tiene ingresos y garantía propia', credito: 'alquila con seguro de caución' }
};

const ROUTES = {
  A: {
    tag: 'Camino A · Respondió las tres preguntas',
    title: 'Prioridad alta: llamada de cierre',
    owner: 'Un asesor de la inmobiliaria, con la ficha completa del lead',
    text: (data) => `Quiere ${data.operacion === 'compra' ? 'comprar' : 'alquilar'} este mes, ${PAGO_TEXT[data.operacion][data.pago]} y quien decide ya participa. Es la consulta que va directo a la agenda del asesor, con todo el contexto para cerrar.`,
    steps: () => [
      'Ingreso al CRM marcado como prioridad alta.',
      'Aviso inmediato al asesor con plazo, forma de pago y quién decide.',
      'Llamada de cierre agendada en el mismo día.',
      'Visita solo a propiedades que entran en su presupuesto.'
    ]
  },
  B: {
    tag: 'Camino B · Puede operar, todavía no está listo',
    title: 'Seguimiento hasta que esté listo',
    owner: 'El sistema, hasta que el lead vuelva a levantar la mano',
    text: (data) => data.decision === 'falta'
      ? 'Tiene cómo pagar, pero falta quien decide. El sistema lo sigue e invita a sumar a esa persona antes de ocupar un turno de visita.'
      : `Tiene cómo pagar, pero ${data.operacion === 'compra' ? 'su compra' : 'su mudanza'} es a mediano plazo. Queda en seguimiento para que, cuando se active, la inmobiliaria ya sea su referencia.`,
    steps: (data) => [
      'Registro en el CRM con su segmento y fecha estimada.',
      'Contenido útil por email y WhatsApp: zonas, precios y pasos de la operación.',
      data.decision === 'falta' ? 'Invitación a sumar a quien decide.' : 'Aviso automático cuando entra una propiedad que encaja.',
      'Pasa al camino A cuando responde las tres preguntas.'
    ]
  },
  C: {
    tag: 'Camino C · Hoy no llega a esta propiedad',
    title: 'Otras opciones de la cartera',
    owner: 'El sistema, sin ocupar tiempo de los asesores',
    text: (data) => data.operacion === 'compra'
      ? 'No llega al valor de la propiedad que consultó. En lugar de perderse, recibe opciones en venta acordes a su capacidad y queda en seguimiento automático.'
      : 'No reúne los requisitos para la propiedad que consultó. En lugar de perderse, recibe alquileres de la cartera acordes a su situación y queda en seguimiento automático.',
    steps: (data) => [
      'Respuesta automática y registro en el CRM.',
      `Envío de propiedades en ${data.operacion === 'compra' ? 'venta' : 'alquiler'} dentro de su rango.`,
      'Seguimiento por email y WhatsApp.',
      'Vuelve a calificar si cambia su situación.'
    ]
  }
};

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function applyConfig() {
  qsa('[data-config]').forEach((el) => {
    const value = CONFIG[el.dataset.config];
    if (value) {
      el.textContent = value;
      el.classList.remove('is-pending');
    } else if (el.dataset.pending) {
      el.textContent = el.dataset.pending;
      el.classList.add('is-pending');
    }
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

function initTabs({ tabSelector, panelSelector, key, onChange, desktop }) {
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
      panel.classList.toggle('is-active', active);
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
    desktop: window.matchMedia('(min-width: 64rem)'),
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
    desktop: window.matchMedia('(min-width: 48rem)'),
    onChange: (index) => {
      stepper.dataset.active = String(index);
      steps.forEach((step, i) => step.classList.toggle('is-done', i < index));
    }
  })(0);
}

function resolveRoute({ plazo, pago, decision }) {
  if (pago === 'no') return 'C';
  if (plazo === 'mes' && decision !== 'falta') return 'A';
  return 'B';
}

function animateDot(dot, path) {
  if (!dot.closest('.router__diagram').offsetParent) return;
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
  const verdictLetter = qs('[data-verdict-letter]');
  const verdictTitle = qs('[data-verdict-title]');

  const update = () => {
    const data = Object.fromEntries(new FormData(form));
    qsa('[data-text-compra]', form).forEach((el) => {
      el.textContent = data.operacion === 'compra' ? el.dataset.textCompra : el.dataset.textAlquiler;
    });
    const key = resolveRoute(data);
    const route = ROUTES[key];

    paths.forEach((path) => path.classList.toggle('is-active', path.dataset.flowPath === key));
    dests.forEach((dest) => dest.classList.toggle('is-active', dest.dataset.flowDest === key));
    routeItems.forEach((item) => item.classList.toggle('is-active', item.dataset.route === key));

    tag.textContent = route.tag;
    title.textContent = route.title;
    text.textContent = route.text(data);
    owner.textContent = route.owner;
    verdictLetter.textContent = key;
    verdictTitle.textContent = route.title;
    steps.replaceChildren(...route.steps(data).map((item) => {
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
        item.classList.toggle('is-hidden', !match);
        if (match) {
          item.classList.remove('is-entering');
          void item.offsetWidth;
          item.classList.add('is-entering');
        }
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
