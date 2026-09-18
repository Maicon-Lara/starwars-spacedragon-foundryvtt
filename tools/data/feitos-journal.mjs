// Aparatos e Feitos Científicos vestidos de Star Wars.
//
// Fonte: o cofre, em Documents\Ekhoria\20 Space Dragon\Space Dragon Suplemento\
//   SW-SUP-Aparatos-e-Feitos.md
//
// Os aparatos também são itens (compêndio de Equipamentos, por NT). Os Feitos
// ficam só aqui: são procedimentos, não objetos, e os números estão no Cap. 8
// do livro básico — no Foundry, nos compêndios do módulo Space Dragon.

import { TEXTOS } from "./textos-do-cofre.mjs";
const ap = TEXTOS["SW-SUP-Aparatos-e-Feitos"];

export const feitosJournal = {
  title: "Aparatos e Feitos Científicos",
  pages: [
    { title: "O que Saber do Livro Básico", content: ap["(abertura)"] + ap["O que você precisa saber do livro básico"] },
    { title: "O Catálogo, Vestido de Star Wars", content: ap["O catálogo, vestido de Star Wars"] },
    { title: "Feitos Científicos, na Galáxia", content: ap["Feitos Científicos, na galáxia"] },
    { title: "Crédito", content: ap["Crédito"] },
  ],
};
