import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileText, 
  Folder, 
  FolderOpen,
  Search, 
  Plus, 
  X, 
  ArrowLeft, 
  Download, 
  Play, 
  Pause, 
  Trash2, 
  CheckCircle, 
  BookOpen, 
  Clock, 
  Sparkles,
  ExternalLink,
  Check,
  Video,
  UploadCloud
} from 'lucide-react';
import { useFirebase } from './FirebaseContext';
import { 
  getCustomResources, 
  getCompletedResources, 
  addCustomResource, 
  deleteCustomResource, 
  markResourceCompleted, 
  unmarkResourceCompleted 
} from '../lib/db';

interface ResourceFile {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'video';
  folder: 'Ders Notları' | 'Çıkmış Sorular' | 'Deneme Sınavları' | 'Video Çözümler';
  topic: string;
  content: string; // Summary math content or description notes
  duration?: string; // e.g. "12:45"
  videoUrl?: string;
  notes?: string;
}

const DEFAULT_FILES: ResourceFile[] = [
  {
    id: '1',
    name: 'Üslü Sayılar LGS Formülleri ve Özet.pdf',
    size: '2.4 MB',
    type: 'pdf',
    folder: 'Ders Notları',
    topic: 'Üslü Sayılar',
    content: `### 📚 ÜSLÜ SAYILAR LGS FORMÜLLERİ VE ÖZET REHBERİ

LGS Matematik sınavında her yıl en az 3 doğrudan üslü sayı sorusu ve diğer soruların içinde dolaylı kazanımlar yer almaktadır. Bu kılavuzu dikkatle inceleyin!

---

#### 1. TEMEL KURALLAR VE TANIM
$a^n$ ifadesinde $a$ taban, $n$ üsdür.
• $a^n = a \times a \times \dots \times a$ ($n$ adet)
• Örnek: $5^3 = 5 \times 5 \times 5 = 125$

#### 2. NEGATİF KUVVET (ÜS)
Negatif türev/üs sayıyı çarpmaya göre ters çevirir:
• $a^{-n} = 1 / a^n$  
• Örn: $2^{-3} = 1 / 2^3 = 1 / 8$
• Örn: $(2 / 3)^{-2} = (3 / 2)^2 = 9 / 4$

#### 3. ÜSSÜN ÜSSÜ (KUVVETİN KUVVETİ)
Üst üste binen üsler çarpılır:
• $(a^x)^y = a^{x \times y}$
• Örn: $(2^3)^4 = 2^{12}$
• Örn: $(5^{-2})^3 = 5^{-6}$

#### 4. ÜSLÜ SAYILARDA ÇARPMA İŞLEMİ
• **Tabanlar aynı** ise ortak taban yazılır ve üsler toplanır:  
  $a^x \times a^y = a^{x + y}$  (Örn: $2^5 \times 2^3 = 2^8$)
• **Üsler aynı** ise tabanlar çarpılır, ortak üs yazılır:  
  $a^x \times b^x = (a \times b)^x$  (Örn: $2^4 \times 5^4 = 10^4$)

#### 5. ÜSLÜ SAYILARDA BÖLME İŞLEMİ
• **Tabanlar aynı** ise payın üssünden paydanın üssü çıkarılır:  
  $a^x / a^y = a^{x - y}$  (Örn: $5^8 / 5^3 = 5^5$)
• **Üsler aynı** ise tabanlar bölünür, ortak üs yazılır:  
  $a^x / b^x = (a / b)^x$  (Örn: $6^3 / 2^3 = 3^3 = 27$)

---

### 🔥 LGS EN SEÇKİN SORU TÜYOLARI (SINAV TAKTİKLERİ):
1. **Asal Taban Tekniği:** LGS sorularında büyük sayıları (örn. 8, 16, 27, 81) gördüğün an derhal en küçük asal tabanda yaz:
   - $8^4 \times 16^{-2} = (2^3)^4 \times (2^4)^{-2} = 2^{12} \times 2^{-8} = 2^{12 - 8} = 2^4 = 16$.
2. **Basamak Sayısı Soruları:** Sonunda kaç sıfır vardır veya kaç basamaklıdır sorularında mutlaka $10^n$ çarpanı oluştur. Bunu yaparken $2^n \times 5^n$ çiftleri grupla!
3. **Parçalama Taktikleri:** Alanı $2^{12}$ birim olan bir kartonu kenar uzunluğu $4^{-1}$ olan karelere bölmek, bölme işlemi demektir: $\frac{2^{12}}{2^{-2}} = 2^{12 - (-2)} = 2^{14}$ adet eş parça.`
  },
  {
    id: '2',
    name: 'Kareköklü İfadeler - Tam Kare Sayı İlişkisi.pdf',
    size: '1.8 MB',
    type: 'pdf',
    folder: 'Ders Notları',
    topic: 'Kareköklü İfadeler',
    content: `### 📐 KAREKÖKLÜ İFADELER ÖZET NOTU

Kareköklü ifadeler, LGS Matematik sınavında doğrudan ve dolaylı olarak en çok sorulan (genelde 5 soru) konulardan biridir.

---

#### 1. TAM KARE SAYILAR
Bir tam sayının karesi şeklinde yazılabilen sayılara **tam kare sayılar** denir:
• $1^2 = 1, 2^2 = 4, 3^2 = 9, 4^2 = 16, 5^2 = 25$
• $10^2 = 100, 11^2 = 121, 12^2 = 144, 13^2 = 169, 14^2 = 196, 15^2 = 225$
• Tam kare bir sayının karekökü her zaman bir doğal sayıdır: $\sqrt{169} = 13$

#### 2. KÖK DIŞINA ÇIKARMA VE KATSAYIYI İÇERİ ALMA
• **Dışarı çıkarma ($a\sqrt{b}$):** Kök içindeki sayı çarpanlarına ayrılır, tam kare olan çarpan kök dışına çıkar:  
  $\sqrt{75} = \sqrt{25 \times 3} = 5\sqrt{3}$  
  $\sqrt{108} = \sqrt{36 \times 3} = 6\sqrt{3}$
• **İçeri alma ($a\sqrt{b}$):** Katsayı karesi alınarak kök içine sokulur ve içerideki sayı ile çarpılır:  
  $3\sqrt{5} = \sqrt{3^2 \times 5} = \sqrt{9 \times 5} = \sqrt{45}$  
  $10\sqrt{2} = \sqrt{100 \times 2} = \sqrt{200}$

#### 3. KAREKÖKLÜ SAYILARDA DÖRT İŞLEM
• **Çarpma:** Katsayılar kendi arasında, kök içleri kendi arasında çarpılır:  
  $a\sqrt{b} \times c\sqrt{d} = (a \times c)\sqrt{b \times d}$  
  Örn: $2\sqrt{3} \times 3\sqrt{5} = 6\sqrt{15}$
• **Bölme:** Katsayılar kendi arasında, kök içleri kendi arasında bölünür:  
  $\frac{a\sqrt{b}}{c\sqrt{d}} = \frac{a}{c} \sqrt{\frac{b}{d}}$
• **Toplama & Çıkarma (KRİTİK):** Yalnızca kök içi **TAMAMEN AYNI** olan terimler toplanıp çıkarılabilir:  
  $a\sqrt{x} + b\sqrt{x} - c\sqrt{x} = (a + b - c)\sqrt{x}$  
  *(Önemli Uyarı: $\sqrt{3} + \sqrt{2} \neq \sqrt{5}$! Köklü içler aynı değilse toplama yapılamaz.)*

---

### 🔥 LGS EN SEÇKİN SORU TÜYOLARI (SINAV TAKTİKLERİ):
1. **İki Tam Sayı Arasındaki Değeri Saptama:** Bir köklü ifadenin cetvelde veya eksende hangi iki sayının arasında kaldığını bulmak için katsayıyı tamamen kök içine al!
   - Örn: $5\sqrt{3}$ hangi sayılar arasındadır?
   - $5\sqrt{3} = \sqrt{25 \times 3} = \sqrt{75}$.
   - Tam kare komşuları tespit et: $\sqrt{64} < \sqrt{75} < \sqrt{81}$ yani $8$ ile $9$ arasındadır. $81$'e daha yakın olduğu için $9$'a daha yakındır (yaklaşık $8.66$).
2. **Kareköklü Sayıyı Tam Sayıya Dönüştürme:** Bir köklü ifadeyi başka bir köklü ifadeyle çarparak tam sayı yapmak istiyorsan, kök içlerinin ($a\sqrt{b}$ formundaki $b$ kısmının) aynı olması gerekir!
   - Örn: $\sqrt{18} = 3\sqrt{2}$'dir. Bu sayıyı tam sayı yapmak için $\sqrt{2}$, $3\sqrt{2}$, $5\sqrt{2}$ gibi kök içi $\sqrt{2}$ olan bir sayıyla çarpmalısın.`
  },
  {
    id: '3',
    name: 'Çarpanlar ve Katlar - EBOB EKOK Rehberi.pdf',
    size: '2.1 MB',
    type: 'pdf',
    folder: 'Ders Notları',
    topic: 'Çarpanlar ve Katlar',
    content: `### 💡 ÇARPANLAR VE KATLAR (EBOB - EKOK) KILAVUZU

LGS Matematik müfredatının açılış ünitesidir. EBOB ve EKOK problemleri her yıl en az 2 seçici soru ile karşımıza çıkar.

---

#### 1. ÇARPANLAR VE BÖLENLER
• Bir pozitif tam sayıyı kalansız bölen tüm pozitif tam sayılara o sayının çarpanları (yani bölenleri) denir.
• Örnek: 24'ün çarpanları: 1, 2, 3, 4, 6, 8, 12, 24'tür. (6 çift)

#### 2. ASAL SAYILAR VE ARALARINDA ASALLIK
• **Asal Sayılar:** Sadece 1'e ve kendisine bölünebilen 1'den büyük doğal sayılardır: 2, 3, 5, 7, 11, 13, 17, 19...
  *(İpucu: 2 en küçük ve tek çift asaldır!)*
• **Aralarında Asal Sayılar:** 1'den başka hiçbir ortak böleni olmayan sayılardır.
  - Örn: 8 ve 15. Hiçbir ortak asal çarpanları yoktur.
  - Örnek kural: Ardışık tam sayılar her zaman aralarında asaldır. Örn: (19, 20).

#### 3. EBOB (En Büyük Ortak Bölen) PROBLEMLERİ ŞİFRESİ
İki veya daha fazla sayıyı aynı anda bölen en büyük ortak tam sayıdır.
• **Problem Tipi:** GENELDEN ÖZELE / BÜTÜNDEN PARÇAYA doğru bir bölüştürme yapılıyorsa EBOB kullanılır!
  - Çuvallardaki farklı bakliyatları eşit poşetlere bölme
  - Dikdörtgen bahçenin kenarlarına eşit aralıklarla direk/ağaç dikme
  - Büyük rulo kumaşlardan eşit boyutta küçük kumaşlar kesme

#### 4. EKOK (En Küçük Ortak Kat) PROBLEMLERİ ŞİFRESİ
İki veya daha fazla sayının ortak olan katlarının en küçüğüdür.
• **Problem Tipi:** ÖZELDEN GENELE / PARÇADAN BÜTÜNE doğru ritmik bir birleşme varsa EKOK kullanılır!
  - 3 günde bir ve 4 günde bir nöbet tutan iki doktorun birlikte nöbet tutacağı günler
  - Limandan 12 ve 15 dakikada kalkan otobüslerin ortak saati
  - Küçük dikdörtgen fayanslar yan yana getirilerek büyük kare alan kaplama

---

### 🌟 KRİTİK EBOB-EKOK EŞİTLİKLERİ
1. İki pozitif tam sayının çarpımı, bu sayıların EBOB ve EKOK'larının çarpımına eşittir:
   $A \times B = EBOB(A, B) \times EKOK(A, B)$
2. $A$ ve $B$ sayıları aralarında asal ise:
   - $EBOB(A, B) = 1$
   - $EKOK(A, B) = A \times B$
   - Bu kurallar LGS denemelerinde zamandan tasarruf ettiren harika ipuçlarıdır.`
  },
  {
    id: '4',
    name: 'LGS_2024_Matematik_Sorulari_Analiz_Raporu.pdf',
    size: '3.1 MB',
    type: 'pdf',
    folder: 'Çıkmış Sorular',
    topic: 'Çıkmış Soru Analizi',
    content: `### 🎯 LGS 2024 MATEMATİK SORULARI VE ANALİZ RAPORU

2024 LGS sınavı sonrasında matematik dersinin eleyicilik katsayısının yine zirvede olduğu gözlendi. Sınava dair kritik konu analizleri aşağıdaki gibidir:

---

#### 📋 Ünitelerin LGS Sınavındaki Soru Yükü:
1. **Çarpanlar ve Katlar:** 2 Soru (Orta Seviye)
2. **Üslü Sayılar:** 3 Soru (1'i çok basit işlem, 2'si yeni nesil kurgusal bölüşüm)
3. **Kareköklü İfadeler:** 3 Soru (1 cetvel modeli yaklaşık değer, 2 alan modelleme)
4. **Veri Analizi:** 1 Soru (Daire grafiğinden sütun grafiğine dönüşüm)
5. **Basit Olayların Olasılığı:** 1 Soru (Renk kartları ve olasılık sıralaması)
6. **Cebirsel İfadeler & Özdeşlikler:** 3 Soru (Alan yerleşimi ve parantez karesi)
7. **Doğrusal Denklemler / Eşitsizlikler:** 4 Soru (Koordinat sistemi üzerinde dikey eğim ve bütçe denklemleri)
8. **Geometri & Cisimler:** 3 Soru (Üçgen eşitsizliği ve benzerlik oranları)

#### 🧐 Uzman AI Öğretmen Tavsiyeleri:
- **Tavsiye 1:** Cetvel üstündeki kayma ve karekök uzunluk soruları son iki senedir kesintisiz soruluyor. Bir cetvelde nesnenin kenarı $\sqrt{20}$ cm uzuyorsa bunun $4$ ile $5$ cm arasında olduğunu ($4.47$ civarı) tahmin edip eklemeyi yapmalısın.
- **Tavsiye 2:** Cebirsel ifadelerde alan hesaplama modellerine aşina ol. Dikdörtgenlerden oluşan bir çerçevenin içindeki boş beyaz alanı bulmak için; büyük dış şeklin alanından küçük renkli parçaların alanlar toplamını çıkarmalısın. Çarpanlara ayırma özdeşliği her zaman cevap şıklarında seni bekleyecektir.`
  },
  {
    id: '5',
    name: 'LGS_2023_Matematik_Sorulari_Ve_Detayli_Cozumleri.pdf',
    size: '2.8 MB',
    type: 'pdf',
    folder: 'Çıkmış Sorular',
    topic: 'Çıkmış Soru Analizi',
    content: `### 🎯 LGS 2023 MATEMATİK ANALİZİ (YALNIZCA 1. DÖNEM)

2023 LGS sınavı yalnızca 1. dönem konularından sorulduğundan, sınırlı müfredat nedeniyle soruların zorluk dereceleri ve eleyiciliği normal yıllardan daha üst seviyedeydi.

---

#### 🌟 Kritik Soru Çözümleri:
• **Olasılık ve Karekök Birleşimi:** Torbada 1'den 50'ye kadar numaralandırılmış kartlar arasından çekilen sayının kök değerinin bir tam sayı olması istendi. Tam kare sayıların sayısını tüm durum olan 50'ye bölerek olasılığı kolayca bulabilirdin ($\sqrt{1}, \sqrt{4}, \sqrt{9}, \sqrt{16}, \sqrt{25}, \sqrt{36}, \sqrt{49}$ $\rightarrow$ 7 adet. Cevap: $7 / 50$).

• **Üslü Sayılarda Paketleme Sorusu:** $2^{15}$ gram balın, her biri $2^{-2}$ gramlık kavanozlara doldurulduğu ve paket başı 10 TL kar edilen soru. Kavanoz adedi bölme yapılarak bulunur:
  $$2^{15} / 2^{-2} = 2^{15 - (-2)} = 2^{17} \text{ kavanoz} = 131.072 \text{ adet kavanoz.}$$
  Soru üstünde sadeleştirmenin ne kadar hayati olduğunu gösteren mükemmel bir soruydu.`
  },
  {
    id: '6',
    name: 'Matematik LGS Deneme Sınavı - 1.pdf',
    size: '1.5 MB',
    type: 'pdf',
    folder: 'Deneme Sınavları',
    topic: 'Deneme Serisi',
    content: `### 📝 LGS MATEMATİK BAŞLANGIÇ DENEMESİ - 1

Bu deneme ilk 3 üniteyi (Çarpanlar/Katlar, Üslü Sayılar, Kareköklü İfadeler) eksiksiz ölçmek için profesyonelce tasarlanmıştır.

---

#### 📋 Deneme Detayları:
• **Soru Sayısı:** 20 Matematik Sorusu  
• **Tavsiye Edilen Süre:** 40 Dakika  
• **Cevap Anahtarı:**
  1-B, 2-D, 3-A, 4-C, 5-C, 6-A, 7-D, 8-B, 9-C, 10-A, 11-D, 12-B, 13-C, 14-A, 15-D, 16-C, 17-B, 18-A, 19-B, 20-D

#### 🧭 Seçme Soru İpuçları & Pratik Yöntemler:
• **Soru 3 (EBOB):** Aralarında asal olmayan 24 ve 36 metre boyundaki iki kütük eşit uzunlukta parçalara bölünecektir. Parça boyu en fazla $EBOB(24, 36) = 12$ metredir.  
  Buradan en az parça sayısı $24 / 12 + 36 / 12 = 2 + 3 = 5$ parça elde edilir.  
  *Kritik Detay:* Toplam 5 parça elde etmek için sadece **4 kesim** yapılır! LGS kesim sayısıyla parça sayısı arasındaki farkı her zaman sınavda yanıltmaca olarak kullanır!

• **Soru 15 (Üslü Sayı Basamak Sayısı):** $8^4 \times 25^6$ sayısı kaç basamaklıdır?  
  - Tabanları $2$ ve $5$ yapalım:  
    $(2^3)^4 \times (5^2)^6 = 2^{12} \times 5^{12} = (2 \times 5)^{12} = 10^{12}$
  - $10^{12}$ sayısı $1$'in yanına $12$ tane sıfır konarak yazılacağı için **13 basamaklıdır**.`
  },
  {
    id: '7',
    name: 'Cebirsel İfadeler LGS Soru Çözümleri.mp4',
    size: '180.5 MB',
    type: 'video',
    folder: 'Video Çözümler',
    topic: 'Cebirsel İfadeler',
    content: 'Cebirsel İfadeleri Şekillerle Canlandırma Çözümleri',
    duration: '12:45',
    notes: 'Yeni nesil LGS tipi en zor 5 Cebirsel İfade ve Özdeşlik sorusu, özel geometrik kesit yöntemleri kullanılarak ekranda görsel olarak anlatılmaktadır.',
    videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
  },
  {
    id: '8',
    name: 'Ebob Ekok Kelime İpuçları ve Hızlı Taktikler.mp4',
    size: '224.2 MB',
    type: 'video',
    folder: 'Video Çözümler',
    topic: 'Çarpanlar ve Katlar',
    content: 'EBOB EKOK Sorularındaki Gizemli Cümle Şifreleri',
    duration: '15:20',
    notes: 'Hangi soruda EBOB, hangisinde EKOK kullanılacağını anlamak için sorudaki gizli ipucu kelimelerine dikkat edin. Bu video size soruların şifrelerini veriyor.',
    videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
  }
];

interface ResourcesViewProps {
  uploadTrigger?: number;
  isAdminMode?: boolean;
}

export default function ResourcesView({ uploadTrigger = 0, isAdminMode = false }: ResourcesViewProps = {}) {
  const { user } = useFirebase();
  const [files, setFiles] = useState<ResourceFile[]>(() => {
    const saved = localStorage.getItem('lgs_resources');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Geri yükleme başarısız, varsayılanlar yükleniyor", e);
      }
    }
    return DEFAULT_FILES;
  });

  const [completedFileIds, setCompletedFileIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('lgs_completed_resources');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('lgs_resources', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('lgs_completed_resources', JSON.stringify(completedFileIds));
  }, [completedFileIds]);

  // Load resources and completions from Firebase if available
  useEffect(() => {
    if (!user) return;

    const syncResources = async () => {
      try {
        const fbFiles = await getCustomResources(user.uid);
        if (fbFiles && fbFiles.length > 0) {
          const customIds = new Set(fbFiles.map(f => f.id));
          const baseFiles = DEFAULT_FILES.filter(f => !customIds.has(f.id));
          setFiles([...fbFiles, ...baseFiles]);
        }

        const fbCompleted = await getCompletedResources(user.uid);
        if (fbCompleted && fbCompleted.length > 0) {
          setCompletedFileIds(fbCompleted);
        }
      } catch (err) {
        console.error("Firestore resources loading error:", err);
      }
    };

    syncResources();
  }, [user]);

  useEffect(() => {
    if (uploadTrigger > 0) {
      setIsUploadOpen(true);
    }
  }, [uploadTrigger]);

  useEffect(() => {
    const handleGlobalSelectResource = (e: Event) => {
      const customEvent = e as CustomEvent<{ fileId: string }>;
      if (customEvent?.detail?.fileId) {
        const found = files.find(f => f.id === customEvent.detail.fileId);
        if (found) {
          handleOpenFile(found);
        }
      }
    };
    window.addEventListener('select_resource', handleGlobalSelectResource);
    return () => {
      window.removeEventListener('select_resource', handleGlobalSelectResource);
    };
  }, [files]);

  // Filters State
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'video'>('all');

  // Modals & Active view states
  const [activeFile, setActiveFile] = useState<ResourceFile | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Video simulated play state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0); // 0 to 100
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Form State for uploading new items
  const [formName, setFormName] = useState('');
  const [formFolder, setFormFolder] = useState<ResourceFile['folder']>('Ders Notları');
  const [formType, setFormType] = useState<'pdf' | 'video'>('pdf');
  const [formTopic, setFormTopic] = useState('');
  const [formSizeOrDuration, setFormSizeOrDuration] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Drag & drop file upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    setUploadedFile(file);
    
    // Determine type
    const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.mov') || file.name.endsWith('.avi');
    const deducedType = isVideo ? 'video' : 'pdf';
    setFormType(deducedType);
    
    // Determine folder
    if (deducedType === 'video') {
      setFormFolder('Video Çözümler');
    } else {
      const nameLower = file.name.toLocaleLowerCase('tr-TR');
      if (nameLower.includes('çıkmış') || nameLower.includes('cikmis') || nameLower.includes('lgs')) {
        setFormFolder('Çıkmış Sorular');
      } else if (nameLower.includes('deneme')) {
        setFormFolder('Deneme Sınavları');
      } else {
        setFormFolder('Ders Notları');
      }
    }

    // Prefill title (strip extension)
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    setFormName(nameWithoutExt);

    // Topic extraction or default
    const topicKeywords = [
      { key: 'üslü', val: 'Üslü Sayılar' },
      { key: 'uslu', val: 'Üslü Sayılar' },
      { key: 'karekök', val: 'Kareköklü İfadeler' },
      { key: 'karekok', val: 'Kareköklü İfadeler' },
      { key: 'çarpan', val: 'Çarpanlar ve Katlar' },
      { key: 'carpan', val: 'Çarpanlar ve Katlar' },
      { key: 'ebob', val: 'Çarpanlar ve Katlar' },
      { key: 'ekok', val: 'Çarpanlar ve Katlar' },
      { key: 'olasılık', val: 'Basit Olayların Olasılığı' },
      { key: 'olasilik', val: 'Basit Olayların Olasılığı' },
      { key: 'veri', val: 'Veri Analizi' },
      { key: 'cebir', val: 'Cebirsel İfadeler' },
      { key: 'denklem', val: 'Doğrusal Denklemler' },
      { key: 'eşitsizlik', val: 'Eşitsizlikler' },
      { key: 'esitsizlik', val: 'Eşitsizlikler' },
      { key: 'üçgen', val: 'Üçgenler' },
      { key: 'ucgen', val: 'Üçgenler' }
    ];
    let matchedTopic = "Matematik LGS Kazanımları";
    const nameLower = file.name.toLocaleLowerCase('tr-TR');
    for (const kw of topicKeywords) {
      if (nameLower.includes(kw.key)) {
        matchedTopic = kw.val;
        break;
      }
    }
    setFormTopic(matchedTopic);

    // File size
    const sizeInMB = file.size / (1024 * 1024);
    const sizeStr = sizeInMB < 0.1 ? `${(file.size / 1024).toFixed(0)} KB` : `${sizeInMB.toFixed(1)} MB`;
    
    if (deducedType === 'pdf') {
      setFormSizeOrDuration(sizeStr);
    } else {
      setFormSizeOrDuration("15:30"); // Default preview duration
    }

    // Prefill markdown summary representation of selected file
    if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setFormContent(event.target.result as string);
        }
      };
      reader.readAsText(file);
    } else {
      let contentSuggestion = `### 📖 ${nameWithoutExt}\n\nBu kaynak öğrenci tarafından LGS hazırlık kapsamında sisteme yollanmıştır.\n\n#### 🖊️ Kazanım ve Çalışma Temelleri:\n- Ana Konu: **${matchedTopic}**\n- Dosya Türü: **${deducedType.toUpperCase()}**\n- Boyut/Uzunluk: **${deducedType === 'pdf' ? sizeStr : "15:30"}**\n\n--- \n\n*Yukarıdaki çalışma notunu dilediğiniz gibi düzenleyebilir, önemli formüllerinizi ekleyebilirsiniz!*`;
      setFormContent(contentSuggestion);
    }

    // Run simulated upload animation!
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 15;
      });
    }, 100);
  };

  const handleClearUploadedFile = () => {
    setUploadedFile(null);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Auto-calculated counts for folder cards
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Ders Notları': 0,
      'Çıkmış Sorular': 0,
      'Deneme Sınavları': 0,
      'Video Çözümler': 0,
    };
    files.forEach(f => {
      if (counts[f.folder] !== undefined) {
        counts[f.folder]++;
      }
    });
    return counts;
  }, [files]);

  const folders = [
    { name: 'Ders Notları', count: folderCounts['Ders Notları'], color: 'bg-blue-500', hex: '#3b82f6', textClass: 'text-blue-500' },
    { name: 'Çıkmış Sorular', count: folderCounts['Çıkmış Sorular'], color: 'bg-emerald-500', hex: '#10b981', textClass: 'text-emerald-500' },
    { name: 'Deneme Sınavları', count: folderCounts['Deneme Sınavları'], color: 'bg-amber-500', hex: '#f59e0b', textClass: 'text-amber-500' },
    { name: 'Video Çözümler', count: folderCounts['Video Çözümler'], color: 'bg-rose-500', hex: '#f43f5e', textClass: 'text-rose-500' },
  ];

  // Simulated live progress updater for video play
  useEffect(() => {
    if (isPlaying && activeFile && activeFile.type === 'video') {
      const parts = (activeFile.duration || "10:00").split(':');
      const totalSec = (parseInt(parts[0]) || 10) * 60 + (parseInt(parts[1]) || 0);

      playTimerRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          const next = prev + 1;
          if (next >= totalSec) {
            setIsPlaying(false);
            setPlayProgress(100);
            if (playTimerRef.current) clearInterval(playTimerRef.current);
            return totalSec;
          }
          setPlayProgress(Math.floor((next / totalSec) * 100));
          return next;
        });
      }, 1000);
    } else {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
      }
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, activeFile]);

  // Filtered files list based on query, type and selected folders
  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      const matchesFolder = selectedFolder ? file.folder === selectedFolder : true;
      const queryLower = searchQuery.toLocaleLowerCase('tr-TR');
      const matchesSearch = file.name.toLocaleLowerCase('tr-TR').includes(queryLower) || 
                            file.topic.toLocaleLowerCase('tr-TR').includes(queryLower) || 
                            file.content.toLocaleLowerCase('tr-TR').includes(queryLower);
      const matchesType = filterType === 'all' ? true : file.type === filterType;
      return matchesFolder && matchesSearch && matchesType;
    });
  }, [files, selectedFolder, searchQuery, filterType]);

  const handleToggleComplete = (id: string) => {
    const isCompleted = completedFileIds.includes(id);
    setCompletedFileIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });

    if (user) {
      if (isCompleted) {
        unmarkResourceCompleted(user.uid, id).catch(e => console.error("Error unmarking resource completion in Firestore:", e));
      } else {
        markResourceCompleted(user.uid, id).catch(e => console.error("Error marking resource completion in Firestore:", e));
      }
    }
  };

  const handleOpenFile = (file: ResourceFile) => {
    setActiveFile(file);
    setIsPlaying(false);
    setPlayProgress(0);
    setElapsedSeconds(0);
  };

  const handleCloseFile = () => {
    setActiveFile(null);
    setIsPlaying(false);
  };

  const handleUploadNewFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formContent) {
      alert("Lütfen kaynak adını ve özetini boş bırakmayın!");
      return;
    }

    const defaultSizeOrDur = formType === 'pdf' 
      ? (formSizeOrDuration || "1.5 MB") 
      : (formSizeOrDuration || "10:15");

    const newResource: ResourceFile = {
      id: Date.now().toString(),
      name: formName.endsWith('.pdf') || formType === 'video' ? formName : `${formName}.pdf`,
      size: formType === 'pdf' ? defaultSizeOrDur : `${Math.floor(Math.random() * 100) + 50} MB`,
      type: formType,
      folder: formFolder,
      topic: formTopic || "Matematik",
      content: formContent,
      duration: formType === 'video' ? defaultSizeOrDur : undefined,
      notes: formNotes || undefined
    };

    setFiles(prev => [newResource, ...prev]);
    setIsUploadOpen(false);

    if (user) {
      addCustomResource(user.uid, newResource).catch(e => console.error("Error writing resource metadata to Firestore:", e));
    }

    // Reset Form fields
    setFormName('');
    setFormFolder('Ders Notları');
    setFormType('pdf');
    setFormTopic('');
    setFormSizeOrDuration('');
    setFormContent('');
    setFormNotes('');
    setUploadedFile(null);
    setUploadProgress(null);
  };

  const handleDeleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bu kaynağı silmek istediğinizden emin misiniz?")) {
      setFiles(prev => prev.filter(f => f.id !== id));
      setCompletedFileIds(prev => prev.filter(item => item !== id));
      if (activeFile && activeFile.id === id) {
        setActiveFile(null);
      }

      if (user) {
        deleteCustomResource(user.uid, id).catch(e => console.error("Error deleting resource metadata from Firestore:", e));
        unmarkResourceCompleted(user.uid, id).catch(e => console.error("Error deleting completion record from Firestore:", e));
      }
    }
  };

  const selectedFolderInfo = folders.find(f => f.name === selectedFolder);

  return (
    <div id="resources_view_container" className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8 animate-slide-up">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-black italic text-primary tracking-tight">Kütüphanem & Kaynaklarım</h1>
          <p className="text-sm text-on-surface-variant flex items-center gap-1.5 font-medium">
            <BookOpen size={15} />
            LGS sınav hazırlık sürecinde ders notlarınızı ve çalışma videolarınızı organize edin.
          </p>
        </div>
        {isAdminMode && (
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="bg-primary text-white hover:bg-primary/90 transition-all font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-xl shadow-md flex items-center gap-2 cursor-pointer border border-primary hover:scale-[1.02]"
          >
            <Plus size={16} />
            Yeni Kaynak Ekle
          </button>
        )}
      </div>

      {/* Quick Search & Format Tag Filters */}
      <div className="bg-white border border-outline rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70" size={16} />
          <input
            type="text"
            placeholder="Konu, dosya adı veya içerik ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-outline rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-surface-dim/40"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-surface-dim rounded text-on-surface-variant"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <span className="text-xs font-bold text-on-surface-variant/80 uppercase tracking-wider mr-2">Biçim:</span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all border ${
              filterType === 'all' 
                ? 'bg-primary border-primary text-white shadow-sm' 
                : 'border-outline text-on-surface-variant hover:bg-surface-dim/30'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setFilterType('pdf')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all border flex items-center gap-1 ${
              filterType === 'pdf' 
                ? 'bg-primary border-primary text-white shadow-sm' 
                : 'border-outline text-on-surface-variant hover:bg-surface-dim/30'
            }`}
          >
            <FileText size={12} />
            Yazılı Notlar
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all border flex items-center gap-1 ${
              filterType === 'video' 
                ? 'bg-primary border-primary text-white shadow-sm' 
                : 'border-outline text-on-surface-variant hover:bg-surface-dim/30'
            }`}
          >
            <Video size={12} />
            Videolu Çözüm
          </button>
        </div>
      </div>

      {/* Folders Selection Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-serif font-black underline underline-offset-8 items-center gap-2 text-xl text-primary justify-start flex">
            {selectedFolder ? <FolderOpen size={20} className={selectedFolderInfo?.textClass} /> : <Folder size={20} className="text-primary" />}
            Klasör Kitaplığı
          </h3>
          {selectedFolder && (
            <button
              onClick={() => setSelectedFolder(null)}
              className="text-xs hover:text-primary flex items-center gap-1 pl-2 text-on-surface-variant font-bold uppercase tracking-widest hover:underline"
            >
              <ArrowLeft size={13} /> Tüm Klasörler
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {folders.map((folder) => {
            const isSelected = selectedFolder === folder.name;
            return (
              <div
                key={folder.name}
                onClick={() => setSelectedFolder(isSelected ? null : folder.name)}
                className={`group border rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer relative ${
                  isSelected 
                    ? 'border-primary bg-primary/[0.02] shadow-sm' 
                    : 'border-outline bg-white hover:border-black/30'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl ${folder.color} bg-opacity-15 text-white flex items-center justify-center`} style={{ color: folder.hex }}>
                    {isSelected ? <FolderOpen size={22} fill="currentColor" className="opacity-80" /> : <Folder size={22} fill="currentColor" className="opacity-80" />}
                  </div>
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded bg-surface-dim border border-outline">
                    {folder.count} kaynak
                  </span>
                </div>
                <h4 className="font-serif font-black text-lg text-primary truncate group-hover:translate-x-1 transition-transform">{folder.name}</h4>
                <p className="text-xs text-on-surface-variant mt-1 font-medium">{folder.name === 'Video Çözümler' ? 'Video dersler' : 'Yazılı dokümanlar'}</p>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-ping" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Files List Panel */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-bold text-lg text-primary">
              {selectedFolder ? `${selectedFolder} Klasöründeki Dosyalar` : 'Tüm Kaynaklar'}
            </h3>
            <span className="text-xs bg-surface-dim border border-outline px-2 py-0.5 rounded-full font-bold text-on-surface-variant">
              {filteredFiles.length} bulunan
            </span>
          </div>
          {selectedFolder && (
            <p className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded">
              Klasör Filtresi Açık
            </p>
          )}
        </div>

        {filteredFiles.length === 0 ? (
          <div className="bg-white border border-dashed border-outline rounded-2xl p-12 text-center space-y-4">
            <div className="inline-flex w-12 h-12 rounded-full bg-surface-dim items-center justify-center text-on-surface-variant">
              <Search size={22} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-primary">Eşleşen Kaynak Bulunamadı</h4>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                Yazdığın anahtar kelime veya belirlediğin filtreleme kriterinde kaynak bulunamadı. Aramanı sadeleştirebilir veya yeni bir kaynak oluşturabilirsin.
              </p>
            </div>
            {(selectedFolder || searchQuery !== '' || filterType !== 'all') && (
              <button
                onClick={() => {
                  setSelectedFolder(null);
                  setSearchQuery('');
                  setFilterType('all');
                }}
                className="text-xs bg-primary text-white font-bold uppercase tracking-widest px-4 py-2 rounded-lg hover:shadow-sm"
              >
                Tüm Filtreleri Sıfırla
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFiles.map((file) => {
              const isCompleted = completedFileIds.includes(file.id);
              return (
                <div
                  key={file.id}
                  onClick={() => handleOpenFile(file)}
                  className={`group bg-white border border-outline rounded-xl p-4 hover:border-black/30 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between ${
                    isCompleted ? 'bg-emerald-50/[0.1] border-emerald-500/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className={`p-3 rounded-lg border flex-shrink-0 transition-all ${
                      file.type === 'pdf' 
                        ? 'border-rose-100 bg-rose-50/50 text-rose-500 group-hover:bg-rose-50' 
                        : 'border-blue-100 bg-blue-50/50 text-blue-500 group-hover:bg-blue-50'
                    }`}>
                      {file.type === 'pdf' ? <FileText size={20} /> : <Video size={20} />}
                    </div>
                    
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          file.folder === 'Çıkmış Sorular' ? 'bg-emerald-100 text-emerald-800' :
                          file.folder === 'Ders Notları' ? 'bg-blue-100 text-blue-800' :
                          file.folder === 'Deneme Sınavları' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {file.folder}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-medium">
                          {file.topic}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-primary group-hover:text-primary/80 truncate pr-1">
                        {file.name}
                      </h4>
                      <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                        {file.type === 'pdf' ? <BookOpen size={10} /> : <Clock size={10} />}
                        {file.type === 'pdf' ? file.size : `${file.duration || "10:00"} dk video`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isCompleted && (
                      <span className="p-1 rounded-full bg-emerald-100 text-emerald-700" title="Tamamlandı">
                        <CheckCircle size={15} />
                      </span>
                    )}
                    {isAdminMode && (
                      <button
                        onClick={(e) => handleDeleteFile(file.id, e)}
                        className="p-1.5 rounded-lg border border-transparent text-on-surface-variant/40 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50/50 transition-all cursor-pointer"
                        title="Kaynağı Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reader & Media Player Modal for resource inspection */}
      {activeFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-outline rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-outline flex items-center justify-between bg-surface-dim/30">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${activeFile.type === 'pdf' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                  {activeFile.type === 'pdf' ? <FileText size={18} /> : <Video size={18} />}
                </div>
                <div>
                  <h3 className="font-serif font-black text-md text-primary">{activeFile.name}</h3>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/80 flex items-center gap-2">
                    <span>{activeFile.folder}</span>
                    <span>•</span>
                    <span className="text-primary font-medium">{activeFile.topic}</span>
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleCloseFile}
                className="p-1.5 hover:bg-surface-dim rounded-lg text-on-surface-variant hover:text-black transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
              {activeFile.type === 'pdf' ? (
                /* PDF/Doc Study Reader View */
                <div className="prose max-w-none text-sm text-primary space-y-4 font-normal bg-amber-50/10 border border-amber-900/10 rounded-2xl p-6 shadow-sm line-height-relaxed select-text">
                  <div className="flex items-center justify-between border-b border-amber-900/10 pb-3 mb-4">
                    <span className="text-xs font-serif font-bold text-amber-800 tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-600 animate-spin-slow" /> AI Çalışma Yaprağı
                    </span>
                    <span className="text-[10px] font-mono text-on-surface-variant">Özet Doküman</span>
                  </div>
                  
                  {/* Clean Markdown Formatting natively structured with spacing */}
                  <div className="whitespace-pre-wrap leading-relaxed font-sans mt-2 space-y-4 break-words">
                    {activeFile.content}
                  </div>
                </div>
              ) : (
                /* Interactive Simulated Video Player View */
                <div className="space-y-6">
                  {/* Simulated screen container */}
                  <div className="aspect-video bg-black rounded-xl overflow-hidden relative group flex flex-col justify-between p-4 shadow-md border border-neutral-800">
                    {/* Simulated visual background element */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-neutral-900 via-zinc-800 to-indigo-950 flex items-center justify-center opacity-90">
                      <div className="text-center space-y-2 pointer-events-none z-10 p-4">
                        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-3 animate-pulse">
                          {isPlaying ? (
                            <Clock size={24} className="text-rose-400 rotate-180" />
                          ) : (
                            <Play size={24} className="text-white fill-white translate-x-0.5" />
                          )}
                        </div>
                        <h4 className="font-serif font-black tracking-wide text-white text-lg">
                          {isPlaying ? 'Eğitim Çözümü Oynatılıyor...' : 'Çözüm Dersi Hazır'}
                        </h4>
                        <p className="text-xs text-neutral-400/90 font-mono">
                          LGS Matematik Soruları Çözümlü Oynatıcı
                        </p>
                      </div>
                    </div>

                    {/* Glowing background gradient elements built-in */}
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Top overlay */}
                    <div className="z-10 flex justify-between items-center text-white/90 bg-gradient-to-b from-black/80 to-transparent p-2 rounded-t-xl">
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-rose-500/95 px-2 py-0.5 rounded">
                        Eğitmen Çözümü
                      </span>
                      <span className="text-xs font-mono">
                        {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')} / {activeFile.duration || "10:00"}
                      </span>
                    </div>

                    {/* Play progress Indicator */}
                    <div className="z-10 space-y-2 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-3 rounded-b-xl">
                      <div className="w-full bg-neutral-700/60 h-1 rounded-full overflow-hidden cursor-pointer">
                        <div 
                          className="bg-primary h-full transition-all duration-300 relative"
                          style={{ width: `${playProgress}%` }}
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full border border-primary scale-0 group-hover:scale-100 transition-transform" />
                        </div>
                      </div>

                      {/* Video Player Core Controls bar */}
                      <div className="flex items-center justify-between text-white text-xs pt-1">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-all cursor-pointer shadow-sm"
                          >
                            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} className="translate-x-0.5 animate-pulse" fill="currentColor" />}
                          </button>
                          
                          <span className="font-mono text-[10px] tracking-wide text-zinc-300">
                            {isPlaying ? 'Canlı Senkronize' : 'Çözüm Duraklatıldı'}
                          </span>
                        </div>

                        <div className="text-[10px] text-zinc-400 font-medium">
                          Matematik Soru Analiz Sesi: Aktif
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Syllabus note and tutorial breakdown details */}
                  <div className="space-y-3">
                    <h4 className="font-serif font-black underline underline-offset-4 text-primary text-base">
                      Öğretmen Sınıf İçi Notları
                    </h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {activeFile.notes || 'Bu videoda LGS Matematik müfredatındaki en kritik kazanımlarla ilgili sorular, geometrik modellemelerle adım adım çözülüyor. Formülleri defterinize not almayı unutmayın.'}
                    </p>
                    <div className="bg-surface-dim/30 border border-outline rounded-xl p-4 flex items-start gap-3">
                      <Sparkles size={16} className="text-rose-500 mt-0.5 flex-shrink-0 animate-pulse" />
                      <div className="text-[11px] text-on-surface-variant leading-relaxed">
                        <span className="font-bold text-primary mr-1">LGS Derece Tavsiyesi:</span> 
                        Çözüm videosunu izlerken önce soruyu durdurup kendiniz çözmeye çalışın, ardından öğretmen çözümünü baştan sona inceleyerek yaklaşım farkını analiz edin.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-surface-dim/40 border-t border-outline flex flex-col sm:flex-row items-center justify-between gap-3 px-6">
              <button
                onClick={() => handleToggleComplete(activeFile.id)}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  completedFileIds.includes(activeFile.id)
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200/50'
                    : 'bg-white text-primary border border-outline hover:border-black/30'
                }`}
              >
                <CheckCircle size={14} className={completedFileIds.includes(activeFile.id) ? 'text-emerald-700 animate-bounce' : ''} />
                {completedFileIds.includes(activeFile.id) ? 'Çalışıldı Olarak İşaretli' : 'Çalışıldı Olarak İşaretle'}
              </button>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleCloseFile}
                  className="px-5 py-2.5 rounded-xl border border-outline text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-black hover:border-black/30 bg-white cursor-pointer w-full sm:w-auto text-center"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload New Resource Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-outline rounded-2xl shadow-xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-outline bg-surface-dim/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="text-primary" size={18} />
                <h3 className="font-serif font-black underline underline-offset-4 text-md text-primary">Kütüphaneye Yeni Kaynak Ekle</h3>
              </div>
              <button 
                onClick={() => {
                  setIsUploadOpen(false);
                  handleClearUploadedFile();
                }}
                className="p-1 hover:bg-surface-dim rounded text-on-surface-variant cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleUploadNewFile} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Drag and Drop File Uploder */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-primary">Dosya Yükle (PDF / MP4)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,video/mp4,video/x-m4v,video/*,.txt,.md"
                  className="hidden"
                />
                
                {!uploadedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                      isDragging 
                        ? 'border-primary bg-primary/[0.04] scale-[0.99]' 
                        : 'border-outline bg-surface-dim/20 hover:border-primary hover:bg-surface-dim/40'
                    }`}
                  >
                    <div className="p-3 rounded-full bg-white text-primary shadow-sm border border-outline">
                      <UploadCloud size={20} className={isDragging ? 'animate-bounce' : ''} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary">Bilgisayarınızdan bir PDF veya Video sürükleyin</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">Veya manuel seçmek için tıklayın (.pdf, .mp4, .txt, .md dosyaları desteklenir)</p>
                    </div>
                  </div>
                ) : (
                  <div className="border border-outline rounded-xl p-4 bg-primary/[0.01] flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${formType === 'pdf' ? 'border-rose-100 bg-rose-50 text-rose-500' : 'border-blue-100 bg-blue-50 text-blue-500'}`}>
                          {formType === 'pdf' ? <FileText size={18} /> : <Video size={18} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-primary truncate max-w-[280px]">{uploadedFile.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">{formType} • {formSizeOrDuration || 'Boyut hesaplanıyor'}</p>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleClearUploadedFile}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                        title="Dosyayı Değiştir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {uploadProgress !== null && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant">
                          <span>Sisteme Hazırlanıyor...</span>
                          <span className="font-bold">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-surface-dim h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-outline"></div>
                <span className="flex-shrink mx-4 text-[10px] text-on-surface-variant/75 uppercase tracking-widest font-bold">Kaynak Detayları</span>
                <div className="flex-grow border-t border-outline"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Resource Title */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-primary">Kaynak Adı / Başlığı</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Üslü Sayılar Genel Tarama"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-outline rounded-xl bg-surface-dim/30 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  />
                </div>

                {/* Topic tag */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-primary">Hangi Matematik Konusu?</label>
                  <input
                    type="text"
                    placeholder="Örn: Çarpanlar ve Katlar"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    className="w-full text-xs p-2.5 border border-outline rounded-xl bg-surface-dim/30 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Folder Selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-primary">Klasör Seçimi</label>
                  <select
                    value={formFolder}
                    onChange={(e) => setFormFolder(e.target.value as ResourceFile['folder'])}
                    className="w-full text-xs p-2.5 border border-outline rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  >
                    <option value="Ders Notları">Ders Notları</option>
                    <option value="Çıkmış Sorular">Çıkmış Sorular</option>
                    <option value="Deneme Sınavları">Deneme Sınavları</option>
                    <option value="Video Çözümler">Video Çözümler</option>
                  </select>
                </div>

                {/* Resource Type */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-primary">Kaynak Türü / Formatı</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormType('pdf')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border uppercase tracking-wider transition-all ${
                        formType === 'pdf' 
                          ? 'bg-primary text-white border-primary' 
                          : 'bg-white text-on-surface-variant border-outline hover:bg-surface-dim'
                      }`}
                    >
                      Yazılı (PDF)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('video')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border uppercase tracking-wider transition-all ${
                        formType === 'video' 
                          ? 'bg-primary text-white border-primary' 
                          : 'bg-white text-on-surface-variant border-outline hover:bg-surface-dim'
                      }`}
                    >
                      Video (MP4)
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Custom Size / Duration */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-primary">
                    {formType === 'pdf' ? 'Dosya Boyutu (İsteğe Bağlı)' : 'Video Süresi (İsteğe Bağlı)'}
                  </label>
                  <input
                    type="text"
                    placeholder={formType === 'pdf' ? 'Örn: 2.1 MB' : 'Örn: 10:15'}
                    value={formSizeOrDuration}
                    onChange={(e) => setFormSizeOrDuration(e.target.value)}
                    className="w-full text-xs p-2.5 border border-outline rounded-xl bg-surface-dim/30 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  />
                </div>

                {/* Optional description note */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-primary">Pedagojik Not (İsteğe Bağlı)</label>
                  <input
                    type="text"
                    placeholder="Örn: Önce kendin çöz sonra çözümü izle."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full text-xs p-2.5 border border-outline rounded-xl bg-surface-dim/30 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  />
                </div>
              </div>

              {/* Document markdown or description content */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-primary">
                  {formType === 'pdf' ? 'Kaynak Özeti / Formüller (Destekleyici Metin)' : 'Video İçerik Tanımı'}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={
                    formType === 'pdf' 
                      ? "Formülleri veya ders özetlerini buraya yazın. Öğrencinin okuyabilmesi için modal içinde gösterilecektir." 
                      : "Bu video çözümün hangi adımları barındırdığını ve hangi sorunun çözümü olduğunu belirtin."
                  }
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full text-xs p-2.5 border border-outline rounded-xl bg-surface-dim/30 focus:outline-none focus:ring-1 focus:ring-primary resize-none font-sans font-medium"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 justify-end pt-2 border-t border-outline mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadOpen(false);
                    handleClearUploadedFile();
                  }}
                  className="px-5 py-2.5 border border-outline text-xs font-bold uppercase tracking-widest rounded-xl text-on-surface-variant hover:text-black hover:border-black/30 transition-all cursor-pointer bg-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-sm hover:scale-[1.01] transition-all cursor-pointer border border-primary hover:bg-primary/95"
                >
                  Kütüphaneye Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
