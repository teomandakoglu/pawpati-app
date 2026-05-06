import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const LANDING_LINKS = [
  { href: '/#nasil-calisir', label: 'Nasıl Çalışır?' },
  { href: '/#kutular', label: 'Örnek Kutular' },
  { href: '/#veteriner', label: 'Veteriner Ortakları' },
  { href: '/#yorumlar', label: 'Yorumlar' },
  { href: '/#fiyatlar', label: 'Fiyatlar' },
];

const INNER_LINKS = [
  { path: '/', label: 'Ana Sayfa' },
  { path: '/subscription', label: 'Aboneliğim' },
  { path: '/dashboard', label: 'Pet Profilim' },
  { path: '/health-calendar', label: 'Veteriner Bul' },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLanding = location.pathname === '/';

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E7E5E4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 shrink-0" id="nav-logo">
            <img src="/logo.png" alt="PawPati" className="h-8 w-auto" />
            <span className="text-lg font-bold font-display text-paw-orange hidden sm:block">Pawpati</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {(isLanding ? LANDING_LINKS : INNER_LINKS).map((item, i) => (
              <a key={i} href={item.href || item.path}
                className="px-3 py-1.5 rounded-lg text-sm text-paw-text-secondary hover:text-paw-text hover:bg-paw-bg-muted transition-colors">
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/quiz" className="btn-primary btn-sm" id="nav-cta">🐾 AI Quiz'i Başlat</Link>
            <button className="md:hidden p-2 rounded-lg hover:bg-paw-bg-muted" onClick={() => setMobileOpen(!mobileOpen)} id="mobile-menu-btn">
              <div className="w-5 flex flex-col gap-1">
                <span className={`h-0.5 bg-paw-text rounded transition-all ${mobileOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`h-0.5 bg-paw-text rounded transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
                <span className={`h-0.5 bg-paw-text rounded transition-all ${mobileOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className={`md:hidden transition-all duration-300 overflow-hidden ${mobileOpen ? 'max-h-80 border-t border-[#E7E5E4]' : 'max-h-0'}`}>
        <div className="px-4 py-3 space-y-1 bg-white">
          {(isLanding ? LANDING_LINKS : INNER_LINKS).map((item, i) => (
            <a key={i} href={item.href || item.path} onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm text-paw-text-secondary hover:bg-paw-bg-muted">{item.label}</a>
          ))}
        </div>
      </div>
    </nav>
  );
}
