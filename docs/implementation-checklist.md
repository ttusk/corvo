# Corvo Implementation Checklist

Baseado em [plugin-de-ciclo-de-estudos.md](/Users/luizgustavo/git/vault/projects/corvo/plugin-de-ciclo-de-estudos.md).

## Base do projeto

- [x] Plugin Obsidian em TypeScript
- [x] Build com esbuild
- [x] Testes com Vitest
- [x] Modelo inicial de domínio
- [x] Storage JSON com `loadData()` / `saveData()`
- [x] Serviço de ciclo com rotação de matérias ativas
- [x] Casos de uso de aplicação para o fluxo principal de concursos e ciclo
- [x] Comandos de POC para operar o plugin no Obsidian

## Concursos

- [x] Cadastrar mais de um concurso
- [x] Manter os dados separados por concurso
- [x] Selecionar o concurso ativo para estudo e visualização
- [x] Manter um mural próprio por concurso

## Matérias e ciclo

- [x] Cadastrar matérias em ordem fixa
- [x] Permitir reordenar manualmente as matérias no ciclo
- [x] Ativar e desativar matérias no ciclo
- [x] Registrar o tempo padrão por matéria
- [x] Permitir ajustar o tempo de estudo por matéria
- [x] Registrar a etapa atual da matéria
- [x] Identificar a matéria atual
- [x] Identificar a próxima matéria
- [x] Identificar o próximo item

## Itens, assuntos e referências

- [x] Cadastrar itens em ordem por matéria
- [x] Cadastrar assuntos por matéria
- [x] Registrar referência de PDF, vídeo, caderno ou link por assunto ou item
- [x] Permitir o vínculo de um caderno de questões do Tec Concursos por assunto

## Registro de estudo

- [x] Registrar sessões de estudo manualmente
- [x] Registrar página, quantidade e acertos, quando aplicável

## Acompanhamento

- [x] Consolidar resumo por matéria
- [x] Exibir progresso de PDF
- [x] Exibir progresso de questões

## Mural

- [x] Manter um mural com referências do concurso
