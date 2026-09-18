// Espécies: Humano, Wookiee, Twi'lek, Rodiano, Droide, Zabrak, Mon Calamari,
// Trandoshano e Chiss, escritos sobre os três moldes do Space Dragon.
//
// Fonte: o cofre, em Documents\Ekhoria\20 Space Dragon\Space Dragon Suplemento\
//   SW-SUP-Especies.md
//
// ── O QUE VEM DO COFRE E O QUE É ESCRITO AQUI ───────────────────────────────
//
// O texto — descrição e habilidades — vem inteiro do cofre, pelo importador
// (tools/importar-cofre.mjs → textos-do-cofre.mjs). Aqui fica só o que o
// SISTEMA lê e que não se tira de prosa com segurança: movimento, infravisão,
// tendência, e a armadura e a arma naturais de quem as tem.
//
// Os modificadores fixos de atributo (+2/−2) não têm campo na ficha do OD2 e
// ficam na habilidade que os descreve.
//
// ── O MOLDE MUTANTE ─────────────────────────────────────────────────────────
//
// Não é repetido aqui. O Suplemento manda usar o molde do livro básico para
// "quase-humanos" exóticos, e no Foundry o livro básico é o módulo Space
// Dragon: o Mutante dele, com as mutações da T2-1 como escolha, está no
// compêndio de Espécies de lá.

import { ESPECIES } from "./textos-do-cofre.mjs";

// ATENÇÃO: `natural_armor` é a CA BASE, não um bônus — o sistema devolve esse
// valor no lugar dos 10 padrão. "+1 natural no CP" é 11. Ver a nota em lib.mjs.
const MECANICA = {
  Humano: { alignment_tendency: "none", alignment_notes: "Qualquer." },
  Wookiee: {
    alignment_tendency: "neutro", alignment_notes: "Neutro.",
    habilidades: {
      "Força Bruta": { natural_weapon: { damage: "1d6", damage_type: "bludgeoning", weapon_size: "medium" } },
      "Casca Peluda": { natural_armor: 11 },
    },
  },
  "Twi'lek": { alignment_tendency: "neutro", alignment_notes: "Neutro." },
  Rodiano: {
    infravision: 18, infravision_notes: "Térmica: só seres vivos e fontes de calor.",
    alignment_tendency: "caotico", alignment_notes: "Caótico.",
  },
  Droide: {
    infravision: 18, infravision_notes: "Sensores Integrados, permanente.",
    alignment_tendency: "none", alignment_notes: "Qualquer.",
  },
  Zabrak: { alignment_tendency: "none", alignment_notes: "Qualquer." },
  "Mon Calamari": {
    movement_notes: "Nada com deslocamento pleno.",
    movement_swim: 10,
    infravision: 18, infravision_notes: "Submerso ou na penumbra.",
    alignment_tendency: "ordeiro", alignment_notes: "Qualquer, tende a Leal.",
  },
  Trandoshano: {
    alignment_tendency: "caotico", alignment_notes: "Qualquer, tende a Caótico.",
    habilidades: {
      "Garras e Escamas": {
        natural_weapon: { damage: "1d4", damage_type: "piercing", weapon_size: "small" },
        natural_armor: 11,
      },
    },
  },
  Chiss: {
    infravision: 18, infravision_notes: "Infravermelha: calor e seres vivos no escuro.",
    alignment_tendency: "ordeiro", alignment_notes: "Qualquer, tende a Leal.",
  },
};

export const especies = ESPECIES.map((e) => {
  const m = MECANICA[e.nome];
  if (!m) throw new Error(`espécie do cofre sem entrada em MECANICA: ${e.nome}`);
  const { habilidades: extras = {}, ...campos } = m;
  for (const nome of Object.keys(extras)) {
    if (!e.habilidades.some((h) => h.nome === nome)) {
      throw new Error(`${e.nome}: MECANICA cita "${nome}", que não está no cofre`);
    }
  }
  return {
    nome: e.nome,
    flavor: e.flavor,
    descricao: e.descricao,
    // Movimento base do Space Dragon: 10 m (o OD2 usa 9).
    movement: 10,
    ...campos,
    habilidades: e.habilidades.map((h) => ({ ...h, ...(extras[h.nome] ?? {}) })),
  };
});

// Habilidades de espécie que não pertencem a uma espécie só.
export const especieAbilitiesAvulsas = [];
