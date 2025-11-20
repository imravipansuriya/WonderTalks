export interface StoryPage {
  text: string;
  imagePrompt: string;
  choices?: string[]; // For interactive storytelling
  userRecordingUrl?: string; // For voice recording
  isEnding?: boolean;
}

export interface Story {
  id: string;
  title: string;
  date: string;
  pages: StoryPage[];
  durationSeconds: number; // Reading time
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum AppMode {
  HOME = 'HOME',
  STORY_WIZARD = 'STORY_WIZARD',
  READING = 'READING',
  CHAT = 'CHAT',
  PARENT_DASHBOARD = 'PARENT_DASHBOARD'
}

export interface ParentSettings {
  theme: string;
  allowVoiceRecording: boolean;
}