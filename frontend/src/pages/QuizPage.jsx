import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const quizQuestions = [
  {
    question: 'Evcil hayvanınızın türü nedir?',
    subtitle: 'AI profiliniz türe göre optimize edilecek',
    options: [
      { emoji: '🐕', label: 'Köpek' },
      { emoji: '🐈', label: 'Kedi' },
      { emoji: '🐹', label: 'Hamster' },
      { emoji: '🐾', label: 'Diğer' },
    ],
  },
  {
    question: 'Yaşı kaç?',
    subtitle: 'Yaşa göre beslenme ve bakım ihtiyaçları değişir',
    options: [
      { emoji: '🍼', label: '0-1 yaş (Yavru)' },
      { emoji: '🌱', label: '1-3 yaş (Genç)' },
      { emoji: '💪', label: '3-7 yaş (Yetişkin)' },
      { emoji: '🧓', label: '7+ yaş (Yaşlı)' },
    ],
  },
  {
    question: 'Ağırlığı yaklaşık ne kadar?',
    subtitle: 'Porsiyon ve ürün dozajları için önemli',
    options: [
      { emoji: '🐁', label: '0-5 kg' },
      { emoji: '🐕‍🦺', label: '5-15 kg' },
      { emoji: '🦮', label: '15-30 kg' },
      { emoji: '🐘', label: '30+ kg' },
    ],
  },
  {
    question: 'Aktivite seviyesi nasıl?',
    subtitle: 'Enerji ihtiyacını belirlemek için',
    options: [
      { emoji: '🛋️', label: 'Düşük - Sakin' },
      { emoji: '🚶', label: 'Orta - Normal' },
      { emoji: '🏃', label: 'Yüksek - Aktif' },
      { emoji: '⚡', label: 'Çok Yüksek' },
    ],
  },
  {
    question: 'Bilinen alerjisi var mı?',
    subtitle: 'Güvenli ürün seçimi için kritik bilgi',
    options: [
      { emoji: '✅', label: 'Bilinen alerji yok' },
      { emoji: '🍗', label: 'Tavuk proteini' },
      { emoji: '🌾', label: 'Tahıl alerjisi' },
      { emoji: '❓', label: 'Diğer / Emin değilim' },
    ],
  },
  {
    question: 'En önem verdiğiniz konu?',
    subtitle: 'AI önerilerini önceliklendirelim',
    options: [
      { emoji: '🦴', label: 'Eklem & Kemik' },
      { emoji: '✨', label: 'Tüy & Cilt' },
      { emoji: '🦷', label: 'Ağız & Diş' },
      { emoji: '💪', label: 'Genel Bağışıklık' },
    ],
  },
];

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(Array(6).fill(null));
  const navigate = useNavigate();

  const selectOption = (i) => { const a = [...answers]; a[step] = i; setAnswers(a); };
  const next = () => { if (step < 5) setStep(step + 1); else navigate('/dashboard'); };
  const prev = () => { if (step > 0) setStep(step - 1); };

  const q = quizQuestions[step];
  const progress = ((step + 1) / 6) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-paw-text-muted">Soru {step + 1} / 6</span>
            <span className="text-xs text-paw-orange font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-paw-bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-paw-orange rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Card */}
        <div className="card !p-8 animate-fade-in" key={step}>
          <h2 className="text-xl font-bold font-display text-paw-text mb-1">{q.question}</h2>
          <p className="text-sm text-paw-text-muted mb-6">{q.subtitle}</p>

          <div className="grid grid-cols-2 gap-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                className={`p-4 rounded-xl border text-left transition-all group ${
                  answers[step] === i
                    ? 'bg-paw-orange-light border-paw-orange ring-2 ring-paw-orange/20'
                    : 'bg-white border-paw-border hover:border-paw-text-muted/40 hover:bg-paw-bg-muted'
                }`}
                onClick={() => selectOption(i)}
                id={`quiz-option-${step}-${i}`}
              >
                <span className="text-2xl block mb-1 group-hover:scale-110 transition-transform">{opt.emoji}</span>
                <span className={`text-sm font-medium ${answers[step] === i ? 'text-paw-orange' : 'text-paw-text-secondary'}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex justify-between mt-6 pt-5 border-t border-paw-border">
            <button className="btn-ghost" onClick={prev} disabled={step === 0} style={{ opacity: step === 0 ? 0.3 : 1 }}>
              ← Geri
            </button>
            <button
              className="btn-primary"
              onClick={next}
              disabled={answers[step] === null}
              style={{ opacity: answers[step] === null ? 0.4 : 1 }}
              id="quiz-next-btn"
            >
              {step === 5 ? '🐾 Profilimi Oluştur' : 'Devam →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
