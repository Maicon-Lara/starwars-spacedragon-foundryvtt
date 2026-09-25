# Changelog

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
