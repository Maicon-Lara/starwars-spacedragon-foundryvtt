// Teste do que NÃO pode sair do cofre para o compêndio público.
//
// ── POR QUE ISTO EXISTE ─────────────────────────────────────────────────────
//
// O conteúdo dos compêndios vem do cofre pessoal do autor, e o repositório é
// público. A mesa encontrou nomes de arquivo do cofre publicados dentro de
// tabelas tortas — `[[SW-SUP-Equipamentos#A carga dos itens` numa célula e
// `Equipamentos]]` na seguinte.
//
// A causa era mecânica: o `|` de um wikilink do Obsidian é separador de coluna
// em Markdown. O parser partia o link ao meio antes de o conversor vê-lo, e o
// que sairia como "Equipamentos" virava o caminho do arquivo.
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// Nenhum `[[` nos packs. Um wikilink publicado é sempre uma de duas coisas: um
// link quebrado para quem lê, ou o nome de um arquivo privado exposto. Nunca é
// o que se queria publicar.
//
// Uso: node tools/teste-vazamento.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(fileURLToPath(import.meta.url), "../..");
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

const docs = [];
for (const pack of fs.readdirSync(path.join(RAIZ, "packs-src"))) {
  const dir = path.join(RAIZ, "packs-src", pack);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    docs.push({ pack, nome: d.name ?? f, texto: JSON.stringify(d) });
  }
}
confere(docs.length > 100, `só ${docs.length} documentos varridos — a leitura falhou`);

/* ── NADA DO COFRE ─────────────────────────────────────────────────────────── */

const PROIBIDO = [
  {
    rx: /\[\[/,
    nome: "wikilink do Obsidian",
    porque: "ou é link quebrado para quem lê, ou é o nome de um arquivo privado exposto",
  },
  {
    rx: /SW-(?:SUP|SDN)-[\w-]+/,
    nome: "nome de arquivo do cofre",
    porque: "é o caminho de uma nota pessoal, e não quer dizer nada para quem instala o módulo",
  },
  {
    rx: /^---\s*$/m,
    nome: "frontmatter YAML",
    porque: "é metadado do Obsidian, não conteúdo de jogo",
  },
];

for (const d of docs) {
  for (const p of PROIBIDO) {
    const m = p.rx.exec(d.texto);
    if (!m) continue;
    const ctx = d.texto.slice(Math.max(0, m.index - 60), m.index + 60);
    confere(false,
      `[${d.pack}] "${d.nome}" publica ${p.nome} — ${p.porque}\n      …${ctx}…`);
  }
}

/* ── NEM META-COMENTÁRIO SOBRE O PRÓPRIO MÓDULO ────────────────────────────── */
//
// Uma descrição que conta o histórico do módulo — "antes era 3d10", "as Regras
// Compiladas fixaram" — é conversa de desenvolvimento. Quem abre o item quer
// saber o que a arma faz hoje; o porquê da mudança é assunto do changelog.
//
// Este caiu numa descrição publicada escrita ontem, pela minha mão.
const META = [
  { rx: /\bo m[óo]dulo (?:trazia|tinha|usava|dava)\b/i, nome: "histórico do módulo" },
  { rx: /\bRegras Compiladas\b/i, nome: "referência a documento interno" },
  { rx: /\bleitura da casa\b/i, nome: "nota de design" },
  { rx: /\bna vers[ãa]o \d+\.\d+/i, nome: "número de versão" },
];
for (const d of docs) {
  for (const p of META) {
    const m = p.rx.exec(d.texto);
    if (!m) continue;
    const ctx = d.texto.slice(Math.max(0, m.index - 70), m.index + 70);
    confere(false,
      `[${d.pack}] "${d.nome}" publica ${p.nome} — quem abre o item quer saber o que ele ` +
      `faz hoje, e o porquê da mudança é assunto do changelog\n      …${ctx}…`);
  }
}

/* ── O PARSER DE TABELA PROTEGE O PIPE DO WIKILINK ─────────────────────────── */
//
// A causa mecânica, travada no lugar: sem isso, o próximo wikilink dentro de
// tabela volta a vazar, e ninguém vai lembrar por quê.
{
  const imp = fs.readFileSync(path.join(RAIZ, "tools", "importar-cofre.mjs"), "utf8");
  const i = imp.indexOf("const celulas =");
  confere(i > 0, "não achei o parser de células da tabela");
  const corpo = imp.slice(i, i + 500);
  confere(corpo.includes("PIPE"),
    "o parser de tabela divide por | sem proteger o wikilink — o link parte ao meio " +
    "e o nome do arquivo do cofre vai para o compêndio");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  `  ✔ sem vazamento do cofre: ${docs.length} documentos sem wikilink, sem nome de arquivo ` +
    "pessoal, sem frontmatter e sem meta-comentário de desenvolvimento — e o parser de " +
    "tabela protegendo o pipe do wikilink, que era a causa"
);
