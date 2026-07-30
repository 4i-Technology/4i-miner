# 4i-Miner v1.0 "Master of Miners" — Release Image
# OpenCL GPU Miner for Ergo (autolykos v2)
# Built: 30 Jul 2026, Boost 1.83 (system on Debian 13/Ubuntu 24.04)
FROM ubuntu:24.04

LABEL org.opencontainers.image.title="4i-Miner"
LABEL org.opencontainers.image.description="Master of Miners — OpenCL GPU Miner for Ergo (autolykos v2)"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://git.4i-tech.ru/Ataman/solo-miner"

# Install runtime dependencies:
#   - ocl-icd-libopencl1  : OpenCL ICD loader
#   - libboost-chrono1.83.0, libboost-thread1.83.0, libboost-program-options1.83.0
#                          : runtime Boost libs that the binary links against
#   - libcurl4t64          : stratum client HTTP
#   - ca-certificates      : TLS for pool connections
RUN apt-get update && apt-get install -y --no-install-recommends \
        ocl-icd-libopencl1 \
        libboost-chrono1.83.0 \
        libboost-thread1.83.0 \
        libboost-program-options1.83.0 \
        libboost-filesystem1.83.0 \
        libboost-atomic1.83.0 \
        libboost-container1.83.0 \
        libboost-json1.83.0 \
        libboost-serialization1.83.0 \
        libcurl4t64 \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the built binary
COPY bin/4i-miner /app/4i-miner

# Copy OpenCL kernels (runtime JIT-compiled)
COPY kernels/ /app/kernels/

# Copy Web-UI (Пульт — dashboard)
COPY web-ui/ /app/web-ui/

# Make binary executable
RUN chmod +x /app/4i-miner

# Web dashboard port (HTTP API server)
EXPOSE 8080

# Default entrypoint: 4i-miner binary
ENTRYPOINT ["/app/4i-miner"]
CMD ["--help"]
