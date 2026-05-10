import React, { useState, useMemo } from 'react';
import { SavedPolicy } from '../types';
import { FileSpreadsheet, Trash2, Search, Eye, X, Download } from 'lucide-react';

export default function CessionsView({
  savedPolicies,
  setSavedPolicies
}: {
  savedPolicies: SavedPolicy[];
  setSavedPolicies: React.Dispatch<React.SetStateAction<SavedPolicy[]>>;
}) {
  const [searchField, setSearchField] = useState<'policyNumber' | 'customerId' | 'actualCessionNo'>('policyNumber');
  const [searchValue, setSearchValue] = useState('');
  const [viewPolicy, setViewPolicy] = useState<SavedPolicy | null>(null);

  const cededPolicies = useMemo(() => savedPolicies.filter(p => p.cessionStatus !== 'Facultative Pending' && p.cessionStatus !== 'Declined'), [savedPolicies]);

  const filteredPolicies = useMemo(() => {
    if (!searchValue.trim()) return cededPolicies;
    const term = searchValue.trim().toLowerCase();
    
    return cededPolicies.filter(p => {
      if (searchField === 'policyNumber') {
        return p.policyNumber.toLowerCase().includes(term);
      } else if (searchField === 'customerId') {
        return p.customerId.toLowerCase().includes(term);
      } else if (searchField === 'actualCessionNo') {
        return p.actualCessionNo !== null && p.actualCessionNo.toString() === term;
      }
      return true;
    });
  }, [savedPolicies, searchField, searchValue]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleExportCSV = () => {
    const headers = [
      'Actual Cession No',
      'Customer ID',
      'Policy Number',
      'Policyholder Name',
      'Plan Code',
      'Plan Name',
      'DOB',
      'Age',
      'Gender',
      'Smoker',
      'Medical',
      'Impairment',
      'Risk Coverage',
      'Sum Assured Base',
      'Date of Commencement',
      'Treaty Name',
      'Gross Reserves',
      'Reinsurer Payment Freq',
      'Policyholder Payment Freq',
      'EMR Percentage',
      'Other Extra Premium',
      'Sum At Risk',
      'Sum Ceded',
      'Premium Rate',
      'Model Factor',
      'Premium Amount',
      'Reinsurer Splits'
    ];

    const rows = filteredPolicies.map(p => {
      const splits = p.reinsurerSplits && p.reinsurerSplits.length > 0
        ? p.reinsurerSplits.map(s => `${s.name}: ${s.sharePercentage}%`).join(' | ')
        : 'N/A';

      return [
        p.actualCessionNo ?? '',
        p.customerId,
        p.policyNumber,
        p.policyHolderName,
        p.planCode ?? '',
        p.planName ?? '',
        p.dob,
        p.age,
        p.gender,
        p.smoker,
        p.medical,
        p.impairment,
        p.riskCoverage,
        p.sumAssured,
        p.dateOfCommencement,
        p.treatyName,
        p.grossReserves,
        p.reinsurerPaymentFrequency,
        p.policyholderPremiumFrequency,
        p.emrPercentage,
        p.otherExtraPremium,
        p.sumAtRisk,
        p.sumCeded,
        p.premiumRate ?? '',
        p.modelFactor ?? '',
        p.premiumAmount ?? '',
        splits
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cessions_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Cessions Database</h2>
          <p className="text-sm text-slate-500 mt-1">View, search and manage computed reinsurance cessions.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-md font-medium text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          Export to CSV
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400" />
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value as any)}
              className="rounded-md border-slate-300 py-2 px-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 border w-48"
            >
              <option value="policyNumber">Policy Number</option>
              <option value="customerId">Customer ID</option>
              <option value="actualCessionNo">Actual Cession No</option>
            </select>
          </div>
          <input
            type="text"
            placeholder={`Search by ${
              searchField === 'policyNumber' ? 'Policy Number' : 
              searchField === 'customerId' ? 'Customer ID' : 'Cession No'
            }...`}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="block w-full max-w-md rounded-md border-slate-300 py-2 px-4 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 border"
          />
          <div className="ml-auto text-sm text-slate-500 font-medium bg-white border border-slate-200 py-1.5 px-3 rounded-md">
            Showing {filteredPolicies.length} of {savedPolicies.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-white border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Cess. No</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Customer / Policy</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Treaty / Coverage</th>
                <th scope="col" className="px-6 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider">Sum Ceded</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Reinsurer Split</th>
                <th scope="col" className="px-6 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider">Premium Amount</th>
                <th scope="col" className="px-6 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredPolicies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No cessions found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPolicies.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                      {p.actualCessionNo !== null ? `#${p.actualCessionNo}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{p.policyHolderName || 'N/A'}</div>
                      <div className="text-xs text-slate-500">ID: {p.customerId || 'N/A'}</div>
                      <div className="text-xs text-slate-500">Pol: {p.policyNumber || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-slate-900">{p.treatyName}</div>
                      <div className="text-xs text-slate-500">{p.riskCoverage}</div>
                      {(p.planName || p.planCode) && (
                        <div className="text-xs text-blue-600 mt-0.5" title="Plan">
                          {p.planName} {p.planCode ? `(${p.planCode})` : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-emerald-600">
                      {formatCurrency(p.sumCeded)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-xs space-y-1">
                      {p.reinsurerSplits && p.reinsurerSplits.length > 0 ? (
                        p.reinsurerSplits.map((split, idx) => (
                          <div key={idx} className="flex justify-between gap-4">
                            <span className="text-slate-600 truncate max-w-[120px]" title={split.name}>{split.name} ({split.sharePercentage}%)</span>
                            <span className="font-mono text-slate-900">{formatCurrency(split.premiumAmount)}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-blue-600">
                      {p.premiumAmount !== null ? formatCurrency(p.premiumAmount) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setViewPolicy(p)}
                          className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSavedPolicies(savedPolicies.filter(sp => sp.id !== p.id))}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Delete policy"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">
                View Cession details {viewPolicy.actualCessionNo !== null ? `- #${viewPolicy.actualCessionNo}` : ''}
              </h3>
              <button 
                onClick={() => setViewPolicy(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 gap-y-10">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4">Customer Details</h4>
                  <dl className="space-y-3 text-sm">
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Customer ID</dt><dd className="font-medium text-slate-900">{viewPolicy.customerId}</dd></div>
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Name</dt><dd className="font-medium text-slate-900">{viewPolicy.policyHolderName}</dd></div>
                    <div className="grid grid-cols-2"><dt className="text-slate-500">DOB</dt><dd className="font-medium text-slate-900">{viewPolicy.dob || 'N/A'}</dd></div>
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Gender</dt><dd className="font-medium text-slate-900">{viewPolicy.gender}</dd></div>
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Smoker Status</dt><dd className="font-medium text-slate-900">{viewPolicy.smoker}</dd></div>
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Medical Status</dt><dd className="font-medium text-slate-900">{viewPolicy.medical}</dd></div>
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Impairment</dt><dd className="font-medium text-slate-900">{viewPolicy.impairment}</dd></div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4">Policy Details</h4>
                  <dl className="space-y-3 text-sm">
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Policy Number</dt><dd className="font-medium text-slate-900">{viewPolicy.policyNumber}</dd></div>
                    <div className="grid grid-cols-2"><dt className="text-slate-500">DOC</dt><dd className="font-medium text-slate-900">{viewPolicy.dateOfCommencement || 'N/A'}</dd></div>
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Treaty</dt><dd className="font-medium text-slate-900">{viewPolicy.treatyName}</dd></div>
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Coverage</dt><dd className="font-medium text-slate-900">{viewPolicy.riskCoverage}</dd></div>
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Sum Assured</dt><dd className="font-medium text-slate-900">{formatCurrency(viewPolicy.sumAssured)}</dd></div>
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Gross Reserves</dt><dd className="font-medium text-slate-900">{formatCurrency(viewPolicy.grossReserves)}</dd></div>
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Reinsurer Payment Freq</dt><dd className="font-medium text-slate-900">{viewPolicy.reinsurerPaymentFrequency === 1 ? 'Annually' : viewPolicy.reinsurerPaymentFrequency === 2 ? 'Semi-Annually' : viewPolicy.reinsurerPaymentFrequency === 4 ? 'Quarterly' : 'Monthly'}</dd></div>
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Pol Payment Freq</dt><dd className="font-medium text-slate-900">{viewPolicy.policyholderPremiumFrequency === 1 ? 'Annually' : viewPolicy.policyholderPremiumFrequency === 2 ? 'Semi-Annually' : viewPolicy.policyholderPremiumFrequency === 4 ? 'Quarterly' : 'Monthly'}</dd></div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4">Calculated Cession Data</h4>
                  <dl className="space-y-3 text-sm">
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Sum At Risk</dt><dd className="font-medium text-slate-900">{formatCurrency(viewPolicy.sumAtRisk)}</dd></div>
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Sum Ceded</dt><dd className="font-medium text-slate-900">{formatCurrency(viewPolicy.sumCeded)}</dd></div>
                    <div className="grid grid-cols-2 bg-blue-50/50 p-2 rounded-md -mx-2"><dt className="text-blue-700 font-medium">Reinsurance Premium</dt><dd className="font-bold text-blue-700">{viewPolicy.premiumAmount !== null ? formatCurrency(viewPolicy.premiumAmount) : 'N/A'}</dd></div>
                  </dl>
                </div>

                {viewPolicy.reinsurerSplits && viewPolicy.reinsurerSplits.length > 0 && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4">Reinsurer Premium Distribution</h4>
                    <div className="bg-white border text-sm border-slate-200 rounded overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100/50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-slate-500">Reinsurer</th>
                            <th className="px-4 py-2 text-right font-medium text-slate-500">Share %</th>
                            <th className="px-4 py-2 text-right font-medium text-slate-500">Premium Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {viewPolicy.reinsurerSplits.map((r, i) => (
                            <tr key={i}>
                              <td className="px-4 py-2 text-slate-700 font-sans">{r.name}</td>
                              <td className="px-4 py-2 text-right text-slate-700">{r.sharePercentage.toFixed(2)}%</td>
                              <td className="px-4 py-2 text-right font-medium text-emerald-600">{formatCurrency(r.premiumAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setViewPolicy(null)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
