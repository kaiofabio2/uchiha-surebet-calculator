
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import OddInput from '@/components/OddInput';

interface OddsInputSectionProps {
  odds: number[];
  updateOdd: (index: number, value: number) => void;
  handleAddOdd: () => void;
  handleRemoveOdd: (index: number) => void;
}

const OddsInputSection = ({ 
  odds, 
  updateOdd, 
  handleAddOdd, 
  handleRemoveOdd 
}: OddsInputSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-400">Cotações de Apostas</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleAddOdd}
          className="sharingan-button"
        >
          <Plus className="w-4 h-4 mr-1" /> Adicionar Odd
        </Button>
      </div>
      
      <div className="space-y-3">
        {odds.map((odd, index) => (
          <OddInput
            key={index}
            index={index}
            value={odd}
            onChange={updateOdd}
            onRemove={handleRemoveOdd}
            isRemovable={odds.length > 2}
          />
        ))}
      </div>
    </div>
  );
};

export default OddsInputSection;
