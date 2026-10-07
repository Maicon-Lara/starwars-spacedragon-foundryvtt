// Teste do Painel de Voo: a penalidade por avaria, a T10-5 e o combustível.
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// O EXEMPLO DO LIVRO, verbatim: «nave de 200 PV com 70 de dano perdeu 35% →
// −15%». Trinta e cinco por cento são TRÊS blocos de dez, não três e meio. Se a
// conta arredondasse para cima daria −20%, e cada arranhão ficaria mais caro do
// que o livro escreveu — num número que a mesa usa toda vez que a nave leva
// dano, e que ninguém confere no meio do combate.
//
// Uso: node tools/teste-nave-voo.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  penalidadeDeAvaria, pilotagemEfetiva,
  modificadorDaJP, JP_MODIFICADORES,
  DADO_DE_AUTONOMIA, FONTES_DE_ENERGIA, CUSTOS, formulaDeGasto, custoDeAbastecimento,
  linhasDoVoo,
} from "../starwars-sd-module/module/nave-voo.js";

const RAIZ = path.resolve(fileURLToPath(import.meta.url), "../..");

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── A PENALIDADE POR AVARIA (§2) ──────────────────────────────────────────── */
{
  // O exemplo do livro, letra por letra.
  confere(penalidadeDeAvaria(130, 200) === 15,
    `o exemplo do livro: 200 PV com 70 de dano → −15%, veio ${penalidadeDeAvaria(130, 200)}%`);

  confere(penalidadeDeAvaria(200, 200) === 0, "nave inteira não tem penalidade");
  confere(penalidadeDeAvaria(190, 200) === 0,
    "5% de dano ainda não fecha o primeiro bloco de 10% — a conta desce, não sobe");
  confere(penalidadeDeAvaria(180, 200) === 5, "10% de dano = −5%");
  confere(penalidadeDeAvaria(100, 200) === 25, "metade dos PV = −25%");

  // ── O TETO, PROVADO COMO PROPRIEDADE ─────────────────────────────────────
  //
  // A primeira versão disto afirmava `penalidadeDeAvaria(0, 200) === 50`, e
  // passava verde mesmo com o `Math.min(50, …)` REMOVIDO do código — porque com
  // o PV preso à faixa o teto é aritmeticamente inalcançável. Uma asserção que
  // não pode falhar dá confiança falsa.
  //
  // Então o que se prova é a propriedade: varrendo todos os PV possíveis,
  // nenhum resultado sai da faixa 0–50, e cada um bate com a fórmula do livro.
  // Isso falha de verdade se a conta mudar.
  {
    let fora = 0;
    let erradas = 0;
    for (let pvAtual = -50; pvAtual <= 250; pvAtual += 1) {
      const r = penalidadeDeAvaria(pvAtual, 200);
      if (r < 0 || r > 50) fora += 1;
      const preso = Math.max(0, Math.min(pvAtual, 200));
      const esperado = Math.floor(((200 - preso) / 200) * 100 / 10) * 5;
      if (r !== esperado) erradas += 1;
    }
    confere(fora === 0, `${fora} valores de PV deram penalidade fora da faixa 0–50`);
    confere(erradas === 0, `${erradas} valores não bateram com a fórmula do livro`);
  }
  confere(penalidadeDeAvaria(0, 200) === 50, "nave a 0 PV chega ao teto de −50%");
  confere(penalidadeDeAvaria(10, 200) === 45, "95% de dano = −45%");

  // nada quebra com entrada estranha
  confere(penalidadeDeAvaria(10, 0) === 0, "nave sem PV máximo não quebra a conta");
  confere(penalidadeDeAvaria(undefined, 200) === 50, "PV ausente conta como zero");
  confere(penalidadeDeAvaria(300, 200) === 0, "PV acima do máximo não vira penalidade negativa");
}

/* ── OS 5% QUE SOBRAM SEMPRE ───────────────────────────────────────────────── */
//
// «Mesmo a 0%, pilotar ainda pode ser tentado e acerta com 5% ou menos.» A nave
// destruída ainda responde ao leme enquanto explode — e é disso que vive a cena
// de fuga. Sem este piso, um piloto de 40% numa nave detonada ficaria com −10% e
// a mesa teria de inventar a regra na hora.
{
  confere(pilotagemEfetiva(80, 200, 200) === 80, "nave inteira não desconta nada");
  confere(pilotagemEfetiva(80, 130, 200) === 65, "80% com o exemplo do livro → 65%");
  confere(pilotagemEfetiva(40, 0, 200) === 5,
    `piloto de 40% em nave destruída devia ficar nos 5% do livro, veio ${pilotagemEfetiva(40, 0, 200)}`);
  confere(pilotagemEfetiva(0, 200, 200) === 5, "piloto sem talento ainda tenta com 5%");
  confere(pilotagemEfetiva(55, 100, 200) === 30, "55% com metade dos PV → 30%");
}

/* ── A JP DA NAVE (T10-5) ──────────────────────────────────────────────────── */
//
// A ASSERÇÃO QUE PEGA O ERRO SUTIL: os críticos valem ANTES da comparação com a
// chance. Um piloto de 95% que tira 100 falhou criticamente; um de 10% que tira
// 1 acertou em cheio. Quem escrever `if (d <= alvo)` primeiro inverte os dois
// casos e ninguém nota, porque são os dois resultados mais raros da mesa.
{
  confere(modificadorDaJP(100, 95)?.mod === -8,
    "o 100 falha criticamente mesmo com 95% de chance — o crítico vem ANTES do alvo");
  confere(modificadorDaJP(1, 10)?.mod === 8,
    "o 1 é sucesso crítico mesmo com 10% de chance");

  confere(modificadorDaJP(15, 60)?.mod === 4, "sucesso abaixo de 20 → +4");
  confere(modificadorDaJP(19, 60)?.mod === 4, "19 ainda é 'abaixo de 20'");
  confere(modificadorDaJP(20, 60)?.mod === 2, "20 não é abaixo de 20 — é sucesso comum");
  confere(modificadorDaJP(60, 60)?.mod === 2, "rolar exatamente a chance é sucesso");
  confere(modificadorDaJP(61, 60)?.mod === -2, "um ponto acima da chance é falha");
  confere(modificadorDaJP(80, 60)?.mod === -2, "80 não é 'acima de 80'");
  confere(modificadorDaJP(81, 60)?.mod === -4, "81 é falha acima de 80 → −4");
  confere(modificadorDaJP(99, 60)?.mod === -4, "99 é falha grave, mas não crítica");

  confere(modificadorDaJP("abc", 60) === null, "rolagem inválida devolve nada, e não um modificador");

  // a tabela publicada tem de bater com a função, ou a ficha mostra uma coisa e
  // aplica outra
  const mods = JP_MODIFICADORES.map((x) => x.mod).sort((a, b) => a - b);
  confere(JSON.stringify(mods) === JSON.stringify([-8, -4, -2, 2, 4, 8]),
    `a tabela da T10-5 publicada é ${JSON.stringify(mods)} — devia ser −8/−4/−2/+2/+4/+8`);
}

/* ── O COMBUSTÍVEL (§3) ────────────────────────────────────────────────────── */
//
// ── A ASSERÇÃO QUE ESTE BLOCO EXISTE PARA FAZER ─────────────────────────────
//
// Que a tabela da T10-3 viva num lugar só. Eu escrevi uma segunda cópia dela
// aqui, sem olhar que equipamentos-nave.js já a tinha — e as duas já divergiam
// em dois pontos: a chave dos painéis solares (`solar` contra `termo`) e os
// preços por tamanho, que só a de lá tinha.
//
// Duas tabelas da mesma tabela do livro é como a ficha passa a dizer uma coisa
// e o compêndio outra, meses depois, sem erro nenhum aparecer.
{
  const fonte = fs.readFileSync(
    path.join(RAIZ, "starwars-sd-module", "module", "nave-voo.js"), "utf8");

  confere(/from "\.\/equipamentos-nave\.js"/.test(fonte),
    "nave-voo.js não importa de equipamentos-nave.js — a T10-3 mora lá");
  for (const nome of ["FONTES_DE_ENERGIA", "DADO_DE_AUTONOMIA"]) {
    // String.raw: numa template string comum o `\s` vira um "s" literal, e o
    // regex passa a procurar "consts+NOME". Ele nunca casa, a asserção nunca
    // falha, e a duplicata que ela existe para barrar entra sem resistência —
    // foi o que aconteceu na primeira versão disto, pega por sabotagem.
    const define = new RegExp(String.raw`(const|let|var)\s+${nome}\s*=`);
    confere(!define.test(fonte),
      `nave-voo.js define a própria ${nome} — é a segunda cópia da T10-3, e as duas ` +
      `vão divergir sem ninguém ver`);
  }

  // O contraintuitivo da tabela: o dado é o GASTO, então autonomia ALTA usa o
  // dado MENOR. Quem lê "alta" espera o número maior, e inverter faria o reator
  // atômico — o mais caro da T10-3 — gastar o triplo do combustível líquido.
  confere(DADO_DE_AUTONOMIA["Alta"] === 2 && DADO_DE_AUTONOMIA["Baixa"] === 6,
    "autonomia alta tem de usar o dado MENOR: o dado é o gasto, não o alcance");
  confere(DADO_DE_AUTONOMIA["Alta"] < DADO_DE_AUTONOMIA["Baixa"], "alta gasta menos que baixa");

  confere(Object.keys(FONTES_DE_ENERGIA).length === 4,
    `${Object.keys(FONTES_DE_ENERGIA).length} fontes, a T10-3 tem 4`);
  confere(FONTES_DE_ENERGIA.atomico?.autonomia === "Alta", "o reator atômico tem autonomia alta");
  confere(FONTES_DE_ENERGIA.detritos?.autonomia === "Baixa", "a incineração tem autonomia baixa");

  // o exemplo do livro: espaçonave particular, líquido (d4), salto com pouca
  // interferência → gasto 2 → 2d4%
  confere(formulaDeGasto("liquido", 2) === "2d4",
    `o exemplo do livro devia dar 2d4, veio ${formulaDeGasto("liquido", 2)}`);
  confere(/^\d+d\d+$/.test(formulaDeGasto("liquido", 2)),
    "o gasto tem de ser FÓRMULA — sorteá-lo aqui faria duas viagens iguais custarem " +
    "diferente sem ninguém ver o dado");
  confere(formulaDeGasto("atomico", 1) === "1d2", "reator atômico, um dia de viagem");
  confere(formulaDeGasto("liquido", 9).startsWith("3d"), "o livro limita a 3 dados");
  confere(formulaDeGasto("liquido", 0).startsWith("1d"), "o mínimo é 1 dado");

  // os painéis solares não se abastecem: «não se compra, se expõe ao sol». Um
  // preço inventado aqui cobraria da mesa por algo que o livro dá de graça.
  confere(custoDeAbastecimento("solar", "Média", 100) === null,
    "os painéis termoenergéticos não têm preço de abastecimento na T10-3");
  confere(custoDeAbastecimento("liquido", "Média", 10) === 10000,
    `encher 10% de combustível líquido numa média custa 10 × 1.000 = 10.000, veio ` +
    `${custoDeAbastecimento("liquido", "Média", 10)}`);

  for (const c of CUSTOS) {
    confere(c.dados >= 1 && c.dados <= 3, `o custo "${c.rotulo}" está fora do 1 a 3`);
  }
}

/* ── AS LINHAS DO PAINEL ───────────────────────────────────────────────────── */
{
  const l = linhasDoVoo({
    pv: 130, pvMax: 200, cp: 28, ba: 16, jp: 14,
    movimento: "150 m", combustivel: 60, fonte: "liquido", pilotagem: 70,
  });

  confere(l.penalidade === 15, "a penalidade do exemplo do livro não chegou ao painel");
  confere(l.pilotagem.efetiva === 55, `70% − 15% = 55%, veio ${l.pilotagem.efetiva}`);
  confere(l.pilotagem.base === 70, "o painel precisa mostrar a base também, ou a mesa não confere a conta");
  confere(l.combustivel.gastoPorDia === "1d4", "o gasto diário do combustível líquido é 1d4");
  confere(l.combustivel.fonte?.chave === "liquido", "a fonte precisa levar a própria chave");
  confere(l.combustivel.porcento === 60, "o tanque");

  // o tanque é 0 a 100 e nada mais: um 140% na flag não pode virar uma barra que
  // vaza para fora da caixa
  confere(linhasDoVoo({ combustivel: 140 }).combustivel.porcento === 100, "tanque acima de 100");
  confere(linhasDoVoo({ combustivel: -5 }).combustivel.porcento === 0, "tanque negativo");

  // sem pilotagem informada o painel não inventa um número
  confere(linhasDoVoo({ pv: 10, pvMax: 20 }).pilotagem === null,
    "sem a % de pilotagem o painel não pode inventar uma");
  confere(linhasDoVoo({}).combustivel.fonte === null, "sem fonte escolhida, nenhuma fonte");
  confere(linhasDoVoo({}).movimento === "—", "sem movimento, um traço e não um zero");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ painel de voo: a penalidade por avaria com o exemplo do livro (35% perdidos → −15%, " +
    "bloco fechado) e o teto de 50%, os 5% que sobram na nave destruída, a T10-5 com os " +
    "críticos ANTES do alvo, e a T10-3 lida de UM lugar só (equipamentos-nave.js), com " +
    "autonomia alta usando o dado MENOR"
);
