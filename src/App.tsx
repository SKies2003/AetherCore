import React, { useState } from 'react';
import { Activity, ShieldCheck, FileText, Calculator, Settings } from 'lucide-react';
import { Treaty, MasterConfig, SavedPolicy } from './types';
import TreatiesView from './components/TreatiesView';
import CalculatorView from './components/CalculatorView';
import MasterView from './components/MasterView';
import CessionsView from './components/CessionsView';
import AccountsView from './components/AccountsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'treaties' | 'calculator' | 'master' | 'cessions' | 'accounts'>('calculator');
  
  // App-level state for treaties
  const [treaties, setTreaties] = useState<Treaty[]>([
    {
      id: 'default-1',
      name: 'Standard Term Life Quota Share',
      retentionType: 'absolute',
      retentionValue: 2500000,
      modelFactors: [
        { id: 'mf1', frequency: 1, factor: 1.0 },
        { id: 'mf2', frequency: 2, factor: 1.025 },
        { id: 'mf3', frequency: 4, factor: 1.05 },
        { id: 'mf4', frequency: 12, factor: 1.0875 },
      ],
      premiumRates: [
        { id: 'pr1', riskCoverage: 'Death Benefit', ageMin: 18, ageMax: 35, gender: 'Any', rate: 1.5 },
        { id: 'pr2', riskCoverage: 'Death Benefit', ageMin: 36, ageMax: 50, gender: 'Any', rate: 3.2 },
        { id: 'pr3', riskCoverage: 'Death Benefit', ageMin: 51, ageMax: 65, gender: 'Any', rate: 8.5 },
        { id: 'pr4', riskCoverage: 'Accidental Death Benefit', ageMin: 18, ageMax: 65, gender: 'Any', rate: 0.8 },
        { id: 'pr5', riskCoverage: 'Disability Benefit', ageMin: 18, ageMax: 60, gender: 'Any', rate: 1.2 },
      ],
      reinsurers: []
    }
  ]);

  const [masterConfig, setMasterConfig] = useState<MasterConfig>({
    genderMappings: [{ id: 'gm1', sourceValue: 'M', targetValue: 'Male' }],
    smokerMappings: [{ id: 'sm1', sourceValue: 'S', targetValue: 'Smoker' }],
    medicalMappings: [{ id: 'mm1', sourceValue: 'Med', targetValue: 'Medical' }],
    impairmentMappings: [{ id: 'im1', sourceValue: 'Joint', targetValue: 'Joint' }],
    paymentModeMappings: [{ id: 'pm1', sourceValue: 'Annually', targetValue: 'Annual' }],
  });

  const [savedPolicies, setSavedPolicies] = useState<SavedPolicy[]>([]);

  const handleAddTreaty = (treaty: Treaty | Treaty[]) => {
    setTreaties(prev => Array.isArray(treaty) ? [...prev, ...treaty] : [...prev, treaty]);
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
            {activeTab === 'calculator' ? 'Input' : activeTab === 'treaties' ? 'Treaties' : activeTab === 'master' ? 'Master' : activeTab === 'cessions' ? 'Cessions' : 'Accounts'}
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Activity className="w-4 h-4 text-green-500" />
            <span>Systems Online</span>
          </div>
        </header>
        
        <div className="p-8">
          <div className={activeTab === 'treaties' ? 'block' : 'hidden'}>
            <TreatiesView 
              treaties={treaties} 
              onAddTreaty={handleAddTreaty} 
              onDeleteTreaty={handleDeleteTreaty}
            />
          </div>

          <div className={activeTab === 'calculator' ? 'block' : 'hidden'}>
            <CalculatorView treaties={treaties} masterConfig={masterConfig} savedPolicies={savedPolicies} setSavedPolicies={setSavedPolicies} />
          </div>

          <div className={activeTab === 'master' ? 'block' : 'hidden'}>
            <MasterView config={masterConfig} setConfig={setMasterConfig} />
          </div>

          <div className={activeTab === 'cessions' ? 'block' : 'hidden'}>
            <CessionsView savedPolicies={savedPolicies} setSavedPolicies={setSavedPolicies} />
          </div>

          <div className={activeTab === 'accounts' ? 'block' : 'hidden'}>
            <AccountsView />
          </div>
        </div>
      </main>
    </div>
  );
}
