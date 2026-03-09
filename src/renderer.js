/* ============================================================
   renderer.js — Canvas Drawing Engine
   ============================================================
   Draws the simulation grid, robot, targets, threats,
   charge station, trail, sensor range, and legend.
   All drawing is done via the HTML5 Canvas 2D API.
   ============================================================ */

const canvas = document.getElementById('sim');
const ctx    = canvas.getContext('2d');

const CW = 720 / COLS;  // Cell width  in pixels
const CH = 440 / ROWS;  // Cell height in pixels

// ── Utility: rounded rectangle ──────────────────────────────
function roundRect(x, y, w, h, r, fill, stroke, sw) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill)   { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw || 1; ctx.stroke(); }
}

// ── Robot icon ───────────────────────────────────────────────
function drawRobot(gx, gy, col) {
  const cx = gx * CW + CW / 2, cy = gy * CH + CH / 2;
  const bw = CW * 0.72, bh = CH * 0.56;
  const hw = CW * 0.42, hh = CH * 0.28;
  const bx = cx - bw / 2, by = cy - bh / 2 + CH * 0.06;

  // Drop shadow
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(cx, cy + bh / 2 + 4, bw * 0.45, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Body
  roundRect(bx, by, bw, bh, 3, col + '22', col, 1.8);

  // Head
  const hx = cx - hw / 2, hy = by - hh - 2;
  roundRect(hx, hy, hw, hh, 3, col + '33', col, 1.5);

  // Antenna
  ctx.strokeStyle = col; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(cx, hy); ctx.lineTo(cx, hy - 5); ctx.stroke();
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(cx, hy - 7, 2, 0, Math.PI * 2); ctx.fill();

  // Eyes
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(cx - 4, hy + hh / 2, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 4, hy + hh / 2, 1.8, 0, Math.PI * 2); ctx.fill();

  // Body panel divider
  ctx.strokeStyle = col + '55'; ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(bx + 4, by + bh * 0.45);
  ctx.lineTo(bx + bw - 4, by + bh * 0.45);
  ctx.stroke();

  // Chest indicator
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(cx, by + bh * 0.28, 2.5, 0, Math.PI * 2); ctx.fill();

  // Wheels
  [[bx + 4, by + bh], [bx + bw - 4, by + bh]].forEach(([wx, wy]) => {
    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath(); ctx.arc(wx, wy, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(wx, wy, 3.5, 0, Math.PI * 2); ctx.stroke();
  });
}

// ── Target (bullseye) ────────────────────────────────────────
function drawTarget(gx, gy) {
  const cx = gx * CW + CW / 2, cy = gy * CH + CH / 2;
  const R  = Math.min(CW, CH) * 0.36;

  ctx.fillStyle = '#dcfce7';
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#059669'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.62, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#059669'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.62, 0, Math.PI * 2); ctx.stroke();

  ctx.fillStyle = '#059669';
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.28, 0, Math.PI * 2); ctx.fill();

  // Crosshairs
  ctx.strokeStyle = '#059669'; ctx.lineWidth = 0.7;
  ctx.save(); ctx.globalAlpha = 0.4;
  ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
  ctx.restore();
}

// ── Threat (warning triangle) ────────────────────────────────
function drawThreat(gx, gy) {
  const cx = gx * CW + CW / 2, cy = gy * CH + CH / 2;
  const R  = Math.min(CW, CH) * 0.38;

  ctx.fillStyle = '#fee2e2';
  ctx.beginPath();
  ctx.moveTo(cx, cy - R);
  ctx.lineTo(cx + R * 0.87, cy + R * 0.5);
  ctx.lineTo(cx - R * 0.87, cy + R * 0.5);
  ctx.closePath(); ctx.fill();

  ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx, cy - R);
  ctx.lineTo(cx + R * 0.87, cy + R * 0.5);
  ctx.lineTo(cx - R * 0.87, cy + R * 0.5);
  ctx.closePath(); ctx.stroke();

  // Exclamation mark
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(cx - 1.2, cy - R * 0.4, 2.4, R * 0.5);
  ctx.beginPath(); ctx.arc(cx, cy + R * 0.28, 1.8, 0, Math.PI * 2); ctx.fill();
}

// ── Charge station (lightning bolt) ─────────────────────────
function drawCharger(gx, gy) {
  const cx = gx * CW + CW / 2, cy = gy * CH + CH / 2;
  const hw = CW * 0.6, hh = CH * 0.56;

  roundRect(cx - hw / 2, cy - hh / 2, hw, hh, 3, '#fffbeb', '#d97706', 1.5);

  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.moveTo(cx + 2,  cy - hh * 0.28);
  ctx.lineTo(cx - 3,  cy + 2);
  ctx.lineTo(cx + 1,  cy + 2);
  ctx.lineTo(cx - 2,  cy + hh * 0.28);
  ctx.lineTo(cx + 3,  cy - 2);
  ctx.lineTo(cx - 1,  cy - 2);
  ctx.closePath(); ctx.fill();
}

// ── Main draw function ───────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, 720, 440);

  // Background
  ctx.fillStyle = '#f8f9fb';
  ctx.fillRect(0, 0, 720, 440);

  // Grid lines
  ctx.strokeStyle = '#e9eaec'; ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * CW, 0); ctx.lineTo(x * CW, 440); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * CH); ctx.lineTo(720, y * CH); ctx.stroke();
  }

  if (!sim) return;
  const r = sim.robot;

  // Discovered cells (light blue tint)
  ctx.fillStyle = '#eef4ff';
  for (const k of sim.discovered) {
    const [cx, cy] = k.split(',').map(Number);
    ctx.fillRect(cx * CW + 0.5, cy * CH + 0.5, CW - 0.5, CH - 0.5);
  }

  // Sensor range fill
  const rcx = r.x * CW + CW / 2, rcy = r.y * CH + CH / 2, sr = SENSOR * CW;
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle   = SCOL[r.state];
  ctx.beginPath(); ctx.arc(rcx, rcy, sr, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Sensor range border (dashed)
  ctx.save();
  ctx.globalAlpha  = 0.25;
  ctx.strokeStyle  = SCOL[r.state];
  ctx.lineWidth    = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.arc(rcx, rcy, sr, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Sensor range label
  ctx.save();
  ctx.font        = 'bold 9px IBM Plex Mono, monospace';
  ctx.fillStyle   = SCOL[r.state];
  ctx.globalAlpha = 0.5;
  ctx.textAlign   = 'center';
  ctx.fillText('SENSOR RANGE', rcx, rcy - sr - 5);
  ctx.restore();

  // Threat proximity rings
  for (const t of sim.threats) {
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth   = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.arc(t.x * CW + CW / 2, t.y * CH + CH / 2, THREAT_R * CW, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Movement trail (fading dots)
  for (let i = 0; i < r.trail.length; i++) {
    const t = r.trail[i];
    const a = (i / r.trail.length) * 0.35;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle   = SCOL[r.state];
    ctx.beginPath();
    ctx.arc(t.x * CW + CW / 2, t.y * CH + CH / 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Entities
  drawCharger(CHARGE.x, CHARGE.y);
  for (const t of sim.targets)  drawTarget(t.x, t.y);
  for (const t of sim.threats)  drawThreat(t.x, t.y);
  drawRobot(r.x, r.y, SCOL[r.state]);

  // Collection particle sparks
  for (const s of sim.sparks) {
    ctx.save();
    ctx.globalAlpha = s.life;
    ctx.fillStyle   = '#059669';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 0.5;
    ctx.beginPath(); ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // Canvas legend
  const legendItems = [
    { col: '#2563eb', label: 'Robot (ARIA-7)' },
    { col: '#059669', label: 'Target'          },
    { col: '#dc2626', label: 'Threat'          },
    { col: '#d97706', label: 'Charge Station'  }
  ];
  let lx = 10, ly = 440 - 14;
  ctx.font = '10px IBM Plex Mono, monospace';
  legendItems.forEach(({ col, label }) => {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(lx + 5, ly, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4d5566';
    ctx.textAlign = 'left';
    ctx.fillText(label, lx + 13, ly + 3.5);
    lx += ctx.measureText(label).width + 30;
  });
}
