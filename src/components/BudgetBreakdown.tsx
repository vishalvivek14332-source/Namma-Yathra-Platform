import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BudgetConfig,
  CalculatedBudget,
  formatINR
} from '../types/itinerary';
import {
  Wallet,
  Car,
  Hotel,
  Utensils,
  Ticket,
  Package,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

interface BudgetBreakdownProps {
  calculatedBudget: CalculatedBudget;
  budgetConfig: BudgetConfig;
  onUpdateBudgetConfig: (newConfig: BudgetConfig) => void;
  travellersCount: number;
  durationDays: number;
}

export const BudgetBreakdown: React.FC<BudgetBreakdownProps> = ({
  calculatedBudget,
  budgetConfig,
  onUpdateBudgetConfig,
  travellersCount,
  durationDays,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(false);

  const handleCostChange = (field: keyof BudgetConfig, value: number) => {
    onUpdateBudgetConfig({
      ...budgetConfig,
      [field]: Math.max(0, value)
    });
  };

  const {
    transportINR,
    accommodationINR,
    foodINR,
    activitiesINR,
    miscellaneousINR,
    totalEstimatedINR,
    costPerPersonINR,
    targetBudgetINR,
    differenceINR,
    isOverrun,
    overrunPercentage,
    assumptions
  } = calculatedBudget;

  const categories = [
    {
      key: 'transportINR' as const,
      label: 'Transport & Intercity Transit',
      icon: Car,
      amount: transportINR,
      scope: 'Group Total',
      desc: 'Vehicle hire, fuel, tolls, and intercity transit'
    },
    {
      key: 'accommodationINR' as const,
      label: 'Lodging & Stays',
      icon: Hotel,
      amount: accommodationINR,
      scope: `${Math.ceil(travellersCount / 2)} room(s) · ${Math.max(1, durationDays - 1)} night(s)`,
      desc: 'Hotels, heritage homestays, or plantation villas'
    },
    {
      key: 'foodINR' as const,
      label: 'Dining & Refreshments',
      icon: Utensils,
      amount: foodINR,
      scope: `${travellersCount} people · ${durationDays} days`,
      desc: 'Authentic local cuisine, filter coffee, and lunches'
    },
    {
      key: 'activitiesINR' as const,
      label: 'Activities & Entry Fees',
      icon: Ticket,
      amount: activitiesINR,
      scope: 'Calculated from stops',
      desc: 'Monuments, ASI tickets, coracle rides & safaris'
    },
    {
      key: 'miscellaneousINR' as const,
      label: 'Contingency & Reserve',
      icon: Package,
      amount: miscellaneousINR,
      scope: 'Group Buffer',
      desc: 'Parking, local temple offerings, tips & incidentals'
    }
  ];

  return (
    <div className="bg-[#FFFEFA] rounded-2xl border border-[#D5CEBF] p-6 sm:p-7 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD3]">
        <div>
          <h4 className="font-editorial text-xl sm:text-2xl text-[#102D23] font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#173D2E]" />
            Deterministic Budget Plan
          </h4>
          <p className="text-xs text-[#77786F] mt-0.5">
            Transparent planning estimates · Real arithmetic (Not live market prices)
          </p>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-3.5 py-1.5 text-xs font-semibold bg-[#F7F4EC] hover:bg-[#EDE8DE] text-[#173D2E] border border-[#D5CEBF] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Sliders className="w-3.5 h-3.5 text-[#B9684B]" />
          <span>{isEditing ? 'Done Adjusting' : 'Adjust Fares'}</span>
        </button>
      </div>

      {/* Target vs Estimated Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 bg-[#F7F4EC] rounded-xl border border-[#E5DFD3]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#77786F]">
            Total Estimated
          </span>
          <div className="text-2xl font-bold font-mono-numbers text-[#102D23] mt-1">
            {formatINR(totalEstimatedINR)}
          </div>
          <span className="text-xs text-[#555850] font-mono-numbers">
            {formatINR(costPerPersonINR)} / traveller
          </span>
        </div>

        <div className="p-4 bg-[#F7F4EC] rounded-xl border border-[#E5DFD3]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#77786F]">
            Target Ceiling
          </span>
          <div className="text-2xl font-bold font-mono-numbers text-[#102D23] mt-1">
            {formatINR(targetBudgetINR)}
          </div>
          <span className="text-xs text-[#77786F]">
            User specified target
          </span>
        </div>

        <div className={`p-4 rounded-xl border ${isOverrun ? 'bg-[#B9684B]/10 border-[#B9684B]/30 text-[#8C3B1F]' : 'bg-[#173D2E]/10 border-[#173D2E]/25 text-[#102D23]'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              {isOverrun ? 'Budget Overrun' : 'Remaining Buffer'}
            </span>
            {isOverrun ? <AlertTriangle className="w-4 h-4 text-[#B9684B]" /> : <CheckCircle className="w-4 h-4 text-[#173D2E]" />}
          </div>
          <div className="text-2xl font-bold font-mono-numbers mt-1">
            {formatINR(Math.abs(differenceINR))}
          </div>
          <span className="text-xs font-medium">
            {isOverrun ? `+${overrunPercentage}% over target` : 'Comfortably within limit'}
          </span>
        </div>
      </div>

      {/* Overrun Notice Alert */}
      {isOverrun && (
        <div className="p-3.5 bg-[#B9684B]/10 rounded-xl border border-[#B9684B]/25 text-xs text-[#8C3B1F] flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#B9684B] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Budget Advisory:</span> Total cost exceeds your initial budget of {formatINR(targetBudgetINR)} by {formatINR(Math.abs(differenceINR))}. Consider choosing public transit, adjusting accommodation tier, or removing a high-entry activity.
          </div>
        </div>
      )}

      {/* Category Breakdown Table */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#77786F]">
          Itemized Breakdown
        </div>

        <div className="divide-y divide-[#E5DFD3] border border-[#D5CEBF] rounded-xl overflow-hidden bg-[#FFFEFA]">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const percentage = totalEstimatedINR > 0 ? Math.round((cat.amount / totalEstimatedINR) * 100) : 0;

            return (
              <div key={cat.key} className="p-3.5 hover:bg-[#F7F4EC]/40 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#F7F4EC] rounded-lg text-[#173D2E] border border-[#E5DFD3]">
                      <Icon className="w-4 h-4 text-[#173D2E]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#102D23]">
                        {cat.label}
                      </div>
                      <div className="text-xs text-[#77786F]">
                        {cat.scope} · {cat.desc}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {isEditing && cat.key !== 'activitiesINR' ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-[#77786F]">₹</span>
                        <input
                          type="number"
                          step={500}
                          value={cat.amount}
                          onChange={(e) => handleCostChange(cat.key, Number(e.target.value))}
                          className="w-24 text-right px-2 py-1 bg-[#F7F4EC] border border-[#D5CEBF] rounded text-sm font-mono-numbers text-[#102D23] focus:outline-none focus:ring-1 focus:ring-[#173D2E]"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="text-sm font-bold font-mono-numbers text-[#102D23]">
                          {formatINR(cat.amount)}
                        </div>
                        <div className="text-[11px] text-[#77786F] font-mono-numbers">
                          {percentage}% of total
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Visual */}
                <div className="w-full bg-[#E5DFD3] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#173D2E] h-full rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assumptions Accordion */}
      <div className="pt-2">
        <button
          onClick={() => setShowAssumptions(!showAssumptions)}
          className="text-xs text-[#555850] hover:text-[#102D23] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#B9684B]" />
          <span>Formula & Arithmetic Assumptions</span>
          {showAssumptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAssumptions && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 space-y-1.5 text-xs text-[#555850] bg-[#F7F4EC] p-4 rounded-xl border border-[#D5CEBF]"
          >
            {assumptions.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[#B9684B] font-mono-numbers font-bold">{idx + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
};
