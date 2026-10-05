/**
 * A Ordem de Ação na mesa: a INVERSÃO da ordem e o resumo do Mestre.
 *
 * ── ONDE ESTÁ O PAINEL DE DECLARAÇÃO ────────────────────────────────────────
 *
 * No módulo `spacedragon`, em module/ordem-ficha.js, na aba de ataques. Ele
 * morava aqui e foi para lá porque a T7-2 é regra do LIVRO BASE: mantê-la em
 * dois módulos da mesma cadeia significava duas implementações da mesma conta,
 * e foi o que levou uma tarde de caça ao CSS do painel errado — o daqui estava
 * certo, o torto na tela era outro.
 *
 * O que sobra aqui é o que só este módulo faz: inverter a ordenação do
 * rastreador (o base decidiu não mexer nele) e contar a duração da rodada ao
 * Mestre.
 *
 * ── A INVERSÃO, QUE É A PARTE DELICADA ──────────────────────────────────────
 *
 * O Space Dragon manda o MENOR agir primeiro; o Combat Tracker do Foundry
 * ordena do maior para o menor. Sem inverter, a ordem na tela é exatamente o
 * contrário da regra — e é o tipo de erro que a mesa só percebe depois de três
 * sessões.
 *
 * A inversão troca `_sortCombatants` numa subclasse de Combat, e só entra
 * quando a opção está LIGADA. Com ela desligada, o módulo não registra classe
 * nenhuma e o Foundry segue o padrão: um mundo com Ekhoria e Star Wars na mesma
 * instalação não tem a ordem trocada por causa deste módulo.
 */

import { duracaoDaRodada, ordenarCrescente, simultaneos } from "./ordem-de-acao.js";

const ID = "starwars-sd";

export const ordemLigada = () => {
  try {
    return globalThis.game?.settings?.get?.(ID, "ordemDeAcao") === true;
  } catch {
    return false;
  }
};

/* ── A ORDEM CRESCENTE ──────────────────────────────────────────────────── */

/**
 * A marca que identifica a nossa classe na cadeia.
 *
 * Serve para `conferirCombate` saber se continuamos valendo depois que todos os
 * módulos carregaram — ver abaixo.
 */
const MARCA_COMBATE = "swSdOrdemDeAcao";

export function registrarCombate() {
  // ESTENDE o que já estiver lá, em vez de substituir. Se outro módulo
  // registrou a classe dele antes, ele continua funcionando por baixo; se
  // registrar depois e também estender, a cadeia se mantém inteira.
  //
  // O sistema `olddragon2e` não substitui Combat — só configura
  // `CONFIG.Combat.initiative` —, então o atrito possível é com outro módulo.
  const Base = CONFIG.Combat.documentClass;
  class CombateComOrdemDeAcao extends Base {
    _sortCombatants(a, b) {
      // só inverte com a opção ligada: sem ela, o mundo segue o padrão
      if (!ordemLigada()) return super._sortCombatants(a, b);
      return ordenarCrescente(a, b);
    }
  }
  CombateComOrdemDeAcao[MARCA_COMBATE] = true;
  CONFIG.Combat.documentClass = CombateComOrdemDeAcao;
}

/**
 * A nossa classe de Combat ainda está valendo?
 *
 * Um módulo que faça `CONFIG.Combat.documentClass = MinhaClasse` — substituindo
 * em vez de estender — APAGA a nossa, e a Ordem de Ação volta a ser ordenada do
 * maior para o menor. A regra fica silenciosamente invertida, e a lista continua
 * parecendo uma lista: é o tipo de coisa que a mesa leva sessões para notar.
 *
 * Por isso se confere no `ready`, quando todos os módulos já carregaram, e se
 * avisa em vez de deixar passar.
 */
export function conferirCombate() {
  let C = CONFIG.Combat.documentClass;
  while (C && C !== Function.prototype) {
    if (C[MARCA_COMBATE]) return true;
    C = Object.getPrototypeOf(C);
  }
  return false;
}

/** Avisa o Mestre se a ordenação foi perdida para outro módulo. */
export function avisarSeOrdemPerdida() {
  if (!ordemLigada() || conferirCombate()) return;
  const msg =
    "A Ordem de Ação está ligada, mas outro módulo substituiu a classe de " +
    "Combate e a ordenação crescente se perdeu — o Combat Tracker vai ordenar " +
    "do MAIOR para o menor, ao contrário da regra. Desligue o outro módulo, ou " +
    "desligue a Ordem de Ação para não jogar com a ordem invertida sem perceber.";
  console.warn(`starwars-sd | ${msg}`);
  ui.notifications?.error(msg, { permanent: true });
}

/* ── O RESUMO DO MESTRE ─────────────────────────────────────────────────── */

/**
 * Ao virar a rodada: a duração dela, e quem age simultaneamente.
 *
 * A duração é a parte que a mesa mais esquece — no Space Dragon a rodada não
 * dura 6 segundos fixos, dura o dobro do maior valor. É o número que governa
 * todo efeito medido em rodadas, e ninguém o calcula no meio do combate.
 */
export function ligarResumoDaRodada() {
  Hooks.on("updateCombat", async (combat, mudou) => {
    if (!ordemLigada() || !game.user?.isGM) return;
    if (mudou?.round == null) return;

    const cs = combat.combatants.contents.filter((c) => c.initiative != null);
    if (!cs.length) return;

    const dur = duracaoDaRodada(cs.map((c) => c.initiative));
    const juntos = simultaneos(cs);

    await ChatMessage.create({
      whisper: ChatMessage.getWhisperRecipients("GM"),
      content:
        `<div class="starwars-sd-doc"><h3>Rodada ${combat.round}</h3>` +
        `<p class="result">Duração: <strong>${dur} segundo(s)</strong> ` +
        `<em>(o dobro do maior valor)</em></p>` +
        `<p class="dica"><em>É esta a duração dos efeitos que valem "uma rodada".</em></p>` +
        (juntos.length
          ? `<p class="result">Agem <strong>ao mesmo tempo</strong>: ` +
            juntos.map((g) => `${g.nomes.join(" e ")} (${g.valor})`).join(" · ") +
            `</p><p class="dica"><em>Os efeitos simultâneos se calculam juntos.</em></p>`
          : "") +
        `<p class="dica"><em>Nova rodada: todos declaram de novo.</em></p></div>`,
    });
  });
}
