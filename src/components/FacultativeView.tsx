import React, { useState, useMemo } from 'react';
import { SavedPolicy } from '../types';
import { Search, Eye, X, CheckCircle, XCircle } from 'lucide-react';

export default function FacultativeView({
  savedPolicies,
  setSavedPolicies
}: {
  savedPolicies: SavedPolicy[];
  setSavedPolicies: React.Dispatch<React.SetStateAction<SavedPolicy[]>>;
}) {
  const [searchField, setSearchField] = useState<'policyNumber' | 'customerId'>('policyNumber');
  const [searchValue, setSearchValue] = useState('');
  const [viewPolicy, setViewPolicy] = useState<SavedPolicy | null>(null);

  const facultativePolicies = useMemo(() => savedPolicies.filter(p => p.cessionStatus === 'Facultative Pending' || p.cessionStatus === 'Accepted' || p.cessionStatus === 'Declined'), [savedPolicies]);

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

  const handleAccept = (policy: SavedPolicy) => {
    const maxCessionNo = Math.max(...savedPolicies.map(p => p.actualCessionNo || 0), 0);
    setSavedPolicies(prev => prev.map(p => 
      p.id === policy.id ? { 
        ...p, 
        cessionStatus: 'Accepted', 
        actualCessionNo: p.sumCeded > 0 ? maxCessionNo + 1 : null 
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

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-white border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Customer / Policy</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Treaty / Coverage</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider">Sum Assured</th>
                <th scope="col" className="px-6 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider">Sum Ceded</th>
                <th scope="col" className="px-6 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredPolicies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No pending facultative submissions found.
                  </td>
                </tr>
              ) : (
                filteredPolicies.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.cessionStatus === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                        p.cessionStatus === 'Declined' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
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
