# Synthetic data

This project uses **only synthetic data**. Per the project brief, motion
capture data is not used — mocap is 3D joint-trajectory data and does
not directly correspond to the 2D static-obstacle path-smoothing
problem we study.

## How synthetic inputs are generated

All synthetic inputs are generated **deterministically** at benchmark
time by `experiments/run_benchmark.js`. We do not store the inputs as
files; instead, the same Mulberry32 PRNG seeded with cell-dependent
constants reproduces them exactly on demand. This keeps the repository
small (a few hundred KB) without sacrificing reproducibility.

### Waypoint paths
- Random x,y coordinates in an 800×600 canvas with a 60-px margin.
- Sizes evaluated: N ∈ {5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000}.

### Obstacles
- Mix of axis-aligned rectangles (width and height 30–110 px) and discs
  (radius 20–60 px), placed uniformly at random in the canvas.
- Counts evaluated: K ∈ {0, 4, 8, 16, 32}.

### Curated scenarios
Three hand-built scenes from `experiments/export_scenarios.js`:
- **corridor** — 4 waypoints, 3 wall fingers (rectangles).
- **pillars** — 2 waypoints, 3 circular pillars.
- **narrow** — 3 waypoints, 2 rectangles forming a gap.

These are the same scenes used by the `Maze Corridor`, `Room & Pillars`,
and `Narrow Gap` presets in the interactive demo.

## Reproducing the inputs

```bash
cd ../experiments
node run_benchmark.js          # generates and runs all benchmarks
node export_scenarios.js       # writes scenarios.json with full paths
```

Both write to `experiments/results/`.
