const JavaScriptObfuscator = require("javascript-obfuscator");
const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "out");
const files = fs.readdirSync(outDir).filter((f) => f.endsWith(".js"));

for (const file of files) {
    const filePath = path.join(outDir, file);
    const code = fs.readFileSync(filePath, "utf8");

    const result = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.5,
        deadCodeInjection: false,
        identifierNamesGenerator: "hexadecimal",
        renameGlobals: false,
        selfDefending: false,
        stringArray: true,
        stringArrayEncoding: ["base64"],
        stringArrayThreshold: 0.75,
        transformObjectKeys: true,
        unicodeEscapeSequence: false,
        sourceMap: false,
    });

    fs.writeFileSync(filePath, result.getObfuscatedCode(), "utf8");
    console.log(`Obfuscated: ${file}`);
}

console.log("Obfuscation complete.");
