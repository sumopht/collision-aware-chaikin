"""
Plot generation from benchmark results.
Reads ../experiments/results/results.json and produces all figures.
"""
import json, os
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.ticker import LogLocator, FuncFormatter

# IEEE-friendly style
plt.rcParams.update({
    'font.family':       'serif',
    'font.size':          9,
    'axes.titlesize':     10,
    'axes.labelsize':     9,
    'legend.fontsize':    8,
    'xtick.labelsize':    8,
    'ytick.labelsize':    8,
    'figure.dpi':         110,
    'savefig.dpi':        300,
    'savefig.bbox':       'tight',
    'lines.linewidth':    1.6,
    'lines.markersize':   5,
    'axes.grid':          True,
    'grid.alpha':         0.30,
    'grid.linestyle':     '--',
    'grid.linewidth':     0.5,
})

OUT = '../experiments/results'
with open(os.path.join(OUT, 'results.json')) as f:
    R = json.load(f)

# ── Figure 1: Runtime scaling (log-log) ───────────────────────────────────────
def fig_runtime_scaling():
    s = R['scaling']
    n   = np.array([r['n']             for r in s])
    sT  = np.array([r['stdT_median']   for r in s])
    aT  = np.array([r['awaT_median']   for r in s])
    sP  = np.array([r['stdT_p95']      for r in s])
    aP  = np.array([r['awaT_p95']      for r in s])

    fig, ax = plt.subplots(figsize=(3.5, 2.6))
    ax.fill_between(n, sT, sP, alpha=0.18, color='#f59e0b', linewidth=0)
    ax.fill_between(n, aT, aP, alpha=0.18, color='#10b981', linewidth=0)
    ax.plot(n, sT, '-o', color='#d97706', label='Baseline (Standard Chaikin)')
    ax.plot(n, aT, '-s', color='#059669', label='Proposed (Collision-Aware)')
    # O(N) reference line — use baseline's N=200 point as anchor (mid-range,
    # representative of the post-warmup linear regime). Anchoring at N=5 sits
    # in the constant-overhead region and exaggerates the line.
    anchor_n, anchor_t = n[5], sT[5]
    ref = anchor_t * (n / anchor_n)
    ax.plot(n, ref, ':', color='gray', alpha=0.7, label='O(N) reference')
    ax.set_xscale('log'); ax.set_yscale('log')
    ax.set_xlabel('Number of input waypoints, N')
    ax.set_ylabel('Runtime (μs/call), median ± p95')
    ax.set_title('Runtime scaling, K=8 obstacles, iters=4')
    ax.legend(loc='upper left', framealpha=0.9)
    fig.savefig(os.path.join(OUT, 'fig_runtime_scaling.pdf'))
    fig.savefig(os.path.join(OUT, 'fig_runtime_scaling.png'))
    plt.close(fig)
    print('  fig_runtime_scaling: ok')

# ── Figure 2: Resolution rate vs N ────────────────────────────────────────────
def fig_resolution_rate():
    s = R['scaling']
    n  = np.array([r['n']              for r in s])
    rr = np.array([r['resolutionRate'] for r in s]) * 100

    fig, ax = plt.subplots(figsize=(3.5, 2.4))
    ax.plot(n, rr, '-D', color='#0369a1', label='% trials with zero residual collisions')
    ax.axhline(100, color='gray', linestyle=':', alpha=0.5)
    ax.set_xscale('log')
    ax.set_xlabel('Number of input waypoints, N')
    ax.set_ylabel('Resolution rate (%)')
    ax.set_title('Constraint solver convergence, K=8')
    ax.set_ylim(0, 105)
    ax.legend(loc='lower left', framealpha=0.9)
    fig.savefig(os.path.join(OUT, 'fig_resolution_rate.pdf'))
    fig.savefig(os.path.join(OUT, 'fig_resolution_rate.png'))
    plt.close(fig)
    print('  fig_resolution_rate: ok')

# ── Figure 3: Obstacle density — runtime + resolution ─────────────────────────
def fig_density():
    d = R['density']
    k   = np.array([r['k']              for r in d])
    aT  = np.array([r['awaT_median']    for r in d])
    rr  = np.array([r['resolutionRate'] for r in d]) * 100
    res = np.array([r['awaViol_p95']    for r in d])  # p95 residual

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(7.0, 2.6))
    ax1.plot(k, aT, '-s', color='#059669')
    ax1.set_xlabel('Number of obstacles, K')
    ax1.set_ylabel('Runtime (μs/call), median')
    ax1.set_title('(a) Runtime vs obstacle density, N=200')

    ax2.bar(k - 0.6, rr, width=1.2, color='#0369a1',
            label='Resolution rate (%)', alpha=0.85)
    ax2.set_xlabel('Number of obstacles, K')
    ax2.set_ylabel('Resolution rate (%)', color='#0369a1')
    ax2.tick_params(axis='y', labelcolor='#0369a1')
    ax2.set_ylim(0, 105)
    ax2.set_title('(b) Convergence vs obstacle density, N=200')
    ax2b = ax2.twinx()
    ax2b.grid(False)
    ax2b.plot(k, res, '-^', color='#dc2626', label='p95 residual violations')
    ax2b.set_ylabel('p95 residual violations', color='#dc2626')
    ax2b.tick_params(axis='y', labelcolor='#dc2626')
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, 'fig_density.pdf'))
    fig.savefig(os.path.join(OUT, 'fig_density.png'))
    plt.close(fig)
    print('  fig_density: ok')

# ── Figure 4: Iteration sensitivity ───────────────────────────────────────────
def fig_iter_sensitivity():
    it = R['iters']
    i   = np.array([r['iters']           for r in it])
    aT  = np.array([r['awaT_median']     for r in it])
    sm  = np.array([r['awaSmooth_mean']  for r in it])

    fig, ax1 = plt.subplots(figsize=(3.5, 2.4))
    color1 = '#059669'; color2 = '#7c3aed'
    ax1.plot(i, aT, '-s', color=color1, label='Runtime (μs)')
    ax1.set_xlabel('Subdivision iterations')
    ax1.set_ylabel('Runtime (μs)', color=color1)
    ax1.tick_params(axis='y', labelcolor=color1)
    ax2 = ax1.twinx()
    ax2.grid(False)
    ax2.plot(i, sm, '-o', color=color2, label='Mean |turn angle| (rad)')
    ax2.set_ylabel('Mean |turn angle| (rad)', color=color2)
    ax2.tick_params(axis='y', labelcolor=color2)
    fig.suptitle('Iteration sensitivity, N=200, K=8', y=0.98)
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, 'fig_iter_sensitivity.pdf'))
    fig.savefig(os.path.join(OUT, 'fig_iter_sensitivity.png'))
    plt.close(fig)
    print('  fig_iter_sensitivity: ok')

# ── Figure 5: Smoothness/path-length quality (one bar plot per algorithm) ─────
def fig_quality():
    s = R['scaling']
    n   = np.array([r['n']              for r in s])
    ssm = np.array([r['stdSmooth_mean'] for r in s])
    asm = np.array([r['awaSmooth_mean'] for r in s])
    sln = np.array([r['stdLen_mean']    for r in s])
    aln = np.array([r['awaLen_mean']    for r in s])

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(7.0, 2.6))
    ax1.plot(n, ssm, '-o', color='#d97706', label='Baseline')
    ax1.plot(n, asm, '-s', color='#059669', label='Proposed')
    ax1.set_xscale('log')
    ax1.set_xlabel('Number of waypoints, N')
    ax1.set_ylabel('Mean |turn angle| (rad)')
    ax1.set_title('(a) Path smoothness — lower is smoother')
    ax1.legend()
    ratio = aln / np.maximum(sln, 1e-9)
    ax2.plot(n, ratio, '-D', color='#7c3aed')
    ax2.axhline(1.0, color='gray', linestyle=':', alpha=0.5)
    ax2.set_xscale('log')
    ax2.set_xlabel('Number of waypoints, N')
    ax2.set_ylabel('Length ratio (proposed / baseline)')
    ax2.set_title('(b) Path-length overhead from detours')
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, 'fig_quality.pdf'))
    fig.savefig(os.path.join(OUT, 'fig_quality.png'))
    plt.close(fig)
    print('  fig_quality: ok')

print('Generating figures...')
fig_runtime_scaling()
fig_resolution_rate()
fig_density()
fig_iter_sensitivity()
fig_quality()
print('Done.')
