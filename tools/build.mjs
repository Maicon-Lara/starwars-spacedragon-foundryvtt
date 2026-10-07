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
  weaponDoc, armorDoc, miscDoc, spellDoc, journalDoc, macroDoc, rollTableDoc, efeitoQdVDoc, enfeitarDoc, itemUuid, writeSource, pintaPastas,
  md, tabelaHTML,
} from "./lib.mjs";
import { monsterDoc } from "./lib-actors.mjs";

import { classes } from "./data/classes.mjs";
import { variantes, CAMINHO_E_CORPO } from "./data/variantes.mjs";
import { BASE, ESPECIALIZACOES } from "./data/progressoes.mjs";
import { especies, especieAbilitiesAvulsas } from "./data/especies.mjs";
import { classAbilitiesAvulsas, origensAvulsas, sendaMandaloriana, sendaJournal } from "./data/avulsas.mjs";
import { categorias } from "./data/equipamentos.mjs";
import { listasDePoder, poderesJournal, ordensJournal } from "./data/poderes.mjs";
import { grupos as gruposBestiario } from "./data/bestiario.mjs";
import { navesJournal } from "./data/naves.mjs";
import { referenciaJournal } from "./data/referencia.mjs";
import { bestiarioJournal } from "./data/bestiario-journal.mjs";
import { equipamentosJournal, sabreJournal } from "./data/equipamentos-journal.mjs";
import { feitosJournal } from "./data/feitos-journal.mjs";
import { mestreJournal } from "./data/mestre-journal.mjs";
import { criacaoJournal } from "./data/criacao-journal.mjs";
import { macros } from "./data/macros.mjs";
import { CORES_DE_PASTA } from "./data/pastas.mjs";
import { tabelas } from "./data/tabelas.mjs";
import { EFEITOS_CRITICOS, templateDoQdV, QDV_ID, QDV_FLAG } from "./data/efeitos-criticos.mjs";
import { equipamentosDeNave } from "./data/equipamentos-de-nave.mjs";
import { camarasDeNave } from "./data/camaras-de-nave.mjs";
import { tiposComoRaca } from "./data/tipos-como-raca.mjs";
import { classesDeNave, comodosDaNave } from "./data/classes-de-nave.mjs";

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
const EFEITOS_PACK = "starwars-sd-efeitos";
const NAVES_PACK = "starwars-sd-naves";

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

// ── A tabela da especialização, para o motor do Space Dragon ──────────────
//
// O motor rola Sabotagem, Pilotar, Operar Máquinas, o orçamento mental e o
// crítico pela tabela do LIVRO, e a especialização só existia no texto: o
// Sabotador rolava a Sabotagem do Operativo, sem os +16% do 5º nível, e o
// jogador tinha de somar à mão. O item de classe agora leva a tabela do cofre,
// nível a nível, em `flags.spacedragon.progressao` (ver chassi.js do módulo
// Space Dragon, que cai na tabela do livro onde a especialização não fala).

/** Coluna da tabela do cofre → coluna do livro que o motor lê. */
const COLUNA_DO_LIVRO = {
  "Sabotagem": "sabotagem", "Escalar": "escalar", "Furtividade": "furtividade",
  "Furtar": "furtar", "Percepção": "percepcao",
  "Pilotar": "pilotarNaves", "Desarmar": "desarmarSubjugar", "Crítico": "danoCritico",
  "Operar Máq.": "operarMaquinas",
  "Alcance": "alcanceMental", "Grandeza": "grandezaMental",
};

/**
 * O que a especialização muda no AJUSTE de atributo, e não na tabela. O
 * Espião: "O Crédito Tecnológico (por Ciência) conta dobrado" na Sabotagem.
 */
const AJUSTE_DA_ESPECIALIZACAO = { "Espião": { sabotagem: 2 } };

const limpaCelula = (c) => String(c ?? "").replace(/\*\*/g, "").replace(/⊘/g, "").trim();

export function progressaoDaTabela(fonte, t) {
  const iNv = coluna(t, "Nv");
  const iRodadas = coluna(t, "Rodadas");
  // Os PV que a especialização dá por nível. O Artífice os teve numa coluna
  // própria ("PV por nível") e depois direto no DV: a tabela do cofre passou a
  // trazer "+4" no 17º, somando o +2 da base ao +2 extra. Aceitamos as duas
  // grafias — sem isto, mudar o cabeçalho no cofre apaga os PV em silêncio,
  // porque o build continua passando: ninguém valida uma coluna que sumiu.
  const iPV = coluna(t, "PV por nível", "DV");
  const colunas = {};
  t.cabecalho.forEach((h, i) => {
    const col = COLUNA_DO_LIVRO[h];
    if (!col) return;
    colunas[col] = {};
    for (const l of t.linhas) {
      let v = limpaCelula(l[i]);
      // Como na tabela do livro: "51% / 1d8", as rodadas depois da barra.
      if (col === "sabotagem" && iRodadas >= 0) v = `${v} / ${limpaCelula(l[iRodadas])}`;
      colunas[col][limpaCelula(l[iNv])] = v;
    }
  });
  // Só as células "+N" entram: no começo da tabela a coluna DV traz o NÚMERO
  // de dados de vida ("5", "6"…), que não é bônus fixo e não pode virar PV.
  if (iPV >= 0) {
    for (const l of t.linhas) {
      const v = limpaCelula(l[iPV]);
      if (/^\+\d+$/.test(v)) (colunas.dv ??= {})[limpaCelula(l[iNv])] = `${v} PV`;
    }
  }
  const ajuste = AJUSTE_DA_ESPECIALIZACAO[fonte];
  return { fonte, colunas, ...(ajuste ? { ajuste } : {}) };
}

/** A flag do chassi com a tabela da especialização junto. */
const comProgressao = (flags, progressao) => ({
  ...flags,
  spacedragon: { ...(flags?.spacedragon ?? {}), progressao },
});

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
// ── Variantes com a escolha embutida ───────────────────────────────────────
//
// O sistema NÃO aceita habilidade de classe solta no personagem: a ficha
// recusa com "Habilidades de classe não podem ser adicionadas diretamente ao
// personagem. Adicione-as à classe do personagem." O caminho nativo é abrir o
// item da classe na ficha e soltar a habilidade DENTRO dele — funciona, mas
// ninguém descobre sozinho.
//
// Então, como no Star Dragon, a escolha que todo personagem daquela trilha
// faz — a Forma do Guardião, a Forma que o clã ensina ao Mandaloriano
// Sensível — vira uma VARIANTE de classe com a habilidade já dentro: arrasta a
// classe certa e acabou. As variantes apontam para as habilidades avulsas
// (mesmo UUID, sem cópia de texto), que continuam no compêndio para a segunda
// e a terceira Forma.

/** "Shii-Cho (I)" → "Shii-Cho"; "Juyo / Vaapad (VII)" → "Juyo / Vaapad". */
const nomeCurtoDaForma = (nome) => nome.split("(")[0].trim();
const COMO_ADICIONAR =
  "<p class='nota-casa'><em>Para somar uma Forma a mais, abra o item da classe na ficha e solte a Forma " +
  "do compêndio dentro dele: o sistema não aceita habilidade de classe solta no personagem.</em></p>";

function buildClassesDocs() {
  const docs = [];
  const uuidsDaBase = new Map();

  // As avulsas primeiro: as variantes apontam para elas.
  const avulsas = [];
  agrupaAvulsas(avulsas, classAbilitiesAvulsas, "classes", classAbilityDoc);
  const uuidAvulsa = new Map(
    avulsas.filter((d) => d.type === "class_ability").map((d) => [d.name, itemUuid(CLASSES_PACK, d._id)])
  );
  const formas = classAbilitiesAvulsas.filter((a) => a.folder === "Formas de Sabre (Guardião)" && a.nome !== "Mudar de Guarda");
  const mudarDeGuarda = uuidAvulsa.get("Mudar de Guarda");
  if (formas.length !== 7 || !mudarDeGuarda) throw new Error("as Formas de Sabre e o Mudar de Guarda precisam estar nas avulsas");

  for (const cls of classes) {
    const tabela = BASE[cls.nome];
    if (!tabela) throw new Error(`sem tabela de progressão para ${cls.nome}`);

    const folder = folderDoc(cls.nome, "Item", "classes");
    docs.push(folder);
    const habsBase = cls.habilidades.map((ab, i) => classAbilityDoc(ab, folder._id, cls.nome, (i + 1) * 100000));
    docs.push(...habsBase);
    const uuidsBase = habsBase.map((h) => itemUuid(CLASSES_PACK, h._id));
    uuidsDaBase.set(cls.nome, uuidsBase);

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

      const guardiao = v.nome === "Guardião";
      const uuidsSpec = habsSpec.map((h) => itemUuid(CLASSES_PACK, h._id));
      const especializacao = {
        ...cls,
        nome: `${v.nome} — ${cls.nome}`,
        seedNome,
        flavor: `<p><em>${v.frase}</em></p>`,
        descricao: descricao + (guardiao
          ? "<p><strong>Prefira a variante com a sua Forma</strong> — <em>Guardião (Ataru)</em> e as outras seis, " +
            "nesta mesma pasta: a Forma Mestra já vem dentro. Esta, genérica, é para quem ainda vai escolher." +
            "</p>" + COMO_ADICIONAR
          : ""),
        equipment_restrictions: { ...cls.equipment_restrictions, ...(v.restricoes ?? {}) },
        levels: levelsDe(tabela, tSpec),
        flags: comProgressao(cls.flags, progressaoDaTabela(v.nome, tSpec)),
      };
      // O Mudar de Guarda é patrimônio do Guardião, e chega no 10º com a
      // segunda Forma: vai na ficha dele, e não só no compêndio.
      docs.push(classDoc(especializacao, pasta._id, [...uuidsBase, ...uuidsSpec, ...(guardiao ? [mudarDeGuarda] : [])]));

      // ── Guardião: uma variante por Forma de Sabre ──
      if (guardiao) {
        const semPonteiro = habsSpec.filter((h) => h.name !== "Formas de Sabre").map((h) => itemUuid(CLASSES_PACK, h._id));
        formas.forEach((forma, k) => {
          const curto = nomeCurtoDaForma(forma.nome);
          docs.push({
            ...classDoc({
              ...especializacao,
              nome: `${v.nome} (${curto}) — ${cls.nome}`,
              seedNome: `${seedNome} (${curto})`,
              flavor: `<p><em>${v.frase}</em>, na Forma <strong>${curto}</strong>.</p>`,
              descricao:
                `<p><strong>Esta variante já traz a Forma ${curto} embutida</strong>: é a sua <strong>Forma Mestra</strong>, ` +
                "que progride inteira, nos degraus 5º, 10º e 20º. No 10º, o <em>Mudar de Guarda</em> abre a " +
                "segunda Forma (só até o degrau do 10º); no 20º, a terceira (só até o 5º).</p>" +
                COMO_ADICIONAR + descricao,
            }, pasta._id, [...uuidsBase, ...semPonteiro, uuidAvulsa.get(forma.nome), mudarDeGuarda]),
            sort: (k + 1) * 1000,
          });
        });
      }
    }
  }
  docs.push(...buildSendaDocs(uuidsDaBase, formas, uuidAvulsa));
  docs.push(...avulsas);
  return docs;
}

// ── A Senda Mandaloriana ───────────────────────────────────────────────────
//
// Cross-class: a mesma Senda para as quatro classes, no lugar da
// especialização. Vira uma classe por base — "Mandaloriano — Veterano" —
// numa pasta própria. As cinco habilidades do Núcleo existem UMA vez e as
// quatro classes apontam para elas; a troca é uma habilidade por classe.
function buildSendaDocs(uuidsDaBase, formas, uuidAvulsa) {
  const s = sendaMandaloriana;
  const docs = [];
  const pasta = folderDoc(s.pasta, "Item", "classes");
  docs.push(pasta);

  const nucleo = s.nucleo.map((n, i) => classAbilityDoc(n, pasta._id, s.pasta, (i + 1) * 100000));
  docs.push(...nucleo);
  const uuidsNucleo = nucleo.map((h) => itemUuid(CLASSES_PACK, h._id));

  classes.forEach((cls, j) => {
    const tabela = s.tabelas[cls.nome];
    const troca = classAbilityDoc(
      { nome: `Troca da Senda — ${cls.nome}`, level: 5, desc: s.trocas[cls.nome] },
      pasta._id, s.pasta, (10 + j) * 100000
    );
    docs.push(troca);
    const seedNome = `${s.pasta} — ${cls.nome}`;
    const sensivel = cls.nome === "Sensível à Força";
    const mandaloriano = {
        ...cls,
        nome: `Mandaloriano — ${cls.nome}`,
        seedNome,
        flavor: "<p><em>Mandaloriano não é uma espécie, é uma cultura.</em></p>",
        // O Núcleo dá o arsenal do clã por cima do que a classe permitia:
        // Treinamento de Clã (haste, arremesso, blasters, jetpack) e Sangue
        // de Beskar. Sem isto a ficha proibiria a própria Beskar da Senda.
        equipment_restrictions: {
          ...cls.equipment_restrictions,
          weapons: `${cls.equipment_restrictions.weapons} E o arsenal do clã: armas de haste, de arremesso e blasters (Treinamento de Clã).`,
          armors: `${cls.equipment_restrictions.armors} E a Armadura Beskar ou pesada de clã (Sangue de Beskar).`,
        },
        descricao:
          `<p>A <strong>Senda Mandaloriana</strong> para o ${cls.nome}, assumida no <strong>5º nível</strong> ` +
          "no lugar da especialização. Mantém tudo o que a classe já lhe deu, ganha o Núcleo Mandaloriano " +
          "e troca o que a tabela abaixo diz.</p>" +
          `<p><strong>O que troca:</strong></p>${s.trocas[cls.nome]}` +
          tabelaHTML(`Progressão do Mandaloriano ${cls.nome} — do 5º ao 20º nível`, tabela) +
          s.intro,
        levels: levelsDe(BASE[cls.nome], tabela),
        flags: comProgressao(cls.flags, progressaoDaTabela("Mandaloriano", tabela)),
    };
    const uuids = [...uuidsDaBase.get(cls.nome), ...uuidsNucleo, itemUuid(CLASSES_PACK, troca._id)];
    docs.push({
      ...classDoc({
        ...mandaloriano,
        descricao: mandaloriano.descricao + (sensivel
          ? "<p><strong>Prefira a variante com a Forma que o clã ensinou</strong> — <em>Mandaloriano (Ataru)</em> " +
            "e as outras seis, nesta mesma pasta. Esta, genérica, é para quem ainda vai escolher.</p>" + COMO_ADICIONAR
          : ""),
      }, pasta._id, uuids),
      sort: (j + 1) * 100000,
    });

    // ── O Sensível mandaloriano: uma variante por Forma que o clã ensina ──
    // Uma Forma só, até o degrau do 10º, e sem Mudar de Guarda — que é
    // patrimônio do Guardião.
    if (sensivel) {
      formas.forEach((forma, k) => {
        const curto = nomeCurtoDaForma(forma.nome);
        docs.push({
          ...classDoc({
            ...mandaloriano,
            nome: `Mandaloriano (${curto}) — ${cls.nome}`,
            seedNome: `${seedNome} (${curto})`,
            descricao:
              `<p><strong>Esta variante já traz a Forma ${curto}</strong>, a que o clã ensinou. Ela progride ` +
              "<strong>até o degrau do 10º</strong>, e é só ela: <em>Mudar de Guarda</em> é patrimônio do Guardião, " +
              "e o Mandaloriano não tem para onde trocar.</p>" + mandaloriano.descricao,
          }, pasta._id, [...uuids, uuidAvulsa.get(forma.nome)]),
          sort: (j + 1) * 100000 + (k + 1) * 1000,
        });
      });
    }
  });
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
  // Pasta por NOME, criada uma vez: duas categorias podem dividir a mesma
  // (as granadas, que se arremessam, e a detonita, que se fixa), e uma pasta
  // "Pai — Filho" precisa do pai existindo para aninhaPastas() encaixá-la.
  const pastas = new Map();
  const pasta = (nome) => {
    if (!pastas.has(nome)) {
      const pai = nome.includes(" — ") ? nome.split(" — ")[0] : null;
      if (pai) pasta(pai);
      const f = folderDoc(nome, "Item", "equipamentos", { sort: (pastas.size + 1) * 100000 });
      pastas.set(nome, f);
      docs.push(f);
    }
    return pastas.get(nome);
  };
  for (const cat of categorias) {
    const folder = pasta(cat.folder);
    const build = builders[cat.tipo];
    cat.itens.forEach((it, i) => {
      docs.push(build(it, folder._id, cat.folder, (i + 1) * 100000));
    });
  }

  return docs;
}

// ── Pack de Naves ──
//
// As peças da nave num compêndio só delas: quem está montando uma nave não quer
// percorrer blasters e rações até achar a Sala de Máquinas, e quem está
// equipando um personagem não quer tropeçar em Acelerador Hiperespacial.
//
// Os itens NÃO substituem o schema da nave — eles o ligam. Arrastar um para a
// ficha instala o equipamento (T10-4) ou constrói a câmara (T10-2). A regra
// continua em equipamentos-nave.js e camaras.js, testada sem Foundry.
function buildNavesDocs() {
  const docs = [];
  const pasta = (nome, seed) => {
    const f = folderDoc(nome, "Item", seed);
    docs.push(f);
    return f;
  };

  const fEquip = pasta("Equipamentos adicionais (T10-4)", "nave-equip-pasta");
  equipamentosDeNave.forEach((e, i) => {
    /* ── AS ARMAS SÃO `weapon`, E NÃO `misc` ──────────────────────────────
     *
     * Todos os equipamentos da T10-4 nasciam `misc` — item genérico. A mesa
     * reportou o efeito: as armas «estão como item geral, não como arma, e não
     * geram ataque». É exatamente isso: o sistema só desenha o botão de rolar
     * dano para itens do tipo `weapon` com `damage` preenchido, e um `misc`
     * fica na mochila sem nada para clicar.
     *
     * As cinco de combate com dano declarado (disparadores, canhões,
     * metralhadora, mísseis) viram arma de verdade. O Computador Balístico, os
     * Defletores e o Escudo de Força continuam `misc`, e devem continuar: eles
     * não atiram, modificam o que atira — e um "ataque" de Escudo de Força na
     * ficha seria um botão que ninguém saberia o que faz.
     *
     * `ranged` porque é o que o sistema usa para o que dispara à distância, e
     * `two_handed` porque uma arma de nave não é empunhada por ninguém — o
     * campo existe para o cálculo de mãos livres do personagem, e deixá-la
     * como arma de uma mão a tornaria combinável com escudo.
     */
    const dano = e.dano;
    const doc = dano
      ? weaponDoc(
          {
            nome: e.nome,
            desc: e.desc,
            img: e.img,
            damage: dano,
            ranged: true,
            melee: false,
            two_handed: true,
            // o alcance é o do combate espacial, que o §10.6 não mede em
            // metros: quem decide se a nave alvo está ao alcance é o Mestre
            shoot_range: 0,
          },
          fEquip._id, "nave-equip", (i + 1) * 100000)
      : miscDoc({ nome: e.nome, desc: e.desc, img: e.img },
          fEquip._id, "nave-equip", (i + 1) * 100000);
    doc.flags["starwars-sd"] = { equipamentoDeNave: { chave: e.chave, grupo: e.grupo, cabe: e.cabe } };
    docs.push(doc);
  });

  /* ── OS TIPOS DE NAVE, COMO RAÇA ─────────────────────────────────────────
   *
   * A nave numa ficha de personagem É de um tipo, e tipo é o que a raça
   * significa no Old Dragon 2. Arrastar "Caça" para a ficha dá CP 28 e
   * movimento 150 m pela maquinaria do sistema — `natural_armor` e `movement`
   * —, sem automação nossa.
   *
   * Cada tipo leva uma habilidade de raça com o que a raça NÃO carrega: a BA e
   * a JP (que no sistema vêm da classe) e a fórmula de PV (que a mesa rola).
   */
  {
    const fTipos = pasta("Tipos de nave (T10-1)", "nave-tipo-pasta");
    tiposComoRaca.forEach((t, i) => {
      const hab = raceAbilityDoc(t.habilidade, fTipos._id, `nave-tipo:${t.chave}`, (i + 1) * 1000);
      docs.push(hab);
      const raca = raceDoc({ ...t }, fTipos._id, [itemUuid(NAVES_PACK, hab._id)]);
      raca.sort = (i + 1) * 100000;
      docs.push(raca);
    });
  }

  /* ── UMA CLASSE POR TIPO, E OS CÔMODOS COMO HABILIDADES ──────────────────
   *
   * No Old Dragon 2 a BA e a JP vêm da CLASSE, por nível — e na T10-1 elas
   * variam por tipo. Uma classe "Nave" genérica daria os mesmos números a
   * todos; uma por tipo traz os certos pela maquinaria do sistema.
   *
   * As doze habilidades são COMPARTILHADAS pelas oito classes: o cômodo é o
   * mesmo em qualquer nave, e o que muda é quais estão instalados — estado do
   * ator, não da classe. Um cômodo, uma descrição, um lugar para corrigir.
   */
  {
    const fComodos = pasta("Cômodos (T10-2)", "nave-comodo-pasta");
    const uuids = comodosDaNave.map((c, i) => {
      const hab = classAbilityDoc(c, fComodos._id, "nave-comodo", (i + 1) * 1000);
      docs.push(hab);
      return itemUuid(NAVES_PACK, hab._id);
    });

    const fClasses = pasta("Tipos de nave — classe (T10-1)", "nave-classe-pasta");
    classesDeNave.forEach((c, i) => {
      const cls = classDoc(c, fClasses._id, uuids);
      cls.sort = (i + 1) * 100000;
      docs.push(cls);
    });
  }

  const fCamaras = pasta("Câmaras (T10-2)", "nave-camara-pasta");
  camarasDeNave.forEach((c, i) => {
    const doc = miscDoc({ nome: c.nome, desc: c.desc, img: c.img, cost: `${c.obra}` },
      fCamaras._id, "nave-camara", (i + 1) * 100000);
    doc.flags["starwars-sd"] = { camaraDeNave: { chave: c.chave } };
    docs.push(doc);
  });

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
//
// ── A COR E A EPÍGRAFE DE CADA CAPÍTULO ────────────────────────────────────
//
// Cada JournalEntry é um capítulo do livro, e recebe dele duas coisas: a
// CLASSE DE COR (styles/livro.css pinta a faixa de abertura, o fio da tabela,
// as tarjas e o marcador das listas) e a EPÍGRAFE, a linha em itálico que abre
// o capítulo antes da primeira regra.
//
// As epígrafes são as mesmas de _build/build_livro.py, no cofre — não há duas
// redações para a mesma frase. A numeração é a ordem desta lista, que é a
// ordem em que os capítulos aparecem no compêndio.
const CAPITULOS = [
  // A folha de consulta vem PRIMEIRO: é o que se abre quando a pergunta é
  // "onde está essa regra?", e um atalho no fim da lista não é atalho.
  [referenciaJournal, "index", "Onde está cada regra, e os números que não se quer procurar."],
  [criacaoJournal, "atributos", "Seis números, e o que cada um deixa você tentar."],
  [equipamentosJournal, "equip", "Créditos são o que separa a ideia da nave."],
  [sabreJournal, "sabre", "A lâmina é a parte fácil. O cristal escolhe."],
  [feitosJournal, "aparatos", "As engenhocas que esta galáxia tem no lugar de magia."],
  [poderesJournal, "forca", "Não é magia. É atenção."],
  [ordensJournal, "ordens", "Quem manda, quem ensina, e quem cobra."],
  [sendaJournal, "mando", "Esta é a Doutrina."],
  [navesJournal, "naves",
    "Ter uma nave é ter um problema com motores — e uma tripulação com o que fazer."],
  [bestiarioJournal, "bestiario", "O que vive lá fora, e o que ele quer de você."],
  [mestreJournal, "mestre", "A parte que os jogadores não leem."],
];

function buildJournalDocs() {
  return CAPITULOS
    .filter(([e]) => (e.pages?.length ?? 0) > 0 || e.content)
    .map(([e, cap, epigrafe], i) =>
      journalDoc({ ...e, cap, epigrafe, numero: i + 1 }, (i + 1) * 100000));
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

// ── Pack de efeitos do QdV ──
// Os críticos que mudam um número da ficha, como modelos de efeito do módulo
// "Old Dragon 2: Qualidade de Vida". O Mestre arrasta para a ficha e o CP, o
// ataque ou o movimento mudam sozinhos. Ver data/efeitos-criticos.mjs.
function buildEfeitosDocs() {
  const docs = [];
  // "Críticos", e nenhum dos quatro nomes que o QdV usa para amarrar o efeito a
  // uma classe, raça, magia ou equipamento — ver data/efeitos-criticos.mjs.
  const pasta = folderDoc("Críticos", "Item", "efeitos");
  docs.push(pasta);
  EFEITOS_CRITICOS.forEach((e, i) => {
    docs.push(efeitoQdVDoc(e, pasta._id, (i + 1) * 100000, {
      modulo: QDV_ID, flag: QDV_FLAG, template: templateDoQdV,
    }));
  });
  return docs;
}

// ── Pack de macros ──
// Botões arrastáveis; a lógica mora no script do módulo (game.starwarsSD.*).
function buildMacrosDocs() {
  return macros.map((m, i) => macroDoc(m, null, (i + 1) * 100000));
}

// Os packs que o module.json declara. Pack sem documento NÃO é declarado —
// um compêndio vazio na barra lateral parece conteúdo perdido — e o build
// confere as duas pontas: não declara vazio, nem deixa de declarar cheio.
const DECLARADOS = new Set(
  JSON.parse(fs.readFileSync(path.join(ROOT, "starwars-sd-module", "module.json"), "utf8")).packs.map((p) => p.name)
);

async function compile(packName, docs) {
  const srcDir = path.join(SRC, packName);
  const outDir = path.join(OUT, packName);
  if (!docs.length) {
    if (DECLARADOS.has(packName)) throw new Error(`${packName} está vazio e declarado no module.json — tire a declaração`);
    fs.rmSync(srcDir, { recursive: true, force: true });
    fs.rmSync(outDir, { recursive: true, force: true });
    console.log(`  · ${packName}: vazio, não compilado`);
    return;
  }
  if (!DECLARADOS.has(packName)) throw new Error(`${packName} tem ${docs.length} documentos e não está no module.json`);
  // Os selos de corrente e as tarjas de nível, em todo HTML do pack. Aqui, e
  // não em cada construtor: os selos aparecem em poderes, espécies, classes e
  // journals, por caminhos diferentes, e passar por todos seria esquecer um.
  docs.forEach(enfeitarDoc);
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
  await compile(EFEITOS_PACK, buildEfeitosDocs());
  await compile(NAVES_PACK, buildNavesDocs());
  console.log("Concluído.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
