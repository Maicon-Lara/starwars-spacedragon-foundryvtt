/**
 * A Ordem de Ação na mesa: o painel do jogador e o resumo do Mestre.
 *
 * As fórmulas estão em ordem-de-acao.js, que é dado puro. Aqui está o que toca
 * o Foundry — o painel injetado na ficha, a escrita no Combat Tracker e a
 * inversão da ordem.
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

import {
  ACOES_DE_ORDEM, valorDaOrdem, dadoDaArma, duracaoDaRodada,
  ordenarCrescente, simultaneos,
} from "./ordem-de-acao.js";

const ID = "starwars-sd";
const MARCA = "starwars-sd-ordem";

/**
 * O modificador de Destreza, no campo em que o sistema o guarda.
 *
 * Se o sistema mudar o nome do campo, o painel não quebra: ele cai no valor
 * digitado pelo jogador, que é o que o campo de texto do painel aceita.
 */
const CAMPO_DESTREZA = "mod_destreza";

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

/* ── O PAINEL DO JOGADOR ────────────────────────────────────────────────── */

function montaPainel(ator) {
  const acoes = Object.entries(ACOES_DE_ORDEM)
    .map(([k, a]) => `<option value="${k}">${a.rotulo} — ${a.comoSeCalcula}</option>`)
    .join("");
  return `
<div class="${MARCA}">
  <div class="ordem-cabeca">
    <strong>Ordem de Ação</strong>
    <span class="dica" title="No Space Dragon o menor age primeiro, e o valor vem da ação escolhida">menor age primeiro</span>
  </div>
  <select class="ordem-acao">${acoes}</select>
  <div class="ordem-linha">
    <input type="text" class="ordem-dado" placeholder="1d8 · Grandeza · NT" title="O dado de dano da arma, a Grandeza do poder ou o NT do aparato">
    <button type="button" data-ordem="rolar">declarar</button>
  </div>
</div>`;
}

/**
 * Declara a ação e grava o valor no combate.
 *
 * O jogador escolhe a ação; a ficha faz a conta e põe o número no tracker. É o
 * passo 2 e o passo 3 da sequência do livro, num clique.
 */
async function declarar(ator, html) {
  const acao = html.querySelector(".ordem-acao")?.value ?? "outra";
  const campo = (html.querySelector(".ordem-dado")?.value ?? "").trim();
  const spec = ACOES_DE_ORDEM[acao];

  let valor;
  let roll = null;
  let como;

  if (spec.rola) {
    const formula = dadoDaArma(campo);
    if (!formula) {
      return ui.notifications.warn(
        "Para atacar, informe o dado de dano da arma — por exemplo 1d8.");
    }
    roll = await new Roll(formula).evaluate();
    valor = valorDaOrdem("atacar", { rolado: roll.total });
    como = `${formula} = ${roll.total}`;
  } else if (acao === "outra") {
    const mod = Number(ator.system?.[CAMPO_DESTREZA] ?? campo) || Number(campo) || 0;
    valor = valorDaOrdem("outra", { modDestreza: mod });
    como = `10 − ${mod} (Destreza)`;
  } else {
    const n = Number(campo) || 0;
    if (!n) {
      return ui.notifications.warn(
        acao === "poder" ? "Informe a Grandeza do poder." : "Informe o NT do aparato.");
    }
    valor = valorDaOrdem(acao, { grandeza: n, nt: n });
    como = acao === "poder" ? `Grandeza ${n}` : `NT ${n}`;
  }

  const tok = ator.getActiveTokens?.()[0]?.document;
  const c = tok && game.combat?.getCombatantByToken?.(tok.id);
  if (c) await game.combat.setInitiative(c.id, valor);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: ator }),
    content:
      `<div class="starwars-sd-doc"><h3>Ordem de Ação — ${spec.rotulo}</h3>` +
      `<p class="result"><strong>${valor}</strong> <em>(${como})</em></p>` +
      `<p class="dica"><em>${spec.nota}</em></p>` +
      (c ? "" : `<p class="dica"><em>Fora de combate: o valor não foi para o tracker.</em></p>`) +
      `</div>`,
    rolls: roll ? [roll] : [],
  });
}

export function ligarOrdemDeAcao() {
  const injeta = (app, elemento) => {
    try {
      if (!ordemLigada()) return;
      const html = elemento instanceof HTMLElement ? elemento : elemento?.[0];
      const ator = app?.actor ?? app?.document;
      if (!html || ator?.type !== "character") return;

      const lateral = html.querySelector(".sheet-container .sidebar")
        ?? html.querySelector(".sidebar")
        ?? html.querySelector(".sheet-body")
        ?? html;
      html.querySelectorAll(`.${MARCA}`).forEach((n) => n.remove());
      lateral.insertAdjacentHTML("beforeend", montaPainel(ator));

      lateral.querySelector(`.${MARCA}`)?.addEventListener("click", async (ev) => {
        if (!ev.target?.closest?.("[data-ordem='rolar']")) return;
        ev.preventDefault();
        await declarar(ator, lateral.querySelector(`.${MARCA}`));
      });
    } catch (e) {
      console.warn(`${ID} | painel de Ordem de Ação não pôde ser desenhado`, e);
    }
  };

  Hooks.on("renderActorSheet", injeta);
  Hooks.on("renderOD2CharacterSheet", injeta);
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
