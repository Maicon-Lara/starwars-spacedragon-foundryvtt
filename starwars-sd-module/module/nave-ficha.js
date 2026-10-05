/**
 * Ficha da Nave — Star Wars para Space Dragon.
 *
 * Automatiza o "Combate Tático de Naves" do Suplemento. O esqueleto (ficha em
 * ApplicationV2, diálogo, cartão no formato do OD2, planejar/revelar) veio do
 * Star Dragon; a regra é a do cofre, e difere da de lá em quase todo número.
 *
 * O PONTO QUE MAIS SE ERRA DE CABEÇA, e por isso a ficha faz sozinha:
 *
 *   ATAQUE   1d20 + BA de Casco contra o CP de Casco do ALVO — que é da
 *            Tabela 10-1 e muda por tipo. Faixa curta +2, média 0, longa −2;
 *            Trava dos Sensores +2; avaria de Sensores −2.
 *
 *   ESQUIVA  vem ANTES do dano, como no exemplo do cofre: o X-wing acerta com
 *            4d8, o TIE rola 3d6, cada 5–6 cancela UM DADO inteiro (não um
 *            ponto), e só então se rolam os dados que sobraram.
 *
 *   CRÍTICO  20 natural acerta sempre, soma um dado de dano e rola 1d6 na
 *            tabela de avarias. A Brecha no casco (6) dobra o dano DESTE tiro.
 */

import {
  TIPOS, MANOBRAS, MANOBRAS_DE_COLOSSO, FAIXAS, AVARIAS, AVARIAS_DE_UMA_RODADA, POSTOS,
  CRITICOS_LIVRO, FALHAS_LIVRO, ORDEM_LIVRO, faixaDePilotagem,
  EVASIVA_INTERVALO, evasivaPermitida,
  CAMARAS, ESTADOS_DE_CAMARA, camaraOperacional, ETAPAS_DO_SALTO, TRANCA_DO_ARSENAL,
  AVARIA_VIRA_CAMARA, REPARO_DE_CAMARA,
  ACOES_DE_POSTO, AUTOMATIZA, acaoDoPosto,
  DESTINOS_DE_ENERGIA, energiaDoReator, efeitoDaEnergia, energiaGasta,
  PRAZO_DE_AVARIA, prazoDaAvaria, MARCAS_DO_PERSEGUIDOR, avancoDoPerseguidor, quemFechaPrimeiro,
  partesDaTripulacao, cpComEnergia, jpComEnergia,
  dadosExtrasDeDano, dadosExtrasDeEsquiva, evasivaBloqueada,
  LIMPA_NO_FIM_DA_RODADA,
  EQUIPAMENTOS_DE_NAVE, equipamentosDoTamanho, efeitosInstalados, decidirInstalacao,
  decidirCamara,
  conflitosDeTamanho, armasInstaladas,
  FONTES_DE_ENERGIA, formulaDeGasto, custoDeAbastecimento, penalidadeNaJPR,
} from "./nave-modelo.js";
import { moverNave, conferirEscala, casasDaManobra } from "./nave-movimento.js";
import { ordemLigada } from "./ordem-inversao.js";

export const TIPO_NAVE = "starwars-sd.nave";

/**
 * Qual regra de combate de nave a mesa escolheu, na opção de mundo.
 *
 * "tatico" é o Combate Tático do Suplemento, desenhado sobre o X-Wing
 * Miniatures Game da FFG — dial, manobra em segredo, Sobrecarga (o stress) e
 * dados de defesa que cancelam dados de dano. "livro" é o §10.6 do Livro
 * Básico Aprimorado. Fora do Foundry — no teste de fumaça — não há settings, e
 * o padrão é o Tático.
 */
export function regraDeNave() {
  try {
    return globalThis.game?.settings?.get?.("starwars-sd", "regrasDeNave") ?? "tatico";
  } catch {
    return "tatico";
  }
}
/* A função `ehLivro` global saiu na 1.14.0: cada ficha agora FIXA a sua regra
 * em `static MODO`, e a opção de mundo só decide qual delas é a padrão. Ver o
 * getter `ehLivro` na classe, e as duas subclasses no fim do arquivo. */

/**
 * Se a mesa ligou uma das camadas opcionais da tripulação.
 *
 * Fora do Foundry — no teste de fumaça — não há settings, e todas contam como
 * DESLIGADAS: é o mesmo padrão de `regraDeNave`, e deixa o teste exercitar a
 * ficha sem precisar simular as opções.
 */
export function camadaLigada(qual) {
  try {
    return globalThis.game?.settings?.get?.("starwars-sd", qual) === true;
  } catch {
    return false;
  }
}

/**
 * A classe de tema da ficha: "tema-auto", "tema-claro" ou "tema-escuro".
 *
 * A ficha tem paleta própria e não acompanha sozinha um módulo de modo escuro.
 * No automático quem decide é o CSS, pela classe `theme-dark` da página ou pela
 * preferência do sistema.
 */
function classeDeTema() {
  let escolha = "auto";
  try {
    escolha = globalThis.game?.settings?.get?.("starwars-sd", "temaDaNave") ?? "auto";
  } catch {
    escolha = "auto";
  }
  return `tema-${escolha}`;
}

/** O id do módulo. Os `game.settings.get` daqui o repetiam como literal. */
const ID = "starwars-sd";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

/** Cartão no formato nativo do OD2 (div.title + p.result). */
function card(ator, titulo, corpo, rolls = []) {
  return ChatMessage.create({
    content: `<div class="sw-cartao"><div class="title">${titulo}</div>${corpo}</div>`,
    speaker: ChatMessage.getSpeaker({ actor: ator }),
    rolls,
    sound: rolls.length ? CONFIG.sounds.dice : null,
  });
}

/** Diálogo que funciona com DialogV2 (v13) e cai no Dialog antigo se faltar. */
async function pergunta({ titulo, conteudo, botoes }) {
  const V2 = foundry.applications?.api?.DialogV2;
  if (V2) {
    return V2.wait({
      window: { title: titulo },
      content: conteudo,
      buttons: botoes.map((b) => ({
        action: b.chave,
        label: b.rotulo,
        default: b.padrao,
        callback: (ev, botao) => {
          const form = botao.form ?? botao.closest?.("dialog")?.querySelector("form");
          const dados = form ? new FormData(form) : null;
          return { acao: b.chave, dados: dados ? Object.fromEntries(dados.entries()) : {} };
        },
      })),
      rejectClose: false,
    });
  }
  return new Promise((ok) => {
    const b = {};
    for (const x of botoes)
      b[x.chave] = {
        label: x.rotulo,
        callback: (html) => {
          const f = html[0]?.querySelector("form");
          ok({ acao: x.chave, dados: f ? Object.fromEntries(new FormData(f).entries()) : {} });
        },
      };
    new Dialog({ title: titulo, content: conteudo, buttons: b, close: () => ok(null) }).render(true);
  });
}

/** "4d8" → { n: 4, faces: 8, resto: "" }; "6d10+2" → resto "+2". */
function lerDano(formula) {
  const m = String(formula ?? "").replace(/\s+/g, "").match(/^(\d+)d(\d+)(.*)$/i);
  return m ? { n: Number(m[1]), faces: Number(m[2]), resto: m[3] ?? "" } : null;
}

/** Rola os dados de Esquiva e conta os 5–6. */
async function rolarEsquiva(dados) {
  if (dados <= 0) return { roll: null, faces: [], exitos: 0 };
  const roll = await new Roll(`${dados}d6`).evaluate();
  const faces = roll.dice[0].results.map((x) => x.result);
  return { roll, faces, exitos: faces.filter((f) => f >= 5).length };
}

const legendaEsquiva = (faces) =>
  faces.map((f) => (f >= 5 ? `<strong class="success">${f}</strong>` : `${f}`)).join(" · ");

export class NaveFicha extends HandlebarsApplicationMixin(ActorSheetV2) {
  /**
   * A regra de combate desta ficha: "tatico", "livro", ou `null` para seguir a
   * opção de mundo.
   *
   * São DUAS FICHAS, e não uma que troca de comportamento, porque no Foundry a
   * ficha é escolhida POR ATOR: a frota rebelde pode rodar no Tático enquanto
   * a nave do Mestre resolve pelo livro, e o jogador vê na barra de título da
   * janela qual regra está valendo — em vez de ter de abrir as configurações
   * do módulo para descobrir por que o dial sumiu.
   *
   * A classe base fica em `null` de propósito. Um ator salvo antes da 1.14.0
   * guarda `NaveFicha` como ficha dele, e sem esse fallback abriria sempre no
   * Tático, trocando a regra da mesa sem avisar.
   */
  static MODO = null;

  /** Se esta ficha resolve o combate pelo §10.6. */
  get ehLivro() {
    return (this.constructor.MODO ?? regraDeNave()) === "livro";
  }

  static DEFAULT_OPTIONS = {
    classes: ["starwars-sd", "nave-ficha"],  // a de tema entra em _onRender
    position: { width: 580, height: 780 },
    window: { resizable: true, icon: "fa-solid fa-rocket" },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      atacar: NaveFicha.#atacar,
      esquivar: NaveFicha.#esquivar,
      iniciativa: NaveFicha.#iniciativa,
      reparar: NaveFicha.#reparar,
      sobrecarga: NaveFicha.#sobrecarga,
      avaria: NaveFicha.#avaria,
      trava: NaveFicha.#trava,
      fimDaRodada: NaveFicha.#fimDaRodada,
      aplicarTipo: NaveFicha.#aplicarTipo,
      rolarPV: NaveFicha.#rolarPV,
      addArma: NaveFicha.#addArma,
      delArma: NaveFicha.#delArma,
      planejar: NaveFicha.#planejar,
      revelar: NaveFicha.#revelar,
      camara: NaveFicha.#camara,
      salto: NaveFicha.#salto,
      arsenal: NaveFicha.#arsenal,
      acaoPosto: NaveFicha.#acaoPosto,
      energia: NaveFicha.#energia,
      perseguidor: NaveFicha.#perseguidor,
      etapaDoSalto: NaveFicha.#etapaDoSalto,
      equipamento: NaveFicha.#equipamento,
      combustivel: NaveFicha.#combustivel,
    },
  };

  static PARTS = { corpo: { template: "modules/starwars-sd/templates/nave.hbs", scrollable: [""] } };

  /**
   * A classe de tema no elemento da ficha.
   *
   * Vai aqui, e não em DEFAULT_OPTIONS, porque a opção muda em tempo de
   * execução: fixá-la na definição da classe congelaria a escolha do primeiro
   * render. As três são mutuamente exclusivas.
   */
  _onRender(contexto, opcoes) {
    super._onRender?.(contexto, opcoes);
    this.element?.classList.remove("tema-auto", "tema-claro", "tema-escuro");
    this.element?.classList.add(classeDeTema());
    this.#ligarArrasto();
    this.#ligarAbas();
  }

  /* ── AS ABAS ──────────────────────────────────────────────────────────────
   *
   * Troca feita por JS próprio, e não pelo sistema de abas do ApplicationV2.
   * O motivo é o mesmo do arrasto: a API de abas mudou de forma entre as
   * versões maiores do Foundry, e `classList.toggle` não muda.
   *
   * A aba escolhida fica guardada NA INSTÂNCIA, e não no ator: ela é de quem
   * está olhando, não da nave. Sem isso, cada salvamento devolveria a ficha
   * para a primeira aba no meio da rodada — que é exatamente quando a mesa
   * menos quer isso.
   */
  #ligarAbas() {
    const raiz = this.element;
    if (!raiz) return;
    const nav = raiz.querySelector(".sheet-tabs");
    if (!nav) return;

    const mostrar = (chave) => {
      for (const a of raiz.querySelectorAll(".sheet-tabs .item")) {
        a.classList.toggle("active", a.dataset.tab === chave);
      }
      for (const t of raiz.querySelectorAll(".sheet-body .tab")) {
        t.classList.toggle("active", t.dataset.tab === chave);
      }
      this.#aba = chave;
    };

    // devolve a aba que estava aberta antes do redesenho
    if (this.#aba) mostrar(this.#aba);

    if (nav.dataset.swAbas === "1") return;
    nav.dataset.swAbas = "1";
    nav.addEventListener("click", (ev) => {
      const item = ev.target?.closest?.(".item");
      if (!item?.dataset?.tab) return;
      ev.preventDefault();
      mostrar(item.dataset.tab);
    });
  }

  /** A aba aberta, por instância de ficha. */
  #aba = null;

  /* ── INSTALAR EQUIPAMENTO ARRASTANDO ──────────────────────────────────────
   *
   * O compêndio de Equipamentos traz os quinze da T10-4 como itens, e arrastar
   * um deles para a nave o INSTALA — ou seja, liga o booleano que o schema já
   * tem. O item não vira item embutido da nave de propósito: a regra (o que
   * cabe em que tamanho, os conflitos, os efeitos) já mora no schema e está
   * coberta por teste. Duplicá-la numa lista de itens seria tê-la em dois
   * lugares, com duas chances de divergir.
   *
   * Assim a mesa ganha o que faltava — arrastar do compêndio, como se arrasta
   * uma arma para o personagem — sem que a regra mude de casa.
   *
   * Os listeners são NATIVOS, e não a API de DragDrop do Foundry: ela mudou de
   * forma entre as versões maiores, e `dragover`/`drop` não mudam.
   */
  #ligarArrasto() {
    const raiz = this.element;
    if (!raiz || raiz.dataset.swArrasto === "1") return;
    raiz.dataset.swArrasto = "1";
    raiz.addEventListener("dragover", (ev) => ev.preventDefault());
    raiz.addEventListener("drop", (ev) => this.#aoSoltar(ev));
  }

  async #aoSoltar(ev) {
    try {
      if (!this.isEditable) return;
      const Editor = globalThis.TextEditor?.implementation ?? globalThis.TextEditor;
      const dados = Editor?.getDragEventData?.(ev) ?? {};
      if (dados.type !== "Item") return;
      const item = dados.uuid ? await fromUuid(dados.uuid) : null;
      const equip = item?.getFlag?.(ID, "equipamentoDeNave");
      const camara = item?.getFlag?.(ID, "camaraDeNave");
      // Item comum (uma espada, uma ração) não é erro: a nave simplesmente não
      // tem inventário, e deixar o arrasto seguir é melhor que avisar.
      if (!equip?.chave && !camara?.chave) return;

      ev.preventDefault();
      ev.stopPropagation();

      const s = this.actor.system;

      // ── CÂMARA (T10-2): construir ───────────────────────────────────────
      if (camara?.chave) {
        const r = decidirCamara(camara.chave, {
          estados: s.camaras,
          nomeDaNave: this.actor.name,
        });
        if (r.acao === "desconhecida") return;
        if (r.acao === "jaInstalada") return ui.notifications.info(r.mensagem);
        if (r.acao === "repararAntes") return ui.notifications.warn(r.mensagem);
        await this.actor.update({ [`system.camaras.${camara.chave}`]: "instalada" });
        return void ui.notifications.info(r.mensagem);
      }

      // A decisão é REGRA, e mora em equipamentos-nave.js, testada sem Foundry.
      // Aqui só se traduz o resultado em notificação.
      const r = decidirInstalacao(equip.chave, {
        tamanho: TIPOS[s.tipo]?.tamanho,
        instalados: s.equipamentos,
        nomeDaNave: this.actor.name,
      });
      if (r.acao === "desconhecido") return;
      if (r.acao === "jaInstalado") return ui.notifications.info(r.mensagem);
      if (r.acao === "naoCabe") return ui.notifications.warn(r.mensagem);
      await this.actor.update({ [`system.equipamentos.${equip.chave}`]: true });
      ui.notifications.info(r.mensagem);
    } catch (erro) {
      console.warn(`${ID} | não pude instalar o equipamento arrastado`, erro);
    }
  }

  async _prepareContext() {
    const s = this.actor.system;
    const m = s.manobra;
    return {
      ator: this.actor,
      s,
      editavel: this.isEditable,
      tipos: Object.entries(TIPOS).map(([k, v]) => ({ k, ...v, sel: k === s.tipo })),
      postos: Object.entries(POSTOS).map(([k, v]) => ({ chave: k, ...v, valor: s.postos[k] })),
      avarias: Object.values(AVARIAS)
        .filter((a) => a.chave)
        .map((a) => ({ ...a, ligada: s.avarias[a.chave] })),
      dial: NaveFicha.montaDial(s),
      manobraAtual: m.tipo
        ? `${MANOBRAS[m.tipo]?.rotulo ?? m.tipo}` +
          (m.lado ? (m.lado === "esq" ? " à esquerda" : " à direita") : "") +
          (m.velocidade ? ` ${m.velocidade}` : "")
        : "",
      // Qual regra está valendo: o template esconde o dial, o planejar/revelar
      // e a Sobrecarga no modo Livro, porque o capítulo 10 não os tem.
      livro: this.ehLivro,
      tatico: !this.ehLivro,
      podeEvadir: evasivaPermitida(s.tipo),
      camaras: Object.entries(CAMARAS).map(([k, c]) => ({
        chave: k, ...c, estado: s.camaras?.[k] ?? "instalada",
        ok: s.camaras?.[k] === "instalada",
      })),
      semPonte: !camaraOperacional(s, "ponte"),
      ordemLivro: Object.values(ORDEM_LIVRO),

      // ── O COMBUSTÍVEL (T10-3) ──
      combustivel: {
        pct: Math.max(0, Math.min(100, s.combustivel ?? 100)),
        fonte: FONTES_DE_ENERGIA[s.fonte]?.rotulo ?? "—",
        autonomia: FONTES_DE_ENERGIA[s.fonte]?.autonomia ?? "—",
        // o que custa encher o que falta, na escala de créditos do livro
        encher: custoDeAbastecimento(s.fonte, TIPOS[s.tipo]?.tamanho,
                                     100 - (s.combustivel ?? 100)),
        fontes: Object.entries(FONTES_DE_ENERGIA).map(([k, f]) => ({
          chave: k, ...f, sel: k === s.fonte,
        })),
      },

      // ── OS EQUIPAMENTOS ADICIONAIS (T10-4) ──
      // A lista é filtrada pelo TAMANHO da nave: a tabela do livro diz onde
      // cada equipamento cabe, e oferecer um acelerador hiperespacial num caça
      // seria convidar a mesa a quebrar a regra sem saber.
      equipamentos: equipamentosDoTamanho(TIPOS[s.tipo]?.tamanho).map((e) => ({
        ...e, ligado: s.equipamentos?.[e.chave] === true,
      })),
      // marcas que sobraram de quando a nave era de outro tipo
      conflitosDeEquipamento: conflitosDeTamanho(s.equipamentos, TIPOS[s.tipo]?.tamanho),
      efeitosDeEquipamento: efeitosInstalados(s.equipamentos, TIPOS[s.tipo]?.tamanho),
      armasDeEquipamento: armasInstaladas(s.equipamentos, TIPOS[s.tipo]?.tamanho),

      // ── A TRIPULAÇÃO ──
      // Os postos agora levam a AÇÃO escolhida, e não só quem os ocupa. As
      // três camadas só entram no contexto se a mesa as ligou: o template
      // esconde o painel inteiro, em vez de mostrá-lo vazio.
      postosComAcao: Object.entries(POSTOS).map(([k, v]) => {
        const escolhida = s.postoAcao?.[k] ?? "";
        return {
          chave: k, ...v, valor: s.postos[k], escolhida,
          acoes: (ACOES_DE_POSTO[k] ?? []).map((a) => ({
            ...a, sel: a.chave === escolhida, automatica: AUTOMATIZA.has(a.chave),
          })),
          nota: acaoDoPosto(k, escolhida)?.nota ?? "",
        };
      }),
      firmado: s.firmar?.ativa === true,
      camadaEnergia: camadaLigada("camadaEnergia"),
      camadaAvarias: camadaLigada("camadaAvarias"),
      camadaFuga: camadaLigada("camadaFuga"),
      energia: NaveFicha.painelDeEnergia(s, this.ehLivro),
      emergencias: NaveFicha.emergencias(s),
      fuga: {
        etapas: s.fuga?.etapas ?? 0,
        perseguidor: s.fuga?.perseguidor ?? 0,
        marcas: MARCAS_DO_PERSEGUIDOR,
        // Dois booleanos além da string: o estado tem três valores (nenhum,
        // salto, perseguidor), e o template diz qual é sem comparar string.
        saltou: quemFechaPrimeiro(s.fuga?.etapas ?? 0, s.fuga?.perseguidor ?? 0) === "salto",
        alcancada: quemFechaPrimeiro(s.fuga?.etapas ?? 0, s.fuga?.perseguidor ?? 0) === "perseguidor",
        fechou: quemFechaPrimeiro(s.fuga?.etapas ?? 0, s.fuga?.perseguidor ?? 0),
      },
      escala: canvas?.scene ? conferirEscala(canvas.scene) : { ok: true },
      pctPV: s.pv.max ? Math.max(0, Math.min(100, Math.round((s.pv.value / s.pv.max) * 100))) : 0,
      descricao: await foundry.applications.ux.TextEditor.implementation.enrichHTML(s.descricao, { async: true }),
    };
  }

  /* ── OS HELPERS DA TRIPULAÇÃO ───────────────────────────────────────────
   *
   * Estáticos e puros: recebem o `system` e devolvem o que o template mostra.
   * É o que permite o teste de fumaça exercitá-los sem montar uma ficha — o
   * mesmo desenho de montaDial, logo abaixo.
   */

  /** O painel de Energia: quanto o reator deu, quanto sobra, e o efeito atual. */
  static painelDeEnergia(s, ehLivro) {
    const total = energiaDoReator(TIPOS[s.tipo]?.tamanho) + (s.energia?.extra ?? 0);
    const gasta = energiaGasta(s.energia);
    const efeito = efeitoDaEnergia(s.energia, ehLivro);
    return {
      total,
      gasta,
      // nunca negativo: o painel mostra o número, e "−1 ponto" não diz nada
      sobra: Math.max(0, total - gasta),
      excedeu: gasta > total,
      destinos: Object.entries(DESTINOS_DE_ENERGIA).map(([k, d]) => ({
        chave: k, rotulo: d.rotulo,
        valor: s.energia?.[k] ?? 0,
        efeito: ehLivro ? d.livro : d.tatico,
      })),
      efeito,
      // o resumo em uma linha, que é o que a mesa lê no meio do turno
      resumo: [
        efeito.jp ? `+${efeito.jp} JP` : "",
        efeito.cp ? `+${efeito.cp} CP` : "",
        efeito.hexes ? `+${efeito.hexes} hexe(s)` : "",
        efeito.dadosDeEsquiva ? `+${efeito.dadosDeEsquiva}d6 esquiva` : "",
        efeito.dadosDeDano ? `+${efeito.dadosDeDano} dado(s) de dano` : "",
      ].filter(Boolean).join(" · "),
    };
  }

  /** As avarias com prazo correndo, para o Controle de Avarias. */
  static emergencias(s) {
    let rodada = 0;
    try { rodada = globalThis.game?.combat?.round ?? 0; } catch { rodada = 0; }
    const out = [];
    for (const [avaria, camara] of Object.entries(AVARIA_VIRA_CAMARA)) {
      if (!s.avarias?.[avaria]) continue;
      const p = prazoDaAvaria(avaria, s.avariaRodada?.[avaria] ?? 0, rodada);
      if (!p) continue;
      out.push({
        avaria,
        rotuloAvaria: AVARIAS[avaria]?.rotulo ?? avaria,
        camara,
        rotuloCamara: CAMARAS[camara]?.rotulo ?? camara,
        ...p,
      });
    }
    return out;
  }

  /**
   * O dial da nave: cada manobra permitida, em cada velocidade possível.
   * Vermelha fica desligada com Sobrecarga ou com o Leme avariado; o colosso
   * só vê Reta, Inclinada e Parar.
   */
  static montaDial(s) {
    const vel = s.velocidadeEfetiva ?? s.velocidade;
    const bloqueiaVermelha = s.sobrecarga > 0 || s.avarias.leme;
    const saida = [];
    for (const [tipo, m] of Object.entries(MANOBRAS)) {
      if (s.colosso && !MANOBRAS_DE_COLOSSO.includes(tipo)) continue;
      const velocidades =
        m.passos === "1aV" ? Array.from({ length: vel }, (_, i) => i + 1)
        : m.passos === "metade" ? [casasDaManobra(tipo, 0, vel)]
        : m.passos === "re" ? [1] : [0];
      const lados = m.lado ? ["esq", "dir"] : [""];
      for (const v of velocidades) {
        if (m.passos !== "0" && vel === 0) continue;
        for (const lado of lados) {
          const seta = !m.lado ? m.simbolo : lado === "esq" ? (tipo === "curva" ? "⟲" : "↖") : (tipo === "curva" ? "⟳" : "↗");
          saida.push({
            tipo, velocidade: v, lado, rotulo: m.rotulo, giro: m.giro, cor: m.cor,
            bloqueada: m.cor === "vermelha" && bloqueiaVermelha,
            etiqueta: `${seta}${v > 0 ? " " + v : ""}`,
          });
        }
      }
    }
    return saida;
  }

  // ── Ataque ────────────────────────────────────────────────────────────────
  static async #atacar(event, botao) {
    // "Sem a Ponte de Comando operacional, a nave não pode ser pilotada nem
    // operar escudos ou armas acopladas."
    if (!camaraOperacional(this.actor.system, "ponte")) {
      return ui.notifications.warn(
        `${this.actor.name}: sem a Ponte de Comando operacional a nave não opera armas.`);
    }
    // O §10.6 resolve o tiro de outro jeito: sem faixas de hex, sem dados de
    // defesa, e com as tabelas T10-6 no 20 e no 1 naturais.
    if (this.ehLivro) return NaveFicha.#atacarPeloLivro.call(this, event, botao);
    const arma = this.actor.system.armas[Number(botao.dataset.idx)];
    if (!arma) return;
    const s = this.actor.system;
    const dano = lerDano(arma.dano);
    if (!dano) return ui.notifications.warn(`O dano "${arma.dano}" não está no formato NdX (ex.: 4d8).`);

    // O alvo, se houver um token marcado. Uma nave dá o CP e a Esquiva dela.
    const alvoTok = [...(game.user?.targets ?? [])][0];
    const alvo = alvoTok?.actor;
    const alvoNave = alvo?.type === TIPO_NAVE ? alvo : null;
    const podeAplicar = !!alvoNave && alvoNave.isOwner;

    const opcoes = Object.entries(FAIXAS)
      .map(([k, v]) => `<option value="${k}" ${k === "media" ? "selected" : ""}>${v.rotulo}</option>`).join("");

    const r = await pergunta({
      titulo: `${arma.nome} — ${this.actor.name}`,
      conteudo:
        `<form class="starwars-sd-nave-dialogo">` +
        `<p><strong>1d20 + ${s.ba}</strong> contra o CP de Casco do alvo` +
        (alvoNave ? ` — <strong>${alvoNave.name}</strong>, CP ${alvoNave.system.cp}, Esquiva ${alvoNave.system.esquiva}d6.` : ".") + `</p>` +
        `<div class="linha"><label>Faixa</label><select name="faixa">${opcoes}</select></div>` +
        (alvoNave ? "" :
          `<div class="linha"><label>CP de Casco do alvo</label><input type="number" name="cp" value="28"></div>` +
          `<div class="linha"><label>Esquiva do alvo (d6)</label><input type="number" name="esquiva" value="3" min="0"></div>`) +
        (s.trava ? `<div class="linha"><label>Usar a Trava em <em>${s.trava}</em> (+2)</label><input type="checkbox" name="trava"></div>` : "") +
        `<div class="linha"><label>Outro modificador</label><input type="number" name="extra" value="0"></div>` +
        (podeAplicar ? `<div class="linha"><label>Aplicar o dano em ${alvoNave.name}</label><input type="checkbox" name="aplicar" checked></div>` : "") +
        `</form>`,
      botoes: [{ chave: "rolar", rotulo: "Atirar", padrao: true }, { chave: "cancelar", rotulo: "Cancelar" }],
    });
    if (!r || r.acao !== "rolar") return;
    const d = r.dados;

    const faixa = FAIXAS[d.faixa] ?? FAIXAS.media;
    const cp = alvoNave ? alvoNave.system.cp : Number(d.cp) || 0;
    const esquivaAlvo = alvoNave ? alvoNave.system.esquiva : Math.max(0, Number(d.esquiva) || 0);

    const partes = [
      ["BA", s.ba], ["faixa", faixa.mod], ["Trava", d.trava ? 2 : 0],
      // o Computador Balístico mora na Ponte: sem ela operacional, não há +2
      // o Computador Balístico é EQUIPAMENTO (T10-4), e não efeito da câmara:
      // vale se estiver instalado E a Ponte estiver operacional
      ["Computador Balístico",
        camaraOperacional(s, "ponte")
          ? efeitosInstalados(s.equipamentos, TIPOS[s.tipo]?.tamanho).ataque
          : 0],
      ["Sensores avariados", s.avarias.sensores ? -2 : 0], ["extra", Number(d.extra) || 0],
    ].filter(([, v]) => v);
    const total = partes.reduce((a, [, v]) => a + v, 0);
    const ataque = await new Roll(`1d20 + ${total}`).evaluate();
    const natural = ataque.dice[0].results[0].result;
    const critico = natural === 20;
    const acertou = critico || ataque.total >= cp;

    const rolls = [ataque];
    let corpo =
      `<p><strong>${arma.nome}</strong> · ${arma.dano} · ${arma.arco === "livre" ? "qualquer arco" : "arco frontal"}</p>` +
      `<p class="result">${partes.map(([n, v]) => `${n} ${v > 0 ? "+" : ""}${v}`).join(" · ")}</p>` +
      `<p class="result"><strong>${ataque.total}</strong> contra CP ${cp}` +
      (alvoNave ? ` (${alvoNave.name})` : "") + `</p>` +
      `<p class="result"><strong class="${acertou ? "success" : "failure"}">${acertou ? "Acertou" : "Errou"}</strong></p>`;

    const upd = {};
    if (d.trava) upd["system.trava"] = "";

    if (acertou) {
      // Dados de dano: −1 com as Armas avariadas, +1 no crítico.
      let n = dano.n - (s.avarias.armas ? 1 : 0) + (critico ? 1 : 0);
      n = Math.max(0, n);

      // Esquiva ANTES do dano: cada 5–6 cancela um dado inteiro.
      const esq = await rolarEsquiva(esquivaAlvo);
      if (esq.roll) rolls.push(esq.roll);
      const sobram = Math.max(0, n - esq.exitos);

      corpo +=
        (critico ? `<p class="result"><strong class="success">Crítico — 20 natural</strong>: +1 dado de dano</p>` : "") +
        (s.avarias.armas ? `<p><em>Armas avariadas: −1 dado de dano.</em></p>` : "") +
        `<p>Esquiva do alvo (${esquivaAlvo}d6): ${esq.faces.length ? legendaEsquiva(esq.faces) : "<em>não esquiva</em>"}` +
        ` → <strong>${esq.exitos}</strong> dado(s) cancelado(s) de ${n}.</p>`;

      // O crítico rola a avaria antes do dano, porque a Brecha dobra este tiro.
      let avaria = null;
      if (critico) {
        const rAv = await new Roll("1d6").evaluate();
        rolls.push(rAv);
        avaria = AVARIAS[rAv.total];
        corpo += `<p class="result"><strong>Avaria (${rAv.total}): ${avaria.rotulo}</strong> — ${avaria.efeito}</p>`;
      }

      let pv = 0;
      if (sobram > 0) {
        const rDano = await new Roll(`${sobram}d${dano.faces}${dano.resto}`).evaluate();
        rolls.push(rDano);
        pv = rDano.total * (avaria?.rotulo === "Brecha no casco" ? 2 : 1);
        corpo += `<p class="result">Dano: <strong>${pv}</strong> (${sobram}d${dano.faces}${dano.resto}` +
          (avaria?.rotulo === "Brecha no casco" ? ", dobrado pela Brecha" : "") + `)</p>`;
      } else {
        corpo += `<p class="result"><strong>Raspou o casco</strong> — todos os dados foram cancelados.</p>`;
      }

      if (d.aplicar && alvoNave) {
        const updAlvo = { "system.pv.value": alvoNave.system.pv.value - pv };
        if (avaria?.chave) updAlvo[`system.avarias.${avaria.chave}`] = true;
        await alvoNave.update(updAlvo);
        corpo += `<p><em>Aplicado em ${alvoNave.name}: PV ${alvoNave.system.pv.value}/${alvoNave.system.pv.max}` +
          (avaria?.chave ? `, avaria de ${avaria.rotulo}` : "") + `.</em></p>`;
      }
    }

    if (Object.keys(upd).length) await this.actor.update(upd);
    await card(this.actor, "Ataque de nave", corpo, rolls);
  }

  /**
   * O disparo pelo §10.6 do livro.
   *
   * Difere do Tático em quatro pontos, e todos vêm do capítulo 10:
   *
   *   · soma o BA da nave E o BA à distância de quem opera a arma;
   *   · não há faixas de alcance nem dados de defesa — o dano sai cheio;
   *   · se o alvo declarou MANOBRA EVASIVA, ele evita o tiro com uma JP em vez
   *     de opor o CP (e a JP leva o modificador que o teste de pilotagem deu);
   *   · o 20 natural rola a T10-6 de acertos críticos, e o 1 natural rola a de
   *     falhas críticas — que o Tático não tem.
   */
  static async #atacarPeloLivro(event, botao) {
    const arma = this.actor.system.armas[Number(botao.dataset.idx)];
    if (!arma) return;
    const s = this.actor.system;
    const dano = lerDano(arma.dano);
    if (!dano) return ui.notifications.warn(`O dano "${arma.dano}" não está no formato NdX (ex.: 4d8).`);

    const alvoTok = [...(game.user?.targets ?? [])][0];
    const alvo = alvoTok?.actor;
    const alvoNave = alvo?.type === TIPO_NAVE ? alvo : null;
    const podeAplicar = !!alvoNave && alvoNave.isOwner;
    const evasiva = alvoNave?.system.evasiva?.ativa ? alvoNave.system.evasiva : null;

    const r = await pergunta({
      titulo: `${arma.nome} — ${this.actor.name}`,
      conteudo:
        `<div class="starwars-sd-nave-dialogo">` +
        `<p><strong>1d20 + ${s.ba}</strong> (BA da nave) <strong>+ o BA à distância do artilheiro</strong>` +
        (alvoNave
          ? `, contra o CP de <strong>${alvoNave.name}</strong> (${alvoNave.system.cp}).`
          : ", contra o CP do alvo.") + `</p>` +
        (evasiva
          ? `<p><em>${alvoNave.name} está em manobra evasiva: em vez do CP, ela faz uma JP ` +
            `(alvo ${alvoNave.system.jp}, modificador ${evasiva.mod >= 0 ? "+" : ""}${evasiva.mod}) para evitar o tiro.</em></p>`
          : "") +
        `<div class="linha"><label>BA à distância do artilheiro</label><input type="number" name="artilheiro" value="0"></div>` +
        (alvoNave ? "" :
          `<div class="linha"><label>CP do alvo</label><input type="number" name="cp" value="28"></div>`) +
        `<div class="linha"><label>Outro modificador</label><input type="number" name="extra" value="0"></div>` +
        (podeAplicar ? `<div class="linha"><label>Aplicar o dano em ${alvoNave.name}</label><input type="checkbox" name="aplicar" checked></div>` : "") +
        `</div>`,
      botoes: [{ chave: "rolar", rotulo: "Atirar", padrao: true }, { chave: "cancelar", rotulo: "Cancelar" }],
    });
    if (!r || r.acao !== "rolar") return;
    const d = r.dados;

    // O CP do alvo já vem com os Escudos dele (camada de Energia) e com o
    // Escudo de Força instalado, que a T10-4 dá como +10.
    const cp = alvoNave
      ? cpComEnergia(alvoNave.system, true)
        + efeitosInstalados(alvoNave.system.equipamentos,
                            TIPOS[alvoNave.system.tipo]?.tamanho).cp
      : Number(d.cp) || 0;
    const partes = [
      ["BA da nave", s.ba],
      ["artilheiro", Number(d.artilheiro) || 0],
      ["Computador Balístico",
        camaraOperacional(s, "ponte")
          ? efeitosInstalados(s.equipamentos, TIPOS[s.tipo]?.tamanho).ataque
          : 0],
      // Firmar, Supressão e Interferência: os efeitos de posto que mexem no tiro
      ...partesDaTripulacao(s, alvoNave?.system ?? {}),
      ["extra", Number(d.extra) || 0],
    ].filter(([, v]) => v);
    const total = partes.reduce((a, [, v]) => a + v, 0);
    const ataque = await new Roll(`1d20 + ${total}`).evaluate();
    const natural = ataque.dice[0].results[0].result;
    const rolls = [ataque];

    let corpo =
      `<p><strong>${arma.nome}</strong> · ${arma.dano} · <em>regras do livro (§10.6)</em></p>` +
      `<p class="result">${partes.map(([n, v]) => `${n} ${v > 0 ? "+" : ""}${v}`).join(" · ")}</p>`;

    // O 1 natural: falha crítica na T10-6, e o tiro não acerta.
    if (natural === 1) {
      const rF = await new Roll("1d6").evaluate();
      rolls.push(rF);
      const f = FALHAS_LIVRO[rF.total];
      corpo +=
        `<p class="result"><strong class="failure">Falha crítica — 1 natural</strong></p>` +
        `<p class="result"><strong>(${rF.total}) ${f.rotulo}</strong> — ${f.efeito}</p>`;
      return void await card(this.actor, "Ataque de nave", corpo, rolls);
    }

    const critico = natural === 20;

    // A manobra evasiva do alvo substitui o CP por uma JP dele.
    let acertou;
    if (evasiva) {
      const modJP = jpComEnergia(alvoNave.system, true);
      const jp = await new Roll(`1d20 + ${modJP}`).evaluate();
      rolls.push(jp);
      const evitou = jp.total >= alvoNave.system.jp;
      acertou = critico || !evitou;
      corpo +=
        `<p class="result">Manobra evasiva de ${alvoNave.name}: <strong>${jp.total}</strong>` +
        ` contra JP ${alvoNave.system.jp} — <strong class="${evitou ? "success" : "failure"}">` +
        `${evitou ? "evitou" : "não evitou"}</strong></p>` +
        (critico && evitou ? `<p><em>O 20 natural acerta de todo jeito.</em></p>` : "");
    } else {
      acertou = critico || ataque.total >= cp;
      corpo += `<p class="result"><strong>${ataque.total}</strong> contra CP ${cp}` +
        (alvoNave ? ` (${alvoNave.name})` : "") + `</p>`;
    }

    corpo += `<p class="result"><strong class="${acertou ? "success" : "failure"}">${acertou ? "Acertou" : "Errou"}</strong></p>`;

    if (acertou) {
      let efeito = null;
      if (critico) {
        const rC = await new Roll("1d6").evaluate();
        rolls.push(rC);
        efeito = CRITICOS_LIVRO[rC.total];
        corpo +=
          `<p class="result"><strong class="success">Crítico — 20 natural</strong></p>` +
          `<p class="result"><strong>(${rC.total}) ${efeito.rotulo}</strong> — ${efeito.efeito}</p>`;
      }

      // Dano cheio: no livro não há dado cancelado.
      const rDano = await new Roll(`${dano.n}d${dano.faces}${dano.resto}`).evaluate();
      rolls.push(rDano);
      const pv = rDano.total * (efeito?.dobra ? 2 : 1);
      corpo += `<p class="result">Dano: <strong>${pv}</strong> (${arma.dano}` +
        (efeito?.dobra ? ", dobrado pelo crítico" : "") + `)</p>`;

      if (d.aplicar && alvoNave) {
        const restante = alvoNave.system.pv.value - pv;
        const updAlvo = { "system.pv.value": restante };
        if (efeito?.chave) updAlvo[`system.avarias.${efeito.chave}`] = true;
        await alvoNave.update(updAlvo);
        corpo += `<p><em>Aplicado em ${alvoNave.name}: PV ${restante}/${alvoNave.system.pv.max}` +
          (efeito?.chave ? `, avaria de ${efeito.rotulo}` : "") + `.</em></p>`;
        // "não há testes a serem realizados para evitar esse evento"
        if (restante <= 0) {
          corpo += `<p class="result"><strong>${alvoNave.name} entra em processo de destruição</strong>` +
            ` — 1 segundo por PV do total (${alvoNave.system.pv.max} s).</p>`;
        }
      }
    }

    await card(this.actor, "Ataque de nave", corpo, rolls);
  }

  /**
   * A MANOBRA EVASIVA do §10.6 — o que o botão de Esquiva faz no modo Livro.
   *
   * Só nave PEQUENA pode; exige um teste de pilotagem, e o resultado dele dá
   * o modificador da JP pela T10-5. Falhar no teste não impede a manobra de ser
   * declarada, mas o livro é explícito: "uma falha não permite que a JP seja
   * feita para evitar ataques" — então a manobra não fica ativa.
   */
  static async #manobraEvasiva() {
    if (evasivaBloqueada(this.actor.system)) {
      return ui.notifications.warn(
        `${this.actor.name} está sob supressão: não faz manobra evasiva nesta rodada.`);
    }
    const s = this.actor.system;
    const nome = TIPOS[s.tipo]?.rotulo ?? s.tipo;
    if (!evasivaPermitida(s.tipo)) {
      return ui.notifications.info(
        `${this.actor.name} é ${nome}: só naves pequenas fazem manobras evasivas (§10.6).`);
    }

    const rodada = game.combat?.round ?? 0;
    const ultima = s.evasiva?.rodada ?? 0;
    const falta = EVASIVA_INTERVALO - (rodada - ultima);
    if (rodada && ultima && falta > 0) {
      return ui.notifications.warn(
        `Manobra evasiva é uma vez a cada ${EVASIVA_INTERVALO} rodadas: faltam ${falta}.`);
    }

    const r = await pergunta({
      titulo: `Manobra evasiva — ${this.actor.name}`,
      conteudo:
        `<div class="starwars-sd-nave-dialogo">` +
        `<p>Um teste de <strong>pilotagem</strong>, e o resultado dá o modificador da JP (T10-5).</p>` +
        `<div class="linha"><label>Pilotar naves (%)</label><input type="number" name="chance" value="80" min="0" max="100"></div>` +
        `</div>`,
      botoes: [{ chave: "rolar", rotulo: "Pilotar", padrao: true }, { chave: "cancelar", rotulo: "Cancelar" }],
    });
    if (!r || r.acao !== "rolar") return;

    const chance = Math.max(0, Math.min(100, Number(r.dados.chance) || 0));
    const roll = await new Roll("1d100").evaluate();
    const faixa = faixaDePilotagem(roll.total, chance);
    const passou = faixa.mod > 0;

    await this.actor.update({
      "system.evasiva.ativa": passou,
      "system.evasiva.mod": faixa.mod,
      "system.evasiva.rodada": game.combat?.round ?? 0,
    });

    await card(this.actor, "Manobra evasiva",
      `<p class="result"><strong>${roll.total}</strong> contra ${chance}% — ${faixa.rotulo}</p>` +
      `<p class="result">Modificador da JP: <strong>${faixa.mod >= 0 ? "+" : ""}${faixa.mod}</strong></p>` +
      (passou
        ? `<p class="result"><strong class="success">Em manobra evasiva</strong> — ataques contra ela são evitados com uma JP (alvo ${s.jp}), não pelo CP.</p>`
        : `<p class="result"><strong class="failure">Falhou</strong> — a JP não pode ser feita para evitar ataques nesta rodada.</p>`),
      [roll]);
  }

  /** Esquiva avulsa, para quando o atacante não marcou esta nave como alvo. */
  static async #esquivar() {
    if (this.ehLivro) return NaveFicha.#manobraEvasiva.call(this);
    const s = this.actor.system;
    if (s.esquiva <= 0)
      return ui.notifications.info(`${this.actor.name} é colossal: não esquiva — é atingida e absorve no PV.`);
    const esq = await rolarEsquiva(s.esquiva);
    await card(this.actor, "Esquiva",
      `<p class="result">${legendaEsquiva(esq.faces)}</p>` +
      `<p class="result"><strong>${esq.exitos}</strong> êxito(s) — cancela <strong>${esq.exitos} dado(s) de dano</strong></p>`,
      esq.roll ? [esq.roll] : []);
  }

  /** Iniciativa deste módulo: 1d20 + Destreza do piloto. */
  static async #iniciativa() {
    // A Ordem de Ação é do modo Livro — e, com a opção de mundo ligada, dos
    // DOIS modos: quando a mesa adota a regra do Space Dragon, ela vale para
    // tudo, e ter o Tático rolando 1d20+Destreza no meio disso devolveria a
    // bagunça de duas ordens na mesma cena.
    if (this.ehLivro || ordemLigada()) return NaveFicha.#ordemDeAcao.call(this);
    const s = this.actor.system;
    const roll = await new Roll(`1d20 + ${s.iniciativa}`).evaluate();
    // Se a nave está num combate, grava lá — é a ordem de tiro da rodada.
    const tok = this.actor.getActiveTokens?.()[0]?.document;
    const c = tok && game.combat?.getCombatantByToken?.(tok.id);
    if (c) await game.combat.setInitiative(c.id, roll.total);
    await card(this.actor, "Iniciativa",
      `<p class="result"><strong>${roll.total}</strong> (1d20 + ${s.iniciativa})</p>` +
      `<p><em>Os tiros saem na ordem de Iniciativa; o movimento, na ordem crescente de Velocidade.</em></p>`,
      [roll]);
  }

  /**
   * A ORDEM DE AÇÃO do §10.6 (T10-6) — o que o botão de Iniciativa faz no modo
   * Livro.
   *
   * Não se rola nada: o valor É a ação escolhida — os dados de dano da arma
   * para disparar, o bônus de ataque para ativar equipamento, a jogada de
   * proteção para manobra evasiva ou movimento duplo. Como em todo o Space
   * Dragon, o MENOR valor age primeiro.
   */
  static async #ordemDeAcao() {
    const s = this.actor.system;
    const arma = s.armas[0];
    const dadosDeDano = arma ? (lerDano(arma.dano)?.n ?? 0) : 0;

    const opcoes = [
      { chave: "disparo", rotulo: `${ORDEM_LIVRO.disparo.rotulo} — ${dadosDeDano || "?"}`, valor: dadosDeDano },
      { chave: "equipamento", rotulo: `${ORDEM_LIVRO.equipamento.rotulo} — ${s.ba}`, valor: s.ba },
      { chave: "evasiva", rotulo: `${ORDEM_LIVRO.evasiva.rotulo} — ${s.jp}`, valor: s.jp },
    ];

    const r = await pergunta({
      titulo: `Ordem de ação — ${this.actor.name}`,
      conteudo:
        `<div class="starwars-sd-nave-dialogo">` +
        `<p>Na T10-6 o valor é a própria <strong>ação</strong>, e o <strong>menor age primeiro</strong>.</p>` +
        `<div class="linha"><label>Ação desta rodada</label><select name="acao">` +
        opcoes.map((o) => `<option value="${o.chave}">${o.rotulo}</option>`).join("") +
        `</select></div></div>`,
      botoes: [{ chave: "ok", rotulo: "Entrar na ordem", padrao: true }, { chave: "cancelar", rotulo: "Cancelar" }],
    });
    if (!r || r.acao !== "ok") return;

    const escolha = opcoes.find((o) => o.chave === r.dados.acao) ?? opcoes[0];
    const tok = this.actor.getActiveTokens?.()[0]?.document;
    const c = tok && game.combat?.getCombatantByToken?.(tok.id);
    if (c) await game.combat.setInitiative(c.id, escolha.valor);

    await card(this.actor, "Ordem de ação",
      `<p class="result"><strong>${escolha.valor}</strong> — ${escolha.rotulo.split(" — ")[0]}</p>` +
      `<p><em>Menor age primeiro (§10.6, T10-6).</em></p>`);
  }

  /** Engenharia: remove uma avaria, recupera 1d10 PV ou tira 1 Sobrecarga. */
  static async #reparar() {
    const s = this.actor.system;
    // É da Sala de Máquinas que se repara a nave em combate.
    if (!camaraOperacional(s, "maquinas")) {
      return ui.notifications.warn(
        `${this.actor.name}: sem a Sala de Máquinas operacional não há como reparar em combate.`);
    }
    const ativas = Object.values(AVARIAS).filter((a) => a.chave && s.avarias[a.chave]);
    const r = await pergunta({
      titulo: `Engenharia — ${this.actor.name}`,
      conteudo:
        `<form class="starwars-sd-nave-dialogo">` +
        `<p>O posto de Engenharia (ou o piloto solo, gastando o tiro) faz <strong>Operar Máquinas</strong>. ` +
        `Com sucesso, escolha:</p>` +
        `<div class="linha"><label>Reparo</label><select name="o">` +
        ativas.map((a) => `<option value="${a.chave}">Remover a avaria de ${a.rotulo}</option>`).join("") +
        `<option value="pv">Recuperar 1d10 PV</option>` +
        (s.sobrecarga > 0 ? `<option value="sobrecarga">Remover 1 Sobrecarga extra</option>` : "") +
        `</select></div></form>`,
      botoes: [{ chave: "ok", rotulo: "Reparar", padrao: true }, { chave: "cancelar", rotulo: "Cancelar" }],
    });
    if (!r || r.acao !== "ok") return;
    const o = r.dados.o;
    if (o === "pv") {
      const roll = await new Roll("1d10").evaluate();
      const novo = Math.min(s.pv.max || Infinity, s.pv.value + roll.total);
      await this.actor.update({ "system.pv.value": novo });
      return card(this.actor, "Reparo", `<p class="result">+<strong>${roll.total}</strong> PV — ${novo}/${s.pv.max}</p>`, [roll]);
    }
    if (o === "sobrecarga") {
      await this.actor.update({ "system.sobrecarga": Math.max(0, s.sobrecarga - 1) });
      return card(this.actor, "Engenharia", `<p class="result">−1 Sobrecarga — resta ${Math.max(0, s.sobrecarga - 1)}</p>`);
    }
    await this.actor.update({ [`system.avarias.${o}`]: false });
    const a = Object.values(AVARIAS).find((x) => x.chave === o);
    return card(this.actor, "Reparo", `<p class="result">Avaria de <strong>${a?.rotulo ?? o}</strong> reparada.</p>`);
  }

  static async #sobrecarga(event, botao) {
    const delta = Number(botao.dataset.delta) || 0;
    await this.actor.update({ "system.sobrecarga": Math.max(0, this.actor.system.sobrecarga + delta) });
  }

  static async #avaria(event, botao) {
    const q = botao.dataset.chave;
    const liga = !this.actor.system.avarias[q];
    const upd = { [`system.avarias.${q}`]: liga };
    // A avaria é DATADA ao ligar, para o Controle de Avarias ter de quando
    // contar o prazo. Desligar zera, senão a próxima herdaria o relógio velho.
    if (q in PRAZO_DE_AVARIA) {
      upd[`system.avariaRodada.${q}`] = liga ? (game.combat?.round ?? 0) : 0;
    }
    await this.actor.update(upd);
  }

  /** Sensores: +2 no próximo ataque aliado contra o alvo travado. */
  static async #trava() {
    const atual = this.actor.system.trava;
    const marcado = [...(game.user?.targets ?? [])][0]?.name ?? "";
    const r = await pergunta({
      titulo: "Travar alvo",
      conteudo:
        `<form class="starwars-sd-nave-dialogo"><div class="linha"><label>Alvo travado</label>` +
        `<input type="text" name="alvo" value="${atual || marcado}" placeholder="nome da nave"></div>` +
        `<p><em>+2 no próximo ataque aliado contra ele. A Trava é gasta no ataque.</em></p></form>`,
      botoes: [{ chave: "ok", rotulo: "Travar", padrao: true }, { chave: "limpar", rotulo: "Limpar" }],
    });
    if (!r) return;
    await this.actor.update({ "system.trava": r.acao === "limpar" ? "" : (r.dados.alvo ?? "") });
  }

  /* ── AS AÇÕES DA TRIPULAÇÃO ─────────────────────────────────────────────
   *
   * O posto escolhe, e a ficha aplica o que PODE aplicar. Duas opções do
   * Comando ficam como texto de propósito (ver AUTOMATIZA em tripulacao.js):
   * "Ordem" dá uma ação a mais a um posto, e a ficha não sabe o que aquele
   * posto ia fazer; "Sangue frio" rerrola um dado que já saiu no chat.
   */
  static async #acaoPosto(event, botao) {
    const posto = botao.dataset.posto;
    const chave = botao.closest(".posto")?.querySelector("select.acao")?.value ?? "";
    const acao = acaoDoPosto(posto, chave);
    if (!acao) return ui.notifications.warn("Escolha uma ação para o posto.");

    const s = this.actor.system;
    const upd = { [`system.postoAcao.${posto}`]: chave };
    const rodada = game.combat?.round ?? 0;
    const linhas = [`<p><strong>${POSTOS[posto].rotulo}</strong> — ${acao.rotulo}</p>`];
    const rolls = [];

    if (chave === "firmar") {
      upd["system.firmar.ativa"] = true;
      upd["system.firmar.rodada"] = rodada;
      linhas.push(
        `<p class="result">A nave <strong>não se move</strong> nesta rodada: ` +
        `<strong>+4</strong> na JP dela e <strong>+2</strong> nos ataques dos artilheiros.</p>`);
    } else if (chave === "correr") {
      // "Correr" apressa o perseguidor, se a camada de fuga estiver ligada
      if (camadaLigada("camadaFuga")) {
        const marcas = Math.min(MARCAS_DO_PERSEGUIDOR, (s.fuga?.perseguidor ?? 0) + 2);
        upd["system.fuga.perseguidor"] = marcas;
        linhas.push(
          `<p class="result">Movimento dobrado — e o perseguidor avança <strong>2</strong>, ` +
          `para <strong>${marcas}/${MARCAS_DO_PERSEGUIDOR}</strong>.</p>`);
      } else {
        linhas.push(
          `<p class="result">Movimento dobrado, e a <strong>ação do turno se perde</strong>.</p>`);
      }
    } else if (chave === "forcar") {
      if (!camadaLigada("camadaEnergia")) {
        return ui.notifications.warn("Forçar o reator precisa da camada de Energia ligada.");
      }
      const roll = await new Roll("1d6").evaluate();
      rolls.push(roll);
      upd["system.energia.extra"] = (s.energia?.extra ?? 0) + 2;
      upd["system.energia.rodada"] = rodada;
      linhas.push(`<p class="result"><strong>+2</strong> pontos de energia nesta rodada.</p>`);
      if (roll.total === 1) {
        upd["system.avarias.motor"] = true;
        upd["system.avariaRodada.motor"] = rodada;
        linhas.push(
          `<p class="result">O <strong>1</strong> saiu: a <strong>Sala de Máquinas</strong> pegou avaria.</p>`);
      }
    } else if (chave === "interferencia") {
      upd["system.interferencia"] = true;
      linhas.push(
        `<p class="result"><strong>−2</strong> no próximo ataque inimigo contra esta nave.</p>`);
    } else if (chave === "aguentem") {
      upd["system.aguentem.ativa"] = true;
      upd["system.aguentem.rodada"] = rodada;
      linhas.push(
        `<p class="result">Uma penalidade de avaria fica <strong>cancelada</strong> até o fim da rodada.</p>`);
    } else if (chave === "supressao") {
      // a supressão se grava em QUEM levou, e por isso precisa do alvo marcado
      const alvo = [...(game.user?.targets ?? [])][0]?.actor;
      if (alvo?.type === TIPO_NAVE && alvo.isOwner) {
        await alvo.update({
          "system.suprimida.ativa": true,
          "system.suprimida.rodada": rodada,
        });
        linhas.push(
          `<p class="result"><strong>${alvo.name}</strong> fica suprimida: <strong>−2</strong> no ` +
          `próximo ataque dela, e <strong>sem manobra evasiva</strong> nesta rodada.</p>`);
      } else {
        linhas.push(
          `<p class="result">Marque a nave alvo (tecla T) para a ficha aplicar a supressão nela. ` +
          `Sem isso, à mão: <strong>−2</strong> no próximo ataque do alvo, e ele não evade nesta rodada.</p>`);
      }
    }

    // a nota entra sempre: é o que explica a escolha para quem leu o cartão
    linhas.push(`<p class="dica"><em>${acao.nota}</em></p>`);
    await this.actor.update(upd);
    await card(this.actor, `Posto: ${POSTOS[posto].rotulo}`, linhas.join(""), rolls);
  }

  /**
   * O gasto de combustível (T10-3).
   *
   * O livro não dá tabela de consumo e dá uma régua de duas peças: a AUTONOMIA
   * da fonte escolhe o dado (baixa d6, média d4, alta d2) e a AÇÃO escolhe
   * quantos dados, de 1 a 3. O resultado desconta em pontos percentuais.
   */
  static async #combustivel() {
    const s = this.actor.system;
    const r = await pergunta({
      titulo: `Combustível — ${this.actor.name}`,
      conteudo:
        `<form class="starwars-sd-nave-dialogo">` +
        `<p>Fonte: <strong>${FONTES_DE_ENERGIA[s.fonte]?.rotulo}</strong> ` +
        `(autonomia ${FONTES_DE_ENERGIA[s.fonte]?.autonomia}). ` +
        `Tanque em <strong>${s.combustivel ?? 100}%</strong>.</p>` +
        `<div class="linha"><label>Custo da ação</label><select name="gasto">` +
        `<option value="1">1 — rotina (um dia de viagem)</option>` +
        `<option value="2" selected>2 — exigente (salto, manobra evasiva)</option>` +
        `<option value="3">3 — extremo (fuga longa, trajeto hostil)</option>` +
        `</select></div>` +
        `<p class="dica"><em>A autonomia escolhe o dado; a ação, quantos. ` +
        `Quem decide o custo é o Mestre.</em></p></form>`,
      botoes: [
        { chave: "gastar", rotulo: "Gastar", padrao: true },
        { chave: "encher", rotulo: "Abastecer" },
      ],
    });
    if (!r) return;

    if (r.acao === "encher") {
      const custo = custoDeAbastecimento(s.fonte, TIPOS[s.tipo]?.tamanho,
                                         100 - (s.combustivel ?? 0));
      await this.actor.update({ "system.combustivel": 100 });
      return void await card(this.actor, "Abastecida",
        `<p class="result">Tanque em <strong>100%</strong>.</p>` +
        (custo == null
          ? `<p class="dica"><em>Painéis termoenergéticos não se abastecem: basta sol.</em></p>`
          : `<p class="dica"><em>Custo: ${custo.toLocaleString("pt-BR")} créditos.</em></p>`));
    }

    const formula = formulaDeGasto(s.fonte, r.dados.gasto);
    const roll = await new Roll(formula).evaluate();
    const resta = Math.max(0, (s.combustivel ?? 100) - roll.total);
    await this.actor.update({ "system.combustivel": resta });
    await card(this.actor, "Combustível",
      `<p class="result">${formula}: gastou <strong>${roll.total}%</strong></p>` +
      `<p class="result">Resta <strong>${resta}%</strong></p>` +
      (resta === 0
        ? `<p class="result"><strong class="failure">Tanque seco.</strong> A nave ` +
          `não se move até abastecer.</p>`
        : resta <= 20
          ? `<p class="dica"><em>Abaixo de 20%: é hora de procurar estação.</em></p>`
          : ""),
      [roll]);
  }

  /** Instala ou remove um equipamento adicional da T10-4. */
  static async #equipamento(event, botao) {
    const chave = botao.dataset.chave;
    const e = EQUIPAMENTOS_DE_NAVE[chave];
    if (!e) return;
    const s = this.actor.system;
    const tamanho = TIPOS[s.tipo]?.tamanho;
    const ligando = s.equipamentos?.[chave] !== true;
    // a matriz da T10-4 é regra: a ficha não deixa instalar onde não cabe
    if (ligando && e.cabe?.[tamanho] !== true) {
      return ui.notifications.warn(
        `A T10-4 não admite ${e.rotulo} em nave ${tamanho}.`);
    }
    await this.actor.update({ [`system.equipamentos.${chave}`]: ligando });
  }

  /** Engenharia reparte os pontos do reator. Não acumulam entre rodadas. */
  static async #energia() {
    const s = this.actor.system;
    const p = NaveFicha.painelDeEnergia(s, this.ehLivro);
    const r = await pergunta({
      titulo: `Energia — ${this.actor.name}`,
      conteudo:
        `<form class="starwars-sd-nave-dialogo">` +
        `<p>O reator dá <strong>${p.total}</strong> ponto(s) nesta rodada. Reparta — o que não ` +
        `for gasto <strong>não acumula</strong>.</p>` +
        p.destinos.map((d) =>
          `<div class="linha"><label>${d.rotulo}</label>` +
          `<input type="number" name="${d.chave}" value="${d.valor}" min="0" max="${p.total}">` +
          `<span class="dica">${d.efeito}</span></div>`).join("") +
        `</form>`,
      botoes: [
        { chave: "ok", rotulo: "Distribuir", padrao: true },
        { chave: "zerar", rotulo: "Zerar" },
      ],
    });
    if (!r) return;
    const rodada = game.combat?.round ?? 0;
    if (r.acao === "zerar") {
      await this.actor.update({
        "system.energia.motores": 0,
        "system.energia.escudos": 0,
        "system.energia.armas": 0,
        "system.energia.extra": 0,
        "system.energia.rodada": rodada,
      });
      return;
    }
    const pedido = {
      motores: Math.max(0, Number(r.dados.motores) || 0),
      escudos: Math.max(0, Number(r.dados.escudos) || 0),
      armas: Math.max(0, Number(r.dados.armas) || 0),
    };
    if (energiaGasta(pedido) > p.total) {
      return ui.notifications.warn(
        `O reator dá ${p.total} ponto(s), e foram repartidos ${energiaGasta(pedido)}.`);
    }
    await this.actor.update({
      "system.energia.motores": pedido.motores,
      "system.energia.escudos": pedido.escudos,
      "system.energia.armas": pedido.armas,
      "system.energia.rodada": rodada,
    });
    const novo = NaveFicha.painelDeEnergia(this.actor.system, this.ehLivro);
    await card(this.actor, "Energia distribuída",
      `<p class="result">${novo.resumo || "nada investido"}</p>` +
      `<p class="dica"><em>Sobram ${novo.sobra} de ${novo.total}. Zera no fim da rodada.</em></p>`);
  }

  /** O relógio do perseguidor, na camada de fuga. */
  static async #perseguidor(event, botao) {
    const passo = Number(botao.dataset.passo ?? 1);
    const s = this.actor.system;
    const marcas = Math.max(0, Math.min(MARCAS_DO_PERSEGUIDOR, (s.fuga?.perseguidor ?? 0) + passo));
    await this.actor.update({ "system.fuga.perseguidor": marcas });
    if (quemFechaPrimeiro(s.fuga?.etapas ?? 0, marcas) === "perseguidor") {
      await card(this.actor, "O perseguidor alcançou",
        `<p class="result">O relógio dele fechou: <strong>travão de raio</strong>, abordagem, ` +
        `e o combate continua a pé.</p>`);
    }
  }

  /** Uma etapa do salto: Distância, Direção, Execução. */
  static async #etapaDoSalto(event, botao) {
    const passo = Number(botao.dataset.passo ?? 1);
    const s = this.actor.system;
    const etapas = Math.max(0, Math.min(3, (s.fuga?.etapas ?? 0) + passo));
    await this.actor.update({ "system.fuga.etapas": etapas });
    if (quemFechaPrimeiro(etapas, s.fuga?.perseguidor ?? 0) === "salto") {
      await card(this.actor, "A nave saltou",
        `<p class="result">As três etapas fecharam antes do perseguidor: ` +
        `<strong>a nave entra no hiperespaço</strong>.</p>`);
    }
  }

  static async #fimDaRodada() {
    const s = this.actor.system;
    // LIMPA_NO_FIM_DA_RODADA é a lista única do que vale "até o fim da rodada":
    // a energia (que não acumula), o Firmar, a Interferência, a Supressão e o
    // Aguentem firme. Estar numa constante é o que evita esquecer um campo novo.
    const upd = {
      "system.manobra.tipo": "", "system.manobra.revelada": false,
      ...LIMPA_NO_FIM_DA_RODADA,
    };
    for (const a of AVARIAS_DE_UMA_RODADA) upd[`system.avarias.${a}`] = false;
    // A manobra evasiva vale pela rodada em que foi declarada; a rodada em que
    // ela aconteceu FICA gravada, para valer o intervalo de 5.
    if (s.evasiva?.ativa) upd["system.evasiva.ativa"] = false;

    // ── A avaria não reparada vira dano estrutural ──
    //
    // Aqui é onde o Combate Tático e as câmaras se encostam: o que o Engenheiro
    // não consertou nesta rodada deixa de ser susto e vira obra. Só as avarias
    // duradouras — o Leme e a Tripulação saem sozinhos, de propósito.
    const viraram = [];
    for (const [avaria, camara] of Object.entries(AVARIA_VIRA_CAMARA)) {
      if (s.avarias[avaria] && s.camaras?.[camara] === "instalada") {
        upd[`system.camaras.${camara}`] = "danificada";
        viraram.push({ avaria, camara: CAMARAS[camara] });
      }
    }
    await this.actor.update(upd);

    const estrutural = viraram.length
      ? `<p class="result"><strong>Dano estrutural</strong> — a avaria que ficou virou obra:</p><ul>` +
        viraram.map(({ avaria, camara }) =>
          `<li><strong>${AVARIAS[Object.keys(AVARIAS).find((k) => AVARIAS[k].chave === avaria)].rotulo}</strong>` +
          ` → <strong>${camara.rotulo}</strong> danificada` +
          ` (reparo: ${Math.round(camara.obra * REPARO_DE_CAMARA).toLocaleString("pt-BR")} CR, metade de ${camara.prazo})</li>`).join("") +
        `</ul>`
      : "";

    // os parênteses importam: sem eles a concatenação vem antes do ternário e o
    // cartão sai sempre com o texto do modo Livro, mesmo no Tático
    const fecho = this.ehLivro
      ? `<p>A <strong>manobra evasiva</strong> saiu: ataques voltam a ser opostos pelo CP. ` +
        `A rodada dela fica registrada — são ${EVASIVA_INTERVALO} rodadas até a próxima.</p>`
      : `<p>Manobra limpa para o próximo planejamento. As avarias de <strong>Leme</strong> e <strong>Tripulação</strong>, ` +
        `que valem por uma rodada, saíram. Motor, Armas e Sensores ficam até o reparo.</p>`;
    await card(this.actor, "Fim da rodada", estrutural + fecho);
  }

  /**
   * Gira o estado de uma câmara: instalada → danificada → ausente → instalada.
   *
   * Um clique só, porque na mesa isso muda no meio da cena — a Ponte leva um
   * tiro e as armas param. O custo do reparo aparece no título do botão, pela
   * régua de 25% do Cap. 8.
   */
  static async #camara(event, botao) {
    const chave = botao.dataset.chave;
    if (!CAMARAS[chave]) return;
    const atual = this.actor.system.camaras?.[chave] ?? "instalada";
    const proximo = ESTADOS_DE_CAMARA[(ESTADOS_DE_CAMARA.indexOf(atual) + 1) % ESTADOS_DE_CAMARA.length];
    await this.actor.update({ [`system.camaras.${chave}`]: proximo });
  }

  /**
   * O SALTO HIPERESPACIAL: três testes de Pilotar, na ordem.
   *
   * Rola-se na Ponte — é o que a regra das câmaras diz, e é por isso que o
   * teste mora na ficha da nave e não na do piloto: o que se testa é a nave
   * saltando, com os instrumentos dela.
   *
   * A sequência não pode ser abortada no meio, então os três saem de uma vez.
   */
  static async #salto() {
    // T10-4: sem acelerador hiperespacial não há salto — e a tabela não o
    // admite em nave pequena nem colossal, o que é a regra por trás de um caça
    // precisar de nave-mãe para sair do sistema.
    {
      const s0 = this.actor.system;
      if (!efeitosInstalados(s0.equipamentos, TIPOS[s0.tipo]?.tamanho).podeSaltar) {
        const cabe = EQUIPAMENTOS_DE_NAVE.acelerador.cabe[TIPOS[s0.tipo]?.tamanho];
        return ui.notifications.warn(
          cabe
            ? `${this.actor.name} não tem o Acelerador Hiperespacial instalado (T10-4).`
            : `${this.actor.name} é ${TIPOS[s0.tipo]?.tamanho}: a T10-4 não admite ` +
              `Acelerador Hiperespacial nesse tamanho — a nave não salta.`);
      }
    }
    if (!camaraOperacional(this.actor.system, "ponte")) {
      return ui.notifications.warn(
        `${this.actor.name}: o salto se rola na Ponte de Comando, e ela não está operacional.`);
    }

    const r = await pergunta({
      titulo: `Salto hiperespacial — ${this.actor.name}`,
      conteudo:
        `<div class="starwars-sd-nave-dialogo">` +
        `<p>Três testes de <strong>Pilotar</strong>, nesta ordem: <em>Distância</em>, ` +
        `<em>Direção</em> e <em>Execução</em>. A sequência não pode ser abortada no meio.</p>` +
        `<div class="linha"><label>Pilotar naves (%)</label><input type="number" name="chance" value="80" min="0" max="100"></div>` +
        `<div class="linha"><label>Modificador</label><input type="number" name="mod" value="0"></div>` +
        `</div>`,
      botoes: [{ chave: "rolar", rotulo: "Saltar", padrao: true }, { chave: "cancelar", rotulo: "Cancelar" }],
    });
    if (!r || r.acao !== "rolar") return;

    const chance = Math.max(0, Math.min(100, (Number(r.dados.chance) || 0) + (Number(r.dados.mod) || 0)));
    const rolls = [];
    const linhas = [];
    const falhas = [];
    for (const etapa of ETAPAS_DO_SALTO) {
      const roll = await new Roll("1d100").evaluate();
      rolls.push(roll);
      const passou = roll.total <= chance;
      if (!passou) falhas.push(etapa);
      linhas.push(
        `<p class="result"><strong>${etapa.rotulo}:</strong> ${roll.total} contra ${chance}% — ` +
        `<strong class="${passou ? "success" : "failure"}">${passou ? "passou" : "falhou"}</strong></p>`);
    }

    const execucaoFalhou = falhas.some((f) => f.chave === "execucao");
    const desfecho = execucaoFalhou
      ? `<p class="result"><strong class="failure">O salto não acontece.</strong> ${ETAPAS_DO_SALTO[2].erro}</p>`
      : falhas.length
        ? `<p class="result"><strong>A nave salta, e chega errado.</strong></p>` +
          falhas.map((f) => `<p><em>${f.rotulo}: ${f.erro}</em></p>`).join("")
        : `<p class="result"><strong class="success">Salto limpo</strong> — a nave chega onde queria.</p>`;

    await card(this.actor, "Salto hiperespacial", linhas.join("") + desfecho, rolls);
  }

  /**
   * A TRANCA DO ARSENAL: invadir exige Sabotagem com −20%.
   *
   * O teste é de quem invade, mas a dificuldade é da nave — a tranca é dela —,
   * e por isso fica aqui.
   */
  static async #arsenal() {
    if (!camaraOperacional(this.actor.system, "arsenal")) {
      return ui.notifications.info(
        `${this.actor.name}: sem Arsenal operacional não há tranca a forçar — o material está solto pela nave.`);
    }
    const r = await pergunta({
      titulo: `Forçar o Arsenal — ${this.actor.name}`,
      conteudo:
        `<div class="starwars-sd-nave-dialogo">` +
        `<p>As trancas digitais do Arsenal impõem <strong>${TRANCA_DO_ARSENAL}%</strong> a quem tenta ` +
        `invadi-lo sem autorização.</p>` +
        `<div class="linha"><label>Sabotagem do invasor (%)</label><input type="number" name="chance" value="30" min="0" max="100"></div>` +
        `</div>`,
      botoes: [{ chave: "rolar", rotulo: "Forçar", padrao: true }, { chave: "cancelar", rotulo: "Cancelar" }],
    });
    if (!r || r.acao !== "rolar") return;

    const bruta = Math.max(0, Math.min(100, Number(r.dados.chance) || 0));
    const alvo = Math.max(0, bruta + TRANCA_DO_ARSENAL);
    const roll = await new Roll("1d100").evaluate();
    const passou = roll.total <= alvo;
    await card(this.actor, "Trancas do Arsenal",
      `<p class="result">Sabotagem ${bruta}% ${TRANCA_DO_ARSENAL}% = <strong>${alvo}%</strong></p>` +
      `<p class="result"><strong>${roll.total}</strong> — <strong class="${passou ? "success" : "failure"}">` +
      `${passou ? "a tranca cede" : "a tranca aguenta"}</strong></p>`, [roll]);
  }

  // ── Preenchimento pelo tipo ───────────────────────────────────────────────
  static async #aplicarTipo() {
    const p = TIPOS[this.actor.system.tipo];
    if (!p) return;
    await this.actor.update({
      "system.ba": p.ba, "system.cp": p.cp, "system.jp": p.jp,
      "system.velocidade": p.velocidade, "system.esquiva": p.esquiva,
      "system.pv.formula": p.pv,
    });
    ui.notifications.info(`${p.rotulo}: BA +${p.ba}, CP ${p.cp}, JP ${p.jp}, Velocidade ${p.velocidade}, Esquiva ${p.esquiva}d6.`);
  }

  static async #rolarPV() {
    const f = this.actor.system.pv.formula || "1d100";
    const roll = await new Roll(f).evaluate();
    await this.actor.update({ "system.pv.max": roll.total, "system.pv.value": roll.total });
    await card(this.actor, "Pontos de vida", `<p class="result"><strong>${roll.total}</strong> PV (${f})</p>`, [roll]);
  }

  static async #addArma() {
    const arco = this.actor.system.perfil?.arcoLivre ? "livre" : "frontal";
    await this.actor.update({ "system.armas": [...this.actor.system.armas, { nome: "Canhões laser", dano: "4d8", arco }] });
  }

  static async #delArma(event, botao) {
    const armas = [...this.actor.system.armas];
    armas.splice(Number(botao.dataset.idx), 1);
    await this.actor.update({ "system.armas": armas });
  }

  // ── Dial ──────────────────────────────────────────────────────────────────
  /** Planejar: a manobra fica gravada em segredo até o Mover. */
  static async #planejar(event, botao) {
    if (botao.dataset.bloqueada === "true") {
      const s = this.actor.system;
      return ui.notifications.warn(
        s.avarias.leme ? "Leme avariado: só manobras verdes ou brancas nesta rodada."
          : "Com Sobrecarga, a nave não faz manobra vermelha — antes, uma verde tira 1 marca."
      );
    }
    await this.actor.update({
      "system.manobra.tipo": botao.dataset.tipo,
      "system.manobra.velocidade": Number(botao.dataset.vel),
      "system.manobra.lado": botao.dataset.lado ?? "",
      "system.manobra.revelada": false,
    });
  }

  /** Mover: revela a manobra, move o token e aplica a Sobrecarga pela cor. */
  static async #revelar() {
    const s = this.actor.system;
    const m = s.manobra;
    if (!m.tipo) return ui.notifications.warn("Nenhuma manobra planejada.");
    const info = MANOBRAS[m.tipo];

    let sobrecarga = s.sobrecarga;
    let efeito = "";

    const token = this.actor.getActiveTokens?.()[0]?.document;
    if (token) {
      const mov = await moverNave(token, m, s.velocidadeEfetiva);
      if (mov?.erro) {
        efeito += `<p class="result"><strong class="failure">O token não foi movido</strong></p><p>${mov.erro}</p>`;
      } else if (mov) {
        efeito += `<p><em>${mov.casas} hex, giro ${mov.giro > 0 ? "+" : ""}${mov.giro}°.</em></p>`;
        if (mov.colidiu) {
          sobrecarga += 1;
          efeito +=
            `<p class="result"><strong class="failure">Colisão</strong> — parou no hex anterior, +1 Sobrecarga</p>` +
            `<p>As duas naves sofrem <strong>1 dado de dano</strong> se forem do mesmo tamanho; senão, a menor leva o dobro.</p>`;
        }
      }
    }

    if (info.cor === "verde" && sobrecarga > 0) {
      sobrecarga -= 1;
      efeito += `<p class="result"><strong class="success">Manobra verde</strong> — −1 Sobrecarga</p>`;
    } else if (info.cor === "vermelha") {
      sobrecarga += 1;
      efeito += `<p class="result"><strong class="failure">Manobra vermelha</strong> — +1 Sobrecarga</p>`;
    }

    await this.actor.update({ "system.manobra.revelada": true, "system.sobrecarga": sobrecarga });
    await card(this.actor, "Manobra",
      `<p class="result"><strong>${info.simbolo} ${info.rotulo}${m.velocidade ? " " + m.velocidade : ""}` +
      `${m.lado ? (m.lado === "esq" ? " à esquerda" : " à direita") : ""}</strong></p>` + efeito);
  }
}

/* ── AS DUAS FICHAS ────────────────────────────────────────────────────────
 *
 * Só fixam a regra; todo o resto é herdado. `DEFAULT_OPTIONS` e `PARTS` são
 * mesclados pela hierarquia no ApplicationV2, então o template é um só — e é
 * de propósito: dois .hbs para a mesma nave divergiriam na primeira correção,
 * e o que muda entre os modos são seis condicionais, não a página.
 */

/** O Combate Tático do Suplemento, sobre o X-Wing Miniatures Game. */
export class NaveFichaTatico extends NaveFicha {
  static MODO = "tatico";
}

/** O §10.6 do Livro Básico Aprimorado: CP, manobra evasiva, T10-5 e T10-6. */
export class NaveFichaLivro extends NaveFicha {
  static MODO = "livro";
}
