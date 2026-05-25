import React, { useState } from 'react';
import { Treaty, RetentionType, CedingCompanyConfig, SavedPolicy, SubTreaty, PaymentFrequency, ReserveTableEntry, Plan } from '../types';
import { Plus, Trash2, FileText, ChevronDown, ChevronRight, CheckCircle2, Download, Upload, Edit2, X, AlertCircle, Calculator, ShieldCheck, Save } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TreatiesView({
  treaties,
  onAddTreaty,
  onUpdateTreaty,
  onDeleteTreaty,
  companyConfig,
  savedPolicies,
  reserveTables = [],
  plans = []
}: {
  treaties: Treaty[];
  onAddTreaty: (t: Treaty | Treaty[]) => void;
  onUpdateTreaty: (t: Treaty) => void;
  onDeleteTreaty: (id: string) => void;
  companyConfig: CedingCompanyConfig;
  savedPolicies: SavedPolicy[];
  reserveTables?: ReserveTableEntry[];
  plans?: Plan[];
}) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [subTreaties, setSubTreaties] = useState<SubTreaty[]>([]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isSubTreatyModalOpen, setIsSubTreatyModalOpen] = useState(false);
  const [currentSubTreatyIndex, setCurrentSubTreatyIndex] = useState<number | null>(null);
  const [currentSubTreaty, setCurrentSubTreaty] = useState<SubTreaty | null>(null);

  const displayedTreaties = treaties.filter(t => !t.lineOfBusiness || t.lineOfBusiness === companyConfig.lineOfBusiness);

  const uniquePremiumTableIds = Array.from(new Set(reserveTables.map(rt => rt.premiumTableId))).sort();
  const uniqueCoverages = Array.from(new Set(plans.map(p => p.riskCoverage).filter(Boolean))).sort();

  const openAddSubTreatyModal = () => {
    setCurrentSubTreaty({
      id: crypto.randomUUID(),
      name: `${name ? name + '-' : 'Sub-Treaty '}${subTreaties.length + 1}`,
      startDate: startDate,
      endDate: endDate,
      retentionType: 'absolute',
      retentionValue: 0,
      facultativeLimit: 0,
      reinsurerPaymentFrequency: 1,
      reinsurerModelFactor: 1.0,
      selectionDiscount: 0,
      premiumRates: [
        { id: crypto.randomUUID(), premiumTableId: uniquePremiumTableIds[0] || 'Code-1', ageMin: 0, ageMax: 999, gender: 'Any', rate: 0 }
      ],
      reinsurers: [
        { id: crypto.randomUUID(), name: '', sharePercentage: 100 }
      ]
    });
    setCurrentSubTreatyIndex(null);
    setIsSubTreatyModalOpen(true);
  };

  const openEditSubTreatyModal = (index: number) => {
    setCurrentSubTreaty({ ...subTreaties[index] });
    setCurrentSubTreatyIndex(index);
    setIsSubTreatyModalOpen(true);
  };

  const saveSubTreaty = () => {
    if (!currentSubTreaty) return;
    const totalShare = currentSubTreaty.reinsurers.reduce((sum, r) => sum + (parseFloat(r.sharePercentage as any) || 0), 0);
    if (Math.abs(totalShare - 100) > 0.01) {
      alert(`The total reinsurer share percentage must be exactly 100%. Currently it is ${totalShare}%.`);
      return;
    }
    
    if (currentSubTreatyIndex !== null) {
      setSubTreaties(prev => {
        const arr = [...prev];
        arr[currentSubTreatyIndex] = currentSubTreaty;
        return arr;
      });
    } else {
      setSubTreaties([...subTreaties, currentSubTreaty]);
    }
    closeSubTreatyModal();
  };

  const closeSubTreatyModal = () => {
    setIsSubTreatyModalOpen(false);
    setCurrentSubTreaty(null);
    setCurrentSubTreatyIndex(null);
  };

  const removeSubTreaty = (id: string) => {
    setSubTreaties(prev => prev.filter(st => st.id !== id));
  };

  const updateCurrentSubTreaty = (field: string, val: any) => {
    if (currentSubTreaty) {
      setCurrentSubTreaty({ ...currentSubTreaty, [field]: val });
    }
  };

  const updateCurrentSTPremiumRate = (prId: string, field: string, val: any) => {
    if (currentSubTreaty) {
      setCurrentSubTreaty({
        ...currentSubTreaty,
        premiumRates: currentSubTreaty.premiumRates.map(pr => pr.id === prId ? { ...pr, [field]: val } : pr)
      });
    }
  };

  const updateCurrentSTReinsurer = (rId: string, field: string, val: any) => {
    if (currentSubTreaty) {
      setCurrentSubTreaty({
        ...currentSubTreaty,
        reinsurers: currentSubTreaty.reinsurers.map(r => r.id === rId ? { ...r, [field]: val } : r)
      });
    }
  };

  const openEdit = (t: Treaty) => {
    setEditingId(t.id);
    setName(t.name);
    setStartDate(t.startDate);
    setEndDate(t.endDate);
    setSubTreaties(t.subTreaties);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) return;

    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date cannot be after end date.");
      return;
    }

    for (const st of subTreaties) {
      const totalShare = st.reinsurers.reduce((sum, r) => sum + (parseFloat(r.sharePercentage as any) || 0), 0);
      if (Math.abs(totalShare - 100) > 0.01) {
        alert(`In Sub-Treaty "${st.name}", the total reinsurer share percentage must be exactly 100%. Currently it is ${totalShare}%.`);
        return;
      }
    }

    if (!companyConfig.lineOfBusiness) {
      alert("Please select a Line of Business in the Company Configuration before setting up treaties.");
      return;
    }

    const treatyData: Treaty = {
      id: editingId || crypto.randomUUID(),
      name,
      startDate,
      endDate,
      lineOfBusiness: companyConfig.lineOfBusiness,
      subTreaties: subTreaties.map((st, i) => ({
        ...st,
        name: st.name || `${name}-${i + 1}`,
        retentionValue: parseFloat(st.retentionValue as any) || 0,
        facultativeLimit: parseFloat(st.facultativeLimit as any) || 0,
        reinsurerPaymentFrequency: Number(st.reinsurerPaymentFrequency) as any,
        reinsurerModelFactor: parseFloat(st.reinsurerModelFactor as any) || 1,
        selectionDiscount: parseFloat(st.selectionDiscount as any) || 0,
        premiumRates: st.premiumRates.map(pr => ({
          ...pr,
          ageMin: parseInt(pr.ageMin as any) || 0,
          ageMax: parseInt(pr.ageMax as any) || 0,
          rate: parseFloat(pr.rate as any) || 0
        })),
        reinsurers: st.reinsurers.map(r => ({
          ...r,
          sharePercentage: Math.min(100, Math.max(0, parseFloat(r.sharePercentage as any) || 0))
        }))
      }))
    };

    if (editingId) {
      onUpdateTreaty(treatyData);
      setEditingId(null);
    } else {
      onAddTreaty(treatyData);
    }

    setName('');
    setStartDate('');
    setEndDate('');
    setSubTreaties([]);
  };

  const handleDelete = (id: string, tname: string) => {
    const isUsed = savedPolicies.some(p => p.selectedTreatyId === id);
    if (isUsed) {
      setDeleteError(`Cannot delete ${tname}. It is assigned to one or more calculated cessions.`);
      setTimeout(() => setDeleteError(null), 5000);
      return;
    }
    onDeleteTreaty(id);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const today = new Date().toISOString().split('T')[0];

  const handleExportTreaties = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(treaties, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `treaties_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportTreaties = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          onAddTreaty(json as Treaty[]);
        } else {
          throw new Error('Invalid format');
        }
      } catch (err) {
        alert("Invalid treaties JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Treaties</h2>
          <p className="text-sm text-slate-500 mt-1">Configure treaties and subtreaties.</p>
        </div>
        <div className="flex bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden text-sm">
          <button
            onClick={handleExportTreaties}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 transition-colors text-slate-600 font-medium border-r border-slate-200"
            title="Export Treaties as JSON"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 transition-colors text-slate-600 cursor-pointer font-medium">
            <Upload className="w-4 h-4" /> Import
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportTreaties}
            />
          </label>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-base font-medium text-slate-800">{editingId ? 'Update Treaty' : 'Add New Treaty'}</h3>
        </div>
        <form onSubmit={handleAdd} className="p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Treaty Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Life Quota Share 2024"
                className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border ring-1 ring-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                max={today}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                min={today}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-md font-semibold text-slate-800">Sub-Treaties</h4>
              <button
                type="button"
                onClick={openAddSubTreatyModal}
                disabled={!name || !startDate || !endDate}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors font-medium text-sm shadow-sm ${
                  (!name || !startDate || !endDate) ? 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Plus className="w-4 h-4" /> Add Sub-Treaty
              </button>
            </div>

            {subTreaties.length === 0 ? (
              <div className="text-sm text-slate-500 py-4 px-2 italic">No sub-treaties added yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {subTreaties.map((st, i) => (
                  <div key={st.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 relative group">
                    <h5 className="font-semibold text-slate-800">{st.name}</h5>
                    <div className="mt-2 text-xs text-slate-600 space-y-1">
                      <p><strong>Conditions:</strong> {st.rules?.length || 0} rules</p>
                      <p><strong>Retention:</strong> {st.retentionType === 'absolute' ? '₹' : ''}{st.retentionValue}{st.retentionType === 'percentage' ? '%' : ''}</p>
                      <p><strong>Facultative Limit:</strong> ₹{st.facultativeLimit}</p>
                      <p><strong>Reinsurers:</strong> {st.reinsurers.length}</p>
                      <p><strong>Premium Table:</strong> {st.premiumRates?.[0]?.premiumTableId || 'N/A'}</p>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => openEditSubTreatyModal(i)} className="text-blue-600 hover:text-blue-800 p-1">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => removeSubTreaty(st.id)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-500"></div>
            <div className="flex items-center gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setName('');
                    setStartDate('');
                    setEndDate('');
                    setSubTreaties([]);
                  }}
                  className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-6 py-2.5 rounded-md hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              )}
              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
              >
                {editingId ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingId ? 'Update Treaty' : 'Create Treaty'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-base font-medium text-slate-800">Active Treaty Master List</h3>
          <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-medium border border-slate-200">
            {displayedTreaties.length} Treaties
          </span>
        </div>
        
        {deleteError && (
          <div className="m-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{deleteError}</div>
          </div>
        )}

        {displayedTreaties.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-slate-400 min-h-[200px]">
            <FileText className="w-12 h-12 mb-3 text-slate-300" />
            <p>No treaties configured yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {displayedTreaties.map((treaty) => (
              <div key={treaty.id} className="group">
                <div 
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors ${expandedId === treaty.id ? 'bg-slate-50' : ''}`}
                  onClick={() => toggleExpand(treaty.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400">
                      {expandedId === treaty.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{treaty.name}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-slate-500">
                          Start/End: <span className="font-medium text-slate-700">{treaty.startDate || '-'} to {treaty.endDate || '-'}</span>
                        </span>
                        <span className="text-xs text-slate-500">
                          Sub-Treaties: <span className="font-medium text-slate-700">{treaty.subTreaties?.length || 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(treaty); }}
                      className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-blue-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Edit Treaty"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(treaty.id, treaty.name); }}
                      className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Delete Treaty"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {expandedId === treaty.id && (
                  <div className="bg-slate-50/80 p-5 border-t border-slate-200 flex flex-col gap-4 pb-6">
                    {treaty.subTreaties?.map((st, i) => (
                      <div key={st.id} className="bg-white border border-slate-200 rounded p-4 shadow-sm mb-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-700">{st.name}</h4>
                          <span className="text-xs text-slate-500">
                            {st.startDate || '-'} to {st.endDate || '-'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                           <div><span className="text-slate-500">Retention:</span> <span className="font-semibold">{st.retentionType === 'absolute' ? '₹':''}{st.retentionValue}{st.retentionType === 'percentage' ? '%':''}</span></div>
                           <div><span className="text-slate-500">Facultative Limit:</span> <span className="font-semibold">₹{st.facultativeLimit}</span></div>
                           <div><span className="text-slate-500">Model Factor:</span> <span className="font-semibold">{st.reinsurerModelFactor}x</span></div>
                           <div><span className="text-slate-500">Sel. Discount:</span> <span className="font-semibold">{st.selectionDiscount}%</span></div>
                        </div>
                        <div className="text-xs font-semibold text-slate-500 uppercase">Reinsurers</div>
                        <ul className="text-sm list-disc list-inside mb-4 text-slate-700">
                           {st.reinsurers?.map(r => <li key={r.id}>{r.name} - {r.sharePercentage}%</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isSubTreatyModalOpen && currentSubTreaty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {currentSubTreatyIndex !== null ? 'Edit Sub-Treaty' : 'Create Sub-Treaty'} - {currentSubTreaty.name}
              </h3>
              <button type="button" onClick={closeSubTreatyModal} className="text-slate-500 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Left Panel: Sub-Treaty Rules */}
              <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto">
                <h4 className="text-md font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-500" /> Sub-Treaty Basic Info
                </h4>

                <div className="mb-6 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Start Date</label>
                      <input type="date" max={today} value={currentSubTreaty.startDate || ''} onChange={e => updateCurrentSubTreaty('startDate', e.target.value)} className="w-full border-slate-300 rounded px-2 py-1.5 border focus:ring-blue-500 focus:border-blue-500 bg-white" />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">End Date</label>
                      <input type="date" min={today} value={currentSubTreaty.endDate || ''} onChange={e => updateCurrentSubTreaty('endDate', e.target.value)} className="w-full border-slate-300 rounded px-2 py-1.5 border focus:ring-blue-500 focus:border-blue-500 bg-white" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 my-6"></div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-700">Conditions</span>
                    <button type="button" onClick={() => updateCurrentSubTreaty('rules', [...(currentSubTreaty.rules || []), {id: crypto.randomUUID(), ruleItem: 'SA', ruleValue: ''}])} className="text-xs bg-white border border-slate-300 shadow-sm px-2 py-1 rounded hover:bg-slate-50 transition-colors">Add Rule</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left font-medium text-slate-500 px-2 py-1.5 border-b">Rule Item</th>
                          <th className="text-left font-medium text-slate-500 px-2 py-1.5 border-b">Rule Value</th>
                          <th className="border-b w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(currentSubTreaty.rules || []).map(rule => (
                          <tr key={rule.id}>
                            <td className="py-1 px-1">
                              <select 
                                value={rule.ruleItem} 
                                onChange={e => {
                                  updateCurrentSubTreaty('rules', (currentSubTreaty.rules || []).map(r => r.id === rule.id ? { ...r, ruleItem: e.target.value, ruleValue: '' } : r));
                                }}
                                className="w-full border-slate-300 rounded px-1.5 py-1.5 border bg-white"
                              >
                                {['SA', 'EMR', 'Medical', 'Smoker', 'Coverage', 'Gender', 'Imparement', 'Occupation'].map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-1 px-1">
                              {rule.ruleItem.toLowerCase() === 'gender' ? (
                                <select 
                                  value={rule.ruleValue}
                                  onChange={e => updateCurrentSubTreaty('rules', (currentSubTreaty.rules || []).map(r => r.id === rule.id ? { ...r, ruleValue: e.target.value } : r))}
                                  className="w-full border-slate-300 rounded px-1.5 py-1.5 border bg-white"
                                >
                                  <option value="">Select...</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Any">Any</option>
                                </select>
                              ) : rule.ruleItem.toLowerCase() === 'medical' ? (
                                <select 
                                  value={rule.ruleValue}
                                  onChange={e => updateCurrentSubTreaty('rules', (currentSubTreaty.rules || []).map(r => r.id === rule.id ? { ...r, ruleValue: e.target.value } : r))}
                                  className="w-full border-slate-300 rounded px-1.5 py-1.5 border bg-white"
                                >
                                  <option value="">Select...</option>
                                  <option value="Medical">Medical</option>
                                  <option value="Tele-Medical">Tele-Medical</option>
                                  <option value="Non-Medical">Non-Medical</option>
                                </select>
                              ) : rule.ruleItem.toLowerCase() === 'smoker' ? (
                                <select 
                                  value={rule.ruleValue}
                                  onChange={e => updateCurrentSubTreaty('rules', (currentSubTreaty.rules || []).map(r => r.id === rule.id ? { ...r, ruleValue: e.target.value } : r))}
                                  className="w-full border-slate-300 rounded px-1.5 py-1.5 border bg-white"
                                >
                                  <option value="">Select...</option>
                                  <option value="Smoker">Smoker</option>
                                  <option value="Non-Smoker">Non-Smoker</option>
                                </select>
                              ) : rule.ruleItem.toLowerCase() === 'imparement' ? (
                                <select 
                                  value={rule.ruleValue}
                                  onChange={e => updateCurrentSubTreaty('rules', (currentSubTreaty.rules || []).map(r => r.id === rule.id ? { ...r, ruleValue: e.target.value } : r))}
                                  className="w-full border-slate-300 rounded px-1.5 py-1.5 border bg-white"
                                >
                                  <option value="">Select...</option>
                                  <option value="Single">Single</option>
                                  <option value="Joint">Joint</option>
                                </select>
                              ) : rule.ruleItem.toLowerCase() === 'coverage' ? (
                                <select 
                                  value={rule.ruleValue}
                                  onChange={e => updateCurrentSubTreaty('rules', (currentSubTreaty.rules || []).map(r => r.id === rule.id ? { ...r, ruleValue: e.target.value } : r))}
                                  className="w-full border-slate-300 rounded px-1.5 py-1.5 border bg-white"
                                >
                                  <option value="">Select Coverage...</option>
                                  {uniqueCoverages.map(cov => (
                                    <option key={cov} value={cov}>{cov}</option>
                                  ))}
                                </select>
                              ) : (
                                <input 
                                  type="text" 
                                  value={rule.ruleValue} 
                                  onChange={e => updateCurrentSubTreaty('rules', (currentSubTreaty.rules || []).map(r => r.id === rule.id ? { ...r, ruleValue: e.target.value } : r))}
                                  className="w-full border-slate-300 rounded px-1.5 py-1.5 border" 
                                  placeholder="Value..."
                                  required 
                                />
                              )}
                            </td>
                            <td className="py-1 px-1 text-center">
                              <button type="button" onClick={() => updateCurrentSubTreaty('rules', (currentSubTreaty.rules || []).filter(xr => xr.id !== rule.id))} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-3.5 h-3.5"/></button>
                            </td>
                          </tr>
                        ))}
                        {(!currentSubTreaty.rules || currentSubTreaty.rules.length === 0) && (
                          <tr>
                            <td colSpan={3} className="py-3 px-2 text-center text-slate-500 italic">No rules defined.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SubTreaty Premium Rates */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-700">Premium Table</span>
                  </div>
                  <div className="mb-4">
                    <select
                      value={currentSubTreaty.premiumRates[0]?.premiumTableId || ''}
                      onChange={e => {
                        updateCurrentSubTreaty('premiumRates', [
                          {
                            id: crypto.randomUUID(),
                            premiumTableId: e.target.value,
                            ageMin: 0,
                            ageMax: 999,
                            gender: 'Any',
                            rate: 0
                          }
                        ]);
                      }}
                      className="w-full text-sm border-slate-300 rounded px-2 py-2 border bg-white focus:ring-blue-500"
                    >
                      <option value="">Select a Premium Table...</option>
                      {uniquePremiumTableIds.map(id => (
                        <option key={id} value={id}>{id}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Right Panel: Reinsurers & Retention */}
              <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-slate-50/50">
                <h4 className="text-md font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" /> Retention, Pricing & Reinsurers
                </h4>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Retention Type</label>
                    <select value={currentSubTreaty.retentionType} onChange={e => updateCurrentSubTreaty('retentionType', e.target.value)} className="w-full text-sm border-slate-300 rounded px-2 py-2 border bg-white focus:ring-blue-500">
                      <option value="absolute">Absolute (₹)</option>
                      <option value="percentage">Quota (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Retention Value</label>
                    <input type="number" step="0.01" value={currentSubTreaty.retentionValue} onChange={e => updateCurrentSubTreaty('retentionValue', parseFloat(e.target.value))} className="w-full text-sm border-slate-300 rounded px-2 py-2 border focus:ring-blue-500" required />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Facultative Limit</label>
                    <input type="number" step="0.01" value={currentSubTreaty.facultativeLimit} onChange={e => updateCurrentSubTreaty('facultativeLimit', parseFloat(e.target.value))} className="w-full text-sm border-slate-300 rounded px-2 py-2 border focus:ring-blue-500" required />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Payment Frequency</label>
                    <select value={currentSubTreaty.reinsurerPaymentFrequency} onChange={e => updateCurrentSubTreaty('reinsurerPaymentFrequency', parseInt(e.target.value))} className="w-full text-sm border-slate-300 rounded px-2 py-2 border bg-white focus:ring-blue-500">
                      <option value={1}>Annually (1)</option>
                      <option value={2}>Semi-Annually (2)</option>
                      <option value={4}>Quarterly (4)</option>
                      <option value={12}>Monthly (12)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Model Factor</label>
                    <input type="number" step="0.0001" value={currentSubTreaty.reinsurerModelFactor} onChange={e => updateCurrentSubTreaty('reinsurerModelFactor', parseFloat(e.target.value))} className="w-full text-sm font-mono border-slate-300 rounded px-2 py-2 border focus:ring-blue-500" required />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Selection Discount (%)</label>
                    <input type="number" step="0.01" value={currentSubTreaty.selectionDiscount} onChange={e => updateCurrentSubTreaty('selectionDiscount', parseFloat(e.target.value))} className="w-full text-sm font-mono border-slate-300 rounded px-2 py-2 border focus:ring-blue-500" required />
                  </div>
                </div>

                {/* SubTreaty Reinsurers */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-700">Reinsurers Pool</span>
                    <button type="button" onClick={() => updateCurrentSubTreaty('reinsurers', [...currentSubTreaty.reinsurers, {id: crypto.randomUUID(), name:'', sharePercentage: 0}])} className="text-xs bg-white border border-slate-300 shadow-sm px-2 py-1 rounded hover:bg-slate-50 transition-colors">Add Reinsurer</button>
                  </div>
                  <div className="bg-white border text-sm border-slate-200 rounded-lg overflow-hidden">
                    <table className="min-w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left font-medium text-slate-500 px-3 py-2 border-b">Reinsurer ID</th>
                          <th className="text-right font-medium text-slate-500 px-3 py-2 border-b w-24">Share %</th>
                          <th className="border-b w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentSubTreaty.reinsurers.map(r => (
                          <tr key={r.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-2 px-3">
                              <select value={r.name} onChange={e => updateCurrentSTReinsurer(r.id, 'name', e.target.value)} className="w-full border-slate-300 rounded px-2 py-1.5 bg-white border" required>
                                <option value="">Select Reinsurer...</option>
                                {companyConfig?.reinsurers?.map(re => (
                                  <option key={re.id} value={`${re.reinsurerId} - ${re.name}`}>{re.reinsurerId} - {re.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <input type="number" step="0.01" value={r.sharePercentage} onChange={e => updateCurrentSTReinsurer(r.id, 'sharePercentage', parseFloat(e.target.value))} className="w-full border-slate-300 rounded px-2 py-1.5 font-mono border text-right" required />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button type="button" onClick={() => updateCurrentSubTreaty('reinsurers', currentSubTreaty.reinsurers.filter(xr => xr.id !== r.id))} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Share % validation warning */}
                  {currentSubTreaty.reinsurers.reduce((sum, r) => sum + (parseFloat(r.sharePercentage as any) || 0), 0) !== 100 && (
                     <div className="mt-2 text-xs text-amber-600 flex items-center gap-1.5">
                       <AlertCircle className="w-3.5 h-3.5" />
                       Total share percentage must equal 100%. Currently: {currentSubTreaty.reinsurers.reduce((sum, r) => sum + (parseFloat(r.sharePercentage as any) || 0), 0)}%
                     </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={closeSubTreatyModal} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors font-medium text-sm">Cancel</button>
              <button type="button" onClick={saveSubTreaty} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Sub-Treaty
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
