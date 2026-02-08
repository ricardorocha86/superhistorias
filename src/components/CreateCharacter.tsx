import { useState, useRef, useId, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { MAX_IMAGES_PER_CHARACTER } from '../constants';
import type { CreateCharacterProps } from '../types';
import './CreateCharacter.css';

export default function CreateCharacter({ onSave, onCancel }: CreateCharacterProps) {
    const [name, setName] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Generate unique IDs for accessibility
    const nameInputId = useId();
    const uploadZoneId = useId();

    const handleFiles = (files: FileList | null): void => {
        if (!files) return;

        const validImages = Array.from(files)
            .filter(file => file.type.startsWith('image/'))
            .slice(0, MAX_IMAGES_PER_CHARACTER - images.length);

        validImages.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result;
                if (typeof result === 'string') {
                    setImages(prev => {
                        if (prev.length >= MAX_IMAGES_PER_CHARACTER) return prev;
                        return [...prev, result];
                    });
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (): void => {
        setDragOver(false);
    };

    const removeImage = (index: number): void => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        if (name.trim() && images.length > 0) {
            // ID será gerado automaticamente pelo hook useCharacters
            onSave({
                name: name.trim(),
                images
            });
        }
    };

    const isValid = name.trim().length > 0 && images.length > 0;
    const canAddMoreImages = images.length < MAX_IMAGES_PER_CHARACTER;

    return (
        <div className="create-character">
            <div className="create-character-header">
                <span className="create-icon" aria-hidden="true">🧙‍♂️</span>
                <h2>Criar Personagem</h2>
                <p className="create-subtitle">
                    Suba 1 ou 2 fotos claras de frente para garantir a melhor semelhança! ✨
                </p>
            </div>

            <form onSubmit={handleSubmit} className="create-form" noValidate>
                <div className="form-group">
                    <label className="label" htmlFor={nameInputId}>
                        Nome do Personagem
                    </label>
                    <input
                        type="text"
                        id={nameInputId}
                        className="input"
                        placeholder="Ex: João, Princesa Luna, Super Ricardo..."
                        value={name}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                        maxLength={50}
                        autoComplete="off"
                        aria-describedby={`${nameInputId}-hint`}
                    />
                    <span id={`${nameInputId}-hint`} className="form-hint">
                        Máximo de 50 caracteres
                    </span>
                </div>

                <div className="form-group">
                    <label className="label" id={`${uploadZoneId}-label`}>
                        Fotos ({images.length}/{MAX_IMAGES_PER_CHARACTER})
                        <span className="label-hint">- fotos claras de frente</span>
                    </label>

                    <div
                        className={`upload-zone ${dragOver ? 'dragover' : ''} ${!canAddMoreImages ? 'disabled' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => canAddMoreImages && fileInputRef.current?.click()}
                        onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && canAddMoreImages) {
                                e.preventDefault();
                                fileInputRef.current?.click();
                            }
                        }}
                        role="button"
                        tabIndex={canAddMoreImages ? 0 : -1}
                        aria-labelledby={`${uploadZoneId}-label`}
                        aria-describedby={`${uploadZoneId}-hint`}
                        aria-disabled={!canAddMoreImages}
                    >
                        {!canAddMoreImages ? (
                            <>
                                <span className="upload-zone-icon" aria-hidden="true">✅</span>
                                <p>Máximo de fotos atingido!</p>
                            </>
                        ) : (
                            <>
                                <span className="upload-zone-icon" aria-hidden="true">📸</span>
                                <p><strong>Arraste fotos aqui</strong> ou clique para selecionar</p>
                                <span id={`${uploadZoneId}-hint`} className="upload-hint">
                                    PNG, JPG ou WEBP • Máximo {MAX_IMAGES_PER_CHARACTER} fotos
                                </span>
                            </>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
                        style={{ display: 'none' }}
                        aria-hidden="true"
                        tabIndex={-1}
                    />
                </div>

                {images.length > 0 && (
                    <div className="preview-images" role="list" aria-label="Fotos adicionadas">
                        {images.map((img, idx) => (
                            <div key={idx} className="preview-image" role="listitem">
                                <img src={img} alt={`Foto ${idx + 1} do personagem`} />
                                <button
                                    type="button"
                                    className="preview-remove"
                                    onClick={() => removeImage(idx)}
                                    aria-label={`Remover foto ${idx + 1}`}
                                >
                                    <span aria-hidden="true">×</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onCancel}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn btn-gold"
                        disabled={!isValid}
                        aria-disabled={!isValid}
                    >
                        <span aria-hidden="true">✨</span> Criar Personagem
                    </button>
                </div>
            </form>
        </div>
    );
}
