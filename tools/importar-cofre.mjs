// Tira do cofre o que é longo demais para digitar e grava em tools/data/:
//
//   progressoes.mjs     as tabelas de progressão das classes e especializações
//   textos-do-cofre.mjs as seções de regra que viram páginas de journal, já
//                       em HTML
//
// ── POR QUE UM IMPORTADOR, E NÃO DIGITAR ────────────────────────────────────
//
// São 20 tabelas de 16 a 20 linhas, e páginas de regra com tabela e lista.
// Digitar é onde nasce o erro que ninguém vê — um "13" onde era "12" na JP do
// 11º nível só aparece na mesa. Ler do cofre copia exatamente o que está lá.
//
// ── POR QUE O RESULTADO É VERSIONADO ────────────────────────────────────────
//
// O build não lê o cofre: o cofre é da máquina do autor e não existe num
// clone. Este script roda quando o cofre muda; o build lê os arquivos gerados.
// O cofre é SÓ LEITURA — nada aqui escreve nele.
//
// Uso: node tools/importar-cofre.mjs

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { md } from "./lib.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const COFRE = path.join(os.homedir(), "Documents", "Ekhoria", "20 Space Dragon", "Space Dragon Suplemento");
const DESTINO = path.join(ROOT, "tools", "data", "progressoes.mjs");
const DESTINO_TEXTOS = path.join(ROOT, "tools", "data", "textos-do-cofre.mjs");
const DESTINO_BESTIARIO = path.join(ROOT, "tools", "data", "bestiario-do-cofre.mjs");

const ler = (nota) => fs.readFileSync(path.join(COFRE, `${nota}.md`), "utf8").replace(/\r\n/g, "\n");

/** "| a | b |" → ["a", "b"]. */
const celulas = (linha) => linha.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

/** A primeira tabela markdown a partir da posição dada. */
function tabelaApos(texto, inicio) {
  const linhas = texto.slice(inicio).split("\n");
  const i = linhas.findIndex((l) => l.trim().startsWith("|"));
  if (i < 0) throw new Error(`nenhuma tabela depois da posição ${inicio}`);
  const bloco = [];
  for (const l of linhas.slice(i)) {
    if (!l.trim().startsWith("|")) break;
    bloco.push(l);
  }
  const [cab, , ...corpo] = bloco;
  return { cabecalho: celulas(cab), linhas: corpo.map(celulas) };
}

/** A tabela logo depois de um título exato. */
function tabelaDoTitulo(texto, titulo) {
  const i = texto.indexOf(titulo);
  if (i < 0) throw new Error(`título não encontrado: ${titulo}`);
  return tabelaApos(texto, i);
}

/** O bloco <!-- tabela-spec: X --> inteiro: tabela, legenda e nota. */
function tabelaDaSpec(texto, nome) {
  const abre = `<!-- tabela-spec: ${nome} -->`;
  const i = texto.indexOf(abre);
  const f = texto.indexOf("<!-- /tabela-spec -->", i);
  if (i < 0 || f < 0) throw new Error(`bloco de especialização não encontrado: ${nome}`);
  const bloco = texto.slice(i + abre.length, f);
  const t = tabelaApos(bloco, 0);
  const depois = bloco.split("\n").filter((l) => l.trim() && !l.trim().startsWith("|"));
  // A primeira linha é o título ("**Progressão do X** — …"); o resto, legenda
  // e nota ("> …").
  const legenda = depois.filter((l) => !l.startsWith("**Progressão") && !l.startsWith(">")).join(" ").trim();
  const nota = depois.filter((l) => l.startsWith(">")).map((l) => l.replace(/^>\s?/, "")).join(" ").trim();
  return { ...t, legenda, nota };
}

const classes = ler("SW-SUP-Classes");
const forca = ler("SW-SUP-Forca");

const BASE = {
  Veterano: tabelaDoTitulo(classes, "# Veterano"),
  Operativo: tabelaDoTitulo(classes, "# Operativo"),
  "Técnico": tabelaDoTitulo(classes, "# Técnico"),
  "Sensível à Força": tabelaDoTitulo(forca, "### Tabela do Sensível à Força"),
};

const SPECS = {
  Veterano: ["Mercenário", "Caçador de Recompensas", "Emissário"],
  Operativo: ["Espião", "Sabotador", "Assassino", "Contrabandista"],
  "Técnico": ["Médico de Campo", "Engenheiro", "Slicer"],
  "Sensível à Força": ["Guardião", "Consular", "Sentinela", "Vidente", "Artífice"],
};

const ESPECIALIZACOES = {};
for (const [classe, nomes] of Object.entries(SPECS)) {
  const fonte = classe === "Sensível à Força" ? forca : classes;
  for (const nome of nomes) ESPECIALIZACOES[nome] = { classe, ...tabelaDaSpec(fonte, nome) };
}

// Sanidade: toda base tem 20 níveis, toda especialização do 5º ao 20º.
for (const [n, t] of Object.entries(BASE)) {
  if (t.linhas.length !== 20) throw new Error(`${n}: ${t.linhas.length} linhas, esperava 20`);
}
for (const [n, t] of Object.entries(ESPECIALIZACOES)) {
  if (t.linhas.length !== 16) throw new Error(`${n}: ${t.linhas.length} linhas, esperava 16 (5º ao 20º)`);
}

const js = [
  "// GERADO POR tools/importar-cofre.mjs — NÃO EDITE À MÃO.",
  "// Fonte: o cofre, Documents\\Ekhoria\\20 Space Dragon\\Space Dragon Suplemento\\",
  "//   SW-SUP-Classes.md e SW-SUP-Forca.md.",
  "//",
  "// As células ficam como TEXTO, com a marcação do cofre (**negrito**, ⊘ de",
  "// congelado): não são todas número (\"+7/+1\", \"×3\", \"⊘ 84%\"), e converter",
  "// perderia justamente o que a tabela diz.",
  "",
  `export const BASE = ${JSON.stringify(BASE, null, 2)};`,
  "",
  `export const ESPECIALIZACOES = ${JSON.stringify(ESPECIALIZACOES, null, 2)};`,
  "",
].join("\n");

fs.writeFileSync(DESTINO, js, "utf8");
console.log(`  ✔ ${Object.keys(BASE).length} tabelas-base e ${Object.keys(ESPECIALIZACOES).length} de especialização → tools/data/progressoes.mjs`);

// ── Seções de regra → HTML ──────────────────────────────────────────────────
//
// Um conversor de markdown de BLOCO para o subconjunto que o cofre usa:
// títulos, parágrafos, listas (com linha de continuação recuada), listas
// numeradas, citações e tabelas. O resto — comentário HTML, régua `---` — some.
// A marcação de LINHA é a do md() da lib, a mesma dos dados escritos à mão.

function blocos(texto) {
  const linhas = texto.split("\n");
  const saida = [];
  let i = 0;
  const vazia = (l) => !l || !l.trim();
  while (i < linhas.length) {
    const l = linhas[i];
    if (vazia(l) || /^---+\s*$/.test(l) || /^<!--.*-->\s*$/.test(l.trim())) { i++; continue; }

    const h = l.match(/^(#{2,4})\s+(.*)$/);
    if (h) { saida.push(`<h${h[1].length}>${md(h[2])}</h${h[1].length}>`); i++; continue; }

    if (l.trim().startsWith("|")) {
      const bloco = [];
      while (i < linhas.length && linhas[i].trim().startsWith("|")) bloco.push(linhas[i++]);
      const [cab, , ...corpo] = bloco;
      const th = celulas(cab);
      const temCab = th.some((c) => c);
      saida.push(
        "<table>" +
          (temCab ? `<thead><tr>${th.map((c) => `<th>${md(c)}</th>`).join("")}</tr></thead>` : "") +
          `<tbody>${corpo.map((r) => `<tr>${celulas(r).map((c) => `<td>${md(c)}</td>`).join("")}</tr>`).join("")}</tbody>` +
          "</table>"
      );
      continue;
    }

    if (l.startsWith(">")) {
      const bloco = [];
      while (i < linhas.length && linhas[i].startsWith(">")) bloco.push(linhas[i++].replace(/^>\s?/, ""));
      saida.push(`<blockquote>${blocos(bloco.join("\n"))}</blockquote>`);
      continue;
    }

    const itemLista = /^(\s*)([-*]|\d+\.)\s+/;
    if (itemLista.test(l)) {
      const ordenada = /^\s*\d+\./.test(l);
      const itens = [];
      while (i < linhas.length && !vazia(linhas[i])) {
        const atual = linhas[i];
        if (itemLista.test(atual)) itens.push(atual.replace(itemLista, ""));
        else if (/^\s+\S/.test(atual) && itens.length) itens[itens.length - 1] += " " + atual.trim();
        else break;
        i++;
      }
      const tag = ordenada ? "ol" : "ul";
      saida.push(`<${tag}>${itens.map((t) => `<li>${md(t)}</li>`).join("")}</${tag}>`);
      continue;
    }

    const par = [];
    while (
      i < linhas.length && !vazia(linhas[i]) && !/^(#{2,4}\s|>|\||---)/.test(linhas[i]) && !itemLista.test(linhas[i])
    ) par.push(linhas[i++].trim());
    saida.push(`<p>${md(par.join(" "))}</p>`);
  }
  return saida.join("");
}

/**
 * O conteúdo de uma seção "## Título", até a próxima "## " ou o rodapé de
 * crédito. O título em si fica de fora: ele vira o nome da página.
 */
function secao(texto, titulo) {
  const linhas = texto.split("\n");
  const i = linhas.findIndex((l) => l.trim() === `## ${titulo}`);
  if (i < 0) throw new Error(`seção não encontrada: ## ${titulo}`);
  const fim = linhas.findIndex((l, j) => j > i && (/^#{1,2}\s/.test(l) || /^\*Star Wars — suplemento/.test(l)));
  return blocos(linhas.slice(i + 1, fim < 0 ? undefined : fim).join("\n"));
}

/** O texto entre o título "# " da nota e a primeira seção "## " — ou o
 *  próximo "# ", porque a nota de Classes abre um "# " por classe, e sem isso
 *  a abertura engolia o Veterano inteiro. */
function abertura(texto) {
  const linhas = texto.split("\n");
  const i = linhas.findIndex((l) => /^#\s/.test(l));
  const f = linhas.findIndex((l, j) => j > i && /^#{1,2}\s/.test(l));
  return blocos(linhas.slice(i + 1, f).join("\n"));
}

// ── Espécies ────────────────────────────────────────────────────────────────
//
// Cada "## Espécie" do cofre vira uma espécie, e cada item da lista
// "**Habilidades de Espécie**" vira uma habilidade — "- **Nome:** texto".
// O resto da seção (a frase em itálico, as perguntas, a tabela, as notas) é a
// descrição. Os campos que o SISTEMA lê — movimento, infravisão, armadura
// natural — não dá para tirar de prosa com segurança: ficam em especies.mjs.

const NAO_SAO_ESPECIES = ["Idiomas da galáxia", "Nota de conversão"];

function especiesDoCofre(texto) {
  const partes = texto.split(/\n(?=## )/).slice(1);
  const saida = [];
  for (const parte of partes) {
    const [cab, ...resto] = parte.split("\n");
    const titulo = cab.replace(/^##\s+/, "").trim();
    if (NAO_SAO_ESPECIES.includes(titulo)) continue;
    const nome = titulo.replace(/\s*[—(*].*$/, "").trim();
    const corpo = resto.join("\n").split(/\n\*Star Wars — suplemento/)[0];

    // A lista de habilidades: do marcador até a primeira linha em branco.
    const linhas = corpo.split("\n");
    const iHab = linhas.findIndex((l) => l.trim() === "**Habilidades de Espécie**");
    if (iHab < 0) throw new Error(`${nome}: sem "**Habilidades de Espécie**"`);
    let fHab = iHab + 1;
    while (fHab < linhas.length && linhas[fHab].trim()) fHab++;
    const habilidades = linhas.slice(iHab + 1, fHab).map((l) => {
      const m = l.match(/^-\s+\*\*(.+?):\*\*\s*(.*)$/);
      if (!m) throw new Error(`${nome}: habilidade fora do padrão "- **Nome:** texto": ${l}`);
      return { nome: m[1].trim(), desc: `<p>${md(m[2])}</p>` };
    });

    // A primeira linha em itálico é o flavor; a descrição é o resto, sem a
    // lista de habilidades (que vira itens) e sem a régua final.
    const semLista = [...linhas.slice(0, iHab), ...linhas.slice(fHab)];
    const iFlavor = semLista.findIndex((l) => /^\*[^*]/.test(l.trim()));
    const flavorLinha = iFlavor >= 0 ? semLista[iFlavor].trim() : "";
    const flavor = flavorLinha.match(/^\*([^*]+)\*/)?.[1] ?? "";
    const aposFlavor = flavorLinha.replace(/^\*[^*]+\*\s*/, "");
    if (iFlavor >= 0) semLista[iFlavor] = aposFlavor;

    saida.push({ nome, titulo, flavor: flavor ? `<p>${md(flavor)}</p>` : "", descricao: blocos(semLista.join("\n")), habilidades });
  }
  return saida;
}

// ── Poderes da Força ────────────────────────────────────────────────────────
//
// O cofre dá, por Grandeza, uma tabela "Poder da Força | Poder Mental (SD) |
// Corrente": o nome de Star Wars, o nome NATIVO e a etiqueta [U]/[L]/[S], com
// ★ nos que sempre corrompem. Os números — alcance, duração, JP, o texto — o
// cofre manda buscar no Cap. 9 do livro básico, que no Foundry é o compêndio
// de Poderes Mentais do módulo Space Dragon. Então eles são lidos de lá, do
// packs-src daquele repositório, e cada poder do cofre precisa achar o seu:
// nome nativo que não existe, ou Grandeza que não bate, para o importador.

const SD_PODERES = path.join(ROOT, "..", "space-dragon-foundryvtt", "packs-src", "spacedragon-poderes");
const CORRENTE = { "[U]": "Universal", "[L]": "Luz", "[S]": "Sombra" };

// ── Poderes do cenário (✦) ──────────────────────────────────────────────────
//
// Os poderes marcados com ✦ não têm Poder Mental nativo: são criação do
// cenário. Na nota do Suplemento eles só aparecem na tabela — nome, Grandeza,
// corrente. O EFEITO está escrito na nota do Nativo, a mesma do mesmo autor,
// numa linha por poder:
//
//   - ✦ **Nome** `[U]` — Alcance / Duração — o efeito.
//
// O Suplemento continua mandando no nome, na Grandeza e na corrente; do Nativo
// vem só o texto. As duas notas precisam concordar na Grandeza, e o importador
// para se não concordarem.
const COFRE_NATIVO = path.join(COFRE, "..", "Space Dragon Nativo");

function poderesDoCenario() {
  const texto = fs.readFileSync(path.join(COFRE_NATIVO, "SW-SDN-Poderes-da-Forca.md"), "utf8").replace(/\r\n/g, "\n");
  const saida = new Map();
  let grandeza = 0;
  for (const l of texto.split("\n")) {
    const h = l.match(/^##+ (\d+)ª Grandeza/);
    if (h) grandeza = Number(h[1]);
    const m = l.match(/^- ✦ \*\*(.+?)\*\*\s*★?\s*`\[[ULS]\]`\s*—\s*(.+?)\s*\/\s*(.+?)\s*—\s*(.+)$/);
    if (!m) continue;
    const efeito = m[4].trim();
    // A JP que o efeito PEDE, para o campo da ficha; o texto diz o resto. A
    // que vem depois de "+2 na" é bônus, não jogada — o Sentir o Perigo dá
    // "+2 na JPR" e não pede JP nenhuma.
    const jp = [...efeito.matchAll(/\b(JP[RFM])\b/g)]
      .find((m) => !/\+\d+\s+(na|em|nas)\s*\**\s*$/.test(efeito.slice(Math.max(0, m.index - 14), m.index)))?.[1];
    saida.set(m[1].trim(), {
      grandeza,
      range: m[2].trim(),
      duration: m[3].trim(),
      jp: jp ? `${jp} (ver texto)` : "nenhuma",
      // Na nota o efeito vem depois de um travessão, em minúscula.
      description: `<p>${md(efeito.charAt(0).toUpperCase() + efeito.slice(1))}</p>`,
    });
  }
  return saida;
}

function poderesDoCofre(texto) {
  const nativos = new Map();
  for (const arq of fs.readdirSync(SD_PODERES).filter((f) => f.includes("__spell__"))) {
    const d = JSON.parse(fs.readFileSync(path.join(SD_PODERES, arq), "utf8"));
    nativos.set(d.name, d);
  }
  const doCenario = poderesDoCenario();

  const saida = [];
  const partes = texto.split(/\n(?=## )/);
  for (const parte of partes) {
    const g = parte.match(/^## (\d+)ª Grandeza/);
    if (!g) continue;
    const grandeza = Number(g[1]);
    const t = tabelaApos(parte, 0);
    // A nota em itálico depois da tabela cita poderes em negrito; ela vai
    // para a descrição de cada poder que cita.
    const nota = parte.split("\n").find((l) => /^\*[^*].*\*$/.test(l.trim()))?.trim().replace(/^\*|\*$/g, "") ?? "";
    for (const [sw, nativo, etiqueta] of t.linhas) {
      const nome = sw.replace(/\*\*/g, "").replace("★", "").replace("✦", "").trim();
      const corrupcao = sw.includes("★");
      const corrente = CORRENTE[etiqueta.replace(/`/g, "").trim()];
      if (!corrente) throw new Error(`${nome}: corrente desconhecida ${etiqueta}`);
      const notaDoPoder = nota && nota.includes(`**${nome}**`) ? `<p><em>${md(nota)}</em></p>` : "";

      // ✦ Criação do cenário: sem nativo, com o efeito da nota do Nativo.
      if (sw.includes("✦")) {
        const c = doCenario.get(nome);
        if (!c) throw new Error(`${nome}: é ✦ no Suplemento, mas o efeito não está no SW-SDN-Poderes-da-Forca`);
        if (c.grandeza !== grandeza) throw new Error(`${nome}: ${grandeza}ª no Suplemento e ${c.grandeza}ª no Nativo`);
        saida.push({ nome, grandeza, corrente, corrupcao, cenario: true, nativo: null, efeito: c, nota: notaDoPoder });
        continue;
      }
      // O cofre escreve "Amputar/Restaurar Emoção"; o livro, "Amputar ou
      // Restaurar Emoção". A barra é só grafia.
      const doc = nativos.get(nativo.trim()) ?? nativos.get(nativo.trim().replace(/\s*\/\s*/, " ou "));
      if (!doc) throw new Error(`${nome}: o Poder Mental "${nativo}" não existe no módulo Space Dragon`);
      if (Number(doc.system.circle) !== grandeza) {
        throw new Error(`${nome}: está na ${grandeza}ª Grandeza no cofre, e "${nativo}" é da ${doc.system.circle}ª no Space Dragon`);
      }
      saida.push({
        nome, grandeza, corrente, corrupcao,
        nativo: { nome: doc.name, id: doc._id, range: doc.system.range, duration: doc.system.duration, jp: doc.system.jp, description: doc.system.description },
        nota: notaDoPoder,
      });
    }
  }
  const nomes = new Set();
  for (const p of saida) {
    if (nomes.has(p.nome)) throw new Error(`Poder da Força repetido: ${p.nome}`);
    nomes.add(p.nome);
  }
  return saida;
}

// ── Subseções e degraus ─────────────────────────────────────────────────────

/** As subseções "### " de uma seção "## ", em markdown: [{ titulo, md }]. A
 *  primeira, de título nulo, é o texto antes da primeira "### ". */
function subsecoes(texto, titulo) {
  const linhas = texto.split("\n");
  const i = linhas.findIndex((l) => l.trim() === `## ${titulo}`);
  if (i < 0) throw new Error(`seção não encontrada: ## ${titulo}`);
  const fim = linhas.findIndex((l, j) => j > i && (/^#{1,2}\s/.test(l) || /^\*Star Wars — suplemento/.test(l)));
  const partes = [];
  let atual = { titulo: null, linhas: [] };
  for (const l of linhas.slice(i + 1, fim < 0 ? undefined : fim)) {
    if (/^###\s/.test(l)) {
      partes.push(atual);
      atual = { titulo: l.replace(/^###\s+/, "").trim(), linhas: [] };
    } else atual.linhas.push(l);
  }
  partes.push(atual);
  return partes.map((p) => ({ titulo: p.titulo, md: p.linhas.join("\n") }));
}

/** "- `5º` **Nome:** texto" → { level, nome, desc }. É o formato dos degraus
 *  no cofre inteiro — Núcleo Mandaloriano, Origem, Formas. */
function degrausDe(mdTexto) {
  return mdTexto
    .split("\n")
    .map((l) => l.match(/^-\s+`(\d+)º`\s+\*\*(.+?):\*\*\s*(.*)$/))
    .filter(Boolean)
    .map((m) => ({ level: Number(m[1]), nome: m[2].trim(), desc: `<p>${md(m[3])}</p>` }));
}

// ── Formas de Sabre ─────────────────────────────────────────────────────────
//
// Cada "### Nome — *subtítulo*" vira uma habilidade inteira, com os três
// degraus dentro: a Forma é UMA escolha, e partir em três itens faria o
// jogador arrastar três coisas para a ficha.

function formasDoCofre(texto) {
  const subs = subsecoes(texto, "As Formas de Sabre (Senda Guardião)").filter((s) => s.titulo);
  if (subs.length !== 7) throw new Error(`esperava 7 Formas de Sabre, achei ${subs.length}`);
  return subs.map((s) => {
    const [nome, sub] = s.titulo.split(/\s+—\s+/);
    return {
      nome: nome.trim(),
      desc: (sub ? `<p>${md(sub)}</p>` : "") + blocos(s.md),
    };
  });
}

// ── Senda Mandaloriana ──────────────────────────────────────────────────────

const SENDA_TITULO = "A Senda Mandaloriana (arquétipo cross-class, 5º nível)";
const NA_TABELA = { Veterano: "Veterano", Operativo: "Operativo", "Técnico": "Técnico", "Sensível à Força": "Sensível" };

function sendaDoCofre(texto) {
  const subs = subsecoes(texto, SENDA_TITULO);
  const nucleo = degrausDe(subs.find((s) => s.titulo === "Núcleo Mandaloriano (todas as classes)").md);
  if (nucleo.length !== 5) throw new Error(`esperava 5 habilidades no Núcleo Mandaloriano, achei ${nucleo.length}`);

  // A Tabela de Trocas: uma linha por classe-base.
  const trocasMd = subs.find((s) => s.titulo === "Tabela de Trocas (o que cada classe sacrifica)").md;
  const tTrocas = tabelaApos(trocasMd, 0);
  const trocas = {};
  for (const [classe, troca] of tTrocas.linhas) trocas[classe.replace(/\*\*/g, "").trim()] = `<p>${md(troca)}</p>`;

  // As quatro tabelas de progressão, cada uma com a legenda e a nota.
  const tabelas = {};
  for (const [classe, rotulo] of Object.entries(NA_TABELA)) {
    const marca = `**Progressão do Mandaloriano ${rotulo}**`;
    const i = texto.indexOf(marca);
    if (i < 0) throw new Error(`tabela não encontrada: ${marca}`);
    const t = tabelaApos(texto, i);
    const depois = texto.slice(texto.indexOf("\n|", i)).split("\n");
    const fimTabela = depois.findIndex((l, j) => j > 0 && !l.trim().startsWith("|"));
    const resto = [];
    for (const l of depois.slice(fimTabela)) {
      if (l.startsWith("**Progressão") || l.startsWith("<!--")) break;
      if (l.trim()) resto.push(l);
    }
    const legenda = resto.filter((l) => !l.startsWith(">")).join(" ").trim();
    const nota = resto.filter((l) => l.startsWith(">")).map((l) => l.replace(/^>\s?/, "")).join(" ").trim();
    if (t.linhas.length !== 16) throw new Error(`Mandaloriano ${rotulo}: ${t.linhas.length} linhas, esperava 16`);
    tabelas[classe] = { ...t, legenda, nota };
  }
  for (const classe of Object.keys(NA_TABELA)) {
    if (!trocas[classe]) throw new Error(`Tabela de Trocas sem a linha de ${classe}`);
  }
  return { abertura: abertura(texto), intro: blocos(subs[0].md), nucleo, trocas, tabelas };
}

function origemDoCofre(texto) {
  const md0 = subsecoes(texto, "Origem: Filho de Mandalore (1º nível)")[0].md;
  const degraus = degrausDe(md0);
  if (degraus.length !== 3) throw new Error(`esperava 3 degraus na Origem, achei ${degraus.length}`);
  return { html: blocos(md0), degraus };
}

// ── Equipamentos ────────────────────────────────────────────────────────────
//
// Todas as tabelas da nota, na ordem, com o título "## " em que estão. Quem
// decide o que vira item é equipamentos.mjs, pelo cabeçalho — o importador só
// copia.

function tabelasDaNota(texto) {
  const saida = [];
  let secaoAtual = null;
  const linhas = texto.split("\n");
  for (let i = 0; i < linhas.length; i++) {
    const h = linhas[i].match(/^##\s+(.*)$/);
    if (h) secaoAtual = h[1].trim();
    if (linhas[i].trim().startsWith("|") && !linhas[i - 1]?.trim().startsWith("|")) {
      const t = tabelaApos(linhas.slice(i).join("\n"), 0);
      saida.push({ secao: secaoAtual, ...t });
    }
  }
  return saida;
}

// ── Aparatos ────────────────────────────────────────────────────────────────
//
// Como os poderes: o cofre dá o NT, o nome nativo e o que ele é na galáxia; o
// custo e o texto vêm do compêndio de Aparatos do módulo Space Dragon. O nome
// lá está em caixa de título ("Mochila a Jato") e aqui não ("Mochila a
// jato"), então a busca ignora caixa e acento.

const SD_APARATOS = path.join(ROOT, "..", "space-dragon-foundryvtt", "packs-src", "spacedragon-aparatos");
const chaveDeNome = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

// Aparatos que o cofre cita e que só existem no "Módulo Básico" antigo, não no
// Aprimorado — que é a fonte do módulo Space Dragon. Saem sem nativo, e
// equipamentos.mjs não os transforma em item. Conferido no PDF antigo em
// 18/09/2026: o Soro reanimador é NT 4, $120.000, e o Aprimorado o retirou.
const SO_NA_EDICAO_ANTIGA = ["Soro reanimador"];

function aparatosDoCofre(texto) {
  const nativos = new Map();
  for (const arq of fs.readdirSync(SD_APARATOS).filter((f) => f.includes("__misc__"))) {
    const d = JSON.parse(fs.readFileSync(path.join(SD_APARATOS, arq), "utf8"));
    nativos.set(chaveDeNome(d.name), d);
  }
  const t = tabelaDoTitulo(texto, "## O catálogo, vestido de Star Wars");
  const faltando = [];
  const saida = t.linhas.map(([nt, nativo, galaxia]) => {
    const nomeNativo = nativo.replace(/\*\*/g, "").trim();
    const d = nativos.get(chaveDeNome(nomeNativo));
    if (!d && !SO_NA_EDICAO_ANTIGA.includes(nomeNativo)) faltando.push(nomeNativo);
    const [nome, ...explica] = galaxia.replace(/\*\*/g, "").split(/\s+—\s+/);
    return {
      nt: Number(nt.replace(/\D/g, "")),
      nome: nome.trim(),
      explica: explica.join(" — ").trim(),
      nativo: d ? { nome: d.name, id: d._id, cost: d.system.cost, description: d.system.description } : null,
    };
  });
  if (faltando.length) throw new Error(`aparatos do cofre sem par no módulo Space Dragon: ${faltando.join(", ")}`);
  return saida;
}

// ── Bestiário ───────────────────────────────────────────────────────────────
//
// O cofre diz "não reproduza nada: abra o livro no nome nativo". No Foundry, o
// livro é o compêndio de Bestiário do módulo Space Dragon — então o nome
// nativo, na coluna da esquerda do de-para, vira LINK para a criatura de lá.
// Os nomes lá às vezes têm sufixo ("Zangão Gigante", "Humanoide Robótico"),
// e por isso a busca aceita começo de nome. Os dragões apontam para a página
// "Dragões" do journal do Mestre de lá, onde está a tabela.
//
// Criatura sem par fica como texto, e o importador lista quais.

const SD_BESTIARIO = path.join(ROOT, "..", "space-dragon-foundryvtt", "packs-src", "spacedragon-bestiario");
const SD_JOURNAL = path.join(ROOT, "..", "space-dragon-foundryvtt", "packs-src", "spacedragon-journal");
const semLink = [];

function linkarBestiario(texto) {
  const criaturas = fs.readdirSync(SD_BESTIARIO)
    .map((f) => JSON.parse(fs.readFileSync(path.join(SD_BESTIARIO, f), "utf8")))
    .filter((d) => d.type === "monster");
  const achar = (nome) => {
    const k = chaveDeNome(nome);
    return criaturas.find((c) => chaveDeNome(c.name) === k) ?? criaturas.find((c) => chaveDeNome(c.name).startsWith(k + " "));
  };
  const link = (c, rotulo) => `@UUID[Compendium.spacedragon.spacedragon-bestiario.Actor.${c._id}]{${rotulo}}`;

  // A página "Dragões" do journal do Mestre do Space Dragon.
  let dragoes = null;
  for (const f of fs.readdirSync(SD_JOURNAL)) {
    const j = JSON.parse(fs.readFileSync(path.join(SD_JOURNAL, f), "utf8"));
    const p = (j.pages ?? []).find((x) => x.name === "Dragões");
    if (p) dragoes = `@UUID[Compendium.spacedragon.spacedragon-journal.JournalEntry.${j._id}.JournalEntryPage.${p._id}]`;
  }
  if (!dragoes) throw new Error('a página "Dragões" não está no journal do módulo Space Dragon');

  const linhas = texto.split("\n");
  const i = linhas.findIndex((l) => l.trim() === "## De-para: criaturas do SD → feras de Star Wars");
  for (let j = i + 1; j < linhas.length && !/^##\s/.test(linhas[j]); j++) {
    const l = linhas[j];
    if (!l.startsWith("| ") || l.startsWith("| Space Dragon") || l.startsWith("|---")) continue;
    const [, esquerda, ...resto] = l.split("|");
    let nova;
    if (/Dragões/.test(esquerda)) {
      nova = esquerda.replace("**Dragões**", `**${dragoes}{Dragões}**`);
    } else {
      // "Autômato · Humanoide/Serviçal/…" — separa por · e por /, e troca cada
      // nome pelo link, mantendo os separadores.
      nova = esquerda.replace(/[^·/|]+/g, (pedaco) => {
        const nome = pedaco.replace(/\*\*/g, "").trim();
        if (!nome) return pedaco;
        const c = achar(nome);
        if (!c) { semLink.push(nome); return pedaco; }
        return pedaco.replace(nome, link(c, nome));
      });
    }
    linhas[j] = ["", nova, ...resto].join("|");
  }

  // Na Tabela dos Dragões, o nome da tabela vira o link.
  return linhas.join("\n").replace(
    "A **Tabela dos Dragões** do *SD* (Cap. 11)",
    `A **${dragoes}{Tabela dos Dragões}** do *SD* (Cap. 11)`
  );
}

/** O link para uma página do journal do módulo Space Dragon, pelo nome dela. */
function paginaDoSD(nome) {
  for (const f of fs.readdirSync(SD_JOURNAL)) {
    const j = JSON.parse(fs.readFileSync(path.join(SD_JOURNAL, f), "utf8"));
    const p = (j.pages ?? []).find((x) => x.name === nome);
    if (p) return `@UUID[Compendium.spacedragon.spacedragon-journal.JournalEntry.${j._id}.JournalEntryPage.${p._id}]`;
  }
  throw new Error(`a página "${nome}" não está no journal do módulo Space Dragon`);
}

// ── Tabelas roláveis da Seção do Mestre ─────────────────────────────────────
//
// Cada "### Nome (dN)" seguido de lista numerada vira uma tabela de 1dN, com
// um resultado por item. O PNJ relâmpago é outra forma: uma tabela só no
// cofre com três colunas para rolar (espécie d8, papel d8, traço d10), e vira
// três tabelas — é assim que se rola no Foundry.

function tabelasDoMestre(texto) {
  const subs = subsecoes(texto, "Tabelas de preparação").filter((s) => s.titulo);
  const saida = [];
  for (const s of subs) {
    const dado = s.titulo.match(/\(d(\d+)\)/);
    if (dado) {
      const itens = s.md.split("\n").map((l) => l.match(/^(\d+)\.\s+(.*)$/)).filter(Boolean);
      const faces = Number(dado[1]);
      if (itens.length !== faces) throw new Error(`${s.titulo}: ${itens.length} itens para um d${faces}`);
      saida.push({
        nome: s.titulo.replace(/\s*\(d\d+\).*$/, "").trim(),
        formula: `1d${faces}`,
        resultados: itens.map((m) => ({ range: [Number(m[1]), Number(m[1])], text: md(m[2]) })),
      });
      continue;
    }
    if (/PNJ relâmpago/.test(s.titulo)) {
      const t = tabelaApos(s.md, 0);
      // | d8 | Espécie | Papel | d10 | Traço marcante |
      const coluna = (iDado, iTexto) =>
        t.linhas.filter((l) => /^\d+$/.test(l[iDado])).map((l) => ({ range: [Number(l[iDado]), Number(l[iDado])], text: md(l[iTexto]) }));
      const esp = coluna(0, 1), papel = coluna(0, 2), traco = coluna(3, 4);
      saida.push({ nome: "PNJ relâmpago — Espécie", formula: `1d${esp.length}`, resultados: esp });
      saida.push({ nome: "PNJ relâmpago — Papel", formula: `1d${papel.length}`, resultados: papel });
      saida.push({ nome: "PNJ relâmpago — Traço marcante", formula: `1d${traco.length}`, resultados: traco });
    }
  }
  return saida;
}

// Quais seções de quais notas viram página. Nota nova entra aqui.
const SECOES = {
  "SW-SUP-Usando-o-Basico": [
    "Onde está cada regra no livro básico",
    "Os nomes dos atributos",
    "O que este suplemento acrescenta",
    "Convenções deste livro",
  ],
  "SW-SUP-Especies": ["Idiomas da galáxia", "Nota de conversão"],
  "SW-SUP-Poderes-da-Forca": ["Como usar este capítulo", "As três correntes (Caminho)", "Crédito", "Poderes do cenário"],
  "SW-SUP-Sabre-e-Cristais": [
    "O Cristal Kyber",
    "Construir o Próprio Sabre",
    "Sangrar o Cristal (o vermelho Sith)",
    "O Sabre Sombrio (Darksaber)",
    "As Formas de Sabre (Senda Guardião)",
    "Mudar de Guarda — trocar de Forma no meio do duelo",
  ],
  "SW-SUP-Senda-Mandaloriana": [
    "Origem: Filho de Mandalore (1º nível)",
    SENDA_TITULO,
    "Referência de equipamento",
  ],
  "SW-SUP-Equipamentos": [
    "Créditos",
    "Armas de combate corpo a corpo",
    "Armas de fogo, arremesso e explosivos",
    "Armaduras & Vestes",
    "Aparelhos, kits e suprimentos",
    "Crédito",
  ],
  "SW-SUP-Aparatos-e-Feitos": [
    "O que você precisa saber do livro básico",
    "O catálogo, vestido de Star Wars",
    "Feitos Científicos, na galáxia",
    "Crédito",
  ],
  "SW-SUP-Naves": [
    "Ter e pilotar uma nave",
    "Os oito tipos de espaçonave",
    "De-para — as naves da galáxia",
    "Câmaras da nave",
    "Crédito",
  ],
  "SW-SUP-Combate-Tatico-de-Naves": [
    "Preparação",
    "Perfil tático da nave",
    "A rodada",
    "Atacar",
    "Os dois modos",
    "Ajuste de ritmo (leia se o combate ficar estático)",
    "Crédito",
  ],
  "SW-SUP-Bestiario": [
    "De-para: criaturas do SD → feras de Star Wars",
    "As feras do livro, na mesa",
    "Os Dragões da Galáxia (Tabela dos Dragões)",
    "Modelos de PNJ (as classes como inimigos)",
    "Crédito",
  ],
  "SW-SUP-Secao-do-Mestre": [
    "O tom da mesa",
    "As facções",
    "Recompensas: Créditos e achados",
    "Tabelas de preparação",
    "Relíquias tecnológicas",
    "Perigos do espaço",
    "Palavra final — um compêndio em aberto",
  ],
  "SW-SUP-Ordens-e-Ranks": [
    "A Ordem Jedi (Caminho da Luz)",
    "Os Sith — a Regra de Dois (Caminho da Sombra)",
    "Outras tradições (opcionais)",
    "Rank na prática",
  ],
  "SW-SUP-Forca": [
    "O Caminho: Luz, Sombra e o meio",
    "O Caminho Cinza",
    "Corrupção — Queda e Redenção",
    "A Tentação — a Corrupção como moeda",
    "Eco da Senda — o Alcance que volta",
    "Nota de estrutura",
  ],
  "SW-SUP-Classes": ["Resumo"],
};

const TEXTOS = {};
for (const [nota, titulos] of Object.entries(SECOES)) {
  const texto = nota === "SW-SUP-Bestiario" ? linkarBestiario(ler(nota)) : ler(nota);
  TEXTOS[nota] = { "(abertura)": abertura(texto) };
  for (const t of titulos) TEXTOS[nota][t] = secao(texto, t);
}

// ── Bestiário: o roster do Nativo vira criaturas do compêndio ───────────────
//
// O Suplemento manda NÃO reproduzir ficha: "abra o livro no nome nativo, leia a
// ficha e apresente a criatura pelo nome de Star Wars". Isso serve para quem
// joga com o livro na mão — na mesa virtual, abrir o compêndio do Space Dragon
// e traduzir o nome de cabeça é atrito puro.
//
// A nota do NATIVO (SW-SDN-Bestiario) publica o roster inteiro, e os números
// são os mesmos do livro — conferidos contra o módulo Space Dragon: Tiranossauro
// 2.615 XP, Gigantossauro 7.250, Glacioprimata 875. Então a criatura entra com
// o nome como o cofre escreve, "Glacioprimata (Wampa)", que acha pelos dois.
//
// Os atributos vêm da segunda tabela da nota, e RM e RD saem de dentro da
// coluna de ataques, onde o cofre os escreve em negrito.

const TAMANHO = { peq: "pequeno", "med": "medio", gd: "grande", imenso: "imenso", colossal: "colossal", miudo: "miudo" };
const AFILIACAO = { a: "ordeiro", n: "neutro", r: "caotico" };
const MOVIMENTO = [
  [/escala|escalada/, "mve"], [/nada|nado/, "mvn"], [/voo|voa/, "mvv"], [/escava|cava/, "mvo"],
];

const semAcento = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const limpaCelula = (s) => String(s ?? "").replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, "").trim();

/** As linhas de uma tabela markdown que vem logo abaixo de um título. */
function tabelaDaSecao(texto, titulo) {
  const i = texto.indexOf(`## ${titulo}`);
  if (i < 0) throw new Error(`bestiário: seção "${titulo}" não encontrada`);
  const linhas = texto.slice(i).split("\n");
  const saida = [];
  let dentro = false;
  for (const l of linhas.slice(1)) {
    if (!l.trim().startsWith("|")) { if (dentro) break; continue; }
    if (/^\|[\s|:-]+\|$/.test(l.trim())) { dentro = true; continue; }
    const celulas = l.trim().replace(/^\||\|$/g, "").split("|").map(limpaCelula);
    if (dentro) saida.push(celulas);
  }
  return saida;
}

/** "Gd / R" → tamanho e afiliação do sistema. */
function tamanhoEAfiliacao(celula) {
  const [tam, afil] = String(celula).split("/").map((x) => semAcento(x));
  return {
    tamanho: TAMANHO[tam?.slice(0, 3)] ?? TAMANHO[tam] ?? "medio",
    alinhamento: AFILIACAO[afil] ?? "neutro",
  };
}

/** "10, escala 6" → { mv: "10", mve: "6" }. O que não é modo de movimento vira nota. */
function movimentoDoCofre(celula) {
  const campos = {};
  const sobra = [];
  for (const trecho of String(celula).split(",")) {
    const t = semAcento(trecho);
    const numero = t.match(/(\d+)/)?.[1];
    const modo = MOVIMENTO.find(([re]) => re.test(t))?.[1];
    if (!numero) { if (t) sobra.push(trecho.trim()); continue; }
    if (modo) campos[modo] = numero;
    else if (!campos.mv) campos.mv = numero;
    else sobra.push(trecho.trim());
  }
  return { campos, sobra };
}

/** "3+1 (25)" → DV e PV; "1 PV" é uma criatura de um ponto de vida só. */
function dadoDeVida(celula) {
  const so = String(celula).match(/^(\d+)\s*PV$/i);
  if (so) return { dv: null, pv: Number(so[1]), nota: `${so[1]} ponto de vida, sem dado de vida.` };
  const m = String(celula).match(/^([\d+\s-]+?)\s*(?:\((\d+)\))?$/);
  if (!m) return { dv: null, pv: null };
  return { dv: m[1].replace(/\s/g, ""), pv: m[2] ? Number(m[2]) : null };
}

/**
 * A coluna de ataques traz três coisas: ataques com dano, defesas em negrito
 * (RM e RD) e habilidades sem rolagem ("envolver [especial]"). Cada uma vai
 * para o seu lugar — quem tem bônus e dado vira botão na ficha.
 */
/**
 * Separa por ponto e vírgula, mas só FORA de parênteses e colchetes: a Planta
 * carnívora escreve "agarrar (1d4/rod.; engolida 1d6 ácido/rod.)", e partir ali
 * quebrava a habilidade no meio.
 */
function separaAtaques(celula) {
  const partes = [];
  let atual = "";
  let nivel = 0;
  for (const ch of String(celula)) {
    if (ch === "(" || ch === "[") nivel += 1;
    if (ch === ")" || ch === "]") nivel = Math.max(0, nivel - 1);
    // O cofre usa ";" e "·" para separar itens da mesma célula.
    if ((ch === ";" || ch === "·") && nivel === 0) { partes.push(atual); atual = ""; continue; }
    atual += ch;
  }
  partes.push(atual);
  return partes;
}

function ataquesDoCofre(celula) {
  const ataques = [];
  const habilidades = [];
  let rm = null;
  let rd = null;
  for (const bruto of separaAtaques(celula)) {
    const parte = bruto.trim();
    if (!parte) continue;
    const defesaRM = parte.match(/^RM\s+([\d]+%)$/i);
    const defesaRD = parte.match(/^RD\s+(.+)$/i);
    if (defesaRM) { rm = defesaRM[1]; continue; }
    if (defesaRD) { rd = defesaRD[1].trim(); continue; }
    const m = parte.match(/^(?:(\d+)\s+)?(.+?)\s*\+(\d+)\s*\(([^)]*)\)\s*(.*)$/);
    if (m) {
      const dentro = m[4].trim();
      // "toque +4 (dreno: −1d4 DV…)" não é dano: o botão rolaria 1d4 onde a
      // regra drena dado de vida. Só vira fórmula o que COMEÇA em dado.
      const semDado = !/^\d*d\d+/i.test(dentro);
      ataques.push({
        qtd: Number(m[1]) || 1,
        nome: m[2].trim(),
        bonus: Number(m[3]),
        dano: dentro,
        ...(semDado ? { semDado: true } : {}),
        ...(m[5].trim() ? { nota: m[5].trim() } : {}),
      });
      continue;
    }
    // "tentáculo +0 (1d4 elétrico)" já casou acima; o que sobra não tem rolagem.
    habilidades.push({ nome: parte });
  }
  return { ataques, habilidades, rm, rd };
}

function bestiarioDoCofre() {
  const texto = fs.readFileSync(path.join(COFRE_NATIVO, "SW-SDN-Bestiario.md"), "utf8").replace(/\r\n/g, "\n");
  const roster = tabelaDaSecao(texto, "Roster nativo (stats por inteiro)");
  const atributos = new Map(
    tabelaDaSecao(texto, "Atributos das criaturas").map((l) => [
      l[0],
      Object.fromEntries(["FOR", "DES", "CON", "INT", "CIE", "COM"].map((k, i) => [k, Number(l[i + 1])])),
    ])
  );

  const criaturas = roster.map((l) => {
    const [nome, tamAfil, mov, cp, jp, dvPv, moral, ataquesTexto, xp] = l;
    const { tamanho, alinhamento } = tamanhoEAfiliacao(tamAfil);
    const { campos, sobra } = movimentoDoCofre(mov);
    const { dv, pv, nota } = dadoDeVida(dvPv);
    const { ataques, habilidades, rm, rd } = ataquesDoCofre(ataquesTexto);
    const at = atributos.get(nome) ?? null;
    if (!at) throw new Error(`bestiário: "${nome}" está no roster e não na tabela de atributos`);

    const notas = [nota, sobra.length ? `Movimento: ${sobra.join(", ")}.` : null].filter(Boolean);
    return {
      nome,
      tamanho,
      alinhamento,
      movimentos: campos,
      ...(dv ? { dv } : {}),
      ...(pv != null ? { pv } : {}),
      ca: cp,
      jp,
      moral,
      xp,
      ataques,
      habilidades,
      ...(notas.length ? { nota: notas.join(" ") } : {}),
      atributos: at,
      ...(rm ? { rm } : {}),
      ...(rd ? { rd } : {}),
    };
  });

  if (criaturas.length !== atributos.size) {
    throw new Error(`bestiário: ${criaturas.length} no roster e ${atributos.size} na tabela de atributos`);
  }
  return criaturas;
}

const CRIATURAS = bestiarioDoCofre();
fs.writeFileSync(DESTINO_BESTIARIO, [
  "// GERADO POR tools/importar-cofre.mjs — NÃO EDITE À MÃO.",
  "// Fonte: o cofre, Documents\\Ekhoria\\20 Space Dragon\\Space Dragon Nativo\\",
  "//   SW-SDN-Bestiario.md — o roster e a tabela de atributos.",
  "//",
  "// Os números são os do livro básico, com o nome como o cofre o escreve:",
  "// \"Glacioprimata (Wampa)\" acha pelos dois lados.",
  "",
  `export const CRIATURAS = ${JSON.stringify(CRIATURAS, null, 2)};`,
  "",
].join("\n"), "utf8");
console.log(`  ✔ ${CRIATURAS.length} criaturas do bestiário nativo → tools/data/bestiario-do-cofre.mjs`);

const ESPECIES = especiesDoCofre(ler("SW-SUP-Especies"));
const PODERES = poderesDoCofre(ler("SW-SUP-Poderes-da-Forca"));
const FORMAS = formasDoCofre(ler("SW-SUP-Sabre-e-Cristais"));
const SENDA = sendaDoCofre(ler("SW-SUP-Senda-Mandaloriana"));
const ORIGEM = origemDoCofre(ler("SW-SUP-Senda-Mandaloriana"));
const EQUIPAMENTOS = tabelasDaNota(ler("SW-SUP-Equipamentos"));
const APARATOS = aparatosDoCofre(ler("SW-SUP-Aparatos-e-Feitos"));
const TABELAS_MESTRE = tabelasDoMestre(ler("SW-SUP-Secao-do-Mestre"));
// Páginas do journal do Space Dragon para onde o Suplemento manda o leitor.
const LINKS_SD = { reliquias: paginaDoSD("Relíquias tecnológicas") };

fs.writeFileSync(
  DESTINO_TEXTOS,
  [
    "// GERADO POR tools/importar-cofre.mjs — NÃO EDITE À MÃO.",
    "// Fonte: o cofre, Documents\\Ekhoria\\20 Space Dragon\\Space Dragon Suplemento\\",
    "//",
    "// Seções de regra das notas SW-SUP, já em HTML, por nota e por título. Os",
    "// arquivos de dados montam os journals com elas.",
    "",
    `export const TEXTOS = ${JSON.stringify(TEXTOS, null, 2)};`,
    "",
    "// As espécies de SW-SUP-Especies: descrição e habilidades. Os campos",
    "// mecânicos (movimento, infravisão…) ficam em especies.mjs.",
    `export const ESPECIES = ${JSON.stringify(ESPECIES, null, 2)};`,
    "",
    "// Os Poderes da Força de SW-SUP-Poderes-da-Forca, cada um com o Poder",
    "// Mental nativo que ele é — os números e o texto vêm do módulo Space Dragon.",
    `export const PODERES = ${JSON.stringify(PODERES, null, 2)};`,
    "",
    "// As sete Formas de Sabre de SW-SUP-Sabre-e-Cristais, uma habilidade cada.",
    `export const FORMAS = ${JSON.stringify(FORMAS, null, 2)};`,
    "",
    "// A Senda Mandaloriana: o Núcleo, a troca de cada classe e as quatro tabelas.",
    `export const SENDA = ${JSON.stringify(SENDA, null, 2)};`,
    "",
    "// A Origem Filho de Mandalore.",
    `export const ORIGEM = ${JSON.stringify(ORIGEM, null, 2)};`,
    "",
    "// Todas as tabelas de SW-SUP-Equipamentos, na ordem, com a seção de cada.",
    `export const EQUIPAMENTOS = ${JSON.stringify(EQUIPAMENTOS, null, 2)};`,
    "",
    "// O catálogo de aparatos de SW-SUP-Aparatos-e-Feitos, cada um com o nativo.",
    `export const APARATOS = ${JSON.stringify(APARATOS, null, 2)};`,
    "",
    "// As tabelas roláveis da Seção do Mestre.",
    `export const TABELAS_MESTRE = ${JSON.stringify(TABELAS_MESTRE, null, 2)};`,
    "",
    "// Links para páginas do journal do módulo Space Dragon.",
    `export const LINKS_SD = ${JSON.stringify(LINKS_SD, null, 2)};`,
    "",
  ].join("\n"),
  "utf8"
);
const nSecoes = Object.values(TEXTOS).reduce((n, s) => n + Object.keys(s).length, 0);
console.log(
  `  ✔ ${nSecoes} seções de ${Object.keys(TEXTOS).length} nota(s), ${ESPECIES.length} espécies e ` +
  `${PODERES.length} poderes → tools/data/textos-do-cofre.mjs`
);

if (semLink.length) console.log(`  ▲ criaturas do de-para sem ficha no módulo Space Dragon: ${semLink.join(", ")}`);
