# Tauri + React + Typescript

Shiki is a Tauri + React + Typescript app for cycling wallpapers across platforms, including Android.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Minimal setup

- **Rust**
  - Install Rust via [`rustup`](https://rustup.rs/) and use the stable toolchain.

- **Node & pnpm**
  - **Node**: `24` (from `.nvmrc`).
  - **pnpm**: use the version from `packageManager` in `package.json` (currently `pnpm@10.x`).

- **Java**
  - **JDK 21** (Temurin 21 recommended).
  - Android Gradle Plugin 8.5.x+ works well with JDK 21; use the same version in your shell and in Android Studio’s Gradle JDK.

- **Android SDK / NDK** (for Android builds)
  - Let Android Studio manage the SDK under `~/Library/Android/sdk` and NDKs under `~/Library/Android/sdk/ndk/<version>`.
  - The project prefers `sdk.dir` / `ndk.dir` in `local.properties`; otherwise Android Studio falls back to its default SDK location on macOS.

- **Android toolchain (known good reference)**
  - SDK Platform: **34** (35 also tested).
  - Build-tools: **34.0.0**.
  - Platform-tools: **35.0.2**.
  - NDK: **27.2.12479018**.
  - CMake: **3.31.5**.
  - cmdline-tools: **11.0**.
  - ABIs: **arm64-v8a**, **x86_64**.

- **Tool versions via mise**
  - Install [`mise`](https://mise.jdx.dev/) and run `mise install` in this repo to get matching versions for Node 24, pnpm 10.x, Rust (stable), and Temurin 21.
