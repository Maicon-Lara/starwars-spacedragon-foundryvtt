// Teste do estilo do livro no módulo, sem Foundry.
//
// ── POR QUE ESTE TESTE EXISTE ───────────────────────────────────────────────
//
// Estilo falha CALADO. Um .woff2 que não foi para o zip, um seletor preso ao
// container errado, um selo que continuou <code>: nada disso quebra o build,
// nada aparece no console do Foundry, e o resultado é só "ficou feio" na mesa
// de alguém. Cada asserção aqui corresponde a uma dessas falhas.
//
// Uso: node tools/teste-estilo.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { enfeitar, enfeitarDoc } from "./lib.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const MOD = path.join(ROOT, "starwars-sd-module");
const PACKS = path.join(ROOT, "packs-src");

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

const ler = (...p) => fs.readFileSync(path.join(...p), "utf8");

// ── enfeitar(): o que vira enfeite e o que NÃO vira ───────────────────────
const sel = enfeitar("<code>[U]</code><code>[L]</code><code>[S]</code><code>[C]</code>");
for (const [letra, classe] of [["U", "u"], ["L", "l"], ["S", "s"], ["C", "c"]]) {
  confere(sel.includes(`<span class="sw-selo ${classe}">${letra}</span>`),
    `o selo [${letra}] não virou hexágono: ${sel}`);
}
confere(enfeitar("no <code>10º</code>") === 'no <span class="sw-tarja">10º</span>',
  "o nível `10º` não virou tarja");
confere(enfeitar("<code>[11]</code>") === '<span class="sw-tarja">11</span>',
  "o nível `[11]` não virou tarja");
confere(enfeitar("★").includes("sw-selo estrela"), "a estrela não virou selo");

// código de verdade continua código: é a diferença entre marcador e código
const cod = "<code>actor.setFlag</code>";
confere(enfeitar(cod) === cod, `enfeitar() mexeu em código de verdade: ${enfeitar(cod)}`);
// e um número de três dígitos não é nível
confere(enfeitar("<code>100º</code>") === "<code>100º</code>",
  "enfeitar() tratou 100º como nível");

// ── enfeitarDoc(): só os campos de HTML ───────────────────────────────────
//
// Um ★ no NOME de um poder não pode virar <span>: o Foundry mostra o campo
// `name` como texto puro, e a tag apareceria literal na lista do compêndio.
const doc = {
  name: "Poder ★",
  system: { description: "<p><code>[S]</code> corrompe ★</p>" },
};
enfeitarDoc(doc);
confere(doc.name === "Poder ★", `enfeitarDoc() mexeu no name: ${doc.name}`);
confere(doc.system.description.includes("sw-selo s"), "enfeitarDoc() não enfeitou a descrição");

// e aplicar duas vezes não aninha span dentro de span
const duas = enfeitarDoc(enfeitarDoc({ system: { description: "★" } }));
confere(!/<span[^>]*><span/.test(duas.system.description),
  `enfeitarDoc() aplicado duas vezes aninhou spans: ${duas.system.description}`);

// ── As fontes: cada arquivo citado no CSS existe de verdade ───────────────
//
// Esta é a falha mais silenciosa de todas. Um url() apontando para um .woff2
// que não foi para o repo (ou que o zip não levou) não dá erro em lugar
// nenhum: o navegador cai para a fonte seguinte da pilha e a mesa vê Georgia.
const fontesCss = ler(MOD, "styles", "fontes.css");
const citadas = [...fontesCss.matchAll(/url\('\.\.\/fonts\/([^']+)'\)/g)].map((m) => m[1]);
confere(citadas.length >= 9, `fontes.css cita só ${citadas.length} arquivos`);
for (const f of new Set(citadas)) {
  confere(fs.existsSync(path.join(MOD, "fonts", f)), `fonte citada e ausente: fonts/${f}`);
}
// as três famílias do livro, todas presentes
for (const fam of ["Orbitron", "Saira Condensed", "Source Serif 4"]) {
  confere(fontesCss.includes(`font-family: '${fam}'`), `faltou a família ${fam}`);
}

// ── O module.json declara as três folhas, na ordem ────────────────────────
//
// A ordem importa: fontes.css antes de livro.css (que usa as famílias) e
// livro.css antes de starwars-sd.css (que lê as variáveis --sw-*).
const mj = JSON.parse(ler(MOD, "module.json"));
confere(
  JSON.stringify(mj.styles) ===
    JSON.stringify(["styles/fontes.css", "styles/livro.css", "styles/starwars-sd.css"]),
  `styles fora de ordem: ${JSON.stringify(mj.styles)}`
);

// ── O CSS: selo e tarja NÃO podem depender do container do journal ───────
//
// As habilidades de classe aparecem na ficha, no cartão de chat e no tooltip,
// todos fora de .starwars-sd-doc. Preso ao container, o nível sairia sem
// estilo justamente na ficha — que é onde o jogador olha.
const livroCss = ler(MOD, "styles", "livro.css");
confere(/^\.sw-selo \{/m.test(livroCss), "o .sw-selo não está solto no CSS");
confere(/^\.sw-tarja \{/m.test(livroCss), "o .sw-tarja não está solto no CSS");
confere(!livroCss.includes(".starwars-sd-doc .sw-selo"),
  "o .sw-selo voltou a depender do container do journal");

// toda variável --sw-* usada no CSS tem de estar definida em algum :root dele
const definidas = new Set([...livroCss.matchAll(/^\s*(--sw-[\w-]+):/gm)].map((m) => m[1]));
const usadas = new Set(
  [...livroCss, ...ler(MOD, "styles", "starwars-sd.css")]
    .join("")
    .match(/var\((--sw-[\w-]+)/g)
    ?.map((v) => v.slice(4)) ?? []
);
for (const v of usadas) {
  confere(definidas.has(v), `variável usada e nunca definida: ${v}`);
}

// ── Os packs: nenhum selo ficou como <code>, e os capítulos têm cor ───────
const arquivos = fs
  .readdirSync(PACKS)
  .flatMap((d) => fs.readdirSync(path.join(PACKS, d)).map((f) => path.join(PACKS, d, f)))
  .filter((f) => f.endsWith(".json"));

let selos = 0;
let sobrou = 0;
for (const f of arquivos) {
  const d = JSON.parse(fs.readFileSync(f, "utf8"));
  const alvos = [d.system?.description, ...(d.pages ?? []).map((p) => p.text?.content)];
  for (const t of alvos.filter(Boolean)) {
    selos += (t.match(/class="sw-selo/g) ?? []).length;
    sobrou += (t.match(/<code>\[[ULSC]\]<\/code>/g) ?? []).length;
    sobrou += (t.match(/<code>\d{1,2}[ºo°]<\/code>/g) ?? []).length;
  }
}
confere(selos > 100, `só ${selos} selos nos packs — a pós-passagem rodou?`);
confere(sobrou === 0, `${sobrou} marcadores ficaram como <code> nos packs`);

// os dez capítulos: cada um com a classe de cor e a faixa de abertura
const journals = fs
  .readdirSync(path.join(PACKS, "starwars-sd-journal"))
  .map((f) => JSON.parse(ler(PACKS, "starwars-sd-journal", f)))
  .filter((d) => d.pages?.length);
// O número cresce quando um capítulo é escrito, e travá-lo aqui só obrigaria a
// editar o teste junto. O que importa é que TODOS tenham cor, faixa e epígrafe,
// e que os números não se repitam — é isso que as asserções abaixo cobrem.
confere(journals.length >= 10, `só ${journals.length} capítulos com página`);
const numeros = new Set();
for (const d of journals) {
  const p0 = d.pages[0].text.content;
  const cor = p0.match(/starwars-sd-doc c-(\w+)/);
  confere(cor, `${d.name}: página de abertura sem classe de cor`);
  const ab = p0.match(/<div class="abertura"><div class="n">(\d+)<\/div>/);
  confere(ab, `${d.name}: sem a faixa de abertura`);
  if (ab) numeros.add(ab[1]);
  confere(p0.includes('class="epigrafe"'), `${d.name}: sem epígrafe`);
  // o título não pode sair duas vezes: a faixa já o mostra
  confere(d.pages[0].title.show === false,
    `${d.name}: a página de abertura ainda mostra o próprio título`);
  // e as páginas seguintes continuam mostrando o delas
  if (d.pages.length > 1) {
    confere(d.pages[1].title.show === true,
      `${d.name}: a segunda página escondeu o título`);
  }
}
confere(numeros.size === journals.length,
  `números de capítulo repetidos: ${[...numeros].sort().join(", ")}`);

// ── O TEMA DO LIVRO NA FICHA DO SISTEMA ───────────────────────────────────
//
// A ficha de personagem é do sistema `olddragon2e`; quem cobre os seletores
// dele é a folha do módulo Space Dragon, sob `body.spacedragon-tema`. Esta
// camada só troca as cinco variáveis. O que pode dar errado em silêncio:
//
//   1. perder a regra de classe DUPLA, e aí num empate de especificidade vence
//      quem o navegador carregou depois — entre dois módulos, imprevisível;
//   2. pôr o amarelo do letreiro em `--sd-barra`, que é FUNDO com
//      `color: #ffffff !important` fixado pelo vizinho: branco sobre #FFD93B
//      não se lê, e na ficha de nave o mesmo amarelo funciona porque lá a cor
//      do texto é nossa;
//   3. reescrever os seletores do sistema aqui, que é o que a folha do vizinho
//      diz que quebra na versão seguinte dele.
// CADA bloco que define as variáveis precisa da variante de classe dupla, e
// não só um deles: o claro, o escuro e o @media são três, e um que fique sem
// ela perde o empate de especificidade em silêncio, naquele tema só.
const blocosComBarra = (livroCss.match(/--sd-barra:/g) ?? []).length;
const duplas = (livroCss.match(/\.starwars-sd-tema\.spacedragon-tema/g) ?? []).length;
confere(duplas >= blocosComBarra,
  `${blocosComBarra} bloco(s) definem --sd-barra, mas só ${duplas} têm a classe dupla ` +
  `— o que ficar sem ela perde o empate de especificidade naquele tema`);
confere(/body\.theme-dark\.starwars-sd-tema/.test(livroCss),
  "o tema do livro não tem variante escura na ficha do sistema");

// a barra tem de ser escura nos DOIS temas, porque o texto em cima é branco
const barras = [...livroCss.matchAll(/--sd-barra:\s*([^;]+);/g)].map((m) => m[1].trim());
confere(barras.length >= 2, `só ${barras.length} definição(ões) de --sd-barra`);
for (const b of barras) {
  confere(!/crawl|ffd93b/i.test(b),
    `--sd-barra: ${b} — é fundo com texto branco fixo; o amarelo do letreiro não se lê`);
}

// Escopar em `.olddragon2e.sheet` para DEFINIR VARIÁVEIS é legítimo e é o que
// esta camada faz. O que quebra na versão seguinte do sistema é COPIAR os
// caminhos internos dele — foi o erro que a folha do módulo Space Dragon
// documenta ter cometido na primeira versão.
// Sem os comentários: eles EXPLICAM o !important da folha do vizinho e os
// caminhos do sistema, e analisá-los junto com o código dá falso positivo —
// foi o que aconteceu na primeira versão desta asserção.
const cssSemComentarios = livroCss.replace(/\/\*[\s\S]*?\*\//g, "");
const INTERNOS_DO_SISTEMA = [
  ".tab-title", ".ability-level", ".character-tab-", ".race-abilities",
  ".class-abilities", ".jp-value", ".race-value",
];
for (const regra of cssSemComentarios.split("}")) {
  const seletor = regra.split("{")[0];
  if (!/starwars-sd-tema/.test(seletor)) continue;
  for (const interno of INTERNOS_DO_SISTEMA) {
    confere(!seletor.includes(interno),
      `a camada do livro copia um caminho interno do sistema (${interno}) em` +
      ` "${seletor.trim().slice(0, 70)}" — é o que quebra quando o sistema muda`);
  }
}
// A PROFUNDIDADE do seletor, e não o `!important`.
//
// A primeira versão desta asserção proibia `!important`, supondo que bastaria
// trocar as variáveis `--sd-*`. Medir a ficha refutou isso: há fundo claro
// FIXADO em hexadecimal — `ol.item-list` em #ffffff, `.character-race` em
// #e0ddca — que variável nenhuma alcança, e contra cor fixa não há seletor
// curto que ganhe na contagem. O `!important` passou a ser necessário, pela
// mesma razão que a folha do módulo Space Dragon já o usava.
//
// O que de fato quebra quando o sistema muda é a PROFUNDIDADE: um nome de
// componente (`ol.item-list`) sobrevive a uma remodelagem de layout; uma
// cadeia de cinco descendentes não. O limite é dois níveis depois do escopo.
const LIMITE_DE_NIVEIS = 2;
for (const regra of cssSemComentarios.split("}")) {
  const bruto = regra.split("{")[0];
  if (!/starwars-sd-tema/.test(bruto)) continue;
  for (const sel of bruto.split(",")) {
    const depoisDoEscopo = sel.split(".olddragon2e.sheet")[1];
    if (!depoisDoEscopo) continue;
    const niveis = depoisDoEscopo.trim().split(/\s+/).filter(Boolean).length;
    confere(niveis <= LIMITE_DE_NIVEIS,
      `seletor fundo demais no sistema (${niveis} níveis): "${sel.trim().slice(0, 80)}"` +
      ` — cadeias longas quebram quando o sistema remodela o layout`);
  }
}

// ── O TEXTO DOS CAMPOS DESABILITADOS ──────────────────────────────────────
//
// Num `input` desabilitado o Chrome pinta o texto com `-webkit-text-fill-color`,
// que IGNORA `color`. Escurecer o fundo desses campos sem tratar essa
// propriedade apaga metade dos números da ficha — os modificadores, a Base do
// CP, a BA, as JP —, e nada no build acusa: só se vê na tela.
//
// Foi exatamente o que aconteceu na 1.16.4, e o sintoma denunciava a causa: os
// campos editáveis continuavam mostrando o valor, e só os calculados sumiam.
if (/\.olddragon2e\.sheet input[^{]*\{[^}]*background-color/.test(cssSemComentarios)) {
  confere(/input:disabled[^{]*\{[^}]*-webkit-text-fill-color/.test(cssSemComentarios),
    "a camada escurece o fundo dos campos mas não trata -webkit-text-fill-color" +
    " em input:disabled — os valores calculados ficam invisíveis no Chrome");
  confere(/\.olddragon2e\.sheet input[^{]*\{[^}]*-webkit-text-fill-color/.test(cssSemComentarios),
    "falta -webkit-text-fill-color nos campos em geral");
}

// ── A LISTA MEDIDA, E NADA DE FORA ────────────────────────────────────────
//
// Estes são os elementos que a medição numa ficha real apontou com fundo claro
// — luminância acima de 140 — e que por isso somem sob o tema escuro. A lista
// vira constante aqui porque o erro que ela previne já aconteceu: na 1.16.4 eu
// medi, documentei os sete no CHANGELOG, e deixei `.spacedragon-testes` de fora
// do CSS. O painel de Desativar Robôs ficou ilegível, e nada acusou.
//
// Acrescentar um elemento medido a esta lista é como se registra que ele existe;
// esquecer de cobri-lo passa a quebrar o teste, e não a ficha de alguém.
const FUNDOS_CLAROS_MEDIDOS = [
  "ol.item-list",          // #ffffff — a lista de habilidades e poderes
  ".editor",               // #ffffff — o editor de texto rico
  ".character-race",       // #e0ddca — o campo ao lado do nome
  ".character-class",      // #e0ddca
  "option",                // #dad8cc — as opções dos seletores
  ".spacedragon-testes",   // rgba(204,211,240,.35) — Desativar Robôs
  // `code` sozinho é genérico demais para esta checagem: a folha dos journals
  // também o estiliza, e a busca acharia aquela ocorrência. O alvo é o da ficha.
  ".olddragon2e.sheet code",  // rgba(204,238,255,.267)
];
for (const alvo of FUNDOS_CLAROS_MEDIDOS) {
  // O seletor tem de TERMINAR ali. Um `includes` simples aceitaria
  // ".spacedragon-testesX", que é outro elemento e não cobre coisa alguma —
  // foi assim que a primeira versão desta asserção deixou a sabotagem passar.
  const coberto = cssSemComentarios
    .split(alvo)
    .slice(1)
    .some((depois) => !/^[a-zA-Z0-9_-]/.test(depois));
  confere(coberto,
    `a medição apontou ${alvo} com fundo claro, e a camada escura não o cobre` +
    ` — ele fica ilegível no tema do livro`);
}

// o tema sai de um arquivo próprio, com a opção e o aviso
const temaJs = ler(MOD, "module", "tema.js");
confere(temaJs.includes("spacedragon-tema"),
  "o tema.js não confere se a camada do vizinho está ligada");
confere(temaJs.includes("scope: \"client\""),
  "a opção do tema devia ser client, como a do vizinho: quem olha decide");
confere(temaJs.includes("default: false"),
  "o tema devia começar desligado: num mundo misto, impor a paleta é erro");

// ── OS DOIS MODOS DO LIVRO ────────────────────────────────────────────────
//
// O tema do livro segue o Foundry por padrão: pergaminho no claro, espaço no
// escuro. Quem roda o VTT escuro e quer a ficha em pergaminho precisa poder
// pedir — o tema do VTT é escolha de interface, a cara do livro é de cenário.
//
// A ASSERÇÃO QUE IMPORTA: com `sw-papel` forçado, as regras ESCURAS têm de
// ceder. Sem o `:not`, elas continuariam valendo e o pergaminho não apareceria —
// e o sintoma seria "liguei a opção e não mudou nada", que é o pior tipo.
{
  const livro = fs.readFileSync(
    new URL("../starwars-sd-module/styles/livro.css", import.meta.url), "utf8");
  const semComentarios = livro.replace(/\/\*[\s\S]*?\*\//g, "");

  // O BLOCO que define as variáveis, e não qualquer menção: `.sw-papel` aparece
  // dezenas de vezes dentro de `:not(.sw-papel)`, e procurar a classe solta dava
  // verde mesmo com o bloco apagado — a sabotagem passou batida na primeira
  // versão desta conferência.
  for (const [classe, nome] of [["sw-papel", "pergaminho"], ["sw-espaco", "espaço"]]) {
    const temBloco = new RegExp(
      String.raw`body\.starwars-sd-tema\.${classe}\s*[,{]`
    ).test(semComentarios);
    confere(temBloco, `falta o BLOCO do modo ${nome} (body.starwars-sd-tema.${classe})`);
  }

  // toda regra que pinta o ESCURO por causa do tema do Foundry tem de ceder
  for (const m of semComentarios.matchAll(/([^{}]*theme-dark[^{}]*)\{/g)) {
    for (const parte of m[1].split(",")) {
      if (!/starwars-sd-tema/.test(parte)) continue;
      confere(/:not\(\.sw-papel\)/.test(parte),
        `"${parte.trim().slice(0, 60)}" não cede ao pergaminho forçado`);
    }
  }
}

// ── OS DOIS MODOS DEFINEM AS MESMAS VARIÁVEIS ─────────────────────────────
//
// O bloco escuro redefine as variáveis de texto do Foundry porque sobre o fundo
// de espaço elas têm de ser claras. Quando o pergaminho forçado fez aquele bloco
// ceder, NINGUÉM mais as definia — e com o VTT em escuro elas voltavam ao claro
// dele, sobre o pergaminho claro.
//
// O sintoma foi preciso e cruel: a ficha certa, e todos os RÓTULOS invisíveis.
// Valor legível, rótulo não.
//
// A lista é EXPLÍCITA. A primeira versão desta conferência extraía as variáveis
// dos dois blocos por regex e comparava os conjuntos — e passou verde com uma
// variável apagada, porque a extração não pegou o bloco que eu imaginava. Lista
// escrita à mão não tem esse problema: o que está aqui é o que se cobra.
{
  const VARIAVEIS = [
    "--color-text-dark-primary",
    "--color-text-dark-secondary",
    "--color-text-dark-inactive",
    "--color-text-dark-5",
    "--color-text-dark-6",
    "--color-text-primary",
    "--color-text-secondary",
    "--color-text-subtle",
    "--color-text-emphatic",
  ];
  const livro2 = fs.readFileSync(
    new URL("../starwars-sd-module/styles/livro.css", import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  // o trecho do modo pergaminho: do seletor até o fim do bloco
  const i = livro2.indexOf("body.starwars-sd-tema.sw-papel .olddragon2e.sheet");
  confere(i > 0, "falta o bloco de cores de texto do modo pergaminho");
  const trecho = i > 0 ? livro2.slice(i, livro2.indexOf("}", i)) : "";

  for (const v of VARIAVEIS) {
    confere(trecho.includes(v + ":"),
      `o modo pergaminho não define ${v} — com o VTT em escuro ela fica clara ` +
      `sobre o pergaminho claro, e o rótulo some`);
  }
}

// ── O DESTAQUE NO PAPEL PRECISA SER LEGÍVEL E CALMO ───────────────────────
//
// `--sw-fosforo-claro` pinta a aba ativa, os links e a caixa marcada quando o
// livro está em pergaminho. O valor original era o fósforo de tela escurecido
// só o bastante para passar raspando na WCAG — 4,50:1, com 75% de saturação —
// e na mesa isso se lê como berrante, não como destaque.
//
// Duas exigências, e as duas vieram da mesa: contraste com folga, e saturação
// baixa o suficiente para não gritar sobre o papel.
{
  const livro3 = fs.readFileSync(
    new URL("../starwars-sd-module/styles/livro.css", import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  const m = livro3.match(/--sw-fosforo-claro:\s*(#[0-9a-fA-F]{6})/);
  const perg = livro3.match(/--sw-pergaminho:\s*(#[0-9a-fA-F]{6})/);
  confere(!!m && !!perg, "não achei o destaque do papel ou o pergaminho");

  if (m && perg) {
    const lum = (hex) => {
      const n = hex.replace("#", "");
      const c = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
        .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const [maior, menor] = [lum(m[1]), lum(perg[1])].sort((a, b) => b - a);
    const contraste = (maior + 0.05) / (menor + 0.05);
    confere(contraste >= 6,
      `o destaque no papel tem ${contraste.toFixed(2)}:1 — a WCAG pede 4,5, mas ` +
      `no limite ele fica desconfortável; aqui se cobra folga`);

    const n = m[1].replace("#", "");
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const saturacao = max === 0 ? 0 : (max - min) / max;
    confere(saturacao <= 0.55,
      `o destaque no papel tem ${(saturacao * 100).toFixed(0)}% de saturação — ` +
      `acima disso ele grita sobre o pergaminho em vez de destacar`);
  }
}

/* ── AS EPÍGRAFES DOS CAPÍTULOS ───────────────────────────────────────────── */
//
// O banner de cada capítulo é número + título + epígrafe. As epígrafes são
// aforismos curtos — "Esta é a Doutrina.", "Não é magia. É atenção." — e a de
// Naves tinha 78 caracteres com travessão e duas orações: a única que não cabia
// no padrão. Num banner, a frase longa quebra de linha e desfaz o bloco.
//
// O limite não é gosto: é o ponto em que a frase deixa de caber numa linha na
// largura de um journal.
{
  const dir = path.join(ROOT, "packs-src", "starwars-sd-journal");
  const eps = [];
  for (const arq of fs.readdirSync(dir)) {
    if (!arq.includes("__doc__")) continue;
    const d = JSON.parse(fs.readFileSync(path.join(dir, arq), "utf8"));
    const m = /epigrafe[^>]*>([^<]+)/.exec(JSON.stringify(d).replace(/\\"/g, '"'));
    if (m) eps.push({ nome: d.name, texto: m[1], n: m[1].length });
  }

  confere(eps.length >= 10, `só ${eps.length} epígrafes encontradas — a varredura falhou`);

  for (const e of eps) {
    confere(e.n <= 62,
      `"${e.nome}": epígrafe de ${e.n} caracteres — passa de 62 e quebra a linha do banner: "${e.texto}"`);
    confere(/[.!?]$/.test(e.texto.trim()),
      `"${e.nome}": a epígrafe não termina em ponto — as outras são frases fechadas`);
  }
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ estilo: selos e tarjas (e o que não é marcador), as fontes citadas existem, " +
    "a ordem das folhas, --sw-* sem variável órfã, e todo capítulo com cor, faixa e epígrafe"
);
