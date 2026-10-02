// Acertos e falhas críticas do Space Dragon, como tabelas roláveis.
//
// Fonte: o livro, **T7-4 e T7-5** (Cap. 7 — Combate e Danos), transcritas do
// PDF. A versão em DOCX perde duas linhas da T7-4, e a do cofre não tem a
// tabela: é mais um caso de tabela diagramada em caixas de texto.
//
// ── POR QUE TABELA ROLÁVEL, E NÃO AUTOMAÇÃO ────────────────────────────────
//
// Porque o crítico de personagem é rolado pela ficha do SISTEMA, e há módulos
// de automação de combate que já o tratam — o "Old Dragon 2: Qualidade de Vida"
// tem as regras de crítico do LB1 e do LB2, com uma opção de "perguntar
// sempre".
//
// Disputar aquele momento significaria dois módulos reagindo ao mesmo 20
// natural, com dois cartões de chat e duas regras diferentes. Uma RollTable não
// disputa nada: ela fica no compêndio, e quem rola é a mesa, quando quer. Para
// quem usa o módulo de automação, basta deixá-lo em "perguntar sempre" e rolar
// esta tabela no lugar.
//
// ── A REGRA, QUE É MAIOR QUE A TABELA ──────────────────────────────────────
//
// No 20 natural o dano JÁ É ×2 — "ou um número maior caso o atacante seja um
// cosmonauta" —, e a tabela é **opcional**, por cima disso. No 1 natural o erro
// é automático, independentemente de BA ou CP, e a tabela também é opcional.
//
// Por isso a descrição de cada tabela repete a regra: quem rola no meio da cena
// precisa saber que o ×2 não depende do resultado do dado.

export const CRITICOS_SD = [
  {
    nome: "Acerto crítico — T7-4",
    formula: "1d6",
    pasta: "Combate",
    descricao:
      "<p><strong>20 natural.</strong> O ataque acerta e o dano é <strong>×2</strong> — " +
      "ou mais, se o atacante for um Cosmonauta (Veterano). Esta tabela é " +
      "<em>opcional</em>, e entra <strong>por cima</strong> disso.</p>",
    resultados: [
      { range: [1, 1], text: "<strong>Área vital.</strong> Dano ×2." },
      { range: [2, 2], text: "<strong>Ferimento.</strong> Dano ×2, e a movimentação do alvo cai à metade." },
      { range: [3, 3], text: "<strong>Ferimento.</strong> Dano ×2, e −2 nos ataques desferidos pelo alvo." },
      { range: [4, 4], text: "<strong>Vestes avariadas.</strong> Dano ×2, e −2 no CP do alvo." },
      { range: [5, 5], text: "<strong>Ataque extra</strong> contra um inimigo ao alcance da arma." },
      { range: [6, 6], text: "<strong>Morte.</strong>" },
    ],
  },
  {
    nome: "Falha crítica — T7-5",
    formula: "1d6",
    pasta: "Combate",
    descricao:
      "<p><strong>1 natural.</strong> O ataque erra automaticamente, " +
      "<em>independentemente de BA ou CP</em>. Esta tabela é <em>opcional</em>, e diz " +
      "o que mais deu errado.</p>",
    resultados: [
      { range: [1, 1], text: "<strong>Derruba a arma.</strong>" },
      { range: [2, 2], text: "<strong>Desequilíbrio.</strong> −1 no CP." },
      { range: [3, 3], text: "<strong>Arma temporariamente danificada.</strong>" },
      { range: [4, 4], text: "<strong>Arma permanentemente danificada.</strong>" },
      { range: [5, 5], text: "<strong>Atinge um aliado</strong> próximo ao alvo." },
      { range: [6, 6], text: "<strong>Queda.</strong> −1 no CP, e uma ação de movimento para se levantar." },
    ],
  },
  {
    // A tabela de nave já existe em código (CRITICOS_LIVRO, em nave-modelo.js),
    // e a ficha a rola sozinha no 20 natural. Ela entra aqui também para quem
    // resolve o combate de nave sem a ficha — ou para o Mestre consultar.
    nome: "Acerto crítico de nave — T10-6",
    formula: "1d6",
    pasta: "Combate",
    descricao:
      "<p><strong>20 natural</strong> num ataque de nave. A ficha de Nave rola isto " +
      "sozinha; a tabela fica para quem resolve o combate à mão.</p>",
    resultados: [
      { range: [1, 1], text: "<strong>Área crítica.</strong> Dano ×2." },
      { range: [2, 2], text: "<strong>Avaria na propulsão.</strong> Dano ×2, e a movimentação cai à metade." },
      { range: [3, 3], text: "<strong>Avaria nas armas.</strong> Dano ×2, e −5 nos ataques da nave alvo." },
      { range: [4, 4], text: "<strong>Casco avariado.</strong> Dano ×2, e −5 no CP." },
      { range: [5, 5], text: "<strong>Ataque extra</strong> contra outra nave ao alcance." },
      { range: [6, 6], text: "<strong>Pane geral</strong> na espaçonave." },
    ],
  },
  {
    nome: "Falha crítica de nave — T10-6",
    formula: "1d6",
    pasta: "Combate",
    descricao: "<p><strong>1 natural</strong> num ataque de nave.</p>",
    resultados: [
      { range: [1, 1], text: "<strong>Armas travadas.</strong> Param de funcionar." },
      { range: [2, 2], text: "<strong>Perda de controle momentânea.</strong> −5 no CP até o próximo turno." },
      { range: [3, 3], text: "<strong>Arma temporariamente danificada.</strong>" },
      { range: [4, 4], text: "<strong>Arma permanentemente danificada.</strong>" },
      { range: [5, 5], text: "<strong>Fogo amigo.</strong> O tiro atinge uma nave aliada próxima ao alvo." },
      { range: [6, 6], text: "<strong>Perda de controle brusca.</strong> −10 no CP até o próximo turno, e um teste de pilotagem para retomar o controle." },
    ],
  },
];
