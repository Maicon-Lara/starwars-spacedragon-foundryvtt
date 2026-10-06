// Uma CLASSE por tipo de nave, e os cômodos como habilidades dela.
//
// ── POR QUE UMA CLASSE POR TIPO ─────────────────────────────────────────────
//
// Porque no Old Dragon 2 a BA e a JP vêm da CLASSE, por nível — e na T10-1 elas
// variam por tipo: o Caça tem BA +16 e JP 14, o Cargueiro +12 e 10. Uma classe
// "Nave" genérica daria os mesmos números a todos, e o Mestre teria de corrigir
// os dois em cada ficha.
//
// Com uma classe por tipo, escolher "Caça" na ficha traz BA e JP certas pela
// maquinaria do sistema, como a raça já traz o CP e o movimento.
//
// ── OS CÔMODOS SÃO COMPARTILHADOS ───────────────────────────────────────────
//
// As doze câmaras da T10-2 são as MESMAS para qualquer nave — o que muda é
// quais estão instaladas, e isso é estado do ator, não da classe. Então as oito
// classes apontam para os mesmos doze UUIDs: um cômodo, uma descrição, um lugar
// para corrigir.
//
// ── POR QUE O NÍVEL NÃO MUDA NADA ───────────────────────────────────────────
//
// Nave não sobe de nível: ela é comprada, reformada e perdida. A tabela de
// níveis repete a mesma BA e a mesma JP de 1 a 20, para que a ficha funcione
// em qualquer nível que o ator tenha — inclusive o 1 que ele ganha ao nascer.
//
// ── O PV FICA DE FORA ───────────────────────────────────────────────────────
//
// O campo `hp` da classe é o DADO DE VIDA POR NÍVEL, e a T10-1 dá uma fórmula
// fechada (1d100, 2d1000). Pôr "100" ali faria a nave ganhar 1d100 por nível, o
// que é outra regra. A fórmula fica na descrição, e a mesa rola uma vez.

import { TIPOS } from "../../starwars-sd-module/module/tipos-de-nave.js";
import { CAMARAS } from "../../starwars-sd-module/module/camaras.js";

const NIVEIS = 20;

/** A tabela de níveis: a mesma BA e JP do 1º ao 20º. */
export function niveisDoTipo(t) {
  const linhas = {};
  for (let n = 1; n <= NIVEIS; n += 1) {
    linhas[n] = { ba: t.ba, jp: t.jp, ...(n > 1 ? { xp: 0 } : {}) };
  }
  return linhas;
}

/** Os doze cômodos, como habilidades de classe. */
export const comodosDaNave = Object.entries(CAMARAS).map(([chave, c], i) => ({
  chave,
  nome: c.rotulo,
  // nível 1: todo cômodo existe desde que a nave existe. O que muda é o ESTADO
  // (instalado, danificado, ausente), e estado é do ator.
  level: 1,
  desc:
    `<p>${c.efeito}</p>` +
    (c.obra
      ? `<p><strong>Obra:</strong> ${Number(c.obra).toLocaleString("pt-BR")} créditos, ${c.prazo}. ` +
        `<strong>Reparo em campo:</strong> ${Math.round(c.obra * 0.25).toLocaleString("pt-BR")} ` +
        `créditos, metade do prazo (T10-2).</p>`
      : ""),
  // a mesma flag das câmaras-item: é por ela que a ficha reconhece o cômodo
  flags: { "starwars-sd": { camaraDeNave: { chave } } },
}));

export const classesDeNave = Object.entries(TIPOS).map(([chave, t]) => ({
  chave,
  nome: t.rotulo,
  // o nome completo semeia o id, e distingue a CLASSE "Caça" da RAÇA "Caça"
  seedNome: `Nave — ${t.rotulo}`,
  flavor: `<p><em>${t.tamanho} · tripulação ${t.tripulacao}</em></p>`,
  descricao:
    `<p>Tipo de nave da <strong>Tabela 10-1</strong>. A classe traz a ` +
    `<strong>BA +${t.ba}</strong> e a <strong>JP ${t.jp}</strong>; a raça de mesmo nome traz ` +
    `o <strong>CP ${t.cp}</strong> e o <strong>movimento ${t.mov}</strong>.</p>` +
    `<p><strong>PV ${t.pv}</strong> — role uma vez e anote. A tabela dá o dado, e não o ` +
    `número; o campo de PV da classe é dado POR NÍVEL, que é outra regra.</p>` +
    `<p>As habilidades são os <strong>cômodos</strong> (T10-2). Todos aparecem; quais estão ` +
    `instalados é estado da nave, não da classe.</p>`,
  // nada de dado de vida por nível: ver a nota do topo
  dv: null,
  levels: niveisDoTipo(t),
  weapons: "As armas montadas na nave.",
  armors: "O casco e os escudos de força (T10-4).",
  magic_items: "—",
}));
