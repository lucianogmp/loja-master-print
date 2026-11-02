# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Compradores da Master Print** (público principal): empresas e profissionais que encomendam material gráfico (banners, lonas, adesivos, cartões, impressos). Público misto: clientes de Governador Valadares e região (DDD 33) retiram na loja ou recebem entrega local; clientes de outras cidades recebem por envio. Os recorrentes repetem pedidos pelo celular, muitas vezes já em conversa com a loja no WhatsApp; os novos chegam por links de redes sociais e WhatsApp e precisam entender rápido o que é, como pede e como fala com a loja.
- **Dono e equipe da gráfica** (público secundário): atendem no WhatsApp, acompanham pedidos no ERP e operam o `/admin` da loja (empresa, aparência, início, produtos, derivados, categorias, páginas), às vezes pelo celular.

## Product Purpose

Loja online da gráfica Master Print: vitrine e canal de pedido separados do ERP, mas alimentados por ele. O comprador escolhe produto, opções, medida (preço por m²), quantidade e arte, monta o carrinho e finaliza com conta; o pedido é gravado no ERP e o comprador acompanha o status (Recebido, Em produção, Pronto, Entregue, Cancelado) na própria loja. Ajuste de arte, prazo, pagamento e entrega continuam sendo combinados no WhatsApp.

Sucesso: menos mensagens manuais ("cadê meu pedido?", "como entro?"), recompra sem esforço e uma loja que transmite confiança a quem chega pela primeira vez.

## Positioning

Gráfica com produção própria e atendimento humano próximo: a loja estrutura o pedido e o acompanhamento; o WhatsApp resolve o que precisa de conversa. Diferenciais confirmados em entrevista (2026-11-02):

1. Atendimento próximo pelo WhatsApp, com ajuste de arte e negociação direta.
2. Medida sob medida e itens sob consulta resolvidos por orçamento. Produtos por m² chegam do ERP como "sob consulta": a loja não mostra preço deles, monta o pedido de orçamento com a medida e o envia pelo WhatsApp.
3. Derivados: artes prontas sobre produtos base, para o cliente repetir sem reenviar arquivo.
4. Produção própria com prazo curto.

Uma gráfica online nacional vende padrão e escala; a Master Print vende proximidade, medida certa e prazo.

## Operating Context

- **WhatsApp é o canal central.** Número, mensagem padrão e horário de atendimento vêm do `/admin`; produtos "sob consulta" levam direto ao WhatsApp; a loja mostra o horário em destaque.
- **Conta obrigatória para pedir** (e-mail e senha). Login com Google foi adiado para uma entrega futura.
- **Dados vêm do ERP.** Configuração da empresa, catálogo, páginas de texto e pedidos são servidos pelo Supabase do ERP (RPCs `loja_config`, `loja_catalogo_v2`, `loja_paginas`; Edge Functions `loja-criar-pedido`, `loja-meus-pedidos`). Compradores autenticam num projeto Supabase próprio. A loja nunca altera o ERP.
- **Entrega:** retirada na loja para quem é da região; envio para as demais cidades. A loja não calcula frete nem cobra online; isso é combinado no WhatsApp após o pedido.
- **Instalável como app** no celular (PWA com ícone, cor e áreas seguras), sem push nem modo offline.
- **Tema escuro e claro**, com a escolha salva na mesma chave do ERP (`master-print-theme`).
- **Infra:** SPA React + Vite na Vercel, com `/api/manifest` servindo o manifesto. Desenvolvimento local com `npm run dev` (Vite, porta 5173). Testes: Vitest + Testing Library e Playwright com rede interceptada.

## Capabilities and Constraints

**Funciona hoje**

- Início com destaque configurável, categorias e produtos mais pedidos; catálogo com busca e filtro por categoria; busca dedicada no celular com buscas recentes.
- Página de produto com opções, medida em cm, quantidade e opção de arte; derivados com arte fixa; produto sob consulta abre o WhatsApp.
- Carrinho guardado no navegador; checkout com endereço salvo e CEP automático; pedido gravado no ERP.
- Pedidos como destino próprio: lista com abertura instantânea (cache por comprador), atualização automática, puxar para atualizar, detalhe com linha do tempo e atalho de WhatsApp sobre o pedido.
- Conta em telas separadas: dados, endereços, segurança, privacidade; avatar com iniciais quando logado.
- Telas de autenticação isoladas: Entrar, Criar conta, Esqueci minha senha, Redefinir senha, Confirme seu e-mail, sempre devolvendo o comprador para onde estava.
- Celular com barra inferior (Início, Buscar, Carrinho, Pedidos, Conta), menu lateral e barra de topo contextual; computador mantém cabeçalho e rodapé.
- Admin com menu lateral; nenhum elemento da loja aparece dentro do `/admin`.

**Restrições duráveis**

- Não alterar o ERP: só existem os status, campos e ações que ele já expõe.
- Fora da loja por decisão registrada: pagamento online, cálculo de frete, upload ou visualização de arte na página do pedido, repetir pedido, cancelar pela loja, notificações push e modo offline. As decisões estão em `.compozy/tasks/ux-app-mobile/adrs/`.
- Tudo que o `/admin` configura sobrescreve os padrões de `src/config.ts`; sem WhatsApp configurado, nenhum atalho de WhatsApp é renderizado.
- Links antigos (`/conta?aba=...`) continuam válidos.

**Terminologia**

- "Derivado": arte pronta aplicada sobre um produto base.
- "Sob consulta": produto sem preço na loja; o pedido vira conversa no WhatsApp.
- "Atendimento": horário e canais de contato da loja.
- Etapas do pedido: Recebido, Em produção, Pronto, Entregue, Cancelado.

**Em aberto**

- Como o envio para outras cidades aparece na loja (hoje só é tratado no WhatsApp).
- Fotos reais por produto dependem de o ERP tê-las cadastradas.

## Brand Commitments

- Nome **Master Print**; slogan padrão "Sua gráfica online" (editável no `/admin`).
- A identidade visual é a que o dono configura no `/admin`: logo claro e escuro, favicon, ícone do app e cor principal. Padrões: `public/favicon.svg`, `public/icones/*.png`, azul `#3b82f6`.
- O visual herdado do ERP (fonte Outfit, azul, cards de vidro, tema escuro padrão) é herança técnica, não compromisso de marca: a loja pode evoluir sem acompanhar o ERP (confirmado em entrevista, 2026-11-02).
- O verde do WhatsApp fica no botão de WhatsApp porque é a cor que o cliente reconhece.
- Voz observada no produto: português do Brasil, direto, "você", sem jargão técnico ("Falar no WhatsApp", "Sua sessão expirou. Entre novamente.").

## Evidence on Hand

- Fotos de produto vêm do ERP (`imagens[]` por produto e imagem por categoria); sem foto, a loja gera uma ilustração padrão. Não há banco de fotos reais no repositório.
- Não há depoimentos, logos de clientes, números de produção, prêmios ou prova social no repositório. Não fabricar.
- Conteúdo institucional (páginas de texto) é cadastrado no ERP e servido por `loja_paginas`.
- Especificações da última entrega: `.compozy/tasks/ux-app-mobile/` (PRD, histórias de usuário, TechSpec, contrato de testes, ADRs).

## Product Principles

1. **O WhatsApp é parceiro, não concorrente.** A loja estrutura o pedido e o acompanhamento; a conversa fecha o que precisa de gente.
2. **Recompra em um polegar.** Quem já comprou acha e repete com o mínimo de passos, no celular, em movimento.
3. **Só prometer o que o ERP sustenta.** Status, prazos e dados exibidos vêm do ERP; nada é inventado nem adiantado.
4. **Configurável pelo dono.** Marca, textos, horário e destaque são do `/admin`; o código oferece padrões decentes e nunca os trava.
5. **Confiança para quem chega por link.** Na primeira visita, fica claro o que a loja é, como se pede e como se fala com ela.

## Accessibility & Inclusion

Nenhum padrão formal foi exigido. Práticas já adotadas e que devem ser preservadas: `prefers-reduced-motion` remove transições, o menu lateral prende o foco e fecha com Escape, áreas de toque de pelo menos 44 px na navegação do celular, formulários com `role="alert"` nas mensagens de erro.
