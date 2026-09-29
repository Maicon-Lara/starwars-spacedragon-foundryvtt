/**
 * Movimento em arco — a mecânica do X-Wing Miniatures Game, com as regras da casa.
 *
 * ── O QUE MUDA, E POR QUE ──────────────────────────────────────────────────
 *
 * O movimento antigo (`nave-movimento.js`) anda em linha reta pelos hexes e
 * gira tudo de uma vez no fim. É simples e legível, mas na mesa a nave "estala"
 * — ela nunca descreve a curva que o dial promete.
 *
 * Aqui a nave percorre um ARCO, girando ao longo dele, como no jogo de
 * miniaturas em que o Combate Tático foi desenhado. A régua curva da caixa é,
 * matematicamente, um arco de círculo: dado o giro da manobra e o comprimento
 * do percurso, o raio sai de `R = L / θ`.
 *
 * ── A CONSEQUÊNCIA, QUE NÃO É SÓ VISUAL ────────────────────────────────────
 *
 * Andar 3 e virar 60° NÃO termina onde termina um arco de 60° com 3 de
 * comprimento. A posição final muda, e por isso isto é uma opção: quem quiser a
 * regra antiga, "anda e depois vira", mantém o modo em hex.
 *
 * ── OS GIROS CONTINUAM SENDO OS DA CASA ────────────────────────────────────
 *
 * O X-Wing usa 45° e 90°, porque a base dele é quadrada. O Suplemento usa 60° e
 * 120°, porque nasceu no hex. Mantemos 60 e 120: a mecânica é de lá, a regra é
 * daqui.
 *
 * Crédito da mecânica: X-Wing Miniatures Game, da Fantasy Flight Games, e a
 * implementação de referência do FlyCasual (MIT), estudada e reescrita — nada
 * de código ou arte de lá entra aqui.
 */

import { MANOBRAS, METROS_POR_HEX } from "./dial.js";

/** Quantos pontos amostramos ao longo do arco. Mais que isso não se vê. */
const PASSOS_DO_ARCO = 24;

const norm = (g) => ((g % 360) + 360) % 360;
const rad = (g) => (g * Math.PI) / 180;

/** Metros → pixels, pela escala da cena. */
function pixelsPorMetro(cena) {
  const g = cena?.grid;
  if (!g?.distance || !g?.size) return 1;
  return g.size / g.distance;
}

/**
 * O caminho de uma manobra, como lista de { x, y, rotacao }.
 *
 * `x` e `y` são o CENTRO da nave em pixels; quem aplica converte para o canto
 * do token. O primeiro ponto é onde ela já está, e o último é onde ela para.
 *
 * Três formas, e a diferença entre elas é o que dá a sensação de cada manobra:
 *
 *   · sem giro (reta, ré, parar) — anda em linha;
 *   · giro ao longo (inclinada, curva) — descreve o arco, girando junto;
 *   · giro no fim (Koiogran) — anda reto e vira de uma vez no fim, porque é
 *     exatamente isso que a manobra é: uma reta com um tonel no fim.
 */
export function caminhoDaManobra({ centro, rotacao, tipo, lado, casas, cena }) {
  const m = MANOBRAS[tipo];
  if (!m) return null;

  const ppm = pixelsPorMetro(cena);
  const comprimento = casas * METROS_POR_HEX * ppm;
  const sinal = lado === "esq" ? -1 : 1;
  const giro = m.giro * (m.lado ? sinal : 1);

  // A Ré anda para trás sem virar a proa.
  const daProa = m.passos === "re" ? norm(rotacao + 180) : rotacao;
  const frente = (g) => ({ x: Math.sin(rad(g)), y: -Math.cos(rad(g)) });

  // Koiogran e afins: a reta é o percurso, e o giro só acontece no fim.
  const giroNoFim = !m.lado && giro !== 0;
  const giroAoLongo = m.lado ? giro : 0;

  const pontos = [];
  if (giroAoLongo === 0 || comprimento === 0) {
    const v = frente(daProa);
    for (let i = 0; i <= PASSOS_DO_ARCO; i++) {
      const t = i / PASSOS_DO_ARCO;
      pontos.push({
        x: centro.x + v.x * comprimento * t,
        y: centro.y + v.y * comprimento * t,
        // o giro no fim entra na última fração, para a virada ser visível
        rotacao: norm(rotacao + (giroNoFim ? giro * Math.max(0, (t - 0.8) / 0.2) : 0)),
      });
    }
    return { pontos, rotacaoFinal: norm(rotacao + (giroNoFim ? giro : 0)), giro, casas };
  }

  // O arco: R = L / θ. O centro da curva fica perpendicular à proa, do lado
  // para onde ela vira, a uma distância R.
  const theta = rad(Math.abs(giroAoLongo));
  const raio = comprimento / theta;
  const perpendicular = norm(rotacao + (giroAoLongo > 0 ? 90 : -90));
  const pv = frente(perpendicular);
  const cx = centro.x + pv.x * raio;
  const cy = centro.y + pv.y * raio;

  for (let i = 0; i <= PASSOS_DO_ARCO; i++) {
    const t = i / PASSOS_DO_ARCO;
    const a = rad(giroAoLongo * t);
    // gira o ponto inicial em torno do centro da curva
    const dx = centro.x - cx;
    const dy = centro.y - cy;
    pontos.push({
      x: cx + dx * Math.cos(a) - dy * Math.sin(a),
      y: cy + dx * Math.sin(a) + dy * Math.cos(a),
      rotacao: norm(rotacao + giroAoLongo * t),
    });
  }
  return { pontos, rotacaoFinal: norm(rotacao + giroAoLongo), giro: giroAoLongo, casas };
}

/**
 * Até onde a nave consegue ir sem encostar em outra.
 *
 * Como no X-Wing: ela percorre o template e PARA onde encostaria, em vez de
 * pular para a casa anterior. Devolve o índice do último ponto livre — 0
 * significa que nem saiu do lugar.
 */
export function ateOndeCabe(pontos, tokenId, cena, raioDaNave) {
  const outras = cena.tokens
    .filter((t) => t.id !== tokenId)
    .map((t) => ({
      x: t.x + (t.width * cena.grid.size) / 2,
      y: t.y + (t.height * cena.grid.size) / 2,
      r: (Math.max(t.width, t.height) * cena.grid.size) / 2,
    }));
  if (!outras.length) return pontos.length - 1;

  for (let i = 1; i < pontos.length; i++) {
    const p = pontos[i];
    const bateu = outras.some((o) => Math.hypot(p.x - o.x, p.y - o.y) < o.r + raioDaNave);
    if (bateu) return i - 1;
  }
  return pontos.length - 1;
}
