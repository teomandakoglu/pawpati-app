import React from 'react';
import { Link } from 'react-router-dom';

const STEPS = [
  { num: '1', title: 'Evcil hayvanınız hakkında 6 soru cevaplayın', desc: 'Tür · Irk · Yaş · Kilo · Rahatsızlıklar · Alerjiler', bg: 'bg-paw-orange', text: 'text-white' },
  { num: '2', title: 'AI kişiselleştirilmiş kutunuzu oluşturur', desc: 'Veteriner onaylı öneriler, saniyeler içinde', bg: 'bg-paw-bg-muted', text: 'text-paw-text' },
  { num: '3', title: 'Her ay kapınıza teslim edilir', desc: 'Ücretsiz kargo · Akıllı sağlık takvimi dahil', bg: 'bg-paw-teal-light', text: 'text-paw-teal' },
];

const SAMPLE_BOXES = [
  {
    title: 'Kişiselleştirilmiş Kutu — Orta Boy Köpek',
    items: 'Mama · Omega-3 · Parazit tedavisi · Diş bakım çubuğu',
    price: '₺ 1.199',
    rating: '4.9',
    reviews: '2.140',
    color: 'border-paw-orange',
    accent: 'text-paw-orange',
  },
  {
    title: 'Kişiselleştirilmiş Kutu — Yetişkin Kedi',
    items: 'Yaş mama · Tüy yumağı kontrolü · Pire tedavisi · Oyuncak',
    price: '₺ 999',
    rating: '4.8',
    reviews: '1.872',
    color: 'border-paw-green',
    accent: 'text-paw-green',
  },
  {
    title: 'Kişiselleştirilmiş Kutu — Yavru',
    items: 'Yavru maması · Büyüme takviyesi · Aşı desteği',
    price: '₺ 1.249',
    rating: '4.7',
    reviews: '934',
    color: 'border-paw-teal',
    accent: 'text-paw-teal',
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="hero">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <p className="text-xs font-semibold tracking-widest text-paw-orange uppercase mb-4">
              AI DESTEKLİ · VETERİNER ONAYLI · AYLIK TESLİMAT
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-paw-text leading-tight mb-6">
              Evcil hayvanınız sıradan bir kutudan daha iyisini hak eder.
            </h1>
            <p className="text-paw-text-secondary text-base leading-relaxed mb-8 max-w-lg">
              6 soruyu cevaplayın. AI'mız lisanslı veterinerler tarafından onaylanan kişiselleştirilmiş bir abonelik kutusu oluşturur.
            </p>
            <Link to="/quiz" className="btn-primary btn-lg" id="hero-cta-quiz">
              🐾 AI Quiz'i Başlat
            </Link>
            <p className="text-xs text-paw-text-muted mt-3">Ücretsiz · 90 saniye · İstediğiniz zaman iptal</p>
          </div>

          {/* Hero Image */}
          <div className="hidden lg:flex justify-center animate-fade-in">
            <div className="relative w-full max-w-md">
              <img
                src="/hero-lifestyle.png"
                alt="Evcil hayvan sahibi ve köpek"
                className="w-full h-80 object-cover rounded-3xl shadow-lg border border-[#E7E5E4]"
              />
              {/* Floating badge */}
              <div className="absolute -bottom-3 -left-3 glass-card !p-2.5 !rounded-xl shadow-md">
                <div className="flex items-center gap-2">
                  <span className="text-paw-green text-sm">✓</span>
                  <span className="text-xs font-semibold text-paw-text">AI Sağlık Skoru: 94%</span>
                </div>
              </div>
              <div className="absolute -top-3 -right-3 glass-card !p-2.5 !rounded-xl shadow-md">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📦</span>
                  <span className="text-xs font-semibold text-paw-text">Kutunuz Hazırlanıyor</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== NASIL ÇALIŞIR ===== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="nasil-calisir">
        <div className="section-header">
          <h2>Nasıl Çalışır?</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {STEPS.map((step, i) => (
            <div key={i} className={`${step.bg} rounded-2xl p-6 ${step.text} transition-transform hover:scale-[1.02]`}>
              <p className="font-bold text-lg mb-2">{step.num} — {step.title}</p>
              <p className={`text-sm ${step.text === 'text-white' ? 'text-white/80' : 'text-paw-text-secondary'}`}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== VETERİNER GÜVEN BARI ===== */}
      <section className="py-8 px-4 text-center" id="veteriner">
        <p className="text-sm font-semibold text-paw-green mb-2">
          Lisanslı veterinerler tarafından incelendi ve onaylandı
        </p>
        <p className="text-xs text-paw-text-muted">
          [ Partner klinik logoları ] · Türkiye genelinde 142 partner veteriner kliniği
        </p>
      </section>

      {/* ===== ÖRNEK KUTULAR ===== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="kutular">
        <div className="section-header">
          <h2>Örnek Kutular</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {SAMPLE_BOXES.map((box, i) => (
            <div key={i} className={`card border-2 ${box.color} text-center hover:shadow-lg transition-shadow`}>
              <h3 className={`font-bold font-display ${box.accent} mb-2`}>🐾 {box.title}</h3>
              <p className="text-xs text-paw-text-muted mb-4">{box.items}</p>
              <p className={`text-2xl font-bold font-display ${box.accent} mb-1`}>
                {box.price} <span className="text-sm font-normal text-paw-text-muted">/ ay'dan</span>
              </p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <span className="text-yellow-500 text-xs">{'★'.repeat(5)}</span>
                <span className="text-xs text-paw-text-muted">{box.rating} · {box.reviews} değerlendirme</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 px-4" id="yorumlar">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card !p-10 border-2 border-paw-orange/20 bg-paw-orange-light/30">
            <h2 className="text-2xl font-bold font-display text-paw-text mb-3">Başlamaya hazır mısınız?</h2>
            <p className="text-paw-text-secondary mb-6">
              6 soruluk quiz ile evcil hayvanınızın kişiselleştirilmiş sağlık profilini oluşturun.
            </p>
            <Link to="/quiz" className="btn-primary btn-lg">🐾 AI Quiz'i Başlat</Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-[#E7E5E4] py-10 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="/logo.png" alt="PawPati" className="h-7" />
                <span className="font-bold font-display text-paw-orange">Pawpati</span>
              </div>
              <p className="text-paw-text-muted text-xs leading-relaxed">AI destekli evcil hayvan bakım platformu.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3 text-paw-text">Platform</h4>
              <div className="space-y-2">
                <a href="/quiz" className="block text-paw-text-muted hover:text-paw-text text-xs transition-colors">AI Quiz</a>
                <a href="/dashboard" className="block text-paw-text-muted hover:text-paw-text text-xs transition-colors">Kontrol Paneli</a>
                <a href="/health-calendar" className="block text-paw-text-muted hover:text-paw-text text-xs transition-colors">Sağlık Takvimi</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3 text-paw-text">Destek</h4>
              <div className="space-y-2">
                <a href="#" className="block text-paw-text-muted hover:text-paw-text text-xs transition-colors">SSS</a>
                <a href="#" className="block text-paw-text-muted hover:text-paw-text text-xs transition-colors">İletişim</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3 text-paw-text">Yasal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-paw-text-muted hover:text-paw-text text-xs transition-colors">KVKK</a>
                <a href="#" className="block text-paw-text-muted hover:text-paw-text text-xs transition-colors">Gizlilik Politikası</a>
                <a href="#" className="block text-paw-text-muted hover:text-paw-text text-xs transition-colors">Kullanım Koşulları</a>
              </div>
            </div>
          </div>
          <div className="border-t border-[#E7E5E4] pt-6 text-center text-paw-text-muted text-xs">
            © 2026 PawPati. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
}
