/* ── MIST PARTICLES ── */
const canvas = document.getElementById('mist');
const ctx = canvas.getContext('2d');
let W, H, particles = [];

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

function makeParticle() {
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    r: 60 + Math.random() * 140,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.08,
    alpha: 0.02 + Math.random() * 0.05
  };
}

for (let i = 0; i < 14; i++) particles.push(makeParticle());

function drawMist() {
  ctx.clearRect(0, 0, W, H);
  particles.forEach(p => {
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
    g.addColorStop(0, `rgba(45,102,57,${p.alpha})`);
    g.addColorStop(1, 'rgba(45,102,57,0)');
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    p.x += p.vx; p.y += p.vy;
    if (p.x < -p.r) p.x = W + p.r;
    if (p.x > W + p.r) p.x = -p.r;
    if (p.y < -p.r) p.y = H + p.r;
    if (p.y > H + p.r) p.y = -p.r;
  });
  requestAnimationFrame(drawMist);
}
drawMist();

/* ── INTERACTIONS ── */
function setPill(el) {
  document.getElementById('userQ').value = el.textContent;
  document.getElementById('userQ').focus();
}

function sendQuestion() {
  const q = document.getElementById('userQ').value.trim();
  if (!q) return;

  const responses = [
    "Mmm. La respuesta que buscas, dentro de ti ya vive.",
    "Escucha la Fuerza. Hablar te intenta.",
    "Paciente debes ser. El camino, claro se volverá.",
    "El miedo lleva al lado oscuro. Confía en ti mismo, debes.",
  ];
  const r = responses[Math.floor(Math.random() * responses.length)];
  document.getElementById('userQ').value = '';

  const box = document.querySelector('.input-box');
  box.style.borderColor = 'var(--green)';
  box.style.boxShadow = '0 0 28px rgba(77,175,111,0.22)';
  setTimeout(() => {
    box.style.borderColor = '';
    box.style.boxShadow = '';
    document.getElementById('userQ').placeholder = r;
  }, 500);
}

document.getElementById('userQ').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendQuestion();
});
