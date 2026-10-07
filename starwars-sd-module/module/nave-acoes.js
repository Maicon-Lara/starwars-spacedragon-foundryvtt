/**
 * As ações dos postos, aplicadas na ficha.
 *
 * ── O QUE ESTE ARQUIVO FAZ, E O QUE DEIXA PARA A MESA ───────────────────────
 *
 * Oito das quinze ações têm efeito declarado em tripulacao.js, e são essas que
 * viram botão. As outras sete saem como texto porque dependem de uma escolha
 * que a ficha não tem como fazer: *Ordem* precisa saber QUAL posto age de novo,
 * *Sangue frio* precisa saber QUAL dado rerrolar, *Reparar* precisa de um teste
 * que já tem a própria rolagem.
 *
 * Automatizar essas sete significaria abrir um menu no meio da rodada para
 * perguntar o que a mesa já sabe — custa mais tempo do que economiza, e é a
 * razão de AUTOMATIZA existir como lista em vez de "tudo que tem efeito".
 *
 * ── POR QUE APLICAR É UMA FUNÇÃO PURA ──────────────────────────────────────
 *
 * `aplicarAcao` devolve a nave nova e o cartão; não grava nem rola nada. Quem
 * grava é a ficha, quem rola é o Foundry. Assim a regra inteira — o que cada
 * ação muda no estado — tem teste sem Foundry nenhum, e o dia em que o cartão
 * mudar de formato não mexe na regra.
 */

import { ACOES_DE_POSTO, AUTOMATIZA, POSTOS, LIMPA_NO_FIM_DA_RODADA } from "./tripulacao.js";

/** A ação de um posto, pela chave. */
export function acharAcao(posto, chave) {
  return (ACOES_DE_POSTO[posto] ?? []).find((a) => a.chave === chave) ?? null;
}

/** Esta ação vira botão, ou é só texto para a mesa? */
export function ehAutomatica(chave) {
  return AUTOMATIZA.has(chave);
}

/**
 * Onde cada efeito mora na flag da nave.
 *
 * `LIMPA_NO_FIM_DA_RODADA` fala em caminhos `system.*`, herdados do tipo de
 * ator que foi aposentado. O que importa dele é a LISTA do que é temporário —
 * essa é a regra —, e não o prefixo. Converter aqui mantém a lista num lugar só.
 */
export function campoDoEfeito(caminho) {
  return String(caminho).replace(/^system\./, "");
}

/** O que a nave esquece quando a rodada acaba. */
export function limparFimDaRodada(nave) {
  const nova = { ...(nave ?? {}) };
  for (const [caminho, valor] of Object.entries(LIMPA_NO_FIM_DA_RODADA)) {
    const campo = campoDoEfeito(caminho);
    const partes = campo.split(".");
    if (partes.length === 1) {
      // `false` some do registro em vez de ficar gravado: um efeito desligado é
      // a ausência dele, e é o que o painel checa
      if (valor === false) delete nova[partes[0]];
      else nova[partes[0]] = valor;
      continue;
    }
    const [raiz, folha] = partes;
    if (!nova[raiz] || typeof nova[raiz] !== "object") continue;
    nova[raiz] = { ...nova[raiz] };
    if (valor === false) delete nova[raiz][folha];
    else nova[raiz][folha] = valor;
  }
  return nova;
}

/**
 * Aplica uma ação e devolve a nave nova mais o que dizer no chat.
 *
 * `rolagens` são as instruções que a ficha precisa executar — o Forçar o reator
 * pede 1d6 e avaria a Sala de Máquinas num 1. A rolagem fica de fora de
 * propósito: sortear aqui tiraria o dado da mesa, e é o dado que faz forçar o
 * reator ser uma aposta em vez de uma escolha grátis.
 */
export function aplicarAcao(nave, posto, chave) {
  const acao = acharAcao(posto, chave);
  if (!acao) return { erro: `Ação desconhecida: ${posto}/${chave}` };
  if (!ehAutomatica(chave)) {
    return { erro: `“${acao.rotulo}” não se automatiza: ${acao.nota ?? "é decisão da mesa."}` };
  }

  const e = acao.efeito ?? {};
  const nova = { ...(nave ?? {}) };
  const linhas = [];
  const rolagens = [];

  // ── A FORMA DO ESTADO VEM DA LISTA DE LIMPEZA ──
  //
  // `LIMPA_NO_FIM_DA_RODADA` declara `system.firmar.ativa`, `system.suprimida.ativa`
  // e `system.aguentem.ativa` — dois níveis — e `system.interferencia` com um.
  // Gravar numa forma e limpar noutra deixaria o efeito ligado para sempre, e o
  // sintoma seria uma nave que nunca sai do Firmar.
  //
  // Quem manda é a lista, porque é ela que carrega a REGRA de o que é
  // temporário. O gravador se alinha a ela.
  if (e.jp) {
    nova.firmar = { ativa: true };
    linhas.push(`JP da nave **+${e.jp}** até o fim da rodada`);
  }
  if (e.ataqueAliado) linhas.push(`artilheiros **+${e.ataqueAliado}** no ataque`);
  if (e.imovel) linhas.push("a nave **não se move** nesta rodada");

  if (e.movimentoDobrado) linhas.push("movimento **dobrado**");
  if (e.perdeAcao) linhas.push("**a ação do turno se perde**");
  if (e.apressaPerseguidor) {
    // o relógio do perseguidor anda DUAS na rodada em que a nave corre
    const fuga = { ...(nova.fuga ?? {}) };
    fuga.perseguidor = Math.min(3, (Number(fuga.perseguidor) || 0) + 2);
    nova.fuga = fuga;
    linhas.push("o perseguidor avança **duas** marcas (§7)");
  }

  if (e.ataque) linhas.push(`**${e.ataque}** no ataque`);
  if (e.dadosDeDano) linhas.push(`**+${e.dadosDeDano}** dado(s) de dano se acertar`);

  if (e.semDano) linhas.push("**sem dano**");
  if (e.ataqueDoAlvo) linhas.push(`o alvo leva **${e.ataqueDoAlvo}** no próximo ataque dele`);
  if (e.bloqueiaEvasivaDoAlvo) {
    nova.suprimida = { ativa: true };
    linhas.push("o alvo **não pode** fazer manobra evasiva nesta rodada");
  }

  if (e.energiaExtra) {
    const energia = { ...(nova.energia ?? {}) };
    energia.extra = (Number(energia.extra) || 0) + e.energiaExtra;
    nova.energia = energia;
    linhas.push(`**+${e.energiaExtra}** pontos de energia nesta rodada`);
  }
  if (e.riscoEm1d6) {
    rolagens.push({
      formula: "1d6",
      rotulo: "Risco de forçar o reator",
      // num 1 a Sala de Máquinas sofre avaria — e é a câmara que habilita o
      // reparo em combate, então o risco é perder justamente a saída
      falhaEm: e.riscoEm1d6,
      camara: e.avariaSe,
    });
    linhas.push(`role **1d6**: num **${e.riscoEm1d6}**, a Sala de Máquinas sofre avaria`);
  }

  if (e.trava) {
    nova.trava = true;
    linhas.push("alvo **travado**: +2 no próximo ataque aliado contra ele");
  }
  if (e.ataqueInimigo) {
    nova.interferencia = true;
    linhas.push(`o inimigo leva **${e.ataqueInimigo}** no próximo ataque contra esta nave`);
  }

  if (e.cancelaPenalidadeDeAvaria) {
    nova.aguentem = { ativa: true };
    linhas.push("cancela **uma** penalidade de avaria até o fim da rodada");
  }

  const nomeDoPosto = POSTOS.find((p) => p.chave === posto)?.rotulo ?? posto;
  return {
    nave: nova,
    rolagens,
    cartao: {
      titulo: `${nomeDoPosto}: ${acao.rotulo}`,
      linhas,
      nota: acao.nota ?? "",
    },
  };
}
