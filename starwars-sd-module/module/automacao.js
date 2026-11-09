/**
 * O botão "Usar" nos poderes da Força e nos aparatos da galáxia.
 *
 * O motor mora no módulo Space Dragon. Quem tem equivalente no livro só aponta
 * para ele: os poderes da Força são poderes mentais do Space Dragon, e a
 * descrição de cada item daqui já diz qual é. Os criados para o cenário têm a
 * própria entrada, escrita a partir do texto deles.
 */

/** Item daqui → nome do item equivalente no Space Dragon. */
export const EQUIVALENTES = {
  "choque da forca": "choque mental",
  "colapso mental": "dano cerebral",
  "drenar a mente": "drenar mente",
  "morte pela forca": "morte cerebral",
  "rajada da forca": "disparo mental",
  enfraquecer: "enfraquecimento",
  "estase da fera": "imobilizar criatura",
  "nublar a mente": "confundir mente",
  "prisao da forca": "imobilizar pessoa",
  "serenidade em area": "campo desestimulante",
  "toque adormecedor": "provocar sono",
  tormento: "atormentar mente",
  "blaster de repeticao": "pistola de repeticao",
  "blaster repetidor pesado": "metralhadora energetica",
  "canhao de plasma pesado": "canhao de fotons",
  "carga de detonita com detonador remoto": "explosivo remotamente controlado",
  "lanca-chamas de tropa de choque": "lanca-chamas",
  "luvas de choque de eletrobastao": "luvas de inducao eletrica",
  "macarico de fusao": "cortador laser",
  "missil de busca por calor": "missil teleguiado",
  "raio atordoante (o que captura sem matar)": "raio paralisador",
  "escudo defletor pessoal": "campo de forca individual",
  "estimulante de bacta": "injecao de adrenalina",
};

const emAtaqueEJp = (valor) => ["attack", "jpd", "jpc", "jps"].map((key) => ({ key, value: valor }));

/** Os poderes e equipamentos do cenário, sem equivalente no livro. */
export const PROPRIOS = {
  "tempestade da forca": {
    jp: "jpr", aoPassar: "metade", area: "raio de 10 m", dano: "4d6",
    nota: "Máquinas e droides sofrem o dobro e entram em curto-circuito.",
  },
  "drenar vida": {
    jp: "jpm", aoPassar: "anula", dano: "1d6",
    nota: "Quem usa recupera em PV o dano causado; o excedente vira PV temporários até o fim da cena.",
  },
  "toque sombrio": {
    jp: "jpf", aoPassar: "soDano", dano: "1d4",
    efeito: { nome: "Toque Sombrio", descricao: "−1 de Constituição até um descanso de 8 horas.", mods: [{ key: "constituicao", value: -1 }] },
  },
  "empurrao da forca": {
    jp: "jpr", aoPassar: "anula",
    efeito: { nome: "Derrubado", descricao: "Derrubado pelo empurrão." },
    nota: "O alvo é empurrado 3 m mesmo se passar na JPR. Arremessar um objeto solto causa 1d6.",
  },
  estrangular: {
    jp: "jpm", aoPassar: "anula", dano: "1d6",
    efeito: { nome: "Estrangulado", descricao: "Erguido, imobilizado e sufocado: 1d6 por rodada enquanto durar a concentração.", segundos: 10, porNivel: true },
    nota: "A JPM é só na entrada. Nas rodadas seguintes de concentração, role 1d6 e desconte à mão, sem usar o botão de novo.",
  },
  coragem: {
    modos: [
      { rotulo: "Aliados", efeito: { nome: "Coragem", descricao: "Bônus em ataque e JP.", mods: emAtaqueEJp("{nivel3}"), segundos: 100 } },
      { rotulo: "Inimigos (JPM anula)", jp: "jpm", aoPassar: "anula", efeito: { nome: "Coragem inimiga", descricao: "Penalidade em ataque e JP.", mods: emAtaqueEJp("-{nivel3}"), segundos: 100 } },
    ],
  },
  "meditacao de batalha": {
    modos: [
      { rotulo: "Aliados", efeito: { nome: "Meditação de Batalha", descricao: "+2 em ataque e nas JP.", mods: emAtaqueEJp(2), segundos: 100 } },
      { rotulo: "Inimigos (JPM anula)", jp: "jpm", aoPassar: "anula", efeito: { nome: "Meditação de Batalha inimiga", descricao: "−2 em ataque e nas JP.", mods: emAtaqueEJp(-2), segundos: 100 }, nota: "Os inimigos de Moral mais baixa começam a recuar." },
    ],
  },
  "sentir o perigo": {
    proprio: true,
    efeito: { nome: "Sentir o Perigo", descricao: "+2 na JPR contra o próximo ataque-surpresa ou armadilha da cena.", mods: [{ key: "jpd", value: 2 }] },
    nota: "Remova o efeito depois do primeiro ataque-surpresa ou armadilha.",
  },
  "pistola de medicamentos": { cura: "2d4+1", nota: "Até 5 cargas." },
  "carga explosiva": { dano: "6d10", nota: "Dobrar o número de cargas soma +2 dados. Margem de 5 no teste de Demolição dobra o dano; 10 ou crítico triplica." },
  "detonita (bloco)": { dano: "3d10", nota: "Dobrar o número de cargas soma +2 dados. Margem de 5 no teste de Demolição dobra o dano; 10 ou crítico triplica." },
};

/** Entrega as tabelas ao motor do Space Dragon. Uma vez, no `ready`. */
export function registrarAutomacao() {
  const api = globalThis.game?.modules?.get?.("spacedragon")?.api?.automacao;
  if (!api?.registrar) return false;
  api.registrar({ ...EQUIVALENTES, ...PROPRIOS });
  return true;
}
