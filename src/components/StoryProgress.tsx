import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE, GENERATION_STAGES, MAX_IMAGE_RETRIES } from '../constants';
import type { StoryProgressProps, Story, SSEEvent } from '../types';
import './StoryProgress.css';

// Timeout em milissegundos (5 minutos = 300000ms)
const GENERATION_TIMEOUT_MS = 5 * 60 * 1000;
// Timeout de inatividade - igual ao timeout global para evitar cortes prematuros
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

interface CurrentImage {
    id: string;
    current: number;
    total: number;
    startTime: number;
}

interface StoryDataFromSSE {
    title: string;
    parts: [string, string][];
    storyId?: string;
    folder?: string;
}

export default function StoryProgress({ storyRequest, onComplete, onCancel }: StoryProgressProps) {
    const [currentStage, setCurrentStage] = useState(1);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('Preparando...');
    const [stageTitle, setStageTitle] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [stageStartTime, setStageStartTime] = useState(Date.now());
    const [stageElapsedTime, setStageElapsedTime] = useState(0);
    const [storyData, setStoryData] = useState<StoryDataFromSSE | null>(null);
    const [currentImage, setCurrentImage] = useState<CurrentImage | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});

    const [imagesInProgress, setImagesInProgress] = useState<Record<string, number>>({});
    const [imageElapsedTimes, setImageElapsedTimes] = useState<Record<string, number>>({});
    const [imageAttempts, setImageAttempts] = useState<Record<string, number>>({});
    const [imageErrors, setImageErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);

    const startTimeRef = useRef(Date.now());
    const eventSourceRef = useRef<EventSource | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hasStartedRef = useRef(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastEventTimeRef = useRef(Date.now());

    // Função para resetar o timeout de inatividade
    const resetInactivityTimeout = useCallback(() => {
        lastEventTimeRef.current = Date.now();

        // Limpa timeout anterior
        if (inactivityTimeoutRef.current) {
            clearTimeout(inactivityTimeoutRef.current);
        }

        // Agenda novo timeout de inatividade
        inactivityTimeoutRef.current = setTimeout(() => {
            if (!isComplete && !error) {
                console.warn('⚠️ Timeout de inatividade - nenhum evento recebido em 60s');
                setError('A conexão parece estar inativa. Por favor, tente novamente.');
            }
        }, INACTIVITY_TIMEOUT_MS);
    }, [isComplete, error]);

    // Timer global + contadores individuais de imagens
    useEffect(() => {
        timerRef.current = setInterval(() => {
            const now = Date.now();
            setElapsedTime(Math.floor((now - startTimeRef.current) / 1000));
            setStageElapsedTime(Math.floor((now - stageStartTime) / 1000));

            setImagesInProgress(current => {
                if (Object.keys(current).length > 0) {
                    const newElapsed: Record<string, number> = {};
                    Object.entries(current).forEach(([id, startTime]) => {
                        newElapsed[id] = Math.floor((now - startTime) / 1000);
                    });
                    setImageElapsedTimes(newElapsed);
                }
                return current;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // #10: Timeout global de geração (5 minutos)
    useEffect(() => {
        timeoutRef.current = setTimeout(() => {
            if (!isComplete && !error) {
                console.error('❌ Timeout global atingido - 5 minutos');
                setError('Tempo limite excedido (5 minutos). O processo pode ter falhado. Por favor, tente novamente.');

                // Limpar timer
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            }
        }, GENERATION_TIMEOUT_MS);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
        };
    }, [isComplete, error]);

    // Conexão SSE
    useEffect(() => {
        if (hasStartedRef.current) {
            console.log('⚠️ Requisição já iniciada, ignorando chamada duplicada');
            return;
        }
        hasStartedRef.current = true;

        const startGeneration = async (): Promise<void> => {
            try {
                const response = await fetch(`${API_BASE}/api/create-story`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        characters: storyRequest.characters.map(c => ({
                            id: c.id,
                            name: c.name,
                            images: c.images
                        })),
                        universe: {
                            id: storyRequest.universe.id,
                            name: storyRequest.universe.name,
                            style: storyRequest.universe.style
                        },
                        description: storyRequest.description
                    }),
                });

                if (!response.body) {
                    throw new Error('Response body is null');
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let streamFinishedCleanly = false;
                let terminalEventReceived = false;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        streamFinishedCleanly = true;
                        break;
                    }

                    const text = decoder.decode(value);
                    const lines = text.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6)) as SSEEvent;
                                handleEvent(data);

                                if (data.type === 'error' || data.type === 'complete') {
                                    terminalEventReceived = true;
                                }
                            } catch {
                                console.warn('Failed to parse SSE data:', line);
                            }
                        }
                    }
                }

                if (streamFinishedCleanly && !terminalEventReceived) {
                    console.error('❌ Stream encerrado sem evento de conclusão');
                    setError('A conexão foi encerrada inesperadamente antes da conclusão da história.');
                }
            } catch (err) {
                console.error('SSE Error:', err);
                setError(`Erro de conexão: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        };

        startGeneration();

        // Iniciar monitoramento de inatividade
        resetInactivityTimeout();

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (inactivityTimeoutRef.current) {
                clearTimeout(inactivityTimeoutRef.current);
            }
        };
    }, [storyRequest, resetInactivityTimeout]);

    const handleEvent = (data: SSEEvent): void => {
        // Resetar timeout de inatividade a cada evento recebido
        resetInactivityTimeout();
        const { type } = data;

        switch (type) {
            case 'stage':
                if (data.stage !== currentStage) {
                    setStageStartTime(Date.now());
                    setStageElapsedTime(0);
                }
                setCurrentStage(data.stage);
                setStageTitle(data.title);
                setMessage(data.message);
                setProgress(data.progress);
                break;

            case 'story_created':
                setCurrentStage(data.stage);
                setStageTitle(data.title);
                setMessage(data.message);
                setProgress(data.progress);
                setStoryData(data.data);
                break;

            case 'image_start':
                setImagesInProgress(prev => ({
                    ...prev,
                    [data.imageId]: Date.now()
                }));
                setImageAttempts(prev => ({
                    ...prev,
                    [data.imageId]: 1
                }));
                setCurrentImage({
                    id: data.imageId,
                    current: data.currentImage,
                    total: data.totalImages,
                    startTime: Date.now()
                });
                setMessage(data.message);
                break;

            case 'image_retry':
                setImageAttempts(prev => ({
                    ...prev,
                    [data.imageId]: data.attempt
                }));
                break;

            case 'image_done':
                const imageUrl = data.imageUrl ? `${API_BASE}${data.imageUrl}` : '';
                setGeneratedImages(prev => ({
                    ...prev,
                    [data.imageId]: imageUrl
                }));
                setImagesInProgress(prev => {
                    const updated = { ...prev };
                    delete updated[data.imageId];
                    return updated;
                });
                setProgress(data.progress);
                setMessage(data.message);
                break;

            case 'image_error':
                setImageErrors(prev => ({
                    ...prev,
                    [data.imageId]: data.error || 'Erro desconhecido'
                }));
                setImagesInProgress(prev => {
                    const updated = { ...prev };
                    delete updated[data.imageId];
                    return updated;
                });
                break;

            case 'complete':
                setCurrentStage(4);
                setStageTitle(data.title);
                setMessage(data.message);
                setProgress(100);
                setIsComplete(true);

                // Limpar todos os timers
                if (timerRef.current) clearInterval(timerRef.current);
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);

                if (onComplete) {
                    setTimeout(() => onComplete(data.data as Story), 2000);
                }
                break;

            case 'error':
                setError(data.message);

                // Limpar todos os timers
                if (timerRef.current) clearInterval(timerRef.current);
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
                break;
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    // Suppress unused variable warning
    void currentImage;

    if (error) {
        return (
            <div className="story-progress" role="alert" aria-live="assertive">
                <div className="error-state">
                    <span className="error-icon" aria-hidden="true">😔</span>
                    <h2 className="error-title">Ops! Algo deu errado</h2>
                    <p className="error-message">{error}</p>
                    <div className="error-actions">
                        <button className="btn btn-primary" onClick={onCancel}>
                            <span aria-hidden="true">🔄</span> Tentar Novamente
                        </button>
                        <button className="btn btn-secondary" onClick={onCancel}>
                            ← Voltar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="story-progress" role="status" aria-live="polite">
                <div className="success-state">
                    <span className="success-icon" aria-hidden="true">🎉</span>
                    <h2 className="success-title">História Criada com Sucesso!</h2>
                    <p className="success-message">Sua aventura mágica está pronta!</p>
                    <div className="success-time">
                        <span aria-hidden="true">⏱️</span>
                        Tempo total: {formatTime(elapsedTime)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="story-progress"
            role="status"
            aria-live="polite"
            aria-label="Gerando história"
        >


            {/* Progress Card */}
            <div className="progress-card">
                <h2 className="progress-title">{stageTitle || 'Preparando a mágica...'}</h2>
                <p className="progress-message">{message}</p>

                {/* Stages Grid */}
                <div
                    className="stages-grid"
                    role="list"
                    aria-label="Etapas do processo"
                >
                    {Object.entries(GENERATION_STAGES).map(([num, stage]) => {
                        const stageNum = parseInt(num);
                        const isActive = currentStage === stageNum;
                        const isCompleted = currentStage > stageNum;

                        return (
                            <div
                                key={num}
                                className={`stage-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                role="listitem"
                                aria-current={isActive ? 'step' : undefined}
                            >
                                <span className="stage-icon" aria-hidden="true">
                                    {isCompleted ? '✓' : stage.icon}
                                </span>
                                <span className="stage-name">
                                    {stage.name}
                                    {isActive && <span className="stage-timer"> ({formatTime(stageElapsedTime)})</span>}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Progress Bar */}
                <div className="progress-bar-container">
                    <div
                        className="progress-bar"
                        role="progressbar"
                        aria-valuenow={Math.round(progress)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Progresso da geração"
                    >
                        <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="progress-percent" aria-hidden="true">
                        {Math.round(progress)}%
                    </span>
                </div>


            </div>

            {/* Images Preview Section */}
            {/* Images Preview Section - Asymmetric Grid */}
            {storyData && (
                <section
                    className="images-preview-section"
                    aria-label="Prévia das ilustrações"
                >
                    <div className="generation-grid-container">
                        {/* COLUNA 1: CAPA (Always Visible Placeholder) */}
                        <div className="cover-wrapper">
                            <div className={`cover-preview-card ${generatedImages.capa ? 'done' : ''} ${imagesInProgress.capa ? 'generating' : ''}`}>
                                <div className="cover-image-container">
                                    {generatedImages.capa ? (
                                        <img src={generatedImages.capa} alt="Capa da história" />
                                    ) : imageErrors.capa ? (
                                        <div className="cover-loading">
                                            <span className="cover-loading-icon">❌</span>
                                            <span className="cover-loading-text">Erro</span>
                                        </div>
                                    ) : imagesInProgress.capa ? (
                                        <div className="cover-loading">
                                            <span className="cover-loading-icon">🎨</span>
                                            <div className="img-loading-stats">
                                                <span className="img-attempt">{(imageAttempts.capa || 1)}/{MAX_IMAGE_RETRIES}</span>
                                                <span className="img-elapsed">{imageElapsedTimes.capa || 0}s</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="cover-loading">
                                            <span className="cover-loading-icon">🎬</span>
                                            <span className="cover-loading-text">Aguardando Capa</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className="cover-label">Capa Oficial</span>
                        </div>

                        {/* COLUNAS 2-6: CENAS DA HISTÓRIA */}
                        <div className="parts-wrapper">
                            {storyData.parts.map((_, idx) => {
                                const imageId = `parte_${idx + 1}`;
                                const isInProgress = imagesInProgress[imageId] !== undefined;
                                const isDone = generatedImages[imageId] !== undefined;
                                const hasError = imageErrors[imageId] !== undefined;

                                return (
                                    <article
                                        key={idx}
                                        className={`part-preview ${isDone ? 'done' : ''} ${isInProgress ? 'generating' : ''} ${hasError ? 'error' : ''}`}
                                        aria-label={`Capítulo ${idx + 1}`}
                                    >
                                        <div className="part-image-container">
                                            {isDone ? (
                                                <img
                                                    src={generatedImages[imageId]}
                                                    alt={`Ilustração do capítulo ${idx + 1}`}
                                                />
                                            ) : hasError ? (
                                                <span className="part-error-icon">❌</span>
                                            ) : isInProgress ? (
                                                <div className="part-loading">
                                                    <span className="part-loading-spinner">🎨</span>
                                                    <div className="img-loading-stats">
                                                        <span className="img-attempt">{(imageAttempts[imageId] || 1)}/{MAX_IMAGE_RETRIES}</span>
                                                        <span className="img-elapsed">{imageElapsedTimes[imageId] || 0}s</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="part-loading">
                                                    <span className="part-loading-spinner" style={{ opacity: 0.3 }}>⏳</span>
                                                    <span className="part-loading-text">Cena {idx + 1}</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="part-number">{idx + 1}</span>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
