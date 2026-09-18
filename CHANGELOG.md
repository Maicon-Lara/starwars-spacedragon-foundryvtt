# Changelog

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
