"""Render side-by-side scenario figures from ../experiments/results/scenarios.json"""
import json, os
import matplotlib.pyplot as plt
import matplotlib.patches as mp

OUT = '../experiments/results'

plt.rcParams.update({
    'font.family': 'serif',
    'font.size': 9,
    'figure.dpi': 110,
    'savefig.dpi': 300,
    'savefig.bbox': 'tight',
})

with open(os.path.join(OUT, 'scenarios.json')) as f:
    S = json.load(f)

def draw_scene(ax, sc, path, label, color, viol_count):
    # Draw obstacles
    for o in sc['obstacles']:
        if o['type'] == 'circle':
            ax.add_patch(mp.Circle((o['x'], o['y']), o['r'],
                facecolor='#fde68a', edgecolor='#92400e', linewidth=1.0, alpha=0.9))
        else:
            ax.add_patch(mp.Rectangle((o['x'], o['y']), o['w'], o['h'],
                facecolor='#fde68a', edgecolor='#92400e', linewidth=1.0, alpha=0.9))
    # Draw waypoints
    wx = [p['x'] for p in sc['waypoints']]
    wy = [p['y'] for p in sc['waypoints']]
    ax.plot(wx, wy, 'o', color='#1e3a8a', markersize=7,
            markerfacecolor='#3b82f6', label='Waypoint', zorder=5)
    # Draw smoothed path
    px = [p['x'] for p in path]
    py = [p['y'] for p in path]
    ax.plot(px, py, '-', color=color, linewidth=2.0, label=label)
    # Highlight violation points (path vertices INSIDE obstacles)
    if viol_count > 0:
        viol_pts = []
        for p in path:
            for o in sc['obstacles']:
                if o['type'] == 'circle':
                    d = ((p['x']-o['x'])**2 + (p['y']-o['y'])**2) ** 0.5
                    if d < o['r']:
                        viol_pts.append((p['x'], p['y'])); break
                else:
                    if (o['x'] <= p['x'] <= o['x']+o['w']
                        and o['y'] <= p['y'] <= o['y']+o['h']):
                        viol_pts.append((p['x'], p['y'])); break
        if viol_pts:
            vx, vy = zip(*viol_pts)
            ax.plot(vx, vy, 'x', color='#dc2626', markersize=8,
                    markeredgewidth=2, label=f'Violation ({len(viol_pts)})', zorder=6)
    ax.set_xlim(0, 800); ax.set_ylim(500, 100)   # invert Y to match canvas
    ax.set_aspect('equal'); ax.set_xticks([]); ax.set_yticks([])
    for s in ax.spines.values(): s.set_color('#9ca3af')
    ax.legend(loc='upper right', framealpha=0.95, fontsize=7)

def render_scenario(name):
    sc = S[name]
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(7.0, 2.6))
    draw_scene(a1, sc, sc['stdPath'],
               f"Baseline ({sc['stdN']} pts, {sc['stdT_us']:.0f}μs)",
               '#d97706', sc['stdViol'])
    a1.set_title(f"(a) Standard Chaikin — {sc['stdViol']} collisions",
                 fontsize=9, color='#b45309')
    awalabel = ('Resolved' if sc['awaResolved'] else 'Partial')
    draw_scene(a2, sc, sc['awaPath'],
               f"Proposed ({sc['awaN']} pts, {sc['awaT_us']:.0f}μs)",
               '#059669', sc['awaViol'])
    a2.set_title(f"(b) Collision-Aware — {sc['awaViol']} residual ({awalabel})",
                 fontsize=9, color='#047857')
    fig.suptitle(sc['title'], y=1.02)
    fig.tight_layout()
    p = os.path.join(OUT, f'fig_scenario_{name}')
    fig.savefig(p + '.pdf'); fig.savefig(p + '.png')
    plt.close(fig)
    print(f'  fig_scenario_{name}: ok '
          f'(std viol={sc["stdViol"]}, awa viol={sc["awaViol"]})')

print('Rendering scenarios...')
for name in S: render_scenario(name)
print('Done.')
