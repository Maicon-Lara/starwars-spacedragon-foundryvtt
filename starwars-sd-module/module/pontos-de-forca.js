/**
 * Pontos de Força — Star Wars para Space Dragon
 *
 * A reserva de heroísmo que TODO personagem tem, sensível à Força ou não. Num
 * Jedi é a Força respondendo; num contrabandista é a sorte que não acaba.
 *
 * A regra está no cofre, em `20 Space Dragon/Novos Itens/Pontos de Forca.md`.
 * O que importa aqui:
 *
 *   · a reserva é do NÍVEL INTEIRO — não recarrega por descanso nem por sessão;
 *     ao subir de nível ela zera e volta cheia: 5 por dado da faixa;
 *   · o dado cresce por faixa: 1d6 até o 7º, o maior de 2d6 até o 14º, o maior
 *     de 3d6 daí em diante;
 *   · em rolagem de d20 "maior é melhor" (ataque, JP) o dado SOMA; em teste de
 *     atributo, que é roll-under, ele SUBTRAI. As duas direções existem no
 *     Space Dragon e é fácil aplicar a errada;
 *   · em talento de d%, a escolha entre Empurrar e Insistir vem ANTES do dado;
 *   · no máximo 1 ponto por rodada em combate;
 *   · os dois usos especiais: Escapar da morte e Recuperação da Força.
 *
 * ── POR QUE O GASTO PERGUNTA ANTES DE ROLAR ────────────────────────────────
 *
 * Até a 1.50 o botão rolava o d6 e o cartão mostrava as três leituras lado a
 * lado (+X, −X, +X0% ou re-rolar). Em d%, isso deixava o jogador escolher
 * DEPOIS de ver o dado, que é o que a regra proíbe: "quem escolhe depois de
 * ver o d6 está comprando certeza, não arriscando". Agora o gasto abre a
 * pergunta "em quê?", e só então rola, se o uso pedir dado.
 *
 * ── ONDE O VALOR MORA ──────────────────────────────────────────────────────
 *
 * Num FLAG do ator, e não no `system`: a ficha é do sistema olddragon2e, e um
 * módulo não acrescenta campos ao modelo de dados dele. O flag sobrevive a
 * atualização do sistema e sai junto se o módulo for desligado.
 *
 * ── SOBRE O GANCHO DE RENDER ───────────────────────────────────────────────
 *
 * `renderOD2CharacterSheet` e `renderActorSheet` disparam os dois neste sistema
 * (medido na mesa em 31/08, no módulo Star Dragon). Ganchar nos dois desenharia
 * o painel duas vezes, então usamos o específico e caímos no genérico caso ele
 * suma numa versão futura.
 */

const ID = "starwars-sd";
const FLAG = "pontosDeForca";
const FLAG_RODADA = "pfRodada";
const MARCA = "starwars-sd-pf";

/** O Alcance da Força mora no módulo Space Dragon (mental.js), num flag dele. */
const ID_SD = "spacedragon";
const FLAG_ALCANCE_GASTO = "alcanceGasto";

/**
 * As fichas que recebem o painel. Até a 1.50 era só `character`, e o "PNJ
 * comum tem 1 Ponto de Força" da regra nunca chegava ao PNJ do Mestre: a
 * ficha de ameaça (`monster`) e o ajudante (`retainer`) não tinham painel.
 */
export const TIPOS_COM_PAINEL = ["character", "retainer", "monster"];

/**
 * O nível que conta para os Pontos de Força. A ficha de ameaça não tem
 * nível: conta como 1º, que é o que importa para o dado do único ponto dela.
 * A de personagem sem nível continua sem painel, como antes.
 */
export function nivelDe(ator) {
  const n = Number(ator?.system?.level);
  if (Number.isFinite(n) && n > 0) return n;
  return ator?.type === "character" ? 0 : 1;
}

/* ── OS USOS ─────────────────────────────────────────────────────────────────
 *
 * O que o jogador declara ao gastar. `rola`: se o uso pede o dado da faixa.
 * Insistir, reativar um poder e Escapar da morte não pedem: gastar o ponto
 * já é o efeito inteiro.
 */
export const USOS = [
  { chave: "ataque", rotulo: "Ataque ou Jogada de Proteção", rola: true },
  { chave: "atributo", rotulo: "Teste de atributo", rola: true },
  { chave: "empurrar", rotulo: "Talento d%: Empurrar (+ o dado × 10%)", rola: true },
  { chave: "insistir", rotulo: "Talento d%: Insistir (re-rolar)", rola: false },
  { chave: "alcance", rotulo: "Recuperação da Força: Alcance", rola: true, soAlcance: true },
  { chave: "poder", rotulo: "Recuperação da Força: reativar um poder", rola: false, soAlcance: true },
  { chave: "morte", rotulo: "Escapar da morte", rola: false },
];
export const USO = Object.fromEntries(USOS.map((u) => [u.chave, u]));

/**
 * Se o personagem tem Alcance da Força: o chassi Mentálico do Space Dragon,
 * que é o do Sensível à Força. "Só serve a quem tem Alcance: um Veterano não
 * tem o que recuperar."
 */
export function temAlcance(ator) {
  const cls = ator?.system?.class ?? ator?.items?.find?.((i) => i.type === "class");
  const declarado = cls?.flags?.spacedragon?.chassi;
  const chassi = declarado ?? String(cls?.name ?? "").split(" — ").pop().trim();
  return chassi === "Mentálico";
}

/** Os usos que este personagem pode escolher. */
export const usosDe = (ator) => USOS.filter((u) => !u.soAlcance || temAlcance(ator));

/**
 * O que o cartão diz, por uso. A direção do dado é o erro mais fácil de
 * cometer no meio da cena, e por isso cada uso diz só a sua.
 */
export function textoDoUso(chave, valor = 0, extra = {}) {
  switch (chave) {
    case "ataque": return `<strong>+${valor}</strong> no ataque ou na JP.`;
    case "atributo": return `<strong>−${valor}</strong> no d20 do teste de atributo.`;
    case "empurrar": return `<strong>+${valor * 10}%</strong> no talento. Agora role o d%.`;
    case "insistir": return "Re-role o talento e fique com o <strong>segundo</strong> resultado.";
    case "alcance": return `Recupera <strong>${extra.recuperado ?? valor}%</strong> de Alcance da Força.`;
    case "poder": return "Reativa <strong>um poder</strong> já esgotado hoje.";
    case "morte": return "Em vez de morrer, para em <strong>0 PV, inconsciente e estável</strong>.";
    default: return "";
  }
}

/* ── UM PONTO POR RODADA ─────────────────────────────────────────────────────
 *
 * Em combate, no máximo 1 ponto por rodada. Fora dele a regra é "1 por
 * teste", e isso a ficha não tem como saber: fica com a mesa.
 */

/** A rodada em que o ator está lutando agora, ou null fora de combate. */
export function rodadaAtual(ator, combate = globalThis.game?.combat) {
  if (!combate?.started) return null;
  const luta = combate.combatants?.some?.((c) => c.actorId === ator?.id || c.actor === ator);
  if (!luta) return null;
  return { combate: combate.id, rodada: combate.round };
}

/** Se o ator já gastou um ponto nesta rodada do combate. */
export function jaGastouNaRodada(ator, combate = globalThis.game?.combat) {
  const agora = rodadaAtual(ator, combate);
  if (!agora) return false;
  const ultimo = ator?.getFlag?.(ID, FLAG_RODADA);
  return !!ultimo && ultimo.combate === agora.combate && ultimo.rodada === agora.rodada;
}

/** O dado da faixa: [quantos d6, o que vale]. */
export function dadoDaFaixa(nivel) {
  if (nivel >= 15) return { dados: 3, rotulo: "3d6, o maior" };
  if (nivel >= 8) return { dados: 2, rotulo: "2d6, o maior" };
  return { dados: 1, rotulo: "1d6" };
}

/**
 * A reserva do nível: **5 por dado da faixa**.
 *
 *   1º ao 7º    1d6            5 PF
 *   8º ao 14º   2d6, o maior  10 PF
 *   15º ao 20º  3d6, o maior  15 PF
 *
 * A reserva muda exatamente onde o dado muda, e por isso as duas regras viram
 * uma só: quem sabe o próprio dado sabe a própria reserva. A fórmula anterior,
 * `5 + (nível ÷ 2)`, subia de um em um nos pares e deixava onze degraus para
 * decorar, desencontrados dos três do dado.
 */
export const reservaDoNivel = (nivel) => 5 * dadoDaFaixa(Math.max(1, nivel)).dados;

/**
 * A reserva cheia é de PROTAGONISTA. Um PNJ comum tem 1 ponto — o bastante
 * para um momento de virada por cena, e sem transformar o lado do Mestre numa
 * planilha de trinta reservas.
 *
 * ── QUEM É PROTAGONISTA ────────────────────────────────────────────────────
 *
 * O flag `heroico`, quando o Mestre o marcou (no botão do painel), manda nos
 * dois sentidos. Sem ele, protagonista é a ficha com jogador dono OU qualquer
 * ficha de PERSONAGEM.
 *
 * Até a 1.48.1 só o dono contava. A ficha recém-criada pelo Mestre ainda não
 * tem jogador, então nascia "PNJ comum", travada em 1 / 1 — o +1 e o ⟳
 * desabilitados, e nada na tela para marcar o flag. Era o caso de toda ficha
 * nova. O PNJ comum do Mestre continua existindo, mas agora por escolha: o
 * botão do painel, só para o Mestre.
 */
export function ehProtagonista(ator) {
  const marcado = ator?.getFlag?.(ID, "heroico");
  if (marcado === true || marcado === false) return marcado;
  return !!ator?.hasPlayerOwner || ator?.type === "character";
}

export function reservaDoAtor(ator) {
  return ehProtagonista(ator) ? reservaDoNivel(Math.max(1, nivelDe(ator))) : 1;
}

/** Quantos pontos o personagem ainda tem. */
export function pontosAtuais(ator) {
  const nivel = nivelDe(ator);
  const guardado = ator?.getFlag?.(ID, FLAG);
  // sem flag, ou com flag de outro nível, a reserva é a do nível atual: subir
  // de nível zera e reenche, e é isso que o `nivel` guardado detecta
  if (!guardado || guardado.nivel !== nivel) return reservaDoAtor(ator);
  return Math.max(0, Math.min(reservaDoAtor(ator), Number(guardado.valor ?? 0)));
}

/** O valor a gravar: a reserva junto do nível em que ela vale. */
const registroDaReserva = (ator, valor) =>
  ({ nivel: nivelDe(ator), valor: Math.max(0, Math.min(reservaDoAtor(ator), valor)) });

/** Grava a reserva, junto do nível em que ela vale. */
export async function gravarPontos(ator, valor) {
  await ator.setFlag(ID, FLAG, registroDaReserva(ator, valor));
}

/**
 * Rola o dado da faixa e devolve { roll, valor, faces }.
 * Em 2d6 e 3d6 o que vale é o MAIOR, não a soma.
 */
export async function rolarPonto(nivel) {
  const { dados, rotulo } = dadoDaFaixa(nivel);
  const roll = await new Roll(`${dados}d6`).evaluate();
  const faces = roll.dice[0].results.map((r) => r.result);
  return { roll, valor: Math.max(...faces), faces, rotulo };
}

/**
 * O painel, em HTML. Devolve null quando não há o que mostrar.
 *
 * Exportado para o teste: o que importa aqui é QUEM vê o botão de recarregar,
 * e isso só se vê no HTML.
 */
export function montaPainel(ator) {
  const nivel = nivelDe(ator);
  if (!nivel) return null;
  const tem = pontosAtuais(ator);
  const limite = reservaDoAtor(ator);
  const { rotulo } = dadoDaFaixa(nivel);

  const pastilhas = Array.from({ length: limite }, (_, i) =>
    `<span class="pf-ponto ${i < tem ? "cheio" : "vazio"}"></span>`).join("");

  // O ⟳ é SÓ DO MESTRE, e não por hierarquia: nas mãos do jogador ele é um
  // botão de desfazer a regra. "Não recarrega por descanso nem por sessão" é o
  // que dá peso ao gasto — com um botão de reenchar na própria ficha, a reserva
  // deixa de ser do nível inteiro e passa a ser infinita.
  //
  // Para o Mestre ele serve ao que a mesa precisa de verdade: subir de nível
  // (quando a reserva deveria ter voltado e alguém já tinha gasto antes de o
  // nível ser corrigido na ficha) e consertar contagem errada.
  const doMestre = !!game.user?.isGM;
  // O +1 também é do Mestre, pelo mesmo motivo do ⟳: até a 1.50 o jogador
  // tinha o "+1 para desfazer um gasto", e cinco cliques nele enchiam a
  // reserva. O ⟳ tinha saído da mão do jogador e o +1 fazia o mesmo serviço.
  const devolver = doMestre
    ? `<button type="button" data-pf="devolver" ${tem < limite ? "" : "disabled"}
            title="Devolve 1 ponto, para desfazer um gasto. Só o Mestre vê este botão.">+1</button>`
    : "";
  const recarregar = doMestre
    ? `<button type="button" data-pf="recarregar" ${tem < limite ? "" : "disabled"}
            title="Devolve a reserva cheia da faixa — ao subir de nível, ou para corrigir a contagem. Só o Mestre vê este botão.">⟳</button>`
    : "";
  // O papel também é só do Mestre: protagonista tem a reserva cheia, PNJ comum
  // tem 1 ponto. O botão mostra o papel ATUAL e troca para o outro.
  const heroi = ehProtagonista(ator);
  const papel = doMestre
    ? `<button type="button" data-pf="papel" class="pf-papel"
            title="${heroi ? "Protagonista: reserva cheia. Clique para tornar PNJ comum (1 ponto)." : "PNJ comum: 1 ponto. Clique para tornar protagonista (reserva cheia)."} Só o Mestre vê este botão.">${heroi ? "protagonista" : "PNJ comum"}</button>`
    : "";

  return `
<div class="${MARCA}">
  <div class="pf-cabeca">
    <strong>Pontos de Força</strong>
    <span class="pf-conta">${tem} / ${limite}</span>
    <span class="pf-dado" title="O dado cresce por faixa de nível">${rotulo}</span>
  </div>
  <div class="pf-trilha" title="A reserva é do nível inteiro: não recarrega por descanso nem por sessão">${pastilhas}</div>
  <div class="pf-acoes">
    <button type="button" data-pf="gastar" ${tem ? "" : "disabled"}
            title="Pergunta em quê, desconta 1 ponto e, se o uso pedir, rola o dado da faixa">gastar</button>
    ${devolver}
    ${recarregar}
    ${papel}
  </div>
</div>`;
}

/**
 * O cartão do gasto: o uso declarado e só a leitura dele. `dado` é o
 * resultado de `rolarPonto`, ou null quando o uso não rola.
 */
async function cartaoDoGasto(ator, uso, dado, extra = {}) {
  const linhaDoDado = dado
    ? `<p class="result">${dado.rotulo}: ` +
      (dado.faces.length > 1
        ? dado.faces.map((f) => (f === dado.valor ? `<strong>${f}</strong>` : `${f}`)).join(" · ")
        : `${dado.valor}`) +
      ` → <strong>${dado.valor}</strong></p>`
    : "";
  return ChatMessage.create({
    content:
      `<div class="sw-cartao"><div class="title">Ponto de Força · ${uso.rotulo}</div>` +
      linhaDoDado +
      `<p class="result">${textoDoUso(uso.chave, dado?.valor ?? 0, extra)}</p>` +
      (extra.nota ? `<p><em>${extra.nota}</em></p>` : "") +
      `<p class="nota-casa"><em>Ação livre, uma por rodada. O dado vale por uma rolagem só.</em></p>` +
      `</div>`,
    speaker: ChatMessage.getSpeaker({ actor: ator }),
    ...(dado ? { rolls: [dado.roll], sound: CONFIG.sounds.dice } : {}),
  });
}

/** A pergunta "em quê?", antes de qualquer dado. Devolve o uso ou null. */
async function escolherUso(ator) {
  const V2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!V2) return null;
  const opcoes = usosDe(ator)
    .map((u, i) => `<option value="${u.chave}" ${i ? "" : "selected"}>${u.rotulo}</option>`).join("");
  const r = await V2.wait({
    window: { title: "Gastar Ponto de Força" },
    content:
      `<div class="form-group"><label>Em quê?</label><select name="uso">${opcoes}</select></div>` +
      `<p class="hint">Em talento de d%, a escolha entre Empurrar e Insistir vem antes do dado.</p>`,
    buttons: [
      { action: "ok", label: "Gastar", default: true, callback: (_e, b) => b.form.elements.uso.value },
      { action: "cancelar", label: "Cancelar" },
    ],
    rejectClose: false,
  });
  return USO[r] ?? null;
}

/** O gasto inteiro: confere, pergunta, desconta, rola e aplica. */
async function gastarPonto(ator) {
  if (pontosAtuais(ator) <= 0) return;
  if (jaGastouNaRodada(ator)) {
    ui.notifications?.warn("Já foi gasto um Ponto de Força nesta rodada. É no máximo um por rodada em combate.");
    return;
  }
  const uso = await escolherUso(ator);
  if (!uso) return;

  // Recuperar Alcance com o Alcance cheio queimaria o ponto à toa.
  const gastoDoAlcance = Number(ator.getFlag?.(ID_SD, FLAG_ALCANCE_GASTO) ?? 0) || 0;
  if (uso.chave === "alcance" && gastoDoAlcance <= 0) {
    ui.notifications?.warn("O Alcance da Força está cheio: não há o que recuperar.");
    return;
  }

  // O ponto e a rodada numa gravação só, para o segundo clique já encontrar
  // a rodada marcada.
  const agora = rodadaAtual(ator);
  await ator.update({
    [`flags.${ID}.${FLAG}`]: registroDaReserva(ator, pontosAtuais(ator) - 1),
    ...(agora ? { [`flags.${ID}.${FLAG_RODADA}`]: agora } : {}),
  });

  const dado = uso.rola ? await rolarPonto(Math.max(1, nivelDe(ator))) : null;
  const extra = {};

  if (uso.chave === "alcance") {
    extra.recuperado = Math.min(dado.valor, gastoDoAlcance);
    await ator.setFlag(ID_SD, FLAG_ALCANCE_GASTO, gastoDoAlcance - extra.recuperado);
  }
  if (uso.chave === "morte") {
    // A regra só compra o limiar mortal: com PV negativo, a ficha já fica em 0.
    // Com PV ainda positivo, o Mestre aplica o golpe e deixa em 0.
    const pv = Number(ator.system?.hp?.value);
    if (Number.isFinite(pv) && pv < 0) {
      await ator.update({ "system.hp.value": 0 });
      extra.nota = "A ficha foi para 0 PV.";
    } else {
      extra.nota = "Ao aplicar o golpe, deixe a ficha em 0 PV.";
    }
  }

  await cartaoDoGasto(ator, uso, dado, extra);
}

export function ligarPontosDeForca() {
  const injeta = (app, elemento) => {
    try {
      const html = elemento instanceof HTMLElement ? elemento : elemento?.[0];
      const ator = app?.actor ?? app?.document;
      if (!html || !TIPOS_COM_PAINEL.includes(ator?.type)) return;

      // ── ONDE O PAINEL ENTRA ──────────────────────────────────────────
      //
      // Na BARRA LATERAL, abaixo das Jogadas de Proteção. Até a 1.16.1 ele
      // ficava dentro da aba de poderes, e o efeito era que só aparecia para
      // quem abrisse aquela aba — numa ficha cuja aba inicial é Ataques, o
      // painel simplesmente não existia para o jogador.
      //
      // A lateral é o lugar certo por conteúdo, e não só por espaço: ela já
      // reúne os atributos e as três JP, que são os recursos permanentes do
      // personagem, e Pontos de Força é um deles. Fica visível em qualquer
      // aba, que é o que o uso em mesa pede — gasta-se um ponto no meio de um
      // teste, não ao consultar a lista de poderes.
      //
      // A cadeia desce do mais específico ao mais genérico e termina no
      // próprio `html`: assim uma mudança de layout do sistema degrada o
      // lugar do painel, mas nunca o faz sumir.
      //
      // Na ficha de ameaça (PNJ), o lugar é o bloco de estatísticas, onde o
      // Space Dragon também põe o painel dele.
      const lateral = html.querySelector(".sheet-container .sidebar")
        ?? html.querySelector(".sidebar")
        ?? (ator.type === "monster" ? html.querySelector(".stats") : null);
      const abaPoderes = [...html.querySelectorAll("[data-tab='spells']")]
        .find((n) => !n.closest("nav"));
      const painel = lateral
        ?? html.querySelector(".sheet-container .body .main")
        ?? abaPoderes
        ?? html.querySelector(".sheet-body")
        ?? html;

      // tira a cópia anterior de QUALQUER lugar da ficha: numa re-renderização
      // o painel pode ter sido desenhado noutro ponto pela versão antiga
      html.querySelectorAll(`.${MARCA}`).forEach((n) => n.remove());
      const marcacao = montaPainel(ator);
      if (!marcacao) return;
      // na lateral vai no FIM, embaixo das JP; nos outros lugares, no começo
      painel.insertAdjacentHTML(lateral ? "beforeend" : "afterbegin", marcacao);

      painel.querySelector(`.${MARCA}`)?.addEventListener("click", async (ev) => {
        const acao = ev.target?.closest?.("[data-pf]")?.dataset?.pf;
        if (!acao) return;
        ev.preventDefault();
        const nivel = Math.max(1, nivelDe(ator));
        if (acao === "papel") {
          if (!game.user?.isGM) return;
          // Grava o flag explícito, e a reserva já no limite do papel novo: quem
          // vira protagonista ganha a reserva cheia, quem vira PNJ fica com 1.
          const virar = !ehProtagonista(ator);
          await ator.setFlag(ID, "heroico", virar);
          await gravarPontos(ator, virar ? reservaDoNivel(nivel) : 1);
          return;
        }
        if (acao === "recarregar") {
          if (!game.user?.isGM) return;
          const cheia = reservaDoAtor(ator);
          if (pontosAtuais(ator) >= cheia) return;
          await gravarPontos(ator, cheia);
          // O cartão é público: a mesa precisa saber que a reserva voltou, senão
          // o jogador segue contando os pontos que tinha antes.
          await ChatMessage.create({
            content:
              `<div class="sw-cartao"><div class="title">Pontos de Força</div>` +
              `<p class="result">Reserva cheia: <strong>${cheia}</strong> ` +
              `(${dadoDaFaixa(nivel).rotulo})</p>` +
              `<p><em>A reserva é do nível inteiro — ela volta ao subir de nível, ` +
              `não por descanso nem por sessão.</em></p>` +
              `</div>`,
            speaker: ChatMessage.getSpeaker({ actor: ator }),
          });
          return;
        }
        if (acao === "devolver") {
          if (!game.user?.isGM) return;
          // Desfazer o gasto desfaz também a marca da rodada: o ponto volta a
          // poder ser gasto nesta rodada.
          await ator.update({
            [`flags.${ID}.${FLAG}`]: registroDaReserva(ator, pontosAtuais(ator) + 1),
            [`flags.${ID}.-=${FLAG_RODADA}`]: null,
          });
          return;
        }
        await gastarPonto(ator);
      });
    } catch (e) {
      // Nunca quebrar a ficha do sistema por causa de um painel do módulo.
      console.warn(`${ID} | painel de Pontos de Força não pôde ser desenhado`, e);
    }
  };

  Hooks.on("renderOD2CharacterSheet", injeta);
  Hooks.on("renderActorSheet", (app, el) => {
    if (app?.constructor?.name !== "OD2CharacterSheet") injeta(app, el);
  });
}
