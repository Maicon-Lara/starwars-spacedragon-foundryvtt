// A Tabela 10-1: os oito tipos de nave.
//
// ── POR QUE NUM ARQUIVO SÓ DELA ────────────────────────────────────────────
//
// Porque é DADO, e dado tem de ser legível sem o Foundry em volta. Enquanto a
// tabela morava em nave-modelo.js, importá-la arrastava junto o DataModel —
// que começa com `const { fields } = foundry.data;` e estoura fora do VTT.
//
// Isso impedia testar qualquer coisa que dependesse da T10-1 sem fingir metade
// do Foundry. As câmaras (camaras.js) e os equipamentos (equipamentos-nave.js)
// já moram assim; a tabela dos tipos ficou para trás e veio junto agora.
//
// `nave-modelo.js` continua re-exportando, então nada que já importava de lá
// precisa mudar.

/**
 * Os oito tipos da Tabela 10-1, com a Velocidade (hexes) e a Esquiva (d6) do
 * Suplemento. `colosso` marca quem só faz Reta, Inclinada e Parar.
 */
export const TIPOS = {
  caca: { rotulo: "Caça", tamanho: "Pequena", tripulacao: "1", pv: "1d100", ba: 16, cp: 28, jp: 14, mov: "150 m", velocidade: 5, esquiva: 3, arcoLivre: false },
  escolta: { rotulo: "Escolta", tamanho: "Pequena", tripulacao: "1 a 4", pv: "2d100", ba: 12, cp: 28, jp: 14, mov: "120 m", velocidade: 4, esquiva: 3, arcoLivre: false },
  capsula: { rotulo: "Cápsula", tamanho: "Pequena", tripulacao: "1 a 4", pv: "1d100", ba: 10, cp: 28, jp: 16, mov: "120 m", velocidade: 4, esquiva: 3, arcoLivre: false },
  particular: { rotulo: "Espaçonave particular", tamanho: "Média", tripulacao: "1 a 10", pv: "3d100", ba: 12, cp: 26, jp: 16, mov: "100 m", velocidade: 3, esquiva: 2, arcoLivre: true },
  cargueiro: { rotulo: "Cargueiro", tamanho: "Gigantesca", tripulacao: "50+", pv: "1d1000", ba: 12, cp: 24, jp: 10, mov: "40 m", velocidade: 2, esquiva: 1, arcoLivre: true },
  transuniversal: { rotulo: "Transuniversal", tamanho: "Gigantesca", tripulacao: "100+", pv: "1d1000", ba: 10, cp: 24, jp: 10, mov: "40 m", velocidade: 2, esquiva: 1, arcoLivre: true },
  cruzador: { rotulo: "Cruzador", tamanho: "Colossal", tripulacao: "100+", pv: "2d1000", ba: 18, cp: 30, jp: 12, mov: "20 m", velocidade: 1, esquiva: 0, arcoLivre: true, colosso: true },
  naveMae: { rotulo: "Nave-mãe", tamanho: "Colossal", tripulacao: "1.000+", pv: "3d1000", ba: 12, cp: 20, jp: 12, mov: "20 m", velocidade: 1, esquiva: 0, arcoLivre: true, colosso: true },
};

