import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ShipmentTracker from '../components/ShipmentTracker';
import UpsellModal from '../components/UpsellModal';

const BOX_ITEMS = [
  { icon: '💊', name: 'Eklem Destek Plus', desc: 'Eklem desteği - Glukozamin & Kondroitin', applied: false },
  { icon: '🦴', name: 'Diş Bakım Çubukları', desc: 'Diş bakım çubukları - Doğal', applied: true },
  { icon: '🧴', name: 'Tüy Parlatıcı Şampuan', desc: 'Omega-3 zengin, hipoalerjenik', applied: false },
  { icon: '🥩', name: 'Organik Kurutulmuş Et', desc: 'Protein takviyesi - 100g', applied: false },
];

const NEARBY_VETS = [
  { name: 'PawPati Partner - VetLife', distance: '1.2', partner: true, emergency: false },
  { name: 'Happy Paws Klinik', distance: '2.8', partner: true, emergency: true },
  { name: 'Dr. Ayşe Veteriner', distance: '3.5', partner: false, emergency: false },
];

export default function Dashboard() {
  const [items, setItems] = useState(BOX_ITEMS);
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellDismissed, setUpsellDismissed] = useState(false);
  const [addedProducts, setAddedProducts] = useState([]);

  // TODO: auth verisi varsa kullanıcının pet ismiyle doldur
  const petName = 'Nova';
  const hoursToShipment = 36;
  const showUpsellBanner = hoursToShipment < 48 && !upsellDismissed;

  const applyTreatment = (index) => {
    const updated = [...items];
    updated[index] = { ...updated[index], applied: true };
    setItems(updated);
  };

  const handleAddProduct = (product) => {
    if (!addedProducts.find(p => p.id === product.id)) {
      setAddedProducts([...addedProducts, product]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex gap-6">
        <Sidebar activePage="Ana Sayfa" petName={petName} />

        <div className="flex-1 min-w-0 space-y-5">
          {/* Sonraki Kutu Banner */}
          <div className="bg-paw-orange text-white rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">📦 Sonraki Kutu: Kişiselleştirilmiş Kutu</p>
              <p className="text-xs text-white/80">Tahmini teslim: 14 Haz 2026 · Ücretsiz kargo</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">Paketleniyor</span>
          </div>

          {/* Cross-sell Banner */}
          {showUpsellBanner && (
            <div className="p-4 rounded-2xl bg-paw-orange-light border border-[#FDBA74]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in" id="upsell-banner">
              <div className="flex items-center gap-3">
                <span className="text-xl">📦</span>
                <div>
                  <p className="font-semibold text-sm text-paw-text">Kutunuz paketleniyor — kargonuz ücretsizken ek ürünler ekleyin!</p>
                  <p className="text-xs text-paw-text-muted">Sevkiyata {hoursToShipment} saat kaldı · AI profilinize göre seçildi</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="btn-primary btn-sm" onClick={() => setShowUpsell(true)} id="upsell-open-btn">🛒 Hızlı Ekle</button>
                <button className="btn-ghost btn-sm" onClick={() => setUpsellDismissed(true)}>Geç</button>
              </div>
            </div>
          )}

          {addedProducts.length > 0 && (
            <div className="p-3 rounded-xl bg-paw-green-light border border-[#6EE7B7]/40 flex items-center gap-3 animate-fade-in">
              <span className="text-paw-green">✓</span>
              <span className="text-sm text-paw-text">{addedProducts.length} ek ürün kutunuza eklendi</span>
              <div className="flex gap-1 ml-auto">{addedProducts.map(p => <span key={p.id} className="text-lg">{p.icon}</span>)}</div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-5">
            {/* Kargo Takibi */}
            <div className="card">
              <h3 className="font-bold font-display text-paw-text text-sm mb-1">🚚 Kargo Takibi</h3>
              <p className="text-xs text-paw-text-muted mb-5">Haziran 2026 kutusu</p>
              <ShipmentTracker currentStep={1} />
              <div className="mt-4 p-3 rounded-lg bg-paw-orange-light border border-[#FDBA74]/30">
                <p className="text-xs text-paw-text-secondary">
                  <span className="text-paw-orange font-medium">📦 Paketleniyor</span> — Tahmini teslim: 14 Haz 2026
                </p>
              </div>
            </div>

            {/* AI Sağlık Skoru */}
            <div className="card text-center">
              <h3 className="font-bold font-display text-paw-text text-sm mb-4">🧬 AI Sağlık Skoru</h3>
              <div className="relative w-28 h-28 mx-auto">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#F5F5F4" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#F97316" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${87 * 2.64} ${264 - 87 * 2.64}`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold font-display text-paw-orange">87</span>
                </div>
              </div>
              <p className="text-xs text-paw-text-muted mt-3">{petName} · Golden Retriever · 3 yaş</p>
              <div className="mt-3 flex justify-center gap-3 text-xs">
                <span className="badge badge-success">Tüyler ✓</span>
                <span className="badge badge-warning">Eklem ⚠</span>
              </div>
            </div>
          </div>

          {/* Veteriner & QR */}
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-bold font-display text-paw-text text-sm mb-3">🗺️ Yakınızdaki Veterinerler</h3>
              <div className="h-28 rounded-xl bg-[#F5F5F4] border border-[#E7E5E4] flex items-center justify-center text-3xl mb-3">📍</div>
              <div className="space-y-2">
                {NEARBY_VETS.map((vet, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F5F5F4] transition-colors">
                    <span className="text-sm">{vet.partner ? '⭐' : '📍'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-paw-text truncate">{vet.name}</div>
                      {vet.emergency && <span className="text-[10px] text-paw-danger font-medium">🚨 24 Saat Acil</span>}
                    </div>
                    <span className="text-[10px] text-paw-text-muted">{vet.distance} km</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <h3 className="font-bold font-display text-paw-text text-sm">🔲 PatiKalkan QR</h3>
              </div>
              <p className="text-xs text-paw-text-muted mb-3">Klinikte gösterin, %15 indirim kazanın</p>
              <div className="w-32 h-32 mx-auto rounded-2xl bg-[#F5F5F4] border border-[#E7E5E4] flex items-center justify-center mb-3" id="dynamic-qr-code">
                <div className="grid grid-cols-5 gap-0.5">
                  {Array(25).fill(0).map((_, i) => (
                    <div key={i} className={`w-4 h-4 rounded-sm ${[0,1,2,4,5,6,10,12,14,18,20,21,22,24].includes(i) ? 'bg-paw-text' : 'bg-transparent'}`} />
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Kutu İçeriği */}
          <div className="card">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold font-display text-paw-text text-sm">📦 Haziran Kutu İçeriği</h3>
              <span className="badge badge-success">Skor: 0.94</span>
            </div>
            <p className="text-xs text-paw-text-muted mb-4">AI tarafından {petName} için özel seçildi</p>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFAF9] border border-[#E7E5E4]/50 hover:bg-[#F5F5F4] transition-colors">
                  <span className="text-2xl shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-paw-text truncate">{item.name}</div>
                    <div className="text-xs text-paw-text-muted truncate">{item.desc}</div>
                  </div>
                  <div className="shrink-0">
                    {item.applied ? (
                      <span className="badge badge-success !text-[10px]">✓ Uygulandı</span>
                    ) : (
                      <button className="text-xs bg-paw-green-light hover:bg-paw-green/10 text-paw-green border border-[#6EE7B7]/40 px-3 py-1.5 rounded-lg transition-colors font-medium"
                        onClick={() => applyTreatment(i)} id={`apply-treatment-${i}`}>
                        Evet, Uygulandı
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <UpsellModal isOpen={showUpsell} onClose={() => setShowUpsell(false)} onAdd={handleAddProduct} />
    </div>
  );
}
