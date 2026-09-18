# Star Wars — Suplemento para Space Dragon (Foundry VTT)

Módulo de conteúdo para o **Foundry VTT v13**, sistema **Old Dragon 2e**, que traz
o suplemento de cenário *Star Wars para Space Dragon* como compêndios.

É o **Space Dragon com outro céu**: as quatro classes (Veterano, Operativo,
Técnico, Sensível à Força) são os chassis do Space Dragon (Cosmonauta, Gatuno,
Cientista, Mentálico), do nível 1 ao 20, vestidos de Star Wars. O módulo **não
repete as regras**. Ele depende do módulo
[Space Dragon](https://github.com/Maicon-Lara/space-dragon-foundryvtt), que no
Foundry faz o papel do livro básico: escala de atributos, testes de
porcentagem, Danos Mortais, alcance mental e a ficha.

> Não confundir com o **Star Dragon** (`sw-spacedragon-foundryvtt`), que é
> Star Wars convertido para Old Dragon 2, com nível 1–15 e Foco Diário. Os dois
> podem ficar ligados no mesmo mundo.

## De onde vem o conteúdo

Do cofre, em `Documents\Ekhoria\20 Space Dragon\Space Dragon Suplemento\`.
Cada nota vira um arquivo em `tools/data/`:

| Nota do cofre | Arquivo | Compêndio |
|---|---|---|
| SW-SUP-Usando-o-Basico | `criacao-journal.mjs` | Referência do Mestre |
| SW-SUP-Especies | `especies.mjs` | Espécies |
| SW-SUP-Classes, SW-SUP-Forca | `classes.mjs`, `variantes.mjs` | Classes |
| SW-SUP-Sabre-e-Cristais, SW-SUP-Senda-Mandaloriana | `avulsas.mjs` | Classes / Espécies |
| SW-SUP-Equipamentos, SW-SUP-Sabre-e-Cristais | `equipamentos.mjs`, `equipamentos-journal.mjs` | Equipamentos |
| SW-SUP-Aparatos-e-Feitos | `equipamentos.mjs`, `feitos-journal.mjs` | Equipamentos |
| SW-SUP-Poderes-da-Forca | `poderes.mjs` | Poderes da Força |
| SW-SUP-Forca, SW-SUP-Ordens-e-Ranks | `poderes.mjs` (journal) | Referência do Mestre |
| SW-SUP-Naves, SW-SUP-Combate-Tatico-de-Naves | `naves.mjs` | Referência do Mestre |
| SW-SUP-Bestiario | `bestiario.mjs`, `bestiario-journal.mjs` | Bestiário |
| SW-SUP-Secao-do-Mestre | `mestre-journal.mjs`, `tabelas.mjs` | Referência do Mestre / Tabelas |

O cofre é **só leitura**: o módulo copia dele, nunca escreve nele.

O texto longo — as tabelas de progressão, as seções de regra, as espécies e a
lista de poderes — entra por `node tools/importar-cofre.mjs`, que grava
`tools/data/progressoes.mjs` e `tools/data/textos-do-cofre.mjs`. Esses dois
são **gerados e versionados**: o build não lê o cofre, então um clone sem ele
continua compilando. Rode o importador quando o cofre mudar.

Os Poderes da Força trazem os números do Poder Mental nativo, lidos do
`packs-src` do módulo Space Dragon (`../space-dragon-foundryvtt`) pelo mesmo
importador.

## Estrutura

A mesma do Star Dragon, para quem mexe num achar as coisas no outro:

```
starwars-sd-module/       o que vai para o Foundry
  module.json
  module/starwars-sd.js   só o que é do cenário (game.starwarsSD)
  styles/starwars-sd.css  só os journals; a ficha é a do Space Dragon
  lang/                   só chaves "starwars-sd.*", nada global
  assets/banners/         capas dos compêndios (geradas)
  templates/
  packs/                  LevelDB (gerado)
packs-src/                fonte JSON dos compêndios (gerada, versionada)
tools/
  build.mjs               tools/data → packs-src → packs
  lib.mjs, lib-actors.mjs construtores de documento
  validar.mjs             pega o que compila mas quebra na mesa
  make-zip.py             starwars-sd.zip
  make-banners.mjs        capas
  importar-cofre.mjs      cofre (e poderes do Space Dragon) → tools/data/
  extract.mjs             packs → _verify/, para conferir
  data/                   um arquivo por nota do cofre
```

## Comandos

```
npm install          # uma vez: instala o foundryvtt-cli
npm run build        # gera os compêndios
npm run validar      # build + validação
npm run banners      # regera as capas
npm run empacotar    # gera starwars-sd.zip
```

## Distribuição

Por GitHub Releases, como o módulo Space Dragon. Cada versão sobe o
`module.json` e o `starwars-sd.zip` como anexos, e o manifesto aponta para
`releases/latest/download/`. O jsDelivr foi descartado porque servia versão
velha.

---

*Star Wars — suplemento de cenário para Space Dragon* · texto de **Maicon Lara** ·
obra de fã, não oficial e sem fins lucrativos · requer o *Space Dragon* ·
Star Wars © Lucasfilm Ltd. · *Space Dragon* © Old Dragon Editora.
