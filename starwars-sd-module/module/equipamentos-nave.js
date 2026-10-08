/**
 * Os equipamentos adicionais de espaçonave — a Tabela T10-4 do Space Dragon.
 *
 * ── O QUE ESTAVA ERRADO ANTES ───────────────────────────────────────────────
 *
 * O cenário tinha as CÂMARAS (T10-2) e não tinha os EQUIPAMENTOS (T10-4), e a
 * diferença entre as duas coisas se perdeu: três equipamentos da T10-4 — o
 * Computador Balístico, o piloto automático e o acelerador hiperespacial —
 * tinham virado efeito fixo da Ponte de Comando.
 *
 * Mas no livro eles são INSTALAÇÕES: caras, opcionais, feitas por cientistas
 * especializados, e cada uma só cabe em certos tamanhos de nave. Uma nave podia
 * ter Ponte e não ter Computador Balístico — e, pela tabela, um caça não pode
 * ter acelerador hiperespacial de jeito nenhum.
 *
 * ── A MATRIZ DE TAMANHOS É REGRA, E NÃO ENFEITE ─────────────────────────────
 *
 * Cada equipamento traz os quatro tamanhos da T10-1 (p, m, g, c). Isso decide
 * o que a ficha oferece: no caça não aparece acelerador, no colosso não aparece
 * defletor de raios. É o que impede a mesa de instalar o que o livro não deixa.
 *
 * ── O QUE O LIVRO DEIXA PARA O MESTRE ───────────────────────────────────────
 *
 * Custo, tempo de instalação e quantidade máxima de cada equipamento são
 * explicitamente do Mestre (§10.4), e por isso não estão aqui. O que está é o
 * que a mesa consulta no meio da cena: onde cabe e o que faz.
 */

/** Os quatro tamanhos da T10-1, na ordem das colunas da T10-4. */
export const TAMANHOS = ["Pequena", "Média", "Gigantesca", "Colossal"];

/**
 * `cabe` é a matriz p/m/g/c da tabela.
 * `efeito` é o número que a ficha aplica sozinha; `nota` é o texto do livro.
 */
export const EQUIPAMENTOS_DE_NAVE = {
  // ── UTILITÁRIOS ─────────────────────────────────────────────────────────
  acelerador: {
    rotulo: "Acelerador hiperespacial",
    grupo: "utilitario",
    cabe: { Pequena: false, "Média": true, Gigantesca: true, Colossal: false },
    efeito: { permiteSalto: true },
    nota: "Permite que a nave execute o salto para o hiperespaço. Sem ele, não há salto — e a tabela não o admite em nave pequena nem colossal.",
  },
  blindagem: {
    rotulo: "Blindagem térmica",
    grupo: "utilitario",
    cabe: { Pequena: true, "Média": true, Gigantesca: true, Colossal: true },
    nota: "Diminui consideravelmente o desgaste causado por entradas e saídas de atmosferas.",
  },
  braco: {
    rotulo: "Braço robótico",
    grupo: "utilitario",
    cabe: { Pequena: true, "Média": true, Gigantesca: true, Colossal: true },
    nota: "Ferramenta para reparos externos sem deixar a nave. Operado com o talento de cientista.",
  },
  acoplagem: {
    rotulo: "Corredor de acoplagem",
    grupo: "utilitario",
    cabe: { Pequena: false, "Média": true, Gigantesca: true, Colossal: false },
    nota: "Passagem acoplável a outras naves, para abordagem.",
  },
  gancho: {
    rotulo: "Gancho eletromagnético",
    grupo: "utilitario",
    cabe: { Pequena: true, "Média": true, Gigantesca: false, Colossal: false },
    nota: "Prende e reboca outra nave ou carga no vácuo.",
  },
  solares: {
    rotulo: "Painéis solares",
    grupo: "utilitario",
    cabe: { Pequena: false, "Média": true, Gigantesca: false, Colossal: false },
    nota: "Fornecem energia suficiente para as funções básicas da nave, se ela estiver ao alcance de um sol.",
  },
  pilotoAutomatico: {
    rotulo: "Piloto automático",
    grupo: "utilitario",
    cabe: { Pequena: false, "Média": true, Gigantesca: true, Colossal: true },
    efeito: { pilotagemAutomatica: true },
    nota: "Garante um sucesso automático em qualquer jogada de pilotagem enquanto ativo. NÃO pode ser usado em combate.",
  },
  propulsores: {
    rotulo: "Propulsores a jato",
    grupo: "utilitario",
    cabe: { Pequena: true, "Média": true, Gigantesca: false, Colossal: false },
    efeito: { movimento: 1.5 },
    nota: "Aumentam a movimentação da nave em 50%, mas consomem combustível rapidamente.",
  },

  // ── COMBATE ─────────────────────────────────────────────────────────────
  disparadores: {
    rotulo: "Disparadores laser",
    grupo: "combate",
    cabe: { Pequena: true, "Média": true, Gigantesca: true, Colossal: true },
    efeito: { arma: { nome: "Disparadores laser", dano: "2d10" } },
    nota: "A arma mais comum em espaçonaves. Causa 2d10 de dano.",
  },
  canhoes: {
    rotulo: "Canhões de energia",
    grupo: "combate",
    cabe: { Pequena: false, "Média": false, Gigantesca: true, Colossal: true },
    efeito: { arma: { nome: "Canhões de energia", dano: "5d10" } },
    // A nota é o que a MESA lê ao abrir o item: o que a arma faz, e nada do
    // histórico de como chegamos nesse número. Esta linha já carregou "o módulo
    // trazia 3d10… as Regras Compiladas fixam 5d10" — conversa de
    // desenvolvimento publicada num compêndio. O porquê da mudança é assunto do
    // changelog, e lá ele está.
    nota: "Versão pesada dos disparadores laser, montada em naves gigantescas e colossais. Causa 5d10 de dano.",
  },
  metralhadora: {
    rotulo: "Metralhadora de energia",
    grupo: "combate",
    cabe: { Pequena: false, "Média": true, Gigantesca: true, Colossal: true },
    // `ataques` fica DENTRO de `arma`: é propriedade da arma, não do
    // equipamento. Fora dali ninguém o lia — `armasInstaladas` devolvia 1
    // ataque, e os quatro disparos por rodada da T10-4 sumiam em silêncio.
    efeito: { arma: { nome: "Metralhadora de energia", dano: "1d10", ataques: 4 } },
    nota: "Versão automática dos disparadores. Permite 4 ataques por rodada, de 1d10 cada.",
  },
  misseis: {
    rotulo: "Mísseis teleguiados",
    grupo: "combate",
    cabe: { Pequena: false, "Média": true, Gigantesca: true, Colossal: true },
    // A JP do alvo e as rodadas de perseguição são METADE da regra do míssil, e
    // estavam só na nota em prosa. Nos dados, a descrição as escreve sozinha —
    // e quem for automatizar o disparo tem onde ler que o acerto depende de uma
    // JP, em vez de rolar 4d10 e pronto.
    efeito: {
      arma: {
        nome: "Mísseis teleguiados", dano: "4d10",
        jpDoAlvo: true, perseguePor: "1d4+1",
      },
    },
    nota: "Um míssil que segue o alvo por 1d4+1 rodadas, causando 4d10 no impacto.",
  },
  balistico: {
    rotulo: "Computador balístico",
    grupo: "combate",
    cabe: { Pequena: true, "Média": true, Gigantesca: true, Colossal: true },
    efeito: { ataque: 2 },
    // Até a 1.17.0 este +2 vinha de ter a Ponte de Comando, e toda nave o tinha
    // de graça. Vira instalação, como no livro — e nasce LIGADO no schema, para
    // que as naves já criadas não percam o bônus de uma versão para a outra.
    padrao: true,
    nota: "Calcula a melhor maneira de atingir os inimigos. Concede +2 em rolagens de ataque. Exige a Ponte de Comando operacional.",
  },
  defletores: {
    rotulo: "Defletores de raios",
    grupo: "combate",
    cabe: { Pequena: true, "Média": true, Gigantesca: false, Colossal: false },
    efeito: { redireciona: 25, rodadas: "1d4" },
    nota: "Garantem 25% de chance de redirecionar contra o atacante qualquer ataque de raios que a nave sofra, por 1d4 rodadas.",
  },
  escudo: {
    rotulo: "Escudo de força",
    grupo: "combate",
    cabe: { Pequena: false, "Média": true, Gigantesca: true, Colossal: true },
    efeito: { cp: 10 },
    nota: "Campo de força que repele a maioria dos ataques enquanto durar. Garante +10 no CP, mas gasta combustível a cada rodada de combate — o Mestre faz as rolagens.",
  },
};

/** Se a tabela admite este equipamento num tamanho de nave. */
export function cabeNoTamanho(chave, tamanho) {
  return EQUIPAMENTOS_DE_NAVE[chave]?.cabe?.[tamanho] === true;
}

/** Os equipamentos que uma nave DESTE tamanho pode instalar. */
export function equipamentosDoTamanho(tamanho) {
  return Object.entries(EQUIPAMENTOS_DE_NAVE)
    .filter(([, e]) => e.cabe?.[tamanho] === true)
    .map(([chave, e]) => ({ chave, ...e }));
}

/**
 * O que os equipamentos instalados somam, já descontando o que não cabe.
 *
 * Um equipamento marcado numa nave que não o admite é IGNORADO, e não some da
 * ficha: a nave pode ter mudado de tipo depois de equipada, e apagar a marca
 * silenciosamente esconderia o conflito de quem vai conferir.
 */
export function efeitosInstalados(instalados = {}, tamanho = "Média") {
  const vale = (k) => instalados[k] === true && cabeNoTamanho(k, tamanho);
  return {
    ataque: vale("balistico") ? EQUIPAMENTOS_DE_NAVE.balistico.efeito.ataque : 0,
    cp: vale("escudo") ? EQUIPAMENTOS_DE_NAVE.escudo.efeito.cp : 0,
    multiplicadorDeMovimento: vale("propulsores") ? 1.5 : 1,
    podeSaltar: vale("acelerador"),
    pilotagemAutomatica: vale("pilotoAutomatico"),
    redirecionaRaios: vale("defletores") ? 25 : 0,
  };
}

/** Marcas que a nave tem mas o tamanho dela não admite — para a ficha avisar. */
export function conflitosDeTamanho(instalados = {}, tamanho = "Média") {
  return Object.keys(EQUIPAMENTOS_DE_NAVE)
    .filter((k) => instalados[k] === true && !cabeNoTamanho(k, tamanho))
    .map((k) => ({ chave: k, rotulo: EQUIPAMENTOS_DE_NAVE[k].rotulo }));
}

/** As armas que os equipamentos de combate instalados dão de pronto. */
export function armasInstaladas(instalados = {}, tamanho = "Média") {
  return Object.entries(EQUIPAMENTOS_DE_NAVE)
    .filter(([k, e]) => e.efeito?.arma && instalados[k] === true && cabeNoTamanho(k, tamanho))
    // `ataques` vem de DENTRO de `arma`, onde ele mora. Lia-se
    // `e.efeito.ataques` — um nível acima —, e como lá não havia nada a
    // metralhadora saía com 1 ataque em vez dos 4 da T10-4. O espalhamento de
    // `...e.efeito.arma` já traz o campo; o `?? 1` cobre as armas de tiro único.
    .map(([, e]) => ({ ataques: 1, ...e.efeito.arma }));
}

/* ── FONTES DE ENERGIA E COMBUSTÍVEL (T10-3) ───────────────────────────────
 *
 * O combustível é o recurso de VIAGEM: 0% a 100%, reposto em estação. Não se
 * confunde com a Energia do reator, de tripulacao.js, que é o recurso de
 * RODADA — uma nave pode estar com o tanque cheio e sem energia para os
 * escudos naquela rodada.
 *
 * O livro não dá tabela de consumo, e dá algo melhor: a AUTONOMIA escolhe o
 * dado, e a AÇÃO escolhe quantos dados. Role e desconte em pontos percentuais.
 */
export const FONTES_DE_ENERGIA = {
  liquido: {
    rotulo: "Combustível líquido",
    raridade: "Comum",
    autonomia: "Média",
    custo: { Pequena: 500, "Média": 1000, Gigantesca: 10000, Colossal: 100000 },
  },
  detritos: {
    rotulo: "Incineração de detritos",
    raridade: "Incomum",
    autonomia: "Baixa",
    custo: { Pequena: 50, "Média": 100, Gigantesca: 1000, Colossal: 10000 },
  },
  solar: {
    rotulo: "Painéis termoenergéticos",
    raridade: "Rara",
    autonomia: "Variável",
    custo: null, // o livro não dá preço: não se abastece, se expõe ao sol
  },
  atomico: {
    rotulo: "Reatores atômicos",
    raridade: "Comum",
    autonomia: "Alta",
    custo: { Pequena: 1000, "Média": 10000, Gigantesca: 100000, Colossal: 1000000 },
  },
};

/** A autonomia escolhe o dado do consumo. */
export const DADO_DE_AUTONOMIA = { Baixa: 6, "Média": 4, Alta: 2, "Variável": 4 };

/**
 * A fórmula do gasto: `N` dados da autonomia, em pontos percentuais.
 *
 * `gasto` é de 1 a 3, e quem decide é o Mestre — um dia de viagem costuma ser 1.
 */
export function formulaDeGasto(fonte, gasto = 1) {
  const faces = DADO_DE_AUTONOMIA[FONTES_DE_ENERGIA[fonte]?.autonomia] ?? 4;
  const n = Math.max(1, Math.min(3, Number(gasto) || 1));
  return `${n}d${faces}`;
}

/** O que custa encher `pct` pontos percentuais desta nave. */
export function custoDeAbastecimento(fonte, tamanho, pct = 100) {
  const porPonto = FONTES_DE_ENERGIA[fonte]?.custo?.[tamanho];
  if (porPonto == null) return null;  // painéis solares: não se abastece
  return porPonto * Math.max(0, Math.min(100, Number(pct) || 0));
}

/* ── VEÍCULOS TERRESTRES, AQUÁTICOS E AÉREOS (T10-7) ───────────────────────
 *
 * Mesmas regras de pilotagem e combate das naves, e as armas da T10-4 valem
 * neles — com os limites que o Mestre achar razoáveis para o tamanho reduzido.
 *
 * A ESCALA DE TAMANHO É OUTRA: aqui é Pequeno/Médio/Grande/Enorme, e não o
 * Pequena/Média/Gigantesca/Colossal das naves. São tabelas diferentes, e
 * misturá-las faria um tanque de guerra receber equipamento de cruzador.
 */
export const VEICULOS = {
  aerocarro: { rotulo: "Aerocarro", tamanho: "Pequeno", tripulacao: "1 a 4", pv: "1d100", ba: 10, cp: 22, jp: 14, mov: "40 m" },
  hidrocarro: { rotulo: "Hidrocarro", tamanho: "Pequeno", tripulacao: "1 a 4", pv: "1d100", ba: 10, cp: 22, jp: 14, mov: "40 m" },
  submersivel: { rotulo: "Submersível", tamanho: "Médio", tripulacao: "1 a 6", pv: "2d100", ba: 16, cp: 28, jp: 16, mov: "40 m" },
  exploracao: { rotulo: "Veículo de exploração", tamanho: "Médio", tripulacao: "1 a 6", pv: "2d100", ba: 16, cp: 28, jp: 16, mov: "30 m" },
  submarino: { rotulo: "Submarino", tamanho: "Grande", tripulacao: "1 a 10", pv: "3d100", ba: 14, cp: 26, jp: 12, mov: "30 m" },
  tanque: { rotulo: "Tanque de guerra", tamanho: "Grande", tripulacao: "1 a 10", pv: "3d100", ba: 20, cp: 30, jp: 12, mov: "20 m" },
  aeroplano: { rotulo: "Aeroplano", tamanho: "Enorme", tripulacao: "1 a 20", pv: "1d1000", ba: 12, cp: 24, jp: 10, mov: "120 m" },
  cargueiroTerrestre: { rotulo: "Cargueiro terrestre", tamanho: "Enorme", tripulacao: "1 a 20", pv: "1d1000", ba: 12, cp: 24, jp: 10, mov: "30 m" },
};

/* ── QUANDO GENTE E NAVE SE ENFRENTAM ──────────────────────────────────────
 *
 * A nave atirando em pessoas tem regra própria, e ela inverte o sentido usual:
 * os alvos fazem JPR e quem passa reduz o dano à metade — "a ficção científica
 * retrô é sobre exploradores que desviam de lasers".
 *
 * A cada 20 pontos no resultado do ataque, os alvos levam −2 na JPR. É a régua
 * que faz a torre de um AT-AT ser aterrorizante sem ser instantânea.
 */
export const PENALIDADE_POR = 20;

export function penalidadeNaJPR(totalDoAtaque) {
  const n = Math.max(0, Number(totalDoAtaque) || 0);
  return -2 * Math.floor(n / PENALIDADE_POR);
}

/**
 * O que acontece ao arrastar um equipamento para uma nave.
 *
 * Função pura, e separada da ficha, por dois motivos: ela é a REGRA (a matriz
 * da T10-4 decidindo o que cabe em que tamanho), e é o que precisa ser testado
 * sem o Foundry em volta. A ficha só traduz o resultado em notificação.
 *
 * Devolve { acao, mensagem }, com `acao` em:
 *   · "instalar"  — cabe, e ainda não está lá
 *   · "jaInstalado"
 *   · "naoCabe"   — a T10-4 não admite neste tamanho
 *   · "desconhecido" — o item não é um equipamento de nave
 */
export function decidirInstalacao(chave, { tamanho, instalados = {}, nomeDaNave = "a nave" } = {}) {
  const e = EQUIPAMENTOS_DE_NAVE[chave];
  if (!e) return { acao: "desconhecido", mensagem: "" };
  if (instalados?.[chave] === true) {
    return { acao: "jaInstalado", mensagem: `${e.rotulo} já está instalado em ${nomeDaNave}.` };
  }
  // A matriz é regra, e vale no arrasto como vale no botão. O aviso diz o
  // TAMANHO, que é o que a pessoa precisa saber para escolher outra nave.
  if (e.cabe?.[tamanho] !== true) {
    return { acao: "naoCabe", mensagem: `A T10-4 não admite ${e.rotulo} em nave ${tamanho}.` };
  }
  return { acao: "instalar", mensagem: `${e.rotulo} instalado em ${nomeDaNave}.` };
}
