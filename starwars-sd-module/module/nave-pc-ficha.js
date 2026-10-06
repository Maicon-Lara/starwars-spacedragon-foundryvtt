/**
 * A Ficha de Nave feita sobre a ficha de PERSONAGEM.
 *
 * ── POR QUE ISTO EXISTE, SE JÁ HÁ UMA FICHA DE NAVE ─────────────────────────
 *
 * Porque a ficha de nave própria (nave-ficha.js) é um template nosso de 350
 * linhas e um CSS que acompanha. Ela funciona, mas tudo nela é nosso para
 * manter: o espaçamento, as abas, o comportamento ao encolher, o contraste em
 * cada tema. Um dia inteiro de correções de cor saiu daí.
 *
 * Esta herda a ficha do sistema inteira — como a Ficha Space Dragon faz — e só
 * acrescenta uma classe no elemento. Aparência, abas e tipografia vêm do
 * sistema, de graça, e acompanham as versões dele.
 *
 * ── O QUE MUDOU DE ONTEM PARA HOJE ──────────────────────────────────────────
 *
 * Ontem eu desaconselhei este caminho, e o motivo era o Combate Tático: dial,
 * manobras, hexes, Sobrecarga e planejar/revelar não cabem numa ficha de
 * personagem sem violência. SEM o Tático — que é o que o autor decidiu — sobra
 * um conjunto que cabe: CP, PV, BA, JP, esquiva, armas, câmaras, equipamentos,
 * combustível, postos, energia, avarias e fuga.
 *
 * A ficha própria continua existindo para quem usa o Tático. Esta é a do §10.6.
 *
 * ── O MAPA, DECIDIDO COM O AUTOR ────────────────────────────────────────────
 *
 *   Ataques       as armas da nave
 *   Raça          → "Tipo da nave" (T10-1)
 *   Classe        → "Câmaras" (T10-2), as alterações estruturais
 *   Poderes       → "Tripulação", os cinco postos
 *   Equipamentos  os adicionais da T10-4 e o combustível
 *   Detalhes      as notas
 *
 * NÃO há aba de atributos: uma nave não tem Força nem Intelecto. E a
 * movimentação é UMA só — os quatro campos do personagem (normal, escalada,
 * voo, natação) não têm equivalente.
 */

import {
  naveDe, estadoDoComodo, proximoEstado, comodosInstalados, FLAG,
} from "./nave-pc-dados.js";

const ID = "starwars-sd";
export const MARCA_NAVE_PC = "starwars-sd-nave-pc";

/**
 * A classe-base: a Ficha Space Dragon, se o módulo vizinho a registrou; senão a
 * do sistema.
 *
 * Preferir a do vizinho não é capricho: ela já traz a JP pela regra do livro e o
 * lançamento de poder pelo Cap. 9. Herdar dela é herdar isso junto.
 */
function baseDaFicha() {
  const registro = CONFIG.Actor?.sheetClasses?.character ?? {};
  const classes = Object.values(registro).map((e) => e?.cls).filter(Boolean);
  const doVizinho = classes.find((c) => c.name === "SDCharacterSheet");
  const doSistema = classes.find((c) => c.name === "OD2CharacterSheet");
  const achada = doVizinho ?? doSistema ?? null;
  if (!achada) {
    console.warn(
      `${ID} | nem SDCharacterSheet nem OD2CharacterSheet no registro — ` +
      `a Ficha de Nave sobre personagem não será registrada`
    );
  }
  return achada;
}

/* ── OS RÓTULOS DAS ABAS ───────────────────────────────────────────────────
 *
 * Trocados no DOM, e não no `lang`: o idioma é GLOBAL, e renomear "Raça" para
 * "Tipo da nave" no lang faria o personagem comum da mesma mesa mostrar "Tipo
 * da nave" na ficha dele. Aqui a troca vale só dentro desta ficha.
 */
export const ROTULOS = {
  race: "Tipo",
  class: "Câmaras",
  spells: "Tripulação",
  equipment: "Equipamentos",
  attacks: "Armamento",
  details: "Detalhes",
};

/**
 * O que a ficha de personagem mostra e a nave não tem.
 *
 * Escondido por CSS (ver livro.css), e não removido do DOM: o sistema redesenha
 * a ficha a cada mudança, e o que se remove volta no próximo render. Esconder
 * sobrevive ao redesenho sem uma linha de JS.
 */
export const ESCONDIDOS = [
  "a aba de atributos",
  "os campos de movimento que não são o normal (escalada, voo, natação)",
  "XP e progressão de nível",
  "idiomas e alinhamento",
];

let Registrada = null;

/** Esta ficha é a de Nave sobre personagem? */
export function ehFichaDeNavePC(app) {
  return !!Registrada && app instanceof Registrada;
}

/**
 * Renomeia as abas e marca a ficha.
 *
 * Roda a cada render porque o sistema redesenha a ficha inteira a cada
 * alteração — um rótulo trocado uma vez só voltaria a "Raça" no primeiro
 * salvamento.
 */
export function renomearAbas(raiz) {
  if (!raiz) return 0;
  let trocados = 0;
  for (const item of raiz.querySelectorAll(".sheet-tabs .item, nav .item")) {
    const chave = item.dataset?.tab;
    const novo = ROTULOS[chave];
    if (!novo) continue;
    // só o texto, preservando ícone e qualquer marcação que o sistema ponha
    for (const no of item.childNodes) {
      if (no.nodeType === 3 && no.textContent.trim()) {
        no.textContent = ` ${novo} `;
        trocados += 1;
        break;
      }
    }
    if (!item.textContent.includes(novo)) {
      item.textContent = novo;
      trocados += 1;
    }
  }
  return trocados;
}


/* ── O SELETOR DE CÔMODOS ─────────────────────────────────────────────────
 *
 * A classe entrega os doze cômodos a toda nave — a aba de classe do sistema
 * não aceita habilidades avulsas, então não dá para montar a nave tirando
 * cômodos da lista. Ela se monta DIZENDO quais existem, e é o que este seletor
 * faz: um clique gira ausente → instalada → danificada → ausente.
 *
 * O padrão é AUSENTE. Uma nave nova não tem hospital nem laboratório só porque
 * a classe os listou.
 *
 * ── COMO O CÔMODO É RECONHECIDO ───────────────────────────────────────────
 *
 * Pela FLAG do item, e não pelo nome: `flags["starwars-sd"].camaraDeNave.chave`.
 * Nome muda com tradução e com revisão de texto; a flag é nossa e não muda.
 */
export const CLASSE_SELETOR = "sw-comodo-estado";

const ROTULO_DO_ESTADO = {
  instalada: "instalada",
  danificada: "danificada",
  ausente: "não tem",
};

/** O seletor de um cômodo, em HTML. */
export function botaoDoComodo(chave, estado) {
  const rotulo = ROTULO_DO_ESTADO[estado] ?? estado;
  return (
    `<button type="button" class="${CLASSE_SELETOR} estado-${estado}" ` +
    `data-comodo="${chave}" ` +
    `title="Clique para girar: não tem → instalada → danificada. ` +
    `A T10-2 cobra 25% do valor para reparar.">${rotulo}</button>`
  );
}

/**
 * Põe o seletor em cada cômodo da aba de classe, e marca os ausentes.
 *
 * Devolve quantos cômodos encontrou — zero significa que a nave não tem a
 * classe, ou que a aba não está desenhada, e aí não há o que fazer.
 */
export function marcarComodos(raiz, ator) {
  if (!raiz || !ator) return 0;
  const nave = naveDe(ator, ID);
  let achados = 0;

  for (const linha of raiz.querySelectorAll("[data-item-id]")) {
    const item = ator.items?.get?.(linha.dataset.itemId);
    const chave = item?.getFlag?.(ID, "camaraDeNave")?.chave
      ?? item?.flags?.[ID]?.camaraDeNave?.chave;
    if (!chave) continue;
    achados += 1;

    const estado = estadoDoComodo(nave, chave);
    // a classe no elemento deixa o CSS apagar o que a nave não tem
    linha.classList.remove("comodo-instalada", "comodo-danificada", "comodo-ausente");
    linha.classList.add(`comodo-${estado}`);

    linha.querySelectorAll(`.${CLASSE_SELETOR}`).forEach((n) => n.remove());
    linha.insertAdjacentHTML("beforeend", botaoDoComodo(chave, estado));
  }
  return achados;
}

export function registrarFichaDeNavePC() {
  const Base = baseDaFicha();
  if (!Base) return null;

  class NaveSheet extends Base {
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: [...super.defaultOptions.classes, MARCA_NAVE_PC],
      });
    }

    async _onRender(contexto, opcoes) {
      await super._onRender?.(contexto, opcoes);
      try {
        renomearAbas(this.element);
        marcarComodos(this.element, this.actor);
        this.#ligarComodos();
      } catch (e) {
        console.warn(`${ID} | não pude preparar a Ficha de Nave`, e);
      }
    }

    /**
     * O clique que gira o estado do cômodo.
     *
     * Delegado na raiz e registrado uma vez: a ficha redesenha a cada
     * alteração, e um listener por botão se multiplicaria a cada render.
     */
    #ligarComodos() {
      const raiz = this.element;
      if (!raiz || raiz.dataset.swComodos === "1") return;
      raiz.dataset.swComodos = "1";
      raiz.addEventListener("click", async (ev) => {
        const b = ev.target?.closest?.(`.${CLASSE_SELETOR}`);
        if (!b?.dataset?.comodo) return;
        ev.preventDefault();
        ev.stopPropagation();
        if (!this.isEditable) return;
        const nave = naveDe(this.actor, ID);
        const chave = b.dataset.comodo;
        const novo = proximoEstado(estadoDoComodo(nave, chave));
        await this.actor.setFlag(ID, FLAG, {
          ...nave,
          camaras: { ...(nave.camaras ?? {}), [chave]: novo },
        });
      });
    }

    /** O mesmo para a ficha V1, que usa activateListeners em vez de _onRender. */
    activateListeners(html) {
      super.activateListeners?.(html);
      try {
        renomearAbas(html instanceof HTMLElement ? html : html?.[0]);
      } catch (e) {
        console.warn(`${ID} | não pude renomear as abas da Ficha de Nave`, e);
      }
    }
  }

  foundry.documents.collections.Actors.registerSheet(ID, NaveSheet, {
    types: ["character"],
    label: "Ficha de Nave (Space Dragon)",
    // NUNCA padrão: ela é para os atores que são naves, e o mundo é de
    // personagens. Quem cria uma nave escolhe no botão "Sheet" do ator.
    makeDefault: false,
  });

  Registrada = NaveSheet;
  console.log(`${ID} | Ficha de Nave sobre personagem registrada`);
  return NaveSheet;
}
