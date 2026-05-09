import React, { useState } from 'react';
import { MasterConfig, MappingEntry } from '../types';
import { Settings, Plus, Trash2, AlertCircle, Download, Upload } from 'lucide-react';

export default function MasterView({
  config,
  setConfig
}: {
  config: MasterConfig;
  setConfig: React.Dispatch<React.SetStateAction<MasterConfig>>;
}) {

  const handleExport = () => {
    const headers = ['Category', 'Source Value', 'Target Value'];
    const escapeCsv = (str: any) => `"${String(str).replace(/"/g, '""')}"`;
    const rows: string[] = [];

    const appendMappings = (category: string, mappings: MappingEntry[]) => {
      mappings.forEach(m => {
        if (m.sourceValue || m.targetValue) {
           rows.push([category, m.sourceValue, m.targetValue].map(escapeCsv).join(','));
        }
      });
    };

    appendMappings('Gender', config.genderMappings);
    appendMappings('Smoker Status', config.smokerMappings);
    appendMappings('Medical Status', config.medicalMappings);
    appendMappings('Impairment', config.impairmentMappings);
    appendMappings('Payment Mode', config.paymentModeMappings);

    const csvContent = headers.map(escapeCsv).join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Master_Configuration.csv`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseCsvLine = (text: string) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"' && text[i+1] === '"' && inQuotes) {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(r => r.trim());
      if (rows.length < 2) return;

      const newConfig = { ...config };
      
      const categoryMap: Record<string, keyof MasterConfig> = {
        'Gender': 'genderMappings',
        'Smoker Status': 'smokerMappings',
        'Medical Status': 'medicalMappings',
        'Impairment': 'impairmentMappings',
        'Payment Mode': 'paymentModeMappings'
      };

      for (let i = 1; i < rows.length; i++) {
        const cols = parseCsvLine(rows[i]);
        if (cols.length >= 3) {
          const cat = cols[0].trim();
          const source = cols[1].trim();
          const target = cols[2].trim();

          const mappedKey = categoryMap[cat];
          if (mappedKey) {
            // Avoid duplicates
            const existingSources = new Set(newConfig[mappedKey].map(m => m.sourceValue.toLowerCase()));
            if (!existingSources.has(source.toLowerCase())) {
              newConfig[mappedKey] = [...newConfig[mappedKey], { id: crypto.randomUUID(), sourceValue: source, targetValue: target }];
            }
          }
        }
      }

      setConfig(newConfig);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const addRow = (key: keyof MasterConfig, defaultTarget: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: [...prev[key], { id: crypto.randomUUID(), sourceValue: '', targetValue: defaultTarget }]
    }));
  };

  const removeRow = (key: keyof MasterConfig, id: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: prev[key].filter(item => item.id !== id)
    }));
  };

  const updateRow = (key: keyof MasterConfig, id: string, field: 'sourceValue' | 'targetValue', value: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: prev[key].map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const renderMappingSection = (
    title: string, 
    description: string,
    key: keyof MasterConfig, 
    options: string[]
  ) => {
    const data = config[key];
    
    // Validation: Check for duplicate source values
    const sourceCounts = data.reduce((acc, curr) => {
      const val = curr.sourceValue.trim().toLowerCase();
      if (val) {
        acc[val] = (acc[val] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
          <button
            onClick={() => addRow(key, options[0])}
            className="text-xs bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors shadow-sm font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Mapping
          </button>
        </div>
        
        <div className="p-0">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left font-semibold tracking-wider">Source Value (Input)</th>
                <th className="px-5 py-3 text-left font-semibold tracking-wider">Target Value (System)</th>
                <th className="px-5 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item) => {
                const isDuplicate = item.sourceValue.trim() && sourceCounts[item.sourceValue.trim().toLowerCase()] > 1;
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.sourceValue}
                          onChange={(e) => updateRow(key, item.id, 'sourceValue', e.target.value)}
                          placeholder="e.g. M, 1, Male..."
                          className={`w-full max-w-xs rounded border py-1.5 px-3 text-sm focus:ring-blue-500 focus:border-blue-500 ${isDuplicate ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                        />
                        {isDuplicate && <AlertCircle className="w-4 h-4 text-red-500" title="Duplicate source value detected" />}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={item.targetValue}
                        onChange={(e) => updateRow(key, item.id, 'targetValue', e.target.value)}
                        className="w-full max-w-xs rounded border border-slate-300 py-1.5 px-3 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => removeRow(key, item.id)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                        title="Remove mapping"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-slate-400 italic text-sm">
                    No mappings configured. Add a mapping to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-start border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 p-2 rounded-lg text-white">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Master Configuration</h2>
            <p className="text-sm text-slate-500 mt-1">Define data mappings for incoming policyholder data vs system constants.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm cursor-pointer">
            <Upload className="w-4 h-4" />
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors font-medium text-sm shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>
      </div>

      <div className="pt-2">
        {renderMappingSection(
          'Gender Mapping',
          'Map incoming gender representations to strictly Male or Female.',
          'genderMappings',
          ['Male', 'Female']
        )}

        {renderMappingSection(
          'Smoker Status Mapping',
          'Map incoming smoker status to system standard.',
          'smokerMappings',
          ['Smoker', 'Non-Smoker']
        )}

        {renderMappingSection(
          'Medical Status Mapping',
          'Map incoming medical evidence status.',
          'medicalMappings',
          ['Medical', 'Non-Medical', 'Tele-Medical']
        )}

        {renderMappingSection(
          'Impairment Mapping',
          'Map incoming life coverage types.',
          'impairmentMappings',
          ['Single', 'Joint']
        )}

        {renderMappingSection(
          'Payment Mode Mapping',
          'Map incoming policyholder payment frequency to system variations.',
          'paymentModeMappings',
          ['Annual', 'Semi-Annual', 'Quarterly', 'Monthly', 'Single']
        )}
      </div>
    </div>
  );
}
