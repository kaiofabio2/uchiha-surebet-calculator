
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Ticket } from 'lucide-react';

interface OddInputProps {
  index: number;
  value: number;
  onChange: (index: number, value: number) => void;
  onRemove: (index: number) => void;
  isRemovable: boolean;
  isFreebet?: boolean;
  onFreebetChange?: (index: number, isFreebet: boolean) => void;
}

const OddInput = ({ 
  index, 
  value, 
  onChange, 
  onRemove, 
  isRemovable, 
  isFreebet = false, 
  onFreebetChange 
}: OddInputProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center bg-uchiha-red w-8 h-8 rounded-md">
          <span className="text-white font-semibold">{String.fromCharCode(65 + index)}</span>
        </div>
        <Input
          type="number"
          min="1.01"
          step="0.01"
          value={value || ''}
          onChange={(e) => {
            const inputValue = e.target.value;
            const parsedValue = inputValue === '' ? 0 : parseFloat(inputValue);
            onChange(index, parsedValue);
          }}
          className="bg-uchiha-gray text-white"
          placeholder={`Cotação ${String.fromCharCode(65 + index)}`}
        />
        {isRemovable && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onRemove(index)}
            className="text-uchiha-red hover:bg-uchiha-gray hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {onFreebetChange && (
        <div className="flex items-center gap-2 ml-10">
          <Checkbox
            id={`freebet-${index}`}
            checked={isFreebet}
            onCheckedChange={(checked) => onFreebetChange(index, checked === true)}
            className="border-uchiha-red data-[state=checked]:bg-uchiha-red"
          />
          <label
            htmlFor={`freebet-${index}`}
            className="text-sm text-gray-400 cursor-pointer flex items-center gap-1"
          >
            <Ticket className="h-3 w-3" />
            Esta é uma Freebet
          </label>
        </div>
      )}
    </div>
  );
};

export default OddInput;
