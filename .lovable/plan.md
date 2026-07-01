## Plano: Extensão Chrome Standalone com Calculadora Portada

### Objetivo
Transformar a extensão em um app 100% independente do site, com a mesma UI da calculadora React, painel flutuante em cada aba e estado sincronizado em tempo real entre todas as abas.

---

### Arquitetura

```text
extension/
├── manifest.json
├── background.js          # relay entre abas + toggle do painel
├── content.js             # injeta host + Shadow DOM + monta React
├── content.css            # apenas estilos do container flutuante (host)
├── calculator.iife.js     # bundle React da calculadora (Vite build separado)
├── calculator.css         # CSS Tailwind compilado
├── logo.png               # logo Madara
└── icon-16/48/128.png
```

Sem iframe, sem dependência de `madarasurebet.com.br`. Tudo roda offline dentro da extensão.

---

### Como funciona

1. **Build dedicado da UI React**
   - Novo entry `extension/src/main.tsx` que renderiza `<SurebetCalculator />` num elemento passado por parâmetro.
   - `vite.config.extension.ts` com `build.lib` em formato IIFE, saída em `extension/calculator.iife.js` + `calculator.css`.
   - Reaproveita 100% dos componentes atuais (`SurebetCalculator`, `OddInput`, `ResultsDisplay`, etc.) — nada é reescrito.

2. **Injeção via Shadow DOM**
   - `content.js` cria um `<div id="madara-host">` fixo com `attachShadow({mode:'open'})`.
   - Injeta `calculator.css` dentro do shadow (isola totalmente do CSS da casa de apostas).
   - Chama `window.MadaraSurebet.mount(shadowRoot)` exposto pelo bundle IIFE.

3. **Painel flutuante único (mantém o visual atual)**
   - Header arrastável, botões minimizar/fechar/capturar odds — mesmo estilo já feito.
   - Posição/tamanho/estado (aberto/minimizado) salvos em `chrome.storage.local`.

4. **Sincronização em tempo real entre abas**
   - Estado da calculadora (odds, stakes, freebets, locks, totalStake) persistido em `chrome.storage.local` com chave `madara_state`.
   - Hook `useSyncedState` novo: lê no mount, escreve on change (debounce 150ms), escuta `chrome.storage.onChanged` e atualiza local sem loop (flag de origem).
   - Alterar odd na Bet365 → aparece instantaneamente no painel aberto na Betano.

5. **Captura de odds (mantida)**
   - Content script continua com modo captura por hover/click.
   - Ao capturar, escreve direto em `chrome.storage.local` — a UI reage via listener acima. Sem `postMessage` iframe.

6. **Toggle do painel**
   - Click no ícone → `background.js` envia `MADARA_TOGGLE_PANEL` para a aba ativa.
   - Estado "aberto" é global: se você abriu numa aba, ao trocar de aba e clicar no ícone, também abre lá (opcional — controlado por flag `panelOpen` no storage, com auto-mount se `true`).

---

### Etapas

1. Criar `vite.config.extension.ts` e `extension/src/main.tsx` (entry IIFE que expõe `window.MadaraSurebet.mount`).
2. Criar hook `src/hooks/useChromeStorageSync.ts` e refatorar `SurebetCalculator` para usar esse hook quando `window.chrome?.storage` existir (fallback: comportamento normal no site).
3. Adicionar script `build:extension` no `package.json` (usuário precisa colar — igual fizemos com `build:dev`).
4. Reescrever `extension/content.js`: remover iframe, criar shadow host, carregar bundle via `chrome.runtime.getURL`, montar React.
5. Ajustar `extension/content.css` para estilizar só o container flutuante do shadow host.
6. Atualizar `extension/manifest.json` com `web_accessible_resources` incluindo `calculator.iife.js` e `calculator.css`.
7. Rebuildar ZIP em `public/madara-surebet-extension.zip`.
8. Atualizar `ExtensionDownload.tsx` com o novo passo-a-passo (nada muda no fluxo do usuário final).

---

### Detalhes técnicos

- **Shadow DOM** evita conflito com CSS da casa de apostas e vice-versa.
- **IIFE bundle** (não ESM) para evitar problemas de import dinâmico em content scripts.
- **`chrome.storage.onChanged`** dispara em todas as abas simultaneamente — sync nativa sem service worker relay.
- Tailwind funciona dentro do shadow porque o CSS gerado é injetado no próprio shadow root.
- Toasts (`sonner`) precisam de portal — vamos montar o `<Toaster />` dentro do shadow também.

### Ponto de atenção
O usuário precisará adicionar manualmente ao `package.json` (mesmo padrão do `build:dev`):
```json
"build:extension": "vite build --config vite.config.extension.ts"
```
Vou instruir passo a passo quando chegar a hora.