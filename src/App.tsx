import { useState } from 'react';
import Header from './components/Header';
import CharacterCard from './components/CharacterCard';
import CreateCharacter from './components/CreateCharacter';
import CreateStory from './components/CreateStory';
import StoryProgress from './components/StoryProgress';
import StoryViewer from './components/StoryViewer';
import Modal from './components/Modal';
import { useCharacters } from './hooks/useCharacters';
import { useStories } from './hooks/useStories';
import { getImageUrl } from './utils/imageUtils';
import type { User, Story, StoryRequest } from './types';
import './App.css';

type ViewState = 'home' | 'create-character' | 'create-story' | 'generating' | 'viewing';

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<ViewState>('home');
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [currentStoryRequest, setCurrentStoryRequest] = useState<StoryRequest | null>(null);
    const [completedStory, setCompletedStory] = useState<Story | null>(null);

    // Custom hooks for data management
    const { characters, addCharacter, deleteCharacter, hasCharacters } = useCharacters();
    const { stories, addStory, storiesCount, isLoading: isLoadingStories, error: storiesError } = useStories();

    // Placeholder: Google Login
    const handleLogin = (): void => {
        setUser({ name: 'Usuário Demo', photoURL: null });
    };

    const handleLogout = (): void => {
        setUser(null);
    };

    const handleGalleryClick = (): void => {
        setShowGalleryModal(true);
    };

    const handleSaveCharacter = (character: Parameters<typeof addCharacter>[0]): void => {
        addCharacter(character);
        setView('home');
    };

    const handleDeleteCharacter = (id: string): void => {
        deleteCharacter(id);
    };

    const handleCreateStory = (storyRequest: StoryRequest): void => {
        setCurrentStoryRequest(storyRequest);
        setView('generating');
    };

    const handleStoryComplete = (storyData: Story): void => {
        addStory(storyData);
        setCompletedStory(storyData);
        setView('viewing');
    };

    const handleCancelGeneration = (): void => {
        setCurrentStoryRequest(null);
        setView('home');
    };

    const handleCloseViewer = (): void => {
        setCompletedStory(null);
        setView('home');
    };

    const handleViewSavedStory = (story: Story): void => {
        setCompletedStory(story);
        setShowGalleryModal(false);
        setView('viewing');
    };

    // Landing page for non-logged users
    if (!user) {
        return (
            <div className="app">
                <a href="#main-content" className="skip-link">
                    Pular para o conteúdo principal
                </a>

                <Header
                    user={user}
                    onLogin={handleLogin}
                    onLogout={handleLogout}
                    onGalleryClick={handleGalleryClick}
                />

                <main id="main-content" className="landing">
                    <div className="landing-content">
                        <div className="landing-hero">
                            <div className="header-brand hero-brand-matched">
                                <div className="super-badge">
                                    <span className="super-text">SUPER</span>
                                </div>
                                <h1 className="header-title">
                                    Histórias
                                </h1>
                            </div>
                            <p className="hero-subtitle">
                                Crie histórias mágicas personalizadas com você e sua família como protagonistas!
                            </p>

                            <div className="hero-features" role="list">
                                <div className="feature-card" role="listitem">
                                    <span className="feature-icon" aria-hidden="true">👤</span>
                                    <div>
                                        <h3>Crie Personagens</h3>
                                        <p>Transforme você e sua família em heróis de histórias</p>
                                    </div>
                                </div>
                                <div className="feature-card" role="listitem">
                                    <span className="feature-icon" aria-hidden="true">🌌</span>
                                    <div>
                                        <h3>Escolha o Universo</h3>
                                        <p>Harry Potter, Marvel, Disney e muito mais!</p>
                                    </div>
                                </div>
                                <div className="feature-card" role="listitem">
                                    <span className="feature-icon" aria-hidden="true">✨</span>
                                    <div>
                                        <h3>Magia com IA</h3>
                                        <p>Histórias únicas geradas por inteligência artificial</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="btn btn-gold btn-lg hero-cta"
                                onClick={handleLogin}
                                aria-label="Entrar com conta Google para começar"
                            >
                                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Começar com Google
                            </button>
                        </div>
                    </div>

                    {/* Floating decorations */}
                    <div className="floating-elements" aria-hidden="true">
                        <span className="float-item" style={{ top: '20%', left: '10%' }}>⭐</span>
                        <span className="float-item" style={{ top: '30%', right: '15%' }}>🌙</span>
                        <span className="float-item" style={{ bottom: '25%', left: '5%' }}>✨</span>
                        <span className="float-item" style={{ bottom: '20%', right: '10%' }}>🪄</span>
                        <span className="float-item" style={{ top: '60%', left: '20%' }}>📖</span>
                    </div>
                </main>

                <Modal isOpen={showGalleryModal} onClose={() => setShowGalleryModal(false)} title="🖼️ Galeria de Histórias">
                    <div className="gallery-placeholder">
                        <span className="gallery-icon" aria-hidden="true">🔐</span>
                        <h3>Faça login primeiro!</h3>
                        <p>Entre com sua conta Google para ver suas histórias.</p>
                    </div>
                </Modal>
            </div>
        );
    }

    // Story Generation View
    if (view === 'generating' && currentStoryRequest) {
        return (
            <div className="app">
                <Header
                    user={user}
                    onLogin={handleLogin}
                    onLogout={handleLogout}
                    onGalleryClick={handleGalleryClick}
                />
                <main id="main-content" className="dashboard container">
                    <StoryProgress
                        storyRequest={currentStoryRequest}
                        onComplete={handleStoryComplete}
                        onCancel={handleCancelGeneration}
                    />
                </main>
            </div>
        );
    }

    // Story Viewer - rendered without dashboard wrapper since it's fullscreen
    if (view === 'viewing' && completedStory) {
        return (
            <StoryViewer
                story={completedStory}
                onClose={handleCloseViewer}
            />
        );
    }

    // Logged in - Dashboard
    return (
        <div className="app">
            <a href="#main-content" className="skip-link">
                Pular para o conteúdo principal
            </a>

            <Header
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onGalleryClick={handleGalleryClick}
            />

            <main id="main-content" className="dashboard container">
                {view === 'home' && (
                    <>
                        {/* Action Cards */}
                        <section className="dashboard-actions" aria-label="Ações principais">
                            <div
                                className="action-card"
                                onClick={() => setView('create-character')}
                                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setView('create-character')}
                                role="button"
                                tabIndex={0}
                                aria-label="Criar novo personagem"
                            >
                                <div className="action-icon-wrapper">
                                    <span className="action-icon" aria-hidden="true">🧙‍♂️</span>
                                </div>
                                <h2>Criar Personagem</h2>
                                <p>Adicione pessoas com fotos para usar nas suas histórias</p>
                                <span className="action-arrow" aria-hidden="true">→</span>
                            </div>

                            <div
                                className={`action-card ${!hasCharacters ? 'disabled' : ''}`}
                                onClick={() => hasCharacters && setView('create-story')}
                                onKeyDown={(e) => hasCharacters && (e.key === 'Enter' || e.key === ' ') && setView('create-story')}
                                role="button"
                                tabIndex={hasCharacters ? 0 : -1}
                                aria-label={hasCharacters ? 'Criar nova história' : 'Crie personagens primeiro para criar histórias'}
                                aria-disabled={!hasCharacters}
                            >
                                <div className="action-icon-wrapper">
                                    <span className="action-icon" aria-hidden="true">📖</span>
                                    {!hasCharacters && <span className="action-badge">Crie personagens primeiro</span>}
                                </div>
                                <h2>Nova História</h2>
                                <p>Crie uma história épica com seus personagens</p>
                                <span className="action-arrow" aria-hidden="true">→</span>
                            </div>
                        </section>

                        {/* My Stories Section */}
                        <section className="dashboard-section" aria-labelledby="stories-heading">
                            <div className="section-header">
                                <h2 id="stories-heading">
                                    <span aria-hidden="true">📚</span> Minhas Histórias
                                </h2>
                                <span className="badge badge-primary" aria-label={`${storiesCount} histórias criadas`}>
                                    {storiesCount} criadas
                                </span>
                            </div>

                            {isLoadingStories ? (
                                <div className="loading-stories">
                                    <div className="spinner"></div>
                                    <p>Buscando suas histórias...</p>
                                </div>
                            ) : storiesError ? (
                                <div className="error-stories">
                                    <p>{storiesError}</p>
                                </div>
                            ) : stories.length === 0 ? (
                                <div className="empty-stories">
                                    <span className="empty-icon" aria-hidden="true">📖</span>
                                    <h3>Nenhuma história ainda</h3>
                                    <p>Crie sua primeira história para vê-la aqui!</p>
                                </div>
                            ) : (
                                <div className="stories-grid" role="list" aria-label="Lista de histórias">
                                    {stories.map(story => (
                                        <article
                                            key={story.id}
                                            className={`story-card ${story.is_complete === false ? 'incomplete' : ''}`}
                                            onClick={() => handleViewSavedStory(story)}
                                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleViewSavedStory(story)}
                                            role="listitem"
                                            tabIndex={0}
                                            aria-label={`Ler história: ${story.title} ${story.is_complete === false ? '(Incompleta)' : ''}`}
                                        >
                                            {story.is_complete === false && (
                                                <div className="incomplete-badge">Incompleta</div>
                                            )}
                                            <div className="story-card-cover">
                                                {story.images?.capa ? (
                                                    <img src={getImageUrl(story.images.capa) || ''} alt="" />
                                                ) : (
                                                    <span className="story-card-placeholder" aria-hidden="true">📚</span>
                                                )}
                                            </div>
                                            <div className="story-card-info">
                                                <h4>{story.title}</h4>
                                                <p className="story-card-universe">
                                                    {typeof story.universe === 'string' ? story.universe : story.universe?.name}
                                                </p>
                                                <span className="story-card-date">
                                                    {new Date(story.createdAt).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Characters Section */}
                        <section className="dashboard-section" aria-labelledby="characters-heading">
                            <div className="section-header">
                                <h2 id="characters-heading">
                                    <span aria-hidden="true">👥</span> Meus Personagens
                                </h2>
                                <span className="badge badge-primary" aria-label={`${characters.length} personagens criados`}>
                                    {characters.length} criados
                                </span>
                            </div>

                            {characters.length === 0 ? (
                                <div className="empty-characters">
                                    <span className="empty-icon" aria-hidden="true">🎭</span>
                                    <h3>Nenhum personagem ainda</h3>
                                    <p>Crie seu primeiro personagem para começar a fazer histórias incríveis!</p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setView('create-character')}
                                    >
                                        <span aria-hidden="true">✨</span> Criar Primeiro Personagem
                                    </button>
                                </div>
                            ) : (
                                <div className="characters-list" role="list" aria-label="Lista de personagens">
                                    {characters.map(char => (
                                        <CharacterCard
                                            key={char.id}
                                            character={char}
                                            onDelete={handleDeleteCharacter}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}

                {view === 'create-character' && (
                    <Modal isOpen={true} onClose={() => setView('home')}>
                        <CreateCharacter
                            onSave={handleSaveCharacter}
                            onCancel={() => setView('home')}
                        />
                    </Modal>
                )}

                {view === 'create-story' && (
                    <CreateStory
                        characters={characters}
                        onSubmit={handleCreateStory}
                        onCancel={() => setView('home')}
                    />
                )}
            </main>

            <Modal isOpen={showGalleryModal} onClose={() => setShowGalleryModal(false)} title="🖼️ Minhas Histórias">
                {isLoadingStories ? (
                    <div className="gallery-placeholder">
                        <div className="spinner"></div>
                        <p>Carregando galeria...</p>
                    </div>
                ) : storiesError ? (
                    <div className="gallery-placeholder">
                        <p>{storiesError}</p>
                    </div>
                ) : stories.length === 0 ? (
                    <div className="gallery-placeholder">
                        <span className="gallery-icon" aria-hidden="true">📚</span>
                        <h3>Nenhuma história ainda</h3>
                        <p>Crie sua primeira história para vê-la aqui!</p>
                    </div>
                ) : (
                    <div className="stories-gallery" role="list" aria-label="Galeria de histórias">
                        {stories.map(story => (
                            <article
                                key={story.id}
                                className={`gallery-story-card ${story.is_complete === false ? 'incomplete' : ''}`}
                                onClick={() => handleViewSavedStory(story)}
                                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleViewSavedStory(story)}
                                role="listitem"
                                tabIndex={0}
                                aria-label={`Abrir história: ${story.title} ${story.is_complete === false ? '(Incompleta)' : ''}`}
                            >
                                {story.is_complete === false && (
                                    <div className="incomplete-badge" style={{ fontSize: '8px', padding: '1px 6px' }}>Incompleta</div>
                                )}
                                {story.images?.capa ? (
                                    <img
                                        src={getImageUrl(story.images.capa) || ''}
                                        alt=""
                                        className="gallery-story-cover"
                                    />
                                ) : (
                                    <div className="gallery-story-cover cover-placeholder-mini">
                                        <span aria-hidden="true">📖</span>
                                    </div>
                                )}
                                <div className="gallery-story-info">
                                    <h4>{story.title}</h4>
                                    <p>{typeof story.universe === 'string' ? story.universe : story.universe?.name}</p>
                                    <span className="gallery-story-date">
                                        {new Date(story.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default App;
