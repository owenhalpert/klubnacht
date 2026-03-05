const canvas = document.getElementById("light-canvas");
const ctx = canvas.getContext("2d");
const sceneNameEl = document.getElementById("scene-name");
const presetVibeEl = document.getElementById("preset-vibe");
const keyGrid = document.getElementById("key-grid");
const hud = document.getElementById("hud");
const hudToggle = document.getElementById("hud-toggle");

let w = 0, h = 0, t = 0;
let currentScene = 1;
let currentPreset = 1;
const transientEffects = [];
const activeKeys = new Set();
const beatBlips = [];
let hasAutoCollapsed = false;
const keyChipMap = new Map();

// ── Utilities ──────────────────────────────────────────────────────────────────
function rand(min, max) { return min + Math.random() * (max - min); }

function pushBeat(x = w * 0.5, y = h * 0.5, strength = 1, rgb = "255,255,255") {
  beatBlips.push({ x, y, age: 0, life: 0.8 + strength * 0.4, strength, rgb });
}

function pushEffect(draw, life = 0.8) {
  transientEffects.push({ draw, age: 0, life });
}

function stab(r, g, b) {
  pushBeat(rand(w * 0.3, w * 0.7), rand(h * 0.3, h * 0.7), 1.2, `${r},${g},${b}`);
  pushEffect((p) => {
    ctx.fillStyle = `rgba(${r},${g},${b},${0.4 * (1 - p)})`;
    ctx.fillRect(0, 0, w, h);
  }, 0.28);
}

function fanSweep(direction = 1, hue = 190) {
  pushEffect((p) => {
    const alpha = 0.45 * (1 - p);
    const span = Math.PI * 0.95;
    const start = (direction > 0 ? -0.5 : 1.5) * Math.PI + p * direction * Math.PI;
    ctx.save();
    ctx.translate(w / 2, h * 0.95);
    ctx.fillStyle = `hsla(${hue},95%,65%,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, Math.max(w, h) * 1.2, start, start + span * direction);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, 0.8);
}

// ── Base Scenes (keys 1–6, always fixed) ──────────────────────────────────────
const SCENE_DEFS = [
  { key: "1", label: "Noir Pulse" },
  { key: "2", label: "Sunset Sweep" },
  { key: "3", label: "Ice Tunnel" },
  { key: "4", label: "Hazard Grid" },
  { key: "5", label: "Prism Bloom" },
  { key: "6", label: "Zen Garden" },
];

function pulseBackground(time, colorA, colorB, speed = 0.6) {
  const g = ctx.createRadialGradient(
    w * (0.2 + Math.sin(time * speed) * 0.05),
    h * (0.2 + Math.cos(time * speed) * 0.05),
    40, w * 0.5, h * 0.5, Math.max(w, h)
  );
  g.addColorStop(0, colorA);
  g.addColorStop(1, colorB);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawBaseScene(time) {
  switch (currentScene) {
    case 1: {
      pulseBackground(time, "rgba(29,50,106,0.4)", "rgba(2,3,10,0.96)", 0.7);
      ctx.strokeStyle = "rgba(75,180,255,0.16)";
      for (let i = 0; i < 12; i++) {
        const y = (h / 12) * i + Math.sin(time * 2 + i) * 16;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.quadraticCurveTo(w * 0.5, y + Math.sin(time + i) * 26, w, y);
        ctx.stroke();
      }
      break;
    }
    case 2: {
      pulseBackground(time, "rgba(180,70,30,0.34)", "rgba(14,6,18,0.94)", 0.5);
      for (let i = 0; i < 8; i++) {
        const x = (w / 8) * i + ((time * 60 + i * 18) % (w / 8));
        ctx.fillStyle = `rgba(255,${120 + i * 10},70,0.08)`;
        ctx.fillRect(x - 30, 0, 18, h);
      }
      break;
    }
    case 3: {
      pulseBackground(time, "rgba(45,113,182,0.34)", "rgba(4,9,20,0.96)", 0.9);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      for (let i = 0; i < 18; i++) {
        const r = Math.max(0.5, (i / 18) * Math.min(w, h) * 0.9 + Math.sin(time * 2 + i) * 8);
        ctx.strokeStyle = `rgba(130,220,255,${0.03 + i * 0.01})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 4: {
      pulseBackground(time, "rgba(96,28,22,0.3)", "rgba(10,4,4,0.96)", 0.65);
      const size = 48;
      ctx.strokeStyle = "rgba(255,110,70,0.18)";
      for (let x = 0; x < w; x += size) {
        for (let y = 0; y < h; y += size) {
          const offset = Math.sin(time * 3 + x * 0.01 + y * 0.01) * 10;
          ctx.strokeRect(x + offset, y - offset, size - 8, size - 8);
        }
      }
      break;
    }
    case 5: {
      pulseBackground(time, "rgba(40,15,66,0.34)", "rgba(7,4,20,0.96)", 0.75);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2 + time * 0.4;
        const radius = Math.min(w, h) * 0.3 + Math.sin(time * 2 + i) * 30;
        ctx.strokeStyle = `hsla(${(i * 40 + time * 40) % 360},90%,62%,0.32)`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 6: {
      pulseBackground(time, "rgba(45,30,65,0.38)", "rgba(12,8,22,0.96)", 0.4);
      ctx.save();
      ctx.translate(w / 2, h * 0.85);
      ctx.strokeStyle = "rgba(180,160,200,0.12)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2 + time * 0.15;
        const length = 60 + Math.sin(time * 0.8 + i * 0.5) * 20;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length * 0.3 - 10);
        ctx.stroke();
      }
      ctx.restore();
      for (let i = 0; i < 5; i++) {
        const seed = i * 997.3;
        const x = (seed % w);
        const y = h * 0.7 + Math.sin(time * 0.5 + i) * 30 + (seed % 50);
        const size = 4 + (seed % 6);
        ctx.fillStyle = `rgba(200,180,220,${0.06 + (seed % 5) * 0.02})`;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
  }
}

// ── PRESETS ────────────────────────────────────────────────────────────────────

const PRESETS = {

  // ── 1: TECHNO — cyan / amber, dark industrial ────────────────────────────
  1: {
    vibe: "TECHNO",
    accent: [95, 255, 225],
    keyDefs: [
      { key: "Q", label: "Cyan Stab" },    { key: "W", label: "Amber Stab" },
      { key: "E", label: "Fan Sweep" },     { key: "R", label: "Left Sweep" },
      { key: "T", label: "Right Sweep" },   { key: "Y", label: "UV Flash" },
      { key: "U", label: "Laser Rain" },    { key: "I", label: "Ripple Ring" },
      { key: "O", label: "Prism Hit" },     { key: "P", label: "Whiteout" },
      { key: "A", label: "Kick Bloom" },    { key: "S", label: "Snare Burst" },
      { key: "D", label: "Strobe" },        { key: "F", label: "Color Drift" },
      { key: "G", label: "Orb Drop" },      { key: "H", label: "Diag Slice" },
      { key: "J", label: "Confetti" },      { key: "K", label: "Spin Halo" },
      { key: "L", label: "Bass Tunnel" },
    ],
    trigger(key) {
      switch (key) {
        case "Q": stab(90, 255, 236); break;
        case "W": stab(255, 149, 85); break;
        case "E": fanSweep(1, 190); break;
        case "R": fanSweep(-1, 165); break;
        case "T": fanSweep(1, 20); break;
        case "Y":
          pushEffect((p) => {
            ctx.fillStyle = `rgba(186,120,255,${0.6 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
          }, 0.2);
          break;
        case "U":
          pushEffect((p) => {
            for (let i = 0; i < 22; i++) {
              const x = (i / 22) * w + Math.sin((t + i) * 6) * 12;
              ctx.strokeStyle = `rgba(90,255,220,${0.36 * (1 - p)})`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(x, -30);
              ctx.lineTo(x - 30 + p * 120, h + 30);
              ctx.stroke();
            }
          }, 0.6);
          break;
        case "I":
          pushBeat(w / 2, h / 2, 1.5, "90,255,220");
          pushBeat(w / 2, h / 2, 1.1, "90,255,220");
          break;
        case "O":
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            for (let i = 0; i < 10; i++) {
              const angle = (i / 10) * Math.PI * 2 + time * 2;
              const radius = (1 - p) * Math.min(w, h) * 0.45;
              ctx.strokeStyle = `hsla(${i * 35 + p * 120},90%,62%,${0.62 * (1 - p)})`;
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
              ctx.stroke();
            }
            ctx.restore();
          }, 0.55);
          break;
        case "P":
          pushEffect((p) => {
            ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
          }, 0.18);
          break;
        case "A": pushBeat(w * 0.5, h * 0.75, 1.6); break;
        case "S":
          pushBeat(rand(w * 0.2, w * 0.8), h * 0.5, 0.9);
          pushEffect((p) => {
            ctx.fillStyle = `rgba(255,90,95,${0.28 * (1 - p)})`;
            ctx.fillRect(0, h * 0.35, w, h * 0.3);
          }, 0.3);
          break;
        case "D":
          pushEffect((p) => {
            if (Math.floor(p * 18) % 2 === 0) {
              ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - p)})`;
              ctx.fillRect(0, 0, w, h);
            }
          }, 0.42);
          break;
        case "F":
          pushEffect((p, time) => {
            ctx.fillStyle = `hsla(${(time * 260) % 360},90%,60%,${0.22 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
          }, 1.1);
          break;
        case "G":
          pushEffect((p, time) => {
            const x = w * 0.5 + Math.sin(time * 7) * w * 0.15;
            const y = h * 0.2 + p * h * 0.75;
            const r = 30 + Math.sin(p * Math.PI) * 110;
            const g = ctx.createRadialGradient(x, y, 4, x, y, r);
            g.addColorStop(0, `rgba(255,220,110,${0.6 * (1 - p)})`);
            g.addColorStop(1, "rgba(255,160,40,0)");
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
          }, 0.8);
          break;
        case "H":
          pushEffect((p) => {
            ctx.fillStyle = `rgba(100,220,255,${0.45 * (1 - p)})`;
            ctx.beginPath();
            ctx.moveTo(-40 + p * w, 0); ctx.lineTo(130 + p * w, 0);
            ctx.lineTo(-40 + p * w - 220, h); ctx.lineTo(-220 + p * w, h);
            ctx.closePath(); ctx.fill();
          }, 0.5);
          break;
        case "J":
          pushEffect((p) => {
            for (let i = 0; i < 70; i++) {
              const seed = i * 1321.4;
              const x = (seed % w + p * 180) % w;
              const y = ((seed * 1.7) % h + p * 260) % h;
              ctx.fillStyle = `hsla(${(seed + p * 240) % 360},95%,64%,${0.58 * (1 - p)})`;
              ctx.fillRect(x, y, 4, 12);
            }
          }, 0.8);
          break;
        case "K":
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(time * 2.4);
            for (let i = 0; i < 4; i++) {
              ctx.rotate(Math.PI / 2);
              ctx.strokeStyle = `rgba(130,255,220,${0.45 * (1 - p)})`;
              ctx.lineWidth = 5;
              ctx.beginPath();
              ctx.arc(0, 0, 70 + p * 180, i * 0.35, i * 0.35 + Math.PI * 0.8);
              ctx.stroke();
            }
            ctx.restore();
          }, 0.9);
          break;
        case "L":
          pushEffect((p) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            for (let i = 0; i < 16; i++) {
              const depth = i / 16;
              const radius = (1 - p) * depth * Math.min(w, h) * 0.75;
              ctx.strokeStyle = `rgba(255,130,80,${(1 - depth) * 0.35 * (1 - p)})`;
              ctx.lineWidth = 2;
              ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.restore();
          }, 0.7);
          break;
      }
    },
  },

  // ── 2: ROBOT — gold / chrome, Daft Punk mechanical ───────────────────────
  2: {
    vibe: "ROBOT",
    accent: [255, 211, 102],
    keyDefs: [
      { key: "Q", label: "Gold Burst" },    { key: "W", label: "Chrome Wash" },
      { key: "E", label: "Circuit Sweep" }, { key: "R", label: "Scan Left" },
      { key: "T", label: "Scan Right" },    { key: "Y", label: "Core Flash" },
      { key: "U", label: "LED Grid" },      { key: "I", label: "Servo Pulse" },
      { key: "O", label: "Overdrive" },     { key: "P", label: "Sys Reset" },
      { key: "A", label: "Bass Drop" },     { key: "S", label: "Drum Hit" },
      { key: "D", label: "Binary Flash" },  { key: "F", label: "Thermal Drift" },
      { key: "G", label: "Satellite" },     { key: "H", label: "Laser Cut" },
      { key: "J", label: "Spark Shower" },  { key: "K", label: "Turbine" },
      { key: "L", label: "Power Wave" },
    ],
    trigger(key) {
      switch (key) {
        case "Q":
          stab(255, 200, 80);
          pushEffect((p) => {
            const r = (1 - p) * Math.min(w, h) * 0.65;
            const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r);
            g.addColorStop(0, `rgba(255,240,120,${0.55 * (1 - p)})`);
            g.addColorStop(1, "rgba(255,140,20,0)");
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2); ctx.fill();
          }, 0.35);
          break;
        case "W": // Metallic horizontal wipe
          pushEffect((p) => {
            const x = -w * 0.15 + p * w * 1.3;
            const grad = ctx.createLinearGradient(x - w * 0.15, 0, x + w * 0.15, 0);
            grad.addColorStop(0, "rgba(200,205,215,0)");
            grad.addColorStop(0.4, `rgba(210,215,225,${0.55 * (1 - p)})`);
            grad.addColorStop(0.5, `rgba(255,255,255,${0.8 * (1 - p)})`);
            grad.addColorStop(0.6, `rgba(210,215,225,${0.55 * (1 - p)})`);
            grad.addColorStop(1, "rgba(200,205,215,0)");
            ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
          }, 0.5);
          break;
        case "E": // Right-angle PCB circuit lines cascade
          pushEffect((p) => {
            ctx.strokeStyle = `rgba(255,200,60,${0.55 * (1 - p)})`;
            ctx.lineWidth = 1.5;
            const offset = p * w * 0.9;
            for (let i = 0; i < 14; i++) {
              const y = (h / 14) * i;
              const x = i % 2 === 0 ? offset : w - offset;
              ctx.beginPath();
              ctx.moveTo(x - 60, y); ctx.lineTo(x, y); ctx.lineTo(x, y + h / 14);
              ctx.stroke();
            }
          }, 0.55);
          break;
        case "R": // Vertical gold beam sweeps left→right
          pushEffect((p) => {
            const x = w * p;
            const grad = ctx.createLinearGradient(x - 40, 0, x + 40, 0);
            grad.addColorStop(0, "rgba(255,200,60,0)");
            grad.addColorStop(0.5, `rgba(255,230,100,${0.75 * (1 - p)})`);
            grad.addColorStop(1, "rgba(255,200,60,0)");
            ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
          }, 0.45);
          break;
        case "T": // Beam sweeps right→left
          pushEffect((p) => {
            const x = w * (1 - p);
            const grad = ctx.createLinearGradient(x - 40, 0, x + 40, 0);
            grad.addColorStop(0, "rgba(255,200,60,0)");
            grad.addColorStop(0.5, `rgba(255,230,100,${0.75 * (1 - p)})`);
            grad.addColorStop(1, "rgba(255,200,60,0)");
            ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
          }, 0.45);
          break;
        case "Y":
          pushBeat(w / 2, h / 2, 1.4, "255,200,60");
          pushEffect((p) => {
            ctx.fillStyle = `rgba(255,220,80,${0.65 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
          }, 0.18);
          break;
        case "U": // Grid of squares light up in staggered cascade
          pushEffect((p) => {
            const size = 28;
            for (let gx = 0; gx < w; gx += size) {
              for (let gy = 0; gy < h; gy += size) {
                const seed = (gx * 7 + gy * 13) % 100;
                const delay = (seed / 100) * 0.3;
                const lp = Math.max(0, Math.min(1, (p - delay) / 0.7));
                if (lp > 0) {
                  ctx.fillStyle = `rgba(255,200,60,${0.45 * (1 - lp) * Math.sin(lp * Math.PI)})`;
                  ctx.fillRect(gx + 2, gy + 2, size - 4, size - 4);
                }
              }
            }
          }, 0.9);
          break;
        case "I": // Concentric gold rings expand outward
          pushEffect((p) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            for (let i = 0; i < 8; i++) {
              const r = (i / 8) * Math.min(w, h) * 0.75 * (0.25 + p * 0.75);
              ctx.strokeStyle = `rgba(255,200,60,${(1 - i / 8) * 0.5 * (1 - p)})`;
              ctx.lineWidth = 3 - i * 0.2;
              ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.restore();
          }, 0.6);
          break;
        case "O": // Orange starburst from center
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            for (let i = 0; i < 12; i++) {
              const angle = (i / 12) * Math.PI * 2 + time * 3;
              const radius = (1 - p) * Math.min(w, h) * 0.5;
              ctx.strokeStyle = `hsla(${28 + i * 7},95%,60%,${0.7 * (1 - p)})`;
              ctx.lineWidth = 5;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
              ctx.stroke();
            }
            ctx.restore();
          }, 0.45);
          break;
        case "P":
          pushEffect((p) => {
            ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
          }, 0.18);
          break;
        case "A": // Warm thump erupts from the floor
          pushBeat(w * 0.5, h * 0.88, 1.8, "255,150,30");
          pushEffect((p) => {
            const g = ctx.createRadialGradient(w / 2, h * 1.1, 10, w / 2, h * 1.1, h * 1.3 * (1 - p * 0.3));
            g.addColorStop(0, `rgba(255,140,20,${0.55 * (1 - p)})`);
            g.addColorStop(1, "rgba(255,80,0,0)");
            ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          }, 0.5);
          break;
        case "S": // Gold dots scatter radially from center
          pushEffect((p) => {
            for (let i = 0; i < 40; i++) {
              const seed = i * 887.3;
              const angle = seed % (Math.PI * 2);
              const dist = ((seed * 3.1) % 1) * Math.min(w, h) * 0.5 * p;
              ctx.fillStyle = `rgba(255,200,60,${0.75 * (1 - p)})`;
              ctx.beginPath();
              ctx.arc(w / 2 + Math.cos(angle) * dist, h / 2 + Math.sin(angle) * dist, 2 + (seed * 0.7) % 4, 0, Math.PI * 2);
              ctx.fill();
            }
          }, 0.45);
          break;
        case "D": // Rapid gold/dark strobe
          pushEffect((p) => {
            if (Math.floor(p * 20) % 2 === 0) {
              ctx.fillStyle = `rgba(255,200,60,${0.45 * (1 - p)})`;
              ctx.fillRect(0, 0, w, h);
            }
          }, 0.4);
          break;
        case "F": // Warm hue drift in amber-orange band
          pushEffect((p, time) => {
            const hue = 18 + Math.sin(time * 3) * 18;
            ctx.fillStyle = `hsla(${hue},95%,52%,${0.2 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
          }, 1.2);
          break;
        case "G": // Gold orb descends with lateral wobble
          pushEffect((p) => {
            const x = w * 0.5 + Math.sin(p * Math.PI * 2.5) * w * 0.12;
            const y = -60 + p * (h + 120);
            const r = 18 + Math.sin(p * Math.PI) * 65;
            const g = ctx.createRadialGradient(x, y, 2, x, y, r);
            g.addColorStop(0, `rgba(255,245,180,${0.85 * (1 - p)})`);
            g.addColorStop(0.4, `rgba(255,180,40,${0.5 * (1 - p)})`);
            g.addColorStop(1, "rgba(255,100,0,0)");
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
          }, 0.9);
          break;
        case "H": // Horizontal gold beam scans top-to-bottom
          pushEffect((p) => {
            const y = h * p;
            const grad = ctx.createLinearGradient(0, y - 5, 0, y + 5);
            grad.addColorStop(0, "rgba(255,200,60,0)");
            grad.addColorStop(0.5, `rgba(255,240,100,${0.9 * (1 - p)})`);
            grad.addColorStop(1, "rgba(255,200,60,0)");
            ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = `rgba(255,160,30,${0.12 * (1 - p)})`;
            ctx.fillRect(0, 0, w, y + 20);
          }, 0.5);
          break;
        case "J": // Gold sparks rain down, flicker in time
          pushEffect((p, time) => {
            for (let i = 0; i < 55; i++) {
              const seed = i * 997.1;
              const x = seed % w;
              const y = (-(seed * 0.7) % 100) + p * (h * 1.3 + (seed * 0.3) % 200);
              if (Math.sin(time * 20 + seed) > 0) {
                ctx.fillStyle = `rgba(255,${160 + Math.floor(seed % 80)},30,${0.85 * (1 - p)})`;
                ctx.fillRect(x, y, 2, 8);
              }
            }
          }, 0.7);
          break;
        case "K": // Rotating gear-like arcs
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(time * 4);
            for (let i = 0; i < 6; i++) {
              ctx.rotate(Math.PI / 3);
              ctx.strokeStyle = `rgba(255,200,60,${0.5 * (1 - p)})`;
              ctx.lineWidth = 6;
              ctx.beginPath(); ctx.arc(0, 0, 50 + p * 200, 0, Math.PI * 0.4); ctx.stroke();
              ctx.strokeStyle = `rgba(255,140,20,${0.25 * (1 - p)})`;
              ctx.lineWidth = 2;
              ctx.beginPath(); ctx.arc(0, 0, 80 + p * 250, 0, Math.PI * 0.3); ctx.stroke();
            }
            ctx.restore();
          }, 0.85);
          break;
        case "L": // Warm rings collapse inward from edge
          pushEffect((p) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            for (let i = 0; i < 18; i++) {
              const depth = i / 18;
              const radius = (depth + p * (1 - depth)) * Math.min(w, h) * 0.75;
              ctx.strokeStyle = `rgba(255,${110 + Math.floor(depth * 90)},20,${(1 - depth) * 0.4 * (1 - p)})`;
              ctx.lineWidth = 2;
              ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.restore();
          }, 0.65);
          break;
      }
    },
  },

  // ── 3: ACID — lime green / neon yellow, organic & liquid ─────────────────
  3: {
    vibe: "ACID",
    accent: [184, 255, 60],
    keyDefs: [
      { key: "Q", label: "Acid Splash" },  { key: "W", label: "Bassline Hit" },
      { key: "E", label: "Spiral Arms" },  { key: "R", label: "Slime Left" },
      { key: "T", label: "Slime Right" },  { key: "Y", label: "Neon Burn" },
      { key: "U", label: "Drip Lines" },   { key: "I", label: "Bubble Burst" },
      { key: "O", label: "Toxic Hit" },    { key: "P", label: "Bleach Out" },
      { key: "A", label: "Stomp" },        { key: "S", label: "Rattle Burst" },
      { key: "D", label: "Acid Strobe" },  { key: "F", label: "Morph Wave" },
      { key: "G", label: "Slime Blob" },   { key: "H", label: "Jagged Slash" },
      { key: "J", label: "Spore Storm" },  { key: "K", label: "Cyclone" },
      { key: "L", label: "Swamp Tunnel" },
    ],
    trigger(key) {
      switch (key) {
        case "Q": stab(184, 255, 60); break;
        case "W":
          pushEffect((p) => {
            ctx.fillStyle = `rgba(120,255,30,${0.55 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = `rgba(255,255,100,${0.2 * (1 - p)})`;
            ctx.fillRect(0, h * 0.4, w, h * 0.2);
          }, 0.25);
          break;
        case "E": // Rotating Fibonacci spiral arms
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            ctx.rotate(time * 3 + p * Math.PI * 2);
            for (let arm = 0; arm < 3; arm++) {
              ctx.rotate((Math.PI * 2) / 3);
              ctx.strokeStyle = `rgba(${160 - Math.floor(p * 60)},255,${40 + Math.floor(p * 40)},${0.55 * (1 - p)})`;
              ctx.lineWidth = 3;
              ctx.beginPath();
              const maxR = Math.min(w, h) * 0.55;
              for (let r = 10; r < maxR; r += 8) {
                const angle = r * 0.08 + p * 3;
                if (r === 10) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
                else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
              }
              ctx.stroke();
            }
            ctx.restore();
          }, 0.9);
          break;
        case "R": fanSweep(-1, 85); break;
        case "T": fanSweep(1, 85); break;
        case "Y":
          pushEffect((p) => {
            ctx.fillStyle = `rgba(220,255,50,${0.72 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
          }, 0.15);
          break;
        case "U": // Vertical drips streak downward
          pushEffect((p, time) => {
            for (let i = 0; i < 32; i++) {
              const seed = i * 1117.3;
              const x = seed % w;
              const len = 40 + (seed * 0.3) % 80;
              const y = -len + ((p + (seed % 100) / 100 * 0.5) % 1) * (h + len);
              ctx.strokeStyle = `rgba(120,255,40,${0.65 * (1 - p)})`;
              ctx.lineWidth = 1.5 + (seed % 3);
              ctx.beginPath();
              ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(seed) * 5, y + len);
              ctx.stroke();
            }
          }, 0.8);
          break;
        case "I":
          pushBeat(w / 2, h / 2, 1.5, "120,255,40");
          pushBeat(w / 2, h / 2, 1.0, "200,255,80");
          pushEffect((p) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            for (let i = 0; i < 6; i++) {
              const r = (0.1 + p * 0.9) * Math.min(w, h) * 0.42 * (0.5 + i * 0.1);
              ctx.strokeStyle = `rgba(120,255,60,${(1 - i / 6) * 0.4 * (1 - p)})`;
              ctx.lineWidth = 2;
              ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.restore();
          }, 0.5);
          break;
        case "O":
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            for (let i = 0; i < 10; i++) {
              const angle = (i / 10) * Math.PI * 2 + time * 2;
              const radius = (1 - p) * Math.min(w, h) * 0.45;
              ctx.strokeStyle = `hsla(${80 + i * 9},100%,55%,${0.65 * (1 - p)})`;
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
              ctx.stroke();
            }
            ctx.restore();
          }, 0.5);
          break;
        case "P":
          pushEffect((p) => {
            ctx.fillStyle = `rgba(230,255,200,${0.9 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
          }, 0.18);
          break;
        case "A":
          pushBeat(w * 0.5, h * 0.9, 1.8, "120,255,40");
          pushEffect((p) => {
            const g = ctx.createRadialGradient(w / 2, h * 1.1, 10, w / 2, h * 1.1, h * (1 - p * 0.5));
            g.addColorStop(0, `rgba(100,255,20,${0.6 * (1 - p)})`);
            g.addColorStop(1, "rgba(0,200,0,0)");
            ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          }, 0.4);
          break;
        case "S": // Random green rect burst — feels like a rattle
          pushEffect((p) => {
            for (let i = 0; i < 35; i++) {
              const seed = i * 773.1;
              ctx.fillStyle = `rgba(${80 + Math.floor(seed % 120)},255,${Math.floor(seed % 60)},${0.65 * (1 - p)})`;
              ctx.fillRect(rand(0, w), rand(0, h), 3 + seed % 6, 3 + seed % 8);
            }
          }, 0.35);
          break;
        case "D":
          pushEffect((p) => {
            if (Math.floor(p * 20) % 2 === 0) {
              ctx.fillStyle = `rgba(100,255,10,${0.55 * (1 - p)})`;
              ctx.fillRect(0, 0, w, h);
            }
          }, 0.4);
          break;
        case "F":
          pushEffect((p, time) => {
            const hue = 80 + Math.sin(time * 4) * 22;
            ctx.fillStyle = `hsla(${hue},100%,55%,${0.2 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
          }, 1.2);
          break;
        case "G": // Wobbly green blob drops with sinusoidal sway
          pushEffect((p) => {
            const x = w * 0.5 + Math.sin(p * Math.PI * 3) * w * 0.2;
            const y = -80 + p * (h + 160);
            const r = 40 + Math.sin(p * Math.PI) * 100;
            const g = ctx.createRadialGradient(x, y, 4, x, y, r);
            g.addColorStop(0, `rgba(160,255,50,${0.72 * (1 - p)})`);
            g.addColorStop(0.5, `rgba(80,200,20,${0.4 * (1 - p)})`);
            g.addColorStop(1, "rgba(0,150,0,0)");
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
          }, 0.9);
          break;
        case "H": // Zigzag lightning-cut across screen
          pushEffect((p) => {
            ctx.strokeStyle = `rgba(180,255,40,${0.65 * (1 - p)})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let i = 0; i <= 14; i++) {
              const x = (i / 14) * w;
              const y = h * 0.5 + (i % 2 === 0 ? -1 : 1) * (28 + Math.sin(p * 4) * 16) - p * h * 0.8 + h * 0.4;
              if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.fillStyle = `rgba(120,255,30,${0.18 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h * 0.5 - p * h * 0.4 + 30);
          }, 0.5);
          break;
        case "J": // Spore circles scatter and drift
          pushEffect((p) => {
            for (let i = 0; i < 80; i++) {
              const seed = i * 1321.4;
              const x = (seed % w + p * 160) % w;
              const y = ((seed * 2.1) % h + p * 200) % h;
              ctx.fillStyle = `hsla(${75 + seed % 30},100%,55%,${0.62 * (1 - p)})`;
              ctx.beginPath(); ctx.arc(x, y, 2 + seed % 5, 0, Math.PI * 2); ctx.fill();
            }
          }, 0.85);
          break;
        case "K": // Counter-clockwise 5-arm cyclone
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(-time * 3);
            for (let i = 0; i < 5; i++) {
              ctx.rotate((Math.PI * 2) / 5);
              ctx.strokeStyle = `rgba(140,255,40,${0.5 * (1 - p)})`;
              ctx.lineWidth = 4;
              ctx.beginPath(); ctx.arc(0, 0, 60 + p * 220, 0, Math.PI * 0.7); ctx.stroke();
            }
            ctx.restore();
          }, 0.9);
          break;
        case "L": // Dark swamp depth — green rings collapse inward
          pushEffect((p) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            for (let i = 0; i < 18; i++) {
              const depth = i / 18;
              const radius = (1 - p) * depth * Math.min(w, h) * 0.8;
              ctx.strokeStyle = `rgba(${Math.floor(depth * 80)},${180 + Math.floor(depth * 75)},${Math.floor(depth * 30)},${(1 - depth) * 0.45 * (1 - p)})`;
              ctx.lineWidth = 2.5;
              ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.restore();
          }, 0.75);
          break;
      }
    },
  },

  // ── 4: RAVE — full spectrum chaos, maximum everything ─────────────────────
  4: {
    vibe: "RAVE",
    accent: [255, 60, 240],
    keyDefs: [
      { key: "Q", label: "Rainbow Stab" },  { key: "W", label: "Seizure" },
      { key: "E", label: "Prism Fan" },      { key: "R", label: "Warp Left" },
      { key: "T", label: "Warp Right" },     { key: "Y", label: "UV Blast" },
      { key: "U", label: "Neon Falls" },     { key: "I", label: "Shockwave" },
      { key: "O", label: "Nova Burst" },     { key: "P", label: "BLAZE" },
      { key: "A", label: "KICK" },           { key: "S", label: "SNARE" },
      { key: "D", label: "MEGA STROBE" },    { key: "F", label: "Rainbow Wash" },
      { key: "G", label: "Comet" },          { key: "H", label: "Lightning" },
      { key: "J", label: "CONFETTI BOMB" },  { key: "K", label: "Cyclone Max" },
      { key: "L", label: "WARP TUNNEL" },
    ],
    trigger(key) {
      switch (key) {
        case "Q": // Hue rotates on each press
          pushBeat(rand(w * 0.2, w * 0.8), rand(h * 0.2, h * 0.8), 2.0);
          pushEffect((p, time) => {
            ctx.fillStyle = `hsla(${(time * 300) % 360},100%,65%,${0.55 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
          }, 0.28);
          break;
        case "W": // Epileptic multi-colour flicker
          pushEffect((p, time) => {
            if (Math.floor(p * 24) % 2 === 0) {
              const hue = (Math.floor(time * 28) * 37) % 360;
              ctx.fillStyle = `hsla(${hue},100%,62%,${0.65 * (1 - p)})`;
              ctx.fillRect(0, 0, w, h);
            }
          }, 0.5);
          break;
        case "E": // Six rainbow fan slices rotating
          pushEffect((p, time) => {
            for (let i = 0; i < 6; i++) {
              const hue = (i * 60 + time * 120) % 360;
              const dir = i % 2 === 0 ? 1 : -1;
              const span = Math.PI / 3;
              const start = (dir > 0 ? -0.5 : 1.5) * Math.PI + p * dir * Math.PI + (i / 6) * Math.PI;
              ctx.save(); ctx.translate(w / 2, h * 0.95);
              ctx.fillStyle = `hsla(${hue},100%,65%,${0.38 * (1 - p)})`;
              ctx.beginPath(); ctx.moveTo(0, 0);
              ctx.arc(0, 0, Math.max(w, h) * 1.2, start, start + span * dir);
              ctx.closePath(); ctx.fill(); ctx.restore();
            }
          }, 0.7);
          break;
        case "R": fanSweep(-1, Math.random() * 360); break;
        case "T": fanSweep(1, Math.random() * 360); break;
        case "Y":
          pushBeat(w / 2, h / 2, 1.8, "200,80,255");
          pushEffect((p) => {
            ctx.fillStyle = `rgba(200,80,255,${0.75 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
          }, 0.2);
          break;
        case "U": // Rainbow vertical lines, slightly angled
          pushEffect((p, time) => {
            for (let i = 0; i < 30; i++) {
              const x = (i / 30) * w;
              const hue = (i * 12 + time * 120) % 360;
              ctx.strokeStyle = `hsla(${hue},100%,65%,${0.48 * (1 - p)})`;
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(x, -20); ctx.lineTo(x + Math.sin(time * 3 + i) * 22, h + 20);
              ctx.stroke();
            }
          }, 0.65);
          break;
        case "I": // Three staggered shockwave rings + beats
          pushBeat(w / 2, h / 2, 2.2);
          pushBeat(w / 2, h / 2, 1.8);
          pushBeat(w / 2, h / 2, 1.4);
          pushEffect((p) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            for (let i = 0; i < 5; i++) {
              const rp = (p + i * 0.18) % 1;
              const r = rp * Math.min(w, h) * 0.85;
              const hue = (i * 72 + p * 180) % 360;
              ctx.strokeStyle = `hsla(${hue},100%,65%,${0.45 * (1 - rp)})`;
              ctx.lineWidth = 3.5;
              ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.restore();
          }, 0.9);
          break;
        case "O": // 16-ray rainbow starburst
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            for (let i = 0; i < 16; i++) {
              const angle = (i / 16) * Math.PI * 2 + time * 2;
              const radius = (1 - p) * Math.min(w, h) * 0.56;
              ctx.strokeStyle = `hsla(${(i * 22 + time * 200) % 360},100%,65%,${0.72 * (1 - p)})`;
              ctx.lineWidth = 5;
              ctx.beginPath(); ctx.moveTo(0, 0);
              ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
              ctx.stroke();
            }
            ctx.restore();
          }, 0.5);
          break;
        case "P": // BLAZE — full white screen nuke
          pushBeat(w / 2, h / 2, 2.5);
          pushBeat(w / 2, h / 2, 2.0);
          pushEffect((p) => {
            ctx.fillStyle = `rgba(255,255,255,${(1 - p)})`;
            ctx.fillRect(0, 0, w, h);
          }, 0.25);
          break;
        case "A": // KICK — massive surge from the floor
          pushBeat(w * 0.5, h * 0.85, 2.6);
          pushBeat(w * 0.5, h * 0.85, 2.1);
          pushEffect((p) => {
            const g = ctx.createRadialGradient(w / 2, h, 10, w / 2, h, h * 1.6 * (1 - p * 0.2));
            g.addColorStop(0, `rgba(255,255,255,${0.72 * (1 - p)})`);
            g.addColorStop(0.3, `rgba(255,80,200,${0.45 * (1 - p)})`);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          }, 0.45);
          break;
        case "S": // SNARE — rainbow confetti explosion from 5 points
          for (let i = 0; i < 5; i++) pushBeat(rand(0, w), rand(h * 0.3, h * 0.7), 1.3);
          pushEffect((p, time) => {
            for (let i = 0; i < 60; i++) {
              const seed = i * 997.1;
              const angle = (seed % 628) / 100;
              const dist = ((seed * 0.7) % 1) * Math.min(w, h) * 0.55 * p;
              ctx.fillStyle = `hsla(${(seed * 7 + time * 200) % 360},100%,70%,${0.72 * (1 - p)})`;
              ctx.fillRect(w / 2 + Math.cos(angle) * dist, h / 2 + Math.sin(angle) * dist, 4, 4);
            }
          }, 0.4);
          break;
        case "D": // MEGA STROBE — alternates white + hue every other flash
          pushEffect((p, time) => {
            if (Math.floor(p * 32) % 2 === 0) {
              const hue = (Math.floor(time * 15) * 60) % 360;
              ctx.fillStyle = Math.floor(p * 32) % 4 === 0
                ? `rgba(255,255,255,${0.75 * (1 - p)})`
                : `hsla(${hue},100%,65%,${0.6 * (1 - p)})`;
              ctx.fillRect(0, 0, w, h);
            }
          }, 0.55);
          break;
        case "F": // Hue bands scroll horizontally across screen
          pushEffect((p, time) => {
            for (let i = 0; i < 20; i++) {
              const x = (i / 20) * w;
              const hue = ((i / 20) * 360 + time * 420) % 360;
              ctx.fillStyle = `hsla(${hue},100%,60%,${0.12 * (1 - p)})`;
              ctx.fillRect(x, 0, w / 20 + 1, h);
            }
          }, 1.2);
          break;
        case "G": // Giant rainbow fireball with 6-layer trailing glow
          pushEffect((p, time) => {
            const cx = w * 0.5 + Math.sin(p * 5) * w * 0.3;
            const cy = -150 + p * (h + 300);
            for (let i = 5; i >= 0; i--) {
              const trail = i * 0.07;
              const ty = cy - trail * 180;
              const r = (65 - i * 9) * Math.sin(Math.max(0, p - trail) * Math.PI);
              if (r <= 0) continue;
              const hue = (i * 20 + time * 300) % 360;
              const g = ctx.createRadialGradient(cx, ty, 0, cx, ty, r);
              g.addColorStop(0, `hsla(${hue},100%,90%,${0.85 * (1 - p)})`);
              g.addColorStop(0.3, `hsla(${hue + 30},100%,65%,${0.5 * (1 - p)})`);
              g.addColorStop(1, "hsla(0,0%,0%,0)");
              ctx.fillStyle = g;
              ctx.beginPath(); ctx.arc(cx, ty, r, 0, Math.PI * 2); ctx.fill();
            }
          }, 0.85);
          break;
        case "H": // Branching electric slash — redraws jagged each frame
          pushEffect((p) => {
            ctx.strokeStyle = `rgba(210,230,255,${0.88 * (1 - p)})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            let lx = rand(w * 0.3, w * 0.7), ly = 0;
            ctx.moveTo(lx, ly);
            for (let i = 1; i <= 18; i++) {
              lx += rand(-70, 70);
              ly = (i / 18) * h;
              ctx.lineTo(lx, ly);
            }
            ctx.stroke();
            ctx.strokeStyle = `rgba(180,200,255,${0.22 * (1 - p)})`;
            ctx.lineWidth = 14;
            ctx.stroke();
          }, 0.28);
          break;
        case "J": // 150-piece confetti bomb
          pushEffect((p) => {
            for (let i = 0; i < 150; i++) {
              const seed = i * 1321.4;
              const angle = (seed % 628) / 100;
              const dist = ((seed * 0.3) % 1) * Math.min(w, h) * 0.72 * p;
              const x = w / 2 + Math.cos(angle) * dist;
              const y = h / 2 + Math.sin(angle) * dist + p * p * 280;
              ctx.fillStyle = `hsla(${(seed * 13) % 360},100%,65%,${0.82 * (1 - p)})`;
              ctx.fillRect(x, y, 3 + seed % 8, (3 + seed % 8) * 2);
            }
          }, 1.0);
          break;
        case "K": // 8-arm rainbow hurricane, fast rotation
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(-time * 5);
            for (let i = 0; i < 8; i++) {
              ctx.rotate(Math.PI / 4);
              const hue = (i * 45 + time * 300) % 360;
              ctx.strokeStyle = `hsla(${hue},100%,65%,${0.52 * (1 - p)})`;
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.arc(0, 0, 40 + p * Math.min(w, h) * 0.56, 0, Math.PI * 0.55);
              ctx.stroke();
            }
            ctx.restore();
          }, 0.9);
          break;
        case "L": // 12 looping rainbow rings — continuous warp effect
          pushBeat(w / 2, h / 2, 1.8);
          pushBeat(w / 2, h / 2, 1.4);
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            for (let i = 0; i < 12; i++) {
              const rp = (p + i / 12) % 1;
              const r = rp * Math.min(w, h) * 0.9;
              const hue = (i * 30 + time * 240) % 360;
              ctx.strokeStyle = `hsla(${hue},100%,65%,${0.52 * (1 - rp)})`;
              ctx.lineWidth = 4;
              ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.restore();
          }, 0.9);
          break;
      }
    },
  },

  // ── 5: OPENCODE ZEN — deep purples, lavenders, zen circles, ink flow ────────
  5: {
    vibe: "ZEN",
    accent: [180, 130, 255],
    keyDefs: [
      { key: "Q", label: "Enso Circle" },   { key: "W", label: "Ink Splash" },
      { key: "E", label: "Lotus Bloom" },    { key: "R", label: "Flow Left" },
      { key: "T", label: "Flow Right" },     { key: "Y", label: "Zen Flash" },
      { key: "U", label: "Rain Drops" },     { key: "I", label: "Ripple" },
      { key: "O", label: "Koi Burst" },      { key: "P", label: "White Out" },
      { key: "A", label: "Deep Drum" },      { key: "S", label: "Bamboo Crack" },
      { key: "D", label: "Mantra Pulse" },   { key: "F", label: "Hue Drift" },
      { key: "G", label: "Spirit Fall" },    { key: "H", label: "Zen Slash" },
      { key: "J", label: "Fireflies" },      { key: "K", label: "Mandala" },
      { key: "L", label: "Void Tunnel" },
    ],
    trigger(key) {
      switch (key) {
        case "Q": // Enso - incomplete zen circle
          pushBeat(w / 2, h / 2, 1.2, "180,130,255");
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            ctx.strokeStyle = `rgba(200,170,255,${0.7 * (1 - p)})`;
            ctx.lineWidth = 8;
            ctx.beginPath();
            const startAngle = p * Math.PI * 1.8;
            const endAngle = startAngle + Math.PI * 1.5 + Math.sin(time * 2) * 0.3;
            ctx.arc(0, 0, Math.min(w, h) * 0.28, startAngle, endAngle);
            ctx.stroke();
            ctx.strokeStyle = `rgba(140,100,220,${0.35 * (1 - p)})`;
            ctx.lineWidth = 20;
            ctx.stroke();
            ctx.restore();
          }, 1.2);
          break;
        case "W": // Ink splash - organic spreading blob
          pushEffect((p) => {
            const cx = rand(w * 0.2, w * 0.8);
            const cy = rand(h * 0.2, h * 0.6);
            for (let i = 0; i < 40; i++) {
              const seed = i * 761.3;
              const angle = (seed % 628) / 100;
              const dist = Math.pow(p, 0.5) * (seed % 1) * Math.min(w, h) * 0.4;
              const size = 8 + (seed % 20) * (1 - p * 0.7);
              const alpha = (0.6 - p * 0.4) * (1 - i / 40);
              ctx.fillStyle = `hsla(${260 + (seed % 40)},60%,${45 + (seed % 20)}%,${alpha})`;
              ctx.beginPath();
              ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, size, 0, Math.PI * 2);
              ctx.fill();
            }
          }, 0.9);
          break;
        case "E": // Lotus bloom - layered petals unfurling
          pushBeat(w / 2, h * 0.65, 1.0, "255,180,220");
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h * 0.65);
            const petalCount = 12;
            for (let i = 0; i < petalCount; i++) {
              const angle = (i / petalCount) * Math.PI * 2 + time * 0.3;
              const open = Math.sin(p * Math.PI);
              const len = 80 + i * 8;
              const wid = 25 + (1 - i / petalCount) * 15;
              ctx.save();
              ctx.rotate(angle);
              ctx.translate(open * 20, 0);
              ctx.rotate(open * 0.4 * (i % 2 === 0 ? 1 : -1));
              const hue = 280 + i * 8 + Math.sin(time) * 20;
              ctx.fillStyle = `hsla(${hue % 360},70%,${65 + i * 2}%,${0.55 * (1 - p * 0.6)})`;
              ctx.beginPath();
              ctx.ellipse(0, -len * open * 0.5, wid * open, len * open, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
            ctx.fillStyle = `hsla(50,90%,75%,${0.7 * (1 - p)})`;
            ctx.beginPath(); ctx.arc(0, 0, 15 * (1 - p * 0.5), 0, Math.PI * 2); ctx.fill();
            ctx.restore();
          }, 1.0);
          break;
        case "R": fanSweep(-1, 270); break;
        case "T": fanSweep(1, 270); break;
        case "Y": // Zen flash - purple/white burst
          pushBeat(w / 2, h / 2, 1.6, "200,160,255");
          pushEffect((p) => {
            ctx.fillStyle = `rgba(180,140,255,${0.65 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
          }, 0.2);
          break;
        case "U": // Rain drops - vertical streaks with glow
          pushEffect((p, time) => {
            for (let i = 0; i < 35; i++) {
              const seed = i * 1247.3;
              const x = (seed % w);
              const y = (-(seed * 0.5) % 80) + p * (h + 100);
              const len = 30 + (seed % 40);
              const hue = 240 + (seed % 30);
              const g = ctx.createLinearGradient(x, y, x, y + len);
              g.addColorStop(0, `hsla(${hue},70%,70%,${0.5 * (1 - p)})`);
              g.addColorStop(1, `hsla(${hue + 20},60%,50%,${0.1 * (1 - p)})`);
              ctx.strokeStyle = g;
              ctx.lineWidth = 2 + (seed % 3);
              ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(seed) * 8, y + len); ctx.stroke();
            }
          }, 0.7);
          break;
        case "I": // Ripple - concentric rings from center
          pushBeat(w / 2, h / 2, 1.4, "120,200,255");
          pushEffect((p) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            for (let i = 0; i < 8; i++) {
              const delay = i * 0.08;
              const lp = Math.max(0, Math.min(1, (p - delay) / 0.7));
              const r = lp * Math.min(w, h) * 0.45;
              ctx.strokeStyle = `hsla(${200 + i * 15},80%,${65 + i * 3}%,${0.5 * (1 - lp)})`;
              ctx.lineWidth = 3 - i * 0.25;
              ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.restore();
          }, 0.6);
          break;
        case "O": // Koi burst - orange/white fish shapes swimming out
          pushEffect((p, time) => {
            for (let i = 0; i < 12; i++) {
              const seed = i * 997.1;
              const angle = (seed % 628) / 100 + time * 0.5;
              const dist = p * Math.min(w, h) * 0.45;
              const x = w / 2 + Math.cos(angle) * dist;
              const y = h / 2 + Math.sin(angle) * dist;
              const size = 8 + (seed % 12);
              ctx.save(); ctx.translate(x, y); ctx.rotate(angle + Math.PI / 2);
              ctx.fillStyle = i % 2 === 0 
                ? `hsla(${20 + (seed % 20)},90%,60%,${0.7 * (1 - p)})`
                : `hsla(${200 + (seed % 30)},60%,75%,${0.6 * (1 - p)})`;
              ctx.beginPath();
              ctx.ellipse(0, 0, size, size * 2.5, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = `rgba(255,255,255,${0.4 * (1 - p)})`;
              ctx.beginPath(); ctx.ellipse(-size * 0.3, -size, size * 0.3, size * 0.8, 0, 0, Math.PI * 2); ctx.fill();
              ctx.restore();
            }
          }, 0.7);
          break;
        case "P": // White out - calm white fade
          pushEffect((p) => {
            ctx.fillStyle = `rgba(255,250,255,${0.85 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
          }, 0.3);
          break;
        case "A": // Deep drum - heavy thump from bottom
          pushBeat(w * 0.5, h * 0.9, 1.8, "80,60,120");
          pushEffect((p) => {
            const g = ctx.createRadialGradient(w / 2, h * 1.1, 10, w / 2, h * 1.1, h * 1.2 * (1 - p * 0.3));
            g.addColorStop(0, `rgba(100,60,140,${0.5 * (1 - p)})`);
            g.addColorStop(1, "rgba(40,20,80,0)");
            ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          }, 0.5);
          break;
        case "S": // Bamboo crack - vertical split with particles
          pushEffect((p) => {
            const cx = rand(w * 0.2, w * 0.8);
            ctx.strokeStyle = `rgba(120,90,60,${0.7 * (1 - p)})`;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(cx, h * 0.1);
            ctx.lineTo(cx + rand(-20, 20), h * 0.9);
            ctx.stroke();
            for (let i = 0; i < 25; i++) {
              const seed = i * 883.1;
              const y = (seed % h) * (1 - p * 0.5);
              const x = cx + (seed % 1 - 0.5) * 80 * (1 - p) + rand(-15, 15);
              ctx.fillStyle = `hsla(${35 + (seed % 20)},40%,${45 + (seed % 20)}%,${0.6 * (1 - p)})`;
              ctx.fillRect(x, y, 3 + (seed % 4), 6 + (seed % 8));
            }
          }, 0.45);
          break;
        case "D": // Mantra pulse - breathing geometric pattern
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            const breathe = Math.sin(time * 2) * 0.2 + 0.8;
            for (let i = 0; i < 6; i++) {
              ctx.rotate(Math.PI / 3);
              const pulse = (p + i * 0.15) % 1;
              const size = 40 + pulse * 120 * breathe;
              ctx.strokeStyle = `hsla(${270 + i * 20},60%,${60 + i * 5}%,${0.45 * (1 - pulse)})`;
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(-size, 0); ctx.lineTo(size, 0);
              ctx.moveTo(0, -size); ctx.lineTo(0, size);
              ctx.stroke();
              ctx.strokeStyle = `hsla(${270 + i * 20},50%,${55}%,${0.25 * (1 - pulse)})`;
              ctx.beginPath(); ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.restore();
          }, 1.0);
          break;
        case "F": // Hue drift - slow purple/cyan evolution
          pushEffect((p, time) => {
            const hue = 260 + Math.sin(time * 0.8) * 40;
            ctx.fillStyle = `hsla(${hue},55%,${35 + Math.sin(time) * 10}%,${0.15 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
          }, 1.5);
          break;
        case "G": // Spirit fall - glowing orb descending with trail
          pushEffect((p, time) => {
            const x = w * 0.5 + Math.sin(p * Math.PI * 2.5) * w * 0.1;
            const y = -60 + p * (h + 120);
            for (let i = 4; i >= 0; i--) {
              const trail = i * 0.12;
              const ty = y - trail * h * 0.25;
              const r = (30 - i * 4) * Math.sin(Math.max(0, p - trail) * Math.PI);
              if (r <= 0) continue;
              const g = ctx.createRadialGradient(x, ty, 0, x, ty, r);
              g.addColorStop(0, `hsla(${280 + i * 10},70%,85%,${0.7 * (1 - p)})`);
              g.addColorStop(0.4, `hsla(${260 + i * 15},60%,60%,${0.4 * (1 - p)})`);
              g.addColorStop(1, "hsla(270,50%,30%,0)");
              ctx.fillStyle = g;
              ctx.beginPath(); ctx.arc(x, ty, r, 0, Math.PI * 2); ctx.fill();
            }
          }, 0.95);
          break;
        case "H": // Zen slash - clean diagonal cut with glow
          pushEffect((p) => {
            const y = h * p;
            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.rotate(Math.PI / 4);
            const g = ctx.createLinearGradient(-w, y - h / 2, w, y - h / 2);
            g.addColorStop(0, "rgba(180,140,255,0)");
            g.addColorStop(0.4, `rgba(200,170,255,${0.5 * (1 - p)})`);
            g.addColorStop(0.5, `rgba(255,230,255,${0.7 * (1 - p)})`);
            g.addColorStop(0.6, `rgba(200,170,255,${0.5 * (1 - p)})`);
            g.addColorStop(1, "rgba(180,140,255,0)");
            ctx.fillStyle = g;
            ctx.fillRect(-w, y - h / 2, w * 2, h);
            ctx.restore();
            ctx.fillStyle = `rgba(140,100,200,${0.08 * (1 - p)})`;
            ctx.fillRect(0, 0, w, y + 30);
          }, 0.5);
          break;
        case "J": // Fireflies - gentle floating lights
          pushEffect((p, time) => {
            for (let i = 0; i < 50; i++) {
              const seed = i * 1321.4;
              const baseX = seed % w;
              const baseY = (seed * 1.3) % h;
              const drift = Math.sin(time * 2 + seed) * 30;
              const x = baseX + drift;
              const y = baseY + Math.sin(time * 1.5 + seed * 0.5) * 20 + p * 40;
              const glow = Math.sin(time * 4 + seed * 2) * 0.3 + 0.7;
              const size = 2 + (seed % 4);
              ctx.fillStyle = `hsla(${55 + (seed % 30)},80%,${65 + glow * 20}%,${glow * 0.7 * (1 - p)})`;
              ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = `hsla(${55 + (seed % 30)},80%,70%,${glow * 0.25 * (1 - p)})`;
              ctx.beginPath(); ctx.arc(x, y, size * 4, 0, Math.PI * 2); ctx.fill();
            }
          }, 1.2);
          break;
        case "K": // Mandala - intricate rotating geometric
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(time * 0.8);
            const layers = 5;
            for (let l = 0; l < layers; l++) {
              const rot = l * Math.PI * 2 / layers;
              ctx.save(); ctx.rotate(rot + p * Math.PI * 2);
              const petals = 8 + l * 2;
              for (let i = 0; i < petals; i++) {
                const angle = (i / petals) * Math.PI * 2;
                const radius = (0.2 + l * 0.15 + p * 0.3) * Math.min(w, h) * 0.4;
                const hue = 260 + l * 15 + (i * 10);
                ctx.strokeStyle = `hsla(${hue % 360},65%,${60 + l * 5}%,${0.5 * (1 - p)})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * radius * 0.3, Math.sin(angle) * radius * 0.3);
                ctx.quadraticCurveTo(
                  Math.cos(angle + 0.1) * radius,
                  Math.sin(angle + 0.1) * radius,
                  Math.cos(angle) * radius,
                  Math.sin(angle) * radius
                );
                ctx.stroke();
              }
              ctx.restore();
            }
            ctx.restore();
          }, 1.1);
          break;
        case "L": // Void tunnel - depth collapse effect
          pushBeat(w / 2, h / 2, 1.2, "100,80,150");
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            for (let i = 0; i < 20; i++) {
              const depth = i / 20;
              const radius = (depth + p * (1 - depth)) * Math.min(w, h) * 0.7;
              const hue = 270 - depth * 40 + Math.sin(time + depth * 3) * 15;
              ctx.strokeStyle = `hsla(${hue % 360},55%,${35 + depth * 25}%,${(1 - depth) * 0.45 * (1 - p)})`;
              ctx.lineWidth = 1.5 + (1 - depth) * 2;
              ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
              if (i % 4 === 0) {
                ctx.fillStyle = `hsla(${hue + 20},60%,55%,${0.15 * (1 - depth) * (1 - p)})`;
                for (let j = 0; j < 6; j++) {
                  const a = (j / 6) * Math.PI * 2 + time + depth;
                  ctx.fillRect(Math.cos(a) * radius * 0.9, Math.sin(a) * radius * 0.9, 3, 3);
                }
              }
            }
            ctx.restore();
          }, 0.85);
          break;
      }
    },
  },

  // ── 6: GEMINI — digital twins, neural networks, electric blue ───────────
  6: {
    vibe: "GEMINI",
    accent: [0, 190, 255],
    keyDefs: [
      { key: "Q", label: "Dual Stab" },    { key: "W", label: "Neural Net" },
      { key: "E", label: "Binary Orbit" }, { key: "R", label: "Mirror Sweep" },
      { key: "T", label: "Twin Prism" },   { key: "Y", label: "Digital Flash" },
      { key: "U", label: "Data Stream" },  { key: "I", label: "Twin Ripple" },
      { key: "O", label: "Neural Core" },  { key: "P", label: "SINGULARITY" },
      { key: "A", label: "Deep Pulse" },   { key: "S", label: "Binary Snare" },
      { key: "D", label: "Bit Strobe" },   { key: "F", label: "Cyber Drift" },
      { key: "G", label: "Twin Orbs" },    { key: "H", label: "Digital Cut" },
      { key: "J", label: "Pixel Rain" },   { key: "K", label: "Twin Vortex" },
      { key: "L", label: "Neural Path" },
    ],
    trigger(key) {
      switch (key) {
        case "Q": // Two symmetric stabs
          pushBeat(w * 0.3, h * 0.5, 1.2, "0,190,255");
          pushBeat(w * 0.7, h * 0.5, 1.2, "200,100,255");
          pushEffect((p) => {
            ctx.fillStyle = `rgba(0,190,255,${0.25 * (1 - p)})`;
            ctx.fillRect(0, 0, w / 2, h);
            ctx.fillStyle = `rgba(200,100,255,${0.25 * (1 - p)})`;
            ctx.fillRect(w / 2, 0, w / 2, h);
          }, 0.2);
          break;
        case "W": // Random lines connecting points
          pushEffect((p) => {
            const nodes = [];
            for (let i = 0; i < 15; i++) nodes.push({ x: rand(0, w), y: rand(0, h) });
            ctx.strokeStyle = `rgba(100,200,255,${0.6 * (1 - p)})`;
            ctx.lineWidth = 1;
            for (let i = 0; i < nodes.length; i++) {
              for (let j = i + 1; j < nodes.length; j++) {
                if (Math.random() > 0.7) {
                  ctx.beginPath();
                  ctx.moveTo(nodes[i].x, nodes[i].y);
                  ctx.lineTo(nodes[j].x, nodes[j].y);
                  ctx.stroke();
                }
              }
            }
          }, 0.5);
          break;
        case "E": // Two points orbiting each other
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            const r = p * Math.min(w, h) * 0.4;
            const a = time * 6;
            const x1 = Math.cos(a) * r, y1 = Math.sin(a) * r;
            const x2 = Math.cos(a + Math.PI) * r, y2 = Math.sin(a + Math.PI) * r;
            ctx.fillStyle = `rgba(0,255,255,${0.8 * (1 - p)})`;
            ctx.beginPath(); ctx.arc(x1, y1, 10, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = `rgba(255,0,255,${0.8 * (1 - p)})`;
            ctx.beginPath(); ctx.arc(x2, y2, 10, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
          }, 0.6);
          break;
        case "R": // Mirror fan sweep
          pushEffect((p) => {
            const alpha = 0.4 * (1 - p);
            const span = Math.PI * 0.8;
            const startL = 1.5 * Math.PI - p * Math.PI;
            const startR = -0.5 * Math.PI + p * Math.PI;
            ctx.save(); ctx.translate(w / 2, h);
            ctx.fillStyle = `hsla(200,100%,60%,${alpha})`;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, w, startL, startL - span); ctx.fill();
            ctx.fillStyle = `hsla(280,100%,60%,${alpha})`;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, w, startR, startR + span); ctx.fill();
            ctx.restore();
          }, 0.8);
          break;
        case "T": // Mirrored triangles
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            for (let i = 0; i < 2; i++) {
              ctx.scale(i === 0 ? 1 : -1, 1);
              ctx.strokeStyle = i === 0 ? `rgba(0,255,255,${0.6 * (1 - p)})` : `rgba(255,0,255,${0.6 * (1 - p)})`;
              ctx.lineWidth = 4;
              ctx.beginPath();
              const s = p * 300;
              ctx.moveTo(50, -s); ctx.lineTo(150 + s, 0); ctx.lineTo(50, s);
              ctx.closePath(); ctx.stroke();
            }
            ctx.restore();
          }, 0.4);
          break;
        case "Y": // Grid flash
          pushEffect((p) => {
            const size = 50;
            for (let x = 0; x < w; x += size) {
              for (let y = 0; y < h; y += size) {
                if ((Math.floor(x / size) + Math.floor(y / size)) % 2 === 0) {
                  ctx.fillStyle = `rgba(0,150,255,${0.3 * (1 - p)})`;
                } else {
                  ctx.fillStyle = `rgba(150,0,255,${0.3 * (1 - p)})`;
                }
                if (Math.random() > 0.5) ctx.fillRect(x, y, size, size);
              }
            }
          }, 0.2);
          break;
        case "U": // Matrix-like data stream
          pushEffect((p) => {
            ctx.fillStyle = `rgba(0,255,150,${0.6 * (1 - p)})`;
            ctx.font = "bold 20px monospace";
            for (let i = 0; i < 25; i++) {
              const x = (i / 25) * w;
              const y = (p * h * 1.5 + i * 20) % h;
              ctx.fillText(Math.random() > 0.5 ? "1" : "0", x, y);
            }
          }, 0.8);
          break;
        case "I": // Two ripples
          pushBeat(w * 0.4, h * 0.4, 1.2, "0,255,255");
          pushBeat(w * 0.6, h * 0.6, 1.2, "255,0,255");
          break;
        case "O": // Expanding neural network from center
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            const count = 20;
            const points = [];
            for (let i = 0; i < count; i++) {
              const a = (i / count) * Math.PI * 2 + time;
              const r = p * Math.min(w, h) * 0.5;
              points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
            }
            ctx.strokeStyle = `rgba(255,255,255,${0.4 * (1 - p)})`;
            ctx.beginPath();
            for (let i = 0; i < count; i++) {
              ctx.moveTo(0, 0); ctx.lineTo(points[i].x, points[i].y);
              ctx.lineTo(points[(i + 1) % count].x, points[(i + 1) % count].y);
            }
            ctx.stroke();
            ctx.restore();
          }, 0.7);
          break;
        case "P": // White out with blue core
          pushEffect((p) => {
            ctx.fillStyle = `rgba(255,255,255,${1 - p})`;
            ctx.fillRect(0, 0, w, h);
            const r = (1 - p) * w;
            const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r);
            g.addColorStop(0, `rgba(0,200,255,${1 - p})`);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          }, 0.3);
          break;
        case "A": // Deep blue pulse
          pushBeat(w / 2, h / 2, 2.0, "0,50,255");
          pushEffect((p) => {
            ctx.fillStyle = `rgba(0,20,100,${0.4 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
          }, 0.5);
          break;
        case "S": // Mirrored snare
          pushBeat(w * 0.2, h * 0.3, 1.0, "255,255,255");
          pushBeat(w * 0.8, h * 0.3, 1.0, "255,255,255");
          pushEffect((p) => {
            ctx.fillStyle = `rgba(255,255,255,${0.3 * (1 - p)})`;
            ctx.fillRect(0, h * 0.2, w, h * 0.1);
          }, 0.2);
          break;
        case "D": // Digital strobe
          pushEffect((p) => {
            if (Math.floor(p * 20) % 2 === 0) {
              ctx.fillStyle = `rgba(0,190,255,${0.4 * (1 - p)})`;
              ctx.fillRect(0, 0, w, h);
            } else {
              ctx.fillStyle = `rgba(200,0,255,${0.4 * (1 - p)})`;
              ctx.fillRect(0, 0, w, h);
            }
          }, 0.4);
          break;
        case "F": // Cyber blue/purple drift
          pushEffect((p, time) => {
            const g = ctx.createLinearGradient(0, 0, w, h);
            g.addColorStop(0, `hsla(200,100%,50%,${0.2 * (1 - p)})`);
            g.addColorStop(1, `hsla(280,100%,50%,${0.2 * (1 - p)})`);
            ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          }, 1.2);
          break;
        case "G": // Two descending orbs
          pushEffect((p) => {
            for (let i = 0; i < 2; i++) {
              const x = i === 0 ? w * 0.3 : w * 0.7;
              const y = p * h;
              const r = 20 + Math.sin(p * Math.PI) * 100;
              const g = ctx.createRadialGradient(x, y, 0, x, y, r);
              g.addColorStop(0, i === 0 ? `rgba(0,255,255,${0.8 * (1 - p)})` : `rgba(255,0,255,${0.8 * (1 - p)})`);
              g.addColorStop(1, "rgba(0,0,0,0)");
              ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            }
          }, 0.8);
          break;
        case "H": // Horizontal digital cut
          pushEffect((p) => {
            const y = p * h;
            ctx.fillStyle = `rgba(0,255,255,${0.8 * (1 - p)})`;
            ctx.fillRect(0, y, w, 4);
            for (let i = 0; i < 20; i++) {
              ctx.fillRect(rand(0, w), y + rand(-20, 20), 10, 2);
            }
          }, 0.4);
          break;
        case "J": // Pixel bits falling
          pushEffect((p) => {
            for (let i = 0; i < 100; i++) {
              const x = (i * 123.4) % w;
              const y = ((i * 567.8) + p * h * 2) % h;
              ctx.fillStyle = i % 2 === 0 ? `rgba(0,255,255,${0.7 * (1 - p)})` : `rgba(255,0,255,${0.7 * (1 - p)})`;
              ctx.fillRect(x, y, 4, 4);
            }
          }, 0.9);
          break;
        case "K": // Double vortex
          pushEffect((p, time) => {
            ctx.save(); ctx.translate(w / 2, h / 2);
            for (let i = 0; i < 2; i++) {
              ctx.save();
              ctx.rotate(time * (i === 0 ? 4 : -4));
              ctx.strokeStyle = i === 0 ? `rgba(0,255,255,${0.5 * (1 - p)})` : `rgba(255,0,255,${0.5 * (1 - p)})`;
              ctx.lineWidth = 5;
              ctx.beginPath(); ctx.arc(i === 0 ? -100 : 100, 0, p * 200, 0, Math.PI); ctx.stroke();
              ctx.restore();
            }
            ctx.restore();
          }, 0.8);
          break;
        case "L": // Neural path
          pushEffect((p) => {
            ctx.strokeStyle = `rgba(0,255,255,${0.5 * (1 - p)})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(w / 2, h / 2);
            let cx = w / 2, cy = h / 2;
            for (let i = 0; i < 10; i++) {
              cx += (Math.random() - 0.5) * 200;
              cy += (Math.random() - 0.5) * 200;
              ctx.lineTo(cx, cy);
              ctx.strokeRect(cx - 5, cy - 5, 10, 10);
            }
            ctx.stroke();
          }, 0.7);
          break;
      }
    },
  },

  // ── 7: CURSOR — code grid, laser cursors, terminal glitches ──────────────
  7: {
    vibe: "CURSOR",
    accent: [120, 255, 210],
    keyDefs: [
      { key: "Q", label: "Caret Sweep" },     { key: "W", label: "Code Rain" },
      { key: "E", label: "Cursor Halo" },     { key: "R", label: "Scope Left" },
      { key: "T", label: "Scope Right" },     { key: "Y", label: "Compile Flash" },
      { key: "U", label: "Scanlines" },       { key: "I", label: "Text Ripple" },
      { key: "O", label: "Cursor Warp" },     { key: "P", label: "BUFFER FLUSH" },
      { key: "A", label: "Home Row Kick" },   { key: "S", label: "Syntax Snare" },
      { key: "D", label: "Cursor Strobe" },   { key: "F", label: "Color Mode" },
      { key: "G", label: "Bracket Tunnel" },  { key: "H", label: "Caret Slice" },
      { key: "J", label: "Pixel Drift" },     { key: "K", label: "Glyph Vortex" },
      { key: "L", label: "Infinite Editor" },
    ],
    trigger(key) {
      switch (key) {
        case "Q": { // Caret Sweep — thick horizontal cursor bar sweeping up
          pushEffect((p) => {
            const y = h * (0.1 + 0.8 * p);
            const barHeight = 12;
            const g = ctx.createLinearGradient(0, y - barHeight, 0, y + barHeight);
            g.addColorStop(0, "rgba(0,0,0,0)");
            g.addColorStop(0.4, `rgba(0,0,0,0.3)`);
            g.addColorStop(0.5, `rgba(120,255,210,0.85)`);
            g.addColorStop(0.6, `rgba(0,0,0,0.3)`);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g;
            ctx.fillRect(0, y - barHeight * 2, w, barHeight * 4);
            ctx.fillStyle = `rgba(120,255,210,${0.5 * (1 - p)})`;
            ctx.fillRect(0, y - 1, w, 2);
          }, 0.4);
          break;
        }
        case "W": { // Code Rain — angled ASCII streams
          const chars = ["{", "}", "[", "]", "<", ">", "/", "=", ";", ":"];
          pushEffect((p, time) => {
            ctx.save();
            ctx.translate(0, 0);
            ctx.font = "14px monospace";
            ctx.fillStyle = `rgba(5,10,20,${0.8 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
            for (let i = 0; i < 34; i++) {
              const seed = i * 991.3;
              const x = (seed % w);
              const y = ((time * 120 + seed) % (h + 100)) - 50;
              const glyph = chars[seed % chars.length];
              const alpha = 0.3 + ((seed * 0.3) % 0.5) * (1 - p);
              ctx.save();
              ctx.translate(x, y + p * 40);
              ctx.rotate(-0.2);
              ctx.fillStyle = `rgba(120,255,210,${alpha})`;
              ctx.fillText(glyph, 0, 0);
              ctx.restore();
            }
            ctx.restore();
          }, 0.75);
          break;
        }
        case "E": { // Cursor Halo — spinning ring locked to a wandering cursor
          pushEffect((p, time) => {
            const cx = w * (0.25 + 0.5 * (0.5 + Math.sin(time * 0.8) * 0.5));
            const cy = h * (0.3 + 0.4 * (0.5 + Math.cos(time * 1.1) * 0.5));
            const r = 24 + 60 * (1 - p);
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(time * 4);
            ctx.strokeStyle = `rgba(120,255,210,${0.85 * (1 - p)})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, r, -0.4 * Math.PI, 0.7 * Math.PI);
            ctx.stroke();
            ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - p)})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, r + 10, 0.5 * Math.PI, 1.4 * Math.PI);
            ctx.stroke();
            ctx.fillStyle = `rgba(120,255,210,${0.9 * (1 - p)})`;
            ctx.fillRect(r + 6, -8, 2, 16);
            ctx.restore();
          }, 0.9);
          break;
        }
        case "R": { // Scope Left — vertical scan from left
          pushEffect((p) => {
            const x = w * (0.1 + 0.4 * p);
            const grad = ctx.createLinearGradient(x - 40, 0, x + 40, 0);
            grad.addColorStop(0, "rgba(0,0,0,0)");
            grad.addColorStop(0.35, `rgba(120,255,210,${0.4 * (1 - p)})`);
            grad.addColorStop(0.5, `rgba(255,255,255,${0.8 * (1 - p)})`);
            grad.addColorStop(0.65, `rgba(120,255,210,${0.4 * (1 - p)})`);
            grad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
          }, 0.5);
          break;
        }
        case "T": { // Scope Right — vertical scan from right
          pushEffect((p) => {
            const x = w * (0.9 - 0.4 * p);
            const grad = ctx.createLinearGradient(x - 40, 0, x + 40, 0);
            grad.addColorStop(0, "rgba(0,0,0,0)");
            grad.addColorStop(0.35, `rgba(120,255,210,${0.4 * (1 - p)})`);
            grad.addColorStop(0.5, `rgba(255,255,255,${0.8 * (1 - p)})`);
            grad.addColorStop(0.65, `rgba(120,255,210,${0.4 * (1 - p)})`);
            grad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
          }, 0.5);
          break;
        }
        case "Y": { // Compile Flash — center flash with subtle code grid
          pushBeat(w / 2, h / 2, 1.4, "120,255,210");
          pushEffect((p) => {
            ctx.fillStyle = `rgba(255,255,255,${0.85 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
            const size = 26;
            ctx.strokeStyle = `rgba(0,0,0,${0.12 * (1 - p)})`;
            ctx.lineWidth = 1;
            for (let x = 0; x < w; x += size) {
              ctx.beginPath();
              ctx.moveTo(x + 0.5, 0);
              ctx.lineTo(x + 0.5, h);
              ctx.stroke();
            }
            for (let y = 0; y < h; y += size) {
              ctx.beginPath();
              ctx.moveTo(0, y + 0.5);
              ctx.lineTo(w, y + 0.5);
              ctx.stroke();
            }
          }, 0.25);
          break;
        }
        case "U": { // Scanlines — analog monitor vibe
          pushEffect((p) => {
            ctx.fillStyle = `rgba(0,0,0,${0.6 * (1 - p)})`;
            ctx.fillRect(0, 0, w, h);
            const spacing = 4;
            for (let y = 0; y < h; y += spacing) {
              const alpha = 0.2 + 0.4 * (1 - p);
              ctx.fillStyle = `rgba(120,255,210,${alpha})`;
              ctx.fillRect(0, y, w, 1);
            }
          }, 0.9);
          break;
        }
        case "I": { // Text Ripple — keypress shockwave made of tiny glyphs
          const chars = [".", ":", "+", "*"];
          pushBeat(w / 2, h / 2, 1.3, "120,255,210");
          pushEffect((p, time) => {
            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.font = "12px monospace";
            for (let i = 0; i < 60; i++) {
              const angle = (i / 60) * Math.PI * 2;
              const r = p * Math.min(w, h) * 0.5;
              const x = Math.cos(angle) * r;
              const y = Math.sin(angle) * r;
              const glyph = chars[i % chars.length];
              const alpha = 0.5 * (1 - p);
              ctx.fillStyle = `rgba(120,255,210,${alpha})`;
              ctx.fillText(glyph, x, y);
            }
            ctx.restore();
          }, 0.7);
          break;
        }
        case "O": { // Cursor Warp — big L-shaped cursor sweeps in a spiral
          pushEffect((p, time) => {
            const r = (0.2 + 0.6 * p) * Math.min(w, h) * 0.6;
            const a = time * 3;
            const cx = w / 2 + Math.cos(a) * r * 0.4;
            const cy = h / 2 + Math.sin(a) * r * 0.3;
            const size = 60 + 120 * (1 - p);
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(a);
            ctx.strokeStyle = `rgba(120,255,210,${0.9 * (1 - p)})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-size, -size);
            ctx.lineTo(0, -size);
            ctx.lineTo(0, size);
            ctx.stroke();
            ctx.restore();
          }, 0.85);
          break;
        }
        case "P": { // BUFFER FLUSH — hard white + teal fade
          pushEffect((p) => {
            ctx.fillStyle = `rgba(255,255,255,${1 - p})`;
            ctx.fillRect(0, 0, w, h);
            const r = (1 - p) * Math.max(w, h);
            const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r);
            g.addColorStop(0, `rgba(120,255,210,${1 - p})`);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
          }, 0.3);
          break;
        }
        case "A": { // Home Row Kick — kick from bottom center with grid glow
          pushBeat(w * 0.5, h * 0.88, 2.0, "120,255,210");
          pushEffect((p) => {
            const g = ctx.createRadialGradient(
              w / 2, h * 1.05, 20,
              w / 2, h * 1.05, h * 1.2 * (1 - p * 0.3)
            );
            g.addColorStop(0, `rgba(120,255,210,${0.6 * (1 - p)})`);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
          }, 0.5);
          break;
        }
        case "S": { // Syntax Snare — brackets fling outwards
          const chars = ["{", "}", "(", ")", "[", "]"];
          pushEffect((p, time) => {
            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.font = "18px monospace";
            for (let i = 0; i < 24; i++) {
              const angle = (i / 24) * Math.PI * 2 + time;
              const dist = Math.pow(p, 0.7) * Math.min(w, h) * 0.6;
              const x = Math.cos(angle) * dist;
              const y = Math.sin(angle) * dist;
              const glyph = chars[i % chars.length];
              const alpha = 0.8 * (1 - p);
              ctx.fillStyle = `rgba(120,255,210,${alpha})`;
              ctx.fillText(glyph, x, y);
            }
            ctx.restore();
          }, 0.45);
          break;
        }
        case "D": { // Cursor Strobe — alternating vertical bars
          pushEffect((p) => {
            const cols = 18;
            for (let i = 0; i < cols; i++) {
              const x = (i / cols) * w;
              const on = (i + Math.floor(p * 20)) % 2 === 0;
              if (on) {
                ctx.fillStyle = `rgba(120,255,210,${0.5 * (1 - p)})`;
                ctx.fillRect(x, 0, w / cols + 2, h);
              }
            }
          }, 0.4);
          break;
        }
        case "F": { // Color Mode — slow diagonal hue sweep in teal/magenta band
          pushEffect((p, time) => {
            const hueA = (160 + Math.sin(time * 1.4) * 40) % 360;
            const hueB = (280 + Math.cos(time * 1.1) * 40) % 360;
            const g = ctx.createLinearGradient(0, h, w, 0);
            g.addColorStop(0, `hsla(${hueA},80%,55%,${0.22 * (1 - p)})`);
            g.addColorStop(1, `hsla(${hueB},80%,60%,${0.22 * (1 - p)})`);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
          }, 1.2);
          break;
        }
        case "G": { // Bracket Tunnel — recursive bracket rings into depth
          pushEffect((p, time) => {
            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.font = "20px monospace";
            for (let i = 0; i < 10; i++) {
              const depth = i / 10;
              const scale = 0.4 + depth * 1.4 + p * 0.6;
              const alpha = (1 - depth) * 0.65 * (1 - p);
              ctx.save();
              ctx.scale(scale, scale);
              ctx.rotate(time * 0.8 + depth * 2);
              ctx.fillStyle = `rgba(120,255,210,${alpha})`;
              ctx.fillText("[    ]", -40, -40);
              ctx.fillText("{    }", -40, 10);
              ctx.fillText("(    )", -40, 60);
              ctx.restore();
            }
            ctx.restore();
          }, 0.9);
          break;
        }
        case "H": { // Caret Slice — big diagonal caret across screen
          pushEffect((p) => {
            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.rotate(-Math.PI / 4);
            const len = Math.max(w, h) * 1.2;
            ctx.strokeStyle = `rgba(120,255,210,${0.85 * (1 - p)})`;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(-len / 2, 0);
            ctx.lineTo(len / 2, 0);
            ctx.stroke();
            ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - p)})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(len / 2 - 30, -18);
            ctx.lineTo(len / 2, 0);
            ctx.lineTo(len / 2 - 30, 18);
            ctx.stroke();
            ctx.restore();
          }, 0.5);
          break;
        }
        case "J": { // Pixel Drift — teal bits drifting horizontally
          pushEffect((p, time) => {
            for (let i = 0; i < 80; i++) {
              const seed = i * 1337.9;
              const baseY = (seed * 1.7) % h;
              const baseX = (seed * 0.9) % w;
              const drift = Math.sin(time * 1.5 + seed) * 40;
              const x = (baseX + drift + p * 80) % w;
              const y = baseY + Math.sin(time * 2 + seed) * 10;
              const alpha = 0.3 + ((seed * 0.3) % 0.4) * (1 - p);
              ctx.fillStyle = `rgba(120,255,210,${alpha})`;
              ctx.fillRect(x, y, 4, 2);
            }
          }, 1.0);
          break;
        }
        case "K": { // Glyph Vortex — tiny characters spiraling in/out
          const chars = ["{", "}", "/", ">", "_"];
          pushEffect((p, time) => {
            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.font = "16px monospace";
            const dir = Math.sin(time * 0.8) > 0 ? 1 : -1;
            for (let i = 0; i < 80; i++) {
              const angle = (i / 80) * Math.PI * 2 + time * 2 * dir;
              const radius = (0.1 + p * 0.9) * Math.min(w, h) * (0.1 + (i / 80) * 0.8);
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const alpha = 0.6 * (1 - p);
              ctx.fillStyle = `rgba(120,255,210,${alpha})`;
              ctx.fillText(chars[i % chars.length], x, y);
            }
            ctx.restore();
          }, 0.9);
          break;
        }
        case "L": { // Infinite Editor — endless perspective grid with cursor
          pushBeat(w / 2, h / 2, 1.5, "120,255,210");
          pushEffect((p, time) => {
            ctx.save();
            ctx.translate(w / 2, h * 0.7);
            ctx.strokeStyle = `rgba(120,255,210,${0.25 * (1 - p)})`;
            ctx.lineWidth = 1;
            const depthLines = 18;
            for (let i = 0; i < depthLines; i++) {
              const z = i / depthLines;
              const y = -z * h * 0.9;
              const span = w * (0.2 + z * 1.4);
              ctx.beginPath();
              ctx.moveTo(-span, y);
              ctx.lineTo(span, y);
              ctx.stroke();
            }
            for (let i = -6; i <= 6; i++) {
              ctx.beginPath();
              ctx.moveTo(i * 40, 0);
              ctx.lineTo(i * 80, -h * 0.9);
              ctx.stroke();
            }
            const cy = -p * h * 0.7;
            ctx.fillStyle = `rgba(120,255,210,${0.9 * (1 - p)})`;
            ctx.fillRect(-2, cy - 16, 4, 32);
            ctx.restore();
          }, 0.9);
          break;
        }
      }
    },
  },
};

// ── Render ─────────────────────────────────────────────────────────────────────
function drawBeatBlips(dt) {
  for (let i = beatBlips.length - 1; i >= 0; i--) {
    const b = beatBlips[i];
    b.age += dt;
    const p = b.age / b.life;
    if (p >= 1) { beatBlips.splice(i, 1); continue; }
    const radius = 60 + p * 280 * b.strength;
    const alpha = (1 - p) * 0.55;
    ctx.strokeStyle = `rgba(${b.rgb},${alpha})`;
    ctx.lineWidth = Math.max(1, 4 * (1 - p));
    ctx.beginPath(); ctx.arc(b.x, b.y, radius, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawTransientEffects(dt, time) {
  for (let i = transientEffects.length - 1; i >= 0; i--) {
    const fx = transientEffects[i];
    fx.age += dt;
    const progress = fx.age / fx.life;
    if (progress >= 1) { transientEffects.splice(i, 1); continue; }
    fx.draw(progress, time);
  }
}

// ── Key Grid ───────────────────────────────────────────────────────────────────
function buildKeyGrid() {
  keyGrid.innerHTML = "";
  keyChipMap.clear();
  for (const def of SCENE_DEFS) {
    const chip = document.createElement("div");
    chip.className = "key-chip";
    chip.dataset.key = def.key;
    chip.innerHTML = `<strong>${def.key}</strong>${def.label}`;
    keyGrid.appendChild(chip);
    keyChipMap.set(def.key, chip);
  }
  for (const def of PRESETS[currentPreset].keyDefs) {
    const chip = document.createElement("div");
    chip.className = "key-chip";
    chip.dataset.key = def.key;
    chip.innerHTML = `<strong>${def.key}</strong>${def.label}`;
    keyGrid.appendChild(chip);
    keyChipMap.set(def.key, chip);
  }
}

// ── State ──────────────────────────────────────────────────────────────────────
function setScene(sceneId) {
  currentScene = sceneId;
  const def = SCENE_DEFS.find((d) => d.key === String(sceneId));
  sceneNameEl.textContent = def ? def.label : "Custom";
}

function applyPreset(id) {
  currentPreset = id;
  const preset = PRESETS[id];
  const [r, g, b] = preset.accent;
  document.documentElement.style.setProperty("--accent", `rgb(${r},${g},${b})`);
  document.documentElement.style.setProperty("--preset-accent-rgb", `${r},${g},${b}`);
  presetVibeEl.textContent = preset.vibe;
  buildKeyGrid();
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.preset) === id);
  });
}

function setHudCollapsed(collapsed) {
  hud.classList.toggle("collapsed", collapsed);
  hudToggle.textContent = collapsed ? "Expand" : "Minimize";
  hudToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
}

// ── Input ──────────────────────────────────────────────────────────────────────
function handleKeyDown(e) {
  if (e.key === "Tab") {
    e.preventDefault();
    applyPreset((currentPreset % 7) + 1);
    return;
  }
  const key = e.key.toUpperCase();
  if (key === ".") { setHudCollapsed(false); return; }
  if (activeKeys.has(key)) return;
  activeKeys.add(key);
  if (keyChipMap.has(key)) keyChipMap.get(key).classList.add("active");

  if (!hasAutoCollapsed && (keyChipMap.has(key) || /^[1-6]$/.test(key))) {
    hasAutoCollapsed = true;
    setHudCollapsed(true);
  }

  if (/^[1-6]$/.test(key)) {
    setScene(Number(key));
    pushBeat(w * 0.5, h * 0.5, 1.4);
  } else {
    PRESETS[currentPreset].trigger(key);
  }
}

function handleKeyUp(e) {
  const key = e.key.toUpperCase();
  activeKeys.delete(key);
  if (keyChipMap.has(key)) keyChipMap.get(key).classList.remove("active");
}

// ── Loop ───────────────────────────────────────────────────────────────────────
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  w = window.innerWidth; h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

let prev = performance.now();
function frame(now) {
  const dt = Math.min((now - prev) / 1000, 0.05);
  prev = now; t += dt;
  drawBaseScene(t);
  drawBeatBlips(dt);
  drawTransientEffects(dt, t);
  requestAnimationFrame(frame);
}

// ── Init ───────────────────────────────────────────────────────────────────────
applyPreset(1);
setScene(1);
resize();
window.addEventListener("resize", resize);
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
hudToggle.addEventListener("click", () => setHudCollapsed(!hud.classList.contains("collapsed")));
document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => applyPreset(Number(btn.dataset.preset)));
});
requestAnimationFrame(frame);
