/**
 * Movimento da nave no mapa — Star Wars para Space Dragon.
 *
 * Traduz a manobra do dial em deslocamento e giro do token. Veio do Star
 * Dragon, com duas mudanças de regra:
 *
 *   · Todas as manobras do Suplemento ANDAM e depois VIRAM ("anda e vira 60°
 *     ao terminar"). No Star Dragon a curva virava antes de andar.
 *   · A colisão dá 1 Sobrecarga, e o dano dela (1 dado, ou o dobro na menor)
 *     fica para o Mestre, porque o Suplemento não diz de qual arma é o dado.
 *
 * DUAS COISAS QUE O STAR DRAGON MEDIU NA CENA DE VERDADE, e que continuam
 * valendo:
 *
 *   · `getTranslatedPoint` recebe a distância em UNIDADES DE CENA, não em
 *     pixels. Uma casa é `grid.distance`, não `grid.size`.
 *   · O ângulo dessa API tem 0 = LESTE e cresce no sentido HORÁRIO. A rotação
 *     do token tem 0 = NORTE. Daí a conversão de −90°.
 */

import { MANOBRAS, METROS_POR_HEX } from "./nave-modelo.js";

/** Rotação do token (0 = norte, horário) → ângulo da grade (0 = leste, horário). */
const anguloDaGrade = (rotacao) => (rotacao + 270) % 360;

/** Normaliza para 0–359. */
const norm = (g) => ((g % 360) + 360) % 360;

/**
 * A cena está na escala do combate de naves?
 *
 * Cenas de aventura em terra costumam ter 1,5 m por casa. Mover uma nave lá
 * jogaria a Velocidade 5 a dezenas de casas — melhor recusar e dizer o porquê.
 */
export function conferirEscala(cena) {
  const d = cena?.grid?.distance;
  if (!d) return { ok: false, motivo: "A cena não tem grade." };
  if (Math.abs(d - METROS_POR_HEX) > 0.01)
    return {
      ok: false,
      motivo:
        `Esta cena tem <strong>${d} ${cena.grid.units || ""}</strong> por casa, e o combate de naves ` +
        `usa <strong>1 hex = ${METROS_POR_HEX} m</strong>. Numa cena de ${d} m, a Velocidade 5 andaria ` +
        `${Math.round((5 * METROS_POR_HEX) / d)} casas.`,
    };
  return { ok: true };
}

/** Quantas casas a manobra anda, pela regra de `passos` do dial. */
export function casasDaManobra(tipo, velocidadeEscolhida, velocidadeDaNave) {
  const m = MANOBRAS[tipo];
  if (!m) return 0;
  if (m.passos === "0") return 0;
  if (m.passos === "re") return 1;
  if (m.passos === "metade") return Math.max(1, Math.floor(velocidadeDaNave / 2));
  return velocidadeEscolhida;
}

/**
 * Calcula onde a nave para e para onde fica virada, sem aplicar nada. Devolve
 * também o caminho casa a casa, que a colisão usa para recuar.
 */
export function calcularManobra(token, { tipo, velocidade, lado }, velocidadeDaNave) {
  const m = MANOBRAS[tipo];
  if (!m) return null;
  const grid = token.parent?.grid ?? canvas.grid;
  const passo = grid.distance;

  const sinal = lado === "esq" ? -1 : 1;
  const giro = m.giro * (m.lado ? sinal : 1);

  const rotInicial = token.rotation ?? 0;
  const rotDeSaida = norm(rotInicial + giro);
  const casas = casasDaManobra(tipo, velocidade, velocidadeDaNave);
  // Anda na direção em que ESTAVA, e só então vira. A Ré anda para trás sem
  // virar.
  const direcao = m.passos === "re" ? norm(rotInicial + 180) : rotInicial;

  const centro = grid.getCenterPoint({ x: token.x, y: token.y });
  const caminho = [];
  for (let i = 1; i <= casas; i++) {
    const p = grid.getTranslatedPoint(centro, anguloDaGrade(direcao), i * passo);
    caminho.push(grid.getTopLeftPoint(p));
  }

  return {
    caminho,
    destino: caminho.at(-1) ?? { x: token.x, y: token.y },
    rotacao: rotDeSaida,
    casas,
    giro,
  };
}

/** Alguma outra nave já ocupa esta casa? */
function ocupada(cena, ponto, meuId) {
  const grid = cena.grid;
  const meu = grid.getOffset(ponto);
  return cena.tokens.some((t) => {
    if (t.id === meuId) return false;
    const o = grid.getOffset({ x: t.x, y: t.y });
    return o.i === meu.i && o.j === meu.j;
  });
}

/**
 * Aplica a manobra ao token.
 *
 * Colisão, pela regra do Suplemento: se a manobra terminaria em cima de outra
 * nave, a nave para no hex imediatamente antes. A Sobrecarga e o dano são
 * cuidados por quem chamou.
 */
export async function moverNave(token, manobra, velocidadeDaNave) {
  const cena = token.parent;
  const escala = conferirEscala(cena);
  if (!escala.ok) return { erro: escala.motivo };

  const calc = calcularManobra(token, manobra, velocidadeDaNave);
  if (!calc) return { erro: "Manobra desconhecida." };

  let destino = calc.destino;
  let colidiu = false;
  if (calc.casas && ocupada(cena, destino, token.id)) {
    colidiu = true;
    destino = null;
    for (let i = calc.caminho.length - 2; i >= 0; i--) {
      if (!ocupada(cena, calc.caminho[i], token.id)) {
        destino = calc.caminho[i];
        break;
      }
    }
    if (!destino) destino = { x: token.x, y: token.y };
  }

  await token.update({ x: destino.x, y: destino.y, rotation: calc.rotacao });
  return { ...calc, destino, colidiu };
}
