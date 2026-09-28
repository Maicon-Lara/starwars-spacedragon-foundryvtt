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
import { CAMARAS, REPARO_DE_CAMARA, TRANCA_DO_ARSENAL, ETAPAS_DO_SALTO }
  from "../../starwars-sd-module/module/camaras.js";

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


// ── A nave como base de operações ───────────────────────────────────────────
//
// Regra da casa sobre a T10-2. A tabela é GERADA das mesmas câmaras que a ficha
// lê (module/camaras.js): mudar o custo de uma câmara muda a ficha e esta
// página de uma vez, e elas não podem divergir.
const cr = (n) => n.toLocaleString("pt-BR");

const BASE_DE_OPERACOES =
  "<p>Uma nave deixa de ser transporte e vira <strong>base de operações</strong> quando o grupo " +
  "assume as câmaras dela: repara as danificadas, constrói as que faltam, reforma as que tem. " +
  "Cada uma custa créditos e tempo de obra, e devolve um efeito concreto.</p>" +
  "<table><thead><tr><th>Câmara</th><th style='text-align:right'>Obra (CR)</th><th>Prazo</th><th>O que ela dá</th></tr></thead><tbody>" +
  Object.values(CAMARAS).map((c) =>
    `<tr><td><strong>${c.rotulo}</strong></td><td style="text-align:right">${cr(c.obra)}</td>` +
    `<td>${c.prazo}</td><td>${c.efeito}</td></tr>`).join("") +
  "</tbody></table>" +

  "<h3>As três que a ficha lê</h3>" +
  "<p>As doze valem na mesa, mas três delas a <strong>ficha de Nave</strong> aplica sozinha:</p><ul>" +
  `<li><strong>Ponte de Comando</strong> — dá <strong>+${CAMARAS.ponte.ataque} nos ataques</strong> da nave (o Computador Balístico), ` +
  "e o modificador aparece na conta do cartão. Sem ela operacional, o botão de atirar recusa: a nave não opera armas. " +
  "É nela também que rola o <strong>salto hiperespacial</strong>.</li>" +
  "<li><strong>Sala de Máquinas</strong> — é dela que se repara em combate; sem ela, o botão <em>reparar</em> recusa.</li>" +
  "<li><strong>Saída de Emergência</strong> — é por ela que a tripulação escapa a 0 PV, durante a contagem regressiva.</li>" +
  "</ul>" +

  "<h3>O salto hiperespacial</h3>" +
  "<p>Três testes de <strong>Pilotar</strong>, nesta ordem, e a sequência não pode ser abortada no meio:</p><ol>" +
  ETAPAS_DO_SALTO.map((e) => `<li><strong>${e.rotulo}</strong> — falhando, ${e.erro}</li>`).join("") +
  "</ol><p>Os dois primeiros erram o destino, mas a nave salta; o terceiro cancela o salto.</p>" +

  "<h3>As obras, e o Técnico</h3><ul>" +
  "<li><strong>Desconto no material.</strong> O Técnico aplica a porcentagem de <strong>Aptidão Tecnológica</strong> " +
  "(pela Ciência dele) como desconto direto sobre o custo dos componentes.</li>" +
  "<li><strong>Mão de obra própria em viagem.</strong> Durante um salto, ele pode tocar a reforma com " +
  "<strong>Operar e Consertar Máquinas</strong>, dispensando estaleiro.</li>" +
  `<li><strong>Reparo em campo.</strong> Consertar uma câmara danificada custa <strong>${Math.round(REPARO_DE_CAMARA * 100)}%</strong> ` +
  "do valor dela e leva <strong>metade</strong> do prazo — a mesma régua do conserto de aparatos do capítulo 8.</li>" +
  `<li><strong>A tranca do Arsenal.</strong> Invadi-lo sem autorização exige Sabotagem com <strong>${TRANCA_DO_ARSENAL}%</strong>.</li>` +
  "</ul>";

export const navesJournal = {
  title: "Naves & Veículos",
  pages: [
    { title: "Ter e Pilotar uma Nave", content: naves["(abertura)"] + naves["Ter e pilotar uma nave"] },
    { title: "Os Oito Tipos de Espaçonave", content: naves["Os oito tipos de espaçonave"] },
    { title: "De-para: as Naves da Galáxia", content: naves["De-para — as naves da galáxia"] },
    { title: "Câmaras da Nave", content: naves["Câmaras da nave"] },
    { title: "A Nave como Base de Operações", content: BASE_DE_OPERACOES },
    { title: "Combate Tático: Preparação", content: tatico["(abertura)"] + tatico["Preparação"] + tatico["Perfil tático da nave"] },
    { title: "Combate Tático: a Rodada", content: tatico["A rodada"] },
    { title: "Combate Tático: Atacar", content: tatico["Atacar"] },
    { title: "Combate Tático: os Dois Modos", content: tatico["Os dois modos"] },
    { title: "Combate Tático: Ajuste de Ritmo", content: tatico["Ajuste de ritmo (leia se o combate ficar estático)"] },
    { title: "A Ficha de Nave", content: FICHA },
    { title: "Crédito", content: naves["Crédito"] + tatico["Crédito"] },
  ],
};
