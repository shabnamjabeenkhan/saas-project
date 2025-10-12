import { BarChart3 } from 'lucide-react';

export function RevenueChart() {
  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <BarChart3 className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Lead Generation This Month</h3>
            <p className="text-sm text-gray-400">Progress towards your monthly lead generation goal</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Last 6 months</p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Progress</span>
          <span className="text-sm font-medium text-white">24/30 leads</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: '80%' }}
          />
        </div>
      </div>

      {/* Stats Comparison */}
      <div className="grid grid-cols-2 gap-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">24</p>
          <p className="text-sm text-gray-400">This month</p>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-gray-500">vs</span>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">8</p>
          <p className="text-sm text-gray-400">Last month</p>
        </div>
        <div className="text-center">
          <div className="inline-flex items-center gap-1 text-green-400 text-sm font-medium">
            <span>↗</span>
            3x growth
          </div>
        </div>
      </div>

      {/* Goal Status */}
      <div className="mt-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-400 font-medium">On track to hit 3x improvement goal!</span>
        </div>
      </div>

      {/* Chart placeholder with colorful bars */}
      <div className="mt-6 flex items-end justify-between gap-2 h-32">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 bg-green-500 rounded-t" style={{ height: '60%' }}></div>
          <span className="text-xs text-gray-500">Jan</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 bg-yellow-500 rounded-t" style={{ height: '40%' }}></div>
          <span className="text-xs text-gray-500">Feb</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 bg-purple-500 rounded-t" style={{ height: '80%' }}></div>
          <span className="text-xs text-gray-500">Mar</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 bg-blue-500 rounded-t" style={{ height: '100%' }}></div>
          <span className="text-xs text-gray-500">Apr</span>
        </div>
      </div>
    </div>
  );
}