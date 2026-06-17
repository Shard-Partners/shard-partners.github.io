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

  /* hover controls row while cursor is inside the list; scroll-spy resumes on mouseleave */
  var hovering = false;
  var list = document.querySelector('.ach-list');
  if (list) list.addEventListener('mouseleave', function(){ hovering = false; spy(); });
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
  function onScroll(){ if (!ticking){ ticking = true; requestAnimationFrame(spy); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  spy();
})();

(function(){
  var TABS   = ['about','team','portfolio','contact'];
  var btns   = [].slice.call(document.querySelectorAll('.tab-btn'));
  var panels = [].slice.call(document.querySelectorAll('.tab-panel'));
  if (!btns.length) return;

  function urlFor(tab) {
    return tab === 'about' ? '/#About' : '/' + tab;
  }

  function tabFromURL() {
    var hash = location.hash.replace(/^#/, '').toLowerCase();
    if (TABS.indexOf(hash) >= 0) return hash;
    var path = location.pathname.replace(/^\//, '').toLowerCase();
    if (TABS.indexOf(path) >= 0) return path;
    return 'about';
  }

  function activate(tab, push, scroll) {
    btns.forEach(function(b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });
    panels.forEach(function(p) {
      p.classList.toggle('active', p.id === 'tab-' + tab);
    });
    if (push) history.pushState({tab: tab}, '', urlFor(tab));

    var panel = document.getElementById('tab-' + tab);
    if (!panel) return;

    // Reveal animations in next paint
    requestAnimationFrame(function() {
      [].slice.call(panel.querySelectorAll('.reveal:not(.in)')).forEach(function(el) {
        el.classList.add('in');
      });
    });

    if (scroll) {
      // 1. Instant jump to top — shows hero
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      // 2. Read ch-head position now (at scrollY=0 it equals document offset)
      var chHead = panel.querySelector('.ch-head');
      if (chHead) {
        var navH = (document.getElementById('nav') || {offsetHeight: 80}).offsetHeight;
        var target = Math.max(0, chHead.getBoundingClientRect().top - navH - 24);
        // 3. Smooth scroll to section title in next task
        setTimeout(function() {
          document.documentElement.style.scrollBehavior = '';
          window.scrollTo({top: target, behavior: 'smooth'});
        }, 32);
      } else {
        document.documentElement.style.scrollBehavior = '';
      }
    }
  }

  btns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      activate(btn.getAttribute('data-tab'), true, true);
    });
  });

  window.addEventListener('popstate', function(e) {
    activate((e.state && e.state.tab) || tabFromURL(), false);
  });

  // Initial load: 404 redirect → sessionStorage, or parse current URL
  var stored = sessionStorage.getItem('__tab');
  if (stored && TABS.indexOf(stored) >= 0) {
    sessionStorage.removeItem('__tab');
    activate(stored, true);   // restore the clean URL (e.g. /team)
  } else {
    activate(tabFromURL(), false);
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
