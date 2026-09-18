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
    if os.path.exists(OUT):
        os.remove(OUT)

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

    dentro = set(entradas)

    # ── Sanidade do zip ──
    with zipfile.ZipFile(OUT) as z:
        assert z.testzip() is None, "zip corrompido"
        assert not any("\\" in n for n in z.namelist()), "separador inválido"

    # ── Sanidade do manifesto ──
    # Todo caminho que o module.json declara precisa ter entrado. É a
    # verificação que teria pego o templates/ faltando na v1.7.0.
    manifesto = json.load(open(os.path.join(SRC, "module.json"), encoding="utf-8"))
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

    if faltando:
        raise SystemExit(
            "  ✘ o zip saiu incompleto — o manifesto ou o código apontam para:\n     "
            + "\n     ".join(sorted(set(faltando)))
        )

    pastas = sorted({n.split("/")[0] for n in dentro if "/" in n})
    print(f"  OK starwars-sd.zip: {len(entradas)} entradas · {', '.join(pastas)}")


if __name__ == "__main__":
    main()
