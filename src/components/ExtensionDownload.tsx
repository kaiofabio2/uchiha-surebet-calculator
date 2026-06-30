import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Chrome, Target } from 'lucide-react';

const ExtensionDownload = () => {
  const handleDownload = () => {
    fetch('/madara-surebet-extension.zip')
      .then((res) => {
        if (!res.ok) throw new Error(`Falha no download: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'madara-surebet-extension.zip';
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 mt-8">
      <Card className="uchiha-card">
        <CardHeader>
          <CardTitle className="text-xl flex items-center text-white">
            <Chrome className="w-5 h-5 mr-2 text-uchiha-red" />
            Extensão do Chrome
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-4">
            Use a Madara Surebet como painel flutuante em qualquer casa de apostas, com{' '}
            <span className="text-uchiha-red font-semibold inline-flex items-center gap-1">
              <Target className="w-4 h-4" />
              captura automática de odds
            </span>{' '}
            ao clicar.
          </p>

          <Button
            onClick={handleDownload}
            className="sharingan-button bg-uchiha-red hover:bg-uchiha-darkRed text-white border-0 mb-6"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Baixar Extensão (.zip)
          </Button>

          <div className="bg-uchiha-black/60 border border-uchiha-gray rounded-lg p-4">
            <h3 className="text-sm font-semibold text-uchiha-red mb-3 uppercase tracking-wide">
              Como instalar
            </h3>
            <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
              <li>Descompacte o arquivo <code className="text-uchiha-red bg-black/50 px-1 rounded">madara-surebet-extension.zip</code></li>
              <li>Abra <code className="text-uchiha-red bg-black/50 px-1 rounded">chrome://extensions</code> no navegador</li>
              <li>Ative o <span className="text-white font-semibold">Modo do desenvolvedor</span> (canto superior direito)</li>
              <li>Clique em <span className="text-white font-semibold">Carregar sem compactação</span></li>
              <li>Selecione a pasta descompactada</li>
              <li>Em qualquer site de aposta, clique no ícone Sharingan na barra do Chrome para abrir o painel flutuante</li>
              <li>Clique em <span className="text-white font-semibold">🎯 Capturar Odds</span> e selecione as odds nas casas de apostas</li>
            </ol>
          </div>

          <p className="text-xs text-gray-500 mt-3 italic">
            Compatível com Chrome, Edge, Brave, Opera e qualquer navegador Chromium.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExtensionDownload;
