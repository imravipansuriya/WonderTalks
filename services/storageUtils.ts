import { Story, FavoriteItem } from '../types';

const STORAGE_KEY_STORIES = 'magic_storybook_history';
const STORAGE_KEY_FAVORITES = 'magic_storybook_favorites';

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

export const saveFavorite = (item: FavoriteItem) => {
  try {
    const current = getFavorites();
    if (current.some(f => f.imageUrl === item.imageUrl)) return; // Prevent duplicates
    const updated = [item, ...current];
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save favorite", e);
  }
};

export const getFavorites = (): FavoriteItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_FAVORITES);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const removeFavorite = (id: string) => {
  try {
    const current = getFavorites();
    const updated = current.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to remove favorite", e);
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