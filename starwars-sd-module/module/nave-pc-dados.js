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
