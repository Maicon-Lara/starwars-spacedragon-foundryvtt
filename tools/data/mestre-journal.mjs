// Seção do Mestre: o tom, as eras, as facções, recompensas, as tabelas de
// preparação, relíquias tecnológicas e perigos do espaço.
//
// Fonte: o cofre, em Documents\Ekhoria\20 Space Dragon\Space Dragon Suplemento\
//   SW-SUP-Secao-do-Mestre.md
//
// As listas de preparação também são tabelas roláveis (tabelas.mjs). As
// Tabelas 11-3 e 11-4 das relíquias, que o cofre manda buscar no livro básico,
// ganham um link para a página delas no journal do módulo Space Dragon.

import { TEXTOS, LINKS_SD } from "./textos-do-cofre.mjs";
const m = TEXTOS["SW-SUP-Secao-do-Mestre"];

const ROLAVEIS =
  "<p class='nota-casa'><em>Estas listas também estão no compêndio <strong>Star Wars SD: Tabelas</strong>, " +
  "prontas para rolar.</em></p>";
const TABELAS_11 =
  `<p class='nota-casa'><em>As Tabelas 11-3 e 11-4 estão em ${LINKS_SD.reliquias}{Relíquias tecnológicas}, ` +
  "no journal do módulo Space Dragon.</em></p>";

export const mestreJournal = {
  title: "Seção do Mestre",
  pages: [
    { title: "O Tom da Mesa", content: m["(abertura)"] + m["O tom da mesa"] },
    { title: "As Facções", content: m["As facções"] },
    { title: "Recompensas", content: m["Recompensas: Créditos e achados"] },
    { title: "Tabelas de Preparação", content: ROLAVEIS + m["Tabelas de preparação"] },
    { title: "Relíquias Tecnológicas", content: m["Relíquias tecnológicas"] + TABELAS_11 },
    { title: "Perigos do Espaço", content: m["Perigos do espaço"] },
    { title: "Palavra Final", content: m["Palavra final — um compêndio em aberto"] },
  ],
};
