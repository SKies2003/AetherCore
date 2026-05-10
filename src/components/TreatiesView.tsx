import React, { useState } from 'react';
import { Treaty, RetentionType } from '../types';
import { Plus, Trash2, FileText, ChevronDown, ChevronRight, CheckCircle2, Download, Upload, Edit2, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TreatiesView({
  treaties,
  onAddTreaty,
  onUpdateTreaty,
  onDeleteTreaty
}: {
  treaties: Treaty[];
  onAddTreaty: (t: Treaty | Treaty[]) => void;
  onUpdateTreaty: (t: Treaty) => void;
  onDeleteTreaty: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [retentionType, setRetentionType] = useState<RetentionType>('absolute');
  const [retentionValue, setRetentionValue] = useState<string>('');
  const [facultativeLimit, setFacultativeLimit] = useState<string>('');
  
  const [reinsurerPaymentFrequency, setReinsurerPaymentFrequency] = useState<number>(1);
  const [reinsurerModelFactor, setReinsurerModelFactor] = useState<string>('1.0');
  const [selectionDiscount, setSelectionDiscount] = useState<string>('0');

  const [premiumRates, setPremiumRates] = useState<Array<{ id: string, riskCoverage: string, ageMin: string, ageMax: string, gender: string, rate: string }>>([
    { id: crypto.randomUUID(), riskCoverage: 'Death Benefit', ageMin: '18', ageMax: '65', gender: 'Any', rate: '2.5' }
  ]);

  const [reinsurers, setReinsurers] = useState<Array<{ id: string, name: string, sharePercentage: string }>>([
    { id: crypto.randomUUID(), name: 'Global Re', sharePercentage: '100' }
  ]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openEdit = (t: Treaty) => {
    setEditingId(t.id);
    setName(t.name);
    setStartDate(t.startDate);
    setEndDate(t.endDate);
    setRetentionType(t.retentionType);
    setRetentionValue(t.retentionValue.toString());
    setFacultativeLimit(t.facultativeLimit?.toString() || '');
    setReinsurerPaymentFrequency(t.reinsurerPaymentFrequency);
    setReinsurerModelFactor(t.reinsurerModelFactor?.toString() || '1.0');
    setSelectionDiscount(t.selectionDiscount?.toString() || '0');
    setPremiumRates(t.premiumRates.map(pr => ({
      id: pr.id,
      riskCoverage: pr.riskCoverage,
      ageMin: pr.ageMin.toString(),
      ageMax: pr.ageMax.toString(),
      gender: pr.gender,
      rate: pr.rate.toString()
    })));
    setReinsurers(t.reinsurers.map(r => ({
      id: r.id,
      name: r.name,
      sharePercentage: r.sharePercentage.toString()
    })));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    // 1. Treaties
    const treatiesData = treaties.map(t => ({
      'Treaty Name': t.name,
      'Start Date': t.startDate,
      'End Date': t.endDate,
      'Retention Type': t.retentionType,
      'Retention Value': t.retentionValue,
      'Facultative Limit': t.facultativeLimit,
      'Payment Frequency': t.reinsurerPaymentFrequency,
      'Model Factor': t.reinsurerModelFactor,
      'Selection Discount': t.selectionDiscount
    }));
    const wsTreaties = XLSX.utils.json_to_sheet(treatiesData);
    XLSX.utils.book_append_sheet(wb, wsTreaties, "Treaties");

    // 2. Reinsurers
    const reinsurersData: any[] = [];
    treaties.forEach(t => {
      t.reinsurers?.forEach(r => {
        reinsurersData.push({
          'Treaty Name': t.name,
          'Reinsurer Name': r.name,
          'Share %': r.sharePercentage
        });
      });
    });
    const wsReinsurers = XLSX.utils.json_to_sheet(reinsurersData);
    XLSX.utils.book_append_sheet(wb, wsReinsurers, "Reinsurers");

    // Model Factors removed from individual sheet export

    // 4. Premium Rates
    const prData: any[] = [];
    treaties.forEach(t => {
      t.premiumRates?.forEach(pr => {
        prData.push({
          'Treaty Name': t.name,
          'Risk Coverage': pr.riskCoverage,
          'Min Age': pr.ageMin,
          'Max Age': pr.ageMax,
          'Gender': pr.gender,
          'Rate': pr.rate
        });
      });
    });
    const wsPr = XLSX.utils.json_to_sheet(prData);
    XLSX.utils.book_append_sheet(wb, wsPr, "Premium Rates");

    XLSX.writeFile(wb, "Treaties_Export.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        
        const treatiesSheet = wb.Sheets["Treaties"] ? XLSX.utils.sheet_to_json<any>(wb.Sheets["Treaties"]) : [];
        const reinsurersSheet = wb.Sheets["Reinsurers"] ? XLSX.utils.sheet_to_json<any>(wb.Sheets["Reinsurers"]) : [];
        const prSheet = wb.Sheets["Premium Rates"] ? XLSX.utils.sheet_to_json<any>(wb.Sheets["Premium Rates"]) : [];

        const existingNames = new Set(treaties.map(t => t.name.toLowerCase()));
        const newTreaties: Treaty[] = [];

        treatiesSheet.forEach(tRow => {
          const name = tRow['Treaty Name']?.toString().trim();
          if (!name || existingNames.has(name.toLowerCase())) return;

          existingNames.add(name.toLowerCase());

          const reinsurersRows = reinsurersSheet.filter(r => r['Treaty Name']?.toString().trim().toLowerCase() === name.toLowerCase());
          const prRows = prSheet.filter(pr => pr['Treaty Name']?.toString().trim().toLowerCase() === name.toLowerCase());

          newTreaties.push({
            id: crypto.randomUUID(),
            name,
            startDate: tRow['Start Date']?.toString() || '',
            endDate: tRow['End Date']?.toString() || '',
            retentionType: (tRow['Retention Type'] === 'absolute' || tRow['Retention Type'] === 'percentage') ? tRow['Retention Type'] : 'absolute',
            retentionValue: parseFloat(tRow['Retention Value']) || 0,
            facultativeLimit: parseFloat(tRow['Facultative Limit']) || 0,
            reinsurerPaymentFrequency: parseInt(tRow['Payment Frequency']) || 1 as any,
            reinsurerModelFactor: parseFloat(tRow['Model Factor']) || 1,
            selectionDiscount: parseFloat(tRow['Selection Discount']) || 0,
            reinsurers: reinsurersRows.map(r => ({
              id: crypto.randomUUID(),
              name: r['Reinsurer Name']?.toString() || '',
              sharePercentage: parseFloat(r['Share %']) || 0
            })),
            premiumRates: prRows.map(pr => ({
              id: crypto.randomUUID(),
              riskCoverage: pr['Risk Coverage']?.toString() || '',
              ageMin: parseInt(pr['Min Age']) || 0,
              ageMax: parseInt(pr['Max Age']) || 0,
              gender: pr['Gender']?.toString() || 'Any',
              rate: parseFloat(pr['Rate']) || 0
            }))
          });
        });

        if (newTreaties.length > 0) {
          onAddTreaty(newTreaties);
        }
      } catch (err) {
        console.error("Failed to parse file", err);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !retentionValue || !startDate || !endDate) return;

    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date cannot be after end date.");
      return;
    }

    const totalShare = reinsurers.reduce((sum, r) => sum + (parseFloat(r.sharePercentage) || 0), 0);
    if (Math.abs(totalShare - 100) > 0.01) {
      alert(`The total reinsurer share percentage must be exactly 100%. Currently it is ${totalShare}%.`);
      return;
    }

    const treatyData = {
      id: editingId || crypto.randomUUID(),
      name,
      startDate,
      endDate,
      retentionType,
      retentionValue: parseFloat(retentionValue),
      facultativeLimit: parseFloat(facultativeLimit) || 0,
      reinsurerPaymentFrequency: reinsurerPaymentFrequency as any,
      reinsurerModelFactor: parseFloat(reinsurerModelFactor) || 1,
      selectionDiscount: parseFloat(selectionDiscount) || 0,
      premiumRates: premiumRates.map(pr => ({
        id: crypto.randomUUID(),
        riskCoverage: pr.riskCoverage,
        ageMin: parseInt(pr.ageMin) || 0,
        ageMax: parseInt(pr.ageMax) || 0,
        gender: pr.gender as any,
        rate: parseFloat(pr.rate) || 0
      })),
      reinsurers: reinsurers.map(r => ({
        id: crypto.randomUUID(),
        name: r.name,
        sharePercentage: Math.min(100, Math.max(0, parseFloat(r.sharePercentage) || 0))
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
    setRetentionValue('');
    setFacultativeLimit('');
    setReinsurerPaymentFrequency(1);
    setReinsurerModelFactor('1.0');
    setSelectionDiscount('0');
    setPremiumRates([{ id: crypto.randomUUID(), riskCoverage: 'Death Benefit', ageMin: '18', ageMax: '65', gender: 'Any', rate: '2.5' }]);
    setReinsurers([{ id: crypto.randomUUID(), name: 'Global Re', sharePercentage: '100' }]);
  };

  const updatePremiumRate = (id: string, field: string, val: string) => {
    setPremiumRates(prev => prev.map(pr => pr.id === id ? { ...pr, [field]: val } : pr));
  };

  const updateReinsurer = (id: string, field: string, val: string) => {
    setReinsurers(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Treaty Management</h2>
          <p className="text-sm text-slate-500 mt-1">Configure reinsurance treaties, retention limits, and rate factors.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm cursor-pointer">
            <Upload className="w-4 h-4" />
            Import XLSX
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors font-medium text-sm shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Config
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-base font-medium text-slate-800">Add New Treaty</h3>
        </div>
        <form onSubmit={handleAdd} className="p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
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
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-all"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 md:col-span-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Retention</label>
                <select
                  value={retentionType}
                  onChange={(e) => setRetentionType(e.target.value as RetentionType)}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-all"
                >
                  <option value="absolute">Absolute (₹)</option>
                  <option value="percentage">Quota (%)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={retentionValue}
                  onChange={(e) => setRetentionValue(e.target.value)}
                  placeholder={retentionType === 'percentage' ? "e.g. 20" : "e.g. 2500000"}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Facultative Limit</label>
                <input
                  type="number"
                  step="0.01"
                  value={facultativeLimit}
                  onChange={(e) => setFacultativeLimit(e.target.value)}
                  placeholder="e.g. 5000000"
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-md p-4 bg-slate-50/50">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">Premium & Discount Rules</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reinsurer Payment Mode</label>
                <select
                  value={reinsurerPaymentFrequency}
                  onChange={(e) => setReinsurerPaymentFrequency(Number(e.target.value))}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-all"
                >
                  <option value={1}>Annually (1)</option>
                  <option value={2}>Semi-Annually (2)</option>
                  <option value={4}>Quarterly (4)</option>
                  <option value={12}>Monthly (12)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Model Factor</label>
                <input
                  type="number"
                  step="0.0001"
                  max="1"
                  min="0"
                  value={reinsurerModelFactor}
                  onChange={(e) => setReinsurerModelFactor(e.target.value)}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-all font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Selection Discount (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={selectionDiscount}
                  onChange={(e) => setSelectionDiscount(e.target.value)}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-all font-mono"
                  required
                />
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-md p-4 bg-slate-50/50 overflow-x-auto">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-slate-800">Premium Rate Matrix (per 1,000)</h4>
              <button 
                type="button" 
                onClick={() => setPremiumRates([...premiumRates, { id: crypto.randomUUID(), riskCoverage: 'Death Benefit', ageMin: '18', ageMax: '65', gender: 'Any', rate: '1.0' }])}
                className="text-xs bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors shadow-sm font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Row
              </button>
            </div>
            
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100/50 text-xs text-slate-500">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold tracking-wider">Coverage Name</th>
                  <th className="px-2 py-2 text-left font-semibold tracking-wider">Min Age</th>
                  <th className="px-2 py-2 text-left font-semibold tracking-wider">Max Age</th>
                  <th className="px-2 py-2 text-left font-semibold tracking-wider">Gender</th>
                  <th className="px-2 py-2 text-left font-semibold tracking-wider">Rate (₹)</th>
                  <th className="px-2 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {premiumRates.map((pr) => (
                  <tr key={pr.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-2 py-1.5">
                      <input 
                        type="text" 
                        value={pr.riskCoverage} 
                        onChange={e => updatePremiumRate(pr.id, 'riskCoverage', e.target.value)} 
                        className="w-full rounded border-slate-300 py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 border" 
                        required 
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input 
                        type="number" 
                        min="0" 
                        value={pr.ageMin} 
                        onChange={e => updatePremiumRate(pr.id, 'ageMin', e.target.value)} 
                        className="w-20 rounded border-slate-300 py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 border" 
                        required 
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input 
                        type="number" 
                        min="0" 
                        value={pr.ageMax} 
                        onChange={e => updatePremiumRate(pr.id, 'ageMax', e.target.value)} 
                        className="w-20 rounded border-slate-300 py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 border" 
                        required 
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select 
                        value={pr.gender} 
                        onChange={e => updatePremiumRate(pr.id, 'gender', e.target.value)} 
                        className="w-24 rounded border-slate-300 py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 border"
                      >
                        <option value="Any">Any</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        value={pr.rate} 
                        onChange={e => updatePremiumRate(pr.id, 'rate', e.target.value)} 
                        className="w-24 rounded border-slate-300 py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 border font-mono" 
                        required 
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      {premiumRates.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => setPremiumRates(prev => prev.filter(p => p.id !== pr.id))} 
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border border-slate-200 rounded-md p-4 bg-slate-50/50 overflow-x-auto">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-slate-800">Reinsurer Share Allocation</h4>
              <button 
                type="button" 
                onClick={() => setReinsurers([...reinsurers, { id: crypto.randomUUID(), name: '', sharePercentage: '0' }])}
                className="text-xs bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors shadow-sm font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Reinsurer
              </button>
            </div>
            
            <table className="min-w-full divide-y divide-slate-200 text-sm mb-2">
              <thead className="bg-slate-100/50 text-xs text-slate-500">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold tracking-wider w-2/3">Reinsurer Name / ID</th>
                  <th className="px-2 py-2 text-left font-semibold tracking-wider">Share % (Max 100)</th>
                  <th className="px-2 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reinsurers.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-2 py-1.5">
                      <input 
                        type="text" 
                        value={r.name} 
                        onChange={e => updateReinsurer(r.id, 'name', e.target.value)} 
                        className="w-full rounded border-slate-300 py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 border" 
                        placeholder="e.g. Swiss Re"
                        required 
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        max="100"
                        value={r.sharePercentage} 
                        onChange={e => updateReinsurer(r.id, 'sharePercentage', e.target.value)} 
                        className="w-full rounded border-slate-300 py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 border font-mono" 
                        required 
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      {reinsurers.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => setReinsurers(prev => prev.filter(p => p.id !== r.id))} 
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <p>Model factors shouldn't exceed 1.0. You can expand treaties to view their details later.</p>
            </div>
            <div className="flex items-center gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setName('');
                    setStartDate('');
                    setEndDate('');
                    setRetentionValue('');
                    setFacultativeLimit('');
                    setReinsurerPaymentFrequency(1);
                    setReinsurerModelFactor('1.0');
                    setSelectionDiscount('0');
                    setPremiumRates([{ id: crypto.randomUUID(), riskCoverage: 'Death Benefit', ageMin: '18', ageMax: '65', gender: 'Any', rate: '2.5' }]);
                    setReinsurers([{ id: crypto.randomUUID(), name: 'Global Re', sharePercentage: '100' }]);
                  }}
                  className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-6 py-2.5 rounded-md hover:bg-slate-50 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-sm"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-sm"
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
            {treaties.length} Treaties configured
          </span>
        </div>
        
        {treaties.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-slate-400 min-h-[200px]">
            <FileText className="w-12 h-12 mb-3 text-slate-300" />
            <p>No treaties configured yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {treaties.map((treaty) => (
              <div key={treaty.id} className="group">
                {/* Treaty Header Row */}
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
                          Retention: <span className="font-mono font-medium text-slate-700">{treaty.retentionType === 'absolute' ? '₹' : ''}{treaty.retentionValue}{treaty.retentionType === 'percentage' ? '%' : ''}</span>
                        </span>
                        <span className="text-xs text-slate-500">
                          Reinsurers: <span className="font-medium text-slate-700">{treaty.reinsurers?.length || 0}</span>
                        </span>
                        <span className="text-xs text-slate-500">
                          Rates Configured: <span className="font-medium text-slate-700">{treaty.premiumRates.length}</span>
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
                      onClick={(e) => { e.stopPropagation(); onDeleteTreaty(treaty.id); }}
                      className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Delete Treaty"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Treaty Expanded Details */}
                {expandedId === treaty.id && (
                  <div className="bg-slate-50/80 p-5 border-t border-slate-200 flex flex-col gap-4 pb-6">
                    {/* General Settings */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-white border border-slate-200 rounded p-4 shadow-sm">
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">Treaty Name</div>
                        <div className="text-sm font-medium text-slate-800 mt-1">{treaty.name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">Start &mdash; End Date</div>
                        <div className="text-sm font-medium mt-1">{treaty.startDate || '-'} to {treaty.endDate || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">Retention Type</div>
                        <div className="text-sm font-medium mt-1 capitalize">{treaty.retentionType}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">Retention Value</div>
                        <div className="text-sm font-medium mt-1">{treaty.retentionType === 'absolute' ? '₹' : ''}{treaty.retentionValue}{treaty.retentionType === 'percentage' ? '%' : ''}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">Facultative Limit</div>
                        <div className="text-sm font-medium mt-1">₹{treaty.facultativeLimit}</div>
                      </div>
                    </div>
                    {/* Reinsurers */}
                    <details className="group/reinsurers bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
                      <summary className="px-4 py-3 bg-slate-50 cursor-pointer font-semibold text-sm text-slate-700 flex justify-between items-center select-none hover:bg-slate-100 transition-colors">
                        <span>Reinsurer Share Allocation <span className="ml-2 text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">{treaty.reinsurers?.length || 0} Reinsurers</span></span>
                        <ChevronDown className="w-4 h-4 text-slate-400 group-open/reinsurers:rotate-180 transition-transform" />
                      </summary>
                      <div className="border-t border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                          <thead className="bg-slate-50 text-xs">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase tracking-wider w-2/3">Reinsurer</th>
                              <th className="px-4 py-3 text-right font-medium text-slate-500 uppercase tracking-wider">Share %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {treaty.reinsurers?.map(r => (
                              <tr key={r.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-700 font-sans">{r.name}</td>
                                <td className="px-4 py-3 text-right text-slate-700">{r.sharePercentage.toFixed(2)}%</td>
                              </tr>
                            ))}
                            {(!treaty.reinsurers || treaty.reinsurers.length === 0) && (
                              <tr>
                                <td colSpan={2} className="px-4 py-6 text-center text-slate-400 font-sans italic bg-white">No reinsurers assigned</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </details>

                    {/* Premium & Discount Rules */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-slate-200 rounded p-4 shadow-sm">
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">Payment Mode</div>
                        <div className="text-sm font-medium mt-1">
                          {treaty.reinsurerPaymentFrequency === 1 ? 'Annually' : treaty.reinsurerPaymentFrequency === 2 ? 'Semi-Annually' : treaty.reinsurerPaymentFrequency === 4 ? 'Quarterly' : 'Monthly'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">Model Factor</div>
                        <div className="text-sm font-medium text-slate-800 mt-1">{treaty.reinsurerModelFactor?.toFixed(4)}x</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">Selection Discount</div>
                        <div className="text-sm font-medium mt-1">{treaty.selectionDiscount?.toFixed(2)}%</div>
                      </div>
                    </div>

                    {/* Premium Rates */}
                    <details className="group/rates bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
                      <summary className="px-4 py-3 bg-slate-50 cursor-pointer font-semibold text-sm text-slate-700 flex justify-between items-center select-none hover:bg-slate-100 transition-colors">
                        <span>Premium Rate Matrix <span className="ml-2 text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">{new Set(treaty.premiumRates.map(pr => pr.riskCoverage)).size} unique coverages</span></span>
                        <ChevronDown className="w-4 h-4 text-slate-400 group-open/rates:rotate-180 transition-transform" />
                      </summary>
                      <div className="border-t border-slate-200">
                        <div className="max-h-[300px] overflow-y-auto">
                          <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-xs sticky top-0 z-10 shadow-sm">
                              <tr>
                                <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase tracking-wider">Coverage</th>
                                <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase tracking-wider">Age Band</th>
                                <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase tracking-wider">Gender</th>
                                <th className="px-4 py-3 text-right font-medium text-slate-500 uppercase tracking-wider">Rate/1000</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono text-xs">
                              {treaty.premiumRates.map(pr => (
                                <tr key={pr.id} className="hover:bg-slate-50">
                                  <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap font-sans">{pr.riskCoverage}</td>
                                  <td className="px-4 py-2.5 text-slate-600">{pr.ageMin} - {pr.ageMax}</td>
                                  <td className="px-4 py-2.5 text-slate-600">{pr.gender}</td>
                                  <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{pr.rate.toFixed(3)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
