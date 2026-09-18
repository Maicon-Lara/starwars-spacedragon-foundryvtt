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

/** O texto entre o título "# " da nota e a primeira seção "## ". */
function abertura(texto) {
  const linhas = texto.split("\n");
  const i = linhas.findIndex((l) => /^#\s/.test(l));
  const f = linhas.findIndex((l, j) => j > i && /^##\s/.test(l));
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

function poderesDoCofre(texto) {
  const nativos = new Map();
  for (const arq of fs.readdirSync(SD_PODERES).filter((f) => f.includes("__spell__"))) {
    const d = JSON.parse(fs.readFileSync(path.join(SD_PODERES, arq), "utf8"));
    nativos.set(d.name, d);
  }

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
      const nome = sw.replace(/\*\*/g, "").replace("★", "").trim();
      const corrupcao = sw.includes("★");
      const corrente = CORRENTE[etiqueta.replace(/`/g, "").trim()];
      if (!corrente) throw new Error(`${nome}: corrente desconhecida ${etiqueta}`);
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
        nota: nota && nota.includes(`**${nome}**`) ? `<p><em>${md(nota)}</em></p>` : "",
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

// Quais seções de quais notas viram página. Nota nova entra aqui.
const SECOES = {
  "SW-SUP-Usando-o-Basico": [
    "Onde está cada regra no livro básico",
    "Os nomes dos atributos",
    "O que este suplemento acrescenta",
    "Convenções deste livro",
  ],
  "SW-SUP-Especies": ["Idiomas da galáxia", "Nota de conversão"],
  "SW-SUP-Poderes-da-Forca": ["Como usar este capítulo", "As três correntes (Caminho)", "Crédito"],
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
  ],
};

const TEXTOS = {};
for (const [nota, titulos] of Object.entries(SECOES)) {
  const texto = ler(nota);
  TEXTOS[nota] = { "(abertura)": abertura(texto) };
  for (const t of titulos) TEXTOS[nota][t] = secao(texto, t);
}

const ESPECIES = especiesDoCofre(ler("SW-SUP-Especies"));
const PODERES = poderesDoCofre(ler("SW-SUP-Poderes-da-Forca"));
const FORMAS = formasDoCofre(ler("SW-SUP-Sabre-e-Cristais"));
const SENDA = sendaDoCofre(ler("SW-SUP-Senda-Mandaloriana"));
const ORIGEM = origemDoCofre(ler("SW-SUP-Senda-Mandaloriana"));

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
  ].join("\n"),
  "utf8"
);
const nSecoes = Object.values(TEXTOS).reduce((n, s) => n + Object.keys(s).length, 0);
console.log(
  `  ✔ ${nSecoes} seções de ${Object.keys(TEXTOS).length} nota(s), ${ESPECIES.length} espécies e ` +
  `${PODERES.length} poderes → tools/data/textos-do-cofre.mjs`
);
