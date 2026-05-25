import React, { useState, useMemo } from 'react';
import { SavedPolicy, CedingCompanyConfig, ProcessInterval } from '../types';
import { FileSpreadsheet, Trash2, Search, Eye, X, Download, Play, Settings } from 'lucide-react';

export default function CessionsView({
  savedPolicies,
  setSavedPolicies,
  companyConfig,
  processIntervals
}: {
  savedPolicies: SavedPolicy[];
  setSavedPolicies: React.Dispatch<React.SetStateAction<SavedPolicy[]>>;
  companyConfig: CedingCompanyConfig;
  processIntervals: ProcessInterval[];
}) {
  const [searchField, setSearchField] = useState<'policyNumber' | 'customerId' | 'actualCessionNo'>('policyNumber');
  const [searchValue, setSearchValue] = useState('');
  const [viewPolicy, setViewPolicy] = useState<SavedPolicy | null>(null);
  
  const [selectedCessionForTransactions, setSelectedCessionForTransactions] = useState<SavedPolicy | null>(null);

  const cededPolicies = useMemo(() => savedPolicies.filter(p => p.cessionStatus !== 'Facultative Pending' && p.cessionStatus !== 'Declined' && (!p.lineOfBusiness || p.lineOfBusiness === companyConfig.lineOfBusiness)), [savedPolicies, companyConfig]);

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
      'Process Interval',
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
      'Sub-Treaty Name',
      'Gross Reserves',
      'Reinsurer Payment Freq',
      'Policyholder Payment Freq',
      'EMR Percentage',
      'Other Extra Premium',
      'Sum At Risk',
      'Premium Rate',
      'Model Factor'
    ];

    const rows = filteredPolicies.map(p => {
      const splits = p.reinsurerSplits && p.reinsurerSplits.length > 0
        ? p.reinsurerSplits.map(s => `${s.name}: ${s.sharePercentage}%`).join(' | ')
        : 'N/A';
        
      const interval = processIntervals.find(inv => inv.id === p.processIntervalId)?.name || 'N/A';

      return [
        p.actualCessionNo ?? '',
        interval,
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
        p.subTreatyName ?? '',
        p.grossReserves,
        p.reinsurerPaymentFrequency,
        p.policyholderPremiumFrequency,
        p.emrPercentage,
        p.otherExtraPremium,
        p.sumAtRisk,
        p.premiumRate ?? '',
        p.modelFactor ?? ''
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
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex-1 min-h-[400px]">
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

        <div className="overflow-x-auto h-[400px] overflow-y-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Cess. No</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Process Interval</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Customer Name</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Customer ID</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Policy No</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Treaty</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Coverage</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Plan Name</th>
                <th scope="col" className="px-6 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Sum Assured</th>
                <th scope="col" className="px-6 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Sum Ceded</th>
                <th scope="col" className="px-6 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredPolicies.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-500">
                    No cessions found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPolicies.map((p) => {
                  const interval = processIntervals.find(inv => inv.id === p.processIntervalId)?.name || 'N/A';
                  return (
                  <tr key={p.id} className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedCessionForTransactions?.id === p.id ? 'bg-blue-50/50' : ''}`} onClick={() => setSelectedCessionForTransactions(p)}>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                      {p.actualCessionNo !== null ? p.actualCessionNo : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 text-xs">
                      {interval}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                      {p.policyHolderName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {p.customerId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {p.policyNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                      {p.treatyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {p.subTreatyName || p.riskCoverage}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {(p.planName || p.planCode) ? `${p.planName || ''} ${p.planCode ? `(${p.planCode})` : ''}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-slate-900">
                       {formatCurrency(parseFloat(p.sumAssured))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-emerald-600">
                       {formatCurrency(p.sumCeded)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewPolicy(p); }}
                          className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSavedPolicies(savedPolicies.filter(sp => sp.id !== p.id)); if (selectedCessionForTransactions?.id === p.id) setSelectedCessionForTransactions(null); }}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Delete policy"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Lower half - Cession Transactions */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm min-h-[300px] mt-6">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
           <h3 className="text-sm font-semibold text-slate-800">Cession Transactions</h3>
        </div>
        <div className="p-6">
          {selectedCessionForTransactions ? (
             <div className="space-y-4">
                <h5 className="text-sm font-semibold text-slate-700 mb-2">Transaction History</h5>
                {selectedCessionForTransactions.transactions && selectedCessionForTransactions.transactions.length > 0 ? (
                  <div className="border border-slate-200 rounded-md overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                       <thead className="bg-slate-50 sticky top-0 z-10">
                         <tr>
                            <th className="px-4 py-2 text-left font-medium text-slate-500 whitespace-nowrap">BatchID</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500 whitespace-nowrap">TRID</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500 whitespace-nowrap">Process Interval</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500 whitespace-nowrap">CalcFrom</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500 whitespace-nowrap">CalcTo</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500 whitespace-nowrap">ReinsurerID</th>
                            <th className="px-4 py-2 text-right font-medium text-slate-500 whitespace-nowrap">SumAtRisk</th>
                            <th className="px-4 py-2 text-right font-medium text-slate-500 whitespace-nowrap">SumCeded</th>
                            <th className="px-4 py-2 text-right font-medium text-slate-500 whitespace-nowrap">PremiumAmount</th>
                         </tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-slate-100">
                          {selectedCessionForTransactions.transactions.map((tx, i) => (
                             <tr key={i} className="hover:bg-slate-50">
                               <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{tx.batchId || 'N/A'}</td>
                               <td className="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">{tx.trid || tx.id.substring(0,8)}</td>
                               <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{processIntervals.find(inv => inv.id === tx.processIntervalId)?.name || 'N/A'}</td>
                               <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{tx.calcFrom}</td>
                               <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{tx.calcTo}</td>
                               <td className="px-4 py-3 text-slate-900 font-medium whitespace-nowrap">{tx.reinsurerName}</td>
                               <td className="px-4 py-3 text-slate-500 font-mono text-right whitespace-nowrap">{formatCurrency(selectedCessionForTransactions.sumAtRisk)}</td>
                               <td className="px-4 py-3 text-emerald-600 font-mono text-right whitespace-nowrap">{formatCurrency(tx.sumCeded)}</td>
                               <td className="px-4 py-3 text-blue-600 font-bold font-mono text-right whitespace-nowrap">{formatCurrency(tx.premiumAmount)}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 italic">No transactions found for this cession.</div>
                )}
             </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[200px] text-slate-400 text-sm italic border-2 border-dashed border-slate-100 rounded-lg">
               Select a cession from the table above to view its transactions.
            </div>
          )}
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
