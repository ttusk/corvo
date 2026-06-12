# Corvo

Corvo is an Obsidian plugin for managing study cycles for public exams.

## Stack

- TypeScript
- Obsidian API
- Vitest
- esbuild

## Architecture

- `src/domain`: core entities and domain services
- `src/application`: use case ports and data contracts
- `src/infrastructure`: adapters for Obsidian and persistence
- `src/ui`: plugin-facing commands, views, and settings

## Commands

- `npm install`
- `npm run build`
- `npm test`

## POC Commands

- `Corvo: Abrir painel do Corvo`
- `Corvo: Seed demo data`
- `Corvo: Show active contest`
- `Corvo: Switch active contest`
- `Corvo: Show active contest subjects`
- `Corvo: Reorder active contest subjects`
- `Corvo: Toggle first subject active state`
- `Corvo: Update first subject configuration`
- `Corvo: Advance cycle`
- `Corvo: Show cycle snapshot`
- `Corvo: Show active contest wall`
- `Corvo: Show active contest summary`
- `Corvo: Register demo question session`
- `Corvo: Register demo video session`
- `Corvo: Reset plugin data`

## UI

Corvo now includes a main Obsidian view with tabs for:

- `Dashboard`
- `Concursos`
- `Ciclo e Matérias`
- `Itens e PDFs`
- `Assuntos e Questões`
- `Sessões`
- `Mural`

Abra o Corvo pela faixa lateral esquerda, pela paleta de comandos com `Corvo: Abrir painel do Corvo` ou pelo botão da aba de configurações do plugin.
