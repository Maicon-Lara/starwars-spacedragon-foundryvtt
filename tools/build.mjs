// Build dos compêndios de "Star Wars — Suplemento de Cenário para Space Dragon".
// 1) Gera os arquivos-fonte JSON (versionados em packs-src/).
// 2) Compila cada pack para LevelDB em starwars-sd-module/packs/.
//
// A fonte é o cofre: Documents\Ekhoria\20 Space Dragon\Space Dragon Suplemento\
//
// A estrutura é a do Star Dragon (sw-spacedragon-foundryvtt), de propósito:
// os dois módulos contam Star Wars com as mesmas classes, e quem mexe num acha
// as coisas no outro. O que NÃO veio de lá:
//   · a progressão por chassi e a tabela de Grandezas (progressoes.mjs), que
//     eram do Old Dragon 2 — aqui cada classe traz a própria tabela de
//     níveis, como no Space Dragon;
//   · as Ameaças de A Longa Sombra (ameacas.mjs), que são de uma campanha;
//   · o script de Corrupção pronto: a regra é outra no Suplemento.
//
// Uso: npm run build   (a partir da raiz do repositório)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePack } from "@foundryvtt/foundryvtt-cli";

import {
  folderDoc, aninhaPastas, classDoc, classAbilityDoc, raceDoc, raceAbilityDoc,
  weaponDoc, armorDoc, miscDoc, spellDoc, journalDoc, macroDoc, rollTableDoc, itemUuid, writeSource, pintaPastas,
} from "./lib.mjs";
import { monsterDoc } from "./lib-actors.mjs";

import { classes } from "./data/classes.mjs";
import { variantes } from "./data/variantes.mjs";
import { especies, especieAbilitiesAvulsas } from "./data/especies.mjs";
import { classAbilitiesAvulsas, origensAvulsas } from "./data/avulsas.mjs";
import { categorias } from "./data/equipamentos.mjs";
import { listasDePoder, poderesJournal } from "./data/poderes.mjs";
import { grupos as gruposBestiario } from "./data/bestiario.mjs";
import { navesJournal } from "./data/naves.mjs";
import { bestiarioJournal } from "./data/bestiario-journal.mjs";
import { equipamentosJournal } from "./data/equipamentos-journal.mjs";
import { feitosJournal } from "./data/feitos-journal.mjs";
import { mestreJournal } from "./data/mestre-journal.mjs";
import { criacaoJournal } from "./data/criacao-journal.mjs";
import { macros } from "./data/macros.mjs";
import { CORES_DE_PASTA } from "./data/pastas.mjs";
import { tabelas } from "./data/tabelas.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const SRC = path.join(ROOT, "packs-src");
const OUT = path.join(ROOT, "starwars-sd-module", "packs");

const CLASSES_PACK = "starwars-sd-classes";
const ESPECIES_PACK = "starwars-sd-especies";
const EQUIPAMENTOS_PACK = "starwars-sd-equipamentos";
const PODERES_PACK = "starwars-sd-poderes";
const BESTIARIO_PACK = "starwars-sd-bestiario";
const JOURNAL_PACK = "starwars-sd-journal";
const MACROS_PACK = "starwars-sd-macros";
const TABELAS_PACK = "starwars-sd-tabelas";

// Agrupa documentos avulsos em pastas nomeadas pelo campo `folder`.
function agrupaAvulsas(docs, lista, seed, build) {
  const folders = {};
  lista.forEach((ab, i) => {
    if (!folders[ab.folder]) {
      folders[ab.folder] = folderDoc(ab.folder, "Item", seed);
      docs.push(folders[ab.folder]);
    }
    docs.push(build(ab, folders[ab.folder]._id, ab.folder, (i + 1) * 100000));
  });
}

// ── Pack de classes (classes + class_abilities, agrupadas em folders) ──
function buildClassesDocs() {
  const docs = [];
  for (const cls of [...classes, ...variantes]) {
    // O item da classe mostra só a especialização; a pasta, o nome completo
    // ("Sensível à Força — Guardião"), que é o que aninhaPastas() usa para
    // montar Sensível à Força › Guardião. Os _id são semeados pelo completo.
    const nomeCompleto = cls.nome;
    const nomeCurto = nomeCompleto.split(" — ").pop();
    const folder = folderDoc(nomeCompleto, "Item", "classes");
    docs.push(folder);
    const abilityUuids = [];
    cls.habilidades.forEach((ab, i) => {
      const doc = classAbilityDoc(ab, folder._id, nomeCompleto, (i + 1) * 100000);
      docs.push(doc);
      abilityUuids.push(itemUuid(CLASSES_PACK, doc._id));
    });
    docs.push(classDoc({ ...cls, nome: nomeCurto, seedNome: nomeCompleto }, folder._id, abilityUuids));
  }
  // Formas de Sabre e a Senda Mandaloriana: habilidades escolhidas à parte.
  agrupaAvulsas(docs, classAbilitiesAvulsas, "classes", classAbilityDoc);
  return docs;
}

// ── Pack de espécies (races + race_abilities, agrupadas em folders) ──
function buildEspeciesDocs() {
  const docs = [];
  for (const esp of especies) {
    const folder = folderDoc(esp.nome, "Item", "especies");
    docs.push(folder);
    const abilityUuids = [];
    esp.habilidades.forEach((ab, i) => {
      const doc = raceAbilityDoc(ab, folder._id, esp.nome, (i + 1) * 100000);
      docs.push(doc);
      abilityUuids.push(itemUuid(ESPECIES_PACK, doc._id));
    });
    docs.push(raceDoc(esp, folder._id, abilityUuids));
  }
  // Habilidades de espécie avulsas e a Origem Filho de Mandalore.
  agrupaAvulsas(docs, [...especieAbilitiesAvulsas, ...origensAvulsas], "especies", raceAbilityDoc);
  return docs;
}

// ── Pack de equipamentos (armas, armaduras e vestes, aparelhos, aparatos) ──
function buildEquipamentosDocs() {
  const builders = { weapon: weaponDoc, armor: armorDoc, misc: miscDoc };
  const docs = [];
  for (const cat of categorias) {
    const folder = folderDoc(cat.folder, "Item", "equipamentos");
    docs.push(folder);
    const build = builders[cat.tipo];
    cat.itens.forEach((it, i) => {
      docs.push(build(it, folder._id, cat.folder, (i + 1) * 100000));
    });
  }
  return docs;
}

// ── Pack de poderes da Força (1ª a 10ª Grandeza, por corrente) ──
function buildPoderesDocs() {
  const docs = [];
  for (const lista of listasDePoder) {
    const corrente = folderDoc(lista.folder, "Item", "poderes");
    docs.push(corrente);

    // Dentro da corrente, uma subpasta por Grandeza. No Space Dragon elas vão
    // da 1ª à 10ª, e o módulo Space Dragon já ensina a ficha a mostrar a 10ª.
    const porGrandeza = new Map();
    for (const p of lista.poderes) {
      const g = p.circle ?? 1;
      if (!porGrandeza.has(g)) porGrandeza.set(g, []);
      porGrandeza.get(g).push(p);
    }

    for (const g of [...porGrandeza.keys()].sort((a, b) => a - b)) {
      // A seed inclui a corrente: sem isso, a "1ª Grandeza" da Luz e a da
      // Sombra gerariam o mesmo _id e uma sobrescreveria a outra.
      const sub = folderDoc(`${g}ª Grandeza`, "Item", `poderes:${lista.folder}`, {
        parentId: corrente._id,
        sort: g * 100000,
      });
      docs.push(sub);
      porGrandeza.get(g).forEach((p, i) => {
        docs.push(spellDoc({ ...p, school: lista.school }, sub._id, lista.school, (i + 1) * 100000));
      });
    }
  }
  return docs;
}

// ── Pack de bestiário (Actors do tipo monster) ──
function buildBestiarioDocs() {
  const docs = [];
  for (const grupo of gruposBestiario) {
    const folder = folderDoc(grupo.folder, "Actor", "bestiario");
    docs.push(folder);
    grupo.monstros.forEach((m, i) => {
      docs.push(monsterDoc(m, folder._id, grupo.folder, (i + 1) * 100000));
    });
  }
  return docs;
}

// ── Pack de journal (referência do mestre) ──
// Journal sem página ainda não foi transcrito e fica de fora: um diário vazio
// no compêndio parece conteúdo perdido.
function buildJournalDocs() {
  return [
    criacaoJournal, equipamentosJournal, feitosJournal, poderesJournal,
    navesJournal, bestiarioJournal, mestreJournal,
  ]
    .filter((e) => (e.pages?.length ?? 0) > 0 || e.content)
    .map((e, i) => journalDoc(e, (i + 1) * 100000));
}

// ── Pack de tabelas roláveis ──
// As mesmas tabelas da Seção do Mestre, em forma clicável. O journal
// continua lá: quem quer ler a tabela inteira lê, quem quer rolar rola.
function buildTabelasDocs() {
  const docs = [];
  const pastas = new Map();
  tabelas.forEach((t, i) => {
    if (!pastas.has(t.pasta)) {
      const f = folderDoc(t.pasta, "RollTable", "tabelas");
      pastas.set(t.pasta, f);
      docs.push(f);
    }
    const doc = rollTableDoc(t, (i + 1) * 100000);
    doc.folder = pastas.get(t.pasta)._id;
    docs.push(doc);
  });
  return docs;
}

// ── Pack de macros ──
// Botões arrastáveis; a lógica mora no script do módulo (game.starwarsSD.*).
function buildMacrosDocs() {
  return macros.map((m, i) => macroDoc(m, null, (i + 1) * 100000));
}

async function compile(packName, docs) {
  const srcDir = path.join(SRC, packName);
  const outDir = path.join(OUT, packName);
  // Converte a hierarquia dos NOMES ("Sensível à Força — Guardião") em pastas
  // aninhadas de verdade. Vale para todos os packs, por isso mora aqui.
  const arvore = aninhaPastas(docs);
  // Depois de aninhar, não antes: a herança de cor precisa da hierarquia pronta.
  const pintadas = pintaPastas(arvore, CORES_DE_PASTA);
  const n = writeSource(srcDir, arvore);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  await compilePack(srcDir, outDir, { log: false });
  console.log(`  ✔ ${packName}: ${n} documentos → LevelDB (${pintadas} pastas coloridas)`);
}

async function main() {
  console.log("Gerando compêndios de Star Wars (Space Dragon)…");
  await compile(ESPECIES_PACK, buildEspeciesDocs());
  await compile(CLASSES_PACK, buildClassesDocs());
  await compile(EQUIPAMENTOS_PACK, buildEquipamentosDocs());
  await compile(PODERES_PACK, buildPoderesDocs());
  await compile(BESTIARIO_PACK, buildBestiarioDocs());
  await compile(JOURNAL_PACK, buildJournalDocs());
  await compile(MACROS_PACK, buildMacrosDocs());
  await compile(TABELAS_PACK, buildTabelasDocs());
  console.log("Concluído.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
