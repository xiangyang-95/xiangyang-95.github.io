# 0x02 - Intel GPU enablement on LeRobot

Date: 4/9/2025

## What is LeRobot?

LeRobot is a lightweight orchestration and fine‑tuning helper from Hugging Face for small multimodal models and research workflows. It provides utilities to prepare datasets, select devices, configure training loops, and wire model/optimizer state to trainers. The project makes it easy to prototype and iterate on model changes, but the device‑selection logic is intentionally compact and currently misses some platform‑specific device types—most notably Intel XPU (oneAPI / Intel accelerators).

This post shows a minimal set of changes to enable Intel XPU devices in LeRobot (so you can train and fine‑tune on Intel accelerators), how to adapt training for a small VLA (SMOLVLA) after the change, and a quick way to try the updated code from my fork.

## Why add Intel XPU support

- Intel’s accelerator ecosystem (oneAPI / XPU) offers strong performance for certain workloads and is increasingly available in cloud and on‑premises hardware.
- Adding XPU support in LeRobot lets the same training scripts target CUDA, CPU, or XPU via a simple device flag or auto‑selection.

## Enabling Intel GPU (XPU) in LeRobot with PyTorch

The LeRobot device‑selection helpers live in `src/lerobot/utils/utils.py` (upstream: https://github.com/huggingface/lerobot). In my fork, XPU support was added through a small set of focused edits across device selection, dtype safety, and AMP capability. See the exact changes in these commits:

- feat: add XPU backend to auto and explicit device selection — commit bb20b2e
	- auto_select_torch_device now detects `torch.xpu.is_available()` and returns `torch.device("xpu")` with a log message.
	- get_safe_torch_device accepts `"xpu"` and asserts availability before returning `torch.device("xpu")`.
	- is_torch_device_available recognizes `"xpu"` and checks `torch.xpu.is_available()`; error messages list xpu among supported backends.
	- get_safe_dtype adds handling for `device == "xpu"` when `dtype == torch.float64` (see follow‑up commits below).
	Link: https://github.com/xiangyang-95/lerobot/commit/bb20b2ec9695789753203e3f8abba29e2e21d591

- fix: robust XPU FP64 capability check — commit 9135bfd
	- Wraps `torch.xpu.get_device_capability()` in try/except AttributeError and falls back to float32 if FP64 is unavailable or the capability check is missing.
	Link: https://github.com/xiangyang-95/lerobot/commit/9135bfd56aee406e67ec1a4114aff3172f860bf6

- chore: switch FP64 notices from print to logging.warning — commit 148329a
	- Replaces prints with `logging.warning` for clearer, configurable diagnostics when FP64 isn’t supported.
	Link: https://github.com/xiangyang-95/lerobot/commit/148329afb7cbfbadf10d7bdc68cce9bc0bda9d38

- fix: mark AMP available on XPU — commit 4518090
	- Updates `is_amp_available` to include `"xpu"` alongside `"cuda"` and `"cpu"`.
	Link: https://github.com/xiangyang-95/lerobot/commit/45180907823489d7a077674134b70336d102f3d5

Files/functions touched (all in `src/lerobot/utils/utils.py`):
- auto_select_torch_device
- get_safe_torch_device
- get_safe_dtype
- is_torch_device_available
- is_amp_available

### Where to place this change

If you’re adapting upstream, mirror the edits above in `src/lerobot/utils/utils.py`. Ensure CLI/config parsing allows `xpu` as a device value and passes it through to these helpers.

If you’d like, I can prepare a concrete PR against upstream with the minimal, well‑tested edits—my fork with the working changes is at https://github.com/xiangyang-95/lerobot.

## Training / fine‑tuning a SMOLVLA after the change

After enabling XPU in device selection, the rest of your training loop typically needs little change. A few practical tips:

- Mixed precision: check whether the Intel runtime provides its own AMP or mixed‑precision API (some runtimes provide optimizations similar to NVIDIA AMP). Use it where available for higher throughput and lower memory use.
- Memory layout and compute kernels: some kernels might behave differently; validate with a short run (1–2 steps) and compare loss/outputs to a CPU or CUDA run to sanity‑check correctness.
- Data pipeline: ensure your dataloader `pin_memory` / `num_workers` settings make sense for the host platform.

Minimal fine‑tune workflow (high level):

1. Prepare your dataset and config as usual.
2. Install PyTorch XPU.
    ```bash
    python -m pip install torch==2.8.0 torchvision==0.23.0 torchaudio==2.8.0 --index-url https://download.pytorch.org/whl/xpu
    ```
3. Start training with `--device xpu` (or let `auto` pick XPU when present).
4. Run a short smoke test for 1 epoch / small batch to confirm behavior.
5. Scale up, enable AMP if available, and monitor memory/throughput.

Example (pseudo) command lines:

```sh
# Run with explicit XPU
lerobot-train \
	--policy.type=lerobot/smolvla_base \
	--policy.device=xpu  # use Intel GPU
```

## Using my fork (quickstart)

Get the XPU-ready fork running locally (bash):

1. Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install --upgrade pip
```

2. Install the PyTorch XPU wheels:

```bash
python3 -m pip install torch==2.8.0 torchvision==0.23.0 torchaudio==2.8.0 --index-url https://download.pytorch.org/whl/xpu
```

3. Clone and install the fork in editable mode:

```bash
git clone https://github.com/xiangyang-95/lerobot.git
cd lerobot
pip install -e .
```

4. Sanity-check that XPU is visible:

```bash
python3 -c 'import torch; print("xpu available:", hasattr(torch,"xpu") and torch.xpu.is_available())'
```

5. Run training on XPU (or use `--device auto` to auto-detect):

```bash
lerobot-train --policy.type=lerobot/smolvla_base --policy.device=xpu
```

## References

- upstream device helper: https://github.com/huggingface/lerobot/blob/main/src/lerobot/utils/utils.py
- my fork with changes: https://github.com/xiangyang-95/lerobot
