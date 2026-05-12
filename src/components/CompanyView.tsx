import React, { useState } from 'react';
import { CedingCompanyConfig, ReinsurerCompany, Treaty } from '../types';
import { Building2, Save, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface CompanyViewProps {
  config: CedingCompanyConfig;
  setConfig: (config: CedingCompanyConfig) => void;
  treaties: Treaty[];
}

const CURRENCIES = [
  { code: 'USD', label: 'USD (United States)' },
  { code: 'EUR', label: 'EUR (European Union)' },
  { code: 'GBP', label: 'GBP (United Kingdom)' },
  { code: 'INR', label: 'INR (India)' },
  { code: 'JPY', label: 'JPY (Japan)' },
  { code: 'CHF', label: 'CHF (Switzerland)' },
  { code: 'AUD', label: 'AUD (Australia)' },
  { code: 'CAD', label: 'CAD (Canada)' },
  { code: 'SGD', label: 'SGD (Singapore)' },
  { code: 'AED', label: 'AED (United Arab Emirates)' },
];

export default function CompanyView({ config, setConfig, treaties }: CompanyViewProps) {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newReinsurer, setNewReinsurer] = useState({ name: '', reinsurerId: '' });
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setConfig({
      ...config,
      [e.target.name]: e.target.value
    });
    setSaveSuccess(false);
  };

  const handleSaveAll = () => {
    // In a real app, this would persist to the backend
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddReinsurer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReinsurer.name || !newReinsurer.reinsurerId) return;

    setConfig({
      ...config,
      reinsurers: [...(config.reinsurers || []), { 
        id: crypto.randomUUID(), 
        name: newReinsurer.name, 
        reinsurerId: newReinsurer.reinsurerId 
      }]
    });
    setNewReinsurer({ name: '', reinsurerId: '' });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const removeReinsurer = (id: string) => {
    const reinsurerToDelete = config.reinsurers?.find(r => r.id === id);
    if (!reinsurerToDelete) return;

    const labelStr = `${reinsurerToDelete.reinsurerId} - ${reinsurerToDelete.name}`;
    
    // Check if used in any treaty
    const isUsed = treaties.some(t => 
      t.reinsurers.some(tr => tr.name === labelStr)
    );

    if (isUsed) {
      setDeleteError(`Cannot delete ${reinsurerToDelete.name}. It is assigned to one or more active treaties. You must discard the treaty first.`);
      setTimeout(() => setDeleteError(null), 5000);
      return;
    }

    setConfig({
      ...config,
      reinsurers: (config.reinsurers || []).filter(r => r.id !== id)
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Companies</h1>
          <p className="text-sm text-slate-500">Manage Ceding and Reinsurance partner details</p>
        </div>
        <div className="flex items-center gap-4">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              Settings Saved
            </span>
          )}
          <button 
            onClick={handleSaveAll}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Companies</h2>
            <p className="text-sm text-slate-500">Configure your primary company profile and regional settings.</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">Company Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={config.name}
                onChange={handleChange}
                placeholder="e.g. Acme Life Insurance"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="currency" className="block text-sm font-medium text-slate-700">Currency / Country</label>
              <select
                id="currency"
                name="currency"
                value={config.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select Currency...</option>
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="lineOfBusiness" className="block text-sm font-medium text-slate-700">Line of Business</label>
              <select
                id="lineOfBusiness"
                name="lineOfBusiness"
                value={config.lineOfBusiness}
                onChange={handleChange}
                className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select Line of Business...</option>
                <option value="Individual Domestic">Individual Domestic</option>
                <option value="Credit Life">Credit Life</option>
                <option value="Group Life">Group Life</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Reinsurance Company Details</h2>
              <p className="text-sm text-slate-500">Manage available reinsurers with specific IDs.</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {deleteError && (
             <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
               <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
               <div className="text-sm font-medium">{deleteError}</div>
             </div>
          )}

          <form onSubmit={handleAddReinsurer} className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 flex flex-col md:flex-row items-end gap-4 shadow-sm">
             <div className="w-full space-y-1">
               <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">New Reinsurer Name</label>
               <input
                 type="text"
                 value={newReinsurer.name}
                 onChange={e => setNewReinsurer({ ...newReinsurer, name: e.target.value })}
                 className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                 placeholder="e.g. Swiss Re"
                 required
               />
             </div>
             <div className="w-full space-y-1">
               <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Reinsurer ID</label>
               <input
                 type="text"
                 value={newReinsurer.reinsurerId}
                 onChange={e => setNewReinsurer({ ...newReinsurer, reinsurerId: e.target.value })}
                 className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono bg-white"
                 placeholder="e.g. SRE-123"
                 required
               />
             </div>
             <button
               type="submit"
               className="shrink-0 flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded font-medium text-sm hover:bg-slate-700 transition shadow-sm h-[38px]"
             >
               <Plus className="w-4 h-4" /> Add Partner
             </button>
          </form>

          <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">Registered Reinsurers</h3>
          
          {(!config.reinsurers || config.reinsurers.length === 0) ? (
            <div className="text-center text-slate-500 py-8 italic border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
              No reinsurers added yet. Add a partner above to begin.
            </div>
          ) : (
            <div className="space-y-3">
              {config.reinsurers.map(r => (
                <div key={r.id} className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{r.name}</span>
                    <span className="text-sm font-mono text-slate-500">ID: {r.reinsurerId}</span>
                  </div>
                  <button
                    onClick={() => removeReinsurer(r.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove Reinsurer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
