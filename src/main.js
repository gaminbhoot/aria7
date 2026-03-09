/* ============================================================
   main.js — Game Loop & User Controls
   ============================================================
   Entry point. Starts the simulation and manages the
   requestAnimationFrame loop, pause/resume, and reset.
   ============================================================ */

let animId   = null;
let lastTick = 0;

const speedSlider = document.getElementById('speedSlider');

/** Returns the millisecond delay between ticks based on speed slider. */
function getDelay() {
  return Math.round(900 / parseInt(speedSlider.value));
}

/** Main animation loop — draws every frame, ticks on interval. */
function loop(ts) {
  draw();
  if (running && ts - lastTick > getDelay()) {
    tick();
    lastTick = ts;
  }
  animId = requestAnimationFrame(loop);
}

/** Toggle pause / resume. */
function togglePlay() {
  running = !running;
  const btn = document.getElementById('btnPlay');
  btn.textContent = running ? 'Pause' : 'Resume';
  document.getElementById('statusText').textContent    = running ? 'RUNNING' : 'PAUSED';
  document.getElementById('statusDot').style.background = running ? '#059669' : '#d97706';
}

/** Reset simulation to initial state. */
function resetSim() {
  cancelAnimationFrame(animId);
  document.getElementById('logBox').innerHTML = '';
  logCount = 0;
  running  = true;

  document.getElementById('btnPlay').textContent         = 'Pause';
  document.getElementById('statusText').textContent      = 'RUNNING';
  document.getElementById('statusDot').style.background  = '#059669';
  document.getElementById('brandDot').style.background   = '#2563eb';

  initSim();
  updateUI();
  addLog(0, 'System initialized. ARIA-7 online.');
  animId = requestAnimationFrame(loop);
}

// ── Boot ────────────────────────────────────────────────────
initSim();
addLog(0, 'System initialized. ARIA-7 online.');
requestAnimationFrame(loop);
