import type { HeaderProps } from '../types';
import './Header.css';

export default function Header({ user, onLogin, onLogout, onGalleryClick }: HeaderProps) {
    return (
        <header className="header" role="banner">
            <div className="container flex-between">
                <div className="header-brand">
                    <div className="super-badge">
                        <span className="super-text">SUPER</span>
                    </div>
                    <h1 className="header-title">
                        Histórias
                    </h1>
                    <span className="header-sparkle" aria-hidden="true">✨</span>
                </div>

                <nav className="header-nav" role="navigation" aria-label="Menu principal">
                    <button
                        className="btn btn-secondary gallery-btn"
                        onClick={onGalleryClick}
                        aria-label="Ver minhas histórias"
                    >
                        <span aria-hidden="true">📚</span>
                        <span className="gallery-btn-text">Histórias</span>
                    </button>

                    {user ? (
                        <div className="user-menu">
                            <div className="user-avatar" aria-hidden="true">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="" />
                                ) : (
                                    <span>{user.name?.charAt(0) || '👤'}</span>
                                )}
                            </div>
                            <span className="user-name" aria-label={`Logado como ${user.name}`}>
                                {user.name}
                            </span>
                            <button
                                className="btn btn-secondary logout-btn"
                                onClick={onLogout}
                                aria-label="Sair da conta"
                            >
                                <span className="logout-btn-text">Sair</span>
                                <span className="show-mobile-only" aria-hidden="true">↪</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            className="btn btn-primary google-btn"
                            onClick={onLogin}
                            aria-label="Entrar com conta Google"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="google-btn-text">Entrar com Google</span>
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
}
