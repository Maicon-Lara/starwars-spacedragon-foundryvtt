// Teste do module.json — o arquivo sem o qual o módulo não instala.
//
// ── POR QUE ESTE TESTE EXISTE ───────────────────────────────────────────────
//
// Porque a 1.37.1 saiu com ele VAZIO, e a suíte deu 25 verdes. Um bump de
// versão escrito como
//
//     io.open(p, "w").write(io.open(p).read().replace(...))
//
// trunca o arquivo antes de ler, e o Python não reclama: o resultado é um
// manifesto de 0 byte, commitado, empacotado e publicado. O `make-zip.py`
// empacotou sem olhar, e o GitHub só recusou o upload por "Bad Content-Length".
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// Que o manifesto seja JSON válido e não vazio. Todo o resto do módulo pode
// estar perfeito; sem isto o Foundry não instala nada.
//
// Uso: node tools/teste-manifesto.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(fileURLToPath(import.meta.url), "../..");
const CAMINHO = path.join(RAIZ, "starwars-sd-module", "module.json");
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── O ARQUIVO EXISTE E TEM CONTEÚDO ──────────────────────────────────────── */

confere(fs.existsSync(CAMINHO), "não existe module.json — o módulo não instala");
const cru = fs.existsSync(CAMINHO) ? fs.readFileSync(CAMINHO, "utf8") : "";
confere(cru.length > 0,
  "o module.json está VAZIO. Foi assim que a 1.37.1 saiu: um bump que abre o " +
  "arquivo em modo escrita antes de ler trunca tudo, e nada mais reclama");
confere(cru.length > 500,
  `o module.json tem ${cru.length} byte(s) — pouco demais para um manifesto com 9 packs`);

let m = null;
try {
  m = JSON.parse(cru);
} catch (e) {
  confere(false, `o module.json não é JSON válido: ${e.message}`);
}

if (m) {
  /* ── OS CAMPOS SEM OS QUAIS O FOUNDRY RECUSA ─────────────────────────────── */

  for (const campo of ["id", "title", "version", "compatibility", "manifest", "download"]) {
    confere(m[campo] != null, `falta o campo obrigatório "${campo}"`);
  }
  confere(m.id === "starwars-sd",
    `o id virou "${m.id}" — mudar o id perde TODAS as flags e fichas já criadas`);
  confere(/^\d+\.\d+\.\d+$/.test(String(m.version ?? "")),
    `a versão "${m.version}" não é x.y.z`);

  // As URLs apontam para `latest`, e não para a versão: assim publicar uma
  // release nova não exige editar o manifesto — foi uma tag errada num fim de
  // semana que ensinou isso.
  for (const campo of ["manifest", "download"]) {
    confere(String(m[campo] ?? "").includes("/releases/latest/download/"),
      `${campo} não aponta para /releases/latest/download/ — apontando para uma ` +
      `versão fixa, toda release exige editar o manifesto, e um esquecimento ` +
      `serve o arquivo errado`);
  }

  /* ── O MÓDULO NÃO DECLARA MAIS TIPO DE ATOR ──────────────────────────────── */
  //
  // Esta asserção já foi a inversa: ela existia para impedir que o tipo `nave`
  // sumisse por acidente, porque um ator cujo tipo não existe mais não carrega.
  // Foi o que aconteceu com as naves do módulo `stardragon`.
  //
  // O tipo saiu de propósito na 1.40.0, depois de as naves da mesa serem
  // convertidas em personagens. A asserção virou de lado e continua útil: ela
  // agora impede que ele VOLTE. Um tipo de ator ressuscitado criaria naves
  // novas numa estrutura que nenhuma ficha deste módulo abre.
  const tipos = m.documentTypes?.Actor ?? {};
  confere(!("nave" in tipos),
    "o tipo de ator `nave` voltou ao manifesto — ele foi aposentado na 1.40.0, e " +
    "criar atores nele agora é criar naves que nenhuma ficha abre");

  /* ── OS PACKS APONTAM PARA PASTAS QUE EXISTEM ────────────────────────────── */

  const packs = m.packs ?? [];
  confere(packs.length > 0, "nenhum pack declarado");
  for (const p of packs) {
    const destino = path.join(RAIZ, "starwars-sd-module", p.path.replace(/^.*?starwars-sd-module\//, ""));
    const alt = path.join(RAIZ, "starwars-sd-module", p.path);
    confere(fs.existsSync(destino) || fs.existsSync(alt),
      `o pack "${p.name}" aponta para ${p.path}, que não existe — ` +
      `o Foundry mostra um compêndio vazio e não avisa`);
  }

  /* ── A VERSÃO BATE COM O CHANGELOG ───────────────────────────────────────── */
  //
  // Não é perfeccionismo: publicar com o changelog de outra versão foi
  // exatamente a confusão da release com a tag errada.
  const log = fs.readFileSync(path.join(RAIZ, "CHANGELOG.md"), "utf8");
  const primeira = /^##\s+(\d+\.\d+\.\d+)/m.exec(log)?.[1];
  confere(primeira === m.version,
    `o manifesto diz ${m.version} e o CHANGELOG começa em ${primeira} — ` +
    `um dos dois está desatualizado, e quem lê a release vê o outro`);
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  `  ✔ manifesto: ${m.version} com conteúdo de verdade (${cru.length} bytes), os campos ` +
    `obrigatórios, o id intacto, as URLs em /latest/, o tipo de ator "nave" fora (aposentado na 1.40.0), os ` +
    `${m.packs.length} packs apontando para pastas que existem, e o CHANGELOG na mesma versão`
);
