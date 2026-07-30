# Build Windows .exe — GitHub Actions

This workflow (`build-windows.yml`) automatically builds `4i-miner.exe` for Windows x64
using MSVC + vcpkg, then attaches the ZIP to a GitHub Release.

## 🚀 Triggers

1. **Auto**: When a new Release is published (e.g. tag `v1.2`) — attaches ZIP to that release
2. **Manual**: Workflow Dispatch (Actions tab → Run workflow) — uploads as workflow artifact only

## ⚙️ Setup (one-time, by Ataman)

### 1. Create GITEA_TOKEN secret

The workflow needs to download the private `solo-miner` source from Gitea.

1. Get a Gitea access token:
   - Go to https://git.4i-tech.ru/user/settings/applications
   - Generate new token with `read:repository` scope
2. Add it to GitHub:
   - Go to https://github.com/4i-Technology/4i-miner/settings/secrets/actions
   - Click **New repository secret**
   - Name: `GITEA_TOKEN`
   - Value: paste the token from step 1

### 2. Verify Actions permissions

- Go to https://github.com/4i-Technology/4i-miner/settings/actions
- Ensure **Allow all actions and reusable workflows** is enabled
- Under **Workflow permissions**, select **Read and write permissions** (needed for `gh release upload`)

## 🎯 How to release v1.2 (with Windows .exe)

```bash
# Tag v1.2 on main branch
git tag v1.2
git push origin v1.2

# OR create release via GitHub UI:
# https://github.com/4i-Technology/4i-miner/releases/new
# Tag: v1.2
# Title: 4i-Miner v1.2 - Master of Miners (Windows Support)
# Publish → triggers build-windows workflow
```

## 📦 What's in the ZIP

```
4i-miner-windows-x64.zip
├── bin/
│   └── 4i-miner.exe                  (~5-6 MB)
├── kernels/
│   ├── common/rotate_byte.cl
│   ├── crypto/blake2b.cl
│   ├── crypto/blake2b_compress.cl
│   └── autolykos/
│       ├── autolykos_v2_search.cl
│       ├── autolykos_v2_verify.cl
│       ├── autolykos_v2_dag.cl
│       ├── autolykos_v2_result.cl
│       └── autolykos_v2_var_global.cl
├── web-ui/
│   ├── index.html
│   ├── script.js
│   └── style.css
└── README.md
```

## 🐛 Troubleshooting

### vcpkg install is slow (15-25 min)
vcpkg compiles Boost from source on first run. This is normal — subsequent runs use cache.
To speed up: enable `actions/cache` on `C:/vcpkg/installed` (future enhancement).

### cmake configure fails on Boost
- Ensure vcpkg triplet is `x64-windows`
- Verify `VCPKG_TARGET_TRIPLET=x64-windows` is passed to cmake
- Check that `CMAKE_TOOLCHAIN_FILE` points to `C:/vcpkg/scripts/buildsystems/vcpkg.cmake`

### msbuild fails on OpenCL headers
- vcpkg `opencl` port installs headers to `C:/vcpkg/installed/x64-windows/include/CL/`
- If cmake can't find them, manually set `OpenCL_INCLUDE_DIR=C:/vcpkg/installed/x64-windows/include`

### Build fails with `__stdcall` errors
- This was a Linux-only patch — on Windows `__stdcall` is the native calling convention
- The workflow SKIPS the `__stdcall` patch on Windows (no-op needed)

### miner.exe not found after msbuild
- Check `C:/luminousminer/build/Release/miner.exe` or `C:/luminousminer/build/sources/Release/miner.exe`
- The workflow uses `Get-ChildItem -Recurse -Filter "miner.exe"` to find it anywhere in build/

## 📋 Build matrix (future)

Currently only `x64-windows` (MSVC). Planned:
- `x64-windows-static` (statically linked, single .exe no DLLs)
- `x64-mingw` (MinGW-w64 GCC, smaller binary)
- `arm64-windows` (for Windows on ARM)
