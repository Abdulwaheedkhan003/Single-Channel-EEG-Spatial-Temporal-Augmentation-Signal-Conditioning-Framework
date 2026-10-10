// Generates the animated SVGs used by README.md.
// GitHub strips <script>, <style> and <canvas> from READMEs, but it does render
// SVG files referenced as images, including their CSS animations. Every moving
// part of the README is therefore a self-contained SVG written by this script.
//
//   node scripts/generate_assets.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = new URL('../assets/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";
const C = {
  bg: '#010210', card: '#0C1030', bord: '#182050', cyan: '#00CFFF', pur: '#8B5CF6',
  grn: '#00F5A0', amb: '#FFB800', red: '#FF5F77', txt: '#D4DEFF', mut: '#7A8BBE', wh: '#FFFFFF',
};
const BASE_CSS = `.s{font-family:${SANS}}.m{font-family:${MONO}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const TAU = Math.PI * 2;

function svg(w, h, title, css, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>${BASE_CSS}
${css}</style>
${body}
</svg>
`;
}

// Path covering two tiles of width W, so translating it by -W loops seamlessly.
// fn takes u in [0,1) and must be periodic in u.
function loopPath(fn, W, x0, yc, step) {
  let d = '';
  for (let x = 0; x <= W * 2; x += step) {
    d += `${x === 0 ? 'M' : 'L'}${x0 + x},${(yc + fn((x % W) / W)).toFixed(1)}`;
  }
  return d;
}

function wrap(text, max) {
  const lines = [];
  let cur = '';
  for (const word of text.split(' ')) {
    if (cur && (cur + ' ' + word).length > max) { lines.push(cur); cur = word; }
    else cur = cur ? cur + ' ' + word : word;
  }
  if (cur) lines.push(cur);
  return lines;
}

// ── hero: oscilloscope + headline stats ─────────────────────────────────────
function hero() {
  const W = 880, H = 396;
  const sx = 50, sy = 56, sw = 780, sh = 170; // screen
  const mid = sy + sh / 2;

  const eeg = (u) => {
    const beta = 14 * Math.sin(TAU * 55 * u) + 9 * Math.sin(TAU * 67 * u) + 5 * Math.sin(TAU * 76 * u);
    const alpha = 10 * Math.sin(TAU * 30 * u + 0.5);
    const delta = 4 * Math.sin(TAU * u);
    const gamma = 2.5 * Math.sin(TAU * 116 * u);
    const env = Math.max(0, (Math.sin(TAU * u) - 0.93) / 0.07);
    return beta + alpha * 0.45 + delta + gamma * 0.3 + env * 22 * Math.sin(TAU * 24 * u);
  };
  const bands = [
    { l: 'δ', c: '#3A8AC4', n: 2 }, { l: 'θ', c: '#7A52B8', n: 5 }, { l: 'α', c: '#3A9A74', n: 9 },
    { l: 'β', c: '#B08A10', n: 20 }, { l: 'γ', c: '#B03A50', n: 43 },
  ];

  let grid = '';
  for (let x = sx; x <= sx + sw; x += 40) grid += `<path d="M${x},${sy}V${sy + sh}"/>`;
  for (let y = sy; y <= sy + sh; y += 28) grid += `<path d="M${sx},${y}H${sx + sw}"/>`;

  const bandTraces = bands.map((b, i) => {
    const yc = sy + sh * (0.15 + i * 0.16);
    return `<path d="${loopPath((u) => 8 * Math.sin(TAU * b.n * u + i), sw, sx, yc, 2)}" stroke="${b.c}" stroke-opacity=".45" stroke-width=".9" fill="none"/>`;
  }).join('\n');
  const bandLabels = bands.map((b, i) =>
    `<text class="m" x="${sx + 5}" y="${(sy + sh * (0.15 + i * 0.16) - 9).toFixed(0)}" font-size="10" fill="${b.c}">${b.l}</text>`).join('');

  const main = loopPath(eeg, sw, sx, mid, 1);

  const stats = [
    ['83.1', '%', '', 'Peak Accuracy'], ['256', 'Hz', '', 'Sampling Rate'], ['5', '×', '', 'EEG Bands'],
    ['11', '×', '11', 'Feature Matrix'], ['10', '-fold', '', 'Cross-Validation'], ['2', '×', '', 'Data Augmentation'],
  ].map(([n, em, tail, lbl], i) => {
    const cx = (W / 12) * (2 * i + 1);
    return `<g class="stat" style="animation-delay:${(0.15 * i).toFixed(2)}s">
<text class="s" x="${cx.toFixed(1)}" y="316" text-anchor="middle" font-size="32" font-weight="700" fill="${C.wh}">${n}<tspan font-size="21" fill="${C.cyan}">${em}</tspan>${tail}</text>
<text class="s" x="${cx.toFixed(1)}" y="340" text-anchor="middle" font-size="11.5" fill="${C.mut}">${lbl}</text></g>`;
  }).join('\n');

  const css = `.scroll{animation:scroll 14s linear infinite}.scroll2{animation:scroll 28s linear infinite}
@keyframes scroll{to{transform:translateX(-${sw}px)}}
.scan{animation:scan 8s linear infinite}@keyframes scan{from{transform:translateX(0)}to{transform:translateX(${sw + 30}px)}}
.rec{animation:blink 1.4s ease infinite}@keyframes blink{0%,100%{opacity:1}50%{opacity:.15}}
.stat{opacity:0;animation:up .6s ease forwards}@keyframes up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}`;

  const body = `<defs>
<clipPath id="scr"><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="4"/></clipPath>
<linearGradient id="sg" x1="0" x2="1"><stop offset="0" stop-color="${C.cyan}" stop-opacity="0"/><stop offset=".7" stop-color="${C.cyan}" stop-opacity=".1"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" rx="14" fill="${C.bg}"/>
<rect x="40" y="24" width="800" height="212" rx="10" fill="#000" stroke="#0A2840" stroke-width="1.5"/>
<text class="m" x="52" y="44" font-size="10" fill="#3A7AA4" letter-spacing=".5">EEG MOTOR IMAGERY ACQUISITION ▸ CH: Multi-Band ▸ FS: 256 Hz ▸ WINDOW: 1s</text>
<text class="m rec" x="828" y="44" text-anchor="end" font-size="10" fill="${C.red}">● REC</text>
<g clip-path="url(#scr)">
<g stroke="#003C5A" stroke-opacity=".55" stroke-width=".5">${grid}</g>
<rect class="scan" x="${sx - 30}" y="${sy}" width="30" height="${sh}" fill="url(#sg)"/>
<g class="scroll2">
${bandTraces}
</g>
<g class="scroll">
<path d="${main}" stroke="${C.cyan}" stroke-opacity=".18" stroke-width="5" fill="none" stroke-linejoin="round"/>
<path d="${main}" stroke="${C.cyan}" stroke-width="1.6" fill="none" stroke-linejoin="round"/>
</g>
${bandLabels}
<text class="m" x="${sx + sw - 8}" y="${sy + 14}" text-anchor="end" font-size="10" fill="#3A7AA4">25 μV</text>
<rect x="${sx + sw - 46}" y="${sy + 18}" width="38" height="1" fill="#0064A0"/>
</g>
${stats}`;
  return svg(W, H, 'Live EEG oscilloscope trace with headline metrics: 83.1% peak accuracy, 256 Hz sampling, 5 EEG bands, 11x11 feature matrix, 10-fold cross-validation, 2x augmentation', css, body);
}

// ── pipeline: 9 steps, highlight walks through them ─────────────────────────
function pipeline() {
  const steps = [
    ['Raw Signal Acquisition', 'Load continuous EEG from Excel at 256 Hz. Flatten to 1D waveform and compute full timeline.'],
    ['Butterworth Bandpass Filtering', '4th-order filters extract Δ θ α β γ bands. filtfilt ensures zero-phase distortion.'],
    ['High-Density Sliding Window', '1-second windows (256 samples) shifted by 8 samples — dense trial pool from limited recording length.'],
    ['Noise-Based Augmentation', 'Inject σ-proportional Gaussian noise (1% std) to double dataset while preserving signal structure.'],
    ['Log-Variance Feature Extraction', 'Compute log(Var+ε) per band per trial. Log transform linearizes exponential power relationships.'],
    ['11×11 Matrix Spanning', 'Tile 5 log-variance features into 121-slot grid. Scale Beta ×1.5 along primary diagonal for emphasis.'],
    ['StandardScaler + SelectKBest + PCA', 'Z-normalize → top 50 ANOVA F-test features → 25 principal components for LDA stability.'],
    ['GridSearchCV LDA Classification', 'Exhaustive search: {lsqr|eigen} × {auto|None shrinkage}. Manual 5-formula fallback for full transparency.'],
    ['Weights Export + Telemetry Deployment', 'Serialize w and w₀ to JSON. Deploy at 8 Hz (0.125s ticks), clamping β power to 5–45 μV².'],
  ];
  const W = 880, cw = 270, ch = 132, gap = 10, m = 25;
  const H = m * 2 + 3 * ch + 2 * gap;
  const cards = steps.map(([t, d], i) => {
    const x = m + (i % 3) * (cw + gap), y = m + Math.floor(i / 3) * (ch + gap);
    const tl = wrap(t, 30), dl = wrap(d, 42);
    let ty = y + 46;
    const title = tl.map((l) => { const s = `<text class="s" x="${x + 18}" y="${ty}" font-size="13.5" font-weight="600" fill="${C.wh}">${esc(l)}</text>`; ty += 18; return s; }).join('');
    let dy = ty + 2;
    const desc = dl.map((l) => { const s = `<text class="s" x="${x + 18}" y="${dy}" font-size="11.5" fill="${C.mut}">${esc(l)}</text>`; dy += 16; return s; }).join('');
    return `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="10" fill="${C.card}" stroke="${C.bord}"/>
<g class="hl" style="animation-delay:${i}s"><rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="10" fill="${C.cyan}" fill-opacity=".05" stroke="${C.cyan}"/><rect x="${x}" y="${y + 10}" width="3" height="${ch - 20}" fill="url(#acc)"/></g>
<text class="m" x="${x + 18}" y="${y + 24}" font-size="10.5" fill="${C.cyan}" fill-opacity=".8">STEP ${String(i + 1).padStart(2, '0')}</text>
${title}${desc}`;
  }).join('\n');
  const css = `.hl{opacity:0;animation:hl 9s linear infinite}
@keyframes hl{0%{opacity:0}2%{opacity:1}11%{opacity:1}14%{opacity:0}100%{opacity:0}}`;
  const body = `<defs><linearGradient id="acc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.cyan}"/><stop offset="1" stop-color="${C.pur}"/></linearGradient></defs>
<rect width="${W}" height="${H}" rx="14" fill="${C.bg}"/>
${cards}`;
  return svg(W, H, '9-step pipeline: acquisition, bandpass filtering, sliding window, augmentation, log-variance features, 11x11 matrix, scaling/selection/PCA, LDA classification, weights export and telemetry', css, body);
}

// ── frequency bands: five scrolling waves ───────────────────────────────────
function bands() {
  const data = [
    { n: 'Delta', r: '0.5 – 4 Hz', col: '#4DB8FF', k: 1, amp: 13, dur: 8 },
    { n: 'Theta', r: '4 – 8 Hz', col: '#C084FC', k: 2, amp: 11, dur: 7 },
    { n: 'Alpha', r: '8 – 12 Hz', col: '#34D399', k: 3, amp: 10, dur: 6.5 },
    { n: 'Beta', r: '12 – 30 Hz', col: '#FFB800', k: 6, amp: 16, dur: 6, dom: true },
    { n: 'Gamma', r: '30 – 80 Hz', col: '#FF5F77', k: 16, amp: 7, dur: 5 },
  ];
  const W = 880, m = 25, rh = 68, gap = 10, wx = 190, ww = 630;
  const H = m * 2 + data.length * rh + (data.length - 1) * gap;
  const rows = data.map((b, i) => {
    const y = m + i * (rh + gap), yc = y + rh / 2;
    const fn = (u) => Math.sin(TAU * b.k * u) * b.amp + Math.sin(TAU * 2 * b.k * u + 0.7) * b.amp * 0.3;
    const tag = b.dom
      ? `<rect x="${m + 78}" y="${y + 17}" width="74" height="17" rx="3" fill="${C.amb}" fill-opacity=".12" stroke="${C.amb}" stroke-opacity=".35"/><text class="s" x="${m + 115}" y="${y + 29}" text-anchor="middle" font-size="9.5" font-weight="600" fill="${C.amb}">DOMINANT</text>`
      : '';
    return `<rect x="${m}" y="${y}" width="${W - 2 * m}" height="${rh}" rx="10" fill="${C.card}" stroke="${b.dom ? b.col : C.bord}"${b.dom ? ' stroke-opacity=".6"' : ''}/>
<text class="s" x="${m + 22}" y="${y + 31}" font-size="15" font-weight="600" fill="${b.col}">${b.n}</text>${tag}
<text class="m" x="${m + 22}" y="${y + 50}" font-size="11" fill="${C.mut}">${b.r}</text>
<g clip-path="url(#c${i})"><path d="${loopPath(fn, ww, wx, yc, 3)}" fill="none" stroke="${b.col}" stroke-width="1.7" stroke-opacity=".9" style="animation:w${i} ${b.dur}s linear infinite"/></g>`;
  }).join('\n');
  const clips = data.map((_, i) => `<clipPath id="c${i}"><rect x="${wx}" y="${m + i * (rh + gap) + 4}" width="${ww}" height="${rh - 8}"/></clipPath>`).join('');
  const css = data.map((_, i) => `@keyframes w${i}{to{transform:translateX(-${ww}px)}}`).join('');
  const body = `<defs>${clips}</defs>
<rect width="${W}" height="${H}" rx="14" fill="${C.bg}"/>
${rows}`;
  return svg(W, H, 'EEG frequency bands: Delta 0.5-4 Hz, Theta 4-8 Hz, Alpha 8-12 Hz, Beta 12-30 Hz (dominant), Gamma 30-80 Hz', css, body);
}

// ── results: accuracy cards, confusion matrix, Nyquist check ────────────────
function results() {
  const W = 880, H = 440, m = 25;
  const cw = 200, cgap = (W - 2 * m - 4 * cw) / 3, cy = m, chh = 132;
  const cards = [
    ['83.1', '%', '60 / 40 SPLIT', 'Peak Test Accuracy', C.grn],
    ['81.9', '%', '70 / 30 SPLIT', 'Test Accuracy', C.pur],
    ['80.2', '%', '80 / 20 SPLIT', 'Test Accuracy', C.amb],
    ['10', '-fold', 'CROSS-VALIDATION', 'Stratified K-Fold', C.cyan],
  ].map(([n, em, lbl, sub, col], i) => {
    const x = m + i * (cw + cgap), cx = x + cw / 2;
    return `<defs><clipPath id="rc${i}"><rect x="${x.toFixed(1)}" y="${cy}" width="${cw}" height="${chh}" rx="12"/></clipPath>
<linearGradient id="rg${i}" x1="0" x2="1"><stop offset="0" stop-color="${col}" stop-opacity="0"/><stop offset=".5" stop-color="${col}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
<rect x="${x.toFixed(1)}" y="${cy}" width="${cw}" height="${chh}" rx="12" fill="${C.card}" stroke="${C.bord}"/>
<g clip-path="url(#rc${i})"><g transform="translate(${x.toFixed(1)} ${cy + chh - 2})"><rect class="shim" style="animation-delay:${(i * 0.4).toFixed(1)}s" width="${cw}" height="2" fill="url(#rg${i})"/></g></g>
<g class="pop" style="animation-delay:${(i * 0.15).toFixed(2)}s"><text class="s" x="${cx.toFixed(1)}" y="${cy + 66}" text-anchor="middle" font-size="42" font-weight="700" fill="${C.wh}">${n}<tspan font-size="26" fill="${col}">${em}</tspan></text></g>
<text class="s" x="${cx.toFixed(1)}" y="${cy + 92}" text-anchor="middle" font-size="10.5" letter-spacing="1" fill="${C.mut}">${lbl}</text>
<text class="m" x="${cx.toFixed(1)}" y="${cy + 110}" text-anchor="middle" font-size="10.5" fill="${col}">${sub}</text>`;
  }).join('\n');

  const mx = 70, my = 238, cs = 88, g = 3;
  const cell = (r, c, val, tag, ok) => {
    const x = mx + c * (cs + g), y = my + r * (cs + g), col = ok ? C.grn : C.red;
    return `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" rx="7" fill="${col}" fill-opacity=".11" stroke="${col}" stroke-opacity=".3"/>
<text class="s" x="${x + cs / 2}" y="${y + 50}" text-anchor="middle" font-size="27" font-weight="700" fill="${col}">${val}</text>
<text class="m" x="${x + cs / 2}" y="${y + 67}" text-anchor="middle" font-size="9.5" fill="${col}" fill-opacity=".6">${tag}</text>`;
  };
  const matrix = `<text class="m" x="${m}" y="198" font-size="12" fill="${C.mut}">Confusion Matrix — 60/40 Split (83.1%)</text>
<text class="m" x="${mx + cs / 2}" y="${my - 10}" text-anchor="middle" font-size="10.5" fill="${C.mut}">Pred: Left</text>
<text class="m" x="${mx + cs + g + cs / 2}" y="${my - 10}" text-anchor="middle" font-size="10.5" fill="${C.mut}">Pred: Right</text>
<text class="m" transform="translate(${mx - 14} ${my + cs / 2}) rotate(-90)" text-anchor="middle" font-size="10.5" fill="${C.mut}">Left</text>
<text class="m" transform="translate(${mx - 14} ${my + cs + g + cs / 2}) rotate(-90)" text-anchor="middle" font-size="10.5" fill="${C.mut}">Right</text>
${cell(0, 0, 71, 'TP', true)}${cell(0, 1, 15, 'FP', false)}${cell(1, 0, 5, 'FN', false)}${cell(1, 1, 73, 'TN', true)}`;

  const nx = 330, ny = 180, nw = W - m - nx, nh = H - m - ny;
  const L = (i) => ny + 62 + i * 21;
  const row = (i, parts) => `<text class="m" xml:space="preserve" x="${nx + 22}" y="${L(i)}" font-size="12.5">${parts.map(([t, c]) => `<tspan fill="${c}">${esc(t)}</tspan>`).join('')}</text>`;
  const nyq = `<rect x="${nx}" y="${ny}" width="${nw}" height="${nh}" rx="10" fill="${C.card}" stroke="${C.bord}"/>
<text class="m" x="${nx + 22}" y="${ny + 30}" font-size="12" fill="${C.mut}">Nyquist Criterion Verification</text>
${row(0, [['Highest tracked frequency: ', C.mut], ['80 Hz (Gamma)', C.cyan]])}
${row(1, [['Required Nyquist:          ', C.mut], ['≥ 160 Hz', C.txt]])}
${row(2, [['Sampling rate:             ', C.mut], ['256 Hz > 160 Hz → SATISFIED ✓', C.grn]])}
${row(4, [['Samples per wave cycle at 256 Hz:', C.mut]])}
${row(5, [['Delta ', C.cyan], ['(0.5–4 Hz):  ', C.txt], ['64 – 512 pts', C.mut]])}
${row(6, [['Beta  ', C.cyan], ['(12–30 Hz):  ', C.txt], ['8.5 – 21.3 pts', C.mut]])}
${row(7, [['Gamma ', C.cyan], ['(30–80 Hz):  ', C.txt], ['3.2 – 8.5 pts', C.mut]])}`;

  const css = `.shim{animation:shim 2.5s linear infinite}@keyframes shim{from{transform:translateX(-${cw}px)}to{transform:translateX(${cw}px)}}
.pop{opacity:0;animation:pop .8s ease forwards}@keyframes pop{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`;
  const body = `<rect width="${W}" height="${H}" rx="14" fill="${C.bg}"/>
${cards}
${matrix}
${nyq}`;
  return svg(W, H, 'Results: 83.1% (60/40 split), 81.9% (70/30), 80.2% (80/20), 10-fold stratified cross-validation; confusion matrix 71/15/5/73; Nyquist criterion satisfied at 256 Hz', css, body);
}

// ── telemetry: terminal that types itself out on a loop ─────────────────────
function telemetry() {
  const W = 880, m = 25, lh = 21, top = m + 36 + 30;
  const bar = '='.repeat(71);
  const head = [bar, '     REAL-TIME TELEMETRY STREAM — 60/40 SPLIT (83.1%)', '  Beta power: 5–45 μV²  |  Inference tick: 0.125 s  |  SR: 256 Hz', bar];
  const ticks = [
    ['0.000', '28.45', 'L'], ['0.125', '29.12', 'L'], ['0.250', '31.88', 'L'], ['0.375', '30.44', 'L'], ['0.500', '27.67', 'L'],
    ['0.625', ' 7.15', 'R'], ['0.750', ' 8.93', 'R'], ['0.875', ' 6.40', 'R'], ['1.000', ' 9.22', 'R'], ['1.125', '12.45', 'R'],
  ];
  const lines = [
    ...head.map((h) => ({ at: 0.06, html: `<tspan fill="#4A8A4A">${esc(h)}</tspan>` })),
    ...ticks.map(([t, b, a]) => ({
      at: 0.4,
      html: `<tspan fill="#4A6A9A">[Time +${t}s]</tspan><tspan fill="#00D4AA">  Beta Power: </tspan><tspan fill="${C.amb}">${b} μV²</tspan><tspan fill="#00D4AA">  →  </tspan>`
        + (a === 'L' ? `<tspan fill="${C.cyan}">◀ TURN LEFT</tspan>` : `<tspan fill="${C.red}">TURN RIGHT ▶</tspan>`),
    })),
    { at: 0.5, html: `<tspan fill="#27C93F">✔ Live streaming simulation completed successfully.</tspan>` },
  ];
  const H = top + lines.length * lh + m + 4;
  const CYCLE = 12; // seconds: type out, hold, clear, repeat
  let t = 0.4, css = '', text = '';
  lines.forEach((ln, i) => {
    t += ln.at;
    const p = (t / CYCLE) * 100;
    css += `@keyframes t${i}{0%,${p.toFixed(2)}%{opacity:0}${(p + 0.8).toFixed(2)}%,94%{opacity:1}98%,100%{opacity:0}}`;
    text += `<text class="m" xml:space="preserve" x="${m + 20}" y="${top + i * lh}" font-size="12.5" style="opacity:0;animation:t${i} ${CYCLE}s linear infinite">${ln.html}</text>\n`;
  });
  const body = `<rect width="${W}" height="${H}" rx="14" fill="${C.bg}"/>
<rect x="${m}" y="${m}" width="${W - 2 * m}" height="${H - 2 * m}" rx="10" fill="#000308" stroke="#0E1A35"/>
<path d="M${m},${m + 36}H${W - m}" stroke="#0E1A35"/>
<circle cx="${m + 20}" cy="${m + 18}" r="5" fill="#FF5F56"/><circle cx="${m + 37}" cy="${m + 18}" r="5" fill="#FFBD2E"/><circle cx="${m + 54}" cy="${m + 18}" r="5" fill="#27C93F"/>
<text class="m" x="${m + 74}" y="${m + 22}" font-size="10.5" fill="#4A5A8A">eeg_wheelchair_telemetry.py — 60/40 Split (83.1%)</text>
${text}`;
  return svg(W, H, 'Terminal telemetry stream: five TURN LEFT ticks at 27-32 μV² beta power followed by five TURN RIGHT ticks at 6-12 μV², at 0.125 s intervals', css, body);
}

for (const [name, make] of Object.entries({ hero, pipeline, bands, results, telemetry })) {
  const out = make();
  writeFileSync(new URL(`${name}.svg`, OUT), out);
  console.log(`assets/${name}.svg  ${(out.length / 1024).toFixed(1)} kB`);
}
