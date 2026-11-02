---
name: Master Print
description: Loja online da gráfica Master Print, vitrine noturna de vidro com casca de app no celular.
colors:
  azul-vitrine: "#3b82f6"
  azul-vitrine-fundo: "#1d4ed8"
  azul-vitrine-claro: "#60a5fa"
  azul-vitrine-medio: "#2563eb"
  noite-topo: "#0c0d16"
  noite-fundo: "#040408"
  vidro-noite: "rgba(13, 13, 25, 0.55)"
  superficie-forte-noite: "rgba(10, 10, 18, 0.7)"
  superficie-suave-noite: "rgba(10, 10, 18, 0.25)"
  campo-noite: "rgba(7, 7, 12, 0.6)"
  folha-noite: "#10111c"
  painel-noite: "#1a2332"
  arte-noite: "#111a2e"
  borda-vidro-noite: "rgba(255, 255, 255, 0.08)"
  borda-vidro-noite-hover: "rgba(255, 255, 255, 0.16)"
  texto-noite: "#ffffff"
  texto-noite-secundario: "#f3f4f6"
  texto-noite-suave: "#b6bfce"
  texto-noite-sutil: "#9aa5b8"
  texto-noite-apagado: "#8b95a7"
  papel-topo: "#f8fbff"
  papel-fundo: "#e8edf5"
  vidro-dia: "rgba(255, 255, 255, 0.78)"
  superficie-forte-dia: "rgba(255, 255, 255, 0.92)"
  superficie-suave-dia: "rgba(241, 245, 249, 0.8)"
  arte-dia: "#e3eaf5"
  borda-vidro-dia: "rgba(15, 23, 42, 0.12)"
  texto-dia: "#0f172a"
  texto-dia-secundario: "#1f2937"
  texto-dia-suave: "#475569"
  texto-dia-sutil: "#5b6779"
  texto-dia-apagado: "#606b7c"
  verde-dinheiro-noite: "#10b981"
  verde-dinheiro-dia: "#166534"
  verde-whatsapp: "#25d366"
  tinta-whatsapp: "#052e16"
  erro-noite: "#f87171"
  erro-dia: "#b3261e"
  vermelho-cancelado: "#ef4444"
  branco: "#ffffff"
typography:
  display:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(1.9rem, 4.5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(1.6rem, 3vw, 2.2rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
    lineHeight: 1.2
  marca:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.05em"
  preco:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 800
    lineHeight: 1.15
  body:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.5
  body-small:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0.04em"
  tab-label:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  campo: "0.5rem"
  controle: "0.6rem"
  botao: "0.75rem"
  cartao: "0.9rem"
  vidro: "1rem"
  arte: "1.25rem"
  folha: "16px"
  pilula: "999px"
  circulo: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  secao: "32px"
  hero: "48px"
  calha: "16px"
  toque: "44px"
  barra-topo: "52px"
  barra-inferior: "56px"
  conteudo-max: "1180px"
components:
  button-primary:
    backgroundColor: "{colors.azul-vitrine-medio}"
    textColor: "{colors.branco}"
    typography: "{typography.body}"
    rounded: "{rounded.botao}"
    padding: "12px 22px"
  button-primary-hover:
    backgroundColor: "{colors.azul-vitrine-fundo}"
    textColor: "{colors.branco}"
  button-secondary:
    backgroundColor: "{colors.superficie-suave-noite}"
    textColor: "{colors.texto-noite}"
    rounded: "{rounded.botao}"
    padding: "12px 22px"
  icon-button:
    textColor: "{colors.texto-noite-suave}"
    rounded: "{rounded.controle}"
    size: "40px"
  input:
    backgroundColor: "{colors.campo-noite}"
    textColor: "{colors.texto-noite}"
    typography: "{typography.body}"
    rounded: "{rounded.campo}"
    padding: "0.75rem 1rem"
  card-glass:
    backgroundColor: "{colors.vidro-noite}"
    textColor: "{colors.texto-noite}"
    rounded: "{rounded.vidro}"
  card-pedido:
    backgroundColor: "{colors.vidro-noite}"
    rounded: "{rounded.cartao}"
    padding: "12px 14px"
  chip-categoria:
    backgroundColor: "{colors.superficie-suave-noite}"
    textColor: "{colors.texto-noite-suave}"
    rounded: "{rounded.pilula}"
    padding: "7px 14px"
  chip-categoria-ativo:
    backgroundColor: "{colors.azul-vitrine-medio}"
    textColor: "{colors.branco}"
    rounded: "{rounded.pilula}"
    padding: "7px 14px"
  chip-etapa:
    textColor: "{colors.azul-vitrine-claro}"
    rounded: "{rounded.pilula}"
    padding: "2px 10px"
  barra-inferior:
    backgroundColor: "{colors.superficie-forte-noite}"
    textColor: "{colors.texto-noite-suave}"
    height: "56px"
  barra-inferior-aba-ativa:
    textColor: "{colors.azul-vitrine-claro}"
  barra-topo-app:
    backgroundColor: "{colors.superficie-forte-noite}"
    textColor: "{colors.texto-noite}"
    height: "52px"
  drawer-painel:
    backgroundColor: "{colors.superficie-forte-noite}"
    textColor: "{colors.texto-noite}"
    width: "min(320px, 86vw)"
  sob-medida:
    backgroundColor: "{colors.vidro-noite}"
    textColor: "{colors.texto-noite}"
    rounded: "{rounded.vidro}"
    padding: "24px"
  card-selo:
    backgroundColor: "{colors.superficie-forte-noite}"
    textColor: "{colors.texto-noite}"
    rounded: "{rounded.pilula}"
    padding: "3px 9px"
  whatsapp-flutuante:
    backgroundColor: "{colors.verde-whatsapp}"
    textColor: "{colors.tinta-whatsapp}"
    rounded: "{rounded.pilula}"
    height: "52px"
    padding: "0 20px 0 16px"
---

# Design System: Master Print

## Overview

**Creative North Star: "A Vitrine Noturna"**

A loja é uma vitrine iluminada por trás num fundo escuro. O fundo é quase preto, com um halo frio no topo; sobre ele, painéis de vidro translúcido deixam o fundo atravessar e seguram o conteúdo. O azul é a luz da vitrine: aparece forte no que pede ação (o botão principal, a aba ativa, a etapa atual do pedido) e quase some no resto. Produto, preço e status são as peças expostas; a moldura fica em segundo plano.

O clima é **confiável e organizado, moderno e tecnológico**. Preço, etapa e próxima ação estão sempre legíveis, em hierarquia previsível, e o vidro com brilho sinaliza uma loja atual, não um catálogo impresso escaneado. A densidade é de comércio: grade compacta de seis cartões por linha no computador e dois no celular, títulos em duas linhas, preço em destaque. No celular a loja vira app: barra de topo de uma linha, barra inferior com cinco abas, menu lateral e transições de empurrar e recuar.

A cor principal é do dono, não do código. O `/admin` troca o azul e o sistema recalcula as quatro variações a partir dela, então toda regra deste documento fala do papel "Azul Vitrine", não do matiz. O tema escuro é o padrão; o claro é um par completo, nunca um tema de segunda classe.

**Key Characteristics:**
- Fundo noturno com halo radial e painéis de vidro com desfoque de 20 px e saturação de 180%.
- Um único acento, o Azul Vitrine, aplicado como degradê de 135° em tudo que é ativo ou principal.
- Outfit com pesos altos (700 a 900) para títulos, marca e preço; texto corrido em 400.
- Brilho azul só como resposta a estado: hover, foco, item ativo.
- Casca de app no celular com alvos de toque de 44 px e áreas seguras respeitadas.
- Tema escuro padrão e tema claro completo, com a escolha compartilhada com o ERP.

## Colors

Paleta de um acento só sobre neutros frios: noite azulada no tema escuro, papel azul-acinzentado no claro, e três cores semânticas com papel fixo.

### Primary
- **Azul Vitrine** (`azul-vitrine`): a luz da vitrine. Botão principal, aba e chip ativos, contador do carrinho, borda de campo em foco, etapa atual da linha do tempo, contorno de foco. Vem da variável `--cor-1`, que o `/admin` sobrescreve.
- **Azul Vitrine Fundo** (`azul-vitrine-fundo`): o fim do degradê de 135° do botão principal e dos itens ativos, o início do degradê no hover, e a base da cor de link no tema claro (`--cor-2`, a cor do dono com 30% de preto).
- **Azul Vitrine Claro** (`azul-vitrine-claro`): base da cor de link e da aba ativa no tema escuro (`--cor-3`, 30% de branco). Nunca recebe texto branco por cima.
- **Azul Vitrine Médio** (`azul-vitrine-medio`): início do degradê de 135° de tudo que é ativo, fim do degradê no hover e base das sombras azuis (`--cor-4` e `--cor-rgb-2`, 15% de preto). É a ponta mais clara sob texto, por isso o degradê começa nele.

### Secondary
- **Verde Dinheiro** (`verde-dinheiro-noite` / `verde-dinheiro-dia`): todo valor em reais que o comprador vai pagar (caixa de preço, total do item no carrinho) e a etapa "Entregue". Mais escuro no tema claro para manter contraste.
- **Verde WhatsApp** (`verde-whatsapp`): exclusivo do botão flutuante e dos atalhos de WhatsApp. É a cor que o cliente reconhece. Ícone e rótulo sobre ele usam a **Tinta WhatsApp** (`tinta-whatsapp`, 7,5:1), porque branco sobre esse verde fica em 2:1.

### Tertiary
- **Erro** (`erro-noite` / `erro-dia`): mensagens de erro de campo e de formulário (`--erro`).
- **Vermelho Cancelado** (`vermelho-cancelado`): só o fundo tingido (15% e 12%) do chip e do aviso de pedido cancelado. O texto desses avisos e da linha "Sair" usa a cor de Erro do tema.

### Neutral
- **Noite** (`noite-topo` até `noite-fundo`): fundo do corpo em degradê radial, mais claro no topo central. Fixo na rolagem.
- **Vidro Noite** (`vidro-noite`): superfície de cartões, resumo, formulário de checkout e caixa de preço.
- **Superfície Forte** (`superficie-forte-noite` / `superficie-forte-dia`): barras de topo e inferior, cabeçalho do computador e menu lateral, onde o conteúdo rola por baixo e o texto precisa de mais opacidade.
- **Superfície Suave** (`superficie-suave-noite` / `superficie-suave-dia`): botão secundário, chips inativos, avisos, campo de busca e esqueletos de carregamento.
- **Campo** (`campo-noite`): fundo dos campos de formulário, que escurece ainda mais no foco.
- **Folha** (`folha-noite`): folha de instruções que sobe do rodapé e o fundo invertido do aviso flutuante. Opaca de propósito.
- **Arte** (`arte-noite` / `arte-dia`): fundo atrás da imagem ou da ilustração gerada de cada produto.
- **Borda de Vidro** (`borda-vidro-noite`, `borda-vidro-dia`): o fio de 1 px que contorna todo vidro e separa linhas de listas; mais forte no hover.
- **Texto** em cinco degraus por tema: primário para títulos e valores, secundário para corpo, suave para rótulos e ícones, sutil para legendas e seções do menu, apagado para placeholders.
- **Papel** (`papel-topo` até `papel-fundo`) e **Vidro Dia** (`vidro-dia`): os equivalentes do tema claro.

### Named Rules
**The Owner's Blue Rule.** Nenhum azul é escrito direto no CSS ou no componente. Toda aplicação do acento passa por `--cor-1` a `--cor-4`, `--cor-rgb` e `--cor-rgb-2`, porque o dono troca a cor no `/admin` e o sistema inteiro tem de acompanhar.

**The One Light Rule.** O degradê do Azul Vitrine marca só o que é ativo ou principal: o botão de ação, a aba ou chip selecionado, o item atual do menu, a etapa concluída. Se dois degradês competem na mesma área visível, um deles está errado.

**The Legible Light Rule.** Texto sobre o degradê usa `--cor-texto` e links usam `--link`, que vem de `--cor-link-claro` ou `--cor-link-escuro`. A loja calcula os três a partir da cor do dono para manter 4,5:1: o texto vira escuro quando a cor é clara demais, e o link escurece ou clareia até passar. Nunca escreva `#fff` sobre uma superfície em degradê.

**The Paired Token Rule.** Toda variável de cor nasce com valor nos dois temas, no bloco escuro e no bloco claro do topo de `src/styles.css`. Variável usada sem definição cai no fallback e quebra um dos temas.

## Typography

**Display Font:** Outfit (com a pilha do sistema: -apple-system, Segoe UI, Roboto, Helvetica, Arial)
**Body Font:** Outfit
**Label/Mono Font:** Outfit, sem fonte mono

**Character:** Uma geométrica só, carregada do Google Fonts nos pesos 300 a 900. A personalidade vem do contraste de peso: títulos e preço em 800, marca em 900 apertada, corpo em 400.

### Hierarchy
- **Display** (800, clamp de 1.9rem a 3rem, 1.2): título do destaque da Início. A parte destacada do título é a única ocorrência de texto em degradê animado.
- **Headline** (800, clamp de 1.6rem a 2.2rem, 1.2): título de página e nome do produto.
- **Title** (700, 1.05rem, 1.2): título da barra de topo do celular, títulos de folhas e blocos. O resumo e o checkout usam 1.15rem; os subtítulos da conta no computador, 1.3rem.
- **Marca** (900, 1.3rem, espaçamento -0.05em): o logotipo em texto, com a primeira palavra no tom de link. Cai para 1.05rem na barra do celular.
- **Preço** (800, 1.1rem nos cartões, 1.7rem na caixa de preço): sempre o elemento mais pesado do cartão.
- **Body** (400, 0.95rem, 1.5): campos, opções e texto corrido. Descrições usam o texto suave; a faixa vai de 0.85rem a 1rem conforme a densidade.
- **Body Small** (400, 0.85rem): dicas, legendas, migalhas e mensagem de atendimento.
- **Label** (700, 0.78rem, espaçamento 0.04em, caixa alta): rótulos de campo e títulos de seção do menu lateral, estes com espaçamento 0.06em.
- **Tab Label** (600, 0.7rem): rótulos das cinco abas da barra inferior.

### Named Rules
**The Weight Carries Hierarchy Rule.** A hierarquia sobe pelo peso antes de subir pelo tamanho: preço em 800 num cartão de 0.86rem é o que o olho acha primeiro. Novos títulos usam 700 ou 800; o 500 fica para nomes de produto e chips.

**The Single Gradient Headline Rule.** O texto em degradê animado existe uma vez, no destaque do título da Início. Não replicar em títulos de página, preços ou seções.

## Layout

O conteúdo vive num contêiner centrado (`--conteudo-max`) com calha lateral de 16 px: 1180 px até 1440 px de janela, 1360 px até 1760 px e 1560 px acima disso, para a loja não ficar ilhada no meio de telas grandes. Seções respiram 32 px em cima e embaixo; o destaque da Início, 48 px. O ritmo de espaçamento é de 4 em 4 px, concentrado em 8, 12 e 16 px, com 24 px entre colunas maiores.

A grade de produtos tem oito colunas a partir de 1760 px, sete a partir de 1440 px, seis a partir de 1180 px, cinco até 1180, quatro até 960, três até 760 e duas abaixo de 560 px, com o espaço entre cartões caindo de 12 para 8 px. Página de produto, carrinho e conta usam duas colunas no computador: imagem e informações em partes iguais, lista e resumo de 340 px, menu de 220 px e conteúdo. O resumo, a imagem do produto e o menu da conta ficam presos ao rolar logo abaixo do cabeçalho. Ao lado do menu da conta, listas e detalhes ocupam a coluna inteira: os pedidos em grade de cartões de no mínimo 300 px, e o detalhe em duas colunas, com a linha do tempo à esquerda e itens, total e WhatsApp à direita. Formulários param em 640 px, porque campos longos demais atrapalham a leitura. A cor final do degradê do fundo também é a cor de base da página, para nenhuma área ficar sem fundo.

Abaixo de 768 px a loja troca de casca. A barra de topo de 52 px e a barra inferior de 56 px ficam presas, o conteúdo ganha folga no rodapé para não ficar sob a barra, e o botão de WhatsApp sobe 12 px acima dela. As variáveis de área segura (`--safe-top` a `--safe-left`) entram em toda borda de barra, menu e folha, para o app instalado ficar livre de recortes de câmera e barra de gestos. Alvos de toque têm pelo menos 44 px; linhas de lista, 48 px.

As telas de autenticação ficam fora da casca, numa coluna de até 440 px. O admin tem menu lateral de 220 px no computador e menu deslizante no celular.

## Elevation & Depth

A profundidade vem do vidro em camadas, não de uma pilha de sombras. Todo painel é translúcido sobre o fundo noturno, com desfoque de 20 px e saturação de 180%, fio de borda de 1 px e uma sombra ambiente fixa e difusa. O brilho azul é reservado a estado: aparece no hover de cartões, no foco de campos, no botão principal e na etapa atual. Barras e menu usam a superfície forte, mais opaca, porque o conteúdo passa por baixo delas. Folhas e avisos flutuantes são opacos.

### Shadow Vocabulary
- **Vidro ambiente** (`box-shadow: 0 8px 32px 0 var(--shadow-card)`): todo painel de vidro em repouso.
- **Vidro aceso** (`box-shadow: 0 8px 32px 0 var(--shadow-card), 0 0 20px var(--glass-glow)`): cartão de produto ou categoria no hover, com a borda passando ao tom de hover.
- **Botão WhatsApp** (`box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35)`): só a sombra deslocada, sem halo verde.
- **Botão luminoso** (`box-shadow: 0 4px 14px rgba(var(--cor-rgb-2), 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)`): botão principal e abas de categoria ativas. No hover, `0 6px 20px` a 0.5 com o reflexo interno a 0.25.
- **Campo aceso** (`box-shadow: 0 0 0 1px rgba(var(--cor-rgb), 0.5), 0 0 15px rgba(var(--cor-rgb), 0.3)`): campo em foco.
- **Etapa atual** (`box-shadow: 0 0 0 3px rgba(var(--cor-rgb), 0.25)`): anel do passo corrente na linha do tempo do pedido.
- **Arte em destaque** (`box-shadow: 0 16px 48px var(--shadow-strong), 0 0 40px var(--glass-glow)`): a imagem do destaque da Início, o objeto mais elevado da loja.
- **Folha** (`box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.35)`): folha que sobe do rodapé.

### Named Rules
**The Glow Is A Response Rule.** Superfícies ficam quietas em repouso. O brilho azul aparece só como resposta a hover, foco, seleção ou ao item principal da tela.

**The Glass Recipe Rule.** Vidro novo usa a mesma receita: fundo de vidro do tema, desfoque de 20 px com saturação de 180%, borda de 1 px e a sombra ambiente. Variações de desfoque ou opacidade criam um segundo material.

## Shapes

Cantos suavemente arredondados, crescendo com o tamanho da peça: campos e abas de 0.5rem, botões de ícone de 0.6rem, botões de 0.75rem, cartões de pedido e listas de 0.9rem, painéis de vidro de 1rem, a arte do destaque de 1.25rem. Chips, selos dos cartões e contador são pílulas completas; avatar, botão de WhatsApp e marcadores da linha do tempo são círculos. A folha de instruções tem só os cantos de cima arredondados, em 16 px. Existem valores avulsos em px (6, 8 e 12) em avisos, esqueletos e no cartão de instalação, que devem convergir para a escala em rem.

Bordas são sempre o fio de 1 px da borda de vidro. Listas agrupadas, como o hub da conta, se separam por esse fio entre linhas, sem sombra por item.

## Components

### Buttons
Luminosos e confiantes: o principal é a coisa que brilha na tela.
- **Shape:** cantos suaves (0.75rem), conteúdo centrado com ícone a 8 px do texto.
- **Primary:** degradê de 135° do Azul Vitrine Médio ao Azul Vitrine Fundo, texto em `--cor-texto` (branco no azul padrão) em 700, padding de 12 px por 22 px e o sombreado "Botão luminoso".
- **Hover / Focus:** o degradê inverte, do Fundo ao Médio, e a sombra cresce. Foco por contorno de 2 px no Azul Vitrine, afastado 2 px. Transição de 300 ms.
- **Secondary:** superfície suave com borda de hover e texto primário; no hover ganha fundo azul a 12% e borda azul a 50%.
- **Icon button:** 40 px (44 px nas barras do celular), sem fundo, ícone no texto suave; no hover, ícone no tom de link e fundo azul a 10%.
- **Link button:** texto sublinhado no tom de link, sem caixa. Usado para ações secundárias como "Limpar" e "Sair".
- **Disabled:** opacidade 0.5 e cursor bloqueado.

### Chips
- **Categoria:** pílula com borda de vidro, superfície suave, texto suave em 500, padding de 7 por 14 px, em fileira com rolagem horizontal e encaixe. Ativo: degradê do Azul Vitrine, sem borda, texto branco em 700.
- **Etapa do pedido:** pílula pequena (0.78rem, 700) com fundo do acento a 15% e texto no tom de link. "Entregue" usa o Verde Dinheiro, "Cancelado" o vermelho e estados desconhecidos o neutro com borda.
- **Busca recente:** pílula como a de categoria, com texto primário e corte com reticências.

### Cards / Containers
- **Corner Style:** 1rem nos painéis de vidro, 0.9rem nos cartões de pedido e blocos de conta.
- **Background:** vidro do tema; a área da imagem do produto usa o fundo de arte em proporção 1:1.
- **Shadow Strategy:** "Vidro ambiente" em repouso, "Vidro aceso" no hover dos cartões navegáveis.
- **Border:** fio de 1 px da borda de vidro, mais forte no hover.
- **Internal Padding:** 10 por 12 px no cartão de produto (8 por 10 no celular), 12 por 14 px em pedidos, 16 a 20 px em resumo e checkout.

### Inputs / Fields
- **Style:** fundo de campo, borda de vidro de 1 px, cantos de 0.5rem, padding de 0.75rem por 1rem, 0.95rem. Rótulo acima em caixa alta 0.78rem.
- **Focus:** borda passa ao Azul Vitrine, fundo escurece e acende o "Campo aceso". O contorno padrão é removido só nos campos, porque o brilho o substitui.
- **Error / Disabled:** mensagem abaixo no tom de erro, anunciada como alerta. Senha com botão de mostrar dentro do campo, à direita.
- **Busca do celular:** campo sem borda própria dentro de uma cápsula de superfície suave com cantos de 0.8rem, ícone e botão de limpar.

### Navigation
- **Cabeçalho do computador:** faixa de horário em 0.78rem, linha de marca, busca central de até 520 px com botão em degradê e ações à direita, depois abas de categoria, que quebram em linhas quando não cabem (nunca são cortadas na borda). Tudo em superfície forte com vidro, preso no topo.
- **Barra de topo do celular:** uma linha de 52 px. Nas raízes, menu, marca centrada, busca e avatar; nas subpáginas, voltar, título centrado em 700 com reticências e um espaço do mesmo tamanho do voltar para o título ficar no centro.
- **Barra inferior do celular:** cinco abas em grade, ícone de 24 px sobre rótulo de 0.7rem, texto suave; a ativa usa o tom de link. Contador do carrinho em pílula sobre o ícone. As barras não animam nas transições de tela.
- **Menu lateral:** painel de até 320 px (86% da largura no celular) que desliza da esquerda em 220 ms sobre um fundo preto a 50%. Seções com título em caixa alta sutil e linhas de 44 px. Prende o foco e fecha com Escape, toque no fundo, deslize ou o voltar do aparelho.
- **Menus de conta e admin no computador:** coluna de 220 px; item atual em degradê do Azul Vitrine com texto branco.
- **Transições de tela:** entrar numa subpágina empurra da direita em 240 ms; voltar recua para a direita; trocar de aba não anima. Tudo some com movimento reduzido.

### Cartão de produto
Vidro com imagem 1:1 no fundo de arte, nome em duas linhas (500), prazo de produção em 0.72rem no texto sutil e preço em 800. Produto com arte pronta ganha um selo em pílula no canto superior esquerdo da imagem, na superfície forte com borda de vidro.

### Orçamento sob medida
A entrada de medida da Início. Painel de vidro com título em 800, uma linha de apoio, o campo "O que você precisa" (lista dos produtos sob consulta, ou texto livre quando não há nenhum), largura × altura e quantidade numa linha, e o botão principal "Pedir orçamento no WhatsApp". Não calcula preço: monta a mensagem com produto, medida e quantidade e abre o WhatsApp. Ocupa a coluna do destaque quando o dono não configurou imagem própria; com imagem, vem logo abaixo do destaque. No celular, a quantidade desce para a linha de baixo.

### Linha do tempo do pedido
A peça que mostra o status. Lista vertical com marcadores circulares de 18 px ligados por um fio de 2 px. Etapas concluídas ganham o degradê do Azul Vitrine com um tique branco e fio no acento; a etapa atual é um círculo cheio no acento com o anel "Etapa atual" e texto em 700; etapas futuras ficam em contorno de vidro e texto suave. Pedido cancelado troca a linha por um aviso vermelho.

### Botão flutuante de WhatsApp
No celular, círculo verde de 58 px com o ícone na tinta escura, no canto inferior direito. No computador vira pílula de 52 px com ícone e o rótulo "Falar no WhatsApp" em 800, alinhada à borda direita do conteúdo, e não ao canto da janela. No hover clareia e sobe 2 px; com movimento reduzido, não se mexe. Como todo botão flutuante, passa por cima do conteúdo enquanto a página rola. No celular sobe acima da barra inferior e da área segura. Some nas telas de autenticação, no checkout, no admin e com o menu aberto, e também onde a tela já tem atalho de WhatsApp próprio ou campos de formulário: produto, detalhe do pedido, atendimento, dados, endereços e segurança. Todo atalho de WhatsApp diz a ação seguida de "no WhatsApp" ("Falar no WhatsApp", "Tirar dúvida no WhatsApp", "Pedir orçamento no WhatsApp").

## Do's and Don'ts

### Do:
- **Do** aplicar o acento só pelas variáveis `--cor-1` a `--cor-4`, `--cor-rgb` e `--cor-rgb-2`, e o texto sobre ele por `--cor-texto`, para a cor do `/admin` valer em tudo.
- **Do** criar toda cor nova com par escuro e claro no topo de `src/styles.css`.
- **Do** usar a receita única de vidro: desfoque de 20 px com saturação de 180%, borda de 1 px e sombra ambiente.
- **Do** mostrar todo valor a pagar no Verde Dinheiro e em peso 800.
- **Do** manter alvos de toque de pelo menos 44 px e linhas de lista de 48 px no celular.
- **Do** somar as variáveis de área segura em toda barra, menu ou folha presa à borda da tela.
- **Do** desligar animações e transições sob `prefers-reduced-motion`, como as existentes já fazem.
- **Do** usar a curva `cubic-bezier(0.16, 1, 0.3, 1)` para entradas e 300 ms com `ease` para mudanças de estado.

### Don't:
- **Don't** escrever `#3b82f6` ou qualquer outro azul direto no código.
- **Don't** usar o Verde WhatsApp fora de atalhos de WhatsApp.
- **Don't** acender brilho azul em superfícies em repouso; ele é resposta a estado.
- **Don't** repetir o texto em degradê animado fora do destaque do título da Início.
- **Don't** usar variável de cor sem definição nos dois temas, como `--bg` ou `--text`.
- **Don't** escrever vermelho direto no CSS; texto de erro, cancelamento e "Sair" usa `--erro`.
- **Don't** pôr rótulo ou selo acima de um título; o selo do admin entra na linha de fatos abaixo dos botões.
- **Don't** separar itens de uma lista agrupada com sombra; use o fio de 1 px da borda de vidro.
- **Don't** criar um segundo material de vidro com outro desfoque ou outra opacidade.
