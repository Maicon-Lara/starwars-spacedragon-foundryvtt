// Teste das regras de tripulação, sem Foundry.
//
// Os postos, a Energia, o prazo das avarias e o relógio da fuga — a parte DA
// CASA do capítulo de Naves. Confere o que a mesa não vê errar na hora:
//
//   · cada posto tem opções, e as que a ficha NÃO automatiza estão declaradas
//     (se "ordem" ou "sangue frio" virarem automáticas por acidente, a ficha
//     passa a adivinhar a intenção da mesa e erra);
//   · a Energia rende efeito DIFERENTE em cada modo, e não deixa gastar mais
//     do que o reator deu;
//   · o prazo da avaria conta da rodada em que ela surgiu, e sem combate não
//     há relógio;
//   · no empate do relógio de fuga, quem leva é o perseguidor.
//
// Uso: node tools/teste-tripulacao.mjs

import fs from "node:fs";

import {
  ACOES_DE_POSTO, AUTOMATIZA, acaoDoPosto,
  ENERGIA_POR_TAMANHO, DESTINOS_DE_ENERGIA, energiaDoReator, efeitoDaEnergia, energiaGasta,
  PRAZO_DE_AVARIA, prazoDaAvaria,
  MARCAS_DO_PERSEGUIDOR, avancoDoPerseguidor, quemFechaPrimeiro,
  partesDaTripulacao, cpComEnergia, jpComEnergia,
  dadosExtrasDeDano, dadosExtrasDeEsquiva, evasivaBloqueada,
  LIMPA_NO_FIM_DA_RODADA,
} from "../starwars-sd-module/module/tripulacao.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

// ── OS POSTOS ──────────────────────────────────────────────────────────────
const POSTOS = ["leme", "artilharia", "engenharia", "sensores", "comando"];
confere(Object.keys(ACOES_DE_POSTO).length === 5,
  `${Object.keys(ACOES_DE_POSTO).length} postos, esperava 5`);
for (const p of POSTOS) {
  const acoes = ACOES_DE_POSTO[p];
  confere(Array.isArray(acoes), `o posto ${p} não existe`);
  // o problema original era posto com UMA ação fixa; três é o desenho do cofre
  confere(acoes?.length === 3, `o posto ${p} tem ${acoes?.length} opções, esperava 3`);
  for (const a of acoes ?? []) {
    confere(a.chave && a.rotulo, `opção sem chave ou rótulo em ${p}`);
    // a nota é o que a mesa lê; sem ela a opção não se explica na ficha
    confere(typeof a.nota === "string" && a.nota.length > 20,
      `a opção ${p}/${a.chave} não tem nota explicando o que faz`);
  }
  // as chaves não podem repetir dentro do posto, senão acaoDoPosto pega a errada
  const chaves = (acoes ?? []).map((a) => a.chave);
  confere(new Set(chaves).size === chaves.length, `chaves repetidas em ${p}`);
}

// acaoDoPosto acha, e não confunde postos
confere(acaoDoPosto("leme", "firmar")?.efeito?.jp === 4, "firmar devia dar +4 na JP");
confere(acaoDoPosto("artilharia", "rajada")?.efeito?.ataque === -5, "rajada devia dar −5 no ataque");
confere(acaoDoPosto("artilharia", "firmar") === null,
  "acaoDoPosto achou 'firmar' na Artilharia, que não a tem");
confere(acaoDoPosto("leme", "inexistente") === null, "acaoDoPosto devia devolver null");

// ── O QUE NÃO SE AUTOMATIZA ────────────────────────────────────────────────
//
// "Ordem" dá uma ação a mais a um posto, e a ficha não sabe o que aquele posto
// ia fazer. "Sangue frio" rerrola um dado que já saiu no chat. Automatizar os
// dois faria a ficha adivinhar a intenção da mesa.
confere(!AUTOMATIZA.has("ordem"), "'ordem' não deve ser automatizada");
confere(!AUTOMATIZA.has("sangueFrio"), "'sangue frio' não deve ser automatizado");
confere(AUTOMATIZA.has("firmar") && AUTOMATIZA.has("rajada") && AUTOMATIZA.has("supressao"),
  "firmar, rajada e supressão deviam ser automatizadas");
// toda chave em AUTOMATIZA tem de existir em algum posto, senão é letra morta
const todas = new Set(Object.values(ACOES_DE_POSTO).flat().map((a) => a.chave));
for (const k of AUTOMATIZA) {
  confere(todas.has(k), `AUTOMATIZA cita '${k}', que não é ação de nenhum posto`);
}
// e toda ação com `efeito` mecânico tem de estar em AUTOMATIZA, ou o efeito
// ficaria declarado e nunca aplicado
for (const [posto, acoes] of Object.entries(ACOES_DE_POSTO)) {
  for (const a of acoes) {
    if (a.efeito) {
      confere(AUTOMATIZA.has(a.chave),
        `${posto}/${a.chave} tem efeito mecânico mas não está em AUTOMATIZA`);
    }
  }
}

// ── ENERGIA ────────────────────────────────────────────────────────────────
confere(energiaDoReator("Pequena") === 2, "caça devia ter 2 pontos");
confere(energiaDoReator("Média") === 3, "a nave-herói devia ter 3 pontos");
confere(energiaDoReator("Gigantesca") === 4, "cargueiro devia ter 4 pontos");
confere(energiaDoReator("Colossal") === 6, "colosso devia ter 6 pontos");
confere(energiaDoReator("Inexistente") === 0, "tamanho desconhecido devia dar 0");
// os quatro tamanhos da tabela do cofre, e nenhum a mais
confere(Object.keys(ENERGIA_POR_TAMANHO).length === 4,
  `${Object.keys(ENERGIA_POR_TAMANHO).length} tamanhos na tabela de energia`);

// o efeito é DIFERENTE por modo — é o que faz a camada servir aos dois
const noLivro = efeitoDaEnergia({ motores: 2, escudos: 1, armas: 1 }, true);
confere(noLivro.jp === 4, `no §10.6, 2 em motores devia dar +4 na JP, deu ${noLivro.jp}`);
confere(noLivro.cp === 2, `no §10.6, 1 em escudos devia dar +2 no CP, deu ${noLivro.cp}`);
confere(noLivro.hexes === 0 && noLivro.dadosDeEsquiva === 0,
  "no §10.6 não há hexe nem dado de esquiva");

const noTatico = efeitoDaEnergia({ motores: 2, escudos: 1, armas: 1 }, false);
confere(noTatico.hexes === 2, `no Tático, 2 em motores devia dar +2 hexes, deu ${noTatico.hexes}`);
confere(noTatico.dadosDeEsquiva === 1, "no Tático, 1 em escudos devia dar +1d6 de esquiva");
confere(noTatico.jp === 0 && noTatico.cp === 0, "no Tático a energia não mexe em JP nem CP");

// o dado de dano é igual nos dois: é a única saída que não depende do modo
confere(noLivro.dadosDeDano === 1 && noTatico.dadosDeDano === 1,
  "o ponto em armas devia dar +1 dado nos dois modos");

// sem pontos, tudo zero e nada undefined — quem soma não precisa testar
const vazio = efeitoDaEnergia();
confere(Object.values(vazio).every((v) => v === 0), `efeitoDaEnergia() devia zerar: ${JSON.stringify(vazio)}`);

confere(energiaGasta({ motores: 1, escudos: 2, armas: 0 }) === 3, "energiaGasta errou a soma");
confere(energiaGasta({}) === 0 && energiaGasta() === 0, "energiaGasta devia aceitar vazio");

// os três destinos têm texto para os dois modos, senão o painel fica mudo
for (const [k, d] of Object.entries(DESTINOS_DE_ENERGIA)) {
  confere(d.rotulo && d.livro && d.tatico, `o destino ${k} não descreve os dois modos`);
}

// ── PRAZO DAS AVARIAS ──────────────────────────────────────────────────────
confere(PRAZO_DE_AVARIA.motor === 3, "a propulsão devia ter 3 rodadas");
confere(PRAZO_DE_AVARIA.armas === 2 && PRAZO_DE_AVARIA.sensores === 2,
  "armas e sensores deviam ter 2 rodadas");
// o Leme e a Tripulação saem sozinhos no fim da rodada: não têm relógio
confere(PRAZO_DE_AVARIA.leme === undefined, "o Leme não devia ter prazo");
confere(PRAZO_DE_AVARIA.tripulacao === undefined, "a Tripulação não devia ter prazo");
confere(prazoDaAvaria("leme", 1, 2) === null, "avaria sem prazo devia devolver null");

// surgiu na rodada 2; na 3 falta 2, na 4 falta 1, na 5 venceu
confere(prazoDaAvaria("motor", 2, 2).restam === 3, "na rodada em que surgiu, o prazo é cheio");
confere(prazoDaAvaria("motor", 2, 3).restam === 2, "uma rodada depois, restam 2");
confere(prazoDaAvaria("motor", 2, 5).venceu === true, "três rodadas depois, o prazo venceu");
confere(prazoDaAvaria("motor", 2, 4).venceu === false, "duas rodadas depois, ainda não venceu");
// nunca negativo: a ficha mostra o número, e "−3 rodadas" não quer dizer nada
confere(prazoDaAvaria("motor", 2, 20).restam === 0, "o prazo não devia ficar negativo");
// fora de combate não há relógio — mesmo critério do intervalo da evasiva
confere(prazoDaAvaria("motor", 0, 0).venceu === false, "sem combate não há prazo vencido");
confere(prazoDaAvaria("armas", 0, 5).restam === 2, "sem rodada de origem, o prazo é cheio");

// ── FUGA ───────────────────────────────────────────────────────────────────
confere(avancoDoPerseguidor() === 1, "o perseguidor anda 1 por rodada");
confere(avancoDoPerseguidor({ avariaNova: true }) === 2, "com avaria nova, anda 2");
confere(avancoDoPerseguidor({ correu: true }) === 2, "se a nave correu, anda 2");
confere(avancoDoPerseguidor({ avariaNova: true, correu: true }) === 2,
  "os dois juntos continuam 2, e não 3");

confere(quemFechaPrimeiro(0, 0) === null, "no começo, ninguém fechou");
confere(quemFechaPrimeiro(3, 0) === "salto", "três etapas e a nave salta");
confere(quemFechaPrimeiro(0, MARCAS_DO_PERSEGUIDOR) === "perseguidor", "o perseguidor alcança");
// o empate é do perseguidor: a nave precisa COMPLETAR o salto
confere(quemFechaPrimeiro(3, 3) === "perseguidor",
  "no empate, o travão de raio impede a partida — devia ser 'perseguidor'");

// ── O EFEITO CHEGANDO NAS ROLAGENS ────────────────────────────────────────
//
// Declarar o efeito e nunca aplicá-lo é a falha mais fácil deste pacote: a
// ficha mostraria o painel, o cartão diria "+4 na JP", e o número não entraria
// na conta. Estas asserções são sobre a ponte entre a regra e o dado.
confere(partesDaTripulacao({}, {}).length === 0, "sem nada ligado, nenhuma parte entra");
const comFirmar = partesDaTripulacao({ firmar: { ativa: true } }, {});
confere(comFirmar.length === 1 && comFirmar[0][1] === 2,
  `Firmar devia pôr +2 no ataque, veio ${JSON.stringify(comFirmar)}`);
const suprimido = partesDaTripulacao({ suprimida: { ativa: true } }, {});
confere(suprimido[0][1] === -2, "quem está suprimido devia levar −2");
const contraInterferencia = partesDaTripulacao({}, { interferencia: true });
confere(contraInterferencia[0][1] === -2, "a interferência do alvo devia dar −2");
// os três somam, e não se anulam
const tudo = partesDaTripulacao(
  { firmar: { ativa: true }, suprimida: { ativa: true } }, { interferencia: true });
confere(tudo.reduce((a, [, v]) => a + v, 0) === -2,
  `+2 −2 −2 devia dar −2, deu ${tudo.reduce((a, [, v]) => a + v, 0)}`);

// o CP do alvo sobe com os Escudos dele, e SÓ no §10.6
confere(cpComEnergia({ cp: 28, energia: { escudos: 2 } }, true) === 32,
  "2 em escudos devia levar o CP 28 a 32");
confere(cpComEnergia({ cp: 28, energia: { escudos: 2 } }, false) === 28,
  "no Tático os escudos NÃO mexem no CP");
confere(cpComEnergia({}, true) === 0, "cpComEnergia devia aceitar nave sem campos");

// a JP da evasiva sobe com os Motores
confere(jpComEnergia({ evasiva: { mod: 2 }, energia: { motores: 1 } }, true) === 4,
  "1 em motores devia somar +2 ao modificador da JP");
confere(jpComEnergia({ evasiva: { mod: 2 }, energia: { motores: 1 } }, false) === 2,
  "no Tático os motores não mexem na JP");

confere(dadosExtrasDeDano({ energia: { armas: 2 } }) === 2, "2 em armas devia dar 2 dados");
confere(dadosExtrasDeDano({}) === 0, "sem energia, nenhum dado extra");
confere(dadosExtrasDeEsquiva({ energia: { escudos: 2 } }, false) === 2,
  "no Tático, 2 em escudos devia dar 2 dados de esquiva");
confere(dadosExtrasDeEsquiva({ energia: { escudos: 2 } }, true) === 0,
  "no §10.6 os escudos não viram dado de esquiva");

confere(evasivaBloqueada({ suprimida: { ativa: true } }) === true,
  "a supressão devia bloquear a evasiva");
confere(evasivaBloqueada({}) === false, "sem supressão, a evasiva é permitida");

// ── O QUE A RODADA APAGA ──────────────────────────────────────────────────
//
// Esquecer um campo aqui deixa o bônus VALENDO PARA SEMPRE: o +4 do Firmar que
// nunca sai é pior do que o bônus não existir, porque ninguém percebe.
for (const campo of [
  "system.energia.motores", "system.energia.escudos", "system.energia.armas",
  "system.energia.extra", "system.firmar.ativa", "system.interferencia",
  "system.suprimida.ativa", "system.aguentem.ativa",
]) {
  confere(campo in LIMPA_NO_FIM_DA_RODADA, `o Fim da Rodada não apaga ${campo}`);
}
// e a energia some de verdade, não vira string vazia
confere(LIMPA_NO_FIM_DA_RODADA["system.energia.motores"] === 0, "a energia devia zerar em 0");
confere(LIMPA_NO_FIM_DA_RODADA["system.firmar.ativa"] === false, "o Firmar devia sair em false");
// a rodada em que a avaria surgiu NÃO pode ser apagada: ela é o relógio
confere(!("system.avariaRodada.motor" in LIMPA_NO_FIM_DA_RODADA),
  "o Fim da Rodada não pode zerar a data da avaria — é ela que conta o prazo");

// ── O TEMPLATE E O CSS SAÍRAM DAQUI, E POR QUÊ ───────────────────────────
//
// Este arquivo testava que o template `nave.hbs` embrulhava cada camada no seu
// `{{#if}}`, e que o CSS estilizava os painéis. Os dois foram apagados na
// 1.40.0 junto com a ficha antiga.
//
// A REGRA continua testada acima: os cinco postos, as três opções de cada, o
// que não se automatiza, a energia, o prazo da avaria e o empate da fuga. O que
// se perdeu foi a amarração ao DESENHO, e ela volta quando as camadas forem
// ligadas na Ficha de Nave — com os seletores novos, não com os do template
// que não existe mais.
//
// Ressuscitar estas asserções apontando para o HTML novo antes de ele existir
// seria escrever um teste que falha de propósito e espera alguém desligá-lo.

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ tripulação: 5 postos × 3 opções, o que NÃO se automatiza, a energia nos dois " +
    "modos, o prazo da avaria (e sem combate não há relógio), e o empate da fuga"
);
