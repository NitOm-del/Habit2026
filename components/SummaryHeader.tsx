import React from 'react';

interface SummaryHeaderProps {
  monthName: string;
  year: number;
  totalHabits: number;
  totalCompleted: number;
  totalPossible: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export const SummaryHeader: React.FC<SummaryHeaderProps> = ({
  monthName,
  year,
  totalHabits,
  totalCompleted,
  totalPossible,
  onPrevMonth,
  onNextMonth,
}) => {
  const percentage = totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0;

  return (
    <div className="bg-gray-100 border border-gray-300 p-4 mb-4 rounded-sm flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
      
      <div className="flex items-center justify-between w-full md:w-auto gap-4">
        <button 
          onClick={onPrevMonth}
          className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
          title="Previous Month"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        
        <h1 className="text-3xl font-bold text-gray-700 text-center min-w-[200px]">
          {monthName} <span className="text-lg font-normal text-gray-500">{year}</span>
        </h1>

        <button 
          onClick={onNextMonth}
          className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
          title="Next Month"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="flex flex-1 justify-around items-center w-full max-w-2xl">
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase font-semibold">Number of habits</p>
          <p className="text-xl font-bold text-gray-800">{totalHabits}</p>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase font-semibold">Completed habits</p>
          <p className="text-xl font-bold text-gray-800">{totalCompleted}</p>
        </div>

        <div className="flex flex-col items-center min-w-[150px] md:min-w-[200px] flex-1 md:flex-none px-4 md:px-0">
          <div className="flex justify-between w-full text-xs text-gray-500 font-semibold mb-1">
            <span>Progress</span>
            <span>{percentage.toFixed(2)}%</span>
          </div>
          <div className="w-full bg-gray-300 h-4 rounded-sm overflow-hidden border border-gray-400">
            <div
              className="bg-green-400 h-full"
              style={{ width: `${percentage}%`, transition: 'width 0.5s ease-in-out' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
