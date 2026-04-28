/**
 * Correctness tests for Collision-Aware Chaikin.
 * Run with: node tests/test_algorithm.js
 *
 * These are not unit tests in the xunit sense — they assert
 * algorithmic invariants that must hold regardless of input,
 * and they fail loudly with a non-zero exit code.
 */
'use strict';
const Algo = require('../experiments/algo_node.js');

let pass = 0, fail = 0;
function check(name, cond, msg = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else      { fail++; console.error(`  ✗ ${name}  ${msg}`); }
}

console.log('--- Geometry primitives ---');
check('point in circle', Algo.testPoint(50, 50, {type:'circle',x:50,y:50,r:10}).inside);
check('point outside circle', !Algo.testPoint(100, 50, {type:'circle',x:50,y:50,r:10}).inside);
check('point in rect', Algo.testPoint(15, 15, {type:'rect',x:10,y:10,w:20,h:20}).inside);
check('point on edge of rect (outside)', !Algo.testPoint(31, 15, {type:'rect',x:10,y:10,w:20,h:20}).inside);

const segHit = Algo.segmentVsObstacle(0, 50, 100, 50, {type:'circle',x:50,y:50,r:10});
check('segment-circle hit', segHit.hit && segHit.tEntry < segHit.tExit);
const segMiss = Algo.segmentVsObstacle(0, 100, 100, 100, {type:'circle',x:50,y:50,r:10});
check('segment-circle miss', !segMiss.hit);

console.log('\n--- Standard Chaikin ---');
const wps = [{x:0,y:0}, {x:100,y:0}, {x:100,y:100}, {x:0,y:100}];
const std4 = Algo.standardChaikin(wps, 4, 0.25);
check('endpoints preserved', std4.path[0].x === 0 && std4.path[0].y === 0
                          && std4.path[std4.path.length-1].x === 0
                          && std4.path[std4.path.length-1].y === 100);
check('output grows with iteration count',
      Algo.standardChaikin(wps, 1, 0.25).path.length
    < Algo.standardChaikin(wps, 4, 0.25).path.length);
check('alpha=0.25 produces ~2x vertices per pass',
      std4.path.length >= 2 ** 4 * (wps.length - 1));

console.log('\n--- Collision-Aware Chaikin ---');
const obstacles = [
  {type:'rect', x:200, y:100, w:30, h:200},
  {type:'rect', x:380, y:300, w:30, h:200},
  {type:'rect', x:560, y:100, w:30, h:200},
];
const wps2 = [{x:80,y:300},{x:300,y:300},{x:500,y:300},{x:720,y:300}];
const stdRes = Algo.standardChaikin(wps2, 4, 0.25);
const awa    = Algo.collisionAwareChaikin(wps2, obstacles, 4, 0.25, 1.0, 5);

const stdViol = Algo.findCollisions(stdRes.path, obstacles).length;
const awaViol = Algo.findCollisions(awa.path,    obstacles).length;
console.log(`  baseline violations: ${stdViol}, proposed violations: ${awaViol}`);

check('baseline has violations on this scene', stdViol > 0);
check('proposed reduces violations', awaViol < stdViol,
      `expected awaViol(${awaViol}) < stdViol(${stdViol})`);
check('proposed preserves endpoints',
      Math.abs(awa.path[0].x - wps2[0].x) < 1e-6 &&
      Math.abs(awa.path[awa.path.length-1].x - wps2[wps2.length-1].x) < 1e-6);
check('proposed terminates (output bounded)', awa.path.length < 1000);

console.log('\n--- Pathological inputs ---');
check('empty obstacles → no extra work',
      Algo.collisionAwareChaikin(wps2, [], 4, 0.25, 1.0, 5).path.length
    === Algo.standardChaikin(wps2, 4, 0.25).path.length);
check('single waypoint → identity',
      Algo.standardChaikin([{x:0,y:0}], 4, 0.25).path.length === 1);
check('two waypoints → still gets subdivided (corner cutting on single edge)',
      Algo.standardChaikin([{x:0,y:0},{x:100,y:0}], 4, 0.25).path.length > 2);

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail === 0 ? 0 : 1);
