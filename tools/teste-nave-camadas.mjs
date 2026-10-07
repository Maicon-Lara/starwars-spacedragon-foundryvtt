// Teste das três camadas opcionais do §7 na Ficha de Nave.
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// COM AS CAMADAS DESLIGADAS, NADA APARECE — nem um cabeçalho vazio. Elas são
// desligadas por padrão porque cada uma é um jogo a mais dentro da rodada, e
// uma mesa casual não quer nenhum. Três painéis mortos numa ficha que já é
// cheia custam mais do que valem, e um cabeçalho "Camadas" sem camada nenhuma
// é pior que ausência: sugere que algo falhou.
//
// Nos testes não há settings, então `camadaLigada` devolve false para todas —
// e é por isso que o padrão testado aqui é o mesmo que a mesa vê ao instalar.
//
// Uso: node tools/teste-nave-camadas.mjs

import {
  painelDasCamadas, painelDeEnergia, painelDeAvarias, painelDeFuga,
  MARCA_CAMADAS, CLASSE_ENERGIA, CLASSE_RELOGIO,
} from "../starwars-sd-module/module/nave-camadas.js";
import {
  ENERGIA_POR_TAMANHO, MARCAS_DO_PERSEGUIDOR, PRAZO_DE_AVARIA,
} from "../starwars-sd-module/module/tripulacao.js";
import { ETAPAS } from "../starwars-sd-module/module/nave-salto.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── DESLIGADAS, NÃO APARECEM ──────────────────────────────────────────────── */
{
  const nave = { energia: { motores: 2 }, avarias: { motor: 1 }, fuga: { etapas: 1 } };
  const html = painelDasCamadas(nave, { tamanho: "Média", rodada: 2 });
  confere(html === "",
    `com as camadas desligadas o painel devia ser vazio, veio ${html.length} caracteres — ` +
    `um cabeçalho sem camada sugere que algo falhou`);
  confere(!html.includes(MARCA_CAMADAS), "a seção não pode nem existir com tudo desligado");
}

/* ── ENERGIA: O QUE SOBRA NÃO ACUMULA ──────────────────────────────────────── */
//
// É o "não acumula" que torna a camada uma DECISÃO. Guardar para a rodada
// seguinte seria sempre a jogada certa, e aí não haveria escolha nenhuma — por
// isso a sobra aparece como sobra, e não como reserva.
{
  const vazia = painelDeEnergia({}, "Média");
  // "sobram 3 de 3", e não "3": o número sozinho é ambíguo entre o gasto e o
  // que resta, e quem lê no meio da rodada não vai conferir qual é
  confere(/sobram 3 de 3/.test(vazia),
    "nave média sem energia distribuída devia mostrar que sobram 3 de 3 (T10-3)");
  confere(/não acumula/.test(vazia),
    "o painel não avisa que a sobra zera — alguém vai guardar pontos para a rodada seguinte");

  // os pontos por tamanho vêm da tabela, e não daqui
  for (const [tam, pontos] of Object.entries(ENERGIA_POR_TAMANHO)) {
    confere(painelDeEnergia({}, tam).includes(`sobram ${pontos} de ${pontos}`),
      `${tam} devia dar ${pontos} pontos de reator`);
  }

  // o efeito fica à vista: a mesa não precisa lembrar que ponto em motor é +2 JP
  const cheia = painelDeEnergia({ energia: { motores: 1, escudos: 2 } }, "Média");
  confere(/JP \+2/.test(cheia), "o efeito dos motores não aparece");
  confere(/CP \+4/.test(cheia), "o efeito dos escudos (2 pontos = +4) não aparece");

  // gastar além do reator é possível (Forçar o reator dá +2), e tem de APARECER
  const demais = painelDeEnergia({ energia: { motores: 3, escudos: 3 } }, "Pequena");
  confere(/excedeu/.test(demais) && /além do reator/.test(demais),
    "gastar mais energia do que o reator deu não é sinalizado — e 'Forçar o reator' " +
    "existe justamente para isso, com risco de avaria");

  // os botões não deixam passar do que não existe
  confere(/data-passo="-1"[^>]*disabled/.test(vazia),
    "o botão de tirar ponto está ativo com zero pontos");
}

/* ── AVARIAS: O QUE RESTA, E NÃO O QUE PASSOU ──────────────────────────────── */
//
// A mesa precisa saber quanto tempo TEM. Mostrar a rodada em que a avaria
// aconteceu obriga a uma subtração de cabeça no meio do combate, que é
// exatamente o que se perde.
{
  const semAvaria = painelDeAvarias({}, 3);
  confere(/Nenhuma avaria/.test(semAvaria), "sem avaria, o painel devia dizer isso");

  const correndo = painelDeAvarias({ avarias: { motor: 2 } }, 3);
  confere(/restam <strong>2<\/strong>/.test(correndo),
    "avaria de motor (prazo 3) aberta na rodada 2, agora na 3: restam 2 — " +
    "o painel mostra o que RESTA, não a rodada em que aconteceu");

  const vencida = painelDeAvarias({ avarias: { armas: 1 } }, 9);
  confere(/vencido/.test(vencida), "prazo estourado devia aparecer como vencido");
  confere(/danificada/.test(vencida),
    "o painel não diz a consequência do prazo vencido — a câmara fica danificada (§7)");
  confere(/25%/.test(vencida), "falta o custo do conserto, que é o que a mesa vai pagar");

  // os prazos vêm da tabela
  for (const chave of Object.keys(PRAZO_DE_AVARIA)) {
    confere(painelDeAvarias({ avarias: { [chave]: 1 } }, 1).includes(chave),
      `a avaria "${chave}" não aparece no painel`);
  }
  // uma avaria que a T10-6 não tem é ignorada, e não vira linha fantasma
  confere(!/fantasma/.test(painelDeAvarias({ avarias: { fantasma: 1 } }, 1)),
    "uma avaria desconhecida virou linha no painel");
}

/* ── FUGA: OS DOIS RELÓGIOS LADO A LADO ────────────────────────────────────── */
//
// A corrida é a informação. Ver só o próprio progresso não diz se vale
// continuar fugindo ou virar e lutar.
{
  const meio = painelDeFuga({ fuga: { etapas: 1, perseguidor: 2 } });
  confere(/Salto/.test(meio) && /Perseguidor/.test(meio), "os dois relógios têm de aparecer");
  confere(/Ninguém fechou/.test(meio), "com ninguém no fim, não há veredito");

  const saltou = painelDeFuga({ fuga: { etapas: ETAPAS.length, perseguidor: 1 } });
  confere(/A nave salta/.test(saltou), "com as três etapas a nave devia saltar");

  const alcancou = painelDeFuga({ fuga: { etapas: 1, perseguidor: MARCAS_DO_PERSEGUIDOR } });
  confere(/alcança/.test(alcancou), "com as três marcas o perseguidor devia alcançar");
  confete: {
    confere(/a pé/.test(alcancou),
      "o painel não diz o que acontece quando o perseguidor fecha — o combate continua a pé");
  }

  // a regra que a mesa mais esquece
  confere(/duas<\/strong> marcas/.test(meio),
    "o painel não lembra que o perseguidor avança DUAS marcas quando a nave sofre " +
    "avaria nova ou escolhe Correr");

  // ── UM VALOR ESTRANHO NA FLAG NÃO PODE DERRUBAR A FICHA ────────────────
  //
  // `"○".repeat(3 - 99)` lança RangeError, e um RangeError no meio do desenho
  // derruba a ficha INTEIRA, não só a camada. A flag pode trazer qualquer
  // coisa: versão antiga, macro de mesa, edição à mão. Por isso o clamp existe
  // nos dois lugares — no cálculo e no desenho —, e por isso isto é testado
  // chamando a função de verdade em vez de conferir o HTML.
  for (const valor of [99, -5, NaN, "abc", null, undefined, 1.7]) {
    let html = null;
    try {
      html = painelDeFuga({ fuga: { etapas: valor, perseguidor: valor } });
    } catch (e) {
      confere(false, `fuga com etapas=${JSON.stringify(valor)} derrubou o painel: ${e.message}`);
      continue;
    }
    const marcas = [...html.matchAll(/relogio-marcas">([^<]*)/g)].map((m) => m[1]);
    confere(marcas.length === 2, `fuga com ${JSON.stringify(valor)}: esperava 2 relógios`);
    for (const m of marcas) {
      confere([...m].every((c) => c === "●" || c === "○"),
        `o relógio saiu com caractere estranho: "${m}"`);
    }
    confere(marcas[0].length === ETAPAS.length,
      `o relógio do salto tem ${marcas[0].length} casas com etapas=${JSON.stringify(valor)}, ` +
      `e a regra dá ${ETAPAS.length}`);
    confere(marcas[1].length === MARCAS_DO_PERSEGUIDOR,
      `o relógio do perseguidor tem ${marcas[1].length} casas, e a regra dá ${MARCAS_DO_PERSEGUIDOR}`);
  }
}

/* ── A REGRA NÃO MORA AQUI ─────────────────────────────────────────────────── */
//
// Este arquivo é desenho. Quando a conta e o pixel moram juntos, corrigir a
// conta vira mexer no pixel — e foi assim que a T10-3 ganhou duas versões.
{
  const fs = await import("node:fs");
  const path = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const raiz = path.resolve(fileURLToPath(import.meta.url), "../..");
  const js = fs.readFileSync(
    path.join(raiz, "starwars-sd-module", "module", "nave-camadas.js"), "utf8");

  confere(/from "\.\/tripulacao\.js"/.test(js),
    "as camadas não importam a regra de tripulacao.js — estariam reimplementando");
  for (const nome of ["ENERGIA_POR_TAMANHO", "PRAZO_DE_AVARIA", "MARCAS_DO_PERSEGUIDOR"]) {
    const define = new RegExp(String.raw`(const|let|var)\s+${nome}\s*=`);
    confere(!define.test(js),
      `nave-camadas.js define a própria ${nome} — é a segunda cópia da regra`);
  }
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ camadas opcionais: invisíveis quando desligadas (que é o padrão), a energia com a " +
    "sobra que NÃO acumula e o excesso sinalizado, as avarias mostrando o que RESTA e a " +
    "consequência do prazo, os dois relógios da fuga com veredito — e a regra vinda de " +
    "tripulacao.js, não reescrita"
);
