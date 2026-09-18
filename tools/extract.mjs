// Verificação: extrai os packs LevelDB compilados de volta para JSON,
// em _verify/, para conferência manual. Não afeta o build.
//
// Uso: npm run extract

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractPack } from "@foundryvtt/foundryvtt-cli";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const PACKS = path.join(ROOT, "starwars-sd-module", "packs");
const OUT = path.join(ROOT, "_verify");

// Extrai o que existir — a lista de packs cresce conforme o módulo evolui.
for (const name of fs.readdirSync(PACKS)) {
  await extractPack(path.join(PACKS, name), path.join(OUT, name), {
    yaml: false,
    log: false,
  });
  console.log(`  ✔ ${name} → _verify/${name}`);
}
console.log("Verificação extraída em _verify/.");
