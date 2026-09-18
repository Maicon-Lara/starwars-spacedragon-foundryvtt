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

import { TIPOS, MANOBRAS, MANOBRAS_DE_COLOSSO, FAIXAS, AVARIAS, AVARIAS_DE_UMA_RODADA, POSTOS } from "./nave-modelo.js";
import { moverNave, conferirEscala, casasDaManobra } from "./nave-movimento.js";

export const TIPO_NAVE = "starwars-sd.nave";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

/** Cartão no formato nativo do OD2 (div.title + p.result). */
function card(ator, titulo, corpo, rolls = []) {
  return ChatMessage.create({
    content: `<div class="title">${titulo}</div>${corpo}`,
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
  static DEFAULT_OPTIONS = {
    classes: ["starwars-sd", "nave-ficha"],
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
    },
  };

  static PARTS = { corpo: { template: "modules/starwars-sd/templates/nave.hbs", scrollable: [""] } };

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
      escala: canvas?.scene ? conferirEscala(canvas.scene) : { ok: true },
      pctPV: s.pv.max ? Math.max(0, Math.min(100, Math.round((s.pv.value / s.pv.max) * 100))) : 0,
      descricao: await foundry.applications.ux.TextEditor.implementation.enrichHTML(s.descricao, { async: true }),
    };
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

  /** Esquiva avulsa, para quando o atacante não marcou esta nave como alvo. */
  static async #esquivar() {
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

  /** Engenharia: remove uma avaria, recupera 1d10 PV ou tira 1 Sobrecarga. */
  static async #reparar() {
    const s = this.actor.system;
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
    await this.actor.update({ [`system.avarias.${q}`]: !this.actor.system.avarias[q] });
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

  static async #fimDaRodada() {
    const upd = { "system.manobra.tipo": "", "system.manobra.revelada": false };
    for (const a of AVARIAS_DE_UMA_RODADA) upd[`system.avarias.${a}`] = false;
    await this.actor.update(upd);
    await card(this.actor, "Fim da rodada",
      `<p>Manobra limpa para o próximo planejamento. As avarias de <strong>Leme</strong> e <strong>Tripulação</strong>, ` +
      `que valem por uma rodada, saíram. Motor, Armas e Sensores ficam até o reparo.</p>`);
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
