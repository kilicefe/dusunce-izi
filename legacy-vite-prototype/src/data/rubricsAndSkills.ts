/**
  * System Constants for HOTS Dimensions, Rubric Templates, and Misconception Catalogs
  */

 export interface HotsDimensionOption {
   key: string;
   labelTr: string;
   description: string;
 }

 export const HOTS_DIMENSIONS: HotsDimensionOption[] = [
   {
     key: 'problemUnderstanding',
     labelTr: 'Problemi / Soruyu Anlama',
     description: 'Verilen durumu, değişkenleri ve sorunun özünü doğru tespit edebilme.',
   },
   {
     key: 'selectingRelevantInformation',
     labelTr: 'İlgili Bilgiyi Seçme',
     description: 'Karmaşık metin veya veriler içinden gerekli bilgiyi ayıklama.',
   },
   {
     key: 'relationshipBuilding',
     labelTr: 'Kavramlar Arası İlişki Kurma',
     description: 'Farklı fen ve bilim kavramlarını birbiriyle ilişkilendirme.',
   },
   {
     key: 'causalReasoning',
     labelTr: 'Neden-Sonuç Akıl Yürütme',
     description: 'Gözlemlenen durumların nedenlerini bilimsel ilkelerle gerekçelendirme.',
   },
   {
     key: 'inference',
     labelTr: 'Çıkarım Yapma',
     description: 'Verilen bilgi ve verilerden hareketle yeni mantıksal sonuçlara ulaşma.',
   },
   {
     key: 'evidenceUse',
     labelTr: 'Kanıt Kullanımı ve Değerlendirmesi',
     description: 'İddialarını gözlem, deney veya veri kanıtlarıyla destekleme.',
   },
   {
     key: 'evaluation',
     labelTr: 'Değerlendirme ve Eleştirel Yaklaşım',
     description: 'Verilen yöntem, iddia veya çözümü eleştirel gözle değerlendirme.',
   },
   {
     key: 'alternativeExplanationComparison',
     labelTr: 'Karşılaştırma ve Seçenek Analizi',
     description: 'Farklı hipotez veya çözüm yollarını avantaj ve dezavantajlarıyla kıyaslama.',
   },
   {
     key: 'errorDetection',
     labelTr: 'Hata Tespiti ve Düzeltme',
     description: 'Kurgusal veya verilen çözümlerdeki bilimsel hataları bulup düzeltme.',
   },
   {
     key: 'transfer',
     labelTr: 'Bilgi Transferi (Yeni Duruma Uygulama)',
     description: 'Öğrenilen ilkeyi günlük yaşamdan veya farklı disiplinden yeni bir duruma aktarma.',
   },
   {
     key: 'modelCreation',
     labelTr: 'Model Oluşturma ve Çizim Temsili',
     description: 'Soyut kavramları görsel, şematik veya çizim modellerine dönüştürme.',
   },
   {
     key: 'originalSolution',
     labelTr: 'Özgün Çözüm ve Karar Verme',
     description: 'Probleme yönelik alternatif, özgün ve yaratıcı çözüm önerileri geliştirme.',
   },
   {
     key: 'scientificArgumentation',
     labelTr: 'Bilimsel Argümantasyon (İddia-Kanıt-Gerekçe)',
     description: 'İddia, kanıt, gerekçe ve çürütme yapılarını eksiksiz kurabilme.',
   },
   {
     key: 'metacognition',
     labelTr: 'Üstbiliş ve Kendi Düşüncesini Yansıtma',
     description: 'Düşünme sürecini adım adım fark edip kendi mantığını açıklayabilme.',
   },
 ];

 export interface SystemRubricTemplate {
   dimensionKey: string;
   dimensionTitleTr: string;
   description: string;
   levels: Array<{
     level: number;
     levelTitle: string;
     description: string;
     observableIndicators: string;
   }>;
 }

 export const SYSTEM_RUBRICS: SystemRubricTemplate[] = [
   {
     dimensionKey: 'conceptualUnderstanding',
     dimensionTitleTr: 'A. Kavramsal Anlama (Conceptual Understanding)',
     description: 'Sorudaki temel bilimsel kavram ve ilkelerin doğru tanımlanması ve kullanımı.',
     levels: [
       {
         level: 0,
         levelTitle: 'Düzey 0: Cevap Yok / Tamamen Yanlış',
         description: 'Öğrenci cevabı boş bırakmış ya da soruyla ilgisiz ifadeler kullanmıştır.',
         observableIndicators: 'Hiçbir doğru kavram yer almaz, rastgele sözcükler yazılmıştır.',
       },
       {
         level: 1,
         levelTitle: 'Düzey 1: Yüzeysel / Yanılgılı Anlama',
         description: 'Kavramlar karışık veya günlük dille, bilimsel açıdan hatalı ifade edilmiştir.',
         observableIndicators: 'Temel kavram yanılgıları görülür; ısı ve sıcaklık karıştırılmıştır.',
       },
       {
         level: 2,
         levelTitle: 'Düzey 2: Kısmen Doğru Anlama',
         description: 'Temel kavram doğru belirtilmiş ancak detaylar ve moleküler seviye eksiktir.',
         observableIndicators: 'Özısı kavramı anılmış ama tanecik hareketiyle tam bağlanamamıştır.',
       },
       {
         level: 3,
         levelTitle: 'Düzey 3: Doğru ve Yeterli Anlama',
         description: 'Kavramlar bilimsel terminolojiye uygun ve tutarlı biçimde açıklanmıştır.',
         observableIndicators: 'Sıcaklık artışı ile özısı ilişkisi doğru kurulmuştur.',
       },
       {
         level: 4,
         levelTitle: 'Düzey 4: Derinlemesine / Eksiksiz Anlama',
         description: 'Kavramlar mikroskobik düzey, enerji aktarımı ve nicel ilişkilerle eksiksiz açıklanmıştır.',
         observableIndicators: 'Özısı, tanecik kinetik enerjisi ve kütle ilişkisi tam bilimsel derinlikte açıklanmıştır.',
       },
       ],
   },
   {
     dimensionKey: 'representation',
     dimensionTitleTr: 'B. Çoklu Temsil Kullanımı (Multiple Representations)',
     description: 'Çizim, şema, sembol, grafik veya metin kombinasyonuyla düşüncesini aktarma.',
     levels: [
       {
         level: 0,
         levelTitle: 'Düzey 0: Temsil Yok',
         description: 'Görsel veya şematik temsil sunulmamıştır.',
         observableIndicators: 'Sadece metin var veya çizim yapılmamıştır.',
       },
       {
         level: 1,
         levelTitle: 'Düzey 1: Hatalı / Etiketlenmemiş Çizim',
         description: 'Çizim yapılmış fakat etiketler ve oklar mantıksız ya da eksiktir.',
         observableIndicators: 'Rastgele şekiller çizilmiş, birbiriyle bağlantısı kurulamamıştır.',
       },
       {
         level: 2,
         levelTitle: 'Düzey 2: Basit Temsil',
         description: 'Çizim temel unsurları barındırır, etiketler kısmen mevcuttur.',
         observableIndicators: 'Isı akış yönü okla gösterilmiş fakat tanecik yoğunluğu eksiktir.',
       },
       {
         level: 3,
         levelTitle: 'Düzey 3: Tutarlı ve Etiketli Temsil',
         description: 'Çizim ve metin birbiriyle uyumludur; oklar ve etiketler bilimseldir.',
         observableIndicators: 'Görsel modeldeki anlatım ile metindeki açıklama birebir örtüşmektedir.',
       },
       {
         level: 4,
         levelTitle: 'Düzey 4: Zengin ve Çapraz Temsil',
         description: 'Metin, çizim ve nicel veriler (şema/oklar) mükemmel entegrasyon gösterir.',
         observableIndicators: 'Çizimdeki mikro düzey parçacıklar ile enerji transferi okları kusursuz eşleşir.',
       },
     ],
   },
   {
     dimensionKey: 'higherOrderThinking',
     dimensionTitleTr: 'C. Üst Düzey Düşünme (Higher-Order Thinking)',
     description: 'Neden-sonuç zinciri, çıkarım, hata tespiti veya bilgi transferi becerileri.',
     levels: [
       {
         level: 0,
         levelTitle: 'Düzey 0: Akıl Yürütme Yok',
         description: 'Sadece durum tekrarı yapılmış, akıl yürütme adımı içermez.',
         observableIndicators: 'Öğrenci soruyu aynen yazmıştır.',
       },
       {
         level: 1,
         levelTitle: 'Düzey 1: Zayıf / Kopuk Akıl Yürütme',
         description: 'Neden ve sonuç arasında doğrudan mantıksal bağ kurulamamıştır.',
         observableIndicators: 'Çünkü böyledir diyerek ezber mantık sunulmuştur.',
       },
       {
         level: 2,
         levelTitle: 'Düzey 2: Kısmi Akıl Yürütme',
         description: 'Neden-sonuç adımlarının bir kısmı kurulmuş ancak bir halka eksiktir.',
         observableIndicators: 'Isı verildiği söylenmiş ama sıcaklık farkının mekanizması atlanmıştır.',
       },
       {
         level: 3,
         levelTitle: 'Düzey 3: Mantıksal ve Adım Adım Akıl Yürütme',
         description: 'Mantık zinciri eksiksiz ve gerekçelendirilerek inşa edilmiştir.',
         observableIndicators: 'Veri -> Gerekçe -> Sonuç adımları belirgindir.',
       },
       {
         level: 4,
         levelTitle: 'Düzey 4: Derinleşmiş / Transfer İçeren Akıl Yürütme',
         description: 'Yeni durumlara uygulanabilir genel ilkeler ve özgün çıkarımlar yapılmıştır.',
         observableIndicators: 'Farklı bir ortamdaki benzer olayla karşılaştırma yaparak çıkarım kurulmuştur.',
       },
     ],
   },
   {
     dimensionKey: 'argumentation',
     dimensionTitleTr: 'D. Bilimsel Argümantasyon (Scientific Argumentation)',
     description: 'İddia (Claim), Kanıt (Evidence) ve Gerekçe (Reasoning) yapılandırılması.',
     levels: [
       {
         level: 0,
         levelTitle: 'Düzey 0: İddia veya Argüman Yok',
         description: 'Belirgin bir iddia veya gerekçe yer almamaktadır.',
         observableIndicators: 'Taraf veya bilimsel duruş açık değildir.',
       },
       {
         level: 1,
         levelTitle: 'Düzey 1: Yalnızca İddia',
         description: 'Sadece iddia sunulmuş, hiçbir kanıt ve gerekçe eklenmemiştir.',
         observableIndicators: 'Su daha çabuk ısınır denilmiş ama nedeni sunulmamıştır.',
       },
       {
         level: 2,
         levelTitle: 'Düzey 2: İddia + Zayıf Kanıt',
         description: 'İddia sunulmuş ve veriden bir detay söylenmiş fakat gerekçelendirilmemiştir.',
         observableIndicators: 'Sıcaklıklar farklı denilmiş ancak fizik kanununa bağlanmamıştır.',
       },
       {
         level: 3,
         levelTitle: 'Düzey 3: Tam Argüman (İddia + Kanıt + Gerekçe)',
         description: 'İddia verilerle desteklenmiş ve bilimsel ilkeyle açıklanmıştır.',
         observableIndicators: 'İddia açık, kanıtlar sorudan alınmış ve özısı ilkesiyle gerekçelendirilmiştir.',
       },
       {
         level: 4,
         levelTitle: 'Düzey 4: Gelişmiş Argüman (+ Çürütme / Karşı İddia)',
         description: 'Karşı iddialar veya olası yanılgılar çürütülerek argüman güçlendirilmiştir.',
         observableIndicators: 'Isıların aynı olduğu varsayılsa dahi sıcaklıkların neden eşit olamayacağı gerekçelenmiştir.',
       },
     ],
   },
 ];
