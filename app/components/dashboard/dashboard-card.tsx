import React from 'react';

interface DashboardCardProps {
  stat: {
    title: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative';
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
    description: string;
  };
  index: number;
}

export function DashboardCard({ stat }: DashboardCardProps) {
  const { title, value, change, changeType, icon: Icon, color, bgColor, description } = stat;

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 sm:p-6 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-400">{title}</p>
            <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center gap-1 text-xs sm:text-sm font-medium ${
            changeType === 'positive' ? 'text-green-400' : 'text-red-400'
          }`}>
            <span>{changeType === 'positive' ? '↗' : '↘'}</span>
            {change}
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">{description}</p>

      {/* Progress bar */}
      <div className="mt-3 w-full bg-gray-800 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${
            color.includes('blue') ? 'bg-blue-500' :
            color.includes('green') ? 'bg-green-500' :
            color.includes('purple') ? 'bg-purple-500' :
            'bg-orange-500'
          }`}
          style={{
            width: changeType === 'positive' ? '75%' : '45%'
          }}
        />
      </div>
    </div>
  );
}