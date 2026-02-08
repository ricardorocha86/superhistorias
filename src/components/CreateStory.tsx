import { useState, useId, type ChangeEvent } from 'react';
import { MAX_CHARACTERS_PER_STORY, MAX_DESCRIPTION_LENGTH } from '../constants';
import type { Character, CreateStoryProps, StoryRequest } from '../types';
import { UNIVERSES } from './UniverseSelector';
import CharacterCard from './CharacterCard';
import UniverseSelector from './UniverseSelector';
import './CreateStory.css';

type Step = 1 | 2 | 3;

const STEP_NAMES: Record<Step, string> = {
    1: 'Personagens',
    2: 'Universo',
    3: 'Confirmar'
};

export default function CreateStory({ characters, onSubmit, onCancel }: CreateStoryProps) {
    const [step, setStep] = useState<Step>(1);
    const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([]);
    const [selectedUniverse, setSelectedUniverse] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const descriptionId = useId();

    const toggleCharacter = (character: Character): void => {
        setSelectedCharacters(prev => {
            const isSelected = prev.some(c => c.id === character.id);
            if (isSelected) {
                return prev.filter(c => c.id !== character.id);
            }
            if (prev.length >= MAX_CHARACTERS_PER_STORY) return prev;
            return [...prev, character];
        });
    };

    const canProceed = (): boolean => {
        switch (step) {
            case 1: return selectedCharacters.length > 0;
            case 2: return selectedUniverse !== null;
            case 3: return true;
            default: return false;
        }
    };

    const handleNext = (): void => {
        if (step < 3 && canProceed()) {
            setStep((step + 1) as Step);
        }
    };

    const handleBack = (): void => {
        if (step > 1) {
            setStep((step - 1) as Step);
        }
    };

    const handleSubmit = (): void => {
        if (!selectedUniverse || isSubmitting) return;

        const universe = UNIVERSES.find(u => u.id === selectedUniverse);
        if (!universe) return;

        setIsSubmitting(true);

        const request: StoryRequest = {
            characters: selectedCharacters,
            universe,
            description: description.trim() || undefined
        };

        onSubmit(request);
    };

    const getUniverse = () => UNIVERSES.find(u => u.id === selectedUniverse);

    return (
        <div className="create-story">
            {/* Step Indicator */}
            <nav
                className="step-indicator"
                aria-label="Progresso da criação de história"
            >
                {([1, 2, 3] as Step[]).map((s, index) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                        <div
                            className={`step-item ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`}
                            aria-current={step === s ? 'step' : undefined}
                        >
                            <span className="step-number" aria-hidden="true">
                                {step > s ? '✓' : s}
                            </span>
                            <span className="step-name">{STEP_NAMES[s]}</span>
                        </div>
                        {index < 2 && (
                            <div
                                className={`step-connector ${step > s ? 'completed' : ''}`}
                                aria-hidden="true"
                            />
                        )}
                    </div>
                ))}
            </nav>

            {/* Step Content */}
            <div className="step-content" role="region" aria-live="polite">
                {/* Step 1: Select Characters */}
                {step === 1 && (
                    <div className="characters-step">
                        <div className="characters-step-header">
                            <h3>Quem serão os heróis?</h3>
                            <p>Selecione até {MAX_CHARACTERS_PER_STORY} personagens para sua história</p>
                            <div className="characters-count">
                                <span aria-live="polite">
                                    {selectedCharacters.length} de {MAX_CHARACTERS_PER_STORY} selecionados
                                </span>
                            </div>
                        </div>
                        <div
                            className="characters-grid"
                            role="group"
                            aria-label="Lista de personagens disponíveis"
                        >
                            {characters.map(char => (
                                <CharacterCard
                                    key={char.id}
                                    character={char}
                                    selected={selectedCharacters.some(c => c.id === char.id)}
                                    onSelect={toggleCharacter}
                                    selectable
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Select Universe */}
                {step === 2 && (
                    <UniverseSelector
                        selected={selectedUniverse}
                        onSelect={setSelectedUniverse}
                    />
                )}

                {/* Step 3: Summary */}
                {step === 3 && (
                    <div className="summary-step">
                        <div className="summary-header">
                            <span className="summary-icon" aria-hidden="true">✨</span>
                            <h3>Tudo pronto!</h3>
                            <p>Revise sua história antes de criar</p>
                        </div>

                        <div className="selection-preview">
                            <div className="selection-item">
                                <h4>
                                    <span aria-hidden="true">👥</span>
                                    Personagens
                                </h4>
                                <div className="character-tags" role="list">
                                    {selectedCharacters.map(char => (
                                        <span
                                            key={char.id}
                                            className="character-tag"
                                            role="listitem"
                                        >
                                            <span aria-hidden="true">⭐</span>
                                            {char.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="selection-item">
                                <h4>
                                    <span aria-hidden="true">🌌</span>
                                    Universo
                                </h4>
                                <span className="selection-value">
                                    {getUniverse()?.emoji} {getUniverse()?.name}
                                </span>
                            </div>
                        </div>

                        <div className="description-field">
                            <label htmlFor={descriptionId}>
                                Descrição Personalizada
                                <span className="description-hint"> (opcional)</span>
                            </label>
                            <textarea
                                id={descriptionId}
                                className="textarea"
                                placeholder="Adicione detalhes específicos para sua história... Ex: 'O João encontra um dragão amigável e juntos exploram um castelo mágico'"
                                value={description}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                                maxLength={MAX_DESCRIPTION_LENGTH}
                                aria-describedby={`${descriptionId}-hint`}
                            />
                            <span id={`${descriptionId}-hint`} className="form-hint">
                                Máximo de {MAX_DESCRIPTION_LENGTH} caracteres
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="step-nav">
                <div className="step-nav-left">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={step === 1 ? onCancel : handleBack}
                    >
                        {step === 1 ? 'Cancelar' : '← Voltar'}
                    </button>
                </div>
                <div className="step-nav-right">
                    {step < 3 ? (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleNext}
                            disabled={!canProceed()}
                            aria-disabled={!canProceed()}
                        >
                            Próximo →
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-gold magic-btn"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            aria-busy={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner spinner-sm" aria-hidden="true"></span>
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <span aria-hidden="true">🪄</span>
                                    Criar Minha História!
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
