export type TierResponse = { answer: string; answerConfidence: number; reason: string; reasonConfidence: number };
export type DiagnosticItem = {
 id:string; concept:string; prompt:string; choices:{id:string;text:string;misconception?:string}[];
 reasons:{id:string;text:string;misconception?:string}[]; correctAnswer:string; correctReason:string;
};
export const SEASONS_INSTRUMENT_VERSION = "2026.11.1";
export const MISCONCEPTION_LABELS:Record<string,string> = {
 DISTANCE:"Mevsimleri Dünya–Güneş uzaklığıyla açıklama",
 SOLAR_OUTPUT:"Güneş'in enerjisinin mevsime göre artıp azaldığını düşünme",
 ROTATION:"Mevsimleri Dünya'nın günlük dönmesiyle açıklama",
 AXIS_REORIENTATION:"Dünya'nın ekseninin dolanma sırasında Güneş'e döndüğünü düşünme",
 AXIS_DISAPPEARS:"Ekinoksta eksen eğikliğinin yok olduğunu düşünme",
 ENERGY_AREA:"Daha geniş aydınlanan alanın birim enerji miktarını artırdığını düşünme",
 ENERGY_CREATION:"Işın açısının ışığın toplam enerjisini ürettiğini/değiştirdiğini düşünme",
 HALF_LIT:"Yazın Dünya'nın yarısından fazlasının aydınlandığını düşünme",
 DAY_SPEED:"Gündüz süresini Dünya'nın dönüş hızına bağlama",
 LONGER_VS_LONG:"Gündüzlerin uzamasını gündüzün geceden uzun olmasıyla karıştırma",
 TEMPERATURE_LAG:"En uzun gündüzün zorunlu olarak en sıcak gün olduğunu düşünme",
 EQUINOX:"Ekinoksta tüm mevsim koşullarının aynı olduğunu düşünme",
 SHADOW:"Gölge boyu ile Güneş'in yükselme açısı ilişkisini ters kurma",
 ZERO_TILT:"Dolanmanın tek başına mevsimleri oluşturduğunu düşünme",
 TILT_MAGNITUDE:"Eksen eğikliği büyüklüğünün mevsimsel farkları etkilemediğini düşünme",
 LATITUDE:"Enlem ile gece-gündüz süresi farkını karıştırma"
};
export const SEASONS_ITEMS:DiagnosticItem[] = [
{id:"S01",concept:"Yarım kürelerde mevsimler",prompt:"Temmuzda İzmir'de yaz koşulları yaşanırken Melbourne'de kış yaşanıyor. İki şehir aynı Dünya üzerindeyken bu karşıtlık nasıl oluşur?",choices:[
{id:"A",text:"İki yarım küre yılın aynı döneminde zıt mevsimler yaşayabilir."},
{id:"B",text:"İzmir, Melbourne'den Güneş'e mevsimleri açıklayacak kadar yakındır.",misconception:"DISTANCE"},
{id:"C",text:"Dünya'nın güney yarısı daha yavaş döndüğü için kış yaşar.",misconception:"ROTATION"},
{id:"D",text:"Güneş, temmuzda yalnız kuzeye daha fazla enerji üretir.",misconception:"SOLAR_OUTPUT"},
{id:"E",text:"İki yarım küre her zaman aynı mevsimi yaşar.",misconception:"DISTANCE"}],
reasons:[
{id:"A",text:"Eksen eğikliği ve dolanma nedeniyle iki yarım kürede ışın açısı ile gündüz süresi farklılaşır."},
{id:"B",text:"Dünya elips yörüngede temmuzda yaklaşır; yakındaki kuzey yarım küre ısınır.",misconception:"DISTANCE"},
{id:"C",text:"Dünya'nın kuzey bölümü güney bölümünden daha hızlı döner.",misconception:"ROTATION"},
{id:"D",text:"Güneş'in enerji üretimi her yıl kuzey yarım küreye yönelir.",misconception:"SOLAR_OUTPUT"},
{id:"E",text:"Eksen eğikliği yalnızca gece ve gündüzün oluşmasını sağlar.",misconception:"ZERO_TILT"},
{id:"F",text:"Eksen eğikliği yazın sıfır, kışın en büyük değeri alır.",misconception:"AXIS_DISAPPEARS"}],correctAnswer:"A",correctReason:"A"},
{id:"S02",concept:"Eksen yönünün korunması",prompt:"İki öğrenci küre ve lamba ile Dünya'nın Güneş çevresindeki hareketini modelliyor. K grubunda eğik eksen her durakta aynı uzak yöne bakıyor; L grubunda eksen her durakta lambaya çevriliyor. Hangi model doğrudur?",choices:[
{id:"A",text:"Yalnız L; eksen sürekli Güneş'e bakmalıdır.",misconception:"AXIS_REORIENTATION"},
{id:"B",text:"Yalnız K; eksenin uzaydaki yönü yaklaşık korunur."},
{id:"C",text:"İkisi de; mevsimler yalnızca dolanmayla açıklanır.",misconception:"ZERO_TILT"},
{id:"D",text:"Hiçbiri; Dünya'nın gerçek dönme ekseni eğik değildir.",misconception:"AXIS_DISAPPEARS"}],
reasons:[
{id:"A",text:"Dolanma sırasında eksen yönünün korunması, yarım kürelerin Güneş'e dönüklüğünün yıl içinde değişmesini sağlar."},
{id:"B",text:"Dünya'nın ekseni bulunduğu yörünge noktasına göre Güneş'e döner.",misconception:"AXIS_REORIENTATION"},
{id:"C",text:"Mevsimlerin nedeni elips yörüngede uzaklığın değişmesidir.",misconception:"DISTANCE"},
{id:"D",text:"Dönme ekseninin eğikliği yalnızca 21 Haziran ve 21 Aralık'ta bulunur.",misconception:"AXIS_DISAPPEARS"},
{id:"E",text:"Dünya'nın dönme süresi yazın 24 saatten fazladır.",misconception:"DAY_SPEED"},
{id:"F",text:"Dolanma eksen eğikliği olmasa da aynı mevsimleri üretir.",misconception:"ZERO_TILT"}],correctAnswer:"B",correctReason:"A"},
{id:"S03",concept:"Işın açısı ve enerji yoğunluğu",prompt:"Özdeş fenerlerden K, aynı toplam 120 birim enerjiyi 6 kareye; L ise 12 kareye yayıyor. Uzaklık ve yüzey türü eşit, ışınların geliş açısı farklı. Birim yüzey enerjisi nerede fazladır?",choices:[
{id:"A",text:"K'de; kare başına 20 birimdir."},
{id:"B",text:"L'de; 12 kare daha fazla ışık alır.",misconception:"ENERGY_AREA"},
{id:"C",text:"Her ikisinde kare başına 120 birimdir.",misconception:"ENERGY_AREA"},
{id:"D",text:"Her ikisinde eşit; fenerlerin gücü aynıdır.",misconception:"ENERGY_AREA"}],
reasons:[
{id:"A",text:"Aynı toplam enerji daha küçük alana dağıldığında birim yüzeye düşen enerji yükselir."},
{id:"B",text:"Daha büyük aydınlanan alan daha yüksek enerji yoğunluğu demektir.",misconception:"ENERGY_AREA"},
{id:"C",text:"Dik gelen ışık kaynağında enerji yaratılır.",misconception:"ENERGY_CREATION"},
{id:"D",text:"Işığın geliş açısı aydınlanan alanı etkilemez.",misconception:"ENERGY_AREA"},
{id:"E",text:"Eğik ışınların hızları daha yüksek olduğu için enerji fazladır.",misconception:"ENERGY_CREATION"},
{id:"F",text:"Birim enerji sadece yüzeyin rengine bağlıdır.",misconception:"ENERGY_AREA"}],correctAnswer:"A",correctReason:"A"},
{id:"S04",concept:"Aydınlanma süresi ve enlem",prompt:"21 Haziran'da Ekvator çevresinde gündüz yaklaşık 12 saat, 40° Kuzey'de 15 saat, 65° Kuzey'de yaklaşık 21 saattir. Bu farkın temel açıklaması nedir?",choices:[
{id:"A",text:"Kutuplara doğru Dünya'nın dönmesi yavaşlar.",misconception:"DAY_SPEED"},
{id:"B",text:"Bütün Dünya'da gündüz süresi 12 saattir.",misconception:"HALF_LIT"},
{id:"C",text:"Eksen eğikliği, farklı enlem çemberlerinin aydınlıkta kalan bölümünü değiştirir."},
{id:"D",text:"Yazın Dünya'nın yarısından fazlası Güneş'e bakar.",misconception:"HALF_LIT"}],
reasons:[
{id:"A",text:"Aydınlıkta kalan günlük çember yayı enleme ve eksenin Güneş'e yönelimine göre değişir."},
{id:"B",text:"Yazın Güneş Dünya'nın toplam yüzeyinin yüzde 75'ini aydınlatır.",misconception:"HALF_LIT"},
{id:"C",text:"65° Kuzey'deki nokta bir günde 24 saat yerine 30 saatte döner.",misconception:"DAY_SPEED"},
{id:"D",text:"Ekvator'da Dünya Güneş'e daha yakındır.",misconception:"DISTANCE"},
{id:"E",text:"Gündüz süresi yalnızca yerel saat diliminin seçimine bağlıdır.",misconception:"LATITUDE"},
{id:"F",text:"Yarım kürelerin eksen eğikliği farklıdır.",misconception:"AXIS_REORIENTATION"}],correctAnswer:"C",correctReason:"A"},
{id:"S05",concept:"Gündüzlerin uzaması ve uzun olması",prompt:"Türkiye'de 5 Ocak'ta gündüz 9 saat 25 dakika, 15 Ocak'ta 9 saat 41 dakikadır. 15 Ocak için hangisi doğrudur?",choices:[
{id:"A",text:"Gündüz uzamıştır fakat gece hâlâ daha uzundur."},
{id:"B",text:"Gündüz uzadığına göre geceden uzun olmuştur.",misconception:"LONGER_VS_LONG"},
{id:"C",text:"Gündüzler kısalır ve geceler kısalır.",misconception:"LONGER_VS_LONG"},
{id:"D",text:"Gece ve gündüz süreleri eşittir.",misconception:"EQUINOX"}],
reasons:[
{id:"A",text:"21 Aralık'tan sonra kuzeyde gündüz süresi artar ama yaklaşık 21 Mart'a kadar 12 saatten kısadır."},
{id:"B",text:"Gündüzlerin uzaması, gündüz süresinin mutlaka 12 saatten fazla olmasıdır.",misconception:"LONGER_VS_LONG"},
{id:"C",text:"Kuzey Yarım Küre'de gündüzler yalnızca yaz aylarında uzar.",misconception:"LONGER_VS_LONG"},
{id:"D",text:"21 Aralık'ta Dünya'nın ekseni dikleştiği için gündüzler uzar.",misconception:"AXIS_DISAPPEARS"},
{id:"E",text:"Dünya ocakta daha yavaş döndüğü için gündüzler uzar.",misconception:"DAY_SPEED"},
{id:"F",text:"Güneş'e uzaklık arttıkça gündüz her zaman kısalır.",misconception:"DISTANCE"}],correctAnswer:"A",correctReason:"A"},
{id:"S06",concept:"Gündönümü ve sıcaklık gecikmesi",prompt:"Bir şehirde 21 Haziran en uzun gündüzdür; ancak uzun yıllar verilerinde en sıcak dönem temmuz sonudur. Bu iki bilgi birlikte doğru olabilir mi?",choices:[
{id:"A",text:"Hayır, en sıcak gün zorunlu olarak en uzun gündüzdür.",misconception:"TEMPERATURE_LAG"},
{id:"B",text:"Evet, yüzey ve atmosferin ısı depolaması nedeniyle sıcaklık zirvesi gecikebilir."},
{id:"C",text:"Hayır, 21 Haziran tüm Dünya için en sıcak gündür.",misconception:"TEMPERATURE_LAG"},
{id:"D",text:"Evet, çünkü Güneş temmuzda enerji üretimini iki katına çıkarır.",misconception:"SOLAR_OUTPUT"}],
reasons:[
{id:"A",text:"Alınan ve kaybedilen enerji arasındaki denge ile ısı depolaması en yüksek sıcaklık tarihini etkiler."},
{id:"B",text:"Dünya'nın eksen eğikliği temmuzda artmaya devam eder.",misconception:"AXIS_REORIENTATION"},
{id:"C",text:"Dünya temmuzda Güneş'e en çok yaklaşır, bu yüzden mutlaka her yer ısınır.",misconception:"DISTANCE"},
{id:"D",text:"Gündüz süresi azalmaya başlayınca yüzey anında soğumak zorundadır.",misconception:"TEMPERATURE_LAG"},
{id:"E",text:"En uzun gündüzdeki enerji akışı tüm bölgelerde sıfırdır.",misconception:"TEMPERATURE_LAG"},
{id:"F",text:"Güneş'in çekirdeği sadece yazın daha yüksek sıcaklıkta çalışır.",misconception:"SOLAR_OUTPUT"}],correctAnswer:"B",correctReason:"A"},
{id:"S07",concept:"Ekinoks ve eksen eğikliği",prompt:"21 Mart'ta öğretmen gündüz ve gece sürelerinin yaklaşık eşit olduğunu söylüyor. Bir öğrenci 'Demek ki o gün Dünya'nın eksen eğikliği sıfırlanıyor' diyor. Ne düşünürsün?",choices:[
{id:"A",text:"Doğru; eksen ekinoksta dikleşir.",misconception:"AXIS_DISAPPEARS"},
{id:"B",text:"Yanlış; eksen eğikliği sürer, Ekvator'a ışınlar dik gelir ve aydınlanma sınırı kutuplardan geçer."},
{id:"C",text:"Doğru; Dünya bu tarihte dönmeyi bırakır.",misconception:"ROTATION"},
{id:"D",text:"Yanlış; ekinoksta Dünya'nın tamamı gündüzdür.",misconception:"HALF_LIT"}],
reasons:[
{id:"A",text:"Dönme ekseni yaklaşık aynı eğikliği korur; ekinoks konumunda iki yarım küre yaklaşık eşit aydınlanır."},
{id:"B",text:"Ekinoksta eksen eğikliği sıfırdır ve ertesi gün yeniden başlar.",misconception:"AXIS_DISAPPEARS"},
{id:"C",text:"Gündüz ve gece yalnızca Dünya Güneş'e en yakın olduğunda eşittir.",misconception:"DISTANCE"},
{id:"D",text:"Güneş ışınları ekinoksta bütün yeryüzüne dik gelir.",misconception:"EQUINOX"},
{id:"E",text:"Ekinoksta Dünya ekseninde 90 derecelik ani bir dönüş yapar.",misconception:"AXIS_REORIENTATION"},
{id:"F",text:"Gece gündüz eşitliği Dünya'nın kendi çevresindeki dönüşünün durmasıyla oluşur.",misconception:"ROTATION"}],correctAnswer:"B",correctReason:"A"},
{id:"S08",concept:"Gölge boyu ve Güneş yüksekliği",prompt:"Manisa'da dik bir çubuğun gerçek güneş öğlesindeki gölgesi 15 Ocak'ta 180 cm, 15 Mayıs'ta 55 cm ölçülüyor. Aynı yerde ve çubukla gerçekleşen değişim neyi gösterir?",choices:[
{id:"A",text:"Güneş'in yüzeyle yaptığı ışın açısı genel olarak büyümüştür."},
{id:"B",text:"Güneş'in ışın açısı küçülmüştür.",misconception:"SHADOW"},
{id:"C",text:"Dünya ekseni dikleştiği için çubuk kısalmıştır.",misconception:"AXIS_DISAPPEARS"},
{id:"D",text:"Güneş'in toplam enerji üretimi bu sürede kesin iki kat artmıştır.",misconception:"SOLAR_OUTPUT"}],
reasons:[
{id:"A",text:"Güneş gökte daha yüksek göründükçe dik çubuğun öğle gölgesi kısalır."},
{id:"B",text:"Gölgenin kısalması ışınların daha eğik geldiğini gösterir.",misconception:"SHADOW"},
{id:"C",text:"Gölge boyu yalnızca Güneş'e olan uzaklığa bağlıdır.",misconception:"DISTANCE"},
{id:"D",text:"Öğle gölgesi ne kadar kısaysa gece o kadar uzun olur.",misconception:"LONGER_VS_LONG"},
{id:"E",text:"Gölgenin boyu ile Güneş'in yükseklik açısı arasında hiçbir ilişki yoktur.",misconception:"SHADOW"},
{id:"F",text:"Gölge yıl boyunca sabittir; sadece saat değişirse uzunluğu değişir.",misconception:"SHADOW"}],correctAnswer:"A",correctReason:"A"},
{id:"S09",concept:"Eksen eğikliği sıfır gezegen",prompt:"Dünya'ya benzeyen yeni bir gezegenin dönme ekseni yörünge düzlemine tam dik, yörüngesi çembersel ve gezegen kendi çevresinde dönüyor. Aynı enlemdeki gözlemcinin bir yılı için ne beklenir?",choices:[
{id:"A",text:"Dünya'daki gibi belirgin astronomik yaz ve kış döngüsü oluşmaz."},
{id:"B",text:"Dolanma olduğu için Dünya'daki mevsimler aynen oluşur.",misconception:"ZERO_TILT"},
{id:"C",text:"Gece-gündüz oluşmaz.",misconception:"ROTATION"},
{id:"D",text:"Gezegenin bütün noktalarına ışınlar yıl boyunca dik gelir.",misconception:"ZERO_TILT"}],
reasons:[
{id:"A",text:"Eksen eğikliği ve uzaklık değişimi olmadığından mevsimsel ışın açısı ve gündüz süresi döngüsü Dünya'daki gibi oluşmaz."},
{id:"B",text:"Eksen eğikliği sadece dönme hızını değiştirir; mevsime etkisi yoktur.",misconception:"ZERO_TILT"},
{id:"C",text:"Gezegen Güneş çevresinde dolandığı sürece mevsimler her durumda oluşur.",misconception:"ZERO_TILT"},
{id:"D",text:"Dönme ekseni dik olduğunda gezegen dönemez.",misconception:"ROTATION"},
{id:"E",text:"Mevsimleri belirleyen tek şey elips biçimli yörüngedir.",misconception:"DISTANCE"},
{id:"F",text:"Gündüz yalnızca eksen eğikliği varsa meydana gelir.",misconception:"ROTATION"}],correctAnswer:"A",correctReason:"A"},
{id:"S10",concept:"Eksen eğikliği büyüklüğünü transfer",prompt:"Özdeş diğer koşullara ve çembersel yörüngeye sahip iki gezegende eksen eğiklikleri K'de 10°, L'de 40°'dir. Orta enlemlerde mevsimsel gündüz süresi ve öğle Güneş yüksekliği değişiminin büyüklüğü hangi gezegende daha fazladır?",choices:[
{id:"A",text:"L gezegeninde."},
{id:"B",text:"K gezegeninde.",misconception:"TILT_MAGNITUDE"},
{id:"C",text:"İkisinde eşittir.",misconception:"TILT_MAGNITUDE"},
{id:"D",text:"Yalnız yıldızın enerji üretiminden anlaşılır.",misconception:"SOLAR_OUTPUT"}],
reasons:[
{id:"A",text:"Daha büyük eğiklik, yarım kürelerin yıldıza göre yöneliminde ve gündüz süresinde daha büyük yıllık değişim yaratır."},
{id:"B",text:"Eksen eğikliği arttıkça gezegenin dönme süresi değişir.",misconception:"DAY_SPEED"},
{id:"C",text:"Eksen eğikliği yalnızca mevsim başlangıçlarının adını değiştirir.",misconception:"TILT_MAGNITUDE"},
{id:"D",text:"Mevsim farklılıkları tamamen yıldız–gezegen uzaklığına bağlıdır.",misconception:"DISTANCE"},
{id:"E",text:"Küçük eğiklik yıldız ışınlarını her yerde dik hâle getirir.",misconception:"TILT_MAGNITUDE"},
{id:"F",text:"Işınların düşme açısı hiçbir gezegende yıl boyunca değişmez.",misconception:"TILT_MAGNITUDE"}],correctAnswer:"A",correctReason:"A"}
];
export function publicSeasonsItems() {
 return SEASONS_ITEMS.map(({id,concept,prompt,choices,reasons})=>({
  id,concept,prompt,choices:choices.map(({id,text})=>({id,text})),
  reasons:reasons.map(({id,text})=>({id,text}))
 }));
}
export function scoreSeasons(responses:Record<string,TierResponse>) {
 const items=SEASONS_ITEMS.map(q=>{
  const r=responses[q.id]; if(!r) return {id:q.id,concept:q.concept,status:"missing",correctAnswer:false,correctReason:false,confidenceAnswer:0,confidenceReason:0,misconceptions:[] as string[]};
  const correctAnswer=r.answer===q.correctAnswer,correctReason=r.reason===q.correctReason;
  const highAnswer=r.answerConfidence>=4, highReason=r.reasonConfidence>=4;
  const status=correctAnswer&&correctReason?(highAnswer&&highReason?"scientific":"tentative"):
  !correctAnswer&&!correctReason&&highAnswer&&highReason?"misconception_suspected":
  correctAnswer&&!correctReason?"false_positive":
  !correctAnswer&&correctReason?"false_negative":"incomplete";
  const misconceptions=[
   ...(highAnswer ? [q.choices.find(c=>c.id===r.answer)?.misconception] : []),
   ...(highReason ? [q.reasons.find(c=>c.id===r.reason)?.misconception] : [])
  ].filter((v):v is string=>Boolean(v));
  return {id:q.id,concept:q.concept,status,correctAnswer,correctReason,confidenceAnswer:r.answerConfidence,confidenceReason:r.reasonConfidence,misconceptions:[...new Set(misconceptions)]};
 });
 const answerCorrect=items.filter(x=>x.correctAnswer).length;
 const reasonCorrect=items.filter(x=>x.correctReason).length;
 const jointCorrect=items.filter(x=>x.correctAnswer&&x.correctReason).length;
 const scientific=items.filter(x=>x.status==="scientific").length;
 const counts:Record<string,number>={};
 items.forEach(i=>i.misconceptions.forEach(m=>{counts[m]=(counts[m]||0)+1;}));
 return {version:SEASONS_INSTRUMENT_VERSION,items,answerCorrect,reasonCorrect,jointCorrect,score:jointCorrect*10,scientific,scientificPercent:scientific*10,
 misconceptionCounts:counts,recurringMisconceptions:Object.keys(counts).filter(k=>counts[k]>=2)};
}
