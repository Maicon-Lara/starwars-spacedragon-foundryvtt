// O que se escolhe à parte da ficha de classe: as 7 Formas de Sabre do
// Guardião, o Mudar de Guarda, a Origem Filho de Mandalore e a Senda
// Mandaloriana, que é cross-class e troca habilidades da classe-base.
//
// Fonte: o cofre, em Documents\Ekhoria\20 Space Dragon\Space Dragon Suplemento\
//   SW-SUP-Sabre-e-Cristais.md e SW-SUP-Senda-Mandaloriana.md
//
// O texto vem inteiro do cofre, pelo importador (textos-do-cofre.mjs). Aqui
// fica a forma que cada pedaço toma no Foundry.

import { FORMAS, SENDA, ORIGEM, TEXTOS } from "./textos-do-cofre.mjs";

const sabre = TEXTOS["SW-SUP-Sabre-e-Cristais"];
const senda = TEXTOS["SW-SUP-Senda-Mandaloriana"];

// ── Formas de Sabre ─────────────────────────────────────────────────────────
//
// Uma habilidade por Forma, com os três degraus dentro — a Forma é UMA escolha.
// O Guardião arrasta a sua Forma Mestra no 5º; a segunda chega no 10º pelo
// Mudar de Guarda, que também é uma habilidade daqui.
const PASTA_FORMAS = "Formas de Sabre (Guardião)";

// O sistema não aceita habilidade solta no personagem. A Forma Mestra já vem
// nas variantes "Guardião (Ataru)" e "Mandaloriano (Ataru)"; estas avulsas são
// para a segunda e a terceira Forma, e a nota diz o caminho.
const COMO_ADICIONAR =
  "<p class='nota-casa'><em>Como adicionar: abra o item da classe na ficha do personagem e solte esta " +
  "habilidade dentro dele — o sistema não aceita habilidade de classe solta no personagem. A Forma Mestra " +
  "já vem pronta nas variantes <strong>Guardião (…)</strong> e <strong>Mandaloriano (…)</strong>.</em></p>";

const formas = FORMAS.map((f) => ({ folder: PASTA_FORMAS, nome: f.nome, level: 5, desc: f.desc + COMO_ADICIONAR }));
const mudarDeGuarda = {
  folder: PASTA_FORMAS,
  nome: "Mudar de Guarda",
  level: 10,
  desc: sabre["Mudar de Guarda — trocar de Forma no meio do duelo"] +
    "<p class='nota-casa'><em>Já vem na ficha de todo Guardião. A segunda e a terceira Forma se somam " +
    "abrindo o item da classe na ficha e soltando a Forma do compêndio dentro dele.</em></p>",
};

export const classAbilitiesAvulsas = [...formas, mudarDeGuarda];

// ── Origem: Filho de Mandalore ──────────────────────────────────────────────
//
// Uma Origem é escolhida na criação, POR CIMA da espécie. Vira uma habilidade
// de espécie avulsa, com os três degraus do 1º nível dentro: é uma escolha só.
export const origensAvulsas = [
  { folder: "Origens", nome: "Filho de Mandalore", desc: ORIGEM.html +
    "<p class='nota-casa'><em>Como adicionar: abra o item da espécie na ficha do personagem e solte esta " +
    "Origem dentro dele — o sistema não aceita habilidade de espécie solta no personagem.</em></p>" },
];

// ── Senda Mandaloriana ──────────────────────────────────────────────────────
//
// Vira uma classe por classe-base — "Mandaloriano — Veterano" —, montada no
// build como as especializações: herda as habilidades da base, soma o Núcleo
// (as mesmas cinco habilidades para as quatro) e a troca da sua classe, e a
// BA e a JP vêm da tabela da Senda.
export const sendaMandaloriana = {
  pasta: "Senda Mandaloriana",
  intro: SENDA.abertura + SENDA.intro,
  nucleo: SENDA.nucleo,
  trocas: SENDA.trocas,
  tabelas: SENDA.tabelas,
};

// O texto inteiro da nota, para o journal.
export const sendaJournal = {
  title: "A Senda Mandaloriana",
  pages: [
    { title: "Origem: Filho de Mandalore", content: SENDA.abertura + senda["Origem: Filho de Mandalore (1º nível)"] },
    { title: "A Senda Mandaloriana", content: senda[
      "A Senda Mandaloriana (arquétipo cross-class, 5º nível)"] },
    { title: "Referência de Equipamento", content: senda["Referência de equipamento"] },
  ],
};
