import React, { useState } from 'react';
import Card from './Card';
import { useTheme } from '../context/ThemeContext';

interface RuleSection {
  id: string;
  title: string;
  badge: string;
  rules: string[];
}

const TournamentRules: React.FC = () => {
  const { isDark } = useTheme();
  const [activeSection, setActiveSection] = useState<string>('submission');

  const ruleSections: RuleSection[] = [
    {
      id: 'submission',
      title: 'Submission Guidelines',
      badge: 'SG',
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
      badge: 'WC',
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
      badge: 'CF',
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
      badge: 'TR',
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
      badge: 'CC',
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
    <Card className="p-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Tabs */}
        <div className="lg:w-1/3 space-y-2">
          {ruleSections.map((section, idx) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full p-4 rounded-lg text-left transition-all duration-200 border ${
                activeSection === section.id
                  ? isDark
                    ? 'bg-surface-dark-hover border-gold-500/30 text-gold-400'
                    : 'bg-surface-light-hover border-gold-500/30 text-gold-600'
                  : isDark
                    ? 'bg-surface-dark border-border-dark text-gray-400 hover:border-gold-500/20 hover:text-gray-300'
                    : 'bg-surface-light border-border-light text-gray-600 hover:border-gold-500/20 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                  activeSection === section.id
                    ? isDark
                      ? 'bg-gold-500/20 text-gold-400'
                      : 'bg-gold-500/20 text-gold-600'
                    : isDark
                      ? 'bg-surface-dark-hover text-gray-500'
                      : 'bg-gray-100 text-gray-500'
                }`}>
                  {section.badge}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{section.title}</div>
                  <div className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{section.rules.length} rules</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Rule Content */}
        <div className="lg:w-2/3">
          {activeRules && (
            <div className="space-y-6">
              <div className="pb-4 border-b ${isDark ? 'border-border-dark' : 'border-border-light'}">
                <h4 className={`text-2xl font-bold ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>{activeRules.title}</h4>
              </div>

              <div className="space-y-3">
                {activeRules.rules.map((rule, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      isDark
                        ? 'bg-surface-dark-hover/50 border-border-dark'
                        : 'bg-gray-50 border-border-light'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                        isDark ? 'bg-gold-500/20 text-gold-400' : 'bg-gold-500/20 text-gold-600'
                      }`}>
                        {index + 1}
                      </span>
                      <span className={`flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{rule}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`mt-6 pt-4 border-t ${isDark ? 'border-border-dark' : 'border-border-light'}`}>
                <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Need clarification?</span> Join our Discord community or contact the admins
                  if you have questions about these rules.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TournamentRules;