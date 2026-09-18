// Equipamento: armas corpo a corpo (e o sabre de luz), armas de fogo,
// arremesso e explosivos, armaduras e vestes, aparelhos e kits, medicina, e o
// catálogo de aparatos por Nível Tecnológico.
//
// Fonte: o cofre, em Documents\Ekhoria\20 Space Dragon\Space Dragon Suplemento\
//   SW-SUP-Equipamentos.md, SW-SUP-Sabre-e-Cristais.md e
//   SW-SUP-Aparatos-e-Feitos.md
//
// ── O QUE VIRA ITEM E O QUE VIRA TEXTO ──────────────────────────────────────
//
// Arma, veste, aparelho, remédio e aparato viram item, porque a ficha faz algo
// com eles. Serviços, vestes sob encomenda, a tabela de alcance e os Feitos
// Científicos vão para o journal: não há o que a ficha faça com "Cirurgia
// (hora), 25.000". As tabelas vêm do importador, linha por linha; aqui se
// decide o que cada coluna vira.
//
// ── O CP DAS VESTES ─────────────────────────────────────────────────────────
//
// No Space Dragon a veste dá um valor ABSOLUTO — 10, 13, 15 — e a ficha do
// OD2 faz 10 + bônus da armadura + Destreza. Então o bônus é CP − 10: a
// Armadura de Stormtrooper (CP 15) entra com +5, e a ficha chega ao CP do livro
// sozinha. Só o bônus de nível da Tabela 4-1 fica de fora, porque o sistema
// não tem onde pô-lo.

import { EQUIPAMENTOS, APARATOS, TEXTOS } from "./textos-do-cofre.mjs";
import { md } from "../lib.mjs";

/** A tabela do cofre cujo cabeçalho começa com estas colunas. */
function tabela(...colunas) {
  const t = EQUIPAMENTOS.find((x) => colunas.every((c, i) => x.cabecalho[i] === c));
  if (!t) throw new Error(`tabela de equipamento não encontrada: ${colunas.join(" | ")}`);
  return t.linhas.map((l) => Object.fromEntries(t.cabecalho.map((c, i) => [c, l[i]])));
}

const semMarca = (s) => String(s ?? "").replace(/\*\*/g, "").trim();
const vazio = (s) => !semMarca(s) || /^[—–-]$/.test(semMarca(s));
const custo = (s) => (vazio(s) ? "" : `${semMarca(s)} CR`);
const gramas = (s) => (vazio(s) ? 0 : Math.round(Number(semMarca(s).replace(",", ".")) * 1000) || 0);
const disponib = (s) => (vazio(s) ? "Livre." : `${semMarca(s)}.`);

/** "Corte/Perf." → slashing. O primeiro tipo manda; energia e o resto, nenhum. */
function tipoDeDano(s) {
  const t = semMarca(s).toLowerCase();
  if (t.startsWith("corte")) return "slashing";
  if (t.startsWith("perf")) return "piercing";
  if (t.startsWith("contus")) return "bludgeoning";
  return "none";
}

/** "1d6/1d6" → "1d6": a ficha rola um dado; a segunda ponta fica no texto. */
const dano = (s) => (vazio(s) ? "" : semMarca(s).split("/")[0]);

// ── Armas corpo a corpo ─────────────────────────────────────────────────────

const REGRA_SABRE =
  "Uma lâmina de energia pura: 2d10 de dano por energia, e corta quase qualquer coisa. " +
  "Ignora a proteção de armaduras comuns (a lâmina atravessa placas), mas não a Beskar mandaloriana nem outro sabre. " +
  "Manejo perigoso: só o Sensível à Força o empunha sem risco (e o Guardião é o mestre da lâmina). " +
  "Nas mãos de um não-sensível, um 1 natural no ataque significa que ele se fere (2d10 no próprio portador). " +
  "Deflexão de tiros é técnica de Forma (Soresu e cia.); a construção e os cristais kyber estão no journal Sabre de Luz e Cristais Kyber.";

const corpoACorpo = tabela("Arma", "Custo", "Dano", "Tipo", "Peso", "Disponib.").map((a) => {
  const nome = semMarca(a.Arma);
  const duasPontas = /\//.test(semMarca(a.Dano)) && /\d/.test(a.Dano);
  const luvas = nome === "Luvas de Combate";
  return {
    nome,
    melee: true,
    damage: luvas ? "" : dano(a.Dano),
    bonus_damage: luvas ? 1 : 0,
    damage_type: tipoDeDano(a.Tipo),
    two_handed: duasPontas,
    cost: custo(a.Custo),
    weight_in_grams: gramas(a.Peso),
    desc:
      (nome === "Sabre de Luz" ? `${REGRA_SABRE} ` : "") +
      (luvas ? "Soma +1 ao dano desarmado. " : "") +
      (duasPontas ? `Dano ${semMarca(a.Dano)}: uma ponta de cada lado. ` : "") +
      `Dano ${semMarca(a.Dano)}, tipo ${semMarca(a.Tipo)}. Disponibilidade: ${disponib(a["Disponib."])}`,
  };
});

const sabres = corpoACorpo.filter((a) => a.nome === "Sabre de Luz");
const sabreSombrio = {
  nome: "Sabre Sombrio",
  melee: true,
  damage: "2d10",
  damage_type: "none",
  cost: "",
  desc:
    "Lâmina negra e achatada como uma espada, forjada há mil anos por Tarre Vizsla — o primeiro Mandaloriano admitido na Ordem Jedi. " +
    "Artefato único e símbolo de liderança de Mandalore. Como um Sabre de Luz, mas corta até a Beskar — a única lâmina que ignora o CP da Armadura Beskar. " +
    "O Peso da Dúvida: quem o empunha sem tê-lo conquistado em combate sofre −1 nos ataques com ele até vencer um duelo com a lâmina. " +
    "O Direito de Mandalore: portá-lo é reivindicar a liderança de Mandalore. Sem preço: não se compra.",
};

// ── Armas de fogo ───────────────────────────────────────────────────────────
//
// A primeira faixa da tabela de alcance (queima-roupa) vai para o campo de
// alcance do OD2; as quatro faixas, na descrição. A categoria de cada arma não
// está escrita no cofre — sai do nome: pistola é Pistola; rifle, carabina,
// escopeta e bowcaster são Rifles; canhões, repetidoras, E-Web e lançadores
// são Artilharia; arco e funda, Armas simples.
const FAIXAS = {
  Pistolas: { primeira: 20, texto: "Pistolas: queima-roupa 0–20 m (+2), curto 21–40 (−2), médio 41–60 (−5), longo 61–80 (−10)." },
  Rifles: { primeira: 30, texto: "Rifles: queima-roupa 0–30 m (+2), curto 31–60 (−2), médio 61–150 (−5), longo 151–300 (−10)." },
  Artilharia: { primeira: 50, texto: "Artilharia: queima-roupa 0–50 m (+2), curto 51–100 (−2), médio 101–250 (−5), longo 251–500 (−10)." },
  "Armas simples": { primeira: 20, texto: "Armas simples: queima-roupa 0–20 m (+2), curto 21–40 (−2), médio 41–60 (−5), longo 61–80 (−10)." },
  Arremesso: { primeira: 6, texto: "Arremesso: queima-roupa 0–6 m (+2), curto 7–8 (−2), médio 9–10 (−5), longo 11–12 (−10)." },
};
function categoria(nome) {
  if (/^Pistola/.test(nome)) return "Pistolas";
  if (/Rifle|Carabina|Escopeta|Bowcaster/.test(nome)) return "Rifles";
  if (/Arco|Funda/.test(nome)) return "Armas simples";
  return "Artilharia";
}
const CDT = { A: "automática", SA: "semiautomática", U: "disparo único" };

const deFogo = tabela("Arma", "Custo", "Dano", "Tipo", "CDT", "Peso", "Disponib.").map((a) => {
  const nome = semMarca(a.Arma);
  const cat = categoria(nome);
  const cdt = semMarca(a.CDT);
  return {
    nome,
    ranged: true,
    damage: dano(a.Dano),
    damage_type: tipoDeDano(a.Tipo),
    shoot_range: FAIXAS[cat].primeira,
    two_handed: cat !== "Pistolas",
    cost: custo(a.Custo),
    weight_in_grams: gramas(a.Peso),
    desc:
      `Dano ${vazio(a.Dano) ? "o da munição (granada)" : semMarca(a.Dano)}, tipo ${vazio(a.Tipo) ? "—" : semMarca(a.Tipo)}. ` +
      `Cadência: ${CDT[cdt] ?? cdt}${cdt === "A" ? " (permite Tiro Duplo e Rajada)" : cdt === "SA" ? " (permite Tiro Duplo)" : ""}. ` +
      `Alcance — ${FAIXAS[cat].texto} Disponibilidade: ${disponib(a["Disponib."])}` +
      (/Íons|Iônic/i.test(nome + a.Tipo) ? " Contra Droides: dano dobrado; num crítico, o Droide fica desativado." : ""),
  };
});

// ── Granadas e explosivos ───────────────────────────────────────────────────
//
// Granada e detonador térmico se arremessam (tipo `throwing` no OD2, sem
// munição). Detonita e carga explosiva são de FIXAÇÃO: colocadas, não
// arremessadas — viram item comum, com o dano no texto.
const EXPLOSIVO_DE_FIXACAO = /Detonita|Carga Explosiva/;
const explosivos = tabela("Item", "Custo", "Dano", "Tipo", "Peso", "Disponib.").map((a) => {
  const nome = semMarca(a.Item);
  const texto =
    `Dano ${semMarca(a.Dano)}, tipo ${semMarca(a.Tipo)}. Disponibilidade: ${disponib(a["Disponib."])}` +
    (EXPLOSIVO_DE_FIXACAO.test(nome)
      ? " Explosivo de fixação: colocar exige teste de Demolição (Ciência); sucesso ignora a redução de dano do alvo. Margem de 5 dobra o dano; 10 ou crítico triplica. Dobrar o número de cargas soma +2 dados."
      : ` Alcance — ${FAIXAS.Arremesso.texto}`);
  return { nome, fixacao: EXPLOSIVO_DE_FIXACAO.test(nome), damage: dano(a.Dano), damage_type: tipoDeDano(a.Tipo),
    cost: custo(a.Custo), weight_in_grams: gramas(a.Peso), desc: texto };
});

// ── Armaduras e vestes ──────────────────────────────────────────────────────

const DESTAQUES = {
  "Armadura Corelliana": "Dá +2 de Força a quem tem proficiência em médias.",
  "Armadura de Stormtrooper": "Dá +2 em Percepção e visão na penumbra, e comunicador no capacete. A variante da neve/deserto, 150.000 CR, dá imunidade a frio/calor extremo.",
  "Armadura Mandaloriana": "Herança de clã (ver A Senda Mandaloriana). A Beskar verdadeira — a que detém um sabre de luz — está no journal Sabre de Luz e Cristais Kyber.",
  "Mandaloriana Pesada": "Herança de clã (ver A Senda Mandaloriana).",
};
const PENALIDADE = { Veste: "−1", Leve: "−2", "Média": "−5", Pesada: "−10" };

const vestes = tabela("Proteção", "Custo", "CP", "Desloc.", "Tipo", "Peso", "Disponib.").map((v) => {
  const nome = semMarca(v["Proteção"]);
  const cp = Number(semMarca(v.CP));
  const tipo = semMarca(v.Tipo);
  return {
    nome,
    bonus_ca: cp - 10,
    cost: custo(v.Custo),
    weight_in_grams: gramas(v.Peso),
    desc:
      `CP ${cp}: é o valor de proteção da veste, a BASE do Coeficiente de Proteção — a ficha soma o bônus ${cp - 10 >= 0 ? "+" : ""}${cp - 10} aos 10 dela e chega a ${cp}. ` +
      `Tipo: ${tipo}.` +
      (vazio(v["Desloc."]) ? "" : ` Deslocamento ${semMarca(v["Desloc."])}.`) +
      ` Sem proficiência: ${PENALIDADE[tipo] ?? "—"} em perícias físicas e ataque.` +
      ` Disponibilidade: ${disponib(v["Disponib."])}` +
      (DESTAQUES[nome] ? ` ${DESTAQUES[nome]}` : ""),
  };
});
for (const nome of Object.keys(DESTAQUES)) {
  if (!vestes.some((v) => v.nome === nome)) throw new Error(`destaque para veste que não está no cofre: ${nome}`);
}

// ── Aparelhos, kits e medicina ──────────────────────────────────────────────

const frase = (s) => { const t = md(s); return `${t.charAt(0).toUpperCase()}${t.slice(1)}.`; };
const aparelhos = tabela("Item", "Custo", "Peso", "Efeito").map((a) => ({
  nome: semMarca(a.Item),
  cost: custo(a.Custo),
  weight_in_grams: gramas(a.Peso),
  desc: frase(a.Efeito),
}));
const medicina = tabela("Item", "Custo", "Efeito").map((a) => ({
  nome: semMarca(a.Item),
  cost: custo(a.Custo),
  desc: frase(a.Efeito),
}));

// ── Aparatos, por Nível Tecnológico ─────────────────────────────────────────
//
// O nome é o da galáxia; o custo e o texto, os do aparato nativo do módulo
// Space Dragon. Dois ficam de fora: o Soro reanimador (Estimulante de bacta),
// que só existe na edição antiga do livro, e a Máquina do Tempo, que o cofre
// diz "nunca item".
const NUNCA_ITEM = ["Portal do Mortis"];

// O texto nativo diz quem opera pelo nome das classes do livro. Só essa lista
// é traduzida para as do cenário — o resto do texto fica como o livro escreve.
const CLASSE_NO_CENARIO = { Cientista: "Técnico", Cosmonauta: "Veterano", Gatuno: "Operativo", "Mentálico": "Sensível à Força" };
const operamNoCenario = (texto) =>
  texto.replace(/Operam: ([^.]+)\./, (_, lista) =>
    `Operam: ${lista.split(/,\s*/).map((c) => CLASSE_NO_CENARIO[c.trim()] ?? c.trim()).join(", ")}.`);

// "$150.000" → "150.000 CR": o livro básico escreve com cifrão, o cenário em Créditos.
const emCreditos = (s) => String(s ?? "").replace(/^\$\s*(.+)$/, "$1 CR");

const aparatos = APARATOS.filter((a) => a.nativo && !NUNCA_ITEM.includes(a.nome)).map((a) => ({
  nt: a.nt,
  nome: a.nome,
  cost: emCreditos(a.nativo.cost),
  desc:
    `Na galáxia: ${a.nome}${a.explica ? ` — ${md(a.explica)}` : ""}. ` +
    `Aparato (SD): ${a.nativo.nome}, ${a.nt}º NT. ${operamNoCenario(a.nativo.description).replace(/Custo \$([\d.]*\d)/, "Custo $1 CR")}`,
}));

// ── As categorias, na ordem da lista ────────────────────────────────────────
const porNT = new Map();
for (const a of aparatos) {
  if (!porNT.has(a.nt)) porNT.set(a.nt, []);
  porNT.get(a.nt).push(a);
}

export const categorias = [
  { folder: "Armas Corpo a Corpo", tipo: "weapon", itens: corpoACorpo.filter((a) => a.nome !== "Sabre de Luz") },
  { folder: "Sabres de Luz", tipo: "weapon", itens: [...sabres, sabreSombrio] },
  { folder: "Blasters e Armas de Energia", tipo: "weapon", itens: deFogo },
  { folder: "Granadas e Explosivos", tipo: "weapon",
    itens: explosivos.filter((e) => !e.fixacao).map((e) => ({ ...e, melee: false, throw_range: FAIXAS.Arremesso.primeira })) },
  { folder: "Granadas e Explosivos", tipo: "misc", itens: explosivos.filter((e) => e.fixacao) },
  { folder: "Armaduras e Vestes", tipo: "armor", itens: vestes },
  { folder: "Aparelhos e Kits", tipo: "misc", itens: aparelhos },
  { folder: "Medicina", tipo: "misc", itens: medicina },
  ...[...porNT.keys()].sort((a, b) => a - b).map((nt) => ({
    folder: `Aparatos Tecnológicos — ${nt}º NT`, tipo: "misc", itens: porNT.get(nt),
  })),
];
