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
    efeito: { arma: { nome: "Canhões de energia", dano: "3d10" } },
    nota: "Versão mais poderosa dos disparadores laser. O dano acima é a leitura da casa: o livro só diz 'mais poderoso', e 3d10 é o degrau seguinte ao 2d10 dos disparadores.",
  },
  metralhadora: {
    rotulo: "Metralhadora de energia",
    grupo: "combate",
    cabe: { Pequena: false, "Média": true, Gigantesca: true, Colossal: true },
    efeito: { arma: { nome: "Metralhadora de energia", dano: "1d10" }, ataques: 4 },
    nota: "Versão automática dos disparadores. Permite 4 ataques por rodada, de 1d10 cada.",
  },
  misseis: {
    rotulo: "Mísseis teleguiados",
    grupo: "combate",
    cabe: { Pequena: false, "Média": true, Gigantesca: true, Colossal: true },
    efeito: { arma: { nome: "Mísseis teleguiados", dano: "4d10" } },
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
    .map(([, e]) => ({ ...e.efeito.arma, ataques: e.efeito.ataques ?? 1 }));
}
