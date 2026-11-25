"""Build app/data.js from units/*.txt, the conjugation engine and the top-100 list."""
import json, logging, sys, os
logging.disable(logging.CRITICAL)
from parse_units import main as parse_main
from conj import conjugate, TENSES
from verb_meanings import table as extra_meanings
import build_verbs

TENSE_INFO = {
    "pres":   dict(es="Presente", en="Present", fa="حال ساده"),
    "prog":   dict(es="Estar + gerundio", en="Present continuous", fa="حال استمراری"),
    "indef":  dict(es="Pretérito indefinido", en="Simple past", fa="گذشته‌ی ساده"),
    "imperf": dict(es="Pretérito imperfecto", en="Imperfect (used to)", fa="گذشته‌ی استمراری"),
    "perf":   dict(es="Pretérito perfecto", en="Present perfect", fa="ماضی نقلی"),
    "pprog":  dict(es="Estaba + gerundio", en="Past continuous", fa="گذشته‌ی در جریان"),
    "ira":    dict(es="Ir a + infinitivo", en="Going to (future)", fa="آینده‌ی نزدیک"),
    "fut":    dict(es="Futuro", en="Future (will)", fa="آینده"),
    "cond":   dict(es="Condicional", en="Conditional (would)", fa="شرطی"),
    "subj":   dict(es="Presente de subjuntivo", en="Present subjunctive", fa="التزامی"),
    "imp":    dict(es="Imperativo", en="Imperative", fa="امری"),
    "impneg": dict(es="Imperativo negativo", en="Negative imperative", fa="امری منفی"),
}
TENSE_ORDER = ["pres", "prog", "indef", "imperf", "perf", "pprog", "ira", "fut", "cond", "subj", "imp", "impneg"]


def main(out_path):
    units, verbs, conj_cache, problems = parse_main()
    if problems:
        print("WARNING: sentence problems:", problems)
    top = build_verbs.main()
    top_by = {v["es"]: v for v in top}
    extra = extra_meanings()
    vocab_by = {}
    for u in units:
        for v in u["vocab"]:
            vocab_by.setdefault(v["es"].strip(), v)

    book_verbs = {}
    first_unit = {}
    for u in units:
        for v in u["verbs"]:
            first_unit.setdefault(v, u["unit"])
    for v in verbs:
        c = conj_cache.get(v) or conjugate(v)
        if v in top_by:
            en, fa = top_by[v]["en"], top_by[v]["fa"]
        elif v in vocab_by:
            en, fa = vocab_by[v]["en"], vocab_by[v]["fa"]
        else:
            en, fa = extra[v]["en"], extra[v]["fa"]
        book_verbs[v] = dict(en=en, fa=fa, type=c["type"], ger=c["ger"], part=c["part"],
                             unit=first_unit[v], t={k: c["tenses"][k] for k in TENSE_ORDER if k in c["tenses"]})

    tense_unlock = {}
    for u in units:
        for t in u["tenses"]:
            tense_unlock.setdefault(t, u["unit"])

    out_units = []
    for u in units:
        out_units.append(dict(
            n=u["unit"], title=u["title"], title_en=u.get("title_en", ""), title_fa=u.get("title_fa", ""),
            pages=u.get("pages", ""), topics=u["topics"], verbs=u["verbs"], tenses=u["tenses"],
            grammar=u["grammar"], vocab=[[v["es"], v["en"], v["fa"], v["cat"]] for v in u["vocab"]],
            phrases=[[p["es"], p["en"], p["fa"]] for p in u["phrases"]],
            sentences=[[s["en"], s["es"]] for s in u["sentences"]]))

    out_top = []
    for v in top:
        out_top.append(dict(es=v["es"], en=v["en"], fa=v["fa"], g=v["group"], type=v["type"], ger=v["ger"],
                            part=v["part"], note=v.get("note"),
                            t={k: v["tenses"][k] for k in TENSE_ORDER if k in v["tenses"]},
                            ex={k: [[r["es"], r["en"]] if r else None for r in rows]
                                for k, rows in v["examples"].items()}))

    data = dict(version=1, book="Nuevo Español en marcha · Básico A1-A2",
                tenses=TENSE_INFO, tenseOrder=TENSE_ORDER, tenseUnlock=tense_unlock,
                persons=["yo", "tú", "él/ella/usted", "nosotros/as", "vosotros/as", "ellos/ellas/ustedes"],
                units=out_units, bookVerbs=book_verbs, top=out_top)
    js = "window.DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    open(out_path, "w", encoding="utf8").write(js)
    print("units", len(out_units), "book verbs", len(book_verbs), "top", len(out_top),
          "vocab", sum(len(u["vocab"]) for u in out_units),
          "sentences", sum(len(u["sentences"]) for u in out_units),
          "size KB", round(len(js.encode()) / 1024))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "../app/data.js")
