import React from 'react';

const UPSELL_PRODUCTS = [
  { id: 1, icon: '🥩', name: 'Organik Kurutulmuş Et', desc: 'Protein takviyesi - 100g', price: '₺49', tag: 'AI Önerisi' },
  { id: 2, icon: '🧸', name: 'Diş Temizleme Oyuncağı', desc: 'Doğal kauçuk, dayanıklı', price: '₺39', tag: 'Popüler' },
  { id: 3, icon: '💊', name: 'Omega-3 Balık Yağı', desc: 'Tüy & cilt sağlığı 60 kapsül', price: '₺79', tag: 'Sağlık' },
  { id: 4, icon: '🦴', name: 'Doğal Kemik Çubuk', desc: 'Kalsiyum takviyeli 5\'li paket', price: '₺29', tag: 'Ekonomik' },
];

export default function UpsellModal({ isOpen, onClose, onAdd }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="upsell-modal">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white border border-paw-border rounded-2xl shadow-2xl animate-fade-in-up">
        <div className="p-5 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <span className="badge badge-warning mb-2">⏰ Kargo Ücretsiz</span>
              <h3 className="text-lg font-bold font-display text-paw-text">Kutunuz Paketleniyor</h3>
              <p className="text-xs text-paw-text-muted mt-1">Kargonuz ücretsizken ek ürünler ekleyin — AI profilinize göre seçildi</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-paw-bg-muted text-paw-text-muted hover:text-paw-text transition-colors" id="upsell-close-btn">✕</button>
          </div>
        </div>
        <div className="p-5 space-y-2.5 max-h-72 overflow-y-auto">
          {UPSELL_PRODUCTS.map(product => (
            <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl bg-paw-bg-muted/50 border border-paw-border/50 hover:bg-paw-bg-muted transition-all group">
              <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">{product.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-paw-text">{product.name}</span>
                  <span className="badge badge-orange !text-[9px] !px-1.5 !py-0">{product.tag}</span>
                </div>
                <p className="text-[10px] text-paw-text-muted">{product.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-paw-orange">{product.price}</div>
                <button className="mt-1 text-[10px] bg-paw-orange-light hover:bg-paw-orange/10 text-paw-orange border border-paw-orange-border/40 px-2.5 py-1 rounded-lg transition-colors font-medium"
                  onClick={() => onAdd(product)} id={`upsell-add-${product.id}`}>
                  + Ekle
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-5 pt-0 flex gap-3">
          <button className="btn-ghost flex-1 text-xs border border-paw-border" onClick={onClose}>Geç</button>
          <button className="btn-primary flex-1 text-xs" onClick={onClose} id="upsell-confirm-btn">✓ Siparişi Onayla</button>
        </div>
      </div>
    </div>
  );
}
