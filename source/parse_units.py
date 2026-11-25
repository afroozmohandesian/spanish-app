"""Parse units/*.txt into units.json and validate that practice sentences only use
vocabulary/grammar from the current or earlier units."""
import re, json, glob, sys, unicodedata
from conj import conjugate

ARTICLES = {"el", "la", "los", "las", "un", "una", "unos", "unas"}
FUNCTION = set("""el la los las un una unos unas lo de del a al en con y e o u pero no sí si que qué
mi mis tu tus su sus me te se nos os le les yo tú él ella usted ustedes nosotros nosotras vosotros vosotras
ellos ellas muy por para más menos bien también ahora aquí este esta estos estas ese esa esos esas eso esto
nuestro nuestra nuestros nuestras vuestro vuestra vuestros vuestras mí ti""".split())

TENSE_ORDER = ["pres", "imp", "prog", "indef", "imperf", "ira", "perf", "cond", "subj", "impneg", "fut"]


def strip_acc(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def fem(w):
    if w.endswith("o"):
        return w[:-1] + "a"
    m = re.match(r"(.*)([áéíóú])([ns])$", w)
    if m:
        return m.group(1) + strip_acc(m.group(2)) + m.group(3) + "a"
    return w + "a"


def plural(w):
    if w[-1] in "aeiouáéó":
        return w + "s"
    if w.endswith("z"):
        return w[:-1] + "ces"
    m = re.match(r"(.*)([áéíóú])([ns])$", w)
    if m:
        return m.group(1) + strip_acc(m.group(2)) + m.group(3) + "es"
    if w[-1] in "íú":
        return w + "es"
    return w + "es"


def tokens(s):
    return re.findall(r"[a-záéíóúñü]+", s.lower())


def expand_es(es):
    """All surface forms a vocab entry can take."""
    forms = set()
    for part in re.split(r"\s*/\s*", es):
        for w in tokens(part):
            forms.add(w)
    # x/a pattern
    for m in re.finditer(r"([a-záéíóúñü]+)/a\b", es.lower()):
        forms.add(fem(m.group(1)))
    for m in re.finditer(r"([a-záéíóúñü]+)os/as\b", es.lower()):
        forms.add(m.group(1) + "as")
    for f in list(forms):
        forms.add(plural(f))
    return forms - {"a"} | ({"a"} if " a " in f" {es} " else set())


def parse_file(path):
    u = dict(grammar=[], vocab=[], phrases=[], sentences=[])
    block, cur = None, None
    for raw in open(path, encoding="utf8"):
        line = raw.rstrip("\n")
        if not line.strip():
            continue
        if line.startswith("@"):
            k, _, v = line[1:].partition(" ")
            u[k] = v.strip()
            continue
        if line.startswith("#"):
            k, _, v = line[1:].partition(" ")
            block = k
            if k == "grammar":
                cur = dict(title=v.strip(), fa="", tables=[], ex=[])
                u["grammar"].append(cur)
            elif k == "vocab":
                cur = v.strip()
            continue
        if block == "grammar":
            k, _, v = line.partition(":")
            v = v.strip()
            if k == "fa":
                cur["fa"] = v
            elif k == "table":
                name, _, forms = v.partition("|")
                cur["tables"].append(dict(verb=name.strip(), forms=[f.strip() for f in forms.split(",")]))
            elif k == "ex":
                es, _, en = v.partition("|")
                cur["ex"].append(dict(es=es.strip(), en=en.strip()))
        elif block == "vocab":
            p = [x.strip() for x in line.split("|")]
            if len(p) != 3:
                raise ValueError(f"{path}: bad vocab line: {line}")
            u["vocab"].append(dict(es=p[0], en=p[1], fa=p[2], cat=cur))
        elif block == "phrases":
            p = [x.strip() for x in line.split("|")]
            if len(p) != 3:
                raise ValueError(f"{path}: bad phrase line: {line}")
            u["phrases"].append(dict(es=p[0], en=p[1], fa=p[2]))
        elif block == "sentences":
            if line.strip().endswith("SKIP"):
                continue
            en, _, es = line.partition("=>")
            if not es:
                raise ValueError(f"{path}: bad sentence: {line}")
            u["sentences"].append(dict(en=en.strip(), es=[x.strip() for x in es.split("//")]))
    u["unit"] = int(u["unit"])
    u["verbs"] = u.get("verbs", "").split()
    u["tenses"] = u.get("tenses", "").split()
    u["topics"] = [t.strip() for t in u.get("topics", "").split("|") if t.strip()]
    return u


def main(strict=False):
    units = [parse_file(p) for p in sorted(glob.glob("units/u*.txt"))]
    units.sort(key=lambda x: x["unit"])
    allowed = set(FUNCTION)
    verbs, tenses = [], []
    conj_cache = {}
    problems = 0
    for u in units:
        for v in u["vocab"]:
            allowed |= expand_es(v["es"])
        for p in u["phrases"]:
            allowed |= set(tokens(p["es"]))
        for g in u["grammar"]:
            for e in g["ex"]:
                allowed |= set(tokens(e["es"]))
        for v in u["verbs"]:
            if v not in verbs:
                verbs.append(v)
        for t in u["tenses"]:
            if t not in tenses:
                tenses.append(t)
        u["unlocked_tenses"] = list(tenses)
        vforms = set()
        for v in verbs:
            if v not in conj_cache:
                conj_cache[v] = conjugate(v)
            c = conj_cache[v]
            vforms.add(v)
            vforms |= set(tokens(v))
            if v.endswith("se") and v != "ser":
                vforms.add(v[:-2])
            for t in tenses:
                for f in c["tenses"].get(t, []) or []:
                    if f:
                        vforms |= set(tokens(f))
            if "prog" in tenses:
                vforms.add(c["ger"])
            if "perf" in tenses:
                vforms.add(c["part"])
            if "ira" in tenses:
                vforms |= {"a"}
        ok = allowed | vforms
        ok_na = {strip_acc(x) for x in vforms}

        def known(w):
            if w in ok:
                return True
            for suf in ("selos", "selas", "melo", "mela", "telo", "los", "las", "les", "nos", "lo", "la", "le", "me", "te", "se", "os"):
                if w.endswith(suf) and strip_acc(w[:-len(suf)]) in ok_na:
                    return True
            return False
        for s in u["sentences"]:
            bad = set()
            en_tok = set(re.findall(r"[a-záéíóúñü]+", s["en"].lower()))
            for es in s["es"]:
                # proper nouns (capitalised, not sentence-initial) are fine
                words = re.findall(r"[A-Za-zÁÉÍÓÚÑÜáéíóúñü]+", es)
                for i, w in enumerate(words):
                    if w[0].isupper() and i > 0:
                        continue
                    lw = w.lower()
                    if not known(lw) and lw not in en_tok:
                        bad.add(lw)
            if bad:
                problems += 1
                print(f"U{u['unit']}: {s['en']}  -> unknown: {sorted(bad)}")
    return units, verbs, conj_cache, problems


if __name__ == "__main__":
    units, verbs, conj_cache, problems = main()
    print("units", len(units), "verbs", len(verbs), "problems", problems)
    print("vocab", sum(len(u["vocab"]) for u in units), "sentences", sum(len(u["sentences"]) for u in units))
