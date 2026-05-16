import React, { useState, useMemo } from 'react';
import { Treaty, PaymentFrequency, Gender, MasterConfig, SavedPolicy, Plan, SubTreaty, ReserveTableEntry } from '../types';
import { calculateSumCeded, calculatePremiumAmount } from '../lib/calculator';
import { Calculator, AlertCircle, RefreshCw, Download, Upload, Save, Trash2, FileSpreadsheet } from 'lucide-react';

export default function CalculatorView({ 
  treaties, 
  masterConfig, 
  plans,
  savedPolicies, 
  setSavedPolicies,
  reserveTables = []
}: { 
  treaties: Treaty[];
  masterConfig: MasterConfig;
  plans: Plan[];
  savedPolicies: SavedPolicy[];
  setSavedPolicies: React.Dispatch<React.SetStateAction<SavedPolicy[]>>;
  reserveTables?: ReserveTableEntry[];
}) {
  // Policy Holder Details
  const [customerId, setCustomerId] = useState<string>('');
  const [policyNumber, setPolicyNumber] = useState<string>('');
  const [policyHolderName, setPolicyHolderName] = useState<string>('John Doe');
  const [dateOfCommencement, setDateOfCommencement] = useState<string>('');
  const [dob, setDob] = useState<string>('1990-01-01');
  const [gender, setGender] = useState<Gender>('Male');
  const [smoker, setSmoker] = useState<string>('Non-Smoker');
  const [medical, setMedical] = useState<string>('Non-Medical');
  const [impairment, setImpairment] = useState<string>('Single');
  const [sumAssured, setSumAssured] = useState<string>('5000000');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  
  const selectedPlan = useMemo(() => {
    if (selectedPlanId) {
      const p = plans.find(p => p.id === selectedPlanId);
      if (p) return p;
    }
    return plans.length > 0 ? plans[0] : null;
  }, [plans, selectedPlanId]);

  const riskCoverage = selectedPlan ? selectedPlan.riskCoverage : 'Death Benefit';

  // Financials
  const [grossReserves, setGrossReserves] = useState<string>('0');
  
  // Multipliers & Extras
  const [emrPercentage, setEmrPercentage] = useState<string>('0');
  const [otherExtraPremium, setOtherExtraPremium] = useState<string>('0');
  
  // Frequencies
  const [policyholderPremiumFrequency, setPolicyholderPremiumFrequency] = useState<string>('1');

  const calculatedAge = useMemo(() => {
    if (!dob) return 0;
    const parts = dob.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d1 = new Date(year, month, day);
      const d2 = new Date();
      if (!isNaN(d1.getTime())) {
        let computed = d2.getFullYear() - d1.getFullYear();
        const m = d2.getMonth() - d1.getMonth();
        if (m < 0 || (m === 0 && d2.getDate() < d1.getDate())) {
          computed--;
        }
        return computed > 0 ? computed : 0;
      }
    }
    return 0;
  }, [dob]);

  const activeTreatyInfo = useMemo(() => {
    const ageNum = calculatedAge;
    
    for (const t of treaties) {
       let isDateValid = true;
       if (dateOfCommencement && t.startDate && t.endDate) {
           const docDate = new Date(dateOfCommencement);
           const tStart = new Date(t.startDate);
           const tEnd = new Date(t.endDate);
           if (docDate < tStart || docDate > tEnd) {
             isDateValid = false;
           }
       }
       if (!isDateValid) continue;

       for (const sub of t.subTreaties) {
           let ruleMatch = true;
           if (sub.rules && sub.rules.length > 0) {
             for (const r of sub.rules) {
               const val = r.ruleValue.toLowerCase().trim();
               const item = r.ruleItem.toLowerCase();
               
                    if (item === 'sa') {
                      const numSA = parseFloat(sumAssured) || 0;
                      if (val.includes('*')) {
                        const parts = val.split('*');
                        const min = parseFloat(parts[0]);
                        const max = parseFloat(parts[1]);
                        if (!(numSA >= min && numSA <= max)) ruleMatch = false;
                      }
                      else if (val.startsWith('>=')) { if (!(numSA >= parseFloat(val.substring(2)))) ruleMatch = false; }
                      else if (val.startsWith('<=')) { if (!(numSA <= parseFloat(val.substring(2)))) ruleMatch = false; }
                      else if (val.startsWith('>')) { if (!(numSA > parseFloat(val.substring(1)))) ruleMatch = false; }
                      else if (val.startsWith('<')) { if (!(numSA < parseFloat(val.substring(1)))) ruleMatch = false; }
                      else if (numSA.toString() !== val && val !== '') ruleMatch = false;
                    } else if (item === 'emr') {
                      const numEMR = parseFloat(emrPercentage) || 0;
                      if (val.includes('*')) {
                        const parts = val.split('*');
                        const min = parseFloat(parts[0]);
                        const max = parseFloat(parts[1]);
                        if (!(numEMR >= min && numEMR <= max)) ruleMatch = false;
                      }
                      else if (val.startsWith('>=')) { if (!(numEMR >= parseFloat(val.substring(2)))) ruleMatch = false; }
                      else if (val.startsWith('<=')) { if (!(numEMR <= parseFloat(val.substring(2)))) ruleMatch = false; }
                      else if (val.startsWith('>')) { if (!(numEMR > parseFloat(val.substring(1)))) ruleMatch = false; }
                      else if (val.startsWith('<')) { if (!(numEMR < parseFloat(val.substring(1)))) ruleMatch = false; }
                      else if (numEMR.toString() !== val && val !== '') ruleMatch = false;
                    } else if (item === 'medical') {
                 if (medical.toLowerCase() !== val && val !== '') ruleMatch = false;
               } else if (item === 'smoker') {
                 if (smoker.toLowerCase() !== val && val !== '') ruleMatch = false;
               } else if (item === 'coverage') {
                 if (riskCoverage.toLowerCase() !== val && val !== '') ruleMatch = false;
               } else if (item === 'gender') {
                 if (gender.toLowerCase() !== val && val !== 'any' && val !== '') ruleMatch = false;
               } else if (item === 'imparement') {
                 if (impairment.toLowerCase() !== val && val !== '') ruleMatch = false;
               }
               if (!ruleMatch) break;
             }
           } else {
             // If no rules, fallback: we can't reliably match so maybe we just accept the first one, or maybe false
             // Let's accept it if there are no rules.
           }
           
           if (ruleMatch) {
             return { treaty: t, subTreaty: sub };
           }
       }
    }
    return null;
  }, [treaties, riskCoverage, calculatedAge, gender, dateOfCommencement, sumAssured, emrPercentage, medical, smoker, impairment]);

  // Derived Coverage Options from all treaties is removed since coverages are now rules. Wait, what about `availableCoverages` for the dropdown? We can just keep it hardcoded since it's driven from plan.
  const availableCoverages = useMemo(() => {
    return ['Death Benefit', 'Accidental Death', 'Critical Illness'];
  }, []);

  const computedFactors = useMemo(() => {
    if (!activeTreatyInfo) return null;
    
    const { subTreaty } = activeTreatyInfo;
    // Model Factor Calculation
    const modelFactor = subTreaty.reinsurerModelFactor || 1.0;

    // Premium Rate Calculation
    const ageNum = calculatedAge;
    
    const prEntry = subTreaty.premiumRates.find(pr => 
      ageNum >= pr.ageMin && ageNum <= pr.ageMax &&
      (pr.gender === 'Any' || pr.gender === gender)
    );
    
    let premiumRate = null;
    if (prEntry) {
      if (prEntry.premiumTableId && reserveTables.length > 0) {
        const genPrefix = gender === 'Male' ? 'M' : gender === 'Female' ? 'F' : 'MF';
        // Match exact age, and gender (first check exact M/F, then fallback to MF)
        let rtEntry = reserveTables.find(rt => rt.premiumTableId === prEntry.premiumTableId && rt.age === ageNum && rt.gender === genPrefix);
        if (!rtEntry) {
          rtEntry = reserveTables.find(rt => rt.premiumTableId === prEntry.premiumTableId && rt.age === ageNum && rt.gender === 'MF');
        }
        if (rtEntry) {
          premiumRate = rtEntry.premiumRate;
        } else {
          premiumRate = prEntry.rate; // fallback
        }
      } else {
        premiumRate = prEntry.rate;
      }
    }

    return { modelFactor, premiumRate };
  }, [activeTreatyInfo, calculatedAge, gender, reserveTables]);

  const cededDetails = useMemo(() => {
    if (!activeTreatyInfo) return null;
    return calculateSumCeded(
      parseFloat(sumAssured) || 0,
      parseFloat(grossReserves) || 0,
      activeTreatyInfo.subTreaty.retentionType,
      activeTreatyInfo.subTreaty.retentionValue
    );
  }, [activeTreatyInfo, sumAssured, grossReserves]);

  const premiumAmount = useMemo(() => {
    if (!activeTreatyInfo || !computedFactors || !cededDetails) return null;
    if (computedFactors.premiumRate === null) return null; // No rate match found
    if (cededDetails.sumCeded === 0) return 0; // Nothing to cede
    
    return calculatePremiumAmount(
      cededDetails.sumCeded,
      computedFactors.modelFactor,
      computedFactors.premiumRate,
      parseFloat(emrPercentage) || 0,
      activeTreatyInfo.subTreaty.selectionDiscount || 0,
      parseFloat(otherExtraPremium) || 0,
      parseFloat(policyholderPremiumFrequency) || 1
    );
  }, [cededDetails, computedFactors, emrPercentage, otherExtraPremium, policyholderPremiumFrequency, activeTreatyInfo]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handleSavePolicy = () => {
    if (!activeTreatyInfo) {
      alert("Please select a treaty before saving.");
      return;
    }

    const { treaty, subTreaty } = activeTreatyInfo;

    const isDuplicate = savedPolicies.some(p => 
      p.customerId.toLowerCase() === customerId.toLowerCase() &&
      p.policyNumber.toLowerCase() === policyNumber.toLowerCase() &&
      p.dateOfCommencement === dateOfCommencement &&
      p.riskCoverage.toLowerCase() === riskCoverage.toLowerCase() &&
      p.dob === dob
    );

    if (isDuplicate) {
      alert(`Cession already exists (Duplicate found for CustomerID: ${customerId}, PolicyNumber: ${policyNumber})`);
      return;
    }

    const c_sumAtRisk = cededDetails ? cededDetails.sumAtRisk : 0;
    const c_sumCeded = cededDetails ? cededDetails.sumCeded : 0;
    
    let pendingFacultative = false;
    if (subTreaty && subTreaty.facultativeLimit > 0) {
       pendingFacultative = parseFloat(sumAssured) > subTreaty.facultativeLimit;
    }

    const newDoc: SavedPolicy = {
      id: crypto.randomUUID(),
      cessionStatus: pendingFacultative ? 'Facultative Pending' : (c_sumCeded > 0 ? 'Ceded' : undefined),
      actualCessionNo: (c_sumCeded > 0 && !pendingFacultative) ? (Math.max(...savedPolicies.map(p => p.actualCessionNo || 0), 0) + 1) : null,
      customerId,
      policyNumber,
      policyHolderName,
      planCode: selectedPlan?.planCode || '',
      planName: selectedPlan?.planName || '',
      dateOfCommencement,
      dob,
      gender,
      age: calculatedAge,
      riskCoverage,
      sumAssured,
      smoker,
      medical,
      impairment,
      
      treatyName: treaty.name,
      grossReserves,

      emrPercentage,
      selectionDiscount: (subTreaty.selectionDiscount || 0).toString(),
      otherExtraPremium,
      reinsurerPaymentFrequency: (subTreaty.reinsurerPaymentFrequency || 1) as PaymentFrequency,
      policyholderPremiumFrequency: parseInt(policyholderPremiumFrequency) as PaymentFrequency,

      sumAtRisk: cededDetails ? cededDetails.sumAtRisk : 0,
      sumCeded: cededDetails ? cededDetails.sumCeded : 0,
      premiumRate: computedFactors?.premiumRate ?? null,
      modelFactor: computedFactors?.modelFactor ?? null,
      premiumAmount: premiumAmount !== null ? premiumAmount : null,
      
      reinsurerSplits: premiumAmount !== null ? (subTreaty.reinsurers || []).map(r => ({
        name: r.name,
        sharePercentage: r.sharePercentage,
        premiumAmount: premiumAmount * (r.sharePercentage / 100)
      })) : []
    };

    setSavedPolicies(prev => [...prev, newDoc]);
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

  const handleExportTemplate = () => {
    const headers = [
      'Customer ID',
      'Policy Number',
      'Policyholder Name',
      'Date of Commencement',
      'DOB',
      'Gender',
      'Smoker Status',
      'Medical Status',
      'Impairment Status',
      'Plan Code',
      'Sum Assured Base',
      'Gross Reserves',
      'EMR Percentage',
      'Other Extra Premium',
      'Policyholder Premium Frequency'
    ];
    
    const csvContent = headers.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `policy_import_template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportPolicies = (e: React.ChangeEvent<HTMLInputElement>) => {
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
     
      const newPolicies: SavedPolicy[] = [];
      let currentMaxCessionNo = Math.max(...savedPolicies.map(p => p.actualCessionNo || 0), 0);

      try {
        for (let i = 1; i < rows.length; i++) {
          const cols = getCols(rows[i]);
          if (cols.length >= 5) {
            const getCol = (name: string) => {
              const idx = headers.indexOf(name.toLowerCase());
              return idx !== -1 ? cols[idx]?.trim() || '' : '';
            };

            const parseAndFormatDate = (dateStr: string) => {
              if (!dateStr) return '';
              let yearStr = '';
              let monthStr = '';
              let dayStr = '';

              const parts = dateStr.split(/[-/]/);
              if (parts.length === 3) {
                if (parts[2].length === 4) {
                  // DD-MM-YYYY
                  dayStr = parts[0];
                  monthStr = parts[1];
                  yearStr = parts[2];
                } else if (parts[0].length === 4) {
                  // YYYY-MM-DD
                  yearStr = parts[0];
                  monthStr = parts[1];
                  dayStr = parts[2];
                }
              }

              if (yearStr && monthStr && dayStr) {
                const year = parseInt(yearStr, 10);
                const month = parseInt(monthStr, 10) - 1;
                const day = parseInt(dayStr, 10);
                
                const d1 = new Date(year, month, day);
                if (!isNaN(d1.getTime())) {
                  const y = d1.getFullYear();
                  const m = String(d1.getMonth() + 1).padStart(2, '0');
                  const d = String(d1.getDate()).padStart(2, '0');
                  return `${y}-${m}-${d}`;
                }
              }

              // Fallback to JS parsing
              const d1 = new Date(dateStr);
              if (!isNaN(d1.getTime())) {
                const y = d1.getFullYear();
                const m = String(d1.getMonth() + 1).padStart(2, '0');
                const d = String(d1.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
              }
              
              return dateStr;
            };

            const importedCustomer = getCol('customer id') || getCol('customerid');
            const importedPolicy = getCol('policy number') || getCol('policynumber');
            const importedDocRaw = getCol('date of commencement') || getCol('doc');
            
            const importedPlanCode = getCol('plan code') || getCol('plancode') || getCol('plan name') || getCol('plan');
            let importedRiskCov = getCol('risk coverage') || 'Death Benefit';
            let resolvedPlanCode = importedPlanCode;
            let resolvedPlanName = '';
            
            if (importedPlanCode) {
              const matchedPlan = plans.find(p => p.planCode.toLowerCase() === importedPlanCode.toLowerCase() || p.planName.toLowerCase() === importedPlanCode.toLowerCase());
              if (matchedPlan) {
                 importedRiskCov = matchedPlan.riskCoverage;
                 resolvedPlanCode = matchedPlan.planCode;
                 resolvedPlanName = matchedPlan.planName;
              }
            }

            const importedDobRaw = getCol('dob');

            const importedDoc = parseAndFormatDate(importedDocRaw);
            const importedDob = parseAndFormatDate(importedDobRaw);

            const isDuplicate = savedPolicies.some(p => 
              p.customerId.toLowerCase() === importedCustomer.toLowerCase() &&
              p.policyNumber.toLowerCase() === importedPolicy.toLowerCase() &&
              p.dateOfCommencement === importedDoc &&
              p.riskCoverage.toLowerCase() === importedRiskCov.toLowerCase() &&
              p.dob === importedDob
            ) || newPolicies.some(p => 
              p.customerId.toLowerCase() === importedCustomer.toLowerCase() &&
              p.policyNumber.toLowerCase() === importedPolicy.toLowerCase() &&
              p.dateOfCommencement === importedDoc &&
              p.riskCoverage.toLowerCase() === importedRiskCov.toLowerCase() &&
              p.dob === importedDob
            );

            if (isDuplicate) {
              throw new Error(`Cession already exists (Duplicate found for CustomerID: ${importedCustomer}, PolicyNumber: ${importedPolicy})`);
            }

            // Allow duplicates for same policy but with new actualcessionno.
            const mapVal = (sourceVal: string, mappings: {sourceValue: string, targetValue: string}[], defaultVal: string, fieldName: string) => {
              if (!sourceVal) return defaultVal;
              const match = mappings.find(m => m.sourceValue.toLowerCase() === sourceVal.toLowerCase());
              if (!match) {
                throw new Error(`Invalid input data for field: ${fieldName}. Value '${sourceVal}' not found in master configuration.`);
              }
              return match.targetValue;
            };

            const importedName = getCol('policy holder name') || getCol('policyholder name') || getCol('name') || getCol('policy holder') || 'John Doe';
            const importedSumStr = getCol('sum assured base') || getCol('sum assured') || '0';
            const importedSum = importedSumStr.replace(/,/g, '');
            const importedGrossResStr = getCol('gross reserves') || '0';
            const importedGrossRes = importedGrossResStr.replace(/,/g, '');
            
            const importedPolFreqStr = mapVal(getCol('policyholder payment freq') || getCol('policyholder premium frequency'), masterConfig.paymentModeMappings, 'Annual', 'Policyholder Payment Freq');
            
            const importedGender = mapVal(getCol('gender'), masterConfig.genderMappings, 'Male', 'Gender');
            const importedSmoker = mapVal(getCol('smoker status') || getCol('smoker'), masterConfig.smokerMappings, 'Non-Smoker', 'Smoker Status');
            const importedMedical = mapVal(getCol('medical status') || getCol('medical'), masterConfig.medicalMappings, 'Non-Medical', 'Medical Status');
            const importedImpairment = mapVal(getCol('impairment'), masterConfig.impairmentMappings, 'Single', 'Impairment');
            
            const importedEmrStr = getCol('emr %') || getCol('emr percentage') || '0';
            const importedEmr = importedEmrStr.replace(/,/g, '');
            const importedOtherExtraStr = getCol('other extra premium') || '0';
            const importedOtherExtra = importedOtherExtraStr.replace(/,/g, '');

            let calcAgeNum = 0;
            if (importedDob) {
              const parts = importedDob.split('-');
              if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                const d1 = new Date(year, month, day);
                const d2 = new Date();
                
                if (!isNaN(d1.getTime())) {
                  calcAgeNum = d2.getFullYear() - d1.getFullYear();
                  const m = d2.getMonth() - d1.getMonth();
                  if (m < 0 || (m === 0 && d2.getDate() < d1.getDate())) {
                    calcAgeNum--;
                  }
                }
              }
            }
            if (calcAgeNum < 0) calcAgeNum = 0;

            const mapFreq = (mode: string) => {
              if (mode === 'Annual' || mode === 'Annually' || mode === '1') return 1 as PaymentFrequency;
              if (mode === 'Semi-Annual' || mode === 'Semi-Annually' || mode === '2') return 2 as PaymentFrequency;
              if (mode === 'Quarterly' || mode === '4') return 4 as PaymentFrequency;
              if (mode === 'Monthly' || mode === '12') return 12 as PaymentFrequency;
              return 1 as PaymentFrequency;
            };

            let pTreaty: Treaty | null = null;
            let pSubTreaty: SubTreaty | null = null;

            for (const t of treaties) {
               let isDateValid = true;
               if (importedDoc && t.startDate && t.endDate) {
                   const docDate = new Date(importedDoc);
                   const tStart = new Date(t.startDate);
                   const tEnd = new Date(t.endDate);
                   if (docDate < tStart || docDate > tEnd) {
                     isDateValid = false;
                   }
               }
               if (!isDateValid) continue;

               for (const sub of t.subTreaties) {
                 let ruleMatch = true;
                 if (sub.rules && sub.rules.length > 0) {
                   for (const r of sub.rules) {
                     const val = r.ruleValue.toLowerCase().trim();
                     const item = r.ruleItem.toLowerCase();
                     
                    if (item === 'sa') {
                      const numSA = parseFloat(importedSum) || 0;
                      if (val.includes('*')) {
                        const parts = val.split('*');
                        const min = parseFloat(parts[0]);
                        const max = parseFloat(parts[1]);
                        if (!(numSA >= min && numSA <= max)) ruleMatch = false;
                      }
                      else if (val.startsWith('>=')) { if (!(numSA >= parseFloat(val.substring(2)))) ruleMatch = false; }
                      else if (val.startsWith('<=')) { if (!(numSA <= parseFloat(val.substring(2)))) ruleMatch = false; }
                      else if (val.startsWith('>')) { if (!(numSA > parseFloat(val.substring(1)))) ruleMatch = false; }
                      else if (val.startsWith('<')) { if (!(numSA < parseFloat(val.substring(1)))) ruleMatch = false; }
                      else if (numSA.toString() !== val && val !== '') ruleMatch = false;
                    } else if (item === 'emr') {
                      const numEMR = parseFloat(importedEmr) || 0;
                      if (val.includes('*')) {
                        const parts = val.split('*');
                        const min = parseFloat(parts[0]);
                        const max = parseFloat(parts[1]);
                        if (!(numEMR >= min && numEMR <= max)) ruleMatch = false;
                      }
                      else if (val.startsWith('>=')) { if (!(numEMR >= parseFloat(val.substring(2)))) ruleMatch = false; }
                      else if (val.startsWith('<=')) { if (!(numEMR <= parseFloat(val.substring(2)))) ruleMatch = false; }
                      else if (val.startsWith('>')) { if (!(numEMR > parseFloat(val.substring(1)))) ruleMatch = false; }
                      else if (val.startsWith('<')) { if (!(numEMR < parseFloat(val.substring(1)))) ruleMatch = false; }
                      else if (numEMR.toString() !== val && val !== '') ruleMatch = false;
                    } else if (item === 'medical') {
                       if (importedMedical.toLowerCase() !== val && val !== '') ruleMatch = false;
                     } else if (item === 'smoker') {
                       if (importedSmoker.toLowerCase() !== val && val !== '') ruleMatch = false;
                     } else if (item === 'coverage') {
                       if (importedRiskCov.toLowerCase() !== val && val !== '') ruleMatch = false;
                     } else if (item === 'gender') {
                       if (importedGender.toLowerCase() !== val && val !== 'any' && val !== '') ruleMatch = false;
                     } else if (item === 'imparement') {
                       if (importedImpairment.toLowerCase() !== val && val !== '') ruleMatch = false;
                     }
                     if (!ruleMatch) break;
                   }
                 }
                 
                 if (ruleMatch) {
                     pTreaty = t;
                     pSubTreaty = sub;
                     break;
                 }
               }
               if (pSubTreaty) break;
            }
            
            let c_sumAtRisk = 0;
            let c_sumCeded = 0;
            let c_prRate: number | null = null;
            let c_mfFactor: number | null = null;
            let c_premium: number | null = null;

            if (pSubTreaty) {
              const cd = calculateSumCeded(
                parseFloat(importedSum) || 0,
                parseFloat(importedGrossRes) || 0,
                pSubTreaty.retentionType,
                pSubTreaty.retentionValue
              );
              c_sumAtRisk = cd.sumAtRisk;
              c_sumCeded = cd.sumCeded;

              c_mfFactor = pSubTreaty.reinsurerModelFactor || 1.0;

              const prEntry = pSubTreaty.premiumRates.find(pr => 
                calcAgeNum >= pr.ageMin && calcAgeNum <= pr.ageMax &&
                (pr.gender === 'Any' || pr.gender.trim().toLowerCase() === importedGender.trim().toLowerCase())
              );
              
              if (prEntry) {
                if (prEntry.premiumTableId && reserveTables.length > 0) {
                  const ipGenderExact = importedGender.trim().toLowerCase();
                  const genPrefix = ipGenderExact === 'male' ? 'M' : ipGenderExact === 'female' ? 'F' : 'MF';
                  let rtEntry = reserveTables.find(rt => rt.premiumTableId === prEntry.premiumTableId && rt.age === calcAgeNum && rt.gender === genPrefix);
                  if (!rtEntry) rtEntry = reserveTables.find(rt => rt.premiumTableId === prEntry.premiumTableId && rt.age === calcAgeNum && rt.gender === 'MF');
                  c_prRate = rtEntry ? rtEntry.premiumRate : prEntry.rate;
                } else {
                  c_prRate = prEntry.rate;
                }
              } else {
                c_prRate = null;
              }

              if (c_prRate !== null && c_sumCeded > 0) {
                c_premium = calculatePremiumAmount(
                  c_sumCeded,
                  c_mfFactor,
                  c_prRate,
                  parseFloat(importedEmr) || 0,
                  pSubTreaty.selectionDiscount || 0,
                  parseFloat(importedOtherExtra) || 0,
                  mapFreq(importedPolFreqStr)
                );
              } else if (c_sumCeded === 0) {
                c_premium = 0;
              }
            }

            let pendingFacultative = false;
            if (pSubTreaty && pSubTreaty.facultativeLimit > 0) {
              pendingFacultative = parseFloat(importedSum) > pSubTreaty.facultativeLimit;
            }

            let actualCessionNum: number | null = null;
            if (c_sumCeded > 0 && !pendingFacultative) {
              currentMaxCessionNo++;
              actualCessionNum = currentMaxCessionNo;
            }

            newPolicies.push({
              id: crypto.randomUUID(),
              cessionStatus: pendingFacultative ? 'Facultative Pending' : (c_sumCeded > 0 ? 'Ceded' : undefined),
              actualCessionNo: actualCessionNum,
              customerId: importedCustomer,
              policyNumber: importedPolicy,
              policyHolderName: importedName,
              planCode: resolvedPlanCode,
              planName: resolvedPlanName,
              dateOfCommencement: importedDoc,
              dob: importedDob,
              gender: importedGender,
              age: calcAgeNum,
              riskCoverage: importedRiskCov,
              sumAssured: importedSum,
              smoker: importedSmoker,
              medical: importedMedical,
              impairment: importedImpairment,
              selectedTreatyId: pTreaty ? pTreaty.id : '',
              treatyName: pTreaty ? pTreaty.name : 'Unknown Treaty',
              grossReserves: importedGrossRes,
              emrPercentage: importedEmr,
              selectionDiscount: pSubTreaty ? (pSubTreaty.selectionDiscount || 0).toString() : '0',
              otherExtraPremium: importedOtherExtra,
              reinsurerPaymentFrequency: pSubTreaty ? (pSubTreaty.reinsurerPaymentFrequency || 1) as PaymentFrequency : 1,
              policyholderPremiumFrequency: mapFreq(importedPolFreqStr),
              sumAtRisk: c_sumAtRisk,
              sumCeded: c_sumCeded,
              premiumRate: c_prRate,
              modelFactor: c_mfFactor,
              premiumAmount: c_premium,
              
              reinsurerSplits: (c_premium !== null && pSubTreaty) ? (pSubTreaty.reinsurers || []).map(r => ({
                name: r.name,
                sharePercentage: r.sharePercentage,
                premiumAmount: c_premium! * (r.sharePercentage / 100)
              })) : []
            });
          }
        }
        setSavedPolicies(prev => [...prev, ...newPolicies]);
      } catch (err: any) {
        alert(err.message || 'Invalid input data');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Premium Calculator</h2>
          <p className="text-sm text-slate-500 mt-1">Compute Sum At Risk, Sum Ceded, and final payable Reinsurance Premium.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportTemplate}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Template
          </button>
          <label className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm cursor-pointer">
            <Upload className="w-4 h-4" />
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImportPolicies} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ... existing code ... */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">1. Policy Holder Details</h3>
            </div>
            
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer ID</label>
                <input
                  type="text"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Policy Number</label>
                <input
                  type="text"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={policyHolderName}
                  onChange={(e) => setPolicyHolderName(e.target.value)}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Commencement</label>
                <input
                  type="date"
                  value={dateOfCommencement}
                  onChange={(e) => setDateOfCommencement(e.target.value)}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth (DOB)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Smoker Status</label>
                <select
                  value={smoker}
                  onChange={(e) => setSmoker(e.target.value)}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                >
                  <option value="Non-Smoker">Non-Smoker</option>
                  <option value="Smoker">Smoker</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Medical Status</label>
                <select
                  value={medical}
                  onChange={(e) => setMedical(e.target.value)}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                >
                  <option value="Non-Medical">Non-Medical</option>
                  <option value="Medical">Medical</option>
                  <option value="Tele-Medical">Tele-Medical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Impairment</label>
                <select
                  value={impairment}
                  onChange={(e) => setImpairment(e.target.value)}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                >
                  <option value="Single">Single</option>
                  <option value="Joint">Joint</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                >
                  <option value="">-- Select a Plan --</option>
                  {plans.map(p => (
                     <option key={p.id} value={p.id}>{p.planName} ({p.planCode}) - {p.riskCoverage}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sum Assured (₹)</label>
                <input
                  type="number"
                  value={sumAssured}
                  onChange={(e) => setSumAssured(e.target.value)}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Modifiers and Frequencies */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">2. Frequencies & Modifiers</h3>
            </div>
            
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Policyholder Frequency</label>
                <select
                  value={policyholderPremiumFrequency}
                  onChange={(e) => setPolicyholderPremiumFrequency(e.target.value)}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border bg-white"
                >
                  <option value="1">Annually</option>
                  <option value="2">Semi-Annually</option>
                  <option value="4">Quarterly</option>
                  <option value="12">Monthly</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">For dividing flat extra premiums</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">EMR (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={emrPercentage}
                  onChange={(e) => setEmrPercentage(e.target.value)}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gross Reserves (₹)</label>
                <input
                  type="number"
                  value={grossReserves}
                  onChange={(e) => setGrossReserves(e.target.value)}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Other Extra Premium (₹)</label>
                <input
                  type="number"
                  value={otherExtraPremium}
                  onChange={(e) => setOtherExtraPremium(e.target.value)}
                  className="block w-full rounded-md border-slate-300 py-1.5 px-3 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Sidebar */}
        <div className="xl:col-span-1">
          <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 text-white sticky top-6 overflow-hidden flex flex-col">
            <div className="p-6 bg-blue-900/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Calculator className="w-24 h-24" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight relative z-10">Premium Assessment</h3>
              <p className="text-slate-300 text-sm mt-1 relative z-10">Real-time treaty resolution</p>
            </div>
            
            <div className="p-6 flex-1 flex flex-col gap-6">
              {!activeTreatyInfo ? (
                <div className="flex flex-col items-center justify-center text-center text-slate-400 p-8 h-full">
                  <RefreshCw className="w-8 h-8 mb-4 opacity-50" />
                  <p className="text-sm">Please identify an applicable treaty to begin engine calculations.</p>
                </div>
              ) : (
                <>
                  {/* Step A: Risk & Retention */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                      <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-blue-400">A</span>
                      <h4 className="text-sm font-medium text-slate-300">Liability Distribution</h4>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Sum Assured</span>
                        <span className="font-mono text-slate-300">{formatCurrency(parseFloat(sumAssured) || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Gross Reserves</span>
                        <span className="font-mono text-slate-300">-{formatCurrency(parseFloat(grossReserves) || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-1 mt-1 border-t border-slate-800/50">
                        <span className="text-slate-200 font-medium">Sum At Risk</span>
                        <span className="font-mono text-blue-300 font-medium">{cededDetails ? formatCurrency(cededDetails.sumAtRisk) : '-'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">Treaty {activeTreatyInfo.subTreaty.name} Retention</span>
                          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 uppercase tracking-wider">{activeTreatyInfo.subTreaty.retentionType}</span>
                        </div>
                        <span className="font-mono text-amber-300/80">-{cededDetails ? formatCurrency(cededDetails.retentionAmount) : '-'}</span>
                      </div>
                      <div className="flex justify-between text-base pt-2 mt-2 border-t border-slate-700 font-semibold">
                        <span className="text-white">Sum Ceded</span>
                        <span className="font-mono text-emerald-400">{cededDetails ? formatCurrency(cededDetails.sumCeded) : '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Step B: Rate Evaluation */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                      <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-blue-400">B</span>
                      <h4 className="text-sm font-medium text-slate-300">Factor Multipliers</h4>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Resolved Premium Rate</span>
                        {computedFactors?.premiumRate !== null ? (
                          <span className="font-mono text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded">{computedFactors?.premiumRate.toFixed(4)} <span className="text-[10px] text-slate-500">per 1K</span></span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400 text-xs bg-red-900/20 px-2 py-0.5 rounded"><AlertCircle className="w-3 h-3"/> No Match</span>
                        )}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Resolved Model Factor</span>
                        <span className="font-mono text-slate-300">{computedFactors?.modelFactor.toFixed(4)}x</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">EMR / Selection Adj.</span>
                        <span className="font-mono text-slate-300">
                          {(1 + (parseFloat(emrPercentage)/100 || 0) - ((activeTreatyInfo?.subTreaty?.selectionDiscount || 0) / 100)).toFixed(4)}x
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Final Output */}
                  <div className="mt-auto pt-6 border-t border-slate-700 space-y-4">
                     <div>
                       <span className="block text-sm text-slate-400 mb-1 uppercase tracking-wider font-semibold">Calculated Premium</span>
                       <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 relative shadow-inner">
                          <span className="block text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight font-mono">
                            {premiumAmount !== null ? formatCurrency(premiumAmount) : '₹0.00'}
                          </span>
                          <span className="block text-xs text-slate-500 mt-2">
                            Payment required: {
                              policyholderPremiumFrequency === '1' ? 'Annually' :
                              policyholderPremiumFrequency === '2' ? 'Semi-Annually' :
                              policyholderPremiumFrequency === '4' ? 'Quarterly' : 'Monthly'
                            }
                          </span>
                       </div>
                     </div>
                     <button 
                       onClick={handleSavePolicy} 
                       className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-md transition-colors text-sm font-semibold shadow-sm"
                      >
                       <Save className="w-4 h-4" /> Save Policy Output
                     </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
