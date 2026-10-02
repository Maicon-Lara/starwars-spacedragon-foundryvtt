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

import { NaveDataModel } from "./nave-modelo.js";
import { NaveFicha, NaveFichaTatico, NaveFichaLivro, TIPO_NAVE } from "./nave-ficha.js";
import { ligarPontosDeForca } from "./pontos-de-forca.js";
import { registrarTema, ligarTema } from "./tema.js";
import { registrarCombate, ligarOrdemDeAcao, ligarResumoDaRodada } from "./ordem-painel.js";

const ID = "starwars-sd";

Hooks.once("init", () => {
  console.log(`${ID} | Star Wars — Suplemento para Space Dragon`);

  // ── Nave: tipo de ator próprio ──
  // O subtipo é declarado em module.json (documentTypes); aqui se ligam o
  // modelo de dados e a ficha. A chave leva o id do módulo como prefixo —
  // "starwars-sd.nave" —, e por isso não colide com a "stardragon.nave" do
  // Star Dragon: as duas naves convivem no mesmo mundo, cada uma com a sua
  // regra.
  Object.assign(CONFIG.Actor.dataModels, { [TIPO_NAVE]: NaveDataModel });

  // ── Qual regra de combate de nave a mesa usa ──
  //
  // São duas, e de origens diferentes:
  //
  //   TÁTICO  o Combate Tático do Suplemento, desenhado sobre o X-Wing
  //           Miniatures Game da FFG — dial de manobras, manobra planejada em
  //           segredo, Sobrecarga (o stress) e dados de defesa que cancelam
  //           dados de dano. Tem tabela de crítico própria.
  //   LIVRO   o §10.6 do Livro Básico Aprimorado: sem grid e sem dial, defesa
  //           no CP, manobra evasiva trocando o CP por uma JP, e as tabelas
  //           T10-5 e T10-6.
  //
  // A opção é de MUNDO e define a regra PADRÃO da mesa — é ela que decide qual
  // das duas fichas abre quando se cria uma nave nova. Vem antes do registro
  // das fichas de propósito: `makeDefault` é lido no momento do registro.
  game.settings.register(ID, "regrasDeNave", {
    name: "starwars-sd.settings.regrasDeNave.nome",
    hint: "starwars-sd.settings.regrasDeNave.dica",
    scope: "world",
    config: true,
    type: String,
    choices: {
      tatico: "starwars-sd.settings.regrasDeNave.tatico",
      livro: "starwars-sd.settings.regrasDeNave.livro",
    },
    default: "tatico",
    // Trocar a padrão exige recarregar, porque quem é a ficha padrão se decide
    // no registro, em `init`. Quem quer mudar UMA nave agora não precisa disto:
    // troca a ficha dela em Configurar Ficha, sem reload nenhum.
    requiresReload: true,
    onChange: () => {
      for (const app of foundry.applications?.instances?.values?.() ?? []) {
        if (app instanceof NaveFicha) app.render();
      }
    },
  });

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
  registrarCombate();

  // ── A paleta do livro nas fichas do sistema ──
  //
  // A ficha de personagem é do SISTEMA, e o módulo Space Dragon já tem a
  // camada que a repinta. Esta opção só troca as cinco cores dela pela paleta
  // do livro — ver module/tema.js, que explica por que não se reescreve
  // seletor nenhum aqui.
  registrarTema();

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
        for (const app of foundry.applications?.instances?.values?.() ?? []) {
          if (app instanceof NaveFicha) app.render();
        }
      },
    });
  }

  // ── As duas fichas de nave ──
  //
  // UMA PARA CADA REGRA, e não uma que troca de comportamento. No Foundry a
  // ficha é escolhida por ATOR (Configurar Ficha, no cabeçalho da janela), e
  // isso dá três coisas que a ficha única não dava:
  //
  //   · a mesa pode rodar a frota no Tático e resolver a nave do Mestre pelo
  //     livro, no mesmo mundo;
  //   · o nome da ficha aparece na janela, então o jogador sabe qual regra
  //     está valendo sem abrir as configurações do módulo para entender por
  //     que o dial não está lá;
  //   · trocar a regra de uma nave não pede reload.
  //
  // A opção de mundo acima continua mandando no PADRÃO — é o que a mesa
  // escolheu, e vale para toda nave nova.
  const regraPadrao = game.settings.get(ID, "regrasDeNave");
  foundry.documents.collections.Actors.registerSheet(ID, NaveFichaTatico, {
    types: [TIPO_NAVE],
    label: "starwars-sd.fichas.tatico",
    makeDefault: regraPadrao === "tatico",
  });
  foundry.documents.collections.Actors.registerSheet(ID, NaveFichaLivro, {
    types: [TIPO_NAVE],
    label: "starwars-sd.fichas.livro",
    makeDefault: regraPadrao === "livro",
  });

  // ── Como a nave se move no mapa ──
  //
  // HEX é o que o Suplemento escreve: a nave anda em linha reta pelas casas e
  // gira tudo de uma vez no fim. ARCO é a mecânica do X-Wing Miniatures Game,
  // em que ela descreve a curva girando ao longo dela.
  //
  // Não é só aparência: andar 3 e virar 60° termina num lugar DIFERENTE de
  // percorrer um arco de 60° com 3 de comprimento. Por isso é opção, e o padrão
  // continua sendo o hex — quem tem a regra escrita não é surpreendido.
  game.settings.register(ID, "movimentoDaNave", {
    name: "starwars-sd.settings.movimentoDaNave.nome",
    hint: "starwars-sd.settings.movimentoDaNave.dica",
    scope: "world",
    config: true,
    type: String,
    choices: {
      hex: "starwars-sd.settings.movimentoDaNave.hex",
      arco: "starwars-sd.settings.movimentoDaNave.arco",
    },
    default: "hex",
  });

  // ── Claro ou escuro na ficha de nave ──
  //
  // A ficha tem paleta própria, e por isso não acompanha sozinha um módulo de
  // modo escuro — cada um marca a página de um jeito. No "automático" ela segue
  // os dois sinais que existem na prática: a classe `theme-dark` no corpo da
  // página, que o Foundry v13 e a maioria desses módulos põem, e a preferência
  // do sistema operacional. Quem quiser fixar, fixa.
  //
  // É opção de CLIENTE: tema é preferência de quem olha, não da mesa.
  game.settings.register(ID, "temaDaNave", {
    name: "starwars-sd.settings.temaDaNave.nome",
    hint: "starwars-sd.settings.temaDaNave.dica",
    scope: "client",
    config: true,
    type: String,
    choices: {
      auto: "starwars-sd.settings.temaDaNave.auto",
      claro: "starwars-sd.settings.temaDaNave.claro",
      escuro: "starwars-sd.settings.temaDaNave.escuro",
    },
    default: "auto",
    onChange: () => {
      for (const app of foundry.applications?.instances?.values?.() ?? []) {
        if (app instanceof NaveFicha) app.render();
      }
    },
  });
});

Hooks.once("ready", () => {
  // O Foundry já recusa ligar o módulo sem a dependência, mas um mundo antigo
  // pode ter o Space Dragon desligado depois. Avisar custa uma linha.
  if (!game.modules.get("spacedragon")?.active) {
    ui.notifications?.warn(game.i18n.localize("starwars-sd.aviso.semSpaceDragon"));
  }

  // A classe do tema no <body>. Vai no `ready` porque é aqui que o <body>
  // existe e que a classe do módulo Space Dragon já está lá — o aviso de
  // "tema do vizinho desligado" depende de poder conferi-la.
  ligarTema();

  // A Ordem de Ação: o painel do jogador e o resumo da rodada para o Mestre.
  ligarOrdemDeAcao();
  ligarResumoDaRodada();

  // O painel de Pontos de Força na ficha do personagem. Injetado, não
  // substitui nada do sistema, e sai junto se o módulo for desligado.
  ligarPontosDeForca();

  game.starwarsSD = {};
});
