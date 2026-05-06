import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

const ORDER_HISTORY = [
  { date: '17 Oca 2026', box: 'Kişisel Kutu — Q1 2026', amount: '3.237', invoice: 'PDF', status: 'Teslim Edildi' },
  { date: '17 Eki 2025', box: 'Kişisel Kutu — Q4 2025', amount: '3.237', invoice: 'PDF', status: 'Teslim Edildi' },
  { date: '17 Tem 2025', box: 'Kişisel Kutu — Q3 2025', amount: '2.950', invoice: 'PDF', status: 'Teslim Edildi' },
  { date: '17 Nis 2025', box: 'Kişisel Kutu — Q2 2025', amount: '2.950', invoice: 'PDF', status: 'Teslim Edildi' },
];

export default function SubscriptionPage() {
  const [showPause, setShowPause] = useState(false);
  const [pauseMonths, setPauseMonths] = useState(1);
  const [notifications, setNotifications] = useState({ upsell: true, feedback: true, renewal: false });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex gap-6">
        <Sidebar activePage="Hesabım" />

        <div className="flex-1 min-w-0">
          <div className="text-xs text-paw-text-muted mb-4">
            Ana Sayfa · Aboneliğim · Nova'nın Profili · Veteriner Bul
          </div>

          <h1 className="text-2xl font-bold font-display text-paw-text text-center mb-6">Abonelik Yönetimi</h1>

          <div className="flex gap-6">
            <div className="flex-1 space-y-6">
              {/* Aktif Plan */}
              <div className="card border-2 border-paw-orange/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-paw-orange" />
                <div className="text-center pt-2">
                  <span className="badge badge-success mb-3">✅ Aktif</span>
                  <h2 className="text-lg font-bold font-display text-paw-text">Kişiselleştirilmiş Kutu — 3 Aylık Plan</h2>
                  <p className="text-sm text-paw-text-muted mt-1">
                    ₺ 3.237 / çeyrek (₺ 1.079 / ay) · Sonraki fatura: 15 Mayıs 2026
                  </p>
                  <p className="text-xs text-paw-text-muted">Sonraki sevkiyat: 17 Nisan 2026 · Ücretsiz kargo dahil</p>
                  <div className="border-t-2 border-dashed border-[#E7E5E4] my-4" />
                  <div className="flex justify-center gap-3">
                    <button className="btn-primary btn-sm" id="upgrade-plan-btn">↑ Planı Yükselt</button>
                    <button className="btn-outline-orange btn-sm" onClick={() => setShowPause(!showPause)} id="pause-sub-btn">
                      ⏸ Üyeliği Duraklat
                    </button>
                    <button className="btn-secondary btn-sm" id="cancel-btn">✕ İptal Et</button>
                  </div>
                </div>
              </div>

              {/* Sipariş ve Fatura Geçmişi */}
              <div className="card">
                <h3 className="font-bold font-display text-paw-text mb-4">Sipariş ve Fatura Geçmişi</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-paw-orange text-white">
                        <th className="text-left px-4 py-2.5 rounded-tl-lg font-medium">Tarih</th>
                        <th className="text-left px-4 py-2.5 font-medium">Kutu</th>
                        <th className="text-left px-4 py-2.5 font-medium">Tutar</th>
                        <th className="text-left px-4 py-2.5 font-medium">Fatura</th>
                        <th className="text-left px-4 py-2.5 rounded-tr-lg font-medium">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ORDER_HISTORY.map((row, i) => (
                        <tr key={i} className="border-b border-[#E7E5E4] hover:bg-[#F5F5F4] transition-colors">
                          <td className="px-4 py-3 text-paw-text">{row.date}</td>
                          <td className="px-4 py-3 text-paw-text-secondary">{row.box}</td>
                          <td className="px-4 py-3 text-paw-text">₺ {row.amount}</td>
                          <td className="px-4 py-3">
                            <a href="#" className="text-paw-orange hover:underline text-xs font-medium">↓ {row.invoice}</a>
                          </td>
                          <td className="px-4 py-3"><span className="badge badge-success">{row.status} ✓</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bildirim Tercihleri */}
              <div className="card">
                <h3 className="font-bold font-display text-paw-text mb-4">Bildirim Tercihleri</h3>
                <div className="space-y-4">
                  {[
                    { key: 'upsell', title: 'Sevkiyat öncesi ek satış (T-48s)', desc: 'Kutunuz paketleniyor — kargo ücretsizken ekstra ekleyin' },
                    { key: 'feedback', title: 'Teslimat sonrası geri bildirim (T+72s)', desc: 'Kutunuzu puanlayın — AI önerinizi geliştirir' },
                    { key: 'renewal', title: 'Yenileme hatırlatıcısı (T-3 gün)', desc: 'Fatura öncesi hatırlatma — kolay duraklat veya iptal seçeneği' },
                  ].map(pref => (
                    <div key={pref.key} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-semibold text-paw-text">{pref.title}</p>
                        <p className="text-xs text-paw-text-muted">{pref.desc}</p>
                      </div>
                      <button
                        className={`w-12 h-6 rounded-full transition-colors relative ${notifications[pref.key] ? 'bg-paw-orange' : 'bg-gray-300'}`}
                        onClick={() => setNotifications({ ...notifications, [pref.key]: !notifications[pref.key] })}
                        id={`toggle-${pref.key}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications[pref.key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-paw-text-muted mt-3 pt-3 border-t border-[#E7E5E4]">
                  Değişiklikler anında kaydedilir · Gönder butonu gerekmez
                </p>
              </div>
            </div>

            {/* Duraklat Paneli */}
            {showPause && (
              <div className="w-72 shrink-0 animate-slide-in">
                <div className="card border-2 border-paw-orange/30 sticky top-20">
                  <h3 className="text-base font-bold font-display text-paw-text text-center mb-3">⏸ Üyeliğinizi Duraklatın</h3>
                  <p className="text-xs text-paw-text-muted text-center mb-4">Ne kadar süre duraklatmak istiyorsunuz?</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button className={`py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                      pauseMonths === 1 ? 'border-paw-orange text-paw-orange bg-paw-orange-light' : 'border-[#E7E5E4] text-paw-text-secondary hover:border-paw-text-muted'
                    }`} onClick={() => setPauseMonths(1)}>1 Ay</button>
                    <button className={`py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                      pauseMonths === 2 ? 'border-paw-orange text-paw-orange bg-paw-orange-light' : 'border-[#E7E5E4] text-paw-text-secondary hover:border-paw-text-muted'
                    }`} onClick={() => setPauseMonths(2)}>2 Ay</button>
                  </div>
                  <div className="bg-[#F5F5F4] rounded-xl p-3 mb-4">
                    <p className="text-xs font-semibold text-paw-text mb-1">🛡️ Verilerinize ne olur?</p>
                    <p className="text-[10px] text-paw-text-muted leading-relaxed">
                      Duraklatma: AI profili ve pet verileri korunur.<br/>
                      İptal: tüm kayıtlar kalıcı olarak silinir.
                    </p>
                  </div>
                  <p className="text-xs text-paw-orange font-semibold text-center mb-3">
                    Devam tarihi: 15 Mayıs 2026
                  </p>
                  <button className="btn-primary w-full mb-2" id="confirm-pause-btn">Duraklatmayı Onayla</button>
                  <button className="btn-ghost w-full text-xs" onClick={() => setShowPause(false)}>İptal · Geri dön</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
