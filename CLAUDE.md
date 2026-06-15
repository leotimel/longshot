# CLAUDE.md — Longshot

## O jogo
Jogo **diário** de basquete. O jogador monta um **quinteto da NBA** escolhendo
**1 jogador do starting-5 de times históricos sorteados** (1 por time; posições
únicas), **conhece o adversário antes de escolher**, e então assiste a um **playoff
melhor de 7** — 4 rodadas (First Round → Second Round → Conference Finals →
Finals) contra **times históricos**. **Simulação automática** estilo 2K: box
score de pontos por jogador, play-by-play resumido e momentum. Sem backend nem
login; estado em `localStorage`; deploy estático.

## Arquitetura — regra inviolável
- `src/engine/` é **TypeScript puro, sem DOM** — é a vitrine do portfólio.
  Proibido importar `react`/`react-dom` ou usar globais de DOM (`document`,
  `window`, `navigator`, `localStorage`).
- Direção das dependências: **UI → engine**. `components/`, `hooks/` e `lib/`
  importam de `engine/`; **`engine/` nunca importa da UI**.
- Enforçado por ESLint (`no-restricted-imports` + `no-restricted-globals` em
  `src/engine/**`). Rode `npm run lint`.

## Invariantes do motor — não quebrar
- **Adversários determinísticos pela data:** os **4 adversários** (todas as
  rodadas) são definidos **só pela data**, iguais para todos no dia — é o que
  sustenta o "mesmo gauntlet" do share/desafio. Os **times do draft são sorteados
  POR JOGADOR** (`dailyDraft(date, poolSalt)`; salt local em `longshot:player:v1`),
  então cada jogador drafta de times diferentes. Elencos em `data/rosters.ts`.
- **Seed de cada série = `hash(data + ids do time + índice da rodada)`**. Sem
  `Math.random` no engine.
- **Determinístico:** mesmo time (5 ids dos jogadores) + data **+ táticas** = mesmo
  resultado. A "prancheta" (esquema/timeout/takeover/sexto homem) é entrada opcional de
  `simulateGame/Series/Bracket` (`GameAdjust`/`BracketTactics`); **sem táticas = baseline
  idêntico**. Os adversários seguem definidos só pela data (mesmo gauntlet pra todos); o
  resultado vira fruto das táticas do jogador.
- Cada série termina entre **4 e 7 jogos**; o vencedor tem **exatamente 4**
  vitórias; o box score **soma o placar final**.

## Regras de produto
- **Draft travado:** ao confirmar ("Iniciar Playoff"), salva no storage e **não
  pode refazer** naquele dia. Rascunhar à vontade antes de confirmar.
- **Streak por presença diária, sem estado de falha:** jogou = streak vivo. Ser
  eliminado no First Round conta **igual** a vencer as Finals para o streak.
- **4 selos progressivos** por rodada máxima atingida — 🥉 First Round Survivor ·
  🥈 Conference Semis · 🥇 Conference Finals · 🏆 Champion. Acumulam no histórico;
  o share exibe o selo do dia.
- **Share Wordle-style** (🟩 vitória / 🟥 derrota por rodada + selo) **sem
  revelar** os adversários do dia; prévia do próprio quinteto + 📋 quando usou táticas.
- **Prancheta do técnico (reativa):** 3 fichas no playoff inteiro (escassez + trade-offs).
  Esquema da série, Timeout (comeback quando perdendo), Takeover do craque (máx 1) e Sexto
  homem (pick extra no draft). Aplicadas DURANTE a revelação; recomputam o bracket; o
  resultado final + táticas são gravados ao terminar (`finalizeDay`).

## Convenções
- **TypeScript strict.** Testes em **Vitest** (`npm run test:run`,
  `npm run coverage`): engine roda em **Node**; testes de UI optam por jsdom por
  arquivo (`// @vitest-environment jsdom`). Rodar os testes após mexer no engine.
- **Jogadores reais, sem monetização** (hobby/portfólio; zona cinza de licença).
  Sem fotos nem logos — só nome, posição, era e ratings.
- Stack: Vite + React + TypeScript + **TailwindCSS v4** (`@tailwindcss/vite`,
  sem `tailwind.config.js`). Um prompt do playbook por vez; commit por fase.

## Não construir agora
Multiplayer ao vivo, conta de usuário, banco de dados, licença NBA, animações 3D.
