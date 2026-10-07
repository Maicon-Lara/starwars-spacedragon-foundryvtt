// Teste das ações de posto aplicadas na ficha.
//
// ── AS DUAS ASSERÇÕES QUE MAIS IMPORTAM ─────────────────────────────────────
//
// 1. CORRER APRESSA O PERSEGUIDOR. «O perseguidor avança uma marca por rodada,
//    e DUAS na rodada em que a nave sofre avaria nova ou escolhe Correr» (§7).
//    É a regra que torna a fuga uma decisão: correr aproxima o fim do salto e
//    o fim do perseguidor ao mesmo tempo. Um botão que dobra o movimento sem
//    mexer no relógio dá a vantagem de graça e mata a tensão da camada.
//
// 2. FORÇAR O REATOR NÃO ROLA SOZINHO. A função devolve a INSTRUÇÃO de rolar
//    1d6; quem rola é a mesa. Sortear aqui tiraria o dado da mesa — e é o dado
//    que faz forçar o reator ser uma aposta em vez de energia grátis.
//
// Uso: node tools/teste-nave-acoes.mjs

import {
  aplicarAcao, acharAcao, ehAutomatica, limparFimDaRodada, campoDoEfeito,
} from "../starwars-sd-module/module/nave-acoes.js";
import {
  ACOES_DE_POSTO, AUTOMATIZA, LIMPA_NO_FIM_DA_RODADA,
} from "../starwars-sd-module/module/tripulacao.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── TODA AÇÃO AUTOMÁTICA PRODUZ ALGO ──────────────────────────────────────── */
//
// Um botão que não faz nada visível é pior que não ter botão: a mesa clica,
// não acontece nada, e conclui que a ficha está quebrada.
{
  for (const [posto, acoes] of Object.entries(ACOES_DE_POSTO)) {
    for (const a of acoes) {
      const r = aplicarAcao({}, posto, a.chave);
      if (AUTOMATIZA.has(a.chave)) {
        confere(!r.erro, `${posto}/${a.chave} é automática e devolveu erro: ${r.erro}`);
        confere(r.cartao?.linhas?.length > 0,
          `${posto}/${a.chave} não produz nenhuma linha — o botão pareceria não fazer nada`);
      } else {
        confere(!!r.erro,
          `${posto}/${a.chave} NÃO está em AUTOMATIZA e mesmo assim foi aplicada — ` +
          `a ficha faria sozinha uma escolha que é da mesa`);
        confere(/não se automatiza/.test(r.erro ?? ""),
          `${posto}/${a.chave}: o erro não explica por que não automatiza`);
      }
    }
  }
  confere(aplicarAcao({}, "leme", "inexistente").erro, "ação desconhecida tem de recusar");
  confere(aplicarAcao({}, "inexistente", "firmar").erro, "posto desconhecido tem de recusar");
}

/* ── CORRER APRESSA O PERSEGUIDOR ──────────────────────────────────────────── */
{
  const r = aplicarAcao({ fuga: { etapas: 1, perseguidor: 0 } }, "leme", "correr");
  confere(r.nave.fuga.perseguidor === 2,
    `Correr devia avançar o perseguidor em DUAS marcas (§7), veio ${r.nave.fuga.perseguidor}`);
  confere(/duas/.test(r.cartao.linhas.join(" ")),
    "o cartão não avisa que o perseguidor andou duas — a mesa não veria o custo");

  // o teto: o relógio não passa de três
  const noFim = aplicarAcao({ fuga: { perseguidor: 2 } }, "leme", "correr");
  confere(noFim.nave.fuga.perseguidor === 3,
    `o relógio do perseguidor passou de 3: ${noFim.nave.fuga.perseguidor}`);

  // e Correr não mexe no relógio do SALTO: quem avança o salto é o teste de
  // pilotagem, não o acelerador
  confere(r.nave.fuga.etapas === 1,
    "Correr avançou o relógio do salto — quem avança o salto é o teste de pilotagem");

  // nave sem fuga em curso não quebra
  confere(aplicarAcao({}, "leme", "correr").nave.fuga.perseguidor === 2,
    "Correr numa nave sem relógio de fuga devia começar o relógio do perseguidor");
}

/* ── FORÇAR O REATOR: A ENERGIA ENTRA, O DADO FICA COM A MESA ──────────────── */
{
  const r = aplicarAcao({ energia: { motores: 1 } }, "engenharia", "forcar");

  confere(r.nave.energia.extra === 2, `o Forçar devia dar +2 de energia, veio ${r.nave.energia.extra}`);
  confere(r.nave.energia.motores === 1, "o Forçar apagou a energia já distribuída");

  confere(r.rolagens.length === 1, "o Forçar devia pedir uma rolagem");
  const rolagem = r.rolagens[0];
  confere(rolagem.formula === "1d6", `a rolagem devia ser 1d6, veio ${rolagem.formula}`);
  confere(rolagem.falhaEm === 1, "a avaria acontece num 1");
  confere(rolagem.camara === "maquinas",
    "a avaria do Forçar é na Sala de Máquinas — a câmara que habilita o reparo em combate, " +
    "e é isso que faz o risco doer");

  // NÃO rola: nada de resultado no retorno
  confere(!("resultado" in rolagem) && !("valor" in rolagem),
    "a função sorteou o dado — isso tira a aposta da mesa e torna o Forçar energia grátis");
  // duas chamadas dão o mesmo: se sorteasse, não dariam
  const r2 = aplicarAcao({ energia: { motores: 1 } }, "engenharia", "forcar");
  confere(JSON.stringify(r.nave) === JSON.stringify(r2.nave),
    "duas aplicações iguais deram naves diferentes — alguma coisa aqui está sorteando");
}

/* ── OS EFEITOS QUE DURAM ATÉ O FIM DA RODADA ──────────────────────────────── */
{
  const firmou = aplicarAcao({}, "leme", "firmar");
  // a forma do estado é a que LIMPA_NO_FIM_DA_RODADA declara: gravar numa forma
  // e limpar noutra deixaria o efeito ligado para sempre
  confere(firmou.nave.firmar?.ativa === true, "Firmar não marcou o estado na forma que a limpeza espera");
  const suprimiu = aplicarAcao({}, "artilharia", "supressao");
  confere(suprimiu.nave.suprimida?.ativa === true, "Supressão não marcou o estado");
  const travou = aplicarAcao({}, "sensores", "travar");
  confere(travou.nave.trava === true, "Travar alvo não marcou o estado");

  // ── E A RODADA LIMPA ──
  const suja = {
    firmar: { ativa: true }, suprimida: { ativa: true }, interferencia: true,
    aguentem: { ativa: true },
    energia: { motores: 2, escudos: 1, extra: 2 },
    // o que NÃO é temporário tem de sobreviver
    tipo: "caca", camaras: { ponte: "instalada" }, fuga: { etapas: 2, perseguidor: 1 },
  };
  const limpa = limparFimDaRodada(suja);

  confere(!limpa.firmar?.ativa, "o Firmar sobreviveu à rodada");
  confere(!limpa.suprimida?.ativa, "a Supressão sobreviveu à rodada");
  confere(!limpa.interferencia, "a Interferência sobreviveu");
  confere(!limpa.aguentem?.ativa, "o Aguentem firme sobreviveu");
  confere(limpa.energia.motores === 0 && limpa.energia.escudos === 0,
    "a energia não zerou: «o que sobra não acumula» (§7)");
  confere(!limpa.energia.extra, "a energia extra do Forçar sobreviveu");

  // o que não é de rodada FICA — apagar a nave inteira seria fácil e errado
  confere(limpa.tipo === "caca", "o fim da rodada apagou o tipo da nave");
  confere(limpa.camaras.ponte === "instalada", "o fim da rodada apagou as câmaras");
  confere(limpa.fuga.etapas === 2,
    "o fim da rodada zerou o relógio da fuga — ele atravessa rodadas, é o que o torna um relógio");

  // a lista do que é temporário mora em tripulacao.js, e não aqui
  for (const caminho of Object.keys(LIMPA_NO_FIM_DA_RODADA)) {
    const campo = campoDoEfeito(caminho);
    confere(!campo.startsWith("system."),
      `"${campo}" ainda tem o prefixo system., herdado do tipo de ator aposentado`);
  }
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ ações de posto: as 8 automáticas produzindo efeito e as 7 de mesa recusadas com o " +
    "motivo, Correr apressando o perseguidor em DUAS marcas (§7), o Forçar entregando a " +
    "energia e deixando o 1d6 com a mesa, e o fim da rodada limpando o que é de rodada — " +
    "sem levar junto o tipo, as câmaras e os relógios"
);
