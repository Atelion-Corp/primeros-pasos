const TOTAL = 25;
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
