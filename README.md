# ARIA-7 — Autonomous Robot Behavior Simulation

A browser-based simulation demonstrating **autonomy** and **adaptability** in robotics AI using a Finite State Machine (FSM). Built as an academic project demonstration.

---

## Demo

Open `index.html` in any modern browser. No server or dependencies required.

---

## Project Structure

```
aria7-robot/
├── index.html          # Main HTML entry point
├── src/
│   ├── style.css       # All UI styles
│   ├── simulation.js   # FSM logic, robot AI, environment
│   ├── renderer.js     # Canvas drawing engine
│   ├── ui.js           # DOM updates, event log
│   └── main.js         # Game loop, controls
└── README.md
```

---

## Concepts Demonstrated

### Finite State Machine (FSM)
The robot autonomously switches between 5 states based on sensor input and battery level:

| State | Trigger | Behaviour |
|---|---|---|
| **IDLE** | No targets / post-mission | Rests, conserves energy |
| **EXPLORE** | No target in sensor range | Random walk, maps environment |
| **CHASE** | Target within sensor range | Navigates directly toward goal |
| **FLEE** | Threat within proximity | Evades, overrides all other states |
| **RECHARGE** | Battery < 25% | Returns to station, waits until ≥ 75% |

### Priority Order (high → low)
```
RECHARGE > FLEE > CHASE > EXPLORE > IDLE
```

### Autonomy
- The robot makes all decisions independently — no manual input required
- Sensor fusion: battery level + proximity + target detection all feed the FSM

### Adaptability
- Threats move dynamically each tick, forcing real-time re-routing
- When ≤ 2 targets remain, sensor range expands to entire grid to guarantee mission completion
- Battery management prevents getting stranded mid-mission

---

## Controls

| Control | Action |
|---|---|
| **Pause / Resume** | Freeze or continue the simulation |
| **Reset** | Restart with a new random environment |
| **Speed slider** | Adjust simulation speed (1× – 10×) |

---

## Technical Details

- **Language**: Vanilla JavaScript (ES6+), HTML5 Canvas, CSS3
- **No frameworks or dependencies**
- **Grid size**: 32 × 20 cells
- **Sensor range**: 5 cells (expands to full grid when ≤ 2 targets remain)
- **Threat range**: 3 cells
- **Battery drain**: ~0.5–1.3% per tick (no drain while charging at station)
- **Charge rate**: +8% per tick at station; exits when ≥ 75%

---

## Running Locally

```bash
git clone https://github.com/your-username/aria7-robot.git
cd aria7-robot
open index.html   # macOS
# or just double-click index.html on Windows/Linux
```

---

## Author

Built as a demonstration project for an AI course.  
Implements classical robotics AI concepts: FSM-based behavior selection, sensor-driven autonomy, and dynamic environment adaptation.
