# Changelog

## 1.44.0 — a nave aguenta cinco pessoas ao mesmo tempo

A ficha gravava a flag **inteira** a cada clique. Com uma pessoa operando a
nave, isso nunca falha. Com cinco — que é o ponto do §7 — atropela:

```
A lê a nave              B lê a nave (a mesma)
A grava com o posto
                         B grava com a energia, usando a nave que leu ANTES
                         → o posto que A gravou desaparece
```

E quem perdeu a alteração **não vê erro nenhum**: vê o campo voltar ao que era e
conclui que a ficha não salvou.

Agora cada clique grava só o caminho que mudou, e o merge é do servidor. Duas
pessoas mexendo em campos diferentes convivem. Um teste simula essa sequência e
falha se as gravações voltarem a se cruzar.

### O foco sobrevive ao redesenho

Toda gravação redesenha a ficha em **todos** os clientes que a têm aberta. Quem
estivesse digitando o nome de um tripulante via o campo ser recriado e perder o
foco no meio da palavra — e numa nave operada por várias pessoas isso acontece o
tempo todo.

A ficha agora guarda qual campo estava em foco e onde o cursor estava, e devolve
depois de redesenhar.

### Sobre as abas

A aba aberta é de **cada cliente**, não da nave: se alguém troca para Câmaras, os
outros continuam onde estavam. Isso já era assim e continua.

### Para os jogadores operarem a nave

O Mestre precisa dar **posse** do ator da nave a quem vai operá-la: botão direito
na nave → *Configurar Permissões* → **Proprietário** para os jogadores. Sem isso
os painéis aparecem, mas os botões não gravam.

## 1.43.0 — as ações de posto viraram botão

Na aba Tripulação, **oito das quinze ações agora se clicam**: Firmar, Correr,
Rajada, Supressão, Forçar o reator, Travar alvo, Interferência e Aguentem
firme. A ficha aplica o efeito, grava o estado e manda um cartão ao chat — o
cartão importa porque quem firmou precisa que os artilheiros saibam do +2, e um
efeito que só aparece na ficha de quem clicou não chega a quem ele beneficia.

As outras sete continuam texto, e isso é escolha: *Ordem* precisa saber **qual**
posto age de novo, *Sangue frio* **qual** dado rerrolar, *Reparar* tem a própria
rolagem. Automatizá-las seria abrir um menu no meio da rodada para perguntar o
que a mesa já decidiu. A diferença está na forma — botão contra texto — e não só
no peso da fonte: um item que parece clicável e não é custa um clique e uma
dúvida toda vez.

**Correr avança o perseguidor em duas marcas**, como o §7 manda. É a regra que
torna a fuga uma decisão: correr aproxima o fim do salto e o fim do perseguidor
ao mesmo tempo. Um botão que dobrasse o movimento sem mexer no relógio daria a
vantagem de graça.

**Forçar o reator** entrega os +2 pontos e rola o 1d6 no chat, com o resultado
dito em palavras — num 1, avaria na Sala de Máquinas, que é justamente a câmara
que permite reparar em combate.

### Fim da rodada

Botão no rodapé do painel. Firmar, Supressão, Interferência, Aguentem firme e a
energia valem *até o fim da rodada*, e sem um lugar para dizer que ela acabou os
efeitos ficam ligados para sempre — o sintoma seria uma nave que nunca sai do
Firmar, sessões depois, sem ninguém ligar a causa.

Ele **não** mexe nos relógios da fuga nem nas câmaras: esses atravessam rodadas,
e é o que os torna relógios.

## 1.42.0 — as três camadas opcionais, e o tanque que nunca aparecia

### O combustível estava invisível

O painel de voo lia o combustível como número solto, e a ficha guarda um objeto
`{atual, maximo, fonte}`. O resultado era `NaN`, virava zero, e **a barra do
tanque nunca apareceu em nave nenhuma** desde que o painel existe.

Nenhum teste pegou porque todos passavam valores montados à mão — eles provavam
que a função sabia formatar um número, não que sabia ler uma nave. Agora um
deles usa a nave de verdade.

### As três camadas do §7

**Energia do reator**, **Controle de avarias** e **Fuga como relógio** aparecem
na aba Tripulação, abaixo dos postos — e **só se a mesa ligar**, nas opções do
módulo. Com as três desligadas, que é o padrão, não aparece nem um cabeçalho.

- **Energia**: os pontos do tamanho (P 2 · M 3 · G 4 · C 6), distribuídos entre
  motores, escudos e armas, com o efeito à vista e a sobra dita como sobra —
  *"sobram 2 de 3"*, porque o número sozinho é ambíguo. Gastar além do reator é
  possível (*Forçar o reator*) e aparece em vermelho.
- **Avarias**: as emergências em curso com as rodadas que **restam**, não a
  rodada em que começaram. Prazo vencido diz a consequência: a câmara fica
  danificada até a obra, que custa 25%.
- **Fuga**: os dois relógios lado a lado, porque a corrida é a informação — ver
  só o próprio progresso não diz se vale continuar fugindo ou virar e lutar.

A regra continua morando num lugar só, e um teste falha se estas telas
reescreverem qualquer tabela.

## 1.41.0 — botão "Nova nave", e a tripulação se edita

### Criar uma nave virou uma ação

Botão **Nova nave** no cabeçalho da aba de Atores. Pergunta o nome e o tipo, e
entrega a nave pronta: ator criado, Ficha de Nave já escolhida, raça e classe
aplicadas na ordem certa e com as habilidades sincronizadas.

Antes eram quatro passos, e nenhum óbvio: criar um ator do tipo *personagem*
(e não "Nave", que não existe mais), trocar a ficha numa engrenagem do
cabeçalho, arrastar a raça do compêndio e **depois** a classe — nessa ordem,
porque o sistema recusa a classe sem raça com uma notificação que some em
segundos.

A ordem importa dentro do criador também: as habilidades de raça entram pelo
sync do sistema, e é a habilidade que carrega o **CP**. Uma nave criada sem esse
passo nasce com CP 10, e o erro só aparece quando alguém leva um tiro.

**Os PV ficam em zero, de propósito.** A T10-1 dá uma fórmula (`1d100`,
`2d1000`) e quem rola é a mesa — o aviso diz qual rolar. Sortear na criação faria
duas naves do mesmo tipo nascerem diferentes sem ninguém ver o dado.

### A tripulação se edita na ficha

Os cinco postos viraram campos. A tripulação troca de vaga no meio do combate —
o piloto assume a artilharia quando o artilheiro cai, alguém corre para a
Engenharia quando a Sala de Máquinas pega fogo — e um painel que só *mostra*
quem está onde obriga a anotar isso fora da ficha, que então passa a mentir.

Com a vaga vazia, o campo sugere quem **pode** ocupá-la («Veterano /
Contrabandista»), e há uma lista com os personagens do mundo. A digitação livre
continua: o posto aceita um NPC sem ficha.

## 1.40.0 — uma ficha de nave, e só

Saíram do módulo, de uma vez:

- o **tipo de ator Nave** e as duas fichas antigas (Tático e Livro)
- o **Combate Tático** inteiro: o dial de manobras, o arco de tiro e o
  movimento no mapa
- o template, o modelo de dados e as opções de mundo que só serviam a eles

São **3.064 linhas** a menos. O jogo de nave agora é o **§10.6**, como as
*Regras Compiladas* definem — e sobra uma ficha só: a **Ficha de Nave (Space
Dragon)**, que se escolhe num ator do tipo **personagem**.

**Se você ainda tem naves no tipo antigo, elas pararam de carregar.** Era o
aviso da 1.39.0. Para recuperá-las: volte para a 1.39.1, rode
`await game.modules.get("starwars-sd").api.converterTodas()`, e atualize de
novo.

Por que o tipo precisava sair, e não podia só ficar quieto: ele aparecia no
diálogo de criar ator, ao lado de Personagem. Escolher "Nave" para fazer uma
nave é a coisa óbvia — e levava à ficha errada, sem nenhum dos painéis novos.
Um atalho que leva ao lugar errado é pior que atalho nenhum.

**O que o Combate Tático levava:** a posição no mapa, o arco de tiro e a
sobrecarga do dial. Quem quiser esse minijogo de posição encontra tudo no
histórico do repositório, até a versão 1.39.1.

## 1.39.1 — o conversor coberto por teste

Sem mudança de comportamento: o registro da API do conversor passou a ter
asserção própria.

A mesa chamou `api.converterTodas()` e recebeu *"Cannot read properties of
undefined"*. Ali a causa era só versão desatualizada — mas o mesmo erro sairia
se o ponto de entrada deixasse de expor a API, e **nenhum teste veria**. Um
conversor perfeito e inalcançável é código morto com teste verde.

Agora há asserção para a API montada, para as três funções expostas e para o
aviso que conta as naves antigas no carregamento.

## 1.39.0 — o conversor das naves antigas

**Leia isto antes da próxima versão.** O tipo de ator `Nave` vai sair do módulo,
e um ator cujo tipo não existe mais **não carrega**: ele some da barra lateral e
não há interface para recuperá-lo. É o que já acontece com as naves criadas pelo
módulo `stardragon`, que enchem o log a cada recarga.

Se você tem naves no tipo antigo, converta **agora**, enquanto ele ainda existe.
No console (F12):

```js
await game.modules.get("starwars-sd").api.converterTodas()
```

Cada nave vira um **personagem** com a Ficha de Nave já selecionada. Chegam
inteiros: o tipo, o CP, a BA, a JP, o tanque, os PV **como estavam** (o 1d1000
daquela nave saiu uma vez e virou história), os postos ocupados e — o que mais
importa — o **estado de cada câmara**, inclusive as danificadas. É o que a mesa
construiu pagando obra em jogo.

**A nave velha não é apagada.** Ela fica para você comparar lado a lado e apagar
quando quiser: apagar aqui transformaria um erro de conversão em perda
definitiva.

**O que o Combate Tático leva embora**, dito nome por nome na saída: a manobra
planejada e o dial, a sobrecarga, a manobra evasiva em curso, o alvo travado, o
relógio de fuga e as armas montadas (reinstale pelo compêndio de Equipamentos).

**O que não se converte sozinho:** a raça e a classe de nave. Elas entram pelo
arrasto, que é o que dispara o cálculo do CP no sistema — e o tipo vem anotado
na ficha para você saber qual arrastar.

## 1.38.1 — a ficha ensina a montar a nave

O sistema recusa em silêncio. Arrastar a **classe antes da raça** produz uma
notificação vermelha no canto que some em segundos, e nada muda na ficha;
arrastar uma **câmara solta**, idem. Quem não viu a notificação conclui que o
item está quebrado.

Isso já tinha um aviso escrito na descrição da classe — e ninguém o leu, porque
para ler a descrição é preciso **abrir** o item, e quem está arrastando não
abriu.

Agora a própria Ficha de Nave mostra os passos enquanto a nave não está pronta:
arraste o tipo, depois a classe de mesmo nome, e as câmaras não se arrastam
soltas. O aviso da recusa aparece só enquanto ela pode acontecer, e o guia
inteiro **some quando a nave fica montada** — um aviso permanente vira
decoração e deixa de ser lido justamente quando importa.

## 1.38.0 — a nave na ficha de personagem

Quatro painéis novos na Ficha de Nave, todos tirados das *Regras Compiladas*.

### O mínimo para voar, e o orçamento do tamanho

A nave **não nasce mais com as doze câmaras**. De fábrica vêm só as duas que o
texto veta dispensar: **Ponte de Comando** (sem ela a nave não é pilotada nem
opera armas) e **Sala de Máquinas** (motores, gerador, tanques). São 320.000 CR
dos 1.035.000 das doze.

Sobre elas, o tamanho dá um orçamento de câmaras livres — **Pequena 0, Média 2,
Gigantesca 4, Colossal 6**. É o que faz o caça ser cabine e motor enquanto a
nave-mãe nasce cidade, e o que deixa duas espaçonaves particulares do mesmo tipo
saírem diferentes.

O orçamento **avisa e não trava**: a nave comprada usada, a de enredo e a
reforma paga em jogo são justamente as naves interessantes.

### Painel de Voo

CP, BA, JP e movimento numa linha; abaixo, a avaria e o tanque.

A **penalidade por avaria** sai calculada: 5% a cada 10% dos PV perdidos, em
bloco fechado — 200 PV com 70 de dano dá −15%, como no exemplo do livro. E a
ficha mostra o que sobra da pilotagem, com o piso de 5% que o livro garante
mesmo na nave destruída.

O **BA mostra as duas parcelas** (`+18 (16 +2 balístico)`), porque o +2 do
Computador Balístico vem da Ponte e some com ela.

### As câmaras decidem o que a nave consegue fazer

Só **instalada** é operacional: a danificada ocupa lugar no orçamento e não
funciona. A Ponte avariada cala pilotagem, armas, escudos **e** o balístico, os
quatro juntos — é duro de propósito, e é o que faz a Engenharia valer o lugar.

Os avisos aparecem no painel, do mais grave ao menos. Entre eles, o que ninguém
quer descobrir tarde: *sem Saída de Emergência, a 0 PV a nave explode e ninguém
escapa*.

Consertar uma câmara danificada custa **25% da obra**; construir uma ausente
custa a obra inteira.

### Tripulação: os cinco postos do §7

**Leme, Artilharia, Engenharia, Sensores e Comando**, cada um com as opções da
rodada. As opções aparecem mesmo com o posto vazio — é lendo o que ele faz que
alguém decide ocupá-lo.

A Engenharia aparece **travada** quando a Sala de Máquinas não está operacional,
com o motivo escrito: melhor saber antes do que no meio do combate.

O que a ficha aplica sozinha vem em negrito; o que fica para a mesa vem leve.

### Salto hiperespacial

As três etapas — Distância, Direção, Execução — com a regra que inverte o
esperado: **só a terceira falha cancela**. As duas primeiras levam a nave para o
lugar errado, e a sequência não pode ser abortada no meio. Falhar a Distância
não interrompe nada: a nave salta, some do mapa e reaparece onde o Mestre
quiser.

## 1.37.2 — o pergaminho, os botões e a aba

**O painel de Pontos de Força ficava amarelo-neon sobre papel.** O tema tem dois
conjuntos de variáveis — os `--sd-*` da ficha e os `--sw-*` do livro — e só os
primeiros cediam ao modo pergaminho forçado. Com o Foundry em tema escuro e o
pergaminho ligado, o fundo vinha claro e a cor de destaque continuava a do
crawl, que é a que pinta título e números do painel. Agora os dois modos
forçados devolvem as onze variáveis, e um teste falha se um deles esquecer
qualquer uma.

**Os botões "gastar" e "+1" se sobrepunham** na coluna estreita. A regra da
barra lateral autorizava o botão a encolher abaixo do próprio rótulo, e a
palavra saía por baixo do botão vizinho. Agora eles descem para a linha de
baixo em vez de se espremerem.

**A aba aberta se marca pelo filete, não pela cor** — a mudança vem do Space
Dragon 1.25.0 e vale para as duas mesas.

**As classes de nave avisam a ordem do arrasto.** O sistema recusa classe em
ator sem raça, e a recusa é só uma notificação no canto: quem arrasta a classe
primeiro conclui que o item está quebrado. A descrição agora diz para arrastar
a raça antes.

## 1.37.1 — a Ficha de Nave não estava rodando nada

A 1.37.0 registrava a ficha, trocava os rótulos das abas, e **paravam aí**: o
seletor de cômodos e a ocultação de XP/alinhamento/idiomas não apareciam.

A cadeia da ficha é `ActorSheet → OD2CharacterSheet → SDCharacterSheet` —
Application **V1**, como o próprio Foundry avisa no console. E numa ficha V1 o
`_onRender` **não é chamado**: quem roda é `activateListeners`. Eu tinha posto
todo o trabalho no `_onRender` e deixado só o renomear das abas no
`activateListeners`. Os 25 testes passavam porque nenhum deles perguntava *qual
dos dois caminhos a mesa usa*.

Agora os dois chamam o mesmo preparador, e há uma asserção que falha se um
deles fizer menos que o outro.

**Nada mais a esconder, e isso foi medido.** Eu tinha anotado "esconder
escalada, voo e natação". Varrendo a ficha aberta, esses campos não existem: há
um bloco de movimento só, com um valor derivado — e movimento a nave tem, vindo
do tipo pela raça. A lista do que falta esconder agora está vazia, e foi o
console que a fechou.

## 1.37.0 — os cômodos da nave se marcam na ficha

Na aba **Câmaras** da Ficha de Nave, cada cômodo da T10-2 agora tem um seletor
de três estados: **instalada**, **danificada** e **ausente**. Um clique gira o
estado, na ordem em que a coisa acontece na mesa: constrói, estraga, arranca.

**Por que um seletor, e não uma lista que se monta.** A aba de classe do sistema
não aceita habilidades avulsas — só mostra as que a classe traz. Então as oito
classes de nave trazem os doze cômodos, todas elas, e a nave não se monta
*tirando* cômodos da lista: ela se monta *dizendo quais existem*.

**O padrão é ausente.** Uma nave recém-criada nasce sem cômodo nenhum marcado.
Se o padrão fosse "instalada", toda nave nova viria com hospital, laboratório e
corredor de acoplagem só porque a classe os lista — e o Mestre teria de
desmarcar nove em vez de marcar três.

O estado é do **ator**, não da classe: duas naves do mesmo tipo têm os mesmos
doze cômodos possíveis e configurações diferentes, como deve ser.

### A ficha perde o que a nave não tem

**XP, alinhamento e idiomas** saem da ficha. Nave não ganha experiência — é
comprada, reformada e perdida; não tem alinhamento; e não fala idioma nenhum,
porque quem fala é a tripulação, e ela tem a ficha dela.

Os campos são achados pelo **caminho do schema** (`system.current_xp`,
`system.details.alignment`, `system.details.languages`), e não pelo rótulo: o
rótulo muda quando a mesa troca de idioma, o caminho não.

**O freio que importa:** esconder um campo significa esconder o bloquinho que o
embrulha, para o rótulo não ficar órfão — e subir no DOM atrás desse bloquinho é
justamente como se apaga uma ficha por acidente. A subida para em dois níveis,
nunca encosta na casca da ficha e desiste assim que o contêiner guarda outro
campo. No pior caso o rótulo fica sozinho; a ficha não abre em branco.

Ainda aparecem os campos de movimento que não são o normal (escalada, voo,
natação). Eles não estão no schema do ator — vêm do item de raça — e um seletor
por palpite é como se esconde meia ficha. Ficam para quando houver uma ficha
aberta para medir.


## 1.27.0 — a nave montada peça a peça

Os **equipamentos adicionais (T10-4)** e as **câmaras (T10-2)** entram no
compêndio de Equipamentos como itens, nas pastas *Nave — Equipamentos
adicionais* e *Nave — Câmaras*. **Arrastar para a ficha da nave instala.**

Cada item traz o que a mesa precisa para decidir antes de arrastar: a descrição
do livro, o efeito mecânico, em que tamanhos de nave cabe (T10-4) e o custo de
obra com o prazo (T10-2).

**O item não substitui o schema — ele o liga.** A regra (o que cabe em que
tamanho, os conflitos, os efeitos, os estados da câmara) já mora no modelo e tem
teste. Transformá-la numa lista de itens embutidos significaria reescrever tudo
isso e perder a cobertura; do jeito que ficou, a regra continua num lugar só e a
mesa ganha o arrasto.

O que o arrasto recusa, e por quê:

| Situação | O que acontece |
|---|---|
| Equipamento que não cabe no tamanho | avisa **antes** de instalar, dizendo o tamanho |
| Equipamento já instalado | avisa, não duplica |
| Câmara já instalada | avisa, não duplica |
| Câmara **danificada** | manda **reparar** (25% do valor, metade do prazo), não reinstalar |
| Item comum (uma espada) | ignora em silêncio — a nave não tem inventário |

A câmara danificada é o caso que mais importa: reinstalar por arrasto pareceria
consertar de graça e apagaria a avaria que o combate causou, sem ninguém notar.

As duas decisões viraram funções puras — `decidirInstalacao` e `decidirCamara` —
testadas sem Foundry, nos 15 equipamentos × 4 tamanhos e nas 12 câmaras × 3
estados.

**Correção junto:** `nave-ficha.js` passou a declarar `const ID`, que o código do
arrasto usava e o arquivo nunca teve — `ReferenceError` dentro de `try/catch`,
ou seja, o arrasto falharia calado.

## 1.26.0 — o ⟳ do Mestre, e a ficha que encolhe

**Pontos de Força: um botão de recarregar, só para o Mestre.** A reserva já
voltava sozinha ao subir de nível (o flag guarda o nível em que ela vale), mas
nada na tela dizia que isso aconteceu. O ⟳ torna explícito, serve para corrigir
contagem errada, e manda um cartão ao chat.

Ele é **só do Mestre**, e não por hierarquia: "não recarrega por descanso nem
por sessão" é o que dá peso ao gasto. Um botão de reenchar na ficha do jogador
desfaz a regra inteira — a reserva deixa de ser do nível e passa a ser infinita.
Para o Mestre ele serve ao caso que a mesa tem de verdade: o nível que subiu
depois de alguém já ter gasto, e a contagem que saiu errada.

**A ficha de nave encolhe sem quebrar.** O perfil tático nasceu com seis
colunas, e seis colunas numa janela estreita não são seis campos pequenos: são
seis rótulos ilegíveis sobre seis números cortados. Agora ele passa a 3 colunas
abaixo de 520px de ficha, a 2 abaixo de 380px, e o cabeçalho empilha abaixo de
300px — com a grade de energia, o retrato e a barra de combustível cedendo
junto.

**Por container query, não media query.** `@media (max-width: …)` responde ao
tamanho da TELA, e a ficha do Foundry é uma janela que o jogador arrasta: a tela
não muda quando ele a encolhe. O layout pareceria responsivo no navegador
redimensionado e não funcionaria na mesa. `tools/teste-responsivo.mjs` recusa
`@media` de largura nestas folhas, exige que todo `@container` tenha um
`container-name` declarado (erro que de fato cometi ao escrever isto, e que é
silencioso: a regra fica letra morta) e cobra versão estreita de todo grid de
três ou mais colunas.

## 1.25.0 — a declaração sai daqui e vai para o livro base

O painel de declarar a Ordem de Ação **saiu deste módulo**. Ele agora é do
módulo **Space Dragon**, na **aba de ataques** da ficha, e exige a versão
**1.17.0** dele.

**Por quê.** A T7-2 é regra do livro base, não de Star Wars. Tê-la aqui
significava duas implementações da mesma conta em dois módulos da mesma cadeia —
e o módulo base já tinha a dele, na janela do Mestre. O custo dessa duplicação
apareceu na prática: uma tarde inteira arrumando o CSS de um painel que não
estava quebrado, porque o painel torto na tela era de outro módulo.

Como ficou a divisão:

| | Onde |
|---|---|
| Escolher a ação e rolar o valor | módulo **Space Dragon**, aba de ataques |
| Janela de ordem do Mestre | módulo **Space Dragon**, pela macro |
| **Inverter a fila** (menor primeiro) | **aqui**, opção *Ordem de Ação* |
| Duração da rodada ao Mestre | **aqui**, a cada virada |
| Ordem de ação da nave | **aqui**, nos dois modos da ficha de Nave |

A inversão fica neste módulo de propósito: o base declara, em `ordem.js`, que
não mexe no rastreador de combate do Foundry — reescrever a iniciativa de um
sistema alheio quebraria todo módulo de combate instalado. Quem quer a fila na
ordem certa liga a opção aqui e assume esse atrito de olhos abertos.

**O que saiu do código:** o painel e as contas da T7-2 que ele usava
(`ACOES_DE_ORDEM`, `valorDaOrdem`, `dadoDaArma`) e o CSS `.starwars-sd-ordem`.
O que ficou em `ordem-de-acao.js` é só a ordem e a duração — o que o base não
faz.

## 1.24.0 — o painel da Ordem de Ação numa linha

O campo do dado e o botão *declarar* ficavam empilhados e espremidos: a ficha do
OD2 dá `width: 100%` e altura fixa a todo `input` e `button`, e a nossa regra
original não vencia essa. O painel agora é um flex com `!important` nos três
pontos em que a ficha do sistema impunha largura e altura — o campo cresce, o
botão fica do tamanho do rótulo.

**Sobre a numeração.** Esta versão foi publicada primeiro sob a tag `v1.23.1`,
com o manifest já dizendo 1.24.0. A tag foi corrigida para `v1.24.0` depois: o
Foundry decide atualizar pela versão do manifest, não pela tag, e deixar as duas
em desacordo faria o próximo lançamento passar batido.

**Nada a fazer quanto à iniciativa.** O módulo *Old Dragon 2: Qualidade de Vida*
não toca em iniciativa — não há `CONFIG.Combat`, `_sortCombatants` nem
`rollInitiative` no código dele. Quem configura a fórmula é o sistema
`olddragon2e`, e a nossa Ordem de Ação não disputa isso: escreve o valor direto
no tracker. O atrito possível continua sendo outro módulo *substituindo* a classe
de Combat, e para isso o aviso da 1.21.1 segue de pé.

## 1.23.0 — os críticos aplicados na ficha

Os cinco resultados de crítico que mudam um **número** da ficha vêm prontos como
**efeitos arrastáveis**, no compêndio novo **SW: Efeitos dos Críticos**, pasta
*Críticos*:

| Efeito | Vem de | O que faz |
|---|---|---|
| Ferimento — movimentação à metade | T7-4, 2 | divide o **Movimento normal** por 2 |
| Ferimento — −2 nos ataques | T7-4, 3 | −2 em **Ataques** |
| Vestes avariadas — −2 no CP | T7-4, 4 | −2 no **CP** |
| Desequilíbrio — −1 no CP | T7-5, 2 | −1 no **CP**, **1 rodada**, e some sozinho |
| Queda — −1 no CP | T7-5, 6 | −1 no **CP** |

A 1.22.0 trouxe as tabelas, que **dizem** o que aconteceu. Elas não aplicavam
nada: o "−2 no CP" ficava num cartão de chat, e a mesa precisava lembrar dele
até o ferimento sarar. O Mestre agora arrasta o efeito para a ficha de quem
levou o crítico, e o CP, o ataque ou o movimento mudam sozinhos — com a origem
("Space Dragon — T7-4, resultado 4") à vista na ficha.

**Pede o módulo *Old Dragon 2: Qualidade de Vida***, que é o gerenciador de
efeitos que faz a conta. Ele **não** é dependência declarada: quem não o tem vê
itens de descrição no compêndio, e as tabelas roláveis continuam valendo
sozinhas.

**O que NÃO foi inventado.** Os ferimentos da T7-4 ficaram **permanentes**
porque o livro não diz quando saram — pôr "até o próximo descanso" por conta
própria seria escrever regra no lugar do autor. Quem os tira é o Mestre. Só o
desequilíbrio da T7-5 tem prazo (1 rodada), e ele se apaga ao expirar.

**O movimento é dividido num campo só.** O efeito divide o *Movimento normal*;
a corrida fica de fora, porque dividir os dois campos arriscaria cortá-la a um
quarto se a ficha já derivar a corrida do movimento.

**As de nave não entram:** as chaves do gerenciador são de personagem e de
monstro, e a nave é ator de outro módulo — a ficha de Nave já rola a T10-6 e
aplica a avaria sozinha.

**O teste reimplementa o descarte do QdV.** O `normalizeEffect` dele joga fora,
*em silêncio*, todo modificador com chave ou modo inválido: um efeito escrito
`movement` em vez de `movement.normal` entra na ficha, aparece na lista e não
faz nada. `tools/teste-efeitos-criticos.mjs` copia o descarte e a aplicação dele
e mede o número que a ficha mostraria — CP 14 → 12, ataque +3 → +1, movimento 10
→ 5 — em vez de conferir só a forma do documento.

## 1.22.0 — os críticos do Space Dragon

As tabelas **T7-4** (acertos) e **T7-5** (falhas) do Cap. 7 entraram no
compêndio como **tabelas roláveis**, junto das duas de nave (T10-6) — quatro no
total, na pasta *Combate*.

**Por que tabela rolável, e não automação.** O crítico de personagem é rolado
pela ficha do **sistema**, e há módulos de automação de combate que já o tratam
— o *Old Dragon 2: Qualidade de Vida* tem as regras do LB1 e do LB2. Disputar
aquele momento significaria dois módulos reagindo ao mesmo 20 natural, com dois
cartões e duas regras. Uma RollTable não disputa nada: fica no compêndio, e
quem rola é a mesa.

Para quem usa aquele módulo: deixe a opção de crítico dele em **"perguntar
sempre"** e role estas no lugar — assim o crítico segue o Space Dragon, como o
resto da mesa.

**A regra é maior que a tabela**, e está na descrição de cada uma: no 20 natural
o dano **já é ×2** ("ou um número maior caso o atacante seja um Cosmonauta"), e
a tabela é *opcional*, por cima disso. No 1 natural o erro é automático,
*independentemente de BA ou CP*.

**De onde elas vieram.** Nem o cofre nem o DOCX do livro as têm inteiras: a
transcrição não traz a tabela, e o DOCX perde duas das seis linhas da T7-4 —
mais um caso de tabela diagramada em caixa de texto. Saíram do PDF.

A **Referência rápida** ganhou a seção com as duas tabelas e o aviso sobre a
convivência com módulos de automação.

## 1.21.1 — conviver com outros módulos

A Ordem de Ação da 1.21.0 inverte a ordenação do Combat Tracker estendendo a
classe de `Combat`. Isso convive bem com quem faz o mesmo — mas **um módulo que
SUBSTITUA** a classe, em vez de estendê-la, apaga a nossa, e a ordenação volta a
ser decrescente.

O risco não é a falha: é o **silêncio** dela. A lista continua parecendo uma
lista, só que na ordem exatamente contrária à regra — a mesa levaria sessões
para notar.

Agora o módulo confere no `ready`, quando todos já carregaram, se a nossa classe
ainda está na cadeia. Se não estiver, avisa de forma permanente, dizendo o que
aconteceu e as duas saídas: desligar o outro módulo, ou desligar a Ordem de Ação
para não jogar com a ordem invertida sem perceber.

**O sistema `olddragon2e` não é o problema.** Ele substitui
`CONFIG.Item.documentClass` e configura `CONFIG.Combat.initiative` (a fórmula),
mas **não** mexe na classe de Combat nem na ordenação. O atrito possível é com
módulos de terceiros.

**E uma confirmação:** o campo `mod_destreza`, que o painel usa para o
`10 − Destreza`, existe mesmo no `OD2CharacterDataModel` do sistema. Era um
palpite na 1.21.0, e agora está verificado.

## 1.21.0 — a Ordem de Ação, automatizada

A mesa passa a poder rodar a **Ordem de Ação do Space Dragon** (§7.5 e §10.6) no
lugar da iniciativa — para personagens **e** naves, com o módulo fazendo a parte
que custava.

**A diferença é de natureza.** Numa iniciativa comum rola-se uma vez e a ordem
vale o combate. Na Ordem de Ação o valor vem da **ação escolhida**, muda a cada
rodada, e **o menor age primeiro**: o canhão de 1d12 sai depois da pistola de
1d4, porque o valor *é* o dano. Escolher a ação é escolher a iniciativa.

**O que a automação resolve** — as três coisas que tornavam a regra cara à mão:

1. **A conta de cada jogador.** Um painel na barra lateral da ficha: escolha a
   ação, informe o dado da arma (ou a Grandeza, ou o NT), e o valor vai para o
   Combat Tracker. O `10 − Destreza` sai sozinho.
2. **A ordem no tracker.** O Foundry ordena do maior para o menor; a regra pede
   o contrário. Uma subclasse de `Combat` inverte a ordenação — e **só** com a
   opção ligada, porque isso vale para todos os combates do mundo.
3. **A duração da rodada.** No Space Dragon a rodada **não dura 6 segundos**:
   dura **o dobro do maior valor**, e é esse número que governa tudo o que vale
   "por uma rodada". O Mestre recebe a conta pronta a cada virada, junto de quem
   empatou — porque empate é **ação simultânea**, e a lista ordenada esconde isso.

**Unificada.** Com a opção ligada, a ficha de nave usa a Ordem de Ação nos
**dois** modos. Antes a mesa podia ter três regras convivendo — OD2 nos
personagens, `1d20+Destreza` no Tático, Ordem de Ação no Livro —, e o §10.6
prevê justamente que as duas escalas rodem na mesma cena.

**Opção de mundo, desligada por padrão, e com reload.** Ela inverte o Combat
Tracker, e num mundo com Ekhoria e Star Wars na mesma instalação a troca tem de
ser escolha consciente. Desligada, o módulo não muda a ordenação de nada.

**Não toca em `CONFIG.Combat.initiative`.** O painel *escreve* o valor no
tracker, como a ficha de nave já fazia. Quem não usa o painel continua com a
iniciativa do sistema.

A **Referência rápida** ganhou a seção, com a tabela das quatro ações e o aviso
sobre a duração variável da rodada.

## 1.20.0 — a folha de consulta

Uma nota nova no cofre e um compêndio novo aqui: **Referência rápida** — onde
está cada regra, e os números que não se quer procurar no meio do turno.

Ela não repete capítulo nenhum. É o **endereço**: para cada situação de mesa —
criar personagem, rolar os dados, combate, a Força, equipamento e carga, naves,
exploração, Mestre — diz se a regra é do livro ou daqui, e traz junto os números
que a mesa mais procura: o Alcance da Força, a carga por porte, a JP da nave, o
dado do combustível, os −2 por 20 pontos da arma montada.

O **Combate Tático fica de fora** de propósito: é módulo opcional, com dial e
hexes, e misturá-lo faria a folha descrever duas mesas diferentes. Ele tem a
própria página de regras.

No compêndio ela vem **em primeiro**, antes dos capítulos: um atalho no fim da
lista não é atalho.

**O mapa antigo foi atualizado.** A tabela *Onde está cada regra no livro
básico*, em "Usando este suplemento", estava defasada — citava só as T10-1 e
T10-2 do capítulo de naves. Agora cobre o Cap. 10 inteiro (T10-3 a T10-8), mais
a carga dos itens e o combate entre gente e nave.

**Auditoria de cobertura.** Cruzei as 113 seções do cofre com o que o importador
leva para o módulo. O resultado: espécies, poderes e especializações **não** são
páginas de journal — viram **itens** (9 raças, 118 poderes, 37 classes, 58
habilidades), e por isso apareciam como "ausentes" numa contagem ingênua. Fora
isso, nada do cofre estava fora do módulo.

## 1.19.0 — o resto do capítulo 10

Auditoria do Cap. 10 inteiro, seção por seção, contra o que o cenário tinha.
Faltavam **quatro** coisas, e uma delas era regra de combate.

**§10.3 — Fontes de energia e combustível (T10-3).** O cenário dizia em três
lugares que manobra evasiva, movimentação dupla e salto "gastam combustível" —
e nunca dizia **quanto**. O livro não dá tabela de consumo, e dá algo melhor: a
**autonomia** da fonte escolhe o dado (baixa **d6**, média **d4**, alta **d2**) e
a **ação** escolhe quantos, de 1 a 3. Role e desconte em pontos percentuais.

As quatro fontes entraram com raridade, autonomia e custo por tamanho — e o
custo é **por ponto percentual**, então encher uma nave média de combustível
líquido custa 100.000 créditos. A ficha ganhou barra de tanque, seletor de fonte
e um botão que rola o gasto ou abastece.

**Quando gente e nave se enfrentam.** Era a lacuna mais séria, porque é regra de
combate usada toda vez que um PJ atira numa nave ou leva tiro de uma. Pessoas
podem atacar com armas comuns, contra o CP alto, e granadas forçam **JP da
nave**. No sentido inverso, a regra se inverte de propósito — *"a ficção
científica retrô é sobre exploradores que desviam de lasers"*: os alvos fazem
**JPR** e quem passa reduz o dano à metade, mas **a cada 20 pontos no ataque
levam −2 na JPR**. Um ataque de 37 dá −2; de 41, −4.

**§10.7 — Veículos (T10-7).** Oito veículos terrestres, aquáticos e aéreos, com
as mesmas regras de pilotagem e combate — e **as armas da T10-4 valem neles**. A
escala de tamanho é **outra** (Pequeno/Médio/Grande/Enorme), e o teste impede
que ela se misture com a das naves. O **Tanque de guerra** tem BA +20 e CP 30:
mais BA que um Cruzador, o que explica por que não se enfrenta um AT-AT de
frente.

**§10.8 — Estações espaciais (T10-8).** Serviços e preços: estadia, hangar,
manutenção e **reparo a 1.000 créditos por PV**. Esse último número tem efeito de
campanha — recuperar 200 PV custa 200.000, mais do que muitas naves valem, e é o
que empurra o grupo a consertar em campo com o Técnico e a Sala de Máquinas.

**Sobre armamento padrão:** a T10-1 **não tem coluna de armas**. Nenhuma nave vem
armada pela tabela; as armas são todas da T10-4. Os Disparadores laser são "a
arma mais comum em espaçonaves" e cabem em qualquer tamanho, mas por hábito, e
não por regra — então continuam nascendo desinstalados.

## 1.18.0 — os equipamentos adicionais de nave (T10-4)

A **Tabela 10-4** do livro nunca tinha entrado no cenário — e, pior, parte dela
já estava aqui **no lugar errado**.

**O erro que isto corrige.** O cenário tinha as câmaras (T10-2) e não tinha os
equipamentos (T10-4), e a diferença entre as duas coisas se perdeu: o
**Computador Balístico**, o **piloto automático** e o **acelerador
hiperespacial** tinham virado efeito fixo da Ponte de Comando. Toda nave com
Ponte ganhava o +2 de ataque de graça.

No livro eles são **instalações**: caras, opcionais, feitas por cientistas
especializados — e cada uma só cabe em certos tamanhos de nave.

**A matriz de tamanhos é regra, e muda a mesa.** Um **caça não leva acelerador
hiperespacial**: é a regra por trás de um esquadrão precisar de nave-mãe para
sair do sistema. Um **colosso não leva defletor de raios** nem propulsores a
jato. E o **Escudo de Força não cabe em nave pequena**, o que mantém o caça
frágil. A ficha só oferece o que o tamanho admite, e recusa o resto.

**Os quinze equipamentos**, com os efeitos que a ficha aplica sozinha:

- **Computador balístico** +2 no ataque · **Escudo de força** +10 no CP
- **Propulsores a jato** +50% de movimento · **Defletores** 25% de redirecionar
- **Acelerador hiperespacial** habilita o salto — sem ele, o botão recusa
- **Piloto automático**, sucesso garantido fora de combate
- E as quatro armas prontas: **Disparadores** 2d10, **Canhões**, **Metralhadora**
  4×1d10, **Mísseis** 4d10

**Retrocompatível.** O Computador Balístico **nasce instalado**: ele era de
graça até aqui, e uma nave já criada não pode perder o +2 porque a regra foi
corrigida. Os outros catorze nascem desligados.

**O conflito fica visível.** Uma marca que não cabe no tamanho — porque a nave
mudou de tipo depois de equipada — **não é apagada em silêncio**: ela deixa de
valer e a ficha avisa, para quem for conferir enxergar o conflito.

O capítulo de Naves ganhou a tabela inteira, no cofre e no compêndio.

## 1.17.0 — a carga dos itens

Nenhum personagem ficava sobrecarregado, e a causa era que **todos os 146 itens
tinham carga zero**.

**Os dois campos.** O sistema `olddragon2e` guarda `weight_in_grams` (o peso
real) e `weight_in_load` (a **carga**, que é o que entra no limite do
personagem). O build preenchia só o primeiro. O efeito na mesa é silencioso e
total: a regra de carga existe, a ficha a calcula, e o resultado é sempre zero.

**E não bastava converter o peso**, porque não é a mesma grandeza. No *Space
Dragon* a carga é peso, com os limites leve/média/pesada vindos da Força e
penalidade de −1 m, −2 m e imobilidade (§6.3.3). No Old Dragon 2 é um número de
**espaços** — e é por isso que o guia de conversão de Francisco Martellini traz
uma tabela só para ela, a **5-1**: arma pequena 1, média 2, grande 3; vestes
leves 1, médias 2, trajes 3; munição, anel de laser, potencializador e escudo de
energia não entram no limite.

**O porte, que o livro tem e o cofre não.** A Tabela 5-1 classifica por porte
(P/M/G), que o *SD* define em §5 — mas essa coluna não veio para as tabelas do
cofre, e a tabela de armas do livro **não é extraível**: tanto a transcrição
quanto o DOCX devolvem sete linhas, porque ela está diagramada em caixas de
texto, o mesmo problema da T10-5.

Então o porte é **derivado do peso**, com a régua declarada em
`tools/data/carga.mjs` e calibrada nas cinco armas que o livro entrega com as
duas informações — Zarabatana P 0,5 kg, Porrete M 1 kg, Rifle laser M 2 kg,
Rifle de plasma e de projéteis M 4 kg. A régua acerta as cinco. É uma
**aproximação declarada**, e não a tabela do livro: onde a mesa discordar, vale o
livro, e a exceção se registra pelo nome em `PORTE_A_MAO`.

Distribuição nos 146 itens: **67 com carga 0, 15 com 1, 37 com 2, 27 com 3.**

**Um bug no caminho, que o teste agora pega.** A primeira versão dava carga 0 a
toda arma pequena, porque o cofre escreve o decimal com vírgula — "0,5" — e
`Number("0,5")` devolve `NaN`. O sintoma era não existir **um único** item com
carga 1, e é essa a asserção central do teste novo: se uma faixa fica vazia, a
régua está quebrada, qualquer que seja a causa.

O capítulo de Equipamentos ganhou a seção **A carga dos itens**, com a tabela, a
régua e o limite por Força — no cofre e no compêndio.

## 1.16.6 — os painéis do módulo Space Dragon

O painel **Desativar Robôs** ficava ilegível: fundo claro, e os nomes das
categorias em cinza-escuro por cima.

**Era um esquecimento, não um caso novo.** A medição da 1.16.4 já tinha
apontado `div.spacedragon-testes` na lista de fundos claros, eu documentei os
sete no CHANGELOG — e cobri seis no CSS. Também faltava o `code` dos textos de
regra.

**E há uma causa estrutural por trás.** O tema do vizinho pinta `.sd-rolar` — o
nome clicável de cada linha — com `color: var(--sd-barra)`. Mas `--sd-barra` é
*também* o fundo das barras de seção, onde o texto por cima é branco fixo, e por
isso ela teve de ficar escura no nosso tema. A mesma variável serve a dois
papéis opostos, e num tema escuro não há valor que atenda aos dois: o painel
precisou ser tratado à parte.

Agora ele usa o dourado do letreiro — fundo a 8%, barra lateral, e o número-alvo
em destaque, que é o que a mesa procura na linha.

**A lista medida virou teste.** Os sete elementos que a medição apontou estão
numa constante em `teste-estilo.mjs`, e cada um precisa aparecer no CSS da
camada escura. Esquecer de cobrir um passa a quebrar o teste, em vez da ficha de
alguém — que é exatamente o que aconteceu aqui.

## 1.16.5 — os valores calculados voltam a aparecer

A 1.16.4 escureceu o fundo dos campos e, com isso, **apagou metade dos números
da ficha**: os modificadores de atributo, a Base do CP, a BA, as três JP, o
limiar de Danos Mortais, o Próximo Nível e o Movimento derivado ficaram em
branco.

**A causa.** A ficha tem dois tipos de campo: os que se digitam e os
**calculados**, que são `input` desabilitado. Num input desabilitado o Chrome
pinta o texto com **`-webkit-text-fill-color`**, que ignora `color` — então
escurecer o fundo sem tratar essa propriedade deixou o texto na cor antiga,
escura sobre escuro.

O sintoma denunciava a causa, e vale registrar: os campos **editáveis**
continuavam mostrando o valor (XP, PV, os atributos), e só os **calculados**
sumiam. Não era contraste geral; era uma propriedade específica de campo
desabilitado.

O teste ganhou a trava: se a camada escurece o fundo de `input`, tem de tratar
`-webkit-text-fill-color` — inclusive em `:disabled`. É o tipo de erro que o
build nunca acusa, porque só aparece na tela.

## 1.16.4 — os fundos que nenhuma variável alcançava

O diagnóstico das três versões anteriores estava **invertido**, e medir a ficha
mostrou isso: o problema nunca foi texto escuro. Era texto **claro sobre fundo
claro**, em áreas que o tema do módulo Space Dragon não cobre.

Ele pinta três containers (`.sidebar`, `.header`, `.main`) e os campos, tudo por
variável — e é por isso que trocar `--sd-*` resolveu os rótulos. O que sobrou
tem a cor **fixada em hexadecimal**, no sistema ou na folha dele, e variável
nenhuma alcança:

| elemento | fundo | o que é |
|---|---|---|
| `ol.item-list` | `#ffffff` | a lista de habilidades e poderes |
| `div.editor` | `#ffffff` | o editor de texto rico |
| `.character-race` / `.character-class` | `#e0ddca` | os campos ao lado do nome |
| `option` | `#dad8cc` | as opções dos seletores |
| `input.system-*` | `rgba(204,211,240,.55)` | o azul-lavanda, sem variável |
| `tr` | branco a 20% | a zebra das tabelas |

Os campos de Raça e Classe, aliás, **não eram `input`**: são `div.character-race`
com um `a.item-edit` dentro. A tentativa da 1.16.3 tratou o filho e não o fundo
do pai, e por isso não mudou nada.

**O `!important` voltou, e com razão.** Contra uma cor fixa não há seletor curto
que ganhe na contagem — é a mesma conclusão a que a folha do módulo Space Dragon
chegou. O teste deixou de proibi-lo e passou a vigiar o que de fato quebra: a
**profundidade** do seletor. Um nome de componente (`ol.item-list`) sobrevive a
uma remodelagem de layout; uma cadeia de cinco descendentes não. O limite agora
é dois níveis depois do escopo.

## 1.16.3 — os três últimos pontos de contraste

Fecha o que a 1.16.1 abriu ao pôr fundo escuro numa ficha que o tema do módulo
Space Dragon sempre desenhou clara. Os três casos saíram de uma **ficha real**,
com o console do navegador listando todo elemento de texto com luminância
baixa — e o resultado foi menor e mais específico do que a inspeção visual
sugeria.

**Os botões do nosso painel de Pontos de Força** estavam em `rgb(0, 0, 0)`.
Eles herdavam a cor de botão do Foundry, e o painel vive na ficha do sistema,
que no tema do livro tem fundo escuro. O componente é nosso, então as cores
dele passam a ser nossas em vez de depender do tema de quem o hospeda.

**Os campos Raça e Classe** são `input` desabilitado, esmaecido com uma cor
pensada para fundo claro. Corrigido por seletor de **elemento** — `input`,
`select`, `textarea` —, que não é caminho interno do sistema e não quebra
quando ele mudar.

**O losango `.diamond`**, que o sistema põe no carmim `#D72240`, ficava quase
preto sobre o espaço. É uma classe curta e estável, e não um daqueles caminhos
de cinco níveis que a folha do módulo Space Dragon documenta ter copiado e
tido de desfazer: cobri-la custa uma linha e não cria dívida contra o sistema.

**O que NÃO precisou de correção.** Os títulos das habilidades pareciam
apagados numa captura de tela, e não estavam: medidos na ficha, vêm em
`rgb(217, 214, 204)` com opacidade 1 — a cor clara do livro, que a correção
pelas variáveis do Foundry, na 1.16.2, já tinha resolvido. A diferença de tom
entre o título e o corpo do texto, mais a compressão da imagem, fizeram parecer
problema. Medir custou dois comandos no console e evitou escrever seletores do
sistema para consertar o que já funcionava.

## 1.16.2 — o painel de Pontos de Força sai do esconderijo, e o escuro fica legível

Duas correções do que a 1.16.1 deixou passar, ambas vistas numa ficha de verdade.

**O painel de Pontos de Força estava escondido numa aba.** Ele era injetado
dentro de `[data-tab='spells']`, a aba de poderes — e numa ficha cuja aba
inicial é *Ataques*, o painel simplesmente não existia para o jogador. Agora vai
na **barra lateral**, abaixo das Jogadas de Proteção.

A lateral é o lugar certo por conteúdo, e não só por espaço livre: ela já reúne
os atributos e as três JP, que são os recursos permanentes do personagem, e
Pontos de Força é um deles. Fica visível em **qualquer aba**, que é o que o uso
em mesa pede — gasta-se um ponto no meio de um teste, não ao consultar a lista
de poderes. A cadeia de seletores desce do mais específico ao mais genérico e
termina no próprio elemento da ficha: uma mudança de layout do sistema degrada o
lugar do painel, mas nunca o faz sumir.

**O modo escuro deixava os rótulos ilegíveis.** O tema do módulo Space Dragon é
sempre claro (`--sd-fundo: #eef0f8`), e ao pôr o fundo do espaço atrás dele a
1.16.1 quebrou o que ele nunca precisou cobrir: os rótulos pequenos do sistema —
"Nome", "Movimento", "Base", "M. DES", os nomes dos atributos, as abas inativas
— são cinza-escuro, que sobre pergaminho se lê e sobre `#0B0E14` não.

A correção é pelas **variáveis de texto do Foundry**, e não pelos seletores do
sistema: elas são da plataforma, valem para qualquer sistema e qualquer versão
dele. Copiar os caminhos internos do sistema é o que quebra quando ele muda — e
o teste agora barra exatamente isso, junto de qualquer `!important` nesta
camada, que seria sinal de disputa em vez de troca de variável.

## 1.16.1 — a paleta do livro também na ficha de personagem

A 1.13.0 vestiu os journals e a ficha de nave, mas a **ficha de personagem**
continuou com a paleta do Space Dragon. Ela é do sistema `olddragon2e`, não
deste módulo, e repintá-la por fora era o risco que a folha de estilo já
avisava: "dois temas brigando na mesma janela é o que o Star Dragon e o Space
Dragon tiveram de desembaraçar na 1.5.0".

**A saída foi não reescrever nada.** O módulo Space Dragon já tem a camada que
cobre a ficha do sistema — e ela fez o trabalho difícil: o sistema pinta o mesmo
carmim em vinte e três seletores longos, e a folha do vizinho os cobre com
`!important`, concentrando tudo em **cinco variáveis**. Esta versão só troca as
cinco cores pela paleta do livro, e a maquinaria dele faz o resto.

A opção nova é *Paleta do livro nas fichas do sistema*. É `client` (quem olha
decide, como a do vizinho) e **começa desligada**: num mundo misto — Ekhoria e
Star Wars no mesmo servidor — a paleta de um cenário na ficha do outro é erro, e
não estilo.

**Precisa do tema do Space Dragon ligado**, porque as regras que leem essas
variáveis moram na folha dele. Ligar uma sem a outra definiria cinco variáveis
que ninguém lê, então o módulo confere ao ligar e avisa, em vez de deixar a
opção marcada sem efeito.

**Um detalhe que a ficha de nave não tinha.** `--sd-barra` é fundo, e o vizinho
fixa `color: #ffffff !important` em cima dela. Na ficha de nave o amarelo do
letreiro funciona porque lá a cor do texto é nossa; aqui, branco sobre #FFD93B
não se lê. A barra ficou escura nos dois temas — o #2A2E38 que o livro usa no
papel, e o aço no escuro. O teste barra o amarelo nesse campo.

A única mudança de tipografia é o **nome do personagem**, em Orbitron. Medidas,
grades e fontes do corpo ficam com o sistema de propósito: mexer nelas é
persegui-lo a cada versão, e a ficha de personagem tem grade apertada.

## 1.16.0 — a tripulação na ficha

As regras de tripulação que a 1.15.0 escreveu agora **rodam**. O que a ficha
faz sozinha, e o que ela deixa para a mesa de propósito.

**Os postos.** Cada um dos cinco ganhou um seletor com as três opções e um
botão que executa. *Firmar*, *Correr*, *Rajada*, *Supressão*, *Forçar o
reator*, *Travar*, *Interferência* e *Aguentem firme* a ficha aplica; **Ordem**
e **Sangue frio** saem como texto no cartão, porque a ficha não tem como saber
o que o outro posto ia fazer, nem rerrolar um dado que já saiu no chat.
Automatizar os dois faria a ficha adivinhar a intenção da mesa — e errar.

**E os números entram na rolagem**, que é a parte que não se vê:

- o **+2 de Firmar** soma nas partes do ataque, ao lado da BA e do Computador
  Balístico;
- os **Escudos** sobem o **CP do alvo** antes da comparação;
- os **Motores** somam ao modificador da **JP** na manobra evasiva dele;
- as **Armas** somam **dado de dano**;
- quem está **suprimido** leva **−2** e **não pode** fazer manobra evasiva — a
  ficha barra o botão;
- a **Interferência** do alvo tira 2 do ataque contra ele.

**Três camadas, três opções de módulo**, e começam **desligadas**: *Camada:
Energia do reator*, *Controle de avarias* e *Fuga como relógio*. A ficha
esconde o painel inteiro de quem não ligou, em vez de mostrá-lo vazio — ela já
é cheia, e painel morto custa mais atenção do que vale.

**Energia** mostra os pontos do reator, quanto sobra, e o efeito em uma linha
("+4 JP · +1 dado de dano"). Repartir mais do que o reator deu é barrado, e o
número fica vermelho. **Forçar o reator** dá +2 e rola 1d6: no 1, a Sala de
Máquinas pega avaria — datada, para o prazo começar a contar.

**Controle de avarias** lista as emergências com o prazo correndo e a câmara
onde alguém precisa estar. A avaria passou a ser **datada** quando surge; sem
combate ativo não há relógio, pelo mesmo critério que a evasiva já usava.

**Fuga** põe os dois relógios lado a lado — as três etapas do salto e as três
marcas do perseguidor. Escolher *Correr* avança o perseguidor em 2
automaticamente, se a camada estiver ligada.

**O Fim da Rodada** apaga tudo o que vale "até o fim da rodada", a partir de
uma lista única (`LIMPA_NO_FIM_DA_RODADA`). Estar numa constante é o que evita
esquecer um campo novo — um +4 de Firmar que nunca sai é pior do que o bônus
não existir, porque ninguém percebe.

**Retrocompatível.** Todos os campos foram ACRESCENTADOS, nenhum alterado:
`avarias` continua booleano e o prazo mora num campo paralelo, porque trocar o
tipo quebraria toda nave já criada.

`tools/teste-tripulacao.mjs` (em `npm run validar`) cobre as regras e a ponte
até a rolagem: o que não se automatiza, o efeito diferente por modo, o prazo, o
empate da fuga, e **o que a rodada apaga**. Quatro sabotagens verificadas.

## 1.15.0 — naves consolidadas, e a tripulação com o que fazer

**As regras do livro sobre nave estão num capítulo só.** *Naves & Combate
Espacial* reúne o que era três coisas: os oito tipos e as câmaras (Cap. 10), o
combate espacial do §10.6, e agora a tripulação. O Combate Tático **não** entrou
— ele não é do livro, é criação da casa sobre o X-Wing Miniatures, e tem crédito
próprio.

**O problema que isto resolve.** O Combate Tático é um jogo de posição, e
posição só rende decisão quando cada jogador tem o próprio token. Com o grupo
numa nave só, um jogador escolhe a manobra no dial e os outros assistem.

O conserto não foi um dial melhor nem um terceiro modo de combate: o §10.6 **já
é** a regra do grupo numa nave — o livro diz que no turno da nave "as ações de
todos em seu interior são realizadas", e que quem agiu com a nave não age de
novo. Faltava dizer *o que* cada um faz.

E o Modo Tripulação estava no **módulo errado**: vivia no Combate Tático, o
dogfight em hexes, exatamente onde não funciona. Mudou para o capítulo de
Naves, apoiado no §10.6; no Tático ficou um ponteiro, para não haver duas
versões dos postos.

**Os cinco postos ganharam opções**, em vez de uma ação fixa cada:

- **Leme** — manobrar, *firmar* (+4 na JP e +2 para os artilheiros, mas a nave
  não se move) ou *correr* (dobro do movimento, perde a ação).
- **Artilharia** — tiro certeiro, *rajada* (−5 no ataque, +1 dado de dano) ou
  *supressão* (sem dano; o alvo leva −2 e não pode evadir).
- **Engenharia** — reparar, distribuir energia ou *forçar o reator* (+2 pontos,
  e num 1 em 1d6 a Sala de Máquinas pega avaria).
- **Sensores** — travar alvo, varredura (revela qual câmara do inimigo está
  avariada) ou interferência.
- **Comando** — ordem (um posto age duas vezes), sangue frio (rerrola um dado)
  ou *aguentem firme* (cancela uma penalidade de avaria por uma rodada).

**Três camadas opcionais**, cada uma ligável sozinha:

- **Energia.** O reator dá pontos por tamanho (2/3/4/6) que Engenharia reparte
  entre Motores, Escudos e Armas. As três saídas usam mecânica que já existia —
  a JP e o CP no §10.6, os dados de esquiva e de dano no Tático. Nenhum número
  novo para decorar.
- **Controle de avarias.** Cada avaria acontece **numa câmara** e vira
  emergência com prazo; resolver custa a ação de quem está lá, e chegar de outro
  ponto da nave gasta uma rodada. É o que dá tarefa a quem não tem posto. O
  mapa avaria→câmara já existia no código (`AVARIA_VIRA_CAMARA`).
- **Fuga como relógio.** O salto já era um relógio de três etapas
  (`ETAPAS_DO_SALTO`); agora o perseguidor tem o dele, que avança duas marcas
  quando a nave sofre avaria ou escolhe *correr*.

**No módulo.** O journal *Naves & Combate Espacial* passou a ter 26 páginas e
cobre o capítulo inteiro mais as duas fichas; o journal *Combate Espacial*
separado, criado na 1.14.0, foi absorvido.

## 1.14.0 — as regras do livro escritas, e duas fichas de nave

O cenário sempre teve **dois** modos de combate de nave, mas só um estava
escrito. O Combate Tático tinha capítulo próprio; o **§10.6 do Módulo Básico**
— que é o modo PADRÃO, o que vale quando a mesa não liga a outra — existia só
como código na ficha.

**O capítulo novo.** `SW-SUP-Combate-Espacial`, no cofre, e o compêndio
*Combate Espacial* aqui. É uma **folha de consulta**, não uma reprodução do
capítulo 10: o `SW-SUP-Usando-o-Basico` declara que as regras nucleares ficam
no livro, e isso continua valendo. O que a página traz é o que se procura no
meio do turno — as cinco ações, a ordem de ação da T10-6, a fórmula do disparo,
a manobra evasiva com o intervalo de 5 rodadas, a T10-5, as duas tabelas de
1d6, o tempo até a explosão e a penalidade por avaria.

**DUAS FICHAS DE NAVE**, uma por regra, em vez de uma que trocava de
comportamento conforme a opção:

- **Nave — Combate Tático**: dial, manobra em segredo, Sobrecarga, dados de
  esquiva.
- **Nave — regras do livro (§10.6)**: CP, manobra evasiva trocando o CP por uma
  JP, ordem de ação pela ação escolhida, crítico e falha em 1d6.

No Foundry a ficha é escolhida por **ator**, e isso dá três coisas que a ficha
única não dava: a mesa pode rodar a frota no Tático e resolver a nave do Mestre
pelo livro no mesmo mundo; o jogador vê **na barra de título** qual regra está
valendo, em vez de ter de abrir as configurações para entender por que o dial
não está lá; e trocar a regra de uma nave não pede reload.

A opção *Regras de combate de nave* continua existindo e agora decide a ficha
**padrão** do mundo — a que abre em toda nave nova. Mudá-la pede reload
(`requiresReload`), porque quem é a padrão se define no registro, em `init`;
mudar **uma** nave não pede nada, é Configurar Ficha.

A classe base `NaveFicha` fica com `MODO = null` e segue a opção de mundo, de
propósito: um ator salvo antes desta versão guarda `NaveFicha` como ficha dele,
e sem esse fallback abriria sempre no Tático — trocando a regra da mesa sem
avisar ninguém.

**Uma correção de regra.** A falha crítica 6 da T10-6 estava incompleta no
módulo: dizia só "−10 no CP", e o livro manda **também** um teste de pilotagem
para retomar o controle.

## 1.13.0 — o estilo do livro no módulo

A folha de estilo dos dois volumes em HTML (`_estilo/estilo-livro.css`, no
cofre) agora veste o módulo: os journals, a ficha de nave, os diálogos e o
painel de Pontos de Força. É a mesma paleta, a mesma tipografia e os mesmos
enfeites — não há duas identidades visuais para manter.

**A paleta.** Trinta variáveis em `styles/livro.css`, todas prefixadas `--sw-`
porque `:root` no Foundry é compartilhado com o sistema e com os outros
módulos. O livro já tinha DUAS paletas — espaço na tela, pergaminho na
impressão —, e elas caem exatamente nos dois temas do Foundry: a de impressão
no tema claro, a de tela no escuro. Nenhuma cor foi inventada.

As sete variáveis `--starwars-sd-*` que pintavam o journal continuam
existindo, com o mesmo papel; o que mudou é que derivam da paleta nova em vez
de serem hexadecimais fixos — e por isso agora acompanham o tema. Uma delas,
`--starwars-sd-titulo`, servia a dois papéis que no livro são cores
diferentes: a cor do `h2` e o fundo do cabeçalho de tabela. Foram separadas, e
o cabeçalho ganhou de volta o **filete** na cor do capítulo.

**As fontes** (Orbitron, Saira Condensed, Source Serif 4) vão embutidas em
`fonts/`, 349 KB, só os subsets `latin` e `latin-ext`. São OFL 1.1, e a
`LICENSE.md` ganhou a seção. Não foi por `@import` do Google Fonts de
propósito: sem internet, um `@import` falha **calado** — a mesa veria Georgia
e não haveria uma linha no console explicando por quê. `tools/baixar-fontes.py`
regera a pasta.

**Os selos e as tarjas.** No cofre, a corrente de um poder é `[U]`, `[L]`,
`[S]`, `[C]` entre crases, e o nível é `5º`. O markdown os entregava como
`<code>`, que o Foundry desenha como trecho de código: cinza, monoespaçado, sem
significado. Agora viram o hexágono colorido e a tarja cortada do livro — 177
selos e 140 tarjas. As expressões são as do build do livro, para que os dois
concordem sobre o que é marcador e o que é código de verdade (`actor.setFlag`
continua código).

A conversão é uma pós-passagem única em `compile()`, e não está em cada
construtor: os selos aparecem em poderes, espécies, classes e journals, por
caminhos diferentes, e passar por todos seria esquecer um. Ela é **campo a
campo** — um ★ no *nome* de um poder não pode virar HTML, porque o Foundry
mostra `name` como texto puro e a tag sairia literal na lista.

`.sw-selo` e `.sw-tarja` têm classe própria, solta, e não dependem de
`.starwars-sd-doc`: as habilidades de classe aparecem na ficha, no cartão de
chat e no tooltip, todos fora do container do journal — presas a ele, as
tarjas sairiam sem estilo justamente na ficha, que é onde se olha o nível.

**As aberturas de capítulo.** Cada um dos dez journals é um capítulo, com o
número grande, o título e a epígrafe sobre a faixa na sua cor. As epígrafes são
as mesmas de `_build/build_livro.py` — não há duas redações para a mesma frase.
A página de abertura esconde o próprio título, que já aparece dentro da faixa.

**A ficha de nave** troca as cinco variáveis de tema pela paleta do livro, e os
títulos e rótulos passam para a condensada; o nome da nave é o único em
Orbitron. O corpo e os números ficam com a fonte da interface de propósito:
uma serif em 11px dentro de campo de digitação perde legibilidade, e a ficha é
para consultar no meio do turno, não para ler.

O **painel de Pontos de Força** só troca o azul fixo pelo dourado da Força. Ele
é injetado na ficha do *sistema*, e continua discreto — nada de fundo nem
tipografia próprios na casa dos outros.

**Duas verificações novas, para falhas que não dão erro.**
`tools/teste-estilo.mjs` (em `npm run validar`) confere que todo `.woff2`
citado existe, que a ordem das folhas está certa, que nenhuma `--sw-*` ficou
órfã, que selo e tarja não voltaram a depender do container e que os dez
capítulos têm cor, faixa e epígrafe. E `make-zip.py` passou a exigir que todo
arquivo referenciado por `url()` nas folhas esteja **no zip** — é o caso do
`templates/` da 1.7.0, mas pior: uma fonte que não foi distribuída não produz
erro nenhum, só uma mesa vendo a fonte errada.

## 1.12.1 — as habilidades do Artífice, revisadas

O Artífice mudou no cofre e o módulo acompanha. As quatro habilidades e a
tabela de progressão vêm da revisão do autor:

- **Mãos de Oficina (10º)** passa a dar **aparatos ofensivos** — ele é a única
  exceção à regra de que só o Técnico os opera — e **conserto/modificação** de
  aparato ou droide até **3º NT** com **teste de Ciência**. Antes era "opera
  qualquer aparato como um Técnico de metade dos níveis".
- **Carne Compensada (17º)** agora dá **+4 PV por nível**, não +2: como o
  Artífice não alcança a plenitude mental do 16º, os PV dele **não congelam**
  com ela — ele segue ganhando os +2 da tabela e recebe os +2 extras.
- **O Preço da Lente (20º)** passa a **criar** aparatos até **5º NT** (o que um
  Técnico faz no 9º), e a rolagem de ativação ficou definida: **d% ≤ Intelecto**.
- **A Lente (5º)** diz explicitamente que o Sensível comum só usa utilitários, e
  que a Grandeza chega à **8ª no 19º** — antes dizia "teto prático na 8ª".

A habilidade perdeu a flag `spacedragon.habilidade = "Operar Máquinas"`: o teste
agora é de **atributo** (1d20 ≤ Ciência), e os botões da % do Técnico estariam
oferecendo a rolagem errada.

**Correção de build.** `progressaoDaTabela` lia os PV da especialização só na
coluna "PV por nível". Essa coluna saiu da tabela do Artífice (o +4 passou a
vir no DV), e o build **continuava passando** — a ficha é que deixaria de dar
os PV do 17º, em silêncio. Agora lê as duas grafias, e `tools/teste-progressao.mjs`
(novo, dentro de `npm run validar`) trava a regressão lendo o pack gerado.

## 1.12.0 — movimento em arco, a mecânica do X-Wing

Opção nova em *Configurações do Módulo → Movimento da nave no mapa*, com dois
valores. O padrão continua **Hex**; quem quiser experimentar liga o **Arco**.

| | Hex (padrão) | Arco |
|---|---|---|
| Espaço | casas, saltos discretos | contínuo, em pixels |
| Curva | anda reto, gira no fim | **descreve o arco**, girando ao longo |
| Encosto | pula para a casa anterior | **para onde encostaria**, no próprio template |
| Cena | precisa ser hex de 20 m | qualquer escala de 20 m por casa |

**A régua curva da caixa é, matematicamente, um arco de círculo:** dado o giro
da manobra e o comprimento do percurso, o raio sai de `R = L / θ`. É isso que
dá a fluidez — a nave deixa de estalar 60° no fim e passa a girar enquanto anda.

**Não é só aparência.** Andar 3 e virar 60° termina num lugar **diferente** de
percorrer um arco de 60° com 3 de comprimento. Por isso é opção, e por isso o
padrão continua sendo o hex: quem tem a regra do Suplemento escrita não é
surpreendido por uma posição final que não bate.

**Os giros continuam os da casa.** O X-Wing usa 45° e 90°, porque a base dele é
quadrada; o Suplemento usa 60° e 120°, porque nasceu no hex. A mecânica é de lá,
a regra é daqui.

O Koiogran continua sendo uma reta com um tonel no fim, e não um arco — é o que
a manobra é.

### Por dentro

- `module/nave-arco.js` — a geometria, testável fora do Foundry
- `module/dial.js` — o dial e a escala saíram de `nave-modelo.js`, que só carrega
  dentro do Foundry, pelo mesmo motivo que as câmaras saíram antes
- `tools/teste-arco.mjs` — reta e ré nos dois eixos, inclinada e curva girando
  ao longo, o Koiogran virando só no fim, e o encosto. Conferido por sabotagem:
  invertendo o eixo Y ou trocando o lado da curva, três testes falham em cada caso

Crédito da mecânica: **X-Wing Miniatures Game**, da Fantasy Flight Games, e a
implementação de referência do **FlyCasual** (MIT), estudada e reescrita — nada
de código ou arte de lá entra aqui.

## 1.11.0 — a reserva de Pontos de Força passa a acompanhar o dado

A progressão era `5 + (nível ÷ 2)`, subindo de um em um nos níveis pares: onze
degraus a decorar, **desencontrados** dos três degraus do dado. A tabela ficava
difícil de ler sem ganhar nada com isso.

Agora são os mesmos três degraus:

| Nível | Reserva | O dado |
|---|---:|---|
| 1º ao 7º | **5 PF** | 1d6 |
| 8º ao 14º | **10 PF** | 2d6, o maior |
| 15º ao 20º | **15 PF** | 3d6, o maior |

**A reserva muda exatamente onde o dado muda** — são a mesma regra vista de dois
lados, e quem sabe o próprio dado sabe a própria reserva. No código, a fórmula é
literalmente `5 × os dados da faixa`, e o teste confere que as duas nunca se
desencontrem.

Subir de faixa passou a ser um evento: do 7º para o 8º a reserva **dobra** e
ganha um dado.

## 1.10.1 — os Pontos de Força, conferidos contra a fonte

A regra veio dos **Pontos de Força** do RPG de Star Wars, no desenho da *Saga
Edition*. Conferida contra ela, três ajustes:

- **Gastar é ação livre**, uma por rodada, e o dado vale por **uma rolagem só**
  — não pela cena. O cartão passa a dizer isso.
- **PNJ comum tem 1 ponto**, não a reserva cheia. A reserva de `5 + (nível ÷ 2)`
  é de **protagonista**: personagem de jogador, ou PNJ que o Mestre marque como
  tal pelo flag `heroico`. Sem isso, o lado do Mestre vira uma planilha de trinta
  reservas, e o que devia ser um instante de heroísmo vira contabilidade.
- A nota do cofre ganhou de onde a regra vem, e **onde a adaptação precisou
  divergir**: na fonte tudo é d20 e maior é melhor, então o dado sempre soma; no
  Space Dragon há três direções, e somar em tudo atrapalharia duas delas.

A **recarga ao subir de nível** ficou confirmada como fiel à fonte — não é
invenção da casa.

## 1.10.0 — Pontos de Força na ficha do personagem

A reserva de heroísmo que todo personagem tem, sensível à Força ou não. A regra
está no cofre, em *Novos Itens/Pontos de Forca.md*; aqui vai o painel.

**Na ficha**, um painel com a reserva em pastilhas, quantos restam, o dado da
faixa e dois botões: **gastar** (rola e desconta) e **+1** (devolve, para
desfazer). O cartão do gasto traz as duas direções lado a lado, que é onde a
mesa erra: **+X** em ataque e JP, **−X** no d20 de um teste de atributo, e o
lembrete de que em d% a escolha entre +X0% e re-rolagem vem **antes** do dado.

**A reserva é do nível inteiro** — não recarrega por descanso nem por sessão. Ao
subir de nível ela zera e volta como `5 + (nível ÷ 2)`, e isso acontece sozinho:
o valor é guardado junto do nível em que vale, então mudar de nível já reenche.

O valor mora num **flag do ator**, não no `system`: a ficha é do sistema
olddragon2e e um módulo não acrescenta campos ao modelo de dados dele. O painel
é injetado, não substitui nada, e sai junto se o módulo for desligado.

### A regra foi refinada antes de virar código

- **"Evitar morte" não fazia o que parecia.** Em Space Dragon, 0 PV já é
  *inconsciente, porém estável* — de graça. O ponto agora compra a única coisa
  que o livro diz não ter salvação: o limiar de **Danos Mortais** da Constituição
  (−5 a −19), onde *"não é feita nenhuma jogada"*.
- **O uso contra a Corrupção saiu.** Um ponto por −1, como ação rápida,
  esvaziava a trilha: dez pontos apagariam dez de Corrupção em dez rodadas, e a
  Queda, a Redenção e o Caminho Cinza perderiam o peso.
- **Em d%, a escolha passou a ser declarada antes de rolar o dado** — empurrar
  (dado × 10) ou re-rolar. Escolher depois de ver o d6 é comprar certeza.

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
