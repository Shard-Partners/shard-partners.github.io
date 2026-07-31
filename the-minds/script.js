(function(){
  var els = [].slice.call(document.querySelectorAll('.reveal'));
  if (!('IntersectionObserver' in window)) {
    els.forEach(function(e){ e.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: .1, rootMargin: '0px 0px -7% 0px' });
    els.forEach(function(e){ io.observe(e); });
  }

  /* parallax (team photos) */
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
    if (window.innerWidth <= 640) return;
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();

(function(){
  /* recognition: achievement list <-> media stage */
  var rows  = [].slice.call(document.querySelectorAll('.ach-row'));
  var media = [].slice.call(document.querySelectorAll('.ach-media'));
  var chap  = document.querySelector('.ach');
  var stage = document.querySelector('.ach-stage');
  if (!rows.length) return;
  var N = rows.length, cur = -1;

  function set(i){
    if (i === cur) return;
    cur = i;
    for (var k = 0; k < N; k++){
      rows[k].classList.toggle('is-active', k === i);
      if (media[k]) media[k].classList.toggle('is-active', k === i);
    }
  }

  var hovering = false;
  var list = document.querySelector('.ach-list');
  if (list) list.addEventListener('mouseleave', function(){ hovering = false; });
  rows.forEach(function(r,i){
    r.addEventListener('mouseenter', function(){ hovering = true; set(i); });
    r.addEventListener('click', function(e){ e.preventDefault(); set(i); });
    r.addEventListener('focus', function(){ set(i); });
  });

  var ticking2 = false;
  function spy(){
    ticking2 = false;
    if (hovering) return;
    if (window.innerWidth <= 920 || !chap || !stage) return;
    var r = chap.getBoundingClientRect();
    var pinStart = (r.top + window.scrollY) - 96;
    var pinEnd   = (r.bottom + window.scrollY) - 96 - stage.offsetHeight;
    var p = pinEnd > pinStart ? (window.scrollY - pinStart) / (pinEnd - pinStart) : 0;
    if (p < 0) p = 0; else if (p > 1) p = 1;
    set(Math.round(p * (N - 1)));
  }
  function onScroll2(){ hovering = false; if (!ticking2){ ticking2 = true; requestAnimationFrame(spy); } }
  window.addEventListener('scroll', onScroll2, { passive: true });
  window.addEventListener('resize', onScroll2);
  spy();
})();

function initBioModal(name){
  var modal   = document.getElementById('modal-' + name);
  var trigger = document.querySelector('[data-modal="' + name + '"]');
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
}
['philip','han','denis','paul'].forEach(initBioModal);

(function(){
  var hint = document.getElementById('scroll-hint');
  if (!hint) return;
  function check(){ hint.classList.toggle('is-hidden', window.scrollY > 120); }
  window.addEventListener('scroll', check, { passive: true });
  check();
})();
