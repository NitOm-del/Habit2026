import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DEFAULT_HABITS_TEMPLATE, DAYS_OF_WEEK } from './constants';
import { Habit, MentalState, DayConfig, MonthData } from './types';
import { SummaryHeader } from './components/SummaryHeader';
import { AnalysisChart } from './components/AnalysisChart';

// --- Utils ---
const getStorageKey = (year: number, month: number) => `habit-tracker-data-${year}-${month}`;

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const generateEmptyMentalState = (days: number): MentalState[] => 
  Array.from({ length: days }, (_, i) => ({ day: i + 1, mood: 0, motivation: 0 }));

export default function App() {
  // --- Date State ---
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const daysInMonth = getDaysInMonth(year, month);

  // --- Data State ---
  const [habits, setHabits] = useState<Habit[]>([]);
  const [mentalState, setMentalState] = useState<MentalState[]>([]);
  const [initialized, setInitialized] = useState(false);

  // --- Editing State ---
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  
  // --- Delete Modal State ---
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  // --- Persistence Logic ---
  
  // Load data when month changes
  useEffect(() => {
    setInitialized(false);
    const key = getStorageKey(year, month);
    const stored = localStorage.getItem(key);

    if (stored) {
      // Data exists for this month
      const parsed: MonthData = JSON.parse(stored);
      // Ensure arrays match current days in month (in case of corruption or manual editing)
      const adjustedHabits = parsed.habits.map(h => ({
        ...h,
        checks: h.checks.length === daysInMonth ? h.checks : Array(daysInMonth).fill(false).map((_, i) => h.checks[i] || false)
      }));
      
      // Ensure mental state matches days
      const adjustedMental = Array(daysInMonth).fill(null).map((_, i) => 
        parsed.mentalState.find(m => m.day === i + 1) || { day: i + 1, mood: 0, motivation: 0 }
      );

      setHabits(adjustedHabits);
      setMentalState(adjustedMental);
    } else {
      // No data for this month. Check previous month for habits to carry over.
      // Logic: Previous month is month - 1. Handle year rollover.
      const prevDate = new Date(year, month - 1);
      const prevKey = getStorageKey(prevDate.getFullYear(), prevDate.getMonth());
      const prevStored = localStorage.getItem(prevKey);

      let initialHabits: Habit[] = [];

      if (prevStored) {
        // Carry over habits from previous month, reset checks
        const prevParsed: MonthData = JSON.parse(prevStored);
        initialHabits = prevParsed.habits.map(h => ({
          ...h,
          checks: Array(daysInMonth).fill(false) // All unchecked for new month
        }));
      } else {
        // New user or no history: Use Default Template
        initialHabits = DEFAULT_HABITS_TEMPLATE.map(h => ({
          ...h,
          checks: Array(daysInMonth).fill(false)
        }));
      }

      setHabits(initialHabits);
      setMentalState(generateEmptyMentalState(daysInMonth));
    }
    setInitialized(true);
  }, [year, month, daysInMonth]);

  // Save data on change
  useEffect(() => {
    if (!initialized) return;
    const key = getStorageKey(year, month);
    const data: MonthData = {
      habits,
      mentalState,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  }, [habits, mentalState, year, month, initialized]);

  // --- Handlers ---

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(year, month + offset, 1);
    setCurrentDate(newDate);
    setEditingHabitId(null); // Close edit mode if open
    setHabitToDelete(null); // Close delete modal if open
  };

  const toggleCheck = (habitId: string, dayIndex: number) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const newChecks = [...h.checks];
        newChecks[dayIndex] = !newChecks[dayIndex];
        return { ...h, checks: newChecks };
      })
    );
  };

  const handleMentalChange = (dayIndex: number, field: 'mood' | 'motivation', value: string) => {
    const numVal = value === '' ? 0 : Math.min(10, Math.max(0, parseInt(value) || 0));
    setMentalState((prev) => {
      const newState = [...prev];
      newState[dayIndex] = { ...newState[dayIndex], [field]: numVal };
      return newState;
    });
  };

  // --- CRUD Handlers ---

  const startEditing = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setEditName(habit.name);
    setEditIcon(habit.icon);
  };

  const saveEditing = () => {
    if (editingHabitId) {
      setHabits((prev) =>
        prev.map((h) =>
          h.id === editingHabitId ? { ...h, name: editName, icon: editIcon } : h
        )
      );
      setEditingHabitId(null);
    }
  };

  const cancelEditing = () => {
    setEditingHabitId(null);
  };

  // Request deletion (opens modal)
  const requestDelete = (habit: Habit) => {
    setHabitToDelete(habit);
  };

  // Confirm deletion (executes)
  const confirmDelete = () => {
    if (habitToDelete) {
      setHabits(prev => prev.filter(h => h.id !== habitToDelete.id));
      if (editingHabitId === habitToDelete.id) {
        setEditingHabitId(null);
      }
      setHabitToDelete(null);
    }
  };

  const addHabit = () => {
    const newId = Date.now().toString();
    const newHabit: Habit = {
      id: newId,
      name: 'New Habit',
      icon: '✨',
      goal: daysInMonth,
      checks: Array(daysInMonth).fill(false)
    };
    setHabits(prev => [...prev, newHabit]);
    // Automatically start editing the new habit
    setEditingHabitId(newId);
    setEditName('New Habit');
    setEditIcon('✨');
  };

  const moveHabit = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === habits.length - 1) return;
    
    setHabits(prev => {
      const newHabits = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newHabits[index], newHabits[targetIndex]] = [newHabits[targetIndex], newHabits[index]];
      return newHabits;
    });
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // --- Derived Data Calculations ---

  const totalPossibleChecks = habits.length * daysInMonth;
  const totalActualChecks = habits.reduce(
    (acc, h) => acc + h.checks.filter((c) => c).length,
    0
  );

  // Data for "Progress", "Done", "Not Done" rows
  const dailyStats = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const doneCount = habits.reduce((acc, h) => acc + (h.checks[i] ? 1 : 0), 0);
      const notDoneCount = habits.length - doneCount;
      const percent = habits.length > 0 ? Math.round((doneCount / habits.length) * 100) : 0;
      return {
        day: i + 1,
        done: doneCount,
        notDone: notDoneCount,
        percent,
      };
    });
  }, [habits, daysInMonth]);

  // Chart data
  const habitChartData = dailyStats.map(stat => ({
    day: stat.day,
    value: stat.percent
  }));

  // Dynamic Date Config
  const daysConfig: DayConfig[] = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return {
        dayNum: i + 1,
        dayName: DAYS_OF_WEEK[date.getDay()],
      };
    });
  }, [year, month, daysInMonth]);

  // Weeks grouping logic (Dynamic)
  const weeks = useMemo(() => {
    const w = [];
    let currentDay = 0;
    let weekCount = 1;
    
    // Logic: First 3 weeks are 7 days, 4th week takes the remainder
    // Or just simple 7 day chunks
    while (currentDay < daysInMonth) {
        // If it's the 4th block, take all remaining
        if (weekCount === 4) {
             const remaining = daysInMonth - currentDay;
             const days = Array.from({length: remaining}, (_, i) => currentDay + i);
             w.push({ label: `Week ${weekCount}`, days });
             break;
        } else {
            w.push({ 
                label: `Week ${weekCount}`, 
                days: Array.from({length: 7}, (_, i) => currentDay + i) 
            });
            currentDay += 7;
            weekCount++;
        }
    }
    return w;
  }, [daysInMonth]);

  if (!initialized) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading your habits...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-sm text-gray-800">
      <div className="max-w-[1400px] mx-auto">
        <SummaryHeader
          monthName={currentDate.toLocaleString('default', { month: 'long' })}
          year={year}
          totalHabits={habits.length}
          totalCompleted={totalActualChecks}
          totalPossible={totalPossibleChecks}
          onPrevMonth={() => handleMonthChange(-1)}
          onNextMonth={() => handleMonthChange(1)}
        />

        {/* MAIN GRID SECTION */}
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* LEFT: HABIT GRID */}
          <div className="flex-1 bg-white border border-gray-300 rounded-sm overflow-x-auto shadow-sm pb-4">
            <div className="min-w-[1000px] p-2">
              
              {/* Header Row: Weeks & Days */}
              <div className="flex">
                <div className="w-56 flex-shrink-0 bg-gray-200 p-2 font-bold text-center border-r border-gray-300 flex items-end justify-center">
                  My Habits
                </div>
                <div className="flex-1 flex">
                  {weeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col flex-1 border-r border-gray-300 last:border-r-0">
                      <div className="text-center text-xs text-gray-500 font-semibold bg-gray-100 py-1 border-b border-gray-200">
                        {week.label}
                      </div>
                      <div className="flex">
                        {week.days.map((dIdx) => (
                          <div key={dIdx} className="flex-1 flex flex-col items-center min-w-[20px]">
                            <div className="text-[10px] text-gray-500">{daysConfig[dIdx].dayName}</div>
                            <div className="font-bold text-gray-700 border-b border-gray-200 w-full text-center pb-1">
                              {daysConfig[dIdx].dayNum}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Habit Rows */}
              {habits.map((habit, index) => {
                const isEditing = editingHabitId === habit.id;
                
                return (
                  <div key={habit.id} className="flex border-b border-gray-200 hover:bg-gray-50 group">
                    {/* Habit Name / Edit Form */}
                    <div className="w-56 flex-shrink-0 p-2 border-r border-gray-200 flex items-center justify-between text-xs font-semibold bg-gray-100 group-hover:bg-gray-200 transition-colors relative">
                      {isEditing ? (
                         <div className="flex w-full gap-1 items-center z-10">
                           {/* Up/Down Reorder */}
                           <div className="flex flex-col gap-0.5 mr-1">
                              <button onClick={() => moveHabit(index, 'up')} disabled={index === 0} className="hover:text-blue-600 disabled:opacity-30">▲</button>
                              <button onClick={() => moveHabit(index, 'down')} disabled={index === habits.length - 1} className="hover:text-blue-600 disabled:opacity-30">▼</button>
                           </div>
                           
                           <input
                             type="text"
                             value={editIcon}
                             onChange={(e) => setEditIcon(e.target.value)}
                             onKeyDown={handleEditKeyDown}
                             className="w-6 text-center bg-white border border-blue-400 px-0 py-1 outline-none rounded-sm text-xs"
                             placeholder="Emoji"
                           />
                           <input
                             type="text"
                             value={editName}
                             onChange={(e) => setEditName(e.target.value)}
                             onKeyDown={handleEditKeyDown}
                             className="flex-1 min-w-0 bg-white border border-blue-400 px-1 py-1 outline-none rounded-sm text-xs"
                             autoFocus
                           />
                           
                           {/* Actions */}
                           <button onClick={saveEditing} className="text-green-600 hover:text-green-800 px-1" title="Save">✓</button>
                           <button onClick={() => requestDelete(habit)} className="text-red-500 hover:text-red-700 px-1" title="Delete Habit">🗑</button>
                         </div>
                      ) : (
                        <div 
                          className="flex w-full justify-between items-center cursor-pointer h-full"
                          onClick={() => startEditing(habit)}
                          title="Click to edit"
                        >
                          <span className="truncate mr-2 text-gray-700">{habit.name}</span>
                          <span className="text-sm">{habit.icon}</span>
                        </div>
                      )}
                    </div>

                    {/* Checkboxes */}
                    <div className="flex-1 flex">
                      {weeks.map((week, wIdx) => (
                        <div key={wIdx} className="flex flex-1 border-r border-gray-200 last:border-r-0">
                          {week.days.map((dIdx) => (
                            <div key={dIdx} className="flex-1 flex items-center justify-center border-r border-dotted border-gray-300 last:border-r-0 min-w-[20px]">
                              <button
                                onClick={() => toggleCheck(habit.id, dIdx)}
                                className={`w-4 h-4 rounded-sm border ${
                                  habit.checks[dIdx]
                                    ? 'bg-gray-600 border-gray-700 text-white'
                                    : 'bg-white border-gray-400 hover:border-gray-500'
                                } flex items-center justify-center transition-all duration-100`}
                              >
                                {habit.checks[dIdx] && (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Add New Habit Button Row */}
              <div className="flex border-b border-gray-200">
                  <div className="w-56 p-2 bg-gray-50 border-r border-gray-200">
                     <button 
                       onClick={addHabit}
                       className="w-full text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 py-1 rounded border border-dashed border-blue-300 flex items-center justify-center gap-1 transition-colors"
                     >
                       <span>+</span> New Habit
                     </button>
                  </div>
                  <div className="flex-1 bg-gray-50/50"></div>
              </div>

              {/* Grid Footer: Daily Stats */}
              <div className="mt-6 border-t-2 border-gray-300">
                {/* Progress % Row */}
                <div className="flex border-b border-gray-200">
                  <div className="w-56 p-1 text-right text-xs font-bold text-gray-600 pr-4 bg-gray-100">Progress</div>
                  <div className="flex-1 flex">
                     {weeks.map((week, wIdx) => (
                        <div key={wIdx} className="flex flex-1 border-r border-gray-200 last:border-r-0">
                          {week.days.map((dIdx) => (
                            <div key={dIdx} className="flex-1 text-[10px] text-center text-gray-500 py-1 min-w-[20px]">
                              {dailyStats[dIdx].percent}%
                            </div>
                          ))}
                        </div>
                     ))}
                  </div>
                </div>
                {/* Done Row */}
                <div className="flex border-b border-gray-200">
                  <div className="w-56 p-1 text-right text-xs font-bold text-gray-600 pr-4 bg-gray-100">Done</div>
                  <div className="flex-1 flex">
                     {weeks.map((week, wIdx) => (
                        <div key={wIdx} className="flex flex-1 border-r border-gray-200 last:border-r-0">
                          {week.days.map((dIdx) => (
                            <div key={dIdx} className="flex-1 text-[10px] text-center font-bold text-gray-700 py-1 min-w-[20px]">
                              {dailyStats[dIdx].done}
                            </div>
                          ))}
                        </div>
                     ))}
                  </div>
                </div>
                 {/* Not Done Row */}
                 <div className="flex border-b border-gray-200">
                  <div className="w-56 p-1 text-right text-xs font-bold text-gray-600 pr-4 bg-gray-100">Not Done</div>
                  <div className="flex-1 flex">
                     {weeks.map((week, wIdx) => (
                        <div key={wIdx} className="flex flex-1 border-r border-gray-200 last:border-r-0">
                          {week.days.map((dIdx) => (
                            <div key={dIdx} className="flex-1 text-[10px] text-center text-gray-400 py-1 min-w-[20px]">
                              {dailyStats[dIdx].notDone}
                            </div>
                          ))}
                        </div>
                     ))}
                  </div>
                </div>
              </div>

              {/* Progress Chart */}
              <div className="mt-2 border border-gray-300 bg-white">
                <AnalysisChart 
                  data={habitChartData}
                  dataKeys={[{ key: 'value', color: '#82ca9d', fill: '#dcfce7' }]}
                />
              </div>

               {/* Mental State Section */}
              <div className="mt-6 border-t-2 border-gray-300">
                  <div className="bg-gray-200 text-center py-1 font-bold text-gray-600 text-xs border-b border-gray-300">Mental State</div>
                  
                  {/* Mood Inputs */}
                  <div className="flex border-b border-gray-200">
                    <div className="w-56 p-1 text-right text-xs font-bold text-gray-600 pr-4 bg-gray-100 flex items-center justify-end">Mood</div>
                    <div className="flex-1 flex">
                      {weeks.map((week, wIdx) => (
                          <div key={wIdx} className="flex flex-1 border-r border-gray-200 last:border-r-0">
                            {week.days.map((dIdx) => (
                              <div key={dIdx} className="flex-1 py-1 px-px min-w-[20px]">
                                <input 
                                  type="text" 
                                  className="w-full text-center text-[10px] bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
                                  value={mentalState[dIdx]?.mood === 0 ? '' : mentalState[dIdx]?.mood}
                                  onChange={(e) => handleMentalChange(dIdx, 'mood', e.target.value)}
                                  placeholder="-"
                                />
                              </div>
                            ))}
                          </div>
                      ))}
                    </div>
                  </div>

                  {/* Motivation Inputs */}
                   <div className="flex border-b border-gray-200">
                    <div className="w-56 p-1 text-right text-xs font-bold text-gray-600 pr-4 bg-gray-100 flex items-center justify-end">Motivation</div>
                    <div className="flex-1 flex">
                      {weeks.map((week, wIdx) => (
                          <div key={wIdx} className="flex flex-1 border-r border-gray-200 last:border-r-0">
                            {week.days.map((dIdx) => (
                              <div key={dIdx} className="flex-1 py-1 px-px min-w-[20px]">
                                <input 
                                  type="text" 
                                  className="w-full text-center text-[10px] bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
                                  value={mentalState[dIdx]?.motivation === 0 ? '' : mentalState[dIdx]?.motivation}
                                  onChange={(e) => handleMentalChange(dIdx, 'motivation', e.target.value)}
                                  placeholder="-"
                                />
                              </div>
                            ))}
                          </div>
                      ))}
                    </div>
                  </div>
              </div>

              {/* Mental State Chart */}
              <div className="mt-2 border border-gray-300 bg-white">
                 <AnalysisChart 
                  data={mentalState}
                  dataKeys={[
                    { key: 'mood', color: '#8884d8', fill: '#e0e7ff' },
                    { key: 'motivation', color: '#ffc658', fill: '#fef3c7' }
                  ]}
                  height={150}
                />
              </div>

            </div>
          </div>

          {/* RIGHT: ANALYSIS SIDEBAR */}
          <div className="w-full lg:w-64 flex-shrink-0 bg-gray-100 border border-gray-300 rounded-sm p-4 h-fit shadow-sm">
            <h2 className="text-center font-bold text-gray-700 mb-4 text-lg border-b border-gray-300 pb-2">Analysis</h2>
            
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-gray-500 mb-2 text-center">
               <div>Goal</div>
               <div>Actual</div>
               <div className="col-span-2">Progress</div>
            </div>

            {/* Analysis Rows */}
            <div className="space-y-3">
              {habits.map((habit) => {
                 const checkedCount = habit.checks.filter(Boolean).length;
                 const goal = daysInMonth; // Or specific goal if added to habit model later
                 const percentage = goal > 0 ? (checkedCount / goal) * 100 : 0;
                 return (
                  <div key={habit.id} className="grid grid-cols-4 gap-1 items-center text-xs">
                    <div className="text-center text-gray-600">{goal}</div>
                    <div className="text-center font-bold text-gray-800">{checkedCount}</div>
                    <div className="col-span-2">
                       <div className="w-full bg-white h-4 border border-gray-300 rounded-sm overflow-hidden relative">
                          <div 
                            className="absolute top-0 left-0 h-full bg-green-400 transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                       </div>
                    </div>
                  </div>
                 )
              })}
              {habits.length === 0 && <div className="text-center text-gray-500 text-xs italic py-4">No habits yet</div>}
            </div>
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {habitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
             <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 w-full max-w-sm mx-4 transform transition-all">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Habit</h3>
                <p className="text-gray-600 mb-6 text-sm">
                    Are you sure you want to delete <span className="font-semibold text-gray-800">"{habitToDelete.name}"</span>?
                    <br/><span className="text-xs text-gray-500 mt-2 block">This action cannot be undone and will remove all history for this habit.</span>
                </p>
                <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => setHabitToDelete(null)}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded text-sm font-medium transition-colors shadow-sm"
                    >
                        Delete
                    </button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
}