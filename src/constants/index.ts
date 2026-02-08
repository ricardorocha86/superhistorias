/**
 * Constantes globais da aplicação
 * Centraliza magic numbers e configurações
 */

import type { GenerationStages } from '../types';

// Limites de personagens e imagens
export const APP_NAME = 'Super Histórias';
export const APP_DESCRIPTION = 'Crie histórias mágicas personalizadas com IA';
export const MAX_CHARACTERS_PER_STORY = 5;
export const MAX_IMAGES_PER_CHARACTER = 2;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const MAX_IMAGE_RETRIES = 5;

// URL base da API (usa variável de ambiente ou fallback para localhost)
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

// Chaves do localStorage
export const STORAGE_KEYS = {
    CHARACTERS: 'storymaker-characters',
    STORIES: 'storymaker-stories',
} as const;

// Estágios de progresso da geração de história
export const GENERATION_STAGES: GenerationStages = {
    1: { icon: '🚀', name: 'Inicialização' },
    2: { icon: '📜', name: 'Escrevendo História' },
    3: { icon: '🎨', name: 'Gerando Imagens' },
    4: { icon: '✨', name: 'Finalizado' },
};

// Número total de imagens geradas (1 capa + 5 capítulos)
export const TOTAL_STORY_IMAGES = 6;
export const TOTAL_STORY_PARTS = 5;
