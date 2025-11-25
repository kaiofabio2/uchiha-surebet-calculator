
import React from 'react';
import SurebetCalculator from '@/components/SurebetCalculator';
import MadaraLogo from '@/components/MadaraLogo';
import { Separator } from '@/components/ui/separator';

const Index = () => {
  return (
    <div className="min-h-screen bg-[#0C0C0D] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-center items-center mb-8">
          <div className="flex">
            <MadaraLogo className="mr-2" size={60} />
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Madara <span className="text-uchiha-red">Surebet</span>
            </h1>
          </div>
        </div>
        
        <Separator className="bg-uchiha-gray mb-8" />
        
        {/* Main Calculator */}
        <SurebetCalculator />
        
        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>&copy; 2026 Madara Surebet</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
