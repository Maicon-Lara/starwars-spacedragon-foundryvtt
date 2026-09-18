// Equipamento, a parte que é REGRA e não item: créditos, regras de
// disparo, alcance das armas, construir o próprio sabre, sangrar o cristal.
//
// Fonte: o cofre, em Documents\Ekhoria\20 Space Dragon\Space Dragon Suplemento\
//   SW-SUP-Equipamentos.md e SW-SUP-Sabre-e-Cristais.md
//
// ⚠️ AINDA NÃO TRANSCRITO. O export existe vazio para o build já rodar e o
// compêndio já existir no Foundry; o conteúdo entra nota por nota.

import { TEXTOS as T } from "./textos-do-cofre.mjs";
const eq = T["SW-SUP-Equipamentos"];

// A nota inteira, para leitura: as tabelas de preço, as regras de disparo, o
// alcance, o CP das vestes e os serviços. As armas, vestes e aparelhos também
// estão como itens no compêndio de Equipamentos.
export const equipamentosJournal = {
  title: "Equipamentos & Créditos",
  pages: [
    { title: "Créditos", content: eq["(abertura)"] + eq["Créditos"] },
    { title: "Armas Corpo a Corpo", content: eq["Armas de combate corpo a corpo"] },
    { title: "Armas de Fogo, Arremesso e Explosivos", content: eq["Armas de fogo, arremesso e explosivos"] },
    { title: "Armaduras e Vestes", content: eq["Armaduras & Vestes"] },
    { title: "Aparelhos, Kits e Suprimentos", content: eq["Aparelhos, kits e suprimentos"] },
    { title: "Crédito", content: eq["Crédito"] },
  ],
};

// ── Sabre de Luz e Cristais Kyber ───────────────────────────────────────────
//
// Fonte: SW-SUP-Sabre-e-Cristais.md. O cristal, a construção, o Sangramento,
// o Sabre Sombrio e as Formas — as Formas também são habilidades avulsas no
// compêndio de Classes, e aqui ficam para leitura inteira.
import { TEXTOS } from "./textos-do-cofre.mjs";
const sabre = TEXTOS["SW-SUP-Sabre-e-Cristais"];

export const sabreJournal = {
  title: "Sabre de Luz e Cristais Kyber",
  pages: [
    { title: "O Cristal Kyber", content: sabre["(abertura)"] + sabre["O Cristal Kyber"] },
    { title: "Construir o Próprio Sabre", content: sabre["Construir o Próprio Sabre"] },
    { title: "Sangrar o Cristal", content: sabre["Sangrar o Cristal (o vermelho Sith)"] },
    { title: "O Sabre Sombrio", content: sabre["O Sabre Sombrio (Darksaber)"] },
    { title: "As Formas de Sabre", content: sabre["As Formas de Sabre (Senda Guardião)"] },
    { title: "Mudar de Guarda", content: sabre["Mudar de Guarda — trocar de Forma no meio do duelo"] },
  ],
};
