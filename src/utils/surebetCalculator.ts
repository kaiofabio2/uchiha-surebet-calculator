// Calculate if a bet is a "surebet" (guaranteed profit)
export const isSurebet = (odds: number[]): boolean => {
  if (odds.length < 2 || odds.some(odd => odd <= 1)) return false;
  
  const sum = odds.reduce((acc, odd) => acc + (1 / odd), 0);
  return sum < 1;
};

// Calculate margin
export const calculateMargin = (odds: number[]): number => {
  if (odds.length < 2 || odds.some(odd => odd <= 1)) return 0;
  
  const sum = odds.reduce((acc, odd) => acc + (1 / odd), 0);
  return ((1 - sum) / sum) * 100;
};

// Calculate stake distribution
export const calculateStakes = (
  odds: number[], 
  totalStake: number
): number[] => {
  if (odds.length < 2 || totalStake <= 0) return Array(odds.length).fill(0);
  
  // Calculate implied probabilities
  const impliedProbs = odds.map(odd => 1 / odd);
  const totalImpliedProb = impliedProbs.reduce((acc, prob) => acc + prob, 0);
  
  // Distribute total stake proportionally to implied probabilities
  return impliedProbs.map(prob => (prob / totalImpliedProb) * totalStake);
};

// Round stakes to a specific value (e.g. round to nearest $1)
export const roundStakes = (
  stakes: number[], 
  roundTo: number, 
  totalStake: number
): number[] => {
  if (roundTo <= 0) return stakes;
  
  // Round down each stake to the nearest multiple of roundTo
  const roundedStakes = stakes.map(stake => Math.floor(stake / roundTo) * roundTo);
  
  // Calculate how much is left after rounding down
  const roundedTotal = roundedStakes.reduce((acc, stake) => acc + stake, 0);
  const remaining = totalStake - roundedTotal;
  
  // Distribute the remaining amount in roundTo chunks
  let result = [...roundedStakes];
  let remainingToDistribute = remaining;
  
  // Sort by fractional part (descending) to prioritize which stakes get rounded up
  const stakesWithIndices = stakes.map((stake, index) => ({ 
    index, 
    fractionalPart: stake % roundTo 
  }));
  
  stakesWithIndices.sort((a, b) => b.fractionalPart - a.fractionalPart);
  
  // Distribute chunks
  for (const { index } of stakesWithIndices) {
    if (remainingToDistribute >= roundTo) {
      result[index] += roundTo;
      remainingToDistribute -= roundTo;
    } else {
      break;
    }
  }
  
  return result;
};

// Calculate profit for each outcome
export const calculateProfits = (stakes: number[], odds: number[], totalStake: number): number[] => {
  return stakes.map((stake, index) => stake * odds[index] - totalStake);
};

// Calculate the total profit (minimum of all potential profits)
export const calculateTotalProfit = (stakes: number[], odds: number[], totalStake: number): number => {
  const profits = calculateProfits(stakes, odds, totalStake);
  return Math.min(...profits);
};

// Calculate the profit percentage
export const calculateProfitPercentage = (totalProfit: number, totalStake: number): number => {
  if (totalStake <= 0) return 0;
  return (totalProfit / totalStake) * 100;
};

// Recalculate stakes when the user wants to use a custom total stake
export const recalculateStakesForCustomTotal = (
  stakes: number[], 
  customTotalStake: number
): number[] => {
  const currentTotal = stakes.reduce((acc, stake) => acc + stake, 0);
  if (currentTotal <= 0) return stakes;
  
  const ratio = customTotalStake / currentTotal;
  return stakes.map(stake => stake * ratio);
};

// Recalculate stakes when the user sets a specific bet amount for one outcome
export const recalculateStakesForSpecificBet = (
  currentStakes: number[],
  odds: number[],
  changedIndex: number,
  newStakeValue: number
): number[] => {
  // Calculate the guaranteed return for the specific bet
  const targetReturn = newStakeValue * odds[changedIndex];
  
  // Create a new stakes array with the changed stake
  const newStakes = [...currentStakes];
  newStakes[changedIndex] = newStakeValue;
  
  // Calculate what the other stakes should be to match the same return
  for (let i = 0; i < newStakes.length; i++) {
    if (i !== changedIndex) {
      newStakes[i] = targetReturn / odds[i];
    }
  }
  
  return newStakes;
};

// Calculate if a bet is a "surebet" considering freebets
export const isSurebetWithFreebet = (odds: number[], freebets: boolean[]): boolean => {
  if (odds.length < 2 || odds.some(odd => odd <= 1)) return false;
  
  // For freebets, the effective odds are (odds - 1) because we don't get the stake back
  const effectiveOdds = odds.map((odd, index) => freebets[index] ? odd - 1 : odd);
  const sum = effectiveOdds.reduce((acc, odd, index) => {
    // For freebets, we use 1/(odds-1), for regular bets we use 1/odds
    if (freebets[index]) {
      return acc + (1 / (odds[index] - 1));
    }
    return acc + (1 / odds[index]);
  }, 0);
  
  return sum < 1;
};

// Calculate margin considering freebets
export const calculateMarginWithFreebet = (odds: number[], freebets: boolean[]): number => {
  if (odds.length < 2 || odds.some(odd => odd <= 1)) return 0;
  
  const sum = odds.reduce((acc, odd, index) => {
    if (freebets[index]) {
      return acc + (1 / (odd - 1));
    }
    return acc + (1 / odd);
  }, 0);
  
  return ((1 - sum) / sum) * 100;
};

// Calculate stake distribution considering freebets
export const calculateStakesWithFreebet = (
  odds: number[], 
  totalStake: number,
  freebets: boolean[]
): number[] => {
  if (odds.length < 2 || totalStake <= 0) return Array(odds.length).fill(0);
  
  // Calculate implied probabilities considering freebets
  // For freebets: implied prob = 1/(odds-1)
  // For regular bets: implied prob = 1/odds
  const impliedProbs = odds.map((odd, index) => 
    freebets[index] ? 1 / (odd - 1) : 1 / odd
  );
  
  const totalImpliedProb = impliedProbs.reduce((acc, prob) => acc + prob, 0);
  
  // Distribute total stake proportionally to implied probabilities
  return impliedProbs.map(prob => (prob / totalImpliedProb) * totalStake);
};

// Calculate profits for each outcome considering freebets
export const calculateProfitsWithFreebet = (
  stakes: number[], 
  odds: number[], 
  freebets: boolean[]
): number[] => {
  // Calculate total real stake (only non-freebet stakes)
  const totalRealStake = stakes.reduce((sum, stake, index) => 
    freebets[index] ? sum : sum + stake, 0
  );
  
  return stakes.map((stake, index) => {
    if (freebets[index]) {
      // Freebet: return is (odds - 1) * stake, minus the real stakes invested
      return (odds[index] - 1) * stake - totalRealStake;
    }
    // Regular bet: return is odds * stake, minus all real stakes invested
    return stake * odds[index] - totalRealStake;
  });
};

// Calculate the total profit considering freebets
export const calculateTotalProfitWithFreebet = (
  stakes: number[], 
  odds: number[], 
  freebets: boolean[]
): number => {
  const profits = calculateProfitsWithFreebet(stakes, odds, freebets);
  return Math.min(...profits);
};

// Recalculate stakes when user sets a specific bet amount for one outcome (with freebets)
export const recalculateStakesForSpecificBetWithFreebet = (
  currentStakes: number[],
  odds: number[],
  freebets: boolean[],
  changedIndex: number,
  newStakeValue: number
): number[] => {
  // Calculate the guaranteed return for the specific bet
  let targetReturn: number;
  
  if (freebets[changedIndex]) {
    // For freebet: return is (odds - 1) * stake
    targetReturn = (odds[changedIndex] - 1) * newStakeValue;
  } else {
    // For regular bet: return is odds * stake
    targetReturn = newStakeValue * odds[changedIndex];
  }
  
  // Create a new stakes array with the changed stake
  const newStakes = [...currentStakes];
  newStakes[changedIndex] = newStakeValue;
  
  // Calculate what the other stakes should be to match the same return
  for (let i = 0; i < newStakes.length; i++) {
    if (i !== changedIndex) {
      if (freebets[i]) {
        // For freebet: stake = targetReturn / (odds - 1)
        newStakes[i] = targetReturn / (odds[i] - 1);
      } else {
        // For regular bet: stake = targetReturn / odds
        newStakes[i] = targetReturn / odds[i];
      }
    }
  }
  
  return newStakes;
};
