import React from 'react';
import { useTranslation } from 'react-i18next';
import './registerEmployee1.css';
import { Link } from 'react-router-dom';

const cards = (t) => ([
  { to: '/employees/register/clean', icon: '🧹', title: t('nav.house_keeping','Housekeeping') },
  { to: '/employees/register/security', icon: '🛡️', title: t('nav.security','Security') },
  { to: '/employees/register/bebe-setting', icon: '👶', title: t('nav.baby_setting','Bébé Setting') },
  { to: '/employees/register/jardinage', icon: '🌿', title: t('nav.gardening','Jardinage') },
  { to: '/employees/register/handworker', icon: '🛠️', title: t('nav.hand_workers','Hand Workers') },
]);

export default function RegisterEmployee1() {
  const { t, i18n } = useTranslation();
  return (
    <main className="re1-page py-12" dir={(i18n.language || '').startsWith('ar') ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto px-4">
        <header className="re1-header mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800">{t('employees.landing.title','Register as Employee')}</h1>
          <p className="mt-2 text-slate-500">{t('employees.landing.subtitle','Choose a department to start your application')}</p>
        </header>

        <section className="re1-grid">
          {cards(t).map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="re1-card group block p-6 shadow-md"
            >
              <div className="re1-card-inner">
                <div className="re1-icon mb-4">
                  <span aria-hidden>{c.icon}</span>
                </div>
                <div className="re1-card-text-wrap" style={{textAlign:'center'}}>
                  <h3 className="re1-card-title">{c.title}</h3>
                  {/* Optional short description slot if needed */}
                </div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}


