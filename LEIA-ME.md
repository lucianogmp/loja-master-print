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
