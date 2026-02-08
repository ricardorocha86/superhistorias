/**
 * Tipos centralizados para a aplicação Super Histórias
 */

// ============================================
// PERSONAGENS
// ============================================

export interface Character {
    id: string;
    name: string;
    images: string[]; // Base64 encoded images
}

// ============================================
// UNIVERSOS
// ============================================

export interface Universe {
    id: string;
    name: string;
    emoji: string;
    description: string;
    style: string;
    color: string;
    category?: string;
}

// ============================================
// HISTÓRIAS
// ============================================

export interface StoryPart {
    text: string;
    imagePrompt: string;
}

export interface StoryImages {
    capa?: string;
    parte_1?: string;
    parte_2?: string;
    parte_3?: string;
    parte_4?: string;
    parte_5?: string;
    [key: string]: string | undefined;
}

export interface Story {
    id: string;
    folder?: string;
    createdAt: string;
    title: string;
    cover_prompt?: string;
    parts: [string, string][]; // [texto, prompt_imagem][]
    images: StoryImages;
    universe: Universe | string;
    characters: Character[] | { id: string; name: string }[];
    totalTime?: number;
    is_complete?: boolean;
}

export interface StoryRequest {
    characters: Character[];
    universe: Universe;
    description?: string;
}

// ============================================
// USUÁRIO
// ============================================

export interface User {
    name: string;
    photoURL: string | null;
    email?: string;
}

// ============================================
// EVENTOS SSE (Server-Sent Events)
// ============================================

export type SSEEventType =
    | 'stage'
    | 'story_created'
    | 'image_start'
    | 'image_done'
    | 'image_error'
    | 'image_retry'
    | 'complete'
    | 'error';

export interface SSEStageEvent {
    type: 'stage';
    stage: number;
    title: string;
    message: string;
    progress: number;
}

export interface SSEStoryCreatedEvent {
    type: 'story_created';
    stage: number;
    title: string;
    message: string;
    progress: number;
    elapsed: number;
    data: {
        title: string;
        parts: [string, string][];
        storyId: string;
        folder: string;
    };
}

export interface SSEImageStartEvent {
    type: 'image_start';
    stage: number;
    imageId: string;
    message: string;
    currentImage: number;
    totalImages: number;
}

export interface SSEImageDoneEvent {
    type: 'image_done';
    stage: number;
    imageId: string;
    message: string;
    elapsed: number;
    imageUrl: string;
    currentImage: number;
    totalImages: number;
    progress: number;
}

export interface SSEImageErrorEvent {
    type: 'image_error';
    stage: number;
    imageId: string;
    message: string;
    error: string;
}

export interface SSEImageRetryEvent {
    type: 'image_retry';
    stage: number;
    imageId: string;
    attempt: number;
}

export interface SSECompleteEvent {
    type: 'complete';
    stage: number;
    title: string;
    message: string;
    progress: number;
    totalTime: number;
    data: Story;
}

export interface SSEErrorEvent {
    type: 'error';
    stage: number;
    title: string;
    message: string;
    progress: number;
}

export type SSEEvent =
    | SSEStageEvent
    | SSEStoryCreatedEvent
    | SSEImageStartEvent
    | SSEImageDoneEvent
    | SSEImageErrorEvent
    | SSEImageRetryEvent
    | SSECompleteEvent
    | SSEErrorEvent;

// ============================================
// COMPONENTES PROPS
// ============================================

export interface CharacterCardProps {
    character: Character;
    selected?: boolean;
    onSelect?: (character: Character) => void;
    onDelete?: (id: string) => void;
    selectable?: boolean;
}

export interface CreateCharacterProps {
    onSave: (character: Omit<Character, 'id'> & { id?: string }) => void;
    onCancel: () => void;
}

export interface CreateStoryProps {
    characters: Character[];
    onSubmit: (request: StoryRequest) => void;
    onCancel: () => void;
}

export interface HeaderProps {
    user: User | null;
    onLogin: () => void;
    onLogout: () => void;
    onGalleryClick: () => void;
}

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}

export interface StoryProgressProps {
    storyRequest: StoryRequest;
    onComplete: (story: Story) => void;
    onCancel: () => void;
}

export interface StoryViewerProps {
    story: Story;
    onClose: () => void;
}

export interface UniverseSelectorProps {
    selected: string | null;
    onSelect: (id: string) => void;
}

// ============================================
// HOOKS RETURN TYPES
// ============================================

export interface UseCharactersReturn {
    characters: Character[];
    addCharacter: (character: Omit<Character, 'id'> & { id?: string }) => void;
    deleteCharacter: (id: string) => void;
    updateCharacter: (id: string, updates: Partial<Character>) => void;
    getCharacterById: (id: string) => Character | undefined;
    hasCharacters: boolean;
}

export interface UseStoriesReturn {
    stories: Story[];
    addStory: (storyData: Partial<Story>) => Story;
    deleteStory: (id: string) => void;
    getStoryById: (id: string) => Story | undefined;
    hasStories: boolean;
    storiesCount: number;
    isLoading: boolean;
    error: string | null;
    refreshStories: () => Promise<void>;
}

// ============================================
// STAGES DE GERAÇÃO
// ============================================

export interface GenerationStage {
    icon: string;
    name: string;
}

export type GenerationStages = Record<number, GenerationStage>;
