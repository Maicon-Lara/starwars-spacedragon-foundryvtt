/**
 * As opções de mundo que o código lê, num lugar que não depende de ficha.
 *
 * ── POR QUE ESTE ARQUIVO NASCEU ─────────────────────────────────────────────
 *
 * `camadaLigada` morava em nave-ficha.js, que foi apagado junto com o Combate
 * Tático. Ela não tinha nada a ver com aquela ficha — lia uma opção de mundo —
 * e teria ido embora de carona.
 *
 * `regraDeNave`, que morava ao lado, NÃO veio: ela escolhia entre o modo
 * Tático e o modo Livro, e sem o Tático não há escolha a fazer. Trazer uma
 * função que só pode devolver um valor seria manter a pergunta depois de a
 * resposta virar única.
 */

const ID = "starwars-sd";

/**
 * Se a mesa ligou uma das camadas opcionais da tripulação.
 *
 * Fora do Foundry — nos testes — não há settings, e todas contam como
 * DESLIGADAS. Isso deixa o teste exercitar o código sem simular as opções, e
 * faz o padrão ser o conservador: uma camada que a mesa não ligou não aparece.
 */
export function camadaLigada(qual) {
  try {
    return globalThis.game?.settings?.get?.(ID, qual) === true;
  } catch {
    return false;
  }
}

/** As três camadas opcionais do §7, com o nome da opção de mundo de cada uma. */
export const CAMADAS = [
  { chave: "camadaEnergia", rotulo: "Energia do reator" },
  { chave: "camadaAvarias", rotulo: "Controle de avarias" },
  { chave: "camadaFuga", rotulo: "Fuga como relógio" },
];
