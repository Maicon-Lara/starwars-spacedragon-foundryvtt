/**
 * Criar uma nave pronta, numa ação só.
 *
 * ── O PROBLEMA QUE ISTO RESOLVE ─────────────────────────────────────────────
 *
 * Fazer uma nave à mão são quatro passos, e nenhum é óbvio:
 *
 *   1. criar um ator do tipo PERSONAGEM (e não "Nave", que não existe mais)
 *   2. trocar a ficha para a de Nave, numa engrenagem do cabeçalho
 *   3. arrastar a RAÇA do tipo, do compêndio Naves
 *   4. arrastar a CLASSE de mesmo nome — e nessa ordem, porque o sistema
 *      recusa a classe sem raça com uma notificação que some em segundos
 *
 * A mesa errou os passos 1 e 4 no mesmo dia. O guia na ficha ajuda quem já
 * chegou lá; isto evita a viagem.
 *
 * ── POR QUE A ORDEM IMPORTA AQUI TAMBÉM ─────────────────────────────────────
 *
 * As habilidades de raça entram pelo `syncRaceAbilities` do sistema, e é a
 * habilidade que carrega o `natural_armor` — ou seja, o CP. Embutir os itens
 * sem chamar o sync cria uma nave com CP 10, e o erro só aparece quando alguém
 * leva um tiro.
 */

import { naveVazia, FLAG } from "./nave-pc-dados.js";
import { TIPOS } from "./tipos-de-nave.js";

const ID = "starwars-sd";
const PACK = "starwars-sd.starwars-sd-naves";

/** O nome da classe de nave de um tipo, como o build a semeia. */
export function nomeDaClasse(rotulo) {
  return `Nave — ${rotulo}`;
}

/** As opções do seletor: os oito tipos da T10-1, com o que a mesa precisa ver. */
export function opcoesDeTipo() {
  return Object.entries(TIPOS).map(([chave, t]) => ({
    chave,
    rotulo: t.rotulo,
    // tamanho e tripulação decidem a escolha mais do que os números: é o que
    // diz se a nave é uma cabine ou uma cidade
    detalhe: `${t.tamanho} · tripulação ${t.tripulacao} · PV ${t.pv} · CP ${t.cp} · BA +${t.ba}`,
  }));
}

/**
 * Busca a raça e a classe de um tipo no compêndio.
 *
 * Devolve o que achou e o que faltou, em vez de falhar: uma nave sem a classe
 * ainda é melhor que nenhuma nave, e o aviso diz o que arrastar à mão.
 */
export async function itensDoTipo(chave) {
  const t = TIPOS[chave];
  const pack = globalThis.game?.packs?.get?.(PACK);
  if (!t || !pack) return { raca: null, classe: null, faltou: ["o compêndio de Naves"] };

  const idx = await pack.getIndex();
  const achar = (nome, tipo) => idx.find?.((e) => e.name === nome && e.type === tipo);
  const eRaca = achar(t.rotulo, "race");
  const eClasse = achar(nomeDaClasse(t.rotulo), "class") ?? achar(t.rotulo, "class");

  const faltou = [];
  if (!eRaca) faltou.push(`a raça “${t.rotulo}”`);
  if (!eClasse) faltou.push(`a classe “${nomeDaClasse(t.rotulo)}”`);

  return {
    raca: eRaca ? await pack.getDocument(eRaca._id) : null,
    classe: eClasse ? await pack.getDocument(eClasse._id) : null,
    faltou,
  };
}

/**
 * Cria a nave pronta: ator, ficha, tipo, classe e as habilidades sincronizadas.
 *
 * Os PV ficam em zero de propósito. A T10-1 dá uma FÓRMULA (1d100, 2d1000), e
 * quem rola é a mesa — sortear aqui faria duas naves do mesmo tipo nascerem
 * diferentes sem ninguém ver o dado, e tiraria do Mestre a nave-padrão.
 */
export async function criarNave({ nome, tipo } = {}) {
  const t = TIPOS[tipo];
  if (!t) return { ator: null, avisos: [`Tipo de nave desconhecido: ${tipo}`] };

  const avisos = [];
  const ator = await globalThis.Actor?.create?.({
    name: nome?.trim() || t.rotulo,
    type: "character",
    system: { hp: { value: 0, max: 0 } },
    flags: {
      [ID]: { [FLAG]: { ...naveVazia(), tipo } },
      core: { sheetClass: `${ID}.NaveSheet` },
    },
  });
  if (!ator) return { ator: null, avisos: ["O Foundry recusou criar o ator."] };

  const { raca, classe, faltou } = await itensDoTipo(tipo);
  avisos.push(...faltou.map((f) => `Não achei ${f} no compêndio — arraste à mão.`));

  // A RAÇA PRIMEIRO, e com o sync: é ele que traz a habilidade onde mora o CP.
  if (raca) {
    await ator.createEmbeddedDocuments("Item", [raca.toObject()]);
    try {
      await ator.system.syncRaceAbilities?.();
    } catch (e) {
      avisos.push(`A raça entrou, mas as habilidades dela não sincronizaram (${e?.message ?? e}). O CP pode estar em 10.`);
    }
  }
  // a classe só depois, porque o sistema a recusa num ator sem raça
  if (classe && raca) {
    await ator.createEmbeddedDocuments("Item", [classe.toObject()]);
    try {
      await ator.system.syncClassAbilities?.();
    } catch (e) {
      avisos.push(`A classe entrou, mas as câmaras não sincronizaram (${e?.message ?? e}).`);
    }
  } else if (classe && !raca) {
    avisos.push("A classe não foi aplicada: o sistema a recusa sem a raça.");
  }

  avisos.push(`PV em 0: role ${t.pv} e anote — a tabela dá o dado, e quem rola é a mesa.`);
  return { ator, avisos };
}

/* ── O DIÁLOGO E O BOTÃO ───────────────────────────────────────────────────── */

/**
 * Pergunta o nome e o tipo, e cria.
 *
 * Um diálogo e não um comando de console: criar nave é coisa que se faz muitas
 * vezes, e a barra lateral é onde se procura. O conversor ficou no console
 * porque é ação de uma vez na vida do mundo; este não.
 */
export async function dialogoDeNovaNave() {
  const D = globalThis.foundry?.applications?.api?.DialogV2;
  const opcoes = opcoesDeTipo()
    .map((o) => `<option value="${o.chave}">${o.rotulo} — ${o.detalhe}</option>`)
    .join("");
  const conteudo =
    `<p>A nave nasce com a <strong>Ponte</strong> e a <strong>Sala de Máquinas</strong>; ` +
    `o resto se instala na aba Câmaras.</p>` +
    `<div class="form-group"><label>Nome</label>` +
    `<input type="text" name="nome" placeholder="Falcão de Lata"></div>` +
    `<div class="form-group"><label>Tipo (T10-1)</label>` +
    `<select name="tipo">${opcoes}</select></div>`;

  const dados = await D?.prompt?.({
    window: { title: "Nova nave" },
    content: conteudo,
    ok: {
      label: "Criar",
      callback: (_ev, botao) => ({
        nome: botao.form.elements.nome.value,
        tipo: botao.form.elements.tipo.value,
      }),
    },
  });
  if (!dados) return null;

  const { ator, avisos } = await criarNave(dados);
  if (ator) {
    // abre a ficha: quem acabou de criar quer ver, e o aviso dos PV só faz
    // sentido com a ficha à frente
    ator.sheet?.render?.(true);
    for (const a of avisos) globalThis.ui?.notifications?.info?.(a);
  } else {
    for (const a of avisos) globalThis.ui?.notifications?.error?.(a);
  }
  return ator;
}

/** Põe o botão "Nova nave" no cabeçalho da aba de Atores. */
export function ligarBotaoDeNovaNave() {
  globalThis.Hooks?.on?.("renderActorDirectory", (_app, html) => {
    try {
      const raiz = html instanceof HTMLElement ? html : html?.[0];
      const cabeca = raiz?.querySelector?.(".header-actions, .directory-header .action-buttons");
      if (!cabeca || cabeca.querySelector(".sw-nova-nave")) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "sw-nova-nave";
      b.innerHTML = `<i class="fa-solid fa-rocket"></i> Nova nave`;
      b.addEventListener("click", () => dialogoDeNovaNave());
      cabeca.append(b);
    } catch (e) {
      console.warn("starwars-sd | não pude pôr o botão de nova nave", e);
    }
  });
}
