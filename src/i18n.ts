import * as vscode from "vscode";

const strings = {
    ko: {
        loading: "$(sync~spin) 리소스 로딩...",
        tooltip: "Resource Monitor — 클릭하여 설정 열기",
        enabled: "Resource Monitor: 활성화됨",
        disabled: "Resource Monitor: 비활성화됨",
        error: "$(alert) 리소스 오류",
        inactive: "$(info) 모니터 비활성",
        processes: "프로세스",
    },
    en: {
        loading: "$(sync~spin) Loading resources...",
        tooltip: "Resource Monitor — Click to open settings",
        enabled: "Resource Monitor: Enabled",
        disabled: "Resource Monitor: Disabled",
        error: "$(alert) Resource error",
        inactive: "$(info) Monitor inactive",
        processes: "processes",
    },
} as const;

type StringKey = keyof typeof strings.en;

function isKorean(): boolean {
    return vscode.env.language.startsWith("ko");
}

export function t(key: StringKey): string {
    return isKorean() ? strings.ko[key] : strings.en[key];
}
