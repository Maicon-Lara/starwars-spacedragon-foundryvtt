// Os equipamentos adicionais de nave (T10-4) como itens de compêndio.
//
// ── POR QUE ITENS, SE A FICHA JÁ OS TEM ─────────────────────────────────────
//
// A ficha de Nave já mostra os quinze equipamentos como botões de liga-desliga,
// filtrados pelo tamanho, com os conflitos e os efeitos calculados — e isso tudo
// tem teste. Trocar aquilo por uma lista de itens significaria reescrever a
// validação de tamanho, os conflitos e os efeitos, perdendo a cobertura.
//
// Então os itens NÃO substituem o schema: eles são a porta de entrada. O item
// carrega o nome, o ícone, a descrição da T10-4 e o que a tabela permite; ao ser
// arrastado para uma nave, ele LIGA o booleano que já existe. A regra continua
// num lugar só, e a mesa ganha o que faltava:
//
//   · o equipamento tem descrição e preço à mão, fora da ficha;
//   · dá para arrastar do compêndio, como se arrasta uma arma para o
//     personagem — que é como o resto do sistema funciona;
//   · o Mestre pode ler a T10-4 sem abrir uma nave.
//
// ── O QUE VAI NA FLAG ───────────────────────────────────────────────────────
//
// A `chave` do equipamento e a matriz `cabe`. A chave é o que a ficha usa para
// ligar o booleano certo; o `cabe` deixa o aviso de tamanho acontecer no momento
// do arrasto, antes de instalar — e não depois, num painel de conflitos.

import { EQUIPAMENTOS_DE_NAVE, TAMANHOS } from "../../starwars-sd-module/module/equipamentos-nave.js";

const OD2I = "systems/olddragon2e/assets/icons";

/** O ícone por grupo: utilitário, combate e defesa se distinguem de relance. */
const ICONE = {
  utilitario: `${OD2I}/misc.svg`,
  combate: `${OD2I}/weapon.svg`,
  defesa: `${OD2I}/armor.svg`,
};

/** Em que tamanhos de nave este equipamento cabe, em texto. */
export function tamanhosQueCabem(cabe) {
  const sim = TAMANHOS.filter((t) => cabe?.[t]);
  if (sim.length === TAMANHOS.length) return "Qualquer tamanho de nave.";
  if (!sim.length) return "Nenhum tamanho de nave o comporta.";
  return `Cabe em nave: ${sim.join(", ").toLowerCase()}.`;
}

/**
 * A descrição do item: a nota do livro, mais o que a T10-4 permite.
 *
 * O limite de tamanho entra no TEXTO, e não só na flag, porque quem lê o item no
 * compêndio — sem nave nenhuma aberta — precisa saber se ele serve para a nave
 * que tem em mente.
 */
export function descricaoDoEquipamento(e) {
  const linhas = [e.nota, tamanhosQueCabem(e.cabe)];
  const ef = e.efeito ?? {};

  if (ef.cp) {
    // o escudo gasta combustível por rodada, e quem rola é o Mestre (T10-4)
    linhas.push(`Efeito: +${ef.cp} no CP enquanto ativo. Gasta combustível a cada rodada de combate.`);
  }
  if (ef.ataque) {
    // as DUAS condições, ditas aqui porque é onde a mesa olha ao comprar
    linhas.push(`Efeito: +${ef.ataque} nas rolagens de ataque da nave. Exige a Ponte de Comando operacional.`);
  }
  if (ef.movimento) {
    linhas.push(`Efeito: movimentação ×${ef.movimento} (+${Math.round((ef.movimento - 1) * 100)}%), consumindo combustível rápido.`);
  }

  /* ── A ARMA, COM A REGRA INTEIRA ─────────────────────────────────────────
   *
   * A descrição é onde a mesa lê a regra, porque o botão de ataque da ficha só
   * rola o dano — ele não sabe dos 4 disparos da metralhadora nem da JP dos
   * mísseis. Escrever só "dano 4d10" nos mísseis esconde a metade que decide
   * se o tiro acerta.
   */
  if (ef.arma) {
    const a = ef.arma;
    const quantos = (a.ataques ?? 1) > 1
      ? ` ${a.ataques} ataques por rodada, de ${a.dano} cada.`
      : ` Dano ${a.dano}.`;
    linhas.push(`Arma montada:${quantos}`);
    if (a.jpDoAlvo) {
      linhas.push("Só atinge se o alvo FALHAR numa jogada de proteção — role o ataque e, se acertar, o alvo faz a JP dele.");
    }
    if (a.perseguePor) {
      linhas.push(`Segue o alvo por ${a.perseguePor} rodadas antes do impacto.`);
    }
  }

  if (ef.redireciona) {
    linhas.push(`Efeito: ${ef.redireciona}% de redirecionar contra o atacante qualquer ataque de raio, por ${ef.rodadas} rodadas.`);
  }
  if (ef.pilotagemAutomatica) {
    linhas.push("Efeito: sucesso automático em pilotagem enquanto ativo. NUNCA em combate.");
  }
  if (ef.permiteSalto) linhas.push("Sem ele não há salto para o hiperespaço.");
  /* ── SEM REPETIR O QUE A NOTA JÁ DISSE ───────────────────────────────────
   *
   * A nota é a prosa do livro, e muitas delas já trazem o número: «Concede +2
   * em rolagens de ataque». A linha de Efeito então repetia a mesma frase dois
   * parágrafos abaixo, e uma descrição que se repete ensina a mesa a parar de
   * ler — justamente onde estão as regras que o botão de ataque não aplica.
   *
   * O corte é pela presença do NÚMERO: se a nota já traz "+2" ou "4d10", a
   * linha estruturada não acrescenta nada.
   */
  const nota = String(e.nota ?? "");
  const util = linhas.filter((l, i) => {
    if (i < 2 || !l) return Boolean(l);
    const numeros = l.match(/[+×]?\d+(?:d\d+)?%?/g) ?? [];
    if (!numeros.length) return true;
    return !numeros.every((n) => nota.includes(n));
  });
  return util.filter(Boolean).join(" ");
}

export const equipamentosDeNave = Object.entries(EQUIPAMENTOS_DE_NAVE).map(([chave, e]) => ({
  chave,
  nome: e.rotulo,
  grupo: e.grupo,
  cabe: e.cabe,
  img: ICONE[e.grupo] ?? ICONE.utilitario,
  desc: descricaoDoEquipamento(e),
  // O dano sai da regra para o item, e é ele que decide se o equipamento vira
  // `weapon` ou `misc` no build. Sem repassar isto, as quatro armas da T10-4
  // nasciam item genérico — e um item genérico não tem o que clicar para
  // atacar, que foi o que a mesa relatou.
  dano: e.efeito?.arma?.dano ?? null,
  ataques: e.efeito?.arma?.ataques ?? 1,
}));
