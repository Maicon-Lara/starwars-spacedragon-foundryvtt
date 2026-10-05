/**
 * A Ordem de Ação do Space Dragon — §7.5 para personagens, §10.6 para naves.
 *
 * ── O QUE ELA É, E POR QUE NÃO É "INICIATIVA" ───────────────────────────────
 *
 * Numa iniciativa comum você rola uma vez e a ordem vale o combate inteiro. A
 * Ordem de Ação é outra coisa: o valor vem da AÇÃO que você escolheu, muda a
 * cada rodada, e **o menor age primeiro**. A arma que mais dói é a que age por
 * último.
 *
 * A sequência do livro (§7.2) é explícita: surpresa → **declaração de turno** →
 * **ordem de ação** → resolução → volta à declaração. Os três últimos passos
 * repetem TODA RODADA, e é isso que torna a regra cara de rodar à mão — e o
 * motivo de este módulo automatizá-la.
 *
 * ── O QUE A AUTOMAÇÃO RESOLVE ───────────────────────────────────────────────
 *
 * Três coisas, que são exatamente as que custam na mesa:
 *
 *   1. a CONTA de cada jogador (rolar o dado de dano certo, lembrar do 10−DES);
 *   2. a ORDEM no tracker, que no Foundry é decrescente e aqui precisa ser
 *      crescente;
 *   3. a DURAÇÃO da rodada, que no Space Dragon não é fixa — é o dobro do maior
 *      valor, em segundos, e governa todo efeito que dura "uma rodada".
 *
 * ── POR QUE NÃO TOCA EM `CONFIG.Combat.initiative` ──────────────────────────
 *
 * Porque a fórmula de iniciativa é do MUNDO, e um mundo pode ter Ekhoria e Star
 * Wars na mesma instalação. Em vez de trocar a fórmula, o painel ESCREVE o
 * valor no tracker — o mesmo caminho que a ficha de nave já usava. Quem não usa
 * o painel continua com a iniciativa do sistema.
 */

/* ── O QUE ESTE ARQUIVO AINDA FAZ ──────────────────────────────────────────
 *
 * As CONTAS da T7-2 — qual dado rolar, a Grandeza, o 10 − Destreza — saíram
 * daqui. Elas vivem em `MODOS`, no módulo `spacedragon` (module/ordem.js), que
 * é onde a regra do livro base pertence: duas cópias da mesma conta em dois
 * módulos da mesma cadeia é como a regra passa a divergir sem ninguém notar.
 *
 * O que sobrou é o que o base não faz, por decisão declarada dele: a ORDEM na
 * tela e a DURAÇÃO da rodada.
 */

/**
 * A duração da rodada, em segundos: **o dobro do maior valor**.
 *
 * É a parte da regra que a mesa mais esquece, e a que o Foundry não tem como
 * adivinhar: no Space Dragon a rodada NÃO dura 6 segundos fixos. Ela dura o que
 * durou — e é esse número que governa os efeitos medidos em rodadas.
 */
export function duracaoDaRodada(valores = []) {
  const nums = valores.map(Number).filter((n) => Number.isFinite(n));
  if (!nums.length) return 0;
  return 2 * Math.max(...nums);
}

/**
 * Ordena do MENOR para o maior, que é a ordem em que se age.
 *
 * Empate significa ação SIMULTÂNEA — o livro manda calcular os efeitos ao mesmo
 * tempo —, então o desempate aqui é só para a lista ter uma ordem estável na
 * tela, e não uma precedência de regra.
 */
export function ordenarCrescente(a, b) {
  const va = Number(a?.initiative ?? Number.POSITIVE_INFINITY);
  const vb = Number(b?.initiative ?? Number.POSITIVE_INFINITY);
  if (va !== vb) return va - vb;
  return String(a?.name ?? "").localeCompare(String(b?.name ?? ""));
}

/** Quem empatou com quem: os grupos que agem ao mesmo tempo. */
export function simultaneos(combatentes = []) {
  const porValor = new Map();
  for (const c of combatentes) {
    const v = c?.initiative;
    if (v == null) continue;
    if (!porValor.has(v)) porValor.set(v, []);
    porValor.get(v).push(c.name ?? "?");
  }
  return [...porValor.entries()]
    .filter(([, nomes]) => nomes.length > 1)
    .map(([valor, nomes]) => ({ valor, nomes }));
}
