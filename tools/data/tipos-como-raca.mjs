// Os oito tipos de nave (T10-1) como ITENS DE RAÇA do sistema.
//
// ── POR QUE RAÇA ────────────────────────────────────────────────────────────
//
// Porque a nave, numa ficha de personagem, é "o que ela é de nascença" — e é
// isso que a raça significa no Old Dragon 2. A maquinaria já existe e faz o que
// a T10-1 pede, sem uma linha de automação nossa:
//
//   `natural_armor`  →  o CP. ATENÇÃO: é a CA BASE, e não um bônus — o sistema
//                       RETORNA esse valor no lugar dos 10 padrão. Uma nave de
//                       CP 28 é `natural_armor: 28`, e não 18 "para somar".
//   `movement`       →  a velocidade, em metros.
//
// Arrastar a raça "Caça" para a ficha dá CP 28 e movimento 150 m, calculados
// pelo sistema, mostrados onde a ficha já mostra, e sem flag nenhuma.
//
// ── O QUE A RAÇA NÃO ALCANÇA ────────────────────────────────────────────────
//
// A BA e a JP. No Old Dragon 2 as duas vêm da CLASSE (`levels[n]`), e a raça só
// tem booleanos de "melhora esta JP". Então a habilidade de raça de cada tipo
// ESCREVE os dois números, para o Mestre os ter à vista — e a classe "Nave",
// quando existir, os aplicará.
//
// O PV também fica de fora: a T10-1 dá uma fórmula (1d100, 2d1000), e o modelo
// de PV do sistema é por nível. Quem rola é a mesa, e o número vai no campo de
// PV como em qualquer ficha.

import { TIPOS } from "../../starwars-sd-module/module/tipos-de-nave.js";

/** O movimento em metros, do texto da tabela ("150 m" → 150). */
export function metrosDe(mov) {
  const m = String(mov ?? "").match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

/**
 * A habilidade de raça de cada tipo: o que a tabela diz e a raça não carrega.
 *
 * Ela existe para o que o sistema não calcula — BA, JP, PV e esquiva — ficar
 * escrito na ficha, e não num manual que ninguém abre no meio do combate.
 */
export function habilidadeDoTipo(chave, t) {
  return {
    nome: `${t.rotulo} — perfil da T10-1`,
    desc:
      `<p><strong>${t.rotulo}</strong> · ${t.tamanho} · tripulação ${t.tripulacao}</p>` +
      `<ul>` +
      `<li><strong>CP ${t.cp}</strong> — já aplicado pela raça.</li>` +
      `<li><strong>Movimento ${t.mov}</strong> — já aplicado pela raça.</li>` +
      `<li><strong>BA +${t.ba}</strong> e <strong>JP ${t.jp}</strong> — a JP é número-alvo: menor é melhor.</li>` +
      `<li><strong>PV ${t.pv}</strong> — role e anote; a tabela dá o dado, não o número.</li>` +
      `<li><strong>Esquiva ${t.esquiva}d6</strong>${t.colosso ? " · <strong>colosso</strong>" : ""}</li>` +
      `</ul>`,
    // A CA BASE, e não um bônus: ver a nota do topo e a de raceAbilityDoc.
    natural_armor: t.cp,
  };
}

export const tiposComoRaca = Object.entries(TIPOS).map(([chave, t]) => ({
  chave,
  nome: t.rotulo,
  movement: metrosDe(t.mov),
  movement_notes: `${t.mov} · velocidade ${t.velocidade} no combate tático`,
  // Nave não tem tendência de alinhamento, e deixar "none" evita que a ficha
  // sugira uma por conta própria.
  alignment_tendency: "none",
  alignment_notes: "Não se aplica a uma nave.",
  flavor: `<p><em>${t.tamanho} · tripulação ${t.tripulacao}</em></p>`,
  descricao:
    `<p>Tipo de nave da <strong>Tabela 10-1</strong>. Arraste para a ficha e o ` +
    `<strong>CP ${t.cp}</strong> e o <strong>movimento ${t.mov}</strong> entram sozinhos.</p>` +
    `<p>BA <strong>+${t.ba}</strong>, JP <strong>${t.jp}</strong> e PV <strong>${t.pv}</strong> ` +
    `ficam na habilidade abaixo — a BA e a JP vêm da classe no Old Dragon 2, e o PV é uma ` +
    `fórmula que a mesa rola.</p>`,
  habilidade: habilidadeDoTipo(chave, t),
}));
