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

/* ── AS AÇÕES, E O QUE CADA UMA VALE ───────────────────────────────────────
 *
 * Personagens (§7.5):
 *   atacar ............ role o DADO DE DANO da arma
 *   aparato ou poder .. o NT do aparato, ou a Grandeza do poder (sem rolar)
 *   outra ............. 10 − modificador de Destreza
 *
 * Naves (§10.6): disparo = os dados de dano; equipamento = o bônus de ataque;
 * evasiva ou movimento duplo = o valor da jogada de proteção. Elas vivem em
 * ORDEM_LIVRO, em nave-modelo.js, e seguem o mesmo princípio.
 */
export const ACOES_DE_ORDEM = {
  atacar: {
    rotulo: "Atacar",
    comoSeCalcula: "role o dado de dano da arma",
    rola: true,
    nota: "A arma pesada age por ÚLTIMO: 1d12 tende a sair depois de 1d4.",
  },
  poder: {
    rotulo: "Poder da Força",
    comoSeCalcula: "a Grandeza do poder",
    rola: false,
    nota: "Um poder de 1ª Grandeza sai quase sempre primeiro; um de 10ª, por último.",
  },
  aparato: {
    rotulo: "Aparato tecnológico",
    comoSeCalcula: "o Nível Tecnológico do aparato",
    rola: false,
    nota: "Mesmo princípio do poder: quanto mais potente, mais demora a sair.",
  },
  outra: {
    rotulo: "Mover-se ou outra ação",
    comoSeCalcula: "10 − modificador de Destreza",
    rola: false,
    nota: "Quem é mais rápido age antes. Com Destreza alta o valor cai, e pode ficar negativo.",
  },
};

/**
 * O valor da Ordem de Ação.
 *
 * `rolado` é o resultado do dado de dano, quando a ação pede rolagem; os outros
 * casos usam `grandeza` (poder), `nt` (aparato) ou `modDestreza` (outra).
 */
export function valorDaOrdem(acao, { rolado = 0, grandeza = 0, nt = 0, modDestreza = 0 } = {}) {
  switch (acao) {
    case "atacar":
      return Number(rolado) || 0;
    case "poder":
      return Number(grandeza) || 0;
    case "aparato":
      return Number(nt) || 0;
    case "outra":
      // o livro é literal: "subtraindo o modificador de Destreza do valor
      // básico 10". Destreza alta pode levar o valor abaixo de zero, e isso é
      // o esperado — quem é muito rápido age antes de todo mundo.
      return 10 - (Number(modDestreza) || 0);
    default:
      return 0;
  }
}

/** A fórmula do dado de dano, para a ficha rolar — "1d8+2" → "1d8". */
export function dadoDaArma(dano) {
  const m = String(dano ?? "").match(/(\d+)\s*d\s*(\d+)/i);
  return m ? `${m[1]}d${m[2]}` : null;
}

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
