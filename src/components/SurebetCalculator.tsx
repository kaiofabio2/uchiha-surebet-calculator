
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
  recalculateStakesForSpecificBetWithFreebet,
  calculateStakesWithLocked
} from '@/utils/surebetCalculator';

const SurebetCalculator = () => {
  const [odds, setOdds] = useState<number[]>([0, 0]);
  const [totalStake, setTotalStake] = useState<number | ''>();
  const [roundingValue, setRoundingValue] = useState<number | ''>();
  const [stakes, setStakes] = useState<number[]>([0, 0]);
  const [profit, setProfit] = useState<number>(0);
  const [profitPercentage, setProfitPercentage] = useState<number>(0);
  const [freebets, setFreebets] = useState<boolean[]>([false, false]);
  const [lockedStakes, setLockedStakes] = useState<boolean[]>([false, false]);

  // Update calculations when inputs change
  useEffect(() => {
    if (typeof totalStake === 'number' && totalStake > 0 && odds.every(odd => odd > 1)) {
      calculateResults();
    }
  }, [odds, totalStake, roundingValue]);

  const calculateResults = () => {
    if (!odds.every(odd => odd > 1)) {
      toast.error("Todas as odds devem ser maiores que 1");
      return;
    }

    if (typeof totalStake !== 'number' || totalStake <= 0) {
      toast.error("Valor total da aposta deve ser maior que 0");
      return;
    }

    // Check if any stake is locked
    const hasLockedStakes = lockedStakes.some(locked => locked);
    
    // If there are locked stakes, use the locked calculation
    if (hasLockedStakes) {
      const calculatedStakes = calculateStakesWithLocked(
        odds, 
        totalStake, 
        lockedStakes, 
        stakes, 
        freebets
      );
      
      const hasFreebets = freebets.some(fb => fb);
      
      let calculatedProfit: number;
      let calculatedProfitPercentage: number;
      
      if (hasFreebets) {
        const totalRealStake = calculatedStakes.reduce((sum, stake, index) => 
          freebets[index] ? sum : sum + stake, 0
        );
        calculatedProfit = calculateTotalProfitWithFreebet(calculatedStakes, odds, freebets);
        calculatedProfitPercentage = calculateProfitPercentage(calculatedProfit, totalRealStake);
      } else {
        calculatedProfit = calculateTotalProfit(calculatedStakes, odds, totalStake);
        calculatedProfitPercentage = calculateProfitPercentage(calculatedProfit, totalStake);
      }
      
      setStakes(calculatedStakes);
      setProfit(calculatedProfit);
      setProfitPercentage(calculatedProfitPercentage);
      return;
    }

    // Check if any freebet is active
    const hasFreebets = freebets.some(fb => fb);
    
    let calculatedStakes: number[];
    let calculatedProfit: number;
    
    if (hasFreebets) {
      // Use freebet-aware calculations
      calculatedStakes = calculateStakesWithFreebet(odds, totalStake, freebets);
      const roundedStakes = typeof roundingValue === 'number' && roundingValue > 0
        ? roundStakes(calculatedStakes, roundingValue, totalStake)
        : calculatedStakes;
      
      calculatedProfit = calculateTotalProfitWithFreebet(roundedStakes, odds, freebets);
      
      // Calculate total real stake (only non-freebets)
      const totalRealStake = roundedStakes.reduce((sum, stake, index) => 
        freebets[index] ? sum : sum + stake, 0
      );
      
      const calculatedProfitPercentage = calculateProfitPercentage(calculatedProfit, totalRealStake);
      
      setStakes(roundedStakes);
      setProfit(calculatedProfit);
      setProfitPercentage(calculatedProfitPercentage);
    } else {
      // Use regular calculations
      calculatedStakes = calculateStakes(odds, totalStake);
      const roundedStakes = typeof roundingValue === 'number' && roundingValue > 0
        ? roundStakes(calculatedStakes, roundingValue, totalStake)
        : calculatedStakes;
      
      calculatedProfit = calculateTotalProfit(roundedStakes, odds, totalStake);
      const calculatedProfitPercentage = calculateProfitPercentage(calculatedProfit, totalStake);
      
      setStakes(roundedStakes);
      setProfit(calculatedProfit);
      setProfitPercentage(calculatedProfitPercentage);
    }
  };

  const handleAddOdd = () => {
    if (odds.length >= 5) {
      toast.warning("Máximo de 5 odds permitido");
      return;
    }
    setOdds([...odds, 0]);
    setStakes([...stakes, 0]);
    setFreebets([...freebets, false]);
    setLockedStakes([...lockedStakes, false]);
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
    
    const newFreebets = [...freebets];
    newFreebets.splice(index, 1);
    setFreebets(newFreebets);
    
    const newLockedStakes = [...lockedStakes];
    newLockedStakes.splice(index, 1);
    setLockedStakes(newLockedStakes);
  };

  const updateOdd = (index: number, value: number) => {
    const newOdds = [...odds];
    newOdds[index] = value;
    setOdds(newOdds);
  };

  const handleFreebetToggle = (index: number, checked: boolean) => {
    const newFreebets = [...freebets];
    newFreebets[index] = checked;
    setFreebets(newFreebets);
    
    // Recalcular stakes mantendo o valor do stake atual
    if (stakes[index] > 0 && odds.every(odd => odd > 1)) {
      const newStakes = recalculateStakesForSpecificBetWithFreebet(
        stakes, 
        odds, 
        newFreebets,
        index, 
        stakes[index]
      );
      
      const newTotalStake = newStakes.reduce((sum, stake) => sum + stake, 0);
      const totalRealStake = newStakes.reduce((sum, stake, idx) => 
        newFreebets[idx] ? sum : sum + stake, 0
      );
      
      const calculatedProfit = calculateTotalProfitWithFreebet(newStakes, odds, newFreebets);
      const calculatedProfitPercentage = calculateProfitPercentage(calculatedProfit, totalRealStake);
      
      setStakes(newStakes);
      setTotalStake(newTotalStake);
      setProfit(calculatedProfit);
      setProfitPercentage(calculatedProfitPercentage);
    }
  };

  const handleLockToggle = (index: number) => {
    const newLockedStakes = [...lockedStakes];
    newLockedStakes[index] = !newLockedStakes[index];
    setLockedStakes(newLockedStakes);
    
    if (newLockedStakes[index]) {
      toast.success(`Stake ${String.fromCharCode(65 + index)} travado`);
    } else {
      toast.info(`Stake ${String.fromCharCode(65 + index)} destravado`);
    }
  };

  const handleSpecificStakeChange = (index: number, value: number | '') => {
    if (typeof value === 'number' && value >= 0) {
      const hasFreebets = freebets.some(fb => fb);
      
      let newStakes: number[];
      let newTotalStake: number;
      let calculatedProfit: number;
      let calculatedProfitPercentage: number;
      
      if (hasFreebets) {
        newStakes = recalculateStakesForSpecificBetWithFreebet(stakes, odds, freebets, index, value);
        newTotalStake = newStakes.reduce((sum, stake) => sum + stake, 0);
        
        // Calculate total real stake (only non-freebets)
        const totalRealStake = newStakes.reduce((sum, stake, idx) => 
          freebets[idx] ? sum : sum + stake, 0
        );
        
        calculatedProfit = calculateTotalProfitWithFreebet(newStakes, odds, freebets);
        calculatedProfitPercentage = calculateProfitPercentage(calculatedProfit, totalRealStake);
      } else {
        newStakes = recalculateStakesForSpecificBet(stakes, odds, index, value);
        newTotalStake = newStakes.reduce((sum, stake) => sum + stake, 0);
        
        calculatedProfit = calculateTotalProfit(newStakes, odds, newTotalStake);
        calculatedProfitPercentage = calculateProfitPercentage(calculatedProfit, newTotalStake);
      }
      
      setStakes(newStakes);
      setTotalStake(newTotalStake);
      setProfit(calculatedProfit);
      setProfitPercentage(calculatedProfitPercentage);
    } else if (value === '') {
      const newStakes = [...stakes];
      newStakes[index] = 0;
      setStakes(newStakes);
    }
  };

  const hasFreebets = freebets.some(fb => fb);
  const isSurebetPossible = hasFreebets ? isSurebetWithFreebet(odds, freebets) : isSurebet(odds);
  const margin = hasFreebets ? calculateMarginWithFreebet(odds, freebets) : calculateMargin(odds);

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
                freebets={freebets}
                onFreebetToggle={handleFreebetToggle}
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
              freebets={freebets}
              lockedStakes={lockedStakes}
              onLockToggle={handleLockToggle}
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
