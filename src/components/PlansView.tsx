import React, { useState } from 'react';
import { Plan, SavedPolicy, CedingCompanyConfig } from '../types';
import { Download, Upload, Trash2, Edit2, Plus, X, FileText, AlertCircle } from 'lucide-react';

export default function PlansView({ 
  plans, 
  setPlans,
  savedPolicies,
  companyConfig
}: { 
  plans: Plan[]; 
  setPlans: React.Dispatch<React.SetStateAction<Plan[]>>;
  savedPolicies: SavedPolicy[];
  companyConfig: CedingCompanyConfig;
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const [planName, setPlanName] = useState('');
  const [planCode, setPlanCode] = useState('');
  const [riskCoverage, setRiskCoverage] = useState('');
  const [type, setType] = useState<'Base' | 'Rider'>('Base');

  const openAddForm = () => {
    setEditingId(null);
    setPlanName('');
    setPlanCode('');
    setRiskCoverage('');
    setType('Base');
    setIsFormOpen(true);
  };

  const openEditForm = (plan: Plan) => {
    setEditingId(plan.id);
    setPlanName(plan.planName);
    setPlanCode(plan.planCode);
    setRiskCoverage(plan.riskCoverage);
    setType(plan.type);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName || !planCode || !riskCoverage || !type) return;

    if (editingId) {
      setPlans(plans.map(p => p.id === editingId ? {
        id: editingId,
        planName,
        planCode,
        riskCoverage,
        type
      } : p));
    } else {
      setPlans([...plans, {
        id: crypto.randomUUID(),
        planName,
        planCode,
        riskCoverage,
        type,
        lineOfBusiness: companyConfig.lineOfBusiness
      }]);
    }
    closeForm();
  };

  const handleDelete = (id: string, name: string) => {
    // Ideally we would check p.planCode === plan.planCode, but we don't have the plan object here.
    // For now, since planCode isn't reliably verified against id, we'll just disable the check or check selectedPlanId if we added it.
    // Wait, let's find the plan to get its planCode.
    const planToDelete = plans.find(p => p.id === id);
    const isUsed = planToDelete && savedPolicies.some(p => p.planCode === planToDelete.planCode);
    
    if (isUsed) {
      setDeleteError(`Cannot delete ${name}. It is assigned to one or more calculated cessions.`);
      setTimeout(() => setDeleteError(null), 5000);
      return;
    }
    setPlans(plans.filter(p => p.id !== id));
  };

  const parseCsvLine = (text: string) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"' && text[i+1] === '"') {
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

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(r => r.trim());
      if (rows.length < 2) return;

      const isTsv = rows[0].includes('\t');
      const getCols = (line: string) => isTsv ? line.split('\t') : parseCsvLine(line);

      const headers = getCols(rows[0]).map(h => h.trim().toLowerCase());
      
      const newPlans: Plan[] = [];
      const getCol = (cols: string[], name: string) => {
        const idx = headers.indexOf(name.toLowerCase());
        return idx !== -1 ? cols[idx]?.trim() || '' : '';
      };

      for (let i = 1; i < rows.length; i++) {
        const cols = getCols(rows[i]);
        if (cols.length < 2) continue;

        const importedName = getCol(cols, 'plan name') || getCol(cols, 'planname') || getCol(cols, 'name');
        const importedCode = getCol(cols, 'plan code') || getCol(cols, 'plancode') || getCol(cols, 'code');
        const importedRiskCov = getCol(cols, 'risk coverage') || getCol(cols, 'riskcoverage');
        const importedType = getCol(cols, 'type') || getCol(cols, 'base/rider');
        
        let solvedType: 'Base' | 'Rider' = 'Base';
        if (importedType.toLowerCase() === 'rider') solvedType = 'Rider';

        if (importedName && importedCode && importedRiskCov) {
          // Avoid exact duplicates
          if (!plans.some(p => p.planCode === importedCode && p.planName === importedName) &&
              !newPlans.some(p => p.planCode === importedCode && p.planName === importedName)) {
            newPlans.push({
              id: crypto.randomUUID(),
              planName: importedName,
              planCode: importedCode,
              riskCoverage: importedRiskCov,
              type: solvedType,
              lineOfBusiness: companyConfig.lineOfBusiness
            });
          }
        }
      }

      if (newPlans.length > 0) {
        setPlans(prev => [...prev, ...newPlans]);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const displayedPlans = plans.filter(p => !p.lineOfBusiness || p.lineOfBusiness === companyConfig.lineOfBusiness);

  const handleExportCSV = () => {
    const headers = ['Plan Name', 'Plan Code', 'Risk Coverage', 'Type'];
    const rows = displayedPlans.map(p => [p.planName, p.planCode, p.riskCoverage, p.type]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plans_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportTemplate = () => {
    const headers = ['Plan Name', 'Plan Code', 'Risk Coverage', 'Type'];
    const csvContent = headers.join(',');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plans_template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Plans Database</h2>
          <p className="text-sm text-slate-500 mt-1">Manage plans, associating them with underlying risk coverages and plan types.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm cursor-pointer">
            <Upload className="w-4 h-4" />
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          </label>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors font-medium text-sm shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Plan
          </button>
        </div>
      </div>

      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{deleteError}</div>
        </div>
      )}

      {isFormOpen && (
        <div className="bg-white border text-sm border-slate-200 rounded overflow-hidden shadow-sm">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">{editingId ? 'Edit Plan' : 'New Plan'}</h3>
            <button onClick={closeForm} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plan Name</label>
                <input type="text" required value={planName} onChange={e => setPlanName(e.target.value)} className="block w-full rounded border-slate-300 py-1.5 px-3 border bg-white focus:ring-blue-500" placeholder="e.g. Shield Term Plan"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plan Code</label>
                <input type="text" required value={planCode} onChange={e => setPlanCode(e.target.value)} className="block w-full rounded border-slate-300 py-1.5 px-3 border bg-white focus:ring-blue-500" placeholder="e.g. T1001"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Risk Coverage</label>
                <input type="text" required value={riskCoverage} onChange={e => setRiskCoverage(e.target.value)} className="block w-full rounded border-slate-300 py-1.5 px-3 border bg-white focus:ring-blue-500" placeholder="e.g. Death Benefit"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type (Base/Rider)</label>
                <select value={type} onChange={e => setType(e.target.value as 'Base' | 'Rider')} className="block w-full rounded border-slate-300 py-1.5 px-3 border bg-white focus:ring-blue-500">
                  <option value="Base">Base</option>
                  <option value="Rider">Rider</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded font-medium shadow-sm hover:bg-blue-700 transition-colors">
                {editingId ? 'Update Plan' : 'Save Plan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {displayedPlans.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Plan Name</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Plan Code</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Risk Coverage</th>
                <th scope="col" className="px-6 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {displayedPlans.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-medium">{p.planName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono">{p.planCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 space-x-1 rounded text-xs font-medium ${p.type === 'Base' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-orange-50 text-orange-700 border-orange-200'} border`}>
                      {p.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{p.riskCoverage}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button onClick={() => openEditForm(p)} className="text-slate-400 hover:text-blue-600 transition-colors p-1" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id, p.planName)} className="text-slate-400 hover:text-red-600 transition-colors p-1 ml-2" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 border-dashed rounded-lg p-12 text-center text-slate-500">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p>No plans saved yet. Add a new plan to get started.</p>
        </div>
      )}
    </div>
  );
}
