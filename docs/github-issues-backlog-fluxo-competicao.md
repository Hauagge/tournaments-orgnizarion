# Backlog de Issues para GitHub com Análise e Prompt por Issue

Este arquivo contém:
- epics
- issues prontas para GitHub
- análise prática de cada issue
- prompt pronto para execução, sempre focado na praticidade para um usuário que ainda não conhece o sistema

Princípio central:
- o usuário não entende o domínio interno do sistema
- a interface precisa ensinar a próxima ação
- a navegação deve reduzir erro e indecisão
- o fluxo deve deixar claro: onde o usuário está, o que já fez e qual é o próximo passo
- o fluxo operacional só começa de verdade depois que atletas, importação e pesagem estiverem minimamente prontos

Classificação de prioridade prática:
- `Essencial para bloquear erro`: item que impede ação prematura, navegação errada ou operação com dados insuficientes
- `Melhoria de orientação`: item que melhora descoberta, contexto e velocidade, mas sem ser o principal bloqueio de erro

Fluxos corretos considerando usuário iniciante:

`KEYS`
1. Atletas
2. Importação
3. Pesagem
4. Chaves
5. Lutas
6. Distribuição
7. Áreas

`ABSOLUTE_GP`
1. Atletas
2. Importação
3. Pesagem
4. Categorias
5. Lutas
6. Distribuição
7. Áreas

---

## Leitura Prioritária do Backlog

Este arquivo continua contendo todas as issues completas abaixo, mas a leitura recomendada agora é:

### Parte 1: Essenciais para bloquear erro
Ler primeiro estas issues:
- `Issue 0` — checkpoint de prontidão de atletas
- `Issue 0B` — pesagem como gate explícito
- `Issue 0C` — bloquear/contextualizar geração de lutas sem pré-requisitos
- `Issue 1` — rota inicial correta por tipo de competição
- `Issue 3` — navegação dependente do tipo da competição
- `Issue 5` — saneamento de `CompetitionMode`
- `Issue 7` — CTA contextual na tela de lutas
- `Issue 15` — pré-validação antes da distribuição
- `Issue 16` — bloquear/rebaixar distribuição sem lutas

### Parte 2: Melhorias de orientação
Ler depois estas issues:
- `Issue 0A`
- `Issue 2`
- `Issue 4`
- `Issue 6`
- `Issue 8`
- `Issue 9`
- `Issue 10`
- `Issue 11`
- `Issue 12`
- `Issue 13`
- `Issue 14`
- `Issue 17`
- `Issue 18`
- `Issue 19`
- `Issue 20`

### Regra prática
Se houver pouco tempo ou capacidade de execução limitada:
- implemente primeiro tudo que impede o usuário de entrar na etapa errada
- só depois invista em orientação, refinamento e aceleração do fluxo

---

## Epic 0

### Título
`[Pré-operação] Tornar atletas, importação e pesagem parte explícita do workflow`

### Contexto
Hoje o backlog trata `Atletas`, `Importação` e `Pesagem` como módulos laterais. Na prática, eles são pré-requisitos da geração de lutas. Para um usuário que ainda não conhece o sistema, esconder isso no fluxo é um erro estrutural.

### Objetivo
Garantir que o sistema deixe explícito, antes da geração de lutas, se já existem atletas cadastrados/importados e se a pesagem mínima necessária foi concluída.

### Issues relacionadas
- BT-000
- BT-00A
- BT-00B
- BT-00C

### Labels sugeridas
- `type:flow`
- `area:athletes`
- `area:imports`
- `area:weighin`
- `priority:P1`

### Classificação
`Essencial para bloquear erro`

---

## Issue 0

### Título
`[Pré-operação] Adicionar checkpoint de prontidão de atletas antes da geração de lutas`

### Contexto
Hoje o sistema permite que o usuário avance mentalmente para geração de lutas sem ter uma leitura clara sobre existência e prontidão mínima dos atletas.

### Problema
Para usuário novo, isso cria falsa sensação de progresso. Ele chega nas telas de `Categorias`, `Chaves` ou `Lutas` sem saber se a base de atletas já está utilizável.

### Escopo
- criar um bloco de prontidão pré-operacional visível antes das etapas de geração
- exibir pelo menos:
  - total de atletas cadastrados/importados
  - atletas com pesagem pendente
  - atletas aptos para seguir no fluxo

### Arquivos
- `src/features/athletes/...`
- `src/features/imports/...`
- `src/features/weighin/...`
- pontos de entrada de `categories`, `key-groups` e/ou `fights`

### Critérios de aceite
- o usuário consegue entender se já existe base suficiente de atletas
- a informação aparece antes da ação de gerar lutas
- o sistema não depende de o usuário conhecer regras implícitas

### Dependências
- nenhuma obrigatória

### Estimativa
`1 dia`

### Prioridade
`P1`

### Labels sugeridas
- `type:flow`
- `type:ux`
- `area:athletes`
- `priority:P1`

### Classificação
`Essencial para bloquear erro`

### Análise prática
Usuário novo pensa em sequência concreta: “cadastrei pessoas, então agora consigo montar a competição?”. Se o sistema não responder isso claramente, ele fica adivinhando se o problema está em atletas, categorias, chaves ou lutas.

### Prompt sugerido
```text
Adicione um checkpoint de prontidão de atletas antes das etapas de geração de lutas, pensando em um usuário que ainda não conhece o sistema.

Objetivo:
- deixar explícito se já existe base suficiente para continuar

Mostrar pelo menos:
- total de atletas disponíveis
- quantidade com pesagem pendente
- quantidade apta para seguir

Requisito de UX:
- o usuário deve entender em segundos se já pode gerar lutas ou se ainda precisa preparar dados

Critério principal:
- a interface deve responder claramente: “já posso continuar?”
```

---

## Issue 0A

### Título
`[Importação] Integrar cadastro/importação de atletas ao workflow principal da competição`

### Contexto
Atualmente `Atletas` e `Importação` existem como módulos, mas não aparecem como parte obrigatória e explícita do fluxo.

### Problema
Usuário novo pode interpretar que importar atletas é opcional ou paralelo, quando na prática isso antecede quase todo o restante.

### Escopo
- promover `Atletas` e `Importação` para o início do fluxo visual da competição
- revisar microcopy das telas de entrada para indicar que a preparação começa por atletas
- adicionar CTA contextual de ida para cadastro/importação quando não houver base suficiente

### Arquivos
- `src/features/competitions/components/competition-section-nav.tsx`
- `src/features/competitions/components/competition-card.tsx`
- `src/features/athletes/components/...`
- `src/features/imports/components/...`

### Critérios de aceite
- o workflow deixa claro que atletas/importação vêm antes de geração
- quando não houver atletas suficientes, o sistema aponta cadastro/importação como próxima ação
- não há ambiguidades sobre onde o fluxo começa

### Dependências
- idealmente após a nav mode-aware

### Estimativa
`1 dia`

### Prioridade
`P1`

### Labels sugeridas
- `type:flow`
- `area:athletes`
- `area:imports`
- `priority:P1`

### Classificação
`Melhoria de orientação`

### Análise prática
Usuário iniciante não distingue “módulo administrativo” de “pré-requisito operacional”. Se o produto não deixar isso óbvio, ele entra em telas avançadas cedo demais e atribui a falha ao sistema.

### Prompt sugerido
```text
Integre cadastro e importação de atletas ao workflow principal da competição, com foco total em clareza para um usuário novo.

Objetivo:
- deixar explícito que o fluxo começa pela preparação da base de atletas

Implementar:
- revisão da navegação/entrada para destacar atletas e importação como primeiras etapas
- CTA contextual para levar o usuário a cadastro/importação quando a base estiver insuficiente

Critério de UX:
- o usuário deve entender que, sem atletas, ainda não faz sentido avançar para categorias, chaves ou lutas
```

---

## Issue 0B

### Título
`[Pesagem] Transformar pesagem em gate explícito de prontidão operacional`

### Contexto
A pesagem existe como módulo, mas ainda não está tratada como checkpoint claro antes da geração e da operação.

### Problema
Usuário novo não sabe se pesagem é obrigatória, recomendada ou irrelevante para o fluxo de geração.

### Escopo
- exibir status agregado de pesagem antes de gerar lutas
- tornar explícito quantos atletas ainda dependem de pesagem
- sinalizar se a competição está pronta ou não para continuar

### Arquivos
- `src/features/weighin/components/...`
- `src/features/categories/components/categories-page.tsx`
- `src/features/key-groups/components/key-groups-page.tsx`
- `src/features/fights/components/fights-tab.tsx`

### Critérios de aceite
- telas estratégicas exibem estado de pesagem de forma agregada
- usuário entende se a pesagem ainda bloqueia ou não o fluxo
- linguagem usada é operacional e não técnica

### Dependências
- checkpoint de prontidão de atletas recomendado

### Estimativa
`1 dia`

### Prioridade
`P1`

### Labels sugeridas
- `type:ux`
- `type:flow`
- `area:weighin`
- `priority:P1`

### Classificação
`Essencial para bloquear erro`

### Análise prática
Usuário iniciante não conhece a regra implícita entre peso, categoria e elegibilidade. Se o sistema não traduzir isso para um status simples, ele vai operar em dúvida ou ignorar a etapa.

### Prompt sugerido
```text
Transforme a pesagem em um gate explícito de prontidão operacional para um usuário que ainda não entende as dependências internas do sistema.

Objetivo:
- mostrar se a competição já está pronta para seguir ou se ainda depende de pesagem

Exibir:
- atletas com pesagem concluída
- atletas pendentes
- indicação simples de prontidão para continuar

Critério de UX:
- o usuário não deve precisar conhecer regra de negócio para entender se a pesagem ainda bloqueia o fluxo
```

---

## Issue 0C

### Título
`[Geração] Bloquear ou contextualizar geração de lutas quando pré-requisitos de atletas/importação/pesagem não estiverem prontos`

### Contexto
Hoje a geração de lutas pode parecer disponível mesmo quando a base anterior do fluxo está fraca, incompleta ou ambígua.

### Problema
Para usuário novo, botão disponível significa “pode seguir”. Se a geração falhar ou produzir resultado ruim por pré-requisito ausente, a interface errou antes do backend.

### Escopo
- revisar CTAs de geração em `Categorias` e `Chaves`
- bloquear, rebaixar ou contextualizar ação quando:
  - não houver atletas suficientes
  - houver dependências relevantes de pesagem
  - a base ainda estiver claramente incompleta
- oferecer CTA de retorno ao ponto certo do fluxo

### Arquivos
- `src/features/categories/components/categories-page.tsx`
- `src/features/key-groups/components/key-group-detail-page.tsx`
- `src/features/key-groups/components/key-groups-page.tsx`

### Critérios de aceite
- geração de lutas não parece ser a próxima ação correta quando pré-requisitos não estão prontos
- o sistema indica claramente o que falta
- o usuário recebe um caminho prático para resolver a pendência

### Dependências
- issues de prontidão pré-operacional recomendadas

### Estimativa
`1 dia`

### Prioridade
`P1`

### Labels sugeridas
- `type:flow`
- `area:categories`
- `area:key-groups`
- `priority:P1`

### Classificação
`Essencial para bloquear erro`

### Análise prática
Essa é uma das proteções mais importantes do fluxo. Usuário novo raramente separa “ação disponível” de “ação recomendada”. Se o botão estiver ali sem contexto, ele será usado cedo demais.

### Prompt sugerido
```text
Revise os pontos de geração de lutas para que a interface não induza um usuário novo a gerar lutas antes da hora.

Objetivo:
- bloquear ou contextualizar a geração quando atletas, importação ou pesagem ainda não estiverem em estado suficiente

Implementar:
- revisão dos CTAs de geração
- indicação clara do que falta
- CTA prático para voltar à etapa correta

Critério principal:
- botão disponível só pode significar “esta é realmente a próxima ação recomendada”
```

---

## Epic 1

### Título
`[Flow] Tornar fluxo da competição sensível ao tipo de competição`

### Contexto
Hoje o produto não diferencia corretamente o fluxo de `KEYS` e `ABSOLUTE_GP` na entrada e na navegação. Isso gera confusão logo no primeiro clique e contamina as etapas seguintes.

### Objetivo
Garantir que a abertura da competição e a navegação principal reflitam o fluxo correto conforme `competition.mode`.

### Issues relacionadas
- BT-020
- BT-001
- BT-002
- BT-003
- BT-004

### Labels sugeridas
- `type:flow`
- `area:competitions`
- `priority:P1`

### Classificação
`Essencial para bloquear erro`

---

## Issue 1

### Título
`[Flow] Corrigir rota inicial ao abrir competição conforme competition.mode`

### Contexto
Hoje o CTA da competição sempre leva para `/key-groups`, inclusive para competições `ABSOLUTE_GP`.

### Problema
Isso cria uma quebra objetiva de fluxo e faz o usuário entrar na etapa errada.

### Escopo
- Alterar o destino inicial da competição
- Ajustar o label do botão principal conforme o tipo

### Arquivos
- `src/features/competitions/components/competition-card.tsx`

### Critérios de aceite
- competições `KEYS` abrem em `/key-groups`
- competições `ABSOLUTE_GP` abrem em `/categories`
- label do CTA muda conforme o modo
- não há regressão no comportamento de definir competição ativa

### Dependências
- nenhuma

### Estimativa
`0.5 dia`

### Prioridade
`P1`

### Labels sugeridas
- `type:flow`
- `area:competitions`
- `priority:P1`

### Análise prática
Para um usuário novo, o primeiro clique define a confiança no sistema. Se ele abre uma competição de `GP absoluto` e cai em `Chaves`, ele conclui que:
- entrou na tela errada
- não entende a lógica do produto
- vai precisar “descobrir sozinho” o caminho correto

Esse tipo de erro inicial é caro porque cria insegurança logo antes da primeira ação útil. A melhoria aqui tem alto impacto porque reduz a necessidade de treinamento verbal.

### Prompt sugerido
```text
Implemente a correção da rota inicial ao abrir uma competição, sempre pensando em um usuário que não conhece nada do sistema.

Objetivo:
- Quando a competição for do tipo `KEYS`, o botão principal deve levar para `/key-groups`
- Quando a competição for do tipo `ABSOLUTE_GP`, o botão principal deve levar para `/categories`
- O texto do botão também deve ser coerente com o tipo da competição

Requisitos de UX:
- O usuário deve entender o próximo passo sem precisar adivinhar
- O label do botão deve usar linguagem prática e direta
- Evite qualquer texto técnico interno do sistema

Arquivo principal:
- `src/features/competitions/components/competition-card.tsx`

Critérios de aceite:
- `KEYS` abre em `Chaves`
- `ABSOLUTE_GP` abre em `Categorias`
- Não quebrar o fluxo de definir competição ativa
```

---

## Issue 2

### Título
`[Flow] Criar helper central para resolver rota e label inicial por tipo de competição`

### Contexto
A lógica de destino não deve ficar hardcoded em componentes.

### Escopo
- Criar helper central para:
  - rota inicial
  - label inicial
- Refatorar `competition-card` para usar o helper

### Arquivos
- `src/features/competitions/lib/...` ou `src/shared/lib/...`
- `src/features/competitions/components/competition-card.tsx`

### Critérios de aceite
- existe função única para resolver a rota inicial por modo
- existe função única para resolver o label do CTA por modo
- `competition-card` consome essa função

### Dependências
- issue anterior pode ser absorvida nesta ou executada antes

### Estimativa
`0.5 dia`

### Prioridade
`P2`

### Labels sugeridas
- `type:refactor`
- `type:flow`
- `area:competitions`
- `priority:P2`

### Classificação
`Melhoria de orientação`

### Análise prática
Essa issue não melhora a interface diretamente, mas evita inconsistência futura. Sem centralização, a mesma decisão pode aparecer correta numa tela e errada em outra. Para usuário iniciante, inconsistência parece defeito, não detalhe técnico.

### Prompt sugerido
```text
Crie um helper central para resolver a rota inicial e o label principal da competição com base em `competition.mode`.

Objetivo:
- impedir duplicação de regra em múltiplos componentes
- garantir consistência futura para usuários novos, que não toleram mensagens contraditórias

Requisitos:
- retornar pelo menos `destinationHref` e `primaryActionLabel`
- o `competition-card` deve usar esse helper
- a solução deve ser simples, legível e fácil de reutilizar em outras telas

Arquivos:
- criar helper em `src/features/competitions/lib/` ou `src/shared/lib/`
- adaptar `src/features/competitions/components/competition-card.tsx`

Critério principal:
- a regra de navegação inicial por modo deve existir em um único lugar
```

---

## Issue 3

### Título
`[Navigation] Tornar CompetitionSectionNav dependente do tipo da competição ativa`

### Contexto
A navegação atual depende da rota em que o usuário caiu, não do modo da competição.

### Problema
A UI não comunica o fluxo real do produto.

### Escopo
- carregar a competição ativa na nav
- montar itens da nav conforme `competition.mode`
- remover dependência de “estar em key-groups/categories” para mostrar `Categorias`

### Arquivos
- `src/features/competitions/components/competition-section-nav.tsx`
- hooks/utilitários necessários para obter a competição ativa

### Critérios de aceite
- nav muda conforme o modo da competição
- `KEYS` e `ABSOLUTE_GP` têm navegação consistente com o fluxo
- o item `Categorias` deixa de depender da rota atual
- não há links órfãos ou redundantes

### Dependências
- helper de resolução por modo recomendado

### Estimativa
`1 dia`

### Prioridade
`P1`

### Labels sugeridas
- `type:flow`
- `area:navigation`
- `priority:P1`

### Classificação
`Essencial para bloquear erro`

### Análise prática
Usuário iniciante não navega por modelo mental do desenvolvedor. Ele navega pelo que a interface sugere. Se a navegação muda com base na rota atual em vez do tipo de competição, o sistema parece arbitrário. Isso é especialmente ruim em operação de evento, onde o usuário quer rapidez e previsibilidade.

### Prompt sugerido
```text
Refatore a navegação principal da competição para que ela dependa do tipo da competição ativa, e não da rota atual.

Objetivo de UX:
- um usuário novo deve olhar a navegação e entender qual é o fluxo daquele tipo de competição
- a navegação precisa ensinar o processo, não apenas listar módulos

Requisitos:
- carregar a competição ativa
- montar os itens com base em `competition.mode`
- remover lógica que faz `Categorias` aparecer apenas quando a rota já está em contexto de chaves/categorias

Arquivo principal:
- `src/features/competitions/components/competition-section-nav.tsx`

Critérios de aceite:
- nav de `KEYS` e `ABSOLUTE_GP` é diferente quando necessário
- a ordem dos itens faz sentido para um usuário que nunca usou o sistema
```

---

## Issue 4

### Título
`[Navigation] Revisar labels e ordem da navegação para refletir workflow operacional`

### Contexto
Os nomes atuais são módulos, não etapas.

### Escopo
- revisar labels da navegação principal
- ordenar itens para comunicar fluxo operacional
- padronizar a taxonomia entre modos

### Sugestão inicial
`KEYS`
- Chaves
- Lutas
- Distribuição
- Áreas

`ABSOLUTE_GP`
- Categorias
- Lutas
- Distribuição
- Áreas

### Arquivos
- `src/features/competitions/components/competition-section-nav.tsx`

### Critérios de aceite
- labels refletem workflow
- ordem ajuda o usuário a entender a progressão do processo
- consistência entre tela de entrada e navegação

### Dependências
- issue da nav mode-aware

### Estimativa
`0.5 dia`

### Prioridade
`P1`

### Labels sugeridas
- `type:ux`
- `type:flow`
- `area:navigation`
- `priority:P1`

### Classificação
`Melhoria de orientação`

### Análise prática
“Linguagem de sistema” e “linguagem de operação” não são a mesma coisa. Usuário novo entende melhor verbos e sequência do que nomes internos. Se a ordem da navegação não sugerir o que vem antes e depois, ele perde tempo pensando em vez de agir.

### Prompt sugerido
```text
Revise os labels e a ordem da navegação principal da competição com foco total em clareza para um usuário novo.

Objetivo:
- transformar a navegação em um guia de processo
- reduzir ambiguidade entre configuração e operação

Requisitos:
- labels curtos e operacionais
- ordem que comunique o fluxo real
- consistência entre botão de entrada da competição e navegação interna

Arquivo:
- `src/features/competitions/components/competition-section-nav.tsx`

Critério de UX:
- um usuário sem treinamento deve entender qual etapa vem primeiro e qual vem depois
```

---

## Issue 5

### Título
`[Domain] Alinhar CompetitionMode com os modos realmente suportados pela UI`

### Contexto
O tipo inclui `TEAM`, mas o produto expõe apenas `KEYS` e `ABSOLUTE_GP`.

### Problema
Isso gera dívida semântica e risco de bugs.

### Escopo
- revisar `competitionModes`
- revisar `CompetitionMode`
- revisar `competitionModeLabels`
- revisar `readMode`
- alinhar formulário e schema

### Arquivos
- `src/features/competitions/types/competition.ts`
- `src/features/competitions/components/competition-form.tsx`
- `src/features/competitions/schemas/competition-form-schema.ts`

### Critérios de aceite
- tipo, formulário, labels e normalização estão coerentes
- `TEAM` é removido ou explicitamente tratado como não suportado
- não há estado impossível entre frontend e UI

### Dependências
- nenhuma

### Estimativa
`1 dia`

### Prioridade
`P2`

### Labels sugeridas
- `type:refactor`
- `area:competitions`
- `priority:P2`

### Classificação
`Essencial para bloquear erro`

### Análise prática
Quando o modelo de domínio é incoerente, a interface começa a “vazar” comportamento estranho. Usuário novo não chama isso de inconsistência de tipo. Ele chama isso de sistema confuso. Esta issue protege a experiência indiretamente, mas de forma importante.

### Prompt sugerido
```text
Alinhe o modelo `CompetitionMode` com os modos realmente suportados pela interface.

Objetivo:
- eliminar ambiguidade entre domínio e UI
- evitar que o usuário veja comportamentos ou labels sem suporte real

Requisitos:
- revisar type, normalização, labels e schema/form
- remover `TEAM` ou tratá-lo explicitamente como não suportado
- manter a solução simples e coerente

Arquivos:
- `src/features/competitions/types/competition.ts`
- `src/features/competitions/components/competition-form.tsx`
- `src/features/competitions/schemas/competition-form-schema.ts`

Critério de aceite:
- frontend não representa modos que o usuário não consegue operar de fato
```

---

## Epic 2

### Título
`[Lutas] Transformar tela de lutas em hub operacional da competição`

### Contexto
A tela de lutas hoje lista confrontos, mas não orienta a progressão do fluxo.

### Objetivo
Tornar `Lutas` o checkpoint central entre geração, distribuição e operação.

### Issues relacionadas
- BT-005
- BT-006

### Labels sugeridas
- `type:flow`
- `area:fights`
- `priority:P1`

### Classificação
`Melhoria de orientação`

---

## Issue 6

### Título
`[Lutas] Adicionar resumo operacional no topo da tela de fights`

### Contexto
O operador precisa entender rapidamente o estado da competição.

### Escopo
- adicionar métricas no topo:
  - total de lutas
  - lutas sem área
  - lutas agendadas
  - lutas em andamento

### Arquivos
- `src/features/fights/components/fights-tab.tsx`

### Critérios de aceite
- métricas são derivadas dos dados já carregados
- layout não degrada mobile
- estado vazio é tratado corretamente

### Dependências
- nenhuma

### Estimativa
`1 dia`

### Prioridade
`P1`

### Labels sugeridas
- `type:ux`
- `type:flow`
- `area:fights`
- `priority:P1`

### Classificação
`Melhoria de orientação`

### Análise prática
Usuário novo precisa saber “se a competição está pronta” antes de tomar decisão. Hoje a tela de lutas mostra itens, mas não mostra status de processo. Isso força interpretação manual. Métricas simples no topo reduzem carga cognitiva e aceleram a operação.

### Prompt sugerido
```text
Adicione um resumo operacional no topo da tela de lutas para um usuário que ainda não conhece o sistema.

Objetivo:
- fazer a tela responder rapidamente: “o que já está pronto?” e “o que ainda falta?”

Exibir:
- total de lutas
- lutas sem área
- lutas agendadas
- lutas em andamento

Arquivo:
- `src/features/fights/components/fights-tab.tsx`

Requisitos de UX:
- leitura rápida em poucos segundos
- destaque visual para o que exige ação
- comportamento bom em desktop e mobile
```

---

## Issue 7

### Título
`[Lutas] Adicionar CTA contextual para próxima etapa do fluxo`

### Contexto
A tela de lutas deve orientar o usuário para o próximo passo correto.

### Escopo
- se não houver lutas:
  - redirecionar para gerador correto por modo
- se houver lutas sem área:
  - redirecionar para `/areas/distribution`
- se tudo estiver pronto:
  - manter foco operacional

### Arquivos
- `src/features/fights/components/fights-tab.tsx`
- helper de resolução por modo

### Critérios de aceite
- CTA muda conforme estado da competição
- `KEYS` e `ABSOLUTE_GP` redirecionam para pontos corretos
- não há CTA conflitante com o estado atual

### Dependências
- helper por modo recomendado
- resumo operacional pronto

### Estimativa
`0.5 dia`

### Prioridade
`P1`

### Labels sugeridas
- `type:flow`
- `area:fights`
- `priority:P1`

### Classificação
`Essencial para bloquear erro`

### Análise prática
Usuário novo não quer interpretar estado e depois decidir navegação. Ele quer que o sistema diga a próxima ação. CTA contextual reduz abandono, clique errado e necessidade de suporte humano.

### Prompt sugerido
```text
Adicione um CTA contextual na tela de lutas que oriente o usuário para o próximo passo correto, sem exigir que ele conheça o fluxo do sistema.

Regras:
- se não houver lutas, enviar para a tela certa de geração conforme o tipo da competição
- se houver lutas sem área, enviar para `/areas/distribution`
- se tudo estiver pronto, manter a tela focada em operação

Arquivos:
- `src/features/fights/components/fights-tab.tsx`
- helper de resolução por modo

Critério principal:
- a tela deve dizer claramente qual é a próxima ação útil
```

---

## Epic 3

### Título
`[ABSOLUTE_GP] Clarificar fluxo de categorias -> gerar lutas -> distribuir`

### Contexto
No modo `ABSOLUTE_GP`, a geração de lutas já existe, mas o fluxo não é autoexplicativo.

### Issues relacionadas
- BT-007
- BT-008

### Labels sugeridas
- `type:flow`
- `area:categories`
- `priority:P2`

### Classificação
`Melhoria de orientação`

---

## Issue 8

### Título
`[ABSOLUTE_GP] Adicionar bloco de status operacional na tela de categorias`

### Contexto
A tela de categorias precisa comunicar que é a etapa principal desse modo.

### Escopo
- exibir status de:
  - total de categorias
  - categorias geradas/manualmente criadas
  - existência de lutas geradas
- exibir microcopy de fluxo do modo

### Arquivos
- `src/features/categories/components/categories-page.tsx`

### Critérios de aceite
- usuário entende o fluxo sem precisar sair da tela
- status é visível antes dos CTAs
- texto comunica o encadeamento correto do processo

### Dependências
- nav mode-aware recomendada

### Estimativa
`1 dia`

### Prioridade
`P2`

### Labels sugeridas
- `type:ux`
- `type:flow`
- `area:categories`
- `priority:P2`

### Classificação
`Melhoria de orientação`

### Análise prática
Para quem não conhece o sistema, `Categorias` pode parecer só cadastro. No modo `ABSOLUTE_GP`, ela é na verdade a etapa de origem do fluxo. Se isso não estiver explícito, o usuário não entende por que gerar lutas está ali.

### Prompt sugerido
```text
Melhore a tela de categorias para que um usuário novo entenda que ela é a etapa principal do fluxo no modo `ABSOLUTE_GP`.

Objetivo:
- deixar claro que o processo é: categorias -> gerar lutas -> distribuir áreas -> operar

Implementar:
- bloco de status com total de categorias
- indicação se já existem lutas geradas
- texto curto explicando a ordem do fluxo

Arquivo:
- `src/features/categories/components/categories-page.tsx`

Critério de UX:
- a tela deve ensinar o fluxo sem depender de treinamento externo
```

---

## Issue 9

### Título
`[ABSOLUTE_GP] Adicionar CTA pós-geração de lutas para distribuição das áreas`

### Contexto
Após gerar lutas, o próximo passo natural é distribuir.

### Escopo
- após sucesso em `Gerar lutas`, exibir CTA claro para `/areas/distribution`

### Arquivos
- `src/features/categories/components/categories-page.tsx`

### Critérios de aceite
- CTA aparece após geração bem-sucedida
- CTA não conflita com os demais botões
- fluxo reduz necessidade de navegação manual

### Dependências
- issue anterior

### Estimativa
`0.5 dia`

### Prioridade
`P2`

### Labels sugeridas
- `type:flow`
- `area:categories`
- `priority:P2`

### Classificação
`Melhoria de orientação`

### Análise prática
Depois de uma ação crítica, usuário novo precisa de continuidade imediata. Se a tela só confirma sucesso e não aponta o próximo passo, ele volta a ficar perdido. O CTA pós-sucesso reduz ruptura de fluxo.

### Prompt sugerido
```text
Adicione um CTA pós-geração de lutas na tela de categorias para guiar imediatamente o usuário para a próxima etapa.

Objetivo:
- depois de gerar lutas, o usuário deve saber instantaneamente que o próximo passo é distribuir áreas

Implementação:
- ao concluir a geração com sucesso, exibir CTA claro para `/areas/distribution`
- o CTA deve ser visível sem poluir a tela

Arquivo:
- `src/features/categories/components/categories-page.tsx`

Critério principal:
- o usuário não precisa pensar para descobrir o que fazer depois
```

---

## Epic 4

### Título
`[KEYS] Dar visibilidade ao progresso de geração por chave`

### Contexto
No modo `KEYS`, a geração está enterrada no detalhe de cada chave, sem visão de progresso geral.

### Issues relacionadas
- BT-009
- BT-010
- BT-011
- BT-012
- BT-013

### Labels sugeridas
- `type:flow`
- `area:key-groups`
- `priority:P2`

### Classificação
`Melhoria de orientação`

---

## Issue 10

### Título
`[KEYS] Adicionar métricas de prontidão na listagem de chaves`

### Contexto
O operador precisa saber rapidamente quantas chaves ainda bloqueiam o fluxo.

### Escopo
- adicionar métricas:
  - total de chaves
  - chaves incompletas
  - chaves sem lutas geradas
  - chaves travadas

### Arquivos
- `src/features/key-groups/components/key-groups-page.tsx`

### Critérios de aceite
- métricas são calculadas a partir da listagem carregada
- métricas aparecem em destaque antes da tabela
- estado vazio continua consistente

### Dependências
- nenhuma

### Estimativa
`1 dia`

### Prioridade
`P2`

### Labels sugeridas
- `type:ux`
- `type:flow`
- `area:key-groups`
- `priority:P2`

### Classificação
`Melhoria de orientação`

### Análise prática
Usuário novo não consegue inferir prontidão olhando tabela linha por linha. Métricas agregadas resolvem isso com baixo custo cognitivo. Elas ajudam a responder: “já posso seguir?”.

### Prompt sugerido
```text
Adicione métricas de prontidão na listagem de chaves para que um usuário novo entenda rapidamente o estado geral da competição no modo `KEYS`.

Mostrar:
- total de chaves
- chaves incompletas
- chaves sem lutas geradas
- chaves travadas

Arquivo:
- `src/features/key-groups/components/key-groups-page.tsx`

Objetivo de UX:
- evitar que o usuário tenha que inspecionar cada chave manualmente para entender se pode avançar
```

---

## Issue 11

### Título
`[KEYS] Adicionar filtro por estado operacional na tela de chaves`

### Contexto
Hoje o filtro é só por categoria, o que é insuficiente para operação.

### Escopo
- incluir filtro por estado:
  - todas
  - incompletas
  - sem lutas
  - travadas

### Arquivos
- `src/features/key-groups/components/key-groups-page.tsx`

### Critérios de aceite
- filtro funciona combinado com categoria
- resultado é consistente com os dados da listagem
- UX é clara e sem ambiguidade

### Dependências
- métricas de prontidão

### Estimativa
`0.5 dia`

### Prioridade
`P2`

### Labels sugeridas
- `type:ux`
- `area:key-groups`
- `priority:P2`

### Classificação
`Melhoria de orientação`

### Análise prática
Categoria é útil para organização, mas não para tomada de decisão operacional. Usuário novo geralmente quer encontrar “o que está faltando” e não “qual categoria”. Filtro por estado resolve melhor esse problema.

### Prompt sugerido
```text
Adicione filtro por estado operacional na tela de chaves, priorizando a praticidade para um usuário que ainda não entende o sistema.

Estados sugeridos:
- todas
- incompletas
- sem lutas
- travadas

Arquivo:
- `src/features/key-groups/components/key-groups-page.tsx`

Requisito de UX:
- o filtro deve ajudar o usuário a localizar pendências rapidamente, sem precisar interpretar a tabela inteira
```

---

## Issue 12

### Título
`[KEYS] Adicionar CTA de progressão na listagem de chaves`

### Contexto
O usuário precisa saber se deve revisar chaves ou avançar para distribuição.

### Escopo
- se houver pendências: CTA de revisão
- se todas estiverem prontas: CTA para `/areas/distribution`

### Arquivos
- `src/features/key-groups/components/key-groups-page.tsx`

### Critérios de aceite
- CTA muda conforme prontidão agregada
- não há CTA falso-positivo para distribuição precoce

### Dependências
- métricas e filtros operacionais

### Estimativa
`0.5 dia`

### Prioridade
`P2`

### Labels sugeridas
- `type:flow`
- `area:key-groups`
- `priority:P2`

### Classificação
`Melhoria de orientação`

### Análise prática
Usuário novo não deveria tomar a decisão de navegação sozinho com base em sinais dispersos. O sistema precisa dizer: “você ainda precisa revisar” ou “você já pode avançar”.

### Prompt sugerido
```text
Adicione um CTA de progressão na tela de chaves que mude conforme o estado agregado da competição.

Objetivo:
- se ainda houver pendências, orientar o usuário a revisar
- se tudo estiver pronto, orientar a distribuição das áreas

Arquivo:
- `src/features/key-groups/components/key-groups-page.tsx`

Critério principal:
- a tela deve responder claramente se o usuário já pode seguir para a próxima etapa
```

---

## Issue 13

### Título
`[KEYS] Exibir status de prontidão no detalhe da chave`

### Contexto
O detalhe da chave deve mostrar claramente em que estado operacional ela está.

### Escopo
- adicionar status visível no header:
  - aberta
  - lutas geradas
  - travada

### Arquivos
- `src/features/key-groups/components/key-group-detail-page.tsx`

### Critérios de aceite
- estado da chave é visível sem leitura detalhada da tabela
- regras refletem o estado real dos dados

### Dependências
- nenhuma

### Estimativa
`0.5 dia`

### Prioridade
`P2`

### Labels sugeridas
- `type:ux`
- `area:key-groups`
- `priority:P2`

### Classificação
`Melhoria de orientação`

### Análise prática
Sem status claro, o detalhe da chave exige leitura e interpretação demais. Para um usuário novato, isso gera hesitação. Estado explícito encurta o caminho entre entender e agir.

### Prompt sugerido
```text
Adicione um status de prontidão claro no detalhe da chave para que um usuário novo saiba imediatamente em que fase aquela chave está.

Estados:
- aberta
- lutas geradas
- travada

Arquivo:
- `src/features/key-groups/components/key-group-detail-page.tsx`

Objetivo de UX:
- reduzir necessidade de interpretar a tela antes de agir
```

---

## Issue 14

### Título
`[KEYS] Adicionar CTA pós-geração e pós-trava no detalhe da chave`

### Contexto
Após ações críticas, o produto deve orientar o próximo passo.

### Escopo
- após gerar lutas: CTA para voltar à revisão das chaves
- após travar: CTA para distribuição das áreas

### Arquivos
- `src/features/key-groups/components/key-group-detail-page.tsx`

### Critérios de aceite
- CTAs aparecem no momento correto
- não poluem a tela quando não aplicáveis

### Dependências
- status de prontidão no detalhe

### Estimativa
`0.5 dia`

### Prioridade
`P2`

### Labels sugeridas
- `type:flow`
- `area:key-groups`
- `priority:P2`

### Classificação
`Melhoria de orientação`

### Análise prática
Usuário novo costuma parar depois de concluir uma ação importante, porque não sabe se acabou a tarefa ou se existe continuidade. CTA pós-ação reduz essa pausa e acelera o fluxo.

### Prompt sugerido
```text
Adicione CTAs contextuais no detalhe da chave após as ações principais, sempre pensando em um usuário que não conhece o fluxo do sistema.

Comportamento esperado:
- após gerar lutas: sugerir retorno à revisão das chaves
- após travar a chave: sugerir avanço para distribuição das áreas

Arquivo:
- `src/features/key-groups/components/key-group-detail-page.tsx`

Critério de UX:
- o sistema deve orientar o próximo passo no momento exato em que o usuário termina uma ação relevante
```

---

## Epic 5

### Título
`[Distribuição] Bloquear distribuição prematura e conectar com operação`

### Contexto
A distribuição hoje assume que a competição está pronta, o que nem sempre é verdade.

### Issues relacionadas
- BT-014
- BT-015
- BT-016

### Labels sugeridas
- `type:flow`
- `area:areas`
- `priority:P2`

### Classificação
`Essencial para bloquear erro`

---

## Issue 15

### Título
`[Distribuição] Adicionar pré-validação operacional antes de distribuir lutas`

### Contexto
Antes de distribuir, o sistema deve deixar explícito se existem lutas e áreas suficientes.

### Escopo
- mostrar:
  - número de lutas prontas
  - número de áreas cadastradas
  - lutas já distribuídas ou pendentes

### Arquivos
- `src/features/areas/components/areas-distribution-page.tsx`
- possivelmente `src/features/fights/...` para leitura de dados agregados

### Critérios de aceite
- o usuário consegue entender se faz sentido distribuir
- a informação aparece antes do CTA principal

### Dependências
- resumo operacional de lutas recomendado

### Estimativa
`1 dia`

### Prioridade
`P2`

### Labels sugeridas
- `type:ux`
- `type:flow`
- `area:areas`
- `priority:P2`

### Classificação
`Essencial para bloquear erro`

### Análise prática
Distribuição é uma ação de impacto. Usuário novo precisa de confirmação de contexto antes de executá-la. Sem pré-validação, ele aperta botão sem saber se a competição está pronta, e o sistema passa sensação de caixa-preta.

### Prompt sugerido
```text
Adicione uma camada de pré-validação operacional antes do CTA de distribuição de lutas.

Objetivo:
- permitir que um usuário novo confirme se já faz sentido distribuir

Mostrar antes do botão:
- número de lutas prontas
- número de áreas cadastradas
- quantidade de lutas já distribuídas ou ainda pendentes

Arquivo:
- `src/features/areas/components/areas-distribution-page.tsx`

Critério de UX:
- o usuário deve entender o contexto antes de acionar uma ação de alto impacto
```

---

## Issue 16

### Título
`[Distribuição] Rebaixar ou bloquear CTA de distribuição quando não houver lutas`

### Contexto
Hoje é possível chegar à distribuição sem geração concluída.

### Escopo
- bloquear ou reduzir prioridade do CTA
- sugerir retorno ao ponto certo:
  - `KEYS` -> chaves
  - `ABSOLUTE_GP` -> categorias

### Arquivos
- `src/features/areas/components/areas-distribution-page.tsx`

### Critérios de aceite
- CTA principal não induz erro operacional
- estado vazio oferece saída correta por modo

### Dependências
- pré-validação operacional
- helper por modo

### Estimativa
`0.5 dia`

### Prioridade
`P2`

### Labels sugeridas
- `type:flow`
- `area:areas`
- `priority:P2`

### Classificação
`Essencial para bloquear erro`

### Análise prática
Bloquear ação errada é melhor do que explicar erro depois. Usuário novo interpreta botão primário como “pode seguir”. Se ele vê o botão ativo no momento errado, a interface já errou.

### Prompt sugerido
```text
Evite que a tela de distribuição induza um usuário novo a executar a ação cedo demais.

Objetivo:
- quando não houver lutas prontas, o CTA de distribuição não deve parecer a próxima ação correta

Implementar:
- bloquear ou rebaixar visualmente o CTA
- exibir orientação de retorno ao ponto certo conforme o tipo da competição

Arquivo:
- `src/features/areas/components/areas-distribution-page.tsx`

Critério principal:
- o usuário não deve interpretar erroneamente que já pode distribuir
```

---

## Issue 17

### Título
`[Distribuição] Adicionar CTA pós-distribuição para abrir operação das áreas`

### Contexto
Depois de distribuir, o próximo passo natural é operar a chamada.

### Escopo
- exibir CTA após sucesso para navegação direta às áreas

### Arquivos
- `src/features/areas/components/areas-distribution-page.tsx`

### Critérios de aceite
- após distribuição, a UI oferece caminho direto para operação
- CTA é claro e contextual

### Dependências
- distribuição operacional revisada

### Estimativa
`0.5 dia`

### Prioridade
`P3`

### Labels sugeridas
- `type:flow`
- `area:areas`
- `priority:P3`

### Classificação
`Melhoria de orientação`

### Análise prática
Depois de distribuir, o usuário quer continuar. Se o sistema não oferecer essa continuidade, ele volta a navegar “por tentativa”. Isso é especialmente ruim para usuário novo.

### Prompt sugerido
```text
Adicione um CTA pós-sucesso na distribuição para levar o usuário diretamente à operação das áreas.

Objetivo:
- manter continuidade de fluxo
- evitar que o usuário novo precise decidir sozinho para onde ir depois de distribuir

Arquivo:
- `src/features/areas/components/areas-distribution-page.tsx`

Critério de UX:
- após a distribuição, o próximo passo deve ficar explícito e acessível em um clique
```

---

## Epic 6

### Título
`[Operação] Melhorar contexto e segurança da chamada da próxima luta`

### Contexto
A tela de fila já foi melhorada visualmente, mas ainda precisa se conectar melhor ao fluxo global.

### Issues relacionadas
- BT-017
- BT-018
- BT-019

### Labels sugeridas
- `type:ux`
- `type:flow`
- `area:areas`
- `priority:P3`

### Classificação
`Melhoria de orientação`

---

## Issue 18

### Título
`[Operação] Adicionar breadcrumb operacional na tela da fila da área`

### Contexto
A tela de chamada deve deixar claro onde o usuário está no fluxo maior.

### Escopo
- adicionar breadcrumb contextual:
  - distribuição
  - área
  - chamada

### Arquivos
- `src/features/areas/components/area-queue-page.tsx`

### Critérios de aceite
- usuário entende o contexto sem depender da navegação anterior
- breadcrumb não conflita com header atual

### Dependências
- taxonomia final da navegação

### Estimativa
`0.5 dia`

### Prioridade
`P3`

### Labels sugeridas
- `type:ux`
- `area:areas`
- `priority:P3`

### Classificação
`Melhoria de orientação`

### Análise prática
Usuário novo pode cair numa tela operacional sem entender se aquilo é configuração, monitoramento ou execução. Breadcrumb contextual resolve orientação básica e reduz sensação de estar perdido.

### Prompt sugerido
```text
Adicione um breadcrumb operacional na tela da fila da área para contextualizar um usuário novo dentro do fluxo da competição.

Objetivo:
- mostrar claramente onde ele está no processo

Estrutura sugerida:
- distribuição
- área
- chamada

Arquivo:
- `src/features/areas/components/area-queue-page.tsx`

Critério de UX:
- a tela deve deixar explícito que o usuário está em uma etapa operacional terminal
```

---

## Issue 19

### Título
`[Operação] Exibir indicadores de saúde operacional na tela da área`

### Contexto
A operação precisa indicar claramente se a área está apta para chamada.

### Escopo
- mostrar indicadores de:
  - atualização em tempo real
  - fila ativa/vazia
  - estado operacional da área

### Arquivos
- `src/features/areas/components/area-queue-page.tsx`

### Critérios de aceite
- operador identifica facilmente se a tela está confiável para uso
- indicadores não duplicam informação irrelevante

### Dependências
- nenhuma

### Estimativa
`0.5 dia`

### Prioridade
`P3`

### Labels sugeridas
- `type:ux`
- `area:areas`
- `priority:P3`

### Classificação
`Melhoria de orientação`

### Análise prática
Usuário novo precisa de sinais de confiança. Se a tela não mostrar se está atualizada, se há fila ou se a área está operacional, ele age com dúvida. Essa dúvida gera lentidão e erro.

### Prompt sugerido
```text
Adicione indicadores de saúde operacional na tela da área, com foco em confiança para um usuário que ainda não conhece o sistema.

Mostrar:
- se a atualização está em tempo real ou fallback
- se a fila está ativa ou vazia
- estado operacional da área

Arquivo:
- `src/features/areas/components/area-queue-page.tsx`

Critério de UX:
- antes de chamar a próxima luta, o usuário deve sentir que a tela é confiável e atual
```

---

## Issue 20

### Título
`[Operação] Exibir última luta chamada para reduzir risco de dupla chamada`

### Contexto
Em operação de mesa, uma referência da última chamada reduz erro humano.

### Escopo
- registrar e exibir a última luta chamada
- manter visibilidade temporária ou persistente enquanto fizer sentido

### Arquivos
- `src/features/areas/components/area-queue-page.tsx`
- eventual state/helper adicional

### Critérios de aceite
- após chamar próxima luta, a UI indica qual luta acabou de ser chamada
- informação não conflita com a próxima luta atualizada

### Dependências
- indicadores operacionais ou fluxo da fila revisado

### Estimativa
`1 dia`

### Prioridade
`P3`

### Labels sugeridas
- `type:ux`
- `area:areas`
- `priority:P3`

### Análise prática
Usuário novo pode repetir ação por insegurança, principalmente em ambiente barulhento ou com pressão. Mostrar a última luta chamada reduz repetição involuntária e aumenta previsibilidade operacional.

### Prompt sugerido
```text
Adicione uma indicação clara da última luta chamada na operação da área para reduzir risco de dupla chamada.

Objetivo:
- dar ao usuário uma referência imediata do que acabou de acontecer

Implementar:
- registrar a última luta chamada
- exibir essa informação de forma visível e contextual
- evitar conflito visual com a próxima luta da fila

Arquivo:
- `src/features/areas/components/area-queue-page.tsx`

Critério principal:
- o usuário deve conseguir confirmar rapidamente se já chamou aquela luta ou não
```

---

## Sugestão de Labels para o repositório

- `area:competitions`
- `area:navigation`
- `area:fights`
- `area:key-groups`
- `area:categories`
- `area:areas`
- `type:ux`
- `type:flow`
- `type:refactor`
- `priority:P1`
- `priority:P2`
- `priority:P3`

---

## Sugestão de Milestones

- `Sprint 0 - Athlete Readiness Foundation`
- `Sprint 1 - Flow Foundation`
- `Sprint 2 - Mode-Specific Generation`
- `Sprint 3 - Distribution and Operation`

---

## Corte Recomendado por Tipo

### Essencial para bloquear erro
- Issue 0
- Issue 0B
- Issue 0C
- Issue 1
- Issue 3
- Issue 5
- Issue 7
- Issue 15
- Issue 16

### Melhoria de orientação
- Issue 0A
- Issue 2
- Issue 4
- Issue 6
- Issue 8
- Issue 9
- Issue 10
- Issue 11
- Issue 12
- Issue 13
- Issue 14
- Issue 17
- Issue 18
- Issue 19
- Issue 20

---

## Ordem recomendada de criação

### Fase 1: Bloqueio de erro
1. Epic 0
2. Issue 0
3. Issue 0B
4. Issue 0C
5. Epic 1
6. Issue 1
7. Issue 3
8. Issue 5
9. Epic 2
10. Issue 7
11. Epic 5
12. Issue 15
13. Issue 16

### Fase 2: Orientação e clareza do fluxo
14. Issue 0A
15. Issue 2
16. Issue 4
17. Issue 6
18. Epic 3
19. Issue 8
20. Issue 9
21. Epic 4
22. Issue 10
23. Issue 11
24. Issue 12
25. Issue 13
26. Issue 14

### Fase 3: Continuidade operacional e refinamento
27. Issue 17
28. Epic 6
29. Issue 18
30. Issue 19
31. Issue 20
