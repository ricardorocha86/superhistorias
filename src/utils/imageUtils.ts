import { API_BASE } from '../constants';
import type { Character, Universe } from '../types';

/**
 * Normaliza URL de imagem
 * Converte caminhos relativos para URLs completas
 */
export function getImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    // Já é URL completa
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // É um caminho relativo do servidor
    if (url.startsWith('/')) {
        return `${API_BASE}${url}`;
    }

    // É base64 ou outro formato, retorna como está
    return url;
}

/**
 * Extrai nomes de uma lista de personagens
 * Aceita array de strings ou array de objetos {name: string}
 */
export function getCharacterNames(characters: Character[] | { name: string }[] | string[] | null | undefined): string {
    if (!characters || !Array.isArray(characters)) return '';
    return characters
        .map(c => typeof c === 'string' ? c : c.name)
        .join(', ');
}

/**
 * Extrai nome do universo
 * Aceita string ou objeto {name: string}
 */
export function getUniverseName(universe: Universe | string | null | undefined): string {
    if (!universe) return '';
    return typeof universe === 'string' ? universe : universe.name;
}
