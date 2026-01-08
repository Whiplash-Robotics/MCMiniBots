import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { useTheme } from '../context/ThemeContext';

const Home: React.FC = () => {
  const { isDark } = useTheme();

  const categories = [
    {
      name: 'Lightweight',
      tokens: 512,
      description: 'Perfect for nimble, efficient bots',
      icon: '🪶',
    },
    {
      name: 'Middleweight',
      tokens: 1024,
      description: 'Balanced approach with more capabilities',
      icon: '⚖️',
    },
    {
      name: 'Heavyweight',
      tokens: 2048,
      description: 'Powerful bots with advanced strategies',
      icon: '💪',
    },
    {
      name: 'Superheavy',
      tokens: 'unlimited',
      description: 'No limits, maximum potential',
      icon: '🚀',
    },
  ];

  return (
    <div className="space-y-12">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
          MCMiniBots Tournament
        </h1>
        <p className={`text-xl max-w-3xl mx-auto ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Welcome to the ultimate Minecraft PVP bot tournament! Submit your JavaScript bots across different weight classes and compete for glory.
        </p>
        
        <div className="flex justify-center space-x-4">
          <Link to="/submit">
            <Button variant="gold" size="lg">
              Submit Your Bot
            </Button>
          </Link>
          <Link to="/token-counter">
            <Button size="lg">
              Check Token Count
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <Card key={category.name} className="p-6 text-center space-y-4" hoverable>
            <div className="text-4xl">{category.icon}</div>
            <h3 className="text-xl font-bold text-gold-500">{category.name}</h3>
            <div className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>
              {typeof category.tokens === 'number' ? `${category.tokens} tokens` : category.tokens}
            </div>
            <p className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {category.description}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-8 space-y-6">
        <h2 className="text-2xl font-bold text-gold-500">Tournament Rules</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Submission Guidelines</h3>
            <ul className={`space-y-2 text-sm ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <li>• One bot per category per user</li>
              <li>• JavaScript files only (.js)</li>
              <li>• Must stay within token limits</li>
              <li>• No malicious code allowed</li>
              <li>• Limited imports (see allowed list)</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Competition Format</h3>
            <ul className={`space-y-2 text-sm ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <li>• Round-robin tournament</li>
              <li>• Minecraft PVP combat</li>
              <li>• Best of 3 matches</li>
              <li>• Winners by category</li>
              <li>• Live streaming available</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Home;