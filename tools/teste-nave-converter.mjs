// Teste do conversor de nave: do tipo de ator antigo para personagem.
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// AS CÂMARAS CHEGAM INTEIRAS. Elas são o que a mesa construiu pagando obra em
// jogo — uma Ala Hospitalar custa 120.000 CR e duas semanas de ficção. Perder o
// estado delas numa conversão silenciosa é apagar sessões de jogo, e o erro só
// apareceria quando alguém fosse usar a ala e descobrisse que ela não existe.
//
// A SEGUNDA: o que se PERDE tem de ser dito, nome por nome. O Combate Tático
// some, e isso é decisão da mesa — mas uma conversão que apaga em silêncio é
// pior que nenhuma, porque a mesa descobre a perda sem poder desfazer.
//
// Uso: node tools/teste-nave-converter.mjs

import { converterDados, dadosDoPersonagem } from "../starwars-sd-module/module/nave-converter.js";
import { FLAG } from "../starwars-sd-module/module/nave-pc-dados.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/** Uma nave antiga razoavelmente completa, como a mesa teria. */
const naveAntiga = () => ({
  name: "Falcão de Lata",
  img: "icons/nave.webp",
  system: {
    tipo: "cargueiro", ba: 12, cp: 24, jp: 10, esquiva: 1,
    pv: { value: 340, max: 520, formula: "1d1000" },
    combustivel: 45, fonte: "detritos",
    camaras: {
      ponte: "instalada", maquinas: "danificada", hospital: "instalada",
      laboratorio: "ausente", corredores: "instalada",
    },
    postos: { leme: "Han", artilharia: "Chewie", comando: "  " },
    sobrecarga: 2,
    trava: "TIE Fighter",
    armas: [{ nome: "Disparador laser", arco: "frontal" }, { nome: "Canhão", arco: "livre" }],
    manobra: { escolhida: "curva", revelada: true },
    fuga: { etapas: 1, perseguidor: 2 },
  },
});

/* ── O QUE CHEGA INTEIRO ───────────────────────────────────────────────────── */
{
  const { nave } = converterDados(naveAntiga().system);

  confere(nave.tipo === "cargueiro", `o tipo virou ${nave.tipo}`);
  confere(nave.ba === 12 && nave.cp === 24 && nave.jp === 10, "os números da T10-1 não vieram");
  confere(nave.combustivel === 45, "o tanque não veio");
  confere(nave.fonte === "detritos", "a fonte de energia não veio");

  // ── AS CÂMARAS, QUE É O QUE A MESA PAGOU ──
  confere(nave.camaras.ponte === "instalada", "a Ponte não chegou");
  confere(nave.camaras.maquinas === "danificada",
    "a Sala de Máquinas DANIFICADA chegou como outra coisa — o estrago é informação de jogo");
  confere(nave.camaras.hospital === "instalada",
    "a Ala Hospitalar não chegou: 120.000 CR e duas semanas de ficção apagados em silêncio");
  confere(nave.camaras.laboratorio === "ausente", "o que não existia tem de continuar não existindo");

  // o estado inválido não vira um estado qualquer: ele some, e a câmara cai no
  // padrão de fábrica, que é explícito
  const { nave: comLixo } = converterDados({ camaras: { ponte: "derretida" } });
  confere(comLixo.camaras.ponte === undefined,
    "um estado inválido virou estado válido — melhor cair no padrão do que inventar");

  // ── OS POSTOS ──
  confere(nave.postos.leme === "Han" && nave.postos.artilharia === "Chewie", "os postos ocupados");
  confere(nave.postos.comando === undefined,
    "um posto com só espaços em branco foi convertido como ocupado");
}

/* ── O QUE SE PERDE, DITO NOME POR NOME ────────────────────────────────────── */
{
  const { descartado } = converterDados(naveAntiga().system);

  confere(descartado.length > 0, "a conversão não avisou nada do que descartou");
  const tudo = descartado.join(" | ");
  confere(/manobra/i.test(tudo), "a manobra planejada some e não foi avisada");
  confere(/sobrecarga/i.test(tudo), "a sobrecarga some e não foi avisada");
  confere(/alvo travado|Sensores/i.test(tudo), "o alvo travado some e não foi avisado");
  confere(/fuga/i.test(tudo), "o relógio de fuga some e não foi avisado");
  confere(/2 arma/.test(tudo),
    `as armas montadas somem e o aviso precisa dizer QUANTAS, veio "${tudo}"`);

  // uma nave sem nada do tático não gera aviso falso: avisar perda que não
  // houve ensina a mesa a ignorar os avisos
  const limpa = converterDados({ tipo: "caca", camaras: { ponte: "instalada" } });
  confere(limpa.descartado.length === 0,
    `nave sem dados do tático acusou perdas: ${limpa.descartado.join(", ")}`);
}

/* ── O ATOR NOVO ───────────────────────────────────────────────────────────── */
{
  const { dados } = dadosDoPersonagem(naveAntiga());

  confere(dados.type === "character", `o ator novo é ${dados.type}, devia ser character`);
  confere(dados.name === "Falcão de Lata", "o nome não veio");
  confere(dados.img === "icons/nave.webp", "a imagem não veio");

  // os PV vêm ROLADOS do schema antigo: rolar de novo daria outra nave, e esta
  // já voou — o 1d1000 dela saiu uma vez e virou história
  confere(dados.system.hp.value === 340 && dados.system.hp.max === 520,
    `os PV deviam vir como estavam (340/520), veio ${JSON.stringify(dados.system.hp)}`);

  confere(dados.flags["starwars-sd"][FLAG]?.tipo === "cargueiro",
    "a flag da nave não foi montada no caminho certo");

  // a ficha certa, já selecionada: converter e abrir a ficha padrão faria a
  // mesa achar que a conversão não funcionou
  confere(dados["flags.core.sheetClass"] === "starwars-sd.NaveSheet",
    `o ator novo abriria com ${dados["flags.core.sheetClass"]} — tem de abrir na Ficha de Nave`);

  // nada quebra com um ator vazio
  const vazio = dadosDoPersonagem({});
  confere(vazio.dados.type === "character", "ator vazio não pode quebrar a conversão");
  confere(vazio.dados.system.hp.max === 0, "sem PV, zero — e não undefined");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ conversor de nave: as câmaras chegam com o estado que a mesa pagou (inclusive a " +
    "danificada), os postos ocupados, os PV já rolados, a Ficha de Nave já selecionada — " +
    "e o que o Tático leva embora dito nome por nome, sem avisar perda que não houve"
);
