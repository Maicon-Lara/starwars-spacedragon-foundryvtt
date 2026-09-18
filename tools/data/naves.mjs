// Naves & Veículos: os oito tipos de espaçonave, o de-para das naves da
// galáxia e as câmaras, mais o Combate Tático de Naves (opcional).
//
// Fonte: o cofre, em Documents\Ekhoria\20 Space Dragon\Space Dragon Suplemento\
//   SW-SUP-Naves.md e SW-SUP-Combate-Tatico-de-Naves.md
//
// As duas notas vão inteiras para o journal, pelo importador. O Combate
// Tático também virou a ficha de Nave (module/nave-*.js); a página "A Ficha
// de Nave" diz o que ela faz sozinha e o que fica com a mesa.

import { TEXTOS } from "./textos-do-cofre.mjs";

const naves = TEXTOS["SW-SUP-Naves"];
const tatico = TEXTOS["SW-SUP-Combate-Tatico-de-Naves"];

const FICHA =
  "<p>O módulo tem um tipo de ator próprio, <strong>Nave</strong>, com uma ficha que roda o Combate Tático. " +
  "Crie o ator, escolha o tipo e use <strong>aplicar tipo</strong>: BA, CP, JP e a fórmula de PV vêm da Tabela 10-1; " +
  "Velocidade e Esquiva, do Combate Tático. Depois role os PV.</p>" +
  "<h3>O que a ficha faz sozinha</h3><ul>" +
  "<li><strong>Planejar e mover.</strong> A manobra é escolhida em segredo no dial; <em>mover</em> a revela, anda com o token no hex e aplica a Sobrecarga pela cor. Com Sobrecarga (ou o Leme avariado), as vermelhas ficam bloqueadas; o colosso só vê Reta, Inclinada e Parar.</li>" +
  "<li><strong>Atirar.</strong> Marque o alvo (tecla T) e clique <em>atirar</em>: 1d20 + BA contra o CP do alvo, com a faixa e a Trava; no acerto, o alvo rola a Esquiva ANTES do dano, cada 5–6 cancela um dado, e só então se rola o que sobrou. O 20 natural soma um dado e rola a avaria; a Brecha dobra o tiro. Com permissão sobre o alvo, o dano e a avaria já entram na ficha dele.</li>" +
  "<li><strong>Iniciativa</strong> (1d20 + Destreza do piloto) grava no combate, se a nave estiver nele. <strong>Reparar</strong> remove uma avaria, recupera 1d10 PV ou tira 1 Sobrecarga. <strong>Fim da rodada</strong> limpa a manobra e as avarias de uma rodada.</li>" +
  "</ul><h3>O que fica com a mesa</h3><ul>" +
  "<li>O arco de tiro e a contagem de hexes até o alvo — a ficha pergunta a faixa.</li>" +
  "<li>O dano da colisão: o cartão avisa, mas o Suplemento não diz de qual arma é o dado.</li>" +
  "<li>O teste de Operar Máquinas antes do reparo e o de Pilotar nas situações-limite: são da ficha do personagem.</li>" +
  "</ul><p class='nota-casa'><em>A cena precisa estar em 1 hex = 20 m. Em outra escala, a ficha avisa e não move o token.</em></p>";

export const navesJournal = {
  title: "Naves & Veículos",
  pages: [
    { title: "Ter e Pilotar uma Nave", content: naves["(abertura)"] + naves["Ter e pilotar uma nave"] },
    { title: "Os Oito Tipos de Espaçonave", content: naves["Os oito tipos de espaçonave"] },
    { title: "De-para: as Naves da Galáxia", content: naves["De-para — as naves da galáxia"] },
    { title: "Câmaras da Nave", content: naves["Câmaras da nave"] },
    { title: "Combate Tático: Preparação", content: tatico["(abertura)"] + tatico["Preparação"] + tatico["Perfil tático da nave"] },
    { title: "Combate Tático: a Rodada", content: tatico["A rodada"] },
    { title: "Combate Tático: Atacar", content: tatico["Atacar"] },
    { title: "Combate Tático: os Dois Modos", content: tatico["Os dois modos"] },
    { title: "Combate Tático: Ajuste de Ritmo", content: tatico["Ajuste de ritmo (leia se o combate ficar estático)"] },
    { title: "A Ficha de Nave", content: FICHA },
    { title: "Crédito", content: naves["Crédito"] + tatico["Crédito"] },
  ],
};
