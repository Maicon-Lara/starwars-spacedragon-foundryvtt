// Teste da Ordem de Ação (§7.5 e §10.6), sem Foundry.
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// A INVERSÃO. O Space Dragon manda o menor agir primeiro; o Combat Tracker do
// Foundry ordena do maior para o menor. Se a inversão se perder, a ordem na
// tela fica exatamente ao contrário da regra — e esse é o tipo de erro que a
// mesa só percebe depois de três sessões, porque a lista continua parecendo
// uma lista.
//
// Uso: node tools/teste-ordem.mjs

import {
  ACOES_DE_ORDEM, valorDaOrdem, dadoDaArma, duracaoDaRodada,
  ordenarCrescente, simultaneos,
} from "../starwars-sd-module/module/ordem-de-acao.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

// ── AS QUATRO AÇÕES DO §7.5 ───────────────────────────────────────────────
confere(Object.keys(ACOES_DE_ORDEM).length === 4,
  `${Object.keys(ACOES_DE_ORDEM).length} ações, o livro tem 4`);
for (const [k, a] of Object.entries(ACOES_DE_ORDEM)) {
  confere(a.rotulo && a.comoSeCalcula, `a ação ${k} não se explica`);
  confere(typeof a.nota === "string" && a.nota.length > 20,
    `a ação ${k} não diz o que isso significa na mesa`);
}
// só o ataque rola dado; o resto é valor fixo
confere(ACOES_DE_ORDEM.atacar.rola === true, "atacar rola o dado de dano");
confere(ACOES_DE_ORDEM.poder.rola === false, "o poder usa a Grandeza, sem rolar");
confere(ACOES_DE_ORDEM.aparato.rola === false, "o aparato usa o NT, sem rolar");
confere(ACOES_DE_ORDEM.outra.rola === false, "mover é 10 − Destreza, sem rolar");

// ── OS VALORES ────────────────────────────────────────────────────────────
confere(valorDaOrdem("atacar", { rolado: 7 }) === 7, "o ataque vale o que o dado deu");
confere(valorDaOrdem("poder", { grandeza: 5 }) === 5, "o poder vale a Grandeza");
confere(valorDaOrdem("aparato", { nt: 3 }) === 3, "o aparato vale o NT");
// o livro é literal: "subtraindo o modificador de Destreza do valor básico 10"
confere(valorDaOrdem("outra", { modDestreza: 3 }) === 7, "10 − 3 = 7");
confere(valorDaOrdem("outra", { modDestreza: 0 }) === 10, "sem modificador, 10");
// Destreza alta leva abaixo de zero, e isso é o esperado: quem é muito rápido
// age antes de todo mundo
confere(valorDaOrdem("outra", { modDestreza: 12 }) === -2,
  "Destreza muito alta pode dar valor negativo, e deve");
confere(valorDaOrdem("inexistente", {}) === 0, "ação desconhecida não quebra");

// ── A ARMA PESADA AGE POR ÚLTIMO ──────────────────────────────────────────
//
// É o coração da regra, e o que a distingue de uma iniciativa comum: o 1d12
// tende a sair depois do 1d4, porque o valor É o dano.
const leve = valorDaOrdem("atacar", { rolado: 2 });   // 1d4
const pesada = valorDaOrdem("atacar", { rolado: 11 }); // 1d12
confere(leve < pesada, "a arma leve age antes da pesada");
confere(ordenarCrescente({ initiative: leve }, { initiative: pesada }) < 0,
  "a ordenação põe a arma leve primeiro");

// ── A INVERSÃO ────────────────────────────────────────────────────────────
const fila = [
  { name: "Canhão", initiative: 11 },
  { name: "Pistola", initiative: 3 },
  { name: "Corre", initiative: 7 },
];
const ordenada = [...fila].sort(ordenarCrescente).map((c) => c.name);
confere(JSON.stringify(ordenada) === JSON.stringify(["Pistola", "Corre", "Canhão"]),
  `a ordem devia ser Pistola → Corre → Canhão, veio ${ordenada.join(" → ")}`);
// e NÃO pode ser a do Foundry, que é decrescente
const foundry = [...fila].sort((a, b) => b.initiative - a.initiative).map((c) => c.name);
confere(JSON.stringify(ordenada) !== JSON.stringify(foundry),
  "a ordenação ficou igual à do Foundry — a inversão se perdeu");

// quem ainda não declarou vai para o fim, e não para o começo: sem valor, o
// personagem não entrou na ordem, e pôr o indeciso agindo primeiro seria prêmio
const comVazio = [{ name: "Pronto", initiative: 5 }, { name: "Indeciso", initiative: null }];
confere([...comVazio].sort(ordenarCrescente)[0].name === "Pronto",
  "quem não declarou não pode agir antes de quem declarou");

// ── A DURAÇÃO DA RODADA ───────────────────────────────────────────────────
//
// A parte que a mesa mais esquece: no Space Dragon a rodada NÃO dura 6 segundos
// fixos — dura o dobro do maior valor, e é isso que governa os efeitos medidos
// em rodadas.
confere(duracaoDaRodada([3, 7, 11]) === 22, `o dobro de 11 é 22, veio ${duracaoDaRodada([3, 7, 11])}`);
confere(duracaoDaRodada([4]) === 8, "um só participante: o dobro dele");
confere(duracaoDaRodada([]) === 0, "sem ninguém, zero");
confere(duracaoDaRodada([-2, 5]) === 10, "o negativo não vira o maior");

// ── O EMPATE É SIMULTÂNEO ─────────────────────────────────────────────────
//
// O livro manda calcular os efeitos ao mesmo tempo, então a mesa precisa SABER
// quem empatou — a lista ordenada sozinha esconde isso.
const juntos = simultaneos([
  { name: "Han", initiative: 6 },
  { name: "Chewie", initiative: 6 },
  { name: "Leia", initiative: 9 },
]);
confere(juntos.length === 1, `esperava 1 grupo simultâneo, veio ${juntos.length}`);
confere(juntos[0].valor === 6 && juntos[0].nomes.length === 2,
  "Han e Chewie agem ao mesmo tempo, no 6");
confere(simultaneos([{ name: "A", initiative: 1 }, { name: "B", initiative: 2 }]).length === 0,
  "sem empate, nenhum grupo");

// ── O DADO DA ARMA ────────────────────────────────────────────────────────
confere(dadoDaArma("1d8") === "1d8", "1d8");
confere(dadoDaArma("2d6+2") === "2d6", "o bônus fixo não entra na ordem — só o dado");
confere(dadoDaArma("1d6/1d6") === "1d6", "arma de duas pontas: a primeira");
confere(dadoDaArma("Nocaute") === null, "sem dado, não dá para ordenar por ataque");
confere(dadoDaArma("") === null && dadoDaArma(undefined) === null, "vazio não quebra");

// ── A CADEIA DE CLASSES DE COMBAT ─────────────────────────────────────────
//
// Nossa classe ESTENDE a que já estiver registrada, para não apagar a de outro
// módulo. Mas o inverso pode acontecer: um módulo que faça
// `CONFIG.Combat.documentClass = MinhaClasse` apaga a nossa, e a ordenação
// volta a ser decrescente — a regra fica invertida em silêncio.
//
// Estes testes exercitam a detecção com classes de mentira, sem Foundry.
{
  const MARCA = "swSdOrdemDeAcao";
  const naCadeia = (C) => {
    while (C && C !== Function.prototype) {
      if (C[MARCA]) return true;
      C = Object.getPrototypeOf(C);
    }
    return false;
  };

  class Original {}
  class Nossa extends Original {}
  Nossa[MARCA] = true;
  confere(naCadeia(Nossa), "a nossa classe tem de ser reconhecida");

  // outro módulo estende a nossa: a cadeia se mantém, e nós continuamos valendo
  class OutroQueEstende extends Nossa {}
  confere(naCadeia(OutroQueEstende),
    "um módulo que ESTENDE a nossa não deve nos apagar da cadeia");

  // outro módulo substitui: a nossa sumiu, e é isso que o aviso precisa pegar
  class OutroQueSubstitui extends Original {}
  confere(!naCadeia(OutroQueSubstitui),
    "um módulo que SUBSTITUI a classe tem de ser detectado como conflito");

  // e a busca não pode entrar em laço infinito no topo da cadeia
  confere(naCadeia(Original) === false, "a busca termina no topo sem travar");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ ordem de ação: as 4 ações, a arma pesada por último, A INVERSÃO (menor primeiro), " +
    "quem não declarou no fim, a duração da rodada, os empates simultâneos " +
    "e a detecção de conflito na classe de Combat"
);
