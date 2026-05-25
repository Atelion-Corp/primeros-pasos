const TOTAL = 23;
let current = 1;
let transitioning = false;

const currentEl = document.getElementById('current');
const totalEl   = document.getElementById('total');
const fill      = document.getElementById('progress-fill');
const prevBtn   = document.getElementById('prev-btn');
const nextBtn   = document.getElementById('next-btn');
const nav       = document.getElementById('main-nav');
const kbHint    = document.getElementById('kb-hint');

totalEl.textContent = TOTAL;

function isDark(n) {
  const s = document.querySelector(`.slide[data-index="${n}"]`);
  return s && s.dataset.dark === 'true';
}

function updateUI() {
  currentEl.textContent = current;
  fill.style.width = ((current - 1) / (TOTAL - 1) * 100) + '%';
  prevBtn.disabled = current === 1;
  nextBtn.disabled = current === TOTAL;

  if (isDark(current)) {
    nav.classList.add('dark');
    kbHint.classList.add('kb-hint-dark');
    document.body.classList.add('dark-mode');
  } else {
    nav.classList.remove('dark');
    kbHint.classList.remove('kb-hint-dark');
    document.body.classList.remove('dark-mode');
  }
}

function getSlide(n) {
  return document.querySelector(`.slide[data-index="${n}"]`);
}

function goTo(n) {
  if (transitioning || n < 1 || n > TOTAL || n === current) return;

  const dir      = n > current ? 1 : -1;
  const outSlide = getSlide(current);
  const inSlide  = getSlide(n);
  if (!outSlide || !inSlide) return;

  transitioning = true;

  inSlide.style.transition  = 'none';
  inSlide.style.opacity     = '0';
  inSlide.style.transform   = `translateX(${dir * 48}px)`;
  inSlide.style.pointerEvents = 'none';
  inSlide.classList.add('active');

  inSlide.getBoundingClientRect();

  inSlide.style.transition  = '';
  inSlide.style.opacity     = '1';
  inSlide.style.transform   = 'translateX(0)';

  outSlide.style.opacity    = '0';
  outSlide.style.transform  = `translateX(${dir * -48}px)`;
  outSlide.style.pointerEvents = 'none';

  current = n;
  updateUI();

  setTimeout(() => {
    outSlide.classList.remove('active');
    outSlide.style.opacity   = '';
    outSlide.style.transform = '';
    outSlide.style.transition = '';
    outSlide.style.pointerEvents = '';
    inSlide.style.pointerEvents = 'all';
    transitioning = false;
  }, 370);
}

function nextSlide() { goTo(current + 1); }
function prevSlide() { goTo(current - 1); }

document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
    case ' ':
      e.preventDefault();
      nextSlide();
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault();
      prevSlide();
      break;
    case 'Escape':
    case 'Home':
      goTo(1);
      break;
    case 'End':
      goTo(TOTAL);
      break;
    default:
      if (e.key >= '1' && e.key <= '9') goTo(parseInt(e.key));
  }
});

let tx = 0, ty = 0;
document.addEventListener('touchstart', (e) => {
  tx = e.touches[0].clientX;
  ty = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - tx;
  const dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
    dx < 0 ? nextSlide() : prevSlide();
  }
}, { passive: true });

updateUI();
document.querySelectorAll('.q-card').forEach(c => c.classList.add('open'));

const reflectState = { stars: {}, chips: {}, comments: {} };

document.addEventListener('click', (e) => {
  const star = e.target.closest('.star');
  if (star) {
    const group = star.closest('.star-rating');
    const topic = group.dataset.topic;
    const val = parseInt(star.dataset.val);
    reflectState.stars[topic] = val;
    group.querySelectorAll('.star').forEach((s, i) => {
      s.classList.toggle('star--active', i < val);
    });
    updateSummary();
    return;
  }

  const chip = e.target.closest('.eval-chip');
  if (chip) {
    const topic = chip.closest('.eval-chips').dataset.topic;
    if (!reflectState.chips[topic]) reflectState.chips[topic] = new Set();
    const val = chip.dataset.val;
    if (reflectState.chips[topic].has(val)) {
      reflectState.chips[topic].delete(val);
      chip.classList.remove('eval-chip--active');
    } else {
      reflectState.chips[topic].add(val);
      chip.classList.add('eval-chip--active');
    }
    updateSummary();
    return;
  }

  const toggle = e.target.closest('.eval-comment-toggle');
  if (toggle) {
    const block = toggle.closest('.eval-block');
    const comment = block.querySelector('.eval-comment');
    if (comment) {
      comment.classList.toggle('open');
      toggle.textContent = comment.classList.contains('open') ? '− cerrar' : '+ comentario';
    }
    return;
  }

  const qHeader = e.target.closest('.q-header');
  if (qHeader) {
    qHeader.closest('.q-card').classList.toggle('open');
  }
});

document.addEventListener('input', (e) => {
  const ta = e.target.closest('.eval-textarea');
  if (ta && ta.dataset.topic) reflectState.comments[ta.dataset.topic] = ta.value;
});

function getTopicAvg(prefix) {
  const vals = Object.entries(reflectState.stars)
    .filter(([k]) => k.startsWith(prefix + '-'))
    .map(([, v]) => v);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function updateSummary() {
  const tracked = ['t1','t2','t3','t4','t5','t6','final-presencia','final-alineacion'];
  const coreTopics = ['t1','t2','t3','t4','t5','t6'];
  const scores = [];

  tracked.forEach(t => {
    const score = reflectState.stars[t] ?? getTopicAvg(t);
    const barEl = document.getElementById('bar-' + t);
    const scoreEl = document.getElementById('score-' + t);
    if (barEl) barEl.style.width = score ? (score / 5 * 100) + '%' : '0%';
    if (scoreEl) scoreEl.textContent = score ? score + '/5' : '–';
    if (score && coreTopics.includes(t)) scores.push(score);
  });

  const avgEl = document.getElementById('metric-avg');
  if (avgEl) avgEl.textContent = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : '–';

  const topPrioEl = document.getElementById('metric-top-prio');
  if (topPrioEl) {
    const prios = reflectState.chips['final-prio'];
    topPrioEl.textContent = prios && prios.size ? [...prios].join(', ') : '–';
  }

  const priListEl = document.getElementById('priorities-list');
  if (priListEl) {
    const counts = new Map();
    Object.values(reflectState.chips).forEach(set => {
      set.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
    });
    if (counts.size) {
      const sorted = [...counts.entries()].sort((a,b) => b[1]-a[1]);
      priListEl.innerHTML = sorted.map(([v,c]) =>
        `<div class="priority-item"><div class="priority-dot"></div>${v}${c>1?` <span style="color:rgba(255,255,255,0.28);font-size:10px">(${c})</span>`:''}</div>`
      ).join('');
    } else {
      priListEl.innerHTML = '<div class="priority-item" style="color:rgba(255,255,255,0.28)">Sin votos aún</div>';
    }
  }

  ['t1','t2','t3','t4','t5','t6'].forEach(id => {
    const score = reflectState.stars[id] ?? getTopicAvg(id);
    const badge = document.getElementById('fq-score-' + id);
    if (badge) badge.textContent = score ? score + '/5' : '–';
    const chipsEl = document.getElementById('fq-chips-' + id);
    if (chipsEl) {
      const all = [];
      Object.entries(reflectState.chips)
        .filter(([k]) => k === id || k.startsWith(id + '-'))
        .forEach(([, s]) => s.forEach(v => all.push(v)));
      chipsEl.textContent = all.length ? all.slice(0, 2).join(', ') : '–';
    }
  });
}

function exportAnswers() {
  const topics = [
    { id: 't1', name: 'Identidad y percepción' },
    { id: 't2', name: 'Benchmark' },
    { id: 't3', name: 'Web + IA' },
    { id: 't4', name: 'Arquitectura' },
    { id: 't5', name: 'Sistemas internos' },
    { id: 't6', name: 'Futuro' },
  ];
  const dataLines = [];
  topics.forEach(({ id, name }) => {
    dataLines.push('### ' + name);
    const gs = reflectState.stars[id];
    const avg = getTopicAvg(id);
    dataLines.push('Evaluación: ' + (gs ? gs + '/5' : avg ? avg.toFixed(1) + '/5 (promedio sub-preguntas)' : 'sin responder'));
    Object.entries(reflectState.stars)
      .filter(([k]) => k.startsWith(id + '-'))
      .forEach(([k, v]) => dataLines.push('  ' + k + ': ' + v + '/5'));
    Object.entries(reflectState.chips)
      .filter(([k]) => k === id || k.startsWith(id + '-'))
      .forEach(([k, s]) => { if (s.size) dataLines.push('  Selecciones (' + k + '): ' + [...s].join(', ')); });
    Object.entries(reflectState.comments)
      .filter(([k]) => k === id || k.startsWith(id + '-'))
      .forEach(([k, v]) => { if (v && v.trim()) dataLines.push('  Comentario (' + k + '): ' + v.trim()); });
    dataLines.push('');
  });
  dataLines.push('### Evaluación final');
  const pres = reflectState.stars['final-presencia'];
  const ali = reflectState.stars['final-alineacion'];
  const prio = reflectState.chips['final-prio'];
  if (pres) dataLines.push('Presencia digital: ' + pres + '/5');
  if (ali) dataLines.push('Alineación interna: ' + ali + '/5');
  if (prio && prio.size) dataLines.push('Tema prioritario: ' + [...prio].join(', '));
  ['final-paso', 'final-brecha'].forEach(k => {
    const v = reflectState.comments[k];
    if (v && v.trim()) dataLines.push(k.replace('final-', '') + ': ' + v.trim());
  });

  const dataStr = dataLines.join('\n');
  const date = new Date().toLocaleDateString('es-CL');
  const promptLines = [
    '',
    '---',
    '',
    '## PROMPT PARA IA',
    '',
    'Eres consultor estratégico de tecnología. Analiza las respuestas de una sesión de reflexión interna de Atelion (empresa de desarrollo de software en Chile, equipo pequeño ~5 personas).',
    '',
    'Con base en los datos, responde:',
    '1. ¿Cuáles son los 3 problemas más críticos que enfrenta Atelion hoy?',
    '2. ¿Qué patrones o brechas ves entre los temas evaluados?',
    '3. ¿Cuáles son las 5 acciones más urgentes con mayor impacto real?',
    '4. ¿Qué está subestimando el equipo según las respuestas?',
    '5. Si priorizan lo que fue votado, ¿cómo se ve Atelion en 12 meses?',
    '',
    'Formato: informe ejecutivo conciso (máx. 500 palabras) + plan de acción con 5 pasos concretos.',
    '',
    'DATOS DE LA SESIÓN:',
    dataStr,
  ];
  const text = '# REFLEXIÓN ATELION — ' + date + '\n\n## RESPUESTAS POR TEMA\n\n' + dataStr + promptLines.join('\n');
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'atelion-reflexion-' + new Date().toISOString().slice(0, 10) + '.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
