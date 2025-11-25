
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calculator } from 'lucide-react';
import { toast } from 'sonner';
import ResultsDisplay from '@/components/ResultsDisplay';
import OddsInputSection from '@/components/calculator/OddsInputSection';
import StakeConfigSection from '@/components/calculator/StakeConfigSection';
import { 
  isSurebet, 
  calculateMargin,
  calculateStakes,
  roundStakes,
  calculateTotalProfit,
  calculateProfitPercentage,
  recalculateStakesForSpecificBet,
  isSurebetWithFreebet,
  calculateMarginWithFreebet,
  calculateStakesWithFreebet,
  calculateTotalProfitWithFreebet,
  calculateRealInvestment,
  calculateFreebetValue
} from '@/utils/surebetCalculator';

const SurebetCalculator = () => {
  const [odds, setOdds] = useState<number[]>([0, 0]);
  const [totalStake, setTotalStake] = useState<number | ''>();
  const [roundingValue, setRoundingValue] = useState<number | ''>();
  const [stakes, setStakes] = useState<number[]>([0, 0]);
  const [profit, setProfit] = useState<number>(0);
  const [profitPercentage, setProfitPercentage] = useState<number>(0);
  const [freebetFlags, setFreebetFlags] = useState<boolean[]>([false, false]);

  // Update calculations when inputs change
  useEffect(() => {
    if (typeof totalStake === 'number' && totalStake > 0 && odds.every(odd => odd > 1)) {
      calculateResults();
    }
  }, [odds, totalStake, roundingValue, freebetFlags]);

  const calculateResults = () => {
    if (!odds.every(odd => odd > 1)) {
      toast.error("Todas as odds devem ser maiores que 1");
      return;
    }

    if (typeof totalStake !== 'number' || totalStake <= 0) {
      toast.error("Valor total da aposta deve ser maior que 0");
      return;
    }

    const hasFreebet = freebetFlags.some(flag => flag);
    
    const calculatedStakes = hasFreebet
      ? calculateStakesWithFreebet(odds, totalStake, freebetFlags)
      : calculateStakes(odds, totalStake);
      
    const roundedStakes = typeof roundingValue === 'number' && roundingValue > 0
      ? roundStakes(calculatedStakes, roundingValue, totalStake)
      : calculatedStakes;
    
    const calculatedProfit = hasFreebet
      ? calculateTotalProfitWithFreebet(roundedStakes, odds, totalStake, freebetFlags)
      : calculateTotalProfit(roundedStakes, odds, totalStake);
      
    const realInvestment = hasFreebet
      ? calculateRealInvestment(roundedStakes, freebetFlags)
      : totalStake;
      
    const calculatedProfitPercentage = calculateProfitPercentage(calculatedProfit, realInvestment);
    
    setStakes(roundedStakes);
    setProfit(calculatedProfit);
    setProfitPercentage(calculatedProfitPercentage);
  };

  const handleAddOdd = () => {
    if (odds.length >= 5) {
      toast.warning("Máximo de 5 odds permitido");
      return;
    }
    setOdds([...odds, 0]);
    setStakes([...stakes, 0]);
    setFreebetFlags([...freebetFlags, false]);
  };

  const handleRemoveOdd = (index: number) => {
    if (odds.length <= 2) {
      toast.warning("Mínimo de 2 odds necessário");
      return;
    }
    const newOdds = [...odds];
    newOdds.splice(index, 1);
    setOdds(newOdds);
    
    const newStakes = [...stakes];
    newStakes.splice(index, 1);
    setStakes(newStakes);
    
    const newFreebetFlags = [...freebetFlags];
    newFreebetFlags.splice(index, 1);
    setFreebetFlags(newFreebetFlags);
  };

  const updateOdd = (index: number, value: number) => {
    const newOdds = [...odds];
    newOdds[index] = value;
    setOdds(newOdds);
  };

  const handleFreebetChange = (index: number, isFreebet: boolean) => {
    const newFreebetFlags = [...freebetFlags];
    newFreebetFlags[index] = isFreebet;
    setFreebetFlags(newFreebetFlags);
  };

  const handleSpecificStakeChange = (index: number, value: number | '') => {
    if (typeof value === 'number' && value >= 0) {
      const newStakes = recalculateStakesForSpecificBet(stakes, odds, index, value, freebetFlags);
      const newTotalStake = newStakes.reduce((sum, stake) => sum + stake, 0);
      
      setStakes(newStakes);
      setTotalStake(newTotalStake);
      
      const hasFreebet = freebetFlags.some(flag => flag);
      const calculatedProfit = hasFreebet
        ? calculateTotalProfitWithFreebet(newStakes, odds, newTotalStake, freebetFlags)
        : calculateTotalProfit(newStakes, odds, newTotalStake);
        
      const realInvestment = hasFreebet
        ? calculateRealInvestment(newStakes, freebetFlags)
        : newTotalStake;
        
      const calculatedProfitPercentage = calculateProfitPercentage(calculatedProfit, realInvestment);
      
      setProfit(calculatedProfit);
      setProfitPercentage(calculatedProfitPercentage);
    } else if (value === '') {
      const newStakes = [...stakes];
      newStakes[index] = 0;
      setStakes(newStakes);
    }
  };

  const hasFreebet = freebetFlags.some(flag => flag);
  const isSurebetPossible = hasFreebet ? isSurebetWithFreebet(odds, freebetFlags) : isSurebet(odds);
  const margin = hasFreebet ? calculateMarginWithFreebet(odds, freebetFlags) : calculateMargin(odds);
  const realInvestment = hasFreebet ? calculateRealInvestment(stakes, freebetFlags) : totalStake;
  const freebetValue = hasFreebet ? calculateFreebetValue(stakes, freebetFlags) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex justify-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-uchiha-red text-glow tracking-wider">
          CALCULADORA SUREBET
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: Odds & Inputs */}
        <Card className="uchiha-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-uchiha-red" />
              Odds & Apostas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Odds Input Section */}
              <OddsInputSection 
                odds={odds} 
                updateOdd={updateOdd}
                handleAddOdd={handleAddOdd}
                handleRemoveOdd={handleRemoveOdd}
                freebetFlags={freebetFlags}
                onFreebetChange={handleFreebetChange}
              />

              <Separator className="bg-uchiha-gray" />

              {/* Stake Config Section */}
              <StakeConfigSection 
                totalStake={totalStake}
                roundingValue={roundingValue}
                setTotalStake={setTotalStake}
                setRoundingValue={setRoundingValue}
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Stake Distribution Results */}
        <Card className="uchiha-card">
          <CardHeader>
            <CardTitle className="text-xl">Distribuição das Apostas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultsDisplay 
              stakes={stakes}
              odds={odds}
              profit={profit}
              profitPercentage={profitPercentage}
              isSurebetPossible={isSurebetPossible}
              margin={margin}
              onSpecificStakeChange={handleSpecificStakeChange}
              freebetFlags={freebetFlags}
              realInvestment={realInvestment}
              freebetValue={freebetValue}
            />
            
            <div className="mt-6 text-center">
              <p className="text-sm italic text-gray-400">
                "Apostando com a precisão de Madara!"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SurebetCalculator;
