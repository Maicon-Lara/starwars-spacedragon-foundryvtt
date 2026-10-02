# Licença

Este módulo é **obra derivada** do *Space Dragon — Livro Básico Aprimorado*, de
**Igor Moreno**, cujos créditos permitem a reprodução sob **Open Game License** e
**Creative Commons v3.0 by-sa**, *"com exceção dos elementos gráficos, logo,
ilustrações e diagramação"*.

Como o material de origem é **CC BY-SA 3.0**, a cláusula *share-alike* obriga: o
conteúdo deste módulo é **[CC BY-SA 3.0][cc]** também. A **Open Game License
1.0a** acompanha o repositório em [OGL.txt](OGL.txt), com a seção 15 atualizada,
como manda a cláusula 10.

[cc]: https://creativecommons.org/licenses/by-sa/3.0/deed.pt_BR

## O que é Open Game Content

Pela cláusula 8 da OGL: **é Open Game Content** todo o conteúdo dos compêndios —
tabelas, valores, progressões, o texto das regras e das especializações, e as
regras da ficha de Nave.

**Não é, e não está aqui:** a arte, os logos, as ilustrações e a diagramação do
livro do Space Dragon. Nenhum arquivo de imagem dele entra neste repositório; as
capas dos compêndios são geradas por `tools/make-banners.mjs`.

## Star Wars não está licenciado, e não pode estar

**Star Wars © Lucasfilm Ltd.** Nem a OGL nem a CC licenciam essa marca, esses
nomes ou esse universo — nenhuma licença de jogo poderia. Este módulo é **obra de
fã, não oficial e sem fins lucrativos**, e não tem qualquer vínculo com a
Lucasfilm ou a Disney. Os nomes próprios de Star Wars aparecem aqui como
referência de cenário, não como conteúdo licenciado.

O que é **licenciável** neste repositório é a camada de regras: os chassis do
Space Dragon, as tabelas de progressão, as Sendas, os Poderes da Força como
Poderes Mentais reskinados. É a essa camada que a CC BY-SA se aplica.

## Atribuição

- *Space Dragon* — **Igor Moreno**. O livro de 2019 saiu pela **Redbox Editora**;
  os direitos do *Old Dragon* passaram depois para a **Buró de Jogos do Brasil**
  e, em 11/02/2026, para a **Old Dragon Editora**.
- *Old Dragon* — baseado nas regras originais de E. Gary Gygax e Dave Arneson
- O **Combate Tático de Naves** é desenhado sobre o **X-Wing Miniatures Game**,
  de Fantasy Flight Games — só a ideia de dial de manobras, manobra planejada em
  segredo e dados de defesa. Nenhum texto, valor ou componente daquele jogo é
  reproduzido.
- Adaptação, texto do cenário e este módulo — **Maicon Lara**

## As fontes

`starwars-sd-module/fonts/` traz três famílias sob **SIL Open Font License 1.1**,
que permite redistribuição junto de um trabalho:

- **Orbitron** — Matt McInerney
- **Saira Condensed** — Omnibus-Type
- **Source Serif 4** — Frank Grießhammer, Adobe

Vão embutidas, e não por `@import` do Google Fonts, porque um `@import` falha
**calado** numa mesa sem internet: o navegador cai para a fonte seguinte da
pilha e ninguém descobre por quê. São só os subsets `latin` e `latin-ext`.

Isto **não contradiz** o que a seção acima diz sobre arte: a OFL é uma licença
livre e explícita quanto a isso, ao contrário de ilustração e diagramação, que
continuam fora do módulo. Nenhuma fonte foi modificada, e o nome reservado de
nenhuma delas é usado para outra coisa.

## O código

Os scripts em `tools/` e `starwars-sd-module/module/` são de autoria própria, sob
**MIT**.

## Depende de

O módulo [Space Dragon](https://github.com/Maicon-Lara/space-dragon-foundryvtt),
que traz as regras do livro básico, e do sistema
[`olddragon2e`](https://github.com/olddragoneditora/olddragon2e-foundryvtt). Os
**Livros I e II** do Old Dragon 2 não são SRD, e nenhuma tabela exclusiva deles
entra aqui.
