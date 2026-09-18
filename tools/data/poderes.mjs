// Os Poderes da Força: os 101 Poderes Mentais do Space Dragon relidos, da 1ª
// à 10ª Grandeza, nas três correntes Universal, Luz e Sombra.
//
// Fonte: o cofre, em Documents\Ekhoria\20 Space Dragon\Space Dragon Suplemento\
//   SW-SUP-Poderes-da-Forca.md; as regras do journal vêm também de
//   SW-SUP-Forca.md.
//
// ── DE ONDE VEM CADA PEDAÇO ─────────────────────────────────────────────────
//
// O cofre dá o nome de Star Wars, o nome nativo, a corrente e o ★. Os números
// e o texto — "é ali que estão os números", diz o cofre do Cap. 9 — vêm do
// compêndio de Poderes Mentais do módulo Space Dragon, pelo importador. Cada
// poder daqui carrega os campos do nativo (alcance, duração, JP, Grandeza),
// para a ficha e a barra de alcance mental funcionarem, e um link para ele.
//
// ── POR QUE TODOS SÃO "ARCANE" ──────────────────────────────────────────────
//
// O Star Dragon usa as três escolas do OD2 para Universal, Luz e Sombra e
// troca o rótulo delas no idioma do sistema — o que vale para o mundo inteiro,
// e foi o que o módulo Space Dragon teve de desfazer na 1.5.0. Aqui a escola
// é a mesma dos Poderes Mentais do Space Dragon, e a corrente fica na pasta
// (colorida) e na primeira linha da descrição.

import { TEXTOS, PODERES } from "./textos-do-cofre.mjs";
import { md } from "../lib.mjs";

const REGRA_DA_CORRENTE = {
  Universal: "`[U]` **Universal** — acessível a qualquer Sensível, de qualquer Caminho.",
  Luz: "`[L]` **Luz** — só quem trilha o **Caminho da Luz** (serenidade, cura, defesa, presciência).",
  Sombra: "`[S]` **Sombra** — só quem trilha o **Caminho da Sombra** (medo, domínio, destruição). Usar um poder `[S]` sendo da Luz marca **+1 de Corrupção**.",
};
const ESTRELA = "**★ Sempre corrompe:** mesmo para quem é da Sombra, o poder marca **+1 de Corrupção** (alimenta-se de sofrimento).";

function descricao(p) {
  const link = `@UUID[Compendium.spacedragon.spacedragon-poderes.Item.${p.nativo.id}]{${p.nativo.nome}}`;
  return (
    `<p>${md(REGRA_DA_CORRENTE[p.corrente])}</p>` +
    (p.corrupcao ? `<p>${md(ESTRELA)}</p>` : "") +
    `<p><strong>Poder Mental (<em>SD</em>):</strong> ${link}</p>` +
    p.nota +
    "<hr>" +
    p.nativo.description
  );
}

// Uma lista por corrente, na ordem do cofre: Universal, Luz, Sombra.
export const listasDePoder = ["Universal", "Luz", "Sombra"].map((corrente) => ({
  folder: corrente,
  school: "arcane",
  poderes: PODERES.filter((p) => p.corrente === corrente).map((p) => ({
    nome: p.nome,
    circle: p.grandeza,
    range: p.nativo.range,
    duration: p.nativo.duration,
    jp: p.nativo.jp,
    desc: descricao(p),
  })),
}));

// O Caminho (Luz, Sombra e Cinza), a Corrupção, a Tentação e o Eco da Senda —
// regra, não poder, e por isso no journal. O texto vem inteiro do cofre, pelo
// importador; aqui só se escolhe a ordem e o nome de cada página.
const forca = TEXTOS["SW-SUP-Forca"];
const poderes = TEXTOS["SW-SUP-Poderes-da-Forca"];

export const poderesJournal = {
  title: "A Força",
  pages: [
    { title: "Poderes da Força", content: poderes["(abertura)"] + poderes["Como usar este capítulo"] },
    { title: "As Três Correntes", content: poderes["As três correntes (Caminho)"] },
    { title: "O Caminho: Luz, Sombra e o meio", content: forca["O Caminho: Luz, Sombra e o meio"] },
    { title: "O Caminho Cinza", content: forca["O Caminho Cinza"] },
    { title: "Corrupção — Queda e Redenção", content: forca["Corrupção — Queda e Redenção"] },
    { title: "A Tentação", content: forca["A Tentação — a Corrupção como moeda"] },
    { title: "Eco da Senda", content: forca["Eco da Senda — o Alcance que volta"] },
    { title: "Crédito", content: poderes["Crédito"] },
  ],
};

// ── Ordens e Ranks ──────────────────────────────────────────────────────────
//
// Fonte: SW-SUP-Ordens-e-Ranks.md. Rank é narrativo — não há item a criar,
// só o texto para o Mestre e os jogadores.
const ordens = TEXTOS["SW-SUP-Ordens-e-Ranks"];

export const ordensJournal = {
  title: "Ordens e Ranks da Força",
  pages: [
    { title: "A Ordem Jedi", content: ordens["(abertura)"] + ordens["A Ordem Jedi (Caminho da Luz)"] },
    { title: "Os Sith — a Regra de Dois", content: ordens["Os Sith — a Regra de Dois (Caminho da Sombra)"] },
    { title: "Outras Tradições", content: ordens["Outras tradições (opcionais)"] },
    { title: "Rank na Prática", content: ordens["Rank na prática"] },
  ],
};
