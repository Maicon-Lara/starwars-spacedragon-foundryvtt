/**
 * Converte uma nave do tipo de ator antigo (`starwars-sd.nave`) num personagem
 * com a Ficha de Nave.
 *
 * ── POR QUE ISTO EXISTE, E POR QUE AGORA ────────────────────────────────────
 *
 * O tipo de ator `nave` vai sair do manifesto. Um ator cujo tipo não existe
 * mais NÃO CARREGA: o Foundry o recusa na validação, ele some da barra lateral,
 * e não há interface para recuperá-lo. É o que acontece hoje com duas naves do
 * mundo criadas pelo módulo `stardragon`, que enchem o log a cada recarga.
 *
 * Então a conversão roda ANTES de o tipo sair, e é por isso que ela é uma fatia
 * própria em vez de um detalhe do apagamento.
 *
 * ── O QUE SE PERDE, DITO EM VOZ ALTA ────────────────────────────────────────
 *
 * O Combate Tático inteiro: a manobra planejada, a posição no mapa, o arco de
 * tiro e a sobrecarga do dial. Isso é decisão da mesa, não acidente — o jogo de
 * nave passa a ser o §10.6. A função devolve o que descartou, e quem chama
 * mostra antes de confirmar: uma conversão que apaga em silêncio é pior que
 * nenhuma.
 *
 * ── O QUE NÃO SE CONVERTE SOZINHO ───────────────────────────────────────────
 *
 * A raça e a classe de nave. Elas entram pelo DROP, que dispara o
 * `syncRaceAbilities` do sistema — e sem esse passo o CP não se aplica. Fazer
 * isso aqui significaria reimplementar o sync; o guia de montagem já ensina o
 * arrasto, e o tipo vem anotado na flag para o Mestre saber qual arrastar.
 */

import { naveVazia, FLAG } from "./nave-pc-dados.js";

const ID = "starwars-sd";

/** Os campos do schema antigo que viram flag da ficha nova, um a um. */
export function converterDados(system = {}) {
  const nova = naveVazia();
  const descartado = [];

  // o que tem equivalente direto
  for (const campo of ["tipo", "ba", "cp", "jp", "esquiva", "combustivel", "fonte"]) {
    if (system[campo] != null && system[campo] !== "") nova[campo] = system[campo];
  }

  // as câmaras: o schema antigo guardava o estado de cada uma, com os mesmos
  // três valores. É a conversão mais valiosa, porque é a que a mesa construiu
  // pagando obra em jogo.
  if (system.camaras && typeof system.camaras === "object") {
    nova.camaras = {};
    for (const [chave, valor] of Object.entries(system.camaras)) {
      const estado = typeof valor === "string" ? valor : valor?.estado;
      if (["instalada", "danificada", "ausente"].includes(estado)) {
        nova.camaras[chave] = estado;
      }
    }
  }

  // os postos: quem estava em cada um. O schema antigo usava as MESMAS cinco
  // chaves do §7 (leme, artilharia, engenharia, sensores, comando).
  if (system.postos && typeof system.postos === "object") {
    nova.postos = {};
    for (const [chave, quem] of Object.entries(system.postos)) {
      if (typeof quem === "string" && quem.trim()) nova.postos[chave] = quem.trim();
    }
  }

  // ── O QUE FICA PARA TRÁS ──
  //
  // Nomeado um a um, e não como "dados do tático": a mesa precisa saber que a
  // manobra planejada daquela nave some, e não que "algumas coisas" somem.
  const perdas = {
    manobra: "a manobra planejada e o dial",
    sobrecarga: "a sobrecarga acumulada",
    evasiva: "a manobra evasiva em curso",
    trava: "o alvo travado pelos Sensores",
    fuga: "o relógio de fuga em andamento",
    energia: "a energia do reator da rodada",
  };
  for (const [campo, oQueE] of Object.entries(perdas)) {
    const v = system[campo];
    const tem = typeof v === "object" ? Object.values(v ?? {}).some(Boolean) : Boolean(v);
    if (tem) descartado.push(oQueE);
  }
  if (Array.isArray(system.armas) && system.armas.length) {
    descartado.push(`${system.armas.length} arma(s) montada(s) — reinstale pelo compêndio de Equipamentos`);
  }

  return { nave: nova, descartado };
}

/** Os dados do novo ator, prontos para `Actor.create`. */
export function dadosDoPersonagem(velho) {
  const { nave, descartado } = converterDados(velho?.system ?? {});
  const pv = velho?.system?.pv ?? {};
  return {
    dados: {
      name: velho?.name ?? "Nave",
      type: "character",
      img: velho?.img,
      // os PV vêm do schema antigo, onde já estavam rolados: rolar de novo
      // daria outra nave, e esta já voou
      system: { hp: { value: Number(pv.value) || 0, max: Number(pv.max) || 0 } },
      flags: { [ID]: { [FLAG]: nave } },
      prototypeToken: velho?.prototypeToken,
      // a Ficha de Nave, e não a padrão: converter e abrir a ficha errada faria
      // a mesa achar que a conversão não funcionou
      "flags.core.sheetClass": `${ID}.NaveSheet`,
    },
    descartado,
  };
}

/* ── A INTERFACE ──────────────────────────────────────────────────────────── */

export const TIPO_ANTIGO = "starwars-sd.nave";

/**
 * As naves do mundo que ainda estão no tipo antigo.
 *
 * Só as que CARREGARAM. Um ator cujo tipo já não existe nem entra em
 * `game.actors` — é por isso que esta conversão tem de rodar enquanto o tipo
 * ainda está no manifesto, e é o que torna a ordem das fatias importante.
 */
export function navesAntigas() {
  const todos = globalThis.game?.actors ?? [];
  return [...todos].filter((a) => a?.type === TIPO_ANTIGO);
}

/**
 * Converte uma nave e devolve o ator novo. NÃO apaga a velha.
 *
 * Apagar aqui transformaria um erro de conversão em perda definitiva. A velha
 * fica, o Mestre compara as duas lado a lado, e apaga quando quiser — é a mesma
 * régua que vale para qualquer coisa irreversível nesta base.
 */
export async function converterNave(velha) {
  const { dados, descartado } = dadosDoPersonagem(velha);
  const novo = await globalThis.Actor?.create?.(dados);
  return { novo, descartado };
}

/**
 * Converte todas, uma a uma, e devolve o relatório.
 *
 * Em série e não em paralelo: `Actor.create` em lote dispara os hooks de todos
 * os módulos ao mesmo tempo, e um erro no meio deixaria metade convertida sem
 * dizer qual metade.
 */
export async function converterTodas() {
  const relatorio = [];
  for (const velha of navesAntigas()) {
    try {
      const { novo, descartado } = await converterNave(velha);
      relatorio.push({ nome: velha.name, ok: true, id: novo?.id, descartado });
    } catch (e) {
      relatorio.push({ nome: velha.name, ok: false, erro: e?.message ?? String(e) });
    }
  }
  return relatorio;
}
