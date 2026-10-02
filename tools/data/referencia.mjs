// A folha de consulta rápida — onde está cada regra, e os números que a mesa
// procura no meio do turno.
//
// Fonte: o cofre, em SW-SUP-Referencia.md.
//
// ── POR QUE ELA É UM JOURNAL SEPARADO ──────────────────────────────────────
//
// Porque é o primeiro lugar em que se abre o compêndio quando alguém pergunta
// "onde está essa regra?". Enfiá-la como página de outro capítulo faria dela
// mais um item na lista — e o valor dela é justamente ser o atalho.
//
// O Combate Tático fica de fora dela de propósito: é módulo opcional, com
// regras próprias, e misturá-lo faria a folha descrever duas mesas diferentes.

import { TEXTOS } from "./textos-do-cofre.mjs";

const r = TEXTOS["SW-SUP-Referencia"];

export const referenciaJournal = {
  title: "Referência Rápida",
  pages: [
    { title: "A Régua de Ouro", content: r["(abertura)"] + r["A régua de ouro"] },
    { title: "Criar um Personagem", content: r["Criar um personagem"] },
    { title: "Rolar os Dados", content: r["Rolar os dados"] },
    { title: "A Ordem de Ação", content: r["A Ordem de Ação"] },
    { title: "Combate de Personagem", content: r["Combate de personagem"] },
    { title: "Acertos e Falhas Críticas", content: r["Acertos e falhas críticas"] },
    { title: "A Força", content: r["A Força"] },
    { title: "Equipamento, Dinheiro e Carga", content: r["Equipamento, dinheiro e carga"] },
    { title: "Naves", content: r["Naves"] },
    { title: "Aventura e Exploração", content: r["Aventura e exploração"] },
    { title: "Para o Mestre", content: r["Para o Mestre"] },
    { title: "No Foundry", content: r["No Foundry"] },
    { title: "Crédito", content: r["Crédito"] },
  ],
};
