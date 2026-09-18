// As quatro classes-base: Veterano (Cosmonauta), Operativo (Gatuno), Técnico
// (Cientista) e Sensível à Força (Mentálico), do 1º ao 20º nível.
//
// Fonte: o cofre, em Documents\Ekhoria\20 Space Dragon\Space Dragon Suplemento\
//   SW-SUP-Classes.md (as três mundanas) e SW-SUP-Forca.md (o Sensível).
//
// ── O QUE O CENÁRIO MUDA, E O QUE NÃO MUDA ──────────────────────────────────
//
// O Suplemento "renomeia e reveste" as classes do livro básico sem mexer num
// número: as quatro tabelas conferem célula por célula com as do Aprimorado
// (tools/importar-tabelas.mjs as trouxe do cofre, e a conferência foi feita
// contra o módulo Space Dragon). Por isso cada classe declara o CHASSI por
// flag — `flags.spacedragon.chassi` — e o módulo Space Dragon passa a achar a
// tabela certa para o alcance mental, os PV e o dano crítico.
//
// As habilidades com teste de porcentagem declaram, também por flag, qual
// habilidade do livro elas são, e ganham os mesmos botões. Quando o nome já é
// o do livro ("Pilotar Naves"), a flag não é necessária.
//
// ── O QUE NÃO ESTÁ AQUI ─────────────────────────────────────────────────────
//
// As regras que o Suplemento manda buscar no livro básico: a tabela de
// talentos do Gatuno (T3-5), a de desativar robôs (T3-2), as regras de
// Poderes Mentais do Cap. 9. No Foundry elas são o módulo Space Dragon.

import { md } from "../lib.mjs";

const p = (s) => `<p>${md(s)}</p>`;
const lista = (itens) => `<ul>${itens.map((i) => `<li>${md(i)}</li>`).join("")}</ul>`;
const citacao = (s) => `<blockquote><p>${md(s)}</p></blockquote>`;
const nota = (s) => `<p class='nota-casa'><em>${md(s)}</em></p>`;

/** O chassi, na flag que o módulo Space Dragon lê. */
const chassi = (nome) => ({ spacedragon: { chassi: nome } });
/** A habilidade do livro que esta é, para os botões de teste. */
const doLivro = (nome) => ({ spacedragon: { habilidade: nome } });

export const classes = [
  // ── Veterano ────────────────────────────────────────────────────────────
  {
    nome: "Veterano",
    chassi: "Cosmonauta",
    flags: chassi("Cosmonauta"),
    dv: 10,
    equipment_restrictions: {
      weapons: "Qualquer tipo.",
      armors: "Qualquer veste, e escudos.",
      magic_items: "Aparatos defensivos e utilitários (não ofensivos).",
    },
    flavor: p("O herói de ação e o piloto da galáxia."),
    descricao:
      p("*chassi: Cosmonauta (d10)*") +
      p("O herói de ação e o piloto da galáxia — soldados, pistoleiros, caçadores, capitães e diplomatas de gatilho rápido. É a classe marcial: não há \"Guerreiro\" separado. **Cassian, Boba Fett, Leia e um piloto de caça** são todos Veteranos.") +
      lista([
        "**Atributos-chave:** **Força e Destreza** (12+ em ambos). · **Dado de Vida:** d10. · **Créditos iniciais:** **2d10 × 5.000 CR**.",
        "**Armas:** qualquer tipo. · **Vestes:** qualquer + **escudos**. · **Aparatos:** defensivos e utilitários (não ofensivos).",
      ]),
    notaTabela: "*(DV a partir do 10º = PV fixos por nível + mod. de Constituição, mínimo 1.)*",
    habilidades: [
      { nome: "Pilotar Naves", level: 1,
        desc: p("**Pilotar Naves (%):** pilota qualquer nave ou veículo; é o **capitão natural** de uma nave. Falha = perde-se ou complica a manobra.") },
      { nome: "Desarmar e Subjugar", level: 1,
        desc: p("**Desarmar e Subjugar (%):** sacrificando um ataque, desarma (usando mod. de **Destreza**) ou subjuga (usando mod. de **Força**); desarma antes de subjugar; submissão bem-sucedida abre um teste resistido de Força.") },
      { nome: "Dano Crítico", level: 1,
        desc: p("**Dano Crítico:** em acerto crítico, multiplica o dano pelo valor da coluna (**×2 → ×5** ao longo dos 20 níveis) — é a marca da classe.") },
      { nome: "Ataques Múltiplos", level: 7,
        desc: p("**Ataques Múltiplos:** a partir do **7º nível**, um **ataque adicional** por rodada, usando a **segunda Base de Ataque** da tabela (ex.: `+7/+1` no 7º). Podem ser trocados por manobras de Desarmar/Subjugar.") +
              nota("A ficha guarda só o primeiro valor da Base de Ataque. O segundo ataque está na tabela da classe e é aplicado à mão.") },
    ],
  },

  // ── Operativo ───────────────────────────────────────────────────────────
  {
    nome: "Operativo",
    chassi: "Gatuno",
    flags: chassi("Gatuno"),
    dv: 6,
    equipment_restrictions: {
      weapons: "Só as que se empunham com uma mão.",
      armors: "Leves ou médias, sem escudos (senão perde os talentos).",
      magic_items: "Só utilitários.",
    },
    flavor: p("O trapaceiro do submundo."),
    descricao:
      p("*chassi: Gatuno (d6)*") +
      p("O trapaceiro do submundo — contrabandistas, ladrões, espiões, piratas e assassinos onde a lei não chega. **Han Solo é um Operativo.**") +
      lista([
        "**Atributo-chave:** **Destreza** (12+); Ciência secundário. · **Dado de Vida:** d6. · **Créditos iniciais:** **2d6 × 5.000 CR**.",
        "**Armas:** só as que se empunham com **uma mão**. · **Vestes:** leves ou médias, **sem escudos** (senão perde os talentos). · **Aparatos:** só utilitários.",
      ]),
    habilidades: [
      { nome: "Talentos de Operativo", level: 1, flags: doLivro("Talentos de Gatuno"),
        desc: citacao("**Use a tabela de talentos do Gatuno** (*SD*, Cap. 3), sem alteração de valores. As regras de uso — uma tentativa por objeto, instrumentos necessários, queda ao falhar em Escalar, o Mestre rolando Furtividade em segredo, o bônus e o multiplicador do Ataque Furtivo — são as do livro básico.") +
              p("Os nomes são os mesmos do livro básico. O que o cenário acrescenta é **onde cada talento entra** numa galáxia de naves e bases:") +
              lista([
                "**Sabotagem** — do painel de acesso ao gerador de escudos e ao hiperdrive; é o mesmo talento que destranca e que avaria, e a única % que o **Crédito Tecnológico** modifica.",
                "**Escalar** — cascos, dutos de manutenção, torres de comunicação.",
                "**Furtividade** — esconder-se *e* mover-se em silêncio, num talento só — corredores de patrulha, hangares, o compartimento de carga.",
                "**Furtar** — o crédito, o chip de dados, o comunicador do oficial.",
                "**Percepção** — 1d6 contra a faixa do nível.",
                "**Ataque Furtivo** — +2 no ataque e dano multiplicado, uma vez por posição revelada.",
              ]) +
              nota("Os botões de rolagem abaixo são os do Gatuno, calculados pelo nível e pelos atributos da ficha.") },
    ],
  },

  // ── Técnico ─────────────────────────────────────────────────────────────
  {
    nome: "Técnico",
    chassi: "Cientista",
    flags: chassi("Cientista"),
    dv: 8,
    equipment_restrictions: {
      weapons: "Só armas de fogo de energia (jamais projéteis ou marciais).",
      armors: "Qualquer veste, e aparatos defensivos.",
      magic_items: "Constrói e opera qualquer um (só o Técnico opera ofensivos).",
    },
    flavor: p("O gênio prático da galáxia."),
    descricao:
      p("*chassi: Cientista (d8)*") +
      p("O gênio prático da galáxia — mecânicos de droides, médicos de campo, engenheiros e slicers. Onde o Jedi tem a Força, o Técnico tem a engenhoca: seus **aparatos e feitos científicos** são os \"itens mágicos\" deste universo, e ele os constrói com as próprias mãos.") +
      lista([
        "**Atributo-chave:** **Ciência** (14+). · **Dado de Vida:** d8. · **Créditos iniciais:** **1d8 × 5.000 CR**.",
        "**Armas:** só armas de fogo **de energia** (jamais projéteis ou marciais). · **Vestes:** qualquer + aparatos defensivos. · **Aparatos:** **constrói e opera qualquer um** (só o Técnico opera **ofensivos**).",
      ]),
    habilidades: [
      { nome: "Operar e Consertar Máquinas", level: 1, flags: doLivro("Operar Máquinas"),
        desc: p("**Operar e Consertar Máquinas (%):** opera e conserta máquinas; pode **pilotar naves** (menos eficiente que o Veterano). Máquinas avariadas precisam ser consertadas antes de usar.") },
      { nome: "Aparatos e Feitos Científicos", level: 1,
        desc: p("**Aparatos e Feitos Científicos:** cria máquinas e realiza experiências (feitos médicos e de laboratório). O **Nível Tecnológico Máximo** (coluna) limita o que ele pode **criar** — não o que pode **usar**.") },
      { nome: "Desativar Robôs", level: 1,
        desc: p("**Desativar Robôs:** com um **disruptor positrônico**, rola **1d20 contra a Tabela 3-2** do livro básico (o \"nível\" é o do disruptor = seu nível de classe). O **número de robôs por dia** é dado pelo atributo **Ciência** (*SD*, Tabela 1-5). O de-para das categorias de robô para os droides da galáxia está abaixo.") +
              p("**Os droides da galáxia na Tabela 3-2.** Role contra a **Tabela 3-2 do livro básico**, usando a coluna da categoria correspondente. As oito categorias de robô do *SD* cobrem toda a droidaria de Star Wars:") +
              lista([
                "**Sucata Robótica** — Droide de carga GNK, droides-aranha de manutenção, ferro-velho reanimado.",
                "**Protótipo** — Droide experimental, modelo único saído de uma bancada.",
                "**Repetidor** — **Droide de batalha B1** — o soldado descartável, em enxame.",
                "**Autômato** — Droide-sonda, droide-vigia, seeker.",
                "**Humanoide** — **Super droide de batalha B2**, droides de guarda pesados.",
                "**Serviçal** — **Astromecânico (R2)**, droide de protocolo (C-3PO), droides médicos.",
                "**Metahumano** — Droide de comando tático, IA de alto escalão.",
                "**Androide** — **Droideka**, droides-assassinos (HK, IG), o que passa por gente.",
              ]) +
              nota("A Tabela 3-2 inteira está no journal Aparatos e Feitos Científicos do módulo Space Dragon.") },
      { nome: "Crédito Tecnológico", level: 1,
        desc: p("**Crédito Tecnológico:** desconto (por Ciência) em qualquer gasto tecnológico.") +
              nota("É a coluna da Ciência que a ficha Space Dragon mostra como APT. TEC.") },
    ],
  },

  // ── Sensível à Força ────────────────────────────────────────────────────
  {
    nome: "Sensível à Força",
    chassi: "Mentálico",
    flags: chassi("Mentálico"),
    dv: 4,
    equipment_restrictions: {
      weapons: "O sabre de luz e pistolas.",
      armors: "Só leves (vestes pesadas ou escudos bloqueiam os poderes); o Guardião é a exceção.",
      magic_items: "Só utilitários.",
    },
    flavor: p("Jedi, Sith, Nightsisters e místicos de fronteira."),
    descricao:
      citacao("Jedi, Sith, Nightsisters e místicos de fronteira. O Sensível à Força é o **Mentálico** do Space Dragon reskinado — os **Poderes Mentais** viram **Poderes da Força**, e as **Grandezas** (1ª a 10ª) medem o quão poderoso é cada poder. Corpo frágil (**d4**), mas a mente alcança o impossível. Por cima da classe vem o **Caminho** (Luz ou Sombra).") +
      citacao("**A Força é regida por Intelecto.** É o atributo nativo do Mentálico — e é justamente o que o guia OD2 traduz como **Sabedoria**. Então o \"Jedi sábio\" e a regra do livro são a **mesma coisa**: aqui não há adaptação nenhuma, é o Intelecto do SD puro.") +
      lista([
        "**Atributo-chave:** **Intelecto** — rege a chance de realizar/aprender poderes desconhecidos (*SD*, Tabela 1-4), o bônus de Alcance Mental e a **JPM**.",
        "**Dado de Vida:** d4 (o corpo do Mentálico). · **Créditos iniciais:** **1d6 × 5.000 CR**.",
        "**Armas:** o **sabre de luz** e **pistolas**. · **Vestes:** só **leves** (vestes pesadas ou escudos **bloqueiam os poderes**) — o **Guardião** é a exceção. · **Aparatos:** só utilitários.",
      ]) +
      p("**Reputação (nível alto).** Como toda classe do SD, no topo da carreira o Sensível é **um nome**. O que a fama *diz* depende do Caminho: o nome de um **Mestre Jedi** abre portas; o de um **Lorde Sith** também \"funciona\", mas por terror — e sob o Império pode ser rolado *contra* você.") +
      nota("O Caminho (Luz, Sombra e Cinza), a Corrupção, a Tentação e o Eco da Senda estão no journal A Força, na Referência do Mestre."),
    habilidades: [
      { nome: "Poderes da Força", level: 1, flags: doLivro("Realizar e Aprender Poder Mental"),
        desc: p("**Poderes da Força (= Poderes Mentais).** Você começa **conhecendo dois poderes de 1ª Grandeza** (à escolha, da lista Universal + a do seu Caminho). Poderes **conhecidos** são usados à vontade (respeitando a Grandeza-Limite e o Alcance disponível). Um poder **desconhecido** exige, antes de usar, uma rolagem de **d% ≤ Intelecto** (*SD*, Tabela 1-4); a falha gasta o Alcance mesmo assim. A lista completa, por Grandeza, está em [[SW-SUP-Poderes-da-Forca]] — e os efeitos, no *SD*, Cap. 9.") },
      { nome: "Aprender Poderes", level: 1,
        desc: p("**Aprender Poderes.** Depois de usar com sucesso um poder desconhecido, uma **segunda rolagem** (mesma %) o **memoriza** permanentemente. Falhar na primeira trava nova tentativa por 24 h (ou 1d4 dias, se falhar por mais do dobro). Um mestre que o ensine torna a rolagem mais fácil.") },
      { nome: "Alcance da Força", level: 1,
        desc: p("O **Alcance da Força** (= Alcance Mental) é o seu **combustível diário em %**: usar um poder desconta **% igual à Grandeza** dele (um poder de 5ª gasta 5%), mesmo que falhe ou seja anulado. Some a esse valor o **bônus de Intelecto** (*SD*, Tabela 1-4). Zera após **8 h de descanso**. A **Grandeza-Limite** é o teto de poder que você acessa.") +
              nota("A barra de alcance na aba de Poderes é a do módulo Space Dragon: ela desconta a Grandeza a cada uso e zera no dia novo.") },
      { nome: "Duelo da Força", level: 1,
        desc: p("**Duelo da Força (= Anulação / Contra-Ataque Mental).** Ao ser alvo de um poder, você pode gastar **Alcance igual à Grandeza** dele e fazer uma **rolagem resistida de 1d6 + seu nível** contra quem o lançou (pode gastar +2% de Alcance por +1 no total). Empate = **choque da Força**: 1d4 de dano mental nos dois, e **JPM** para não ficar atordoado. Vencer por dobro permite **revidar** na hora com um poder seu.") },
      { nome: "Resistência Mental", level: 1,
        desc: p("**Resistência Mental (RM).** Se, ao mirar uma criatura, sua rolagem de poder ficar **abaixo da RM** dela, aquela criatura **nunca mais** poderá ser afetada por *aquele* poder específico.") },
      { nome: "A Plenitude do 16º", level: 16,
        desc: p("**A plenitude do 16º.** Ao chegar a **100% de Alcance** no 16º nível, o Mentálico atinge a plenitude mental — e o **corpo para de evoluir**: BA, JP e PV **congelam** a partir daí (por isso o DV some do 17º em diante). A mente segue crescendo até os 150% do 20º.") },
    ],
  },
];
