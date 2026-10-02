// Teste dos equipamentos adicionais de nave (T10-4), sem Foundry.
//
// ── O QUE ESTE TESTE PROTEGE ────────────────────────────────────────────────
//
// A matriz de tamanhos é REGRA, e é a parte que some sem fazer barulho: se ela
// se perder, a ficha passa a oferecer acelerador hiperespacial num caça e
// defletor de raios num Destróier, e ninguém percebe até alguém conferir a
// tabela. As asserções abaixo trancam as linhas da T10-4 uma a uma.
//
// E tranca a correção que motivou tudo: o +2 do Computador Balístico era efeito
// da Ponte de Comando, de graça em toda nave. Virou instalação, como no livro —
// mas nasce LIGADO, para que uma nave já criada não perca o bônus.
//
// Uso: node tools/teste-equipamentos-nave.mjs

import {
  EQUIPAMENTOS_DE_NAVE, TAMANHOS, cabeNoTamanho, equipamentosDoTamanho,
  efeitosInstalados, conflitosDeTamanho, armasInstaladas,
  FONTES_DE_ENERGIA, DADO_DE_AUTONOMIA, formulaDeGasto, custoDeAbastecimento,
  VEICULOS, penalidadeNaJPR,
} from "../starwars-sd-module/module/equipamentos-nave.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

// ── A TABELA, LINHA A LINHA ────────────────────────────────────────────────
//
// Transcrita do livro: para cada equipamento, os quatro tamanhos em que ele
// cabe. É a cópia de controle — se o dado divergir dela, um dos dois está
// errado, e o teste força a conferência.
const T10_4 = {
  acelerador: ["Média", "Gigantesca"],
  blindagem: ["Pequena", "Média", "Gigantesca", "Colossal"],
  braco: ["Pequena", "Média", "Gigantesca", "Colossal"],
  acoplagem: ["Média", "Gigantesca"],
  gancho: ["Pequena", "Média"],
  solares: ["Média"],
  pilotoAutomatico: ["Média", "Gigantesca", "Colossal"],
  propulsores: ["Pequena", "Média"],
  disparadores: ["Pequena", "Média", "Gigantesca", "Colossal"],
  canhoes: ["Gigantesca", "Colossal"],
  metralhadora: ["Média", "Gigantesca", "Colossal"],
  misseis: ["Média", "Gigantesca", "Colossal"],
  balistico: ["Pequena", "Média", "Gigantesca", "Colossal"],
  defletores: ["Pequena", "Média"],
  escudo: ["Média", "Gigantesca", "Colossal"],
};

confere(Object.keys(EQUIPAMENTOS_DE_NAVE).length === Object.keys(T10_4).length,
  `${Object.keys(EQUIPAMENTOS_DE_NAVE).length} equipamentos, a T10-4 tem ${Object.keys(T10_4).length}`);

for (const [chave, cabeEm] of Object.entries(T10_4)) {
  const e = EQUIPAMENTOS_DE_NAVE[chave];
  confere(e, `falta o equipamento ${chave}`);
  if (!e) continue;
  for (const t of TAMANHOS) {
    const esperado = cabeEm.includes(t);
    confere(cabeNoTamanho(chave, t) === esperado,
      `${e.rotulo} em nave ${t}: a T10-4 diz ${esperado ? "✓" : "✗"}, o dado diz ${cabeNoTamanho(chave, t) ? "✓" : "✗"}`);
  }
  confere(typeof e.nota === "string" && e.nota.length > 20,
    `${chave} sem a nota do livro`);
  confere(["utilitario", "combate"].includes(e.grupo),
    `${chave} sem grupo (utilitário ou combate)`);
}

// as três restrições que mais mudam a mesa, nomeadas
confere(!cabeNoTamanho("acelerador", "Pequena"),
  "um caça NÃO pode ter acelerador hiperespacial — é o que o impede de saltar");
confere(!cabeNoTamanho("acelerador", "Colossal"), "nem um colosso");
confere(!cabeNoTamanho("escudo", "Pequena"), "um caça não leva Escudo de Força");
confere(!cabeNoTamanho("defletores", "Colossal"), "um colosso não leva defletor de raios");

// ── A LISTA QUE A FICHA OFERECE ────────────────────────────────────────────
const noCaca = equipamentosDoTamanho("Pequena").map((e) => e.chave);
confere(!noCaca.includes("acelerador"), "a ficha do caça não pode oferecer acelerador");
confere(noCaca.includes("disparadores"), "o caça leva disparadores laser");
confere(noCaca.includes("balistico"), "o computador balístico cabe em qualquer tamanho");
const noColosso = equipamentosDoTamanho("Colossal").map((e) => e.chave);
confere(noColosso.includes("canhoes"), "o colosso leva canhões de energia");
confere(!noColosso.includes("propulsores"), "o colosso não leva propulsores a jato");

// ── OS EFEITOS ─────────────────────────────────────────────────────────────
const nada = efeitosInstalados({}, "Média");
confere(nada.ataque === 0 && nada.cp === 0 && !nada.podeSaltar,
  "sem equipamento, nenhum efeito");
confere(nada.multiplicadorDeMovimento === 1, "sem propulsores, o movimento é o da tabela");

const completa = efeitosInstalados(
  { balistico: true, escudo: true, propulsores: true, acelerador: true, pilotoAutomatico: true, defletores: true },
  "Média");
confere(completa.ataque === 2, `o Computador Balístico devia dar +2, deu ${completa.ataque}`);
confere(completa.cp === 10, `o Escudo de Força devia dar +10 no CP, deu ${completa.cp}`);
confere(completa.multiplicadorDeMovimento === 1.5, "propulsores: +50% de movimento");
confere(completa.podeSaltar === true, "com acelerador, a nave salta");
confere(completa.pilotagemAutomatica === true, "o piloto automático entra");
confere(completa.redirecionaRaios === 25, "defletores: 25%");

// o que não cabe no tamanho NÃO vale, mesmo marcado
const emCaca = efeitosInstalados({ escudo: true, acelerador: true, propulsores: true }, "Pequena");
confere(emCaca.cp === 0, "o Escudo de Força marcado num caça não dá CP: a T10-4 não o admite");
confere(emCaca.podeSaltar === false, "nem o acelerador faz um caça saltar");
confere(emCaca.multiplicadorDeMovimento === 1.5, "mas os propulsores cabem no caça e valem");

// ── O CONFLITO FICA VISÍVEL ────────────────────────────────────────────────
//
// Marca que não cabe não é apagada em silêncio: a nave pode ter mudado de tipo
// depois de equipada, e quem for conferir precisa ver o conflito.
const conflitos = conflitosDeTamanho({ escudo: true, acelerador: true, balistico: true }, "Pequena");
confere(conflitos.length === 2, `esperava 2 conflitos num caça, veio ${conflitos.length}`);
confere(conflitos.every((c) => c.rotulo), "o conflito precisa do rótulo para a ficha mostrar");
confere(!conflitos.some((c) => c.chave === "balistico"),
  "o computador balístico cabe no caça e não é conflito");

// ── O COMPUTADOR BALÍSTICO NASCE LIGADO ────────────────────────────────────
//
// Era efeito da Ponte, de graça em toda nave. Virou instalação; se nascesse
// desligado, toda nave já criada perderia o +2 numa atualização.
confere(EQUIPAMENTOS_DE_NAVE.balistico.padrao === true,
  "o Computador Balístico tem de nascer instalado, senão as naves existentes perdem o +2");
for (const [k, e] of Object.entries(EQUIPAMENTOS_DE_NAVE)) {
  if (k === "balistico") continue;
  confere(e.padrao !== true, `${k} não devia nascer instalado`);
}

// ── AS ARMAS PRONTAS ───────────────────────────────────────────────────────
const armas = armasInstaladas({ disparadores: true, metralhadora: true, misseis: true }, "Média");
confere(armas.length === 3, `esperava 3 armas, veio ${armas.length}`);
const disp = armas.find((a) => a.nome.includes("Disparadores"));
confere(disp?.dano === "2d10", `disparadores laser: 2d10, veio ${disp?.dano}`);
const metr = armas.find((a) => a.nome.includes("Metralhadora"));
confere(metr?.dano === "1d10" && metr?.ataques === 4,
  "a metralhadora são 4 ataques de 1d10, e não um de 4d10");
const mis = armas.find((a) => a.nome.includes("Mísseis"));
confere(mis?.dano === "4d10", "mísseis teleguiados: 4d10");
// e no caça só sai o que cabe
confere(armasInstaladas({ canhoes: true, disparadores: true }, "Pequena").length === 1,
  "no caça, os canhões de energia não entram");

// ── FONTES DE ENERGIA E COMBUSTÍVEL (T10-3) ───────────────────────────────
//
// A régua do livro tem duas peças: a AUTONOMIA escolhe o dado, a AÇÃO escolhe
// quantos. Trocar uma pela outra é o erro fácil, e muda o consumo da campanha.
confere(Object.keys(FONTES_DE_ENERGIA).length === 4, "a T10-3 tem quatro fontes");
confere(DADO_DE_AUTONOMIA.Baixa === 6, "autonomia baixa gasta d6 — o pior dado");
confere(DADO_DE_AUTONOMIA["Média"] === 4, "autonomia média, d4");
confere(DADO_DE_AUTONOMIA.Alta === 2, "autonomia alta, d2 — o melhor");
// quanto MAIOR a autonomia, MENOR o dado: é a direção que o livro dá, e
// invertê-la faria o reator atômico gastar mais que a queima de lixo
confere(DADO_DE_AUTONOMIA.Alta < DADO_DE_AUTONOMIA["Média"], "alta gasta menos que média");
confere(DADO_DE_AUTONOMIA["Média"] < DADO_DE_AUTONOMIA.Baixa, "média gasta menos que baixa");

// o exemplo do próprio livro: particular com combustível líquido, salto gasto 2
confere(formulaDeGasto("liquido", 2) === "2d4",
  `o exemplo do livro é 2d4, veio ${formulaDeGasto("liquido", 2)}`);
confere(formulaDeGasto("atomico", 1) === "1d2", "reator atômico, gasto 1: 1d2");
confere(formulaDeGasto("detritos", 3) === "3d6", "detritos, gasto 3: 3d6");
// o gasto é de 1 a 3, e valor fora disso não vira fórmula maluca
confere(formulaDeGasto("liquido", 9) === "3d4", "gasto acima de 3 trava em 3");
confere(formulaDeGasto("liquido", 0) === "1d4", "gasto abaixo de 1 trava em 1");

// o custo é POR PONTO PERCENTUAL: encher 100 custa cem vezes
confere(custoDeAbastecimento("liquido", "Média", 1) === 1000, "1% de uma média: 1.000");
confere(custoDeAbastecimento("liquido", "Média", 100) === 100000, "encher uma média: 100.000");
confere(custoDeAbastecimento("detritos", "Pequena", 100) === 5000,
  "detritos é a fonte barata: 5.000 para encher um caça");
// painéis solares não se abastecem — é sol, não combustível
confere(custoDeAbastecimento("solar", "Média", 100) === null,
  "painéis termoenergéticos não têm preço de abastecimento");

// ── VEÍCULOS (T10-7) ──────────────────────────────────────────────────────
confere(Object.keys(VEICULOS).length === 8, `a T10-7 tem 8 veículos, há ${Object.keys(VEICULOS).length}`);
// a escala de tamanho é OUTRA: misturá-la com a das naves daria equipamento de
// cruzador a um tanque de guerra
const tamanhosDeVeiculo = new Set(Object.values(VEICULOS).map((v) => v.tamanho));
for (const t of tamanhosDeVeiculo) {
  confere(["Pequeno", "Médio", "Grande", "Enorme"].includes(t),
    `tamanho de veículo fora da T10-7: ${t}`);
  confere(!TAMANHOS.includes(t),
    `${t} é tamanho de NAVE, e a T10-7 usa outra escala`);
}
// o tanque de guerra é o mais perigoso da tabela — mais BA que um cruzador
confere(VEICULOS.tanque.ba === 20, "o tanque de guerra tem BA +20");
confere(VEICULOS.tanque.cp === 30, "e CP 30");
confere(Math.max(...Object.values(VEICULOS).map((v) => v.ba)) === VEICULOS.tanque.ba,
  "nenhum veículo bate o tanque em BA");
// o aeroplano é o mais rápido
confere(VEICULOS.aeroplano.mov === "120 m", "o aeroplano anda 120 m");

// ── QUANDO A NAVE ATIRA EM GENTE ──────────────────────────────────────────
//
// A cada 20 pontos no ataque, −2 na JPR. É a régua que faz a torre do AT-AT ser
// aterrorizante sem ser instantânea.
confere(penalidadeNaJPR(37) === -2, `37 devia dar −2, deu ${penalidadeNaJPR(37)}`);
confere(penalidadeNaJPR(41) === -4, `41 devia dar −4, deu ${penalidadeNaJPR(41)}`);
confere(penalidadeNaJPR(19) === 0, "abaixo de 20 não há penalidade");
confere(penalidadeNaJPR(20) === -2, "exatamente 20 já dá −2");
confere(penalidadeNaJPR(0) === 0 && penalidadeNaJPR(-5) === 0,
  "resultado nulo ou negativo não vira bônus para o alvo");

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ naves: a matriz da T10-4 linha a linha, o conflito visível, as armas prontas, " +
    "o balístico instalado, as 4 fontes de energia (autonomia → dado), os 8 veículos " +
    "na escala própria, e os −2 por 20 pontos da arma montada"
);
