/**
 * O dial de manobras e a escala da cena.
 *
 * Fica fora de `nave-modelo.js` porque aquele arquivo abre com
 * `const { fields } = foundry.data` e só carrega dentro do Foundry. A geometria
 * do movimento precisa destas duas coisas, e precisa ser testável sem subir um
 * mundo inteiro.
 */

/** 1 hex = 20 m. A cena de combate de naves precisa estar nessa escala. */
export const METROS_POR_HEX = 20;

/**
 * O Dial de Manobras do Suplemento.
 *
 *   `cor`     verde tira 1 Sobrecarga; vermelha põe 1 e é proibida a quem já
 *             tem Sobrecarga; branca não mexe.
 *   `giro`    em graus, DEPOIS de andar — todas as manobras do Suplemento
 *             andam primeiro e viram ao terminar.
 *   `lado`    as que existem para a esquerda e para a direita.
 *   `passos`  como se conta a distância: "1aV" (de 1 à Velocidade), "metade"
 *             (metade da Velocidade, arredondada para baixo, mínimo 1), "0" ou
 *             "re" (1 hex para trás, mantendo a frente).
 */
export const MANOBRAS = {
  reta: { rotulo: "Reta", simbolo: "↑", cor: "verde", giro: 0, passos: "1aV" },
  inclinada: { rotulo: "Inclinada", simbolo: "↗", cor: "branca", giro: 60, lado: true, passos: "1aV" },
  curva: { rotulo: "Curva fechada", simbolo: "⟳", cor: "vermelha", giro: 120, lado: true, passos: "metade" },
  koiogran: { rotulo: "Koiogran", simbolo: "↑↓", cor: "vermelha", giro: 180, passos: "1aV" },
  parar: { rotulo: "Parar", simbolo: "⊘", cor: "branca", giro: 0, passos: "0" },
  re: { rotulo: "Ré", simbolo: "↓", cor: "vermelha", giro: 0, passos: "re" },
};

/** Os colossos só fazem estas. */
export const MANOBRAS_DE_COLOSSO = ["reta", "inclinada", "parar"];
