// Cores das pastas dos compêndios. Copiadas do Star Dragon: os nomes de pasta
// são os mesmos, e o mesmo nome com a mesma cor nos dois módulos ajuda o olho.
//
// A cor serve para NAVEGAR, não para enfeitar. A regra é uma só: a cor marca a
// FAMÍLIA, e o filho herda a do pai. Assim "Guardião (Ataru)" tem a mesma cor
// de "Sensível à Força" e o olho agrupa a árvore sem ler.
//
// Onde a cor paga mais é no compêndio de Poderes: saber de relance se um poder
// é da Sombra é a diferença entre marcar Corrupção e não marcar.
//
// SOBRE A ESCOLHA DOS TONS: o Foundry usa esta cor como FUNDO da barra da
// pasta e escreve o nome por cima em creme (rgb 239,230,216) — não pinta o
// texto, como parecia. A primeira versão desta paleta partiu do palpite errado
// e saiu inteira abaixo do mínimo legível: o âmbar do Técnico dava 1,82:1
// contra os 4,5:1 que a WCAG pede para texto normal.
//
// Os tons abaixo são os mesmos matizes, escurecidos até passar de 4,5:1 —
// medido, não estimado (tools/_contraste.mjs recalcula). É também o que os
// outros módulos fazem: as pastas do Tomo de Magia usam vinho escuro, 8,7:1.
//
// Nenhuma informação depende só da cor: o nome da pasta continua dizendo tudo,
// então quem não distingue as cores não perde nada.

export const CORES_DE_PASTA = {
  // ── Poderes da Força: o Caminho, à primeira vista ──
  "Luz": "#326b96", // azul de sabre Jedi
  "Sombra": "#b43c35", // vermelho de sabre Sith
  "Universal": "#62666c", // cinza: não pende para lado nenhum

  // ── Classes: um tom por chassi ──
  "Veterano": "#9a532e", // laranja queimado, o marcial
  "Operativo": "#78579f", // roxo, o das sombras
  "Técnico": "#806126", // âmbar de bancada
  "Sensível à Força": "#42679c", // azul, primo da Luz
  "Senda Mandaloriana": "#5d6670", // cinza-aço do beskar
  "Formas de Sabre (Guardião)": "#3a6e68", // verde-azulado: técnica, não classe

  // ── Espécies: todas iguais de propósito ──
  // Dar uma cor por espécie deixaria dez cores brigando e não diria nada — são
  // todas a mesma categoria. O que precisa se distinguir é o que NÃO é espécie.
  "Chiss": "#4f6e4e",
  "Droide": "#4f6e4e",
  "Humano": "#4f6e4e",
  "Mandaloriano": "#4f6e4e",
  "Mon Calamari": "#4f6e4e",
  "Rodiano": "#4f6e4e",
  "Trandoshano": "#4f6e4e",
  "Twi'lek": "#4f6e4e",
  "Wookiee": "#4f6e4e",
  "Zabrak": "#4f6e4e",
  "Origens": "#7b5989", // escolha por cima da espécie, não uma espécie
  "Idiomas da galáxia": "#62666c", // referência

  // ── Equipamento: por natureza do item ──
  "Armas Corpo a Corpo": "#a14e43",
  "Blasters e Armas de Energia": "#a14e43",
  "Sabres de Luz": "#366f69", // a arma que não é como as outras
  "Cristais Kyber": "#366f69", // e o que a alimenta
  "Armaduras e Escudos": "#51687f",
  "Armaduras e Vestes": "#51687f",
  "Preparação de Aventura": "#42679c",
  "Granadas e Explosivos": "#a14e43", // mesma família das armas
  "Aparelhos e Kits": "#62666c",
  "Medicina": "#4f6e4e",
  "Vestes sob Encomenda": "#51687f",
  "Aparatos Tecnológicos": "#806126",
  "Carregadores": "#a14e43", // mesma família das armas: é o dano delas que ele carrega
  "Kits e Estojos": "#806126",
  "Equipamento Geral": "#62666c",
  "Miudezas, Energia e Sobrevivência": "#62666c",

  // ── Tabelas roláveis ──
  "Gerador de PNJ": "#42679c",
  "Relíquia tecnológica": "#786436",

  // ── Bestiário ──
  "Feras da Galáxia": "#4f6e4e",
  "Modelos de PNJ": "#42679c",
};
