/**
 * Star Wars — Suplemento de Cenário para Space Dragon.
 *
 * ── O QUE ESTE SCRIPT NÃO FAZ ───────────────────────────────────────────────
 *
 * Nada das regras do Space Dragon. A escala de atributos, os testes de
 * porcentagem, os Danos Mortais, o alcance mental e a ficha são do módulo
 * Space Dragon, de que este depende (relationships.requires no module.json).
 * O Suplemento é, de propósito, "o Space Dragon com outro céu": duplicar
 * aquelas regras aqui faria as duas cópias divergirem na primeira correção.
 *
 * Aqui entra só o que é do cenário e que o livro básico não tem — o Caminho,
 * a Corrupção, a Tentação —, exposto em `game.starwarsSD` para as macros do
 * compêndio chamarem. Uma macro arrastada para a barra é uma cópia; chamando
 * o script, atualizar o módulo atualiza a regra.
 *
 * ── POR QUE NENHUM ARQUIVO DE IDIOMA SOBRESCREVE O SISTEMA ─────────────────
 *
 * O Star Dragon troca "Magia" por "Poder da Força" no idioma do sistema, e
 * isso vale para o MUNDO inteiro. O módulo Space Dragon já aprendeu, na 1.5.0,
 * que um rótulo global quebra o vizinho num mundo misto. Os rótulos da ficha
 * são do módulo Space Dragon, e só na ficha dele. Os idiomas deste módulo têm
 * só chaves com o prefixo "starwars-sd.".
 */

import { ligarPontosDeForca } from "./pontos-de-forca.js";

const ID = "starwars-sd";

Hooks.once("init", () => {
  console.log(`${ID} | Star Wars — Suplemento para Space Dragon`);


  // ── A Ordem de Ação do Space Dragon ──
  //
  // Numa iniciativa comum rola-se uma vez e a ordem vale o combate. A Ordem de
  // Ação é outra coisa: o valor vem da AÇÃO escolhida, muda a cada rodada, e o
  // MENOR age primeiro. A sequência do livro (§7.2) é declarar → ordenar →
  // resolver, repetindo toda rodada — é o que a torna cara à mão, e o motivo de
  // este módulo automatizá-la.
  //
  // É opção de MUNDO porque inverte a ordenação do Combat Tracker, e isso vale
  // para todos os combates: num mundo com Ekhoria e Star Wars juntos, a troca
  // tem de ser escolha consciente. Desligada, o módulo não registra classe de
  // Combat nenhuma e o Foundry segue o padrão.
  game.settings.register(ID, "ordemDeAcao", {
    name: "starwars-sd.settings.ordemDeAcao.nome",
    hint: "starwars-sd.settings.ordemDeAcao.dica",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true,
  });

  // A subclasse de Combat entra sempre; quem decide inverter é a opção, lida a
  // cada ordenação. Registrar condicionalmente exigiria reload para voltar.


  // ── As camadas da tripulação ──
  //
  // No cofre (SW-SUP-Naves, "A tripulação") Energia, Controle de Avarias e a
  // fuga como relógio são CAMADAS OPCIONAIS: cada uma acrescenta uma decisão
  // por rodada, e as três somadas pesam numa mesa casual. Por isso são três
  // opções e não uma: o livro diz que se liga uma a uma.
  //
  // Começam DESLIGADAS. A ficha já é cheia, e três painéis que a mesa não usa
  // custam mais atenção do que valem. Os POSTOS não estão aqui: eles são a
  // regra da tripulação, não uma camada, e a ficha já guardava quem ocupa cada
  // um — o que entra é a ação escolhida, que aparece sempre.
  for (const [chave, padrao] of [["camadaEnergia", false], ["camadaAvarias", false], ["camadaFuga", false]]) {
    game.settings.register(ID, chave, {
      name: `starwars-sd.settings.${chave}.nome`,
      hint: `starwars-sd.settings.${chave}.dica`,
      scope: "world",
      config: true,
      type: Boolean,
      default: padrao,
      onChange: () => {
      },
    });
  }


});

Hooks.once("ready", () => {

  // ── O CONVERSOR DE NAVES ──
  //
  // Exposto na API do módulo para o Mestre chamar do console. Não é um botão
  // porque é uma ação de uma vez só na vida do mundo, e um botão permanente
  // para isso vira entulho — mas também não é um script para colar, porque
  // script colado não tem teste e este tem.
  const mod = game.modules.get(ID);
  if (mod) {
    mod.api = {
      ...(mod.api ?? {}),
    };
    const quantas = navesAntigas().length;
    if (quantas > 0) {
      console.log(
        `${ID} | ${quantas} nave(s) no tipo antigo. Para converter: ` +
        `game.modules.get("${ID}").api.converterTodas()`
      );
      ui.notifications?.info(
        `${quantas} nave(s) ainda usam o tipo antigo. O console diz como converter.`
      );
    }
  }

  // O Foundry já recusa ligar o módulo sem a dependência, mas um mundo antigo
  // pode ter o Space Dragon desligado depois. Avisar custa uma linha.
  if (!game.modules.get("spacedragon")?.active) {
    ui.notifications?.warn(game.i18n.localize("starwars-sd.aviso.semSpaceDragon"));
  }

  // A classe do tema no <body>. Vai no `ready` porque é aqui que o <body>
  // existe e que a classe do módulo Space Dragon já está lá — o aviso de
  // "tema do vizinho desligado" depende de poder conferi-la.

  // A Ordem de Ação: a declaração mora no módulo spacedragon (aba de ataques);
  // aqui fica o resumo da rodada para o Mestre, e a inversão registrada acima.
  // No ready todos os módulos já carregaram: é aqui que dá para saber se algum
  // deles substituiu a classe de Combat e apagou a nossa ordenação crescente.

  // O painel de Pontos de Força na ficha do personagem. Injetado, não
  // substitui nada do sistema, e sai junto se o módulo for desligado.
  ligarPontosDeForca();

  // A Ficha de Nave sobre a de personagem. No `ready` pelo mesmo motivo que o
  // vizinho documenta: `registerSheet` entra numa fila processada depois do
  // `init`, e no `init` o registro de fichas do sistema ainda está vazio — a
  // classe-base não seria encontrada e a ficha não entraria.

  game.starwarsSD = {};
});
