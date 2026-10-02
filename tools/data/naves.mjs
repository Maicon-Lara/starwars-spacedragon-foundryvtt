// Naves & Veículos: os oito tipos de espaçonave, o de-para das naves da
// galáxia e as câmaras, mais AS DUAS REGRAS de combate de nave.
//
// Fonte: o cofre, em Documents\Ekhoria\20 Space Dragon\Space Dragon Suplemento\
//   SW-SUP-Naves.md, SW-SUP-Combate-Espacial.md e
//   SW-SUP-Combate-Tatico-de-Naves.md
//
// O COMBATE ESPACIAL (§10.6) é journal PRÓPRIO, e não uma página dentro de
// Naves como o Tático. Ele é a regra padrão da mesa — a que vale quando
// ninguém liga a outra —, e enterrá-lo na página 13 de outro capítulo era
// justamente o motivo de ele não estar escrito em lugar nenhum até agora.
//
// As duas notas vão inteiras para o journal, pelo importador. O Combate
// Tático também virou a ficha de Nave (module/nave-*.js); a página "A Ficha
// de Nave" diz o que ela faz sozinha e o que fica com a mesa.

import { TEXTOS } from "./textos-do-cofre.mjs";
import { CAMARAS, REPARO_DE_CAMARA, TRANCA_DO_ARSENAL, ETAPAS_DO_SALTO, AVARIA_VIRA_CAMARA }
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

  "<h3>Como isto conversa com o Combate Tático</h3>" +
  "<p>O crítico do dial causa uma <strong>avaria</strong>: dano de cena, que o Engenheiro " +
  "repara em combate. A câmara é outra coisa — é dano <strong>estrutural</strong>, e só a obra " +
  "conserta. Os dois se encontram no <strong>fim da rodada</strong>: a avaria que ninguém " +
  "reparou deixa de ser susto e vira câmara danificada.</p>" +
  "<table><thead><tr><th>Avaria do crítico</th><th>Vira</th></tr></thead><tbody>" +
  Object.entries(AVARIA_VIRA_CAMARA).map(([a, c]) =>
    `<tr><td>${a[0].toUpperCase() + a.slice(1)}</td><td><strong>${CAMARAS[c].rotulo}</strong> danificada</td></tr>`).join("") +
  "</tbody></table>" +
  "<p>O <strong>Leme</strong> e a <strong>Tripulação</strong> ficam de fora de propósito: elas " +
  "saem sozinhas no fim da rodada, porque são sustos e não estrago. O efeito prático é que o " +
  "combate não trava no meio — a nave continua lutando —, mas a conta chega depois, e o posto de " +
  "Engenharia ganha urgência: reparar naquela rodada evita a obra.</p>" +

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

const FICHA_LIVRO =
  "<p>O módulo registra <strong>duas fichas de nave</strong>, uma por regra, e o Foundry " +
  "escolhe a ficha por <strong>ator</strong>:</p><ul>" +
  "<li><strong>Nave — regras do livro (§10.6)</strong>: defesa no CP, manobra evasiva " +
  "trocando o CP por uma JP, ordem de ação pela T10-6 e as tabelas de crítico e falha em 1d6. " +
  "Sem dial, sem Sobrecarga e sem dados de esquiva — o capítulo 10 não os tem.</li>" +
  "<li><strong>Nave — Combate Tático</strong>: o dial de manobras, a manobra em segredo, " +
  "a Sobrecarga e os dados de defesa que cancelam dados de dano.</li>" +
  "</ul>" +
  "<p>A opção <em>Regras de combate de nave</em>, nas configurações do módulo, define qual é a " +
  "<strong>padrão</strong> do mundo — a que abre em toda nave nova. Para rodar <em>uma</em> nave " +
  "na outra regra, use <strong>Configurar Ficha</strong> no cabeçalho da janela dela: vale só para " +
  "aquele ator e não precisa recarregar.</p>" +
  "<h3>O que a ficha do livro faz sozinha</h3><ul>" +
  "<li><strong>Atirar.</strong> 1d20 + BA da nave + BA à distância de quem opera a arma, contra o " +
  "CP do alvo. O 20 e o 1 naturais rolam as tabelas da T10-6 — e quatro dos seis acertos críticos " +
  "dobram o dano.</li>" +
  "<li><strong>Manobra evasiva.</strong> Só em nave pequena, e a ficha guarda a rodada para " +
  "cobrar o intervalo de 5. O teste de pilotagem entra pela T10-5 e vira o modificador da JP.</li>" +
  "<li><strong>Ordem de ação.</strong> O botão pergunta qual ação a nave vai tomar, porque no " +
  "§10.6 o valor da iniciativa depende dela — e quem tem o menor age primeiro.</li>" +
  "</ul>";

export const navesJournal = {
  title: "Naves & Combate Espacial",
  pages: [
    // ── as naves ──
    { title: "Ter e Pilotar uma Nave", content: naves["(abertura)"] + naves["Ter e pilotar uma nave"] },
    { title: "Os Oito Tipos de Espaçonave", content: naves["Os oito tipos de espaçonave"] },
    { title: "De-para: as Naves da Galáxia", content: naves["De-para — as naves da galáxia"] },
    { title: "Câmaras da Nave", content: naves["Câmaras da nave"] },
    { title: "A Nave como Base de Operações", content: BASE_DE_OPERACOES },
    // ── o combate do §10.6 ──
    { title: "Combate Espacial: o Princípio", content: naves["O princípio"] },
    { title: "Combate Espacial: as Ações da Nave", content: naves["As ações da nave"] },
    { title: "Combate Espacial: Disparo de Armas", content: naves["Disparo de armas"] },
    { title: "Combate Espacial: Manobras Evasivas", content: naves["Manobras evasivas"] },
    { title: "Combate Espacial: Críticos e Falhas", content: naves["Acertos e falhas críticas"] },
    { title: "Combate Espacial: Chegar a Zero", content: naves["Chegar a zero"] },
    { title: "Combate Espacial: Nave Avariada", content: naves["Pilotar uma nave avariada"] },
    { title: "O Salto para o Hiperespaço", content: naves["O salto para o hiperespaço"] },
    // ── a tripulação (da casa) ──
    { title: "A Tripulação: os Postos", content: naves["Os postos"] },
    { title: "A Tripulação: Energia", content: naves["Energia"] },
    { title: "A Tripulação: Controle de Avarias", content: naves["Controle de avarias"] },
    { title: "A Tripulação: Fuga e Perseguição", content: naves["Fuga e perseguição"] },
    // ── as duas regras, e as duas fichas ──
    { title: "Qual Modo Usar", content: naves["Qual modo usar"] },
    { title: "As Duas Fichas de Nave", content: FICHA_LIVRO },
    // ── o módulo tático, que não é do livro ──
    { title: "Combate Tático: Preparação", content: tatico["(abertura)"] + tatico["Preparação"] + tatico["Perfil tático da nave"] },
    { title: "Combate Tático: a Rodada", content: tatico["A rodada"] },
    { title: "Combate Tático: Atacar", content: tatico["Atacar"] },
    { title: "Combate Tático: o Modo dele", content: tatico["O modo deste módulo"] },
    { title: "Combate Tático: Ajuste de Ritmo", content: tatico["Ajuste de ritmo (leia se o combate ficar estático)"] },
    { title: "A Ficha Tática de Nave", content: FICHA },
    { title: "Crédito", content: naves["Crédito"] + tatico["Crédito"] },
  ],
};
