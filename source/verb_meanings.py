# Meanings for book verbs not covered by unit vocab lists or the top-100 list.
EXTRA = """
llamarse | to be called | نام داشتن
dedicarse | to do (for a living) | به کاری مشغول بودن
celebrar | to celebrate | جشن گرفتن
haber | to have (auxiliary); there is (hay) | داشتن (فعل کمکی)، وجود داشتن
reservar | to book, to reserve | رزرو کردن
guardar | to keep, to put away | نگه داشتن، گذاشتن
calentar | to heat | گرم کردن
encantar | to love (to delight) | خیلی خوش آمدن
montar | to ride | سوار شدن
navegar | to sail, to surf (internet) | دریانوردی کردن، گشتن در اینترنت
evitar | to avoid | اجتناب کردن
merendar | to have an afternoon snack | عصرانه خوردن
ordenar | to tidy | مرتب کردن
irse | to leave, to go away | رفتن، ترک کردن
hervir | to boil | جوشاندن
despertar | to wake (someone) up | بیدار کردن
conectar | to connect | وصل کردن
proponer | to propose, to suggest | پیشنهاد دادن
aceptar | to accept | قبول کردن
sonreír | to smile | لبخند زدن
gastar | to spend (money) | خرج کردن
conectarse | to go online | آنلاین شدن
practicar | to practise | تمرین کردن
tocar | to play (instrument), to touch | نواختن، لمس کردن
atender | to attend to, to serve | رسیدگی کردن
mandar | to send | فرستادن
recomendar | to recommend | توصیه کردن
disfrutar | to enjoy | لذت بردن
ponerse | to put on (clothes) | پوشیدن
envolver | to wrap | کادو کردن، پیچیدن
aconsejar | to advise | نصیحت کردن
acompañar | to go with | همراهی کردن
reunirse | to meet, to get together | دور هم جمع شدن
sentirse | to feel | احساس کردن (حال)
encontrarse | to feel; to meet (by chance) | حال داشتن؛ برخورد کردن
cuidar | to look after | مراقبت کردن
mejorar | to improve | بهتر کردن، بهتر شدن
fallecer | to pass away | درگذشتن
instalarse | to settle | ساکن شدن
conseguir | to get, to achieve | به دست آوردن
cumplir | to turn (age), to fulfil | ... ساله شدن، انجام دادن
importar | to matter | اهمیت داشتن
fregar | to wash up | ظرف شستن
arreglar | to fix | تعمیر کردن
plantar | to plant | کاشتن
romper | to break | شکستن
quitarse | to take off (clothes) | درآوردن
parar | to stop | ایستادن، متوقف کردن
aprobar | to pass (an exam) | قبول شدن
tratar | to treat; tratar de = to be about | رفتار کردن؛ درباره‌ی ... بودن
parecer | to seem | به نظر رسیدن
repartir | to deliver, to share out | پخش کردن
hacerse | to become | شدن
indicar | to indicate, to show | نشان دادن
respetar | to respect | احترام گذاشتن
dudar | to doubt | شک کردن
motivar | to motivate | انگیزه دادن
valorar | to value | ارزش قائل شدن
delegar | to delegate | واگذار کردن
mejorarse | to get better | بهبود یافتن
aprovechar | to make the most of | استفاده کردن، بهره بردن
informar | to inform | اطلاع دادن
contratar | to hire | استخدام کردن
ofrecer | to offer | پیشنهاد کردن، ارائه دادن
encargarse | to be in charge of | مسئولیت گرفتن
escapar | to escape | فرار کردن
intentar | to try | تلاش کردن
esconder | to hide | پنهان کردن
acabarse | to run out, to come to an end | تمام شدن
funcionar | to work (machine) | کار کردن (دستگاه)
devolver | to give back | پس دادن
"""

def table():
    out = {}
    for line in EXTRA.strip().splitlines():
        es, en, fa = [x.strip() for x in line.split("|")]
        out[es] = dict(en=en, fa=fa)
    return out
