import { Story } from '../types';

const STORAGE_KEY_STORIES = 'magic_storybook_history';
const STORAGE_KEY_SETTINGS = 'magic_storybook_settings';

export const saveStoryToHistory = (story: Story) => {
  try {
    const currentHistory = getStoryHistory();
    const updatedHistory = [story, ...currentHistory]; // Newest first
    localStorage.setItem(STORAGE_KEY_STORIES, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error("Failed to save story history", e);
  }
};

export const getStoryHistory = (): Story[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_STORIES);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const getReadingStats = () => {
  const history = getStoryHistory();
  const totalStories = history.length;
  const totalTimeSeconds = history.reduce((acc, story) => acc + (story.durationSeconds || 0), 0);
  
  return {
    totalStories,
    totalTimeMinutes: Math.round(totalTimeSeconds / 60)
  };
};
