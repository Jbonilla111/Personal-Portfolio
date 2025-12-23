// Small convenience: set the footer year
(function(){
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();
})();

// Active nav tracking: add/remove .active on nav links based on visible section
(function(){
  const links = document.querySelectorAll('.nav-links a');
  const sections = Array.from(links).map(a => {
    const id = a.getAttribute('href')?.replace('#','');
    return id ? document.getElementById(id) : null;
  }).filter(Boolean);

  if(!sections.length) return;

  const mapIdToLink = {};
  links.forEach(l => { const id = l.getAttribute('href')?.replace('#',''); if(id) mapIdToLink[id]=l });

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const id = entry.target.id;
        Object.values(mapIdToLink).forEach(el=>el.classList.remove('active'));
        const link = mapIdToLink[id];
        if(link) link.classList.add('active');
      }
    });
  },{root:null,threshold:0.45});

  sections.forEach(s=> io.observe(s));

  // Add click handler to set active immediately
  links.forEach(l=> l.addEventListener('click', ()=>{
    links.forEach(x=> x.classList.remove('active'));
    l.classList.add('active');
  }));
})();

// Typewriter for the name: continuous loop and restart on visibility change
(function(){
  const textEl = document.querySelector('.type-text');
  const live = document.getElementById('name-live');
  if(!textEl) return;
  const full = textEl.dataset.text || '';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(reduced){
    textEl.textContent = full;
    if(live) live.textContent = full;
    const caret = document.querySelector('.caret'); if(caret) caret.style.display='none';
    return;
  }

  let pos = 0;
  let deleting = false;
  let timeoutId = null;

  const minDelay = 60; // ms
  const maxDelay = 140; // ms
  const deleteDelay = 40;
  const pauseAfterTyped = 1400;
  const pauseAfterDeleted = 400;

  function step(){
    if(!document.hidden){
      if(!deleting){
        // type forward
        if(pos <= full.length){
          textEl.textContent = full.slice(0,pos);
          pos++;
          if(pos > full.length){
            // finished typing
            if(live) live.textContent = full;
            deleting = true;
            timeoutId = setTimeout(step, pauseAfterTyped);
            return;
          }
          const delay = minDelay + Math.random()*(maxDelay-minDelay);
          timeoutId = setTimeout(step, delay);
          return;
        }
      }else{
        // deleting
        if(pos >= 0){
          textEl.textContent = full.slice(0,pos);
          pos--;
          if(pos < 0){
            deleting = false;
            timeoutId = setTimeout(step, pauseAfterDeleted);
            return;
          }
          timeoutId = setTimeout(step, deleteDelay + Math.random()*20);
          return;
        }
      }
    }
    // fallback: schedule next tick to keep loop running
    timeoutId = setTimeout(step, 800);
  }

  // start after a short delay for natural feel
  function start(){
    if(timeoutId) clearTimeout(timeoutId);
    pos = 0; deleting = false; textEl.textContent = '';
    timeoutId = setTimeout(step, 400);
  }

  start();

  // restart when page becomes visible again
  document.addEventListener('visibilitychange', ()=>{
    if(!document.hidden){ start(); }
  });

  // also allow replay on click of the name
  const container = document.querySelector('.typewriter');
  if(container) container.addEventListener('click', ()=> start());

})();

// Carousel script: basic accessible slider with autoplay (respects reduced motion)
(function(){
  const carousel = document.querySelector('.carousel');
  if(!carousel) return;

  const track = carousel.querySelector('.carousel-track');
  const slides = Array.from(carousel.querySelectorAll('.slide'));
  const prev = carousel.querySelector('.carousel-btn.prev');
  const next = carousel.querySelector('.carousel-btn.next');
  const dots = Array.from(carousel.querySelectorAll('.dot'));

  let current = 0;
  const slideCount = slides.length;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let autoplayId = null;

  function update(){
    track.style.transform = `translateX(${-current * 100}%)`;
    dots.forEach((d,i)=>{
      d.setAttribute('aria-selected', String(i===current));
    });
  }

  function prevSlide(){ current = (current - 1 + slideCount) % slideCount; update(); }
  function nextSlide(){ current = (current + 1) % slideCount; update(); }

  prev.addEventListener('click', ()=>{ prevSlide(); resetAutoplay(); });
  next.addEventListener('click', ()=>{ nextSlide(); resetAutoplay(); });

  dots.forEach(d=> d.addEventListener('click', (e)=>{ current = Number(d.dataset.index); update(); resetAutoplay(); }));

  // keyboard support
  carousel.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowLeft') { prevSlide(); resetAutoplay(); }
    if(e.key === 'ArrowRight') { nextSlide(); resetAutoplay(); }
  });

  function startAutoplay(){
    if(reduced) return;
    stopAutoplay();
    autoplayId = setInterval(()=> { nextSlide(); }, 4500);
  }
  function stopAutoplay(){ if(autoplayId) { clearInterval(autoplayId); autoplayId = null; } }
  function resetAutoplay(){ stopAutoplay(); startAutoplay(); }

  // pause on hover/focus to allow reading
  carousel.addEventListener('mouseenter', ()=> stopAutoplay());
  carousel.addEventListener('mouseleave', ()=> startAutoplay());
  carousel.addEventListener('focusin', ()=> stopAutoplay());
  carousel.addEventListener('focusout', ()=> startAutoplay());

  // initialize
  update();
  startAutoplay();

  // ensure focusable
  carousel.setAttribute('tabindex','0');
})();