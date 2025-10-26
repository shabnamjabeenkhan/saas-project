import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface OverviewCardProps {
  title: string;
  description: string;
  stats: Array<{
    label: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative';
  }>;
}

export function OverviewCard({ title, description, stats }: OverviewCardProps) {
  return (
    <div className="bg-white/5 border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-200">
      <h2 className="text-lg font-medium text-white mb-1">
        {title}
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        {description}
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <div key={stat.label} className={twMerge(
            "space-y-2 relative",
            // Mobile: add top border for items after first with extended width
            index > 0 && "pt-6 border-t border-gray-600/20 before:absolute before:top-0 before:-left-3 before:-right-3 before:h-px before:bg-gray-600/20 before:content-['']",
            // Tablet: remove top border, add left border with extended height
            index > 0 && "sm:border-t-0 sm:before:hidden sm:border-l sm:border-gray-600/20 sm:pl-6 sm:pt-0 sm:after:absolute sm:after:left-0 sm:after:-top-3 sm:after:-bottom-3 sm:after:w-px sm:after:bg-gray-600/20 sm:after:content-['']",
            // Desktop: third item hidden on tablet but shown on desktop
            index === 2 && "sm:hidden lg:block lg:border-l lg:border-gray-600/20 lg:pl-6 lg:after:absolute lg:after:left-0 lg:after:-top-3 lg:after:-bottom-3 lg:after:w-px lg:after:bg-gray-600/20 lg:after:content-['']"
          )}>
            <span className="text-sm text-gray-400 font-medium">{stat.label}</span>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xl font-semibold text-white">{stat.value}</span>
              {stat.change && (
                <div className={twMerge(
                  "flex items-center gap-1.5",
                  stat.changeType === 'positive'
                    ? "[--body-text-color:theme(colors.green.400)]"
                    : "[--body-text-color:theme(colors.red.400)]"
                )}>
                  {stat.changeType === 'positive' ? (
                    <TrendingUp className="size-4 text-[--body-text-color]" />
                  ) : (
                    <TrendingDown className="size-4 text-[--body-text-color]" />
                  )}
                  <span className="text-sm text-[--body-text-color] font-medium">
                    {stat.change}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}