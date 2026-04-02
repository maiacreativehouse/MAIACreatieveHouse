/* Email links decoded — Cloudflare email protection removed for local use */
/* ── Cursor: hidden until first mouse move ── */
const cur  = document.getElementById('cur');
const ring = document.getElementById('cur-ring');
cur.style.opacity  = '0';
ring.style.opacity = '0';
let mx = window.innerWidth/2, my = window.innerHeight/2;
let rx = mx, ry = my;
let cursorActive = false;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cur.style.left = mx + 'px'; cur.style.top = my + 'px';
  if(!cursorActive){
    cursorActive = true;
    cur.style.opacity  = '1';
    ring.style.opacity = '1';
  }
});

(function loopCursor(){
  rx += (mx - rx) * 0.1;
  ry += (my - ry) * 0.1;
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
  requestAnimationFrame(loopCursor);
})();

/* ── Nav scroll ── */
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 60);
}, {passive:true});

/* ── Circle: scroll-driven draw, SVG rotate, fade after philosophy ── */
const svg    = document.getElementById('circle-svg');
const cSolid = document.getElementById('c-solid');
const cRotG  = document.getElementById('c-rotate');
const cDot   = document.getElementById('c-dot');
const cHalo  = document.getElementById('c-halo');
const R = 430, CX = 500, CY = 500;
const circ = 2 * Math.PI * R;

cSolid.style.strokeDasharray  = circ;
cSolid.style.strokeDashoffset = circ;

function getPhilosophyEnd(){
  const ph = document.getElementById('philosophy');
  if(!ph) return window.innerHeight * 2.2;
  // Fade completes by end of philosophy section
  return ph.getBoundingClientRect().bottom + window.scrollY;
}

/* ── Background color shift on scroll — MAIA palette ──
   Like Dawn but in dark luxury tones:
   0%   = #170A0C  (deep dark burgundy)
   50%  = #1d0e10  (warm dark bordeaux)
   80%  = #1a1008  (dark amber-brown)
   100% = #111008  (near-black warm, philosophy end)
*/
function lerpColor(c1, c2, t){
  const r = Math.round(c1[0] + (c2[0]-c1[0])*t);
  const g = Math.round(c1[1] + (c2[1]-c1[1])*t);
  const b = Math.round(c1[2] + (c2[2]-c1[2])*t);
  return `rgb(${r},${g},${b})`;
}
const colorStops = [
  { at: 0.0,  col: [23,  10,  12] },  // #170A0C — deep dark burgundy (hero start)
  { at: 0.35, col: [29,  14,  16] },  // warmer bordeaux mid-hero
  { at: 0.65, col: [26,  16,  10] },  // dark amber-brown (philosophy entering)
  { at: 1.0,  col: [17,  16,  10] },  // #111008 — near black warm (philosophy end)
];
const heroLeftEl  = document.querySelector('.hero-left');
const heroRightEl = document.querySelector('.hero-right');

function getScrollColor(p){
  let i = 0;
  while(i < colorStops.length - 2 && p > colorStops[i+1].at) i++;
  const a = colorStops[i], b = colorStops[i+1];
  const t = (p - a.at) / (b.at - a.at);
  return lerpColor(a.col, b.col, Math.max(0, Math.min(1, t)));
}

function updateAll(){
  const scrollY = window.scrollY;
  const phEnd   = getPhilosophyEnd();

  /* Progress 0→1 across hero + philosophy */
  const p = Math.min(Math.max(scrollY / phEnd, 0), 1);

  /* ── Color shift on hero panels ── */
  const bgColor = getScrollColor(p);
  if(heroLeftEl)  heroLeftEl.style.background  = bgColor;
  if(heroRightEl) heroRightEl.style.background = bgColor;

  /* ── Circle draw ── */
  cSolid.style.strokeDashoffset = circ * (1 - p);

  /* ── Circle rotate: use SVG transform attribute (reliable) ── */
  const deg = -90 + p * 360;
  if(cRotG) cRotG.setAttribute('transform', `rotate(${deg}, ${CX}, ${CY})`);

  /* ── Circle fade: gone completely by end of philosophy ── */
  const fadeStart = phEnd * 0.60;
  let opacity = 1;
  if(scrollY > fadeStart){
    const fadeLen = phEnd - fadeStart;
    opacity = Math.max(0, 1 - (scrollY - fadeStart) / fadeLen);
  }
  svg.style.opacity = opacity;
  svg.style.display = opacity <= 0 ? 'none' : 'block';

  /* ── Dot travels along circle ── */
  if(p > 0.01 && opacity > 0){
    const angle = -Math.PI/2 + 2 * Math.PI * p;
    const dx = CX + R * Math.cos(angle);
    const dy = CY + R * Math.sin(angle);
    cDot.setAttribute('cx', dx); cDot.setAttribute('cy', dy);
    cHalo.setAttribute('cx', dx); cHalo.setAttribute('cy', dy);
    const f = Math.min(p * 5, 1) * opacity;
    cDot.setAttribute('opacity', f);
    cHalo.setAttribute('opacity', f * 0.55);
  } else {
    cDot.setAttribute('opacity', 0);
    cHalo.setAttribute('opacity', 0);
  }
}

window.addEventListener('scroll', updateAll, {passive:true});
updateAll();

/* ── Tabs ── */
function showTab(name, btn){
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
}

/* ── Scroll reveal ── */
const revEls = document.querySelectorAll('.reveal,.reveal-l,.reveal-r');
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('on'); });
}, {threshold: 0.1});
revEls.forEach(el => obs.observe(el));
/* Show already-visible reveals immediately */
requestAnimationFrame(() => {
  revEls.forEach(el => {
    const r = el.getBoundingClientRect();
    if(r.top < window.innerHeight) el.classList.add('on');
  });
});

/* ── Live clock SF ── */
function tick(){
  const t = new Date().toLocaleTimeString('en-US', {
    timeZone:'America/Los_Angeles', hour:'2-digit', minute:'2-digit', hour12:false
  });
  const el = document.getElementById('clock');
  if(el) el.textContent = t;
}
tick(); setInterval(tick, 1000);

/* Mobile menu */
function toggleMenu(){
  document.getElementById('hamburger').classList.toggle('open');
  document.getElementById('mobile-menu').classList.toggle('open');
}

/* ── Contact form submit via Formspree ── */
function submitForm(e){
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('form-msg');
  const submitBtn = form.querySelector('.form-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  fetch(form.action, {
    method: 'POST',
    body: new FormData(form),
    headers: { 'Accept': 'application/json' }
  }).then(response => {
    if(response.ok){
      msg.textContent = 'Thank you, we\'ll be in touch shortly.';
      msg.style.display = 'block';
      form.reset();
      setTimeout(() => {
        msg.style.display = 'none';
        closeContactModal();
      }, 3500);
    } else {
      msg.textContent = 'Something went wrong. Please email us directly.';
      msg.style.display = 'block';
    }
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send →';
  }).catch(() => {
    msg.textContent = 'Something went wrong. Please email us directly.';
    msg.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send →';
  });
}

/* ── Contact modal ── */
function openContactModal(){
  document.getElementById('contact-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeContactModal(){
  document.getElementById('contact-modal').classList.remove('open');
  document.body.style.overflow = '';
}
function handleModalClick(e){
  if(e.target === document.getElementById('contact-modal')) closeContactModal();
}
document.addEventListener('keydown', e => {
  if(e.key === 'Escape') { closeContactModal(); closeWaitlistModal(); closeSocialGateModal(); }
});

/* ── Waitlist modal ── */
function openWaitlistModal(){
  document.getElementById('waitlist-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeWaitlistModal(){
  document.getElementById('waitlist-modal').classList.remove('open');
  document.body.style.overflow = '';
}
function handleWaitlistClick(e){
  if(e.target === document.getElementById('waitlist-modal')) closeWaitlistModal();
}

/* ── Waitlist form submit ── */
document.addEventListener('DOMContentLoaded', function(){
  const wf = document.getElementById('waitlist-form');
  if(wf) wf.addEventListener('submit', function(e){
    e.preventDefault();
    const form = e.target;
    const msg = document.getElementById('waitlist-msg');
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    fetch(form.action, {
      method:'POST',
      headers:{'Accept':'application/json','Content-Type':'application/json'},
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    }).then(r => {
      if(r.ok){
        msg.textContent = "You're on the list. We'll be in touch.";
        msg.style.display = 'block';
        form.style.display = 'none';
      } else {
        msg.textContent = 'Something went wrong. Please try again.';
        msg.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Join the Waitlist →';
      }
    }).catch(() => {
      msg.textContent = 'Something went wrong. Please try again.';
      msg.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Join the Waitlist →';
    });
  });
});

/* ── Social Kickstart email gate modal ── */
function openSocialGateModal(){
  document.getElementById('social-gate-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSocialGateModal(){
  document.getElementById('social-gate-modal').classList.remove('open');
  document.body.style.overflow = '';
}
function handleSocialGateClick(e){
  if(e.target === document.getElementById('social-gate-modal')) closeSocialGateModal();
}

/* ── Social Kickstart form submit ── */
document.addEventListener('DOMContentLoaded', function(){
  const sf = document.getElementById('social-gate-form');
  if(sf) sf.addEventListener('submit', function(e){
    e.preventDefault();
    const form = e.target;
    const msg = document.getElementById('social-gate-msg');
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    fetch(form.action, {
      method:'POST',
      headers:{'Accept':'application/json','Content-Type':'application/json'},
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    }).then(r => {
      if(r.ok){
        msg.innerHTML = "You're in! <a href='social-kickstart.html' style='color:var(--gold);text-decoration:underline;'>Access your playbook here →</a>";
        msg.style.display = 'block';
        form.style.display = 'none';
      } else {
        msg.textContent = 'Something went wrong. Please try again.';
        msg.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Get Your Free Playbook →';
      }
    }).catch(() => {
      msg.textContent = 'Something went wrong. Please try again.';
      msg.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Get Your Free Playbook →';
    });
  });
});
