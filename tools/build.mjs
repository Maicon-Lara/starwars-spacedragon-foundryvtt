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
  md, tabelaHTML,
} from "./lib.mjs";
import { monsterDoc } from "./lib-actors.mjs";

import { classes } from "./data/classes.mjs";
import { variantes, CAMINHO_E_CORPO } from "./data/variantes.mjs";
import { BASE, ESPECIALIZACOES } from "./data/progressoes.mjs";
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

// ── As tabelas de progressão viram `levels` ────────────────────────────────
//
// O `levels` do OD2 guarda três números por nível: xp, ba e jp. A tabela do
// cofre tem mais que isso ("+7/+1", "⊘ 13", "**+5**"), e o resto vai inteiro
// na descrição — aqui só se tira o número que o sistema sabe ler.

/** "**+7/+1**" → 7; "⊘ 13" → 13; "1.256.000" → 1256000. */
function numero(celula) {
  const limpo = String(celula ?? "").replace(/\*\*/g, "").replace(/⊘/g, "");
  const m = limpo.match(/-?\d[\d.]*/);
  return m ? Number(m[0].replace(/\./g, "")) : 0;
}

const coluna = (t, ...nomes) => t.cabecalho.findIndex((h) => nomes.includes(h));

/**
 * O `levels` de uma classe. A especialização começa no 5º: do 1º ao 4º vale a
 * tabela da base, e do 5º em diante a BA e a JP da especialização, QUANDO a
 * tabela dela tem essas colunas. As do Operativo não têm, porque as trilhas
 * dele só mexem nos talentos — e aí fica a da base.
 */
function levelsDe(base, spec) {
  const [iXp, iBa, iJp] = [coluna(base, "XP"), coluna(base, "BA"), coluna(base, "JP")];
  const out = {};
  base.linhas.forEach((l, i) => {
    const xp = numero(l[iXp]);
    // Mesmo formato do módulo Space Dragon: sem `xp` no 1º nível, que é zero.
    out[String(i + 1)] = { ba: numero(l[iBa]), jp: numero(l[iJp]), ...(xp ? { xp } : {}) };
  });
  if (spec) {
    const [sNv, sBa, sJp] = [coluna(spec, "Nv"), coluna(spec, "BA"), coluna(spec, "JP")];
    for (const l of spec.linhas) {
      const n = String(numero(l[sNv]));
      if (sBa >= 0) out[n].ba = numero(l[sBa]);
      if (sJp >= 0) out[n].jp = numero(l[sJp]);
    }
  }
  return out;
}

/** Texto do cofre com parágrafos separados por linha em branco → <p>s. */
const paragrafos = (s) => (s ? s.split(/\n\n+/).map((x) => `<p>${md(x)}</p>`).join("") : "");

// ── Pack de classes ────────────────────────────────────────────────────────
//
// Uma pasta por classe-base, e dentro dela uma por especialização:
// "Veterano — Mercenário" vira Veterano › Mercenário pelo aninhaPastas().
//
// A especialização é um item de classe PRÓPRIO que herda as habilidades da
// base (os mesmos UUIDs, sem cópia) e acrescenta as suas. No item, a
// especialização vem primeiro — "Mercenário — Veterano" —, que é como o
// módulo Space Dragon faz e o que se procura numa lista. O _id é semeado pela
// forma "Classe — Especialização", a da pasta.
function buildClassesDocs() {
  const docs = [];
  for (const cls of classes) {
    const tabela = BASE[cls.nome];
    if (!tabela) throw new Error(`sem tabela de progressão para ${cls.nome}`);

    const folder = folderDoc(cls.nome, "Item", "classes");
    docs.push(folder);
    const habsBase = cls.habilidades.map((ab, i) => classAbilityDoc(ab, folder._id, cls.nome, (i + 1) * 100000));
    docs.push(...habsBase);
    const uuidsBase = habsBase.map((h) => itemUuid(CLASSES_PACK, h._id));

    const specs = variantes.filter((v) => v.classe === cls.nome);
    const descricaoBase =
      cls.descricao +
      tabelaHTML(`Tabela do ${cls.nome}`, tabela) +
      (cls.notaTabela ? `<p>${md(cls.notaTabela)}</p>` : "") +
      `<p><strong>Especializações (5º nível):</strong> ${specs.map((v) => v.nome).join(", ")}.</p>`;
    docs.push(classDoc({ ...cls, descricao: descricaoBase, levels: levelsDe(tabela) }, folder._id, uuidsBase));

    for (const v of specs) {
      const tSpec = ESPECIALIZACOES[v.nome];
      if (!tSpec) throw new Error(`sem tabela de progressão para ${v.nome}`);
      const seedNome = `${cls.nome} — ${v.nome}`;
      const pasta = folderDoc(seedNome, "Item", "classes");
      docs.push(pasta);
      const habsSpec = v.habilidades.map((ab, i) => classAbilityDoc(ab, pasta._id, seedNome, (i + 1) * 100000));
      docs.push(...habsSpec);

      const quem = v.afiliacao
        ? `Especialização de ${cls.nome}, para Afiliação <strong>${v.afiliacao}</strong>`
        : `Senda do ${cls.nome}`;
      const deOnde = v.base ? ` — <em>base: ${v.base}</em>` : v.origem ? ` — <em>${v.origem}</em>` : "";
      const descricao =
        `<p><em>${v.frase}</em>${deOnde}</p>` +
        `<p>${quem}, escolhida no <strong>5º nível</strong>. Mantém tudo o que o ${cls.nome} já lhe deu, e as habilidades da classe seguem na ficha.</p>` +
        paragrafos(v.intro) +
        (cls.nome === "Sensível à Força" ? CAMINHO_E_CORPO : "") +
        tabelaHTML(`Progressão do ${v.nome} — do 5º ao 20º nível`, tSpec) +
        `<blockquote>${paragrafos(v.exemplos)}</blockquote>` +
        paragrafos(v.extra) +
        tabelaHTML(`Do 1º ao 4º nível: a tabela do ${cls.nome}`, { ...tabela, linhas: tabela.linhas.slice(0, 4) });

      docs.push(classDoc({
        ...cls,
        nome: `${v.nome} — ${cls.nome}`,
        seedNome,
        flavor: `<p><em>${v.frase}</em></p>`,
        descricao,
        equipment_restrictions: { ...cls.equipment_restrictions, ...(v.restricoes ?? {}) },
        levels: levelsDe(tabela, tSpec),
      }, pasta._id, [...uuidsBase, ...habsSpec.map((h) => itemUuid(CLASSES_PACK, h._id))]));
    }
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
        docs.push(spellDoc({ ...p, school: lista.school }, sub._id, lista.folder, (i + 1) * 100000));
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
