// Bestiário: as criaturas do roster nativo, vestidas de Star Wars.
//
// Fonte: o cofre, em Documents\Ekhoria\20 Space Dragon\Space Dragon Nativo\
//   SW-SDN-Bestiario.md — lido por tools/importar-cofre.mjs para
//   bestiario-do-cofre.mjs. Este arquivo só decide o que é enfeite de ficha:
//   conceito, pasta e as flags que o módulo Space Dragon lê.
//
// ── POR QUE O BESTIÁRIO EXISTE AQUI, SE O SUPLEMENTO MANDA NÃO COPIAR ───────
//
// O Suplemento diz "abra o livro no nome nativo, leia a ficha e apresente a
// criatura pelo nome de Star Wars". Isso vale para quem joga com o livro na
// mão. Na mesa virtual, traduzir de cabeça e procurar no outro compêndio é
// atrito — e os números do roster nativo são os do livro, conferidos contra o
// módulo Space Dragon (Tiranossauro 2.615 XP, Gigantossauro 7.250).
//
// O nome fica como o cofre escreve, "Glacioprimata (Wampa)": acha pelos dois.

import { CRIATURAS } from "./bestiario-do-cofre.mjs";

// Conceito do sistema pela leitura da criatura. Sem isto todas nasceriam
// "Besta", inclusive os droides — e o conceito escolhe a arte do token.
const CONCEITOS = [
  [/droide|rob[óo]tico|met[áa]lopode|met[áa]lopode|aut[ôo]mato|metahumano/i, "Constructo"],
  [/bolha|geleia|limo/i, "Gosma"],
  [/planta/i, "Planta"],
  [/aranha|escaravelho|zang[ãa]o|formig[áa]cida|encrust[áa]ceo|medusa|lula|tentaculoide/i, "Inseto"],
  [/gigante de pedra|gigantossauro/i, "Gigante"],
  [/homem|homenzinho|xheniano|zork|multiforma|simihomem|ictihomem|pterohomem/i, "Humanoide"],
  [/monstro|devorador|vampiro|cristaloide/i, "Humanoide Monstruoso"],
];

const conceitoDe = (nome) => CONCEITOS.find(([re]) => re.test(nome))?.[1] ?? "Besta";

/**
 * O que o módulo Space Dragon lê na Ficha de Ameaça: os seis atributos, a
 * Resistência Mental e a Redução de Dano, que a ficha de monstro do sistema
 * não tem onde guardar. A ficha também é marcada aqui — estas criaturas já
 * abrem com JP e Moral pela regra do livro.
 */
const flagsDaCriatura = (c) => ({
  core: { sheetClass: "spacedragon.SDMonsterSheet" },
  spacedragon: {
    ameaca: {
      cientifico: "",
      atributos: c.atributos,
      rm: c.rm ?? "",
      rd: c.rd ?? "",
    },
  },
});

/**
 * A descrição da ficha.
 *
 * RM e RD aparecem aqui além do painel da Ficha de Ameaça: quem abrir a
 * criatura na ficha do Old Dragon 2 não tem o painel, e uma Redução de Dano
 * invisível é a diferença entre o combate funcionar e não funcionar.
 *
 * Nada de nota de casa: o build as remove antes de publicar (ver
 * lib.mjs › limpaNotas), e a linha sumia sem deixar rastro.
 */
function descricaoDe(c) {
  const defesas = [
    c.rm ? `<strong>Resistência mental</strong> ${c.rm}` : null,
    c.rd ? `<strong>Redução de dano</strong> ${c.rd}` : null,
  ].filter(Boolean);
  return [
    defesas.length ? `<p>${defesas.join(" · ")}</p>` : "",
    "<p><em>Ficha do <strong>Space Dragon</strong>, Cap. 11, apresentada com o nome da galáxia.</em></p>",
  ].join("");
}

const monstro = (c) => ({
  ...c,
  conceito: conceitoDe(c.nome),
  flags: flagsDaCriatura(c),
  descricao: descricaoDe(c),
  // As habilidades sem rolagem ("envolver [especial]", "imune a físico")
  // entram por extenso na descrição; ataque com dado vira botão.
  habilidades: c.habilidades,
});

export const grupos = [
  { folder: "Bestiário da Galáxia", monstros: CRIATURAS.map(monstro) },
];
