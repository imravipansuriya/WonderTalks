import React, { useState, useEffect } from 'react';
import { getStoryHistory, getReadingStats, getFavorites, removeFavorite } from '../services/storageUtils';
import { Story, FavoriteItem } from '../types';
import { ArrowLeft, Clock, Book, Calendar, Heart, ShieldCheck, Trash2 } from 'lucide-react';

interface ParentDashboardProps {
  onBack: () => void;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ onBack }) => {
  const [history, setHistory] = useState<Story[]>([]);
  const [stats, setStats] = useState({ totalStories: 0, totalTimeMinutes: 0 });
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    setHistory(getStoryHistory());
    setStats(getReadingStats());
    setFavorites(getFavorites());
  }, []);

  const handleDeleteFavorite = (id: string) => {
      const updated = removeFavorite(id);
      setFavorites(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={onBack}
            className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 mr-4 transition-colors"
          >
            <ArrowLeft className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="text-indigo-600" />
              Parent Dashboard
            </h1>
            <p className="text-slate-500">Monitor progress and view story history</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <Book className="text-blue-600 w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 font-medium">Stories Read</p>
              <h3 className="text-3xl font-bold text-slate-800">{stats.totalStories}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-green-100 p-4 rounded-full">
              <Clock className="text-green-600 w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 font-medium">Reading Time</p>
              <h3 className="text-3xl font-bold text-slate-800">{stats.totalTimeMinutes} <span className="text-lg font-normal text-slate-400">mins</span></h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-pink-100 p-4 rounded-full">
              <Heart className="text-pink-600 w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 font-medium">Favorites</p>
              <h3 className="text-3xl font-bold text-slate-800">{favorites.length}</h3>
            </div>
          </div>
        </div>

        {/* Favorite Illustrations */}
        <div className="mb-10">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Heart className="text-pink-500" size={20} fill="currentColor" /> Favorite Moments
            </h2>
            {favorites.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                    Tap the heart icon on story pages to save magical moments here!
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {favorites.map(fav => (
                        <div key={fav.id} className="group relative aspect-square rounded-xl overflow-hidden shadow-sm">
                            <img src={fav.imageUrl} alt="Favorite" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2">
                                <button 
                                    onClick={() => handleDeleteFavorite(fav.id)}
                                    className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50"
                                    title="Remove"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Story History List */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">Recent Adventures</h2>
          </div>
          
          {history.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No stories read yet. Start an adventure!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium text-sm">
                  <tr>
                    <th className="p-6">Title</th>
                    <th className="p-6">Date</th>
                    <th className="p-6">Pages</th>
                    <th className="p-6">Time Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((story, idx) => (
                    <tr key={story.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6 font-bold text-slate-700">{story.title}</td>
                      <td className="p-6 text-slate-500 flex items-center gap-2">
                        <Calendar size={16} />
                        {new Date(story.date).toLocaleDateString()}
                      </td>
                      <td className="p-6 text-slate-600">{story.pages.length}</td>
                      <td className="p-6 text-slate-600">
                         {Math.floor(story.durationSeconds / 60)}m {story.durationSeconds % 60}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;