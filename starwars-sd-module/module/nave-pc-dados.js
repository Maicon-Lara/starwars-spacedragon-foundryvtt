// Os dados da nave quando ela é um ator do tipo `character`.
//
// ── POR QUE FLAGS, E NÃO OS CAMPOS DO SISTEMA ───────────────────────────────
//
// Porque no Old Dragon 2 a maioria dos números do personagem é DERIVADA: a CA
// sai de base + Destreza + armadura, a BA sai de classe e nível, as JP saem da
// classe. Gravar "CP 28" ali não funciona — o sistema recalcula no próximo
// render e o valor volta ao que a classe mandar.
//
// A nave não tem classe nem nível. Então os números dela vivem numa flag do
// módulo, e a ficha esconde os blocos nativos que não fazem sentido.
//
// ── A EXCEÇÃO: O PV ────────────────────────────────────────────────────────
//
// Esse fica no campo NATIVO (`system.pv`), e de propósito: é dele que sai a
// barra de vida do token. Uma nave que leva dano precisa que a barra desça na
// mesa, e nenhuma flag faz isso. É o único número que o sistema e a nave
// entendem do mesmo jeito.
//
// ── O QUE NÃO ESTÁ AQUI ────────────────────────────────────────────────────
//
// O Combate Tático: dial, manobra, hexes, Sobrecarga, arcos. Esta ficha é a do
// §10.6, por decisão do autor, e a ficha de nave própria continua existindo
// para quem usa o Tático.

/* Da tabela PURA, e não do modelo: importar do modelo arrastaria o DataModel
   junto, que precisa do global `foundry` e estoura fora do VTT — e aí nada que
   dependa da T10-1 poderia ser testado sem fingir metade do Foundry. */
import { TIPOS } from "./tipos-de-nave.js";

export const FLAG = "nave";

/** A nave vazia: o que uma ficha nova tem antes de escolher o tipo. */
export function naveVazia() {
  return {
    tipo: "",
    esquiva: 0,
    velocidade: 0,
    cp: 0,
    ba: 0,
    jp: 0,
    tripulacao: "",
    tamanho: "",
    combustivel: { atual: 0, maximo: 0, fonte: "" },
    postos: {},
    avarias: {},
    // O estado de cada cômodo. A CLASSE traz os doze sempre — a aba de classe
    // do sistema não aceita habilidades avulsas —, e é aqui que se diz quais a
    // nave tem de verdade. Sem chave, o cômodo é tratado como AUSENTE: uma nave
    // recém-criada não tem hospital nem laboratório por acidente.
    camaras: {},
    notas: "",
  };
}

/** Os dados da nave neste ator, com os campos que faltarem preenchidos. */
export function naveDe(ator, ID = "starwars-sd") {
  const guardado = ator?.getFlag?.(ID, FLAG) ?? ator?.flags?.[ID]?.[FLAG] ?? {};
  return { ...naveVazia(), ...guardado };
}

/**
 * O que a T10-1 manda, para o tipo escolhido.
 *
 * Devolve o que vai para a FLAG e o que vai para o campo nativo, separados —
 * quem grava é a ficha, e ela precisa saber onde cada coisa vai.
 *
 * O PV vem como FÓRMULA ("2d100"), e não rolado: a tabela dá o dado, e quem
 * rola é a mesa. Rolar aqui faria duas naves do mesmo tipo nascerem diferentes
 * sem ninguém ter pedido — e o Mestre que quer uma nave-padrão perde a escolha.
 */
export function aplicarTipo(chave) {
  const t = TIPOS[chave];
  if (!t) return null;
  return {
    flag: {
      tipo: chave,
      cp: t.cp,
      ba: t.ba,
      jp: t.jp,
      esquiva: t.esquiva,
      velocidade: t.velocidade,
      tamanho: t.tamanho,
      tripulacao: t.tripulacao,
    },
    // a fórmula, para a ficha oferecer a rolagem — não o resultado
    formulaDePV: t.pv,
    movimento: t.mov,
  };
}

/**
 * A nave está pronta para entrar em combate?
 *
 * Serve ao aviso da ficha: uma nave sem tipo tem CP 0 e BA 0, e numa mesa isso
 * aparece como "meus tiros nunca acertam" três rodadas depois. Melhor dizer na
 * ficha, antes.
 */
export function faltaConfigurar(nave) {
  const faltas = [];
  if (!nave?.tipo) faltas.push("o tipo da nave (T10-1)");
  if (!Number(nave?.cp)) faltas.push("o CP");
  if (!Number(nave?.ba)) faltas.push("a BA");
  return faltas;
}

/**
 * Os postos da tripulação, com quem está em cada um.
 *
 * Os cinco do suplemento, na ordem em que a rodada acontece: quem pilota decide
 * para onde, quem mira decide no quê, e os outros três sustentam os dois.
 */
export const POSTOS_DA_NAVE = [
  ["pilotagem", "Pilotagem", "Move a nave e faz as manobras evasivas."],
  ["armas", "Armas", "Dispara as armas montadas."],
  ["escudos", "Escudos", "Reparte a energia entre escudo e casco."],
  ["engenharia", "Engenharia", "Repara avarias e gerencia o reator."],
  ["sensores", "Sensores", "Trava alvos e lê o espaço em volta."],
];

/** Quantos postos estão ocupados — o número que diz se a nave anda. */
export function postosOcupados(nave) {
  const p = nave?.postos ?? {};
  return POSTOS_DA_NAVE.filter(([k]) => String(p[k] ?? "").trim()).length;
}

/* ── O ESTADO DOS CÔMODOS ─────────────────────────────────────────────────
 *
 * A classe entrega os doze cômodos a toda nave, porque a aba de classe do
 * sistema não aceita habilidades avulsas. Então a nave não se monta tirando
 * cômodos da lista — ela se monta DIZENDO quais existem.
 *
 * ── O PADRÃO É INSTALADA, E ISSO É REGRA DA CASA ────────────────────────
 *
 * «Toda nave nasce com as doze instaladas. Doze câmaras é o estado de uma nave
 * que voa; quem perdeu alguma marca na ficha.» — Naves — Regras Compiladas, §4.
 *
 * Eu tinha feito o contrário, com o argumento de que o Mestre não deveria
 * desmarcar nove cômodos para ficar com três. O argumento vale para um
 * construtor de naves; não vale aqui, porque nesta mesa a nave começa inteira e
 * o jogo é PERDER câmaras. A pendência 3 do documento registra que a decisão foi
 * do autor, entre o livro (o Mestre escolhe) e a Base de Operações (todas), e
 * que venceu a Base.
 *
 * Consequência prática: o registro na flag guarda só o que DIVERGE do padrão.
 * Uma nave recém-criada tem `camaras: {}` e as doze de pé.
 */

export const ESTADOS = ["instalada", "danificada", "ausente"];

/** O estado de um cômodo nesta nave. Sem registro, instalada — a nave voa. */
export function estadoDoComodo(nave, chave) {
  const e = nave?.camaras?.[chave];
  return ESTADOS.includes(e) ? e : "instalada";
}

/**
 * O próximo estado, para o clique que gira entre eles.
 *
 * A ordem segue o que acontece na mesa, e a mesa começa com a nave inteira:
 * instalada → danificada → ausente → instalada. O primeiro clique marca o
 * estrago, o segundo arranca o que sobrou, o terceiro reconstrói.
 */
export function proximoEstado(atual) {
  const i = ESTADOS.indexOf(atual);
  if (i < 0) return "danificada";
  return ESTADOS[(i + 1) % ESTADOS.length];
}

/** Quantos cômodos estão de pé — o número que diz o que a nave consegue fazer. */
export function comodosInstalados(nave) {
  return Object.values(nave?.camaras ?? {}).filter((e) => e === "instalada").length;
}
