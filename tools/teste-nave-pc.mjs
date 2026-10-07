// Teste da Ficha de Nave feita sobre a ficha de personagem, sem Foundry.
//
// ── O QUE DÁ PARA TESTAR DAQUI, E O QUE NÃO ─────────────────────────────────
//
// Não dá para instanciar a ficha: ela herda uma classe do sistema, que só existe
// com o Foundry rodando. O que dá — e é onde os erros moram — é a parte que não
// depende dele: o mapa de rótulos, a troca no DOM e o que o CSS esconde.
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// Que os rótulos sejam trocados no DOM, e NÃO no `lang`. O idioma é global: um
// "Raça" renomeado para "Tipo" no lang faria o personagem comum da mesma mesa
// mostrar "Tipo" na ficha dele. É o tipo de erro que só aparece quando alguém
// abre a ficha errada, três sessões depois.
//
// Uso: node tools/teste-nave-pc.mjs

import { naveVazia } from "../starwars-sd-module/module/nave-pc-dados.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ROTULOS, MARCA_NAVE_PC, renomearAbas,
  CAMPOS_NAO_USADOS, CLASSE_OCULTO, alvoDoCampo, ocultarOQueNaveNaoUsa,
  AINDA_A_ESCONDER, guiaDeMontagem, painelDaTripulacao, painelDeVoo,
} from "../starwars-sd-module/module/nave-pc-ficha.js";

const RAIZ = path.resolve(fileURLToPath(import.meta.url), "../..");
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── O MAPA DE RÓTULOS ────────────────────────────────────────────────────── */
//
// As abas da ficha de personagem do sistema, medidas na ficha real:
// attacks, race, class, spells, equipment, details — e attributes, que a nave
// não usa.

const ABAS_DO_SISTEMA = ["attacks", "race", "class", "spells", "equipment", "details"];
for (const aba of ABAS_DO_SISTEMA) {
  confere(ROTULOS[aba], `a aba ${aba} não tem rótulo de nave`);
}
confere(!ROTULOS.attributes,
  "a aba de atributos NÃO deve ter rótulo: ela some, porque nave não tem Força nem Intelecto");

// Os rótulos que o autor decidiu, um a um. Se mudarem, que seja de propósito.
confere(ROTULOS.race === "Tipo", `a aba Raça devia virar "Tipo", veio "${ROTULOS.race}"`);
confere(ROTULOS.class === "Câmaras", `a aba Classe devia virar "Câmaras", veio "${ROTULOS.class}"`);
confere(ROTULOS.spells === "Tripulação", `a aba Poderes devia virar "Tripulação", veio "${ROTULOS.spells}"`);

/* ── A TROCA ACONTECE NO DOM, NÃO NO LANG ─────────────────────────────────── */
{
  const lang = fs.readFileSync(path.join(RAIZ, "starwars-sd-module", "lang", "pt-BR.json"), "utf8");
  // O lang do sistema é quem nomeia as abas. Se este módulo passar a traduzir
  // "Raça" para "Tipo", quebra a ficha do personagem comum da mesma mesa.
  for (const [chave, rotulo] of Object.entries(ROTULOS)) {
    const suspeito = new RegExp(`"[^"]*(tabs?|abas?)[^"]*"\\s*:\\s*"${rotulo}"`, "i");
    confere(!suspeito.test(lang),
      `o lang parece renomear a aba ${chave} para "${rotulo}" — o idioma é GLOBAL, ` +
      `e isso mudaria a ficha de todo personagem da mesa`);
  }
}

/* ── A TROCA NO DOM ───────────────────────────────────────────────────────── */
//
// DOM de mentira com o mínimo: a nav, os itens e os nós de texto.

function abaFalsa(chave, texto) {
  const filho = { nodeType: 3, textContent: texto };
  return {
    dataset: { tab: chave },
    childNodes: [filho],
    get textContent() { return this.childNodes.map((n) => n.textContent).join(""); },
    set textContent(v) { this.childNodes = [{ nodeType: 3, textContent: v }]; },
  };
}

{
  const abas = [abaFalsa("race", "Raça"), abaFalsa("class", "Classe"),
                abaFalsa("spells", "Poderes"), abaFalsa("attacks", "Ataques")];
  const raiz = { querySelectorAll: () => abas };

  const trocados = renomearAbas(raiz);
  confere(trocados >= 4, `esperava ao menos 4 rótulos trocados, veio ${trocados}`);
  confere(abas[0].textContent.includes("Tipo"), `a aba Raça virou "${abas[0].textContent}"`);
  confere(abas[1].textContent.includes("Câmaras"), `a aba Classe virou "${abas[1].textContent}"`);
  confere(abas[2].textContent.includes("Tripulação"), `a aba Poderes virou "${abas[2].textContent}"`);

  // Roda de novo sem estragar: o sistema redesenha a ficha a cada alteração, e
  // renomearAbas roda em todo render. Um rótulo que acumulasse viraria
  // "TipoTipo" no segundo salvamento.
  renomearAbas(raiz);
  confere(abas[0].textContent.trim() === "Tipo",
    `rodar duas vezes acumulou o rótulo: "${abas[0].textContent}"`);
}
{
  // Aba que o mapa não conhece fica como está — a ficha do sistema pode ganhar
  // abas novas, e renomear o que não se conhece seria pior que não renomear.
  const outra = abaFalsa("favorites", "Favoritos");
  renomearAbas({ querySelectorAll: () => [outra] });
  confere(outra.textContent === "Favoritos", `aba desconhecida foi renomeada para "${outra.textContent}"`);
}
confere(renomearAbas(null) === 0, "raiz ausente não quebra");

/* ── O QUE O CSS ESCONDE ──────────────────────────────────────────────────── */
{
  const css = fs
    .readFileSync(path.join(RAIZ, "starwars-sd-module", "styles", "starwars-sd.css"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  confere(css.includes(`.${MARCA_NAVE_PC}`),
    `o CSS não tem regra para .${MARCA_NAVE_PC} — a ficha não esconderia nada`);

  // A aba de atributos tem de sumir: é o único bloco da ficha de personagem que
  // não tem NENHUM equivalente numa nave.
  const i = css.indexOf(`.${MARCA_NAVE_PC}`);
  const trecho = css.slice(i, i + 600);
  confere(/attributes/.test(trecho), "a aba de atributos não é escondida");
  confere(/display:\s*none/.test(trecho), "o CSS não esconde nada");

  // Esconder, e não remover: o sistema redesenha a ficha a cada alteração, e o
  // que se remove no JS volta no próximo render.
  const js = fs.readFileSync(
    path.join(RAIZ, "starwars-sd-module", "module", "nave-pc-ficha.js"), "utf8");
  // Remover o PRÓPRIO botão antes de redesenhar é obrigatório: a ficha redesenha
  // a cada alteração, e sem isso o seletor se duplicaria a cada render. O que a
  // regra proíbe é remover conteúdo DO SISTEMA — esse volta no próximo render, e
  // o efeito dura até ele.
  // sem comentários: um comentário que MENCIONA .remove() não é uma remoção, e
  // já deu falso positivo aqui — a nota que explicava a regra foi acusada por ela
  const jsVivo = js.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "");
  for (const m of jsVivo.matchAll(/(.{0,80})\.remove\(\)/g)) {
    const trecho = m[1];
    const ehNosso = /CLASSE_SELETOR|MARCA|sw-|starwars-sd/.test(trecho);
    confere(ehNosso,
      `a ficha remove algo que não é nosso ("…${trecho.slice(-50)}.remove()") — ` +
      `o sistema traz de volta no próximo render; esconda por CSS`);
  }
}

/* ── O QUE A NAVE NÃO USA ─────────────────────────────────────────────────── */
//
// ── A ASSERÇÃO QUE MAIS IMPORTA AQUI ────────────────────────────────────────
//
// O FREIO DE SUBIDA. Esconder um campo significa esconder o bloquinho que o
// embrulha, para o rótulo não ficar órfão — e subir no DOM atrás desse
// bloquinho é como se apaga a ficha inteira por acidente. Já quebramos a
// interface uma vez por mirar largo. Então: no máximo dois níveis, nunca a
// casca da ficha, e para assim que o contêiner guardar outro campo.

/** DOM de mentira com o que `alvoDoCampo` precisa: pai, tag, classes e busca. */
function no(tag, name, filhos = []) {
  const n = {
    tagName: tag.toUpperCase(),
    parentElement: null,
    filhos,
    name,
    classes: new Set(),
  };
  n.classList = { add: (c) => n.classes.add(c), contains: (c) => n.classes.has(c) };
  n.querySelectorAll = (sel) => {
    const alvo = /\[name="([^"]+)"\]/.exec(sel)?.[1] ?? null;
    const fora = [];
    const desce = (x) => {
      for (const f of x.filhos ?? []) {
        if (f.name != null && (alvo === null || f.name === alvo)) fora.push(f);
        desce(f);
      }
    };
    desce(n);
    return fora;
  };
  n.querySelector = (sel) => n.querySelectorAll(sel)[0] ?? null;
  for (const f of filhos) f.parentElement = n;
  return n;
}

{
  // um campo sozinho no bloquinho: sobe, e o rótulo vai com ele
  const campo = no("input", "system.current_xp");
  const grupo = no("div", undefined, [no("label"), campo]);
  no("form", undefined, [grupo]);
  confere(alvoDoCampo(campo) === grupo,
    "um campo sozinho no bloquinho devia esconder o bloquinho, senão o rótulo fica órfão");

  // o bloquinho guarda OUTRO campo: não sobe, ou levaria o vizinho junto
  const c2 = no("input", "system.current_xp");
  const vizinho = no("input", "system.hp.value");
  const juntos = no("div", undefined, [c2, vizinho]);
  no("form", undefined, [juntos]);
  confere(alvoDoCampo(c2) === c2,
    "o bloquinho tinha outro campo (os PV!) e foi escolhido mesmo assim — " +
    "esconder levaria o vizinho junto");

  // filho direto da casca: nunca sobe
  for (const casca of ["form", "section", "main", "aside", "body"]) {
    const c = no("input", "system.details.alignment");
    no(casca, undefined, [c]);
    confere(alvoDoCampo(c) === c,
      `o alvo subiu até o <${casca}> — a ficha abriria EM BRANCO`);
  }

  // dois níveis, e para
  const c3 = no("input", "system.details.languages");
  const n1 = no("div", undefined, [c3]);
  const n2 = no("div", undefined, [n1]);
  const n3 = no("div", undefined, [n2]);
  no("form", undefined, [n3]);
  confere(alvoDoCampo(c3) === n2, "a subida devia parar no segundo nível");
  confere(alvoDoCampo(c3) !== n3, "subiu três níveis — o limite é dois, e por bom motivo");

  // sem pai nenhum não quebra
  confere(alvoDoCampo(no("input", "x")).tagName === "INPUT", "campo sem pai devia devolver ele mesmo");
}

{
  // A ficha de verdade, em miniatura: os três campos que a nave não usa, e
  // quatro que ela USA. Marcar um dos quatro é o erro que esta asserção pega.
  const usados = ["system.hp.value", "system.level", "system.jpd.class", "system.economy.gp"];
  const alvos = CAMPOS_NAO_USADOS.map((c) => no("div", undefined, [no("label"), no("input", c)]));
  const outros = usados.map((c) => no("div", undefined, [no("label"), no("input", c)]));
  const raiz = no("form", undefined, [...alvos, ...outros]);

  const marcados = ocultarOQueNaveNaoUsa(raiz);
  confere(marcados === CAMPOS_NAO_USADOS.length,
    `marcou ${marcados} de ${CAMPOS_NAO_USADOS.length} campos`);
  for (const g of alvos) {
    confere(g.classes.has(CLASSE_OCULTO), "um campo que a nave não usa ficou à vista");
  }
  for (const g of outros) {
    confere(!g.classes.has(CLASSE_OCULTO),
      "um campo que a nave USA foi escondido — PV, nível, JP e créditos são dela");
  }

  // roda em todo render: não pode remarcar nem acumular
  confere(ocultarOQueNaveNaoUsa(raiz) === 0,
    "a segunda passada remarcou o que já estava marcado");

  confere(ocultarOQueNaveNaoUsa(null) === 0, "raiz ausente não quebra");
}

{
  // Os caminhos são do SCHEMA, medidos no ator exportado da mesa. Rótulo
  // traduzido mudaria de idioma para idioma; posição mudaria de versão para
  // versão. O `name` não muda.
  for (const c of CAMPOS_NAO_USADOS) {
    confere(c.startsWith("system."),
      `"${c}" não parece um caminho de schema — casar por rótulo quebra ao trocar o idioma`);
  }
  confere(CAMPOS_NAO_USADOS.includes("system.current_xp"), "a nave não ganha XP");
  confere(!CAMPOS_NAO_USADOS.some((c) => /hp|level|jp[dcs]|economy/.test(c)),
    "um campo que a nave usa entrou na lista de esconder");
}

{
  const css = fs
    .readFileSync(path.join(RAIZ, "starwars-sd-module", "styles", "starwars-sd.css"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  // A regra esconde o que a FICHA marcou, e nunca um seletor do sistema: é o
  // que garante que um erro de mira não pode apagar a ficha inteira.
  const regras = css.split("}").filter((r) => r.includes(`.${CLASSE_OCULTO}`));
  confere(regras.length > 0, `o CSS não esconde .${CLASSE_OCULTO}`);
  for (const r of regras) {
    confere(r.includes(MARCA_NAVE_PC),
      `a regra de .${CLASSE_OCULTO} não está presa a .${MARCA_NAVE_PC} — ` +
      `pegaria fichas que não são naves`);
  }
}

/* ── O CAMINHO QUE REALMENTE RODA ─────────────────────────────────────────── */
//
// ── A ASSERÇÃO QUE ESTE ARQUIVO NÃO TINHA, E DEVIA ──────────────────────────
//
// A cadeia da ficha, medida no console da mesa, é:
//   ActorSheet → OD2CharacterSheet → SDCharacterSheet
// e o Foundry avisa: "The V1 Application framework is deprecated".
//
// Numa ficha V1 o Foundry NÃO chama `_onRender`. Chama `activateListeners`. Eu
// tinha posto tudo no `_onRender` e só o renomear das abas no
// `activateListeners` — então o seletor de cômodos e a ocultação dos campos
// nunca apareceriam na mesa, com a suíte toda verde. Esta asserção é a que
// pega isso.

{
  const js = fs.readFileSync(
    path.join(RAIZ, "starwars-sd-module", "module", "nave-pc-ficha.js"), "utf8");

  const corpoDe = (nome) => {
    const i = js.indexOf(nome);
    if (i < 0) return "";
    // do nome até o fecho do bloco, contando chaves
    let j = js.indexOf("{", i), nivel = 0, k = j;
    for (; k < js.length; k += 1) {
      if (js[k] === "{") nivel += 1;
      else if (js[k] === "}") { nivel -= 1; if (nivel === 0) break; }
    }
    return js.slice(j, k + 1);
  };

  const DEVERES = ["renomearAbas", "marcarComodos", "ocultarOQueNaveNaoUsa", "ligarComodos"];

  const v1 = corpoDe("activateListeners(html)");
  confere(v1.length > 0, "a ficha não tem activateListeners — e é o único caminho que roda na V1");

  // ele pode fazer o trabalho direto ou delegar; o que não pode é fazer MENOS
  const delegado = /#prepararFicha|prepararFicha/.test(v1);
  const preparador = delegado ? corpoDe("#prepararFicha(raiz)") : v1;
  confere(preparador.length > 0, "activateListeners delega para um preparador que não existe");

  for (const dever of DEVERES) {
    confere(preparador.includes(dever),
      `o caminho da V1 (activateListeners) não chama ${dever}() — a base É V1, ` +
      `então isso simplesmente não aconteceria na mesa, com a suíte verde`);
  }

  // e o caminho da V2 faz o mesmo, para o dia em que o sistema migrar
  const v2 = corpoDe("_onRender(contexto, opcoes)");
  if (v2) {
    const preparadorV2 = /#prepararFicha|prepararFicha/.test(v2) ? preparador : v2;
    for (const dever of DEVERES) {
      confere(preparadorV2.includes(dever),
        `o caminho da V2 (_onRender) não chama ${dever}() — os dois têm de fazer o mesmo`);
    }
  }
}

{
  // A lista do que sobra tem de nascer de medição. Varri a ficha aberta: existe
  // UM bloco `.mv` com `system.current_movement` derivado, e não há escalada,
  // voo nem natação. Movimento a nave TEM, vindo do tipo pela raça.
  confere(AINDA_A_ESCONDER.length === 0,
    `AINDA_A_ESCONDER tem ${AINDA_A_ESCONDER.length} item(ns): ` +
    `${AINDA_A_ESCONDER.join(", ")}. Se é para esconder de verdade, mede e esconde; ` +
    `se não existe na ficha, sai da lista`);
  confere(!CAMPOS_NAO_USADOS.some((c) => /movement|movimento/i.test(c)),
    "o movimento entrou na lista de esconder — a nave TEM movimento, vem do tipo");
}

/* ── O GUIA DE MONTAGEM ───────────────────────────────────────────────────── */
//
// ── POR QUE ISTO EXISTE ─────────────────────────────────────────────────────
//
// Porque o sistema recusa em silêncio. Arrastar a classe antes da raça dá uma
// notificação vermelha que some em segundos e nada muda na ficha; arrastar um
// cômodo solto, idem. Quem não viu a notificação conclui que o item está
// quebrado — aconteceu na mesa duas vezes, com o aviso já escrito na descrição
// da classe. Ninguém leu, porque para ler a descrição é preciso ABRIR o item, e
// quem está arrastando não abriu.
//
// A ASSERÇÃO QUE MAIS IMPORTA: o guia SOME quando a nave fica pronta. Um aviso
// permanente vira decoração, e aí deixa de ser lido justamente quando importa.
{
  const comItens = (...tipos) => ({ items: tipos.map((type) => ({ type })) });

  confere(guiaDeMontagem(comItens()) !== "", "nave sem nada devia mostrar o guia");
  confere(guiaDeMontagem(comItens("race")) !== "", "nave só com o tipo ainda precisa da classe");
  confere(guiaDeMontagem(comItens("race", "class")) === "",
    "a nave montada ainda mostra o guia — um aviso permanente vira decoração");

  // a recusa do sistema é citada ENQUANTO ela pode acontecer, e some depois
  confere(/recusa a classe/.test(guiaDeMontagem(comItens())),
    "o guia não avisa que o sistema recusa a classe sem raça — é a recusa silenciosa " +
    "que fez a mesa achar que o item estava quebrado");
  confere(!/recusa a classe/.test(guiaDeMontagem(comItens("race"))),
    "com a raça posta, o aviso da recusa não faz mais sentido e devia sumir");

  // e o guia diz o que NÃO se arrasta: o cômodo solto é a segunda recusa
  confere(/não se arrastam soltas/.test(guiaDeMontagem(comItens())),
    "o guia precisa dizer que as câmaras não se arrastam — é a segunda recusa silenciosa");

  confere(guiaDeMontagem(null) === "" || typeof guiaDeMontagem(null) === "string",
    "ator ausente não pode quebrar a ficha");
}

/* ── OS POSTOS SE EDITAM NA FICHA ─────────────────────────────────────────── */
//
// ── POR QUE ISTO É REQUISITO, E NÃO CONFORTO ────────────────────────────────
//
// A tripulação troca de vaga no meio do combate: o piloto assume a artilharia
// quando o artilheiro cai, alguém corre para a Engenharia quando a Sala de
// Máquinas pega fogo. Um painel que só mostra quem está onde obriga a mesa a
// anotar isso fora da ficha — e aí a ficha passa a mentir na rodada seguinte,
// que é pior do que não mostrar nada.
{
  const html = painelDaTripulacao({}, { postos: { leme: "Han" } });

  const campos = [...html.matchAll(/data-posto="(\w+)"/g)].map((m) => m[1]);
  confere(campos.length === 5,
    `${campos.length} campos editáveis, deviam ser 5 — um por posto`);
  for (const p of ["leme", "artilharia", "engenharia", "sensores", "comando"]) {
    confere(campos.includes(p), `o posto ${p} não tem campo para trocar quem está nele`);
  }

  confere(/<input[^>]*class="sw-posto-nome"/.test(html),
    "os postos não viraram campo de texto — continuam só exibindo");
  confere(/value="Han"/.test(html), "quem já estava no posto não aparece no campo");

  // o placeholder leva QUEM PODE ocupar: é a informação útil com a vaga vazia,
  // e some sozinho quando alguém senta
  confere(/placeholder="Veterano \/ Contrabandista"/.test(html),
    "o campo vazio não diz quem pode ocupar o posto");

  // aspas no nome não podem quebrar o HTML do campo
  const comAspas = painelDaTripulacao({}, { postos: { leme: 'O "Rato"' } });
  confere(/value="O &quot;Rato&quot;"/.test(comAspas),
    'um nome com aspas quebra o atributo value e come o resto do painel');

  // a lista de sugestões existe e está amarrada aos campos
  confere(/<datalist id="sw-tripulacao-sugestoes">/.test(html), "falta a lista de sugestões");
  confere(/list="sw-tripulacao-sugestoes"/.test(html),
    "os campos não apontam para a lista — a sugestão não apareceria");
}

{
  // ── O VAZIO APAGA, E NÃO GRAVA "" ──────────────────────────────────────
  //
  // `postosOcupados` conta o que está preenchido. Gravar string vazia deixaria
  // a chave lá, e um posto vago passaria a contar como ocupado em qualquer
  // contagem que olhe as chaves em vez dos valores.
  const js = fs.readFileSync(
    path.join(RAIZ, "starwars-sd-module", "module", "nave-pc-ficha.js"), "utf8");
  // ── A JANELA TEM DE SER O MÉTODO, E NÃO UM PEDAÇO FIXO ──
  //
  // A primeira versão disto lia 1400 caracteres a partir do nome do método. A
  // janela passava do fim dele e alcançava o listener vizinho, que também
  // checa `isEditable` — e a asserção dessa checagem passava verde mesmo com a
  // linha REMOVIDA do método certo. Pegar o corpo pelo balanço de chaves lê o
  // método, e só ele.
  const i = js.indexOf("#ligarPostos(raiz) {");
  confere(i > 0, "a ficha não tem o listener que grava os postos");
  const corpo = (() => {
    let nivel = 0, j = js.indexOf("{", i);
    for (let k = j; k < js.length; k += 1) {
      if (js[k] === "{") nivel += 1;
      else if (js[k] === "}") { nivel -= 1; if (nivel === 0) return js.slice(i, k + 1); }
    }
    return "";
  })();
  confere(/delete postos\[/.test(corpo),
    "o campo vazio não APAGA o posto — gravaria \"\" e a vaga contaria como ocupada");
  confere(/isEditable/.test(corpo),
    "o campo grava mesmo com a ficha travada — um jogador sem permissão mudaria a tripulação");
  confere(/"change"/.test(corpo),
    "grava a cada tecla: a ficha redesenharia no meio da palavra e o campo perderia o foco");
}

/* ── O PAINEL LÊ A NAVE DE VERDADE ────────────────────────────────────────── */
//
// ── O BUG QUE ESTA ASSERÇÃO EXISTE PARA NÃO DEIXAR VOLTAR ───────────────────
//
// O painel de voo lia `nave.combustivel` como número e `nave.fonte` no topo. A
// flag guarda `combustivel: {atual, maximo, fonte}`. `Number({...})` é NaN,
// virava 0, e o bloco do tanque NUNCA APARECIA — em nenhuma nave, desde que o
// painel existe.
//
// Nenhum teste pegou porque todos passavam valores soltos, montados à mão para
// o teste. Eles provavam que a função sabia formatar um número; não provavam
// que ela sabia ler uma nave. Por isso esta asserção usa `naveVazia()`, que é
// a mesma estrutura que a ficha recebe.
{
  const nave = { ...naveVazia(), tipo: "caca" };
  nave.combustivel = { atual: 60, maximo: 100, fonte: "liquido" };
  const html = painelDeVoo({ system: { hp: { value: 10, max: 20 } } }, nave);

  confere(/Combustível 60%/.test(html),
    "o painel não mostra o tanque da nave de verdade — ele lê a estrutura da flag, " +
    "e não um número solto");
  confere(/1d4\/dia/.test(html),
    "o gasto diário não saiu: a fonte também mora dentro de `combustivel`");

  // sem fonte escolhida o bloco não aparece, e isso é certo: não há dado a mostrar
  const semFonte = { ...naveVazia(), tipo: "caca" };
  confere(!/Combustível/.test(painelDeVoo({ system: { hp: {} } }, semFonte)),
    "nave sem fonte de energia não devia mostrar a barra de combustível");
}

/* ── O REGISTRO ───────────────────────────────────────────────────────────── */
{
  const js = fs.readFileSync(
    path.join(RAIZ, "starwars-sd-module", "module", "nave-pc-ficha.js"), "utf8");

  // NUNCA padrão: o mundo é de personagens, e esta ficha é para os atores que
  // são naves. Virar padrão abriria toda ficha de personagem como nave.
  confere(/makeDefault:\s*false/.test(js),
    "a Ficha de Nave não pode ser padrão — abriria todo personagem da mesa como nave");
  confere(/types:\s*\["character"\]/.test(js), "a ficha precisa ser registrada para character");

  // A classe-base vem do REGISTRO do Foundry, com queda para a do sistema: se o
  // módulo vizinho não estiver lá, a ficha ainda entra.
  confere(/SDCharacterSheet/.test(js) && /OD2CharacterSheet/.test(js),
    "a busca da classe-base precisa tentar a do vizinho E a do sistema");

  const entrada = fs.readFileSync(
    path.join(RAIZ, "starwars-sd-module", "module", "starwars-sd.js"), "utf8");
  confere(/registrarFichaDeNavePC\(\)/.test(entrada), "a ficha não é registrada no ponto de entrada");
  // No ready, e não no init: no init o registro de fichas do sistema está vazio.
  const iReady = entrada.indexOf('Hooks.once("ready"');
  confere(iReady > 0 && entrada.indexOf("registrarFichaDeNavePC()") > iReady,
    "o registro tem de ficar no ready — no init a classe-base ainda não existe");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ ficha de nave sobre personagem: o mapa de rótulos do autor, a troca no DOM " +
    "(e não no lang global), sem acumular ao redesenhar, aba desconhecida intacta, " +
    "o caminho da V1 (activateListeners) fazendo TUDO — a base é V1 e o _onRender não " +
    "roda —, os atributos escondidos por CSS, XP/alinhamento/idiomas marcados pelo CAMINHO DO " +
    "SCHEMA com freio de subida (nunca a casca da ficha), e o registro no ready sem virar padrão"
);
