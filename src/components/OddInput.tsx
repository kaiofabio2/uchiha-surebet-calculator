import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface OddInputProps {
  index: number;
  value: number;
  onChange: (index: number, value: number) => void;
  onRemove: (index: number) => void;
  isRemovable: boolean;
  isFreebet: boolean;
  onFreebetToggle: (index: number, checked: boolean) => void;
}

const OddInput = ({ index, value, onChange, onRemove, isRemovable, isFreebet, onFreebetToggle }: OddInputProps) => {
  return (
    <div className="flex flex-col gap-1">
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
      <Label className="flex items-center gap-2 ml-10 cursor-pointer">
        <Checkbox 
          checked={isFreebet} 
          onCheckedChange={(checked) => onFreebetToggle(index, checked as boolean)}
        />
        <span className="text-xs text-gray-400">Freebet</span>
      </Label>
    </div>
  );
};

export default OddInput;
