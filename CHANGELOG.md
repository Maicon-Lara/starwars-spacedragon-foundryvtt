# Changelog

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
