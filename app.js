(function(){
  var SHOT = new URLSearchParams(location.search).get('shot') === '1';

  /* reveals */
  var els = [].slice.call(document.querySelectorAll('.reveal'));
  if (SHOT || !('IntersectionObserver' in window)) {
    els.forEach(function(e){ e.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: .1, rootMargin: '0px 0px -7% 0px' });
    els.forEach(function(e){ io.observe(e); });
  }

  /* nav hairline */
  var nav = document.getElementById('nav');
  function navState(){
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }

  /* parallax (ghost numerals + stills) */
  var plx = [].slice.call(document.querySelectorAll('[data-plx]'));
  var ticking = false;
  function frame(){
    ticking = false;
    var vh = window.innerHeight;
    for (var i = 0; i < plx.length; i++) {
      var el = plx[i];
      var r = el.getBoundingClientRect();
      if (r.bottom < -120 || r.top > vh + 120) continue;
      var f = parseFloat(el.getAttribute('data-plx')) || .2;
      var c = (r.top + r.height/2 - vh/2) / vh;
      el.style.transform = 'translate3d(0,' + (-c * f * 56).toFixed(2) + 'px,0)';
    }
  }
  function onScroll(){
    navState();
    if (SHOT || window.innerWidth <= 640) return;
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();

(function(){var q=new URLSearchParams(location.search);if(q.get('shot')!=='1')return;document.documentElement.classList.add('shot-mode');var s=document.createElement('style');s.textContent='*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}html{scroll-behavior:auto!important}'+(q.get('mw')==='0'?'':'body{min-width:1440px}');document.head.appendChild(s);window.addEventListener('load',function(){requestAnimationFrame(function(){window.scrollTo(parseInt(q.get('x')||'0',10),parseInt(q.get('y')||'0',10))})});})();

(function(){
  var slides=[].slice.call(document.querySelectorAll('.ss-slide'));
  if(!slides.length)return;
  var N=slides.length,idx=0,FADE=2000,HOLD=3000;
  function advance(){
    var prev=idx;
    idx=(idx+1)%N;
    /* freeze outgoing transform so Ken Burns doesn't snap on deactivate */
    slides[prev].style.transform=window.getComputedStyle(slides[prev]).transform;
    slides[prev].style.animation='none';
    /* reset incoming animation so Ken Burns always starts from scale(1) */
    slides[idx].style.animation='none';
    void slides[idx].offsetWidth;  /* flush to clear animation state */
    slides[idx].style.animation='';
    slides[idx].style.transform='';
    slides[idx].style.zIndex='1';
    /* true simultaneous crossfade: both transitions fire in the same frame */
    requestAnimationFrame(function(){requestAnimationFrame(function(){
      slides[idx].classList.add('ss-active');
      slides[prev].classList.remove('ss-active');
      setTimeout(function(){
        slides[prev].style.transform='';
        slides[prev].style.animation='';
        slides[prev].style.zIndex='';
        slides[idx].style.zIndex='';
      },FADE);
    });});
  }
  setInterval(advance,HOLD);
})();

(function(){
  var SHOT = new URLSearchParams(location.search).get('shot') === '1';
  var rows  = [].slice.call(document.querySelectorAll('.ach-row'));
  var media = [].slice.call(document.querySelectorAll('.ach-media'));
  var chap  = document.querySelector('.ach');
  var stage = document.querySelector('.ach-stage');
  if (!rows.length) return;
  var N = rows.length, cur = -1;

  function set(i){
    if (i === cur) return;            // skip redundant work → no transition restarts
    cur = i;
    for (var k = 0; k < N; k++){
      rows[k].classList.toggle('is-active', k === i);
      if (media[k]) media[k].classList.toggle('is-active', k === i);
    }
  }

  /* hover locks selection; mouseleave keeps the lock — scroll is the only thing that releases it */
  var hovering = false;
  var list = document.querySelector('.ach-list');
  if (list) list.addEventListener('mouseleave', function(){ hovering = false; });
  rows.forEach(function(r,i){
    r.addEventListener('mouseenter', function(){ hovering = true; set(i); });
    r.addEventListener('click', function(e){ e.preventDefault(); set(i); });
    r.addEventListener('focus', function(){ set(i); });
  });

  /* shot mode → deterministic state for screenshots; honor ?act=, no scroll-spy */
  if (SHOT){
    var a = parseInt(new URLSearchParams(location.search).get('act'), 10);
    set(!isNaN(a) && a >= 0 && a < N ? a : 0);
    return;
  }

  /* scroll-spy: as you scroll, softly advance the active award from the media
     box's sticky-pin progress. This sweeps all awards evenly while the box stays
     pinned & centered, instead of skipping the first/last few. */
  var ticking = false;
  function spy(){
    ticking = false;
    if (hovering) return;
    if (window.innerWidth <= 920 || !chap || !stage) return;   // sticky layout only
    var r = chap.getBoundingClientRect();
    var pinStart = (r.top + window.scrollY) - 96;              // matches .ach-stage{top:96px}
    var pinEnd   = (r.bottom + window.scrollY) - 96 - stage.offsetHeight;
    var p = pinEnd > pinStart ? (window.scrollY - pinStart) / (pinEnd - pinStart) : 0;
    if (p < 0) p = 0; else if (p > 1) p = 1;
    set(Math.round(p * (N - 1)));
  }
  function onScroll(){ hovering = false; if (!ticking){ ticking = true; requestAnimationFrame(spy); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  spy();
})();

(function(){
  /* Single-scroll section nav: the top menu smooth-scrolls to its section and
     a scroll-spy keeps the matching menu item highlighted. (Replaces the old
     tab system — the page is now one continuous scroll.) */
  var nav   = document.getElementById('nav');
  var links = [].slice.call(document.querySelectorAll('.tab-btn[data-target]'));
  var brand = document.querySelector('#nav .brand');
  if (!links.length) return;

  // Menu landmarks in scroll order. Sections that sit *between* landmarks
  // belong to the preceding landmark (practice→About, recognition→Team,
  // eth-video→Contact) so the highlight never goes blank.
  var ORDER = ['story', 'team', 'portfolio', 'contact'];
  function groupFor(id) {
    var m = { hero:'story', story:'story', practice:'story',
              team:'team', recognition:'team',
              portfolio:'portfolio', contact:'contact', 'eth-video':'contact' };
    return m[id] || 'story';
  }
  function setActive(id) {
    var g = groupFor(id);
    links.forEach(function(a){ a.classList.toggle('active', a.getAttribute('data-target') === g); });
  }
  function navH(){ return (nav && nav.offsetHeight) || 72; }

  /* Self-driven eased scroll (easeInOutCubic) — written every frame with
     scroll-behavior:auto so the browser can't drop it mid-flight. */
  var scrollRAF = null;
  function smoothScrollTo(targetY, duration) {
    if (scrollRAF) cancelAnimationFrame(scrollRAF);
    var startY = window.scrollY || window.pageYOffset || 0, diff = targetY - startY, start = null;
    document.documentElement.style.scrollBehavior = 'auto';
    if (Math.abs(diff) < 2) { window.scrollTo(0, targetY); return; }
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / duration);
      var e = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
      window.scrollTo(0, Math.round(startY + diff * e));
      if (t < 1) { scrollRAF = requestAnimationFrame(step); }
      else { scrollRAF = null; document.documentElement.style.scrollBehavior = ''; }
    }
    scrollRAF = requestAnimationFrame(step);
  }
  // Layout (transform-agnostic) document top: a section's heading carries the
  // .reveal transform, so use offsetTop rather than getBoundingClientRect so
  // the pre-reveal 30px shift can't skew the target.
  function docTop(el){ var y = 0; for (var n = el; n; n = n.offsetParent) y += n.offsetTop; return y; }
  // The heading we bring to the top of the view for each section.
  function headOf(id){ var el = document.getElementById(id); return el ? (el.querySelector('.ch-head, .closing') || el) : null; }
  function yOf(id) {
    var head = headOf(id);
    if (!head) return 0;
    var maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    // land the section's heading just under the fixed nav (e.g. "The Minds" at top)
    return Math.min(Math.max(0, docTop(head) - navH() - 14), maxY);
  }
  function go(id, push) {
    var head = headOf(id);
    if (head) head.classList.add('in');   // pre-reveal heading so it doesn't settle 30px on arrival
    smoothScrollTo(yOf(id), 760);
    if (push && history.pushState) history.pushState(null, '', '#' + id);
    setActive(id);
  }

  links.forEach(function(a) {
    a.addEventListener('click', function(e) { e.preventDefault(); go(a.getAttribute('data-target'), true); });
  });
  if (brand) {
    brand.addEventListener('click', function(e) {
      e.preventDefault();
      smoothScrollTo(0, 700);
      if (history.pushState) history.pushState(null, '', location.pathname + location.search);
      setActive('story');
    });
  }

  /* scroll-spy: the active landmark is the last one whose top has crossed the
     line just under the fixed nav. */
  var ticking = false;
  function spy() {
    ticking = false;
    var line = window.scrollY + navH() + 48, active = ORDER[0];
    for (var i = 0; i < ORDER.length; i++) {
      var el = document.getElementById(ORDER[i]);
      if (el && el.getBoundingClientRect().top + window.scrollY <= line) active = ORDER[i];
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) active = ORDER[ORDER.length - 1];
    setActive(active);
  }
  window.addEventListener('scroll', function(){ if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
  window.addEventListener('resize', function(){ if (!ticking) { ticking = true; requestAnimationFrame(spy); } });

  /* initial hash (incl. old /team-style links remapped by 404.html) → jump there */
  var h = (location.hash || '').replace(/^#/, '');
  if (h && document.getElementById(h)) {
    requestAnimationFrame(function(){ window.scrollTo(0, yOf(h)); setActive(h); });
  } else {
    spy();
  }
})();

(function(){
  var modal   = document.getElementById('modal-ryan');
  var trigger = document.querySelector('[data-modal="ryan"]');
  if (!modal || !trigger) return;

  function openModal(){
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.bio-modal-close').focus();
  }
  function closeModal(){
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    trigger.focus();
  }

  trigger.addEventListener('click', openModal);
  trigger.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openModal(); }
  });

  modal.querySelector('.bio-modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', function(e){ if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
})();

(function(){
  var modal   = document.getElementById('modal-philip');
  var trigger = document.querySelector('[data-modal="philip"]');
  if (!modal || !trigger) return;

  function openModal(){
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.bio-modal-close').focus();
  }
  function closeModal(){
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    trigger.focus();
  }

  trigger.addEventListener('click', openModal);
  trigger.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openModal(); }
  });

  modal.querySelector('.bio-modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', function(e){ if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
})();

(function(){
  var modal   = document.getElementById('modal-han');
  var trigger = document.querySelector('[data-modal="han"]');
  if (!modal || !trigger) return;

  function openModal(){
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.bio-modal-close').focus();
  }
  function closeModal(){
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    trigger.focus();
  }

  trigger.addEventListener('click', openModal);
  trigger.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openModal(); }
  });

  modal.querySelector('.bio-modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', function(e){ if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
})();

(function(){
  var modal   = document.getElementById('modal-howard');
  var trigger = document.querySelector('[data-modal="howard"]');
  if (!modal || !trigger) return;

  function openModal(){
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.bio-modal-close').focus();
  }
  function closeModal(){
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    trigger.focus();
  }

  trigger.addEventListener('click', openModal);
  trigger.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openModal(); }
  });

  modal.querySelector('.bio-modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', function(e){ if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
})();

(function(){
  var modal   = document.getElementById('modal-denis');
  var trigger = document.querySelector('[data-modal="denis"]');
  if (!modal || !trigger) return;

  function openModal(){
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.bio-modal-close').focus();
  }
  function closeModal(){
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    trigger.focus();
  }

  trigger.addEventListener('click', openModal);
  trigger.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openModal(); }
  });

  modal.querySelector('.bio-modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', function(e){ if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
})();

(function(){
  var modal   = document.getElementById('modal-danial');
  var trigger = document.querySelector('[data-modal="danial"]');
  if (!modal || !trigger) return;

  function openModal(){
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.bio-modal-close').focus();
  }
  function closeModal(){
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    trigger.focus();
  }

  trigger.addEventListener('click', openModal);
  trigger.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openModal(); }
  });

  modal.querySelector('.bio-modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', function(e){ if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
})();

(function(){
  /* Language toggle: KR (default) / EN / CN (zh). Saves to localStorage.
     html.en or html.zh class drives .t-kr / .t-en / .t-zh visibility via CSS. */
  var btns = [].slice.call(document.querySelectorAll('.lt-btn'));
  if (!btns.length) return;

  function setLang(lang, animate) {
    function apply() {
      document.documentElement.classList.remove('en', 'zh');
      if (lang === 'en') document.documentElement.classList.add('en');
      else if (lang === 'zh') document.documentElement.classList.add('zh');
      try { localStorage.setItem('shard-lang', lang); } catch(e) {}
      if (animate) document.body.classList.remove('lang-fading');
    }
    if (animate) {
      document.body.classList.add('lang-fading');
      setTimeout(apply, 180);
    } else {
      apply();
    }
  }

  var saved;
  try { saved = localStorage.getItem('shard-lang'); } catch(e) {}
  if (saved === 'en' || saved === 'zh') {
    setLang(saved, false);
  } else if (!saved) {
    // No manual preference — use geo default from cookie set by Vercel middleware
    var geoCookie = null;
    document.cookie.split(';').forEach(function(c) {
      var p = c.trim().split('=');
      if (p[0] === 'shard-lang-geo') geoCookie = p.slice(1).join('=');
    });
    if (geoCookie === 'en' || geoCookie === 'zh') setLang(geoCookie, false);
    // 'ko' or missing → Korean default, no action needed
  }
  // 'ko' in localStorage → Korean default, no action needed

  btns.forEach(function(b) {
    b.addEventListener('click', function() {
      setLang(b.getAttribute('data-lang'), true);
    });
  });
})();

(function(){
  /* Mobile nav: the hamburger toggles the full-screen menu overlay.
     body.nav-open drives the overlay + the X animation via CSS. */
  var btn = document.getElementById('nav-toggle');
  var navLinks = document.getElementById('nav-links');
  if (btn && navLinks) {
    var setOpen = function(open){
      document.body.classList.toggle('nav-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    btn.addEventListener('click', function(){ setOpen(!document.body.classList.contains('nav-open')); });
    /* tapping a destination closes the menu — the link's own handler scrolls */
    navLinks.addEventListener('click', function(e){ if (e.target.closest('.tab-btn')) setOpen(false); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && document.body.classList.contains('nav-open')) setOpen(false); });
    window.addEventListener('resize', function(){ if (window.innerWidth > 768 && document.body.classList.contains('nav-open')) setOpen(false); });
  }
})();

(function(){
  var modal   = document.getElementById('modal-paul');
  var trigger = document.querySelector('[data-modal="paul"]');
  if (!modal || !trigger) return;

  function openModal(){
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.bio-modal-close').focus();
  }
  function closeModal(){
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    trigger.focus();
  }

  trigger.addEventListener('click', openModal);
  trigger.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openModal(); }
  });

  modal.querySelector('.bio-modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', function(e){ if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
})();
