import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import Navbar from "../components/Navbar";
import Card from "../components/Card";
import Button from "../components/Button";
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

  // Initialize from cache to prevent layout shift
  const [stats, setStats] = useState<Statistics>(() => {
    if (typeof window === 'undefined') return { totalCompetitors: 0, totalSubmissions: 0 };
    const cached = sessionStorage.getItem('homeStats');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    return { totalCompetitors: 0, totalSubmissions: 0 };
  });

  const [hallOfFame, setHallOfFame] = useState<Record<string, any>>(() => {
    if (typeof window === 'undefined') return {};
    const cached = sessionStorage.getItem('homeHallOfFame');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    return {};
  });

  const [isLoading, setIsLoading] = useState(() => {
    // Only show loading if we don't have cached data
    if (typeof window === 'undefined') return true;
    return !sessionStorage.getItem('homeStats') && !sessionStorage.getItem('homeHallOfFame');
  });

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
        sessionStorage.setItem('homeStats', JSON.stringify(data));
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
        sessionStorage.setItem('homeHallOfFame', JSON.stringify(data.hallOfFame));
      }
    } catch (error) {
      console.error('Failed to fetch hall of fame:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statisticsCards = [
    {
      title: "Competitors",
      value: stats.totalCompetitors,
      description: "Registered participants",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: "Submissions",
      value: stats.totalSubmissions,
      description: "Bots submitted across all categories",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      title: "Champions",
      value: Object.keys(hallOfFame).length,
      description: "Hall of fame inductees",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto space-y-16 px-6 py-12">
        {/* Hero Section */}
        <div className="text-center space-y-8 py-8">
          <div className="space-y-4">
            <h1 className={`text-6xl font-bold bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 bg-clip-text text-transparent ${
              isDark ? '[text-shadow:0_0_40px_rgba(245,158,11,0.2)]' : ''
            }`}>
              MCMiniBots Tournament
            </h1>
            <div className={`h-1 w-32 mx-auto rounded-full ${
              isDark ? 'bg-gradient-to-r from-transparent via-gold-500 to-transparent' : 'bg-gradient-to-r from-transparent via-gold-600 to-transparent'
            }`} />
          </div>
          <p className={`text-xl max-w-2xl mx-auto leading-relaxed ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}>
            The ultimate Minecraft PVP bot tournament. Submit your JavaScript bots across different weight classes and compete for glory.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link to="/submit">
              <Button variant="gold" size="lg">
                Submit Bot
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button size="lg">View Leaderboard</Button>
            </Link>
            <Link to="/token">
              <Button variant="ghost" size="lg">Token Counter</Button>
            </Link>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>Live Stats</h2>
            <div className={`h-0.5 w-16 mx-auto rounded-full ${isDark ? 'bg-gold-500' : 'bg-gold-600'}`} />
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {statisticsCards.map((stat) => (
              <Card key={stat.title} className="p-8 text-center space-y-4 relative overflow-hidden" hoverable glow={isDark}>
                <div className={`inline-flex p-4 rounded-lg ${
                  isDark ? 'text-gold-400 bg-gold-500/10' : 'text-gold-600 bg-gold-500/10'
                }`}>
                  {stat.icon}
                </div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{stat.title}</h3>
                <div className={`text-4xl font-bold ${
                    isDark ? "text-gold-400" : "text-gold-600"
                  }`}>
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-10 w-20 mx-auto rounded"></div>
                  ) : (
                    stat.value
                  )}
                </div>
                <p className={`text-sm ${
                    isDark ? "text-gray-500" : "text-gray-500"
                  }`}>
                  {stat.description}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Hall of Fame */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>Hall of Fame</h2>
            <div className={`h-0.5 w-16 mx-auto rounded-full mb-4 ${isDark ? 'bg-gold-500' : 'bg-gold-600'}`} />
            <p className={`text-lg ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Champions of each weight category
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className={`w-16 h-16 rounded-lg mx-auto ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                    <div className={`h-4 rounded mx-auto w-3/4 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                    <div className={`h-6 rounded mx-auto w-1/2 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : Object.keys(hallOfFame).length === 0 ? (
            <Card className="p-12 text-center" glow={isDark}>
              <div className={`inline-flex p-6 rounded-full mb-6 ${isDark ? 'bg-gold-500/10' : 'bg-gold-500/10'}`}>
                <svg className={`w-16 h-16 ${isDark ? 'text-gold-400' : 'text-gold-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>No Champions Yet</h3>
              <p className={`text-lg mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                The tournament is just beginning. Be among the first to claim your throne.
              </p>
              <Link to="/submit">
                <Button variant="gold" size="lg">
                  Submit Your Bot
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { id: 'lightweight', name: 'Lightweight', limit: '≤ 512' },
                { id: 'middleweight', name: 'Middleweight', limit: '≤ 1024' },
                { id: 'heavyweight', name: 'Heavyweight', limit: '≤ 2048' },
                { id: 'superheavy', name: 'Superheavy', limit: 'Unlimited' }
              ].map((category) => {
                const champion = hallOfFame[category.id];

                return (
                  <Card key={category.id} className="p-6 text-center space-y-4" hoverable glow={champion && isDark}>
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg font-bold text-lg ${
                      isDark ? 'bg-gold-500/10 text-gold-400' : 'bg-gold-500/10 text-gold-600'
                    }`}>
                      {category.id[0].toUpperCase()}
                    </div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>{category.name}</h3>
                    <div className={`text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{category.limit} tokens</div>

                    {champion ? (
                      <div className="space-y-3 pt-2">
                        <div className={`p-4 rounded-lg border ${
                          isDark ? 'bg-surface-dark-hover border-gold-500/30' : 'bg-surface-light-hover border-gold-500/30'
                        }`}>
                          <div className={`text-base font-bold mb-2 ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>{champion.username}</div>
                          <div className={`text-2xl font-bold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{champion.elo}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>ELO Rating</div>
                          <div className={`text-xs mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{champion.tokens} tokens</div>
                        </div>
                      </div>
                    ) : (
                      <div className={`p-4 rounded-lg border ${
                        isDark ? 'bg-surface-dark border-border-dark' : 'bg-gray-50 border-border-light'
                      }`}>
                        <div className={`text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>No champion yet</div>
                        <div className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Be the first</div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Interactive Tournament Rules */}
        <div className="space-y-8 pb-8">
          <div className="text-center">
            <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>Tournament Rules</h2>
            <div className={`h-0.5 w-16 mx-auto rounded-full ${isDark ? 'bg-gold-500' : 'bg-gold-600'}`} />
          </div>
          <TournamentRules />
        </div>
      </div>
    </div>
  );
};

export default Home;
