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
  naveDe, estadoDoComodo, proximoEstado, comodosInstalados, FLAG, updateDaNave,
  orcamentoDeCamaras, CAMARAS_BASE,
} from "./nave-pc-dados.js";
import { linhasDoVoo, CUSTOS } from "./nave-voo.js";
import {
  avisosDaNave, bonusDeAtaque, equipamentosDoAtor, podeAtacar, operacional,
} from "./nave-sistemas.js";
import { POSTOS, ACOES_DE_POSTO, AUTOMATIZA } from "./tripulacao.js";
import {
  painelDasCamadas, MARCA_CAMADAS, CLASSE_ENERGIA, CLASSE_RELOGIO,
} from "./nave-camadas.js";
import { MARCAS_DO_PERSEGUIDOR } from "./tripulacao.js";
import { ETAPAS } from "./nave-salto.js";
import { aplicarAcao, ehAutomatica, limparFimDaRodada } from "./nave-acoes.js";
import { CAMARAS } from "./camaras.js";

const ID = "starwars-sd";
export const MARCA_NAVE_PC = "starwars-sd-nave-pc";
export const MARCA_VOO = "sw-painel-voo";

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

/* ── O PAINEL DE VOO ──────────────────────────────────────────────────────── */

/**
 * O bloco que a mesa olha a cada rodada: CP, BA, JP, movimento, o tanque, e o
 * que o dano está custando ao piloto.
 *
 * ── DE ONDE VEM CADA NÚMERO ───────────────────────────────────────────────
 *
 * CP, BA e JP são GETTERS do sistema (`ac_total`, `ba`, `jpd_total`), montados a
 * partir da raça e da classe de nave. Eles não existem em `system` e não
 * aparecem num JSON do ator — já perdi dois ciclos de medição concluindo que
 * estavam quebrados quando o errado era onde eu olhava.
 *
 * A penalidade por avaria e o gasto de combustível vêm de nave-voo.js, que tem
 * teste. Aqui só se desenha.
 */
export function painelDeVoo(ator, nave) {
  const s = ator?.system ?? {};
  const l = linhasDoVoo({
    pv: s.hp?.value, pvMax: s.hp?.max,
    // os derivados do sistema, com queda para o que a flag guardou: numa ficha
    // sem raça nem classe de nave ainda se vê alguma coisa
    cp: s.ac_total ?? nave?.cp, ba: s.ba ?? nave?.ba, jp: s.jpd_total ?? nave?.jp,
    movimento: s.current_movement ? `${s.current_movement} m` : null,
    // o combustível é um OBJETO na flag ({atual, maximo, fonte}), e eu o lia
    // como número solto: `Number({...})` dá NaN, virava 0, e o bloco do tanque
    // nunca aparecia. Os testes não pegaram porque passavam valores soltos em
    // vez da nave de verdade — agora um deles usa `naveVazia()`.
    combustivel: nave?.combustivel?.atual, fonte: nave?.combustivel?.fonte,
    pilotagem: nave?.pilotagem,
  });

  const campo = (rotulo, valor, titulo = "") =>
    `<div class="voo-campo"${titulo ? ` title="${titulo}"` : ""}>` +
    `<span class="voo-rotulo">${rotulo}</span>` +
    `<span class="voo-valor">${valor}</span></div>`;

  const avaria = l.penalidade > 0
    ? `<div class="voo-avaria" title="§2: 5% de penalidade a cada 10% dos PV perdidos, até 50%.">` +
      `Avaria: <strong>−${l.penalidade}%</strong> na pilotagem` +
      (l.pilotagem ? ` — ${l.pilotagem.base}% vira <strong>${l.pilotagem.efetiva}%</strong>` : "") +
      `</div>`
    : "";

  const tanque = l.combustivel.fonte
    ? `<div class="voo-tanque" title="${l.combustivel.fonte.rotulo} · autonomia ` +
      `${l.combustivel.fonte.autonomia} · um dia de viagem gasta ${l.combustivel.gastoPorDia}">` +
      `<div class="voo-tanque-barra"><i style="width:${l.combustivel.porcento}%"></i></div>` +
      `<span>Combustível ${l.combustivel.porcento}% · ${l.combustivel.gastoPorDia}/dia</span>` +
      `</div>`
    : "";

  // O +2 do Computador Balístico vem da PONTE, e some com ela. Mostrar o BA já
  // somado evita a conta de cabeça no meio do combate; mostrar as duas parcelas
  // evita a pergunta "de onde saiu esse número".
  // o +2 exige o Computador Balístico instalado E a Ponte operacional: são
  // duas condições, e o equipamento entra como item arrastado do compêndio
  const extra = bonusDeAtaque(nave, equipamentosDoAtor(ator, ID));
  const ba = extra
    ? `+${l.ba + extra} <small>(${l.ba} +${extra} balístico)</small>`
    : `+${l.ba}`;

  const avisos = avisosDaNave(nave)
    .map((a) => `<li class="voo-${a.grau}">${a.texto}</li>`)
    .join("");

  return (
    `<section class="${MARCA_VOO}">` +
    `<div class="voo-linha">` +
      campo("CP", l.cp, "Coeficiente de Proteção — vem do tipo (raça), T10-1") +
      campo("BA", ba, "Bônus de Ataque da nave (classe, T10-1) + o Computador Balístico da Ponte") +
      campo("JP", l.jp, "Número-alvo: menor é melhor. O piloto rola antes e modifica (T10-5)") +
      campo("Mov.", l.movimento) +
    `</div>` +
    avaria + tanque +
    (avisos ? `<ul class="voo-avisos">${avisos}</ul>` : "") +
    `</section>`
  );
}

/**
 * Põe o painel na aba de ataques, sem duplicar.
 *
 * Remove o próprio painel antes de redesenhar: a ficha redesenha a cada
 * alteração do ator, e sem isso teríamos um painel por render.
 */
export function porPainelDeVoo(raiz, ator) {
  if (!raiz?.querySelector || !ator) return false;
  const aba = raiz.querySelector(".character-tab-attacks") ??
              raiz.querySelector('[data-tab="attacks"]:not(nav [data-tab="attacks"])');
  if (!aba) return false;
  // só o NOSSO painel sai, e a marca fica visível na mesma linha: a asserção do
  // teste lê o trecho antes do .remove() para distinguir nó nosso de nó do
  // sistema, e uma variável intermediária escondia isso dela
  aba.querySelector(`.${MARCA_VOO}`)?.remove();
  aba.insertAdjacentHTML("afterbegin", painelDeVoo(ator, naveDe(ator, ID)));
  return true;
}

/* ── O PAINEL DA TRIPULAÇÃO (§7) ──────────────────────────────────────────── */

export const MARCA_TRIPULACAO = "sw-painel-tripulacao";
export const CLASSE_POSTO = "sw-posto-nome";
export const CLASSE_ACAO = "sw-posto-acao";
export const CLASSE_FIM_RODADA = "sw-fim-rodada";
export const LISTA_TRIPULACAO = "sw-tripulacao-sugestoes";

/**
 * Os nomes que o campo de posto sugere: os personagens do mundo que NÃO são
 * naves.
 *
 * Uma nave na tripulação de outra nave não é um erro que valha impedir — o
 * livro tem caça acoplado em nave-mãe —, mas sugerir isso num campo que se
 * preenche depressa seria convidar o engano. A digitação livre continua: o
 * posto aceita «um droide qualquer» e o nome de um NPC que não tem ficha.
 */
export function sugestoesDeTripulacao() {
  const todos = globalThis.game?.actors ?? [];
  const nomes = [];
  for (const a of todos) {
    try {
      if (a?.type !== "character") continue;
      if (a.getFlag?.(ID, FLAG)?.tipo) continue;   // é uma nave
      if (a.name) nomes.push(a.name);
    } catch { /* um ator problemático não derruba a lista */ }
  }
  return [...new Set(nomes)].sort((x, y) => x.localeCompare(y, "pt-BR"));
}

/**
 * Os cinco postos, cada um com quem o ocupa e as opções da rodada.
 *
 * ── POR QUE AS OPÇÕES APARECEM MESMO COM O POSTO VAZIO ────────────────────
 *
 * Porque é lendo o que o posto FAZ que alguém decide ocupá-lo. Esconder as
 * opções até alguém sentar transforma a escolha num chute, e o §7 existe
 * justamente para que cada posto seja uma decisão com consequência.
 *
 * ── O QUE A FICHA APLICA E O QUE ELA SÓ DIZ ───────────────────────────────
 *
 * AUTOMATIZA lista o que vira efeito sozinho. O resto — Ordem, Sangue frio —
 * sai como texto porque depende de alguém escolher QUEM, e um menu de "escolha
 * o aliado" no meio da rodada custa mais tempo do que a mesa ganha. A ficha
 * marca os dois de forma diferente, para ninguém esperar uma automação que não
 * vem.
 */
export function painelDaTripulacao(ator, nave) {
  const ocupantes = nave?.postos ?? {};

  const linhas = POSTOS.map((posto) => {
    const quemEsta = String(ocupantes[posto.chave] ?? "").trim();
    // a Engenharia precisa da Sala de Máquinas: dizer isso ANTES evita a
    // descoberta no meio do combate, de que ninguém pode reparar nada
    const travado = posto.exigeCamara && !operacional(nave, posto.exigeCamara);
    const acoes = (ACOES_DE_POSTO[posto.chave] ?? [])
      .map((a) => {
        const auto = ehAutomatica(a.chave);
        const dica = String(a.nota ?? "").replace(/"/g, "&quot;");
        // a automática é BOTÃO, a de mesa é texto. A diferença tem de estar na
        // forma e não só na cor: um item que parece clicável e não é custa um
        // clique e uma dúvida toda vez.
        return auto
          ? `<li class="posto-acao acao-auto">` +
            `<button type="button" class="${CLASSE_ACAO}" data-posto="${posto.chave}" ` +
            `data-acao="${a.chave}" title="${dica}">${a.rotulo}</button></li>`
          : `<li class="posto-acao acao-texto" title="${dica}">${a.rotulo}</li>`;
      })
      .join("");

    return (
      `<div class="posto${travado ? " posto-travado" : ""}${quemEsta ? " posto-ocupado" : ""}">` +
      `<div class="posto-cabeca">` +
        `<strong>${posto.rotulo}</strong> ` +
        // ── O POSTO SE EDITA NA FICHA ──
        //
        // A tripulação troca de vaga no meio do combate: o piloto assume a
        // artilharia quando o artilheiro cai, alguém corre para a Engenharia
        // quando a Sala de Máquinas pega fogo. Um painel que só MOSTRA quem
        // está onde obriga a mesa a anotar isso fora da ficha, e aí a ficha
        // mente na rodada seguinte.
        //
        // O `placeholder` leva quem PODE ocupar o posto («Veterano /
        // Contrabandista»), que é a informação útil enquanto a vaga está
        // vazia — e some sozinho quando alguém senta.
        `<input type="text" class="${CLASSE_POSTO}" data-posto="${posto.chave}" ` +
        `value="${quemEsta.replace(/"/g, "&quot;")}" placeholder="${posto.quem}" ` +
        `list="${LISTA_TRIPULACAO}" title="Quem está neste posto. Deixe vazio e o posto não age.">` +
      `</div>` +
      `<div class="posto-faz">${posto.oQueFaz}</div>` +
      (travado
        ? `<div class="posto-aviso">Sem a Sala de Máquinas operacional, este posto não age (§7).</div>`
        : "") +
      `<ul class="posto-acoes">${acoes}</ul>` +
      `</div>`
    );
  }).join("");

  return (
    `<section class="${MARCA_TRIPULACAO}">` +
    `<p class="tripulacao-nota">Cada posto é a ação daquele personagem na rodada. ` +
    `Posto vazio não age. <em>Em negrito, o que a ficha aplica sozinha.</em></p>` +
    linhas +
    // ── O FIM DA RODADA ──
    //
    // Firmar, Supressão, Interferência, Aguentem firme e a energia valem «até o
    // fim da rodada». Sem um lugar para dizer que a rodada acabou, eles ficam
    // ligados para sempre — e o sintoma é uma nave que nunca sai do Firmar,
    // três sessões depois, sem ninguém ligar a causa.
    `<button type="button" class="${CLASSE_FIM_RODADA}" ` +
    `title="Apaga o que vale até o fim da rodada: Firmar, Supressão, Interferência, ` +
    `Aguentem firme e a energia do reator. Não mexe nos relógios nem nas câmaras.">` +
    `Fim da rodada</button>` +
    `<datalist id="${LISTA_TRIPULACAO}">` +
    sugestoesDeTripulacao().map((n) => `<option value="${n.replace(/"/g, "&quot;")}">`).join("") +
    `</datalist>` +
    `</section>`
  );
}

/** Põe o painel na aba de Tripulação (a de poderes, renomeada). */
export function porPainelDaTripulacao(raiz, ator) {
  if (!raiz?.querySelector || !ator) return false;
  const aba = raiz.querySelector(".character-tab-spells") ??
              raiz.querySelector('[data-tab="spells"]:not(nav [data-tab="spells"])');
  if (!aba) return false;
  aba.querySelector(`.${MARCA_TRIPULACAO}`)?.remove();
  aba.insertAdjacentHTML("afterbegin", painelDaTripulacao(ator, naveDe(ator, ID)));
  return true;
}

/* ── O GUIA DE MONTAGEM ───────────────────────────────────────────────────── */

export const MARCA_GUIA = "sw-guia-nave";

/**
 * Os passos para montar a nave, mostrados enquanto ela não está montada.
 *
 * ── POR QUE A FICHA PRECISA ENSINAR ───────────────────────────────────────
 *
 * Porque o sistema recusa em silêncio. Arrastar a classe antes da raça produz
 * uma notificação vermelha no canto que some em segundos, e nada muda na ficha;
 * arrastar um cômodo solto, idem. Quem não viu a notificação conclui que o item
 * está quebrado — foi o que aconteceu na mesa, duas vezes, com um aviso já
 * escrito na descrição da classe que ninguém leu, porque para ler a descrição é
 * preciso abrir o item, e quem está arrastando não abriu.
 *
 * O guia some sozinho quando a nave fica pronta: um aviso permanente vira
 * decoração e deixa de ser lido.
 */
export function guiaDeMontagem(ator) {
  const tem = (tipo) => (ator?.items ?? []).some?.((i) => i.type === tipo);
  const temRaca = tem("race");
  const temClasse = tem("class");
  if (temRaca && temClasse) return "";

  const passo = (feito, texto) =>
    `<li class="${feito ? "guia-feito" : "guia-falta"}">${feito ? "✔" : "○"} ${texto}</li>`;

  return (
    `<section class="${MARCA_GUIA}">` +
    `<strong>Montar esta nave</strong>` +
    `<ol>` +
    passo(temRaca,
      "Arraste o <strong>tipo</strong> (Caça, Cargueiro…) do compêndio " +
      "<em>Naves</em>. Ele traz o CP e o movimento.") +
    passo(temClasse,
      "Depois arraste a <strong>classe de mesmo nome</strong> (“Nave — Caça”). " +
      "Ela traz a BA, a JP e as doze câmaras." +
      (temRaca ? "" : " <em>O sistema recusa a classe enquanto não houver raça.</em>")) +
    `</ol>` +
    `<p class="guia-nota">As câmaras não se arrastam soltas: elas vêm com a classe, ` +
    `e você liga ou desliga cada uma na aba <em>Câmaras</em>.</p>` +
    `</section>`
  );
}

/** Põe o guia no alto da aba de ataques, acima do painel de voo. */
export function porGuiaDeMontagem(raiz, ator) {
  if (!raiz?.querySelector || !ator) return false;
  const aba = raiz.querySelector(".character-tab-attacks") ??
              raiz.querySelector('[data-tab="attacks"]:not(nav [data-tab="attacks"])');
  if (!aba) return false;
  aba.querySelector(`.${MARCA_GUIA}`)?.remove();
  const html = guiaDeMontagem(ator);
  if (html) aba.insertAdjacentHTML("afterbegin", html);
  return !!html;
}

/**
 * As camadas opcionais, abaixo dos postos — porque são extensões do §7, e é lá
 * que a mesa já está olhando quando pensa em tripulação.
 */
export function porPainelDasCamadas(raiz, ator) {
  if (!raiz?.querySelector || !ator) return false;
  const aba = raiz.querySelector(".character-tab-spells") ??
              raiz.querySelector('[data-tab="spells"]:not(nav [data-tab="spells"])');
  if (!aba) return false;
  aba.querySelector(`.${MARCA_CAMADAS}`)?.remove();
  const nave = naveDe(ator, ID);
  const html = painelDasCamadas(nave, {
    tamanho: nave?.tamanho,
    rodada: globalThis.game?.combat?.round ?? null,
  });
  if (html) aba.insertAdjacentHTML("beforeend", html);
  return !!html;
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

/**
 * Manda toda Ficha de Nave aberta se redesenhar.
 *
 * Quem troca uma opção de mundo precisa ver o efeito sem fechar a ficha. Isto
 * varre os DOIS registros de janela do Foundry 13: `ui.windows`, onde moram as
 * Applications V1 — e a ficha É V1, porque a classe-base do sistema é —, e
 * `foundry.applications.instances`, para o dia em que o sistema migrar. Varrer
 * só um dos dois faz a opção parecer que não funcionou.
 */
export function redesenharFichasDeNave() {
  const janelas = [
    ...Object.values(globalThis.ui?.windows ?? {}),
    ...(globalThis.foundry?.applications?.instances?.values?.() ?? []),
  ];
  for (const app of janelas) {
    try {
      if (Registrada && app instanceof Registrada) app.render(false);
    } catch { /* uma janela que não gosta de render não derruba as outras */ }
  }
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
    /**
     * Grava quem está em cada posto.
     *
     * No `change`, e não a cada tecla: gravar por tecla faria a ficha
     * redesenhar no meio de uma palavra e tirar o foco do campo. O `change`
     * dispara ao sair do campo ou no Enter, que é quando a pessoa terminou.
     *
     * Delegado e registrado uma vez, como o dos cômodos — a ficha redesenha a
     * cada alteração, e um listener por campo se multiplicaria a cada render.
     */
    /**
     * Os botões das camadas: energia e os dois relógios da fuga.
     *
     * Os limites são aplicados AQUI e não só no desenho. Um botão desabilitado
     * impede o clique, mas um estado gravado fora da faixa — por outra versão,
     * por uma macro, por edição à mão — continuaria fora até alguém notar.
     */
    /**
     * Os botões das ações de posto e o do fim da rodada.
     *
     * O cartão vai para o chat porque a ação é da MESA, e não da ficha: quem
     * firmou precisa que os artilheiros saibam do +2. Um efeito que só aparece
     * na ficha de quem clicou não chega a quem ele beneficia.
     */
    /**
     * Grava só o que mudou.
     *
     * Gravar a flag inteira de uma vez SUBSTITUI o que lá estava, e numa nave
     * operada por cinco pessoas — que é o ponto do §7 — isso atropela: quem
     * gravar depois escreve por cima com a versão que leu antes, e a alteração
     * do outro desaparece sem erro nenhum. O jogador vê o campo voltar ao que
     * era e conclui que a ficha não salvou.
     *
     * Gravando caminho a caminho, o merge é do servidor, e duas escritas em
     * campos diferentes convivem.
     */
    async #gravarNave(antes, depois) {
      const mudancas = updateDaNave(antes, depois, ID);
      if (!mudancas) return;
      await this.actor.update(mudancas);
    }

    #ligarAcoes(raiz) {
      if (!raiz?.dataset || raiz.dataset.swAcoes === "1") return;
      raiz.dataset.swAcoes = "1";
      raiz.addEventListener("click", async (ev) => {
        const fim = ev.target?.closest?.(`.${CLASSE_FIM_RODADA}`);
        const botao = ev.target?.closest?.(`.${CLASSE_ACAO}`);
        if (!fim && !botao) return;
        ev.preventDefault();
        ev.stopPropagation();
        if (!this.isEditable) return;

        const nave = naveDe(this.actor, ID);

        if (fim) {
          await this.#gravarNave(nave, limparFimDaRodada(nave));
          globalThis.ui?.notifications?.info?.("Fim da rodada: os efeitos temporários saíram.");
          return;
        }

        const r = aplicarAcao(nave, botao.dataset.posto, botao.dataset.acao);
        if (r.erro) {
          globalThis.ui?.notifications?.warn?.(r.erro);
          return;
        }
        await this.#gravarNave(nave, r.nave);

        const linhas = r.cartao.linhas.map((l) => `<li>${l.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</li>`).join("");
        await globalThis.ChatMessage?.create?.({
          speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: this.actor }),
          content:
            `<div class="starwars-sd-cartao">` +
            `<h4>${r.cartao.titulo}</h4>` +
            `<ul>${linhas}</ul>` +
            (r.cartao.nota ? `<p class="cartao-nota">${r.cartao.nota}</p>` : "") +
            `</div>`,
        });

        // a rolagem fica com a mesa, mas o dado é rolado aqui para não exigir
        // que alguém digite /r 1d6 no meio da rodada
        for (const rol of r.rolagens) {
          const roll = await new globalThis.Roll(rol.formula).evaluate();
          const caiu = roll.total <= rol.falhaEm;
          await roll.toMessage({
            speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: this.actor }),
            flavor: caiu
              ? `${rol.rotulo}: <strong>avaria</strong> na Sala de Máquinas`
              : `${rol.rotulo}: sem avaria`,
          });
        }
      });
    }

    #ligarCamadas(raiz) {
      if (!raiz?.dataset || raiz.dataset.swCamadas === "1") return;
      raiz.dataset.swCamadas = "1";
      raiz.addEventListener("click", async (ev) => {
        const energia = ev.target?.closest?.(`.${CLASSE_ENERGIA}`);
        const relogio = ev.target?.closest?.(`.${CLASSE_RELOGIO}`);
        if (!energia && !relogio) return;
        ev.preventDefault();
        ev.stopPropagation();
        if (!this.isEditable) return;

        const nave = naveDe(this.actor, ID);
        if (energia) {
          const destino = energia.dataset.destino;
          const passo = Number(energia.dataset.passo) || 0;
          const atual = { ...(nave.energia ?? {}) };
          // nunca negativo: "−1 ponto em escudos" não quer dizer nada
          atual[destino] = Math.max(0, (Number(atual[destino]) || 0) + passo);
          await this.#gravarNave(nave, { ...nave, energia: atual });
          return;
        }

        const lado = relogio.dataset.lado;
        const passo = Number(relogio.dataset.passo) || 0;
        const fuga = { ...(nave.fuga ?? {}) };
        const teto = lado === "salto" ? ETAPAS.length : MARCAS_DO_PERSEGUIDOR;
        const campo = lado === "salto" ? "etapas" : "perseguidor";
        fuga[campo] = Math.max(0, Math.min(teto, (Number(fuga[campo]) || 0) + passo));
        await this.#gravarNave(nave, { ...nave, fuga });
      });
    }

    #ligarPostos(raiz) {
      if (!raiz?.dataset || raiz.dataset.swPostos === "1") return;
      raiz.dataset.swPostos = "1";
      raiz.addEventListener("change", async (ev) => {
        const campo = ev.target?.closest?.(`.${CLASSE_POSTO}`);
        if (!campo?.dataset?.posto) return;
        if (!this.isEditable) return;
        const nave = naveDe(this.actor, ID);
        const quem = String(campo.value ?? "").trim();
        const postos = { ...(nave.postos ?? {}) };
        // vazio APAGA a chave em vez de gravar "": um posto vago é a ausência
        // do registro, e é o que `postosOcupados` conta
        if (quem) postos[campo.dataset.posto] = quem;
        else delete postos[campo.dataset.posto];
        await this.#gravarNave(nave, { ...nave, postos });
      });
    }

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
        await this.#gravarNave(nave, {
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
      // ── O FOCO SOBREVIVE AO REDESENHO ──────────────────────────────────
      //
      // Toda gravação redesenha a ficha em TODOS os clientes que a têm aberta.
      // Numa nave operada por cinco pessoas isso acontece o tempo todo — e
      // quem estivesse digitando o nome de um tripulante via o campo ser
      // recriado e perder o foco no meio da palavra.
      //
      // Guardamos qual campo estava em foco e onde estava o cursor, e
      // devolvemos depois de redesenhar. O jogador continua digitando.
      const antes = this.#guardarFoco(raiz);
      try {
        renomearAbas(raiz);
        marcarComodos(raiz, this.actor);
        ocultarOQueNaveNaoUsa(raiz);
        porPainelDeVoo(raiz, this.actor);
        porPainelDaTripulacao(raiz, this.actor);
        porPainelDasCamadas(raiz, this.actor);
        porGuiaDeMontagem(raiz, this.actor);
        this.#ligarComodos(raiz);
        this.#ligarPostos(raiz);
        this.#ligarCamadas(raiz);
        this.#ligarAcoes(raiz);
      } catch (e) {
        console.warn(`${ID} | não pude preparar a Ficha de Nave`, e);
      }
      this.#devolverFoco(raiz, antes);
    }

    /** Qual campo nosso estava em foco, e onde o cursor estava nele. */
    #guardarFoco(raiz) {
      try {
        const alvo = raiz?.ownerDocument?.activeElement;
        if (!alvo || !raiz.contains?.(alvo)) return null;
        // só os campos QUE NÓS criamos: devolver foco a um campo do sistema
        // seria mexer no que não é nosso, e o sistema tem a própria lógica
        const nosso = alvo.classList?.contains(CLASSE_POSTO);
        if (!nosso) return null;
        return {
          posto: alvo.dataset?.posto,
          inicio: alvo.selectionStart,
          fim: alvo.selectionEnd,
        };
      } catch {
        return null;
      }
    }

    /** Devolve o foco ao campo que o tinha, com o cursor onde estava. */
    #devolverFoco(raiz, antes) {
      if (!antes?.posto) return;
      try {
        const campo = raiz.querySelector(`.${CLASSE_POSTO}[data-posto="${antes.posto}"]`);
        if (!campo) return;
        campo.focus();
        // o cursor volta para onde estava: devolver o foco e jogar o cursor
        // para o fim seria quase tão ruim quanto perder o foco
        if (antes.inicio != null) campo.setSelectionRange?.(antes.inicio, antes.fim);
      } catch { /* um campo que não aceita foco não derruba a ficha */ }
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
