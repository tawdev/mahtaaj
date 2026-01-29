import React from 'react';
import { useTranslation } from 'react-i18next';
import { LuBuilding, LuTarget, LuSparkles, LuUsers, LuLeaf, LuPhone, LuMail, LuClock } from 'react-icons/lu';
import './Info.css';

export default function Info() {
  const { t } = useTranslation();

  const sections = [
    {
      id: 'history',
      icon: LuBuilding,
      title: t('info.sections.history.title', 'Notre Histoire'),
      content: t('info.sections.history.content', 'Fondée avec passion, Mahtaaj est devenue une référence en services à domicile.'),
      image: '/info-history.png',
      imageAlt: 'Histoire de Mahtaaj'
    },
    {
      id: 'mission',
      icon: LuTarget,
      title: t('info.sections.mission.title', 'Notre Mission'),
      content: t('info.sections.mission.content', 'Fournir des services exceptionnels qui améliorent votre qualité de vie.'),
      image: '/info-mission.png',
      imageAlt: 'Mission de Mahtaaj'
    },
    {
      id: 'values',
      icon: LuSparkles,
      title: t('info.sections.values.title', 'Nos Valeurs'),
      content: (
        <ul className="values-list">
          <li><strong>{t('info.sections.values.quality', 'Qualité')}:</strong> {t('info.sections.values.quality_desc', 'Service irréprochable')}</li>
          <li><strong>{t('info.sections.values.reliability', 'Fiabilité')}:</strong> {t('info.sections.values.reliability_desc', 'Équipe de confiance')}</li>
          <li><strong>{t('info.sections.values.ecology', 'Écologie')}:</strong> {t('info.sections.values.ecology_desc', 'Respect de l\'environnement')}</li>
          <li><strong>{t('info.sections.values.innovation', 'Innovation')}:</strong> {t('info.sections.values.innovation_desc', 'Meilleures pratiques')}</li>
        </ul>
      ),
      image: '/info-values.png',
      imageAlt: 'Valeurs de Mahtaaj'
    },
    {
      id: 'team',
      icon: LuUsers,
      title: t('info.sections.team.title', 'Notre Équipe'),
      content: t('info.sections.team.content', 'Professionnels qualifiés et passionnés par le service.'),
      image: '/info-team.png',
      imageAlt: 'Équipe Mahtaaj'
    },
    {
      id: 'ecology',
      icon: LuLeaf,
      title: t('info.sections.ecology.title', 'Engagement Écologique'),
      content: t('info.sections.ecology.content', 'Produits éco-responsables et pratiques durables.'),
      image: '/info-ecology.png',
      imageAlt: 'Engagement écologique'
    },
    {
      id: 'contact',
      icon: LuPhone,
      title: t('info.sections.contact.title', 'Contact'),
      content: (
        <div className="contact-info-grid">
          <div className="contact-info-item">
            <LuPhone className="contact-icon-small" />
            <a href="tel:+212524308038">+212 524 30 80 38</a>
          </div>
          <div className="contact-info-item">
            <LuMail className="contact-icon-small" />
            <a href="mailto:contact@mahtaaj.com">contact@mahtaaj.com</a>
          </div>
          <div className="contact-info-item">
            <LuClock className="contact-icon-small" />
            <span>Lun-Sam: 09:00 - 18:00</span>
          </div>
        </div>
      ),
      image: '/galerie/p1.jpg',
      imageAlt: 'Contactez-nous'
    }
  ];

  return (
    <div className="info-page-alt">
      <div className="info-container-alt">
        <header className="info-header-alt" data-aos="fade-up">
          <h1 className="info-title-alt">{t('info.title', 'À Propos de Nous')}</h1>
          <p className="info-subtitle-alt">
            {t('info.subtitle', 'Découvrez notre histoire, mission et valeurs')}
          </p>
        </header>

        <main className="info-sections-alt">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isReversed = index % 2 !== 0;

            return (
              <section
                key={section.id}
                className={`info-row ${isReversed ? 'info-row-reversed' : ''}`}
                data-aos="fade-up"
                data-aos-delay={100 * (index + 1)}
              >
                <div className="info-card-alt">
                  <div className="info-card-header-alt">
                    <div className="info-icon-alt">
                      <Icon />
                    </div>
                    <h2>{section.title}</h2>
                  </div>
                  <div className="info-card-content-alt">
                    {typeof section.content === 'string' ? <p>{section.content}</p> : section.content}
                  </div>
                </div>

                <div className="info-image-container">
                  <img
                    src={section.image}
                    alt={section.imageAlt}
                    className="info-section-image"
                    loading="lazy"
                  />
                </div>
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
}
