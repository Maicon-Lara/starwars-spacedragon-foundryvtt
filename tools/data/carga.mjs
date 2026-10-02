// A carga dos itens, para o limite que o personagem consegue levar.
//
// ── O PROBLEMA QUE ISTO RESOLVE ─────────────────────────────────────────────
//
// O sistema `olddragon2e` tem DOIS campos de peso no item:
//
//   weight_in_grams   o peso real, em gramas
//   weight_in_load    a CARGA — o que entra no limite do personagem
//
// Até aqui o build preenchia só o primeiro, e `weight_in_load` saía ZERO nos
// 146 itens. O efeito na mesa é silencioso e total: nenhum personagem fica
// sobrecarregado, porque tudo o que ele carrega pesa zero no limite.
//
// ── POR QUE NÃO BASTA CONVERTER O PESO ──────────────────────────────────────
//
// Porque não é a mesma grandeza. No Space Dragon a carga é PESO: os limites
// leve, média e pesada vêm da Força (T1-1), e passar de cada um tira 1 m, 2 m
// e depois todo o deslocamento (§6.3.3). No Old Dragon 2 a carga é um número
// de ESPAÇOS, e é por isso que o guia de conversão de Francisco Martellini traz
// uma tabela só para ela — a **Tabela 5-1**, que é a fonte deste arquivo:
//
//   Todas as Armas Pequenas ......... 1
//   Todas as Armas Médias ........... 2
//   Todas as Armas Grandes .......... 3
//   Vestes Leves .................... 1
//   Vestes Médias ................... 2
//   Traje de Combate ................ 3
//   Armadura Defletora .............. 3
//   Trajes Aquáticos e Espaciais .... 3
//   Munições ........................ não agregam valor de carga
//   Anel de Laser, Potencializador,
//     Escudo de Energia ............. muito leve para ser considerado
//   Roupas Comuns ................... manter a mesma carga do Space Dragon
//
// ── O PORTE, QUE O LIVRO TEM E O COFRE NÃO ──────────────────────────────────
//
// A Tabela 5-1 classifica por PORTE (P, M, G), que o Space Dragon define em
// §5: pequena se cabe numa mão, média se prefere duas, grande se exige duas.
// As tabelas do cofre não trouxeram essa coluna — elas têm o peso em quilos.
//
// E a tabela de armas do livro NÃO É EXTRAÍVEL: tanto a transcrição quanto o
// DOCX devolvem só sete linhas, porque o livro a diagrama em caixas de texto.
// É o mesmo problema que a T10-5 teve.
//
// Então o porte é DERIVADO do peso, com a régua abaixo — calibrada nas sete
// armas que o livro entrega com as duas informações:
//
//   Zarabatana ........ P ... 0,5 kg
//   Porrete ........... M ... 1 kg
//   Rifle laser ....... M ... 2 kg
//   Rifle de plasma ... M ... 4 kg
//   Rifle de projéteis  M ... 4 kg
//
// A régua acerta esses cinco. Ela é uma APROXIMAÇÃO declarada, e não a tabela
// do livro: onde a mesa discordar, o valor certo é o do livro, e a correção é
// acrescentar o item a PORTE_À_MÃO, abaixo.

/** Os limites da régua, em quilos. Ver a calibração no cabeçalho. */
export const FAIXAS_DE_PORTE = [
  { ate: 0.2, porte: "–", carga: 0 },   // muito leve para o limite de carga
  { ate: 0.5, porte: "P", carga: 1 },
  { ate: 4.0, porte: "M", carga: 2 },
  { ate: Infinity, porte: "G", carga: 3 },
];

/**
 * O que a Tabela 5-1 nomeia, e por isso não passa pela régua.
 *
 * As chaves são comparadas sem acento e em minúsculas, por prefixo: "vestes
 * leves" pega "Vestes Leves (modelo imperial)".
 */
export const PORTE_A_MAO = {
  // vestes, pelo nome — a tabela as lista uma a uma
  "vestes leves": 1,
  "vestes medias": 2,
  "traje de combate": 3,
  "armadura defletora": 3,
  "traje aquatico": 3,
  "trajes aquaticos": 3,
  "traje espacial": 3,
  "trajes espaciais": 3,
  // "muito leve para ser considerado no limite de carga"
  "anel de laser": 0,
  "potencializador": 0,
  "escudo de energia": 0,
  // munições não agregam carga
  "projeteis": 0,
  "projeteis explosivos": 0,
  "flecha": 0,
  "dardo": 0,
  "dardo para zarabatana": 0,
  "missil": 0,
  "carga de energia": 0,
  "celula de energia": 0,
  "bateria": 0,
};

/**
 * O peso do cofre, em número.
 *
 * As tabelas do cofre escrevem o decimal com VÍRGULA — "0,5", "1,5" — e um
 * `Number("0,5")` devolve NaN, que virava zero e dava carga 0 a toda arma
 * pequena. A função `gramas`, em equipamentos.mjs, já tratava isso; esta não,
 * e o sintoma era não existir UM ÚNICO item com carga 1.
 */
const emKg = (v) => {
  const n = Number(String(v ?? "").replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

const semAcento = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/**
 * A carga de um item, em espaços do Old Dragon 2.
 *
 * `nome` decide primeiro, porque a Tabela 5-1 nomeia casos que a régua erraria
 * — um Escudo de Energia pesa pouco mas não é "arma pequena", e uma munição
 * não agrega carga por mais que pese.
 */
export function cargaDoItem(nome, pesoEmKg) {
  const n = semAcento(nome);
  for (const [chave, carga] of Object.entries(PORTE_A_MAO)) {
    if (n === chave || n.startsWith(chave + " ") || n.startsWith(chave + ",")) {
      return carga;
    }
  }
  const kg = emKg(pesoEmKg);
  if (!kg) return 0;
  return FAIXAS_DE_PORTE.find((f) => kg <= f.ate).carga;
}

/** O porte (P/M/G) que a régua atribui — para explicar a conta na descrição. */
export function porteDoItem(pesoEmKg) {
  const kg = emKg(pesoEmKg);
  if (!kg) return "–";
  return FAIXAS_DE_PORTE.find((f) => kg <= f.ate).porte;
}
