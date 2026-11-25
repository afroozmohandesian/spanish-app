# Top-100 practical Spanish verbs, grouped in tens (most useful first).
# Fields: es | en verb (base,3sg,past,pp,ing) | es complement (sg/pl) | en complement | fa meaning | en meaning | skip tenses
# en complement may contain {pos} -> my/your/her/our/their
# skip codes: imp (affirmative+negative imperative), prog, sub, ira

RAW = """
ser|be,is,was,been,being|puntual/puntuales|punctual|بودن (ذات، ویژگی)|to be (identity, traits)|prog
estar|be,is,was,been,being|en casa|at home|بودن (حالت، مکان)|to be (state, location)|prog
tener|have,has,had,had,having|paciencia|patience|داشتن|to have|prog
hacer|do,does,did,done,doing|los deberes|the homework|انجام دادن، ساختن|to do, to make|
ir|go,goes,went,gone,going|al mercado|to the market|رفتن|to go|
poder|*poder|ayudar|help|توانستن|can, to be able to|imp,prog
decir|tell,tells,told,told,telling|la verdad|the truth|گفتن|to say, to tell|
ver|watch,watches,watched,watched,watching|la tele|TV|دیدن، تماشا کردن|to see, to watch|
dar|give,gives,gave,given,giving|un regalo a Ana|a gift to Ana|دادن|to give|
saber|know,knows,knew,known,knowing|la respuesta|the answer|دانستن|to know (facts)|imp,prog
querer|want,wants,wanted,wanted,wanting|un café|a coffee|خواستن، دوست داشتن|to want, to love|imp,prog
hablar|speak,speaks,spoke,spoken,speaking|español|Spanish|حرف زدن، صحبت کردن|to speak, to talk|
venir|come,comes,came,come,coming|a la fiesta|to the party|آمدن|to come|
poner|set,sets,set,set,setting|la mesa|the table|گذاشتن (چیدن میز)|to put, to set|
salir|go,goes,went,gone,going|con amigos|out with friends|بیرون رفتن، خارج شدن|to go out, to leave|
llegar|arrive,arrives,arrived,arrived,arriving|tarde|late|رسیدن|to arrive|
pasar|spend,spends,spent,spent,spending|el fin de semana en la playa|the weekend at the beach|گذراندن، رد شدن، اتفاق افتادن|to spend (time), to pass, to happen|
deber|*deber|estudiar más|study more|باید، بدهکار بودن|must, should, to owe|imp,prog,sub,ira
comer|eat,eats,ate,eaten,eating|fruta|fruit|خوردن، ناهار خوردن|to eat|
vivir|live,lives,lived,lived,living|en Barcelona|in Barcelona|زندگی کردن|to live|
conocer|know,knows,knew,known,knowing|a María|María|شناختن، آشنا شدن|to know (people, places), to meet|imp,prog
pensar|think,thinks,thought,thought,thinking|en el futuro|about the future|فکر کردن|to think|
volver|come,comes,came,come,coming|a casa|back home|برگشتن|to return, to come back|
tomar|have,has,had,had,having|un té|a tea|گرفتن، خوردن (نوشیدنی)|to take, to have (drink/food)|
llevar|wear,wears,wore,worn,wearing|una chaqueta|a jacket|بردن، پوشیدن|to carry, to wear|
dejar|leave,leaves,left,left,leaving|las llaves en la mesa|the keys on the table|گذاشتن، ترک کردن، اجازه دادن|to leave, to let|
seguir|follow,follows,followed,followed,following|las instrucciones|the instructions|دنبال کردن، ادامه دادن|to follow, to continue|
encontrar|find,finds,found,found,finding|las llaves|the keys|پیدا کردن|to find|
llamar|call,calls,called,called,calling|a Pedro|Pedro|صدا زدن، زنگ زدن|to call|
creer|believe,believes,believed,believed,believing|la historia|the story|باور کردن، فکر کردن|to believe, to think|imp,prog
trabajar|work,works,worked,worked,working|en una oficina|in an office|کار کردن|to work|
beber|drink,drinks,drank,drunk,drinking|agua|water|نوشیدن|to drink|
escribir|write,writes,wrote,written,writing|un correo|an email|نوشتن|to write|
leer|read,reads,read,read,reading|el periódico|the newspaper|خواندن|to read|
estudiar|study,studies,studied,studied,studying|español|Spanish|درس خواندن، مطالعه کردن|to study|
aprender|learn,learns,learned,learned,learning|palabras nuevas|new words|یاد گرفتن|to learn|
comprar|buy,buys,bought,bought,buying|pan|bread|خریدن|to buy|
pagar|pay,pays,paid,paid,paying|la cuenta|the bill|پرداختن، حساب کردن|to pay|
abrir|open,opens,opened,opened,opening|la ventana|the window|باز کردن|to open|
cerrar|close,closes,closed,closed,closing|la puerta|the door|بستن|to close|
empezar|start,starts,started,started,starting|el curso|the course|شروع کردن|to start, to begin|
terminar|finish,finishes,finished,finished,finishing|el trabajo|the work|تمام کردن|to finish|
esperar|wait,waits,waited,waited,waiting|el autobús|for the bus|منتظر ماندن، امیدوار بودن|to wait, to hope|
buscar|look,looks,looked,looked,looking|un piso|for a flat|گشتن، جستجو کردن|to look for, to search|
entrar|go,goes,went,gone,going|en la tienda|into the shop|وارد شدن|to enter, to go in|
mirar|look,looks,looked,looked,looking|las fotos|at the photos|نگاه کردن|to look at|
escuchar|listen,listens,listened,listened,listening|música|to music|گوش دادن|to listen|
oír|hear,hears,heard,heard,hearing|un ruido|a noise|شنیدن|to hear|imp,prog
sentir|feel,feels,felt,felt,feeling|alegría|joy|حس کردن|to feel|imp,prog
entender|understand,understands,understood,understood,understanding|la pregunta|the question|فهمیدن|to understand|prog
pedir|order,orders,ordered,ordered,ordering|una pizza|a pizza|درخواست کردن، سفارش دادن|to ask for, to order|
recibir|receive,receives,received,received,receiving|un paquete|a package|دریافت کردن|to receive|
recordar|remember,remembers,remembered,remembered,remembering|la dirección|the address|به یاد آوردن|to remember|prog
necesitar|need,needs,needed,needed,needing|ayuda|help|نیاز داشتن|to need|imp,prog
ayudar|help,helps,helped,helped,helping|a los vecinos|the neighbours|کمک کردن|to help|
usar|use,uses,used,used,using|el ordenador|the computer|استفاده کردن|to use|
cambiar|change,changes,changed,changed,changing|la contraseña|the password|عوض کردن|to change|
preguntar|ask,asks,asked,asked,asking|el precio|the price|پرسیدن|to ask (a question)|
contestar|answer,answers,answered,answered,answering|el teléfono|the phone|جواب دادن|to answer|
explicar|explain,explains,explained,explained,explaining|el problema|the problem|توضیح دادن|to explain|
dormir|sleep,sleeps,slept,slept,sleeping|ocho horas|eight hours|خوابیدن|to sleep|
jugar|play,plays,played,played,playing|al fútbol|football|بازی کردن|to play (games, sports)|
gustar|like,likes,liked,liked,liking|el café|coffee|خوش آمدن، دوست داشتن|to like (to be pleasing)|imp,prog
preferir|prefer,prefers,preferred,preferred,preferring|el té|tea|ترجیح دادن|to prefer|imp,prog
perder|lose,loses,lost,lost,losing|las llaves|the keys|گم کردن، باختن|to lose|imp
ganar|win,wins,won,won,winning|el partido|the match|بردن، به دست آوردن|to win, to earn|
traer|bring,brings,brought,brought,bringing|el postre|dessert|آوردن|to bring|
conducir|drive,drives,drove,driven,driving|con cuidado|carefully|رانندگی کردن|to drive|
viajar|travel,travels,travelled,travelled,travelling|en tren|by train|سفر کردن|to travel|
correr|run,runs,ran,run,running|en el parque|in the park|دویدن|to run|
cocinar|cook,cooks,cooked,cooked,cooking|la cena|dinner|آشپزی کردن، پختن|to cook|
limpiar|clean,cleans,cleaned,cleaned,cleaning|la cocina|the kitchen|تمیز کردن|to clean|
lavar|wash,washes,washed,washed,washing|los platos|the dishes|شستن|to wash|
enviar|send,sends,sent,sent,sending|un mensaje|a message|فرستادن|to send|
enseñar|teach,teaches,taught,taught,teaching|matemáticas|maths|یاد دادن، نشان دادن|to teach, to show|
mostrar|show,shows,showed,shown,showing|el camino|the way|نشان دادن|to show|
contar|tell,tells,told,told,telling|un cuento|a story|شمردن، تعریف کردن|to count, to tell (a story)|
caminar|walk,walks,walked,walked,walking|por la ciudad|around the city|پیاده رفتن، قدم زدن|to walk|
bailar|dance,dances,danced,danced,dancing|salsa|salsa|رقصیدن|to dance|
cantar|sing,sings,sang,sung,singing|una canción|a song|آواز خواندن|to sing|
subir|go,goes,went,gone,going|las escaleras|up the stairs|بالا رفتن، سوار شدن|to go up, to get on|
bajar|get,gets,got,got,getting|del autobús|off the bus|پایین آمدن، پیاده شدن|to go down, to get off|
olvidar|forget,forgets,forgot,forgotten,forgetting|el paraguas|the umbrella|فراموش کردن|to forget|imp
invitar|invite,invites,invited,invited,inviting|a unos amigos|some friends|دعوت کردن|to invite|
visitar|visit,visits,visited,visited,visiting|el museo|the museum|بازدید کردن، دیدن کردن|to visit|
preparar|make,makes,made,made,making|el desayuno|breakfast|آماده کردن، درست کردن|to prepare, to make|
nadar|swim,swims,swam,swum,swimming|en el mar|in the sea|شنا کردن|to swim|
descansar|rest,rests,rested,rested,resting|un poco|a little|استراحت کردن|to rest|
repetir|repeat,repeats,repeated,repeated,repeating|la frase|the sentence|تکرار کردن|to repeat|
alquilar|rent,rents,rented,rented,renting|un coche|a car|اجاره کردن|to rent|
levantarse|get,gets,got,got,getting|temprano|up early|از خواب بلند شدن|to get up|
acostarse|go,goes,went,gone,going|tarde|to bed late|به رختخواب رفتن|to go to bed|
ducharse|have,has,had,had,having|por la mañana|a shower in the morning|دوش گرفتن|to have a shower|
vestirse|get,gets,got,got,getting|rápido|dressed quickly|لباس پوشیدن|to get dressed|
despertarse|wake,wakes,woke,woken,waking|a las siete|up at seven|بیدار شدن|to wake up|
sentarse|sit,sits,sat,sat,sitting|aquí|down here|نشستن|to sit down|
lavarse|wash,washes,washed,washed,washing|las manos|{pos} hands|شستن (دست و صورت)|to wash (oneself)|
quedarse|stay,stays,stayed,stayed,staying|en casa|at home|ماندن|to stay|
divertirse|have,has,had,had,having|en la fiesta|fun at the party|خوش گذراندن|to have fun|
preocuparse|worry,worries,worried,worried,worrying|por el examen|about the exam|نگران شدن|to worry|
"""

def parse():
    out = []
    for line in RAW.strip().splitlines():
        p = line.split("|")
        es, en, esc, enc, fa, enm, skip = p
        out.append(dict(es=es, en=en, es_comp=esc, en_comp=enc, fa=fa, en_meaning=enm,
                        skip=[s for s in skip.split(",") if s]))
    return out

if __name__ == "__main__":
    v = parse()
    print(len(v), len({x['es'] for x in v}))
