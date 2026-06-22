import type { Question, Difficulty } from '../types';

export interface TopicDefinition {
  subject: string;
  unit: string;
  topic: string;
}

export const LGS_SYLLABUS: TopicDefinition[] = [
  // MATEMATIK
  { subject: 'Matematik', unit: 'Çarpanlar ve Katlar', topic: 'Asal Çarpanlara Ayırma' },
  { subject: 'Matematik', unit: 'Çarpanlar ve Katlar', topic: 'EBOB - EKOK Problemleri' },
  { subject: 'Matematik', unit: 'Çarpanlar ve Katlar', topic: 'Aralarında Asallık' },
  { subject: 'Matematik', unit: 'Üslü İfadeler', topic: 'Üslü Sayılarda Çarpma' },
  { subject: 'Matematik', unit: 'Üslü İfadeler', topic: 'Üslü Sayılarda Bölme' },
  { subject: 'Matematik', unit: 'Üslü İfadeler', topic: 'Bilimsel Gösterim' },
  { subject: 'Matematik', unit: 'Üslü İfadeler', topic: 'Üssün Üssü Kuralları' },
  { subject: 'Matematik', unit: 'Kareköklü İfadeler', topic: 'Tam Kare Sayılar' },
  { subject: 'Matematik', unit: 'Kareköklü İfadeler', topic: 'Kök Dışına Çıkarma' },
  { subject: 'Matematik', unit: 'Kareköklü İfadeler', topic: 'Kareköklü Sayılarda Çarpma ve Bölme' },
  { subject: 'Matematik', unit: 'Kareköklü İfadeler', topic: 'Karekök Tahminleme' },
  { subject: 'Matematik', unit: 'Veri Analizi', topic: 'Sütun Grafiği Dönüşümü' },
  { subject: 'Matematik', unit: 'Veri Analizi', topic: 'Daire Grafiği Analizi' },
  { subject: 'Matematik', unit: 'Cebirsel İfadeler', topic: 'Özdeşlikler' },
  { subject: 'Matematik', unit: 'Cebirsel İfadeler', topic: 'Çarpanlara Ayırma' },

  // TÜRKÇE
  { subject: 'Türkçe', unit: 'Sözcükte Anlam', topic: 'Gerçek ve Mecaz Anlam' },
  { subject: 'Türkçe', unit: 'Sözcükte Anlam', topic: 'Terim ve Eş Anlamlılar' },
  { subject: 'Türkçe', unit: 'Sözcükte Anlam', topic: 'Söz Öbeklerinde Anlam' },
  { subject: 'Türkçe', unit: 'Cümlede Anlam', topic: 'Öznel ve Nesnel Anlatım' },
  { subject: 'Türkçe', unit: 'Cümlede Anlam', topic: 'Neden-Sonuç, Amaç-Sonuç' },
  { subject: 'Türkçe', unit: 'Cümlede Anlam', topic: 'Örtülü Anlam' },
  { subject: 'Türkçe', unit: 'Parçada Anlam', topic: 'Paragrafın Ana Fikri' },
  { subject: 'Türkçe', unit: 'Parçada Anlam', topic: 'Yardımcı Düşünceler' },
  { subject: 'Türkçe', unit: 'Parçada Anlam', topic: 'Anlatım Teknikleri' },
  { subject: 'Türkçe', unit: 'Yazım ve Noktalama', topic: 'Büyük Harflerin Kullanımı' },
  { subject: 'Türkçe', unit: 'Yazım ve Noktalama', topic: 'De - Da ve Ki Bağlaçları' },
  { subject: 'Türkçe', unit: 'Yazım ve Noktalama', topic: 'Virgül ve Noktalı Virgül' },

  // FEN BILIMLERI
  { subject: 'Fen Bilimleri', unit: 'Mevsimler ve İklim', topic: 'Mevsimlerin Oluşumu' },
  { subject: 'Fen Bilimleri', unit: 'Mevsimler ve İklim', topic: 'İklim ve Hava Hareketleri' },
  { subject: 'Fen Bilimleri', unit: 'Mevsimler ve İklim', topic: 'Rüzgar Oluşumu' },
  { subject: 'Fen Bilimleri', unit: 'DNA ve Genetik Kod', topic: 'DNA\'nın Yapısı' },
  { subject: 'Fen Bilimleri', unit: 'DNA ve Genetik Kod', topic: 'Kalıtım ve Çaprazlamalar' },
  { subject: 'Fen Bilimleri', unit: 'DNA ve Genetik Kod', topic: 'Mutasyon, Modifikasyon, Adaptasyon' },
  { subject: 'Fen Bilimleri', unit: 'DNA ve Genetik Kod', topic: 'Biyoteknoloji Uygulamaları' },
  { subject: 'Fen Bilimleri', unit: 'Basınç', topic: 'Katı Basıncı' },
  { subject: 'Fen Bilimleri', unit: 'Basınç', topic: 'Sıvı Basıncı' },
  { subject: 'Fen Bilimleri', unit: 'Basınç', topic: 'Gaz Basıncı' }
];

export function generateLGSQuestions(): Question[] {
  const pool: Question[] = [];

  let syllabusToUse = LGS_SYLLABUS;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('lgs_custom_syllabus') || localStorage.getItem('lgs_published_syllabus');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          syllabusToUse = parsed;
        }
      } catch (e) {
        console.error('Failed to parse syllabus in generateLGSQuestions:', e);
      }
    }
  }

  for (const item of syllabusToUse) {
    if (!item.subject || !item.unit || !item.topic) continue;
    for (let i = 1; i <= 20; i++) {
      const difficulty: Difficulty = i <= 6 ? 'Kolay' : i <= 14 ? 'Orta' : 'Zor';
      const subjectPrefix = (item.subject || 'GEN').substring(0, 3).toUpperCase();
      const topicSuffix = (item.topic || 'TOP').replace(/\s+/g, '').substring(0, 5).toUpperCase();
      const qId = `${subjectPrefix}-${topicSuffix}-${100 + i}`;
      
      const q = buildQuestion(item.subject, item.unit, item.topic, i, difficulty, qId);
      pool.push(q);
    }
  }

  return pool;
}

function buildGenericQuestion(
  subject: string,
  unit: string,
  topic: string,
  index: number,
  difficulty: Difficulty,
  id: string
): Question {
  const options = [
    { label: 'A', value: `${topic} konusunun temel LGS kazanımı doğrultusunda çözüme ulaşmaktır.`, isCorrect: true },
    { label: 'B', value: `${unit} ünitesinde yer alan alternatif mantıksal yorumdur.`, isCorrect: false },
    { label: 'C', value: `Soruda verilen değişkenlerin hatalı ilişkilendirilmesiyle ulaşılan sonuçtur.`, isCorrect: false },
    { label: 'D', value: `Sürece dahil olmayan, konu dışı bir varsayımdır.`, isCorrect: false }
  ];

  // Rotate based on index
  const correctIdx = index % 4;
  if (correctIdx !== 0 && correctIdx < 4) {
    const temp = options[0];
    options[0] = options[correctIdx];
    options[correctIdx] = temp;
  }

  return {
    id,
    difficulty,
    text: `LGS yeni nesil sınav hazırlık sürecinde, ${subject} dersi kapsamında yer alan ${unit} ünitesindeki ${topic} kazanımı üzerine kurgulanmış analitik bir senaryo aşağıda sunulmuştur. Öğrencinin muhakeme ve problem çözme becerilerini ölçmeyi hedeflemektedir.`,
    context: `"${topic} konusunda ${index}. düzey soru kalıbı analiz edilmektedir. Soru çözüm adımlarında formül bilgisi ve pratik uygulama dengesi gözetilmelidir."`,
    query: `Yukarıda aktarılan yeni nesil mantıksal bağlam çerçevesinde, ${topic} ile ilgili sunulan seçeneklerden hangisi en doğru çıkarımı ifade eder?`,
    options,
    hint: `Öncelikle ${topic} konusunun temel tanımlarına odaklanın ve soruda verilen öncülleri eleme yöntemiyle sırasıyla eşleştirin.`,
    errorAnalysis: `${unit} ünitesine ait ${topic} başlığında kavram süzgeçlerinde eşleşme veya işlem adımları takibi sırasında kritik konsantrasyon kaybı yaşanmış olabilir.`,
    errorType: `${topic} Kazanım Analizi Hatası`,
    subject,
    unit,
    topic
  };
}

export function buildQuestion(
  subject: string, 
  unit: string, 
  topic: string, 
  index: number, 
  difficulty: Difficulty,
  id: string
): Question {
  let q: Question;
  if (subject === 'Matematik') {
    q = buildMathQuestion(unit, topic, index, difficulty, id);
  } else if (subject === 'Türkçe') {
    q = buildTurkishQuestion(unit, topic, index, difficulty, id);
  } else if (subject === 'Fen Bilimleri') {
    q = buildScienceQuestion(unit, topic, index, difficulty, id);
  } else {
    return buildGenericQuestion(subject, unit, topic, index, difficulty, id);
  }

  if (!q.text || q.text === '' || !q.options || q.options.length === 0) {
    return buildGenericQuestion(subject, unit, topic, index, difficulty, id);
  }

  return q;
}

// Generate high-quality Math questions mathematically varying with `index`
function buildMathQuestion(unit: string, topic: string, index: number, difficulty: Difficulty, id: string): Question {
  let text = '';
  let context = '';
  let query = '';
  let hint = '';
  let errorAnalysis = '';
  let errorType = 'İşlem Hatası';
  let options: { label: string; value: string; isCorrect: boolean }[] = [];

  if (topic === 'Asal Çarpanlara Ayırma') {
    const baseNum = 30 + index * 12; // E.g., 42, 54, 66, ...
    // Calculate prime factors
    const factors: number[] = [];
    let temp = baseNum;
    for (let d = 2; d <= temp; d++) {
      if (temp % d === 0) {
        factors.push(d);
        while (temp % d === 0) temp /= d;
      }
    }
    const sumFactors = factors.reduce((a, b) => a + b, 0);
    const countFactors = factors.length;
    
    text = `LGS Matematik hazırlık maratonunda olan Zehra, ${baseNum} sayısının pozitif tam sayı çarpanlarını analiz etmektedir.`;
    context = `"${baseNum} sayısı asal çarpanlarına ayrılarak üslü ifadelerin çarpımı şeklinde yazılabilen bir tam sayıdır."`;
    query = `Buna göre, ${baseNum} sayısının farklı asal çarpanlarının toplamı kaçtır?`;
    hint = `Sayının asal çarpanlarını bulmak için en küçük asal sayı olan 2'den başlayarak bölme algoritması yapabilirsin.`;
    errorAnalysis = `${baseNum} sayısının doğru asal çarpanları ${factors.join(', ')}'dir. Bunların toplamı ise ${sumFactors} olmalıdır. Prime çarpanları seçerken hata yapmış olabilirsin.`;
    errorType = 'Asal Çarpan Belirleme Hatası';

    options = [
      { label: 'A', value: `${sumFactors}`, isCorrect: true },
      { label: 'B', value: `${sumFactors + 2}`, isCorrect: false },
      { label: 'C', value: `${sumFactors - 1}`, isCorrect: false },
      { label: 'D', value: `${sumFactors * 2}`, isCorrect: false }
    ];
  } else if (topic === 'EBOB - EKOK Problemleri') {
    const x = 12 + index * 2;
    const y = 15 + index * 3;
    // Simple LCM, GCD calculation
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const lcmVal = (x * y) / gcd(x, y);

    text = `Bir marangoz elindeki iki farklı tahta bloğu eşit uzunlukta parçalara ayırmak istemektedir. Tahtalardan birinin boyu ${x} metre, diğerinin boyu ise ${y} metredir.`;
    context = `"Kesim işlemleri yapılırken parçaların uzunluklarının tam sayı cinsinden metre olması ve artan tahta kalmaması planlanmaktadır."`;
    query = `Buna göre elde edilebilecek en büyük uzunluktaki parçalardan toplamda en az kaç adet kesim yapılmadan elde edilir?`;
    hint = `Önce iki tahta boyunun en büyük ortak böleni olan EBOB(${x}, ${y}) değerini bul. Sonra her iki tahta boyunu bu EBOB'a bölüp sonuçları topla.`;
    
    const ebob = gcd(x, y);
    const totalPieces = (x / ebob) + (y / ebob);
    errorAnalysis = `İki tahtanın EBOB'u ${ebob} metredir. ${x}/${ebob} = ${x/ebob} ve ${y}/${ebob} = ${y/ebob} parça elde edilir. Toplam en az parça sayısı ${totalPieces} olmalıdır.`;
    errorType = 'EBOB / EKOK Karışıklığı';

    options = [
      { label: 'A', value: `${totalPieces}`, isCorrect: true },
      { label: 'B', value: `${totalPieces + 2}`, isCorrect: false },
      { label: 'C', value: `${lcmVal}`, isCorrect: false },
      { label: 'D', value: `${ebob}`, isCorrect: false }
    ];
  } else if (topic === 'Aralarında Asallık') {
    const a = 10 + index;
    const b = 21 + index * 2;
    // Check if coprime
    const gcd = (x: number, y: number): number => y === 0 ? x : gcd(y, x % y);
    const isCoprime = gcd(a, b) === 1;

    text = `Sayı teorisi dersinde iki sayının ortak pozitif böleninin yalnızca 1 olması durumu 'Aralarında Asal' olarak isimlendirilir.`;
    context = `"Sayı çiftleri: K = ${a} ve L = ${b} olarak verilmiştir."`;
    query = `K ve L sayı çiftleri hakkında aşağıdakilerden hangisi kesinlikle doğrudur?`;
    hint = `${a} ve ${b} sayılarının 1'den başka ortak böleni olup olmadığını kontrol etmek için her iki sayının çarpan listesini kontrol et.`;
    errorAnalysis = `K ve L sayılarının EBOB’u ${gcd(a,b)}'dir. EBOB 1 ise aralarında asaldırlar, 1 değilse değillerdir.`;
    errorType = 'Temel Bilgi Eksiği';

    options = [
      { label: 'A', value: isCoprime ? 'Aralarında asaldırlar.' : 'Aralarında asal değildirler, ortak bölenleri vardır.', isCorrect: true },
      { label: 'B', value: isCoprime ? 'Aralarında asal değildirler.' : 'Aralarında asaldırlar.', isCorrect: false },
      { label: 'C', value: 'Her iki sayı da birer asal sayıdır.', isCorrect: false },
      { label: 'D', value: 'Sayıların toplamı bir çift sayıdır.', isCorrect: false }
    ];
  } else if (topic === 'Üslü Sayılarda Çarpma') {
    const p1 = index + 1;
    const p2 = index + 3;
    const valCorrect = p1 + p2;
    text = `Laboratuvarda gözlemlenen bir bakteri türü her saatte bir kendini bölerek çoğalmaktadır. İlk saat sonunda kapta 2^${p1} adet bakteri bulunmaktadır.`;
    context = `"Bakteri sayısının her saat sonunda 2^${p2} katına çıktığı gözlenmiştir."`;
    query = `Buna göre 1 saatlik çoğalma süresi sonundaki toplam bakteri miktarı aşağıdakilerden hangisidir?`;
    hint = `Tabanları aynı olan üslü sayıları çarparken üsler toplanır: a^x * a^y = a^(x+y).`;
    errorAnalysis = `Bakteriler çoğaldığı için 2^${p1} ile 2^${p2} sayılarını çarpmalısın. Üsleri topladığında sonucun 2^${valCorrect} olduğunu göreceksin.`;
    errorType = 'Kural Karışıklığı';

    options = [
      { label: 'A', value: `2^${valCorrect}`, isCorrect: true },
      { label: 'B', value: `2^${p1 * p2}`, isCorrect: false },
      { label: 'C', value: `4^${valCorrect}`, isCorrect: false },
      { label: 'D', value: `2^${Math.max(p1, p2)}`, isCorrect: false }
    ];
  } else if (topic === 'Üslü Sayılarda Bölme') {
    const p1 = index * 2 + 5;
    const p2 = index + 2;
    const valCorrect = p1 - p2;
    text = `Bir veri dağıtım şebekesinde 4^${p1} byte boyutundaki bir veri dosyası, her bir kanaldan saniyede 4^${p2} byte hızla transfer edilebilmektedir.`;
    context = `"Şebeke boyunca kayıpsız veri akışı sağlanmaktadır."`;
    query = `Bu dosyanın tek bir kanal üzerinden transferinin tamamlanması kaç saniye sürecektir?`;
    hint = `Tabanları aynı olan üslü ifadelerde bölme işlemi yapılırken payın üssünden paydanın üssü çıkarılır: a^x / a^y = a^(x-y).`;
    errorAnalysis = `Uzaklık veya zamanı bulurken bölme yaparız: 4^${p1} / 4^${p2} = 4^(${p1}-${p2}) = 4^${valCorrect}. Üsleri bölmeye çalışma.`;
    errorType = 'Üslerin Bölünmesi Hatası';

    options = [
      { label: 'A', value: `4^${valCorrect}`, isCorrect: true },
      { label: 'B', value: `4^${Math.floor(p1 / p2)}`, isCorrect: false },
      { label: 'C', value: `2^${valCorrect}`, isCorrect: false },
      { label: 'D', value: `4^${p1 + p2}`, isCorrect: false }
    ];
  } else if (topic === 'Bilimsel Gösterim') {
    const num = index * 1.25;
    const coeff = num.toFixed(2);
    const expo = index + 4;
    text = `Mikroskobik ortamdaki bir kimyasal reaksiyonda açığa çıkan enerji miktarı ölçülmüştür.`;
    context = `"Ölçülen enerji miktarı tam olarak ${coeff} x 10^${expo} Joule düzeyindedir."`;
    query = `Bu ölçüm değerinin standart bilimsel gösterim kurallarına uygunluğu ve biçimi hakkında ne söylenebilir?`;
    hint = `Bilimsel gösterimde katsayının mutlak değeri 1 veya 1'den büyük, 10'dan ise kesinlikle küçük olmalıdır. a * 10^n ifadesinde 1 <= |a| < 10 şartı aranır.`;
    errorAnalysis = `Katsayı ${coeff} olup, 1 ile 10 arasındadır. Dolayısıyla bu zaten bilimsel gösterim formatındadır.`;
    errorType = 'Kural Karışıklığı';

    options = [
      { label: 'A', value: 'Bilimsel gösterime uygundur.', isCorrect: true },
      { label: 'B', value: 'Yalnızca katsayıyı 10 ile çarparak düzeltebiliriz.', isCorrect: false },
      { label: 'C', value: 'Gelişmiş gösterim için üssü negatife çekmeliyiz.', isCorrect: false },
      { label: 'D', value: 'Bilimsel gösterim olması için katsayının tam sayı olması şarttır.', isCorrect: false }
    ];
  } else if (topic === 'Üssün Üssü Kuralları') {
    const p1 = 2;
    const p2 = index + 2;
    const totalPower = p1 * p2;
    text = `Bir mühendislik problemi için hazırlanan yapay zeka algoritmasının işlem basamakları (5^${p1})^${p2} biçiminde basitleştirilmiştir.`;
    context = `"Sistem hiyerarşisinde üssün üssü kavramının verimli kodlanması amaçlanmıştır."`;
    query = `Bu ifadenin tek tabanda en yalın üslü gösterimi aşağıdakilerden hangisidir?`;
    hint = `Üssün üssü kuralında taban aynı kalırken içteki üs ile dıştaki üs birbiriyle çarpılır: (a^n)^m = a^(n*m).`;
    errorAnalysis = `İçteki üs ${p1} ile dıştaki üs ${p2} çarpılmalıdır. 5^(${p1}*${p2}) = 5^${totalPower} olmalıdır. Yanlışlıkla üsleri toplamadığından emin ol.`;
    errorType = 'Üslerin Toplanması Hatası';

    options = [
      { label: 'A', value: `5^${totalPower}`, isCorrect: true },
      { label: 'B', value: `5^${p1 + p2}`, isCorrect: false },
      { label: 'C', value: `25^${totalPower}`, isCorrect: false },
      { label: 'D', value: `5^${Math.pow(p1, p2)}`, isCorrect: false }
    ];
  } else if (topic === 'Tam Kare Sayılar') {
    const rootNum = index + 10; // 11, 12, 13, ...
    const squareVal = rootNum * rootNum; // 121, 144, 169, ...
    text = `Ahmet Bey, kare şeklindeki hobi bahçesinin etrafına tel örgü çekmek istiyor. Bahçenin toplam alanı ${squareVal} metrekaredir.`;
    context = `"Bahçenin tüm kenarları eşit uzunluktadır ve bir kenarı tam sayı cinsinden metredir."`;
    query = `Bahçenin bir kenar uzunluğu kaç metredir?`;
    hint = `Alan formülü A = a² şeklindedir. Bir kenarı bulmak için alanın karekökünü (√${squareVal}) almalısın.`;
    errorAnalysis = `${squareVal} sayısı ${rootNum} sayısının karesidir (tam karedir). √${squareVal} = ${rootNum} metre bir kenar boyudur.`;
    errorType = 'Temel Bilgi Eksiği';

    options = [
      { label: 'A', value: `${rootNum}`, isCorrect: true },
      { label: 'B', value: `${rootNum - 1}`, isCorrect: false },
      { label: 'C', value: `${rootNum + 2}`, isCorrect: false },
      { label: 'D', value: `${Math.floor(squareVal / 2)}`, isCorrect: false }
    ];
  } else if (topic === 'Kök Dışına Çıkarma') {
    const inside = (index + 1) * (index + 1) * 2; // e.g. 8, 18, 32, 50...
    const outsideCoeff = index + 1;
    text = `Bir tasarım stüdyosunda kenar boyu √${inside} birim olan dekoratif kare levhalar kullanılmaktadır.`;
    context = `"Kenar uzunluğunun a√b formatında sadeleştirilmesi tasarımsal ölçümlerde kolaylık sağlayacaktır."`;
    query = `√${inside} ifadesi kök dışına çıkarıldığında aşağıdakilerden hangisine eşit olur?`;
    hint = `İçerideki sayıyı tam kare bir sayı ile diğer bir sayının çarpımı (a² * b) şeklinde yazmaya çalış. Sonra tam kare olan sayıyı dışarı a olarak çıkar.`;
    errorAnalysis = `${inside} sayısını ${outsideCoeff}² * 2 şeklinde yazabiliriz. Dolayısıyla √${inside} = ${outsideCoeff}√2 olacaktır.`;
    errorType = 'Kural Karışıklığı';

    options = [
      { label: 'A', value: `${outsideCoeff}√2`, isCorrect: true },
      { label: 'B', value: `2√${outsideCoeff}`, isCorrect: false },
      { label: 'C', value: `${outsideCoeff}√${outsideCoeff}`, isCorrect: false },
      { label: 'D', value: `${outsideCoeff * 2}√1`, isCorrect: false }
    ];
  } else if (topic === 'Kareköklü Sayılarda Çarpma ve Bölme') {
    const o1 = index + 1;
    const o2 = index;
    const insideMul = 3 * 2; // 6
    const answerVal = `${o1 * o2}√6`;
    text = `Geometrik hesaplama yapan bir tasarım programında kenarları ${o1}√3 ve ${o2}√2 birim olan bir dikdörtgen verilmiştir.`;
    context = `"Alan hesabı yapılırken kenar uzunluklarının çarpılması gerekmektedir."`;
    query = `Bu dikdörtgenin alanı kaç birimkaredir?`;
    hint = `Kareköklü sayılarda çarpma yapılırken dıştaki katsayılar kendi arasında, kök içindeki sayılar kendi arasında çarpılır: (a√x) * (b√y) = (a*b)√(x*y).`;
    errorAnalysis = `Dıştaki ${o1} ve ${o2} sayıları çarpılarak katsayı ${o1*o2} bulunur, içteki √3 ve √2 çarpılarak kök içi √6 bulunur. Sonuç ${answerVal} olur.`;
    errorType = 'Katsayı Çarpım Hatası';

    options = [
      { label: 'A', value: `${answerVal}`, isCorrect: true },
      { label: 'B', value: `${o1 + o2}√5`, isCorrect: false },
      { label: 'C', value: `${o1 * o2}√5`, isCorrect: false },
      { label: 'D', value: `5√${o1 * o2}`, isCorrect: false }
    ];
  } else if (topic === 'Karekök Tahminleme') {
    const num = index * 3 + 10; // e.g. 13, 16, 19, 22...
    // Find surrounding perfect squares
    const r = Math.sqrt(num);
    const low = Math.floor(r);
    const high = Math.ceil(r);
    text = `Bir ölçüm aracının hassas ekranında √${num} santimetre uzunluğunda bir boşluk gösterilmiştir.`;
    context = `"Cihaz ekranı yalnızca tam sayılar arasında kıyaslama yapabilmektedir."`;
    query = `√${num} değeri hangi iki ardışık tam sayı arasında yer alır?`;
    hint = `${num} sayısından hemen küçük olan tam kare sayı ile hemen büyük olan tam kare sayıyı tespit et ve kareköklerini al.`;
    errorAnalysis = `${num} sayısı, ${low*low} ve ${high*high} tam kare sayıları arasındadır. Bu nedenle √${num} sayısı ${low} ve ${high} arasındadır.`;
    errorType = 'Sınır Kestirim Hatası';

    options = [
      { label: 'A', value: `${low} ile ${high}`, isCorrect: true },
      { label: 'B', value: `${low - 1} ile ${low}`, isCorrect: false },
      { label: 'C', value: `${high} ile ${high + 1}`, isCorrect: false },
      { label: 'D', value: `${low * 2} ile ${high * 2}`, isCorrect: false }
    ];
  } else if (topic === 'Sütun Grafiği Dönüşümü') {
    const sum = 360;
    const item1 = index * 10 + 40;
    text = `Bir ortaokulda yapılan LGS deneme sınavında öğrencilerin en çok zorlandığı dersler analiz edilerek bir istatistik tablosu oluşturulmuştur.`;
    context = `"Sütun grafiğindeki verilere göre Matematik puanlarındaki ortalamanın genel payı ${item1} derecelik bir dilime karşılık gelmektedir."`;
    query = `Bu veriler daire grafiğine dönüştürüldüğünde, ilgili dersin merkez açısı kaç derece olur?`;
    hint = `Daire grafiğinin tamamı 360 derecedir. Orantı kurarak yüzdeyi veya payı bulup 360 ile çarparak merkez açıyı hesapla.`;
    errorAnalysis = `Merkez açıyı belirlerken tüm daireyi 360 derece kabul ettik. Matematik dersi payı doğrudan ${item1}° olarak hesaplanır.`;
    errorType = 'Orantılama Hatası';

    options = [
      { label: 'A', value: `${item1}°`, isCorrect: true },
      { label: 'B', value: `${item1 - 10}°`, isCorrect: false },
      { label: 'C', value: `${item1 + 20}°`, isCorrect: false },
      { label: 'D', value: `${item1 * 2}°`, isCorrect: false }
    ];
  } else if (topic === 'Daire Grafiği Analizi') {
    const angle = index * 5 + 60; // 65, 70, 75, ...
    const percent = ((angle / 360) * 100).toFixed(1);
    text = `Bir karlı tarım arazisinde ekilen ürün dağılımı daire grafiğinde gösterilmiştir.`;
    context = `"Arpa ekili alanın merkez açısı tam ${angle} derecedir."`;
    query = `Buna göre, arpa ekili alan tüm arazinin yaklaşık yüzde kaçını oluşturmaktadır?`;
    hint = `Merkez açıyı 360'a bölüp 100 ile çarparak yüzde oranını hesaplayabilirsin: (Açı / 360) * 100.`;
    errorAnalysis = `${angle} derecelik açı 360 derecenin %${percent} oranına denk gelir. Orantı kurarken dikkat et.`;
    errorType = 'Yüzde Hesaplama Hatası';

    options = [
      { label: 'A', value: `%${percent}`, isCorrect: true },
      { label: 'B', value: `%${(angle / 3).toFixed(1)}`, isCorrect: false },
      { label: 'C', value: `%${(angle / 2).toFixed(1)}`, isCorrect: false },
      { label: 'D', value: `%10`, isCorrect: false }
    ];
  } else if (topic === 'Özdeşlikler') {
    const a = index + 1;
    const aSq = a * a;
    const doubleA = 2 * a;
    text = `Bir matematik öğretmen tahtaya (x + ${a})² ifadesini yazmış ve öğrencilerinden bu ifadeyi özdeşlik kurallarına göre açmalarını istemiştir.`;
    context = `"İki terim toplamının karesi özdeşliği: (A + B)² = A² + 2AB + B² biçimindedir."`;
    query = `Buna göre, bu ifadenin en sade açılmış biçimi aşağıdakilerden hangisidir?`;
    hint = `Birincinin karesi + birinci ile ikincinin çarpımının iki katı + ikincinin karesi kuralını doğrudan uygula.`;
    errorAnalysis = `Cebirsel açılımda (x+${a})² = x² + 2(${a}x) + ${a}² = x² + ${doubleA}x + ${aSq} olmalıdır. Çarpımın iki katını almayı unutmuş olabilirsin.`;
    errorType = 'Özdeşlik Katsayı Hatası';

    options = [
      { label: 'A', value: `x² + ${doubleA}x + ${aSq}`, isCorrect: true },
      { label: 'B', value: `x² + ${aSq}`, isCorrect: false },
      { label: 'C', value: `x² + ${a}x + ${aSq}`, isCorrect: false },
      { label: 'D', value: `x² + ${doubleA}x + ${doubleA}`, isCorrect: false }
    ];
  } else {
    // Çarpanlara Ayırma
    const a = index + 2;
    text = `Alan ölçüsü x² - ${a*a} olan kareköklü bir geometrik panonun kenarları cebirsel ifadeler ile temsil edilmektedir.`;
    context = `"İki kare farkı özdeşliği: A² - B² = (A - B) · (A + B) şeklindedir."`;
    query = `Buna göre, bu panonun kenarlarını çarpanlarına ayrılmış biçimde gösteren seçenek hangisidir?`;
    hint = `Verilen ifadeyi x² - ${a}² şeklinde düşünüp iki kare farkı kuralını uygula.`;
    errorAnalysis = `x² - ${a*a} ifadesi iki kare farkıdır ve (x - ${a})(x + ${a}) olarak ayrılır.`;
    errorType = 'Özdeşlik Karışıklığı';

    options = [
      { label: 'A', value: `(x - ${a}) · (x + ${a})`, isCorrect: true },
      { label: 'B', value: `(x - ${a})²`, isCorrect: false },
      { label: 'C', value: `(x + ${a})²`, isCorrect: false },
      { label: 'D', value: `x · (x - ${a*a})`, isCorrect: false }
    ];
  }

  return {
    id,
    difficulty,
    text,
    context,
    query,
    options,
    hint,
    errorAnalysis,
    errorType,
    subject: 'Matematik',
    unit,
    topic
  };
}

// Generate high-quality Turkish questions mathematically varying with `index`
function buildTurkishQuestion(unit: string, topic: string, index: number, difficulty: Difficulty, id: string): Question {
  let text = '';
  let context = '';
  let query = '';
  let hint = '';
  let errorAnalysis = '';
  let errorType = 'Dilbilgisi Eksiği';
  let options: { label: string; value: string; isCorrect: boolean }[] = [];

  if (topic === 'Gerçek ve Mecaz Anlam') {
    text = `Türkçe öğretmenimiz, sözcüklerin kazandığı yeni anlam türlerini pratik birer cümle örneğiyle kavramamızı istiyor. [Örnek #${index}]`;
    context = `"Bir sözcüğün akla gelen ilk anlamına gerçek anlam, bu anlamdan tamamen koparak kazandığı yeni anlama ise mecaz anlam denir."`;
    query = `Aşağıdaki cümlelerin hangisinde mecaz anlamlı bir kullanım mevcuttur?`;
    hint = `Cümlelerde geçen kelimelerin sözlükteki ilk fiziksel anlamlarının dışına çıkıp çıkmadığına odaklan.`;
    errorAnalysis = `Mecaz anlamlı sözcükler mecazi, soyut anlamlar taşır. Seçenekleri gerçek anlam testinden geçiriniz.`;
    errorType = 'Sözcük Grubu Karışıklığı';

    options = [
      { label: 'A', value: `Bize karşı tavırları son derece soğuktu.`, isCorrect: true },
      { label: 'B', value: `Dışarıda soğuk bir kış rüzgarı esiyordu.`, isCorrect: false },
      { label: 'C', value: `Çorbayı sıcak içmek ağzını yaktı.`, isCorrect: false },
      { label: 'D', value: `Eline batan sert dikeni yavaşça çıkardı.`, isCorrect: false }
    ];
  } else if (topic === 'Terim ve Eş Anlamlılar') {
    text = `LGS hazırlık dersinde öğrenciler kelime hazinelerini terim anlamlı ve eş anlamlı sözcüklerle genişletmektedir.`;
    context = `"Bilim, sanat, spor ya da meslek dallarıyla ilgili özel kavramları karşılayan sözcüklere terim anlamlı sözcük denir."`;
    query = `Aşağıdaki cümlelerin hangisinde 'perde' sözcüğü bir tiyatro terimi olarak kullanılmıştır?`;
    hint = `Tiyatro veya sahne sanatlarına ait özelleşmiş bir anlam aranmaktadır.`;
    errorAnalysis = `'Oyunun ikinci perdesi çok hareketli geçti' cümlesinde tiyatro eserinin her bir bölümü kastedildiği için terimdir. Windows dekoru olan perde gerçek anlamdır.`;

    options = [
      { label: 'A', value: 'Oyunun ikinci perdesi izleyicilerden büyük alkış aldı.', isCorrect: true },
      { label: 'B', value: 'Güneş ışığını kesmek için pencerelerin perdesini çekti.', isCorrect: false },
      { label: 'C', value: 'Sırların üzerindeki perde nihayet bu akşam kalktı.', isCorrect: false },
      { label: 'D', value: 'Gözlerine inen duman rengi perde hayatını zorlaştırıyordu.', isCorrect: false }
    ];
  } else if (topic === 'Söz Öbeklerinde Anlam') {
    text = `Deyimler ve atasözleri Türkçemizin en zengin anlatım öbekleridir.`;
    context = `"Söz öbekleri bir araya gelerek tek bir sözcükle ifade edilemeyecek derinlikte ve genişlikte anlamlar oluşturur."`;
    query = `Buna göre 'kulak kabartmak' deyiminin taşıdığı gerçek anlam hangi seçenekte doğru verilmiştir?`;
    hint = `Kulak kabartmak, belli etmemeye çalışarak gizlice dinlemek anlamına gelir. Kulak misafiri olmaktan farkı daha aktiftir.`;
    errorAnalysis = `'Kulak kabartmak', çaktırmadan dinleme eylemidir. Diğer deyimler ile karıştırılmamalıdır.`;

    options = [
      { label: 'A', value: 'Belli etmemeye çalışarak gizlice dinlemek', isCorrect: true },
      { label: 'B', value: 'Hiç önemsemeden geçiştirmek', isCorrect: false },
      { label: 'C', value: 'Çok yüksek sesle bağırmak', isCorrect: false },
      { label: 'D', value: 'Bir konuda aşırı heyecanlanmak', isCorrect: false }
    ];
  } else if (topic === 'Öznel ve Nesnel Anlatım') {
    text = `Edebi metinler ile teknik raporlar arasındaki en bariz fark kullanılan ifadenin öznellik-nesnellik kanıtlanabilirliğidir.`;
    context = `"Doğruluğu ya da yanlışlığı kişiden kişiye değişmeyen, herkesçe kabul edilen ifadelere nesnel anlatım denir."`;
    query = `Aşağıdaki cümlelerin hangisi nesnel bir yargı taşımaktadır?`;
    hint = `Yazarın kendi fikrini, beğenisini ve yorumunu yansıtmayan, doğrudan ispatlanabilir bilimsel durumları ara.`;
    errorAnalysis = `'Kitap toplam yirmi bölümden oluşuyor' cümlesi kişisel beğeni barındırmayan, kanıtlanabilen nesnel bir yargıdır.`;

    options = [
      { label: 'A', value: 'Yazarın son romanı tam yirmi bölümden oluşmaktadır.', isCorrect: true },
      { label: 'B', value: 'Kitaptaki doğa tasvirleri gerçekten büyüleyiciydi.', isCorrect: false },
      { label: 'C', value: 'Sıcak havalarda mavi renkli kıyafetler insana huzur verir.', isCorrect: false },
      { label: 'D', value: 'Şairin o muhteşem sesi salonu tamamen doldurdu.', isCorrect: false }
    ];
  } else if (topic === 'Neden-Sonuç, Amaç-Sonuç') {
    text = `Cümle analizlerinde yargıların birbirine bağlanma amaçları ya da nedenleri sıklıkla sorulmaktadır.`;
    context = `"Gerçekleştirilmek istenen bir hedefe ulaşmak amacıyla yapılan eylemleri bildiren cümlelere amaç-sonuç cümleleri denir."`;
    query = `Aşağıdaki cümlelerin hangisinde amaç-sonuç ilişkisi söz konusudur?`;
    hint = `Cümledeki '-mak üzere', '-mak amacıyla' veya 'için' edatının yerine 'amacıyla' kelimesini koyarak test et.`;
    errorAnalysis = `'LGS'yi kazanmak için gece gündüz çalıştı' cümlesinde 'LGS'yi kazanmak amacıyla' ifadesi anlamlı olduğu için amaç-sonuçtur.`;

    options = [
      { label: 'A', value: 'Sınavda başarılı olmak amacıyla düzenli tekrar yaptı.', isCorrect: true },
      { label: 'B', value: 'Yağmur çok hızlı yağdığı için yollar kapandı.', isCorrect: false },
      { label: 'C', value: 'Yorgunluktan dolayı koltukta hemen uyuyakalmış.', isCorrect: false },
      { label: 'D', value: 'Söz verdiği vakitte gelmediğinden ona kırıldım.', isCorrect: false }
    ];
  } else if (topic === 'Örtülü Anlam') {
    text = `Cümlede doğrudan söylenmediği halde, cümlenin anlamından veya bazı ifadelerden çıkarılabilen anlamlara örtülü anlam denir.`;
    context = `"Özellikle 'de/da' bağlaçları, 'artık', 'değil' gibi ifadeler örtülü anlam oluşmasını kolaylaştırır."`;
    query = `'Bu sınavda da Türkçe soruları oldukça kolaydı.' cümlesinden kesin olarak çıkarılabilecek örtülü anlam hangisidir?`;
    hint = `'da' bağlacı, daha önce de benzer bir kolaylığın veya sınav girişinin yaşandığını ima etmektedir.`;
    errorAnalysis = `'Bu sınavda da' ibaresi, yazarın daha önce de sınavlara girdiğini ve o sınavlarda da Türkçe sorularının kolay olduğunu gösterir.`;

    options = [
      { label: 'A', value: 'Yazar daha önce de en az bir sınava girmiştir.', isCorrect: true },
      { label: 'B', value: 'Sınavın en zor testleri Matematik sorularıydı.', isCorrect: false },
      { label: 'C', value: 'Bu yazarın katıldığı ilk LGS deneme sınavıdır.', isCorrect: false },
      { label: 'D', value: 'Diğer derslerin soruları Türkçe sorularından daha zordu.', isCorrect: false }
    ];
  } else if (topic === 'Paragrafın Ana Fikri') {
    text = `Kitap okumak insana yalnızlığı unutturduğu gibi, düşünce ufkunu da açar. Kitaplar sayesinde hiç görmediğimiz diyarları keşfeder, farklı insanların dünyasına misafir oluruz. Kısacası kitap, ruhumuzun en sadık dostudur.`;
    context = `"Paragrafın okuyucuya vermek istediği temel mesaja, savunulan asıl düşünceye ana fikir denir."`;
    query = `Yukarıdaki paragrafın ana fikri aşağıdakilerden hangisidir?`;
    hint = `Metnin en sonunda geçen 'kısacası ruhun en sadık dostu olması' ve genel olarak kitap okumanın insana kazandırdığı zenginliklere odaklan.`;
    errorAnalysis = `Paragrafta kitap okumanın insanın iç dünyasına katkıları ve yalnızlığını giderme gücü vurgulanmaktadır.`;

    options = [
      { label: 'A', value: 'Kitaplar insan hayatını ve iç dünyasını zenginleştiren dostlardır.', isCorrect: true },
      { label: 'B', value: 'Her gün en az yirmi sayfa kitap okunmalıdır.', isCorrect: false },
      { label: 'C', value: 'Kitap okumayan insanlar tamamen kalabalıkta yalnız kalırlar.', isCorrect: false },
      { label: 'D', value: 'Sadece macera türündeki kitaplar ufuk açıcıdır.', isCorrect: false }
    ];
  } else if (topic === 'Yardımcı Düşünceler') {
    text = `Gelişen teknoloji ile akıllı telefonlar hayatımızın merkezine yerleşti. Artık haberleri oradan okuyor, alışverişimizi oradan yapıyor, arkadaşlarımızla oradan konuşuyoruz. Ancak bu durum yüz yüze iletişimi kısalttığı gibi, insanları yalnızlığa sürüklüyor.`;
    context = `"Paragrafta ana düşünceyi desteklemek, açıklamak amacıyla yer verilen diğer yargılara yardımcı düşünceler denir."`;
    query = `Bu parçadan akıllı telefonlarla ilgili aşağıdakilerden hangisi çıkarılamaz?`;
    hint = `Soruda 'çıkarılamaz' sorulduğu için seçenekleri paragraftaki cümlelerle eşleştirip elenmeyen seçeneği bulmalısın.`;
    errorAnalysis = `Paragrafta telefonların yüz yüze iletişimi azalttığı yazıyor ama iletişim maliyetlerini düşürdüğüne dair hiçbir bilgi bulunmuyor.`;

    options = [
      { label: 'A', value: 'İletişim maliyetlerini yarı yarıya azalttığı', isCorrect: true },
      { label: 'B', value: 'Haber alma süreçlerini kolaylaştırdığı', isCorrect: false },
      { label: 'C', value: 'Sosyal yalnızlaşmaya zemin hazırlayabildiği', isCorrect: false },
      { label: 'D', value: 'Alışveriş alışkanlıklarında yer edindiği', isCorrect: false }
    ];
  } else if (topic === 'Anlatım Teknikleri') {
    text = `Güneş dağların arkasından yavaşça süzülürken köyün kızıl kiremitli damlarında tatlı bir parıltı oluştu. Derenin serin şırıltısı eşliğinde, mis gibi kekik kokan yayla havasını içimize çektik.`;
    context = `"Yazarın duygu ve düşüncelerini aktarırken okuyucunun gözünde adeta bir resim çizme gayretine betimleme denir."`;
    query = `Yukarıdaki metinde hangi anlatım biçimi ağır basmaktadır?`;
    hint = `Kelime ve sıfatlarla bir manzaranın resmedildiğini görebilirsiniz (kızıl kiremitli damlar, serin şırıltı, kokan yayla).`;
    errorAnalysis = `Metinde kelimelerle resim çizme sanatı olan betimleme tekniği kullanılmıştır.`;
    errorType = 'Anlatım Türü Karışıklığı';

    options = [
      { label: 'A', value: 'Betimleme', isCorrect: true },
      { label: 'B', value: 'Tartışma', isCorrect: false },
      { label: 'C', value: 'Açıklama', isCorrect: false },
      { label: 'D', value: 'Öyküleme', isCorrect: false }
    ];
  } else if (topic === 'Büyük Harflerin Kullanımı') {
    text = `Yazım kuralları LGS Türkçe sınavının temel taşlarındandır. En ufak dikkatsizlik net kaybına neden olur.`;
    context = `"Belirli bir tarih bildiren ay ve gün adları büyük harfle başlar ancak kesin tarih belirtmeyenler küçük yazılır."`;
    query = `Aşağıdaki cümlelerin hangisinde yazım hatası yapılmıştır?`;
    hint = `Tarih içeren kelimelerin yanındaki ay ve gün adlarının doğru yazılıp yazılmadığını dikkatlice incele.`;
    errorAnalysis = `'Önümüzdeki Eylül ayında okul açılacak' cümlesinde kesin bir gün ve yıl belirtilmediğinden 'eylül' kelimesinin küçük harfle başlaması gerekir.`;

    options = [
      { label: 'A', value: 'Önümüzdeki Eylül Ayında okullar yeniden açılacak.', isCorrect: true },
      { label: 'B', value: 'Sınav 20 Haziran Pazar günü gerçekleştirilecek.', isCorrect: false },
      { label: 'C', value: 'Yarın Ankara Kalesi\'ni gezmeye gideceğiz.', isCorrect: false },
      { label: 'D', value: 'Toplantımız her Salı günü düzenli olarak yapılır.', isCorrect: false }
    ];
  } else if (topic === 'De - Da ve Ki Bağlaçları') {
    text = `Yazımda sıklıkla karıştırılan 'de/da' ve 'ki' eklerinin bağlaç mı yoksa ek mi olduğunu anlamak oldukça kolaydır.`;
    context = `"Bağlaç olan 'de' ve 'ki' daima ayrı yazılır ve cümleden çıkarıldıklarında genel anlam tümüyle bozulmaz."`;
    query = `Aşağıdaki cümlelerin hangisinde 'ki' bağlacının yazımı yanlıştır?`;
    hint = `'ki' kelimesinden sonra '-ler' ekini getir. Eğer kulağa anlamlı geliyorsa ek (bitişik), anlamsız geliyorsa bağlaçtır (ayrı yazılır).`;
    errorAnalysis = `'Duydumki' kelimesindeki 'ki' bağlaçtır ve ayrı yazılması gerekir: 'Duydum ki'.`;

    options = [
      { label: 'A', value: 'Duydumki en sevdiğin sınavı başarıyla geçmişsin.', isCorrect: true },
      { label: 'B', value: 'Elimdeki kalemi hemen sıranın üzerine bıraktım.', isCorrect: false },
      { label: 'C', value: 'Öyle bir çocuk ki herkes ona imrenerek bakar.', isCorrect: false },
      { label: 'D', value: 'Seninki yine kütüphanede LGS çalışıyor.', isCorrect: false }
    ];
  } else {
    // Virgül ve Noktalı Virgül
    text = `Noktalama işaretleri cümlelerin doğru okunması ve nefes alma duraklarının belirlenmesi için hayati önem taşır.`;
    context = `"Sıralı cümleleri, eş görevli sözcükleri birbirinden ayırmak için virgül (,) kullanılır."`;
    query = `Aşağıdakilerin hangisinde virgülün (,) kullanımı tamamen hatalıdır?`;
    hint = `Zarf-fiil eklerinden sonra tek bir zarf-fiil varsa asla virgül konulmaz. Bunu hatırla.`;
    errorAnalysis = `'Okula gidip, çantasını hemen sıraya koydu.' cümlesinde tek zarf-fiil eki olan '-ip' ekinden sonra virgül konulması kural hatasıdır.`;

    options = [
      { label: 'A', value: 'Kütüphaneye gidip, Türkçe testini çözmeye başladı.', isCorrect: true },
      { label: 'B', value: 'Pazardan elma, armut, muz alıp hemen eve döndü.', isCorrect: false },
      { label: 'C', value: 'Efendiler, yarın cumhuriyeti ilan edeceğiz.', isCorrect: false },
      { label: 'D', value: 'Eve uğradı, üzerini değiştirdi, hızla dışarı çıktı.', isCorrect: false }
    ];
  }

  return {
    id,
    difficulty,
    text,
    context,
    query,
    options,
    hint,
    errorAnalysis,
    errorType,
    subject: 'Türkçe',
    unit,
    topic
  };
}

// Generate high-quality Science questions mathematically varying with `index`
function buildScienceQuestion(unit: string, topic: string, index: number, difficulty: Difficulty, id: string): Question {
  let text = '';
  let context = '';
  let query = '';
  let hint = '';
  let errorAnalysis = '';
  let errorType = 'Bilgi Eksiği';
  let options: { label: string; value: string; isCorrect: boolean }[] = [];

  if (topic === 'Mevsimlerin Oluşumu') {
    text = `Dünya, Güneş'in etrafında dolanırken eksen eğikliği nedeniyle güneş ışınları farklı tarihlerde farklı açılarla düşer. [Örnek #${index}]`;
    context = `"Güneş ışınlarının dik geldiği yarım kürede birim alana düşen ısı enerjisi fazla olduğundan yaz mevsimi yaşanır."`;
    query = `21 Aralık tarihinde Güney Yarım Küre'ye güneş ışınlarının düşme açısı ve yaşanan mevsim nedir?`;
    hint = `21 Aralık'ta Güney Yarım Küre'de en uzun gündüz yaşanır ve Oğlak Dönencesi'ne ışınlar dik açıyla gelir.`;
    errorAnalysis = `21 Aralık tarihinde Güney Yarım Küre güneş ışınlarını dik açıyla alır ve yaz mevsimi başlangıcıdır.`;

    options = [
      { label: 'A', value: 'En dik açı / Yaz mevsimi', isCorrect: true },
      { label: 'B', value: 'En dar açı / Kış mevsimi', isCorrect: false },
      { label: 'C', value: 'Eğik açı / İlkbahar mevsimi', isCorrect: false },
      { label: 'D', value: 'Dik açı / Sonbahar mevsimi', isCorrect: false }
    ];
  } else if (topic === 'İklim ve Hava Hareketleri') {
    text = `Meteoroloji istasyonlarında rüzgarların yön ve kuvvetleri ile sıcaklık değişimleri günlük olarak ölçülmektedir.`;
    context = `"Havadaki sıcaklık artışı ile yükseltici hava hareketi gerçekleşir ve alçak basınç alanı oluşur."`;
    query = `Hava sıcaklığının yüksek olduğu bir bölge için aşağıdakilerden hangisi söylenebilir?`;
    hint = `Sıcak hava genleşip hafifler, dolayısıyla yukarı yönlü hareket ederek alçak basınç alanını ortaya çıkarır.`;
    errorAnalysis = `Sıcak olan bölgelerde yükseltici hava hareketleri görülür ve basınç değeri azalır (Alçak Basınç).`;

    options = [
      { label: 'A', value: 'Yükseltici hava hareketi ve Alçak Basınç alanı görülür.', isCorrect: true },
      { label: 'B', value: 'Alçaltıcı hava hareketi ve Yüksek Basınç alanı görülür.', isCorrect: false },
      { label: 'C', value: 'Hava daima bulutsuz ve nemsiz kalır.', isCorrect: false },
      { label: 'D', value: 'Rüzgar bu bölgeden çevreye doğru esmeye başlar.', isCorrect: false }
    ];
  } else if (topic === 'Rüzgar Oluşumu') {
    text = `Yayla ve deniz kıyılarında gündüz ile gece esen rüzgarların yönleri farklılık gösterir.`;
    context = `"Rüzgar, yüksek basınç alanından alçak basınç alanına doğru yatay yönde gerçekleşen bir hava hareketidir."`;
    query = `Gündüz vakti deniz kıyısında esen rüzgarın yönü hangi doğrultuda gerçekleşir?`;
    hint = `Gündüz karalar daha hızlı ısınır ve alçak basınç alanı olur. Denizler ise daha geç ısındığı için yüksek basınç alanıdır.`;
    errorAnalysis = `Gündüz deniz yüksek basınç, kara ise alçak basınç olduğundan rüzgar denizden karaya doğru eser.`;

    options = [
      { label: 'A', value: 'Denizden karaya doğru', isCorrect: true },
      { label: 'B', value: 'Karadan denize doğru', isCorrect: false },
      { label: 'C', value: 'Aşağıdan yukarıya dikey yönde', isCorrect: false },
      { label: 'D', value: 'Doğudan batıya doğru rüzgarsız', isCorrect: false }
    ];
  } else if (topic === 'DNA\'nın Yapısı') {
    text = `Hücre bölünmesi öncesinde kalıtım materyali olan DNA kendini eşleyerek kopyasını oluşturur.`;
    context = `"DNA çift sarmallı bir yapıya sahip olup Adenin karşısına Timin, Guanin karşısına Sitozin nükleotidi gelir."`;
    query = `Bir eşleme esnasında hasar gören bir DNA zincirinde Sitozin nükleotidinin karşısına hangisi gelirse hasar onarılabilir?`;
    hint = `Kural bellidir: G ile C, A ile T daima eşleşir. Sitozin (C) karşısına Guanin (G) gelmelidir.`;
    errorAnalysis = `DNA eşleşmesinde Sitozin (S/C) karşısına daima Guanin (G) nükleotidi yerleştirilmelidir.`;

    options = [
      { label: 'A', value: 'Guanin', isCorrect: true },
      { label: 'B', value: 'Adenin', isCorrect: false },
      { label: 'C', value: 'Timin', isCorrect: false },
      { label: 'D', value: 'Urasil', isCorrect: false }
    ];
  } else if (topic === 'Kalıtım ve Çaprazlamalar') {
    text = `Mendel'in bezelyeler üzerinde yaptığı genetik çaprazlama çalışmaları kalıtım biliminin temelini oluşturur.`;
    context = `"Sarı tohum geni (S) yeşil tohum genine (s) baskındır."`;
    query = `Melez sarı tohumlu (Ss) iki bezelyeninin çaprazlanması sonucu yeşil tohumlu (ss) bezelye oluşma olasılığı yüzde kaçtır?`;
    hint = `Ss x Ss çaprazlaması yaptığında genotipler: SS, Ss, Ss, ss şeklinde oluşur. ss'in geneli oranına bak.`;
    errorAnalysis = `Ss x Ss çaprazlamasında ss genotipine sahip bezelye oranı 1/4 yani %25 düzeyindedir.`;

    options = [
      { label: 'A', value: '%25', isCorrect: true },
      { label: 'B', value: '%50', isCorrect: false },
      { label: 'C', value: '%75', isCorrect: false },
      { label: 'D', value: '%100', isCorrect: false }
    ];
  } else if (topic === 'Mutasyon, Modifikasyon, Adaptasyon') {
    text = `Nemli bölgelerde yetişen eğrelti otunun uzun boylu olması, kurak bölgelerde ise kısa boylu olması çevre etkisiyle oluşur.`;
    context = `"Çevre şartlarının etkisiyle genlerin işleyişinde meydana gelen ve kalıtsal olmayan değişikliklere modifikasyon denir."`;
    query = `Bu durum aşağıdaki kalıtım ve çevre olaylarından hangisine örnek gösterilebilir?`;
    hint = `Genlerin yapısı değişmeyip yalnızca işleyişi değişiyorsa bu modifikasyondur (örnek: spor yapanların kaslanması).`;
    errorAnalysis = `Eğrelti otunun boy uzunluğunun çevreye göre değişmesi, kalıtsal olmayan bir modifikasyon örneğidir.`;

    options = [
      { label: 'A', value: 'Modifikasyon', isCorrect: true },
      { label: 'B', value: 'Mutasyon', isCorrect: false },
      { label: 'C', value: 'Adaptasyon', isCorrect: false },
      { label: 'D', value: 'Doğal Seçilim', isCorrect: false }
    ];
  } else if (topic === 'Biyoteknoloji Uygulamaları') {
    text = `Modern bilim dünyasında genetik mühendisliği ve biyoteknolojik çalışmalar insan sağlığı ve gıda üretimi için kritik rol oynamaktadır.`;
    context = `"Biyoteknoloji; canlıların yapısını değiştirerek onlardan yeni ürün elde edilmesini sağlayan teknolojik yöntemleri içerir."`;
    query = `Aşağıdakilerden hangisi olumlu bir biyoteknolojik uygulama olarak kabul edilebilir?`;
    hint = `Tarımda verimliliği arttıran, soğuğa dirençli bitkiler veya aşı üretimi gibi faydalı sonuçlar aranmalıdır.`;
    errorAnalysis = `Biyoinformatik ve gen transferleriyle soğuğa dayanıklı bitkiler geliştirmek gıda güvencesi için olumlu bir katkıdır.`;

    options = [
      { label: 'A', value: 'Kuraklığa ve soğuğa dayanıklı bitki türlerinin geliştirilmesi', isCorrect: true },
      { label: 'B', value: 'GDO\'lu bitkilerin kontrolsüz yayılmasıyla biyoçeşitliliğin azalması', isCorrect: false },
      { label: 'C', value: 'Kimyasal silah olarak kullanılabilen toksik proteinlerin üretimi', isCorrect: false },
      { label: 'D', value: 'Alerjen özellik gösteren yeni besinlerin piyasaya sürülmesi', isCorrect: false }
    ];
  } else if (topic === 'Katı Basıncı') {
    const s = index % 2 === 0 ? 2 : 1; 
    const f = index * 10;
    const p = f / s;
    text = `Bir tuğla masa üzerine önce dikine (küçük yüzeyle), sonra yatay olarak (geniş yüzeyle) yerleştiriliyor.`;
    context = `"Katıların zemine uygulayacağı basınç, uygulanan dik kuvvet (ağırlık) ile doğru, temas yüzey alanı ile ters orantılıdır (P = F / S)."`;
    query = `Ağırlığı ${f} N, temas yüzeyi ise ${s} m² olan katı cismin zemine uyguladığı katı basıncı kaç Pascal (Pa) olur?`;
    hint = `Dik kuvvet olan ağırlığı yüzey alanına böleceksin: P = ${f} / ${s}.`;
    errorAnalysis = `P = F/S işleminden ${f} / ${s} = ${p} Pa bulunmalıdır. Birimlere dikkat edelim.`;
    errorType = 'Formül Uygulama Hatası';

    options = [
      { label: 'A', value: `${p}`, isCorrect: true },
      { label: 'B', value: `${f * s}`, isCorrect: false },
      { label: 'C', value: `${f + s}`, isCorrect: false },
      { label: 'D', value: `${(f / 2).toFixed(1)}`, isCorrect: false }
    ];
  } else if (topic === 'Sıvı Basıncı') {
    const density = index % 2 === 0 ? 2 : 1; // 2: tuzlu su, 1: tatlı su
    const depth = index * 5;
    const g = 10;
    const pres = density * depth * g / 10;
    text = `Derinlik arttıkça baraj duvarlarının kalınlığının alt kısımlara doğru artırılması güvenliği korur.`;
    context = `"Sıvı basıncı; sıvının derinliği, sıvının yoğunluğu ve yer çekimi ivmesi ile doğru orantılıdır (P = h · d · g)."`;
    query = `Yoğunluğu ${density} g/cm³ olan bir sıvı içerisinde, ${depth} cm derinlikte oluşan sıvı basıncı ilişkisi hakkında hangisi söylenebilir?`;
    hint = `Sıvı derinliği ve sıvı yoğunluğu ne kadar fazla olursa tabana ve yan çeperlere yapılacak sıvı basıncı o kadar büyük olur.`;
    errorAnalysis = `Sıvı basıncı derinlikle doğru orantılıdır. Sıvının yoğunluğu (${density}) ve derinliği (${depth}) arttıkça basınç doğrusal artar.`;

    options = [
      { label: 'A', value: 'Derinlik ve yoğunluk arttıkça sıvı basıncı artar.', isCorrect: true },
      { label: 'B', value: 'Sıvı basıncı sadece kabın şekline ve hacmine bağlıdır.', isCorrect: false },
      { label: 'C', value: 'Sıvı basıncı yerçekiminden tamamen bağımsızdır.', isCorrect: false },
      { label: 'D', value: 'Yoğunluk arttıkça taban basıncı azalma eğilimindedir.', isCorrect: false }
    ];
  } else {
    // Gaz Basıncı
    text = `Torricelli, açık hava basıncını ölçmek için 0 °C'de deniz kenarında cıva dolu bir boruyla ünlü deneyini gerçekleştirmiştir.`;
    context = `"Açık hava basıncı, yukarılara çıkıldığında hava moleküllerinin yoğunluğu azaldığı için düşme gösterir."`;
    query = `Deniz seviyesinden yüksek bir dağın zirvesine doğru tırmanan bir dağcının etrafındaki açık hava basıncı nasıl değişir?`;
    hint = `Yukarı doğru çıktıkça üzerimizdeki hava sütununun yüksekliği ve yoğunluğu azalır, dolayısıyla açık hava basıncı azalacaktır.`;
    errorAnalysis = `Yükseklik arttıkça hava yoğunluğu ve kalınlığı azaldığı için açık hava basıncı azalır.`;

    options = [
      { label: 'A', value: 'Sürekli azalır.', isCorrect: true },
      { label: 'B', value: 'Sürekli artış gösterir.', isCorrect: false },
      { label: 'C', value: 'Sıcaklığa bakılmaksızın sabit kalır.', isCorrect: false },
      { label: 'D', value: 'Önce artar, sonra aniden sıfırlanır.', isCorrect: false }
    ];
  }

  return {
    id,
    difficulty,
    text,
    context,
    query,
    options,
    hint,
    errorAnalysis,
    errorType,
    subject: 'Fen Bilimleri',
    unit,
    topic
  };
}
