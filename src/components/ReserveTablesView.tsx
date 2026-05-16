import React, { useState, useMemo } from 'react';
import { Download, Upload, Trash2, Search } from 'lucide-react';
import { ReserveTableEntry } from '../types';

export default function ReserveTablesView({ 
  reserveTables, 
  setReserveTables 
}: { 
  reserveTables: ReserveTableEntry[]; 
  setReserveTables: (tables: ReserveTableEntry[]) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').map(row => row.trim()).filter(row => row);
        
        const imported: ReserveTableEntry[] = [];
        // Skip header if exists, or check structure
        let startIndex = 0;
        if (rows[0].toLowerCase().includes('age') || rows[0].toLowerCase().includes('premium')) {
          startIndex = 1;
        }

        const map = new Map<string, ReserveTableEntry>();
        reserveTables.forEach(t => map.set(`${t.premiumTableId}_${t.age}_${t.gender.toUpperCase()}`, t));

        for (let i = startIndex; i < rows.length; i++) {
          const cols = rows[i].split('\t'); // assuming tab separated, like pasted from excel
          if (cols.length < 4) continue; // age, id, gender, rate
          
          const age = parseInt(cols[0].trim());
          const premiumTableId = cols[1].trim();
          const gender = cols[2].trim().toUpperCase();
          const premiumRate = parseFloat(cols[3].trim());

          if (isNaN(age) || !premiumTableId || !['M', 'F', 'MF'].includes(gender) || isNaN(premiumRate)) {
            continue; // basic validation
          }

          const key = `${premiumTableId}_${age}_${gender}`;
          map.set(key, {
            id: crypto.randomUUID(),
            premiumTableId,
            age,
            gender,
            premiumRate
          });
        }

        setReserveTables(Array.from(map.values()));
        alert('Import successful!');
      } catch (err) {
        alert('Failed to parse file. Make sure it is a tab-separated text file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    let csv = 'Age\tPremium Table Id\tGender\tPremium Rate\n';
    reserveTables.forEach(entry => {
      csv += `${entry.age}\t${entry.premiumTableId}\t${entry.gender}\t${entry.premiumRate}\n`;
    });

    const blob = new Blob([csv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reserve_tables.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string) => {
    setReserveTables(reserveTables.filter(t => t.id !== id));
  };
  
  const filteredAndSortedEntries = useMemo(() => {
    let result = [...reserveTables];
    if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        result = result.filter(r => r.premiumTableId.toLowerCase().includes(lowerQ));
    }
    return result.sort((a, b) => {
        const idComp = a.premiumTableId.localeCompare(b.premiumTableId);
        if (idComp !== 0) return idComp;
        const ageComp = a.age - b.age;
        if (ageComp !== 0) return ageComp;
        return a.gender.localeCompare(b.gender);
    });
  }, [reserveTables, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reserve Tables</h2>
          <p className="text-slate-500">Manage premium rates by Table ID, Age, and Gender.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer text-sm font-medium transition-colors cursor-pointer text-sm font-medium">
            <Upload className="w-4 h-4" />
            Import (.txt / TSV)
            <input type="file" accept=".txt,.tsv,.csv" className="hidden" onChange={handleImport} />
          </label>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Premium Table ID..."
          className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredAndSortedEntries.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {reserveTables.length === 0 ? "No reserve tables added yet. Import from a TSV file." : "No tables match your search."}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                <tr className="text-left text-slate-600 border-b border-slate-200">
                  <th className="px-6 py-3 font-semibold whitespace-nowrap">Age</th>
                  <th className="px-6 py-3 font-semibold whitespace-nowrap">Premium Table Id</th>
                  <th className="px-6 py-3 font-semibold whitespace-nowrap">Gender</th>
                  <th className="px-6 py-3 font-semibold whitespace-nowrap">premium rate</th>
                  <th className="px-6 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredAndSortedEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-900">{entry.age}</td>
                    <td className="px-6 py-3 text-slate-700">{entry.premiumTableId}</td>
                    <td className="px-6 py-3 text-slate-700">{entry.gender}</td>
                    <td className="px-6 py-3 text-slate-700">{entry.premiumRate}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => handleDelete(entry.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete entry">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
