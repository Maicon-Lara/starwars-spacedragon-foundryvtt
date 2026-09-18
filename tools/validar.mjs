// Confere o que o build gerou, ANTES de virar LevelDB.
//
// POR QUE ISTO EXISTE: todo erro que este arquivo procura já chegou na mesa.
// Nenhum deles quebra o build — o pack compila feliz e o problema só aparece
// quando alguém abre a ficha. Alguns exemplos reais:
//
//   · <strong> num campo que a ficha renderiza como TEXTO: o jogador leu
//     "<strong>Exceção da Senda:</strong>" escrito na ficha (v1.2.2)
//   · o Herege de Armadura, cuja habilidade-assinatura é o Sangue de Beskar,
//     vinha com "Apenas Leve, sem escudo" e ficava proibido de vestir Beskar
//   · quatro fichas de Senda com 14 habilidades contra as 6 da irmã Guardião
//   · "ver a nota abaixo" apontando para uma nota que tinha sido cortada
//   · "Mantém os Ataques Múltiplos inteiros" dito duas vezes seguidas
//
// Uso:  npm run validar        (roda o build antes, para validar o que sai)
//       npm run validar -- -v  (mostra também os avisos já conhecidos)
//
// ERRO quebra o processo (exit 1). AVISO só relata: são heurísticas, e um
// falso positivo não pode travar o trabalho de ninguém.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const SRC = path.join(ROOT, "packs-src");
const VERBOSO = process.argv.includes("-v") || process.argv.includes("--verbose");

// ── Carrega tudo ────────────────────────────────────────────────────────────
const docs = [];
for (const pack of fs.readdirSync(SRC)) {
  const dir = path.join(SRC, pack);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const arq of fs.readdirSync(dir)) {
    if (!arq.endsWith(".json")) continue;
    const doc = JSON.parse(fs.readFileSync(path.join(dir, arq), "utf8"));
    docs.push({ ...doc, __pack: pack, __arq: arq });
  }
}

const problemas = [];
const erro = (check, doc, msg) =>
  problemas.push({ nivel: "erro", check, doc: doc?.name ?? "?", pack: doc?.__pack, msg });
const aviso = (check, doc, msg) =>
  problemas.push({ nivel: "aviso", check, doc: doc?.name ?? "?", pack: doc?.__pack, msg });

// Percorre todo campo string de um documento.
function textos(doc) {
  const saida = [];
  const anda = (o, caminho) => {
    if (typeof o === "string") saida.push([caminho, o]);
    else if (Array.isArray(o)) o.forEach((v, i) => anda(v, `${caminho}[${i}]`));
    else if (o && typeof o === "object")
      for (const [k, v] of Object.entries(o)) anda(v, caminho ? `${caminho}.${k}` : k);
  };
  anda(doc.system ?? {}, "system");
  anda(doc.pages ?? [], "pages");
  return saida;
}

const semTags = (s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const ehPasta = (d) => d._key?.startsWith("!folders!");

// ═══ ERROS ══════════════════════════════════════════════════════════════════

// 1. Dois documentos com o mesmo _id: um sobrescreve o outro no LevelDB, em
//    silêncio. Aconteceu quando duas habilidades tinham o mesmo nome.
function idDuplicado() {
  const vistos = new Map();
  for (const d of docs) {
    if (!d._id) continue;
    const chave = `${d.__pack}:${d._id}`;
    if (vistos.has(chave))
      erro("id-duplicado", d, `_id ${d._id} já usado por "${vistos.get(chave)}" no mesmo pack`);
    else vistos.set(chave, d.name);
  }
}

// 2. Referência a um documento que não existe. O link fica morto na ficha.
function uuidQuebrado() {
  const existem = new Set(docs.filter((d) => d._id).map((d) => `${d.__pack}:${d._id}`));
  const porPack = new Map();
  for (const d of docs) porPack.set(`${d.__pack}:${d._id}`, d);
  let total = 0;
  for (const d of docs) {
    const bruto = JSON.stringify(d);
    for (const m of bruto.matchAll(
      /Compendium.starwars-sd.(starwars-sd-[a-z]+)\.\w+\.([A-Za-z0-9]{16})/g
    )) {
      total++;
      if (!existem.has(`${m[1]}:${m[2]}`))
        erro("uuid-quebrado", d, `aponta para ${m[1]}.${m[2]}, que não existe`);
    }
  }
  return total;
}

// 3. HTML num campo que a ficha do OD2 renderiza como TEXTO PURO. A tag chega
//    crua ao jogador. Foi o bug da v1.2.2.
const CAMPOS_TEXTO_PURO = [
  /^system\.equipment_restrictions\./,
  /^system\.restrictions\./,
  /^system\.(alignment|movement|size|source)$/,
];
function htmlEmTextoPuro() {
  for (const d of docs) {
    for (const [campo, valor] of textos(d)) {
      if (!CAMPOS_TEXTO_PURO.some((re) => re.test(campo))) continue;
      if (/<[a-z/][^>]*>/i.test(valor))
        erro("html-em-texto-puro", d, `${campo} tem tag: ${valor.slice(0, 70)}…`);
    }
  }
}

// 4. Prosa de conversão vazando para o pack. Só é legítimo com NOTAS_CASA=1.
function notaVazando() {
  if (process.env.NOTAS_CASA === "1") return;
  for (const d of docs)
    for (const [campo, valor] of textos(d))
      if (valor.includes("class='nota-casa'"))
        erro("nota-vazando", d, `${campo} ainda tem uma nota da casa não removida`);
}

// 5. HTML quebrado: tag vazia ou <hr>/<br> pendurado no fim. Quase sempre é
//    sobra de um corte — o parágrafo saiu e a moldura ficou.
function htmlQuebrado() {
  // td/th ficam de fora: célula vazia é normal numa tabela de linhas irregulares.
  const VAZIAS = ["p", "em", "strong", "li", "ul", "ol", "h2", "h3", "blockquote"];
  for (const d of docs) {
    for (const [campo, valor] of textos(d)) {
      if (!valor.includes("<")) continue;
      for (const t of VAZIAS)
        if (new RegExp(`<${t}[^>]*>\\s*</${t}>`, "i").test(valor))
          erro("html-quebrado", d, `${campo} tem <${t}> vazio`);
      if (/(<hr\s*\/?>|<br\s*\/?>)\s*$/i.test(valor))
        erro("html-quebrado", d, `${campo} termina com <hr>/<br> pendurado`);
    }
  }
}

// ═══ AVISOS ═════════════════════════════════════════════════════════════════

// 6. A habilidade promete um equipamento que a restrição da classe proíbe.
//    Era o Herege de Armadura proibido de vestir a própria Beskar.
const CONTRADICOES = [
  {
    citado: /Armadura Beskar|Beskar['’]?gam|armadura pesada de clã/i,
    campo: "armors",
    cobre: /M[ée]dia|Pesada|Beskar|Sem restri/i,
    diz: "veste Beskar (armadura Média)",
  },
  {
    citado: /armas? de haste/i,
    campo: "weapons",
    cobre: /Marcial|qualquer arma|haste|Sem restri/i,
    diz: "usa armas de haste (Marcial)",
  },
  {
    // "droide blindado com escudo próprio" descreve o inimigo, não o personagem.
    citado: /(usa|veste|empunha|pode usar|passa a usar) (um |o )?escudo/i,
    campo: "armors",
    cobre: /pode usar escudo|com escudo|Sem restri/i,
    diz: "usa escudo",
  },
];
function contradizRestricao(porId) {
  for (const d of docs) {
    if (d.type !== "class") continue;
    const er = d.system?.equipment_restrictions ?? {};
    const habs = (d.system.class_abilities ?? [])
      .map((u) => porId.get(`${d.__pack}:${u.split(".").pop()}`))
      .filter(Boolean);
    for (const regra of CONTRADICOES) {
      const culpada = habs.find((h) => regra.citado.test(semTags(h.system?.description ?? "")));
      if (!culpada) continue;
      const linha = er[regra.campo] ?? "";
      if (!regra.cobre.test(linha))
        aviso(
          "contradiz-restricao",
          d,
          `"${culpada.name}" ${regra.diz}, mas ${regra.campo} diz: "${linha.slice(0, 60)}"`
        );
    }
  }
}

// 7. Especializações da mesma classe-base com contagem de habilidades muito
//    diferente. As Sendas chegaram a 14 contra as 6 da irmã Guardião.
function irmasDesiguais() {
  const familias = new Map();
  for (const d of docs) {
    if (d.type !== "class") continue;
    const pai = (d.system?.flavor ?? "").match(
      /Especializa[çc][ãa]o de ([^.<—]+)|O ([^.<]+?) na Senda/i
    );
    if (!pai) continue;
    const base = (pai[1] ?? pai[2]).trim();
    if (!familias.has(base)) familias.set(base, []);
    familias.get(base).push([d, (d.system.class_abilities ?? []).length]);
  }
  for (const [base, membros] of familias) {
    if (membros.length < 2) continue;
    const ns = membros.map(([, n]) => n).sort((a, b) => a - b);
    const mediana = ns[Math.floor(ns.length / 2)];
    for (const [d, n] of membros)
      if (n > mediana * 2)
        aviso(
          "irmas-desiguais",
          d,
          `${n} habilidades; as irmãs de ${base} têm mediana ${mediana}`
        );
  }
}

// 8. A mesma frase dita duas vezes no mesmo campo. Pega o "Mantém os Ataques
//    Múltiplos inteiros" logo antes do "Mantém do Veterano: Ataques Múltiplos".
function fraseRepetida() {
  for (const d of docs) {
    for (const [campo, valor] of textos(d)) {
      const t = semTags(valor);
      if (t.length < 120) continue;
      // Só vale se a repetição está PERTO. Uma linha que se repete de propósito
      // ao longo de uma tabela ("Não existe como item de ficha") não é erro; o
      // bug real era a frase colada na anterior.
      const PERTO = 240;
      const frases = [];
      let pos = 0;
      for (const f of t.split(/(?<=[.!?])\s+/)) {
        if (f.length >= 40) frases.push([f, pos]);
        pos += f.length + 1;
      }
      const nu = (f) => f.toLowerCase().replace(/[^a-záéíóúâêôãõç ]/g, "");
      for (let i = 0; i < frases.length; i++)
        for (let j = i + 1; j < frases.length; j++) {
          if (frases[j][1] - frases[i][1] > PERTO) break;
          if (nu(frases[i][0]) === nu(frases[j][0]))
            aviso("frase-repetida", d, `${campo}: "${frases[j][0].slice(0, 70)}…"`);
        }
    }
  }
}

// 9. Parágrafo que abre com conectivo sem antecedente — sobra de um corte.
//    Foi o "E o problema maior é o outro" da Seção do Mestre.
function conectivoOrfao() {
  const RE = /<p[^>]*>\s*(?:<em>|<strong>)?\s*(E |Mas |Além disso|Por isso|Ou seja|Daí )/g;
  for (const d of docs) {
    for (const [campo, valor] of textos(d)) {
      for (const m of valor.matchAll(RE)) {
        const antes = semTags(valor.slice(0, m.index));
        // Só é suspeito se o conectivo abre o campo inteiro.
        if (antes.length === 0)
          aviso("conectivo-orfao", d, `${campo} começa com "${m[1].trim()}" sem antecedente`);
      }
    }
  }
}

// 10. Ponteiro para algo que não está mais lá: "ver a nota abaixo", "a caixa".
function referenciaPendurada() {
  const RE = /(ver a nota|a nota abaixo|a caixa que|as caixas|conforme a nota|na nota acima)/i;
  for (const d of docs) {
    for (const [campo, valor] of textos(d)) {
      const t = semTags(valor);
      const m = t.match(RE);
      if (!m) continue;
      // Depois do ponteiro tem que sobrar texto — senão aponta para o vazio.
      const depois = t.slice(t.indexOf(m[0]) + m[0].length);
      if (depois.length < 120)
        aviso("referencia-pendurada", d, `${campo}: "${m[0]}" e quase nada depois`);
    }
  }
}

// 11. Monstro sem nenhum ataque. O DataModel aceita, e a ficha abre — mas na
//     cena o Mestre não tem o que clicar. Foi assim que o Krayt Maior (24+10
//     DV, colossal) e uma torreta automática ficaram sem como atacar.
function monstroSemAtaque() {
  for (const d of docs) {
    if (d.type !== "monster") continue;
    const golpes = (d.items ?? []).filter((i) => i.type === "monster_attack").length;
    if (!golpes && !d.system?.described_attacks)
      aviso("monstro-sem-ataque", d, `DV ${d.system?.dv ?? "?"}, e nada para clicar em cena`);
  }
}

// 12. Token do tamanho errado. O sistema declara o tamanho em system.size; se
//     o token continuar 1×1, o Rancor entra na cena do tamanho de um capanga.
const QUADRADOS = { miudo: 1, pequeno: 1, medio: 1, grande: 2, imenso: 3, colossal: 4 };
function tokenForaDeEscala() {
  for (const d of docs) {
    if (d.type !== "monster") continue;
    const esperado = QUADRADOS[d.system?.size] ?? 1;
    const largura = d.prototypeToken?.width ?? 1;
    if (largura !== esperado)
      erro(
        "token-fora-de-escala",
        d,
        `system.size é "${d.system?.size}" (esperado ${esperado}×${esperado}), mas o token é ${largura}×${d.prototypeToken?.height}`
      );
  }
}

// 13. natural_armor escrito como BÔNUS em vez de CA base.
//
//     O sistema faz `if (naturalArmor) return naturalArmor` — o valor SUBSTITUI
//     os 10 padrão. Escrever 1 para dizer "+1 natural" deu um Wookiee com CA
//     base 1 e total −3: acertava-se nele automaticamente. Qualquer valor
//     abaixo de 10 é bônus disfarçado de base.
function armaduraNaturalComoBonus() {
  for (const d of docs) {
    if (d.type !== "race_ability") continue;
    const na = d.system?.natural_armor ?? 0;
    if (na > 0 && na < 10)
      erro(
        "armadura-natural-e-base",
        d,
        `natural_armor=${na} substitui a CA base de 10 (ficaria ${na}). Para "+${na} natural", escreva ${10 + na}`
      );
  }
}

// 14. Pasta sem cor. Não quebra nada — mas numa árvore onde todas as outras
//     têm cor, a sem cor lê como erro. Costuma ser pasta nova sem entrada em
//     tools/data/pastas.mjs.
function pastaSemCor() {
  const porPack = new Map();
  for (const d of docs) {
    if (!ehPasta(d)) continue;
    if (!porPack.has(d.__pack)) porPack.set(d.__pack, []);
    porPack.get(d.__pack).push(d);
  }
  for (const [pack, pastas] of porPack) {
    const semCor = pastas.filter((p) => !p.color);
    // Pack sem cor NENHUMA é uma escolha; pack quase todo colorido com uma
    // sobrando é esquecimento.
    if (semCor.length && semCor.length < pastas.length)
      for (const p of semCor)
        aviso("pasta-sem-cor", p, `${pack}: as outras ${pastas.length - semCor.length} têm cor`);
  }
}

// 15. Prosa de conversão NÃO marcada. Deveria estar em <p class='nota-casa'>.
function prosaSolta() {
  const RE = /(Corre[çc][ãa]o da casa|Convers[ãa]o da casa|Cria[çc][ãa]o da casa|Nota de convers|Nota de balan|no Space Dragon (o|a|era|tinha|dizia)|o livro (dizia|tirava|manda))/i;
  for (const d of docs) {
    for (const [campo, valor] of textos(d)) {
      for (const p of valor.matchAll(/<p(?![^>]*nota-casa)[^>]*>[\s\S]*?<\/p>/g)) {
        const t = semTags(p[0]);
        // A marca tem que ABRIR o parágrafo. Uma menção de passagem no meio de
        // uma regra ("o livro manda rolar de novo") não é nota de conversão.
        if (t.length > 140 && RE.test(t.slice(0, 60)))
          aviso("prosa-solta", d, `${campo}: "${t.slice(0, 80)}…"`);
      }
    }
  }
}

// ── Roda tudo ───────────────────────────────────────────────────────────────
const porId = new Map(docs.filter((d) => d._id).map((d) => [`${d.__pack}:${d._id}`, d]));

idDuplicado();
const refs = uuidQuebrado();
htmlEmTextoPuro();
notaVazando();
htmlQuebrado();
contradizRestricao(porId);
irmasDesiguais();
fraseRepetida();
conectivoOrfao();
referenciaPendurada();
monstroSemAtaque();
tokenForaDeEscala();
armaduraNaturalComoBonus();
pastaSemCor();
prosaSolta();

// ── Rótulo dos tipos de documento que o módulo declara ─────────────────────
// Um subtipo sem entrada TYPES.* nos arquivos de idioma aparece na janela com
// a chave crua: "TYPES.Actor.stardragon.nave: Millennium Falcon". Foi o que
// aconteceu com a Nave na v1.8.0.
//
// Roda fora do laço principal porque lê module.json e lang/, não os packs.
{
  const mod = JSON.parse(fs.readFileSync(path.join(ROOT, "starwars-sd-module", "module.json"), "utf8"));
  const langDir = path.join(ROOT, "starwars-sd-module", "lang");
  const idiomas = fs.existsSync(langDir)
    ? fs.readdirSync(langDir).filter((f) => f.endsWith(".json"))
    : [];
  for (const [doc, tipos] of Object.entries(mod.documentTypes ?? {}))
    for (const tipo of Object.keys(tipos)) {
      const chave = `TYPES.${doc}.${mod.id}.${tipo}`;
      for (const arq of idiomas) {
        const dic = JSON.parse(fs.readFileSync(path.join(langDir, arq), "utf8"));
        if (!dic[chave])
          problemas.push({
            nivel: "erro",
            check: "tipo-sem-rotulo",
            doc: `${doc}.${tipo}`,
            pack: arq,
            msg: `falta "${chave}" em lang/${arq} — a janela mostraria a chave crua`,
          });
      }
    }
}

// ── O README aponta para uma pasta do cofre que existe? ────────────────────
// O caminho mudou três vezes em 2026 e o README ficou para trás duas — quem foi
// transcrever procurou no lugar errado. Só AVISA: o cofre é da máquina do autor
// e não existe num clone.
{
  const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
  const m = readme.match(/`Documents\\Ekhoria\\([^`]+)`/);
  const casa = process.env.USERPROFILE || process.env.HOME || "";
  if (m && casa) {
    const partes = m[1].split("\\").filter(Boolean);
    const raiz = path.join(casa, "Documents", "Ekhoria");
    const alvo = path.join(raiz, ...partes);
    // Âncora na RAIZ do cofre, não no pai do alvo: se o README apontar para
    // "99 Inexistente/Star Dragon", o pai também não existe e a checagem
    // passaria batido. Num clone sem o cofre, a raiz não existe e o aviso
    // simplesmente não roda.
    if (fs.existsSync(raiz) && !fs.existsSync(alvo))
      problemas.push({
        nivel: "aviso",
        check: "cofre-nao-existe",
        doc: "README.md",
        pack: "",
        msg: `aponta para Ekhoria\\${m[1]}, que não existe nesta máquina`,
      });
  }
}

// ── heranca-nao-coberta ─────────────────────────────────────────────────────
//
// Toda habilidade da classe-base tem de estar, na ficha da especializacao, num
// destes tres estados: presente na lista, declarada removida, ou substituida
// por outra que a nomeie. O que nao estiver em nenhum e um buraco silencioso —
// e foi exatamente esse buraco que deixou o Guardiao sem "Poderes da Forca"
// ate a 1.18.0, porque o cofre declara a heranca das Sendas por atalho
// ("mantem todas as de 1o nivel") em vez de repetir a lista.
//
// O parentesco sai da PASTA, nao do nome: as classes foram renomeadas para o
// rotulo curto ("Mercenario", nao "Veterano — Mercenario"), e a pasta e quem
// guarda "Veterano > Mercenario".
//
// Carve-out dos Talentos: cada trilha de Operativo troca "Talentos de
// Operativo" pelo seu proprio pacote ("Talentos de Espiao"), com outra lista.
// A substituicao e estrutural e nao nomeia a original, entao qualquer
// "Talentos de …" na trilha cobre o "Talentos de …" da base.
//
// Aviso, e nao erro: cobertura por citacao e heuristica de texto, e uma
// reescrita legitima pode deixar de nomear a habilidade antiga.
{
  const pastas = new Map(docs.filter(ehPasta).map((d) => [d._id, d]));
  const classes = docs.filter((d) => d.type === "class");
  const porNome = new Map(classes.map((c) => [c.name, c]));
  const abilPorUuid = new Map(
    docs
      .filter((d) => d.type === "class_ability" && d._id)
      .map((d) => [`Compendium.starwars-sd.${d.__pack}.Item.${d._id}`, d])
  );
  const habsDe = (c) =>
    (c.system?.class_abilities ?? []).map((u) => abilPorUuid.get(u)).filter(Boolean);

  for (const spec of classes) {
    const pai = pastas.get(pastas.get(spec.folder)?.folder)?.name;
    const base = pai && porNome.get(pai);
    if (!base || base.name === spec.name) continue;

    const proprias = habsDe(spec);
    const nomes = new Set(proprias.map((h) => h.name));
    const temTalentos = [...nomes].some((n) => /^Talentos de /.test(n));
    const texto = semTags(
      (spec.system?.description ?? "") +
        (spec.system?.restrictions ?? "") +
        // Só as DESCRIÇÕES, nunca os NOMES: "Aprender Poderes da Força" contém
        // "Poderes da Força" como substring e absolvia, sozinha, a ausência da
        // habilidade que ela apenas menciona. Nome que engloba não é citação.
        proprias.map((h) => h.system?.description ?? "").join(" ")
    );

    for (const hb of habsDe(base)) {
      if (nomes.has(hb.name)) continue;
      if (/^Talentos de /.test(hb.name) && temTalentos) continue;
      if (texto.includes(hb.name)) continue;
      aviso(
        "heranca-nao-coberta",
        spec,
        `"${hb.name}", de ${base.name}, não está na lista, não é citada e não consta como removida`
      );
    }
  }
}

// ── Relatório ───────────────────────────────────────────────────────────────
const erros = problemas.filter((p) => p.nivel === "erro");
const avisos = problemas.filter((p) => p.nivel === "aviso");

const conta = { docs: docs.length, pastas: docs.filter(ehPasta).length, refs };
console.log(
  `Validando ${conta.docs} documentos (${conta.pastas} pastas) e ${conta.refs} referências…\n`
);

function mostra(lista, rotulo) {
  const porCheck = new Map();
  for (const p of lista) {
    if (!porCheck.has(p.check)) porCheck.set(p.check, []);
    porCheck.get(p.check).push(p);
  }
  for (const [check, itens] of [...porCheck].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${rotulo} ${check} — ${itens.length}`);
    for (const p of itens.slice(0, 8)) console.log(`      ${p.doc}: ${p.msg}`);
    if (itens.length > 8) console.log(`      … e mais ${itens.length - 8}`);
  }
}

if (erros.length) mostra(erros, "✘");
if (avisos.length && (VERBOSO || !erros.length)) mostra(avisos, "▲");

if (!erros.length && !avisos.length) console.log("Tudo verde.");
else {
  console.log(
    `\n${erros.length} erro(s), ${avisos.length} aviso(s).` +
      (avisos.length && !VERBOSO && erros.length ? " Use -v para ver os avisos." : "")
  );
}

process.exit(erros.length ? 1 : 0);
