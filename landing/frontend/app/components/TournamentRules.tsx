import React, { useState } from 'react';
import NeuroCard from './NeuroCard';
import NeuroButton from './NeuroButton';
import { useTheme } from '../context/ThemeContext';

interface RuleSection {
  id: string;
  title: string;
  icon: string;
  rules: string[];
}

const TournamentRules: React.FC = () => {
  const { isDark } = useTheme();
  const [activeSection, setActiveSection] = useState<string>('submission');

  const ruleSections: RuleSection[] = [
    {
      id: 'submission',
      title: 'Submission Guidelines',
      icon: '📝',
      rules: [
        'One bot per weight category per user',
        'JavaScript files only (.js extension)',
        'Must stay within token limits for each category',
        'No malicious code or exploits allowed',
        'Limited to approved imports and libraries',
        'Code must be original work or properly attributed',
        'Submissions can be edited until tournament begins'
      ]
    },
    {
      id: 'categories',
      title: 'Weight Categories',
      icon: '⚖️',
      rules: [
        'Lightweight: ≤ 512 tokens - For nimble, efficient bots',
        'Middleweight: ≤ 1024 tokens - Balanced approach with more capabilities',
        'Heavyweight: ≤ 2048 tokens - Powerful bots with advanced strategies',
        'Superheavy: Unlimited tokens - No limits, maximum potential',
        'Token counting includes code and string literals',
        'Comments and whitespace are not counted',
        'Each category competes separately'
      ]
    },
    {
      id: 'competition',
      title: 'Competition Format',
      icon: '🏆',
      rules: [
        'Round-robin tournament within each weight class',
        'Minecraft PVP combat in controlled arena',
        'Best of 3 matches per matchup',
        'Winners determined by total victories',
        'Live streaming of all matches',
        'Real-time leaderboards and statistics',
        'Final championship rounds for each category'
      ]
    },
    {
      id: 'technical',
      title: 'Technical Requirements',
      icon: '⚙️',
      rules: [
        'Bots must use the provided MCMinibots API',
        'No external network connections allowed',
        'Maximum execution time limits enforced',
        'Memory usage restrictions apply',
        'All bots run in isolated sandboxes',
        'Standard Minecraft physics and mechanics',
        'No client modifications or hacks permitted'
      ]
    },
    {
      id: 'conduct',
      title: 'Code of Conduct',
      icon: '🤝',
      rules: [
        'Respectful behavior towards all participants',
        'No harassment or toxic language',
        'Fair play and sportsmanship expected',
        'Report any bugs or issues promptly',
        'Help create a positive community',
        'Violations may result in disqualification',
        'Admins have final say on rule interpretations'
      ]
    }
  ];

  const activeRules = ruleSections.find(section => section.id === activeSection);

  return (
    <NeuroCard className="p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation Tabs */}
        <div className="lg:w-1/3 space-y-2">
          <h3 className="text-xl font-bold text-gold-500 mb-4">Tournament Rules</h3>
          {ruleSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                activeSection === section.id
                  ? isDark
                    ? 'bg-gold-900 text-gold-400 shadow-neuro-dark-inset'
                    : 'bg-gold-100 text-gold-600 shadow-neuro-light-inset'
                  : isDark
                    ? 'bg-neuro-dark shadow-neuro-dark hover:shadow-neuro-dark-inset text-gray-300'
                    : 'bg-neuro-light shadow-neuro-light hover:shadow-neuro-light-inset text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{section.icon}</span>
                <div>
                  <div className="font-semibold">{section.title}</div>
                  <div className="text-sm opacity-75">{section.rules.length} rules</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Rule Content */}
        <div className="lg:w-2/3">
          {activeRules && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-6">
                <span className="text-3xl">{activeRules.icon}</span>
                <h4 className="text-2xl font-bold text-gold-500">{activeRules.title}</h4>
              </div>
              
              <div className="space-y-3">
                {activeRules.rules.map((rule, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl transition-all duration-200 ${
                      isDark
                        ? 'bg-gray-800 shadow-neuro-dark-inset'
                        : 'bg-gray-100 shadow-neuro-light-inset'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isDark ? 'bg-gold-900 text-gold-400' : 'bg-gold-100 text-gold-600'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="flex-1">{rule}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-opacity-20 border-gray-500">
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <strong>Need clarification?</strong> Join our Discord community or contact the admins 
                  if you have questions about these rules.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </NeuroCard>
  );
};

export default TournamentRules;