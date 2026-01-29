import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LuArrowLeft, LuCalendar, LuUser, LuClock } from 'react-icons/lu';
import SEO from '../components/SEO';
import { blogPosts } from '../data/blogData';
import './Blog.css';

export default function BlogPost() {
    const { slug } = useParams();
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const currentLang = i18n.language.split('-')[0];

    // Find post content based on slug
    const post = blogPosts.find(p => p.slug === slug);

    // Fallback if post not found
    if (!post) {
        return (
            <div className="blog-page" style={{ paddingTop: '150px', textAlign: 'center' }}>
                <h2>{t('blog.not_found')}</h2>
                <Link to="/blog">{t('blog.back_to_blog')}</Link>
            </div>
        );
    }

    const content = post.translations[currentLang] || post.translations['fr'] || post.translations['en'];

    // Get related posts (exclude current)
    const relatedPosts = blogPosts.filter(p => p.slug !== slug).slice(0, 2);

    return (
        <div className={`blog-post-page ${isRTL ? 'rtl' : ''}`}>
            <SEO
                title={content.title}
                description={content.description}
                image={post.image}
                type="article"
            />

            <div className="blog-container post-view">
                <Link to="/blog" className="back-to-blog">
                    <LuArrowLeft /> {t('blog.back_to_blog')}
                </Link>

                <article className="post-article">
                    <header className="post-header">
                        <h1 className="post-title">{content.title}</h1>
                        <div className="post-meta">
                            <span><LuCalendar size={16} /> {post.date}</span>
                            <span><LuUser size={16} /> {content.author}</span>
                            <span><LuClock size={16} /> {content.readTime}</span>
                        </div>
                    </header>

                    <div className="post-hero-image">
                        <img src={post.image} alt={content.title} />
                    </div>

                    <div
                        className="post-body"
                        dangerouslySetInnerHTML={{ __html: content.content }}
                    />

                    <footer className="post-footer">
                        <div className="related-title">
                            <h3>{t('blog.related_posts')}</h3>
                        </div>
                        <div className="related-grid">
                            {relatedPosts.map(related => {
                                const relatedContent = related.translations[currentLang] || related.translations['fr'] || related.translations['en'];
                                return (
                                    <Link key={related.id} to={`/blog/${related.slug}`} className="related-item">
                                        <div className="related-img">
                                            <img src={related.image} alt={relatedContent.title} />
                                        </div>
                                        <div className="related-info">
                                            <h4>{relatedContent.title}</h4>
                                            <span>{related.date}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </footer>
                </article>
            </div>

            <style>{`
        .blog-post-page { padding-top: 100px; background: #fff; min-height: 100vh; }
        .post-view { max-width: 850px; }
        .back-to-blog { display: flex; align-items: center; gap: 8px; color: #64748b; text-decoration: none; font-weight: 500; margin-bottom: 32px; transition: color 0.2s; }
        .back-to-blog:hover { color: #2563eb; }
        .post-title { font-size: 2.8rem; font-weight: 800; color: #0f172a; margin-bottom: 24px; line-height: 1.2; letter-spacing: -0.02em; }
        .post-meta { display: flex; gap: 24px; color: #64748b; font-size: 0.95rem; margin-bottom: 40px; flex-wrap: wrap; }
        .post-meta span { display: flex; align-items: center; gap: 6px; }
        .post-hero-image { width: 100%; border-radius: 24px; overflow: hidden; margin-bottom: 48px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .post-hero-image img { width: 100%; height: auto; display: block; }
        .post-body { font-size: 1.25rem; line-height: 1.8; color: #334155; }
        .post-body h3 { font-size: 1.7rem; color: #0f172a; margin: 48px 0 20px; font-weight: 700; }
        .post-body p { margin-bottom: 24px; }
        .post-body blockquote { border-left: 4px solid #2563eb; padding: 10px 0 10px 24px; font-style: italic; font-size: 1.4rem; color: #1e293b; margin: 48px 0; background: #f8fafc; border-radius: 0 12px 12px 0; }
        
        .post-footer { margin-top: 80px; padding-top: 48px; border-top: 1px solid #f1f5f9; }
        .related-title h3 { font-size: 1.5rem; color: #0f172a; margin-bottom: 32px; }
        .related-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .related-item { display: flex; gap: 16px; text-decoration: none; color: inherit; padding: 12px; border-radius: 16px; transition: background 0.2s; }
        .related-item:hover { background: #f8fafc; }
        .related-img { width: 100px; height: 100px; border-radius: 12px; overflow: hidden; flex-shrink: 0; }
        .related-img img { width: 100%; height: auto; object-fit: cover; }
        .related-info h4 { font-size: 1rem; color: #0f172a; margin-bottom: 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .related-info span { font-size: 0.85rem; color: #94a3b8; }

        .blog-post-page.rtl { direction: rtl; }
        .blog-post-page.rtl .back-to-blog svg { transform: rotate(180deg); }
        .blog-post-page.rtl .post-body blockquote { border-left: none; border-right: 4px solid #2563eb; padding-left: 0; padding-right: 24px; border-radius: 12px 0 0 12px; }
        
        @media (max-width: 768px) {
          .post-title { font-size: 2rem; }
          .related-grid { grid-template-columns: 1fr; }
          .post-meta { gap: 12px; }
        }
      `}</style>
        </div>
    );
}
