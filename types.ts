export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface PlaceSource {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    phoneNumber?: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        content: string;
      }[];
    }[];
  };
}

export interface DishAnalysisResult {
  dishName: string;
  description: string;
  groundingChunks: GroundingChunk[];
  rawText: string;
}

export enum AppState {
  IDLE = 'IDLE',
  CAPTURING = 'CAPTURING',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}

export interface AppError {
  message: string;
  code?: string;
}