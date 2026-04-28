'use strict';
const fs   = require('fs');
const Algo = require('./algo_node.js');

// Hand-crafted scenarios that showcase the algorithm difference
const scenarios = {
  corridor: {
    title: 'Maze corridor',
    waypoints: [{x: 80, y: 300}, {x: 300, y: 300}, {x: 500, y: 300}, {x: 720, y: 300}],
    obstacles: [
      { type: 'rect', x: 200, y: 100, w: 30, h: 200 },   // top wall finger
      { type: 'rect', x: 380, y: 300, w: 30, h: 200 },   // bottom wall finger
      { type: 'rect', x: 560, y: 100, w: 30, h: 200 },   // top wall finger
    ],
  },
  pillars: {
    title: 'Room with pillars',
    waypoints: [{x: 80, y: 300}, {x: 720, y: 300}],
    obstacles: [
      { type: 'circle', x: 200, y: 280, r: 40 },
      { type: 'circle', x: 400, y: 320, r: 50 },
      { type: 'circle', x: 600, y: 280, r: 35 },
    ],
  },
  narrow: {
    title: 'Narrow gap',
    waypoints: [{x: 80, y: 200}, {x: 400, y: 300}, {x: 720, y: 400}],
    obstacles: [
      { type: 'rect', x: 350, y: 100, w: 100, h: 160 },
      { type: 'rect', x: 350, y: 340, w: 100, h: 160 },
    ],
  },
};

const out = {};
for (const [name, sc] of Object.entries(scenarios)) {
  const std = Algo.standardChaikin(sc.waypoints, 4, 0.25);
  const awa = Algo.collisionAwareChaikin(sc.waypoints, sc.obstacles, 4, 0.25, 1.0, 5);
  const stdViol = Algo.findCollisions(std.path, sc.obstacles).length;
  const awaViol = Algo.findCollisions(awa.path, sc.obstacles).length;
  out[name] = {
    title: sc.title,
    waypoints: sc.waypoints,
    obstacles: sc.obstacles,
    stdPath: std.path,
    awaPath: awa.path,
    stdN: std.path.length, awaN: awa.path.length,
    stdViol, awaViol,
    stdT_us: std.timeUs, awaT_us: awa.timeUs,
    awaResolved: awa.resolved,
  };
}

fs.writeFileSync('/home/claude/bench/results/scenarios.json',
  JSON.stringify(out, null, 2));
console.error('Exported scenarios:', Object.keys(out));
