// As câmaras da nave (T10-2) como itens de compêndio.
//
// Mesmo molde dos equipamentos da T10-4 (ver equipamentos-de-nave.mjs): o item
// é a porta de entrada, e o estado continua no schema da nave. Arrastar uma
// câmara a INSTALA — ou seja, leva o estado de "ausente" para "instalada".
//
// ── POR QUE ISTO IMPORTA MAIS AQUI DO QUE NOS EQUIPAMENTOS ──────────────────
//
// Porque é o que torna a nave montável. Hoje a ficha nasce com as doze câmaras
// e você desliga as que não tem; arrastando, você parte do casco e constrói o
// que quiser — que é como a mesa pensa a nave, e como o livro a vende: cada
// câmara tem preço de obra e prazo.
//
// Esses dois números vão na descrição de propósito. Quem olha a câmara no
// compêndio está decidindo se compra, e o preço é a primeira coisa que pesa.

import { CAMARAS } from "../../starwars-sd-module/module/camaras.js";

const OD2I = "systems/olddragon2e/assets/icons";

const creditos = (n) => `${Number(n).toLocaleString("pt-BR")} créditos`;

export function descricaoDaCamara(c) {
  const partes = [c.efeito];
  if (c.obra) partes.push(`Obra: ${creditos(c.obra)}, ${c.prazo}.`);
  // O reparo em campo é 25% do valor e metade do prazo (T10-2) — o número que a
  // mesa procura quando a câmara já está danificada, e não quando a compra.
  if (c.obra) {
    partes.push(`Reparo em campo: ${creditos(Math.round(c.obra * 0.25))}, metade do prazo.`);
  }
  return partes.filter(Boolean).join(" ");
}

export const camarasDeNave = Object.entries(CAMARAS).map(([chave, c]) => ({
  chave,
  nome: c.rotulo,
  obra: c.obra,
  img: `${OD2I}/misc.svg`,
  desc: descricaoDaCamara(c),
}));
