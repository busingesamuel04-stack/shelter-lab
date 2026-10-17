import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Activity,
  BarChart2,
  Sliders,
  Table,
  Minus,
  Plus,
  Download,
  BookmarkPlus,
  Trash2,
  Target,
  Check,
  Printer,
  ChevronRight,
  Layers,
  Eye,
  Compass,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  RefreshCw,
  Zap,
  Percent,
  AlertCircle,
  Building,
  MapPin,
  HelpCircle
} from 'lucide-react';

// --- PRECISION FORMATTERS ---
const formatCurrency = (val, compact = false) => {
  if (val === undefined || val === null || isNaN(val)) return '$0';
  const absVal = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (compact) {
    if (absVal >= 1_000_000) return `${sign}$${(absVal / 1_000_000).toFixed(2)}M`;
    if (absVal >= 1_000) return `${sign}$${(absVal / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
};

// --- STATE TAX MATRIX & STATUTORY PROFILES ---
export const STATE_TAX_PROFILES = {
  CA: {
    code: 'CA',
    name: 'California',
    stateIncomeTaxRate: 9.3,
    defaultPropertyTax: 1.15,
    hasStateTax: true,
    tag: 'High Income Tax / Prop 13',
    description: '9.3% marginal state income tax. Property tax protected by Prop 13 assessment caps (~1.15%).'
  },
  NY: {
    code: 'NY',
    name: 'New York',
    stateIncomeTaxRate: 6.85,
    defaultPropertyTax: 1.65,
    hasStateTax: true,
    tag: 'High SALT Burden',
    description: '6.85% NYS tax rate. High suburban property taxes and high municipal transfer costs.'
  },
  TX: {
    code: 'TX',
    name: 'Texas',
    stateIncomeTaxRate: 0.0,
    defaultPropertyTax: 2.15,
    hasStateTax: false,
    tag: '0% State Tax / High Property Tax',
    description: 'Zero personal income tax offset by substantial local property taxes (2.0% - 2.5%).'
  },
  FL: {
    code: 'FL',
    name: 'Florida',
    stateIncomeTaxRate: 0.0,
    defaultPropertyTax: 1.10,
    hasStateTax: false,
    tag: '0% State Tax / Moderate Tax',
    description: 'Zero personal income tax with moderate property tax, but elevated property insurance drag.'
  },
  WA: {
    code: 'WA',
    name: 'Washington',
    stateIncomeTaxRate: 0.0,
    defaultPropertyTax: 1.05,
    hasStateTax: false,
    tag: '0% Income Tax / Tech Hub',
    description: 'Zero personal income tax and steady King County/Puget Sound property tax baseline.'
  },
  IL: {
    code: 'IL',
    name: 'Illinois',
    stateIncomeTaxRate: 4.95,
    defaultPropertyTax: 2.25,
    hasStateTax: true,
    tag: 'Flat 4.95% / High Property Tax',
    description: 'Flat 4.95% state income tax combined with heavy county property assessments.'
  },
  MA: {
    code: 'MA',
    name: 'Massachusetts',
    stateIncomeTaxRate: 5.0,
    defaultPropertyTax: 1.20,
    hasStateTax: true,
    tag: 'Flat 5.0% State Tax',
    description: 'Flat 5.0% income tax rate with Proposition 2 1/2 annual property tax growth limit.'
  },
  CUSTOM: {
    code: 'CUSTOM',
    name: 'Custom State',
    stateIncomeTaxRate: 5.0,
    defaultPropertyTax: 1.25,
    hasStateTax: true,
    tag: 'User-Defined Jurisdictional Profile',
    description: 'Manually specify state income tax, property tax rates, and filing deduction thresholds.'
  }
};

// --- CUSTOM DEBT STRUCTURES ---
export const DEBT_STRUCTURES = {
  '30Y_FIXED': {
    code: '30Y-FX',
    label: '30-Year Fixed',
    termMonths: 360,
    rateOffset: 0.0,
    description: 'Standard 30-year fixed rate mortgage. Maximum payment stability.'
  },
  '15Y_FIXED': {
    code: '15Y-FX',
    label: '15-Year Fixed',
    termMonths: 180,
    rateOffset: -0.65,
    description: 'Accelerated 15-year term with rate discount (-0.65%). Amortizes debt 2.4x faster.'
  },
  '7_1_ARM': {
    code: '7/1-ARM',
    label: '7/1 Hybrid ARM',
    termMonths: 360,
    rateOffset: -0.50,
    fixedMonths: 84,
    description: 'Fixed for first 7 years with -0.50% rate discount, adjusting annually thereafter.'
  },
  '5_1_ARM': {
    code: '5/1-ARM',
    label: '5/1 Hybrid ARM',
    termMonths: 360,
    rateOffset: -0.75,
    fixedMonths: 60,
    description: 'Fixed for first 5 years with -0.75% rate discount, adjusting annually thereafter.'
  },
  'IO_10Y': {
    code: '10Y-IO',
    label: '10-Year Interest Only',
    termMonths: 360,
    rateOffset: 0.15,
    ioMonths: 120,
    description: 'No principal paid in years 1-10; re-amortizes over remaining 20 years.'
  }
};

// --- ARCHITECTURAL MARKET ARCHETYPES ---
const PRESETS = {
  baseline: {
    code: 'ARC-01',
    name: 'Suburban Equilibrium',
    tag: 'Historical Mean',
    params: {
      homePrice: 450000,
      downPaymentPct: 20,
      mortgageRate: 6.5,
      debtStructure: '30Y_FIXED',
      extraPrincipalMonthly: 0,
      armRateAdjustment: 1.25,
      hoaMonthly: 250,
      propertyTaxRate: 1.2,
      homeAppreciationRate: 4.0,
      maintenanceRate: 1.0,
      marginalTaxRate: 24,
      taxState: 'CUSTOM',
      stateIncomeTaxRate: 5.0,
      filingStatus: 'mfj', // 'single' | 'mfj'
      applySaltCap: true,
      monthlyRent: 2400,
      rentGrowthRate: 3.5,
      investmentReturnRate: 8.0,
      timelineYears: 10,
      buyClosingPct: 3.0,
      sellClosingPct: 6.0,
    },
    shocks: {
      refiYear3: false,
      hoaShockYr4: false,
      taxShieldActive: true,
    }
  },
  condoTrap: {
    code: 'ARC-02',
    name: 'Urban High-HOA Condo',
    tag: 'Heavy Carrying Drag',
    params: {
      homePrice: 380000,
      downPaymentPct: 20,
      mortgageRate: 6.5,
      debtStructure: '30Y_FIXED',
      extraPrincipalMonthly: 0,
      armRateAdjustment: 1.25,
      hoaMonthly: 750,
      propertyTaxRate: 1.25,
      homeAppreciationRate: 2.5,
      maintenanceRate: 0.6,
      marginalTaxRate: 24,
      taxState: 'IL',
      stateIncomeTaxRate: 4.95,
      filingStatus: 'single',
      applySaltCap: true,
      monthlyRent: 2250,
      rentGrowthRate: 3.2,
      investmentReturnRate: 8.5,
      timelineYears: 10,
      buyClosingPct: 3.0,
      sellClosingPct: 6.0,
    },
    shocks: {
      refiYear3: false,
      hoaShockYr4: true,
      taxShieldActive: true,
    }
  },
  bullRenter: {
    code: 'ARC-03',
    name: 'S&P 500 Alpha Renter',
    tag: 'Liquid Equity Bias',
    params: {
      homePrice: 520000,
      downPaymentPct: 20,
      mortgageRate: 6.8,
      debtStructure: '30Y_FIXED',
      extraPrincipalMonthly: 0,
      armRateAdjustment: 1.25,
      hoaMonthly: 300,
      propertyTaxRate: 1.3,
      homeAppreciationRate: 3.2,
      maintenanceRate: 1.0,
      marginalTaxRate: 24,
      taxState: 'CA',
      stateIncomeTaxRate: 9.3,
      filingStatus: 'single',
      applySaltCap: true,
      monthlyRent: 2350,
      rentGrowthRate: 2.8,
      investmentReturnRate: 10.5,
      timelineYears: 10,
      buyClosingPct: 3.0,
      sellClosingPct: 6.0,
    },
    shocks: {
      refiYear3: false,
      hoaShockYr4: false,
      taxShieldActive: true,
    }
  },
  boomtown: {
    code: 'ARC-04',
    name: 'High-Growth Sunbelt',
    tag: 'Leveraged Appreciation',
    params: {
      homePrice: 460000,
      downPaymentPct: 20,
      mortgageRate: 5.75,
      debtStructure: '7_1_ARM',
      extraPrincipalMonthly: 200,
      armRateAdjustment: 1.0,
      hoaMonthly: 0,
      propertyTaxRate: 2.1,
      homeAppreciationRate: 6.5,
      maintenanceRate: 1.0,
      marginalTaxRate: 24,
      taxState: 'TX',
      stateIncomeTaxRate: 0.0,
      filingStatus: 'mfj',
      applySaltCap: true,
      monthlyRent: 2500,
      rentGrowthRate: 4.5,
      investmentReturnRate: 7.5,
      timelineYears: 10,
      buyClosingPct: 3.0,
      sellClosingPct: 6.0,
    },
    shocks: {
      refiYear3: false,
      hoaShockYr4: false,
      taxShieldActive: true,
    }
  }
};

// --- STANDALONE DETERMINISTIC FINANCIAL ENGINE ---
export function runFinancialEngine(params, shocks, inspectedYearInput = 10) {
  const {
    homePrice,
    downPaymentPct,
    mortgageRate,
    debtStructure = '30Y_FIXED',
    extraPrincipalMonthly = 0,
    armRateAdjustment = 1.25,
    hoaMonthly,
    propertyTaxRate,
    homeAppreciationRate,
    maintenanceRate,
    marginalTaxRate,
    stateIncomeTaxRate = 0,
    filingStatus = 'mfj',
    applySaltCap = true,
    monthlyRent,
    rentGrowthRate,
    investmentReturnRate,
    timelineYears,
    buyClosingPct,
    sellClosingPct,
  } = params;

  const totalMonths = timelineYears * 12;
  const downPayment = homePrice * (downPaymentPct / 100);
  const buyClosingCosts = homePrice * (buyClosingPct / 100);
  const initialLoan = Math.max(0, homePrice - downPayment);

  // Private Mortgage Insurance (PMI) applies when initial LTV > 80% (~0.65% annual rate on loan)
  const pmiAnnualRate = 0.0065;

  const calcMonthlyPI = (principal, annualRate, remainingMonths) => {
    if (principal <= 0 || remainingMonths <= 0) return 0;
    const r = annualRate / 100 / 12;
    if (r === 0) return principal / remainingMonths;
    return (principal * (r * Math.pow(1 + r, remainingMonths))) / (Math.pow(1 + r, remainingMonths) - 1);
  };

  const debtConfig = DEBT_STRUCTURES[debtStructure] || DEBT_STRUCTURES['30Y_FIXED'];
  let currentMortgageRate = Math.max(1.0, mortgageRate + debtConfig.rateOffset);
  let loanTotalTermMonths = debtConfig.termMonths;
  let remainingTermMonths = loanTotalTermMonths;

  let currentLoanBalance = initialLoan;
  let monthlyPI = 0;
  if (debtStructure === 'IO_10Y') {
    monthlyPI = currentLoanBalance * (currentMortgageRate / 100 / 12);
  } else {
    monthlyPI = calcMonthlyPI(currentLoanBalance, currentMortgageRate, remainingTermMonths);
  }

  let currentHomeValue = homePrice;
  let currentRent = monthlyRent;
  let currentHOA = hoaMonthly;

  let renterPortfolio = downPayment + buyClosingCosts;
  let buyerSideFund = 0;

  const monthlyHomeGrowth = Math.pow(1 + homeAppreciationRate / 100, 1 / 12) - 1;
  const monthlyStockReturn = Math.pow(1 + investmentReturnRate / 100, 1 / 12) - 1;

  let cumInterest = 0;
  let cumPrincipal = 0;
  let cumPropertyTax = 0;
  let cumHOA = 0;
  let cumMaintenance = 0;
  let cumPMI = 0;
  let cumTaxSavings = 0;
  let cumRentPaid = 0;
  let cumRenterContributions = downPayment + buyClosingCosts;
  let cumRefiAndShockCosts = 0;
  let loanPayoffMonth = null;

  const monthlyData = [];
  const yearlyData = [];
  let crossoverMonth = null;

  // Household income estimate based on 28% DTI threshold for accurate SALT modeling
  const estimatedIncome = Math.max(75000, ((monthlyPI || 1500) * 12) / 0.28);
  const standardDeductionAnnual = filingStatus === 'mfj' ? 29200 : 14600;
  const standardDeductionMonthly = standardDeductionAnnual / 12;
  const saltCapMonthly = (applySaltCap ? 10000 : 1000000) / 12;

  for (let m = 1; m <= totalMonths; m++) {
    const currentYear = Math.ceil(m / 12);

    if (m > 1 && (m - 1) % 12 === 0) {
      currentRent *= (1 + rentGrowthRate / 100);
      currentHOA *= 1.025; // 2.5% inflation on HOA
    }

    // Refinance shock in Year 3
    let refiFeeThisMonth = 0;
    if (shocks.refiYear3 && m === 25 && currentLoanBalance > 0) {
      currentMortgageRate = Math.max(2.5, currentMortgageRate - 1.5);
      refiFeeThisMonth = currentLoanBalance * 0.01;
      cumRefiAndShockCosts += refiFeeThisMonth;
      monthlyPI = calcMonthlyPI(currentLoanBalance, currentMortgageRate, Math.max(12, loanTotalTermMonths - 24));
    }

    // Special HOA assessment in Year 4
    let specialAssessmentThisMonth = 0;
    if (shocks.hoaShockYr4 && m === 37) {
      specialAssessmentThisMonth = 5000;
      cumRefiAndShockCosts += specialAssessmentThisMonth;
    }

    // Handle Hybrid ARM Rate Adjustments
    if (debtStructure === '7_1_ARM' && m === 85 && currentLoanBalance > 0) {
      currentMortgageRate = Math.min(mortgageRate + 5.0, Math.max(2.0, currentMortgageRate + armRateAdjustment));
      monthlyPI = calcMonthlyPI(currentLoanBalance, currentMortgageRate, 360 - 84);
    } else if (debtStructure === '5_1_ARM' && m === 61 && currentLoanBalance > 0) {
      currentMortgageRate = Math.min(mortgageRate + 5.0, Math.max(2.0, currentMortgageRate + armRateAdjustment));
      monthlyPI = calcMonthlyPI(currentLoanBalance, currentMortgageRate, 360 - 60);
    } else if (debtStructure === 'IO_10Y' && m === 121 && currentLoanBalance > 0) {
      // Transition from Interest-Only to fully amortizing over remaining 20 years (240 months)
      monthlyPI = calcMonthlyPI(currentLoanBalance, currentMortgageRate, 240);
    }

    // Debt Payment & Principal Paydown
    const monthlyRate = currentMortgageRate / 100 / 12;
    let interestPayment = currentLoanBalance > 0 ? currentLoanBalance * monthlyRate : 0;
    let scheduledPrincipal = 0;

    if (debtStructure === 'IO_10Y' && m <= 120) {
      scheduledPrincipal = 0;
      monthlyPI = interestPayment;
    } else {
      scheduledPrincipal = currentLoanBalance > 0 ? Math.min(currentLoanBalance, Math.max(0, monthlyPI - interestPayment)) : 0;
    }

    // Extra monthly principal paydown
    let extraPrincipalThisMonth = 0;
    if (currentLoanBalance > 0 && extraPrincipalMonthly > 0) {
      const remainingAfterScheduled = Math.max(0, currentLoanBalance - scheduledPrincipal);
      extraPrincipalThisMonth = Math.min(remainingAfterScheduled, extraPrincipalMonthly);
    }

    const principalPayment = scheduledPrincipal + extraPrincipalThisMonth;
    currentLoanBalance = Math.max(0, currentLoanBalance - principalPayment);

    if (currentLoanBalance === 0 && loanPayoffMonth === null && initialLoan > 0) {
      loanPayoffMonth = m;
    }

    // PMI automatically drops once loan-to-current-value <= 78% or loan paid off
    const currentLTV = currentHomeValue > 0 ? currentLoanBalance / currentHomeValue : 0;
    const pmiPayment = (currentLTV > 0.78 && currentLoanBalance > 0) ? (initialLoan * pmiAnnualRate) / 12 : 0;

    const propTaxPayment = (currentHomeValue * (propertyTaxRate / 100)) / 12;
    const maintenancePayment = (currentHomeValue * (maintenanceRate / 100)) / 12;

    // RIGOROUS STATE-SPECIFIC & SALT CAP TAX SHIELD ENGINE
    const monthlyStateTax = (estimatedIncome * (stateIncomeTaxRate / 100)) / 12;
    const totalSALT = propTaxPayment + monthlyStateTax;
    const deductibleSALT = Math.min(totalSALT, saltCapMonthly);
    const totalItemizable = interestPayment + deductibleSALT;
    const incrementalDeduction = Math.max(0, totalItemizable - standardDeductionMonthly);
    const combinedMarginalRate = (marginalTaxRate + stateIncomeTaxRate) / 100;

    const taxShieldSavings = shocks.taxShieldActive ? incrementalDeduction * combinedMarginalRate : 0;

    const totalBuyerOutflow =
      interestPayment +
      principalPayment +
      pmiPayment +
      propTaxPayment +
      maintenancePayment +
      currentHOA +
      refiFeeThisMonth +
      specialAssessmentThisMonth -
      taxShieldSavings;

    renterPortfolio *= (1 + monthlyStockReturn);
    buyerSideFund *= (1 + monthlyStockReturn);

    const monthlyDiff = totalBuyerOutflow - currentRent;
    if (monthlyDiff >= 0) {
      renterPortfolio += monthlyDiff;
      cumRenterContributions += monthlyDiff;
    } else {
      const rentExcess = Math.abs(monthlyDiff);
      if (renterPortfolio >= rentExcess) {
        renterPortfolio -= rentExcess;
        cumRenterContributions -= rentExcess;
      } else {
        buyerSideFund += rentExcess;
      }
    }

    currentHomeValue *= (1 + monthlyHomeGrowth);

    const sellingCosts = currentHomeValue * (sellClosingPct / 100);
    const grossHomeEquity = currentHomeValue - currentLoanBalance;
    const netHomeEquityAfterSale = grossHomeEquity - sellingCosts;
    const buyerNetWorth = netHomeEquityAfterSale + buyerSideFund;
    const renterNetWorth = renterPortfolio;

    cumInterest += interestPayment;
    cumPrincipal += principalPayment;
    cumPropertyTax += propTaxPayment;
    cumHOA += currentHOA;
    cumMaintenance += maintenancePayment;
    cumPMI += pmiPayment;
    cumTaxSavings += taxShieldSavings;
    cumRentPaid += currentRent;

    const buyerTotalSunk =
      buyClosingCosts +
      cumInterest +
      cumPMI +
      cumPropertyTax +
      cumHOA +
      cumMaintenance +
      cumRefiAndShockCosts +
      sellingCosts -
      cumTaxSavings;

    const record = {
      month: m,
      year: currentYear,
      homeValue: currentHomeValue,
      loanBalance: currentLoanBalance,
      grossEquity: grossHomeEquity,
      sellingCosts,
      buyerNetWorth,
      renterNetWorth,
      netAdvantageBuyer: buyerNetWorth - renterNetWorth,
      monthlyBuyerOutflow: totalBuyerOutflow,
      monthlyRent: currentRent,
      monthlyPI: interestPayment + principalPayment,
      pmiPayment,
      interestPayment,
      principalPayment,
      extraPrincipalThisMonth,
      propTaxPayment,
      maintenancePayment,
      hoaPayment: currentHOA,
      taxShieldSavings,
      totalItemizable,
      incrementalDeduction,
      cumInterest,
      cumPrincipal,
      cumPropertyTax,
      cumHOA,
      cumMaintenance,
      cumPMI,
      cumTaxSavings,
      cumRentPaid,
      cumRenterContributions,
      renterInvestmentGains: renterNetWorth - cumRenterContributions,
      buyerTotalSunk,
      buyClosingCosts,
      cumRefiAndShockCosts,
      downPayment,
      currentMortgageRate,
    };

    monthlyData.push(record);

    if (crossoverMonth === null && buyerNetWorth >= renterNetWorth) {
      crossoverMonth = m;
    }

    if (m % 12 === 0) {
      yearlyData.push(record);
    }
  }

  const finalRecord = monthlyData[monthlyData.length - 1];
  const inspectedRecord =
    yearlyData[Math.min(yearlyData.length - 1, Math.max(0, inspectedYearInput - 1))] || finalRecord;

  return {
    monthlyData,
    yearlyData,
    finalRecord,
    inspectedRecord,
    crossoverMonth,
    loanPayoffMonth,
    initialMonthlyPI: debtStructure === 'IO_10Y'
      ? initialLoan * (currentMortgageRate / 100 / 12)
      : calcMonthlyPI(initialLoan, currentMortgageRate, loanTotalTermMonths),
    downPayment,
    buyClosingCosts,
    initialLoan,
    effectiveStartingRate: currentMortgageRate,
    standardDeductionAnnual,
  };
}

// --- MONTE CARLO STOCHASTIC SIMULATION ENGINE ---
export function runMonteCarloSimulation(params, shocks, iterations = 500, stockVol = 16.0, homeVol = 7.5, corr = 0.15) {
  const years = params.timelineYears;
  const muStock = params.investmentReturnRate / 100;
  const muHome = params.homeAppreciationRate / 100;
  const sVol = stockVol / 100;
  const hVol = homeVol / 100;
  const rho = corr;

  // Box-Muller standard normal generator
  const boxMuller = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  const buyerYearlyPaths = [];
  const renterYearlyPaths = [];
  let buyerWinsCount = 0;
  const terminalDiffs = [];

  for (let it = 0; it < iterations; it++) {
    // Generate annual returns for this path
    const annualStockReturns = [];
    const annualHomeReturns = [];

    for (let y = 0; y < years; y++) {
      const z1 = boxMuller();
      const z2 = boxMuller();
      const zStock = z1;
      const zHome = rho * z1 + Math.sqrt(Math.max(0, 1 - rho * rho)) * z2;

      // Geometric Brownian Motion step
      const rStock = Math.exp((muStock - 0.5 * sVol * sVol) + sVol * zStock) - 1;
      const rHome = Math.exp((muHome - 0.5 * hVol * hVol) + hVol * zHome) - 1;

      annualStockReturns.push(rStock);
      annualHomeReturns.push(rHome);
    }

    // Run custom path through amortization & portfolio compounding
    const { downPaymentPct, homePrice, buyClosingPct, sellClosingPct } = params;
    const downPayment = homePrice * (downPaymentPct / 100);
    const buyClosingCosts = homePrice * (buyClosingPct / 100);
    const initialLoan = Math.max(0, homePrice - downPayment);

    const debtConfig = DEBT_STRUCTURES[params.debtStructure] || DEBT_STRUCTURES['30Y_FIXED'];
    let loanRate = Math.max(1.0, params.mortgageRate + debtConfig.rateOffset);
    let loanBal = initialLoan;
    let homeVal = homePrice;
    let renterPort = downPayment + buyClosingCosts;
    let buyerSide = 0;

    const calcMonthlyPI = (principal, annualRate, remainingMonths) => {
      if (principal <= 0 || remainingMonths <= 0) return 0;
      const r = annualRate / 100 / 12;
      if (r === 0) return principal / remainingMonths;
      return (principal * (r * Math.pow(1 + r, remainingMonths))) / (Math.pow(1 + r, remainingMonths) - 1);
    };

    let pAndI = debtConfig.code === '10Y-IO'
      ? loanBal * (loanRate / 100 / 12)
      : calcMonthlyPI(loanBal, loanRate, debtConfig.termMonths);

    let rent = params.monthlyRent;
    let hoa = params.hoaMonthly;

    const bYearPoints = [];
    const rYearPoints = [];

    for (let y = 0; y < years; y++) {
      const yearHomeGrowth = annualHomeReturns[y];
      const yearStockGrowth = annualStockReturns[y];
      const mHomeGrowth = Math.pow(Math.max(0.01, 1 + yearHomeGrowth), 1 / 12) - 1;
      const mStockGrowth = Math.pow(Math.max(0.01, 1 + yearStockGrowth), 1 / 12) - 1;

      for (let m = 1; m <= 12; m++) {
        const absMonth = y * 12 + m;
        if (m === 1 && y > 0) {
          rent *= (1 + params.rentGrowthRate / 100);
          hoa *= 1.025;
        }

        const mRate = loanRate / 100 / 12;
        const interest = loanBal > 0 ? loanBal * mRate : 0;
        let schedPrincipal = 0;
        if (debtConfig.code === '10Y-IO' && absMonth <= 120) {
          schedPrincipal = 0;
        } else {
          schedPrincipal = loanBal > 0 ? Math.min(loanBal, Math.max(0, pAndI - interest)) : 0;
        }

        const extraP = loanBal > 0 ? Math.min(Math.max(0, loanBal - schedPrincipal), params.extraPrincipalMonthly || 0) : 0;
        const princ = schedPrincipal + extraP;
        loanBal = Math.max(0, loanBal - princ);

        const currentLTV = homeVal > 0 ? loanBal / homeVal : 0;
        const pmi = (currentLTV > 0.78 && loanBal > 0) ? (initialLoan * 0.0065) / 12 : 0;
        const propTax = (homeVal * (params.propertyTaxRate / 100)) / 12;
        const maint = (homeVal * (params.maintenanceRate / 100)) / 12;

        const monthlyBuyerOutflow = interest + princ + pmi + propTax + maint + hoa;

        renterPort *= (1 + mStockGrowth);
        buyerSide *= (1 + mStockGrowth);

        const diff = monthlyBuyerOutflow - rent;
        if (diff >= 0) {
          renterPort += diff;
        } else {
          const excess = Math.abs(diff);
          if (renterPort >= excess) renterPort -= excess;
          else buyerSide += excess;
        }

        homeVal *= (1 + mHomeGrowth);
      }

      const sellCosts = homeVal * (sellClosingPct / 100);
      const bNW = (homeVal - loanBal - sellCosts) + buyerSide;
      const rNW = renterPort;

      bYearPoints.push(bNW);
      rYearPoints.push(rNW);
    }

    buyerYearlyPaths.push(bYearPoints);
    renterYearlyPaths.push(rYearPoints);

    const finalBNW = bYearPoints[bYearPoints.length - 1];
    const finalRNW = rYearPoints[rYearPoints.length - 1];
    if (finalBNW >= finalRNW) {
      buyerWinsCount++;
    }
    terminalDiffs.push(finalBNW - finalRNW);
  }

  // Calculate percentiles at each year (P10, P50, P90)
  const statsYearly = [];
  for (let y = 0; y < years; y++) {
    const bVals = buyerYearlyPaths.map(p => p[y]).sort((a, b) => a - b);
    const rVals = renterYearlyPaths.map(p => p[y]).sort((a, b) => a - b);

    const getP = (arr, pct) => arr[Math.floor(pct * (arr.length - 1))];

    statsYearly.push({
      year: y + 1,
      buyer: {
        p10: getP(bVals, 0.10),
        p50: getP(bVals, 0.50),
        p90: getP(bVals, 0.90),
      },
      renter: {
        p10: getP(rVals, 0.10),
        p50: getP(rVals, 0.50),
        p90: getP(rVals, 0.90),
      }
    });
  }

  terminalDiffs.sort((a, b) => a - b);
  const winProbability = (buyerWinsCount / iterations) * 100;
  const medianDiff = terminalDiffs[Math.floor(0.50 * terminalDiffs.length)];
  const p10Diff = terminalDiffs[Math.floor(0.10 * terminalDiffs.length)];
  const p90Diff = terminalDiffs[Math.floor(0.90 * terminalDiffs.length)];

  return {
    iterations,
    winProbability,
    medianDiff,
    p10Diff,
    p90Diff,
    statsYearly,
    stockVol,
    homeVol,
    corr,
  };
}

// --- BINARY SEARCH BREAK-EVEN SOLVER ---
function solveBreakEvenThreshold(params, shocks, paramKey, minBound, maxBound, buyerWinsAsValueIncreases) {
  let low = minBound;
  let high = maxBound;
  for (let iter = 0; iter < 22; iter++) {
    const mid = (low + high) / 2;
    const testParams = { ...params, [paramKey]: mid };
    const res = runFinancialEngine(testParams, shocks, params.timelineYears);
    const diff = res.finalRecord.buyerNetWorth - res.finalRecord.renterNetWorth;
    if (buyerWinsAsValueIncreases) {
      if (diff > 0) high = mid;
      else low = mid;
    } else {
      if (diff > 0) low = mid;
      else high = mid;
    }
  }
  return (low + high) / 2;
}

export default function App() {
  const [activePreset, setActivePreset] = useState('baseline');
  const [params, setParams] = useState(PRESETS.baseline.params);
  const [shocks, setShocks] = useState(PRESETS.baseline.shocks);
  const [activeTab, setActiveTab] = useState('trajectory'); // 'trajectory' | 'sunk' | 'cashflow' | 'sensitivity' | 'ledger' | 'montecarlo'
  const [inspectedYear, setInspectedYear] = useState(10);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Monte Carlo parameters & refresh trigger
  const [mcParams, setMcParams] = useState({ stockVol: 16.0, homeVol: 7.5, corr: 0.15 });
  const [mcSeed, setMcSeed] = useState(1);

  // Mobile Workspace Switcher
  const [mobileSection, setMobileSection] = useState('analysis'); // 'inputs' | 'analysis' | 'audit'

  // Saved Scenario Snapshots
  const [snapshots, setSnapshots] = useState([
    {
      id: 'snap-default',
      label: '20% Down @ 6.50% 30Y-FX',
      homePrice: 450000,
      monthlyRent: 2400,
      mortgageRate: 6.5,
      timelineYears: 10,
      buyerNetWorth: 301290,
      renterNetWorth: 277145,
      winner: 'BUYER',
      spread: 24145,
    }
  ]);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (inspectedYear > params.timelineYears) {
      setInspectedYear(params.timelineYears);
    }
  }, [params.timelineYears, inspectedYear]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const updateParam = (key, value) => {
    const numeric = typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '' ? Number(value) : value;
    setActivePreset('custom');
    setParams((prev) => ({ ...prev, [key]: numeric }));
  };

  const handleStateChange = (stateKey) => {
    const profile = STATE_TAX_PROFILES[stateKey];
    if (!profile) return;
    setActivePreset('custom');
    setParams((prev) => ({
      ...prev,
      taxState: stateKey,
      stateIncomeTaxRate: profile.stateIncomeTaxRate,
      propertyTaxRate: profile.defaultPropertyTax,
    }));
    showToast(`Loaded ${profile.name} Tax Profile`);
  };

  const handleDebtStructureChange = (structureKey) => {
    const debt = DEBT_STRUCTURES[structureKey];
    if (!debt) return;
    setActivePreset('custom');
    setParams((prev) => ({
      ...prev,
      debtStructure: structureKey,
    }));
    showToast(`Switched to ${debt.label}`);
  };

  const toggleShock = (key) => {
    setActivePreset('custom');
    setShocks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyPreset = (key) => {
    setActivePreset(key);
    setParams(PRESETS[key].params);
    setShocks(PRESETS[key].shocks);
    setInspectedYear(PRESETS[key].params.timelineYears);
    showToast(`Loaded ${PRESETS[key].name} (${PRESETS[key].code})`);
  };

  // CORE FINANCIAL SIMULATION
  const simulation = useMemo(
    () => runFinancialEngine(params, shocks, inspectedYear),
    [params, shocks, inspectedYear]
  );

  // MONTE CARLO STOCHASTIC ENGINE
  const mcResults = useMemo(
    () => runMonteCarloSimulation(params, shocks, 500, mcParams.stockVol, mcParams.homeVol, mcParams.corr),
    [params, shocks, mcParams, mcSeed]
  );

  // BREAK-EVEN SOLVER
  const sensitivityThresholds = useMemo(() => {
    return {
      maxHomePrice: solveBreakEvenThreshold(params, shocks, 'homePrice', 100000, 2500000, false),
      minMonthlyRent: solveBreakEvenThreshold(params, shocks, 'monthlyRent', 500, 12000, true),
      maxMortgageRate: solveBreakEvenThreshold(params, shocks, 'mortgageRate', 1.0, 14.0, false),
      minAppreciationRate: solveBreakEvenThreshold(params, shocks, 'homeAppreciationRate', -3.0, 12.0, true),
    };
  }, [params, shocks]);

  const { yearlyData, finalRecord, inspectedRecord, crossoverMonth, loanPayoffMonth, standardDeductionAnnual } = simulation;
  const isBuyerWinner = finalRecord.buyerNetWorth >= finalRecord.renterNetWorth;
  const netSpread = Math.abs(finalRecord.buyerNetWorth - finalRecord.renterNetWorth);

  // SNAPSHOT CAPTURE & CSV EXPORT
  const captureSnapshot = () => {
    const newSnap = {
      id: `snap-${Date.now()}`,
      label: `${formatCurrency(params.homePrice, true)} (${DEBT_STRUCTURES[params.debtStructure]?.code || '30Y'}) vs ${formatCurrency(params.monthlyRent)}/mo`,
      homePrice: params.homePrice,
      monthlyRent: params.monthlyRent,
      mortgageRate: params.mortgageRate,
      timelineYears: params.timelineYears,
      buyerNetWorth: finalRecord.buyerNetWorth,
      renterNetWorth: finalRecord.renterNetWorth,
      winner: isBuyerWinner ? 'BUYER' : 'RENTER',
      spread: netSpread,
    };
    setSnapshots((prev) => [newSnap, ...prev.slice(0, 3)]);
    showToast('Scenario pinned to comparison bar');
  };

  const exportLedgerCSV = () => {
    const headers = [
      'Year',
      'Home_Value_USD',
      'Mortgage_Debt_USD',
      'Buyer_Sunk_Costs_USD',
      'Buyer_Liquid_Net_Worth_USD',
      'Cumulative_Rent_Paid_USD',
      'Renter_SP500_Portfolio_USD',
      'Net_Buyer_Advantage_USD'
    ];
    const rows = yearlyData.map((r) => [
      r.year,
      Math.round(r.homeValue),
      Math.round(r.loanBalance),
      Math.round(r.buyerTotalSunk),
      Math.round(r.buyerNetWorth),
      Math.round(r.cumRentPaid),
      Math.round(r.renterNetWorth),
      Math.round(r.buyerNetWorth - r.renterNetWorth)
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shelter_capital_ledger_${params.timelineYears}yr.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV Amortization & Opportunity Ledger');
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#111110] selection:bg-[#111110] selection:text-[#F7F6F2] font-sans antialiased pb-20 lg:pb-0">
      {/* EMBEDDED ARCHITECTURAL TYPOGRAPHY */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        .font-serif-editorial {
          font-family: 'Instrument Serif', Georgia, serif;
        }
        .font-mono-tabular {
          font-family: 'JetBrains Mono', monospace;
          font-variant-numeric: tabular-nums;
        }
        .font-sans-ui {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Tactile Range Input */
        input[type='range'].arch-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          background: #D5D2C8;
          border: 1px solid #111110;
          outline: none;
          margin: 10px 0 4px 0;
        }
        input[type='range'].arch-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 24px;
          background: #111110;
          border: 2px solid #F7F6F2;
          box-shadow: 0 0 0 1px #111110;
          cursor: ew-resize;
          transition: background 0.15s ease, transform 0.1s ease;
        }
        input[type='range'].arch-slider::-webkit-slider-thumb:hover,
        input[type='range'].arch-slider::-webkit-slider-thumb:active {
          background: #C83E2B;
          transform: scaleY(1.08);
        }
        input[type='range'].arch-slider::-moz-range-thumb {
          width: 16px;
          height: 24px;
          background: #111110;
          border: 2px solid #F7F6F2;
          box-shadow: 0 0 0 1px #111110;
          border-radius: 0;
          cursor: ew-resize;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* FLOATING TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 bg-[#111110] text-[#F7F6F2] border-2 border-[#F7F6F2] shadow-xl px-4 py-2.5 font-mono-tabular text-xs uppercase tracking-wider flex items-center gap-2.5 animate-bounce">
          <span className="w-2 h-2 bg-[#14532D] inline-block" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-[1580px] mx-auto border-x border-[#111110] min-h-screen flex flex-col font-sans-ui">
        
        {/* TOPMAST SPECIFICATION HEADER */}
        <header className="border-b border-[#111110] bg-[#F7F6F2] sticky top-0 z-30">
          {/* Upper Micro-Telemetry Strip */}
          <div className="border-b border-[#111110]/25 px-3 sm:px-6 py-1.5 flex items-center justify-between text-[11px] font-mono-tabular uppercase tracking-wider text-[#3F3E3A] bg-[#ECEAE2]">
            <div className="flex items-center gap-3 sm:gap-5 truncate">
              <span className="text-[#111110] font-bold">SPEC // CAPITAL-VELOCITY-PRO</span>
              <span className="hidden md:inline">MONTE CARLO STOCHASTICS & DUAL-ENTRY TAX LEDGER</span>
              {params.downPaymentPct < 20 && (
                <span className="px-1.5 py-0.5 bg-[#C83E2B] text-[#F7F6F2] font-bold text-[10px]">
                  PMI ACTIVE (&lt;20% DOWN)
                </span>
              )}
              {loanPayoffMonth && (
                <span className="px-1.5 py-0.5 bg-[#14532D] text-[#F7F6F2] font-bold text-[10px]">
                  PAID OFF YR {Math.ceil(loanPayoffMonth / 12)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={captureSnapshot}
                className="px-2.5 py-1 border border-[#111110] bg-[#F7F6F2] hover:bg-[#111110] hover:text-[#F7F6F2] transition-colors font-bold flex items-center gap-1.5 text-[#111110]"
                title="Pin current scenario for comparison"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Pin Scenario</span>
              </button>
              <button
                onClick={exportLedgerCSV}
                className="px-2.5 py-1 border border-[#111110] bg-[#111110] text-[#F7F6F2] hover:bg-[#14532D] transition-colors font-bold flex items-center gap-1.5"
                title="Download annual amortization & opportunity ledger CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>

          {/* Main Masthead & Scenario Switcher */}
          <div className="px-3 sm:px-6 py-3.5 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <h1 className="font-serif-editorial text-2xl sm:text-4xl tracking-tight text-[#111110] leading-none">
                    Capital Allocation & Shelter Lab
                  </h1>
                  <span className="text-[11px] font-mono-tabular font-bold uppercase px-2 py-0.5 border border-[#111110] bg-[#ECEAE2]">
                    {params.timelineYears}-YR HORIZON
                  </span>
                  <span className="text-[11px] font-mono-tabular font-bold uppercase px-2 py-0.5 border border-[#14532D] bg-[#14532D]/10 text-[#14532D]">
                    {DEBT_STRUCTURES[params.debtStructure]?.label}
                  </span>
                  <span className="text-[11px] font-mono-tabular font-bold uppercase px-2 py-0.5 border border-[#111110] bg-[#F7F6F2]">
                    STATE: {params.taxState} ({params.filingStatus.toUpperCase()})
                  </span>
                </div>
                <p className="text-xs text-[#3F3E3A] mt-1 hidden sm:block">
                  Tactile multi-variable simulation comparing real estate equity velocity, custom debt amortization, and S&P 500 compounding
                </p>
              </div>
            </div>

            {/* Presets Strip */}
            <div className="flex items-center border border-[#111110] bg-[#ECEAE2] divide-x divide-[#111110] overflow-x-auto no-scrollbar">
              {Object.entries(PRESETS).map(([key, preset]) => {
                const active = activePreset === key;
                return (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className={`px-3 py-2 text-left transition-colors shrink-0 ${
                      active
                        ? 'bg-[#111110] text-[#F7F6F2]'
                        : 'bg-[#F7F6F2] text-[#111110] hover:bg-[#ECEAE2]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-tabular text-[10px] uppercase tracking-wider opacity-80">
                        {preset.code}
                      </span>
                      {active && <span className="w-2 h-2 bg-[#C83E2B]" />}
                    </div>
                    <div className="text-xs font-bold tracking-tight mt-0.5 whitespace-nowrap">
                      {preset.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PINNED COMPARISON RIBBON */}
          {snapshots.length > 0 && (
            <div className="border-t border-[#111110] bg-[#ECEAE2]/80 px-3 sm:px-6 py-2 flex items-center gap-3 overflow-x-auto no-scrollbar">
              <span className="font-mono-tabular text-[10px] font-bold uppercase tracking-wider text-[#3F3E3A] shrink-0 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#111110]" />
                Pinned Scenarios:
              </span>
              <div className="flex items-center gap-2">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="inline-flex items-center gap-2.5 px-2.5 py-1 bg-[#F7F6F2] border border-[#111110] font-mono-tabular text-[11px] shrink-0"
                  >
                    <span className="font-bold text-[#111110]">{snap.label}</span>
                    <span
                      className={`px-1.5 py-0.2 text-[10px] font-bold ${
                        snap.winner === 'BUYER'
                          ? 'bg-[#14532D] text-[#F7F6F2]'
                          : 'bg-[#C83E2B] text-[#F7F6F2]'
                      }`}
                    >
                      {snap.winner} +{formatCurrency(snap.spread, true)}
                    </span>
                    <button
                      onClick={() => setSnapshots((prev) => prev.filter((s) => s.id !== snap.id))}
                      className="text-[#3F3E3A] hover:text-[#C83E2B]"
                      title="Remove snapshot"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* PRIMARY WORKSPACE: 12-COLUMN SWISS ARCHITECTURAL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 divide-y lg:divide-y-0 lg:divide-x divide-[#111110]">
          
          {/* LEFT COLUMN (4 COLS): PARAMETER SPECIFICATION SHEET */}
          <aside
            className={`lg:col-span-4 divide-y divide-[#111110] bg-[#F7F6F2] ${
              mobileSection === 'inputs' ? 'block' : 'hidden lg:block'
            }`}
          >
            
            {/* Section 01: Acquisition & Custom Debt Schedule */}
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#111110]">
                <div>
                  <span className="font-mono-tabular text-[11px] uppercase tracking-widest text-[#14532D] font-bold block">
                    SECTION 01 // REAL ESTATE ASSET & DEBT
                  </span>
                  <h2 className="font-serif-editorial text-2xl text-[#111110] leading-tight">
                    Acquisition & Debt Structure
                  </h2>
                </div>
                <div className="text-right font-mono-tabular">
                  <span className="text-[10px] uppercase text-[#3F3E3A] font-semibold block">Initial Loan</span>
                  <span className="text-sm font-bold text-[#111110]">
                    {formatCurrency(simulation.initialLoan)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <TactileParameter
                  code="01.A"
                  label="Purchase Price"
                  value={params.homePrice}
                  min={100000}
                  max={2500000}
                  step={5000}
                  prefix="$"
                  display={formatCurrency(params.homePrice)}
                  onChange={(v) => updateParam('homePrice', v)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TactileParameter
                    code="01.B"
                    label="Down Payment"
                    value={params.downPaymentPct}
                    min={3}
                    max={60}
                    step={1}
                    suffix="%"
                    display={`${params.downPaymentPct}%`}
                    sub={`${formatCurrency(simulation.downPayment, true)} cash`}
                    onChange={(v) => updateParam('downPaymentPct', v)}
                  />
                  <TactileParameter
                    code="01.C"
                    label="Benchmark Rate"
                    value={params.mortgageRate}
                    min={2.0}
                    max={11.0}
                    step={0.05}
                    suffix="%"
                    display={`${params.mortgageRate.toFixed(2)}%`}
                    sub={`Eff: ${simulation.effectiveStartingRate.toFixed(2)}%`}
                    onChange={(v) => updateParam('mortgageRate', v)}
                  />
                </div>

                {/* CUSTOM DEBT STRUCTURE SELECTOR */}
                <div className="p-3 border border-[#111110] bg-[#ECEAE2]/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tabular text-[10px] uppercase font-bold text-[#111110] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#14532D]" />
                      Custom Debt Structure
                    </span>
                    <span className="font-mono-tabular text-[10px] font-bold text-[#14532D]">
                      {formatCurrency(simulation.initialMonthlyPI)}/mo P&I
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 font-mono-tabular text-[10px]">
                    {Object.entries(DEBT_STRUCTURES).map(([key, debt]) => (
                      <button
                        key={key}
                        onClick={() => handleDebtStructureChange(key)}
                        className={`p-1.5 border border-[#111110] text-center font-bold transition-colors ${
                          params.debtStructure === key
                            ? 'bg-[#111110] text-[#F7F6F2]'
                            : 'bg-[#F7F6F2] text-[#111110] hover:bg-[#D5D2C8]'
                        }`}
                        title={debt.description}
                      >
                        <div>{debt.code}</div>
                        <div className="text-[9px] opacity-75">
                          {debt.rateOffset > 0 ? `+${debt.rateOffset}%` : debt.rateOffset < 0 ? `${debt.rateOffset}%` : 'Base'}
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#3F3E3A] leading-tight">
                    {DEBT_STRUCTURES[params.debtStructure]?.description}
                  </p>

                  {/* Extra Principal Prepayment Slider */}
                  <div className="pt-2 border-t border-[#111110]/20">
                    <TactileParameter
                      code="PREPAY"
                      label="Extra Monthly Principal Paydown"
                      value={params.extraPrincipalMonthly || 0}
                      min={0}
                      max={2000}
                      step={50}
                      prefix="$"
                      display={`${formatCurrency(params.extraPrincipalMonthly || 0)}/mo`}
                      sub={loanPayoffMonth ? `Payoff Year ${Math.ceil(loanPayoffMonth / 12)}` : 'Full Term'}
                      compact
                      onChange={(v) => updateParam('extraPrincipalMonthly', v)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <TactileParameter
                    code="01.D"
                    label="Appreciation"
                    value={params.homeAppreciationRate}
                    min={-3.0}
                    max={12.0}
                    step={0.1}
                    suffix="%/yr"
                    display={`${params.homeAppreciationRate.toFixed(1)}%/yr`}
                    onChange={(v) => updateParam('homeAppreciationRate', v)}
                  />
                  <TactileParameter
                    code="01.E"
                    label="HOA Dues"
                    value={params.hoaMonthly}
                    min={0}
                    max={2000}
                    step={25}
                    prefix="$"
                    display={`${formatCurrency(params.hoaMonthly)}/mo`}
                    onChange={(v) => updateParam('hoaMonthly', v)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <TactileParameter
                    code="MNT"
                    label="Upkeep/Ins"
                    value={params.maintenanceRate}
                    min={0.2}
                    max={3.0}
                    step={0.1}
                    suffix="%"
                    display={`${params.maintenanceRate.toFixed(1)}%`}
                    compact
                    onChange={(v) => updateParam('maintenanceRate', v)}
                  />
                  <TactileParameter
                    code="PRP-TX"
                    label="Property Tax"
                    value={params.propertyTaxRate}
                    min={0.2}
                    max={3.5}
                    step={0.05}
                    suffix="%"
                    display={`${params.propertyTaxRate.toFixed(2)}%`}
                    compact
                    onChange={(v) => updateParam('propertyTaxRate', v)}
                  />
                </div>
              </div>
            </div>

            {/* Section 02: State-Specific Tax Matrix & SALT Model */}
            <div className="p-4 sm:p-6 bg-[#ECEAE2]/40">
              <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#111110]">
                <div>
                  <span className="font-mono-tabular text-[11px] uppercase tracking-widest text-[#111110] font-bold block">
                    SECTION 02 // STATE TAX & SALT SHIELD
                  </span>
                  <h2 className="font-serif-editorial text-2xl text-[#111110] leading-tight">
                    State Tiers & Itemization
                  </h2>
                </div>
                <span className="font-mono-tabular text-xs font-bold text-[#14532D] px-2 py-0.5 border border-[#14532D] bg-[#14532D]/10">
                  {params.taxState}
                </span>
              </div>

              <div className="space-y-4">
                {/* State Profile Matrix */}
                <div>
                  <span className="text-[10px] font-mono-tabular uppercase font-semibold text-[#3F3E3A] block mb-1.5">
                    Select State Jurisdictional Profile
                  </span>
                  <div className="grid grid-cols-4 gap-1 font-mono-tabular text-[11px]">
                    {Object.keys(STATE_TAX_PROFILES).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStateChange(st)}
                        className={`p-1.5 border border-[#111110] font-bold text-center transition-colors ${
                          params.taxState === st
                            ? 'bg-[#111110] text-[#F7F6F2]'
                            : 'bg-[#F7F6F2] text-[#111110] hover:bg-[#ECEAE2]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] text-[#3F3E3A] font-mono-tabular mt-1.5">
                    {STATE_TAX_PROFILES[params.taxState]?.tag}
                  </div>
                </div>

                {/* Filing Status & Bracket */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#111110]/20">
                  <div>
                    <span className="text-[10px] font-mono-tabular uppercase font-semibold text-[#3F3E3A] block mb-1">
                      Filing Status
                    </span>
                    <div className="grid grid-cols-2 border border-[#111110] text-center font-mono-tabular text-[10px] font-bold">
                      <button
                        onClick={() => updateParam('filingStatus', 'single')}
                        className={`py-1.5 ${
                          params.filingStatus === 'single' ? 'bg-[#111110] text-[#F7F6F2]' : 'bg-[#F7F6F2] hover:bg-[#ECEAE2]'
                        }`}
                      >
                        Single
                      </button>
                      <button
                        onClick={() => updateParam('filingStatus', 'mfj')}
                        className={`py-1.5 border-l border-[#111110] ${
                          params.filingStatus === 'mfj' ? 'bg-[#111110] text-[#F7F6F2]' : 'bg-[#F7F6F2] hover:bg-[#ECEAE2]'
                        }`}
                      >
                        MFJ
                      </button>
                    </div>
                    <span className="text-[10px] text-[#3F3E3A] font-mono-tabular block mt-1">
                      Std Ded: {formatCurrency(standardDeductionAnnual)}
                    </span>
                  </div>

                  <TactileParameter
                    code="FED-BRK"
                    label="Fed Marginal Bracket"
                    value={params.marginalTaxRate}
                    min={0}
                    max={37}
                    step={1}
                    suffix="%"
                    display={`${params.marginalTaxRate}%`}
                    compact
                    onChange={(v) => updateParam('marginalTaxRate', v)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <TactileParameter
                    code="ST-BRK"
                    label="State Marginal Tax"
                    value={params.stateIncomeTaxRate}
                    min={0}
                    max={13.3}
                    step={0.1}
                    suffix="%"
                    display={`${params.stateIncomeTaxRate.toFixed(1)}%`}
                    compact
                    onChange={(v) => updateParam('stateIncomeTaxRate', v)}
                  />
                  <div className="flex flex-col justify-between p-2 border border-[#111110] bg-[#F7F6F2] font-mono-tabular">
                    <span className="text-[10px] uppercase text-[#3F3E3A] font-bold">SALT Cap Limit</span>
                    <button
                      onClick={() => updateParam('applySaltCap', !params.applySaltCap)}
                      className={`px-2 py-1 text-[10px] font-bold uppercase border border-[#111110] mt-1 transition-colors ${
                        params.applySaltCap ? 'bg-[#14532D] text-[#F7F6F2]' : 'bg-[#C83E2B] text-[#F7F6F2]'
                      }`}
                    >
                      {params.applySaltCap ? '$10,000 SALT CAP' : 'NO SALT CAP'}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 border border-[#111110] bg-[#F7F6F2] font-mono-tabular text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#3F3E3A]">Total Mo. Deductibles:</span>
                    <span className="font-bold">{formatCurrency(inspectedRecord.totalItemizable)}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3F3E3A]">Deduction Alpha over Std:</span>
                    <span className={`font-bold ${inspectedRecord.incrementalDeduction > 0 ? 'text-[#14532D]' : 'text-[#3F3E3A]'}`}>
                      {inspectedRecord.incrementalDeduction > 0 ? `+${formatCurrency(inspectedRecord.incrementalDeduction)}/mo` : '$0 (Std Used)'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#111110]/20">
                    <span className="font-bold">Annual Tax Shield:</span>
                    <span className="font-bold text-[#14532D]">
                      {formatCurrency(inspectedRecord.taxShieldSavings * 12)}/yr
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 03: Opportunity Benchmark (S&P 500 Index & Rent) */}
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#111110]">
                <div>
                  <span className="font-mono-tabular text-[11px] uppercase tracking-widest text-[#C83E2B] font-bold block">
                    SECTION 03 // OPPORTUNITY BENCHMARK
                  </span>
                  <h2 className="font-serif-editorial text-2xl text-[#111110] leading-tight">
                    Lease & S&P 500 Equities
                  </h2>
                </div>
                <div className="text-right font-mono-tabular">
                  <span className="text-[10px] uppercase text-[#3F3E3A] font-semibold block">Day 1 Portfolio</span>
                  <span className="text-sm font-bold text-[#C83E2B]">
                    {formatCurrency(simulation.downPayment + simulation.buyClosingCosts)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <TactileParameter
                  code="03.A"
                  label="Initial Monthly Rent"
                  value={params.monthlyRent}
                  min={500}
                  max={10000}
                  step={50}
                  prefix="$"
                  display={`${formatCurrency(params.monthlyRent)}/mo`}
                  onChange={(v) => updateParam('monthlyRent', v)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TactileParameter
                    code="03.B"
                    label="Rent Inflation"
                    value={params.rentGrowthRate}
                    min={0.0}
                    max={10.0}
                    step={0.1}
                    suffix="%/yr"
                    display={`${params.rentGrowthRate.toFixed(1)}%/yr`}
                    onChange={(v) => updateParam('rentGrowthRate', v)}
                  />
                  <TactileParameter
                    code="03.C"
                    label="S&P 500 Return"
                    value={params.investmentReturnRate}
                    min={1.0}
                    max={15.0}
                    step={0.25}
                    suffix="%/yr"
                    display={`${params.investmentReturnRate.toFixed(1)}%/yr`}
                    sub="Equities CAGR"
                    onChange={(v) => updateParam('investmentReturnRate', v)}
                  />
                </div>

                <div className="pt-2 border-t border-[#111110]/30">
                  <TactileParameter
                    code="03.D"
                    label="Analysis Horizon (Years)"
                    value={params.timelineYears}
                    min={2}
                    max={30}
                    step={1}
                    suffix="YRS"
                    display={`${params.timelineYears} YRS (${params.timelineYears * 12} MOS)`}
                    onChange={(v) => {
                      updateParam('timelineYears', v);
                      setInspectedYear(Number(v));
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Section 04: Exogenous Stress Shocks */}
            <div className="p-4 sm:p-6 bg-[#ECEAE2]/70">
              <div className="pb-3 mb-3 border-b-2 border-[#111110]">
                <span className="font-mono-tabular text-[11px] uppercase tracking-widest text-[#3F3E3A] font-bold block">
                  SECTION 04 // EXOGENOUS EVENTS
                </span>
                <h2 className="font-serif-editorial text-2xl text-[#111110] leading-tight">
                  Stress-Test Clauses
                </h2>
              </div>

              <div className="divide-y divide-[#111110] border border-[#111110] bg-[#F7F6F2]">
                <MechanicalSwitch
                  active={shocks.taxShieldActive}
                  onClick={() => toggleShock('taxShieldActive')}
                  code="CL-01"
                  title="Tax Shield Deduction Benefit"
                  desc={`Applies federal & state marginal deduction over standard deduction ($${(standardDeductionAnnual).toLocaleString()})`}
                  tag={`+${formatCurrency(finalRecord.cumTaxSavings, true)}`}
                />
                <MechanicalSwitch
                  active={shocks.refiYear3}
                  onClick={() => toggleShock('refiYear3')}
                  code="CL-02"
                  title="Year 3 Rate Refinance (-1.50%)"
                  desc="Re-amortizes loan at lower rate in Month 25 with 1% closing fee"
                  tag="MO. 25"
                />
                <MechanicalSwitch
                  active={shocks.hoaShockYr4}
                  onClick={() => toggleShock('hoaShockYr4')}
                  code="CL-03"
                  title="Special Capital Assessment"
                  desc="Models an unexpected $5,000 structural/roof assessment in Year 4"
                  tag="-$5,000"
                />
              </div>
            </div>

          </aside>

          {/* RIGHT COLUMN (8 COLS): EXECUTIVE VERDICT, VISUALIZATION CANVAS & AUDIT */}
          <main className="lg:col-span-8 divide-y divide-[#111110] flex flex-col">
            
            {/* EXECUTIVE VERDICT & SCOREBOARD */}
            <section
              className={`grid grid-cols-1 xl:grid-cols-12 divide-y xl:divide-y-0 xl:divide-x divide-[#111110] ${
                mobileSection === 'inputs' ? 'hidden lg:grid' : 'grid'
              }`}
            >
              
              {/* Left 7 Cols: Editorial Verdict Headline */}
              <div className="xl:col-span-7 p-4 sm:p-8 flex flex-col justify-between bg-[#F7F6F2]">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 border border-[#111110] bg-[#ECEAE2] text-[11px] font-mono-tabular font-bold uppercase tracking-wider">
                    <span
                      className={`w-2.5 h-2.5 ${
                        crossoverMonth ? 'bg-[#14532D]' : 'bg-[#C83E2B]'
                      }`}
                    />
                    {crossoverMonth ? (
                      <span>
                        BREAK-EVEN CROSSOVER: YEAR {Math.ceil(crossoverMonth / 12)}, MO. {((crossoverMonth - 1) % 12) + 1} (M{crossoverMonth})
                      </span>
                    ) : (
                      <span>
                        NO CROSSOVER WITHIN {params.timelineYears} YRS — LIQUID INDEX LEADS
                      </span>
                    )}
                  </div>

                  <h2 className="font-serif-editorial text-3xl sm:text-5xl text-[#111110] leading-[1.06] tracking-tight">
                    {isBuyerWinner ? (
                      <>
                        Property ownership yields a{' '}
                        <span className="italic underline decoration-[#14532D] decoration-2 underline-offset-4 text-[#14532D]">
                          {formatCurrency(netSpread)}
                        </span>{' '}
                        net worth surplus by Year {params.timelineYears}.
                      </>
                    ) : (
                      <>
                        Renting & indexing yields a{' '}
                        <span className="italic underline decoration-[#C83E2B] decoration-2 underline-offset-4 text-[#C83E2B]">
                          {formatCurrency(netSpread)}
                        </span>{' '}
                        net worth surplus by Year {params.timelineYears}.
                      </>
                    )}
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-[#3F3E3A] leading-relaxed pt-4 mt-4 border-t border-[#111110]/25">
                  {isBuyerWinner
                    ? `Under the ${DEBT_STRUCTURES[params.debtStructure]?.label} in ${params.taxState}, net of ${params.sellClosingPct}% disposition fee (${formatCurrency(
                        finalRecord.sellingCosts
                      )}) and ${formatCurrency(
                        finalRecord.buyerTotalSunk
                      )} in cumulative carrying friction, leveraged appreciation outperforms equities.`
                    : `Deploying ${formatCurrency(
                        simulation.downPayment + simulation.buyClosingCosts
                      )} Day 1 plus monthly cashflow savings into the S&P 500 compounding at ${
                        params.investmentReturnRate
                      }%/yr surpasses real estate equity by ${formatCurrency(netSpread)}.`}
                </p>
              </div>

              {/* Right 5 Cols: Terminal Net Worth Ledger Cards */}
              <div className="xl:col-span-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 divide-y sm:divide-y-0 sm:divide-x xl:divide-x-0 xl:divide-y divide-[#111110]">
                
                {/* Buyer Terminal Balance */}
                <div className="p-4 sm:p-6 bg-[#F7F6F2] flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#14532D] font-bold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-[#14532D] inline-block shrink-0" />
                      PATH A // BUYER EQUITY (YR {params.timelineYears})
                    </span>
                    {isBuyerWinner && (
                      <span className="font-mono-tabular text-[10px] font-bold uppercase px-2 py-0.5 bg-[#14532D] text-[#F7F6F2]">
                        WINNER
                      </span>
                    )}
                  </div>
                  <div className="my-2">
                    <div className="font-mono-tabular text-2xl sm:text-4xl font-bold tracking-tight text-[#111110]">
                      {formatCurrency(finalRecord.buyerNetWorth)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-tabular text-[#3F3E3A] font-medium pt-2 border-t border-[#111110]/20">
                    <span>Asset: {formatCurrency(finalRecord.homeValue, true)}</span>
                    <span>Debt: -{formatCurrency(finalRecord.loanBalance, true)}</span>
                    <span>Exit: -{formatCurrency(finalRecord.sellingCosts, true)}</span>
                  </div>
                </div>

                {/* Renter Terminal Balance */}
                <div className="p-4 sm:p-6 bg-[#F7F6F2] flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#C83E2B] font-bold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-[#C83E2B] inline-block shrink-0" />
                      PATH B // S&P 500 INDEX (YR {params.timelineYears})
                    </span>
                    {!isBuyerWinner && (
                      <span className="font-mono-tabular text-[10px] font-bold uppercase px-2 py-0.5 bg-[#C83E2B] text-[#F7F6F2]">
                        WINNER
                      </span>
                    )}
                  </div>
                  <div className="my-2">
                    <div className="font-mono-tabular text-2xl sm:text-4xl font-bold tracking-tight text-[#111110]">
                      {formatCurrency(finalRecord.renterNetWorth)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-tabular text-[#3F3E3A] font-medium pt-2 border-t border-[#111110]/20">
                    <span>Principal: {formatCurrency(finalRecord.cumRenterContributions, true)}</span>
                    <span>Compound Gain: +{formatCurrency(finalRecord.renterInvestmentGains, true)}</span>
                  </div>
                </div>

              </div>
            </section>

            {/* TAB NAVIGATION BAR */}
            <section
              className={`bg-[#ECEAE2] border-b border-[#111110] px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 ${
                mobileSection === 'analysis' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              <div className="flex items-center border border-[#111110] bg-[#F7F6F2] divide-x divide-[#111110] overflow-x-auto no-scrollbar max-w-full">
                {[
                  { id: 'trajectory', label: '01. Trajectory', icon: Activity },
                  { id: 'sunk', label: '02. Sunk vs. Equity', icon: BarChart2 },
                  { id: 'cashflow', label: '03. Cashflow', icon: Sliders },
                  { id: 'sensitivity', label: '04. Parity Solver', icon: Target },
                  { id: 'ledger', label: '05. Annual Ledger', icon: Table },
                  { id: 'montecarlo', label: '06. Monte Carlo', icon: TrendingUp },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-2 text-xs font-mono-tabular uppercase tracking-wider flex items-center gap-1.5 transition-colors shrink-0 ${
                        active
                          ? 'bg-[#111110] text-[#F7F6F2] font-bold'
                          : 'bg-[#F7F6F2] text-[#111110] hover:bg-[#ECEAE2]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Legend Key */}
              <div className="hidden sm:flex items-center gap-4 text-xs font-mono-tabular font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#14532D] inline-block border border-[#111110]" />
                  <span>BUYER REAL ESTATE</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#C83E2B] inline-block border border-[#111110]" />
                  <span>RENTER LIQUID S&P 500</span>
                </div>
              </div>
            </section>

            {/* ACTIVE VISUALIZATION WORKSPACE */}
            <section
              className={`p-4 sm:p-8 bg-[#F7F6F2] ${
                mobileSection === 'analysis' ? 'block' : 'hidden lg:block'
              }`}
            >
              {activeTab === 'trajectory' && (
                <ArchitecturalTrajectoryChart
                  yearlyData={yearlyData}
                  crossoverMonth={crossoverMonth}
                  inspectedYear={inspectedYear}
                  onSelectYear={setInspectedYear}
                  hoveredIndex={hoveredIndex}
                  setHoveredIndex={setHoveredIndex}
                />
              )}

              {activeTab === 'sunk' && (
                <ArchitecturalSunkWaterfall
                  record={inspectedRecord}
                  inspectedYear={inspectedYear}
                  params={params}
                />
              )}

              {activeTab === 'cashflow' && (
                <ArchitecturalCashflowSchedule
                  yearlyData={yearlyData}
                  inspectedYear={inspectedYear}
                  onSelectYear={setInspectedYear}
                />
              )}

              {activeTab === 'sensitivity' && (
                <ArchitecturalSensitivitySolver
                  params={params}
                  thresholds={sensitivityThresholds}
                  onApplyValue={(key, val) => {
                    updateParam(key, val);
                    showToast(`Applied break-even ${key}`);
                  }}
                />
              )}

              {activeTab === 'ledger' && (
                <ArchitecturalLedgerTable
                  yearlyData={yearlyData}
                  inspectedYear={inspectedYear}
                  onSelectYear={setInspectedYear}
                  onExportCSV={exportLedgerCSV}
                />
              )}

              {activeTab === 'montecarlo' && (
                <MonteCarloWorkspace
                  mcResults={mcResults}
                  mcParams={mcParams}
                  onUpdateMcParams={(k, v) => setMcParams(p => ({ ...p, [k]: Number(v) }))}
                  onReSimulate={() => setMcSeed(s => s + 1)}
                  timelineYears={params.timelineYears}
                  inspectedYear={inspectedYear}
                  onSelectYear={setInspectedYear}
                />
              )}
            </section>

            {/* TIME MACHINE SCRUBBER & DOUBLE-ENTRY BALANCE SHEET AUDIT */}
            <section
              className={`p-4 sm:p-8 bg-[#ECEAE2]/70 flex-1 space-y-6 ${
                mobileSection === 'audit' || mobileSection === 'analysis' ? 'block' : 'hidden lg:block'
              }`}
            >
              
              {/* Scrubber Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#111110]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-tabular text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 bg-[#111110] text-[#F7F6F2]">
                      AUDIT CURSOR // YEAR {inspectedYear} (MO. {inspectedYear * 12})
                    </span>
                    <span className="font-mono-tabular text-xs text-[#3F3E3A] font-medium">
                      Spread:{' '}
                      <strong className="text-[#111110]">
                        {inspectedRecord.buyerNetWorth >= inspectedRecord.renterNetWorth
                          ? `Buyer +${formatCurrency(inspectedRecord.buyerNetWorth - inspectedRecord.renterNetWorth)}`
                          : `Renter +${formatCurrency(inspectedRecord.renterNetWorth - inspectedRecord.buyerNetWorth)}`}
                      </strong>
                    </span>
                  </div>
                  <h3 className="font-serif-editorial text-2xl sm:text-3xl text-[#111110] mt-1">
                    Double-Entry Balance Sheet & Sunk Cost Audit
                  </h3>
                </div>

                {/* Year Selector */}
                <div className="flex items-center border border-[#111110] bg-[#F7F6F2] divide-x divide-[#111110] self-start overflow-x-auto max-w-full">
                  <button
                    onClick={() => setInspectedYear(Math.max(1, inspectedYear - 1))}
                    className="p-2.5 hover:bg-[#ECEAE2] transition-colors"
                    title="Previous Year"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  {[1, 3, 5, 7, 10, params.timelineYears]
                    .filter((v, i, a) => v <= params.timelineYears && a.indexOf(v) === i)
                    .map((yr) => (
                      <button
                        key={yr}
                        onClick={() => setInspectedYear(yr)}
                        className={`px-3 py-2 font-mono-tabular text-xs transition-colors ${
                          inspectedYear === yr
                            ? 'bg-[#111110] text-[#F7F6F2] font-bold'
                            : 'hover:bg-[#ECEAE2] text-[#111110]'
                        }`}
                      >
                        Y{yr}
                      </button>
                    ))}
                  <button
                    onClick={() => setInspectedYear(Math.min(params.timelineYears, inspectedYear + 1))}
                    className="p-2.5 hover:bg-[#ECEAE2] transition-colors"
                    title="Next Year"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Timeline Slider */}
              <div>
                <input
                  type="range"
                  min={1}
                  max={params.timelineYears}
                  value={inspectedYear}
                  onChange={(e) => setInspectedYear(Number(e.target.value))}
                  className="arch-slider"
                />
                <div className="flex justify-between font-mono-tabular text-[11px] font-semibold uppercase text-[#3F3E3A] mt-1">
                  <span>Year 01 (Mo 12)</span>
                  <span>Midpoint: Year {Math.ceil(params.timelineYears / 2)}</span>
                  <span>Horizon: Year {params.timelineYears} (Mo {params.timelineYears * 12})</span>
                </div>
              </div>

              {/* Two-Column Accounting Ledger Audit */}
              <div className="grid grid-cols-1 md:grid-cols-2 border-2 border-[#111110] bg-[#F7F6F2] divide-y md:divide-y-0 md:divide-x-2 divide-[#111110]">
                
                {/* Column A: Buyer Accounting */}
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#111110]">
                    <div>
                      <span className="font-mono-tabular text-[11px] uppercase tracking-widest text-[#14532D] font-bold block">
                        LEDGER A // REAL ESTATE OWNER ({DEBT_STRUCTURES[params.debtStructure]?.code})
                      </span>
                      <h4 className="font-serif-editorial text-xl text-[#111110]">
                        Year {inspectedYear} Equity & Carrying Statement
                      </h4>
                    </div>
                    <span className="font-mono-tabular text-base font-bold text-[#14532D] px-2.5 py-1 bg-[#14532D]/10 border border-[#14532D]">
                      {formatCurrency(inspectedRecord.buyerNetWorth)}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <LedgerEntry
                      label="Estimated Market Value of Property"
                      note={`+${formatCurrency(inspectedRecord.homeValue - params.homePrice, true)} appreciation over basis`}
                      value={formatCurrency(inspectedRecord.homeValue)}
                      highlight="positive"
                    />
                    <LedgerEntry
                      label="Less: Outstanding Mortgage Principal"
                      note={`${formatCurrency(inspectedRecord.cumPrincipal, true)} amortized to date`}
                      value={`(${formatCurrency(inspectedRecord.loanBalance)})`}
                    />
                    <LedgerEntry
                      label={`Less: Disposition & Broker Friction (${params.sellClosingPct}%)`}
                      note="Transaction liquidation haircut"
                      value={`(${formatCurrency(inspectedRecord.sellingCosts)})`}
                      highlight="negative"
                    />

                    <div className="my-3 border-t border-dashed border-[#111110]/50 pt-3 space-y-2.5">
                      <LedgerEntry
                        label="Cumulative Gross Carrying Costs"
                        note={`Interest + Prop Tax + HOA + Maint${inspectedRecord.cumPMI > 0 ? ' + PMI' : ''}`}
                        value={formatCurrency(inspectedRecord.buyerTotalSunk + inspectedRecord.cumTaxSavings)}
                      />
                      <LedgerEntry
                        label={`Less: Cumulative Tax Shield (${params.taxState})`}
                        note="Incremental federal & state deduction alpha"
                        value={`-${formatCurrency(inspectedRecord.cumTaxSavings)}`}
                        highlight="positive"
                      />
                      <LedgerEntry
                        label="Net Unrecoverable Sunk Cost"
                        value={formatCurrency(inspectedRecord.buyerTotalSunk)}
                        bold
                      />
                    </div>

                    <div className="pt-2.5 border-t border-[#111110] flex items-center justify-between font-mono-tabular text-xs">
                      <span className="uppercase text-[#3F3E3A] font-semibold">Year {inspectedYear} Net Outflow:</span>
                      <span className="font-bold text-[#111110]">{formatCurrency(inspectedRecord.monthlyBuyerOutflow)}/mo</span>
                    </div>
                  </div>
                </div>

                {/* Column B: Renter Accounting */}
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#111110]">
                    <div>
                      <span className="font-mono-tabular text-[11px] uppercase tracking-widest text-[#C83E2B] font-bold block">
                        LEDGER B // LIQUID INDEX INVESTOR
                      </span>
                      <h4 className="font-serif-editorial text-xl text-[#111110]">
                        Year {inspectedYear} Portfolio & Lease Statement
                      </h4>
                    </div>
                    <span className="font-mono-tabular text-base font-bold text-[#C83E2B] px-2.5 py-1 bg-[#C83E2B]/10 border border-[#C83E2B]">
                      {formatCurrency(inspectedRecord.renterNetWorth)}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <LedgerEntry
                      label="Initial Capital Deployed (Day 1)"
                      note="Down payment + avoided acquisition closing friction"
                      value={formatCurrency(simulation.downPayment + simulation.buyClosingCosts)}
                    />
                    <LedgerEntry
                      label="Cumulative Monthly Cashflow Delta Added"
                      note="Monthly savings vs. ownership carrying cost invested"
                      value={formatCurrency(
                        inspectedRecord.cumRenterContributions -
                          (simulation.downPayment + simulation.buyClosingCosts)
                      )}
                    />
                    <LedgerEntry
                      label={`Compound Index Appreciation (${params.investmentReturnRate}%/yr)`}
                      note="Untapped liquid market equity gains"
                      value={`+${formatCurrency(inspectedRecord.renterInvestmentGains)}`}
                      highlight="positive"
                    />

                    <div className="my-3 border-t border-dashed border-[#111110]/50 pt-3 space-y-2.5">
                      <LedgerEntry
                        label="Total Contributed Principal Basis"
                        note="Day 1 capital + cumulative monthly additions"
                        value={formatCurrency(inspectedRecord.cumRenterContributions)}
                      />
                      <LedgerEntry
                        label="Property Tax, HOA & Maintenance Drag"
                        note="Zero ownership structural liability"
                        value="$0"
                      />
                      <LedgerEntry
                        label="Net Unrecoverable Lease Sunk Cost"
                        value={formatCurrency(inspectedRecord.cumRentPaid)}
                        bold
                      />
                    </div>

                    <div className="pt-2.5 border-t border-[#111110] flex items-center justify-between font-mono-tabular text-xs">
                      <span className="uppercase text-[#3F3E3A] font-semibold">Year {inspectedYear} Lease Outflow:</span>
                      <span className="font-bold text-[#111110]">{formatCurrency(inspectedRecord.monthlyRent)}/mo</span>
                    </div>
                  </div>
                </div>

              </div>

            </section>

          </main>

        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111110] text-[#F7F6F2] border-t-2 border-[#111110] grid grid-cols-3 divide-x divide-[#F7F6F2]/20 font-mono-tabular">
        <button
          onClick={() => setMobileSection('inputs')}
          className={`py-3 px-2 flex flex-col items-center justify-center gap-1 text-[11px] uppercase tracking-wider ${
            mobileSection === 'inputs' ? 'bg-[#C83E2B] text-[#F7F6F2] font-bold' : 'text-[#ECEAE2]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>1. Controls</span>
        </button>
        <button
          onClick={() => setMobileSection('analysis')}
          className={`py-3 px-2 flex flex-col items-center justify-center gap-1 text-[11px] uppercase tracking-wider ${
            mobileSection === 'analysis' ? 'bg-[#14532D] text-[#F7F6F2] font-bold' : 'text-[#ECEAE2]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>2. Verdict</span>
        </button>
        <button
          onClick={() => setMobileSection('audit')}
          className={`py-3 px-2 flex flex-col items-center justify-center gap-1 text-[11px] uppercase tracking-wider ${
            mobileSection === 'audit' ? 'bg-[#C83E2B] text-[#F7F6F2] font-bold' : 'text-[#ECEAE2]'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>3. Audit Y{inspectedYear}</span>
        </button>
      </nav>
    </div>
  );
}

// --- ARCHITECTURAL SUB-COMPONENTS ---

function TactileParameter({
  code,
  label,
  value,
  min,
  max,
  step,
  prefix,
  suffix,
  display,
  sub,
  compact = false,
  onChange
}: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftVal, setDraftVal] = useState(String(value));

  useEffect(() => {
    setDraftVal(String(value));
  }, [value]);

  const commitEdit = () => {
    setIsEditing(false);
    const parsed = Number(draftVal);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    }
  };

  return (
    <div className={`space-y-1 ${compact ? 'text-xs' : 'text-sm'}`}>
      <div className="flex items-baseline justify-between gap-2">
        <label className="font-mono-tabular text-[11px] font-semibold text-[#3F3E3A] flex items-center gap-1 truncate">
          <span className="text-[#111110] font-bold">{code}</span>
          <span className="truncate">{label}</span>
        </label>
        {isEditing ? (
          <input
            type="number"
            value={draftVal}
            onChange={(e) => setDraftVal(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
            autoFocus
            className="w-24 px-1 py-0.5 border border-[#111110] font-mono-tabular font-bold text-xs bg-[#F7F6F2] text-right outline-none"
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className="font-mono-tabular font-bold text-[#111110] hover:text-[#C83E2B] cursor-pointer underline decoration-dotted decoration-[#111110]/50"
            title="Click to type exact figure"
          >
            {display}
          </span>
        )}
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="arch-slider"
      />

      {sub && (
        <div className="font-mono-tabular text-[10px] text-[#3F3E3A] text-right">
          {sub}
        </div>
      )}
    </div>
  );
}

function MechanicalSwitch({ active, onClick, code, title, desc, tag }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3.5 text-left transition-colors flex items-start justify-between gap-3 ${
        active ? 'bg-[#F7F6F2]' : 'bg-[#ECEAE2]/40 hover:bg-[#ECEAE2]'
      }`}
    >
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono-tabular text-[10px] font-bold px-1.5 py-0.2 bg-[#111110] text-[#F7F6F2]">
            {code}
          </span>
          <span className="font-bold text-xs text-[#111110]">{title}</span>
        </div>
        <p className="text-[11px] text-[#3F3E3A] leading-tight">{desc}</p>
      </div>
      <div className="text-right shrink-0 font-mono-tabular">
        <span
          className={`inline-block px-2 py-0.5 text-[10px] font-bold border ${
            active
              ? 'bg-[#14532D] text-[#F7F6F2] border-[#14532D]'
              : 'bg-[#ECEAE2] text-[#3F3E3A] border-[#111110]/30'
          }`}
        >
          {active ? 'ENGAGED' : 'BYPASSED'}
        </span>
        <span className="text-[11px] font-bold block mt-1">{tag}</span>
      </div>
    </button>
  );
}

function LedgerEntry({
  label,
  note,
  value,
  highlight,
  bold
}: {
  label: string;
  note?: string;
  value: string;
  highlight?: 'positive' | 'negative' | string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <div>
        <div className={`${bold ? 'font-bold text-[#111110]' : 'font-medium text-[#111110]'}`}>{label}</div>
        {note && <div className="text-[11px] text-[#3F3E3A] font-mono-tabular">{note}</div>}
      </div>
      <div
        className={`font-mono-tabular shrink-0 ${bold ? 'font-bold text-sm' : 'font-bold'} ${
          highlight === 'positive'
            ? 'text-[#14532D]'
            : highlight === 'negative'
            ? 'text-[#C83E2B]'
            : 'text-[#111110]'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

// --- TAB 01: ARCHITECTURAL DRAFTING NET WORTH TRAJECTORY CHART ---
function ArchitecturalTrajectoryChart({
  yearlyData,
  crossoverMonth,
  inspectedYear,
  onSelectYear,
  hoveredIndex,
  setHoveredIndex,
}: any) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const width = 820;
  const height = 360;
  const padLeft = 76;
  const padRight = 28;
  const padTop = 32;
  const padBottom = 46;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const allValues = yearlyData.flatMap((d) => [d.buyerNetWorth, d.renterNetWorth, 0]);
  const minVal = Math.min(0, ...allValues);
  const maxVal = Math.max(100000, ...allValues) * 1.1;

  const getX = (index) => {
    if (yearlyData.length <= 1) return padLeft;
    return padLeft + (index / (yearlyData.length - 1)) * plotW;
  };

  const getY = (val) => {
    const ratio = (val - minVal) / (maxVal - minVal || 1);
    return padTop + plotH - ratio * plotH;
  };

  const buyerPoints = yearlyData.map((d, i) => `${getX(i)},${getY(d.buyerNetWorth)}`).join(' ');
  const renterPoints = yearlyData.map((d, i) => `${getX(i)},${getY(d.renterNetWorth)}`).join(' ');
  const buyerArea = `${getX(0)},${getY(0)} ${buyerPoints} ${getX(yearlyData.length - 1)},${getY(0)}`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => minVal + t * (maxVal - minVal));

  const crossoverYearFloat = crossoverMonth ? crossoverMonth / 12 : null;
  let crossoverCoords = null;
  if (crossoverYearFloat && crossoverYearFloat <= yearlyData.length) {
    const idx = Math.min(yearlyData.length - 1, Math.max(0, Math.ceil(crossoverYearFloat) - 1));
    crossoverCoords = {
      x: getX(idx),
      y: getY(yearlyData[idx].buyerNetWorth),
      year: Math.ceil(crossoverYearFloat),
    };
  }

  const activeIdx = hoveredIndex !== null ? hoveredIndex : Math.min(yearlyData.length - 1, inspectedYear - 1);
  const activeRecord = yearlyData[activeIdx] || yearlyData[yearlyData.length - 1];

  const handleTouchMove = (e) => {
    if (!svgRef.current || !e.touches[0]) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = e.touches[0].clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, relX / rect.width));
    const idx = Math.round(ratio * (yearlyData.length - 1));
    if (yearlyData[idx]) {
      setHoveredIndex(idx);
      onSelectYear(yearlyData[idx].year);
    }
  };

  return (
    <div className="space-y-4">
      {/* Precision Drafting Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-2 border-[#111110] bg-[#ECEAE2] font-mono-tabular text-xs">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 bg-[#111110] text-[#F7F6F2] font-bold">
            YEAR {activeRecord.year} TELEMETRY
          </span>
          <span className="text-[#3F3E3A] font-medium hidden sm:inline">
            Tap or drag across nodes to scrub Balance Sheet Audit
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <span>
            BUYER: <strong className="text-[#14532D]">{formatCurrency(activeRecord.buyerNetWorth)}</strong>
          </span>
          <span>
            RENTER: <strong className="text-[#C83E2B]">{formatCurrency(activeRecord.renterNetWorth)}</strong>
          </span>
          <span className="px-2 py-0.5 border border-[#111110] bg-[#F7F6F2] font-bold">
            {activeRecord.buyerNetWorth >= activeRecord.renterNetWorth ? 'BUYER +' : 'RENTER +'}
            {formatCurrency(Math.abs(activeRecord.buyerNetWorth - activeRecord.renterNetWorth))}
          </span>
        </div>
      </div>

      {/* Architectural SVG Drafting Plot */}
      <div className="border-2 border-[#111110] bg-[#F7F6F2] p-2 sm:p-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible touch-pan-y"
          onMouseLeave={() => setHoveredIndex(null)}
          onTouchStart={handleTouchMove}
          onTouchMove={handleTouchMove}
        >
          <defs>
            <pattern id="diagonalHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#14532D" strokeWidth="1.25" strokeOpacity="0.22" />
            </pattern>
          </defs>

          {/* Horizontal Grid Lines */}
          {yTicks.map((tick, i) => {
            const y = getY(tick);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#111110"
                  strokeOpacity={tick === 0 ? '0.85' : '0.2'}
                  strokeDasharray={tick === 0 ? 'none' : '3 3'}
                  strokeWidth={tick === 0 ? 1.5 : 1}
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#111110] text-[12px] font-bold font-mono-tabular"
                >
                  {formatCurrency(tick, true)}
                </text>
              </g>
            );
          })}

          {/* Vertical Year Rulings */}
          {yearlyData.map((d, i) => {
            const x = getX(i);
            return (
              <line
                key={d.year}
                x1={x}
                y1={padTop}
                x2={x}
                y2={height - padBottom}
                stroke="#111110"
                strokeOpacity="0.1"
                strokeWidth="1"
              />
            );
          })}

          {/* Buyer Hatched Fill Area */}
          <polygon points={buyerArea} fill="url(#diagonalHatch)" />

          {/* Renter Line */}
          <polyline
            fill="none"
            stroke="#C83E2B"
            strokeWidth="3.25"
            points={renterPoints}
          />

          {/* Buyer Line */}
          <polyline
            fill="none"
            stroke="#14532D"
            strokeWidth="3.5"
            points={buyerPoints}
          />

          {/* Active Inspection Hairline */}
          <line
            x1={getX(activeIdx)}
            y1={padTop}
            x2={getX(activeIdx)}
            y2={height - padBottom}
            stroke="#111110"
            strokeWidth="1.75"
            strokeDasharray="4 2"
          />

          {/* Break-Even Crossover Callout */}
          {crossoverCoords && (
            <g>
              <circle
                cx={crossoverCoords.x}
                cy={crossoverCoords.y}
                r="7"
                fill="#F7F6F2"
                stroke="#111110"
                strokeWidth="2.5"
              />
              <rect
                x={Math.min(width - 156, Math.max(padLeft, crossoverCoords.x - 72))}
                y={Math.max(padTop, crossoverCoords.y - 38)}
                width="144"
                height="24"
                fill="#111110"
              />
              <text
                x={Math.min(width - 84, Math.max(padLeft + 72, crossoverCoords.x))}
                y={Math.max(padTop + 15, crossoverCoords.y - 22)}
                textAnchor="middle"
                className="fill-[#F7F6F2] text-[11px] font-mono-tabular font-bold"
              >
                CROSSOVER // MO. {crossoverMonth}
              </text>
            </g>
          )}

          {/* Year Nodes */}
          {yearlyData.map((d, i) => {
            const cx = getX(i);
            const by = getY(d.buyerNetWorth);
            const ry = getY(d.renterNetWorth);
            const isSelected = i === activeIdx;

            return (
              <g
                key={d.year}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onClick={() => onSelectYear(d.year)}
              >
                <rect
                  x={cx - plotW / yearlyData.length / 2}
                  y={padTop}
                  width={plotW / yearlyData.length}
                  height={plotH}
                  fill="transparent"
                />

                {/* Renter Marker */}
                <rect
                  x={cx - (isSelected ? 5.5 : 3.5)}
                  y={ry - (isSelected ? 5.5 : 3.5)}
                  width={isSelected ? 11 : 7}
                  height={isSelected ? 11 : 7}
                  fill={isSelected ? '#C83E2B' : '#F7F6F2'}
                  stroke="#C83E2B"
                  strokeWidth="2.25"
                />

                {/* Buyer Marker */}
                <circle
                  cx={cx}
                  cy={by}
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? '#14532D' : '#F7F6F2'}
                  stroke="#14532D"
                  strokeWidth="2.25"
                />

                {/* X-Axis Labels */}
                {(yearlyData.length <= 15 || d.year % 2 === 0 || d.year === 1 || d.year === yearlyData.length) && (
                  <text
                    x={cx}
                    y={height - 14}
                    textAnchor="middle"
                    className={`text-[12px] font-mono-tabular ${
                      isSelected ? 'fill-[#111110] font-bold underline' : 'fill-[#3F3E3A] font-semibold'
                    }`}
                  >
                    Y{d.year}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// --- TAB 02: SUNK COST VS. EQUITY WATERFALL ---
function ArchitecturalSunkWaterfall({ record, inspectedYear, params }) {
  const buyerSunkItems = [
    { code: 'S-01', label: 'Mortgage Interest & PMI Paid', val: record.cumInterest + record.cumPMI },
    { code: 'S-02', label: 'Property Tax Assessments', val: record.cumPropertyTax },
    { code: 'S-03', label: 'Maintenance & Hazard Insurance', val: record.cumMaintenance },
    { code: 'S-04', label: 'HOA Dues & Special Assessments', val: record.cumHOA + record.cumRefiAndShockCosts },
    { code: 'S-05', label: 'Acquisition & Disposition Fees', val: record.buyClosingCosts + record.sellingCosts },
  ];

  const grossBuyerSunk = buyerSunkItems.reduce((acc, i) => acc + i.val, 0);
  const scaleMax = Math.max(grossBuyerSunk, record.cumRentPaid, record.buyerNetWorth, record.renterNetWorth, 100000);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 border-2 border-[#111110] divide-y md:divide-y-0 md:divide-x-2 divide-[#111110]">
        
        {/* Left: Unrecoverable Capital Burn */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#111110]">
            <span className="font-mono-tabular text-xs uppercase font-bold text-[#111110]">
              01 // UNRECOVERABLE SUNK CAPITAL (YR {inspectedYear})
            </span>
            <span className="font-mono-tabular text-[11px] font-semibold text-[#3F3E3A]">Lower Burn = Superior</span>
          </div>

          <div className="space-y-3">
            {buyerSunkItems.map((item) => {
              const pct = Math.min(100, Math.max(1, (item.val / scaleMax) * 100));
              return (
                <div key={item.code} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono-tabular">
                    <span className="text-[#3F3E3A] font-medium">
                      <strong className="text-[#111110]">{item.code}</strong> {item.label}
                    </span>
                    <span className="font-bold text-[#111110]">{formatCurrency(item.val)}</span>
                  </div>
                  <div className="w-full h-3 bg-[#ECEAE2] border border-[#111110]">
                    <div style={{ width: `${pct}%` }} className="h-full bg-[#111110]" />
                  </div>
                </div>
              );
            })}

            <div className="pt-2 border-t border-[#111110]/30 flex justify-between text-xs font-mono-tabular text-[#14532D] font-bold">
              <span>LESS: CUMULATIVE TAX SHIELD REBATE</span>
              <span>-{formatCurrency(record.cumTaxSavings)}</span>
            </div>

            <div className="p-3 bg-[#ECEAE2] border border-[#111110] flex justify-between items-center font-mono-tabular">
              <span className="text-xs font-bold uppercase">BUYER NET SUNK CAPITAL</span>
              <span className="text-base font-bold text-[#111110]">{formatCurrency(record.buyerTotalSunk)}</span>
            </div>

            <div className="pt-3 space-y-1.5">
              <div className="flex justify-between text-xs font-mono-tabular">
                <span className="text-[#C83E2B] font-bold">R-01 // CUMULATIVE LEASE PAYMENTS</span>
                <span className="font-bold text-[#C83E2B]">{formatCurrency(record.cumRentPaid)}</span>
              </div>
              <div className="w-full h-3.5 bg-[#ECEAE2] border border-[#111110]">
                <div
                  style={{ width: `${Math.min(100, (record.cumRentPaid / scaleMax) * 100)}%` }}
                  className="h-full bg-[#C83E2B]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Retained Net Worth Accumulation */}
        <div className="p-4 sm:p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#111110]">
              <span className="font-mono-tabular text-xs uppercase font-bold text-[#111110]">
                02 // RETAINED LIQUID NET WORTH (YR {inspectedYear})
              </span>
              <span className="font-mono-tabular text-[11px] font-semibold text-[#3F3E3A]">Higher Equity = Superior</span>
            </div>

            {/* Buyer Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold uppercase font-mono-tabular text-[#14532D]">
                  BUYER NET LIQUID EQUITY (POST-{params.sellClosingPct}% EXIT)
                </span>
                <span className="font-mono-tabular text-lg font-bold text-[#14532D]">
                  {formatCurrency(record.buyerNetWorth)}
                </span>
              </div>
              <div className="w-full h-5 bg-[#ECEAE2] border border-[#111110]">
                <div
                  style={{ width: `${Math.max(0, Math.min(100, (record.buyerNetWorth / scaleMax) * 100))}%` }}
                  className="h-full bg-[#14532D]"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono-tabular text-[11px]">
                <div className="p-2 border border-[#111110] bg-[#ECEAE2]/50">
                  <span className="text-[#3F3E3A] font-semibold block text-[10px]">DOWN PAYMENT</span>
                  <span className="font-bold">{formatCurrency(record.downPayment, true)}</span>
                </div>
                <div className="p-2 border border-[#111110] bg-[#ECEAE2]/50">
                  <span className="text-[#3F3E3A] font-semibold block text-[10px]">PRINCIPAL PAID</span>
                  <span className="font-bold">{formatCurrency(record.cumPrincipal, true)}</span>
                </div>
                <div className="p-2 border border-[#111110] bg-[#ECEAE2]/50">
                  <span className="text-[#3F3E3A] font-semibold block text-[10px]">APPRECIATION</span>
                  <span className="font-bold text-[#14532D]">
                    +{formatCurrency(record.homeValue - params.homePrice, true)}
                  </span>
                </div>
              </div>
            </div>

            {/* Renter Bar */}
            <div className="space-y-2 pt-4 border-t border-[#111110]/30">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold uppercase font-mono-tabular text-[#C83E2B]">
                  RENTER S&P 500 COMPOUND PORTFOLIO
                </span>
                <span className="font-mono-tabular text-lg font-bold text-[#C83E2B]">
                  {formatCurrency(record.renterNetWorth)}
                </span>
              </div>
              <div className="w-full h-5 bg-[#ECEAE2] border border-[#111110]">
                <div
                  style={{ width: `${Math.max(0, Math.min(100, (record.renterNetWorth / scaleMax) * 100))}%` }}
                  className="h-full bg-[#C83E2B]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono-tabular text-[11px]">
                <div className="p-2 border border-[#111110] bg-[#ECEAE2]/50">
                  <span className="text-[#3F3E3A] font-semibold block text-[10px]">CONTRIBUTED BASIS</span>
                  <span className="font-bold">{formatCurrency(record.cumRenterContributions, true)}</span>
                </div>
                <div className="p-2 border border-[#111110] bg-[#ECEAE2]/50">
                  <span className="text-[#3F3E3A] font-semibold block text-[10px]">COMPOUND MARKET GAIN</span>
                  <span className="font-bold text-[#C83E2B]">
                    +{formatCurrency(record.renterInvestmentGains, true)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 border border-[#111110] bg-[#ECEAE2] text-xs font-mono-tabular flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">CAPITAL EFFICIENCY (NET WEALTH / SUNK COST):</span>
            <span className="font-bold">
              BUYER {(record.buyerNetWorth / Math.max(1, record.buyerTotalSunk)).toFixed(2)}x vs. RENTER{' '}
              {(record.renterNetWorth / Math.max(1, record.cumRentPaid)).toFixed(2)}x
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- TAB 03: MONTHLY CASHFLOW OUTFLOW SCHEDULE ---
function ArchitecturalCashflowSchedule({ yearlyData, inspectedYear, onSelectYear }) {
  const maxMonthly = Math.max(
    ...yearlyData.flatMap((d) => [d.monthlyBuyerOutflow, d.monthlyRent]),
    1000
  ) * 1.15;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tabular font-semibold text-[#3F3E3A]">
        <span>
          MONTHLY NET CASH OUTFLOW // BUYER (P&I + TAX + HOA + MAINT - TAX SHIELD) VS. RENTER LEASE
        </span>
        <span>TAP ANY COLUMN TO INSPECT YEAR</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 border-2 border-[#111110] divide-y sm:divide-y-0 sm:divide-x divide-[#111110] bg-[#F7F6F2]">
        {yearlyData.slice(0, 10).map((d) => {
          const buyerH = Math.max(6, (d.monthlyBuyerOutflow / maxMonthly) * 140);
          const rentH = Math.max(6, (d.monthlyRent / maxMonthly) * 140);
          const selected = d.year === inspectedYear;

          return (
            <div
              key={d.year}
              onClick={() => onSelectYear(d.year)}
              className={`p-3 cursor-pointer transition-colors flex flex-col items-center ${
                selected ? 'bg-[#ECEAE2]' : 'hover:bg-[#ECEAE2]/50'
              }`}
            >
              <div className="w-full flex items-center justify-between font-mono-tabular text-[11px] pb-2 mb-2 border-b border-[#111110]/30">
                <span className="font-bold text-[#111110]">YR {d.year}</span>
                {selected && <span className="w-2 h-2 bg-[#111110]" />}
              </div>

              <div className="h-36 flex items-end justify-center gap-2 w-full border-b border-[#111110] pb-1">
                <div
                  style={{ height: `${buyerH}px` }}
                  className="w-4 bg-[#14532D] border border-[#111110]"
                  title={`Buyer: ${formatCurrency(d.monthlyBuyerOutflow)}/mo`}
                />
                <div
                  style={{ height: `${rentH}px` }}
                  className="w-4 bg-[#C83E2B] border border-[#111110]"
                  title={`Renter: ${formatCurrency(d.monthlyRent)}/mo`}
                />
              </div>

              <div className="w-full pt-2 space-y-0.5 font-mono-tabular text-[11px] text-right">
                <div className="text-[#14532D] font-bold">{formatCurrency(d.monthlyBuyerOutflow)}</div>
                <div className="text-[#C83E2B] font-bold">{formatCurrency(d.monthlyRent)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- TAB 04: AUTOMATED BREAK-EVEN SENSITIVITY SOLVER ---
function ArchitecturalSensitivitySolver({ params, thresholds, onApplyValue }) {
  const cards = [
    {
      code: 'SOL-01',
      title: 'Maximum Break-Even Purchase Price',
      currentLabel: 'Current Purchase Price',
      currentValue: formatCurrency(params.homePrice),
      thresholdLabel: `Exact Year-${params.timelineYears} Parity Price`,
      thresholdValue: formatCurrency(thresholds.maxHomePrice),
      rawThreshold: Math.round(thresholds.maxHomePrice / 1000) * 1000,
      paramKey: 'homePrice',
      explanation: `If you pay less than ${formatCurrency(thresholds.maxHomePrice)}, buying beats renting + indexing over ${params.timelineYears} years.`,
    },
    {
      code: 'SOL-02',
      title: 'Parity Monthly Rent Equivalent',
      currentLabel: 'Current Monthly Rent',
      currentValue: `${formatCurrency(params.monthlyRent)}/mo`,
      thresholdLabel: `Exact Year-${params.timelineYears} Parity Rent`,
      thresholdValue: `${formatCurrency(thresholds.minMonthlyRent)}/mo`,
      rawThreshold: Math.round(thresholds.minMonthlyRent / 25) * 25,
      paramKey: 'monthlyRent',
      explanation: `If comparable market rent exceeds ${formatCurrency(thresholds.minMonthlyRent)}/mo, buying becomes the superior wealth builder.`,
    },
    {
      code: 'SOL-03',
      title: 'Maximum Break-Even Mortgage Rate',
      currentLabel: 'Current Benchmark Rate',
      currentValue: `${params.mortgageRate.toFixed(2)}%`,
      thresholdLabel: `Exact Year-${params.timelineYears} Parity Rate`,
      thresholdValue: `${thresholds.maxMortgageRate.toFixed(2)}%`,
      rawThreshold: Number(thresholds.maxMortgageRate.toFixed(2)),
      paramKey: 'mortgageRate',
      explanation: `Buying outperforms renting as long as benchmark mortgage rates stay below ${thresholds.maxMortgageRate.toFixed(2)}%.`,
    },
    {
      code: 'SOL-04',
      title: 'Required Annual Home Appreciation',
      currentLabel: 'Current Home Appreciation',
      currentValue: `${params.homeAppreciationRate.toFixed(1)}%/yr`,
      thresholdLabel: `Exact Year-${params.timelineYears} Parity Growth`,
      thresholdValue: `${thresholds.minAppreciationRate.toFixed(2)}%/yr`,
      rawThreshold: Number(thresholds.minAppreciationRate.toFixed(1)),
      paramKey: 'homeAppreciationRate',
      explanation: `Your property must appreciate by at least ${thresholds.minAppreciationRate.toFixed(2)}%/yr to match the ${params.investmentReturnRate}%/yr equity index.`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="p-3 border-2 border-[#111110] bg-[#ECEAE2] flex flex-wrap items-center justify-between gap-2 font-mono-tabular text-xs">
        <span className="font-bold text-[#111110]">
          ALGORITHMIC PARITY SOLVER // ISOLATES EXACT THRESHOLDS WHERE BUYING = RENTING AT YEAR {params.timelineYears}
        </span>
        <span className="text-[#3F3E3A]">22-ITERATION BINARY SEARCH</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div
            key={c.code}
            className="border-2 border-[#111110] bg-[#F7F6F2] p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono-tabular text-[11px] font-bold uppercase px-2 py-0.5 bg-[#111110] text-[#F7F6F2]">
                  {c.code}
                </span>
                <button
                  onClick={() => onApplyValue(c.paramKey, c.rawThreshold)}
                  className="font-mono-tabular text-[11px] font-bold uppercase px-2.5 py-1 border border-[#111110] bg-[#ECEAE2] hover:bg-[#111110] hover:text-[#F7F6F2] transition-colors"
                >
                  Apply Parity Value →
                </button>
              </div>
              <h4 className="font-serif-editorial text-2xl text-[#111110]">{c.title}</h4>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 border border-[#111110] bg-[#ECEAE2]/60 font-mono-tabular">
              <div>
                <span className="text-[10px] uppercase text-[#3F3E3A] font-semibold block">
                  {c.currentLabel}
                </span>
                <span className="text-base font-bold text-[#111110]">{c.currentValue}</span>
              </div>
              <div className="border-l border-[#111110]/30 pl-3">
                <span className="text-[10px] uppercase text-[#14532D] font-bold block">
                  {c.thresholdLabel}
                </span>
                <span className="text-base font-bold text-[#14532D]">{c.thresholdValue}</span>
              </div>
            </div>

            <p className="text-xs text-[#3F3E3A] leading-relaxed">{c.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- TAB 05: FULL ANNUAL AMORTIZATION & OPPORTUNITY LEDGER TABLE ---
function ArchitecturalLedgerTable({ yearlyData, inspectedYear, onSelectYear, onExportCSV }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tabular font-semibold text-[#3F3E3A]">
        <span>COMPLETE ANNUAL AUDIT SCHEDULE // TAP ANY ROW TO LOCK BALANCE SHEET</span>
        <button
          onClick={onExportCSV}
          className="px-2.5 py-1 border border-[#111110] bg-[#ECEAE2] text-[#111110] hover:bg-[#111110] hover:text-[#F7F6F2] font-bold uppercase flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto border-2 border-[#111110]">
        <table className="w-full text-left border-collapse font-mono-tabular text-xs">
          <thead>
            <tr className="border-b-2 border-[#111110] bg-[#111110] text-[#F7F6F2] text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3">Yr</th>
              <th className="py-2.5 px-3 text-right">Home Value</th>
              <th className="py-2.5 px-3 text-right">Loan Debt</th>
              <th className="py-2.5 px-3 text-right">Buyer Sunk</th>
              <th className="py-2.5 px-3 text-right">Buyer Net Worth</th>
              <th className="py-2.5 px-3 text-right">Rent Paid</th>
              <th className="py-2.5 px-3 text-right">Renter Portfolio</th>
              <th className="py-2.5 px-3 text-right">Net Spread</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#111110]/30">
            {yearlyData.map((row) => {
              const buyerLeads = row.buyerNetWorth >= row.renterNetWorth;
              const isSelected = row.year === inspectedYear;
              return (
                <tr
                  key={row.year}
                  onClick={() => onSelectYear(row.year)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#ECEAE2] font-bold' : 'hover:bg-[#ECEAE2]/50'
                  }`}
                >
                  <td className="py-2.5 px-3 border-r border-[#111110]/30 font-bold">
                    Y{String(row.year).padStart(2, '0')}
                  </td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(row.homeValue)}</td>
                  <td className="py-2.5 px-3 text-right text-[#3F3E3A]">{formatCurrency(row.loanBalance)}</td>
                  <td className="py-2.5 px-3 text-right text-[#3F3E3A]">{formatCurrency(row.buyerTotalSunk)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#14532D] bg-[#14532D]/10">
                    {formatCurrency(row.buyerNetWorth)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#3F3E3A]">{formatCurrency(row.cumRentPaid)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#C83E2B] bg-[#C83E2B]/10">
                    {formatCurrency(row.renterNetWorth)}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-bold ${
                      buyerLeads ? 'text-[#14532D]' : 'text-[#C83E2B]'
                    }`}
                  >
                    {buyerLeads ? 'BUY +' : 'RENT +'}
                    {formatCurrency(Math.abs(row.buyerNetWorth - row.renterNetWorth), true)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- TAB 06: MONTE CARLO STOCHASTIC PROBABILITY WORKSPACE ---
function MonteCarloWorkspace({
  mcResults,
  mcParams,
  onUpdateMcParams,
  onReSimulate,
  timelineYears,
  inspectedYear,
  onSelectYear
}) {
  const { winProbability, medianDiff, p10Diff, p90Diff, statsYearly, iterations } = mcResults;

  // SVG dimensions for Fan Chart
  const width = 820;
  const height = 360;
  const padLeft = 76;
  const padRight = 28;
  const padTop = 32;
  const padBottom = 46;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const allVals = statsYearly.flatMap(d => [
    d.buyer.p10, d.buyer.p90,
    d.renter.p10, d.renter.p90,
    0
  ]);
  const minVal = Math.min(0, ...allVals);
  const maxVal = Math.max(100000, ...allVals) * 1.1;

  const getX = (idx) => {
    if (statsYearly.length <= 1) return padLeft;
    return padLeft + (idx / (statsYearly.length - 1)) * plotW;
  };

  const getY = (val) => {
    const ratio = (val - minVal) / (maxVal - minVal || 1);
    return padTop + plotH - ratio * plotH;
  };

  // Polygon ribbons for 10th-90th percentiles
  const buyerTopPoints = statsYearly.map((d, i) => `${getX(i)},${getY(d.buyer.p90)}`).join(' ');
  const buyerBottomPoints = statsYearly.slice().reverse().map((d, i) => `${getX(statsYearly.length - 1 - i)},${getY(d.buyer.p10)}`).join(' ');
  const buyerRibbon = `${buyerTopPoints} ${buyerBottomPoints}`;

  const renterTopPoints = statsYearly.map((d, i) => `${getX(i)},${getY(d.renter.p90)}`).join(' ');
  const renterBottomPoints = statsYearly.slice().reverse().map((d, i) => `${getX(statsYearly.length - 1 - i)},${getY(d.renter.p10)}`).join(' ');
  const renterRibbon = `${renterTopPoints} ${renterBottomPoints}`;

  const buyerMedianPoints = statsYearly.map((d, i) => `${getX(i)},${getY(d.buyer.p50)}`).join(' ');
  const renterMedianPoints = statsYearly.map((d, i) => `${getX(i)},${getY(d.renter.p50)}`).join(' ');

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => minVal + t * (maxVal - minVal));

  const currStats = statsYearly[Math.min(statsYearly.length - 1, inspectedYear - 1)] || statsYearly[statsYearly.length - 1];

  return (
    <div className="space-y-6">
      {/* Stochastic Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-2 border-[#111110] bg-[#ECEAE2]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono-tabular text-[11px] font-bold uppercase px-2 py-0.5 bg-[#111110] text-[#F7F6F2]">
              STOCHASTIC ENGINE // {iterations} SIMULATED PATHS
            </span>
            <span className="text-xs font-mono-tabular text-[#3F3E3A]">Correlated Geometric Brownian Motion</span>
          </div>
          <h3 className="font-serif-editorial text-2xl sm:text-3xl text-[#111110] mt-1">
            Sequence of Returns & Market Volatility Stress
          </h3>
        </div>

        <button
          onClick={onReSimulate}
          className="px-3.5 py-2 border-2 border-[#111110] bg-[#111110] text-[#F7F6F2] hover:bg-[#14532D] transition-colors font-mono-tabular text-xs font-bold uppercase flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-Simulate 500 Trials</span>
        </button>
      </div>

      {/* Probability Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Buyer Win Rate Gauge */}
        <div className="p-4 border-2 border-[#111110] bg-[#F7F6F2] flex flex-col justify-between">
          <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#3F3E3A]">
            BUYER WIN PROBABILITY
          </span>
          <div className="my-2">
            <div className={`font-mono-tabular text-3xl sm:text-4xl font-bold ${winProbability >= 50 ? 'text-[#14532D]' : 'text-[#C83E2B]'}`}>
              {winProbability.toFixed(1)}%
            </div>
          </div>
          <span className="text-[11px] font-mono-tabular text-[#3F3E3A]">
            {winProbability >= 65
              ? 'High Asymmetry favoring real estate leverage'
              : winProbability <= 35
              ? 'Substantial advantage favoring liquid equities'
              : 'Near Coin-Flip (Sensitive to entry valuation)'}
          </span>
        </div>

        {/* Median Expected Spread */}
        <div className="p-4 border-2 border-[#111110] bg-[#F7F6F2] flex flex-col justify-between">
          <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#3F3E3A]">
            MEDIAN (P50) SPREAD
          </span>
          <div className="my-2">
            <div className={`font-mono-tabular text-2xl sm:text-3xl font-bold ${medianDiff >= 0 ? 'text-[#14532D]' : 'text-[#C83E2B]'}`}>
              {medianDiff >= 0 ? 'BUY +' : 'RENT +'}{formatCurrency(Math.abs(medianDiff))}
            </div>
          </div>
          <span className="text-[11px] font-mono-tabular text-[#3F3E3A]">
            50th percentile net worth advantage at Yr {timelineYears}
          </span>
        </div>

        {/* Downside P10 Bear Case */}
        <div className="p-4 border-2 border-[#111110] bg-[#F7F6F2] flex flex-col justify-between">
          <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#C83E2B]">
            P10 WORST-CASE SPREAD
          </span>
          <div className="my-2">
            <div className="font-mono-tabular text-2xl sm:text-3xl font-bold text-[#C83E2B]">
              {p10Diff >= 0 ? 'BUY +' : 'RENT +'}{formatCurrency(Math.abs(p10Diff))}
            </div>
          </div>
          <span className="text-[11px] font-mono-tabular text-[#3F3E3A]">
            10th percentile downside under market compression
          </span>
        </div>

        {/* Upside P90 Bull Case */}
        <div className="p-4 border-2 border-[#111110] bg-[#F7F6F2] flex flex-col justify-between">
          <span className="font-mono-tabular text-[10px] font-bold uppercase text-[#14532D]">
            P90 BEST-CASE SPREAD
          </span>
          <div className="my-2">
            <div className="font-mono-tabular text-2xl sm:text-3xl font-bold text-[#14532D]">
              {p90Diff >= 0 ? 'BUY +' : 'RENT +'}{formatCurrency(Math.abs(p90Diff))}
            </div>
          </div>
          <span className="text-[11px] font-mono-tabular text-[#3F3E3A]">
            90th percentile bull scenario expansion
          </span>
        </div>
      </div>

      {/* Stochastic Volatility Parameter Tuning Strip */}
      <div className="p-4 border border-[#111110] bg-[#ECEAE2]/60 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TactileParameter
          code="STK-VOL"
          label="S&P 500 Volatility (σ)"
          value={mcParams.stockVol}
          min={8.0}
          max={28.0}
          step={0.5}
          suffix="%"
          display={`${mcParams.stockVol.toFixed(1)}%`}
          sub="Historical standard deviation ~16%"
          compact
          onChange={(v) => onUpdateMcParams('stockVol', v)}
        />
        <TactileParameter
          code="HOM-VOL"
          label="Housing Volatility (σ)"
          value={mcParams.homeVol}
          min={3.0}
          max={18.0}
          step={0.5}
          suffix="%"
          display={`${mcParams.homeVol.toFixed(1)}%`}
          sub="Case-Shiller national std dev ~7.5%"
          compact
          onChange={(v) => onUpdateMcParams('homeVol', v)}
        />
        <TactileParameter
          code="CORR-ρ"
          label="Correlation (ρ)"
          value={mcParams.corr}
          min={-0.3}
          max={0.6}
          step={0.05}
          display={`${mcParams.corr.toFixed(2)}`}
          sub="Asset co-movement index"
          compact
          onChange={(v) => onUpdateMcParams('corr', v)}
        />
      </div>

      {/* ARCHITECTURAL SVG STOCHASTIC FAN PLOT */}
      <div className="border-2 border-[#111110] bg-[#F7F6F2] p-2 sm:p-3 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono-tabular px-2 pt-1 font-semibold text-[#3F3E3A]">
          <span>CONFIDENCE INTERVAL BANDS // SHADED RIBBONS: 10TH TO 90TH PERCENTILE // SOLID LINES: MEDIAN (P50)</span>
          <span>YEAR {inspectedYear} INSPECTED</span>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible touch-pan-y"
        >
          {/* Horizontal Grid */}
          {yTicks.map((tick, i) => {
            const y = getY(tick);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#111110"
                  strokeOpacity={tick === 0 ? '0.85' : '0.18'}
                  strokeDasharray={tick === 0 ? 'none' : '3 3'}
                  strokeWidth={tick === 0 ? 1.5 : 1}
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#111110] text-[11px] font-bold font-mono-tabular"
                >
                  {formatCurrency(tick, true)}
                </text>
              </g>
            );
          })}

          {/* Renter 10-90 Ribbon (Red Tint) */}
          <polygon
            points={renterRibbon}
            fill="#C83E2B"
            fillOpacity="0.14"
            stroke="#C83E2B"
            strokeOpacity="0.3"
            strokeWidth="1"
          />

          {/* Buyer 10-90 Ribbon (Green Tint) */}
          <polygon
            points={buyerRibbon}
            fill="#14532D"
            fillOpacity="0.14"
            stroke="#14532D"
            strokeOpacity="0.3"
            strokeWidth="1"
          />

          {/* Renter Median Line */}
          <polyline
            fill="none"
            stroke="#C83E2B"
            strokeWidth="3"
            points={renterMedianPoints}
          />

          {/* Buyer Median Line */}
          <polyline
            fill="none"
            stroke="#14532D"
            strokeWidth="3.25"
            points={buyerMedianPoints}
          />

          {/* Year Markers & Inspection Line */}
          <line
            x1={getX(Math.min(statsYearly.length - 1, inspectedYear - 1))}
            y1={padTop}
            x2={getX(Math.min(statsYearly.length - 1, inspectedYear - 1))}
            y2={height - padBottom}
            stroke="#111110"
            strokeWidth="1.75"
            strokeDasharray="4 2"
          />

          {statsYearly.map((d, i) => {
            const x = getX(i);
            const isSelected = d.year === inspectedYear;

            return (
              <g
                key={d.year}
                className="cursor-pointer"
                onClick={() => onSelectYear(d.year)}
              >
                <circle
                  cx={x}
                  cy={getY(d.buyer.p50)}
                  r={isSelected ? 5 : 3.5}
                  fill={isSelected ? '#14532D' : '#F7F6F2'}
                  stroke="#14532D"
                  strokeWidth="2"
                />
                <rect
                  x={x - (isSelected ? 4.5 : 3)}
                  y={getY(d.renter.p50) - (isSelected ? 4.5 : 3)}
                  width={isSelected ? 9 : 6}
                  height={isSelected ? 9 : 6}
                  fill={isSelected ? '#C83E2B' : '#F7F6F2'}
                  stroke="#C83E2B"
                  strokeWidth="2"
                />

                {(statsYearly.length <= 15 || d.year % 2 === 0 || d.year === 1 || d.year === statsYearly.length) && (
                  <text
                    x={x}
                    y={height - 14}
                    textAnchor="middle"
                    className={`text-[12px] font-mono-tabular ${
                      isSelected ? 'fill-[#111110] font-bold underline' : 'fill-[#3F3E3A] font-semibold'
                    }`}
                  >
                    Y{d.year}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Year Telemetry Card */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 border-t border-[#111110]/20 font-mono-tabular text-xs">
          <div className="p-2 border border-[#111110] bg-[#ECEAE2]/40">
            <span className="text-[10px] text-[#3F3E3A] font-semibold block">BUYER P50 (MEDIAN)</span>
            <span className="font-bold text-[#14532D]">{formatCurrency(currStats.buyer.p50)}</span>
          </div>
          <div className="p-2 border border-[#111110] bg-[#ECEAE2]/40">
            <span className="text-[10px] text-[#3F3E3A] font-semibold block">BUYER P10 - P90 RANGE</span>
            <span className="font-bold">{formatCurrency(currStats.buyer.p10, true)} - {formatCurrency(currStats.buyer.p90, true)}</span>
          </div>
          <div className="p-2 border border-[#111110] bg-[#ECEAE2]/40">
            <span className="text-[10px] text-[#3F3E3A] font-semibold block">RENTER P50 (MEDIAN)</span>
            <span className="font-bold text-[#C83E2B]">{formatCurrency(currStats.renter.p50)}</span>
          </div>
          <div className="p-2 border border-[#111110] bg-[#ECEAE2]/40">
            <span className="text-[10px] text-[#3F3E3A] font-semibold block">RENTER P10 - P90 RANGE</span>
            <span className="font-bold">{formatCurrency(currStats.renter.p10, true)} - {formatCurrency(currStats.renter.p90, true)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
