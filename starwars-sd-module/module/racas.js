/**
 * As mecânicas das espécies da galáxia, entregues ao motor do Space Dragon.
 *
 * A chave é o nome da habilidade de raça, sem acento e em minúsculas. Armadura
 * e armas naturais (Casca Peluda, Garras e Escamas, Força Bruta) não estão aqui:
 * o sistema já as lê dos campos da própria habilidade.
 */

const abaixoDaMetade = (ator) => Number(ator.system?.hp?.value) < Number(ator.system?.hp?.max) / 2;

export const REGRAS_DE_RACA = {
  // Wookiee
  "furia selvagem": { dano: (ator, arma) => (arma.system?.type === "melee" && abaixoDaMetade(ator) ? 2 : 0) },
  restricao: { dano: (_ator, arma) => (arma.system?.two_handed ? 0 : -1) },
  // Chiss
  "mente tatica": { ordem: -1 },
  // Droide
  "corpo robotico": { venceJP: { jpc: (ator) => Number(ator.system?.hp?.value) >= 0 } },
  "cerebro positronico": { rm: 5 },
  "vulnerabilidade a ion": { recebe: ({ chave, critico }) => (/(^|\s)(ions?|pulso)(\s|$)/.test(chave) ? { mult: 2, desativa: critico } : null) },
  // Trandoshano
  regeneracao: { regenera: 1 },
  // Zabrak
  "resistencia a dor": { aoCair: { jp: "jpc", sucesso: "age, cambaleante, até o fim da próxima rodada." } },
  "dois coracoes": { jpSituacao: { jpc: [{ rotulo: "veneno, doença ou asfixia", bonus: 2 }] } },
  "vontade ferrea": { jpSituacao: { jps: [{ rotulo: "medo, encantamento ou controle mental", bonus: 1 }] } },
  // Wookiee
  inabalavel: { jpSituacao: { jps: [{ rotulo: "medo ou intimidação", bonus: 2 }] } },
  // Chiss
  "sangue-frio": { jpSituacao: { jps: [{ rotulo: "medo, provocação ou intimidação", bonus: 1 }] } },
  // Rodiano: "Fácil" é +2, como na janela de ataque do motor
  "sangue frio": { contraQuemFeriu: 2 },
};

/** Uma vez, no `ready`. */
export function registrarRacas() {
  const api = globalThis.game?.modules?.get?.("spacedragon")?.api?.racas;
  if (!api?.registrar) return false;
  api.registrar(REGRAS_DE_RACA);
  return true;
}
