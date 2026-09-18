// Os Poderes da Força: os 100 Poderes Mentais do Space Dragon relidos, da 1ª
// à 10ª Grandeza, nas três correntes Universal, Luz e Sombra.
//
// Fonte: o cofre, em Documents\Ekhoria\20 Space Dragon\Space Dragon Suplemento\
//   SW-SUP-Poderes-da-Forca.md; as regras do journal vêm de SW-SUP-Forca.md.
//
// ⚠️ A LISTA DE PODERES AINDA NÃO FOI TRANSCRITA — é a próxima nota. O journal
// "A Força" já está pronto.

import { TEXTOS } from "./textos-do-cofre.mjs";

// Cada lista: { folder, school, poderes: [] }.
export const listasDePoder = [];

// O Caminho (Luz, Sombra e Cinza), a Corrupção, a Tentação e o Eco da Senda —
// regra, não poder, e por isso no journal. O texto vem inteiro do cofre, pelo
// importador; aqui só se escolhe a ordem e o nome de cada página.
const forca = TEXTOS["SW-SUP-Forca"];

export const poderesJournal = {
  title: "A Força",
  pages: [
    { title: "O Caminho: Luz, Sombra e o meio", content: forca["O Caminho: Luz, Sombra e o meio"] },
    { title: "O Caminho Cinza", content: forca["O Caminho Cinza"] },
    { title: "Corrupção — Queda e Redenção", content: forca["Corrupção — Queda e Redenção"] },
    { title: "A Tentação", content: forca["A Tentação — a Corrupção como moeda"] },
    { title: "Eco da Senda", content: forca["Eco da Senda — o Alcance que volta"] },
  ],
};
