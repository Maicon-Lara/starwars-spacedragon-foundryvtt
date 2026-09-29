// Teste da geometria do movimento em arco, sem Foundry.
//
// Geometria é onde erro de sinal e de eixo se esconde: o token tem 0 = NORTE e
// o eixo Y da tela cresce para BAIXO, então "para a frente" é `y` MENOR. Um
// sinal trocado manda a nave para trás e ninguém percebe olhando o código.
//
// Uso: node tools/teste-arco.mjs

const { caminhoDaManobra, ateOndeCabe } =
  await import("../starwars-sd-module/module/nave-arco.js");

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };
const perto = (a, b, tol = 0.5) => Math.abs(a - b) <= tol;

// 1 hex = 20 m, e a cena tem 100 px por hex → 5 px por metro
const cena = { grid: { distance: 20, size: 100 } };
const centro = { x: 1000, y: 1000 };

// ── Reta: anda para a frente e não vira ────────────────────────────────────
{
  const r = caminhoDaManobra({ centro, rotacao: 0, tipo: "reta", lado: "", casas: 3, cena });
  const fim = r.pontos.at(-1);
  confere(perto(fim.x, 1000), `reta ao norte não devia mudar x: ${fim.x}`);
  // 3 hexes = 300 px, e ao norte o y DIMINUI
  confere(perto(fim.y, 700), `reta de 3 ao norte devia terminar em y=700, deu ${fim.y}`);
  confere(r.rotacaoFinal === 0, "a reta não vira");
}

// virada a leste, a mesma reta anda em +x
{
  const r = caminhoDaManobra({ centro, rotacao: 90, tipo: "reta", lado: "", casas: 2, cena });
  const fim = r.pontos.at(-1);
  confere(perto(fim.x, 1200), `reta de 2 a leste devia ir para x=1200, deu ${fim.x}`);
  confere(perto(fim.y, 1000), `e não devia mudar y: ${fim.y}`);
}

// ── Ré: anda para trás sem virar a proa ────────────────────────────────────
{
  const r = caminhoDaManobra({ centro, rotacao: 0, tipo: "re", lado: "", casas: 1, cena });
  const fim = r.pontos.at(-1);
  confere(fim.y > 1000, `a ré ao norte devia AUMENTAR y, deu ${fim.y}`);
  confere(r.rotacaoFinal === 0, "a ré não vira a proa");
}

// ── Inclinada: gira ao longo, e para o lado certo ──────────────────────────
{
  const dir = caminhoDaManobra({ centro, rotacao: 0, tipo: "inclinada", lado: "dir", casas: 2, cena });
  const esq = caminhoDaManobra({ centro, rotacao: 0, tipo: "inclinada", lado: "esq", casas: 2, cena });
  confere(dir.rotacaoFinal === 60, `inclinada à direita devia terminar em 60°, deu ${dir.rotacaoFinal}`);
  confere(esq.rotacaoFinal === 300, `inclinada à esquerda devia terminar em 300°, deu ${esq.rotacaoFinal}`);
  confere(dir.pontos.at(-1).x > 1000, "virando à direita, a nave anda para +x");
  confere(esq.pontos.at(-1).x < 1000, "virando à esquerda, para −x");
  // as duas avançam: y final menor que o inicial
  confere(dir.pontos.at(-1).y < 1000 && esq.pontos.at(-1).y < 1000,
    "a inclinada avança, não recua");
  // o giro acontece AO LONGO: no meio do caminho já virou metade
  const meio = dir.pontos[Math.floor(dir.pontos.length / 2)];
  confere(perto(meio.rotacao, 30, 3), `no meio do arco devia estar a ~30°, está a ${meio.rotacao}`);
}

// ── Curva fechada: 120°, e o arco é mais apertado ──────────────────────────
{
  const c = caminhoDaManobra({ centro, rotacao: 0, tipo: "curva", lado: "dir", casas: 2, cena });
  confere(c.rotacaoFinal === 120, `a curva devia terminar em 120°, deu ${c.rotacaoFinal}`);
  const inc = caminhoDaManobra({ centro, rotacao: 0, tipo: "inclinada", lado: "dir", casas: 2, cena });
  const dist = (p) => Math.hypot(p.x - centro.x, p.y - centro.y);
  // mesmo comprimento de percurso, giro maior → termina mais perto da origem
  confere(dist(c.pontos.at(-1)) < dist(inc.pontos.at(-1)),
    "com o mesmo percurso, a curva fechada termina mais perto da origem que a inclinada");
}

// ── Koiogran: anda reto e vira 180° no fim ─────────────────────────────────
{
  const k = caminhoDaManobra({ centro, rotacao: 0, tipo: "koiogran", lado: "", casas: 3, cena });
  confere(k.rotacaoFinal === 180, `o Koiogran devia terminar em 180°, deu ${k.rotacaoFinal}`);
  confere(perto(k.pontos.at(-1).x, 1000), "o Koiogran anda em linha reta: x não muda");
  confere(perto(k.pontos.at(-1).y, 700), "e avança os 3 hexes");
  // no meio do percurso ainda não virou
  const meio = k.pontos[Math.floor(k.pontos.length / 2)];
  confere(meio.rotacao === 0, `no meio do Koiogran a proa ainda é 0°, está ${meio.rotacao}`);
}

// ── Parar: fica onde está ──────────────────────────────────────────────────
{
  const p = caminhoDaManobra({ centro, rotacao: 45, tipo: "parar", lado: "", casas: 0, cena });
  confere(perto(p.pontos.at(-1).x, 1000) && perto(p.pontos.at(-1).y, 1000), "parar não anda");
  confere(p.rotacaoFinal === 45, "parar não vira");
}

// ── O encosto: a nave para antes de sobrepor ───────────────────────────────
{
  const r = caminhoDaManobra({ centro, rotacao: 0, tipo: "reta", lado: "", casas: 3, cena });
  const vazia = { grid: { size: 100 }, tokens: [] };
  confere(ateOndeCabe(r.pontos, "eu", vazia, 30) === r.pontos.length - 1,
    "sem ninguém no caminho, vai até o fim");

  // uma nave parada a 150 px ao norte (y = 850)
  const comOutra = {
    grid: { size: 100 },
    tokens: [{ id: "outra", x: 950, y: 800, width: 1, height: 1 }],
  };
  const ate = ateOndeCabe(r.pontos, "eu", comOutra, 30);
  confere(ate > 0 && ate < r.pontos.length - 1,
    `devia parar no meio do caminho, parou em ${ate} de ${r.pontos.length - 1}`);
  confere(r.pontos[ate].y > 850, "e devia parar ANTES da outra nave, não em cima dela");

  // a própria nave não bloqueia a si mesma
  const soEu = { grid: { size: 100 }, tokens: [{ id: "eu", x: 950, y: 950, width: 1, height: 1 }] };
  confere(ateOndeCabe(r.pontos, "eu", soEu, 30) === r.pontos.length - 1,
    "a própria nave não se bloqueia");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ arco: reta e ré nos dois eixos, inclinada e curva girando ao longo, Koiogran virando no fim, e o encosto");
