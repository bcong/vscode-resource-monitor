import * as vscode from 'vscode';
import { ResourceMonitor } from './monitor';

let monitor: ResourceMonitor | undefined;

export function activate(context: vscode.ExtensionContext) {
    monitor = new ResourceMonitor(context);
    monitor.start();

    // 설정 열기 커맨드
    context.subscriptions.push(
        vscode.commands.registerCommand('resourceMonitor.openSettings', () => {
            vscode.commands.executeCommand(
                'workbench.action.openSettings',
                'resourceMonitor'
            );
        })
    );

    // 켜기/끄기 커맨드
    context.subscriptions.push(
        vscode.commands.registerCommand('resourceMonitor.toggle', () => {
            if (monitor) {
                monitor.toggle();
            }
        })
    );

    // 설정 변경 감지 → 재시작
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('resourceMonitor') && monitor) {
                monitor.restart();
            }
        })
    );
}

export function deactivate() {
    if (monitor) {
        monitor.dispose();
        monitor = undefined;
    }
}
