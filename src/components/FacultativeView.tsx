import React, { useState, useMemo } from 'react';
import { SavedPolicy, CedingCompanyConfig, ProcessInterval, Treaty } from '../types';
import { Search, Eye, X, CheckCircle, XCircle } from 'lucide-react';

export default function FacultativeView({
  savedPolicies,
  setSavedPolicies,
  companyConfig,
  processIntervals,
  treaties
}: {
  savedPolicies: SavedPolicy[];
  setSavedPolicies: React.Dispatch<React.SetStateAction<SavedPolicy[]>>;
  companyConfig: CedingCompanyConfig;
  processIntervals: ProcessInterval[];
  treaties: Treaty[];
}) {
  const [searchField, setSearchField] = useState<'policyNumber' | 'customerId'>('policyNumber');
  const [searchValue, setSearchValue] = useState('');
  const [viewPolicy, setViewPolicy] = useState<SavedPolicy | null>(null);

  const facultativePolicies = useMemo(() => savedPolicies.filter(p => (p.cessionStatus === 'Facultative Pending' || p.cessionStatus === 'Accepted' || p.cessionStatus === 'Declined') && (!p.lineOfBusiness || p.lineOfBusiness === companyConfig.lineOfBusiness)), [savedPolicies, companyConfig]);

  const filteredPolicies = useMemo(() => {
    if (!searchValue.trim()) return facultativePolicies;
    const term = searchValue.trim().toLowerCase();
    
    return facultativePolicies.filter(p => {
      if (searchField === 'policyNumber') {
        return p.policyNumber.toLowerCase().includes(term);
      } else if (searchField === 'customerId') {
        return p.customerId.toLowerCase().includes(term);
      }
      return true;
    });
  }, [facultativePolicies, searchField, searchValue]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const generateBatchId = () => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  };

  const handleAccept = (policy: SavedPolicy) => {
    let currentMaxTrid = Math.max(0, ...savedPolicies.flatMap(p => (p.transactions || []).map(t => t.trid || 0)));
    const runBatchId = generateBatchId();
    const maxCessionNo = Math.max(...savedPolicies.map(p => p.actualCessionNo || 0), 0);
    const newTransactions: any[] = [];
    
    const treaty = treaties.find(t => t.name.toLowerCase() === policy.treatyName?.toLowerCase());
    const subTreaty = treaty?.subTreaties?.find(st => st.name.toLowerCase() === policy.subTreatyName?.toLowerCase());

    const processInterval = processIntervals.find(inv => inv.id === policy.processIntervalId);

    console.log("Facultative Accept - Policy:", policy.policyNumber, "processInterval:", processInterval?.id, "subTreaty:", subTreaty?.name);

    if (processInterval && subTreaty && policy.dateOfCommencement) {
        const docDate = new Date(policy.dateOfCommencement);
        const freq = subTreaty.reinsurerPaymentFrequency || 1;
        const monthsToAdd = 12 / freq;

        let nextCalcFrom = new Date(docDate);
        let loopCounter = 0;
        
        while (nextCalcFrom.toISOString().split('T')[0] <= processInterval.endDate && loopCounter < 1000) {
           const calcFromStr = nextCalcFrom.toISOString().split('T')[0];
           
           const nextCalcTo = new Date(nextCalcFrom);
           nextCalcTo.setMonth(nextCalcTo.getMonth() + monthsToAdd);
           nextCalcTo.setDate(nextCalcTo.getDate() - 1);
           const calcToStr = nextCalcTo.toISOString().split('T')[0];
           
           console.log("Loop evaluating calcFromStr:", calcFromStr, "against interval:", processInterval.startDate, "to", processInterval.endDate);

           if (calcFromStr >= processInterval.startDate && calcFromStr <= processInterval.endDate) {
               if (policy.sumCeded > 0) {
                   console.log("Generating transaction for:", calcFromStr);
                   subTreaty.reinsurers?.forEach(r => {
                       currentMaxTrid++;
                       newTransactions.push({
                         id: crypto.randomUUID(),
                         trid: currentMaxTrid,
                         batchId: runBatchId,
                         calcFrom: calcFromStr,
                         calcTo: calcToStr,
                         reinsurerId: r.name,
                         reinsurerName: r.name,
                         sumCeded: policy.sumCeded * (r.sharePercentage / 100),
                         premiumAmount: (policy.premiumAmount || 0) * (r.sharePercentage / 100),
                         processIntervalId: policy.processIntervalId
                       });
                   });
               }
           }
           
           nextCalcFrom.setMonth(nextCalcFrom.getMonth() + monthsToAdd);
           loopCounter++;
        }
    }

    console.log("Generated Transactions count:", newTransactions.length);

    setSavedPolicies(prev => prev.map(p => 
      p.id === policy.id ? { 
        ...p, 
        cessionStatus: 'Accepted', 
        actualCessionNo: p.sumCeded > 0 ? maxCessionNo + 1 : null,
        transactions: (p.transactions || []).concat(newTransactions)
      } : p
    ));
  };

  const handleDecline = (policy: SavedPolicy) => {
    setSavedPolicies(prev => prev.map(p => 
      p.id === policy.id ? { ...p, cessionStatus: 'Declined' } : p
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Facultative Pending queue</h2>
          <p className="text-sm text-slate-500 mt-1">Review policies that exceed the automatic facultative limit.</p>
        </div>
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
            </select>
          </div>
          <input
            type="text"
            placeholder={`Search by ${searchField === 'policyNumber' ? 'Policy Number' : 'Customer ID'}...`}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="block w-full max-w-md rounded-md border-slate-300 py-2 px-4 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 border"
          />
          <div className="ml-auto text-sm text-slate-500 font-medium bg-white border border-slate-200 py-1.5 px-3 rounded-md">
            Showing {filteredPolicies.length} of {facultativePolicies.length}
          </div>
        </div>

        <div className="overflow-x-auto h-[400px] overflow-y-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Customer Name</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Customer ID</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Policy No</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Treaty</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Coverage</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Plan Name</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th scope="col" className="px-6 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Sum Assured</th>
                <th scope="col" className="px-6 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Sum Ceded</th>
                <th scope="col" className="px-6 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredPolicies.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                    No pending facultative submissions found.
                  </td>
                </tr>
              ) : (
                filteredPolicies.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
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
                      {p.riskCoverage}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {(p.planName || p.planCode) ? `${p.planName || ''} ${p.planCode ? `(${p.planCode})` : ''}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        p.cessionStatus === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        p.cessionStatus === 'Declined' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {p.cessionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-medium text-slate-900">
                      {formatCurrency(parseFloat(p.sumAssured) || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-emerald-600">
                      {formatCurrency(p.sumCeded)}
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
                        {p.cessionStatus === 'Facultative Pending' && (
                          <>
                            <button
                              onClick={() => handleAccept(p)}
                              className="text-slate-400 hover:text-emerald-500 transition-colors p-1"
                              title="Accept Facultative"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDecline(p)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                              title="Decline Facultative"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
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
                View Facultative Submission
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
                  </dl>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4">Policy Details</h4>
                  <dl className="space-y-3 text-sm">
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Policy Number</dt><dd className="font-medium text-slate-900">{viewPolicy.policyNumber}</dd></div>
                    <div className="grid grid-cols-2"><dt className="text-slate-500">DOC</dt><dd className="font-medium text-slate-900">{viewPolicy.dateOfCommencement || 'N/A'}</dd></div>
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Treaty</dt><dd className="font-medium text-slate-900">{viewPolicy.treatyName}</dd></div>
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Coverage</dt><dd className="font-medium text-slate-900">{viewPolicy.riskCoverage}</dd></div>
                    <div className="grid grid-cols-2"><dt className="text-slate-500">Sum Assured</dt><dd className="font-medium text-slate-900">{formatCurrency(parseFloat(viewPolicy.sumAssured) || 0)}</dd></div>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              {viewPolicy.cessionStatus === 'Facultative Pending' && (
                <>
                  <button
                    onClick={() => { handleDecline(viewPolicy); setViewPolicy(null); }}
                    className="px-4 py-2 bg-white border border-red-200 rounded-md shadow-sm text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => { handleAccept(viewPolicy); setViewPolicy(null); }}
                    className="px-4 py-2 bg-emerald-600 rounded-md shadow-sm text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Accept & Create Cession
                  </button>
                </>
              )}
              <button
                onClick={() => setViewPolicy(null)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 ml-2"
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
