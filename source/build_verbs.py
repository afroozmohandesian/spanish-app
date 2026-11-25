import json, sys
from conj import conjugate, TENSES
from verbs_list import parse

ES_SUBJ = ["Yo", "Tú", "Ella", "Nosotros", "Vosotros", "Ellos"]
ES_SUBJ_GUST = ["A mí", "A ti", "A ella", "A nosotros", "A vosotros", "A ellos"]
EN_SUBJ = ["I", "you", "she", "we", "you all", "they"]
POS = ["my", "your", "her", "our", "your", "their"]
BE_PRES = ["am", "are", "is", "are", "are", "are"]
BE_PAST = ["was", "were", "was", "were", "were", "were"]
HAVE = ["have", "have", "has", "have", "have", "have"]

ES_ADV = {"pres": "", "indef": "Ayer", "perf": "Hoy", "imperf": "Antes", "fut": "Mañana",
          "ira": "Este fin de semana", "cond": "Con más tiempo,", "prog": "Ahora", "pprog": "Ayer a las cinco", "subj": "Ojalá"}
EN_ADV = {"pres": "", "indef": "Yesterday", "perf": "Today", "imperf": "Before,", "fut": "Tomorrow",
          "ira": "This weekend", "cond": "With more time,", "prog": "Right now", "pprog": "Yesterday at five", "subj": "I hope"}

# Better complements for negative commands (or None = no negative example)
NEG = {"ser": ("impaciente/impacientes", "impatient"), "conducir": ("rápido", "fast"),
       "decir": ("una mentira", "a lie"), "tener": None, "estar": ("en la calle", "in the street"),
       "llegar": ("tarde", "late"), "terminar": None, "seguir": None, "ayudar": None,
       "contestar": ("el teléfono", "the phone"), "aprender": None, "estudiar": None,
       "trabajar": ("los domingos", "on Sundays"), "beber": ("mucho café", "too much coffee"),
       "dormir": ("en el sofá", "on the sofa"), "lavarse": None, "ducharse": None,
       "vestirse": None, "divertirse": None, "sentarse": ("en el suelo", "on the floor"),
       "levantarse": ("tarde", "up late"), "acostarse": ("tarde", "to bed late"),
       "despertarse": ("tarde", "up late"), "repetir": ("la misma frase", "the same sentence"),
       "pasar": ("el fin de semana en casa", "the weekend at home"), "hacer": ("ruido", "noise"),
       "caminar": ("por la carretera", "on the road"), "explicar": None, "enseñar": None,
       "limpiar": None, "lavar": None, "cocinar": None,
       "descansar": None, "cantar": ("en la biblioteca", "in the library"),
       "comer": ("dulces", "sweets"), "entender": None, "recibir": None, "recordar": None, "invitar": None, "ganar": None, "empezar": None, "mostrar": None, "dar": ("tu dirección a nadie", "your address to anyone")}

IMP_LABEL = [None, "", " (formal)", "", " (you all)", " (you all, formal)"]


def cap(s):
    s = s.strip()
    if s.startswith("¡") or s.startswith("¿"):
        return s[0] + s[1:2].upper() + s[2:]
    return s[:1].upper() + s[1:]


def en_verb_phrase(v, tense, i):
    """English verb phrase (without subject) for verb v, person i."""
    es = v["es"]
    if v["en"].startswith("*"):
        kind = v["en"][1:]
        if kind == "poder":
            return {"pres": "can", "indef": BE_PAST[i] + " able to", "perf": HAVE[i] + " been able to",
                    "imperf": "used to be able to", "fut": "will be able to",
                    "ira": BE_PRES[i] + " going to be able to", "cond": "could", "subj": "can"}[tense]
        if kind == "deber":
            return {"pres": ("has to" if i == 2 else "have to"), "indef": "had to", "perf": HAVE[i] + " had to",
                    "imperf": "used to have to", "fut": "will have to", "cond": "should"}[tense]
    base, s3, past, pp, ing = v["en"].split(",")
    be = base == "be"
    if tense in ("pres", "subj"):
        if be:
            return BE_PRES[i]
        return s3 if i == 2 else base
    if tense == "indef":
        return BE_PAST[i] if be else past
    if tense == "perf":
        return f"{HAVE[i]} {pp}"
    if tense == "imperf":
        return f"used to {base}"
    if tense == "fut":
        return f"will {base}"
    if tense == "ira":
        return f"{BE_PRES[i]} going to {base}"
    if tense == "cond":
        return f"would {base}"
    if tense == "prog":
        return f"{BE_PRES[i]} {ing}"
    if tense == "pprog":
        return f"{BE_PAST[i]} {ing}"
    raise KeyError(tense)


def en_comp(v, i, imp=False):
    c = v["en_comp"]
    if "{pos}" in c:
        c = c.replace("{pos}", ("our" if i == 3 else "your") if imp else POS[i])
    return c


def es_comp(v, i):
    c = v["es_comp"]
    if "/" in c:
        sg, pl = c.split("/")
        return pl if i >= 3 else sg
    return c


def sentences(v, conj):
    out = {}
    T = conj["tenses"]
    gust = conj["type"] == "gustar"
    for tense in TENSES:
        if tense not in T:
            continue
        if ("imp" in v["skip"] and tense in ("imp", "impneg")) or ("prog" in v["skip"] and tense in ("prog", "pprog")) \
                or ("sub" in v["skip"] and tense == "subj") or ("ira" in v["skip"] and tense == "ira"):
            continue
        rows = []
        for i in range(6):
            form = T[tense][i]
            if form is None:
                rows.append(None)
                continue
            if tense in ("imp", "impneg"):
                vv = v
                if tense == "impneg" and v["es"] in NEG:
                    if NEG[v["es"]] is None:
                        rows.append(None)
                        continue
                    vv = dict(v, es_comp=NEG[v["es"]][0], en_comp=NEG[v["es"]][1])
                v = vv
                es = cap(f"¡{form} {es_comp(v, i)}!")
                vp = en_verb_phrase(v, "pres", 0) if not v["en"].startswith("*") else None
                base = v["en"].split(",")[0]
                if tense == "imp":
                    en = (f"Let's {base}" if i == 3 else cap(base)) + f" {en_comp(v, i, True)}!" + IMP_LABEL[i]
                else:
                    en = (f"Let's not {base}" if i == 3 else f"Don't {base}") + f" {en_comp(v, i, True)}!" + IMP_LABEL[i]
                rows.append({"es": es.replace(" !", "!"), "en": en.replace(" !", "!")})
                continue
            subj = ES_SUBJ_GUST[i] if gust else ES_SUBJ[i]
            adv = ES_ADV[tense]
            if adv:
                es = f"{adv} {subj.lower() if not gust else subj[0].lower() + subj[1:]} {form} {es_comp(v, i)}."
            else:
                es = f"{subj} {form} {es_comp(v, i)}."
            vp = en_verb_phrase(v, tense, i)
            ens = EN_SUBJ[i]
            core = f"{ens} {vp} {en_comp(v, i)}".strip()
            eadv = EN_ADV[tense]
            if tense == "subj":
                en = f"I hope {core}."
            elif eadv:
                en = f"{eadv} {core}."
            else:
                en = cap(core) + "."
            rows.append({"es": cap(es), "en": en})
        out[tense] = rows
    return out


def main():
    verbs = parse()
    res = []
    for n, v in enumerate(verbs):
        c = conjugate(v["es"])
        if c.get("predicted"):
            print("WARNING predicted:", v["es"], file=sys.stderr)
        tenses = {k: c["tenses"][k] for k in TENSES if k in c["tenses"]}
        for sk, keys in (("imp", ("imp", "impneg")), ("prog", ("prog",)), ("sub", ("subj",)), ("ira", ("ira",))):
            pass  # keep the full table; skips only affect example sentences/drills
        res.append(dict(
            id=v["es"], es=v["es"], fa=v["fa"], en=v["en_meaning"], group=n // 10 + 1, rank=n + 1,
            type=c["type"], ger=c["ger"], part=c["part"], tenses=tenses, note=c["tenses"].get("_note"),
            skip=v["skip"], examples=sentences(v, c)))
    return res


if __name__ == "__main__":
    data = main()
    json.dump(data, open(sys.argv[1] if len(sys.argv) > 1 else "top100.json", "w"), ensure_ascii=False, indent=0)
    print(len(data))
