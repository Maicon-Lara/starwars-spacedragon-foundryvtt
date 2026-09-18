// Bestiário: o de-para das criaturas do Space Dragon para as feras de Star
// Wars, os Dragões da Galáxia e os Modelos de PNJ.
//
// Fonte: o cofre, em Documents\Ekhoria\20 Space Dragon\Space Dragon Suplemento\
//   SW-SUP-Bestiario.md
//
// O cofre diz "não reproduza nada: abra o livro no nome nativo". No Foundry, o
// nome nativo do de-para é um LINK para a criatura no compêndio de Bestiário
// do módulo Space Dragon — o importador faz a troca. Por isso não há fichas de
// criatura neste módulo.

import { TEXTOS } from "./textos-do-cofre.mjs";
const b = TEXTOS["SW-SUP-Bestiario"];

export const bestiarioJournal = {
  title: "Bestiário",
  pages: [
    { title: "De-para: Criaturas do SD → Feras de Star Wars", content: b["(abertura)"] + b["De-para: criaturas do SD → feras de Star Wars"] },
    { title: "As Feras do Livro, na Mesa", content: b["As feras do livro, na mesa"] },
    { title: "Os Dragões da Galáxia", content: b["Os Dragões da Galáxia (Tabela dos Dragões)"] },
    { title: "Modelos de PNJ", content: b["Modelos de PNJ (as classes como inimigos)"] },
    { title: "Crédito", content: b["Crédito"] },
  ],
};
