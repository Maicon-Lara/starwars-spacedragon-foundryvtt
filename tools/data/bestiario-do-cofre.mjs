// GERADO POR tools/importar-cofre.mjs — NÃO EDITE À MÃO.
// Fonte: o cofre, Documents\Ekhoria\20 Space Dragon\Space Dragon Nativo\
//   SW-SDN-Bestiario.md — o roster e a tabela de atributos.
//
// Os números são os do livro básico, com o nome como o cofre o escreve:
// "Glacioprimata (Wampa)" acha pelos dois lados.

export const CRIATURAS = [
  {
    "nome": "Aranha gigante",
    "tamanho": "grande",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "10",
      "mve": "6"
    },
    "dv": "3+1",
    "pv": 25,
    "ca": "14",
    "jp": "15",
    "moral": "70%",
    "xp": "205",
    "ataques": [
      {
        "qtd": 1,
        "nome": "mordida",
        "bonus": 2,
        "dano": "2d6+2"
      },
      {
        "qtd": 1,
        "nome": "ferroada",
        "bonus": 3,
        "dano": "1d8+3 + veneno"
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 15,
      "DES": 17,
      "CON": 12,
      "INT": 0,
      "CIE": 5,
      "COM": 2
    }
  },
  {
    "nome": "Autômato (droide)",
    "tamanho": "medio",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "9"
    },
    "dv": "4+1",
    "pv": 33,
    "ca": "14",
    "jp": "15",
    "moral": "100%",
    "xp": "245",
    "ataques": [
      {
        "qtd": 1,
        "nome": "pancada",
        "bonus": 2,
        "dano": "1d6+2"
      }
    ],
    "habilidades": [
      {
        "nome": "desativável"
      }
    ],
    "atributos": {
      "FOR": 14,
      "DES": 10,
      "CON": 12,
      "INT": 7,
      "CIE": 10,
      "COM": 3
    }
  },
  {
    "nome": "Cristaloide",
    "tamanho": "medio",
    "alinhamento": "neutro",
    "movimentos": {
      "mv": "6"
    },
    "dv": "8+3",
    "pv": 67,
    "ca": "16",
    "jp": "14",
    "moral": "80%",
    "xp": "945",
    "ataques": [
      {
        "qtd": 1,
        "nome": "pancada",
        "bonus": 7,
        "dano": "1d10+6"
      }
    ],
    "habilidades": [
      {
        "nome": "reflete energia em falha crít."
      }
    ],
    "atributos": {
      "FOR": 18,
      "DES": 7,
      "CON": 16,
      "INT": 5,
      "CIE": 0,
      "COM": 2
    },
    "rd": "6/físico"
  },
  {
    "nome": "Bolha verde",
    "tamanho": "pequeno",
    "alinhamento": "neutro",
    "movimentos": {
      "mv": "4"
    },
    "dv": "1",
    "pv": 8,
    "ca": "10",
    "jp": "19",
    "moral": "60%",
    "xp": "37",
    "ataques": [],
    "habilidades": [
      {
        "nome": "envolver [especial] — juntas viram geleia"
      }
    ],
    "atributos": {
      "FOR": 5,
      "DES": 7,
      "CON": 2,
      "INT": 2,
      "CIE": 0,
      "COM": 0
    }
  },
  {
    "nome": "Devorador de mentes",
    "tamanho": "pequeno",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "9"
    },
    "dv": "3",
    "pv": 24,
    "ca": "12",
    "jp": "17",
    "moral": "80%",
    "xp": "175",
    "ataques": [],
    "habilidades": [
      {
        "nome": "poderes da Força até 3ª Grandeza"
      },
      {
        "nome": "levita"
      }
    ],
    "atributos": {
      "FOR": 5,
      "DES": 10,
      "CON": 4,
      "INT": 16,
      "CIE": 14,
      "COM": 12
    }
  },
  {
    "nome": "Crocossauro",
    "tamanho": "imenso",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "9",
      "mvn": "12"
    },
    "dv": "6+2",
    "pv": 50,
    "ca": "16",
    "jp": "14",
    "moral": "80%",
    "xp": "555",
    "ataques": [
      {
        "qtd": 1,
        "nome": "mordida",
        "bonus": 6,
        "dano": "1d10+4 + agarrar"
      },
      {
        "qtd": 1,
        "nome": "cauda",
        "bonus": 3,
        "dano": "1d6+1"
      }
    ],
    "habilidades": [
      {
        "nome": "giro 2d10+4"
      }
    ],
    "atributos": {
      "FOR": 16,
      "DES": 13,
      "CON": 14,
      "INT": 8,
      "CIE": 0,
      "COM": 0
    }
  },
  {
    "nome": "Eletricobra",
    "tamanho": "medio",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "9",
      "mvn": "6"
    },
    "dv": "2",
    "pv": 16,
    "ca": "14",
    "jp": "14",
    "moral": "60%",
    "xp": "100",
    "ataques": [
      {
        "qtd": 1,
        "nome": "mordida",
        "bonus": 4,
        "dano": "1d6 + 1d4 elétrico"
      }
    ],
    "habilidades": [
      {
        "nome": "descarga (1d8 elét. + paralisia 5 m²)"
      }
    ],
    "atributos": {
      "FOR": 8,
      "DES": 18,
      "CON": 8,
      "INT": 5,
      "CIE": 0,
      "COM": 2
    }
  },
  {
    "nome": "Escaravelho radioativo",
    "tamanho": "grande",
    "alinhamento": "neutro",
    "movimentos": {
      "mv": "6",
      "mvv": "4"
    },
    "dv": "5+2",
    "pv": 42,
    "ca": "14",
    "jp": "16",
    "moral": "60%",
    "xp": "405",
    "ataques": [
      {
        "qtd": 1,
        "nome": "pinça",
        "bonus": 6,
        "dano": "1d6+4 + radiação 15%"
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 12,
      "DES": 10,
      "CON": 14,
      "INT": 2,
      "CIE": 0,
      "COM": 0
    }
  },
  {
    "nome": "Encrustáceo",
    "tamanho": "grande",
    "alinhamento": "neutro",
    "movimentos": {
      "mv": "6"
    },
    "dv": "5+2",
    "pv": 42,
    "ca": "16",
    "jp": "14",
    "moral": "70%",
    "xp": "405",
    "ataques": [
      {
        "qtd": 2,
        "nome": "garras",
        "bonus": 4,
        "dano": "1d6+2"
      }
    ],
    "habilidades": [
      {
        "nome": "concha (quase invulnerável)"
      }
    ],
    "atributos": {
      "FOR": 14,
      "DES": 10,
      "CON": 14,
      "INT": 5,
      "CIE": 0,
      "COM": 0
    },
    "rd": "4/ácido"
  },
  {
    "nome": "Geleia espacial",
    "tamanho": "medio",
    "alinhamento": "neutro",
    "movimentos": {
      "mv": "4"
    },
    "dv": "4",
    "pv": 32,
    "ca": "10",
    "jp": "15",
    "moral": "100%",
    "xp": "320",
    "ataques": [],
    "habilidades": [
      {
        "nome": "envolver [3 testes de Força; asfixia]"
      },
      {
        "nome": "imune a físico"
      }
    ],
    "atributos": {
      "FOR": 16,
      "DES": 6,
      "CON": 10,
      "INT": 2,
      "CIE": 4,
      "COM": 0
    }
  },
  {
    "nome": "Formigácida",
    "tamanho": "medio",
    "alinhamento": "ordeiro",
    "movimentos": {
      "mv": "6"
    },
    "dv": "2",
    "pv": 16,
    "ca": "13",
    "jp": "16",
    "moral": "90%",
    "xp": "100",
    "ataques": [
      {
        "qtd": 1,
        "nome": "pinça",
        "bonus": 2,
        "dano": "1d4+2"
      },
      {
        "qtd": 1,
        "nome": "jato ácido",
        "bonus": 1,
        "dano": "1d4, 5 m"
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 14,
      "DES": 12,
      "CON": 10,
      "INT": 6,
      "CIE": 0,
      "COM": 6
    }
  },
  {
    "nome": "Gigantossauro (Zillo/colosso)",
    "tamanho": "colossal",
    "alinhamento": "neutro",
    "movimentos": {
      "mv": "14"
    },
    "dv": "20+5",
    "pv": 165,
    "ca": "18",
    "jp": "6",
    "moral": "90%",
    "xp": "7.250",
    "ataques": [
      {
        "qtd": 1,
        "nome": "pisão",
        "bonus": 14,
        "dano": "2d10+9 [crít.: dano massivo]"
      },
      {
        "qtd": 1,
        "nome": "cauda",
        "bonus": 10,
        "dano": "1d10+4"
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 28,
      "DES": 12,
      "CON": 20,
      "INT": 2,
      "CIE": 0,
      "COM": 2
    }
  },
  {
    "nome": "Gigante de pedra",
    "tamanho": "imenso",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "11"
    },
    "dv": "10+4",
    "pv": 84,
    "ca": "18",
    "jp": "12",
    "moral": "80%",
    "xp": "1.480",
    "ataques": [
      {
        "qtd": 1,
        "nome": "pancada",
        "bonus": 12,
        "dano": "4d6+6"
      },
      {
        "qtd": 1,
        "nome": "rocha",
        "bonus": 6,
        "dano": "3d6"
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 22,
      "DES": 14,
      "CON": 18,
      "INT": 8,
      "CIE": 6,
      "COM": 4
    },
    "rd": "6/ácido"
  },
  {
    "nome": "Homem lagarto",
    "tamanho": "medio",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "9"
    },
    "dv": "4+1",
    "pv": 33,
    "ca": "14",
    "jp": "16",
    "moral": "60%",
    "xp": "280",
    "ataques": [
      {
        "qtd": 1,
        "nome": "mordida",
        "bonus": 3,
        "dano": "1d6+3"
      },
      {
        "qtd": 1,
        "nome": "cauda",
        "bonus": 2,
        "dano": "1d4+2"
      },
      {
        "qtd": 1,
        "nome": "lança",
        "bonus": 1,
        "dano": "1d8+3"
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 14,
      "DES": 14,
      "CON": 12,
      "INT": 9,
      "CIE": 8,
      "COM": 8
    },
    "rm": "10%"
  },
  {
    "nome": "Glacioprimata (Wampa)",
    "tamanho": "grande",
    "alinhamento": "neutro",
    "movimentos": {
      "mv": "9"
    },
    "dv": "8+3",
    "pv": 67,
    "ca": "14",
    "jp": "13",
    "moral": "80%",
    "xp": "875",
    "ataques": [
      {
        "qtd": 2,
        "nome": "pancadas",
        "bonus": 8,
        "dano": "1d10+3"
      },
      {
        "qtd": 1,
        "nome": "rocha",
        "bonus": 3,
        "dano": "1d8+3"
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 20,
      "DES": 16,
      "CON": 16,
      "INT": 4,
      "CIE": 2,
      "COM": 4
    }
  },
  {
    "nome": "Homenzinho verde",
    "tamanho": "pequeno",
    "alinhamento": "neutro",
    "movimentos": {
      "mv": "4"
    },
    "dv": "1",
    "pv": 8,
    "ca": "13",
    "jp": "18",
    "moral": "70%",
    "xp": "37",
    "ataques": [
      {
        "qtd": 1,
        "nome": "mini pistola",
        "bonus": 2,
        "dano": "1d4"
      }
    ],
    "habilidades": [
      {
        "nome": "ciência avançada"
      }
    ],
    "atributos": {
      "FOR": 8,
      "DES": 14,
      "CON": 9,
      "INT": 16,
      "CIE": 16,
      "COM": 14
    },
    "rm": "15%"
  },
  {
    "nome": "Ictihomem",
    "tamanho": "medio",
    "alinhamento": "neutro",
    "movimentos": {
      "mv": "6",
      "mvn": "8"
    },
    "dv": "6",
    "pv": 48,
    "ca": "15",
    "jp": "14",
    "moral": "70%",
    "xp": "555",
    "ataques": [
      {
        "qtd": 1,
        "nome": "lança",
        "bonus": 7,
        "dano": "1d8+2"
      }
    ],
    "habilidades": [
      {
        "nome": "respira água"
      }
    ],
    "atributos": {
      "FOR": 14,
      "DES": 12,
      "CON": 10,
      "INT": 12,
      "CIE": 10,
      "COM": 9
    },
    "rm": "20%"
  },
  {
    "nome": "Humanoide robótico (droide)",
    "tamanho": "medio",
    "alinhamento": "neutro",
    "movimentos": {
      "mv": "9"
    },
    "dv": "9+3",
    "pv": 75,
    "ca": "15",
    "jp": "12",
    "moral": "100%",
    "xp": "1.075",
    "ataques": [
      {
        "qtd": 1,
        "nome": "pancada",
        "bonus": 8,
        "dano": "1d8+4"
      },
      {
        "qtd": 1,
        "nome": "raio laser",
        "bonus": 4,
        "dano": "1d6"
      }
    ],
    "habilidades": [
      {
        "nome": "desativável"
      }
    ],
    "atributos": {
      "FOR": 14,
      "DES": 12,
      "CON": 16,
      "INT": 10,
      "CIE": 12,
      "COM": 8
    }
  },
  {
    "nome": "Lobo sônico (Nexu/loth-wolf)",
    "tamanho": "medio",
    "alinhamento": "ordeiro",
    "movimentos": {
      "mv": "18"
    },
    "dv": "2+1",
    "pv": 17,
    "ca": "13",
    "jp": "16",
    "moral": "90%",
    "xp": "100",
    "ataques": [
      {
        "qtd": 1,
        "nome": "mordida",
        "bonus": 2,
        "dano": "1d6"
      }
    ],
    "habilidades": [
      {
        "nome": "uivo sônico [JPM ou −2 em tudo]"
      }
    ],
    "atributos": {
      "FOR": 10,
      "DES": 16,
      "CON": 12,
      "INT": 8,
      "CIE": 0,
      "COM": 6
    }
  },
  {
    "nome": "Lagarto do deserto (dewback bravo)",
    "tamanho": "grande",
    "alinhamento": "neutro",
    "movimentos": {
      "mv": "12"
    },
    "dv": "7+2",
    "pv": 58,
    "ca": "14",
    "jp": "15",
    "moral": "80%",
    "xp": "635",
    "ataques": [
      {
        "qtd": 1,
        "nome": "cauda",
        "bonus": 8,
        "dano": "1d8+4"
      },
      {
        "qtd": 1,
        "nome": "língua",
        "bonus": 5,
        "dano": "1d4+2 + envolver, 15 m"
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 14,
      "DES": 12,
      "CON": 14,
      "INT": 4,
      "CIE": 0,
      "COM": 2
    }
  },
  {
    "nome": "Mastodonte (Bantha)",
    "tamanho": "imenso",
    "alinhamento": "neutro",
    "movimentos": {
      "mv": "10"
    },
    "dv": "12+5",
    "pv": 101,
    "ca": "15",
    "jp": "11",
    "moral": "80%",
    "xp": "2.075",
    "ataques": [
      {
        "qtd": 1,
        "nome": "presas",
        "bonus": 14,
        "dano": "2d8+8 + arremesso"
      }
    ],
    "habilidades": [
      {
        "nome": "atropelar"
      }
    ],
    "nota": "Movimento: estouro 15.",
    "atributos": {
      "FOR": 26,
      "DES": 14,
      "CON": 20,
      "INT": 4,
      "CIE": 0,
      "COM": 4
    }
  },
  {
    "nome": "Lula da areia (Sarlacc jovem)",
    "tamanho": "imenso",
    "alinhamento": "neutro",
    "movimentos": {
      "mv": "4"
    },
    "dv": "10+2",
    "pv": 82,
    "ca": "12",
    "jp": "12",
    "moral": "70%",
    "xp": "1.390",
    "ataques": [
      {
        "qtd": 2,
        "nome": "tentáculos",
        "bonus": 8,
        "dano": "1d6+6 + agarrar"
      }
    ],
    "habilidades": [
      {
        "nome": "arrasta p/ baixo da areia"
      }
    ],
    "atributos": {
      "FOR": 20,
      "DES": 14,
      "CON": 14,
      "INT": 4,
      "CIE": 0,
      "COM": 0
    }
  },
  {
    "nome": "Megassauro (Rancor)",
    "tamanho": "imenso",
    "alinhamento": "neutro",
    "movimentos": {
      "mv": "10"
    },
    "dv": "12+6",
    "pv": 102,
    "ca": "16",
    "jp": "12",
    "moral": "90%",
    "xp": "1.975",
    "ataques": [
      {
        "qtd": 1,
        "nome": "mordida",
        "bonus": 12,
        "dano": "2d10+5 + agarrar 1d8/rod."
      },
      {
        "qtd": 1,
        "nome": "cauda",
        "bonus": 6,
        "dano": "1d8+3"
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 28,
      "DES": 14,
      "CON": 22,
      "INT": 6,
      "CIE": 0,
      "COM": 2
    }
  },
  {
    "nome": "Medusa elétrica",
    "tamanho": "pequeno",
    "alinhamento": "neutro",
    "movimentos": {
      "mv": "6"
    },
    "pv": 1,
    "ca": "11",
    "jp": "19",
    "moral": "100%",
    "xp": "10",
    "ataques": [
      {
        "qtd": 1,
        "nome": "tentáculo",
        "bonus": 0,
        "dano": "1d4 elétrico"
      }
    ],
    "habilidades": [
      {
        "nome": "sem cérebro"
      }
    ],
    "nota": "1 ponto de vida, sem dado de vida.",
    "atributos": {
      "FOR": 2,
      "DES": 12,
      "CON": 2,
      "INT": 0,
      "CIE": 0,
      "COM": 0
    }
  },
  {
    "nome": "Metalópode (droide-aranha)",
    "tamanho": "imenso",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "12"
    },
    "dv": "9",
    "pv": 72,
    "ca": "15",
    "jp": "14",
    "moral": "100%",
    "xp": "1.150",
    "ataques": [
      {
        "qtd": 1,
        "nome": "disparador",
        "bonus": 8,
        "dano": "1d12"
      }
    ],
    "habilidades": [
      {
        "nome": "acerebral: NÃO desativável"
      }
    ],
    "atributos": {
      "FOR": 14,
      "DES": 14,
      "CON": 10,
      "INT": 6,
      "CIE": 12,
      "COM": 4
    }
  },
  {
    "nome": "Metahumano (droide de combate avançado)",
    "tamanho": "medio",
    "alinhamento": "neutro",
    "movimentos": {
      "mv": "9"
    },
    "dv": "12+4",
    "pv": 100,
    "ca": "16",
    "jp": "11",
    "moral": "80%",
    "xp": "1.975",
    "ataques": [
      {
        "qtd": 1,
        "nome": "pistola",
        "bonus": 10,
        "dano": "1d6"
      },
      {
        "qtd": 1,
        "nome": "rifle",
        "bonus": 6,
        "dano": "1d8"
      }
    ],
    "habilidades": [
      {
        "nome": "desativável"
      }
    ],
    "atributos": {
      "FOR": 14,
      "DES": 14,
      "CON": 18,
      "INT": 12,
      "CIE": 14,
      "COM": 12
    },
    "rm": "5%"
  },
  {
    "nome": "Multiforma (Clawdite)",
    "tamanho": "medio",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "9"
    },
    "dv": "3+1",
    "pv": 25,
    "ca": "14",
    "jp": "16",
    "moral": "70%",
    "xp": "205",
    "ataques": [
      {
        "qtd": 1,
        "nome": "pancada",
        "bonus": 3,
        "dano": "1d6+1"
      }
    ],
    "habilidades": [
      {
        "nome": "metamorfose (criatura ≤ média)"
      }
    ],
    "atributos": {
      "FOR": 12,
      "DES": 14,
      "CON": 12,
      "INT": 13,
      "CIE": 14,
      "COM": 10
    },
    "rm": "30%"
  },
  {
    "nome": "Monstro de energia",
    "tamanho": "medio",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "12"
    },
    "dv": "5",
    "pv": 40,
    "ca": "14",
    "jp": "1",
    "moral": "60%",
    "xp": "450",
    "ataques": [
      {
        "qtd": 1,
        "nome": "toque",
        "bonus": 4,
        "dano": "1d6+2 elétrico"
      }
    ],
    "habilidades": [
      {
        "nome": "incorpóreo, imune a físico"
      }
    ],
    "atributos": {
      "FOR": 0,
      "DES": 18,
      "CON": 0,
      "INT": 6,
      "CIE": 4,
      "COM": 2
    }
  },
  {
    "nome": "Monstro de lava (Mustafar)",
    "tamanho": "grande",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "6"
    },
    "dv": "7+3",
    "pv": 59,
    "ca": "15",
    "jp": "14",
    "moral": "70%",
    "xp": "735",
    "ataques": [
      {
        "qtd": 1,
        "nome": "pancada",
        "bonus": 8,
        "dano": "1d10+6 fogo"
      }
    ],
    "habilidades": [
      {
        "nome": "baforada (1d6 fogo, 6 m)"
      },
      {
        "nome": "imune a fogo"
      }
    ],
    "atributos": {
      "FOR": 20,
      "DES": 12,
      "CON": 16,
      "INT": 4,
      "CIE": 0,
      "COM": 4
    }
  },
  {
    "nome": "Monstro de gelo (Hoth)",
    "tamanho": "grande",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "6"
    },
    "dv": "6+2",
    "pv": 50,
    "ca": "15",
    "jp": "14",
    "moral": "70%",
    "xp": "555",
    "ataques": [
      {
        "qtd": 1,
        "nome": "pancada",
        "bonus": 6,
        "dano": "1d10+4"
      }
    ],
    "habilidades": [
      {
        "nome": "sopro gélido (1d6 + JPF ou paralisia)"
      },
      {
        "nome": "imune a gelo"
      }
    ],
    "atributos": {
      "FOR": 18,
      "DES": 12,
      "CON": 14,
      "INT": 4,
      "CIE": 0,
      "COM": 4
    }
  },
  {
    "nome": "Monstro do pântano (Dagobah)",
    "tamanho": "grande",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "6"
    },
    "dv": "8+4",
    "pv": 68,
    "ca": "14",
    "jp": "13",
    "moral": "80%",
    "xp": "875",
    "ataques": [
      {
        "qtd": 1,
        "nome": "pancada",
        "bonus": 10,
        "dano": "2d8+4"
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 18,
      "DES": 12,
      "CON": 18,
      "INT": 6,
      "CIE": 0,
      "COM": 4
    }
  },
  {
    "nome": "Planta carnívora",
    "tamanho": "grande",
    "alinhamento": "neutro",
    "movimentos": {},
    "dv": "1",
    "pv": 8,
    "ca": "10",
    "jp": "18",
    "moral": "100%",
    "xp": "37",
    "ataques": [],
    "habilidades": [
      {
        "nome": "agarrar (1d4/rod.; engolida 1d6 ácido/rod.)"
      }
    ],
    "nota": "Movimento: imóvel.",
    "atributos": {
      "FOR": 14,
      "DES": 8,
      "CON": 1,
      "INT": 0,
      "CIE": 0,
      "COM": 0
    }
  },
  {
    "nome": "Pterohomem (Geonosiano voador)",
    "tamanho": "medio",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "9",
      "mvv": "12"
    },
    "dv": "3",
    "pv": 24,
    "ca": "14",
    "jp": "17",
    "moral": "80%",
    "xp": "175",
    "ataques": [
      {
        "qtd": 1,
        "nome": "garra",
        "bonus": 4,
        "dano": "1d6+2"
      },
      {
        "qtd": 1,
        "nome": "pistola",
        "bonus": 3,
        "dano": "1d6"
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 14,
      "DES": 16,
      "CON": 10,
      "INT": 9,
      "CIE": 6,
      "COM": 9
    },
    "rm": "35%"
  },
  {
    "nome": "Pteroave",
    "tamanho": "grande",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "6",
      "mvv": "14"
    },
    "dv": "8+2",
    "pv": 66,
    "ca": "17",
    "jp": "11",
    "moral": "80%",
    "xp": "945",
    "ataques": [
      {
        "qtd": 1,
        "nome": "bicada",
        "bonus": 8,
        "dano": "1d8+5"
      },
      {
        "qtd": 2,
        "nome": "garras",
        "bonus": 3,
        "dano": "1d6+3 + suspensão"
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 18,
      "DES": 20,
      "CON": 14,
      "INT": 4,
      "CIE": 0,
      "COM": 3
    }
  },
  {
    "nome": "Raptossauro (raptor)",
    "tamanho": "pequeno",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "16"
    },
    "dv": "2",
    "pv": 16,
    "ca": "13",
    "jp": "18",
    "moral": "70%",
    "xp": "100",
    "ataques": [
      {
        "qtd": 1,
        "nome": "mordida",
        "bonus": 3,
        "dano": "1d6+1"
      },
      {
        "qtd": 2,
        "nome": "garras",
        "bonus": 1,
        "dano": "1d4"
      }
    ],
    "habilidades": [
      {
        "nome": "caça em grupo (+1/aliado)"
      }
    ],
    "atributos": {
      "FOR": 12,
      "DES": 16,
      "CON": 10,
      "INT": 2,
      "CIE": 0,
      "COM": 2
    }
  },
  {
    "nome": "Rinoceratops (Reek)",
    "tamanho": "imenso",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "12"
    },
    "dv": "10+5",
    "pv": 85,
    "ca": "17",
    "jp": "12",
    "moral": "90%",
    "xp": "1.390",
    "ataques": [
      {
        "qtd": 1,
        "nome": "chifrada",
        "bonus": 15,
        "dano": "2d10+8 + arremesso"
      },
      {
        "qtd": 1,
        "nome": "cabeçada",
        "bonus": 8,
        "dano": "1d10+6"
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 25,
      "DES": 16,
      "CON": 20,
      "INT": 2,
      "CIE": 0,
      "COM": 2
    }
  },
  {
    "nome": "Simihomem",
    "tamanho": "medio",
    "alinhamento": "neutro",
    "movimentos": {
      "mv": "9"
    },
    "dv": "5+2",
    "pv": 42,
    "ca": "14",
    "jp": "14",
    "moral": "80%",
    "xp": "450",
    "ataques": [
      {
        "qtd": 1,
        "nome": "espada",
        "bonus": 6,
        "dano": "1d8+4"
      },
      {
        "qtd": 1,
        "nome": "zarabatana",
        "bonus": 3,
        "dano": "1d4 + veneno"
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 18,
      "DES": 14,
      "CON": 14,
      "INT": 11,
      "CIE": 5,
      "COM": 12
    },
    "rm": "5%"
  },
  {
    "nome": "Tentaculoide (Dianoga colossal)",
    "tamanho": "imenso",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "12"
    },
    "dv": "12+3",
    "pv": 99,
    "ca": "15",
    "jp": "12",
    "moral": "80%",
    "xp": "2.075",
    "ataques": [
      {
        "qtd": 2,
        "nome": "tentáculos",
        "bonus": 12,
        "dano": "2d6+2 + agarrar"
      }
    ],
    "habilidades": [
      {
        "nome": "jato ácido (1d6, mancha 10 m²)"
      }
    ],
    "atributos": {
      "FOR": 20,
      "DES": 16,
      "CON": 16,
      "INT": 2,
      "CIE": 0,
      "COM": 1
    }
  },
  {
    "nome": "Taurópode",
    "tamanho": "grande",
    "alinhamento": "ordeiro",
    "movimentos": {
      "mv": "12"
    },
    "dv": "5+4",
    "pv": 44,
    "ca": "14",
    "jp": "15",
    "moral": "90%",
    "xp": "360",
    "ataques": [
      {
        "qtd": 1,
        "nome": "chifrada",
        "bonus": 8,
        "dano": "1d10+4"
      },
      {
        "qtd": 1,
        "nome": "coice",
        "bonus": 4,
        "dano": "1d6+2"
      }
    ],
    "habilidades": [
      {
        "nome": "bovino de 8 patas"
      }
    ],
    "atributos": {
      "FOR": 20,
      "DES": 14,
      "CON": 18,
      "INT": 4,
      "CIE": 0,
      "COM": 1
    }
  },
  {
    "nome": "Tiranossauro",
    "tamanho": "imenso",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "10"
    },
    "dv": "14+4",
    "pv": 116,
    "ca": "15",
    "jp": "11",
    "moral": "90%",
    "xp": "2.615",
    "ataques": [
      {
        "qtd": 1,
        "nome": "mordida",
        "bonus": 16,
        "dano": "3d8+6 + engolir"
      },
      {
        "qtd": 1,
        "nome": "cauda",
        "bonus": 10,
        "dano": "2d6+2"
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 22,
      "DES": 14,
      "CON": 18,
      "INT": 2,
      "CIE": 0,
      "COM": 1
    }
  },
  {
    "nome": "Tigre dentes-de-sabre (felino)",
    "tamanho": "grande",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "14"
    },
    "dv": "7+4",
    "pv": 60,
    "ca": "14",
    "jp": "14",
    "moral": "90%",
    "xp": "735",
    "ataques": [
      {
        "qtd": 1,
        "nome": "mordida",
        "bonus": 6,
        "dano": "1d8+4 [crít.: perde membro]"
      },
      {
        "qtd": 2,
        "nome": "garras",
        "bonus": 3,
        "dano": "1d6+1"
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 18,
      "DES": 18,
      "CON": 18,
      "INT": 4,
      "CIE": 0,
      "COM": 2
    }
  },
  {
    "nome": "Verme gigante (Exogorth)",
    "tamanho": "imenso",
    "alinhamento": "neutro",
    "movimentos": {
      "mvo": "6"
    },
    "dv": "4",
    "pv": 32,
    "ca": "11",
    "jp": "15",
    "moral": "70%",
    "xp": "280",
    "ataques": [
      {
        "qtd": 1,
        "nome": "mordida",
        "bonus": 5,
        "dano": "1d8 + engolir em crít."
      }
    ],
    "habilidades": [
      {
        "nome": "sem sentidos"
      }
    ],
    "atributos": {
      "FOR": 11,
      "DES": 12,
      "CON": 8,
      "INT": 2,
      "CIE": 12,
      "COM": 0
    }
  },
  {
    "nome": "Vampiro energético",
    "tamanho": "medio",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "9"
    },
    "dv": "4+4",
    "pv": 36,
    "ca": "13",
    "jp": "14",
    "moral": "70%",
    "xp": "280",
    "ataques": [
      {
        "qtd": 1,
        "nome": "toque",
        "bonus": 4,
        "dano": "dreno: −1d4 DV, curam a criatura",
        "semDado": true
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 14,
      "DES": 16,
      "CON": 18,
      "INT": 5,
      "CIE": 2,
      "COM": 5
    }
  },
  {
    "nome": "Zangão gigante",
    "tamanho": "pequeno",
    "alinhamento": "ordeiro",
    "movimentos": {
      "mv": "6"
    },
    "dv": "1",
    "pv": 8,
    "ca": "13",
    "jp": "16",
    "moral": "90%",
    "xp": "37",
    "ataques": [
      {
        "qtd": 1,
        "nome": "ferrão",
        "bonus": 2,
        "dano": "1d4 veneno cumulativo; ataque suicida"
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 10,
      "DES": 16,
      "CON": 6,
      "INT": 2,
      "CIE": 2,
      "COM": 4
    }
  },
  {
    "nome": "Xheniano (casta mística Geonosiana)",
    "tamanho": "medio",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "6"
    },
    "dv": "6",
    "pv": 48,
    "ca": "12",
    "jp": "14",
    "moral": "80%",
    "xp": "610",
    "ataques": [
      {
        "qtd": 2,
        "nome": "garras",
        "bonus": 3,
        "dano": "1d8+2"
      }
    ],
    "habilidades": [
      {
        "nome": "poderes da Força até 5ª Grandeza"
      }
    ],
    "atributos": {
      "FOR": 14,
      "DES": 12,
      "CON": 10,
      "INT": 20,
      "CIE": 20,
      "COM": 12
    },
    "rm": "90%"
  },
  {
    "nome": "Zork",
    "tamanho": "medio",
    "alinhamento": "caotico",
    "movimentos": {
      "mv": "6"
    },
    "dv": "1+1",
    "pv": 9,
    "ca": "15",
    "jp": "16",
    "moral": "70%",
    "xp": "37",
    "ataques": [
      {
        "qtd": 1,
        "nome": "pistola",
        "bonus": 1,
        "dano": "1d6"
      },
      {
        "qtd": 1,
        "nome": "lança",
        "bonus": 3,
        "dano": "1d8+3"
      }
    ],
    "habilidades": [],
    "atributos": {
      "FOR": 17,
      "DES": 12,
      "CON": 12,
      "INT": 10,
      "CIE": 7,
      "COM": 6
    },
    "rm": "20%"
  }
];
