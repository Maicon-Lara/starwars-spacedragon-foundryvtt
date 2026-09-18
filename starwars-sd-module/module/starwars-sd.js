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

const ID = "starwars-sd";

Hooks.once("init", () => {
  console.log(`${ID} | Star Wars — Suplemento para Space Dragon`);
});

Hooks.once("ready", () => {
  // O Foundry já recusa ligar o módulo sem a dependência, mas um mundo antigo
  // pode ter o Space Dragon desligado depois. Avisar custa uma linha.
  if (!game.modules.get("spacedragon")?.active) {
    ui.notifications?.warn(game.i18n.localize("starwars-sd.aviso.semSpaceDragon"));
  }

  game.starwarsSD = {};
});
