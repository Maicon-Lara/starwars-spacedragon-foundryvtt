# Changelog

## 1.9.0 — as câmaras conversam com o Combate Tático

As câmaras entraram na 1.7.0 como camada sobre o capítulo 10. Elas são, na
verdade, para rodar **junto do Combate Tático** — e agora rodam.

**A avaria que ninguém reparou vira obra.** O crítico do dial causa uma avaria:
dano de cena, que o Engenheiro conserta em combate. A câmara é dano
**estrutural**, e só a obra conserta. Os dois se encontram no **fim da rodada**:

| Avaria do crítico | Vira |
|---|---|
| Motor | Sala de Máquinas danificada |
| Armas | Arsenal danificado |
| Sensores | Ponte de Comando danificada |

O **Leme** e a **Tripulação** ficam de fora de propósito — saem sozinhos no fim
da rodada, porque são sustos e não estrago.

O combate não trava no meio: a nave continua lutando com a penalidade da avaria,
e a conta chega depois, em créditos e semanas. O posto de **Engenharia** ganha
urgência de verdade — reparar naquela rodada é o que evita a obra.

O journal e a nota do cofre ganharam a tabela dessa conversa, com o aviso da
espiral: Sensores viram Ponte, e a Ponte danificada tira o +2 **e** impede a
nave de operar armas.

### Corrigido de passagem

- **O cartão do fim da rodada saía com o texto do modo Livro mesmo no Tático.**
  Faltavam parênteses no ternário, e a concatenação vinha antes.
- No teste, o ator que dispara as ações tinha `update()` vazio: nada do que a
  ficha gravava nele era verificável, e o mock não tinha `manobra` nem
  `evasiva`. Dois testes que eu julgava ativos nunca chegavam a rodar.

## 1.8.1 — a tabela das câmaras no journal, gerada da mesma fonte

A tabela de **custo, prazo e efeito** das doze câmaras só existia nas dicas dos
botões da ficha, que servem para lembrar e são péssimas para consultar. Agora há
uma página **A Nave como Base de Operações**, no journal *Naves & Veículos*, com:

- a **tabela das doze** — câmara, obra em créditos, prazo e o que ela dá;
- as **três que a ficha aplica sozinha**, e o que cada uma bloqueia quando não
  está operacional;
- o **salto hiperespacial**, com as três etapas e como cada uma falha;
- as **obras e o Técnico** — o desconto da Aptidão Tecnológica, a mão de obra
  própria durante o salto, o reparo a 25% e metade do prazo, e a tranca do
  Arsenal.

A página é **gerada** de `module/camaras.js`, o mesmo arquivo que a ficha lê.
Mudar o custo de uma câmara muda a ficha e a tabela de uma vez — elas não podem
divergir. Para isso as câmaras saíram de `nave-modelo.js`, que só carrega dentro
do Foundry, e foram para um arquivo de dado puro que o build também lê.

## 1.8.0 — os testes que são da nave, e os Aposentos sem a multa

**Dois testes passam a rolar na ficha da nave**, porque o instrumento e a
dificuldade são dela, mesmo que quem role seja um personagem:

- **Salto hiperespacial** — os três testes de Pilotar, na ordem: *Distância*,
  *Direção* e *Execução*. Saem de uma vez, porque a sequência não pode ser
  abortada no meio, e cada um falha de um jeito próprio: os dois primeiros põem
  a nave no lugar errado, o terceiro cancela o salto. Rola-se na **Ponte**, e
  sem ela operacional o botão recusa.
- **Forçar o Arsenal** — as trancas digitais impõem **−20%** em Sabotagem a quem
  invade. Sem Arsenal operacional não há tranca: o material está solto pela nave.

**Os Aposentos perderam a penalidade.** A regra da casa passa a ser só o ganho:
eles dão a recuperação de PV e de Alcance da Força em viagem, e sem eles a
viagem não recupera nada — sem −1 em teste nenhum.

## 1.7.1 — os efeitos das câmaras, completos

A 1.7.0 tirou os textos de um DOCX cuja extração vinha com parágrafos cortados
no meio, e seis efeitos perderam a parte final. Os custos e os prazos das doze
estavam certos; o texto é que estava pela metade.

O que voltou:

- **Aposentos** — a penalidade de −1 nos testes de atributo tem gatilho: vale
  **após 3 dias de viagem contínua**, por fadiga. Sem isso, parecia valer sempre.
- **Sala de Máquinas** — é também onde se gerenciam os tanques de combustível.
- **Laboratório** — sem ele ainda se criam aparatos, **alugando oficina
  externa**; não é um bloqueio absoluto.
- **Saída de Emergência** — a fuga acontece **durante a contagem regressiva**
  para a explosão, que é de 1 segundo por PV do total.
- **Arsenal** e **Depósito** — os detalhes de uso que faltavam.

## 1.7.0 — a nave como base de operações: as 12 câmaras

Do guia *Espaçonaves como Base de Operações*, regra da casa sobre a Tabela
T10-2. A ficha ganha uma seção **Câmaras** com as doze, e cada uma gira num
clique entre **instalada**, **danificada** e **ausente**.

Três delas a ficha **lê de verdade**, em vez de só listar:

- **Ponte de Comando** — dá **+2 nos ataques** da nave, o Computador Balístico,
  e o modificador aparece na conta do cartão. Sem ela operacional, *"a nave não
  pode ser pilotada nem operar armas"*: o botão de atirar recusa e diz por quê.
- **Sala de Máquinas** — é dela que se repara em combate; sem ela, o botão
  *reparar* recusa.
- **Saída de Emergência** — é por ela que a tripulação abandona a nave a 0 PV.

As outras nove trazem o efeito escrito na dica do botão, junto do custo da obra
e do prazo, com a lembrança de que reparar custa **25% e leva metade do tempo** —
a mesma régua do conserto de aparatos do capítulo 8.

As naves nascem com as doze instaladas, que é o estado de uma nave que voa; quem
tiver perdido alguma marca na ficha.

## 1.6.4 — modo escuro na ficha de nave, e os títulos de volta ao negrito

- **Modo escuro.** A ficha tem paleta própria e não acompanhava sozinha um
  módulo de modo escuro — daí as caixas pretas de campo sobre a página clara.
  Agora há uma opção *Ficha de nave: claro ou escuro*, com **automático**,
  **sempre claro** e **sempre escuro**. No automático ela segue os dois sinais
  que existem na prática: a classe `theme-dark` no corpo da página, que o
  Foundry v13 e a maioria desses módulos usam, e a preferência do sistema
  operacional.
- A paleta escura é a do Space Dragon **invertida** — o que era fundo vira
  tinta. Como todas as regras da ficha usam as mesmas cinco variáveis, trocar os
  valores repinta tudo; o verde-água e o vermelho de perigo são clareados, para
  manter contraste no escuro.
- É opção **de cliente**: tema é preferência de quem olha, não da mesa.
- **Os títulos de seção voltaram ao negrito.**

## 1.6.3 — os campos deixam de ficar escuros com o modo escuro ligado

- **Os campos de digitação** (nome, fórmula de PV, postos, armas) declaram fundo,
  texto e borda próprios. Um módulo de modo escuro, ou o tema escuro do próprio
  Foundry, repinta `input` e `select` do mundo inteiro, e a ficha ficava com
  caixas pretas sobre a página clara do Space Dragon. Agora ela fica igual com o
  tema claro ou escuro. O `color-scheme: light` faz o navegador desenhar a seta
  do select e o cursor na variante clara.
- **Os títulos de seção saíram do negrito.** A cor continua sendo o azul escuro
  da paleta, que é o que os tornou legíveis na 1.6.2.
- O nome da nave e os valores do perfil seguem sem caixa, e só mostram a borda
  ao passar o mouse.

## 1.6.2 — a ficha de nave voltou a ser legível

A 1.5.2 trocou os fundos e as bordas para a paleta do Space Dragon, mas deixou o
**texto herdando cor do sistema Old Dragon 2** — que pinta os títulos de seção em
carmim e os valores em dourado, cores feitas para o fundo pergaminho dele. Sobre
o fundo claro e azulado do Space Dragon, e com `opacity` por cima, o texto sumia:
*Estado da rodada*, *Manobra*, *Armamento* e *Postos* ficavam num rosa quase
invisível, e os valores de BA, CP, JP e Velocidade, num bege apagado.

Agora **todo texto da ficha tem cor explícita**, e o que era `opacity` sobre cor
herdada virou uma cor de verdade (`--nave-secundario`, derivada da tinta da
paleta). Mudaram, por isso:

- os títulos de seção, que passam a ser o azul escuro da paleta, em negrito;
- os valores do perfil e os rótulos deles;
- as fichas de avaria e a Trava, que apagadas a 55% de opacidade não se liam;
- os botões do dial — a manobra branca não tinha cor própria e herdava a do
  sistema;
- os botões comuns (aplicar tipo, rolar, iniciativa, esquivar…), que ficavam
  cinza sobre cinza.

As opacidades que sobraram são as intencionais: a manobra bloqueada, que é
riscada de propósito, e os valores não editáveis.

## 1.6.1 — a licença e a OGL vão dentro do zip

Conformidade de licença. Nenhuma mudança de regra, conteúdo ou ficha.

- O módulo **não declarava licença nenhuma** — nem arquivo, nem campo no
  manifesto. Derivando do *Space Dragon*, que é CC BY-SA 3.0, ele é obrigado ao
  *share-alike*: agora está declarado.
- `OGL.txt` com a Open Game License 1.0a e a seção 15 atualizada, e `LICENSE.md`
  com o que é Open Game Content, o que é marca de terceiro e o que fica fora.
- Os dois **entram no zip**, que é o que se instala — a cláusula 10 fala de cada
  cópia distribuída, não do repositório.
- Fica dito com clareza o que nenhuma licença de jogo resolve: **Star Wars é da
  Lucasfilm**, não está licenciado e não poderia estar. O que a CC BY-SA cobre é
  a camada de regras.
- O **X-Wing Miniatures Game** da FFG passa a ser creditado como origem do
  desenho do Combate Tático de Naves — a ideia do dial, da manobra planejada em
  segredo e dos dados de defesa. Nenhum texto, valor ou componente daquele jogo
  é reproduzido.

## 1.6.0 — a mesa escolhe a regra de combate de nave

A ficha de Nave passa a atender **duas** regras, e a escolha é uma opção de
mundo em *Configurações do Módulo → Regras de combate de naves*.

- **Tático** (padrão) é o que já existia: o Combate Tático do Suplemento,
  desenhado sobre o **X-Wing Miniatures Game** da FFG — dial de manobras,
  manobra planejada em segredo, Sobrecarga e dados de defesa que cancelam
  dados de dano inteiros. **Não mudou nada nele.**
- **Livro** é o **§10.6** do *Livro Básico Aprimorado*: sem grid e sem dial. O
  disparo soma o BA da nave **e** o BA à distância de quem opera a arma; a
  defesa é o CP, e só nave **pequena** troca o CP por uma **JP**, com a manobra
  evasiva, uma vez a cada 5 rodadas. A JP não tem atributo: o modificador vem
  de um teste de pilotagem, pela **T10-5**. O 20 natural rola a T10-6 de
  acertos críticos (dano ×2 nos 1–4, ataque extra no 5, pane no 6) e o 1
  natural rola a de **falhas críticas**, que o Tático não tem — inclusive o
  fogo amigo. A 0 PV a nave se destrói sem teste, em 1 segundo por PV do total.

No modo Livro a ficha esconde o dial, o planejar/revelar e a Sobrecarga, que
são do X-Wing e não existem no capítulo 10; *iniciativa* vira **ordem de ação**
(o valor é a própria ação, e o menor age primeiro) e *esquivar* vira **manobra
evasiva**.

É opção de mundo, e não por nave, porque combate é coletivo: com metade das
naves cancelando dados em d6 e a outra metade trocando o CP por uma JP, a cena
não fecha.

O teste da nave passou a cobrir as tabelas do livro — os seis acertos e as seis
falhas críticas, as seis faixas da T10-5 e o limite de tamanho da evasiva.

## 1.5.2 — a ficha de nave rola, guarda o tipo e veste as cores do Space Dragon

Três coisas, e duas delas eram o **mesmo defeito**: o template abria um
`<form>`, mas em ApplicationV2 a raiz da ficha já é um `<form>`, e o parser
HTML descarta um `<form>` aninhado. A tag desaparecia, e levava duas coisas:

- **A ficha não rolava.** A classe `.starwars-sd-nave`, que carrega o layout,
  ia embora com a tag. Agora é um `<div>`, e a rolagem vem de um
  `overflow-y: auto` no `.window-content` — que faltava de todo jeito.
- **O tipo de nave não era guardado.** Sem o `<form>` do template, os campos
  ficavam sem dono e o submit não gravava `system.tipo`; ao reabrir, a ficha
  voltava para "Caça", que é o `initial` do schema. Os números continuavam
  certos porque quem grava BA, CP, JP e Velocidade é o botão *aplicar tipo*,
  por `actor.update()`, e não o formulário.
- **As cores agora são as do Space Dragon.** A ficha usa as mesmas cinco
  variáveis do tema daquele módulo (`--sd-fundo`, `--sd-caixa`, `--sd-barra`,
  `--sd-tinta`, `--sd-brilho`), cada uma com o valor de fallback, para ficar
  igual com o tema ligado ou desligado. Saíram os azuis e vermelhos próprios;
  o vermelho de perigo virou o do OD2, numa variável só.

A correção de 26/09 deste arquivo, que pôs `overflow-y`, `min-height: 0` e
`max-height: 100%` no container, estava certa — e não funcionava porque o
container não existia no DOM. Ela foi mantida, e o `.window-content` ficou com
`overflow: hidden` para não aparecerem duas barras.

O teste da nave passou a conferir que o template não abre `<form>` e que o
seletor marca o tipo salvo, para o defeito não voltar sem avisar.

## 1.5.0 — a camada da Força enxuga, e o nome do livro volta

Este módulo passa a ser o **único** de Star Wars para Space Dragon: o
`sw-spacedragon-nativo`, que fazia o mesmo sobre o Custom System Builder,
foi arquivado.

- **Núcleo e módulos** — página nova no journal *A Força*, antes de tudo o
  mais: só a tabela, o Alcance, a Grandeza-Limite, conhecidos x
  desconhecidos, o Duelo da Força, a Senda e a Corrupção são regra. A
  Tentação, o Eco da Senda, o Caminho Cinza e as Formas de Sabre são
  **opcionais**, e a classe funciona inteira sem eles.
- **A Tentação** perdeu uma opção e um julgamento. O *Arrancar* saiu (era
  o *Insistir* com aritmética a mais) e o critério "rolagem decisiva"
  também: a trava de 1x/cena e 3x/dia já impede o abuso, sem o Mestre ter
  de decidir no meio da cena se aquela rolagem contava.
- **Eco da Senda** — os Domínios agora são **listas fechadas** de poderes,
  por Grandeza. O poder está na lista ou não está; acabou a arbitragem
  antes da rolagem.
- **O Artífice ganhou Eco**, que faltava: *A Matéria e o Cristal*.
- **Crédito Tecnológico** virou **Aptidão Tecnológica**, que é como a
  Tabela 1-5 do livro chama. O nome antigo era da casa e ambíguo —
  Crédito também é a moeda do jogo. A sigla CT virou AT.

## 1.4.2 — as relíquias das criaturas

- O cofre ganhou a coluna **Relíquias** no roster, e as 15 criaturas que
  carregam alguma entram com as iniciais do livro: o Zork com O e D, o
  Xheniano com O, D e U, o Simihomem só com U.
- Com isso o botão **Gerar** da Ficha de Ameaça passa a funcionar também no
  bestiário de Star Wars: uma relíquia por letra, pela T11-3.
- A conferência do build checa as letras e o total de 15.

## 1.4.1 — exige o Space Dragon 1.16.1, e abre espaço para as relíquias

- A dependência subiu de 1.12.0 para **1.16.1**: é dela que vêm os rótulos do
  Space Dragon na Ficha de Ameaça (Afiliação, Relíquias, Prêmio), o painel de
  atributos e o gerador de relíquias. Com a 1.12 o bestiário abria com os
  rótulos de fantasia.
- O importador passa a ler uma coluna **Relíquias** no roster do cofre, com as
  iniciais O, D e U. Enquanto ela não existir, a criatura entra sem letra e o
  botão "Gerar" diz que ela não carrega nada.
- As colunas do roster passam a ser lidas pelo NOME, e não pela posição: uma
  coluna a mais não desloca as outras.

## 1.4.0 — o bestiário da galáxia

- **46 criaturas** no compêndio novo *Star Wars SD: Bestiário*, lidas do
  roster do cofre: Wampa, Rancor, Nexu, Dianoga, Bantha, Reek, Sarlacc,
  Exogorth, Zillo, Clawdite e o resto do Cap. 11 vestido de Star Wars.
- O nome fica como o cofre escreve — **"Glacioprimata (Wampa)"** —, e acha
  pelos dois lados.
- Cada criatura vem com **os seis atributos, RM e RD** nos flags que o módulo
  Space Dragon lê, e já abre na **Ficha de Ameaça**, com JP e Moral pela regra
  do livro. Os ataques viram **botões de ataque e dano** (63 no total).
- Ataque cujo efeito não é dado de dano — o dreno do Vampiro energético — fica
  sem fórmula de propósito: o botão rolaria um dado que a regra não manda rolar.
- Quatro criaturas não têm ataque para clicar, porque no livro elas não têm:
  Bolha verde, Devorador de mentes, Geleia espacial e Planta carnívora. O que
  elas fazem está escrito na descrição.
- A conferência do build passa a comparar os números do bestiário com o livro.
- A seção **Modelos de PNJ** do journal traz a tabela nova das quatro classes
  como PNJ, do cofre.

## 1.3.0 — a especialização entra na conta

- A tabela de cada especialização e de cada Senda Mandaloriana vai no item
  de classe, e o módulo Space Dragon (1.12.0 ou mais novo) passa a rolar por
  ela. Antes a ficha usava sempre a tabela da classe base:
  - **Sabotador** rolava a Sabotagem do Operativo (35% no 5º), sem o bônus de
    100% menos Escalar; agora são os 51% da tabela. Furtar congela onde a
    tabela manda.
  - **Espião, Assassino, Contrabandista**: Sabotagem, Escalar, Furtividade,
    Furtar e Percepção pela tabela deles. O Espião conta o Crédito
    Tecnológico **dobrado** na Sabotagem (o bônus, não a penalidade).
  - **Mercenário, Caçador de Recompensas, Emissário**: Pilotar, Desarmar e o
    multiplicador de crítico pela tabela deles (Mercenário ×3 já no 5º).
  - **Médico de Campo** congela Operar Máquinas.
  - **Consular, Guardião, Artífice** e o Mandaloriano Sensível: Alcance da
    Força e Grandeza-limite pela tabela deles (Consular 17% e 4ª no 5º). O
    Artífice volta a ganhar +2 PV por nível do 17º em diante.
- O cartão de chat diz de onde veio o número ("nível 5, Sabotador").
- Créditos iniciais atualizados do cofre.

## 1.2.1 — Em ascensão para todo o molde Humano

- Wookiee, Twi'lek, Rodiano, Zabrak, Mon Calamari, Trandoshano e Chiss
  ganham **Em ascensão** (+1 em um atributo à escolha no 4º, 8º, 12º, 16º e
  20º), como o cofre agora diz: as espécies do cenário trocam só o +2/−2
  livre pelos fixos. O Droide já o mantinha, na Chassi Reforçado.
- A página "Os Povos da Galáxia" traz a explicação.

## 1.2.0 — os 17 Poderes do Cenário

- **17 Poderes da Força novos**, marcados ✦ no cofre como criação do cenário:
  Empurrão da Força, Sentir o Perigo, Toque Sombrio, Manto de Escuridão,
  Ocultar-se da Força, Correr com a Força, Salto da Força, Deflexão da Força,
  Coragem, Estrangular, Premonição, Absorver Energia, Drenar Vida ★,
  Tempestade da Força ★, Barreira da Força, Meditação de Batalha e Projeção da
  Força. São 118 no total.
- Não têm Poder Mental nativo: o nome, a Grandeza e a corrente vêm da tabela
  do Suplemento, e o alcance, a duração e o efeito, da nota do Nativo, onde
  estão escritos. O importador para se as duas notas discordarem na Grandeza.
- Journal "A Força" ganha a página **Poderes do Cenário**.

## 1.1.0 — as Formas de Sabre entram na ficha

O sistema não aceita habilidade de classe solta no personagem ("Adicione-as
à classe do personagem"), e as Formas e o Mudar de Guarda estavam só
avulsos — não havia como chegar à ficha sem abrir o item da classe e soltar
dentro dele. Como no Star Dragon, a escolha agora vem embutida:

- **Guardião (Ataru) — Sensível à Força** e as outras seis: a Forma Mestra já
  vem na classe. O **Mudar de Guarda** entra na ficha de todo Guardião.
- **Mandaloriano (Ataru) — Sensível à Força** e as outras seis: a Forma que o
  clã ensina, até o degrau do 10º.
- As variantes apontam para as mesmas habilidades avulsas, sem cópia de texto.
- As Formas avulsas, o Mudar de Guarda e a Origem Filho de Mandalore dizem na
  descrição como somar mais uma: soltando dentro do item da classe (ou da
  espécie) na ficha.

## 1.0.0 — o Suplemento inteiro

As 14 notas do cofre estão no módulo.

- **Equipamentos:** 162 itens — armas corpo a corpo, sabres (com o Sabre
  Sombrio), blasters, granadas e explosivos, vestes, aparelhos, medicina e 52
  aparatos por NT, com o custo e o texto do aparato nativo. O CP das vestes
  entra como bônus CP − 10, e a ficha chega ao CP do livro sozinha. O Soro
  reanimador fica de fora: só existe na edição antiga do livro básico.
- **Ficha de Nave:** tipo de ator próprio que roda o Combate Tático do
  Suplemento — CP de Casco da Tabela 10-1 por tipo, dial único em 60°,
  Sobrecarga, Esquiva antes do dano, crítico com a tabela de avarias, postos
  e iniciativa. O esqueleto veio do Star Dragon; a regra é a do cofre.
- **Bestiário:** journal com o de-para, e o nome nativo de cada criatura é um
  link para a ficha dela no módulo Space Dragon — o cofre manda "não
  reproduzir nada".
- **Seção do Mestre:** journal e oito tabelas roláveis (ganchos, contratos,
  complicações, locais, achados e o PNJ relâmpago em três colunas).
- **Journals novos:** Equipamentos & Créditos, Aparatos e Feitos, Naves &
  Veículos, Bestiário e Seção do Mestre; Resumo das Classes e Nota de
  Estrutura.
- Requer o Space Dragon 1.7.0: é nele que o Tiranossauro e o Tentaculoide
  entraram, e o CP soma o bônus por nível da T4-1.
- Compêndio vazio não é declarado: Bestiário e Macros saíram do module.json,
  e o build confere as duas pontas.

## 0.3.0 — Sabre, Senda Mandaloriana e Ordens

- **Formas de Sabre:** as sete, uma habilidade cada com os degraus 5º/10º/20º
  dentro, e o **Mudar de Guarda**, na pasta "Formas de Sabre (Guardião)".
- **Senda Mandaloriana:** quatro classes, "Mandaloriano — Veterano" e as
  outras, que herdam a base, somam o Núcleo (Resol'nare, Treinamento de Clã,
  Sangue de Beskar, Voo de Combate, Lenda do Clã) e a troca da sua classe, com
  o BA e a JP da tabela da Senda. As restrições de equipamento abrem o arsenal
  do clã, senão a ficha proibiria a própria Beskar.
- **Origem Filho de Mandalore:** habilidade avulsa no compêndio de Espécies.
- **Journals:** Sabre de Luz e Cristais Kyber, Ordens e Ranks da Força e A
  Senda Mandaloriana.

## 0.2.0 — Classes, Força, Espécies e Poderes

- **Classes:** Veterano, Operativo, Técnico e Sensível à Força, do 1º ao 20º,
  e as 15 especializações como classes próprias que herdam as habilidades da
  base ("Guardião — Sensível à Força"). O BA e a JP de cada especialização
  saem da tabela dela: o Guardião ataca como Veterano.
- **Chassi por flag:** cada classe diz qual classe do livro ela é, e o módulo
  Space Dragon (1.6.0) dá ao Operativo os botões do Gatuno, ao Sensível a
  barra de alcance mental, e a todos os PV e o dano crítico da tabela certa.
- **Espécies:** os nove povos da galáxia, com 42 habilidades.
- **Poderes da Força:** os 101, em Universal, Luz e Sombra, cada um com os
  números e o texto do Poder Mental que ele é, e um link para o original.
- **Journals:** Criação de Personagem e A Força (Caminho, Cinza, Corrupção,
  Tentação, Eco da Senda).
- O texto vem do cofre por `tools/importar-cofre.mjs`; o build não lê o cofre.

## 0.1.0 — esqueleto

- Estrutura de pastas igual à do Star Dragon: `starwars-sd-module/` (o que vai
  para o Foundry), `tools/` (build, validador, zip, capas), `tools/data/` (um
  arquivo por nota do cofre) e `packs-src/` (a fonte versionada dos compêndios).
- Oito compêndios declarados, ainda vazios: Espécies, Classes, Equipamentos,
  Poderes da Força, Bestiário, Referência do Mestre, Macros e Tabelas.
- Depende do módulo Space Dragon (1.5.0 ou mais nova), que traz as regras.
