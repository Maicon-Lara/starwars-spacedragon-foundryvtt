// Tabelas roláveis: ganchos (d12), contratos (d10), complicações (d12),
// PNJ relâmpago (espécie d8, papel d8, traço d10), locais (d8) e achados (d10).
//
// Fonte: o cofre, SW-SUP-Secao-do-Mestre.md, pelo importador. O journal
// "Seção do Mestre" continua com as listas inteiras: quem quer ler lê, quem
// quer rolar rola.

import { TABELAS_MESTRE } from "./textos-do-cofre.mjs";

// A "Sessão relâmpago" do cofre rola 1 Gancho + 1 Local + 1 Complicação e
// joga um PNJ no meio; o PNJ tem três colunas, e por isso vai numa subpasta.
const pastaDe = (nome) => (nome.startsWith("PNJ relâmpago") ? "Preparação de Aventura — PNJ Relâmpago" : "Preparação de Aventura");

export const tabelas = TABELAS_MESTRE.map((t) => ({ ...t, pasta: pastaDe(t.nome) }));
