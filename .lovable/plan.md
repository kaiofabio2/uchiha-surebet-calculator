## Plano: Extensão Chrome - Madara Surebet com Captura Automática de Odds

### Visão Geral
Criar uma extensão Chrome que injeta a calculadora Madara Surebet como um **painel flutuante arrastável** sobre qualquer página de casa de apostas. Ao clicar em qualquer odd na página com a calculadora aberta, a odd é capturada automaticamente no próximo campo vazio (A → B → C...).

---

### Estrutura da Extensão

```text
extension/
├── manifest.json          # Manifest V3
├── background.js          # Service worker (gerencia ícone)
├── content.js             # Script injetado nas páginas
├── content.css            # Estilos do painel flutuante
├── popup.html             # Mini popup do ícone (botão "Abrir Calculadora")
├── popup.js
├── calculator.html        # HTML da calculadora (carregado no iframe)
├── calculator.js          # Bundle JS da calculadora React
├── calculator.css         # Bundle CSS da calculadora
├── icon-16.png
├── icon-48.png
└── icon-128.png
```

---

### Funcionalidades

#### 1. Painel Flutuante Arrastável
- Ao clicar no ícone da extensão, um painel é injetado na página atual
- Painel contém a calculadora completa em um iframe (mesma UI atual)
- **Arrastável** pelo header (cursor: move)
- **Redimensionável** (canto inferior direito)
- Botões: minimizar, fechar, ativar/desativar modo captura
- Posição inicial: canto superior direito, com z-index altíssimo (999999)

#### 2. Modo Captura Automática de Odds
- Botão "🎯 Capturar Odds" no header do painel
- Quando ativo:
  - Hover em números na página mostra **highlight vermelho** (Sharingan style)
  - Tooltip flutuante: "Clique para adicionar como Odd A" (ou B, C...)
  - Click captura o valor e adiciona ao próximo campo vazio
  - Lógica de detecção: regex para números no formato `1.50`, `2,30`, `10.00`, etc.
  - Validação: só aceita números entre 1.01 e 99.99
- Quando inativo:
  - Página funciona normalmente, sem interferência

#### 3. Comunicação Painel ↔ Content Script
- Content script → Iframe: `postMessage` com odd capturada
- Iframe → Content script: `postMessage` para ativar/desativar captura, solicitar reset

---

### Detalhes Técnicos

#### Manifest V3
```json
{
  "manifest_version": 3,
  "name": "Madara Surebet",
  "version": "1.0.0",
  "description": "Calculadora de Surebet com captura automática de odds",
  "permissions": ["activeTab", "storage"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon-48.png"
  },
  "background": { "service_worker": "background.js" },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "css": ["content.css"]
  }],
  "web_accessible_resources": [{
    "resources": ["calculator.html", "calculator.js", "calculator.css", "icon-*.png"],
    "matches": ["<all_urls>"]
  }],
  "icons": { "16": "icon-16.png", "48": "icon-48.png", "128": "icon-128.png" }
}
```

#### Lógica de Captura de Cliques
```js
// content.js (resumo)
document.addEventListener('click', (e) => {
  if (!captureMode) return;
  const text = e.target.innerText?.trim();
  const match = text?.match(/^(\d+[.,]\d{1,2})$/);
  if (match) {
    e.preventDefault();
    e.stopPropagation();
    const odd = parseFloat(match[1].replace(',', '.'));
    if (odd > 1 && odd < 100) {
      iframe.contentWindow.postMessage({ type: 'ODD_CAPTURED', value: odd }, '*');
    }
  }
}, true); // capture phase para interceptar antes
```

#### Lógica no React (calculator.html)
- Listener em `window.addEventListener('message', ...)` no `SurebetCalculator.tsx`
- Ao receber `ODD_CAPTURED`, encontrar primeiro índice onde `odds[i] === 0` e atualizar
- Se todos preenchidos, mostra toast: "Todos os campos preenchidos. Limpe um para capturar mais."

---

### Etapas de Implementação

1. **Criar pasta `extension/`** com todos os arquivos base (manifest, icons, popup, content script, CSS do painel flutuante)
2. **Adicionar script de build** que copia/bundla a calculadora React para `extension/calculator.{html,js,css}`
3. **Modificar `SurebetCalculator.tsx`** para escutar mensagens `postMessage` e auto-preencher odds capturadas
4. **Implementar content script** com:
   - Injeção do iframe flutuante
   - Drag & drop do painel
   - Modo captura com highlight visual
   - Comunicação postMessage
5. **Criar popup.html** simples com botão "Abrir Calculadora na Página"
6. **Gerar ícones** (16, 48, 128px) com tema Madara (vermelho/preto)
7. **Empacotar como ZIP** em `public/madara-surebet-extension.zip` para download
8. **Adicionar botão de download** na página principal com instruções de instalação

---

### Limitações Conhecidas
- Algumas casas de apostas com CSP restritivo podem bloquear o iframe (raro)
- Sites SPA que atualizam DOM dinamicamente: captura continua funcionando pois o listener é global
- Não funciona em páginas internas do Chrome (chrome://) — restrição do navegador

---

### Resultado Final
- Usuário instala extensão em modo desenvolvedor
- Acessa Bet365, Betano, Pinnacle, etc.
- Clica no ícone → painel Madara Surebet aparece flutuante
- Ativa "Capturar Odds" → clica em 2.10 da Casa A → preenche Odd A
- Vai para outra casa, clica em 1.95 → preenche Odd B
- Resultado calculado automaticamente, mantendo todas as funcionalidades atuais (freebet, lock, etc.)