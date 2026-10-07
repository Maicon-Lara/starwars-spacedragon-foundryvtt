// Teste do salto hiperespacial (§2).
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// SÓ A TERCEIRA FALHA CANCELA. «As duas primeiras saltam para o lugar errado.»
//
// Isso é o contrário do que uma sequência de testes costuma fazer, e é o que
// torna a regra boa: falhar a Distância não aborta nada — a nave salta, e salta
// errado, some do mapa e reaparece onde o Mestre quiser. Implementar "falhou,
// parou" mataria a melhor coisa do salto, que é a viagem dar errado sem a cena
// acabar. E o erro passaria despercebido, porque "falha interrompe" é o
// comportamento que todo mundo espera de três testes em sequência.
//
// Uso: node tools/teste-nave-salto.mjs

import {
  ETAPAS, saltoVazio, resultadoDaEtapa, proximaEtapa,
  porQueNaoPodeSaltar, estadoDoSalto, resumoDoSalto,
} from "../starwars-sd-module/module/nave-salto.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/** Um salto com os resultados dados, na ordem das etapas. */
const salto = (...resultados) => ({
  etapas: Object.fromEntries(resultados.map((r, i) => [ETAPAS[i].chave, r]).filter(([, r]) => r)),
});

/* ── AS TRÊS ETAPAS, NA ORDEM DO LIVRO ─────────────────────────────────────── */
{
  confere(ETAPAS.length === 3, `${ETAPAS.length} etapas, o livro tem 3`);
  confere(ETAPAS[0].chave === "distancia", "a primeira etapa é Distância");
  confere(ETAPAS[1].chave === "direcao", "a segunda é Direção");
  confere(ETAPAS[2].chave === "execucao", "a terceira é Execução");

  // SÓ a terceira cancela
  confere(!ETAPAS[0].cancela, "falhar a Distância NÃO pode cancelar o salto");
  confere(!ETAPAS[1].cancela, "falhar a Direção NÃO pode cancelar o salto");
  confere(ETAPAS[2].cancela, "falhar a Execução cancela o salto");
  confere(ETAPAS.filter((e) => e.cancela).length === 1,
    "mais de uma etapa cancela — só a Execução faz isso, e é o que mantém a cena viva");

  // cada falha diz o que aconteceu, porque é a mesa que vai narrar
  for (const e of ETAPAS) {
    confere(e.falha && e.falha.length > 20, `a etapa ${e.rotulo} não diz o que a falha causa`);
  }
}

/* ── A SEQUÊNCIA ───────────────────────────────────────────────────────────── */
{
  confere(proximaEtapa(saltoVazio())?.chave === "distancia", "o salto começa pela Distância");
  confere(proximaEtapa(salto("ok"))?.chave === "direcao", "depois da Distância vem a Direção");
  confere(proximaEtapa(salto("ok", "ok"))?.chave === "execucao", "e por fim a Execução");
  confere(proximaEtapa(salto("ok", "ok", "ok")) === null, "com as três roladas não há próxima");

  // falhar NÃO interrompe: a sequência «não pode ser abortada no meio»
  confere(proximaEtapa(salto("falha"))?.chave === "direcao",
    "falhar a Distância interrompeu a sequência — ela não pode ser abortada no meio (§2)");
  confere(proximaEtapa(salto("falha", "falha"))?.chave === "execucao",
    "duas falhas e a sequência parou — as duas primeiras não cancelam nada");

  confere(resultadoDaEtapa(salto("ok"), "distancia") === "ok", "o resultado gravado");
  confere(resultadoDaEtapa(saltoVazio(), "distancia") === null, "etapa não rolada");
  confere(resultadoDaEtapa({ etapas: { distancia: "lixo" } }, "distancia") === null,
    "resultado inválido não vira nem ok nem falha");
}

/* ── O QUE ACONTECEU NO FIM ────────────────────────────────────────────────── */
//
// `concluido` e `chegou` são coisas diferentes, e é aí que a regra mora: um
// salto com as duas primeiras falhas CONCLUI e a nave CHEGA — a algum lugar.
{
  const perfeito = estadoDoSalto(salto("ok", "ok", "ok"));
  confere(perfeito.concluido && perfeito.chegou && !perfeito.cancelou, "o salto limpo");
  confere(perfeito.desvios.length === 0, "salto limpo não tem desvio");

  const torto = estadoDoSalto(salto("falha", "falha", "ok"));
  confere(torto.concluido, "as três etapas rolaram: o salto está concluído");
  confere(torto.chegou,
    "falhar Distância e Direção CANCELOU o salto — elas levam a nave para o lugar errado, " +
    "e lugar errado ainda é um lugar (§2)");
  confere(!torto.cancelou, "só a Execução cancela");
  confere(torto.desvios.length === 2, `deviam ser 2 desvios, veio ${torto.desvios.length}`);

  const cancelado = estadoDoSalto(salto("ok", "ok", "falha"));
  confere(cancelado.cancelou && !cancelado.chegou,
    "falhar a Execução devia cancelar: «o salto não acontece; a nave fica onde está»");

  // o pior caso: errou tudo. A Execução cancela, e os desvios não importam mais
  const tudoErrado = estadoDoSalto(salto("falha", "falha", "falha"));
  confere(tudoErrado.cancelou && !tudoErrado.chegou,
    "com a Execução falhada a nave não sai do lugar, por mais que as outras tenham falhado");

  const meio = estadoDoSalto(salto("ok"));
  confere(!meio.concluido && !meio.chegou, "salto pela metade não concluiu nem chegou");
  confere(meio.proxima?.chave === "direcao", "e sabe o que falta");
}

/* ── POR QUE NÃO PODE SALTAR ───────────────────────────────────────────────── */
//
// Devolve o MOTIVO e não um booleano: "não pode saltar" manda a mesa procurar o
// problema na ficha inteira; «falta o Acelerador Hiperespacial» resolve num
// segundo.
{
  const ok = { camaras: { ponte: "instalada" } };
  confere(porQueNaoPodeSaltar(ok, { temAcelerador: true, tamanho: "Média" }) === null,
    "nave média, com acelerador e ponte de pé, devia poder saltar");

  const emCombate = porQueNaoPodeSaltar(ok, { temAcelerador: true, tamanho: "Média", emCombate: true });
  confere(/combate/i.test(emCombate ?? ""), "«não se salta durante um combate» (§2)");
  confere(/fuga|§7/.test(emCombate ?? ""),
    "o motivo precisa citar a exceção da fuga em relógio, senão a mesa acha que é proibido sempre");

  const semAcelerador = porQueNaoPodeSaltar(ok, { temAcelerador: false, tamanho: "Média" });
  confere(/Acelerador/i.test(semAcelerador ?? ""), "sem acelerador não há salto");

  // o caça não sai do sistema, e é isso que faz o esquadrão precisar de nave-mãe
  const caca = porQueNaoPodeSaltar(ok, { temAcelerador: true, tamanho: "Pequena" });
  confere(/Pequena|cabe/.test(caca ?? ""),
    "o acelerador «só cabe em nave Média e Gigantesca» — o caça não pode saltar");
  const colosso = porQueNaoPodeSaltar(ok, { temAcelerador: true, tamanho: "Colossal" });
  confere(colosso !== null, "nem o colosso leva acelerador (T10-4)");

  // a Ponte: é lá que os três testes rolam
  for (const estado of ["danificada", "ausente"]) {
    const semPonte = porQueNaoPodeSaltar(
      { camaras: { ponte: estado } }, { temAcelerador: true, tamanho: "Média" });
    confere(/Ponte/i.test(semPonte ?? ""),
      `com a Ponte ${estado} o salto devia ser recusado — os três testes rolam nela`);
  }

  // a ordem dos motivos é a ordem em que a mesa consegue agir: o combate passa,
  // o acelerador se compra, a Ponte se conserta
  const tudoRuim = porQueNaoPodeSaltar(
    { camaras: { ponte: "ausente" } },
    { temAcelerador: false, tamanho: "Pequena", emCombate: true });
  confere(/combate/i.test(tudoRuim ?? ""),
    "com tudo errado ao mesmo tempo, o motivo mostrado devia ser o combate — é o que passa sozinho");
}

/* ── O RESUMO QUE VAI PARA O CHAT ──────────────────────────────────────────── */
{
  confere(/chegou ao destino/.test(resumoDoSalto(salto("ok", "ok", "ok"))), "o salto limpo");
  confere(/não aconteceu/.test(resumoDoSalto(salto("ok", "ok", "falha"))), "o salto cancelado");

  const torto = resumoDoSalto(salto("falha", "ok", "ok"));
  confere(/saltou/.test(torto) && /longe ou perto/.test(torto),
    `o resumo precisa dizer ONDE a nave foi parar, veio "${torto}"`);

  confere(/em curso/.test(resumoDoSalto(salto("ok"))), "salto pela metade");
  confere(/Direção/.test(resumoDoSalto(salto("ok"))), "e diz o que falta rolar");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ salto hiperespacial: as três etapas na ordem, SÓ a Execução cancelando (as duas " +
    "primeiras levam a nave para o lugar errado, e a sequência não aborta), o acelerador " +
    "só em Média e Gigantesca, os testes exigindo a Ponte, e o motivo da recusa em palavras"
);
