import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import { useTheme } from '../context/ThemeContext';
import { Feather, Scale, Dumbbell, Rocket } from 'lucide-react';

interface BotEntry {
  username: string;
  filename: string;
  tokens: number;
  elo: number;
  matches: number;
  wins: number;
  losses: number;
  createdAt: string;
}

interface LeaderboardData {
  leaderboards: Record<string, BotEntry[]>;
  hallOfFame: Record<string, BotEntry>;
}

const Leaderboard: React.FC = () => {
  const { isDark } = useTheme();

  // Initialize from cache to prevent layout shift
  const [data, setData] = useState<LeaderboardData>(() => {
    if (typeof window === 'undefined') return { leaderboards: {}, hallOfFame: {} };
    const cached = sessionStorage.getItem('leaderboardData');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    return { leaderboards: {}, hallOfFame: {} };
  });

  const [activeCategory, setActiveCategory] = useState<string>('lightweight');
  const [isLoading, setIsLoading] = useState(() => {
    // Only show loading if we don't have cached data
    if (typeof window === 'undefined') return true;
    return !sessionStorage.getItem('leaderboardData');
  });

  const categories = [
    { id: 'lightweight', name: 'Lightweight', icon: Feather, limit: 512 },
    { id: 'middleweight', name: 'Middleweight', icon: Scale, limit: 1024 },
    { id: 'heavyweight', name: 'Heavyweight', icon: Dumbbell, limit: 2048 },
    { id: 'superheavy', name: 'Superheavy', icon: Rocket, limit: null }
  ];

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard');
      const result = await response.json();
      if (result.success) {
        setData(result);
        sessionStorage.setItem('leaderboardData', JSON.stringify(result));
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getEloColor = (elo: number) => {
    if (elo >= 1200) return 'text-gold-500';
    if (elo >= 1100) return 'text-blue-500';
    if (elo >= 1000) return isDark ? 'text-gray-300' : 'text-gray-700';
    if (elo >= 900) return 'text-orange-500';
    return 'text-red-500';
  };

  const activeLeaderboard = data.leaderboards[activeCategory] || [];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="px-6 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gold-500">Tournament Leaderboards</h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Compete across weight categories and climb the rankings
          </p>
        </div>

        {/* Category Tabs */}
        <Card className="p-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const count = data.leaderboards[category.id]?.length || 0;
              const isActive = activeCategory === category.id;
              const Icon = category.icon;

              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-6 py-3 rounded-xl flex items-center space-x-3 transition-all duration-200 ${
                    isActive
                      ? isDark
                        ? 'bg-gold-900 text-gold-400 shadow-neuro-dark-inset'
                        : 'bg-gold-100 text-gold-600 shadow-neuro-light-inset'
                      : isDark
                        ? 'bg-neuro-dark shadow-neuro-dark hover:shadow-neuro-dark-inset text-gray-300'
                        : 'bg-neuro-light shadow-neuro-light hover:shadow-neuro-light-inset text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">{category.name}</div>
                    <div className="text-xs opacity-75">
                      {isLoading ? '...' : `${count} bots`} • {category.limit ? `≤${category.limit}` : '∞'} tokens
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Active Leaderboard */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Leaderboard */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gold-500">
                  {categories.find(c => c.id === activeCategory)?.name} Leaderboard
                </h2>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {activeLeaderboard.length} competitors
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`animate-pulse p-4 rounded-xl ${
                      isDark ? 'bg-gray-800' : 'bg-gray-100'
                    }`}>
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gray-300 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                          <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                        </div>
                        <div className="w-16 h-8 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeLeaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🏆</div>
                  <h3 className="text-xl font-bold mb-2">No Competitors Yet</h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Be the first to submit a bot in this category!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeLeaderboard.map((bot, index) => {
                    const rank = index + 1;
                    return (
                      <div
                        key={`${bot.username}-${bot.filename}`}
                        className={`p-4 rounded-xl transition-all duration-200 ${
                          rank <= 3
                            ? isDark
                              ? 'bg-gradient-to-r from-gold-900 to-yellow-900 shadow-neuro-dark'
                              : 'bg-gradient-to-r from-gold-100 to-yellow-100 shadow-neuro-light'
                            : isDark
                              ? 'bg-gray-800 hover:bg-gray-750'
                              : 'bg-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-2xl font-bold w-12 text-center">
                              {getRankIcon(rank)}
                            </div>
                            <div>
                              <div className="font-bold text-lg">{bot.username}</div>
                              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {bot.filename} • {bot.tokens} tokens
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getEloColor(bot.elo)}`}>
                              {bot.elo}
                            </div>
                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              ELO Rating
                            </div>
                          </div>
                        </div>
                        
                        {/* Stats Row */}
                        <div className="mt-3 flex justify-between text-sm">
                          <div className="flex space-x-4">
                            <span>Matches: <strong>{bot.matches}</strong></span>
                            <span className="text-green-500">Wins: <strong>{bot.wins}</strong></span>
                            <span className="text-red-500">Losses: <strong>{bot.losses}</strong></span>
                          </div>
                          <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            Joined: {new Date(bot.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gold-500 mb-4">Category Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Bots:</span>
                  <span className="font-bold">
                    {isLoading ? '...' : activeLeaderboard.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg ELO:</span>
                  <span className="font-bold">
                    {isLoading ? '...' : activeLeaderboard.length > 0 
                      ? Math.round(activeLeaderboard.reduce((sum, bot) => sum + bot.elo, 0) / activeLeaderboard.length)
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Matches:</span>
                  <span className="font-bold">
                    {isLoading ? '...' : activeLeaderboard.reduce((sum, bot) => sum + bot.matches, 0)}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-gold-500 mb-4">ELO Guide</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gold-500 rounded"></div>
                  <span>1200+ Master</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>1100+ Expert</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-500 rounded"></div>
                  <span>1000 Rookie</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>900+ Novice</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>&lt;900 Beginner</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;