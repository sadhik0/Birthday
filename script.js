/* ==========================================================================
   Reshu's Birthday Website - script.js
   Plain vanilla JavaScript. No libraries, no build step.

   CONTENTS
   0. CONFIG + PHOTOS   <- the owner edits this part
   1. Helpers
   2. Section 1 - Light rays (canvas)
   3. Section 1 - Envelope
   4. Section 2 - Marquees (pause when off-screen)
   5. Section 3 - Split-flap text
   6. Section 4 - Drift Wall gallery + lightbox
   7. Optional music
   8. Print button
   9. Start everything
   ========================================================================== */
(() => {
  'use strict';

  /* ========================================================================
     0. CONFIG + PHOTOS
     ======================================================================== */

  const CONFIG = {
    /* Optional song. Put your licensed file at this path to switch music on.
       Nothing plays until the visitor presses the music button. */
    musicSrc: 'audio/birthday-song.mp3',

    /* Screens at least this wide get the drifting perspective wall.
       Narrower screens (phones) get the calm two-column grid. */
    desktopQuery: '(min-width: 900px)',
  };

  /* --------------------------------------------------------------------------
     >>> PHOTOS - REPLACE YOUR PHOTOS AND CAPTIONS HERE <<<

     There are exactly 15 photos. For each one:

       src      Path of the photo. Put the file in the "images" folder using
                EXACTLY this name (lowercase, .jpeg). To use a different file
                name, just change the text here to match.
       alt      Describes the photo for people who use screen readers,
                e.g. "Reshu laughing at the beach".
       caption  OPTIONAL short text shown when someone hovers / opens the
                photo. Leave as '' for no caption.
       ratio    OPTIONAL starting guess of width / height (0.75 = portrait,
                1 = square, 1.33 = landscape). The real shape is read from the
                photo once it loads, so you can leave this alone.

     File names on GitHub Pages are case-sensitive: "image1.jpeg" is not the
     same as "Image1.jpeg" or "image1.jpg".
     -------------------------------------------------------------------------- */
  const PHOTOS = [
    { src: 'images/image.jpeg',   alt: 'Photo 1 of Reshu',  caption: '', ratio: 0.75 },
    { src: 'images/image1.jpeg',  alt: 'Photo 2 of Reshu',  caption: '', ratio: 1.00 },
    { src: 'images/image2.jpeg',  alt: 'Photo 3 of Reshu',  caption: '', ratio: 1.33 },
    { src: 'images/image3.jpeg',  alt: 'Photo 4 of Reshu',  caption: '', ratio: 0.80 },
    { src: 'images/image4.jpeg',  alt: 'Photo 5 of Reshu',  caption: '', ratio: 0.67 },
    { src: 'images/image5.jpeg',  alt: 'Photo 6 of Reshu',  caption: '', ratio: 1.00 },
    { src: 'images/image6.jpeg',  alt: 'Photo 7 of Reshu',  caption: '', ratio: 0.75 },
    { src: 'images/image7.jpeg',  alt: 'Photo 8 of Reshu',  caption: '', ratio: 1.25 },
    { src: 'images/image8.jpeg',  alt: 'Photo 9 of Reshu',  caption: '', ratio: 0.80 },
    { src: 'images/image9.jpeg',  alt: 'Photo 10 of Reshu', caption: '', ratio: 1.00 },
    { src: 'images/image10.jpeg', alt: 'Photo 11 of Reshu', caption: '', ratio: 0.67 },
    { src: 'images/image11.jpeg', alt: 'Photo 12 of Reshu', caption: '', ratio: 1.33 },
    { src: 'images/image12.jpeg', alt: 'Photo 13 of Reshu', caption: '', ratio: 0.75 },
    { src: 'images/image13.jpeg', alt: 'Photo 14 of Reshu', caption: '', ratio: 0.90 },
    { src: 'images/image14.jpeg', alt: 'Photo 15 of Reshu', caption: '', ratio: 1.10 },
  ];


  /* ========================================================================
     1. HELPERS
     ======================================================================== */

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* addEventListener on a MediaQueryList, with the old Safari fallback */
  function onQueryChange(mq, handler) {
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if (mq.addListener) mq.addListener(handler);
  }


  /* ========================================================================
     2. SECTION 1 - LIGHT RAYS (canvas)
     Glossy ruby beams fanning down from above the top edge.
     Drawn at 60% resolution (they are soft anyway), limited to about
     30 frames per second, and paused when off-screen or when the tab is
     hidden. With reduced motion on, a single still frame is painted.
     ======================================================================== */
  function initRays() {
    const canvas = $('#rays');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const hero = canvas.parentElement;
    const RES = 0.6;
    const COUNT = 15;
    const TAU = Math.PI * 2;

    /* Deterministic pseudo-random so the rays look the same on every load */
    const seeded = (n) => {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    const rays = Array.from({ length: COUNT }, (_, i) => ({
      t: i / (COUNT - 1),
      jitter: (seeded(i + 1) - 0.5) * 0.06,
      width: 0.035 + seeded(i + 40) * 0.06,
      alpha: 0.3 + seeded(i + 80) * 0.3,
      speed: 0.25 + seeded(i + 120) * 0.45,
      phase: seeded(i + 160) * TAU,
      sway: 0.015 + seeded(i + 200) * 0.025,
    }));

    let w = 1;
    let h = 1;
    let spread = 1.2;
    let running = false;
    let rafId = 0;
    let lastDraw = 0;
    let onScreen = true;

    /* One beam = three feathered ruby layers + a thin pale gloss streak */
    function beam(ox, oy, angle, half, len, alpha) {
      const ex = ox + Math.sin(angle) * len;
      const ey = oy + Math.cos(angle) * len;
      const layers = [[1, 0.35], [0.62, 0.5], [0.3, 0.8]];

      for (const [widthFactor, alphaFactor] of layers) {
        const hw = half * widthFactor;
        const a = clamp(alpha * alphaFactor, 0, 1);
        const grad = ctx.createLinearGradient(ox, oy, ex, ey);
        grad.addColorStop(0, `rgba(176, 36, 68, ${a})`);
        grad.addColorStop(0.55, `rgba(165, 35, 65, ${a * 0.45})`);
        grad.addColorStop(1, 'rgba(165, 35, 65, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + Math.sin(angle - hw) * len, oy + Math.cos(angle - hw) * len);
        ctx.lineTo(ox + Math.sin(angle + hw) * len, oy + Math.cos(angle + hw) * len);
        ctx.closePath();
        ctx.fill();
      }

      /* Gloss streak */
      const gw = half * 0.1;
      const gloss = ctx.createLinearGradient(ox, oy, ex, ey);
      gloss.addColorStop(0, `rgba(255, 226, 232, ${clamp(alpha * 0.55, 0, 1)})`);
      gloss.addColorStop(0.5, `rgba(255, 214, 224, ${clamp(alpha * 0.2, 0, 1)})`);
      gloss.addColorStop(1, 'rgba(255, 214, 224, 0)');
      ctx.fillStyle = gloss;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.sin(angle - gw) * len, oy + Math.cos(angle - gw) * len);
      ctx.lineTo(ox + Math.sin(angle + gw) * len, oy + Math.cos(angle + gw) * len);
      ctx.closePath();
      ctx.fill();
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);

      const ox = w * 0.5 + Math.sin(t * 0.00012) * w * 0.03;
      const oy = -h * 0.18;
      const len = Math.hypot(w, h * 1.3);

      /* Warm glow where the light enters */
      const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, h * 0.9);
      glow.addColorStop(0, 'rgba(165, 35, 65, 0.55)');
      glow.addColorStop(0.45, 'rgba(165, 35, 65, 0.16)');
      glow.addColorStop(1, 'rgba(165, 35, 65, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const widthScale = spread / 1.4;
      for (const r of rays) {
        const angle =
          (r.t - 0.5) * spread + r.jitter + Math.sin(t * 0.0004 * r.speed + r.phase) * r.sway;
        const pulse = 0.75 + 0.25 * Math.sin(t * 0.0007 * r.speed + r.phase * 1.7);
        beam(ox, oy, angle, r.width * widthScale, len, r.alpha * pulse);
      }
    }

    function resize() {
      const rect = hero.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * RES);
      canvas.height = Math.round(h * RES);
      ctx.setTransform(RES, 0, 0, RES, 0, 0);
      /* Narrow (phone) screens get a narrower fan so the rays stay visible */
      spread = clamp(2 * Math.atan2(w * 0.62, h * 1.18), 0.5, 1.6);
      draw(reduceMotion.matches ? 0 : performance.now());
    }

    function frame(now) {
      rafId = window.requestAnimationFrame(frame);
      if (now - lastDraw < 33) return;     /* about 30 fps */
      lastDraw = now;
      draw(now);
    }

    function start() {
      if (running || reduceMotion.matches || !onScreen || document.hidden) return;
      running = true;
      rafId = window.requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      window.cancelAnimationFrame(rafId);
    }

    resize();
    start();

    if ('ResizeObserver' in window) {
      new ResizeObserver(resize).observe(hero);
    } else {
      window.addEventListener('resize', resize);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        onScreen = entries[0].isIntersecting;
        if (onScreen) start(); else stop();
      }).observe(hero);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else start();
    });

    onQueryChange(reduceMotion, () => {
      stop();
      resize();
      start();
    });
  }


  /* ========================================================================
     3. SECTION 1 - ENVELOPE
     A real <button> toggles the .is-open class. All animation is CSS.
     ======================================================================== */
  function initEnvelope() {
    const scene = $('#scene');
    const button = $('#open-btn');
    const label = $('#open-btn-label');
    const status = $('#hero-status');
    if (!scene || !button) return;

    function setOpen(open) {
      scene.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
      if (label) label.textContent = open ? 'Close the birthday letter' : 'Open the birthday letter';
      if (status) {
        status.textContent = open
          ? 'Letter opened. Happy Birthday. My Dear Reshu.'
          : 'Letter closed.';
      }
    }

    button.addEventListener('click', () => setOpen(!scene.classList.contains('is-open')));
  }


  /* ========================================================================
     4. SECTION 2 - MARQUEES
     The scrolling itself is pure CSS. This only pauses it while the section
     is off-screen, to save battery.
     ======================================================================== */
  function initMarquees() {
    const section = $('#wishes');
    if (!section || !('IntersectionObserver' in window)) return;
    new IntersectionObserver((entries) => {
      section.classList.toggle('is-paused', !entries[0].isIntersecting);
    }).observe(section);
  }


  /* ========================================================================
     5. SECTION 3 - SPLIT-FLAP TEXT
     "HAPPY BIRTHDAY" and "25" are built into flip cells. When the section
     first scrolls into view each cell flips through a few random characters
     and settles on its real one, one cell after another. This runs ONCE.
     ======================================================================== */
  function initSplitFlap() {
    const targets = $$('[data-flap]');
    if (!targets.length) return;

    const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const DIGITS = '0123456789';
    const FLIP_MS = 120;     /* duration of one flip */
    const CYCLES = 5;        /* random characters shown before the real one */
    const STAGGER_MS = 130;  /* delay between one cell and the next */
    const NUMBER_DELAY_MS = 900;

    const NBSP = ' ';

    function makeGlyph(char) {
      const span = document.createElement('span');
      span.className = 'flap__glyph';
      span.textContent = char === ' ' ? NBSP : char;
      return span;
    }

    function makeHalf(classes) {
      const span = document.createElement('span');
      span.className = classes;
      span.appendChild(makeGlyph(' '));
      return span;
    }

    function createCell() {
      const el = document.createElement('span');
      el.className = 'flap';
      el.setAttribute('aria-hidden', 'true');
      el.style.setProperty('--flip-ms', FLIP_MS + 'ms');
      const cell = {
        el,
        top: makeHalf('flap__half flap__half--top'),
        bottom: makeHalf('flap__half flap__half--bottom'),
        fallTop: makeHalf('flap__half flap__half--top flap__fall'),
        fallBottom: makeHalf('flap__half flap__half--bottom flap__fall'),
        char: ' ',
      };
      el.append(cell.top, cell.bottom, cell.fallTop, cell.fallBottom);
      return cell;
    }

    function setGlyph(half, char) {
      half.firstChild.textContent = char === ' ' ? NBSP : char;
    }

    function setStatic(cell, char) {
      setGlyph(cell.top, char);
      setGlyph(cell.bottom, char);
      cell.char = char;
    }

    /* One physical flip: old top falls away, new bottom swings down */
    function flipOnce(cell, next) {
      return new Promise((resolve) => {
        if (cell.char === next) { resolve(); return; }
        setGlyph(cell.top, next);          /* revealed behind the falling old top */
        setGlyph(cell.fallTop, cell.char); /* old character, top half */
        setGlyph(cell.fallBottom, next);   /* new character, bottom half */
        cell.el.classList.remove('is-flipping');
        void cell.el.offsetWidth;          /* restart the CSS animation */
        cell.el.classList.add('is-flipping');
        window.setTimeout(() => {
          setGlyph(cell.bottom, next);
          cell.char = next;
          cell.el.classList.remove('is-flipping');
          resolve();
        }, FLIP_MS);
      });
    }

    function randomFrom(pool, avoid) {
      let c = pool[Math.floor(Math.random() * pool.length)];
      if (c === avoid) c = pool[(pool.indexOf(c) + 1) % pool.length];
      return c;
    }

    async function revealCell(cell, target, pool, delay) {
      await wait(delay);
      for (let i = 0; i < CYCLES; i += 1) {
        await flipOnce(cell, randomFrom(pool, cell.char));
      }
      await flipOnce(cell, target);
    }

    /* Build the cells (blank to start) */
    const jobs = [];   /* { cell, char, pool, order } */
    let order = 0;
    targets.forEach((el, groupIndex) => {
      const text = el.dataset.flap || '';
      const pool = /\d/.test(text) ? DIGITS : LETTERS;
      el.textContent = '';
      el.classList.add('is-built');

      text.split(' ').forEach((word) => {
        const wordEl = document.createElement('span');
        wordEl.className = 'flap-word';
        Array.from(word).forEach((char) => {
          const cell = createCell();
          wordEl.appendChild(cell.el);
          jobs.push({ cell, char, pool, order, extra: groupIndex > 0 ? NUMBER_DELAY_MS : 0 });
          order += 1;
        });
        el.appendChild(wordEl);
      });
    });

    let played = false;
    function play() {
      if (played) return;     /* never restarts */
      played = true;
      if (reduceMotion.matches) {
        jobs.forEach((job) => setStatic(job.cell, job.char));
        return;
      }
      jobs.forEach((job) => {
        revealCell(job.cell, job.char, job.pool, job.order * STAGGER_MS + job.extra);
      });
    }

    const section = $('#celebrate');
    if (section && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          play();
        }
      }, { threshold: 0.35 });
      observer.observe(section);
    } else {
      play();
    }
  }


  /* ========================================================================
     6. SECTION 4 - DRIFT WALL GALLERY + LIGHTBOX
     ======================================================================== */
  function initGallery() {
    const root = $('#drift');
    const wall = $('#drift-wall');
    const section = $('#gallery');
    if (!root || !wall) return;

    const N = PHOTOS.length;
    const desktopMQ = window.matchMedia(CONFIG.desktopQuery);
    const ratios = PHOTOS.map((p) => clamp(p.ratio || 0.8, 0.62, 1.6));
    const missing = new Array(N).fill(false);
    let builtKey = '';
    let warmed = false;
    let revealObserver = null;

    /* Per-tile depth, tilt and width so the wall feels hand-placed */
    const DEPTH = [0, 46, -28, 72, 18, -10, 58, 30, -36, 64, 10, 40, -20, 52, 24];
    const TILT = [-1.8, 1.2, -0.8, 2, -1.4, 0.9, -2, 1.6, -0.6, 1.1, -1.6, 0.7, 1.9, -1, 1.3];
    const WIDTH = [100, 92, 100, 86, 96, 100, 90, 100, 94, 88, 100, 92, 100, 86, 96];
    /* Seconds for one drift loop of each column (different = natural) */
    const DURATIONS = [86, 104, 74, 96, 82];

    function fileName(photo) {
      return photo.src.split('/').pop();
    }

    function applyRatio(index) {
      $$(`.tile[data-index="${index}"]`, wall).forEach((tile) => {
        tile.style.setProperty('--ar', ratios[index].toFixed(3));
      });
    }

    function markMissing(index) {
      missing[index] = true;
      $$(`.tile[data-index="${index}"]`, wall).forEach((tile) => tile.classList.add('is-missing'));
    }

    function createTile(photo, index, isClone, isDesktop) {
      const tile = document.createElement('figure');
      tile.className = 'tile' + (isClone ? ' tile--clone' : '');
      tile.dataset.index = String(index);
      tile.style.setProperty('--ar', ratios[index].toFixed(3));
      if (isDesktop) {
        tile.style.setProperty('--z', DEPTH[index % DEPTH.length] + 'px');
        tile.style.setProperty('--r', TILT[index % TILT.length] + 'deg');
        tile.style.setProperty('--w', WIDTH[index % WIDTH.length] + '%');
      }

      let frame;
      if (isClone) {
        /* Clones only exist to make the endless loop. Hidden from assistive tech. */
        tile.setAttribute('aria-hidden', 'true');
        frame = document.createElement('div');
      } else {
        frame = document.createElement('button');
        frame.type = 'button';
        frame.dataset.index = String(index);
        frame.setAttribute(
          'aria-label',
          `Open photo ${index + 1} of ${N}` + (photo.caption ? `: ${photo.caption}` : '')
        );
      }
      frame.className = 'tile__btn';

      const img = new Image();
      img.alt = isClone ? '' : photo.alt;
      img.decoding = 'async';
      img.draggable = false;
      img.setAttribute('loading', warmed ? 'eager' : 'lazy');   /* set before src so lazy-loading applies */
      img.addEventListener('load', () => {
        if (img.naturalWidth && img.naturalHeight) {
          ratios[index] = clamp(img.naturalWidth / img.naturalHeight, 0.62, 1.6);
          applyRatio(index);
        }
      });
      img.addEventListener('error', () => markMissing(index));
      img.src = photo.src;
      frame.appendChild(img);

      if (photo.caption) {
        const cap = document.createElement('span');
        cap.className = 'tile__cap';
        cap.textContent = photo.caption;
        frame.appendChild(cap);
      }

      const note = document.createElement('span');
      note.className = 'tile__missing';
      note.append('Add ');
      const code = document.createElement('code');
      code.textContent = fileName(photo);
      note.appendChild(code);
      frame.appendChild(note);

      if (missing[index]) tile.classList.add('is-missing');
      tile.appendChild(frame);
      return tile;
    }

    function build() {
      const isDesktop = desktopMQ.matches;
      const still = reduceMotion.matches;
      const key = `${isDesktop}|${still}`;
      if (key === builtKey) return;
      builtKey = key;

      if (revealObserver) { revealObserver.disconnect(); revealObserver = null; }

      root.classList.toggle('drift--wall', isDesktop);
      root.classList.toggle('drift--grid', !isDesktop);
      root.classList.toggle('drift--still', still);
      wall.textContent = '';

      const colCount = isDesktop ? 5 : 2;
      const makeClones = isDesktop && !still;
      const tracks = [];

      for (let c = 0; c < colCount; c += 1) {
        const col = document.createElement('div');
        col.className = 'drift__col' + (c % 2 === 1 ? ' drift__col--down' : '');
        const track = document.createElement('div');
        track.className = 'drift__track';
        track.style.setProperty('--dur', DURATIONS[c % DURATIONS.length] + 's');
        col.appendChild(track);
        wall.appendChild(col);
        tracks.push(track);
      }

      PHOTOS.forEach((photo, i) => {
        tracks[i % colCount].appendChild(createTile(photo, i, false, isDesktop));
      });

      /* Two extra copies of each column = seamless endless drift */
      if (makeClones) {
        tracks.forEach((track) => {
          const originals = Array.from(track.children);
          for (let copy = 0; copy < 2; copy += 1) {
            originals.forEach((tile) => {
              const i = Number(tile.dataset.index);
              track.appendChild(createTile(PHOTOS[i], i, true, true));
            });
          }
        });
      }

      /* Mobile grid: gentle fade-up as tiles come into view (once each) */
      const tiles = $$('.tile', wall);
      if (!isDesktop && !still && 'IntersectionObserver' in window) {
        revealObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-in');
              revealObserver.unobserve(entry.target);
            }
          });
        }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
        tiles.forEach((tile) => revealObserver.observe(tile));
      } else {
        tiles.forEach((tile) => tile.classList.add('is-in'));
      }
    }

    /* Photos stay lazy until the gallery is close, then all load at once so
       nothing pops in while the wall drifts. */
    function warmUp() {
      if (warmed) return;
      warmed = true;
      $$('img[loading="lazy"]', wall).forEach((img) => { img.setAttribute('loading', 'eager'); });
    }
    if (section && 'IntersectionObserver' in window) {
      const warmObserver = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          warmObserver.disconnect();
          warmUp();
        }
      }, { rootMargin: '900px 0px' });
      warmObserver.observe(section);
    } else {
      warmUp();
    }

    build();
    onQueryChange(desktopMQ, build);
    onQueryChange(reduceMotion, build);

    /* ---------------------------------------------------------------------
       LIGHTBOX
       --------------------------------------------------------------------- */
    const lb = {
      root: $('#lightbox'),
      img: $('#lb-img'),
      count: $('#lb-count'),
      text: $('#lb-text'),
      missing: $('#lb-missing'),
      status: $('#lb-status'),
      close: $('#lb-close'),
      prev: $('#lb-prev'),
      next: $('#lb-next'),
      figure: $('#lb-figure'),
    };
    if (!lb.root || !lb.img) return;

    const page = $('#page');
    let current = 0;
    let isOpen = false;
    let opener = null;
    let swiped = false;

    function lockScroll() {
      const root = document.documentElement;
      const scrollbar = window.innerWidth - root.clientWidth;
      root.classList.add('no-scroll');
      if (scrollbar > 0) document.body.style.paddingRight = scrollbar + 'px';
      document.body.classList.add('lightbox-open');
    }

    function unlockScroll() {
      document.documentElement.classList.remove('no-scroll');
      document.body.style.paddingRight = '';
      document.body.classList.remove('lightbox-open');
    }

    function show(index) {
      current = (index + N) % N;
      const photo = PHOTOS[current];

      lb.root.classList.remove('is-missing');
      lb.img.classList.add('is-swapping');
      lb.img.alt = photo.alt;
      lb.img.src = photo.src;
      lb.count.textContent = `${current + 1} / ${N}`;
      lb.text.textContent = photo.caption || '';
      lb.missing.textContent = `This photo has not been added yet. Put it in the images folder as ${fileName(photo)}.`;
      if (lb.status) {
        lb.status.textContent = `Photo ${current + 1} of ${N}.` + (photo.caption ? ' ' + photo.caption : '');
      }

      /* Warm the neighbours so next / previous feel instant */
      [current - 1, current + 1].forEach((j) => {
        const pre = new Image();
        pre.src = PHOTOS[(j + N) % N].src;
      });
    }

    lb.img.addEventListener('load', () => lb.img.classList.remove('is-swapping'));
    lb.img.addEventListener('error', () => {
      lb.img.classList.remove('is-swapping');
      lb.root.classList.add('is-missing');
    });

    function go(step) { show(current + step); }

    function openLightbox(index, openerEl) {
      if (isOpen) return;
      isOpen = true;
      opener = openerEl || null;
      lockScroll();
      show(index);
      if (page) {
        if ('inert' in page) page.inert = true;
        else page.setAttribute('aria-hidden', 'true');
      }
      lb.root.classList.add('is-open');
      lb.root.setAttribute('aria-hidden', 'false');
      lb.close.focus({ preventScroll: true });
      document.addEventListener('keydown', onKeyDown);
    }

    function closeLightbox() {
      if (!isOpen) return;
      isOpen = false;
      document.removeEventListener('keydown', onKeyDown);
      lb.root.classList.remove('is-open');
      lb.root.setAttribute('aria-hidden', 'true');
      if (page) {
        if ('inert' in page) page.inert = false;
        else page.removeAttribute('aria-hidden');
      }
      unlockScroll();

      /* Give focus back to the photo that opened the lightbox */
      let target = opener;
      if (!target || !document.contains(target)) {
        target = $(`.tile:not(.tile--clone)[data-index="${current}"] .tile__btn`, wall);
      }
      if (target && target.focus) target.focus({ preventScroll: true });
      opener = null;
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(1);
      } else if (event.key === 'Tab') {
        /* Keep keyboard focus inside the dialog */
        const stops = [lb.close, lb.prev, lb.next];
        const active = document.activeElement;
        if (event.shiftKey && active === stops[0]) {
          event.preventDefault();
          stops[stops.length - 1].focus();
        } else if (!event.shiftKey && active === stops[stops.length - 1]) {
          event.preventDefault();
          stops[0].focus();
        } else if (!stops.includes(active)) {
          event.preventDefault();
          stops[0].focus();
        }
      }
    }

    /* Open from any tile (event delegation, so rebuilt tiles keep working) */
    wall.addEventListener('click', (event) => {
      const tile = event.target.closest('.tile');
      if (!tile) return;
      const index = Number(tile.dataset.index);
      const openerEl = tile.classList.contains('tile--clone')
        ? $(`.tile:not(.tile--clone)[data-index="${index}"] .tile__btn`, wall)
        : $('.tile__btn', tile);
      openLightbox(index, openerEl);
    });

    lb.close.addEventListener('click', closeLightbox);
    lb.prev.addEventListener('click', () => go(-1));
    lb.next.addEventListener('click', () => go(1));

    /* Click on the dark backdrop closes (ignored right after a swipe) */
    lb.root.addEventListener('click', (event) => {
      if (swiped) return;
      if (event.target.closest('[data-close]')) closeLightbox();
    });

    /* Swipe left / right to change photo (touch, pen or mouse drag) */
    let startX = 0;
    let startY = 0;
    let tracking = false;
    lb.root.addEventListener('pointerdown', (event) => {
      if (event.target.closest('button')) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      tracking = true;
      startX = event.clientX;
      startY = event.clientY;
    });
    lb.root.addEventListener('pointerup', (event) => {
      if (!tracking) return;
      tracking = false;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        swiped = true;
        window.setTimeout(() => { swiped = false; }, 80);
        go(dx < 0 ? 1 : -1);
      }
    });
    lb.root.addEventListener('pointercancel', () => { tracking = false; });
  }


  /* ========================================================================
     7. OPTIONAL MUSIC
     The button stays dimmed and disabled until the audio file loads.
     Nothing ever plays by itself.
     ======================================================================== */
  function initMusic() {
    const button = $('#music-btn');
    const audio = $('#bgm');
    if (!button || !audio) return;

    let available = false;

    function refresh() {
      const playing = !audio.paused;
      button.setAttribute('aria-disabled', String(!available));
      button.setAttribute('aria-pressed', String(available && playing));
      const text = !available
        ? 'Music not available'
        : (playing ? 'Pause music' : 'Play music');
      button.setAttribute('aria-label', text);
      button.title = available
        ? text
        : 'Music not available. Add your song as ' + CONFIG.musicSrc;
    }

    function setAvailable(value) {
      available = value;
      refresh();
    }

    audio.addEventListener('loadedmetadata', () => setAvailable(true));
    audio.addEventListener('canplay', () => setAvailable(true));
    audio.addEventListener('error', () => setAvailable(false));   /* missing / unsupported file */
    audio.addEventListener('play', refresh);
    audio.addEventListener('pause', refresh);
    audio.addEventListener('ended', refresh);

    button.addEventListener('click', async () => {
      if (!available) return;
      if (audio.paused) {
        try {
          await audio.play();
        } catch (error) {
          /* A blocked play (NotAllowedError) is harmless: the visitor can tap again. */
          if (error && error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
            setAvailable(false);
          }
        }
      } else {
        audio.pause();
      }
      refresh();
    });

    audio.loop = true;
    audio.preload = 'metadata';
    audio.src = CONFIG.musicSrc;    /* set last, after the listeners above exist */
    refresh();
  }


  /* ========================================================================
     8. PRINT BUTTON ("Save this letter")
     style.css has a print stylesheet that prints only the letter.
     ======================================================================== */
  function initPrint() {
    const button = $('#print-btn');
    if (button) button.addEventListener('click', () => window.print());
  }


  /* ========================================================================
     9. START EVERYTHING
     ======================================================================== */
  initRays();
  initEnvelope();
  initMarquees();
  initSplitFlap();
  initGallery();
  initMusic();
  initPrint();
})();
