import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../constants';
import type { Story, UseStoriesReturn } from '../types';

/**
 * Hook customizado para gerenciar histórias
 * Agora lê diretamente da API do servidor (pasta /historias)
 */
export function useStories(): UseStoriesReturn {
    const [stories, setStories] = useState<Story[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStories = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/api/stories`);
            if (!response.ok) {
                throw new Error('Falha ao bscar histórias do servidor');
            }
            const data = await response.json();
            setStories(data.stories || []);
        } catch (e) {
            console.error('Erro ao buscar histórias:', e);
            setError('Não foi possível carregar suas histórias.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Carregar histórias na montagem do componente
    useEffect(() => {
        fetchStories();
    }, [fetchStories]);

    const addStory = useCallback((storyData: Partial<Story>): Story => {
        const newStory = storyData as Story;

        setStories(prev => {
            // Verificar se já existe uma história com esse ID (evita duplicados)
            if (prev.some(s => s.id === newStory.id)) {
                return prev;
            }
            return [newStory, ...prev];
        });

        return newStory;
    }, []);

    const deleteStory = useCallback((id: string): void => {
        // Nota: Atualmente a API não tem endpoint de delete
        // Remove apenas do estado local por enquanto
        setStories(prev => prev.filter(s => s.id !== id));
    }, []);

    const getStoryById = useCallback((id: string): Story | undefined => {
        return stories.find(s => s.id === id);
    }, [stories]);

    return {
        stories,
        addStory,
        deleteStory,
        getStoryById,
        hasStories: stories.length > 0,
        storiesCount: stories.length,
        isLoading,
        error,
        refreshStories: fetchStories
    };
}

export default useStories;
