/**
 * Comprehensive benchmark harness for Collision-Aware Chaikin.
 *
 * Measures:
 *   - Runtime (μs/call), with multiple reps and warm-up
 *   - Output path size (vertex count)
 *   - Memory estimate (bytes — JS object header heuristic, identical to demo)
 *   - Resolution rate (% trials where all collisions are resolved)
 *   - Total constraint pushes (work done by solver)
 *   - Curvature smoothness (mean absolute turning angle, radians)
 *   - Path length ratio (proposed / baseline)
 *
 * Configurations:
 *   - Scaling test: N ∈ {5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000}
 *   - Obstacle density test: K ∈ {0, 4, 8, 16, 32}
 *   - Iteration sensitivity: subdivision iters ∈ {2, 3, 4, 5, 6}
 *
 * Reproducibility:
 *   - Deterministic PRNG (mulberry32) so results don't drift between runs
 *   - 5 trials per cell, mean reported, plus stdev
 */

'use strict';
const fs   = require('fs');
const path = require('path');
const Algo = require('./algo_node.js');

// ── Deterministic RNG ──────────────────────────────────────────────────────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Generators ─────────────────────────────────────────────────────────────────
function randomPath(n, w, h, rng) {
  const m = 60, pts = [];
  for (let i = 0; i < n; i++) {
    pts.push({ x: m + rng() * (w - 2 * m), y: m + rng() * (h - 2 * m) });
  }
  return pts;
}

function randomObstacles(k, w, h, rng) {
  const obs = [];
  for (let i = 0; i < k; i++) {
    if (rng() < 0.5) {
      obs.push({ type: 'circle',
        x: 100 + rng() * (w - 200), y: 100 + rng() * (h - 200),
        r: 20 + rng() * 40 });
    } else {
      const bw = 30 + rng() * 80, bh = 30 + rng() * 80;
      obs.push({ type: 'rect',
        x: 100 + rng() * (w - 200), y: 100 + rng() * (h - 200),
        w: bw, h: bh });
    }
  }
  return obs;
}

// ── Curvature smoothness: mean |turn angle| at interior vertices ──────────────
function meanAbsTurnAngle(pts) {
  if (pts.length < 3) return 0;
  let sum = 0, count = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const v1x = b.x - a.x, v1y = b.y - a.y;
    const v2x = c.x - b.x, v2y = c.y - b.y;
    const m1 = Math.hypot(v1x, v1y), m2 = Math.hypot(v2x, v2y);
    if (m1 < 1e-9 || m2 < 1e-9) continue;
    const cosA = Math.max(-1, Math.min(1,
      (v1x * v2x + v1y * v2y) / (m1 * m2)));
    sum += Math.acos(cosA);
    count++;
  }
  return count ? sum / count : 0;
}

function pathLength(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) {
    s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return s;
}

function memoryBytes(pts) { return pts.length * 64; }   // matches demo heuristic

// ── Single trial ───────────────────────────────────────────────────────────────
function trial(n, k, iters, rng) {
  const W = 800, H = 600;
  const wps = randomPath(n, W, H, rng);
  const obs = randomObstacles(k, W, H, rng);

  // Standard
  const tS0 = process.hrtime.bigint();
  const stdRes = Algo.standardChaikin(wps, iters, 0.25);
  const tS1 = process.hrtime.bigint();
  const stdT = Number(tS1 - tS0) / 1000;     // μs

  // Aware
  const tA0 = process.hrtime.bigint();
  const awa = Algo.collisionAwareChaikin(wps, obs, iters, 0.25, 1.0, 5);
  const tA1 = process.hrtime.bigint();
  const awaT = Number(tA1 - tA0) / 1000;     // μs

  const stdViol = Algo.findCollisions(stdRes.path, obs).length;
  const awaViol = Algo.findCollisions(awa.path,    obs).length;

  return {
    n, k, iters,
    stdT, awaT,
    stdN: stdRes.path.length,
    awaN: awa.path.length,
    stdMem: memoryBytes(stdRes.path),
    awaMem: memoryBytes(awa.path),
    stdViol, awaViol,
    awaResolved: awaViol === 0,
    awaPushes: awa.totalPushes,
    stdSmooth: meanAbsTurnAngle(stdRes.path),
    awaSmooth: meanAbsTurnAngle(awa.path),
    stdLen: pathLength(stdRes.path),
    awaLen: pathLength(awa.path),
  };
}

function aggregate(rows) {
  const mean   = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const median = (xs) => {
    const s = [...xs].sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const p95 = (xs) => {
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))];
  };
  const stdev = (xs) => {
    const m = mean(xs);
    return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
  };
  const out = { n: rows[0].n, k: rows[0].k, iters: rows[0].iters, trials: rows.length };
  const fields = ['stdT', 'awaT', 'stdN', 'awaN', 'stdMem', 'awaMem',
                  'stdViol', 'awaViol', 'awaPushes',
                  'stdSmooth', 'awaSmooth', 'stdLen', 'awaLen'];
  for (const f of fields) {
    const xs = rows.map(r => r[f]);
    out[f + '_mean']   = mean(xs);
    out[f + '_median'] = median(xs);
    out[f + '_p95']    = p95(xs);
    out[f + '_std']    = stdev(xs);
  }
  out.resolutionRate = mean(rows.map(r => r.awaResolved ? 1 : 0));
  // Speedup based on MEDIAN — robust to outliers
  out.speedupRatio   = out.awaT_median / Math.max(out.stdT_median, 1e-6);
  return out;
}

// ── Suites ─────────────────────────────────────────────────────────────────────
function run() {
  const TRIALS_PER_CELL = 20;
  const WARMUP_TRIALS   = 5;

  // Warm-up — let V8 optimize hot paths
  console.error('[warmup]');
  const wRng = mulberry32(0xC0FFEE);
  for (let w = 0; w < WARMUP_TRIALS; w++) {
    trial(500, 8, 4, wRng);
  }

  const results = { scaling: [], density: [], iters: [] };

  // Suite 1: scaling test (N varies, K=8 obstacles, iters=4)
  console.error('[scaling]');
  const Ns = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
  for (const n of Ns) {
    const rows = [];
    for (let t = 0; t < TRIALS_PER_CELL; t++) {
      const rng = mulberry32(0xDEAD0000 + n * 1000 + t);
      rows.push(trial(n, 8, 4, rng));
    }
    const agg = aggregate(rows);
    results.scaling.push(agg);
    console.error(`  N=${n}\tstd=${agg.stdT_median.toFixed(1)}μs\taware=${agg.awaT_median.toFixed(1)}μs\tresolved=${(agg.resolutionRate*100).toFixed(0)}%`);
  }

  // Suite 2: obstacle density (N=200 fixed, K varies)
  console.error('[density]');
  const Ks = [0, 4, 8, 16, 32];
  for (const k of Ks) {
    const rows = [];
    for (let t = 0; t < TRIALS_PER_CELL; t++) {
      const rng = mulberry32(0xBEEF0000 + k * 1000 + t);
      rows.push(trial(200, k, 4, rng));
    }
    const agg = aggregate(rows);
    results.density.push(agg);
    console.error(`  K=${k}\taware=${agg.awaT_median.toFixed(1)}μs\tpushes=${agg.awaPushes_mean.toFixed(0)}\tresolved=${(agg.resolutionRate*100).toFixed(0)}%\tresidual_p95=${agg.awaViol_p95.toFixed(0)}`);
  }

  // Suite 3: iteration sensitivity (N=200, K=8, iters varies)
  console.error('[iters]');
  const Is = [2, 3, 4, 5, 6];
  for (const i of Is) {
    const rows = [];
    for (let t = 0; t < TRIALS_PER_CELL; t++) {
      const rng = mulberry32(0xCAFE0000 + i * 1000 + t);
      rows.push(trial(200, 8, i, rng));
    }
    const agg = aggregate(rows);
    results.iters.push(agg);
    console.error(`  i=${i}\taware=${agg.awaT_median.toFixed(1)}μs\toutN=${agg.awaN_mean.toFixed(0)}\tsmooth=${agg.awaSmooth_mean.toFixed(3)}rad`);
  }

  // Environment
  results.env = {
    node:    process.version,
    v8:      process.versions.v8,
    platform:process.platform,
    arch:    process.arch,
    cpus:    require('os').cpus()[0].model,
    cores:   require('os').cpus().length,
    totalMemMB: (require('os').totalmem() / 1024 / 1024).toFixed(0),
    timestamp: new Date().toISOString(),
  };
  console.error('[env]', results.env);

  // Persist
  const outDir = path.join(__dirname, 'results');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2));

  // CSV exports
  const csv = (rows, cols) =>
    [cols.join(',')]
      .concat(rows.map(r => cols.map(c =>
        typeof r[c] === 'number' ? r[c].toFixed(4) : String(r[c])).join(',')))
      .join('\n');

  const scaleCols = ['n','k','iters','trials',
                     'stdT_median','stdT_p95','stdT_std',
                     'awaT_median','awaT_p95','awaT_std',
                     'stdN_mean','awaN_mean','stdMem_mean','awaMem_mean',
                     'stdViol_mean','awaViol_mean','awaViol_p95','awaPushes_mean',
                     'stdSmooth_mean','awaSmooth_mean',
                     'stdLen_mean','awaLen_mean','resolutionRate','speedupRatio'];

  fs.writeFileSync(path.join(outDir, 'scaling.csv'), csv(results.scaling, scaleCols));
  fs.writeFileSync(path.join(outDir, 'density.csv'), csv(results.density, scaleCols));
  fs.writeFileSync(path.join(outDir, 'iters.csv'),   csv(results.iters,   scaleCols));

  console.error('\nResults written to', outDir);
}

run();
