/* ============================================================
   simulation.js — Robot AI, FSM, Environment Logic
   ============================================================

   FINITE STATE MACHINE STATES:
     IDLE      → Robot rests, waits for stimulus
     EXPLORE   → Random walk, maps undiscovered cells
     CHASE     → Target in sensor range, moves toward it
     FLEE      → Threat within proximity, evades
     RECHARGE  → Battery < 25%, goes to station, waits until ≥ 75%

   KEY DESIGN DECISIONS:
     - Battery drains every tick except while charging at station
     - Charging happens BEFORE decide() so FSM sees updated battery
     - When ≤ 2 targets remain, sensor range expands to entire grid
     - Robot never idles while targets remain
   ============================================================ */

// ── Constants ──────────────────────────────────────────────
const COLS        = 32;
const ROWS        = 20;
const SENSOR      = 5;       // Normal sensor range (grid cells)
const THREAT_R    = 3;       // Distance at which threats trigger FLEE
const MAX_B       = 100;     // Max battery level
const LOW_B       = 25;      // Battery threshold → enter RECHARGE
const CHARGE_MIN  = 75;      // Battery threshold → exit RECHARGE
const CHARGE      = { x: 0, y: 0 };  // Charge station position (top-left)

// State color palette (matches CSS variables)
const SCOL = {
  IDLE:     '#6b7280',
  EXPLORE:  '#2563eb',
  CHASE:    '#059669',
  FLEE:     '#dc2626',
  RECHARGE: '#d97706'
};

const SDESC = {
  IDLE:     'Waiting for environmental stimulus.',
  EXPLORE:  'Conducting area survey. No target in sensor range.',
  CHASE:    'Target acquired within sensor range. Pursuing.',
  FLEE:     'Threat detected within proximity threshold. Evading.',
  RECHARGE: 'Battery below threshold. Staying at station until 75% restored.'
};

// ── Simulation state ────────────────────────────────────────
let sim     = null;
let step    = 0;
let running = true;
let sc      = { IDLE: 0, EXPLORE: 0, CHASE: 0, FLEE: 0, RECHARGE: 0 };

// ── Helpers ─────────────────────────────────────────────────
const rnd = (a, b) => Math.floor(Math.random() * (b - a)) + a;
const dst = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// ── Environment initialisation ──────────────────────────────
function initSim() {
  sc   = { IDLE: 0, EXPLORE: 0, CHASE: 0, FLEE: 0, RECHARGE: 0 };
  step = 0;
  sim  = {
    robot: {
      x:         Math.floor(COLS / 2),
      y:         Math.floor(ROWS / 2),
      state:     'IDLE',
      battery:   MAX_B,
      trail:     [],
      collected: 0
    },
    targets: Array.from({ length: 6 }, () => ({
      x: rnd(3, COLS - 1),
      y: rnd(2, ROWS - 1)
    })),
    threats: Array.from({ length: 3 }, () => ({
      x:  rnd(5, COLS - 3),
      y:  rnd(2, ROWS - 2),
      dx: Math.random() < 0.5 ? 1 : -1,
      dy: Math.random() < 0.5 ? 1 : -1
    })),
    discovered: new Set(),
    sparks:     []
  };
}

// ── Sensor functions ────────────────────────────────────────

/**
 * Returns the nearest target within sensor range.
 * When ≤ 2 targets remain, range expands to entire grid
 * so the robot always finds and completes the mission.
 */
function nearT(r) {
  const range = sim.targets.length <= 2 ? Infinity : SENSOR;
  let best = null, bestD = Infinity;
  for (const t of sim.targets) {
    const d = dst(r, t);
    if (d <= range && d < bestD) { best = t; bestD = d; }
  }
  return best;
}

/** Returns the first threat within THREAT_R cells, or null. */
function nearH(r) {
  return sim.threats.find(t => dst(r, t) <= THREAT_R) || null;
}

// ── FSM Decision Engine ─────────────────────────────────────

/**
 * Core FSM: evaluates sensor data and battery,
 * returns the appropriate next state.
 *
 * Priority order (high → low):
 *   1. RECHARGE  — battery critical
 *   2. FLEE      — immediate threat
 *   3. CHASE     — target detected
 *   4. EXPLORE   — default active behaviour
 *   5. IDLE      — only when no targets remain
 */
function decide(r) {
  // Exit RECHARGE only once battery is sufficiently restored
  if (r.state === 'RECHARGE' && r.battery >= CHARGE_MIN) {
    r.state = 'EXPLORE';
  }

  if (r.battery <= LOW_B)  return 'RECHARGE';
  if (nearH(r))            return 'FLEE';
  if (nearT(r))            return 'CHASE';

  // While targets remain, keep exploring — never idle
  if (sim.targets.length > 0) {
    if (r.state === 'IDLE')                              return 'EXPLORE';
    if (r.state === 'EXPLORE' && Math.random() < 0.015) return 'IDLE';
    return 'EXPLORE';
  }

  // All targets collected — allow resting
  if (r.state === 'IDLE'    && Math.random() < 0.15) return 'EXPLORE';
  if (r.state === 'EXPLORE' && Math.random() < 0.04) return 'IDLE';
  return r.state;
}

// ── Movement helpers ────────────────────────────────────────
function toward(r, tx, ty) {
  const dx = tx - r.x, dy = ty - r.y;
  if (Math.abs(dx) >= Math.abs(dy)) r.x += dx > 0 ? 1 : -1;
  else                               r.y += dy > 0 ? 1 : -1;
  r.x = Math.max(0, Math.min(COLS - 1, r.x));
  r.y = Math.max(0, Math.min(ROWS - 1, r.y));
}

function away(r, tx, ty) {
  const dx = r.x - tx, dy = r.y - ty;
  r.x += dx !== 0 ? (dx > 0 ? 1 : -1) : (Math.random() < 0.5 ? 1 : -1);
  r.y += dy !== 0 ? (dy > 0 ? 1 : -1) : (Math.random() < 0.5 ? 1 : -1);
  r.x = Math.max(0, Math.min(COLS - 1, r.x));
  r.y = Math.max(0, Math.min(ROWS - 1, r.y));
}

// ── Main simulation tick ────────────────────────────────────
function tick() {
  const r = sim.robot;
  step++;

  // ── Battery management ──
  // Charge BEFORE decide() so FSM sees the updated level.
  // No drain while actively charging at the station.
  const atStation = (r.x === CHARGE.x && r.y === CHARGE.y);
  if (r.state === 'RECHARGE' && atStation) {
    r.battery = Math.min(MAX_B, r.battery + 8);
    if (r.battery >= CHARGE_MIN) {
      addLog(step, 'Battery restored to 75%. Resuming mission.', 'c');
    }
  } else {
    r.battery = Math.max(0, r.battery - (0.5 + Math.random() * 0.8));
  }

  // ── Trail ──
  r.trail.push({ x: r.x, y: r.y });
  if (r.trail.length > 12) r.trail.shift();

  // ── State decision ──
  const prev  = r.state;
  r.state     = decide(r);
  sc[r.state]++;
  if (r.state !== prev) addLog(step, `State transition: ${prev} → ${r.state}`, 't');

  // ── Execute behaviour ──
  if (r.state === 'EXPLORE') {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    const [dx, dy] = dirs[Math.floor(Math.random() * 4)];
    r.x = Math.max(0, Math.min(COLS - 1, r.x + dx));
    r.y = Math.max(0, Math.min(ROWS - 1, r.y + dy));
    sim.discovered.add(`${r.x},${r.y}`);

  } else if (r.state === 'CHASE') {
    const t = nearT(r);
    if (t) {
      toward(r, t.x, t.y);
      if (r.x === t.x && r.y === t.y) {
        sim.targets = sim.targets.filter(x => x !== t);
        r.collected++;
        // Particle effect on collection
        for (let i = 0; i < 6; i++) {
          sim.sparks.push({
            x:    r.x * (720 / COLS) + (720 / COLS) / 2,
            y:    r.y * (440 / ROWS) + (440 / ROWS) / 2,
            vx:   (Math.random() - 0.5) * 3.5,
            vy:   (Math.random() - 0.5) * 3.5,
            life: 1
          });
        }
        addLog(step, `Target collected at (${t.x}, ${t.y}).`, 'c');
      }
    }

  } else if (r.state === 'FLEE') {
    const t = nearH(r);
    if (t) away(r, t.x, t.y);

  } else if (r.state === 'RECHARGE') {
    toward(r, CHARGE.x, CHARGE.y); // Move toward station if not already there
  }

  // ── Threats drift ──
  sim.threats.forEach(t => {
    if (Math.random() < 0.4) {
      t.x = Math.max(0, Math.min(COLS - 1, t.x + t.dx));
      t.y = Math.max(0, Math.min(ROWS - 1, t.y + t.dy));
      if (t.x <= 0 || t.x >= COLS - 1) t.dx *= -1;
      if (t.y <= 0 || t.y >= ROWS - 1) t.dy *= -1;
    }
  });

  // ── Sparks decay ──
  sim.sparks.forEach(s => { s.x += s.vx; s.y += s.vy; s.life -= 0.06; });
  sim.sparks = sim.sparks.filter(s => s.life > 0);

  updateUI();

  // ── Mission complete check ──
  if (sim.targets.length === 0) {
    addLog(step, 'Mission complete. All targets collected.', 'c');
    running = false;
    document.getElementById('btnPlay').textContent  = 'Done';
    document.getElementById('statusText').textContent = 'COMPLETE';
    document.getElementById('statusDot').style.background = '#059669';
  }
}
