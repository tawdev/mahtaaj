import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LuArrowRight, LuCalendar } from 'react-icons/lu';
import SEO from '../components/SEO';
import { blogPosts } from '../data/blogData';
import './Blog.css';

export default function Blog() {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const currentLang = i18n.language.split('-')[0]; // Handle cases like 'fr-FR'

    const getTranslatedContent = (post) => {
        return post.translations[currentLang] || post.translations['fr'] || post.translations['en'];
    };

    return (
        <div className={`blog-page ${isRTL ? 'rtl' : ''}`}>
            <SEO
                title={t('blog.header_title')}
                description={t('blog.header_subtitle')}
            />

            <div className="blog-container">
                <header className="blog-header">
                    <h1>{t('blog.header_title')}</h1>
                    <p>{t('blog.header_subtitle')}</p>
                </header>

                {/* Featured Post (Post 1) */}
                {blogPosts.length > 0 && (() => {
                    const content = getTranslatedContent(blogPosts[0]);
                    return (
                        <div className="featured-post">
                            <div className="featured-image-container">
                                <img src={blogPosts[0].image} alt={content.title} />
                            </div>
                            <div className="featured-content">
                                <span className="post-category">{content.category}</span>
                                <h2>{content.title}</h2>
                                <p>{content.description}</p>
                                <Link to={`/blog/${blogPosts[0].slug}`} className="read-more">
                                    {t('blog.read_more')} <LuArrowRight />
                                </Link>
                            </div>
                        </div>
                    );
                })()}

                {/* Blog Grid */}
                <div className="blog-grid">
                    {blogPosts.slice(1).map((post) => {
                        const content = getTranslatedContent(post);
                        return (
                            <div key={post.id} className="blog-card">
                                <div className="card-image">
                                    <img src={post.image} alt={content.title} />
                                </div>
                                <div className="card-content">
                                    <span className="post-category">{content.category}</span>
                                    <h3>{content.title}</h3>
                                    <p>{content.description}</p>
                                    <div className="card-footer">
                                        <span className="post-date">
                                            <LuCalendar size={14} style={{ [isRTL ? 'marginLeft' : 'marginRight']: '4px' }} />
                                            {post.date}
                                        </span>
                                        <Link to={`/blog/${post.slug}`} className="read-more">
                                            {t('blog.read')} <LuArrowRight />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
