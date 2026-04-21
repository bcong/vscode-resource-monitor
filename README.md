# VSCode Resource Monitor

> **Task Manager in your status bar.** Keep an eye on CPU, GPU, RAM, Disk, and Network — without ever leaving your editor.

---

## 📸 Preview

![Preview](https://github.com/bcong/bcong/blob/main/preview.png?raw=true)

---

## ✨ Features

| Item              | What's shown                                |
| ----------------- | ------------------------------------------- |
| **CPU**           | Usage % · optional temperature inline       |
| **Memory (RAM)**  | Used / Total in GB, MB, or %                |
| **GPU**           | Utilization % · optional temperature inline |
| **VRAM**          | Used / Total in GB                          |
| **Disk I/O**      | Read & Write speed                          |
| **Network**       | Download & Upload speed                     |
| **Battery**       | Charge % · charging indicator               |
| **Process Count** | Number of running processes                 |

All items are **individually toggleable** and their **display order is fully customizable**.

> _(Status bar items auto-color: normal / ⚠️ warning at 70% / 🔴 critical at 90%)_

---

## ⚙️ Configuration

Open **Settings** (`Ctrl+,`) and search `resourceMonitor`, or click the status bar item.

### Show / Hide items

| Setting                            | Default | Description                         |
| ---------------------------------- | ------- | ----------------------------------- |
| `resourceMonitor.showCpu`          | `true`  | CPU usage %                         |
| `resourceMonitor.showMemory`       | `true`  | RAM usage                           |
| `resourceMonitor.showGpu`          | `true`  | GPU utilization %                   |
| `resourceMonitor.showGpuMemory`    | `true`  | VRAM usage                          |
| `resourceMonitor.showDisk`         | `true`  | Disk read/write speed               |
| `resourceMonitor.showNetwork`      | `true`  | Network rx/tx speed                 |
| `resourceMonitor.showCpuTemp`      | `false` | CPU temperature (inline with CPU %) |
| `resourceMonitor.showGpuTemp`      | `false` | GPU temperature (inline with GPU %) |
| `resourceMonitor.showBattery`      | `false` | Battery level                       |
| `resourceMonitor.showProcessCount` | `false` | Running process count               |

### Display order

```jsonc
"resourceMonitor.order": [
  "cpu",
  "memory",
  "gpu",
  "gpuMemory",
  "network",
  "disk"
]
```

Available keys: `cpu` · `memory` · `gpu` · `gpuMemory` · `disk` · `network` · `battery` · `processCount`

### Other settings

| Setting                             | Default   | Description                                  |
| ----------------------------------- | --------- | -------------------------------------------- |
| `resourceMonitor.updateInterval`    | `2000`    | Refresh interval in ms (min 500, max 30000)  |
| `resourceMonitor.statusBarPosition` | `"right"` | `"left"` or `"right"` side of the status bar |
| `resourceMonitor.statusBarPriority` | `100`     | Higher = closer to center                    |
| `resourceMonitor.memoryUnit`        | `"GB"`    | `"GB"` · `"MB"` · `"percent"`                |
| `resourceMonitor.networkUnit`       | `"auto"`  | `"auto"` · `"KB/s"` · `"MB/s"`               |

---

## 🚀 Commands

| Command                            | Description                       |
| ---------------------------------- | --------------------------------- |
| `Resource Monitor: Open Settings`  | Open extension settings           |
| `Resource Monitor: Toggle Monitor` | Toggle the status bar item on/off |

---

## 🖥️ Requirements

- **Windows / macOS / Linux** — core metrics work on all platforms
- CPU & GPU **temperature** requires hardware sensor support; unavailable environments are silently skipped
- **Battery** item only appears when a battery is detected
