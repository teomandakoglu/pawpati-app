import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const DAYS = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

const HEALTH_EVENTS = [
  { day: 3, month: 3, type: 'dental', label: 'Diş Bakımı', status: 'completed', icon: '🦷' },
  { day: 9, month: 3, type: 'parasite', label: 'Parazit', status: 'overdue', icon: '🪱' },
  { day: 14, month: 3, type: 'worming', label: 'Kurtçuk', status: 'warning', icon: '💊' },
  { day: 18, month: 3, type: 'applied', label: 'Uygulandı', status: 'completed', icon: '✅' },
  { day: 25, month: 3, type: 'vet', label: 'Vet ziyareti', status: 'scheduled', icon: '🩺' },
];

const UPCOMING = [
  { title: 'Kurtçuk Tedavisi', due: 'Son tarih: 14 Nisan 2026', detail: 'Nisan kutusuna dahil', urgency: '2 gün kaldı', urgencyColor: 'bg-paw-orange', borderColor: 'border-paw-orange' },
  { title: 'Kuduz Aşısı Rapeli', due: 'Son tarih: 2 Haziran 2026', detail: 'Veteriner ziyareti gerekli', urgency: '51 gün kaldı', urgencyColor: 'bg-paw-green', borderColor: 'border-paw-green' },
  { title: 'Yıllık Genel Kontrol', due: 'Son tarih: 15 Temmuz 2026', detail: 'Tam sağlık taraması', urgency: '94 gün kaldı', urgencyColor: 'bg-paw-teal', borderColor: 'border-paw-teal' },
];

const STATUS_COLORS = {
  completed: { bg: 'bg-paw-green', dot: 'bg-paw-green', label: 'Tamamlandı' },
  overdue: { bg: 'bg-paw-danger', dot: 'bg-paw-danger', label: 'Gecikmiş' },
  warning: { bg: 'bg-paw-warning', dot: 'bg-paw-warning', label: 'Yaklaşan' },
  scheduled: { bg: 'bg-blue-500', dot: 'bg-blue-500', label: 'Planlandı' },
  vet: { bg: 'bg-paw-purple', dot: 'bg-paw-purple', label: 'Vet ziy. gerekli' },
};

function getDaysInMonth(m, y) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(m, y) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }

export default function HealthCalendar() {
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(3);
  const [currentYear] = useState(2026);

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDay(currentMonth, currentYear);
  const getEventsForDay = (day) => HEALTH_EVENTS.filter(e => e.day === day && e.month === currentMonth);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex gap-6">
        <Sidebar activePage="Sağlık Takvimi" />

        <div className="flex-1 min-w-0 relative">
          <div className="flex items-center justify-between mb-4">
            <button className="btn-outline-orange btn-sm">📋 Sağlık kartından güncelle</button>
            <h1 className="text-xl font-bold font-display text-paw-text">
              AI Sağlık Takvimi — {MONTHS[currentMonth]} {currentYear} 🗓️
            </h1>
          </div>

          {!isUnlocked && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl">
              <div className="absolute inset-0 backdrop-blur-md bg-white/70 rounded-2xl" />
              <div className="relative z-10 text-center p-8 max-w-sm">
                <div className="text-5xl mb-4">🔒</div>
                <h3 className="text-lg font-bold mb-2 text-paw-text">Kilitli Durum</h3>
                <p className="text-sm text-paw-text-muted mb-4">(Kayıt öncesi görünüm)<br/>Sağlık verileri form veya OCR ile girilene kadar takvim bulanık</p>
                <button className="btn-primary" onClick={() => setIsUnlocked(true)} id="unlock-calendar-btn">
                  Sağlık Verileriyle Kilidi Aç →
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-6">
            <div className="flex-1 card !p-0 overflow-hidden">
              <div className="grid grid-cols-7">
                {DAYS.map(d => (
                  <div key={d} className={`text-center text-xs font-bold py-3 ${
                    d === 'Cum' ? 'bg-paw-orange text-white' : 'bg-[#F5F5F4] text-paw-text-secondary'
                  } border-b border-[#E7E5E4]`}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array(firstDay).fill(0).map((_, i) => (
                  <div key={`e-${i}`} className="aspect-square border-b border-r border-[#E7E5E4]/50" />
                ))}
                {Array(daysInMonth).fill(0).map((_, i) => {
                  const day = i + 1;
                  const events = getEventsForDay(day);
                  const hasEvent = events.length > 0;
                  const event = events[0];
                  const statusColor = event ? STATUS_COLORS[event.status] : null;
                  return (
                    <div key={day} className={`aspect-square border-b border-r border-[#E7E5E4]/50 p-1.5 flex flex-col items-center justify-start relative transition-colors hover:bg-[#F5F5F4] ${
                      hasEvent && event.status === 'overdue' ? 'bg-red-50' :
                      hasEvent && event.status === 'completed' ? 'bg-green-50' :
                      hasEvent && event.status === 'warning' ? 'bg-yellow-50' :
                      hasEvent && event.status === 'scheduled' ? 'bg-blue-50' : ''
                    }`} id={`cal-day-${day}`}>
                      <span className="text-sm font-medium text-paw-text">{day}</span>
                      {hasEvent && (
                        <>
                          <div className={`w-2.5 h-2.5 rounded-full ${statusColor.dot} mt-1 ${event.status === 'overdue' ? 'animate-pulse' : ''}`} />
                          <span className="text-[9px] text-paw-text-muted mt-0.5 text-center">{event.label}</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-4 p-3 border-t border-[#E7E5E4] text-[10px]">
                <span className="font-semibold text-paw-text-secondary">Gösterge</span>
                {Object.entries(STATUS_COLORS).map(([key, val]) => (
                  <span key={key} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${val.dot}`} /> {val.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="w-64 shrink-0 space-y-4 hidden xl:block">
              <h3 className="font-bold font-display text-paw-text">Yaklaşan Etkinlikler</h3>
              {UPCOMING.map((event, i) => (
                <div key={i} className={`card !p-3 border-l-4 ${event.borderColor}`}>
                  <p className="text-sm font-semibold text-paw-text">🐾 {event.title}</p>
                  <p className="text-xs text-paw-text-muted">{event.due}</p>
                  <p className="text-[10px] text-paw-text-muted">{event.detail}</p>
                  <div className={`mt-2 ${event.urgencyColor} text-white text-[10px] font-medium rounded-full px-3 py-1 text-center`}>{event.urgency}</div>
                </div>
              ))}
              <div className="card !p-4 bg-gray-700 text-white">
                <p className="text-xs font-bold mb-1">🔒 Kilitli Durum</p>
                <p className="text-[10px] text-gray-300 mb-3">(Kayıt öncesi görünüm)<br/>Sağlık verileri girilene kadar takvim bulanık</p>
                <button className="btn-primary w-full text-xs" onClick={() => setIsUnlocked(false)}>
                  Sağlık Verileriyle Kilidi Aç →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
