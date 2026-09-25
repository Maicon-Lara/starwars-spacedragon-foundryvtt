// As especializações do 5º nível.
//
// Fonte: o cofre, em Documents\Ekhoria\20 Space Dragon\Space Dragon Suplemento\
//   SW-SUP-Classes.md e SW-SUP-Forca.md (seções "Especializações").
//
// ── COMO VIRAM FICHA ────────────────────────────────────────────────────────
//
// Cada especialização é um item de classe próprio, "Mercenário — Veterano",
// que HERDA as habilidades da classe-base e acrescenta as suas — o mesmo
// desenho do módulo Space Dragon, e o que o jogador pediu lá: "recebem poderes
// da classe base e novos das especializações". A especialização vem primeiro
// no nome porque é ela que se procura na lista.
//
// A tabela de progressão de cada uma (tools/data/progressoes.mjs, tirada do
// cofre) vai inteira na descrição, e as colunas que o sistema sabe ler — BA e
// JP — entram no `levels` do 5º nível em diante. É isso que faz a ficha do
// Guardião atacar como Veterano e a do Mercenário parar a JP no 10º.
//
// ── AFILIAÇÃO ───────────────────────────────────────────────────────────────
//
// Nas classes mundanas, cada especialização é presa a Leal / Neutro / Rebelde.
// No Sensível isso foi removido de propósito — quem manda na moral é o
// Caminho (ver o journal A Força).

import { md } from "../lib.mjs";

const p = (s) => `<p>${md(s)}</p>`;
const lista = (itens) => `<ul>${itens.map((i) => `<li>${md(i)}</li>`).join("")}</ul>`;
const citacao = (s) => `<blockquote><p>${md(s)}</p></blockquote>`;
const doLivro = (nome) => ({ spacedragon: { habilidade: nome } });

/** Uma especialização mundana: um parágrafo no 5º e os degraus do 10º e 20º. */
const degraus = (n5, n10, n20) =>
  p(n5) + lista([`\`10º\` ${n10}`, `\`20º\` ${n20}`]);

/** O Eco da Senda, com o Domínio de cada uma (SW-SUP-Forca, "Eco da Senda"). */
const eco = (dominio) => ({
  nome: "Eco da Senda",
  level: 10,
  desc:
    p(`Chega um ponto em que a Força para de ser esforço — **só naquilo que é o seu ofício**. O Domínio desta Senda é **${dominio}**.`) +
    lista([
      "`10º` **Eco.** Sempre que gastar Alcance num **poder do seu Domínio**, role **1d10** depois de resolver o poder: num **1**, o **% de Alcance gasto volta**.",
      "`15º` **Eco Maior.** A rolagem passa a ser **1d4** (num 1, volta); além disso, os **poderes de 1ª Grandeza do seu Domínio não custam mais Alcance** — de graça, no máximo **um por rodada**.",
    ]) +
    // o Domínio é lista fechada de propósito: sem isso, o Mestre tinha de
    // decidir caso a caso, antes de cada rolagem, se o poder contava
    citacao("O Domínio é uma **lista fechada** de poderes, no journal **A Força** → *Eco da Senda*: o poder está na lista ou não está, sem arbitragem na mesa. Um mesmo poder pode constar em dois Domínios — cada personagem tem **uma** Senda, então nunca há conflito. Quem trilhou a Senda Mandaloriana abriu mão da especialização — e do Domínio: **não tem Eco da Senda**.") +
    citacao("**Módulo opcional.** A classe funciona sem ele."),
});

export const variantes = [
  // ══ Veterano ═════════════════════════════════════════════════════════════
  {
    nome: "Mercenário", classe: "Veterano", afiliacao: "Neutro",
    frase: "o soldado/pistoleiro",
    exemplos: "*Stormtroopers de elite, mercenários, pistoleiros do submundo, soldados clones.*",
    habilidades: [
      { nome: "Mercenário", level: 5,
        desc: degraus(
          "Para de progredir em **Pilotar Naves**. Escolhe **uma arma** com a qual fica mais perigoso do que nunca: o dano crítico com ela é sempre **um multiplicador acima** do da tabela do Veterano. Assim, um Mercenário de **5º nível** tem crítico **×4** com a arma preferida, e um de **18º nível** tem **×6**.",
          "**−4** ao usar qualquer arma que não a preferida e **+2** com ela (só no 1º ataque); pode **sacrificar o 2º ataque** para garantir chance de crítico; a **JP para de progredir**.",
          "só usa a arma escolhida, mas **garante chance de crítico nos dois ataques**.",
        ) },
    ],
  },
  {
    nome: "Caçador de Recompensas", classe: "Veterano", afiliacao: "Rebelde",
    frase: "o caçador",
    exemplos: "*Boba Fett, Cad Bane, Bossk, Fennec. Casa com a [[SW-SUP-Senda-Mandaloriana|Senda Mandaloriana]].*",
    habilidades: [
      { nome: "Caçador de Recompensas", level: 5,
        desc: degraus(
          "Passa a **operar aparatos ofensivos** e a **operar e consertar máquinas**, usando como chance a **% de Desarmar/Subjugar** somada ao **Crédito Tecnológico** da sua Ciência. O talento **muda de ofício**: como manobra de desarmar e subjugar, ele **para de progredir no 5º**; a progressão da tabela continua, mas passa a valer só para aparatos e máquinas.",
          "**Ataque extra:** logo depois do primeiro ataque do turno, pode rolar **Desarmar/Subjugar com a % do 5º nível**. Sucesso: faz **mais dois ataques** naquele turno, os dois com a **2ª BA** — três no total. Falha: **não faz mais nada** no turno. O ataque extra pode ser trocado por uma tentativa de desarmar ou subjugar.",
          "usa **qualquer aparato** como um Técnico de igual nível e faz **sempre 3 ataques** por turno, sem rolar — o extra com a 2ª BA, e ainda podendo virar desarme ou submissão.",
        ) },
    ],
  },
  {
    nome: "Emissário", classe: "Veterano", afiliacao: "Leal",
    frase: "o diplomata/senador/capitão-líder",
    exemplos: "*Leia Organa, Bail, Mon Mothma, um capitão contrabandista que virou general da Aliança.*",
    habilidades: [
      { nome: "Emissário", level: 5,
        desc: degraus(
          "Para de progredir em **Dano Crítico**, mas usa essa progressão como **multiplicador do ajuste de reação** (Comunicação). Recebe **salário de $20.000 × nível/mês** do indivíduo ou organização que representa.",
          "para em **Desarmar/Subjugar**; ganha uma **nave patrocinada** (combustível e reparos custeados) e pode ter tripulação até seu número máximo de seguidores.",
          "a tripulação **triplica**; usa a **% de Desarmar/Subjugar** como chance de tornar **amigável** a reação de uma criatura inteligente.",
        ) },
    ],
  },

  // ══ Operativo ════════════════════════════════════════════════════════════
  {
    nome: "Espião", classe: "Operativo", afiliacao: "Leal",
    frase: "agente de inteligência",
    exemplos: "*Cassian Andor, Fulcrum, agentes do ISB.*",
    habilidades: [
      { nome: "Espião", level: 5,
        desc: degraus(
          "Sua **Sabotagem** sobe para a **% de Furtividade** e passa a progredir junto com ela. O **Crédito Tecnológico** (por Ciência) conta **dobrado**. Usa a **% de Furtar** para **passar-se por outra pessoa**, somando o ajuste de reação por Comunicação.",
          "usa a **% de Escalar** como chance de **obter informação** relevante, por contatos ou registros; usa **aparatos defensivos** como um Técnico.",
          "**Furtividade, Sabotagem e Furtar igualam os 99% de Escalar**.",
        ) },
    ],
  },
  {
    nome: "Sabotador", classe: "Operativo", afiliacao: "Neutro",
    frase: "demolições e armadilhas",
    exemplos: "*Demolicionista rebelde, saboteur de bases imperiais.*",
    habilidades: [
      { nome: "Sabotador", level: 5,
        desc: degraus(
          "Ganha um **bônus em Sabotagem** igual à diferença entre a % de Escalar e 100% (ex.: no 5º, Escalar 84% → **+16%**). O bônus **não é cumulativo**: a cada nível ele é recalculado sobre a % da tabela, resultando numa porcentagem nova. Para de progredir em **Furtar** e **Ataque Furtivo**.",
          "para de progredir em **todo talento exceto Sabotagem**, e passa a **criar armadilhas** com as máquinas que sabota: a chance de **desarmá-las** é inversa à sua % de Sabotagem (quanto melhor ele sabota, mais difícil desfazer sua obra). No 10º isso dá **29% de desarme**, contra os 71% de sabotagem já com o bônus e sem contar atributo. *(O livro imprime 27%/73% neste exemplo, mas isso só fecha com a linha do 11º nível: no 10º a Sabotagem é 60% e Escalar 89%, então o bônus é +11% e o total 71%. A fórmula confere com o exemplo do 5º nível, que o próprio livro dá: Escalar 84% → +16%.)*",
          "Sabota a **99%**; armadilhas dele têm **1% de chance de desarme**.",
        ) },
    ],
  },
  {
    nome: "Assassino", classe: "Operativo", afiliacao: "Neutro",
    frase: "a lâmina do submundo",
    exemplos: "*Matadores da Aurora Negra, agentes de eliminação do submundo.*",
    habilidades: [
      { nome: "Assassino", level: 5,
        desc: degraus(
          "Para de progredir em **Escalar** e **Sabotagem**. O **Ataque Furtivo** ganha **+1 no multiplicador** (×3 já no 5º, ×4 no 6º…).",
          "para de progredir em **Furtar**; qualquer acerto passa a ter **20%** de contar como Ataque Furtivo (fora os que já contariam); desenvolve **venenos**, de efeito acertado com o Mestre.",
          "**todos os seus ataques** contam como Ataque Furtivo; num crítico, o alvo faz **JPF ou morre** (dano massivo).",
        ) },
    ],
  },
  {
    nome: "Contrabandista", classe: "Operativo", afiliacao: "Rebelde",
    frase: "o malandro espacial", base: "Pirata Espacial",
    exemplos: "*Hondo Ohnaka, os capitães do Cartel, o próprio Han em modo pirataria.*",
    restricoes: { armors: "Leves ou médias, sem escudos (senão perde os talentos); proficiente em escudos de energia." },
    habilidades: [
      { nome: "Contrabandista", level: 5,
        desc: degraus(
          "Para de progredir em **Sabotagem** e **Furtar**. Usa o **Crédito Tecnológico** (por Ciência) como desconto em **qualquer negociação**, e o **dobro** dessa % para **extorsão**; é proficiente em **escudos de energia**.",
          "para de progredir também em **Furtividade**, mas usa a **% de Furtividade** já alcançada como chance de um **ataque adicional** no turno (com a BA de 7 níveis abaixo); pilota e usa qualquer aparato como um Técnico de **metade** dos seus níveis; **tripulação fiel** = seu número máximo de seguidores (mínimo 2).",
          "desfere **sempre 2 ataques** (o 2º com a BA de 5 níveis abaixo); **dobra/quadruplica** o Crédito; tripulação **triplica** (mínimo 4).",
        ) },
    ],
  },

  // ══ Técnico ══════════════════════════════════════════════════════════════
  {
    nome: "Médico de Campo", classe: "Técnico", afiliacao: "Leal",
    frase: "o curandeiro", base: "Pesquisador",
    exemplos: "*Médicos rebeldes, cirurgiões de bacta, os que remendam heróis entre uma batalha e outra.*",
    restricoes: { weapons: "Nenhuma, exceto os artefatos que ele mesmo cria." },
    habilidades: [
      { nome: "Médico de Campo", level: 5,
        desc: degraus(
          "Para de progredir em **Operar Máquinas**, mas o **Crédito Tecnológico sobe +1%/nível**; abre mão de armas, exceto os artefatos que ele mesmo cria. Dedica a ciência à carne viva — cirurgia, bacta, próteses, antídotos.",
          "usa a **% de Operar Máquinas** como chance de ter à mão a informação ou o artefato médico relevante; em troca, seus aparatos contam **2 NT acima** (limitando-o a criar até o 8º NT).",
          "Crédito Tecnológico de **100%**; submete-se a um código de ética: **proibido causar dano a seres vivos** — quebrar isso suspende as habilidades da especialização até uma reparação.",
        ) },
    ],
  },
  {
    nome: "Engenheiro", classe: "Técnico", afiliacao: "Neutro",
    frase: "o inventor", base: "Inventor",
    exemplos: "*Construtores de droides (um Anakin criança), os engenheiros de Mon Cala, o gênio que monta uma nave com sucata.*",
    habilidades: [
      { nome: "Engenheiro", level: 5,
        desc: degraus(
          "Salta para o **4º Nível Tecnológico** já no 5º nível e ganha **+1 NT a cada 2 níveis** (chega ao 10º NT no 17º). O Crédito Tecnológico vira **custo adicional** — inventar do zero sai mais caro que comprar pronto.",
          "o prejuízo **dobra**, mas ele passa a **combinar até 3 aparatos** num só engenho.",
          "cria **qualquer** máquina e realiza **qualquer** feito, a custo dobrado, independente das condições.",
        ) },
    ],
  },
  {
    nome: "Slicer", classe: "Técnico", afiliacao: "Rebelde",
    frase: "o mestre dos sistemas", base: "Niilógico",
    exemplos: "*Slicers, ratos de dados, os técnicos que juram que a nave tem alma — e talvez tenham razão.*",
    habilidades: [
      { nome: "Slicer", level: 5,
        desc: lista([
          "`5º` passa a **sabotar e reprogramar máquinas como um Operativo de 1/3 dos seus níveis** (arromba fechaduras eletrônicas, derruba alarmes, força cofres de dados).",
          "`10º` para de progredir na sabotagem, mas passa a **Reprogramar Robôs**: contra a Tabela 3-2, um resultado **\"D\"** significa **robô reprogramado permanentemente** para servi-lo, e um **\"A\"**, controlável por **24 horas**. Não destrói o exército de droides do inimigo — vira-o contra o dono.",
          "`20º` **Faísca do Oculto:** de tanto mergulhar nos fluxos de dados, a mente do Slicer toca o **Espírito Galáctico** e passa a manifestar **poderes da Força de 1ª Grandeza** (lista Universal), com **alcance mental diário = bônus de Ciência**.",
        ]) +
        citacao("⚙️ **Divergência deliberada do livro (travada).** No SD nativo, a faísca do Niilógico corre pelo **Intelecto** — mas o Niilógico é um **Mentálico** (classe de Intelecto). Nosso Slicer é um **Técnico** (Cientista, classe de **Ciência**), então a faísca dele nasce da **maestria científica**: usa **Ciência**. Isso mantém o Slicer num atributo só (sem atributo secundário órfão) e preserva o contraste do cenário — *o Jedi sente (Intelecto), o hacker calcula (Ciência)*. *Variante fiel ao livro: troque por Intelecto se quiser o número nativo cru.*") },
    ],
  },

  // ══ Sensível à Força ═════════════════════════════════════════════════════
  {
    nome: "Guardião", classe: "Sensível à Força",
    frase: "o Jedi/Sith de sabre", origem: "criação do cenário",
    intro: "Troca a amplitude do poder pela maestria da lâmina.",
    exemplos: "Obi-Wan, Anakin, Ahsoka, Darth Maul, Darth Vader. *(Não há especialização guerreira nativa do Mentálico; esta Senda é design do cenário, com a BA emprestada do Cosmonauta.)*",
    restricoes: { armors: "Até médias, sem bloquear os poderes (Adestramento de Combate)." },
    habilidades: [
      { nome: "Adestramento de Combate", level: 5,
        desc: p("**Adestramento de Combate:** sua **Base de Ataque passa a evoluir como a de um Veterano** (Cosmonauta) e você usa **vestes médias** sem bloquear os poderes.") +
              p("**Troca:** a **JP congela no 5º** e o **teto de Grandeza passa a ser a 6ª** — os feitos lendários (7ª+) ficam para os conjuradores. Como toda especialização de Mentálico, ele paga com uma das duas colunas de corpo; trocou a Base de Ataque por uma melhor, então a conta vem na Proteção. O Guardião bate como um soldado e **resiste como um místico que parou de treinar a mente**.") },
      { nome: "Formas de Sabre", level: 5,
        desc: p("**Formas de Sabre:** domina **uma das sete Formas** (Shii-Cho, Makashi, Soresu, Ataru, Djem So, Niman, Juyo/Vaapad) — detalhadas em [[SW-SUP-Sabre-e-Cristais]].") },
      eco("O Corpo e a Lâmina — a Força que empurra, sustenta, apara e golpeia matéria"),
    ],
  },
  {
    nome: "Consular", classe: "Sensível à Força",
    frase: "o Jedi/Sith conjurador", base: "Psiquista",
    intro: "Mergulha na Força até o fundo, deixando o corpo para trás — e, quando o Alcance acaba, ainda tem a carne para queimar.",
    exemplos: "Yoda, Palpatine, Dooku, a Bruxa Mãe. A Força é a arma inteira — e o corpo, só o combustível.",
    habilidades: [
      { nome: "Consular", level: 5,
        desc: lista([
          "`5º` ganha a **4ª Grandeza direto** (englobando a 3ª) e **+1 Grandeza a cada 2 níveis** (chega à 10ª no 17º); a **BA congela** no 5º.",
          "`10º` a **JP congela**; seu Alcance conta como o de um Sensível **+2 níveis** (100% já no 14º); começa a **perder 1-2 PV** a cada nível que sobe.",
          "`17º+` a cada subida de nível, faça **JPF ou perca 1 de Constituição** (permanente).",
          "`20º` **JPF ou morre**; Alcance a **200%**; realiza qualquer poder **sem rolagem**.",
        ]) },
      eco("A Mente e o Domínio — a Força que fala, convence, dobra e escraviza vontades"),
    ],
  },
  {
    nome: "Sentinela", classe: "Sensível à Força",
    frase: "o equilíbrio, caçador e investigador", origem: "criação do cenário",
    intro: "Nem tanque nem canhão: o Sensível que se move pelo mundo real, farejando a Sombra e sobrevivendo a ela.",
    exemplos: "Kanan, Ezra, os Inquisidores caçando Jedi, os Guardas de Templo.",
    habilidades: [
      { nome: "Ofícios do Submundo", level: 5, flags: doLivro("Talentos de Gatuno"),
        desc: p("**Ofícios do Submundo:** ganha **três talentos de Operativo** à escolha (Furtividade, Sabotagem, Escalar, Ataque Furtivo…), com a % de um Gatuno de **metade** do seu nível (mínimo 1).") +
              p("**Progressão:** mantém a Grandeza e o Alcance da coluna normal — sem o teto do Guardião nem o salto do Consular. É a mais versátil das quatro, e por isso paga **mais tarde**: a JP só congela no 10º, enquanto as outras pagam já no 5º.") +
              "<p class='nota-casa'><em>Os botões abaixo calculam pelo nível inteiro. Para a Sentinela, role com a % da coluna \"Talentos (metade do nível)\" da tabela — Shift-clique abre o diálogo, onde se corrige o nível.</em></p>" },
      { nome: "Vontade Inquebrável", level: 10,
        desc: p("**Vontade Inquebrável:** **+4 nas JPM** contra poderes da Força e efeitos mentais. Em troca, a sua **JP congela** neste nível.") },
      { nome: "Caçador da Força", level: 15,
        desc: p("**Caçador da Força:** sente a presença de outros Sensíveis por perto e leva **+2 no primeiro Duelo da Força** de cada confronto (soma ao `1d6 + nível`).") },
      eco("O Rastro e o Véu — a Força que procura, revela e esconde"),
    ],
  },
  {
    nome: "Vidente", classe: "Sensível à Força",
    frase: "o místico dos nexos", base: "Radiestésico",
    intro: "*\"A Força não está em mim. Eu é que estou nela.\"* Nem Jedi nem Sith: puxa a Força do **mundo ao redor** — dos vivos, das raízes, das pedras, dos nexos.",
    exemplos: "As Nightsisters de Dathomir, Bendu, os místicos dos Whills, a velha do vilarejo que sabia que você vinha.",
    restricoes: { weapons: "Pistolas; o sabre de luz, só com penalidade (não é treinado)." },
    habilidades: [
      { nome: "Comunhão", level: 5,
        desc: lista([
          "`5º` **Comunhão:** canaliza a Força dos seres vivos inteligentes **amigáveis ou neutros a 20 m**, ganhando Alcance extra igual à **soma dos bônus de Intelecto** deles — até **1/4** do seu Alcance Diário (deixa de somar o próprio bônus de Intelecto). A **JP congela**.",
          "`10º` a Comunhão alcança **40 m** e o teto sobe para **1/3**; a **BA congela**; passa a ter **30% de atrair descargas elétricas** por perto (a sintonia é involuntária).",
          "`20º` a Comunhão alcança **100 m** e o teto é **metade** do Alcance (podendo passar de 200%); a atração de descargas sobe para **80%** — estar perto dele numa tempestade ou num tiroteio é perigoso para todos.",
        ]) +
        citacao("**Troca:** o Vidente **não é treinado** — não usa sabre de luz sem penalidade e seu **teto de Grandeza é a 8ª** (os feitos de 9ª–10ª exigem uma disciplina formal que ele não tem).") },
      eco("A Vida e a Presciência — a Força que corre nos vivos e no tempo"),
    ],
  },
  {
    nome: "Artífice", classe: "Sensível à Força",
    frase: "o engenheiro de kyber", base: "Hipercientista",
    intro:
      "*\"Vocês a chamam de mística porque nunca a mediram.\"*\n\n" +
      "Para o Artífice, a Força não é fé — é **fenômeno**. Ele procura as bases da doutrina na ciência, e encontra: o cristal **kyber** responde, focaliza, amplifica. O que o Jedi faz com anos de meditação, ele faz com uma lente bem cortada. E funciona.\n\n" +
      "O preço é que **a Força dele atrofia**. Quem extrai poder da pedra deixa de exercitar o próprio, e a explicação corrói a intuição: quanto mais ele entende a Força, menos ela lhe obedece.",
    exemplos: "*Darth Plagueis; os antigos Zeffo, que moviam as próprias máquinas com a Força; e o que Galen Erso teria sido se tivesse nascido com o dom.*",
    extra:
      "**O que ele constrói.** O sabre é só o começo. Kyber move hipermotores, alimenta canhões, guarda memória em holocrons — e um superlaser é kyber industrial. O Artífice é quem pega a pedra que canta e a transforma em ferramenta. Por isso o Império o procura, a Ordem o despreza, e ele é a única pessoa viva capaz de desmontar a arma que vai destruir o planeta.\n\n" +
      "**O Sangramento dele é laboratório, não ódio** (ver [[SW-SDN-Sabre-e-Cristais]]). Um Sith tradicional acha isso uma blasfêmia — e talvez tenha razão.",
    restricoes: { magic_items: "Aparatos defensivos (A Lente); do 10º, qualquer um com teste de Operar Máquinas." },
    habilidades: [
      { nome: "A Lente", level: 5,
        desc: p("**A Lente:** usa **aparatos defensivos** livremente. Sua **Grandeza trava na 3ª** e o **Alcance passa a avançar uma linha da tabela a cada dois níveis** — no 5º você tem 9%, e só no 7º sobe para 13%, que é o valor do 6º.") +
              lista([
                "`9º` a Grandeza destrava na **4ª**.",
                "`13º` a Grandeza destrava na **5ª** e volta a subir de dois em dois — **teto prático na 8ª**.",
              ]) +
              p("**Troca:** **BA e JP congelam no 5º** e nunca mais progridem. É a única Senda que paga as duas colunas de uma vez — e, por isso, **a única em que o Caminho não decide nada**. Ele está tão fora do eixo místico que nem a escolha moral chega ao corpo dele.") },
      { nome: "Mãos de Oficina", level: 10, flags: doLivro("Operar Máquinas"),
        desc: p("**Mãos de Oficina:** opera **qualquer** aparato com um teste de Operar Máquinas, como um Técnico de **metade** dos seus níveis. A Grandeza trava de novo.") +
              "<p class='nota-casa'><em>Os botões abaixo calculam pelo nível inteiro. Para o Artífice, role como Técnico de metade do nível — Shift-clique abre o diálogo, onde se corrige o nível.</em></p>" },
      { nome: "Carne Compensada", level: 17,
        desc: p("**Carne Compensada:** você nunca alcança a plenitude mental do 16º, e o corpo cobre a lacuna: **+2 PV por nível** daí em diante.") },
      { nome: "O Preço da Lente", level: 20,
        desc: p("**O Preço da Lente:** usa aparatos como um Técnico de **nível igual** e os **cria** como um Técnico de metade. Mas você já desaprendeu a sentir: **todo** poder da Força passa a exigir uma rolagem percentual para funcionar.") },
      eco("A Matéria e o Cristal — a Força que lê, molda e desperta objetos, e a que mexe na engenharia dos próprios poderes"),
    ],
  },
];

/**
 * O texto que abre a ficha de cada Senda do Sensível: quem congela o quê.
 * Vem de "O Caminho decide o que você perde", em SW-SUP-Forca.
 */
export const CAMINHO_E_CORPO =
  p("Toda especialização de Mentálico no *Space Dragon* paga com as **duas colunas de corpo**: a Base de Ataque e a Jogada de Proteção param de progredir, uma no 5º nível e a outra no 10º. É o preço fixo de mergulhar na Força, e vale para as quatro Sendas.") +
  p("**Qual das duas congela primeiro é o seu Caminho que diz:**") +
  lista([
    "**Luz** — congela a **Base de Ataque** no 5º: a serenidade abre mão da agressão.",
    "**Sombra** — congela a **Jogada de Proteção** no 5º: a paixão abre mão do autocontrole.",
    "**Sem Caminho** — você escolhe, e a escolha é definitiva.",
  ]) +
  p("A outra congela no **10º**. Repare que as duas Sendas de base nativa já nascem com o Caminho \"natural\" delas: o **Consular** (o Psiquista do livro) congela a BA primeiro, perfil de Luz; o **Vidente** (o Radiestésico) congela a JP primeiro, perfil de Sombra. Seguir o outro Caminho inverte a ordem, e o personagem sente a diferença no corpo antes de sentir na alma.") +
  citacao("**O Guardião é a exceção.** Ele trocou a Base de Ataque pela de um Veterano, então não tem essa moeda para gastar: congela sempre a **JP**, nos dois Caminhos. E a **Sentinela** paga tarde — só no 10º —, que é o preço de não se comprometer com nenhum extremo.") +
  citacao("✅ **As Sendas NÃO têm restrição de Afiliação.** Nas classes mundanas, cada especialização é presa a Leal/Neutro/Rebelde. Aqui isso é **removido de propósito**: no Sensível, a diferenciação moral já é feita pelo **Caminho** (Luz, Sombra ou Cinza) e pela **Corrupção** — e o Caminho **tem peso mecânico**: é ele que decide qual coluna do corpo congela primeiro.");
