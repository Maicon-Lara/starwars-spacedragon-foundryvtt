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
  "a aba de atributos (por CSS, pelo seletor da aba)",
  "XP, alinhamento e idiomas (marcados pela ficha, pelo caminho do schema)",
];

/**
 * Nada mais a esconder, e isto foi MEDIDO — não suposto.
 *
 * Eu tinha anotado "esconder escalada, voo e natação". Varrendo a ficha aberta,
 * esses campos NÃO EXISTEM: há um bloco `.mv` só, com um `system.current_movement`
 * derivado e desabilitado. E movimento a nave tem — vem do tipo, pela raça.
 *
 * Fica como aviso para a próxima vez que eu quiser esconder algo: a lista do
 * que sobra nasce do console, e não da memória.
 */
export const AINDA_A_ESCONDER = [];

/* ── O QUE A NAVE NÃO USA ─────────────────────────────────────────────────── */

/**
 * Os campos da ficha de personagem que não existem numa nave, pelo CAMINHO DO
 * SCHEMA e não pelo rótulo.
 *
 * Medidos no ator exportado da mesa, não adivinhados. O `name` do input vem do
 * schema do sistema; o rótulo vem da tradução. Casar pelo rótulo quebraria se a
 * mesa trocasse de idioma, e casar pela posição quebraria na próxima versão do
 * sistema.
 *
 * Nave não ganha XP (é comprada, reformada e perdida), não tem alinhamento e
 * não fala idioma nenhum — quem fala é a tripulação, e ela tem a ficha dela.
 */
export const CAMPOS_NAO_USADOS = [
  "system.current_xp",
  "system.details.alignment",
  "system.details.languages",
];

export const CLASSE_OCULTO = "sw-nave-nao-usa";

/**
 * De quem esconder: o campo, ou o bloquinho que o embrulha com o rótulo.
 *
 * ── A REGRA QUE EVITA O DESASTRE ──────────────────────────────────────────
 *
 * Sobe no máximo DOIS níveis, e para assim que o contêiner guardar outro campo
 * além deste. Sem esse freio, um `:has()` largo ou um `closest(".form-group")`
 * que não casasse acabaria escondendo o `<form>` — e a ficha abriria em branco.
 * Já quebramos a interface uma vez por mirar largo; aqui o pior caso é esconder
 * só o input e deixar o rótulo órfão, que é feio e não é fatal.
 */
export function alvoDoCampo(campo) {
  let alvo = campo;
  for (let i = 0; i < 2; i += 1) {
    const pai = alvo.parentElement;
    if (!pai) break;
    // a casca da ficha nunca é alvo, por mais vazia que pareça
    if (/^(FORM|SECTION|BODY|HTML|MAIN|ASIDE)$/.test(pai.tagName ?? "")) break;
    // o contêiner guarda outra coisa também: esconder levaria essa outra junto
    if ((pai.querySelectorAll?.("[name]")?.length ?? 0) > 1) break;
    alvo = pai;
  }
  return alvo;
}

/**
 * Marca o que a nave não usa. Esconder é do CSS; aqui só se põe a classe.
 *
 * Idempotente de propósito: roda a cada render, e a ficha redesenha a cada
 * alteração do ator.
 */
export function ocultarOQueNaveNaoUsa(raiz) {
  if (!raiz?.querySelector) return 0;
  let marcados = 0;
  for (const caminho of CAMPOS_NAO_USADOS) {
    for (const campo of raiz.querySelectorAll(`[name="${caminho}"]`) ?? []) {
      const alvo = alvoDoCampo(campo);
      if (alvo.classList?.contains(CLASSE_OCULTO)) continue;
      alvo.classList?.add(CLASSE_OCULTO);
      marcados += 1;
    }
  }
  return marcados;
}

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
 * não aceita habilidades avulsas, então a lista é sempre a das doze. O que a
 * ficha guarda é o ESTADO de cada uma, e é o que este seletor gira:
 * instalada → danificada → ausente → instalada.
 *
 * De fábrica vêm só a Ponte e a Sala de Máquinas, as duas que o texto veta
 * dispensar (§4 das Regras Compiladas). As outras dez começam ausentes e se
 * instalam clicando — dentro do orçamento que o tamanho dá, que a ficha mostra
 * e não trava.
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

/**
 * O seletor de um cômodo, dizendo o estado e o que o PRÓXIMO clique faz.
 *
 * O título nomeia a próxima ação em vez de descrever o ciclo inteiro. "Clique
 * para girar: instalada → danificada → ausente" obriga quem lê a localizar onde
 * está antes de saber o que vai acontecer; "clique para desinstalar" responde
 * direto — e deixa claro que desinstalar é possível, que foi a dúvida da mesa
 * quando o padrão passou a ser "instalada".
 */
export function botaoDoComodo(chave, estado) {
  const rotulo = ROTULO_DO_ESTADO[estado] ?? estado;
  const seguinte = proximoEstado(estado);
  const acao = {
    danificada: "marcar como danificada",
    ausente: "desinstalar",
    instalada: "instalar de volta",
  }[seguinte] ?? `mudar para ${seguinte}`;
  return (
    `<button type="button" class="${CLASSE_SELETOR} estado-${estado}" ` +
    `data-comodo="${chave}" data-proximo="${seguinte}" ` +
    `title="Está ${rotulo}. Clique para ${acao}. ` +
    `Consertar uma danificada custa 25% da obra e metade do prazo (T10-2).">${rotulo}</button>`
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

    /** O caminho da V2, para quando o sistema migrar. Faz o mesmo que a V1. */
    async _onRender(contexto, opcoes) {
      await super._onRender?.(contexto, opcoes);
      this.#prepararFicha(this.element);
    }

    /**
     * O clique que gira o estado do cômodo.
     *
     * Delegado na raiz e registrado uma vez: a ficha redesenha a cada
     * alteração, e um listener por botão se multiplicaria a cada render.
     */
    #ligarComodos(raiz) {
      if (!raiz?.dataset || raiz.dataset.swComodos === "1") return;
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

    /**
     * O caminho que REALMENTE roda nesta mesa.
     *
     * A cadeia medida no console é ActorSheet → OD2CharacterSheet →
     * SDCharacterSheet: Application **V1**. Numa ficha V1 o Foundry não chama
     * `_onRender` — chama `activateListeners`. Eu tinha deixado aqui só o
     * renomear das abas, e com isso o seletor de cômodos e a ocultação dos
     * campos nunca apareceriam, embora o teste passasse verde.
     *
     * Então os dois caminhos fazem o MESMO, e chamam a mesma função: o dia em
     * que o sistema migrar para V2, nada aqui precisa mudar.
     */
    activateListeners(html) {
      super.activateListeners?.(html);
      this.#prepararFicha(html instanceof HTMLElement ? html : html?.[0]);
    }

    /** Tudo o que a Ficha de Nave faz no DOM, num lugar só. */
    #prepararFicha(raiz) {
      if (!raiz) return;
      try {
        renomearAbas(raiz);
        marcarComodos(raiz, this.actor);
        ocultarOQueNaveNaoUsa(raiz);
        this.#ligarComodos(raiz);
      } catch (e) {
        console.warn(`${ID} | não pude preparar a Ficha de Nave`, e);
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
