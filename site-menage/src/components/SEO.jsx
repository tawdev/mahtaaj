import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

/**
 * SEO Component to dynamically update document title and meta tags.
 * Optimized for mahtaaj.com production domain.
 */
const SEO = ({ title, description, image, type = 'website', keywords }) => {
    const { i18n } = useTranslation();
    const location = useLocation();
    const baseDomain = 'https://www.mahtaaj.com';
    const baseTitle = 'mahtaaj';
    const fullTitle = title ? `${title} | ${baseTitle}` : baseTitle;
    const currentUrl = `${baseDomain}${location.pathname}`;

    useEffect(() => {
        // 1. Update Document Title
        document.title = fullTitle;

        // 2. Language & Direction
        const isRTL = i18n.language === 'ar';
        document.documentElement.lang = i18n.language;
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';

        // 3. Helper to update/create meta tags
        const updateMeta = (selector, attrName, attrValue, content) => {
            if (!content) return;
            let el = document.querySelector(selector);
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute(attrName, attrValue);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };

        // 4. Standard Meta Tags
        const defaultDesc = 'Service de nettoyage professionnel au Maroc - Mahtaaj. Propreté, Sécurité et Qualité.';
        updateMeta('meta[name="description"]', 'name', 'description', description || defaultDesc);
        updateMeta('meta[name="keywords"]', 'name', 'keywords', keywords || 'nettoyage Maroc, sécurité Rabat, jardinage, chauffeur privé, mahtaaj');

        // 5. Canonical Link
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', currentUrl);

        // 6. OpenGraph Tags (Facebook/Instagram)
        const ogTags = {
            'og:title': fullTitle,
            'og:description': description || defaultDesc,
            'og:type': type,
            'og:url': currentUrl,
            'og:image': image || `${baseDomain}/galerie/logooomahtaaj.png`,
            'og:locale': i18n.language === 'ar' ? 'ar_MA' : (i18n.language === 'en' ? 'en_US' : 'fr_FR'),
            'og:site_name': 'mahtaaj'
        };

        Object.entries(ogTags).forEach(([property, content]) => {
            updateMeta(`meta[property="${property}"]`, 'property', property, content);
        });

        // 7. Twitter Card Tags
        const twitterTags = {
            'twitter:card': 'summary_large_image',
            'twitter:title': fullTitle,
            'twitter:description': description || defaultDesc,
            'twitter:image': image || `${baseDomain}/galerie/logooomahtaaj.png`
        };

        Object.entries(twitterTags).forEach(([name, content]) => {
            updateMeta(`meta[name="${name}"]`, 'name', name, content);
        });

        // 8. Hreflang Tags (for multi-language indexing)
        const languages = ['ar', 'fr', 'en'];
        languages.forEach(lang => {
            let link = document.querySelector(`link[hreflang="${lang}"]`);
            if (!link) {
                link = document.createElement('link');
                link.setAttribute('rel', 'alternate');
                link.setAttribute('hreflang', lang);
                document.head.appendChild(link);
            }
            // In a simple setup we assume full mirror of paths
            link.setAttribute('href', currentUrl);
        });

    }, [fullTitle, description, image, type, keywords, i18n.language, currentUrl]);

    return null;
};

export default SEO;
