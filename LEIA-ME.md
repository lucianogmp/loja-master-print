# Loja Master Print (site)

Projeto separado do ERP. Esta primeira versão é uma **base visual**: não está
conectada ao ERP nem ao Supabase, e usa produtos, preços e ilustrações de exemplo.

## Como rodar no seu computador

Precisa do Node.js (versão 20 ou mais nova).

```
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente http://localhost:5173).

Para conferir se tudo compila: `npm run build`.

## Testes

- `npm test` — testes de unidade e integração (Vitest + Testing Library), uma vez
- `npm run test:watch` — os mesmos testes, rodando de novo a cada alteração
- `npm run test:e2e` — testes no navegador (Playwright), no celular (Pixel 7) e no computador (1280×800).
  Sobem o `vite` sozinhos e não usam internet: toda a rede é respondida por `e2e/rede.ts` com os dados de `e2e/fixtures/`.
  Na primeira vez, instale o navegador: `npx playwright install chromium`

Os testes ficam ao lado do código (`*.test.ts(x)`); o nome de cada caso começa com o ID do contrato de testes (ex.: `UT-001`).

## Visual (igual ao ERP)

- Fonte Outfit (carregada do Google Fonts, como no ERP)
- Azul como cor principal, cards de vidro translúcido, botões e abas em degradê azul
- Tema escuro (padrão) e claro, com botão no cabeçalho. A escolha fica salva no navegador,
  na mesma chave do ERP (`master-print-theme`); sem escolha, segue o tema do aparelho
- Logotipo e ícone iguais aos do ERP
- Todas as cores ficam como variáveis no topo de `src/styles.css`, copiadas do `theme.css`
  e `index.css` do ERP. Se o ERP mudar de visual, atualize essas variáveis
- O verde do botão de WhatsApp foi mantido de propósito, porque é a cor que o cliente reconhece

## O que já funciona

- Home com destaque, categorias e produtos mais pedidos
- Catálogo com busca e filtro por categoria
- Página de produto com opções, medida em cm (preço por m²), quantidade e opção de arte
- Produto "sob consulta" leva direto ao WhatsApp
- Carrinho (guardado no navegador) e tela de finalização
- Finalizar abre o WhatsApp com o resumo do pedido
- Botão flutuante de WhatsApp em todas as telas
- Pedidos como destino próprio (`/pedidos`): lista que abre na hora (cache por comprador no navegador) e se atualiza sozinha, puxar para atualizar no celular, detalhe com linha do tempo (Recebido → Em produção → Pronto → Entregue)
- Minha conta em telas separadas (`/conta`, `/conta/dados|enderecos|seguranca|privacidade`): menu de opções no celular e menu lateral no computador; links antigos `/conta?aba=…` continuam funcionando
- Visual responsivo (celular e computador)

## O que ainda NÃO existe

- Conexão com o catálogo do ERP / Supabase
- Pagamento online, cálculo de frete, upload de arte
- Gravação do pedido no ERP
- Fotos reais (as imagens atuais são ilustrações de exemplo)

## Onde mexer

- `src/config.ts` — número do WhatsApp (hoje é um valor de exemplo), horário, nome
- `src/data/produtos.ts` — produtos e categorias de exemplo
- `src/lib/preco.ts` — cálculo de preço de exemplo
- `src/styles.css` — cores e visual (variáveis no topo do arquivo)

## Antes de subir para o GitHub

Crie um repositório novo e vazio para a loja (separado do ERP). A pasta já tem
`.gitignore`, então `node_modules` e `dist` não vão junto.

## Supabase (projeto dos compradores): URLs de redirecionamento

Em **Authentication → URL Configuration → Redirect URLs**, libere o endereço do site com os caminhos `/redefinir-senha` e `/confirme-email` (e os de destino do `?voltar=`, como `/checkout`). Sem isso, os links de "Esqueci minha senha" e de confirmação de cadastro não voltam para a loja.

## Ícone do aplicativo

- Sem ícone configurado em `/admin`, o manifesto (`/api/manifest`) e o ícone do iPhone usam os PNGs de `public/icones/` (`icone-192`, `icone-512`, `icone-512-maskable`, `icone-180`), gerados do `public/favicon.svg` sobre `#3b82f6`.
- Para regenerar depois de mudar o favicon: `npm run icones` e commite os PNGs (o build da Vercel não roda o script).
- O ícone do aplicativo configurado em `/admin` (`iconeApp`) sempre substitui os padrões, no manifesto e no ícone de toque.
