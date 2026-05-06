import React from 'react';
import { Link } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Ana Sayfa', icon: '🏠' },
  { path: '/dashboard', label: 'Pet Profilim', icon: '🐾' },
  { path: '/health-calendar', label: 'Sağlık Takvimi', icon: '🗓️' },
  { path: '/health-calendar', label: 'Veteriner Bul', icon: '📍' },
  { path: '/subscription', label: 'Hesabım', icon: '👤' },
];

export default function Sidebar({ activePage, petName = 'Nova' }) {
  return (
    <aside className="w-56 shrink-0 hidden lg:block">
      <div className="sticky top-20 space-y-4">
        <div className="glass-card text-center !p-4">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-paw-orange-light to-paw-green-light border border-[#E7E5E4] flex items-center justify-center text-3xl">
            🐕
          </div>
          <h3 className="font-bold font-display text-paw-text">{petName}</h3>
          <p className="text-xs text-paw-text-muted mt-0.5">Erkek · 3 yaş · 4.2 kg</p>
        </div>

        <div className="space-y-1">
          {NAV_ITEMS.map((item, i) => (
            <Link key={i} to={item.path}
              className={activePage === item.label ? 'sidebar-link-active' : 'sidebar-link'}
              id={`sidebar-${item.label.toLowerCase().replace(/\s/g, '-')}`}>
              <span className="mr-2">{item.icon}</span>{item.label}
            </Link>
          ))}
        </div>

        <div className="glass-card !p-3 text-center">
          <div className="badge badge-success mb-2">✓ Sorumlu Evcil Hayvan Sahibi</div>
          <p className="text-[10px] text-paw-text-muted">Sağlık verileri doğrulandı</p>
        </div>

        <button className="btn-primary w-full text-xs" id="sidebar-ocr-btn">📸 OCR ile Güncelle</button>
      </div>
    </aside>
  );
}
