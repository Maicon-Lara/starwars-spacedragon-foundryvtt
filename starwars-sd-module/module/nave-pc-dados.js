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
import { POSTOS } from "./tripulacao.js";
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
/**
 * Os cinco postos, derivados dos de tripulacao.js — não reescritos.
 *
 * A primeira versão disto era uma lista minha: "pilotagem, armas, escudos,
 * engenharia, sensores". Inventada. O §7 define Leme, Artilharia, Engenharia,
 * Sensores e Comando — não há posto de Escudos (a energia é da Engenharia), e
 * faltava o Comando, que é o que mais muda a rodada.
 *
 * O formato de trio continua, porque a ficha já o consumia.
 */
export const POSTOS_DA_NAVE = POSTOS.map((p) => [
  p.chave,
  p.rotulo,
  `${p.oQueFaz} (${p.quem})`,
]);

/** Quantos postos estão ocupados — o número que diz se a nave anda. */
export function postosOcupados(nave) {
  const p = nave?.postos ?? {};
  return POSTOS_DA_NAVE.filter(([k]) => String(p[k] ?? "").trim()).length;
}

/* ── O ESTADO DAS CÂMARAS ──────────────────────────────────────────────────
 *
 * A classe entrega as doze câmaras a toda nave, porque a aba de classe do
 * sistema não aceita habilidades avulsas. A lista é sempre a mesma; o que a
 * ficha guarda é o ESTADO de cada uma.
 *
 * ── O MÍNIMO PARA VOAR, E O ORÇAMENTO DO TAMANHO ──────────────────────────
 *
 * Duas câmaras têm veto no texto das regras, e são o mínimo de fábrica:
 *
 *   Ponte de Comando — «sem ela operacional, a nave não pode ser pilotada nem
 *                       operar escudos ou armas»
 *   Sala de Máquinas — «motores e gerador… lugar obrigatório do acelerador
 *                       hiperespacial e dos tanques»
 *
 * Sem motor não há movimento; sem tanque não há combustível. As outras dez não
 * impedem voar — «nenhuma câmara multa por não existir; todas deixam de dar
 * algo» (§4) — então são escolha de quem monta a nave.
 *
 * Sobre as duas, o TAMANHO dá um orçamento de câmaras livres: Pequena 0, Média
 * 2, Gigantesca 4, Colossal 6. É o que faz um caça ser cabine e motor enquanto
 * uma nave-mãe nasce cidade, e o que deixa duas espaçonaves particulares do
 * mesmo tipo saírem diferentes — uma com Laboratório e Ala Hospitalar, outra
 * com Depósito e Arsenal.
 *
 * O orçamento é um AVISO, não uma trava: a ficha diz quando passou do número, e
 * o Mestre decide. Travar impediria a nave comprada usada, a nave de enredo e a
 * reforma paga em jogo, que são exatamente as naves interessantes.
 *
 * Consequência prática: a flag guarda só o que DIVERGE do padrão. Uma nave
 * recém-criada tem `camaras: {}`, com a Ponte e a Sala de Máquinas de pé e as
 * outras dez por instalar.
 */

export const ESTADOS = ["instalada", "danificada", "ausente"];

/** As que vêm de fábrica em qualquer nave, porque sem elas ela não voa. */
export const CAMARAS_BASE = ["ponte", "maquinas"];

/** Quantas câmaras livres o tamanho dá, além das duas da base. */
export const LIVRES_POR_TAMANHO = {
  Pequena: 0,
  Média: 2,
  Gigantesca: 4,
  Colossal: 6,
};

/** O estado de fábrica de uma câmara: de pé se for base, por instalar se não. */
export function padraoDoComodo(chave) {
  return CAMARAS_BASE.includes(chave) ? "instalada" : "ausente";
}

/** O estado de uma câmara nesta nave. Sem registro, o de fábrica. */
export function estadoDoComodo(nave, chave) {
  const e = nave?.camaras?.[chave];
  return ESTADOS.includes(e) ? e : padraoDoComodo(chave);
}

/**
 * O próximo estado, para o clique que gira entre eles.
 *
 * A ordem é a da vida da câmara: ausente → instalada → danificada → ausente.
 * Instala-se, estraga, e o que sobrou se arranca. Vale para as da base também:
 * a Ponte pode ser desinstalada, e a nave simplesmente deixa de voar — a regra
 * diz o que acontece, e não impede que aconteça.
 */
export function proximoEstado(atual) {
  const i = ESTADOS.indexOf(atual);
  if (i < 0) return "instalada";
  return ESTADOS[(i + 1) % ESTADOS.length];
}

/** Quantas câmaras estão de pé — o número que diz o que a nave consegue fazer. */
export function comodosInstalados(nave, chaves = null) {
  const lista = chaves ?? Object.keys(nave?.camaras ?? {});
  return lista.filter((c) => estadoDoComodo(nave, c) === "instalada").length;
}

/**
 * O orçamento de câmaras desta nave: quantas livres o tamanho dá, quantas estão
 * em pé além da base, e o que sobra.
 *
 * As da base NÃO contam contra o orçamento — elas não são escolha. Uma
 * danificada conta: ela ocupa o lugar, e o conserto custa 25% da obra em vez da
 * obra inteira, o que só faz sentido se a câmara ainda estiver lá.
 */
export function orcamentoDeCamaras(nave, chaves, tamanho) {
  const livres = LIVRES_POR_TAMANHO[tamanho] ?? 0;
  const opcionais = (chaves ?? []).filter((c) => !CAMARAS_BASE.includes(c));
  const usadas = opcionais.filter((c) => estadoDoComodo(nave, c) !== "ausente").length;
  return { livres, usadas, saldo: livres - usadas, excedeu: usadas > livres };
}
