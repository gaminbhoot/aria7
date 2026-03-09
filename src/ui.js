/* ============================================================
   ui.js — DOM Updates & Event Log
   ============================================================
   Handles all sidebar panel updates and the event log.
   Called once per simulation tick from simulation.js.
   ============================================================ */

let logCount = 0;

/**
 * Adds a timestamped entry to the event log panel.
 * @param {number} s     - Current simulation step
 * @param {string} msg   - Message to display
 * @param {string} type  - 't' = transition (blue), 'c' = collect (green)
 */
function addLog(s, msg, type = '') {
  const box = document.getElementById('logBox');
  const div = document.createElement('div');
  div.className = 'log-entry' + (type ? ' ' + type : '');
  div.innerHTML = `<span class="le-step">${String(s).padStart(3, '0')}</span><span class="le-msg">${msg}</span>`;
  box.insertBefore(div, box.firstChild);
  if (++logCount > 50) box.removeChild(box.lastChild);
}

/**
 * Refreshes all sidebar panels with current simulation state.
 * Called every tick.
 */
function updateUI() {
  const r   = sim.robot;
  const col = SCOL[r.state];

  // ── State card ──
  document.getElementById('stateCard').style.borderColor = col + '44';
  document.getElementById('stateCard').style.background  = col + '0d';
  document.getElementById('stateDot').style.background   = col;
  document.getElementById('stateLbl').textContent        = r.state;
  document.getElementById('stateLbl').style.color        = col;
  document.getElementById('stateSub').textContent        = SDESC[r.state];

  // ── Top bar ──
  document.getElementById('stepChip').textContent = 'STEP ' + String(step).padStart(3, '0');

  // ── Metrics ──
  document.getElementById('sPos').textContent = `${r.x}, ${r.y}`;
  document.getElementById('sCol').textContent = r.collected;
  document.getElementById('sExp').textContent = sim.discovered.size;
  document.getElementById('sTgt').textContent = sim.targets.length;

  // ── Battery bar ──
  const bp = (r.battery / MAX_B * 100).toFixed(0);
  document.getElementById('battVal').textContent  = bp + '%';
  const fill = document.getElementById('battFill');
  fill.style.width      = bp + '%';
  fill.style.background = r.battery > 50 ? '#059669'
                        : r.battery > LOW_B ? '#d97706'
                        : '#dc2626';

  // ── Time distribution bars ──
  // Scale relative to most-used state so all bars are readable
  const maxCount = Math.max(1, ...Object.values(sc));
  for (const s of Object.keys(sc)) {
    document.getElementById('bar-' + s).style.width = (sc[s] / maxCount * 100).toFixed(1) + '%';
    document.getElementById('cnt-' + s).textContent = sc[s];
  }

  // ── FSM strip highlight ──
  for (const s of Object.keys(sc)) {
    const el     = document.getElementById('fsm-' + s);
    const active = r.state === s;
    el.style.background                           = active ? SCOL[s] + '0a' : '';
    el.querySelector('.fsm-bar').style.background = active ? SCOL[s] : '';
    el.querySelector('.fsm-name').style.color     = active ? SCOL[s] : '';
  }

  // ── Environment meta ──
  document.getElementById('envMeta').textContent =
    `Targets: ${sim.targets.length} · Threats: ${sim.threats.length} · Explored: ${sim.discovered.size} cells`;
}
