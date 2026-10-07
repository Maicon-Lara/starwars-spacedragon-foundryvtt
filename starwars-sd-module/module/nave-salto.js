/**
 * O salto hiperespacial (§2): três testes, e só o último cancela.
 *
 * ── A FORMA DA REGRA, QUE NÃO É A ÓBVIA ─────────────────────────────────────
 *
 *   | Etapa      | Se falhar                                              |
 *   | Distância  | sai do hiperespaço longe ou perto demais do destino    |
 *   | Direção    | sai na direção errada — outro sistema, outro setor     |
 *   | Execução   | o salto NÃO ACONTECE; a nave fica onde está           |
 *
 * «Só a terceira falha cancela; as duas primeiras saltam para o lugar errado.»
 *
 * Isto é o contrário do que uma sequência de testes costuma fazer. Falhar a
 * primeira não aborta nada: a nave salta, e salta errado — o que é pior, porque
 * ela some do mapa e aparece onde o Mestre quiser. Implementar "falhou, parou"
 * mataria a melhor coisa da regra, que é a viagem dar errado sem a cena acabar.
 *
 * «A sequência NÃO PODE SER ABORTADA no meio» — começou, vai até o fim.
 * «NÃO SE SALTA durante um combate», exceto pela fuga em relógio (§7).
 * Os três testes rolam na PONTE DE COMANDO, e gastam combustível (§3).
 */

import { CAMARAS } from "./camaras.js";
import { operacional } from "./nave-sistemas.js";

export const ETAPAS = [
  {
    chave: "distancia",
    rotulo: "Distância",
    falha: "A nave sai do hiperespaço longe ou perto demais do destino.",
    cancela: false,
  },
  {
    chave: "direcao",
    rotulo: "Direção",
    falha: "A nave sai na direção errada — outro sistema, outro setor.",
    cancela: false,
  },
  {
    chave: "execucao",
    rotulo: "Execução",
    falha: "O salto não acontece. A nave fica onde está.",
    cancela: true,
  },
];

/** O salto vazio: nenhuma etapa rolada. */
export function saltoVazio() {
  return { etapas: {}, emCurso: false };
}

/** O resultado gravado de uma etapa: "ok", "falha", ou nada se não rolou. */
export function resultadoDaEtapa(salto, chave) {
  const r = salto?.etapas?.[chave];
  return r === "ok" || r === "falha" ? r : null;
}

/** Qual etapa vem agora — ou null, se as três já rolaram. */
export function proximaEtapa(salto) {
  return ETAPAS.find((e) => resultadoDaEtapa(salto, e.chave) === null) ?? null;
}

/* ── SE PODE COMEÇAR ───────────────────────────────────────────────────────── */

/**
 * Por que a nave não pode saltar — ou null, se pode.
 *
 * Devolve o MOTIVO, e não um booleano. "Não pode saltar" sem dizer por quê faz
 * a mesa procurar o problema na ficha inteira; «falta o Acelerador
 * Hiperespacial» resolve em um segundo.
 *
 * A ordem dos testes é a ordem em que a mesa consegue agir: o combate passa, o
 * acelerador se compra, a Ponte se conserta. O primeiro motivo que aparece é o
 * mais próximo de ser resolvido.
 */
export function porQueNaoPodeSaltar(nave, { temAcelerador, emCombate, tamanho } = {}) {
  if (emCombate) {
    return "Não se salta durante um combate (§2). A fuga em relógio é a exceção (§7).";
  }
  if (!temAcelerador) {
    return "Falta o Acelerador Hiperespacial (T10-4), que só cabe em nave Média ou Gigantesca.";
  }
  // o acelerador «só cabe em nave Média e Gigantesca»: um caça não sai do
  // sistema, e é isso que faz o esquadrão precisar de nave-mãe
  if (tamanho && !["Média", "Gigantesca"].includes(tamanho)) {
    return `O Acelerador Hiperespacial não cabe em nave ${tamanho} — só Média ou Gigantesca (T10-4).`;
  }
  // os três testes rolam NA Ponte: sem ela não há onde rolar, e ela também veta
  // pilotar, que é o que cada teste é
  const ponte = Object.entries(CAMARAS).find(([, c]) => c.exigeParaPilotar);
  if (ponte && !operacional(nave, ponte[0])) {
    return `Os três testes do salto rolam na ${ponte[1].rotulo}, e ela não está operacional (§2).`;
  }
  return null;
}

/* ── O QUE ACONTECEU ───────────────────────────────────────────────────────── */

/**
 * O estado do salto depois do que já se rolou.
 *
 * `concluido` diz que as três etapas saíram; `chegou` diz se a nave saltou —
 * são coisas diferentes, e é aí que mora a regra. Falhar Distância e Direção
 * conclui o salto COM chegada: a nave está em algum lugar, só não no certo.
 */
export function estadoDoSalto(salto) {
  const rolou = ETAPAS.map((e) => ({ ...e, resultado: resultadoDaEtapa(salto, e.chave) }));
  const concluido = rolou.every((e) => e.resultado !== null);
  const falhas = rolou.filter((e) => e.resultado === "falha");
  const cancelou = falhas.some((e) => e.cancela);

  return {
    concluido,
    // só a Execução cancela: as outras duas falhas levam a nave para o lugar
    // errado, e lugar errado ainda é um lugar
    chegou: concluido && !cancelou,
    cancelou: concluido && cancelou,
    desvios: falhas.filter((e) => !e.cancela).map((e) => e.falha),
    proxima: proximaEtapa(salto),
  };
}

/**
 * O resumo em uma frase, que é o que vai para o chat.
 *
 * A mesa precisa saber onde a nave foi parar, e isso é a soma dos desvios — não
 * o resultado da última rolagem.
 */
export function resumoDoSalto(salto) {
  const e = estadoDoSalto(salto);
  if (!e.concluido) {
    return `Salto em curso — falta ${e.proxima?.rotulo ?? "?"}.`;
  }
  if (e.cancelou) return "O salto não aconteceu. A nave ficou onde estava.";
  if (!e.desvios.length) return "Salto concluído: a nave chegou ao destino.";
  return `A nave saltou, mas errado. ${e.desvios.join(" ")}`;
}
