# Collision-Aware Chaikin's Algorithm

**Course:** 2110512 Computer Animation
**Department:** Computer Engineering, Faculty of Engineering, Chulalongkorn University
**Semester:** Second Semester, Academic Year 2568 (2025/2026)
**Instructor:** Assoc. Prof. Pizzanu Kanongchaiyos, Ph.D.

**Authors:**
1. Phatorn Pitiphat (6531332121)
2. Sukrit Chanachaimongkonkun (6531345321)
3. Sathana Laolugsanalerd (6532180221)
4. Athiwat Kongkaeo (6531347621)
5. Chakit Prateepthintong (6531348221)

**GitHub:** [github.com/sumopht](https://github.com/sumopht)

---

## Problem

Procedurally animated agents (NPCs in games, animated crowds, virtual humans)
require a smoothing stage that turns a discrete waypoint sequence from a
planner (A*, RRT) into a C¹-continuous trajectory for procedural locomotion.
The classical baseline — **Chaikin's corner-cutting algorithm** — is
geometrically agnostic: the smoothed curve can pass *through* static
obstacles that the original polyline cleared.

This project investigates a hybrid scheme that combines Chaikin's
subdivision with an iterative constraint-projection solver in the spirit
of Position-Based Dynamics, plus an edge-aware re-subdivision step for
obstacles that bridge an entire edge.

## Approach

| | Method | Worst-case time | Notes |
|---|---|---|---|
| **Baseline** | Standard Chaikin | O(2ᵀ·N) per call | Obstacle-blind |
| **Proposed** | Collision-Aware Chaikin | O(2ᵀ·N · K · I) | Vertex projection + edge resolution |
| **SOTA reference** | PBD / XPBD | — | Conceptually similar, more general |

## Results (median over 20 deterministic trials)

| Regime | Baseline (μs) | Proposed (μs) | Resolved | Smooth (rad) |
|---|---:|---:|---:|---:|
| N=50, K=8 | 26 | 1296 | 65% | 0.30 |
| N=200, K=8 | 76 | 1455 | 25% | 0.58 |
| N=1000, K=8 | 768 | 574* | 50% | 2.09* |

\* The proposed method's `L_max=600` guard truncates output, so the comparison
is no longer apples-to-apples. See report §VI-G.

**Honest summary:** the proposed method buys collision-avoidance at
5–130× the runtime of the baseline. It works well for K ≤ 8 obstacles
and N ≤ 500 waypoints but degrades sharply with denser obstacle fields
(0% resolution at K=32). The full failure characterisation is in the
report's §VI-B.

## How to run

### Interactive demo (browser)
```bash
cd src/
# Open index.html in any modern browser (Chrome, Firefox, Safari, Edge).
# Click waypoints; press toolbar buttons for circle / rect obstacles;
# adjust subdivision params; press "Run Benchmark".
```
See `demo/README.md` for the demo walkthrough.

### Reproducible benchmark suite (Node.js)
```bash
cd experiments/
node run_benchmark.js          # ~30 s wall-clock, writes results/*.csv + .json
node export_scenarios.js       # writes results/scenarios.json
```

### Regenerate report figures (Python)
```bash
cd visualization/
pip install -r ../requirements.txt
python3 make_plots.py
python3 render_scenarios.py
```

### Tests
```bash
node tests/test_algorithm.js
```
16 invariant tests covering geometry primitives, baseline correctness,
collision reduction, endpoint preservation, and pathological inputs.

## Repository layout

```
computer-animation-project/
├── README.md                          ← this file
├── requirements.txt                   ← Python deps (matplotlib, numpy, Pillow)
├── report/
│   ├── final_report.pdf               ← 7-page IEEE-style report
│   ├── final_report.tex               ← LaTeX source
│   └── fig_*.pdf                      ← figure PDFs used by the LaTeX
├── src/
│   ├── index.html                     ← browser demo entry point
│   ├── main.js, renderer.js, style.css
│   └── algorithms/
│       ├── algo.js                    ← Standard + Collision-Aware Chaikin
│       └── benchmark.js               ← in-browser benchmark
├── experiments/
│   ├── run_benchmark.js               ← Node.js benchmark harness
│   ├── algo_node.js                   ← algo.js with CommonJS export
│   ├── export_scenarios.js            ← curated scenario paths → JSON
│   └── results/
│       ├── scaling.csv, density.csv, iters.csv
│       ├── results.json, scenarios.json
│       └── fig_*.{pdf,png}            ← figures used in the report
├── visualization/
│   ├── make_plots.py                  ← matplotlib figures
│   └── render_scenarios.py            ← side-by-side scenario figures
├── demo/
│   └── README.md                      ← demo walkthrough
├── data/
│   └── synthetic/
│       └── README.md                  ← data generation notes
└── tests/
    └── test_algorithm.js              ← 16 correctness tests
```

## Reproducibility

- The benchmark uses a deterministic Mulberry32 PRNG with fixed seeds per
  cell, so re-running on the same hardware/Node version reproduces every
  number in the report to within JIT noise (±10%).
- Hardware in our reference run: 2-core x86_64 Linux, Node v22.22 / V8 12.4.
- All 9 figures in the report are regenerated from the CSV data by the
  Python scripts; no hand-edited plots.

## Limitations (read these honestly)

1. **No worst-case correctness guarantee.** Resolution rate is empirical
   (25–85% in the operating regime, 0% for K≥16 overlapping obstacles).
2. **No mocap evaluation.** Mocap is 3D joint-trajectory data; this
   project is a 2D static-obstacle path smoother. The two domains do
   not overlap directly.
3. **Memory measurement is a heuristic** (64 B/vertex), not measured RSS.
4. **Single-threaded.** The algorithm parallelises naturally across
   edges but we did not implement a SIMD/WebGPU version.

See report §VII-B and §VII-C for full discussion.
# collision-aware-chaikin
