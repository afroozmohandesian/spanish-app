"""Spanish conjugation built on verbecc (template-based, non-predicted for known verbs),
plus derived tenses, reflexive handling and gustar-type verbs."""
import json, logging, unicodedata, functools
logging.disable(logging.CRITICAL)
from verbecc import CompleteConjugator

_C = CompleteConjugator(lang='es')

PERSONS = ["yo", "tú", "él/ella/usted", "nosotros/as", "vosotros/as", "ellos/ellas/ustedes"]
REFL = ["me", "te", "se", "nos", "os", "se"]
IO = ["me", "te", "le", "nos", "os", "les"]
TENSES = ["pres", "perf", "indef", "imperf", "fut", "ira", "cond", "prog", "pprog", "subj", "imp", "impneg"]
ORDER_PR = ["yo", "tú", "él", "nosotros", "vosotros", "ellos"]
IMP_PR = [None, "tú", "usted", "nosotros", "vosotros", "ustedes"]

HABER = ["he", "has", "ha", "hemos", "habéis", "han"]
IR = ["voy", "vas", "va", "vamos", "vais", "van"]
ESTAR = ["estoy", "estás", "está", "estamos", "estáis", "están"]
ESTABA = ["estaba", "estabas", "estaba", "estábamos", "estabais", "estaban"]

STRONG = set("aeoáéíóú")
ACC = {"a": "á", "e": "é", "i": "í", "o": "ó", "u": "ú"}


MODEL = {"ar": "hablar", "er": "comer", "ir": "vivir"}


@functools.lru_cache(maxsize=None)
def _raw(inf):
    try:
        r = _C.conjugate(inf)
        return json.loads(r.to_json())
    except Exception:
        # fallback for regular verbs the library chokes on: swap stem of a model verb
        model = {"nevar": "cerrar"}.get(inf, MODEL[inf[-2:]])
        txt = _C.conjugate(model).to_json()
        if model == "cerrar":
            txt = txt.replace("cierr", "niev").replace("cerr", "nev")
        else:
            txt = txt.replace(model[:-2], inf[:-2])
        d = json.loads(txt)
        d["verb"]["fallback"] = True
        return d


def _tense(moods, mood, tense, strip=True):
    rows = moods[mood][tense]
    out = []
    for pr in ORDER_PR:
        row = next(x for x in rows if x["pr"] == pr)
        f = row["c"][0]
        if strip and f.startswith(pr + " "):
            f = f[len(pr) + 1:]
        out.append(f)
    return out


def _imp(moods, key):
    rows = moods["imperativo"][key]
    out = []
    for pr in IMP_PR:
        if pr is None:
            out.append(None)
            continue
        out.append(next(x for x in rows if x["pr"] == pr)["c"][0])
    return out


def _nuclei(word):
    """Return list of (start,end) index spans of vowel nuclei, handling qu/gu and diphthongs."""
    w = word.lower()
    spans = []
    i = 0
    while i < len(w):
        ch = w[i]
        if ch in "aeiouáéíóúü":
            # silent u after q / g before e,i
            if ch == "u" and i > 0 and w[i - 1] in "qg" and i + 1 < len(w) and w[i + 1] in "eiéí":
                i += 1
                continue
            j = i + 1
            while j < len(w) and w[j] in "aeiouáéíóúü":
                a, b = w[j - 1], w[j]
                # two strong vowels -> hiatus; accented weak -> hiatus
                if (a in STRONG and b in STRONG) or b in "íú" or a in "íú":
                    if not (a in "iu" and b in "iu"):
                        break
                j += 1
            spans.append((i, j))
            i = j
        else:
            i += 1
    return spans


def _stress_vowel_index(word):
    for i, ch in enumerate(word):
        if ch in "áéíóú":
            return i
    sp = _nuclei(word)
    if not sp:
        return None
    if word[-1] in "aeiouns" and len(sp) >= 2:
        s, e = sp[-2]
    else:
        s, e = sp[-1]
    seg = word[s:e]
    # accent the strong vowel, else the last weak vowel
    for k, ch in enumerate(seg):
        if ch in "aeo":
            return s + k
    return e - 1


def _attach(form, clitic, idx=None, cut=0):
    """Attach enclitic pronoun to an imperative, adding written accent if needed.
    Stress is computed on the full form, then `cut` final letters are dropped."""
    if idx is None:
        idx = _stress_vowel_index(form)
    if cut:
        form = form[:-cut]
    word = form + clitic
    sp = _nuclei(word)
    # which nucleus holds idx?
    pos = next(n for n, (s, e) in enumerate(sp) if s <= idx < e)
    from_end = len(sp) - pos
    if from_end >= 3 and word[idx] in ACC:
        word = word[:idx] + ACC[word[idx]] + word[idx + 1:]
    return word


def conjugate(inf):
    """Return dict: tense -> list of 6 forms (None where not applicable), plus ger/part."""
    refl = inf.endswith("se") and inf not in ("ser",)
    base = inf[:-2] if refl else inf
    gust = inf in ("gustar", "encantar", "doler", "interesar", "importar", "molestar", "parecer_io")
    d = _raw(base)
    m = d["moods"]
    ger = m["gerundio"]["gerundio"][0]["c"][0]
    part = m["participo"]["participo"][0]["c"][0]
    t = {
        "pres": _tense(m, "indicativo", "presente"),
        "indef": _tense(m, "indicativo", "pretérito-perfecto-simple"),
        "imperf": _tense(m, "indicativo", "pretérito-imperfecto"),
        "fut": _tense(m, "indicativo", "futuro"),
        "cond": _tense(m, "condicional", "presente"),
        "subj": _tense(m, "subjuntivo", "presente"),
    }
    t["perf"] = [f"{h} {part}" for h in HABER]
    t["ira"] = [f"{v} a {base}" for v in IR]
    t["prog"] = [f"{e} {ger}" for e in ESTAR]
    t["pprog"] = [f"{e} {ger}" for e in ESTABA]
    if base == "haber":
        t["pres"][2] = "ha (hay)"
    imp = _imp(m, "afirmativo")
    if base == "ir":
        imp[3] = "vamos"
    impneg = [None] + ["no " + t["subj"][i] for i in (1, 2, 3, 4, 5)]
    t["imp"], t["impneg"] = imp, impneg

    if gust:
        out = {}
        for k in TENSES:
            if k in ("imp", "impneg", "prog", "pprog"):
                continue
            third = t[k][2]
            out[k] = [f"{IO[i]} {third}" for i in range(6)]
        out["_note"] = "Con cosas en plural: " + t["pres"][5].replace(" ", " ") + " (me gustan, te gustan...)"
        return dict(tenses=out, ger=ger, part=part, type="gustar")

    if refl:
        out = {}
        for k in ("pres", "indef", "imperf", "fut", "cond", "subj", "perf", "ira", "prog", "pprog"):
            out[k] = [f"{REFL[i]} {t[k][i]}" for i in range(6)]
        im = [None]
        for i in (1, 2, 3, 4, 5):
            f = imp[i]
            cl = REFL[i]
            cut = 0
            if i == 3:  # nosotros: levantemos + nos -> levantémonos
                cut = 1
            if i == 4:  # vosotros: levantad + os -> levantaos ; vestid -> vestíos
                if f.endswith("id"):
                    im.append(f[:-2] + "íos")
                    continue
                cut = 1
            im.append(_attach(f, cl, _stress_vowel_index(f), cut))
        out["imp"] = im
        out["impneg"] = [None] + [f"no {REFL[i]} {t['subj'][i]}" for i in (1, 2, 3, 4, 5)]
        return dict(tenses=out, ger=ger, part=part, type="reflexive")

    return dict(tenses=t, ger=ger, part=part, type="normal",
                predicted=bool(d["verb"].get("predicted")))


if __name__ == "__main__":
    import sys
    for v in sys.argv[1:]:
        r = conjugate(v)
        print(v, r["type"], r.get("ger"), r.get("part"))
        for k, forms in r["tenses"].items():
            print("  ", k, forms)
