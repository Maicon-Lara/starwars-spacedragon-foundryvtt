/**
 * O que a nave CONSEGUE fazer, dado o estado das câmaras.
 *
 * ── A REGRA QUE GOVERNA ESTE ARQUIVO ────────────────────────────────────────
 *
 * Só «instalada» é operacional. A danificada não dá nada:
 *
 *   «Perder o prazo deixa a câmara danificada: ela PARA DE DAR o que dava até a
 *   obra de conserto.» — Regras Compiladas, §7
 *
 * Isso parece óbvio e não é: a danificada continua ocupando lugar no orçamento
 * (ela está lá, e o conserto custa 25% em vez da obra inteira), mas não
 * funciona. Ocupar e funcionar são coisas diferentes, e confundi-las daria uma
 * nave que atira com a ponte em chamas.
 *
 * ── A ESPIRAL, QUE É DE PROPÓSITO ───────────────────────────────────────────
 *
 *   «Ponte danificada tira o +2 do Computador Balístico E impede a nave de
 *   operar armas e escudos. É duro de propósito: é o que faz a Engenharia valer
 *   o lugar dela.»
 *
 * Então um crítico na Ponte não tira dois pontos de ataque — ele cala a nave
 * inteira. A ficha precisa dizer isso em voz alta, porque é a diferença entre a
 * mesa correr para a Engenharia e a mesa continuar rolando ataques que não
 * podem acontecer.
 */

import { CAMARAS } from "./camaras.js";
import { estadoDoComodo } from "./nave-pc-dados.js";

/** Uma câmara está operacional? Só «instalada» conta. */
export function operacional(nave, chave) {
  return estadoDoComodo(nave, chave) === "instalada";
}

/** As câmaras que declaram um campo, e que NÃO estão operacionais. */
function faltando(nave, campo) {
  return Object.entries(CAMARAS)
    .filter(([chave, c]) => c[campo] && !operacional(nave, chave))
    .map(([chave, c]) => ({ chave, rotulo: c.rotulo, estado: estadoDoComodo(nave, chave) }));
}

/* ── O QUE A NAVE PODE FAZER ───────────────────────────────────────────────── */

export function podePilotar(nave) {
  return faltando(nave, "exigeParaPilotar").length === 0;
}

export function podeAtacar(nave) {
  return faltando(nave, "exigeParaAtacar").length === 0;
}

export function podeUsarEscudos(nave) {
  return faltando(nave, "exigeParaEscudos").length === 0;
}

export function podeRepararEmCombate(nave) {
  return faltando(nave, "exigeParaReparar").length === 0;
}

export function podeEscapar(nave) {
  return Object.entries(CAMARAS).some(([chave, c]) => c.salvaA0PV && operacional(nave, chave));
}

/**
 * O +2 do Computador Balístico.
 *
 * Vem da Ponte, e o equipamento é da T10-4 — ter o computador numa nave de
 * ponte destruída não vale nada, porque «exige a Ponte operacional». Por isso o
 * bônus mora aqui, e não na lista de equipamentos.
 */
export function bonusDeAtaqueDasCamaras(nave) {
  let total = 0;
  for (const [chave, c] of Object.entries(CAMARAS)) {
    if (c.ataque && operacional(nave, chave)) total += c.ataque;
  }
  return total;
}

/**
 * O que a viagem recupera.
 *
 * «Aposentos: recuperação natural de PV e Alcance da Força em viagem no
 * hiperespaço. SEM ELES, A VIAGEM NÃO RECUPERA NADA.» A Ala Hospitalar
 * «DOBRA a recuperação natural de PV em viagem» — e dobrar nada continua nada,
 * então a ala sem os aposentos não cura ninguém.
 */
export function recuperacaoEmViagem(nave) {
  const temBase = Object.entries(CAMARAS)
    .some(([chave, c]) => c.recuperaEmViagem && operacional(nave, chave));
  if (!temBase) return { recupera: false, multiplicador: 0 };
  const dobra = Object.entries(CAMARAS)
    .some(([chave, c]) => c.dobraRecuperacao && operacional(nave, chave));
  return { recupera: true, multiplicador: dobra ? 2 : 1 };
}

/* ── O CONSERTO (T10-2) ────────────────────────────────────────────────────── */

/**
 * «Consertar uma câmara danificada custa 25% da obra e leva metade do prazo.»
 *
 * Vale só para a DANIFICADA. Uma câmara ausente se constrói do zero: obra
 * inteira, prazo inteiro. Cobrar 25% por uma câmara que não existe daria uma
 * nave completa por um quarto do preço, e é o erro que o desconto convida.
 */
export function custoDeConserto(chave, estado) {
  const c = CAMARAS[chave];
  if (!c?.obra) return null;
  if (estado === "danificada") {
    return { creditos: Math.round(c.obra * 0.25), prazo: `metade de ${c.prazo}`, tipo: "conserto" };
  }
  if (estado === "ausente") {
    return { creditos: c.obra, prazo: c.prazo, tipo: "obra" };
  }
  return null;
}

/* ── O QUE A FICHA DIZ EM VOZ ALTA ─────────────────────────────────────────── */

/**
 * Os avisos da nave, do mais grave para o menos.
 *
 * A ordem não é enfeite: numa lista truncada pela altura da ficha, o que fica
 * de fora tem de ser o menos urgente. Uma nave que não pode atirar e não
 * recupera PV em viagem precisa mostrar a primeira coisa.
 */
export function avisosDaNave(nave) {
  const avisos = [];
  const nomes = (lista) => lista.map((x) => `${x.rotulo} (${x.estado})`).join(", ");

  const semPilotar = faltando(nave, "exigeParaPilotar");
  if (semPilotar.length) {
    avisos.push({ grau: "grave", texto: `A nave não pode ser pilotada: ${nomes(semPilotar)}.` });
  }
  const semArmas = faltando(nave, "exigeParaAtacar");
  if (semArmas.length) {
    avisos.push({ grau: "grave", texto: `A nave não opera armas nem escudos: ${nomes(semArmas)}.` });
  }
  if (!podeEscapar(nave)) {
    avisos.push({
      grau: "aviso",
      texto: "Sem Saída de Emergência: a 0 PV a nave explode e ninguém escapa (§5).",
    });
  }
  const semReparo = faltando(nave, "exigeParaReparar");
  if (semReparo.length) {
    avisos.push({ grau: "aviso", texto: `Sem reparo em combate: ${nomes(semReparo)}.` });
  }
  const rec = recuperacaoEmViagem(nave);
  if (!rec.recupera) {
    avisos.push({ grau: "nota", texto: "A viagem não recupera PV nem Alcance da Força (sem Aposentos)." });
  }
  return avisos;
}
