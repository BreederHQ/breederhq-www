// Behavior shared by the review carousel (scroll-snap, several cards per view)
// and the compact review rotator (one review at a time). No library.
// Markup contract: see ReviewCarousel.astro and ReviewRotator.astro.
// Without this script both render every review, readable and reachable.

const INTERVAL_MS = 7000;

function setup(root: HTMLElement) {
  const mode = root.dataset.reviewMode === 'fade' ? 'fade' : 'scroll';
  const track = root.querySelector<HTMLElement>('[data-track]');
  const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-slide]'));
  const prev = root.querySelector<HTMLButtonElement>('[data-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-next]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-toggle]');
  const dotsEl = root.querySelector<HTMLElement>('[data-dots]');
  const live = root.querySelector<HTMLElement>('[data-live]');
  if (!track || slides.length < 2) return;

  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let positions = slides.length;
  let timer: number | undefined;
  let hovering = false;
  let kbFocus = false;
  let touching = false;
  let userPaused = false;
  let raf = 0;

  root.classList.add('is-enhanced');
  root.querySelectorAll<HTMLElement>('[data-js-only]').forEach((el) => {
    el.hidden = false;
  });

  function perView() {
    if (mode === 'fade') return 1;
    const first = slides[0];
    const width = first.offsetWidth;
    if (!width) return 1;
    return Math.max(1, Math.round(track!.clientWidth / width));
  }

  function step() {
    return slides[1].offsetLeft - slides[0].offsetLeft;
  }

  function renderDots() {
    if (!dotsEl) return;
    dotsEl.replaceChildren();
    for (let i = 0; i < positions; i += 1) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'rv-dot';
      dot.setAttribute('aria-label', `Show review ${i + 1} of ${slides.length}`);
      dot.addEventListener('click', () => goTo(i, true));
      dotsEl.appendChild(dot);
    }
    paint();
  }

  function paint() {
    dotsEl?.querySelectorAll('.rv-dot').forEach((dot, i) => {
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    if (mode === 'fade') {
      slides.forEach((s, i) => s.toggleAttribute('data-active', i === index));
    }
  }

  function goTo(i: number, manual: boolean) {
    index = ((i % positions) + positions) % positions;
    if (mode === 'scroll') {
      track!.scrollTo({
        left: index * step(),
        behavior: reducedQuery.matches ? 'auto' : 'smooth',
      });
    }
    paint();
    if (manual) schedule();
  }

  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const s = step();
      if (!s) return;
      const atEnd = track!.scrollLeft + track!.clientWidth >= track!.scrollWidth - 2;
      const i = atEnd ? positions - 1 : Math.round(track!.scrollLeft / s);
      const clamped = Math.min(positions - 1, Math.max(0, i));
      if (clamped !== index) {
        index = clamped;
        paint();
      }
    });
  }

  function measure() {
    positions = mode === 'fade' ? slides.length : Math.max(1, slides.length - perView() + 1);
    index = Math.min(index, positions - 1);
    renderDots();
  }

  function autoAllowed() {
    return !reducedQuery.matches;
  }

  function running() {
    return (
      autoAllowed() && !userPaused && !hovering && !kbFocus && !touching && !document.hidden
    );
  }

  function schedule() {
    window.clearInterval(timer);
    timer = undefined;
    const active = running();
    if (live) live.setAttribute('aria-live', autoAllowed() && !userPaused ? 'off' : 'polite');
    if (toggle) {
      toggle.hidden = !autoAllowed();
      const label = userPaused ? 'Start Review Rotation' : 'Pause Review Rotation';
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('aria-pressed', String(userPaused));
      toggle.dataset.state = userPaused ? 'paused' : 'playing';
    }
    if (active) timer = window.setInterval(() => goTo(index + 1, false), INTERVAL_MS);
  }

  prev?.addEventListener('click', () => goTo(index - 1, true));
  next?.addEventListener('click', () => goTo(index + 1, true));
  toggle?.addEventListener('click', () => {
    userPaused = !userPaused;
    schedule();
  });

  root.addEventListener('mouseenter', () => {
    hovering = true;
    schedule();
  });
  root.addEventListener('mouseleave', () => {
    hovering = false;
    schedule();
  });
  root.addEventListener('focusin', () => {
    kbFocus = root.querySelector(':focus-visible') !== null;
    schedule();
  });
  root.addEventListener('focusout', (e) => {
    const to = e.relatedTarget as Node | null;
    if (!to || !root.contains(to)) {
      kbFocus = false;
      schedule();
    }
  });
  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') {
      touching = true;
      schedule();
    }
  });
  const endTouch = () => {
    if (touching) {
      touching = false;
      schedule();
    }
  };
  root.addEventListener('pointerup', endTouch);
  root.addEventListener('pointercancel', endTouch);
  document.addEventListener('visibilitychange', schedule);
  reducedQuery.addEventListener('change', schedule);

  if (mode === 'scroll') {
    track.addEventListener('scroll', onScroll, { passive: true });
    new ResizeObserver(measure).observe(track);
  }
  measure();
  schedule();
}

document.querySelectorAll<HTMLElement>('[data-review-carousel]').forEach(setup);
