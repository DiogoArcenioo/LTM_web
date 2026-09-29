const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  mainNav.classList.toggle('is-open', open);
});
mainNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mainNav.classList.remove('is-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Abrir menu');
}));

// Go to the document's beginning immediately. The page-top anchor provides
// the same destination before this script has finished loading.
document.querySelectorAll('[data-scroll-top]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    requestAnimationFrame(() => { root.style.scrollBehavior = previousBehavior; });
    if (window.location.hash) {
      history.replaceState(history.state, '', window.location.pathname + window.location.search);
    }
  });
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reducedMotion && 'IntersectionObserver' in window) {
  const reveals = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        reveals.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -35px 0px' });
  document.querySelectorAll('.reveal').forEach(el => reveals.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
}

// Load the original Instagram testimonial only as it approaches the viewport.
const videoPanel = document.querySelector('#video-panel');
const videoShell = document.querySelector('.video-shell');
const video = document.querySelector('#testimonial-player');
const volumeButton = document.querySelector('#volume-toggle');
const volumeLabel = document.querySelector('#volume-label');
const playButton = document.querySelector('#video-toggle');

function setPlaying(playing) {
  videoShell?.classList.toggle('is-playing', playing);
  if (playButton) {
    playButton.textContent = playing ? '❚❚' : '▶';
    playButton.setAttribute('aria-label', playing ? 'Pausar vídeo' : 'Reproduzir vídeo');
    playButton.title = playing ? 'Pausar vídeo' : 'Reproduzir vídeo';
  }
}
setPlaying(false);

function loadVideo() {
  if (video && !video.getAttribute('src')) {
    video.src = '/assets/depoimento-ltm.mp4';
    video.load();
  }
}

video?.addEventListener('loadeddata', () => video.classList.add('is-ready'));
video?.addEventListener('play', () => setPlaying(true));
video?.addEventListener('pause', () => setPlaying(false));
video?.addEventListener('error', () => {
  video.classList.remove('is-ready');
  setPlaying(false);
});

if (videoPanel && 'IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      loadVideo();
      video?.play().catch(() => setPlaying(false));
    } else {
      video?.pause();
    }
  }, { threshold: .35 });
  videoObserver.observe(videoPanel);
} else if (videoPanel) {
  loadVideo();
  video?.play().catch(() => setPlaying(false));
}

volumeButton?.addEventListener('click', () => {
  if (!video) return;
  video.muted = !video.muted;
  const audible = !video.muted;
  volumeButton.classList.toggle('is-unmuted', audible);
  volumeButton.setAttribute('aria-label', audible ? 'Desativar som do vídeo' : 'Ativar som do vídeo');
  volumeButton.title = audible ? 'Desativar som' : 'Ativar som';
  if (volumeLabel) volumeLabel.textContent = audible ? 'Desativar som' : 'Ativar som';
  if (video.paused) video.play().catch(() => setPlaying(false));
});

playButton?.addEventListener('click', () => {
  if (!video) return;
  loadVideo();
  if (video.paused) video.play().catch(() => setPlaying(false));
  else video.pause();
});

// Scroll rotates the review cards through a real perspective space: the
// foremost card travels back while the next one advances toward the reader.
const reviewsSection = document.querySelector('.reviews-section');
const reviewCards = [...document.querySelectorAll('.review-card')];
const reviewProgress = document.querySelector('#reviews-progress');
let reviewFrame = 0;
function renderReviews() {
  reviewFrame = 0;
  if (!reviewsSection || !reviewCards.length || reducedMotion) return;
  const travel = Math.max(1, reviewsSection.offsetHeight - window.innerHeight);
  const ratio = Math.min(1, Math.max(0, (window.scrollY - reviewsSection.offsetTop) / travel));
  const position = ratio * (reviewCards.length - 1);
  const active = Math.round(position);
  const mobile = window.innerWidth < 760;
  const radiusX = mobile ? 100 : Math.min(330, window.innerWidth * .24);
  const radiusZ = mobile ? 145 : 260;
  reviewCards.forEach((card, i) => {
    const angle = (i - position) * (Math.PI * 2 / reviewCards.length);
    const depth = Math.cos(angle);
    const x = Math.sin(angle) * radiusX;
    const z = (depth - 1) * radiusZ;
    const y = (1 - depth) * (mobile ? 12 : 22);
    card.style.transform = `translate3d(${x}px,${y}px,${z}px) rotateY(${-Math.sin(angle) * 14}deg)`;
    card.style.zIndex = String(Math.round((depth + 1) * 100));
    card.style.opacity = String(Math.max(.25, .46 + (depth + 1) * .27));
    card.setAttribute('aria-hidden', String(i !== active));
  });
  if (reviewProgress) reviewProgress.style.width = `${ratio * 100}%`;
}
function queueReviews() {
  if (!reviewFrame) reviewFrame = requestAnimationFrame(renderReviews);
}
if (reviewsSection && !reducedMotion) {
  window.addEventListener('scroll', queueReviews, { passive: true });
  window.addEventListener('resize', queueReviews);
  renderReviews();
}
