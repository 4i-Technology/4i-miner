// ============================================================================
// MiningPULT — Dashboard Logic
// Polls /api/get_stats every 1s, updates all 4 zones + kiloter features.
// ============================================================================

const API_URL = '/4i-miner/api/get_stats';
const LOGS_URL = '/4i-miner/api/logs';
const RESTART_URL = '/4i-miner/api/restart';
const CONFIGURE_URL = '/4i-miner/api/configure';
const POLL_MS = 1000;
const CHART_WINDOW = 60;

const state = {
    hashrateHistory: [],
    peakHashrate: 0,
    lastSharesValid: 0,
    lastUpdateTime: null,
    sharesPerSec: 0,
    devFeeActive: false,
    apiAlive: false,
    hashrateZeroSince: null,
};

// === GAUGE ===
const gaugeCanvas = document.getElementById('gauge');
const gaugeCtx = gaugeCanvas.getContext('2d');

function drawGauge(mhs) {
    const w = gaugeCanvas.width, h = gaugeCanvas.height;
    const cx = w / 2, cy = h - 10;
    const r = Math.min(w / 2 - 20, h - 30);
    gaugeCtx.clearRect(0, 0, w, h);

    const startAngle = Math.PI, endAngle = 2 * Math.PI;
    // Background arc
    gaugeCtx.beginPath();
    gaugeCtx.arc(cx, cy, r, startAngle, endAngle);
    gaugeCtx.lineWidth = 14;
    gaugeCtx.strokeStyle = '#1F2937';
    gaugeCtx.stroke();

    // Color zones (green normal, gold mid, red peak)
    // 0-700: green, 700-900: gold, 900-1000: red
    const zones = [
        { from: 0, to: 700, color: '#00FF7F' },
        { from: 700, to: 900, color: '#FFD700' },
        { from: 900, to: 1000, color: '#FF4C4C' },
    ];
    const maxMhs = 1000;
    zones.forEach(z => {
        const a1 = startAngle + (z.from / maxMhs) * Math.PI;
        const a2 = startAngle + (z.to / maxMhs) * Math.PI;
        gaugeCtx.beginPath();
        gaugeCtx.arc(cx, cy, r, a1, a2);
        gaugeCtx.lineWidth = 14;
        gaugeCtx.strokeStyle = z.color;
        gaugeCtx.globalAlpha = 0.25;
        gaugeCtx.stroke();
    });
    gaugeCtx.globalAlpha = 1;

    // Filled arc (current value)
    const value = Math.min(mhs / maxMhs, 1);
    const fillEnd = startAngle + value * Math.PI;
    let needleColor = '#00FF7F';
    if (mhs >= 900) needleColor = '#FF4C4C';
    else if (mhs >= 700) needleColor = '#FFD700';

    gaugeCtx.beginPath();
    gaugeCtx.arc(cx, cy, r, startAngle, fillEnd);
    gaugeCtx.lineWidth = 14;
    gaugeCtx.strokeStyle = needleColor;
    gaugeCtx.lineCap = 'round';
    gaugeCtx.stroke();

    // Ticks
    for (let i = 0; i <= 10; i++) {
        const angle = startAngle + (i / 10) * Math.PI;
        const x1 = cx + Math.cos(angle) * (r - 22), y1 = cy + Math.sin(angle) * (r - 22);
        const x2 = cx + Math.cos(angle) * (r - 10), y2 = cy + Math.sin(angle) * (r - 10);
        gaugeCtx.beginPath();
        gaugeCtx.moveTo(x1, y1); gaugeCtx.lineTo(x2, y2);
        gaugeCtx.strokeStyle = '#4B5563'; gaugeCtx.lineWidth = 1.5;
        gaugeCtx.stroke();
        if (i % 2 === 0) {
            const tx = cx + Math.cos(angle) * (r - 36), ty = cy + Math.sin(angle) * (r - 36);
            gaugeCtx.fillStyle = '#6B7280'; gaugeCtx.font = '9px monospace';
            gaugeCtx.textAlign = 'center'; gaugeCtx.textBaseline = 'middle';
            gaugeCtx.fillText((i * 100), tx, ty);
        }
    }

    // Needle
    const needleAngle = startAngle + value * Math.PI;
    gaugeCtx.beginPath();
    gaugeCtx.moveTo(cx, cy);
    gaugeCtx.lineTo(cx + Math.cos(needleAngle) * (r - 18), cy + Math.sin(needleAngle) * (r - 18));
    gaugeCtx.strokeStyle = state.devFeeActive ? '#FFD700' : needleColor;
    gaugeCtx.lineWidth = 3; gaugeCtx.lineCap = 'round';
    gaugeCtx.stroke();
    gaugeCtx.beginPath();
    gaugeCtx.arc(cx, cy, 8, 0, 2 * Math.PI);
    gaugeCtx.fillStyle = '#1F2937'; gaugeCtx.fill();
    gaugeCtx.strokeStyle = state.devFeeActive ? '#FFD700' : needleColor;
    gaugeCtx.lineWidth = 2; gaugeCtx.stroke();
}

// === CHART ===
const hashrateChart = new Chart(document.getElementById('hashrate-chart').getContext('2d'), {
    type: 'line',
    data: { labels: [], datasets: [{
        label: 'MH/s', data: [],
        borderColor: '#00FF7F', backgroundColor: 'rgba(0, 255, 127, 0.1)',
        borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0,
    }]},
    options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 250 },
        scales: {
            x: { grid: { color: '#1F2937' }, ticks: { color: '#6B7280', maxTicksLimit: 6, font: { size: 9, family: 'monospace' } } },
            y: { grid: { color: '#1F2937' }, ticks: { color: '#6B7280', font: { size: 9, family: 'monospace' }, callback: v => v + ' MH' }, beginAtZero: true }
        },
        plugins: { legend: { display: false } }
    }
});

// === FETCH ===
async function fetchStats() {
    try {
        const res = await fetch(API_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        state.apiAlive = true;
        updateConnection(true);
        render(data);
        checkWatchdog(data);
    } catch (e) {
        state.apiAlive = false;
        updateConnection(false);
    }
}

function updateConnection(online) {
    const ind = document.getElementById('connection');
    const dot = document.getElementById('conn-dot');
    const text = document.getElementById('conn-text');
    if (online) {
        ind.classList.remove('offline');
        text.textContent = 'Online';
    } else {
        ind.classList.add('offline');
        text.textContent = 'Offline';
    }
}

function formatUptime(sec) {
    if (sec < 60) return sec + 's';
    const m = Math.floor(sec / 60), s = sec % 60;
    if (m < 60) return m + 'm ' + s + 's';
    const h = Math.floor(m / 60);
    return h + 'h ' + (m % 60) + 'm';
}

function render(data) {
    const miner = data.miner || {};
    const hw = data.hardware || {};
    const mining = data.mining || {};
    const fin = data.fintech || {};
    const wd = data.watchdog || {};

    // Zero-config check
    if (miner.configured === false) {
        document.getElementById('zero-config-overlay').style.display = 'flex';
        return;
    } else {
        document.getElementById('zero-config-overlay').style.display = 'none';
    }

    // === ZONE B: GAUGE ===
    const mhs = (hw.hashrate_hs || 0) / 1e6;
    document.getElementById('gauge-mhs').textContent = mhs.toFixed(2);
    drawGauge(mhs);
    if (mhs > state.peakHashrate) state.peakHashrate = mhs;
    document.getElementById('gauge-peak').textContent = state.peakHashrate.toFixed(2);
    document.getElementById('gauge-algo').textContent = miner.algo || '—';
    document.getElementById('gpu-name').textContent = hw.gpu_name || 'GPU';

    // CHART
    const now = new Date();
    state.hashrateHistory.push({ t: now, hs: mhs });
    if (state.hashrateHistory.length > CHART_WINDOW) state.hashrateHistory.shift();
    hashrateChart.data.labels = state.hashrateHistory.map(p => p.t.toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' }));
    hashrateChart.data.datasets[0].data = state.hashrateHistory.map(p => p.hs);
    hashrateChart.update('none');
    document.getElementById('chart-points').textContent = state.hashrateHistory.length + ' pts';

    // SHARES
    const valid = mining.shares_valid || 0;
    const rejected = mining.shares_rejected || 0;
    const total = valid + rejected;
    const eff = total > 0 ? (valid / total * 100) : 100;
    document.getElementById('shares-accepted').textContent = valid.toLocaleString();
    document.getElementById('shares-rejected').textContent = rejected.toLocaleString();
    document.getElementById('efficiency').textContent = eff.toFixed(1) + '% Eff';
    document.getElementById('efficiency-fill').style.width = eff + '%';

    // share rate
    if (state.lastUpdateTime) {
        const dt = (now - state.lastUpdateTime) / 1000;
        const dv = valid - state.lastSharesValid;
        state.sharesPerSec = dt > 0 ? dv / dt : 0;
    }
    state.lastSharesValid = valid;
    state.lastUpdateTime = now;

    // POOL
    document.getElementById('pool-url').textContent = mining.pool || '—';
    document.getElementById('pool-worker').textContent = miner.worker_name || '—';
    document.getElementById('pool-backup').textContent = mining.backup_pool || '—';
    document.getElementById('pool-uptime').textContent = formatUptime(mining.uptime_sec || 0);
    document.getElementById('pool-status').textContent = mining.pool_status || '—';

    // === ZONE C: PROFIT MATRIX ===
    updateProfit(hw, fin);

    // TELEMETRY HUD
    updateTelemetry(hw);

    // === ZONE D: DEV FEE GAUGE ===
    const devActive = !!fin.dev_fee_active;
    state.devFeeActive = devActive;
    const uptime = mining.uptime_sec || 0;
    const cyclePos = uptime % 100;
    const pct = cyclePos;
    document.getElementById('devfee-fill').style.width = pct + '%';
    if (devActive) {
        document.getElementById('devfee-fill').classList.add('active');
        document.getElementById('devfee-status').textContent = 'Dev Fee Active!';
        document.getElementById('devfee-status').style.color = 'var(--gold)';
        showDevFeeBanner();
        document.body.classList.add('devfee-active');
    } else {
        document.getElementById('devfee-fill').classList.remove('active');
        document.getElementById('devfee-status').textContent = 'Mining to User';
        document.getElementById('devfee-status').style.color = 'var(--text)';
        document.body.classList.remove('devfee-active');
    }

    // WATCHDOG
    document.getElementById('watchdog-status').textContent = (wd.status || 'armed').charAt(0).toUpperCase() + (wd.status || 'armed').slice(1);
    if (wd.last_action && wd.last_action !== 'none') {
        document.querySelector('.watchdog-status').classList.add('warn');
    } else {
        document.querySelector('.watchdog-status').classList.remove('warn');
    }

    document.getElementById('last-update').textContent = 'Updated ' + now.toLocaleTimeString('en-US', { hour12: false });
}

// === PROFIT MATRIX ===
function updateProfit(hw, fin) {
    const elecPrice = parseFloat(document.getElementById('elec-price').value) || 0;
    const coinPrice = parseFloat(document.getElementById('coin-price').value) || 0;
    const powerW = hw.power_w || 0;
    const hashrateHs = hw.hashrate_hs || 0;
    // ERG block reward ~48 ERG, block time ~120s, network hashrate ~605 GH/s
    // Daily ERG mined = (hashrate / network_hr) * (86400/120) * 48
    const networkHr = 605e9;
    const ergPerDay = (hashrateHs / networkHr) * (86400 / 120) * 48;
    const revDay = ergPerDay * coinPrice;
    const revMonth = revDay * 30;
    const elecDay = (powerW / 1000) * 24 * elecPrice;
    const elecMonth = elecDay * 30;
    const netDay = revDay - elecDay;
    const netMonth = revMonth - elecMonth;

    document.getElementById('rev-day').textContent = '$' + revDay.toFixed(2);
    document.getElementById('rev-month').textContent = '$' + revMonth.toFixed(2);
    document.getElementById('elec-day').textContent = '$' + elecDay.toFixed(2);
    document.getElementById('elec-month').textContent = '$' + elecMonth.toFixed(2);
    const netRow = document.querySelector('.net-row');
    if (netDay < 0) netRow.classList.add('negative');
    else netRow.classList.remove('negative');
    document.getElementById('net-day').textContent = '$' + netDay.toFixed(2);
    document.getElementById('net-month').textContent = '$' + netMonth.toFixed(2);
}

document.getElementById('elec-price').addEventListener('input', () => fetchStats());
document.getElementById('coin-price').addEventListener('input', () => fetchStats());

// === TELEMETRY HUD ===
function updateTelemetry(hw) {
    const setBar = (id, valId, value, max, unit, type) => {
        const pct = Math.min((value / max) * 100, 100);
        const fill = document.getElementById(id);
        fill.style.height = pct + '%';
        fill.classList.remove('warn', 'crit');
        if (type === 'temp') {
            if (value >= 75) fill.classList.add('crit');
            else if (value >= 60) fill.classList.add('warn');
        } else if (type === 'hotspot') {
            if (value >= 85) fill.classList.add('crit');
            else if (value >= 70) fill.classList.add('warn');
        }
        document.getElementById(valId).textContent = value + unit;
    };
    setBar('tel-gpu-temp', 'val-gpu-temp', hw.gpu_temp || 0, 100, '°C', 'temp');
    setBar('tel-hotspot', 'val-hotspot', hw.hotspot_temp || 0, 110, '°C', 'hotspot');
    setBar('tel-power', 'val-power', hw.power_w || 0, 500, ' W');
    setBar('tel-fan', 'val-fan', hw.fan_rpm || 0, 6000, '');
    setBar('tel-vram', 'val-vram', hw.vram_util || 0, 100, ' %');

    // Thermal modal
    if ((hw.hotspot_temp || 0) > 85) {
        document.getElementById('thermal-modal').style.display = 'flex';
    }
}

// === WATCHDOG ===
function checkWatchdog(data) {
    const hw = data.hardware || {};
    const mhs = (hw.hashrate_hs || 0) / 1e6;
    if (mhs < 1) {
        if (!state.hashrateZeroSince) state.hashrateZeroSince = Date.now();
        const zeroFor = (Date.now() - state.hashrateZeroSince) / 1000;
        if (zeroFor > 180) {  // 3 min
            showToast('⚠️ Hashrate dropped to 0. Watchdog initiated auto-restart.');
            state.hashrateZeroSince = null;
        }
    } else {
        state.hashrateZeroSince = null;
    }
}

// === DEV FEE BANNER ===
let bannerTimeout;
function showDevFeeBanner() {
    const banner = document.getElementById('devfee-banner');
    if (banner.style.display === 'block') return;
    banner.textContent = '★ Dev Fee Active — Mining to 4i-CRYPTO wallet';
    banner.style.display = 'block';
    clearTimeout(bannerTimeout);
    bannerTimeout = setTimeout(() => { banner.style.display = 'none'; }, 1500);
}

// === TOAST ===
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 5000);
}

// === RESTART BUTTON ===
document.getElementById('btn-restart').addEventListener('click', async () => {
    if (!confirm('Send restart signal to GPU mining device?')) return;
    const btn = document.getElementById('btn-restart');
    const text = document.getElementById('restart-text');
    btn.disabled = true;
    text.textContent = 'Restarting...';
    try {
        const res = await fetch(RESTART_URL, { method: 'POST' });
        const data = await res.json();
        showToast('✓ ' + (data.message || 'Restart scheduled'));
    } catch (e) {
        showToast('✗ Restart failed: ' + e.message);
    } finally {
        setTimeout(() => { btn.disabled = false; text.textContent = 'Restart'; }, 2000);
    }
});

// === SHARE STATS (html2canvas) ===
document.getElementById('btn-share').addEventListener('click', async () => {
    showToast('📷 Generating shareable screenshot...');
    // Create a hidden share card with only public metrics
    const card = document.createElement('div');
    card.style.cssText = 'position:fixed;left:-9999px;top:0;width:640px;background:#0B0E14;padding:32px;font-family:monospace;color:#E5E7EB;border-radius:12px;';
    const mhs = (state.peakHashrate || 759).toFixed(1);
    card.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
            <div style="background:#FFD700;color:#0B0E14;font-weight:900;font-size:28px;width:56px;height:56px;border-radius:10px;display:flex;align-items:center;justify-content:center;">4i</div>
            <div>
                <div style="font-size:22px;font-weight:700;color:#FFD700;">4i-Miner v1.0</div>
                <div style="font-size:11px;color:#9CA3AF;">Ultra-Fast OpenCL Miner for Ergo</div>
            </div>
        </div>
        <div style="background:#11151F;border:1px solid #1F2937;border-radius:8px;padding:20px;margin-bottom:14px;">
            <div style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">GPU Hashrate</div>
            <div style="font-size:48px;font-weight:800;color:#00FF7F;text-shadow:0 0 20px rgba(0,255,127,0.5);">${mhs} <span style="font-size:18px;color:#9CA3AF;">MH/s</span></div>
            <div style="font-size:12px;color:#9CA3AF;margin-top:6px;">AMD MI300X · Autolykos v2</div>
        </div>
        <div style="background:#11151F;border:1px solid #1F2937;border-radius:8px;padding:16px;margin-bottom:14px;">
            <div style="font-size:11px;color:#9CA3AF;text-transform:uppercase;margin-bottom:6px;">Net Profit / Day</div>
            <div style="font-size:32px;font-weight:700;color:#00FF7F;">${document.getElementById('net-day').textContent}</div>
        </div>
        <div style="text-align:center;color:#FFD700;font-size:11px;letter-spacing:2px;">★ 4i-CRYPTO · Fast. Open. Fair. ★</div>
        <div style="text-align:center;color:#6B7280;font-size:9px;margin-top:6px;">Made in USSR · 4i-Miner v1.0</div>
    `;
    document.body.appendChild(card);
    try {
        const canvas = await html2canvas(card, { backgroundColor: '#0B0E14', scale: 2 });
        const link = document.createElement('a');
        link.download = `4i-miner-stats-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('✓ Screenshot saved!');
    } catch (e) {
        showToast('✗ Screenshot failed: ' + e.message);
    } finally {
        document.body.removeChild(card);
    }
});

// === ZERO-CONFIG FORM ===
document.getElementById('cfg-start').addEventListener('click', async () => {
    const wallet = document.getElementById('cfg-wallet').value.trim();
    const worker = document.getElementById('cfg-worker').value.trim();
    const pool = document.getElementById('cfg-pool').value;
    if (!wallet) { alert('Enter your ERG wallet address'); return; }
    const btn = document.getElementById('cfg-start');
    btn.textContent = 'Configuring...';
    btn.disabled = true;
    try {
        const res = await fetch(CONFIGURE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet, worker_name: worker, pool })
        });
        const data = await res.json();
        if (data.ok) {
            showToast('✓ Miner configured! Restarting...');
            setTimeout(() => location.reload(), 1500);
        } else {
            alert('Configuration failed: ' + (data.error || 'unknown'));
            btn.textContent = 'Start Mining →';
            btn.disabled = false;
        }
    } catch (e) {
        alert('Network error: ' + e.message);
        btn.textContent = 'Start Mining →';
        btn.disabled = false;
    }
});

// === LIVE CONSOLE (compact strip) ===
async function fetchLogs() {
    try {
        const res = await fetch(LOGS_URL, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const lines = data.lines || [];
        const consoleEl = document.getElementById('console-log');
        consoleEl.innerHTML = '';
        lines.slice(-8).forEach(line => {
            const div = document.createElement('div');
            div.className = 'console-line';
            if (line.toLowerCase().includes('error')) div.classList.add('error');
            else if (line.toLowerCase().includes('warn')) div.classList.add('warn');
            else if (line.toLowerCase().includes('dev fee')) div.classList.add('devfee');
            div.textContent = line;
            consoleEl.appendChild(div);
        });
    } catch (e) {}
}

// === BOOT ===
drawGauge(0);
fetchStats();
fetchLogs();
setInterval(fetchStats, POLL_MS);
setInterval(fetchLogs, 2000);

// Show console strip on click anywhere in footer
document.querySelector('.statusbar').addEventListener('click', () => {
    document.querySelector('.console-strip').classList.toggle('visible');
});
