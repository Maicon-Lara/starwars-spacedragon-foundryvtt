#!/usr/bin/env python3
"""Gera o starwars-sd.zip de distribuição a partir de starwars-sd-module/.

Usa zipfile (zip padrão, separadores '/', sem data descriptors) — compatível
com o extrator do Foundry (unzipper). NÃO usar `tar` do Windows: o bsdtar/GNU
tar ignora a extensão .zip e gera um tar disfarçado, que o Foundry rejeita
com FILE_ENDED.

POR QUE A LISTA É DE EXCLUSÃO, E NÃO DE INCLUSÃO. A versão anterior tinha um
ITEMS = ["module.json", "packs", "styles", ...] e um `continue` silencioso para
o que não existisse. Resultado: a pasta `templates/` foi criada na v1.7.0, não
estava na lista, e o zip saiu sem ela — a ficha de Nave subiu para o servidor
sem o próprio template e não abria, com um ENOENT que só aparecia no cliente.

Agora vai tudo o que está em starwars-sd-module/, menos o que a lista abaixo
exclui. Pasta nova entra sozinha; para deixar algo de fora é preciso dizer.

Uso: python tools/make-zip.py   (a partir da raiz do repositório)
"""
import json
import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "starwars-sd-module")
OUT = os.path.join(ROOT, "starwars-sd.zip")

# O que NÃO vai para o zip. Tudo o mais vai.
DIRS_FORA = {".git", "__pycache__", "node_modules", ".vscode"}
ARQS_FORA = {".DS_Store", "Thumbs.db", ".gitkeep"}
SUFIXOS_FORA = (".map", ".less", ".bak", "~")


def main():
    # ── O MANIFESTO ANTES DE QUALQUER COISA ──
    #
    # Esta leitura ficava DEPOIS de escrever o zip. A 1.37.1 saiu com um
    # module.json de 0 byte: o json.load estourou, mas o zip inválido já estava
    # no disco, e quem rodou o comando num pipe não viu o erro. Validar antes
    # significa que um manifesto quebrado não produz arquivo nenhum.
    # Antes de tudo, inclusive da validação: se o manifesto estiver quebrado, o
    # certo é não haver arquivo nenhum. Um zip da versão passada esperando no
    # disco é o que se publica sem perceber.
    if os.path.exists(OUT):
        os.remove(OUT)

    caminho_manifesto = os.path.join(SRC, "module.json")
    cru = open(caminho_manifesto, encoding="utf-8").read()
    if not cru.strip():
        raise SystemExit(
            "module.json está VAZIO — nada a empacotar. "
            "(Um bump que abre o arquivo em modo escrita antes de ler trunca tudo.)"
        )
    try:
        manifesto = json.loads(cru)
    except json.JSONDecodeError as e:
        raise SystemExit(f"module.json não é JSON válido: {e}")
    if not manifesto.get("version"):
        raise SystemExit("module.json sem version — o Foundry recusa a instalação")
    print(f"  manifesto {manifesto['id']} {manifesto['version']} ({len(cru)} bytes)")

    entradas = []
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for dirpath, dirnames, files in os.walk(SRC):
            dirnames[:] = [d for d in sorted(dirnames) if d not in DIRS_FORA]
            for f in sorted(files):
                if f in ARQS_FORA or f.endswith(SUFIXOS_FORA):
                    continue
                full = os.path.join(dirpath, f)
                arc = os.path.relpath(full, SRC).replace(os.sep, "/")
                z.write(full, arc)
                entradas.append(arc)

        # As licenças ficam na RAIZ do repositório, e o zip é montado de dentro
        # do módulo — sem isto elas não seriam distribuídas. A cláusula 10 da
        # OGL é explícita: "You MUST include a copy of this License with every
        # copy of the Open Game Content You Distribute". O zip É a distribuição.
        for nome in ("LICENSE.md", "OGL.txt"):
            origem = os.path.join(ROOT, nome)
            if not os.path.exists(origem):
                raise SystemExit(f"{nome} não existe na raiz: a OGL exige que ele vá no zip")
            z.write(origem, nome)
            entradas.append(nome)

    dentro = set(entradas)

    # ── Sanidade do zip ──
    with zipfile.ZipFile(OUT) as z:
        assert z.testzip() is None, "zip corrompido"
        assert not any("\\" in n for n in z.namelist()), "separador inválido"
        # O manifesto que vale é o de DENTRO do zip — é esse que o Foundry abre.
        # Conferir o de fora e publicar o de dentro vazio foi o erro da 1.37.1.
        dentro_cru = z.read("module.json").decode("utf-8")
        if not dentro_cru.strip():
            raise SystemExit("o module.json DENTRO do zip está vazio")
        if json.loads(dentro_cru).get("version") != manifesto["version"]:
            raise SystemExit("o module.json de dentro do zip é de outra versão")

    # ── Sanidade do manifesto ──
    # Todo caminho que o module.json declara precisa ter entrado. É a
    # verificação que teria pego o templates/ faltando na v1.7.0.
    faltando = []
    for campo in ("esmodules", "scripts", "styles"):
        for caminho in manifesto.get(campo) or []:
            if caminho not in dentro:
                faltando.append(f"{campo}: {caminho}")
    for pack in manifesto.get("packs") or []:
        p = pack.get("path", "").lstrip("/")
        if not any(n.startswith(p + "/") for n in dentro):
            faltando.append(f"pack {pack.get('name')}: {p}")

    # Todo template referenciado no código também precisa estar no zip: é o
    # caminho que o Foundry abre em tempo de execução, e faltar só aparece
    # quando alguém tenta abrir a ficha.
    for dirpath, _, files in os.walk(os.path.join(SRC, "module")):
        for f in files:
            if not f.endswith(".js"):
                continue
            texto = open(os.path.join(dirpath, f), encoding="utf-8").read()
            for ref in set(
                r for r in texto.split('"') + texto.split("'") if r.startswith("modules/starwars-sd/")
            ):
                alvo = ref[len("modules/starwars-sd/"):]
                if alvo not in dentro:
                    faltando.append(f"template citado em {f}: {alvo}")

    # Toda FONTE que uma folha de estilo referencia também precisa estar no
    # zip. É o mesmo caso do templates/ da v1.7.0, mas pior: um .woff2 que não
    # foi distribuído não dá erro em lugar nenhum — o navegador cai para a
    # fonte seguinte da pilha, e a mesa simplesmente vê Georgia no lugar de
    # Source Serif, sem uma linha no console que explique.
    import re

    for caminho in manifesto.get("styles") or []:
        arq = os.path.join(SRC, caminho.replace("/", os.sep))
        if not os.path.exists(arq):
            continue
        css = open(arq, encoding="utf-8").read()
        base = os.path.dirname(caminho)
        for url in re.findall(r"url\(['\"]?([^)'\"]+)['\"]?\)", css):
            if url.startswith(("http:", "https:", "data:", "//")):
                continue
            alvo = os.path.normpath(os.path.join(base, url)).replace(os.sep, "/")
            if alvo not in dentro:
                faltando.append(f"arquivo citado em {caminho}: {alvo}")

    if faltando:
        raise SystemExit(
            "  ✘ o zip saiu incompleto — o manifesto ou o código apontam para:\n     "
            + "\n     ".join(sorted(set(faltando)))
        )

    pastas = sorted({n.split("/")[0] for n in dentro if "/" in n})
    print(f"  OK starwars-sd.zip: {len(entradas)} entradas · {', '.join(pastas)}")


if __name__ == "__main__":
    main()
