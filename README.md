# 4i-MINER [ Master of Miners ]

> **"Serious crypto tools for adults. 36+ only."**

4i-Miner is a next-generation OpenCL miner built with an AI-driven optimization core. We took open-source kernels and applied deep memory coalescing and DAG read optimizations, outperforming standard proprietary software by up to 70%.

No config files. No command-line flags. Just run the Docker container and go through a 5-step visual Setup Wizard. Select your pool, enter wallet, and you're mining!

---

## 🚀 Quick Start (One Command)

Make sure you have Docker and NVIDIA/AMD drivers installed, then run:

```bash
docker run -it --device=/dev/dri -p 8080:8080 makartwebstudio/4i-miner:latest
```

The interactive TUI Setup Wizard will launch automatically. It walks you through 5 quick steps: hardware detection, pool selection (HeroMiners / 2Miners / WoolyPooly / custom), wallet & worker, electricity price, and Web Dashboard toggle. Once configured, the miner starts hashing immediately and displays a live, profit-calculating dashboard right in your terminal.

---

## 📊 Performance (Verified Benchmarks)

We tested 4i-Miner against the industry standard (lolMiner). The results speak for themselves:

| GPU Model | Architecture | lolMiner | 4i-Miner | Speedup |
|-----------|--------------|----------|----------|---------|
| AMD MI300X | CDNA 3 | 445 MH/s | 759 MH/s | +70.3% 🚀 |
| RTX 4000 Ada | Ada Pro | 45 MH/s | 62 MH/s | +37.7% 📈 |
| RTX A2000 | Ampere Pro | 32 MH/s | 45 MH/s | +40.6% 📈 |

---

## ✨ Why 4i-Miner?

- **Interactive TUI**: A beautiful terminal interface that lets you choose from top pools (HeroMiners, 2Miners, etc.), shows your hashrate, temperature, and Unit Economics (calculates your Net Profit after electricity costs in real-time).
- **Web Dashboard**: Open `http://localhost:8080` in your browser to see a premium web UI with live charts and shareable stats.
- **OpenCL JIT Compilation**: Works natively on both AMD and NVIDIA out of the box. No separate binaries needed.
- **Transparent Dev Fee**: 1% (Keeps us coding).

---

## 🤝 Join the Community Benchmark

We are building the ultimate community Hashrate Leaderboard!

1. Run the miner for 5 minutes.
2. Take a screenshot of the TUI or Web Dashboard.
3. Post it in our Reddit/Discord with your GPU model!

Let's prove that optimized open-source software can beat corporate miners.

---

## 🛠️ Quick Start (No Docker)

Prefer the bare binary? Grab the latest release and run it directly on Linux:

```bash
# 1. Скачать бинарь и дать права на запуск
wget https://github.com/4i-Technology/4i-miner/releases/download/v1.1/4i-miner
chmod +x 4i-miner

# 2. Установить системные зависимости (OpenCL и Boost)
sudo apt-get update && sudo apt-get install -y ocl-icd-libopencl1 libboost-all-dev libcurl4-openssl-dev

# 3. Запустить!
./4i-miner
```

The same 5-step Setup Wizard launches — no Docker required. Requires Linux x86_64 with Boost 1.83+ (Debian 13 / Ubuntu 24.04+ recommended).

---

*Built by a solo developer. Powered by 4i-Technology.*
