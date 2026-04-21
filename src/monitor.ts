import * as vscode from 'vscode';
import * as si from 'systeminformation';

type ItemKey = 'cpu' | 'memory' | 'gpu' | 'gpuMemory' | 'disk' | 'network' | 'battery' | 'processCount';

const DEFAULT_ORDER: ItemKey[] = ['cpu', 'memory', 'gpu', 'gpuMemory', 'disk', 'network', 'battery', 'processCount'];

interface MonitorConfig {
    showCpu: boolean;
    showMemory: boolean;
    showGpu: boolean;
    showGpuMemory: boolean;
    showDisk: boolean;
    showNetwork: boolean;
    showCpuTemp: boolean;
    showGpuTemp: boolean;
    showBattery: boolean;
    showProcessCount: boolean;
    updateInterval: number;
    statusBarPosition: 'left' | 'right';
    statusBarPriority: number;
    memoryUnit: 'GB' | 'MB' | 'percent';
    networkUnit: 'auto' | 'KB/s' | 'MB/s';
    order: ItemKey[];
}

function getConfig(): MonitorConfig {
    const cfg = vscode.workspace.getConfiguration('resourceMonitor');
    const rawOrder = cfg.get<string[]>('order', DEFAULT_ORDER);
    const order: ItemKey[] = rawOrder.filter((k): k is ItemKey =>
        DEFAULT_ORDER.includes(k as ItemKey)
    );
    return {
        showCpu: cfg.get<boolean>('showCpu', true),
        showMemory: cfg.get<boolean>('showMemory', true),
        showGpu: cfg.get<boolean>('showGpu', true),
        showGpuMemory: cfg.get<boolean>('showGpuMemory', true),
        showDisk: cfg.get<boolean>('showDisk', true),
        showNetwork: cfg.get<boolean>('showNetwork', true),
        showCpuTemp: cfg.get<boolean>('showCpuTemp', false),
        showGpuTemp: cfg.get<boolean>('showGpuTemp', false),
        showBattery: cfg.get<boolean>('showBattery', false),
        showProcessCount: cfg.get<boolean>('showProcessCount', false),
        updateInterval: cfg.get<number>('updateInterval', 2000),
        statusBarPosition: cfg.get<'left' | 'right'>('statusBarPosition', 'right'),
        statusBarPriority: cfg.get<number>('statusBarPriority', 100),
        memoryUnit: cfg.get<'GB' | 'MB' | 'percent'>('memoryUnit', 'GB'),
        networkUnit: cfg.get<'auto' | 'KB/s' | 'MB/s'>('networkUnit', 'auto'),
        order,
    };
}

function formatBytes(bytes: number, unit: 'auto' | 'KB/s' | 'MB/s'): string {
    if (unit === 'MB/s' || (unit === 'auto' && bytes >= 1024 * 1024)) {
        return `${(bytes / 1024 / 1024).toFixed(1)} MB/s`;
    }
    return `${(bytes / 1024).toFixed(1)} KB/s`;
}

function formatMemory(used: number, total: number, unit: 'GB' | 'MB' | 'percent'): string {
    if (unit === 'percent') {
        return `${((used / total) * 100).toFixed(1)}%`;
    }
    if (unit === 'MB') {
        return `${(used / 1024 / 1024).toFixed(0)}/${(total / 1024 / 1024).toFixed(0)} MB`;
    }
    return `${(used / 1024 / 1024 / 1024).toFixed(1)}/${(total / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function getBarColor(percent: number): string {
    // 상태 바 색상 구분: 낮음(정상)/중간(주의)/높음(위험)
    if (percent >= 90) {return '$(error)';}
    if (percent >= 70) {return '$(warning)';}
    return '';
}

export class ResourceMonitor {
    private statusBarItem: vscode.StatusBarItem;
    private timer: NodeJS.Timeout | undefined;
    private enabled = true;
    private config: MonitorConfig;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.config = getConfig();
        const alignment =
            this.config.statusBarPosition === 'left'
                ? vscode.StatusBarAlignment.Left
                : vscode.StatusBarAlignment.Right;

        this.statusBarItem = vscode.window.createStatusBarItem(
            alignment,
            this.config.statusBarPriority
        );
        this.statusBarItem.command = 'resourceMonitor.openSettings';
        this.statusBarItem.tooltip = 'Resource Monitor — 클릭하여 설정 열기';
        context.subscriptions.push(this.statusBarItem);
    }

    start() {
        this.config = getConfig();
        this.statusBarItem.text = '$(sync~spin) 리소스 로딩...';
        this.statusBarItem.show();
        this.scheduleUpdate();
    }

    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.statusBarItem.show();
            this.scheduleUpdate();
            vscode.window.showInformationMessage('Resource Monitor: 활성화됨');
        } else {
            this.stop();
            this.statusBarItem.hide();
            vscode.window.showInformationMessage('Resource Monitor: 비활성화됨');
        }
    }

    restart() {
        this.stop();
        // 상태 바 아이템 재생성 (위치가 바뀔 수 있음)
        this.statusBarItem.dispose();
        this.config = getConfig();
        const alignment =
            this.config.statusBarPosition === 'left'
                ? vscode.StatusBarAlignment.Left
                : vscode.StatusBarAlignment.Right;
        this.statusBarItem = vscode.window.createStatusBarItem(
            alignment,
            this.config.statusBarPriority
        );
        this.statusBarItem.command = 'resourceMonitor.openSettings';
        this.statusBarItem.tooltip = 'Resource Monitor — 클릭하여 설정 열기';
        this.context.subscriptions.push(this.statusBarItem);

        if (this.enabled) {
            this.start();
        }
    }

    dispose() {
        this.stop();
        this.statusBarItem.dispose();
    }

    private scheduleUpdate() {
        if (!this.enabled) {return;}
        this.fetchAndUpdate().finally(() => {
            if (this.enabled) {
                this.timer = setTimeout(
                    () => this.scheduleUpdate(),
                    this.config.updateInterval
                );
            }
        });
    }

    private async fetchAndUpdate() {
        const cfg = this.config;
        const items = new Map<ItemKey, string>();

        try {
            // ── CPU (온도 인라인) ────────────────────────────
            if (cfg.showCpu) {
                const [load, tempResult] = await Promise.all([
                    si.currentLoad(),
                    cfg.showCpuTemp
                        ? si.cpuTemperature().catch(() => null)
                        : Promise.resolve(null),
                ]);
                const pct = load.currentLoad;
                const bar = getBarColor(pct);
                let text = `${bar}$(chip) CPU ${pct.toFixed(1)}%`;
                if (tempResult && tempResult.main > 0) {
                    text += ` ${tempResult.main.toFixed(0)}°C`;
                }
                items.set('cpu', text);
            }

            // ── 메모리 ────────────────────────────────────────
            if (cfg.showMemory) {
                const mem = await si.mem();
                const used = mem.active;
                const total = mem.total;
                const pct = (used / total) * 100;
                const bar = getBarColor(pct);
                const label = formatMemory(used, total, cfg.memoryUnit);
                items.set('memory', `${bar}$(server) RAM ${label}`);
            }

            // ── GPU / VRAM (온도 인라인) ───────────────────────
            if (cfg.showGpu || cfg.showGpuMemory) {
                try {
                    const graphics = await si.graphics();
                    const controllers = graphics.controllers;

                    if (controllers && controllers.length > 0) {
                        const gpu = controllers[0];

                        if (cfg.showGpu && gpu.utilizationGpu != null) {
                            const pct = gpu.utilizationGpu;
                            const bar = getBarColor(pct);
                            let text = `${bar}$(circuit-board) GPU ${pct.toFixed(1)}%`;
                            if (cfg.showGpuTemp && gpu.temperatureGpu != null && gpu.temperatureGpu > 0) {
                                text += ` ${gpu.temperatureGpu.toFixed(0)}°C`;
                            }
                            items.set('gpu', text);
                        }

                        if (cfg.showGpuMemory && gpu.memoryUsed != null && gpu.memoryTotal != null) {
                            const usedMB = gpu.memoryUsed;
                            const totalMB = gpu.memoryTotal;
                            const pct = (usedMB / totalMB) * 100;
                            const bar = getBarColor(pct);
                            items.set(
                                'gpuMemory',
                                `${bar}$(database) VRAM ${(usedMB / 1024).toFixed(1)}/${(totalMB / 1024).toFixed(1)} GB`
                            );
                        }
                    }
                } catch {
                    // GPU 정보 미지원 환경
                }
            }

            // ── 디스크 I/O ────────────────────────────────────
            if (cfg.showDisk) {
                try {
                    const disk = await si.disksIO();
                    if (disk) {
                        const readSpeed = disk.rIO_sec ?? 0;
                        const writeSpeed = disk.wIO_sec ?? 0;
                        items.set(
                            'disk',
                            `$(arrow-down) ${formatBytes(readSpeed * 512, cfg.networkUnit)} $(arrow-up) ${formatBytes(writeSpeed * 512, cfg.networkUnit)} HDD`
                        );
                    }
                } catch {
                    // 디스크 I/O 미지원
                }
            }

            // ── 네트워크 ──────────────────────────────────────
            if (cfg.showNetwork) {
                try {
                    const nets = await si.networkStats();
                    if (nets && nets.length > 0) {
                        let rxTotal = 0;
                        let txTotal = 0;
                        for (const net of nets) {
                            rxTotal += net.rx_sec ?? 0;
                            txTotal += net.tx_sec ?? 0;
                        }
                        items.set(
                            'network',
                            `$(cloud-download) ${formatBytes(rxTotal, cfg.networkUnit)} $(cloud-upload) ${formatBytes(txTotal, cfg.networkUnit)}`
                        );
                    }
                } catch {
                    // 네트워크 미지원
                }
            }

            // ── 배터리 ────────────────────────────────────────
            if (cfg.showBattery) {
                try {
                    const battery = await si.battery();
                    if (battery.hasBattery) {
                        const icon = battery.isCharging ? '$(plug)' : '$(battery)';
                        items.set('battery', `${icon} ${battery.percent.toFixed(0)}%`);
                    }
                } catch {
                    // 배터리 미지원
                }
            }

            // ── 프로세스 수 ───────────────────────────────────
            if (cfg.showProcessCount) {
                try {
                    const procs = await si.processes();
                    items.set('processCount', `$(list-unordered) ${procs.all} 프로세스`);
                } catch {
                    // 프로세스 미지원
                }
            }

        } catch (err) {
            this.statusBarItem.text = '$(alert) 리소스 오류';
            return;
        }

        // order 배열 순서대로 조합
        const parts: string[] = [];
        for (const key of cfg.order) {
            const item = items.get(key);
            if (item) { parts.push(item); }
        }

        if (parts.length === 0) {
            this.statusBarItem.text = '$(info) 모니터 비활성';
        } else {
            this.statusBarItem.text = parts.join('  ');
        }
        this.statusBarItem.show();
    }
}
