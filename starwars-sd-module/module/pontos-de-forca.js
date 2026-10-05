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
 *     ao subir de nível ela zera e volta como 5 + (nível ÷ 2);
 *   · o dado cresce por faixa: 1d6 até o 7º, o maior de 2d6 até o 14º, o maior
 *     de 3d6 daí em diante;
 *   · em rolagem de d20 "maior é melhor" (ataque, JP) o dado SOMA; em teste de
 *     atributo, que é roll-under, ele SUBTRAI. As duas direções existem no
 *     Space Dragon e é fácil aplicar a errada.
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
const MARCA = "starwars-sd-pf";

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
 * Quem decide é a ficha: personagem do jogador, ou PNJ que o Mestre marcou como
 * protagonista pelo flag `heroico`.
 */
export function reservaDoAtor(ator) {
  const nivel = Number(ator?.system?.level ?? 1);
  const daMesa = ator?.hasPlayerOwner || ator?.getFlag?.(ID, "heroico");
  return daMesa ? reservaDoNivel(nivel) : 1;
}

/** Quantos pontos o personagem ainda tem. */
export function pontosAtuais(ator) {
  const nivel = Number(ator?.system?.level ?? 1);
  const guardado = ator?.getFlag?.(ID, FLAG);
  // sem flag, ou com flag de outro nível, a reserva é a do nível atual: subir
  // de nível zera e reenche, e é isso que o `nivel` guardado detecta
  if (!guardado || guardado.nivel !== nivel) return reservaDoAtor(ator);
  return Math.max(0, Math.min(reservaDoAtor(ator), Number(guardado.valor ?? 0)));
}

/** Grava a reserva, junto do nível em que ela vale. */
export async function gravarPontos(ator, valor) {
  const nivel = Number(ator?.system?.level ?? 1);
  const limite = reservaDoAtor(ator);
  await ator.setFlag(ID, FLAG, { nivel, valor: Math.max(0, Math.min(limite, valor)) });
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
  const nivel = Number(ator.system?.level ?? 0);
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
  const recarregar = doMestre
    ? `<button type="button" data-pf="recarregar" ${tem < limite ? "" : "disabled"}
            title="Devolve a reserva cheia da faixa — ao subir de nível, ou para corrigir a contagem. Só o Mestre vê este botão.">⟳</button>`
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
            title="Rola o dado da faixa e desconta 1 ponto">gastar</button>
    <button type="button" data-pf="devolver" ${tem < limite ? "" : "disabled"}
            title="Devolve 1 ponto — para desfazer um gasto">+1</button>
    ${recarregar}
  </div>
</div>`;
}

/** O cartão do gasto, com as duas direções do sistema lado a lado. */
async function cartaoDoGasto(ator, { roll, valor, faces, rotulo }) {
  const legenda = faces.length > 1
    ? faces.map((f) => (f === valor ? `<strong>${f}</strong>` : `${f}`)).join(" · ")
    : `${valor}`;
  return ChatMessage.create({
    content:
      `<div class="title">Ponto de Força</div>` +
      `<p class="result">${rotulo}: ${legenda} → <strong>${valor}</strong></p>` +
      `<p class="result"><strong>+${valor}</strong> em ataque ou JP · ` +
      `<strong>−${valor}</strong> no d20 de um teste de atributo</p>` +
      `<p><em>Em talento de d%, declare antes de rolar: <strong>+${valor * 10}%</strong> ` +
      `ou uma re-rolagem.</em></p>` +
      `<p class="nota-casa"><em>Ação livre, uma por rodada. O dado vale por uma rolagem só.</em></p>`,
    speaker: ChatMessage.getSpeaker({ actor: ator }),
    rolls: [roll],
    sound: CONFIG.sounds.dice,
  });
}

export function ligarPontosDeForca() {
  const injeta = (app, elemento) => {
    try {
      const html = elemento instanceof HTMLElement ? elemento : elemento?.[0];
      const ator = app?.actor ?? app?.document;
      if (!html || ator?.type !== "character") return;

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
      const lateral = html.querySelector(".sheet-container .sidebar")
        ?? html.querySelector(".sidebar");
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
        const nivel = Number(ator.system?.level ?? 1);
        if (acao === "recarregar") {
          if (!game.user?.isGM) return;
          const cheia = reservaDoAtor(ator);
          if (pontosAtuais(ator) >= cheia) return;
          await gravarPontos(ator, cheia);
          // O cartão é público: a mesa precisa saber que a reserva voltou, senão
          // o jogador segue contando os pontos que tinha antes.
          await ChatMessage.create({
            content:
              `<div class="title">Pontos de Força</div>` +
              `<p class="result">Reserva cheia: <strong>${cheia}</strong> ` +
              `(${dadoDaFaixa(Number(ator.system?.level ?? 1)).rotulo})</p>` +
              `<p><em>A reserva é do nível inteiro — ela volta ao subir de nível, ` +
              `não por descanso nem por sessão.</em></p>`,
            speaker: ChatMessage.getSpeaker({ actor: ator }),
          });
          return;
        }
        if (acao === "devolver") return void await gravarPontos(ator, pontosAtuais(ator) + 1);
        if (pontosAtuais(ator) <= 0) return;
        await gravarPontos(ator, pontosAtuais(ator) - 1);
        await cartaoDoGasto(ator, await rolarPonto(nivel));
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
