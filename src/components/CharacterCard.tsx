import type { CharacterCardProps } from '../types';
import './CharacterCard.css';

export default function CharacterCard({
    character,
    selected = false,
    onSelect,
    onDelete,
    selectable = false
}: CharacterCardProps) {
    const handleClick = (): void => {
        if (selectable && onSelect) {
            onSelect(character);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent): void => {
        if (selectable && onSelect && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onSelect(character);
        }
    };

    return (
        <div
            className={`character-card ${selected ? 'selected' : ''} ${selectable ? 'selectable' : ''}`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role={selectable ? 'button' : undefined}
            tabIndex={selectable ? 0 : undefined}
            aria-pressed={selectable ? selected : undefined}
            aria-label={selectable ? `${character.name}${selected ? ', selecionado' : ''}` : undefined}
        >
            <div className="character-images" aria-hidden="true">
                {character.images.slice(0, 2).map((img, idx) => (
                    <div
                        key={idx}
                        className="character-image-thumb"
                        style={{
                            backgroundImage: `url(${img})`,
                            transform: `rotate(${(idx - 1) * 5}deg)`,
                            zIndex: 3 - idx
                        }}
                    />
                ))}
            </div>

            <div className="character-info">
                <h3 className="character-name">{character.name}</h3>
                <span className="character-photos-count">
                    {character.images.length} foto{character.images.length !== 1 ? 's' : ''}
                </span>
            </div>

            {selected && (
                <div className="character-selected-badge" aria-hidden="true">
                    <span>✓</span>
                </div>
            )}

            {onDelete && !selectable && (
                <button
                    className="character-delete-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(character.id);
                    }}
                    aria-label={`Deletar personagem ${character.name}`}
                    type="button"
                >
                    <span aria-hidden="true">×</span>
                </button>
            )}
        </div>
    );
}
