import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import Navbar from "../components/Navbar";
import NeuroCard from "../components/NeuroCard";
import NeuroButton from "../components/NeuroButton";
import TournamentRules from "../components/TournamentRules";
import { useTheme } from "../context/ThemeContext";

interface Statistics {
  totalCompetitors: number;
  totalSubmissions: number;
}

interface HallOfFameData {
  hallOfFame: Record<string, {
    username: string;
    filename: string;
    tokens: number;
    elo: number;
  }>;
}

const Home: React.FC = () => {
  const { isDark } = useTheme();
  const [stats, setStats] = useState<Statistics>({
    totalCompetitors: 0,
    totalSubmissions: 0
  });
  const [hallOfFame, setHallOfFame] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
    fetchHallOfFame();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const fetchHallOfFame = async () => {
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      if (data.success) {
        setHallOfFame(data.hallOfFame);
      }
    } catch (error) {
      console.error('Failed to fetch hall of fame:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statisticsCards = [
    {
      title: "Total Competitors",
      value: stats.totalCompetitors,
      icon: "👥",
      description: "Registered participants",
      color: "blue"
    },
    {
      title: "Total Submissions", 
      value: stats.totalSubmissions,
      icon: "📋",
      description: "Bots submitted across all categories",
      color: "green"
    },
    {
      title: "Hall of Fame",
      value: Object.keys(hallOfFame).length,
      icon: "🏆",
      description: "Champions across all categories",
      color: "gold"
    }
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="space-y-12 px-6 py-8">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
            MCMiniBots Tournament
          </h1>
          <p className={`text-xl max-w-3xl mx-auto ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}>
            Welcome to the ultimate Minecraft PVP bot tournament! Submit your
            JavaScript bots across different weight classes and compete for glory.
          </p>

          <div className="flex justify-center space-x-4">
            <Link to="/submit">
              <NeuroButton variant="gold" size="lg">
                Submit Your Bot
              </NeuroButton>
            </Link>
            <Link to="/token">
              <NeuroButton size="lg">Check Token Count</NeuroButton>
            </Link>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gold-500 text-center">Tournament Statistics</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {statisticsCards.map((stat, index) => (
              <NeuroCard key={stat.title} className="p-6 text-center space-y-4" hoverable>
                <div className="text-4xl">{stat.icon}</div>
                <h3 className="text-xl font-bold text-gold-500">{stat.title}</h3>
                <div className={`text-3xl font-bold ${
                    isDark ? "text-white" : "text-gray-800"
                  }`}>
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-300 h-8 w-16 mx-auto rounded"></div>
                  ) : (
                    stat.value
                  )}
                </div>
                <p className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>
                  {stat.description}
                </p>
              </NeuroCard>
            ))}
          </div>
        </div>

        {/* Hall of Fame */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gold-500 mb-4">Hall of Fame</h2>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Meet the champions of each weight category
            </p>
          </div>
          
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <NeuroCard key={i} className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto"></div>
                    <div className="h-4 bg-gray-300 rounded mx-auto w-3/4"></div>
                    <div className="h-6 bg-gray-300 rounded mx-auto w-1/2"></div>
                  </div>
                </NeuroCard>
              ))}
            </div>
          ) : Object.keys(hallOfFame).length === 0 ? (
            <NeuroCard className="p-12 text-center">
              <div className="text-6xl mb-6">👑</div>
              <h3 className="text-2xl font-bold text-gold-500 mb-4">No Champions Yet</h3>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                The tournament is just beginning! Be among the first to claim your throne.
              </p>
              <Link to="/submit">
                <NeuroButton variant="gold" size="lg">
                  Submit Your Bot
                </NeuroButton>
              </Link>
            </NeuroCard>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { id: 'lightweight', name: 'Lightweight', icon: '🪶', limit: '≤ 512' },
                { id: 'middleweight', name: 'Middleweight', icon: '⚖️', limit: '≤ 1024' },
                { id: 'heavyweight', name: 'Heavyweight', icon: '💪', limit: '≤ 2048' },
                { id: 'superheavy', name: 'Superheavy', icon: '🚀', limit: 'Unlimited' }
              ].map((category) => {
                const champion = hallOfFame[category.id];
                
                return (
                  <NeuroCard key={category.id} className="p-6 text-center space-y-4" hoverable>
                    <div className="text-4xl">{category.icon}</div>
                    <h3 className="text-lg font-bold text-gold-500">{category.name}</h3>
                    <div className="text-sm opacity-75">{category.limit} tokens</div>
                    
                    {champion ? (
                      <div className="space-y-2">
                        <div className={`p-3 rounded-xl ${
                          isDark ? 'bg-gold-900 text-gold-400' : 'bg-gold-100 text-gold-600'
                        }`}>
                          <div className="text-lg font-bold">👑 {champion.username}</div>
                          <div className="text-sm">{champion.elo} ELO</div>
                          <div className="text-xs opacity-75">{champion.tokens} tokens</div>
                        </div>
                      </div>
                    ) : (
                      <div className={`p-3 rounded-xl ${
                        isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <div className="text-sm">No champion yet</div>
                        <div className="text-xs">Be the first!</div>
                      </div>
                    )}
                  </NeuroCard>
                );
              })}
            </div>
          )}
        </div>

        {/* Interactive Tournament Rules */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gold-500 text-center">Tournament Rules</h2>
          <TournamentRules />
        </div>
      </div>
    </div>
  );
};

export default Home;
