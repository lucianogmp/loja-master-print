---
target: experiência de app da loja (casca do celular e telas principais)
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/tiagosantosdev/code/ts-softwares/loja-master-print/src/components/LojaShell.tsx"
target_fingerprint: "sha256:3c534e630685ad71638ea940557bd6106ac452bfdee59fcfdcdcb18ed4e03fe0"
target_path: /Users/tiagosantosdev/code/ts-softwares/loja-master-print/src/components/LojaShell.tsx
timestamp: 2026-11-02T10-10-06Z
slug: src-components-lojashell-tsx
---
Method: dual-agent (A: revisão de design isolada · B: detector CLI + detector injetado, isolados)

Alvo: experiência de app da loja (casca do celular, Início, Buscar, Catálogo, Produto, Pedidos, Detalhe do pedido, Conta, Entrar), 48 capturas Pixel 7 e 1280x800, temas claro e escuro, dados de fixture. Checkout preenchido avaliado só pelo código.

## Design Health Score
| # | Heurística | Nota | Problema-chave |
|---|---|---|---|
| 1 | Visibilidade do status | 2 | Produto aberto por link: total "—" e botão desabilitado sem motivo |
| 2 | Mundo real | 3 | "Atendimento" com três sentidos |
| 3 | Controle e liberdade | 3 | Checkout vazio só oferece "Ver produtos" |
| 4 | Consistência | 2 | WhatsApp com 4 rótulos; degradê ativo falha contraste no claro |
| 5 | Prevenção de erros | 2 | Pagamento/frete combinados depois não ficam claros antes de enviar |
| 6 | Reconhecimento | 3 | Menu repete categorias dos chips |
| 7 | Flexibilidade | 2 | Sem atalho para o último pedido/produto |
| 8 | Estética e minimalismo | 2 | 1ª dobra da Início só hero; 5 entradas de WhatsApp; vazios |
| 9 | Recuperação de erros | 2 | Botão travado sem caminho |
| 10 | Ajuda | 3 | Aviso de pagamento/frete tardio e discreto |
| Total | | 24/40 | Aceitável |

## Design Specificity Verdict
Avaliação: casca intercambiável; destaque da Início é texto de modelo. Produto aparece só no detalhe do pedido (linha do tempo do ERP + WhatsApp do pedido), em "Sobre a arte"/prazo e no horário. Diferenciais do PRODUCT.md (m², sob consulta, artes prontas, produção própria) ausentes antes do produto.
Detector: CLI 0 achados (esperado: regras dependem de estilo computado). Injetado em 8 rotas x 2 viewports: low-contrast (real; branco sobre #3b82f6 3,68:1, marca celular 3,68:1, #ef4444 3,76:1, #64748b/#e8edf5 4,05:1, placeholder 3,64:1), dark-glow (WhatsApp, escolha de estilo), shape-assembled-illustration (real enquanto faltar foto), gradient-text (permitido pelo DESIGN.md; decidir), hero-eyebrow-chip (real), flat-type-hierarchy (real; /pedidos/42 razão 1,05), skipped-heading (real; /produtos desktop). Sem overlay visível (headless).

## What's Working
- Detalhe do pedido: linha do tempo honesta com o ERP, itens, total, WhatsApp do pedido.
- Abas com rótulo, ativo claro, avatar, contador acessível, alvos de 44 px.
- Telas de entrada isoladas e focadas.

## Priority Issues
- [P0] Produto aberto por link não deixa comprar: variação definida antes do catálogo carregar (src/pages/ProdutoPage.tsx:24), total "—", botão desabilitado sem texto. Fix: definir/derivar variação quando o produto chega; dizer o que falta ao lado do botão. /impeccable harden
- [P1] Contraste abaixo de 4,5:1 no tema claro (degradê ativo, marca celular, vermelhos fixos, texto sutil, placeholders); piora com cor clara do /admin. Fix: degradê mais escuro ou cor do texto por luminância; escurecer texto sutil; vermelhos via --erro. /impeccable audit → /impeccable colorize
- [P1] Início não vende o diferencial: selo genérico, frase de modelo, ilustração; benefícios pequenos; cartões sem selo de tipo. Fix: fato verdadeiro no selo, entrada "banner sob medida: preço na hora", selos sob medida/sob consulta/arte pronta, faixa de benefícios. /impeccable shape → /impeccable bolder
- [P2] WhatsApp em 5 entradas e 4 rótulos; botão flutuante sobre formulários. Fix: rótulo padrão; esconder flutuante em formulários. /impeccable distill → /impeccable clarify
- [P2] Hierarquia plana nas telas internas, título pulado no catálogo, vazios sem próximo passo, aviso de pagamento/frete só depois do pedido. Fix: escala tipográfica, vazios com ação, aviso no resumo do checkout. /impeccable typeset → /impeccable onboard

## Persona Red Flags
- Casey: produto por link travado; flutuante cobre quantidade; menu à esquerda com 14 pontos.
- Riley: botão desabilitado sem motivo; "Preço de exemplo" contradiz o preço; regra de sob consulta só no checkout.
- Jordan: Início não explica como pedir; "Sob consulta" sem explicação; conta obrigatória tardia; Entrar sem benefício.
- Recorrente: nada leva ao último pedido; lista sem medida/miniatura.

## Minor Observations
Migalhas redundantes no celular; "Tema" sem estado; "Agora não" solto no hub; botões secundários estreitos no detalhe; cabeçalho desktop ~150 px; rodapé com dados de fixture.

## Questions to Consider
- Por que a 1ª dobra não mostra "largura × altura = preço"?
- Cinco portas para o WhatsApp e nenhuma diz o que acontece depois?
- Qual atalho honesto leva do pedido 41 ao produto certo em dois toques?
