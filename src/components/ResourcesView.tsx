import { FileText, Folder, MoreHorizontal, Video } from 'lucide-react';

export default function ResourcesView() {
  const folders = [
    { name: 'Ders Notları', count: 12, color: 'bg-blue-500' },
    { name: 'Çıkmış Sorular', count: 45, color: 'bg-emerald-500' },
    { name: 'Deneme Sınavları', count: 8, color: 'bg-amber-500' },
    { name: 'Video Çözümler', count: 24, color: 'bg-rose-500' },
  ];

  const recentFiles = [
    { name: 'Üslü Sayılar Özet.pdf', size: '2.4 MB', type: 'pdf' },
    { name: 'Matematik_Deneme_1.pdf', size: '1.8 MB', type: 'pdf' },
    { name: 'Fonksiyonlar_Giriş.mp4', size: '450.2 MB', type: 'video' },
  ];

  return (
    <div className="p-8 lg:p-12 max-w-5xl mx-auto space-y-10 animate-slide-up">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-3xl font-serif font-bold text-primary italic">Kaynaklarım</h1>
          <p className="text-on-surface-variant">Tüm dijital kütüphanenizi buradan yönetin.</p>
        </div>
        <button className="bg-primary text-white px-6 py-2.5 rounded-md font-bold text-sm shadow-md hover:bg-primary/90">
          Yeni Dosya Yükle
        </button>
      </div>

      <section className="space-y-4">
        <h3 className="font-serif font-bold text-lg uppercase tracking-tight">Klasörler</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <div key={folder.name} className="group bg-white border border-outline rounded-xl p-5 hover:border-primary hover:shadow-md transition-all cursor-pointer">
              <div className={`w-10 h-10 ${folder.color} rounded-lg flex items-center justify-center text-white mb-4`}>
                <Folder size={20} fill="currentColor" />
              </div>
              <h4 className="font-bold text-primary group-hover:text-indigo-600 truncate">{folder.name}</h4>
              <p className="text-xs text-on-surface-variant mt-1">{folder.count} Dosya</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-serif font-bold text-lg uppercase tracking-tight">Son Kullanılanlar</h3>
        <div className="bg-white border border-outline rounded-xl overflow-hidden divide-y divide-outline">
          {recentFiles.map((file) => (
            <div key={file.name} className="p-4 flex items-center justify-between hover:bg-surface-dim/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 border border-outline rounded bg-surface-dim">
                  {file.type === 'pdf' ? <FileText size={18} className="text-rose-500" /> : <Video size={18} className="text-blue-500" />}
                </div>
                <div>
                  <h5 className="text-sm font-bold text-primary">{file.name}</h5>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{file.size}</p>
                </div>
              </div>
              <button className="text-on-surface-variant hover:text-primary p-2">
                <MoreHorizontal size={18} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
