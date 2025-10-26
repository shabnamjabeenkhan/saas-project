import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

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
  const { title, value, change, changeType, description } = stat;

  return (
    <div className="bg-white/5 border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-200 hover:bg-white/[0.07]">
      <div className="mb-2">
        <span className="text-sm text-gray-400 font-medium">{title}</span>
      </div>

      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="text-2xl font-semibold text-white">{value}</span>
        <div className={twMerge(
          "flex items-center gap-1.5",
          changeType === 'positive'
            ? "[--body-text-color:theme(colors.green.400)]"
            : "[--body-text-color:theme(colors.red.400)]"
        )}>
          {changeType === 'positive' ? (
            <TrendingUp className="size-4 text-[--body-text-color]" />
          ) : (
            <TrendingDown className="size-4 text-[--body-text-color]" />
          )}
          <span className="text-sm text-[--body-text-color] font-medium">
            {change}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-2">{description}</p>
    </div>
  );
}