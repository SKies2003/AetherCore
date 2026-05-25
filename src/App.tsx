import React, { useState } from 'react';
import { Activity, ShieldCheck, FileText, Calculator, Settings, AlertCircle, Building2, FileSpreadsheet } from 'lucide-react';
import { Treaty, MasterConfig, SavedPolicy, ReserveTableEntry, ProcessYear, ProcessInterval } from './types';
import TreatiesView from './components/TreatiesView';
import CalculatorView from './components/CalculatorView';
import MasterView from './components/MasterView';
import CessionsView from './components/CessionsView';
import AccountsView from './components/AccountsView';
import PlansView from './components/PlansView';
import FacultativeView from './components/FacultativeView';
import CompanyView from './components/CompanyView';
import ReserveTablesView from './components/ReserveTablesView';
import { Plan, CedingCompanyConfig } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'company' | 'treaties' | 'plans' | 'calculator' | 'master' | 'cessions' | 'accounts' | 'facultative' | 'reserve-tables'>('company');
  
  const [companyConfig, setCompanyConfig] = useState<CedingCompanyConfig>({
    name: '',
    currency: '',
    lineOfBusiness: '',
    reinsurers: [],
  });
  
  // App-level state for treaties
  const [treaties, setTreaties] = useState<Treaty[]>([]);

  const [plans, setPlans] = useState<Plan[]>([]);

  const [masterConfig, setMasterConfig] = useState<MasterConfig>({
    genderMappings: [],
    smokerMappings: [],
    medicalMappings: [],
    impairmentMappings: [],
    paymentModeMappings: [],
    policyStatusMappings: [],
    emrCodeMappings: [],
    occupationCodeMappings: [],
  });

  const [savedPolicies, setSavedPolicies] = useState<SavedPolicy[]>([]);
  const [reserveTables, setReserveTables] = useState<ReserveTableEntry[]>([]);
  const [processYears, setProcessYears] = useState<ProcessYear[]>([]);
  const [processIntervals, setProcessIntervals] = useState<ProcessInterval[]>([]);

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
    <div className="min-h-screen min-w-[1024px] flex w-full bg-slate-50 font-sans text-slate-900 overflow-x-auto">
      {/* Sidebar Shell */}
      <div className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-10 border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-500 p-1.5 rounded-lg text-white">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="font-bold text-lg tracking-tight">AetherCore</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2 mt-2">
            Modules
          </div>
          
          <button
            onClick={() => setActiveTab('company')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'company' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Building2 className="w-5 h-5" />
            Company
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'calculator' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Calculator className="w-5 h-5" />
            Input
          </button>
          
          <button
            onClick={() => setActiveTab('plans')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'plans' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            Plans
          </button>

          <button
            onClick={() => setActiveTab('reserve-tables')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'reserve-tables' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
            Reserve Tables
          </button>

          <button
            onClick={() => setActiveTab('treaties')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'treaties' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            Treaties
          </button>

          <button
            onClick={() => setActiveTab('master')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'master' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            Master
          </button>
          
          <button
            onClick={() => setActiveTab('cessions')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'cessions' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5" />
            Cessions
          </button>
          
          <button
            onClick={() => setActiveTab('facultative')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'facultative' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
            Facultative
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'accounts' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            Accounts
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen max-w-7xl">
        <div className="p-8">
          <div className={activeTab === 'company' ? 'block' : 'hidden'}>
            <CompanyView config={companyConfig} setConfig={setCompanyConfig} treaties={treaties} />
          </div>

          <div className={activeTab === 'plans' ? 'block' : 'hidden'}>
            <PlansView 
              plans={plans} 
              setPlans={setPlans}
              savedPolicies={savedPolicies}
              companyConfig={companyConfig}
            />
          </div>

          <div className={activeTab === 'treaties' ? 'block' : 'hidden'}>
            <TreatiesView 
              treaties={treaties} 
              onAddTreaty={handleAddTreaty} 
              onUpdateTreaty={handleUpdateTreaty}
              onDeleteTreaty={handleDeleteTreaty}
              companyConfig={companyConfig}
              savedPolicies={savedPolicies}
              reserveTables={reserveTables}
              plans={plans}
            />
          </div>

          <div className={activeTab === 'calculator' ? 'block' : 'hidden'}>
            <CalculatorView treaties={treaties.filter(t => !t.lineOfBusiness || t.lineOfBusiness === companyConfig.lineOfBusiness)} masterConfig={masterConfig} plans={plans} savedPolicies={savedPolicies} setSavedPolicies={setSavedPolicies} reserveTables={reserveTables} companyConfig={companyConfig} processIntervals={processIntervals} processYears={processYears} />
          </div>

          <div className={activeTab === 'master' ? 'block' : 'hidden'}>
            <MasterView config={masterConfig} setConfig={setMasterConfig} />
          </div>

          <div className={activeTab === 'cessions' ? 'block' : 'hidden'}>
            <CessionsView savedPolicies={savedPolicies} setSavedPolicies={setSavedPolicies} companyConfig={companyConfig} processIntervals={processIntervals} />
          </div>

          <div className={activeTab === 'facultative' ? 'block' : 'hidden'}>
            <FacultativeView savedPolicies={savedPolicies} setSavedPolicies={setSavedPolicies} companyConfig={companyConfig} />
          </div>

          <div className={activeTab === 'accounts' ? 'block' : 'hidden'}>
            <AccountsView savedPolicies={savedPolicies} treaties={treaties} companyConfig={companyConfig} processYears={processYears} setProcessYears={setProcessYears} processIntervals={processIntervals} setProcessIntervals={setProcessIntervals} />
          </div>

          <div className={activeTab === 'reserve-tables' ? 'block' : 'hidden'}>
            <ReserveTablesView reserveTables={reserveTables} setReserveTables={setReserveTables} companyConfig={companyConfig} />
          </div>
        </div>
      </main>
    </div>
  );
}
