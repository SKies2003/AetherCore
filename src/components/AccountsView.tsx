import React, { useState } from 'react';
import { Calendar, Clock, Plus, Settings2, Download, Upload } from 'lucide-react';
import { SavedPolicy, Treaty, CedingCompanyConfig, ProcessYear, ProcessInterval } from '../types';

export default function AccountsView({ 
  savedPolicies, 
  treaties, 
  companyConfig,
  processYears,
  setProcessYears,
  processIntervals,
  setProcessIntervals,
}: { 
  savedPolicies: SavedPolicy[];
  treaties: Treaty[];
  companyConfig: CedingCompanyConfig;
  processYears: ProcessYear[];
  setProcessYears: React.Dispatch<React.SetStateAction<ProcessYear[]>>;
  processIntervals: ProcessInterval[];
  setProcessIntervals: React.Dispatch<React.SetStateAction<ProcessInterval[]>>;
}) {
  const [yearForm, setYearForm] = useState({ startDate: '', endDate: '', name: '' });
  const [intervalForm, setIntervalForm] = useState({ processYearId: '', startDate: '', endDate: '', name: '' });

  const handleExport = () => {
    const data = {
      processYears,
      processIntervals
    };
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Accounts_Configuration.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        if (data.processYears && Array.isArray(data.processYears)) {
          setProcessYears(data.processYears);
        }
        if (data.processIntervals && Array.isArray(data.processIntervals)) {
          setProcessIntervals(data.processIntervals);
        }
        alert("Accounts configuration imported successfully.");
      } catch (err) {
        alert("Invalid JSON file uploaded.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddYear = () => {
    if (!yearForm.startDate || !yearForm.endDate || !yearForm.name) {
      alert("Please fill out all fields.");
      return;
    }
    
    if (new Date(yearForm.startDate) > new Date(yearForm.endDate)) {
      alert("Start date cannot be after end date.");
      return;
    }

    const newYear: ProcessYear = {
      id: Date.now().toString(),
      ...yearForm
    };
    setProcessYears([...processYears, newYear]);
    setYearForm({ startDate: '', endDate: '', name: '' });
  };

  const handleAddInterval = () => {
    if (!intervalForm.processYearId || !intervalForm.startDate || !intervalForm.endDate || !intervalForm.name) {
      alert("Please fill out all fields.");
      return;
    }
    
    const year = processYears.find(y => y.id === intervalForm.processYearId);
    if (!year) return;

    const yearStart = new Date(year.startDate);
    const yearEnd = new Date(year.endDate);
    const intStart = new Date(intervalForm.startDate);
    const intEnd = new Date(intervalForm.endDate);

    if (intStart > intEnd) {
      alert("Interval start date cannot be after end date.");
      return;
    }

    if (intStart < yearStart || intEnd > yearEnd) {
      alert(`Process interval must be within the Process Year: ${year.startDate} to ${year.endDate}`);
      return;
    }

    const newInterval: ProcessInterval = {
      id: Date.now().toString(),
      ...intervalForm
    };
    setProcessIntervals([...processIntervals, newInterval]);
    setIntervalForm(prev => ({ ...prev, startDate: '', endDate: '', name: '' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Accounts</h2>
          <p className="text-sm text-slate-500 mt-1">Manage process years and intervals.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm cursor-pointer">
            <Upload className="w-4 h-4" />
            Import JSON
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors font-medium text-sm shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export to JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Process Year panel */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Process Years
            </h3>
          </div>
          
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={yearForm.startDate}
                  onChange={e => setYearForm({ ...yearForm, startDate: e.target.value })}
                  className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={yearForm.endDate}
                  onChange={e => setYearForm({ ...yearForm, endDate: e.target.value })}
                  className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={yearForm.name}
                onChange={e => setYearForm({ ...yearForm, name: e.target.value })}
                placeholder="e.g. Financial Year 2026-27"
                className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleAddYear}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700"
            >
              <Plus className="w-4 h-4" /> Add Process Year
            </button>
          </div>

          <div className="p-0">
            {processYears.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No process years added.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {processYears.map(py => (
                  <li key={py.id} className="p-4 hover:bg-slate-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-slate-900 text-sm">{py.name}</div>
                        <div className="text-xs text-blue-600 mt-1 font-mono">{py.startDate} to {py.endDate}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Process Interval panel */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Process Intervals
            </h3>
          </div>
          
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Process Year</label>
              <select
                value={intervalForm.processYearId}
                onChange={e => setIntervalForm({ ...intervalForm, processYearId: e.target.value })}
                className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a Year...</option>
                {processYears.map(py => (
                  <option key={py.id} value={py.id}>
                    {py.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={intervalForm.startDate}
                  onChange={e => setIntervalForm({ ...intervalForm, startDate: e.target.value })}
                  className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={intervalForm.endDate}
                  onChange={e => setIntervalForm({ ...intervalForm, endDate: e.target.value })}
                  className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={intervalForm.name}
                onChange={e => setIntervalForm({ ...intervalForm, name: e.target.value })}
                placeholder="e.g. Q1 2026-27"
                className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleAddInterval}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
              disabled={!intervalForm.processYearId}
            >
              <Plus className="w-4 h-4" /> Add Process Interval
            </button>
          </div>

          <div className="p-0">
            {processIntervals.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No process intervals added.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {processIntervals.map(pi => {
                  const py = processYears.find(y => y.id === pi.processYearId);
                  return (
                    <li key={pi.id} className="p-4 hover:bg-slate-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-slate-900 text-sm">{pi.name}</div>
                          <div className="text-xs text-blue-600 mt-1 font-mono">{pi.startDate} to {pi.endDate}</div>
                          {py && (
                            <div className="text-xs text-slate-400 mt-1">Year: {py.name}</div>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
