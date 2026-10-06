/**
 * Modelo de dados da Nave — Star Wars para Space Dragon.
 *
 * Segue o "Combate Tático de Naves" do Suplemento (SW-SUP-Combate-Tatico-de-
 * Naves), que é a versão ENXUTA do ED-12 do Estrela Dracônica. O esqueleto
 * — ficha, dial, movimento no hex — veio do Star Dragon, mas a regra não:
 *
 *   · A DEFESA é o CP de Casco da Tabela 10-1, diferente por tipo. No Star
 *     Dragon é CA 44 para toda nave; aqui não há constante.
 *   · A BA é a da Tabela 10-1, na escala do Space Dragon (Caça +16), e não a
 *     reescalada para o Old Dragon 2 (+36).
 *   · Não há escudos nem fichas de Foco, Esquiva, Tonel ou Aceleração. O que
 *     sobra de estado de rodada é a Sobrecarga, a Trava dos Sensores e as
 *     avarias de crítico.
 *   · O dial é UM para todas as naves, com giros de 60° — as faces do hex —
 *     e só os colossos têm menos manobras.
 *
 * Os números de cada tipo (PV, BA, CP, JP) são os da Tabela 10-1 do Livro
 * Básico Aprimorado, os mesmos do módulo Space Dragon. Velocidade e Esquiva
 * são as do Suplemento.
 */

const { fields } = foundry.data;

/* O dial e a escala vivem em dial.js, que é dado puro e o teste também lê. */
export { METROS_POR_HEX, MANOBRAS, MANOBRAS_DE_COLOSSO } from "./dial.js";
import { MANOBRAS, MANOBRAS_DE_COLOSSO, METROS_POR_HEX } from "./dial.js";




/** As três faixas de alcance, em hexes. Além de 9, sem tiro. */
export const FAIXAS = {
  curta: { rotulo: "Curta (1–3 hex)", mod: 2 },
  media: { rotulo: "Média (4–6 hex)", mod: 0 },
  longa: { rotulo: "Longa (7–9 hex)", mod: -2 },
};

/**
 * Críticos de nave (d6). As que duram são estado da nave; a Brecha vale só
 * para o tiro que a causou, e por isso não tem estado.
 */
export const AVARIAS = {
  1: { chave: "motor", rotulo: "Motor", efeito: "Velocidade −1 até reparar." },
  2: { chave: "leme", rotulo: "Leme", efeito: "Só manobras verdes ou brancas na próxima rodada." },
  3: { chave: "armas", rotulo: "Armas", efeito: "−1 dado de dano até reparar." },
  4: { chave: "sensores", rotulo: "Sensores", efeito: "−2 nos ataques até reparar." },
  5: { chave: "tripulacao", rotulo: "Tripulação", efeito: "Um posto fica fora por 1 rodada (ou o piloto leva 1d6)." },
  6: { chave: null, rotulo: "Brecha no casco", efeito: "O dano desta arma é dobrado." },
};
/** As avarias que duram só a próxima rodada saem no fim dela. */
export const AVARIAS_DE_UMA_RODADA = ["leme", "tripulacao"];

/* ── AS REGRAS DO LIVRO (SD, §10.6) ───────────────────────────────────────────
 *
 * O outro modo de combate de nave, para quem prefere o capítulo 10 ao Combate
 * Tático do Suplemento. Não é uma variante do dial: é outro jogo.
 *
 *   · não há grid, dial, Sobrecarga nem Esquiva em d6;
 *   · o disparo soma o BA da nave E o BA à distância de quem opera a arma;
 *   · a defesa é o CP — só naves PEQUENAS podem trocá-lo por uma JP, com a
 *     manobra evasiva, e apenas uma vez a cada 5 rodadas;
 *   · a JP da nave não tem atributo: o modificador vem de um teste de
 *     pilotagem (T10-5);
 *   · o 20 e o 1 naturais têm tabelas próprias, em 1d6.
 */

/** T10-5: o teste de pilotagem vira o modificador da JP da nave. */
export const PILOTAGEM_JP = [
  { chave: "falhaCritica", rotulo: "Falha crítica (100)", mod: -8 },
  { chave: "falhaAlta", rotulo: "Falha (acima de 80)", mod: -4 },
  { chave: "falha", rotulo: "Falha", mod: -2 },
  { chave: "sucesso", rotulo: "Sucesso", mod: 2 },
  { chave: "sucessoBaixo", rotulo: "Sucesso (abaixo de 20)", mod: 4 },
  { chave: "sucessoCritico", rotulo: "Sucesso crítico (1)", mod: 8 },
];

/** Em que faixa da T10-5 caiu um d% de pilotagem contra a chance do piloto. */
export function faixaDePilotagem(rolado, chance) {
  if (rolado === 100) return PILOTAGEM_JP[0];
  if (rolado === 1) return PILOTAGEM_JP[5];
  if (rolado > chance) return rolado > 80 ? PILOTAGEM_JP[1] : PILOTAGEM_JP[2];
  return rolado < 20 ? PILOTAGEM_JP[4] : PILOTAGEM_JP[3];
}

/** T10-6, acertos críticos (1d6). `dobra` é o "dano x2" do livro. */
export const CRITICOS_LIVRO = {
  1: { rotulo: "Área crítica", efeito: "Dano ×2.", dobra: true, chave: null },
  2: { rotulo: "Avaria na propulsão", efeito: "Dano ×2, e a movimentação cai à metade.", dobra: true, chave: "motor" },
  3: { rotulo: "Avaria nas armas", efeito: "Dano ×2, e −5 nos ataques da nave alvo.", dobra: true, chave: "armas" },
  4: { rotulo: "Casco avariado", efeito: "Dano ×2, e −5 no CP.", dobra: true, chave: null },
  5: { rotulo: "Ataque extra", efeito: "Um ataque extra contra outra nave ao alcance.", dobra: false, chave: null },
  6: { rotulo: "Pane geral", efeito: "Pane geral na espaçonave.", dobra: false, chave: null },
};

/** T10-6, falhas críticas (1d6) — o 1 natural, que o Tático não tem. */
export const FALHAS_LIVRO = {
  1: { rotulo: "Armas travadas", efeito: "As armas param de funcionar." },
  2: { rotulo: "Perda de controle momentânea", efeito: "−5 no CP até o próximo turno." },
  3: { rotulo: "Arma danificada", efeito: "Uma arma fica temporariamente danificada." },
  4: { rotulo: "Arma destruída", efeito: "Uma arma fica permanentemente danificada." },
  5: { rotulo: "Fogo amigo", efeito: "O tiro atinge uma nave aliada próxima ao alvo." },
  // O livro manda DUAS coisas aqui, e a segunda faltava: "−10 no CP até o
  // próximo turno E um teste de pilotagem para retomar o controle".
  6: { rotulo: "Perda de controle brusca", efeito: "−10 no CP até o próximo turno, e um teste de pilotagem para retomar o controle." },
};

/**
 * T10-6, ordem de ação: o valor depende da AÇÃO escolhida, e no Space Dragon
 * quem tem o MENOR valor age primeiro.
 */
export const ORDEM_LIVRO = {
  disparo: { rotulo: "Disparo de armas", de: "os dados de dano da arma" },
  equipamento: { rotulo: "Ativar equipamento", de: "o bônus de ataque" },
  evasiva: { rotulo: "Manobra evasiva ou movimento duplo", de: "a jogada de proteção" },
};

/** A manobra evasiva é só de nave pequena, uma vez a cada 5 rodadas. */
export const EVASIVA_INTERVALO = 5;
export const evasivaPermitida = (tipo) => TIPOS[tipo]?.tamanho === "Pequena";


/* As câmaras vivem em camaras.js, que é dado puro e o build também lê. */
export {
  CAMARAS, ESTADOS_DE_CAMARA, camaraOperacional, decidirCamara,
  ETAPAS_DO_SALTO, TRANCA_DO_ARSENAL, REPARO_DE_CAMARA, AVARIA_VIRA_CAMARA,
} from "./camaras.js";
import { CAMARAS, ESTADOS_DE_CAMARA } from "./camaras.js";
/* A T10-1 mora em tipos-de-nave.js, que é dado puro — ver a nota de lá. */
export { TIPOS } from "./tipos-de-nave.js";
import { TIPOS } from "./tipos-de-nave.js";

/* A tripulação (postos com opções, Energia, prazo de avaria, fuga) vive em
 * tripulacao.js, que é dado puro e o build e os testes também leem. */
export {
  ACOES_DE_POSTO, AUTOMATIZA, acaoDoPosto,
  ENERGIA_POR_TAMANHO, DESTINOS_DE_ENERGIA, energiaDoReator, efeitoDaEnergia, energiaGasta,
  PRAZO_DE_AVARIA, prazoDaAvaria,
  MARCAS_DO_PERSEGUIDOR, avancoDoPerseguidor, quemFechaPrimeiro,
  partesDaTripulacao, cpComEnergia, jpComEnergia,
  dadosExtrasDeDano, dadosExtrasDeEsquiva, evasivaBloqueada,
  LIMPA_NO_FIM_DA_RODADA,
} from "./tripulacao.js";

/* Os equipamentos adicionais da T10-4 vivem em equipamentos-nave.js. */
export {
  EQUIPAMENTOS_DE_NAVE, TAMANHOS, cabeNoTamanho, equipamentosDoTamanho,
  efeitosInstalados, conflitosDeTamanho, armasInstaladas, decidirInstalacao,
  FONTES_DE_ENERGIA, DADO_DE_AUTONOMIA, formulaDeGasto, custoDeAbastecimento,
  VEICULOS, PENALIDADE_POR, penalidadeNaJPR,
} from "./equipamentos-nave.js";
import { EQUIPAMENTOS_DE_NAVE, FONTES_DE_ENERGIA } from "./equipamentos-nave.js";

/** Os postos do Modo Tripulação. */
export const POSTOS = {
  leme: { rotulo: "Leme", quem: "Veterano / Contrabandista", acao: "Escolhe e executa a manobra; rola Pilotar em situações-limite." },
  artilharia: { rotulo: "Artilharia", quem: "qualquer", acao: "Faz um ataque (uma arma/arco por artilheiro)." },
  engenharia: { rotulo: "Engenharia", quem: "Técnico", acao: "Remove 1 Sobrecarga extra ou repara (avaria / 1d10 PV)." },
  sensores: { rotulo: "Sensores", quem: "qualquer", acao: "Trava um alvo: +2 no próximo ataque aliado contra ele; informa alcances." },
  comando: { rotulo: "Comando", quem: "Emissário / líder", acao: "Dá a um posto uma ação a mais na rodada, ou concede re-rolar um dado." },
};

export class NaveDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const txt = (initial = "") => new fields.StringField({ required: true, blank: true, initial });
    const num = (initial = 0) => new fields.NumberField({ required: true, integer: true, initial, nullable: false });
    const sim = () => new fields.BooleanField({ initial: false });

    return {
      tipo: new fields.StringField({ required: true, initial: "caca", choices: Object.keys(TIPOS) }),
      ba: num(16),
      cp: num(28),
      jp: num(14),
      velocidade: num(5),
      esquiva: num(3), // dados d6
      // Modificador de Destreza do piloto: entra na Iniciativa (1d20 + DES).
      iniciativa: num(0),

      pv: new fields.SchemaField({
        value: num(0),
        max: num(0),
        formula: txt("1d100"), // fica registrado de onde saiu o máximo
      }),

      sobrecarga: num(0),
      trava: txt(""), // nome do alvo travado pelos Sensores

      // Só no modo Livro (§10.6): a manobra evasiva troca o CP por uma JP
      // durante a rodada. `mod` é o que o teste de pilotagem deu na T10-5, e
      // `rodada` guarda quando foi, para valer o intervalo de 5 rodadas.
      evasiva: new fields.SchemaField({
        ativa: sim(),
        mod: num(0),
        rodada: num(0),
      }),
      avarias: new fields.SchemaField({
        motor: sim(), leme: sim(), armas: sim(), sensores: sim(), tripulacao: sim(),
      }),

      armas: new fields.ArrayField(
        new fields.SchemaField({
          nome: txt("Canhões laser"),
          dano: txt("4d8"),
          arco: new fields.StringField({ required: true, initial: "frontal", choices: ["frontal", "livre"] }),
        }),
        { initial: [] }
      ),

      postos: new fields.SchemaField(Object.fromEntries(Object.keys(POSTOS).map((p) => [p, txt("")]))),

      // ── A TRIPULAÇÃO (SW-SUP-Naves, "A tripulação") ──────────────────────
      //
      // Tudo abaixo é ACRESCENTADO, nunca alterado: uma nave salva antes da
      // 1.16.0 abre com estes campos no padrão e se comporta como antes. Por
      // isso `avarias` continua booleano e o prazo mora num campo paralelo —
      // trocar o tipo de `avarias` quebraria toda ficha já criada.

      // A ação que cada posto escolheu nesta rodada (ACOES_DE_POSTO).
      postoAcao: new fields.SchemaField(
        Object.fromEntries(Object.keys(POSTOS).map((p) => [p, txt("")]))),

      // "Firmar", do Leme: +4 na JP e +2 nos ataques, e a nave não se move.
      firmar: new fields.SchemaField({ ativa: sim(), rodada: num(0) }),

      // Os pontos do reator repartidos nesta rodada. Não acumulam: `rodada`
      // guarda quando foram gastos, e a ficha zera ao virar a rodada.
      energia: new fields.SchemaField({
        motores: num(0), escudos: num(0), armas: num(0), rodada: num(0),
        // os +2 de "Forçar o reator", que valem só nesta rodada
        extra: num(0),
      }),

      // Em que rodada cada avaria surgiu, para o prazo do Controle de Avarias.
      // Zero = sem relógio (fora de combate, ou avaria anterior à camada).
      avariaRodada: new fields.SchemaField({
        motor: num(0), armas: num(0), sensores: num(0),
      }),

      // Penalidade de avaria cancelada pelo Comando ("Aguentem firme").
      aguentem: new fields.SchemaField({ ativa: sim(), rodada: num(0) }),

      // −2 no próximo ataque inimigo (Sensores) e no próximo ataque do alvo
      // (Supressão, gravada na ficha de QUEM levou).
      interferencia: sim(),
      suprimida: new fields.SchemaField({ ativa: sim(), rodada: num(0) }),

      // Fuga: as etapas do salto já feitas, e as marcas do perseguidor.
      fuga: new fields.SchemaField({ etapas: num(0), perseguidor: num(0) }),

      // ── COMBUSTÍVEL (T10-3) ──────────────────────────────────────────────
      //
      // De 0 a 100%, qualquer que seja o número de tanques — é assim no livro.
      // Nasce CHEIO: uma nave recém-criada acabou de sair do hangar, e começar
      // com o tanque vazio seria uma surpresa desagradável no meio da primeira
      // cena. A fonte padrão é o combustível líquido, a mais comum da T10-3.
      combustivel: num(100),
      fonte: new fields.StringField({
        required: true, initial: "liquido", choices: Object.keys(FONTES_DE_ENERGIA),
      }),

      // ── OS EQUIPAMENTOS ADICIONAIS (T10-4) ───────────────────────────────
      //
      // Um booleano por equipamento. O Computador Balístico nasce LIGADO, e os
      // outros desligados: até a 1.17.0 o +2 dele vinha de ter a Ponte de
      // Comando, de graça, e uma nave já criada não pode perder o bônus só
      // porque a regra foi corrigida para o que o livro diz.
      equipamentos: new fields.SchemaField(
        Object.fromEntries(Object.entries(EQUIPAMENTOS_DE_NAVE).map(([k, e]) => [
          k, new fields.BooleanField({ initial: e.padrao === true }),
        ]))),

      // As 12 câmaras da T10-2. Nascem instaladas: é o estado de uma nave que
      // voa, e quem tiver perdido alguma marca na ficha.
      camaras: new fields.SchemaField(Object.fromEntries(Object.keys(CAMARAS).map((c) => [
        c, new fields.StringField({ required: true, initial: "instalada", choices: ESTADOS_DE_CAMARA }),
      ]))),

      // A manobra é escolhida EM SEGREDO e só sai no Mover.
      manobra: new fields.SchemaField({
        tipo: txt(""),
        velocidade: num(0),
        lado: txt(""), // "esq" | "dir" | ""
        revelada: new fields.BooleanField({ initial: false }),
      }),

      descricao: new fields.HTMLField({ initial: "" }),
    };
  }

  prepareDerivedData() {
    this.perfil = TIPOS[this.tipo] ?? TIPOS.caca;
    this.colosso = !!this.perfil.colosso;
    // A avaria de Motor tira 1 de Velocidade até o reparo.
    this.velocidadeEfetiva = Math.max(0, this.velocidade - (this.avarias.motor ? 1 : 0));
  }
}
