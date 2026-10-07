// Teste do que a nave consegue fazer, dado o estado das câmaras.
//
// ── AS DUAS ASSERÇÕES QUE MAIS IMPORTAM ─────────────────────────────────────
//
// 1. A DANIFICADA NÃO DÁ NADA. «Perder o prazo deixa a câmara danificada: ela
//    para de dar o que dava até a obra de conserto» (§7). É o oposto do que ela
//    faz no orçamento, onde continua ocupando lugar — e confundir as duas coisas
//    daria uma nave atirando com a ponte em chamas.
//
// 2. A PONTE CALA A NAVE INTEIRA. «Ponte danificada tira o +2 do Computador
//    Balístico E impede a nave de operar armas e escudos. É duro de propósito.»
//    Um crítico na Ponte não custa dois pontos de ataque; custa o turno.
//
// Uso: node tools/teste-nave-sistemas.mjs

import {
  operacional, podePilotar, podeAtacar, podeUsarEscudos, podeRepararEmCombate,
  podeEscapar, bonusDeAtaqueDasCamaras, recuperacaoEmViagem, custoDeConserto,
  avisosDaNave,
} from "../starwars-sd-module/module/nave-sistemas.js";
import { CAMARAS } from "../starwars-sd-module/module/camaras.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/** Uma nave com as câmaras citadas no estado dado; o resto no padrão. */
const nave = (camaras = {}) => ({ camaras });
/** A nave completa: as doze de pé. */
const inteira = () =>
  nave(Object.fromEntries(Object.keys(CAMARAS).map((c) => [c, "instalada"])));

/* ── SÓ «INSTALADA» É OPERACIONAL ──────────────────────────────────────────── */
{
  confere(operacional(nave({ ponte: "instalada" }), "ponte"), "instalada devia ser operacional");
  confere(!operacional(nave({ ponte: "danificada" }), "ponte"),
    "a câmara DANIFICADA não pode ser operacional — ela para de dar o que dava (§7)");
  confere(!operacional(nave({ ponte: "ausente" }), "ponte"), "ausente não é operacional");

  // a Ponte e a Sala de Máquinas vêm de fábrica, então a nave nova as tem
  confere(operacional(nave(), "ponte"), "a Ponte de uma nave nova devia estar operacional");
  confere(operacional(nave(), "maquinas"), "a Sala de Máquinas de uma nave nova");
  confere(!operacional(nave(), "hospital"), "a Ala Hospitalar não vem de fábrica");
}

/* ── A PONTE CALA A NAVE ───────────────────────────────────────────────────── */
{
  const ok = inteira();
  confere(podePilotar(ok) && podeAtacar(ok) && podeUsarEscudos(ok), "a nave inteira faz tudo");

  for (const estado of ["danificada", "ausente"]) {
    const n = nave({ ponte: estado });
    confere(!podePilotar(n), `com a Ponte ${estado} a nave não pode ser pilotada`);
    confere(!podeAtacar(n), `com a Ponte ${estado} a nave não opera armas`);
    confere(!podeUsarEscudos(n),
      `com a Ponte ${estado} o escudo de força ainda liga — «não pode ser pilotada nem ` +
      `operar escudos ou armas» veta os três juntos`);
    confere(bonusDeAtaqueDasCamaras(n) === 0,
      `com a Ponte ${estado} o Computador Balístico ainda dá bônus`);
  }

  // o +2 existe quando a Ponte está de pé
  confere(bonusDeAtaqueDasCamaras(nave()) === 2,
    `a Ponte operacional devia dar +2, veio ${bonusDeAtaqueDasCamaras(nave())}`);

  // e perder OUTRA câmara não cala as armas: só a Ponte faz isso
  const semHospital = nave({ hospital: "ausente" });
  confere(podeAtacar(semHospital) && podePilotar(semHospital),
    "perder a Ala Hospitalar não pode impedir a nave de voar e atirar");
}

/* ── O REPARO EM COMBATE E A FUGA ──────────────────────────────────────────── */
{
  confere(podeRepararEmCombate(nave()), "a Sala de Máquinas vem de fábrica, então repara");
  confere(!podeRepararEmCombate(nave({ maquinas: "danificada" })),
    "Sala de Máquinas danificada não permite reparo em combate");

  // a Saída de Emergência NÃO vem de fábrica: a nave nova não salva ninguém
  confere(!podeEscapar(nave()),
    "a nave recém-criada não tem Saída de Emergência — é escolha, e cara (90.000 CR)");
  confere(podeEscapar(nave({ emergencia: "instalada" })), "com a saída instalada se escapa");
  confere(!podeEscapar(nave({ emergencia: "danificada" })),
    "saída danificada não salva ninguém — e é na hora da explosão que se descobre");
}

/* ── A RECUPERAÇÃO EM VIAGEM ───────────────────────────────────────────────── */
//
// A ASSERÇÃO SUTIL: a Ala Hospitalar DOBRA a recuperação, e dobrar nada
// continua nada. Uma nave com hospital e sem aposentos não cura ninguém — quem
// implementar "hospital ⇒ cura" sem checar os aposentos inverte a regra.
{
  const r0 = recuperacaoEmViagem(nave());
  confere(!r0.recupera && r0.multiplicador === 0,
    "a nave nova não tem Aposentos, então a viagem não recupera nada (§4)");

  const r1 = recuperacaoEmViagem(nave({ aposentos: "instalada" }));
  confere(r1.recupera && r1.multiplicador === 1, "com Aposentos, recuperação simples");

  const r2 = recuperacaoEmViagem(nave({ aposentos: "instalada", hospital: "instalada" }));
  confere(r2.multiplicador === 2, "Aposentos + Ala Hospitalar devia dobrar");

  const soHospital = recuperacaoEmViagem(nave({ hospital: "instalada" }));
  confere(!soHospital.recupera && soHospital.multiplicador === 0,
    "hospital SEM aposentos curou alguém — a ala DOBRA a recuperação, e dobrar nada é nada");

  const quebrado = recuperacaoEmViagem(nave({ aposentos: "instalada", hospital: "danificada" }));
  confere(quebrado.multiplicador === 1, "ala danificada não dobra");
}

/* ── O CONSERTO (T10-2) ────────────────────────────────────────────────────── */
//
// A ASSERÇÃO QUE PROTEGE O DINHEIRO DA MESA: os 25% valem só para a DANIFICADA.
// Uma câmara ausente se constrói do zero, obra inteira. Cobrar 25% pelo que não
// existe daria a nave completa por um quarto do preço — e é o erro que o
// desconto convida, porque as duas situações aparecem lado a lado na ficha.
{
  const danificada = custoDeConserto("ponte", "danificada");
  confere(danificada?.creditos === 30000,
    `conserto da Ponte devia custar 25% de 120.000 = 30.000, veio ${danificada?.creditos}`);
  confere(/metade/.test(danificada?.prazo ?? ""), "o prazo do conserto é metade do da obra");

  const ausente = custoDeConserto("ponte", "ausente");
  confere(ausente?.creditos === 120000,
    `construir a Ponte do zero devia custar a obra inteira (120.000), veio ${ausente?.creditos}`);
  confere(ausente?.prazo === CAMARAS.ponte.prazo, "o prazo da obra é o da tabela");

  confere(custoDeConserto("ponte", "instalada") === null,
    "câmara de pé não tem custo — mostrar um preço aqui convida a pagar duas vezes");
  confere(custoDeConserto("inexistente", "danificada") === null, "câmara desconhecida não inventa preço");

  // todas as câmaras com obra têm os dois caminhos
  for (const [chave, c] of Object.entries(CAMARAS)) {
    if (!c.obra) continue;
    const d = custoDeConserto(chave, "danificada");
    const a = custoDeConserto(chave, "ausente");
    confere(d.creditos < a.creditos,
      `${c.rotulo}: consertar não ficou mais barato que construir`);
    confere(d.creditos === Math.round(c.obra * 0.25), `${c.rotulo}: o conserto não é 25% da obra`);
  }
}

/* ── OS AVISOS, DO MAIS GRAVE AO MENOS ─────────────────────────────────────── */
{
  const avisos = avisosDaNave(nave({ ponte: "danificada" }));
  confere(avisos.length > 0, "ponte danificada e nenhum aviso");
  confere(avisos[0].grau === "grave", "o primeiro aviso devia ser o mais grave");
  confere(/não pode ser pilotada/.test(avisos[0].texto),
    `o aviso mais urgente devia ser o da pilotagem, veio "${avisos[0].texto}"`);

  // a ordem importa numa lista que a ficha pode truncar: o que sai de fora tem
  // de ser o menos urgente
  const graus = avisos.map((a) => a.grau);
  const peso = { grave: 0, aviso: 1, nota: 2 };
  const ordenado = [...graus].sort((x, y) => peso[x] - peso[y]);
  confere(JSON.stringify(graus) === JSON.stringify(ordenado),
    `os avisos saíram fora de ordem: ${graus.join(" → ")}`);

  // a nave completa não tem aviso nenhum
  confere(avisosDaNave(inteira()).length === 0,
    `a nave inteira ainda acusa: ${avisosDaNave(inteira()).map((a) => a.texto).join(" | ")}`);

  // e a nave NOVA acusa o que ela realmente não tem, sem acusar o que tem
  const novos = avisosDaNave(nave());
  confere(!novos.some((a) => /pilotada|armas/.test(a.texto)),
    "a nave nova tem Ponte e Máquinas: não pode acusar falta de pilotagem nem de armas");
  confere(novos.some((a) => /Saída de Emergência/.test(a.texto)),
    "a nave nova não tem Saída de Emergência e isso precisa aparecer antes do 0 PV");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ sistemas da nave: só «instalada» é operacional (a danificada ocupa lugar e não " +
    "funciona), a Ponte calando armas, escudos, pilotagem E o +2 do balístico, o hospital " +
    "que dobra nada sem os Aposentos, e os 25% do conserto que NÃO valem para construir"
);
