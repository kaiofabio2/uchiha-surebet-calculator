
import React from 'react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ArrowUp, Percent, DollarSign, RefreshCw, Ticket, Wallet } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ResultsDisplayProps {
  stakes: number[];
  odds: number[];
  profit: number;
  profitPercentage: number;
  isSurebetPossible: boolean;
  margin: number;
  onSpecificStakeChange: (index: number, value: number | '') => void;
  freebetFlags?: boolean[];
  realInvestment?: number | '';
  freebetValue?: number;
}

const ResultsDisplay = ({ 
  stakes, 
  odds,
  profit, 
  profitPercentage,
  isSurebetPossible,
  margin,
  onSpecificStakeChange,
  freebetFlags = [],
  realInvestment,
  freebetValue = 0
}: ResultsDisplayProps) => {
  // Calculate total stake
  const totalStake = stakes.reduce((sum, stake) => sum + (stake || 0), 0);
  
  const hasFreebet = freebetFlags.some(flag => flag);
  
  // Calculate total return considering freebets
  const totalReturn = stakes.length > 0 && odds.length > 0 && stakes[0] && odds[0] 
    ? (freebetFlags[0] ? stakes[0] * (odds[0] - 1) : stakes[0] * odds[0])
    : 0;

  // Function to handle stake input changes
  const handleStakeChange = (index: number, inputValue: string) => {
    // Remove any non-digit characters
    const cleanValue = inputValue.replace(/[^\d]/g, '');
    
    // Convert to number and divide by 100 to get decimal value (e.g., 1234 -> 12.34)
    const numericValue = cleanValue === '' ? '' : parseInt(cleanValue, 10) / 100;
    
    // Update the stake value
    onSpecificStakeChange(index, numericValue);
  };

  // Function to format display value for inputs
  const formatDisplayValue = (value: number | undefined | null): string => {
    if (value === undefined || value === null || value === 0) return '';
    
    // Format to always show 2 decimal places
    return (value).toFixed(2).replace('.', ',');
  };

  return (
    <div className="space-y-4">
      {/* Distribution of stakes */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-400">Distribuição das Apostas</div>
        {stakes.map((stake, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-md mr-2",
                  freebetFlags[index] ? "bg-green-600" : "bg-uchiha-red"
                )}>
                  <span className="text-white font-semibold">{String.fromCharCode(65 + index)}</span>
                </div>
                <div>
                  <div className="text-sm flex items-center gap-1">
                    Odd: {odds[index].toFixed(2)}
                    {freebetFlags[index] && (
                      <Ticket className="h-3 w-3 text-green-400" />
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Retorno: R$ {stake 
                      ? (freebetFlags[index] 
                          ? (stake * (odds[index] - 1)).toFixed(2) 
                          : (stake * odds[index]).toFixed(2)
                        )
                      : '0.00'}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <Input
                type="text"
                inputMode="numeric"
                value={formatDisplayValue(stake)}
                onChange={(e) => handleStakeChange(index, e.target.value)}
                className={cn(
                  "text-white",
                  freebetFlags[index] ? "bg-green-900/30 border-green-600" : "bg-uchiha-gray"
                )}
                placeholder={`Valor para Odd ${String.fromCharCode(65 + index)}`}
              />
            </div>
          </div>
        ))}
      </div>
      
      <Separator className="bg-uchiha-gray" />
      
      {/* Profit information */}
      <div className="space-y-3">
        {/* Real Investment and Freebet Value */}
        {hasFreebet && (
          <>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Wallet className="w-5 h-5 mr-2 text-blue-400" />
                <span className="text-sm font-semibold">Investimento Real:</span>
              </div>
              <div className="font-bold text-blue-400">
                R$ {typeof realInvestment === 'number' ? realInvestment.toFixed(2) : '0.00'}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Ticket className="w-5 h-5 mr-2 text-green-400" />
                <span className="text-sm font-semibold">Valor da Freebet:</span>
              </div>
              <div className="font-bold text-green-400">
                R$ {freebetValue.toFixed(2)}
              </div>
            </div>
          </>
        )}
        
        {/* Guaranteed profit */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <ArrowUp className={`w-5 h-5 mr-2 ${profit >= 0 ? 'text-green-500' : 'text-uchiha-red'}`} />
            <span className="text-sm font-semibold">Lucro Garantido:</span>
          </div>
          <div className={`font-bold ${profit >= 0 ? 'text-green-500' : 'text-uchiha-red'}`}>
            R$ {profit.toFixed(2)}
          </div>
        </div>
        
        {/* Return on stake percentage */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Percent className={`w-5 h-5 mr-2 ${profitPercentage >= 0 ? 'text-green-500' : 'text-uchiha-red'}`} />
            <span className="text-sm font-semibold">Percentual de Lucro:</span>
          </div>
          <div className={`font-bold ${profitPercentage >= 0 ? 'text-green-500' : 'text-uchiha-red'}`}>
            {profitPercentage.toFixed(2)}%
          </div>
        </div>
        
        {/* Total return */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <RefreshCw className="w-5 h-5 mr-2 text-blue-400" />
            <span className="text-sm font-semibold">Retorno Total:</span>
          </div>
          <div className="font-bold text-blue-400">
            R$ {totalReturn.toFixed(2)}
          </div>
        </div>
        
        {/* Surebet Results Summary */}
        <div className="mt-3">
          <div className={cn(
            "text-xl font-medium mb-2", 
            isSurebetPossible ? "text-green-400" : "text-uchiha-red"
          )}>
            {isSurebetPossible 
              ? `Surebet Encontrada: ${margin.toFixed(2)}% de lucro`
              : "Não é uma Surebet"
            }
          </div>
          {isSurebetPossible && (
            <Progress 
              value={Math.min(margin * 2, 100)} 
              className="h-2 bg-uchiha-gray" 
            />
          )}
        </div>
      </div>
      
      {profit < 0 && (
        <div className="text-xs text-uchiha-red mt-2">
          Atenção: Isto não é uma surebet. Você pode perder dinheiro.
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
