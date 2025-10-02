export type GeneratedImageStatus = 'pending' | 'success' | 'failed' | 'empty';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GeneratedImage {
  id: string;
  status: GeneratedImageStatus;
  imageUrl: string | null;
  promptBase: string;
}

export interface GenerationBatch {
  id: string;
  type: 'style' | 'item_replace' | 'wall_paint' | 'garden' | 'style_match' | 'ai_advisor' | 'multi_item' | 'exterior' | 'festive' | 'floor_style' | 'free_canvas';
  timestamp: Date;
  subjectImage: string | null;
  styleImages: string[];
  prompt: string;
  results: GeneratedImage[];
  templateIds: string[];
  textResponse?: string;
  chatHistory?: ChatMessage[];
  multiModelResponses?: {
    personaId: string;
    text: string;
  }[];
  buildingTypeId?: string;
}

// --- Presets ---

export type PresetType = 'photo' | 'style' | 'global';

export interface BasePreset {
  id:string;
  name: string;
}

// Granular Presets
export interface PhotoPreset extends BasePreset {
  module1Images: (string | null)[];
  module2Images: (string | null)[];
}

export interface StylePreset extends BasePreset {
  userPrompt: string;
}

// Global Preset
export interface GlobalPreset extends BasePreset {
  module1Images: (string | null)[];
  module2Images: (string | null)[];
  userPrompt: string;
}

export type AnyPreset = PhotoPreset | StylePreset | GlobalPreset;

// --- Prompt Templates ---

export interface PromptTemplate {
  id: string;
  name:string;
  imageUrl: string;
  prompt: string;
}

export interface PromptTemplateCategory {
  name: string;
  templates: PromptTemplate[];
}

// --- AI Advisor ---

export interface AdvisorPersona {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  systemInstruction: string;
}