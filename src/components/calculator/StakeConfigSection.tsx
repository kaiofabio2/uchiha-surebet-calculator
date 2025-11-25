
import React from 'react';
import { Input } from '@/components/ui/input';

interface StakeConfigSectionProps {
  totalStake: number | '';
  setTotalStake: (value: number | '') => void;
}

const StakeConfigSection = ({
  totalStake,
  setTotalStake
}: StakeConfigSectionProps) => {
  // Function to handle stake input changes with proper formatting
  const handleTotalStakeChange = (inputValue: string) => {
    // Remove any non-digit characters
    const cleanValue = inputValue.replace(/[^\d]/g, '');
    
    // Convert to number and divide by 100 to get decimal value (e.g., 1234 -> 12.34)
    const numericValue = cleanValue === '' ? '' : parseInt(cleanValue, 10) / 100;
    
    // Update the stake value
    setTotalStake(numericValue);
  };

  // Function to format display value for total stake input
  const formatDisplayValue = (value: number | ''): string => {
    if (value === '' || value === 0) return '';
    
    // Format to always show 2 decimal places with comma as decimal separator
    return typeof value === 'number' ? value.toFixed(2).replace('.', ',') : '';
  };

  return (
    <div className="space-y-6">
      {/* Total Stake Input */}
      <div className="space-y-2">
        <label htmlFor="totalStake" className="text-sm font-semibold text-gray-400">
          Valor Total da Aposta (R$)
        </label>
        <Input
          id="totalStake"
          type="text"
          inputMode="numeric"
          value={formatDisplayValue(totalStake)}
          onChange={(e) => handleTotalStakeChange(e.target.value)}
          className="bg-uchiha-gray text-white"
        />
      </div>
    </div>
  );
};

export default StakeConfigSection;
