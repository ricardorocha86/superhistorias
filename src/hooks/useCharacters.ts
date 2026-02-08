import { useState, useEffect, useRef, useCallback } from 'react';
import { STORAGE_KEYS } from '../constants';
import type { Character, UseCharactersReturn } from '../types';

/**
 * Hook customizado para gerenciar personagens
 * Persiste automaticamente no localStorage
 */
export function useCharacters(): UseCharactersReturn {
    const [characters, setCharacters] = useState<Character[]>(() => {
        // Inicialização síncrona do localStorage para evitar race conditions
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Erro ao carregar personagens:', e);
        }
        return [];
    });

    // Flag para indicar que a inicialização já ocorreu
    const isInitialized = useRef(false);

    // Salvar personagens no localStorage quando mudar (após inicialização)
    useEffect(() => {
        // Pular o primeiro render para não sobrescrever dados válidos
        if (!isInitialized.current) {
            isInitialized.current = true;
            return;
        }

        try {
            localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
        } catch (e) {
            console.error('Erro ao salvar personagens:', e);
        }
    }, [characters]);

    const addCharacter = useCallback((characterData: Omit<Character, 'id'> & { id?: string }): void => {
        const newCharacter: Character = {
            id: characterData.id || `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: characterData.name,
            images: characterData.images
        };

        setCharacters(prev => {
            // Verificar se já existe um personagem com esse ID (evita duplicados)
            if (prev.some(c => c.id === newCharacter.id)) {
                console.warn('Personagem com este ID já existe:', newCharacter.id);
                return prev;
            }
            return [...prev, newCharacter];
        });
    }, []);

    const deleteCharacter = useCallback((id: string): void => {
        setCharacters(prev => prev.filter(c => c.id !== id));
    }, []);

    const updateCharacter = useCallback((id: string, updates: Partial<Character>): void => {
        setCharacters(prev => prev.map(c =>
            c.id === id ? { ...c, ...updates } : c
        ));
    }, []);

    const getCharacterById = useCallback((id: string): Character | undefined => {
        return characters.find(c => c.id === id);
    }, [characters]);

    return {
        characters,
        addCharacter,
        deleteCharacter,
        updateCharacter,
        getCharacterById,
        hasCharacters: characters.length > 0
    };
}

export default useCharacters;
