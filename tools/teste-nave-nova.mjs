// Teste do criador de naves.
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// A RAÇA ANTES DA CLASSE, e cada uma com o seu sync. O sistema recusa classe em
// ator sem raça — com uma notificação que some em segundos — e as habilidades
// de raça só entram pelo `syncRaceAbilities`. É a habilidade que carrega o
// `natural_armor`, ou seja o CP.
//
// Inverter a ordem cria uma nave sem classe; pular o sync cria uma nave com
// CP 10. Os dois erros são silenciosos, e o segundo só aparece quando alguém
// leva um tiro — três sessões depois, quando ninguém liga mais a causa.
//
// Uso: node tools/teste-nave-nova.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { nomeDaClasse, opcoesDeTipo } from "../starwars-sd-module/module/nave-nova.js";
import { TIPOS } from "../starwars-sd-module/module/tipos-de-nave.js";
import { classesDeNave } from "./data/classes-de-nave.mjs";

const RAIZ = path.resolve(fileURLToPath(import.meta.url), "../..");
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── O NOME DA CLASSE TEM DE BATER COM O QUE O BUILD SEMEIA ────────────────── */
//
// O criador procura a classe pelo nome. Se o build semeia "Nave — Caça" e o
// criador procura "Caça", ele não acha, e a nave nasce sem BA e sem câmaras —
// com um aviso que a mesa vai ler como "o compêndio está quebrado".
{
  for (const c of classesDeNave) {
    confere(c.seedNome === nomeDaClasse(TIPOS[c.chave].rotulo),
      `o build semeia "${c.seedNome}" e o criador procura "${nomeDaClasse(TIPOS[c.chave].rotulo)}" — ` +
      `a classe não seria encontrada`);
  }
}

/* ── AS OPÇÕES DO SELETOR ──────────────────────────────────────────────────── */
{
  const ops = opcoesDeTipo();
  confere(ops.length === Object.keys(TIPOS).length,
    `${ops.length} opções para ${Object.keys(TIPOS).length} tipos da T10-1`);

  for (const o of ops) {
    confere(o.chave && o.rotulo, "opção sem chave ou rótulo");
    // tamanho e tripulação decidem a escolha mais que os números: é o que diz
    // se a nave é uma cabine ou uma cidade
    confere(/tripulação/.test(o.detalhe), `${o.rotulo}: o detalhe não diz a tripulação`);
    confere(/PV/.test(o.detalhe), `${o.rotulo}: o detalhe não diz os PV`);
    const t = TIPOS[o.chave];
    confere(o.detalhe.includes(t.tamanho), `${o.rotulo}: o tamanho não bate com a T10-1`);
    confere(o.detalhe.includes(String(t.cp)), `${o.rotulo}: o CP não bate com a T10-1`);
  }
}

/* ── A ORDEM E OS SYNCS, LIDOS NO CÓDIGO ───────────────────────────────────── */
{
  const js = fs.readFileSync(
    path.join(RAIZ, "starwars-sd-module", "module", "nave-nova.js"), "utf8");
  const corpo = js.slice(js.indexOf("export async function criarNave"));

  const iRaca = corpo.indexOf("syncRaceAbilities");
  const iClasse = corpo.indexOf("syncClassAbilities");
  confere(iRaca > 0, "a raça entra sem syncRaceAbilities — a nave nasceria com CP 10");
  confere(iClasse > 0, "a classe entra sem syncClassAbilities — as câmaras não viriam");
  confere(iRaca < iClasse,
    "a classe é sincronizada ANTES da raça — o sistema recusa classe em ator sem raça");

  // a guarda que impede a classe sem raça
  confere(/if \(classe && raca\)/.test(corpo),
    "a classe é aplicada sem checar se a raça entrou — e o sistema a recusaria em silêncio");

  // os PV ficam em zero: a T10-1 dá a fórmula, e quem rola é a mesa
  confere(/hp: \{ value: 0, max: 0 \}/.test(corpo),
    "o criador rola os PV sozinho — a T10-1 dá o DADO, e sortear aqui faria duas naves " +
    "do mesmo tipo nascerem diferentes sem ninguém ver a rolagem");
  confere(/role \$\{t\.pv\}/.test(corpo),
    "o aviso não diz QUAL fórmula rolar — quem acabou de criar a nave não sabe de cor");

  // a ficha certa, já escolhida
  confere(/sheetClass: `\$\{ID\}\.NaveSheet`/.test(corpo),
    "a nave nasce com a ficha padrão — a mesa veria uma ficha de personagem comum e " +
    "concluiria que o criador não funcionou");
}

/* ── O CRIADOR PRECISA ESTAR AO ALCANCE ────────────────────────────────────── */
//
// A mesma lição do conversor: uma ferramenta inalcançável é código morto com
// teste verde. Lá o sintoma foi `api.converterTodas` dar undefined.
{
  const entrada = fs.readFileSync(
    path.join(RAIZ, "starwars-sd-module", "module", "starwars-sd.js"), "utf8");
  confere(/from "\.\/nave-nova\.js"/.test(entrada), "o ponto de entrada não importa o criador");
  confere(/\bcriarNave\b/.test(entrada), "criarNave não é exposta — a mesa não teria como chamá-la");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ criador de naves: a raça ANTES da classe e cada uma com o seu sync (sem eles a " +
    "nave nasce com CP 10 e sem câmaras, em silêncio), o nome da classe batendo com o que " +
    "o build semeia, os PV em 0 com a fórmula no aviso, e a ficha certa já escolhida"
);
