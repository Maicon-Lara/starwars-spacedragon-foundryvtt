/**
 * A tripulação: os postos, a Energia do reator, o prazo das avarias e o
 * relógio da fuga.
 *
 * Fonte: o cofre, em SW-SUP-Naves.md, seção "A tripulação". É a parte DA CASA
 * daquele capítulo — o §10.6 diz que a tripulação inteira age no turno da
 * nave, mas não diz o que cada um faz.
 *
 * ── POR QUE ISTO É UM ARQUIVO SÓ DE DADOS ───────────────────────────────────
 *
 * Mesmo desenho de camaras.js e dial.js: nada aqui toca `game`, `ui` ou
 * `canvas`, e por isso tudo pode ser testado fora do Foundry
 * (tools/teste-tripulacao.mjs). A ficha importa e aplica; as regras moram aqui.
 *
 * ── POR QUE AS CAMADAS SÃO LIGÁVEIS UMA A UMA ───────────────────────────────
 *
 * No cofre, Energia, Controle de Avarias e a fuga como relógio são **camadas
 * opcionais**: cada uma acrescenta uma decisão por rodada, e as três somadas
 * pesam numa mesa casual. A ficha mostra só o que a mesa ligou — senão quem
 * não usa fica com três painéis mortos na tela, numa ficha que já é cheia.
 *
 * Os POSTOS não são camada: eles são a regra da tripulação, e a ficha já
 * guardava quem ocupa cada um desde antes. O que entra agora é a AÇÃO que cada
 * posto escolheu na rodada.
 */

/* ── OS CINCO POSTOS (§7) ──────────────────────────────────────────────────
 *
 * Os nomes são os do documento: Leme, Artilharia, Engenharia, Sensores,
 * Comando. Eu já tinha escrito uma segunda lista em nave-pc-dados.js com
 * "pilotagem, armas, escudos, engenharia, sensores" — inventada, com um posto
 * de Escudos que não existe e sem o Comando, que é o posto que mais muda a
 * rodada. As duas listas agora nascem daqui.
 *
 * `quem` não é decoração: «Engenharia — Técnico (precisa da Sala de Máquinas
 * instalada)» é a regra inteira num campo, e é o que a ficha mostra antes de a
 * mesa descobrir no meio do combate que ninguém pode ocupar o posto.
 */
export const POSTOS = [
  {
    chave: "leme", rotulo: "Leme", quem: "Veterano / Contrabandista",
    oQueFaz: "Move a nave, firma para os artilheiros, ou corre o dobro.",
  },
  {
    chave: "artilharia", rotulo: "Artilharia", quem: "qualquer um",
    oQueFaz: "Dispara as armas montadas: tiro certeiro, rajada ou supressão.",
  },
  {
    chave: "engenharia", rotulo: "Engenharia", quem: "Técnico",
    exigeCamara: "maquinas",
    oQueFaz: "Repara avarias, distribui a energia do reator ou força o reator.",
  },
  {
    chave: "sensores", rotulo: "Sensores", quem: "qualquer um",
    oQueFaz: "Trava alvos, varre o espaço ou interfere no inimigo.",
  },
  {
    chave: "comando", rotulo: "Comando", quem: "Emissário / líder",
    oQueFaz: "Faz um posto agir duas vezes, rerrola um dado, ou cancela uma avaria.",
  },
];

/* ── OS POSTOS, E O QUE CADA UM PODE FAZER ─────────────────────────────────
 *
 * Cada posto tem de 2 a 3 opções, e é isso que resolve o problema que o dial
 * não resolvia: no Combate Tático só o Leme decidia algo, porque posição é um
 * minijogo de um jogador. Aqui cada posto tem uma escolha com consequência.
 *
 * `efeito` é o que a ficha aplica sozinha; `nota` é o que fica para a mesa.
 * Nem tudo vira automação de propósito — ver AUTOMATIZA, abaixo.
 */
export const ACOES_DE_POSTO = {
  leme: [
    {
      chave: "manobrar", rotulo: "Manobrar",
      nota: "A movimentação normal, que não gasta a ação. Em situação-limite, teste de Pilotar.",
    },
    {
      chave: "firmar", rotulo: "Firmar",
      efeito: { jp: 4, ataqueAliado: 2, imovel: true },
      nota: "A nave fica estável: +4 na JP dela e +2 nos ataques dos artilheiros, até o fim da rodada. Mas a nave NÃO se move.",
    },
    {
      chave: "correr", rotulo: "Correr",
      efeito: { movimentoDobrado: true, perdeAcao: true, apressaPerseguidor: true },
      nota: "Movimentação dupla: o dobro do movimento, teste de Pilotar obrigatório, e a ação do turno se perde.",
    },
  ],
  artilharia: [
    {
      chave: "certeiro", rotulo: "Tiro certeiro",
      nota: "O disparo normal: 1d20 + BA da nave + BA à distância do artilheiro.",
    },
    {
      chave: "rajada", rotulo: "Rajada",
      efeito: { ataque: -5, dadosDeDano: 1 },
      nota: "−5 no ataque, +1 dado de dano se acertar.",
    },
    {
      chave: "supressao", rotulo: "Supressão",
      efeito: { semDano: true, ataqueDoAlvo: -2, bloqueiaEvasivaDoAlvo: true },
      nota: "Não causa dano. O alvo leva −2 no próximo ataque dele, e não pode fazer manobra evasiva nesta rodada.",
    },
  ],
  engenharia: [
    {
      chave: "reparar", rotulo: "Reparar",
      nota: "Remove uma avaria ou recupera 1d10 PV. É o botão de Engenharia que já existia.",
    },
    {
      chave: "energia", rotulo: "Distribuir energia",
      nota: "Reparte os pontos do reator entre Motores, Escudos e Armas.",
    },
    {
      chave: "forcar", rotulo: "Forçar o reator",
      efeito: { energiaExtra: 2, riscoEm1d6: 1, avariaSe: "maquinas" },
      nota: "+2 pontos de energia nesta rodada. Role 1d6: num 1, a Sala de Máquinas pega uma avaria.",
    },
  ],
  sensores: [
    {
      chave: "travar", rotulo: "Travar alvo",
      efeito: { trava: true },
      nota: "+2 no próximo ataque aliado contra ele. Informa alcances e o estado dele.",
    },
    {
      chave: "varredura", rotulo: "Varredura",
      nota: "Revela naves ocultas, a intenção do inimigo, ou qual câmara da nave alvo está avariada.",
    },
    {
      chave: "interferencia", rotulo: "Interferência",
      efeito: { ataqueInimigo: -2 },
      nota: "−2 no próximo ataque inimigo contra esta nave.",
    },
  ],
  comando: [
    {
      chave: "ordem", rotulo: "Ordem",
      nota: "Um posto age duas vezes nesta rodada. Quem e com o quê é da mesa — a ficha não tem como saber o que o posto ia fazer.",
    },
    {
      chave: "sangueFrio", rotulo: "Sangue frio",
      nota: "Um aliado rerrola um dado — qualquer dado, inclusive o do crítico. Rerrolar no Foundry é na mensagem de chat original, não aqui.",
    },
    {
      chave: "aguentem", rotulo: "Aguentem firme",
      efeito: { cancelaPenalidadeDeAvaria: 1 },
      nota: "Cancela, até o fim da rodada, uma penalidade de avaria (o −5 nos ataques ou o −5 no CP).",
    },
  ],
};

/**
 * O que a ficha aplica SOZINHA, e o que fica como texto no cartão.
 *
 * Duas ações do Comando ficam de fora de propósito. "Ordem" dá uma ação a mais
 * a um posto, e a ficha não tem como saber o que aquele posto ia fazer; "Sangue
 * frio" rerrola um dado qualquer, e no Foundry isso se faz na mensagem de chat
 * que já saiu, não numa ficha. Automatizar os dois exigiria a ficha adivinhar a
 * intenção da mesa, e erraria.
 */
export const AUTOMATIZA = new Set([
  "firmar", "correr", "rajada", "supressao", "forcar", "travar",
  "interferencia", "aguentem",
]);

/** A ação escolhida por um posto, ou null. */
export function acaoDoPosto(posto, chave) {
  return (ACOES_DE_POSTO[posto] ?? []).find((a) => a.chave === chave) ?? null;
}

/* ── ENERGIA ───────────────────────────────────────────────────────────────
 *
 * O reator dá N pontos por rodada, por tamanho, e Engenharia os reparte. O que
 * não for gasto NÃO acumula: é uma decisão por rodada, não uma poupança.
 *
 * As três saídas usam mecânica que já existia no cenário — a JP e o CP no
 * §10.6, os dados de esquiva e de dano no Tático. Não há número novo para a
 * mesa decorar, e é isso que faz a camada caber.
 */
export const ENERGIA_POR_TAMANHO = {
  Pequena: 2,
  "Média": 3,
  Gigantesca: 4,
  Colossal: 6,
};

export const DESTINOS_DE_ENERGIA = {
  motores: {
    rotulo: "Motores",
    livro: "+2 na JP da nave",
    tatico: "+1 hexe na manobra",
  },
  escudos: {
    rotulo: "Escudos",
    livro: "+2 no CP até o fim da rodada",
    tatico: "+1d6 de Esquiva",
  },
  armas: {
    rotulo: "Armas",
    livro: "+1 dado de dano numa arma",
    tatico: "+1 dado de dano numa arma",
  },
};

/** Quantos pontos o reator dá, pelo tamanho do tipo de nave. */
export function energiaDoReator(tamanho) {
  return ENERGIA_POR_TAMANHO[tamanho] ?? 0;
}

/**
 * O efeito mecânico dos pontos investidos, nos dois modos.
 *
 * Devolve sempre os quatro campos, zerados quando não há ponto — assim quem
 * usa não precisa testar `undefined` a cada soma.
 */
export function efeitoDaEnergia({ motores = 0, escudos = 0, armas = 0 } = {}, ehLivro = true) {
  return {
    jp: ehLivro ? motores * 2 : 0,
    hexes: ehLivro ? 0 : motores,
    cp: ehLivro ? escudos * 2 : 0,
    dadosDeEsquiva: ehLivro ? 0 : escudos,
    dadosDeDano: armas,
  };
}

/** O total gasto, para não deixar repartir mais do que o reator deu. */
export const energiaGasta = (e = {}) =>
  (e.motores ?? 0) + (e.escudos ?? 0) + (e.armas ?? 0);

/* ── CONTROLE DE AVARIAS ───────────────────────────────────────────────────
 *
 * Cada avaria acontece NUMA CÂMARA e vira uma emergência com prazo. Resolver
 * custa a ação de quem está na câmara; chegar de outro ponto da nave gasta uma
 * rodada. Perder o prazo deixa a câmara inoperante até reparo em porto.
 *
 * A metade do caminho já existia: AVARIA_VIRA_CAMARA (em camaras.js) mapeia a
 * avaria na câmara, e o Fim da Rodada já marcava a câmara como danificada. O
 * que entra agora é o RELÓGIO — antes a avaria esperava reparo sem pressa.
 */
export const PRAZO_DE_AVARIA = {
  motor: 3,
  armas: 2,
  sensores: 2,
  // o Leme e a Tripulação saem sozinhos no fim da rodada e não têm prazo
};

/**
 * Em que pé está a emergência de uma avaria.
 *
 * `rodadaDaAvaria` é a rodada em que ela surgiu; `rodadaAtual` vem do combate.
 * Sem combate ativo (rodada 0) não há relógio — é o mesmo critério que a
 * manobra evasiva já usa para o intervalo de 5 rodadas.
 */
export function prazoDaAvaria(avaria, rodadaDaAvaria, rodadaAtual) {
  const prazo = PRAZO_DE_AVARIA[avaria];
  if (!prazo) return null;
  if (!rodadaDaAvaria || !rodadaAtual) return { prazo, restam: prazo, venceu: false };
  const gastas = rodadaAtual - rodadaDaAvaria;
  const restam = prazo - gastas;
  return { prazo, restam: Math.max(0, restam), venceu: restam <= 0 };
}

/* ── FUGA E PERSEGUIÇÃO ────────────────────────────────────────────────────
 *
 * Fugir não é vencer a distância: é completar o salto antes de o perseguidor
 * completar o dele. O relógio do salto já existia (ETAPAS_DO_SALTO, três
 * etapas); o que entra é o relógio do PERSEGUIDOR.
 */
export const MARCAS_DO_PERSEGUIDOR = 3;

/** O perseguidor anda 1 por rodada, e 2 se a nave tomou avaria ou correu. */
export function avancoDoPerseguidor({ avariaNova = false, correu = false } = {}) {
  return avariaNova || correu ? 2 : 1;
}

/**
 * Quem fecha o relógio primeiro decide a cena.
 *
 * Empate é do perseguidor de propósito: a nave precisa COMPLETAR o salto, e um
 * travão de raio que chega no mesmo instante impede a partida.
 */
export function quemFechaPrimeiro(etapasDoSalto, marcasDoPerseguidor) {
  const saltou = etapasDoSalto >= 3;
  const alcancou = marcasDoPerseguidor >= MARCAS_DO_PERSEGUIDOR;
  if (alcancou) return "perseguidor";
  if (saltou) return "salto";
  return null;
}

/* ── O EFEITO NAS ROLAGENS ─────────────────────────────────────────────────
 *
 * Funções puras: recebem o `system` do atacante e do alvo e devolvem números.
 * É o que permite testar a integração sem montar uma ficha nem um combate — e
 * é o que evita que a regra viva espalhada em meio a HTML de diálogo.
 *
 * Todas aceitam objeto vazio: uma nave salva antes desta versão não tem os
 * campos, e a conta tem de dar zero em vez de NaN.
 */

/** Os modificadores que a tripulação põe num ataque de nave. */
export function partesDaTripulacao(atacante = {}, alvo = {}) {
  return [
    ["Firmar (Leme)", atacante.firmar?.ativa ? 2 : 0],
    ["suprimida", atacante.suprimida?.ativa ? -2 : 0],
    ["interferência do alvo", alvo.interferencia ? -2 : 0],
  ].filter(([, v]) => v);
}

/**
 * O CP do alvo, somada a energia que ele pôs nos Escudos.
 *
 * Só no §10.6: no Tático os Escudos viram dado de esquiva, não CP.
 */
export function cpComEnergia(alvo = {}, ehLivro = true) {
  return (alvo.cp ?? 0) + (ehLivro ? (alvo.energia?.escudos ?? 0) * 2 : 0);
}

/** O modificador da JP do alvo na evasiva, somada a energia nos Motores. */
export function jpComEnergia(alvo = {}, ehLivro = true) {
  return (alvo.evasiva?.mod ?? 0) + (ehLivro ? (alvo.energia?.motores ?? 0) * 2 : 0);
}

/** Dados de dano a mais, pela energia nas Armas. Vale nos dois modos. */
export const dadosExtrasDeDano = (s = {}) => s.energia?.armas ?? 0;

/** Dados de esquiva a mais, pela energia nos Escudos. Só no Tático. */
export const dadosExtrasDeEsquiva = (s = {}, ehLivro = true) =>
  ehLivro ? 0 : (s.energia?.escudos ?? 0);

/** A Supressão impede a manobra evasiva naquela rodada. */
export const evasivaBloqueada = (s = {}) => s.suprimida?.ativa === true;

/** O que o Fim da Rodada apaga: tudo o que vale "até o fim da rodada". */
export const LIMPA_NO_FIM_DA_RODADA = {
  "system.energia.motores": 0,
  "system.energia.escudos": 0,
  "system.energia.armas": 0,
  "system.energia.extra": 0,
  "system.firmar.ativa": false,
  "system.interferencia": false,
  "system.suprimida.ativa": false,
  "system.aguentem.ativa": false,
};
