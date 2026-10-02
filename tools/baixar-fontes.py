# -*- coding: utf-8 -*-
"""Baixa as fontes do livro do Google Fonts e gera fonts/fontes.css.

Orbitron, Saira Condensed e Source Serif 4 são SIL Open Font License 1.1 —
redistribuir junto do módulo é permitido, e é o que mantém o estilo do livro
funcionando numa mesa offline. Um `@import` do Google Fonts falharia calado: a
página cairia para a fonte do sistema sem avisar ninguém.

Só os subsets latin e latin-ext — o português cabe nos dois, e cyrillic, greek
e vietnamese seriam peso morto no zip.

Uso: python tools/baixar-fontes.py
"""
import io
import os
import re
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.join(AQUI, "..", "starwars-sd-module", "fonts")
DEST_CSS = os.path.join(AQUI, "..", "starwars-sd-module", "styles")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")
# o UA moderno é o que faz o Google devolver woff2; um UA antigo devolve ttf
CSS_URL = ("https://fonts.googleapis.com/css2"
           "?family=Orbitron:wght@500;700;900"
           "&family=Saira+Condensed:wght@400;600;700"
           "&family=Source+Serif+4:ital,wght@0,400;0,600;1,400"
           "&display=swap")
QUERO = {"latin", "latin-ext"}

CABECALHO = """/* As fontes do livro, embutidas.
 *
 * Orbitron, Saira Condensed e Source Serif 4 são SIL Open Font License 1.1
 * (ver LICENSE.md). Vão no módulo em vez de um @import do Google Fonts porque
 * um @import falha CALADO sem internet: a mesa cairia para a fonte do sistema
 * e ninguém saberia por quê.
 *
 * Só os subsets latin e latin-ext; o resto seria peso morto no zip.
 *
 * GERADO POR tools/baixar-fontes.py — NÃO EDITE À MÃO.
 */

"""


def pega(url, binario=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req) as r:
        return r.read() if binario else r.read().decode("utf-8")


def main():
    os.makedirs(DEST, exist_ok=True)
    css = pega(CSS_URL)
    # cada @font-face vem precedido de um comentário com o nome do subset
    blocos = re.findall(r"/\* ([a-z-]+) \*/\s*(@font-face \{.*?\})", css, re.S)
    regras, baixados = [], 0
    for subset, bloco in blocos:
        if subset not in QUERO:
            continue
        fam = re.search(r"font-family: '([^']+)'", bloco).group(1)
        peso = re.search(r"font-weight: (\d+)", bloco).group(1)
        estilo = re.search(r"font-style: (\w+)", bloco).group(1)
        url = re.search(r"url\(([^)]+)\)", bloco).group(1)
        uni = re.search(r"unicode-range: ([^;]+);", bloco).group(1)
        nome = "%s-%s%s-%s.woff2" % (fam.lower().replace(" ", "-"), peso,
                                     "-italic" if estilo == "italic" else "", subset)
        alvo = os.path.join(DEST, nome)
        if not os.path.exists(alvo):
            with open(alvo, "wb") as f:
                f.write(pega(url, binario=True))
            baixados += 1
        regras.append(
            "@font-face {\n"
            "  font-family: '%s';\n  font-style: %s;\n  font-weight: %s;\n"
            "  font-display: swap;\n"
            "  src: url('../fonts/%s') format('woff2');\n"
            "  unicode-range: %s;\n}" % (fam, estilo, peso, nome, uni))

    io.open(os.path.join(DEST_CSS, "fontes.css"), "w", encoding="utf-8",
            newline="\n").write(CABECALHO + "\n\n".join(regras) + "\n")

    peso_total = sum(os.path.getsize(os.path.join(DEST, f))
                     for f in os.listdir(DEST) if f.endswith(".woff2"))
    print("  OK %d arquivos (%d novos), %d regras, %d KB"
          % (len([f for f in os.listdir(DEST) if f.endswith('.woff2')]),
             baixados, len(regras), peso_total // 1024))


if __name__ == "__main__":
    main()
