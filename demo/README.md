# Demo Walkthrough

The demo is an **interactive browser application** at `src/index.html`.
No build step required — open the file in any modern browser.

## What the demo shows

The required three demo elements (per project brief):

1. **Sample input.** Click anywhere on the canvas to place waypoints.
   Switch to "Circle Obstacle" or "Rect Obstacle" mode to add static
   obstacles. Four built-in presets (Maze Corridor, Room & Pillars,
   Narrow Gap, Stress Test) reproduce the curated scenarios from the
   report.

2. **Algorithm operation.** Both the Standard Chaikin (orange) and the
   Collision-Aware (green) curves are drawn live on every change. Toggle
   each curve, the waypoints, the collision-violation markers (red ×),
   and the constraint push vectors using the Display panel.
   The "Subdivision Iterations", "Cut Ratio (α)", "Push Strength", and
   "Max Push Iterations" sliders let you watch the algorithm respond
   in real time.

3. **Performance numbers.** The header HUD shows live FPS, current
   vertex count, and per-frame solve time. The bottom-left "Comparison"
   panel compares both methods side-by-side: vertex count, residual
   collision count, and solve time in microseconds. Click "Run
   Benchmark" to launch the in-browser scaling test (N = 5 … 5000),
   which renders a runtime-vs-N chart in the right panel.

## Suggested 90-second walkthrough

1. **Empty canvas.** Click 5 waypoints across the canvas. Both curves
   appear; they are nearly identical with no obstacles.
2. **Add an obstacle.** Switch to "Circle Obstacle" mode, click in the
   middle of the path. The Standard Chaikin curve now passes
   straight through the disc (red × markers); the Collision-Aware
   curve detours around it.
3. **Stress it.** Press the "Stress Test" preset. Many obstacles, many
   waypoints. Watch the resolution-rate degrade — some collisions
   remain unresolved (the report's §VI-B failure mode).
4. **Run the benchmark.** Click "Run Benchmark". After ~10 s, the chart
   shows runtime vs N for both algorithms on log-log axes.

## Recording a video demo (optional, ungraded)

If submitting a video demo per the brief's recommendation:
- 60–90 seconds is sufficient.
- Show the four steps above with brief on-screen captions.
- Upload as YouTube *Unlisted* and put the URL at the top of this file.

## Backend benchmark (CLI)

If a browser is unavailable, the same algorithms can be exercised from
the command line:

```bash
node ../experiments/run_benchmark.js
```

This runs three test suites (scaling, density, iteration sensitivity)
and writes the same numbers used in the report's tables.
