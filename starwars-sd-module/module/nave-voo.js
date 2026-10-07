/**
 * O Painel de Voo da nave: o que a mesa olha a cada rodada.
 *
 * ── O QUE ESTE ARQUIVO É, E O QUE NÃO É ─────────────────────────────────────
 *
 * Aritmética das Regras Compiladas, sem Foundry. A ficha monta o HTML com o que
 * sai daqui; as rolagens são de quem chama. Isso existe para que a penalidade
 * por avaria e a T10-5 tenham teste — elas são contas pequenas que a mesa usa no
 * meio de um combate, e errar uma delas em silêncio é pior do que não tê-las.
 *
 * Os números NÃO ficam aqui. CP, BA e JP são derivados do sistema (a raça traz o
 * CP, a classe traz BA e JP); PV é `system.hp`. Este arquivo só calcula o que o
 * sistema não sabe: o que o DANO faz com a pilotagem, e o que o combustível
 * custa.
 */

/* ── A PENALIDADE POR AVARIA (§2) ──────────────────────────────────────────── */

/**
 * «5% de penalidade para cada 10% dos PV perdidos, até 50%.»
 *
 * O exemplo do livro é a prova: nave de 200 PV com 70 de dano perdeu 35% → −15%.
 * Trinta e cinco por cento são TRÊS blocos de dez, e não três e meio: a conta
 * desce para o bloco fechado. Arredondar para cima daria −20% e tornaria cada
 * arranhão mais caro do que o livro escreveu.
 *
 * O teto de 50% do livro é alcançado exatamente na nave a 0 PV (dez blocos × 5),
 * e o `Math.min` abaixo é redundante enquanto o PV estiver preso à faixa. Ele
 * fica como a regra escrita: se alguém soltar o limite para representar PV
 * negativo, o teto continua valendo sem precisar lembrar dele. O teste prova a
 * propriedade varrendo a faixa inteira, e não esta linha — uma linha que não
 * pode falhar não merece asserção própria.
 */
export function penalidadeDeAvaria(pv, pvMax) {
  const max = Number(pvMax) || 0;
  if (max <= 0) return 0;
  const atual = Math.max(0, Math.min(Number(pv) || 0, max));
  const perdidoEmPorcento = ((max - atual) / max) * 100;
  const blocos = Math.floor(perdidoEmPorcento / 10);
  return Math.min(50, blocos * 5);
}

/** A chance efetiva de pilotagem depois da avaria, nunca abaixo dos 5% do livro. */
export function pilotagemEfetiva(porcentoBase, pv, pvMax) {
  const base = Number(porcentoBase) || 0;
  const liquido = base - penalidadeDeAvaria(pv, pvMax);
  // «Mesmo a 0%, pilotar ainda pode ser tentado e acerta com 5% ou menos.»
  return Math.max(5, liquido);
}

/* ── A JP DA NAVE (T10-5) ──────────────────────────────────────────────────── */

/**
 * O modificador que a pilotagem dá à JP seguinte.
 *
 * «Antes de QUALQUER JP da nave, o piloto rola pilotagem.» A tabela lê o
 * resultado do d100 contra a chance, e a escala é larga de propósito: um piloto
 * bom não só evita o desastre, ele melhora a JP de todo mundo a bordo.
 *
 *   1 (crítico)        +8        100 (crítico)      −8
 *   sucesso < 20       +4        falha > 80         −4
 *   sucesso            +2        falha              −2
 *
 * A ordem dos testes importa: o 1 e o 100 são críticos ANTES de se comparar com
 * a chance. Um piloto de 95% que tira 100 falhou criticamente, e um de 10% que
 * tira 1 acertou em cheio.
 */
export const JP_MODIFICADORES = [
  { chave: "critico-bom", rotulo: "Sucesso crítico (1)", mod: 8 },
  { chave: "otimo", rotulo: "Sucesso abaixo de 20", mod: 4 },
  { chave: "bom", rotulo: "Sucesso", mod: 2 },
  { chave: "ruim", rotulo: "Falha", mod: -2 },
  { chave: "pessimo", rotulo: "Falha acima de 80", mod: -4 },
  { chave: "critico-ruim", rotulo: "Falha crítica (100)", mod: -8 },
];

export function modificadorDaJP(rolagem, chance) {
  const d = Number(rolagem);
  if (!Number.isFinite(d)) return null;
  // os críticos vêm antes da comparação: o 100 falha mesmo com 95% de chance
  if (d === 1) return { mod: 8, rotulo: "Sucesso crítico (1)" };
  if (d === 100) return { mod: -8, rotulo: "Falha crítica (100)" };

  const alvo = Number(chance) || 0;
  if (d <= alvo) {
    return d < 20
      ? { mod: 4, rotulo: "Sucesso abaixo de 20" }
      : { mod: 2, rotulo: "Sucesso" };
  }
  return d > 80
    ? { mod: -4, rotulo: "Falha acima de 80" }
    : { mod: -2, rotulo: "Falha" };
}

/* ── O COMBUSTÍVEL (§3) ────────────────────────────────────────────────────── */
//
// ── POR QUE AQUI NÃO HÁ TABELA ──────────────────────────────────────────────
//
// As fontes, os preços e o dado da autonomia moram em equipamentos-nave.js, que
// é quem lê a T10-3. Eu havia reescrito tudo aqui sem olhar para lá, e as duas
// versões já divergiam: a chave dos painéis solares era `solar` de um lado e
// `termo` do outro, e só a de lá tinha os preços por tamanho.
//
// Uma regra, um lugar. Duas tabelas da mesma tabela do livro é como a ficha
// passa a dizer uma coisa e o compêndio outra, meses depois, sem erro nenhum
// aparecer.

import { FONTES_DE_ENERGIA, formulaDeGasto } from "./equipamentos-nave.js";

export {
  FONTES_DE_ENERGIA, DADO_DE_AUTONOMIA, formulaDeGasto, custoDeAbastecimento,
} from "./equipamentos-nave.js";

/** O custo de cada ação que gasta combustível, em dados (§3). */
export const CUSTOS = [
  { chave: "viagem", rotulo: "Um dia de viagem", dados: 1, nota: "mais, se o trajeto for ruim" },
  { chave: "salto", rotulo: "Salto hiperespacial", dados: 2, nota: "1 a 3, pela interferência e a distância" },
  { chave: "combate", rotulo: "Manobra em combate", dados: 1, nota: "movimentação dupla, evasiva, escudo — a critério do Mestre" },
];

/* ── O QUE O PAINEL MOSTRA ─────────────────────────────────────────────────── */

/**
 * As linhas do painel, já resolvidas. A ficha só desenha.
 *
 * Devolve dados e não HTML porque é isto que tem teste: o HTML muda com o
 * layout, os números não.
 */
export function linhasDoVoo({ pv, pvMax, cp, ba, jp, movimento, combustivel, fonte, pilotagem }) {
  const penalidade = penalidadeDeAvaria(pv, pvMax);
  const f = FONTES_DE_ENERGIA[fonte] ?? null;
  const gasto = f ? formulaDeGasto(fonte, 1) : null;

  return {
    // o que o sistema já calcula, repetido aqui para a mesa ler num lugar só
    cp: Number(cp) || 0,
    ba: Number(ba) || 0,
    jp: Number(jp) || 0,
    movimento: movimento ?? "—",
    pv: { atual: Number(pv) || 0, max: Number(pvMax) || 0 },

    // o que só este arquivo sabe
    penalidade,
    pilotagem: pilotagem == null ? null : {
      base: Number(pilotagem) || 0,
      efetiva: pilotagemEfetiva(pilotagem, pv, pvMax),
    },
    combustivel: {
      porcento: Math.max(0, Math.min(100, Number(combustivel) || 0)),
      fonte: f ? { chave: fonte, ...f } : null,
      // o gasto de UM dado, que é a viagem de um dia; o resto se multiplica
      gastoPorDia: gasto,
    },
  };
}
