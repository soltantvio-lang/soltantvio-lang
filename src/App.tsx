import React, { useState, useEffect } from 'react';
import { UserAssessment, FitnessProfile, WorkoutProgram, WorkoutLog, PrescribedExercise, WorkoutDay } from './types';
import { 
  generateWeek1InitialPlan,
  generateAdaptiveNextWeek, 
  generateComplete4WeekTrainingPlan, 
  generateAdaptiveWorkoutProgram, 
  generateNextWeekProgram 
} from './utils/workoutEngine';
import { computeDayTimeBudget } from './utils/splitBuilder';
import { Navbar, NavTab } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeSection } from './components/HomeSection';
import { AssessmentFlow } from './components/AssessmentFlow';
import { FitnessProfileView } from './components/FitnessProfileView';
import { WorkoutPlannerView } from './components/WorkoutPlannerView';
import { EncyclopediaView } from './components/EncyclopediaView';
import { AICoachView } from './components/AICoachView';
import { CalorieCalculatorView } from './components/CalorieCalculatorView';
import { EducationView } from './components/EducationView';
import { ChallengesView } from './components/ChallengesView';
import { LifestyleView } from './components/LifestyleView';
import { ProfileProgressView } from './components/ProfileProgressView';
import { CartView } from './components/CartView';
import { AdminView } from './components/AdminView';
import { authService, AuthUser } from './services/authService';
import { syncService } from './services/syncService';
import { getLocalState, saveLocalState } from './storage/indexedDb';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Stored User Data
  const [assessment, setAssessment] = useState<UserAssessment | null>(null);
  const [profile, setProfile] = useState<FitnessProfile | null>(null);
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

  // Load from IndexedDB / LocalStorage on mount & init auth
  useEffect(() => {
    const initializeData = async () => {
      // 1. Init Auth
      const user = await authService.init();
      setCurrentUser(user);

      // 2. Load from storage
      try {
        const idbAss = await getLocalState<UserAssessment>('assessment_data');
        const idbProf = await getLocalState<FitnessProfile>('fitness_profile');
        const idbProg = await getLocalState<WorkoutProgram>('program_data');
        const idbLogs = await getLocalState<WorkoutLog[]>('workout_logs');

        const savedAss = localStorage.getItem('fitmax_assessment');
        const savedProf = localStorage.getItem('fitmax_profile');
        const savedProg = localStorage.getItem('fitmax_program');
        const savedLogs = localStorage.getItem('fitmax_logs');

        if (idbAss || savedAss) setAssessment(idbAss || (savedAss ? JSON.parse(savedAss) : null));
        if (idbProf || savedProf) setProfile(idbProf || (savedProf ? JSON.parse(savedProf) : null));
        if (idbProg || savedProg) setProgram(idbProg || (savedProg ? JSON.parse(savedProg) : null));
        if (idbLogs || savedLogs) setWorkoutLogs(idbLogs || (savedLogs ? JSON.parse(savedLogs) : []));
      } catch (e) {
        console.error('Error loading saved state:', e);
      }
    };

    initializeData();

    // Check for Secret Admin Path
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        const secretPath = data.adminAccessPath || '/fitmax-manage-portal-99x';
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash.replace('#', '');

        if (
          currentPath.includes(secretPath) || 
          currentHash.includes(secretPath) || 
          currentPath.includes('/admin') || 
          currentHash.includes('admin')
        ) {
          setActiveTab('admin');
        }
      })
      .catch(() => {});

    const handleHashOrPop = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.includes('fitmax-manage-portal') || hash.includes('fitmax-manage-portal') || path.includes('/admin') || hash.includes('admin')) {
        setActiveTab('admin');
      }
    };

    window.addEventListener('popstate', handleHashOrPop);
    window.addEventListener('hashchange', handleHashOrPop);
    return () => {
      window.removeEventListener('popstate', handleHashOrPop);
      window.removeEventListener('hashchange', handleHashOrPop);
    };
  }, []);

  const handleAssessmentComplete = (
    newAss: UserAssessment, 
    newProf: FitnessProfile, 
    newProg: WorkoutProgram
  ) => {
    setAssessment(newAss);
    setProfile(newProf);
    setProgram(newProg);

    saveLocalState('assessment_data', newAss);
    saveLocalState('fitness_profile', newProf);
    saveLocalState('program_data', newProg);

    localStorage.setItem('fitmax_assessment', JSON.stringify(newAss));
    localStorage.setItem('fitmax_profile', JSON.stringify(newProf));
    localStorage.setItem('fitmax_program', JSON.stringify(newProg));

    // Cloud background sync
    syncService.saveAssessment(newAss);
    syncService.saveProgram(newProg, newProg.current_week || 1);

    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogWorkout = (newLog: WorkoutLog) => {
    const updated = [newLog, ...workoutLogs];
    setWorkoutLogs(updated);
    localStorage.setItem('fitmax_logs', JSON.stringify(updated));
    saveLocalState('workout_logs', updated);

    // Sync log in background
    syncService.saveWorkoutLog(newLog);
  };

  const handleReplaceExerciseInProgram = (dayNumber: number, oldExerciseId: string, newExerciseId: string) => {
    if (!program) return;

    const updatedDays = program.days.map(day => {
      if (day.day_number !== dayNumber) return day;

      const updatedMain = day.main_workout.map(pe => {
        if (pe.exercise_id === oldExerciseId) {
          return {
            ...pe,
            exercise_id: newExerciseId,
            notes_fa: `جایگزین‌شده با موفقیت بر اساس ترجیح کاربر`
          };
        }
        return pe;
      });

      return {
        ...day,
        main_workout: updatedMain
      };
    });

    const updatedProgram: WorkoutProgram = {
      ...program,
      days: updatedDays
    };

    setProgram(updatedProgram);
    localStorage.setItem('fitmax_program', JSON.stringify(updatedProgram));
    saveLocalState('program_data', updatedProgram);
    syncService.saveProgram(updatedProgram, updatedProgram.current_week || 1);
  };

  const handleAddExerciseToProgram = (weekNumber: number, dayNumber: number, newPrescribed: PrescribedExercise) => {
    if (!program) return;

    const targetMinutes = assessment?.minutesPerSession || 60;

    const updateDaysList = (daysList: WorkoutDay[]) => {
      return daysList.map(d => {
        if (d.day_number !== dayNumber) return d;

        const isFinisher = newPrescribed.role === 'finisher';
        const updatedAccessory = isFinisher 
          ? [...d.accessory] 
          : [...d.accessory, newPrescribed];
        const updatedFinisher = isFinisher 
          ? [...(d.finisher || []), newPrescribed] 
          : [...(d.finisher || [])];

        const updatedTimeBudget = computeDayTimeBudget(
          d.warmup,
          d.main_workout,
          updatedAccessory,
          updatedFinisher,
          targetMinutes
        );

        return {
          ...d,
          accessory: updatedAccessory,
          finisher: updatedFinisher,
          time_budget_breakdown: updatedTimeBudget,
          estimated_duration_mins: updatedTimeBudget.total_estimated_mins
        };
      });
    };

    let updatedWeeksMap = { ...(program.weeks_map || {}) };
    if (updatedWeeksMap[weekNumber]) {
      const targetWeek = updatedWeeksMap[weekNumber];
      updatedWeeksMap[weekNumber] = {
        ...targetWeek,
        days: updateDaysList(targetWeek.days)
      };
    }

    const updatedProgram: WorkoutProgram = {
      ...program,
      days: (program.current_week === weekNumber || (!program.weeks_map && weekNumber === 1)) 
        ? updateDaysList(program.days) 
        : program.days,
      weeks_map: Object.keys(updatedWeeksMap).length > 0 ? updatedWeeksMap : undefined
    };

    setProgram(updatedProgram);
    localStorage.setItem('fitmax_program', JSON.stringify(updatedProgram));
    saveLocalState('program_data', updatedProgram);
    syncService.saveProgram(updatedProgram, updatedProgram.current_week || 1);
  };

  const handleAdaptNextWeekProgram = () => {
    if (!assessment || !program) return;
    const currentWk = program.current_week || 1;
    const nextWk = Math.min(4, currentWk + 1);
    const updatedProgram = generateAdaptiveNextWeek(program, assessment, workoutLogs, nextWk);
    setProgram(updatedProgram);
    localStorage.setItem('fitmax_program', JSON.stringify(updatedProgram));
    saveLocalState('program_data', updatedProgram);
    syncService.saveProgram(updatedProgram, nextWk);
  };

  const handleGenerateAdaptiveWeek = (targetWeekNum: number) => {
    if (!assessment || !program) return;
    const updatedProgram = generateAdaptiveNextWeek(program, assessment, workoutLogs, targetWeekNum);
    setProgram(updatedProgram);
    localStorage.setItem('fitmax_program', JSON.stringify(updatedProgram));
    saveLocalState('program_data', updatedProgram);
    syncService.saveProgram(updatedProgram, targetWeekNum);
  };

  const handleChangeDaysPerWeek = (newDaysCount: number) => {
    if (!assessment) return;
    const updatedAssessment: UserAssessment = {
      ...assessment,
      trainingDaysPerWeek: newDaysCount
    };
    setAssessment(updatedAssessment);
    localStorage.setItem('fitmax_assessment', JSON.stringify(updatedAssessment));
    saveLocalState('assessment_data', updatedAssessment);

    const updatedProgram = generateComplete4WeekTrainingPlan(updatedAssessment, workoutLogs);
    setProgram(updatedProgram);
    localStorage.setItem('fitmax_program', JSON.stringify(updatedProgram));
    saveLocalState('program_data', updatedProgram);

    syncService.saveAssessment(updatedAssessment);
    syncService.saveProgram(updatedProgram, 1);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={0}
        hasAssessment={!!assessment}
        currentUser={currentUser}
        onAuthChange={(user) => {
          setCurrentUser(user);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {activeTab === 'home' && (
          <HomeSection 
            setActiveTab={setActiveTab} 
            hasAssessment={!!assessment} 
          />
        )}

        {activeTab === 'assessment' && (
          <AssessmentFlow 
            onAssessmentComplete={handleAssessmentComplete}
            initialData={assessment || undefined}
          />
        )}

        {activeTab === 'workout' && (
          <WorkoutPlannerView 
            program={program}
            assessment={assessment}
            workoutLogs={workoutLogs}
            onLogWorkout={handleLogWorkout}
            onReplaceExerciseInProgram={handleReplaceExerciseInProgram}
            onAddExerciseToProgram={handleAddExerciseToProgram}
            onOpenAssessment={() => setActiveTab('assessment')}
            onAdaptProgramForNextWeek={handleAdaptNextWeekProgram}
            onGenerateAdaptiveWeek={handleGenerateAdaptiveWeek}
            onChangeDaysPerWeek={handleChangeDaysPerWeek}
          />
        )}

        {activeTab === 'encyclopedia' && (
          <EncyclopediaView />
        )}

        {activeTab === 'aicoach' && (
          <AICoachView 
            assessment={assessment}
            profile={profile}
          />
        )}

        {activeTab === 'nutrition' && (
          <CalorieCalculatorView />
        )}

        {activeTab === 'education' && (
          <EducationView />
        )}

        {activeTab === 'challenges' && (
          <ChallengesView />
        )}

        {activeTab === 'lifestyle' && (
          <LifestyleView />
        )}

        {activeTab === 'profile' && (
          assessment && profile && program ? (
            <FitnessProfileView 
              assessment={assessment}
              profile={profile}
              program={program}
              setActiveTab={setActiveTab}
              onRetakeAssessment={() => setActiveTab('assessment')}
            />
          ) : (
            <ProfileProgressView 
              assessment={assessment}
              profile={profile}
              workoutLogs={workoutLogs}
              onOpenAssessment={() => setActiveTab('assessment')}
            />
          )
        )}

        {activeTab === 'cart' && (
          <CartView />
        )}

        {activeTab === 'admin' && (
          <AdminView onCloseAdmin={() => setActiveTab('home')} />
        )}
      </main>

      {/* Footer */}
      <Footer setActiveTab={setActiveTab} />

    </div>
  );
}

export default App;
