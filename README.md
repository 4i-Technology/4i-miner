# 4i-MINER [ Master of Miners ]
> **"Serious crypto tools for adults. 36+ only."**

4i-Miner is a heavily optimized OpenCL miner for Ergo (Autolykos v2). By taking open-source kernels and applying aggressive memory coalescing and DAG read optimizations, it outperforms standard proprietary software by up to 70%.

No config files. No command-line flags. Just run the executable and answer 4 simple questions.

## 🚀 Quick Start

### Option 1: Windows (Native .exe)
1. Download the latest `4i-miner-windows-x64.zip` from the [Releases page](https://github.com/4i-Technology/4i-miner/releases/latest).
2. Unzip the archive to any folder.
3. *(Note: If Windows Defender blocks the file, click "More info" -> "Run anyway")*.
4. Double-click `bin/4i-miner.exe` to launch the Setup Wizard.

### Option 2: Linux (Docker)
Make sure you have Docker and NVIDIA/AMD drivers installed, then run:

```bash
docker run -it --device=/dev/dri -p 8080:8080 makartwebstudio/4i-miner:latest
```

### Option 3: Linux (Binary)
```bash
wget https://github.com/4i-Technology/4i-miner/releases/download/v1.1/4i-miner
chmod +x 4i-miner
sudo apt-get update && sudo apt-get install -y ocl-icd-libopencl1 libboost-all-dev
./4i-miner
```

The interactive TUI Setup Wizard will launch automatically. It will ask for your pool, wallet, and electricity price. Once configured, the miner starts hashing immediately and displays a live, profit-calculating dashboard right in your terminal.

## 📊 Performance (Verified Benchmarks)

We tested 4i-Miner against the industry standard (lolMiner). The results speak for themselves:

| GPU Model | Architecture | lolMiner | 4i-Miner | Speedup |
|-----------|--------------|----------|----------|---------|
| **AMD MI300X** | CDNA 3 | 445 MH/s | **759 MH/s** | **+70.3%** 🚀 |
| **RTX 4000 Ada** | Ada Pro | 45 MH/s | **62 MH/s** | **+37.7%** 📈 |
| RTX A2000 | Ampere Pro | 32 MH/s | **45 MH/s** | **+40.6%** 📈 |

## ✨ Why 4i-Miner?

*   **Algorithm Support:** Ergo (Autolykos v2). More algorithms (Blake3/ALPH, KawPow/RVN) coming soon.
*   **Interactive TUI:** A beautiful terminal interface that lets you choose from top pools, shows your hashrate, temperature, and **Unit Economics** (calculates your Net Profit after electricity costs in real-time).
*   **Web Dashboard:** Open `http://localhost:8080` in your browser to see a premium web UI with live charts and shareable stats.
*   **OpenCL JIT Compilation:** Works natively on both AMD and NVIDIA out of the box. No separate binaries needed.
*   **Transparent Dev Fee:** 1% (Keeps us coding).

## 🤝 Join the Community Benchmark

We are building the ultimate community Hashrate Leaderboard! 
1. Run the miner for 5 minutes.
2. Take a screenshot of the TUI or Web Dashboard.
3. Post it in our Reddit/Discord with your GPU model!

Let's prove that optimized open-source software can beat corporate miners.

---
*Built by a solo developer. Powered by 4i-Technology.*
