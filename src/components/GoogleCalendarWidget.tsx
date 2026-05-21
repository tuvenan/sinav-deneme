import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, RefreshCw, CheckCircle, Sparkles } from 'lucide-react';
import { useFirebase } from './FirebaseContext';
import { listUpcomingEvents, createCalendarEvent, formatToCalISO, GoogleCalendarEvent } from '../lib/googleCalendar';

export default function GoogleCalendarWidget() {
  const { accessToken, connectCalendar } = useFirebase();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Quick Schedule Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [topic, setTopic] = useState('Üslü Sayılar');
  const [studyDate, setStudyDate] = useState('');
  const [studyTime, setStudyTime] = useState('16:00');
  const [sourceGoal, setSourceGoal] = useState(40);
  const [isAdding, setIsAdding] = useState(false);

  // Set default date to tomorrow
  useEffect(() => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const yyyy = tom.getFullYear();
    const mm = (tom.getMonth() + 1).toString().padStart(2, '0');
    const dd = tom.getDate().toString().padStart(2, '0');
    setStudyDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  const fetchEvents = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const items = await listUpcomingEvents(accessToken);
      // Filter for items starting with LGS, or let's show all for flexibility and mark LGS ones!
      setEvents(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchEvents();
    }
  }, [accessToken]);

  const handleConnect = async () => {
    try {
      await connectCalendar();
    } catch (e) {
      console.error(e);
      alert('Takvim bağlantısı başarısız oldu.');
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!studyDate) {
      alert('Lütfen geçerli bir tarih seçin.');
      return;
    }

    const confirmed = window.confirm(
      `"${topic}" konusu için Google Takviminize ${studyDate} tarihinde saat ${studyTime}'ye çalışma hedefi eklensin mi?`
    );
    if (!confirmed) return;

    setIsAdding(true);
    try {
      const parts = studyDate.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const [h, m] = studyTime.split(':');
      
      const startIso = formatToCalISO(d, parseInt(h) || 16, parseInt(m) || 0);
      const endIso = formatToCalISO(d, (parseInt(h) || 16) + 1, parseInt(m) || 0);

      const newEvent: GoogleCalendarEvent = {
        summary: `📚 LGS Çalışma Planı: ${topic}`,
        description: `Hedef: +${sourceGoal} soru çözüm ve analiz.\n\n"Başarının sırrı, her gün düzenli adım atmaktır."\nLGS Mentor AI Danışmanlık`,
        start: {
          dateTime: startIso,
          timeZone: 'Europe/Istanbul'
        },
        end: {
          dateTime: endIso,
          timeZone: 'Europe/Istanbul'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 15 }
          ]
        }
      };

      await createCalendarEvent(accessToken, newEvent);
      alert('Harika! Özel LGS çalışma seansınız Google Takviminize başarıyla kaydedildi!');
      setShowAddForm(false);
      fetchEvents();
    } catch (err) {
      console.error(err);
      alert('Plan oluşturulurken bir hata oluştu.');
    } finally {
      setIsAdding(false);
    }
  };

  const formatDateLabel = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long', 
      weekday: 'short' 
    });
  };

  const formatTimeLabel = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-white border border-outline rounded-xl p-6 sm:p-8 mt-10 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-outline pb-4 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-primary animate-pulse" size={20} />
          <div>
            <span className="text-[9px] font-mono tracking-widest font-black uppercase text-primary block leading-none">AJANDA</span>
            <h3 className="text-lg font-serif font-black text-primary italic mt-1">Google LGS Çalışma Takvimi</h3>
          </div>
        </div>

        {accessToken && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 border border-outline bg-surface-dim hover:text-primary transition-all text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={13} />
              <span>{showAddForm ? 'Kapat' : 'Çalışma Planla'}</span>
            </button>
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="p-1.5 border border-outline bg-surface-dim hover:text-primary transition-all rounded-lg cursor-pointer disabled:opacity-50"
              title="Yenile"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        )}
      </div>

      {showAddForm && accessToken && (
        <form onSubmit={handleQuickAdd} className="bg-surface-dim p-4 sm:p-5 border border-outline rounded-xl space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/15 rounded-full text-[9px] font-bold uppercase tracking-wider">
            <Sparkles size={10} />
            <span>Hedef Odaklı Çalışma Ekle</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tight">Konu / Aktivite</label>
              <select 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full text-xs font-semibold p-2 border border-outline rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Üslü Sayılar Genel Tekrar">Üslü Sayılar Genel Tekrar</option>
                <option value="Köklü Sayılar Soru Çözümü">Köklü Sayılar Soru Çözümü</option>
                <option value="Çarpanlar ve Katlar Zor Seviye">Çarpanlar ve Katlar Zor Seviye</option>
                <option value="LGS Matematik Deneme Çözümü">LGS Matematik Deneme Çözümü</option>
                <option value="Yanlış Soru ve Hata Analizi Analizi">Yanlış Soru ve Hata Analizi Analizi</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tight">Hedef Soru Sayısı</label>
              <input 
                type="number" 
                value={sourceGoal}
                onChange={(e) => setSourceGoal(Math.max(10, parseInt(e.target.value) || 0))}
                className="w-full text-xs font-mono font-bold p-2 border border-outline rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tight">Çalışma Tarihi</label>
              <input 
                type="date"
                value={studyDate}
                onChange={(e) => setStudyDate(e.target.value)}
                className="w-full text-xs font-semibold p-2 border border-outline rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tight">Hatırlatma Saati</label>
              <input 
                type="time"
                value={studyTime}
                onChange={(e) => setStudyTime(e.target.value)}
                className="w-full text-xs font-semibold p-2 border border-outline rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isAdding}
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isAdding ? 'Ekleniyor...' : '📅 Google Takvime Planla'}
            </button>
          </div>
        </form>
      )}

      {!accessToken ? (
        <div className="bg-surface-dim/40 border border-outline/75 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
            <CalendarIcon size={24} />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="text-sm font-bold text-primary">Ajandayı ve Hatırlatıcıları Cep Telefonuna Eşitle!</h4>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Google Takviminizi bağlayarak LGS kamplarını, deneme çözme saatlerinizi ve günlük soru hedeflerinizi anlık bildirimlere dönüştürün.
            </p>
          </div>
          <button
            onClick={handleConnect}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Google Takvim'i Bağla</span>
          </button>
        </div>
      ) : loading ? (
        <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
          <RefreshCw size={24} className="text-primary animate-spin" />
          <span className="text-xs text-on-surface-variant font-medium">Yaklaşan çalışma planı yükleniyor...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-surface-dim/30 border border-outline/50 rounded-2xl p-6 text-center text-xs text-on-surface-variant space-y-2.5">
          <p className="font-semibold">Planlanmış yakın çalışma bulunmuyor.</p>
          <p className="text-[11px] max-w-md mx-auto">
            Hemen sağ üst köşeden <strong className="text-primary font-bold">Çalışma Planla</strong> diyerek yeni bir seans ekleyin veya <strong className="text-primary font-bold">AI Rehber</strong> menüsünden kendi kısımlarınızı senkronize edin!
          </p>
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
          {events.map((event) => {
            const summaryLower = event.summary?.toLowerCase() || '';
            const isLgs = summaryLower.includes('lgs') || 
                          summaryLower.includes('çalışma') || 
                          summaryLower.includes('çalişma') || 
                          summaryLower.includes('ders') || 
                          summaryLower.includes('kamp') ||
                          summaryLower.includes('soru');

            return (
              <div 
                key={event.id}
                className={`p-4 border rounded-xl flex items-center justify-between gap-4 transition-all ${
                  isLgs 
                    ? 'border-indigo-200/80 bg-indigo-50/30 hover:border-indigo-400/60 shadow-[0_2px_12px_-4px_rgba(99,102,241,0.06)]' 
                    : 'bg-white border-outline hover:border-primary/40'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isLgs 
                      ? 'bg-indigo-100 text-indigo-600' 
                      : 'bg-surface-dim text-on-surface-variant'
                  }`}>
                    <CalendarIcon size={14} />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h4 className={`text-xs font-serif font-black truncate leading-tight ${
                      isLgs ? 'text-indigo-900' : 'text-primary'
                    }`}>
                      {event.summary}
                    </h4>
                    <p className="text-[10px] text-on-surface-variant/80 line-clamp-2 leading-relaxed whitespace-pre-line">
                      {event.description || 'Açıklama girilmemiş.'}
                    </p>
                    <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                      <div className="flex items-center gap-1 text-[9px] font-medium text-on-surface-variant/60">
                        <Clock size={10} />
                        <span>{formatDateLabel(event.start?.dateTime || event.start?.date)}</span>
                      </div>
                      <span className="text-[9px] text-on-surface-variant/35">•</span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        isLgs 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                          : 'bg-surface-dim text-primary border-outline'
                      }`}>
                        {formatTimeLabel(event.start?.dateTime) || 'Gün boyu'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                    isLgs 
                      ? 'text-indigo-700 bg-indigo-50 border-indigo-100' 
                      : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                  }`}>
                    <CheckCircle size={10} />
                    <span>{isLgs ? 'LGS Hedefi' : 'Kayıtlı'}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
