// Teste dos efeitos dos críticos (QdV), sem Foundry e sem o módulo instalado.
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// O `normalizeEffect` do QdV descarta EM SILÊNCIO todo modificador cuja chave
// não esteja em EFFECT_KEYS ou cujo modo não esteja em EFFECT_MODES — sem erro,
// sem aviso no console. Um efeito com `movement` em vez de `movement.normal`
// entra na ficha, aparece na lista de efeitos, e não faz nada. O Mestre arrasta,
// vê o nome lá, e joga a sessão inteira achando que o ferimento está valendo.
//
// Por isso este teste não confere só a forma: ele REIMPLEMENTA o descarte e a
// aplicação do QdV, linha por linha como estão no código dele, e mede o número
// que a ficha mostraria. Se um modificador nosso for descartado, o teste quebra
// aqui e não na mesa.
//
// Uso: node tools/teste-efeitos-criticos.mjs

import {
  EFEITOS_CRITICOS, templateDoQdV, QDV_ID, QDV_FLAG,
  QDV_KEYS, QDV_MODES, QDV_DURACOES,
} from "./data/efeitos-criticos.mjs";
import { efeitoQdVDoc } from "./lib.mjs";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── O CÓDIGO DO QdV, REIMPLEMENTADO ──────────────────────────────────────
 *
 * Transcrito de `scripts/features/effect-manager/model.js` (v0.10.96). Não é
 * uma aproximação: é o mesmo descarte e a mesma ordem de aplicação, para que
 * medir aqui valha por medir lá.
 */
function normalizaModificadores(mods) {
  return (Array.isArray(mods) ? mods : []).flatMap((m) => {
    const key = String(m?.key || "") === "hp" ? "hp.max" : String(m?.key || "");
    const mode = String(m?.mode || "add");
    const value = String(m?.value ?? "").trim();
    if (!QDV_KEYS.has(key) || !QDV_MODES.has(mode) || !value) return [];
    return [{ key, mode, value }];
  });
}

function aplica(base, mods, key) {
  let r = Number(base) || 0;
  for (const m of mods) {
    if (m.key !== key) continue;
    const v = Number(m.value) || 0;
    if (m.mode === "override") r = v;
    else if (m.mode === "multiply") r *= v;
    else if (m.mode === "divide") r = v === 0 ? r : r / v;
    else if (m.mode === "reduce") r -= v;
    else r += v;
  }
  return r;
}

/* ── A FORMA DE CADA EFEITO ───────────────────────────────────────────────── */

confere(EFEITOS_CRITICOS.length >= 5,
  `${EFEITOS_CRITICOS.length} efeitos; a T7-4 dá 3 e a T7-5 dá 2`);

const nomes = new Set();
for (const e of EFEITOS_CRITICOS) {
  confere(!!e.nome && !nomes.has(e.nome), `nome repetido ou vazio: ${e.nome}`);
  nomes.add(e.nome);
  // "de qual tabela" não é enfeite: é o que o Mestre lê na ficha para saber de
  // onde veio aquele −2 três sessões depois.
  confere(/^T7-[45], resultado \d$/.test(e.de ?? ""),
    `${e.nome}: a origem devia ser "T7-4, resultado N", veio "${e.de}"`);
  confere((e.icone ?? "").startsWith("icons/"), `${e.nome}: ícone fora de icons/`);
  confere((e.descricao ?? "").includes("<p>"), `${e.nome}: descrição sem HTML`);
  confere(Array.isArray(e.modificadores) && e.modificadores.length > 0,
    `${e.nome}: efeito sem modificador nenhum não muda número da ficha`);
}

/* ── NENHUM MODIFICADOR PODE SER DESCARTADO ─────────────────────────────── */

for (const e of EFEITOS_CRITICOS) {
  const t = templateDoQdV(e, "idfixo");
  const sobraram = normalizaModificadores(t.modifiers);
  confere(sobraram.length === t.modifiers.length,
    `${e.nome}: o QdV DESCARTARIA ${t.modifiers.length - sobraram.length} de ` +
    `${t.modifiers.length} modificadores — chave ou modo inválido, e em silêncio ` +
    `(${t.modifiers.map((m) => `${m.key}/${m.mode}`).join(", ")})`);
  // `value` precisa ser string truthy: `normalizeEffect` faz String(...).trim()
  // e descarta o vazio. Um `value: 0` numérico cairia aqui.
  for (const m of t.modifiers) {
    confere(typeof m.value === "string" && m.value.trim() !== "",
      `${e.nome}: value "${m.value}" não é string útil — o QdV descartaria`);
  }
  confere(QDV_DURACOES.has(t.duration.type),
    `${e.nome}: duração "${t.duration.type}" não existe no QdV (viraria "permanent")`);
  // Associação vazia: com "class"/"race"/"spell"/"equipment" o efeito morreria
  // junto com o item associado, e um crítico não pertence a item nenhum.
  confere(t.association.type === "",
    `${e.nome}: associação "${t.association.type}" amarraria o crítico a um item`);
  confere(t.enabled === true, `${e.nome}: entraria desligado na ficha`);
  confere(t.origin.startsWith("Space Dragon —"),
    `${e.nome}: a origem não diz que é regra do Space Dragon`);
}

/* ── O NÚMERO QUE A FICHA MOSTRARIA ─────────────────────────────────────── */
//
// Aqui o teste deixa de conferir forma e passa a conferir REGRA: o que o
// jogador vê depois de arrastar o efeito.

const porNome = new Map(EFEITOS_CRITICOS.map((e) => [e.nome, normalizaModificadores(templateDoQdV(e, "x").modifiers)]));

const movimento = porNome.get("Ferimento — movimentação à metade");
confere(aplica(10, movimento, "movement.normal") === 5,
  `movimento 10 à metade devia dar 5, deu ${aplica(10, movimento, "movement.normal")}`);
confere(aplica(9, movimento, "movement.normal") === 4.5,
  "a metade de um ímpar não é arredondada aqui — quem arredonda é a ficha");
// e não pode encostar na corrida: dividir os dois campos arriscaria um quarto
confere(aplica(30, movimento, "movement.run") === 30,
  "o efeito não deve mexer no Movimento de corrida");

const ataques = porNome.get("Ferimento — −2 nos ataques");
confere(aplica(3, ataques, "attack") === 1, "ataque +3 com o ferimento vira +1");
confere(aplica(0, ataques, "attack") === -2, "sem bônus, o ferimento leva a −2");

const vestes = porNome.get("Vestes avariadas — −2 no CP");
confere(aplica(14, vestes, "ac") === 12, "CP 14 com vestes rasgadas vira 12");

const desequilibrio = porNome.get("Desequilíbrio — −1 no CP");
confere(aplica(14, desequilibrio, "ac") === 13, "CP 14 desequilibrado vira 13");

const queda = porNome.get("Queda — −1 no CP");
confere(aplica(14, queda, "ac") === 13, "CP 14 caído vira 13");

// Dois críticos no mesmo personagem somam, e é o que a regra espera: quem levou
// a T7-4 duas vezes está pior do que quem levou uma.
confere(aplica(14, [...vestes, ...queda], "ac") === 11,
  `vestes rasgadas e caído: 14 − 2 − 1 = 11, deu ${aplica(14, [...vestes, ...queda], "ac")}`);

/* ── A DURAÇÃO ──────────────────────────────────────────────────────────── */
//
// Só o desequilíbrio tem prazo. Os ferimentos da T7-4 são permanentes porque o
// livro NÃO diz quando saram — e inventar "até o próximo descanso" seria o
// módulo escrevendo regra no lugar do autor.

const temporarios = EFEITOS_CRITICOS.filter((e) => (e.duracao?.type ?? "permanent") !== "permanent");
confere(temporarios.length === 1 && temporarios[0].nome.startsWith("Desequilíbrio"),
  `só o desequilíbrio devia ter prazo; têm: ${temporarios.map((e) => e.nome).join(", ") || "nenhum"}`);
{
  const t = templateDoQdV(temporarios[0], "x");
  confere(t.duration.type === "rounds" && t.duration.value === 1 && t.duration.remaining === 1,
    "o desequilíbrio dura 1 rodada, e já entra com a rodada a gastar");
  confere(t.deleteOnExpire === true,
    "o desequilíbrio some sozinho ao expirar — senão a ficha acumula efeito morto");
}
for (const e of EFEITOS_CRITICOS) {
  if ((e.duracao?.type ?? "permanent") !== "permanent") continue;
  const t = templateDoQdV(e, "x");
  confere(t.deleteOnExpire === false,
    `${e.nome}: é permanente e não deve se apagar — quem o tira é o Mestre`);
}

/* ── O DOCUMENTO DO COMPÊNDIO ───────────────────────────────────────────── */

const ids = new Set();
for (const e of EFEITOS_CRITICOS) {
  const doc = efeitoQdVDoc(e, "pastaX", 100, { modulo: QDV_ID, flag: QDV_FLAG, template: templateDoQdV });
  // `type: "misc"` é o que o `libraryItemData` do QdV cria; outro tipo abriria
  // uma ficha de arma ou armadura por cima do efeito.
  confere(doc.type === "misc", `${e.nome}: tipo ${doc.type}, o QdV usa misc`);
  confere(doc._key === `!items!${doc._id}`, `${e.nome}: _key fora do formato do CLI`);
  confere(!ids.has(doc._id), `${e.nome}: _id repetido — o build sobrescreveria um efeito`);
  ids.add(doc._id);
  // O caminho da flag É a interface com o QdV: se mudar, o arrasto deixa de ser
  // reconhecido e o item vira descrição.
  const t = doc.flags?.[QDV_ID]?.[QDV_FLAG];
  confere(!!t, `${e.nome}: a flag do QdV não está em flags["${QDV_ID}"]["${QDV_FLAG}"]`);
  confere(t?.id === doc._id, `${e.nome}: o id do efeito devia acompanhar o do item`);
  confere(doc.img === e.icone, `${e.nome}: a img do item devia ser o ícone do efeito`);
  // Um efeito não é mercadoria: peso zero, senão entra no limite de carga de
  // quem levou o crítico — e levar um tiro não pesa.
  confere(doc.system.weight_in_load === 0 && doc.system.weight_in_grams === 0 && doc.system.cost === "",
    `${e.nome}: efeito com peso ou preço entraria na conta de carga`);
  // A descrição do item vai num <textarea> da ficha do sistema: texto, não HTML
  confere(!/<\/?(p|strong|em)>/.test(doc.system.description ?? ""),
    `${e.nome}: a descrição do item tem tag HTML, e a ficha a exibe cru`);
  // E o determinismo: o mesmo conteúdo, o mesmo _id, build após build
  const outra = efeitoQdVDoc(e, "pastaY", 999, { modulo: QDV_ID, flag: QDV_FLAG, template: templateDoQdV });
  confere(outra._id === doc._id, `${e.nome}: o _id mudou entre chamadas — não é determinístico`);
}

/* ── A PASTA NÃO PODE AMARRAR ───────────────────────────────────────────── */
//
// `importEffectTemplate` do QdV lê o NOME da pasta de onde o item veio: se for
// "Classe", "Raça", "Magia" ou "Equipamentos", ele amarra o efeito àquele tipo
// de item, e o efeito passa a morrer junto com ele.
{
  const AMARRAM = new Set(["Classe", "Raça", "Magia", "Equipamentos"]);
  const buildMjs = await import("node:fs").then((fs) =>
    fs.readFileSync(new URL("./build.mjs", import.meta.url), "utf8"));
  const m = buildMjs.match(/folderDoc\("([^"]+)", "Item", "efeitos"\)/);
  confere(!!m, "não achei a pasta do pack de efeitos no build");
  confere(m && !AMARRAM.has(m[1]),
    `a pasta "${m?.[1]}" é um dos nomes que o QdV usa para amarrar o efeito a um item`);
}

/* ── O PACK ESTÁ DECLARADO ──────────────────────────────────────────────── */
{
  const fs = await import("node:fs");
  const mod = JSON.parse(fs.readFileSync(new URL("../starwars-sd-module/module.json", import.meta.url), "utf8"));
  const pack = mod.packs.find((p) => p.name === "starwars-sd-efeitos");
  confere(!!pack, "o pack de efeitos não está declarado no module.json");
  confere(pack?.type === "Item", "o pack de efeitos tem de ser de Item");
  confere(mod.packFolders?.[0]?.packs?.includes("starwars-sd-efeitos"),
    "o pack ficaria solto na barra lateral, fora da pasta do módulo");
  // O QdV NÃO é dependência: quem não o tem vê itens de descrição, e as tabelas
  // roláveis continuam valendo. Declará-lo obrigaria a instalar um módulo de
  // terceiro para abrir este.
  const exigidos = (mod.relationships?.requires ?? []).map((r) => r.id);
  confere(!exigidos.includes(QDV_ID),
    "o QdV não deve ser dependência obrigatória — os efeitos são um extra opcional");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ efeitos dos críticos: nenhum modificador descartado pelo QdV, os números " +
    "na ficha (CP, ataques, movimento à metade), críticos que somam, o prazo só " +
    "no desequilíbrio, a flag no caminho certo, a pasta que não amarra e o pack " +
    "declarado sem exigir o QdV"
);
