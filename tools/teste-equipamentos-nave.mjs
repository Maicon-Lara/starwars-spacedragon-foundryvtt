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

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ equipamentos de nave: a matriz da T10-4 linha a linha, o que não cabe não vale," +
    " o conflito visível, as armas prontas, e o balístico nascendo instalado"
);
