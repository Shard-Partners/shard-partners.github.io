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
  var slides=document.querySelectorAll('.ss-slide');
  var idx=0,dur=1400;
  if(!slides.length)return;
  setInterval(function(){
    var prev=idx;
    idx=(idx+1)%slides.length;
    slides[idx].style.zIndex=1;
    slides[idx].classList.add('ss-active');
    setTimeout(function(){
      slides[prev].classList.remove('ss-active');
      slides[idx].style.zIndex='';
      slides[prev].style.zIndex='';
    },dur);
  },3000);
})();

(function(){
  var rows=[].slice.call(document.querySelectorAll('.ach-row'));
  var media=[].slice.call(document.querySelectorAll('.ach-media'));
  if(!rows.length) return;
  function set(i){
    rows.forEach(function(r,k){r.classList.toggle('is-active',k===i);});
    media.forEach(function(m,k){m.classList.toggle('is-active',k===i);});
  }
  rows.forEach(function(r,i){
    r.addEventListener('mouseenter',function(){set(i);});
    r.addEventListener('focus',function(){set(i);});
    r.addEventListener('click',function(e){e.preventDefault();set(i);});
  });
  try{var q=new URLSearchParams(location.search);var a=parseInt(q.get('act'),10);if(!isNaN(a)&&a>=0&&a<rows.length)set(a);}catch(e){}
})();
