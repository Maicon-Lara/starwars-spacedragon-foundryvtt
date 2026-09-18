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

/** 1 hex = 20 m. A cena de combate de naves precisa estar nessa escala. */
export const METROS_POR_HEX = 20;

/**
 * Os oito tipos da Tabela 10-1, com a Velocidade (hexes) e a Esquiva (d6) do
 * Suplemento. `colosso` marca quem só faz Reta, Inclinada e Parar.
 */
export const TIPOS = {
  caca: { rotulo: "Caça", tamanho: "Pequena", tripulacao: "1", pv: "1d100", ba: 16, cp: 28, jp: 14, mov: "150 m", velocidade: 5, esquiva: 3, arcoLivre: false },
  escolta: { rotulo: "Escolta", tamanho: "Pequena", tripulacao: "1 a 4", pv: "2d100", ba: 12, cp: 28, jp: 14, mov: "120 m", velocidade: 4, esquiva: 3, arcoLivre: false },
  capsula: { rotulo: "Cápsula", tamanho: "Pequena", tripulacao: "1 a 4", pv: "1d100", ba: 10, cp: 28, jp: 16, mov: "120 m", velocidade: 4, esquiva: 3, arcoLivre: false },
  particular: { rotulo: "Espaçonave particular", tamanho: "Média", tripulacao: "1 a 10", pv: "3d100", ba: 12, cp: 26, jp: 16, mov: "100 m", velocidade: 3, esquiva: 2, arcoLivre: true },
  cargueiro: { rotulo: "Cargueiro", tamanho: "Gigantesca", tripulacao: "50+", pv: "1d1000", ba: 12, cp: 24, jp: 10, mov: "40 m", velocidade: 2, esquiva: 1, arcoLivre: true },
  transuniversal: { rotulo: "Transuniversal", tamanho: "Gigantesca", tripulacao: "100+", pv: "1d1000", ba: 10, cp: 24, jp: 10, mov: "40 m", velocidade: 2, esquiva: 1, arcoLivre: true },
  cruzador: { rotulo: "Cruzador", tamanho: "Colossal", tripulacao: "100+", pv: "2d1000", ba: 18, cp: 30, jp: 12, mov: "20 m", velocidade: 1, esquiva: 0, arcoLivre: true, colosso: true },
  naveMae: { rotulo: "Nave-mãe", tamanho: "Colossal", tripulacao: "1.000+", pv: "3d1000", ba: 12, cp: 20, jp: 12, mov: "20 m", velocidade: 1, esquiva: 0, arcoLivre: true, colosso: true },
};

/**
 * O Dial de Manobras do Suplemento.
 *
 *   `cor`     verde tira 1 Sobrecarga; vermelha põe 1 e é proibida a quem já
 *             tem Sobrecarga; branca não mexe.
 *   `giro`    em graus, DEPOIS de andar — todas as manobras do Suplemento
 *             andam primeiro e viram ao terminar.
 *   `lado`    as que existem para a esquerda e para a direita.
 *   `passos`  como se conta a distância: "1aV" (de 1 à Velocidade), "metade"
 *             (metade da Velocidade, arredondada para baixo, mínimo 1), "0" ou
 *             "re" (1 hex para trás, mantendo a frente).
 */
export const MANOBRAS = {
  reta: { rotulo: "Reta", simbolo: "↑", cor: "verde", giro: 0, passos: "1aV" },
  inclinada: { rotulo: "Inclinada", simbolo: "↗", cor: "branca", giro: 60, lado: true, passos: "1aV" },
  curva: { rotulo: "Curva fechada", simbolo: "⟳", cor: "vermelha", giro: 120, lado: true, passos: "metade" },
  koiogran: { rotulo: "Koiogran", simbolo: "↑↓", cor: "vermelha", giro: 180, passos: "1aV" },
  parar: { rotulo: "Parar", simbolo: "⊘", cor: "branca", giro: 0, passos: "0" },
  re: { rotulo: "Ré", simbolo: "↓", cor: "vermelha", giro: 0, passos: "re" },
};

/** Os colossos só fazem estas. */
export const MANOBRAS_DE_COLOSSO = ["reta", "inclinada", "parar"];

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
