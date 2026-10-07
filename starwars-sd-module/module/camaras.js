/**
 * As 12 câmaras da nave, o salto hiperespacial e a tranca do Arsenal.
 *
 * Fica separado de `nave-modelo.js` porque aquele arquivo abre com
 * `const { fields } = foundry.data` e só carrega dentro do Foundry. Isto aqui é
 * dado puro, e o build o lê para gerar a tabela do journal a partir da MESMA
 * fonte que a ficha usa.
 */

/* ── AS 12 CÂMARAS (T10-2), A NAVE COMO BASE DE OPERAÇÕES ────────────────────
 *
 * Regra da casa, do guia "Espaçonaves como Base de Operações". Cada câmara tem
 * custo, tempo de obra e um efeito; três delas mexem no que esta ficha já faz,
 * e por isso a ficha as lê em vez de só listá-las:
 *
 *   ponte     dá +2 no ataque (o Computador Balístico) e, sem ela operacional,
 *             a nave não pilota nem opera armas;
 *   maquinas  é o que permite reparar em combate;
 *   emergencia é o que permite abandonar a nave a 0 PV.
 *
 * `obra` é o custo em créditos; `prazo`, o tempo da obra. Reparar uma câmara
 * danificada custa 25% e leva metade do tempo — a mesma régua do conserto de
 * aparatos do capítulo 8.
 */
export const ESTADOS_DE_CAMARA = ["instalada", "danificada", "ausente"];

export const CAMARAS = {
  ponte: {
    rotulo: "Ponte de Comando", obra: 120000, prazo: "2 semanas",
    efeito: "Controle central. Abriga o Computador Balístico (+2 nos ataques da nave) e o piloto automático; é onde se rolam os 3 testes de Pilotar do salto hiperespacial. Sem ela operacional, a nave não pode ser pilotada nem operar escudos ou armas.",
    // O +2 do Computador Balístico NÃO mora aqui: ele é equipamento da T10-4,
    // e a Ponte apenas o habilita («exige a Ponte operacional»). Enquanto o
    // bônus estava na câmara, TODA nave com Ponte ganhava +2 — inclusive a que
    // nunca comprou o computador, que custa caro e cabe em qualquer tamanho
    // justamente porque é uma escolha.
    exigeParaAtacar: true, exigeParaPilotar: true, exigeParaEscudos: true,
    habilitaEquipamento: "balistico",
  },
  aposentos: {
    rotulo: "Aposentos da Tripulação", obra: 40000, prazo: "1 semana",
    efeito: "Recuperação natural de PV e de Alcance da Força para a tripulação orgânica durante viagens no hiperespaço. Sem aposentos, a viagem simplesmente não recupera nada.",
    recuperaEmViagem: true,
  },
  maquinas: {
    rotulo: "Sala de Máquinas", obra: 200000, prazo: "3 semanas",
    efeito: "Propulsão e geradores primários. É o que permite ao Técnico testar Operar e Consertar Máquinas para reativar a energia ou reparar a nave em combate. Espaço obrigatório do acelerador hiperespacial, e onde se gerenciam os tanques de combustível.",
    exigeParaReparar: true,
  },
  deposito: {
    rotulo: "Depósito", obra: 30000, prazo: "3 dias",
    efeito: "Carga comercial, suprimentos, peças sobressalentes e pilhagem. Guarda veículos de apoio leves, como swoop bikes ou trajes de combate pesados. Indispensável para transporte de bens e contrabando.",
  },
  refeitorio: {
    rotulo: "Refeitório", obra: 25000, prazo: "3 dias",
    efeito: "Prepara rações para expedições longas, mantém o moral e reduz o custo de suprimentos em travessias.",
  },
  arsenal: {
    rotulo: "Arsenal", obra: 80000, prazo: "1 semana",
    efeito: "Estoque seguro das armas, munições e vestes reserva do grupo. Trancas digitais reforçadas: invadir exige Sabotagem com −20%. Permite recarga rápida de baterias energéticas antes das missões.",
  },
  hospital: {
    rotulo: "Ala Hospitalar", obra: 120000, prazo: "2 semanas",
    efeito: "Habilita os feitos de Operação Cirúrgica, Curar Doença e Diagnosticar Doença, e dobra a recuperação natural de PV em viagem.",
    dobraRecuperacao: true,
  },
  laboratorio: {
    rotulo: "Laboratório", obra: 150000, prazo: "2 semanas",
    efeito: "Instalação obrigatória para o Técnico construir aparatos (com o desconto da Aptidão Tecnológica) e fazer Reparos Robóticos em droides. Sem ele, criar aparatos exige alugar oficina externa.",
  },
  acoplagem: {
    rotulo: "Câmara de Acoplagem", obra: 100000, prazo: "1,5 semana",
    efeito: "Conecta a nave a estações ou a outras naves no vácuo: abordagem tática, transferência de passageiros e embarque de carga.",
  },
  despressurizacao: {
    rotulo: "Câmara de Despressurização", obra: 60000, prazo: "1 semana",
    efeito: "Saída segura para atividade extraveicular no vácuo ou em superfícies tóxicas, sem perder pressão nem contaminar a nave.",
  },
  corredores: {
    rotulo: "Corredores", obra: 20000, prazo: "3 dias",
    efeito: "Ligam as câmaras. As portas blindadas podem ser seladas numa invasão, exigindo Sabotagem ou um cortador laser para abrir.",
  },
  emergencia: {
    rotulo: "Saída de Emergência", obra: 90000, prazo: "1 semana",
    efeito: "As cápsulas de evacuação, com suporte de vida independente. A 0 PV, durante a contagem regressiva para a explosão — 1 segundo por PV do total —, é por ela que a tripulação escapa.",
    salvaA0PV: true,
  },
};

/**
 * O salto hiperespacial: três testes de Pilotar, na ordem, e cada um falha de
 * um jeito diferente. Rola-se na Ponte, e é ela que tem os instrumentos.
 *
 * "Falhas nos dois primeiros causam erros de navegação; falhas no terceiro
 * cancelam o salto."
 */
export const ETAPAS_DO_SALTO = [
  { chave: "distancia", rotulo: "Distância", erro: "a nave sai do hiperespaço longe demais, ou perto demais, do destino." },
  { chave: "direcao", rotulo: "Direção", erro: "a nave sai do hiperespaço na direção errada — outro sistema, outro setor." },
  { chave: "execucao", rotulo: "Execução", erro: "o salto não acontece: a nave fica onde está, e a sequência não pode ser abortada no meio." },
];

/** A tranca do Arsenal: invadir exige Sabotagem com esta penalidade. */
export const TRANCA_DO_ARSENAL = -20;

/**
 * A PONTE ENTRE O COMBATE TÁTICO E AS CÂMARAS.
 *
 * O crítico do dial causa uma avaria; a avaria é dano de cena, e o Engenheiro a
 * repara em combate. O que ela NÃO é, é dano estrutural — isso é a câmara.
 *
 * A conversa entre os dois acontece no fim da rodada: a avaria que o Engenheiro
 * não reparou deixa de ser susto e vira **câmara danificada**, que só a obra
 * conserta (25% do custo, metade do prazo). Assim o combate não trava no meio —
 * a nave continua lutando — mas a conta chega, e o posto de Engenharia ganha
 * urgência: reparar naquela rodada evita a obra.
 *
 * Só as avarias DURADOURAS entram. O Leme e a Tripulação saem sozinhos no fim
 * da rodada, e é de propósito: são sustos, não estrago.
 */
export const AVARIA_VIRA_CAMARA = {
  motor: "maquinas",    // a propulsão é a Sala de Máquinas
  armas: "arsenal",     // o armamento e a munição são o Arsenal
  sensores: "ponte",    // o radar fica na Ponte de Comando
};

/** Reparar custa 25% da obra e leva metade do tempo (a régua do Cap. 8). */
export const REPARO_DE_CAMARA = 0.25;

/** Uma câmara só conta quando está instalada — danificada não vale. */
export const camaraOperacional = (s, chave) => s?.camaras?.[chave] === "instalada";

/**
 * O que acontece ao arrastar uma câmara para uma nave.
 *
 * Função pura, pelo mesmo motivo de `decidirInstalacao` em equipamentos-nave.js:
 * é a REGRA (a T10-2 dizendo o que a câmara custa e em que estado ela entra), e
 * precisa ser testável sem o Foundry em volta. A ficha só traduz em notificação.
 *
 * Devolve { acao, mensagem }, com `acao` em:
 *   · "instalar"     — estava ausente, passa a instalada
 *   · "jaInstalada"
 *   · "repararAntes" — está DANIFICADA: instalar por cima apagaria a avaria, e
 *                      a T10-2 manda reparar (25% do valor, metade do prazo)
 *   · "desconhecida"
 */
export function decidirCamara(chave, { estados = {}, nomeDaNave = "a nave" } = {}) {
  const c = CAMARAS[chave];
  if (!c) return { acao: "desconhecida", mensagem: "" };
  const estado = estados?.[chave]?.estado ?? estados?.[chave] ?? "ausente";

  if (estado === "instalada") {
    return { acao: "jaInstalada", mensagem: `${c.rotulo} já está instalada em ${nomeDaNave}.` };
  }
  // Danificada não é ausente. Arrastar por cima pareceria consertar de graça, e
  // a T10-2 cobra 25% do valor e metade do prazo por um reparo — a ficha tem o
  // botão de reparo para isso.
  if (estado === "danificada") {
    return {
      acao: "repararAntes",
      mensagem:
        `${c.rotulo} está danificada em ${nomeDaNave}. A T10-2 manda repará-la ` +
        `(25% do valor, metade do prazo), e não reinstalá-la.`,
    };
  }
  return {
    acao: "instalar",
    mensagem: `${c.rotulo} instalada em ${nomeDaNave}. Obra: ${c.obra?.toLocaleString("pt-BR")} créditos, ${c.prazo}.`,
  };
}
