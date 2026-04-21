const fs = require("fs");
const path = require("path");

const pkgPath = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, "0");
const dd = String(now.getDate()).padStart(2, "0");
const hh = String(now.getHours()).padStart(2, "0");
const min = String(now.getMinutes()).padStart(2, "0");
const ss = String(now.getSeconds()).padStart(2, "0");

// semver 규칙: 숫자 식별자는 0으로 시작할 수 없음 → parseInt로 leading zero 제거
// 예: 2026.421.234225 (April 21, 23:42:25)
const mmdd = parseInt(`${mm}${dd}`, 10); // "0421" → 421
const hhmmss = parseInt(`${hh}${min}${ss}`, 10); // "234225" → 234225
const version = `${yyyy}.${mmdd}.${hhmmss}`;

pkg.version = version;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4), "utf8");
console.log(`Version set to ${version}`);
