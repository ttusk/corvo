# Leif

Leif é um plugin para Obsidian voltado ao acompanhamento de estudos para concursos públicos.

O objetivo do projeto é trazer para o Obsidian um fluxo estruturado de planejamento, execução e acompanhamento de estudos, com suporte a múltiplos concursos, ciclo de matérias, itens de estudo, assuntos, cadernos de questões, sessões registradas manualmente e mural de referências.

## Principais recursos

- Gestão de múltiplos concursos, com separação de dados por concurso.
- Definição de concurso ativo para estudo e acompanhamento.
- Cadastro de matérias com ordem, tempo planejado, etapa atual e status no ciclo.
- Ciclo de estudo entre matérias ativas.
- Recomendação determinística da matéria e do item a estudar no momento.
- Cadastro de itens de estudo por matéria, com referências de PDF, vídeo e link.
- Cadastro de assuntos por matéria.
- Vínculo de caderno de questões por assunto, com link clicável.
- Registro manual de sessões de estudo de PDF, vídeo e questões.
- Acompanhamento de páginas lidas, questões resolvidas e acertos.
- Dashboard com resumo por matéria.
- Mural por concurso, com links, notas e informações de referência.
- Exportação de dados em CSV.
- Vault de exemplo com dados de demonstração.

## Modelo de organização

O Leif organiza o estudo em torno do concurso ativo.

Cada concurso possui suas próprias matérias, itens, assuntos, sessões e mural. Uma mesma matéria pode existir em mais de um concurso, mas cada concurso mantém seu próprio recorte, prioridade e histórico.

### Concurso

É a unidade principal de organização. O concurso ativo define quais dados serão exibidos e usados no ciclo de estudo.

### Matéria

Representa uma disciplina do concurso. Cada matéria pode ter ordem no ciclo, tempo planejado, etapa atual e status ativo ou inativo.

### Item

Representa um material ou unidade de estudo dentro de uma matéria. É o local correto para associar PDFs, vídeos e links.

### Assunto

Representa um tópico da matéria. É o local correto para associar um caderno de questões.

### Sessão

Representa um registro manual de estudo. Pode ser uma sessão de PDF, vídeo ou questões.

## Interface

O painel principal do Leif é aberto em uma visualização própria do Obsidian.

As abas disponíveis são:

- `Dashboard`
- `Concursos`
- `Ciclo e Matérias`
- `Itens e PDFs`
- `Assuntos e Questões`
- `Sessões`
- `Mural`

O painel pode ser aberto pela faixa lateral esquerda ou pela paleta de comandos com:

```text
Leif: Abrir painel do Leif
```

## Instalação para desenvolvimento

Clone o repositório e instale as dependências:

```bash
npm install
```

Gere o build de produção:

```bash
npm run build
```

Execute a suíte de testes:

```bash
npm test
```

Durante o desenvolvimento, use:

```bash
npm run dev
```

## Vault de exemplo

O repositório inclui um vault de demonstração em `sample-vault/`.

Esse vault contém:

- plugin Leif já instalado;
- dados de demonstração para três concursos;
- matérias, itens, assuntos, cadernos de questões e sessões já cadastrados;
- configuração pronta para alternar entre concursos.

Para usar:

1. Abra o Obsidian.
2. Selecione `Open folder as vault`.
3. Escolha a pasta `sample-vault/`.
4. Abra o Leif pela faixa lateral esquerda ou pela paleta de comandos.

Ao executar `npm run build`, o bundle é copiado automaticamente para `sample-vault/.obsidian/plugins/leif/`.

## Comandos disponíveis

Além do painel principal, o plugin registra comandos auxiliares para demonstração e desenvolvimento:

- `Leif: Abrir painel do Leif`
- `Leif: Seed demo data`
- `Leif: Show active contest`
- `Leif: Switch active contest`
- `Leif: Show active contest subjects`
- `Leif: Reorder active contest subjects`
- `Leif: Toggle first subject active state`
- `Leif: Update first subject configuration`
- `Leif: Advance cycle`
- `Leif: Show cycle snapshot`
- `Leif: Show active contest wall`
- `Leif: Show active contest summary`
- `Leif: Register demo question session`
- `Leif: Register demo video session`
- `Leif: Reset plugin data`

## Arquitetura

O projeto segue uma arquitetura em camadas, com separação entre domínio, casos de uso, infraestrutura e interface.

```text
src/
  domain/          Entidades, serviços de domínio e erros
  application/     Casos de uso, portas, validações e guards
  infrastructure/  Persistência, migrations, seed e adapters
  ui/              Comandos, view principal e componentes
```

### Stack

- TypeScript
- Obsidian API
- Vitest
- esbuild

## Qualidade

A base possui testes automatizados para regras de domínio, casos de uso, persistência, comandos e fluxos principais da UI.

Antes de abrir uma contribuição, rode:

```bash
npm test
npm run build
```

## Contribuição

Contribuições são bem-vindas.

Para propor uma alteração:

1. Abra uma issue descrevendo o problema ou melhoria.
2. Crie uma branch a partir da branch principal.
3. Implemente a mudança com testes quando aplicável.
4. Garanta que `npm test` e `npm run build` passam.
5. Abra um pull request com uma descrição objetiva da alteração.

## Licença

Este projeto é de código aberto e está licenciado sob os termos da licença MIT.

Consulte o arquivo `LICENSE` para mais detalhes.
