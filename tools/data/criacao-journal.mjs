// Criação de personagem: como usar o suplemento com o livro básico, e o que
// é geral das espécies (os moldes, os idiomas, a nota de conversão).
//
// Fonte: o cofre, em Documents\Ekhoria\20 Space Dragon\Space Dragon Suplemento\
//   SW-SUP-Usando-o-Basico.md e SW-SUP-Especies.md
//
// O texto vem inteiro do cofre, pelo importador; aqui só se escolhe a ordem, o
// nome de cada página e a nota do Foundry.

import { TEXTOS } from "./textos-do-cofre.mjs";

const usando = TEXTOS["SW-SUP-Usando-o-Basico"];
const especies = TEXTOS["SW-SUP-Especies"];

// O Suplemento aponta para o livro básico. No Foundry, o livro básico é o
// módulo Space Dragon — dizer isso uma vez, no topo, poupa a procura.
const NO_FOUNDRY =
  "<p class='nota-casa'><em>No Foundry, o livro básico é o módulo <strong>Space Dragon</strong>: " +
  "os capítulos citados abaixo estão nos compêndios e journals dele, e a ficha " +
  "\"Ficha Space Dragon\" já calcula os atributos, os testes de porcentagem e o " +
  "alcance mental.</em></p>";

export const criacaoJournal = {
  title: "Criação de Personagem",
  pages: [
    { title: "Usando o Suplemento", content: usando["(abertura)"] + NO_FOUNDRY + usando["Onde está cada regra no livro básico"] },
    { title: "Os Nomes dos Atributos", content: usando["Os nomes dos atributos"] },
    { title: "O que o Suplemento Acrescenta", content: usando["O que este suplemento acrescenta"] },
    { title: "Convenções", content: usando["Convenções deste livro"] },
    { title: "Os Povos da Galáxia", content: especies["(abertura)"] },
    { title: "Idiomas da Galáxia", content: especies["Idiomas da galáxia"] },
    { title: "Nota de Conversão das Espécies", content: especies["Nota de conversão"] },
  ],
};
