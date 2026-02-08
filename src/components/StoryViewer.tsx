import { useState, useEffect, useCallback } from 'react';
import type { StoryViewerProps, Universe } from '../types';
import { API_BASE } from '../constants';
import { UNIVERSES } from './UniverseSelector';
import './StoryViewer.css';

export default function StoryViewer({ story, onClose }: StoryViewerProps) {
    const [currentPage, setCurrentPage] = useState(0); // 0 = cover, 1-5 = chapters
    const totalPages = story.parts.length + 1; // cover + chapters

    const getImageUrl = (imagePath: string | undefined): string | null => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
            return imagePath;
        }
        return `${API_BASE}${imagePath}`;
    };

    const getUniverse = (): Universe | undefined => {
        if (typeof story.universe === 'string') {
            return UNIVERSES.find(u => u.id === story.universe);
        }
        return story.universe as Universe;
    };

    const universe = getUniverse();

    const nextPage = useCallback(() => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(prev => prev + 1);
        }
    }, [currentPage, totalPages]);

    const prevPage = useCallback(() => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
        }
    }, [currentPage]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                nextPage();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                prevPage();
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [nextPage, prevPage, onClose]);

    // Prevent body scroll when viewer is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const renderFormattedText = (text: string) => {
        if (!text) return null;

        // Divide por quebras de linha e remove linhas vazias
        // Isso evita que \n\n crie um parágrafo vazio ou <br> extra somado à margem
        const paragraphs = text.split(/\n+/).filter(line => line.trim().length > 0);

        return paragraphs.map((line, lineIndex) => {
            // Processamento de **negrito** e *itálico*
            const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);

            return (
                <p key={lineIndex} className="story-paragraph">
                    {parts.map((part, partIndex) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
                        }
                        if (part.startsWith('*') && part.endsWith('*')) {
                            return <em key={partIndex}>{part.slice(1, -1)}</em>;
                        }
                        return part;
                    })}
                </p>
            );
        });
    };

    const renderCoverPage = () => (
        <div className="book-page cover-page-fullscreen">
            {/* Imagem de fundo fullscreen */}
            <div className="cover-fullscreen-bg">
                {story.images.capa ? (
                    <img
                        src={getImageUrl(story.images.capa) || ''}
                        alt={`Capa da história: ${story.title}`}
                    />
                ) : (
                    <div className="cover-no-image">
                        <span className="cover-placeholder" aria-hidden="true">📖</span>
                    </div>
                )}
            </div>

            {/* Overlay com gradiente escuro na parte inferior */}
            <div className="cover-overlay">
                <div className="cover-overlay-content">
                    <h2 className="cover-fullscreen-title">{story.title}</h2>
                    <div className="cover-fullscreen-meta">
                        <div className="meta-row">
                            <span className="meta-label">Personagens:</span>
                            <div className="character-badges">
                                {story.characters.map((char, idx) => (
                                    <span key={idx} className="character-badge">
                                        {typeof char === 'string' ? char : char.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                        {universe && (
                            <div className="meta-row">
                                <span className="meta-label">Universo:</span>
                                <span className="meta-value">
                                    {universe.emoji} {universe.name}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderChapterPage = (chapterIndex: number) => {
        const [text, imagePrompt] = story.parts[chapterIndex] || ['', ''];
        const imageKey = `parte_${chapterIndex + 1}`;
        const imageUrl = getImageUrl(story.images[imageKey]);

        return (
            <div className="book-page chapter-page">
                <div className="chapter-image-side">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={`Ilustração do capítulo ${chapterIndex + 1}`}
                        />
                    ) : (
                        <div className="chapter-no-image">
                            <span className="no-image-icon" aria-hidden="true">🎨</span>
                            <span className="no-image-text">Ilustração em breve</span>
                        </div>
                    )}
                </div>
                <div className="chapter-content-side">
                    <span className="chapter-number">
                        Capítulo {chapterIndex + 1} de {story.parts.length}
                    </span>
                    <div className="chapter-text-container">
                        {renderFormattedText(text)}
                    </div>
                    {imagePrompt && (
                        <p className="chapter-prompt">
                            <span aria-hidden="true">🎨</span> {imagePrompt}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    const isLastPage = currentPage === totalPages - 1;
    const isFirstPage = currentPage === 0;

    return (
        <div
            className="story-viewer"
            role="dialog"
            aria-modal="true"
            aria-label={`Visualizando história: ${story.title}`}
        >
            {/* Top Bar */}
            <div className="viewer-top-bar">
                <div></div> {/* Spacer */}
                <h1 className="viewer-title">{story.title}</h1>
                <button
                    className="btn btn-secondary viewer-close-btn"
                    onClick={onClose}
                    aria-label="Fechar visualização"
                >
                    <span aria-hidden="true">✕</span>
                    <span className="nav-btn-text">Fechar</span>
                </button>
            </div>

            {/* Book Container */}
            <div className="book-container">
                <div className="page-container">
                    {currentPage === 0
                        ? renderCoverPage()
                        : renderChapterPage(currentPage - 1)
                    }
                </div>
            </div>

            {/* Navigation */}
            <nav
                className="viewer-navigation"
                aria-label="Navegação de páginas"
            >
                <button
                    className="btn btn-secondary nav-btn"
                    onClick={prevPage}
                    disabled={isFirstPage}
                    aria-label="Página anterior"
                >
                    <span aria-hidden="true">←</span>
                    <span className="nav-btn-text">Anterior</span>
                </button>

                <div
                    className="page-indicators"
                    role="tablist"
                    aria-label="Páginas da história"
                >
                    {Array.from({ length: totalPages }).map((_, idx) => (
                        <button
                            key={idx}
                            className={`page-dot ${currentPage === idx ? 'active' : ''}`}
                            onClick={() => setCurrentPage(idx)}
                            role="tab"
                            aria-selected={currentPage === idx}
                            aria-label={idx === 0 ? 'Capa' : `Capítulo ${idx}`}
                        />
                    ))}
                </div>

                {isLastPage ? (
                    <button
                        className="btn btn-gold nav-btn"
                        onClick={onClose}
                    >
                        <span aria-hidden="true">🏠</span>
                        <span className="nav-btn-text">Início</span>
                    </button>
                ) : (
                    <button
                        className="btn btn-primary nav-btn"
                        onClick={nextPage}
                        aria-label="Próxima página"
                    >
                        <span className="nav-btn-text">Próximo</span>
                        <span aria-hidden="true">→</span>
                    </button>
                )}
            </nav>
        </div>
    );
}
