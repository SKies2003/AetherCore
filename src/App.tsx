import React, { useState } from 'react';
import { Activity, ShieldCheck, FileText, Calculator, Settings, AlertCircle } from 'lucide-react';
import { Treaty, MasterConfig, SavedPolicy } from './types';
import TreatiesView from './components/TreatiesView';
import CalculatorView from './components/CalculatorView';
import MasterView from './components/MasterView';
import CessionsView from './components/CessionsView';
import AccountsView from './components/AccountsView';
import PlansView from './components/PlansView';
import FacultativeView from './components/FacultativeView';
import { Plan } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'treaties' | 'plans' | 'calculator' | 'master' | 'cessions' | 'accounts' | 'facultative'>('calculator');
  
  // App-level state for treaties
  const [treaties, setTreaties] = useState<Treaty[]>([]);

  const [plans, setPlans] = useState<Plan[]>([]);

  const [masterConfig, setMasterConfig] = useState<MasterConfig>({
    genderMappings: [],
    smokerMappings: [],
    medicalMappings: [],
    impairmentMappings: [],
    paymentModeMappings: [],
  });

  const [savedPolicies, setSavedPolicies] = useState<SavedPolicy[]>([]);

  const handleAddTreaty = (treaty: Treaty | Treaty[]) => {
    setTreaties(prev => Array.isArray(treaty) ? [...prev, ...treaty] : [...prev, treaty]);
  };

  const handleUpdateTreaty = (updatedTreaty: Treaty) => {
    setTreaties(prev => prev.map(t => t.id === updatedTreaty.id ? updatedTreaty : t));
  };

  const handleDeleteTreaty = (id: string) => {
    setTreaties(treaties.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-50 font-sans text-slate-900">
      {/* Sidebar Shell */}
      <div className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-10 border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="font-bold text-lg tracking-tight">ReSure Pro</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2 mt-2">
            Modules
          </div>
          
          <button
            onClick={() => setActiveTab('calculator')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'calculator' 
                ? 'bg-blue-600/10 text-blue-400' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Calculator className="w-5 h-5" />
            Input
          </button>
          
          <button
            onClick={() => setActiveTab('plans')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'plans' 
                ? 'bg-blue-600/10 text-blue-400' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            Plans
          </button>

          <button
            onClick={() => setActiveTab('treaties')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'treaties' 
                ? 'bg-blue-600/10 text-blue-400' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            Treaties
          </button>

          <button
            onClick={() => setActiveTab('master')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'master' 
                ? 'bg-blue-600/10 text-blue-400' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            Master
          </button>
          
          <button
            onClick={() => setActiveTab('cessions')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'cessions' 
                ? 'bg-blue-600/10 text-blue-400' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5" />
            Cessions
          </button>
          
          <button
            onClick={() => setActiveTab('facultative')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'facultative' 
                ? 'bg-blue-600/10 text-blue-400' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
            Facultative
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'accounts' 
                ? 'bg-blue-600/10 text-blue-400' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            Accounts
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 text-sm text-slate-400 group cursor-pointer hover:text-white transition-colors">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-medium group-hover:bg-slate-600 transition-colors">
              U
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-slate-200">Actuary User</span>
              <span className="text-xs">v1.1.0 iter</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen max-w-7xl">
        <header className="bg-white px-8 py-5 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 hidden sm:flex">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
            {activeTab === 'calculator' ? 'Input' : activeTab === 'plans' ? 'Plans' : activeTab === 'treaties' ? 'Treaties' : activeTab === 'master' ? 'Master' : activeTab === 'cessions' ? 'Cessions' : activeTab === 'facultative' ? 'Facultative' : 'Accounts'}
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Activity className="w-4 h-4 text-green-500" />
            <span>Systems Online</span>
          </div>
        </header>
        
        <div className="p-8">
          <div className={activeTab === 'plans' ? 'block' : 'hidden'}>
            <PlansView 
              plans={plans} 
              setPlans={setPlans}
            />
          </div>

          <div className={activeTab === 'treaties' ? 'block' : 'hidden'}>
            <TreatiesView 
              treaties={treaties} 
              onAddTreaty={handleAddTreaty} 
              onUpdateTreaty={handleUpdateTreaty}
              onDeleteTreaty={handleDeleteTreaty}
            />
          </div>

          <div className={activeTab === 'calculator' ? 'block' : 'hidden'}>
            <CalculatorView treaties={treaties} masterConfig={masterConfig} plans={plans} savedPolicies={savedPolicies} setSavedPolicies={setSavedPolicies} />
          </div>

          <div className={activeTab === 'master' ? 'block' : 'hidden'}>
            <MasterView config={masterConfig} setConfig={setMasterConfig} />
          </div>

          <div className={activeTab === 'cessions' ? 'block' : 'hidden'}>
            <CessionsView savedPolicies={savedPolicies} setSavedPolicies={setSavedPolicies} />
          </div>

          <div className={activeTab === 'facultative' ? 'block' : 'hidden'}>
            <FacultativeView savedPolicies={savedPolicies} setSavedPolicies={setSavedPolicies} />
          </div>

          <div className={activeTab === 'accounts' ? 'block' : 'hidden'}>
            <AccountsView />
          </div>
        </div>
      </main>
    </div>
  );
}
