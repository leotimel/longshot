# 🏀 Longshot

**Jogo diário de basquete.** Todo dia você drafta um quinteto de jogadores reais
da NBA a partir de 10 sorteados (2 por posição), conhece os adversários **antes**
de escolher, e assiste seu time tentar vencer um **playoff melhor de 7** — 4
rodadas (First Round → Second Round → Conference Finals → Finals) contra times
históricos. Simulação automática estilo 2K, com box score, play-by-play resumido
e momentum. Igual ao Wordle: **o mesmo bracket para todo mundo no dia**, fácil de
comparar e compartilhar.

> **▶️ Jogar:** **[playlongshot.vercel.app](https://playlongshot.vercel.app)**
>
> Sem backend, sem login, sem banco. Estado 100% em `localStorage`. Determinístico
> pela data — mesmos picks, mesmo resultado.

---

## 🎮 Como jogar

1. **Conheça o caminho.** Os 4 adversários do dia (em escalada de dificuldade)
   aparecem no topo, com os ratings do First Round à mostra.
2. **Drafte 5 escolhas binárias** (~30s): uma dupla por posição, você escolhe um.
3. **Inicie o Playoff** — decisão irreversível por hoje.
4. **Navegue jogo a jogo:** placar, play-by-play e box score de cada partida.
5. **Colecione selos** por rodada máxima vencida — 🥉 First Round · 🥈 Conference
   Semis · 🥇 Conference Finals · 🏆 Champion — mantenha o **streak** e
   **compartilhe** o resultado estilo Wordle (sem revelar os adversários).

---

## 🧠 O motor (a estrela do portfólio)

Todo o miolo do jogo vive em [`src/engine/`](src/engine/) — **TypeScript puro,
sem nenhuma dependência de DOM/React**. É a parte que mais importa.

### Determinismo e comparabilidade social
Nada de `Math.random`. O acaso vem de um RNG **semeado**:

- [`seed.ts`](src/engine/seed.ts) — `hashString` (xmur3) transforma uma string em
  um inteiro de 32 bits. A seed do dia = `hash(data + picks)`; a de cada série =
  `hash(data + picks + índice da rodada)`.
- [`rng.ts`](src/engine/rng.ts) — `mulberry32` gera um fluxo reproduzível de
  números a partir da seed; `shuffle` é um Fisher-Yates determinístico.

Resultado: **mesmos picks → mesmo bracket, sempre**. É isso que permite o "todo
mundo enfrentou o Bulls 96 nas Finals" do compartilhamento.

### Simulação de um jogo — [`sim.ts`](src/engine/sim.ts)
`simulateGame(playerTeam, opponent, seed)` joga **~100 posses por time** (o ritmo
escala com o `pace` do time histórico) e devolve placar, play-by-play e box score.

Cada posse é um sorteio em cascata, com probabilidades **derivadas dos ratings**:

| Evento | Depende de |
|--------|-----------|
| **Turnover** | passe do time vs. defesa do adversário |
| **Arremesso de 3** | frequência pela `threePoint` do arremessador / `threePointRate` do time histórico (era!) |
| **Arremesso de 2 / lance livre** | acerto = função do `shooting`/`threePoint` do jogador vs. defesa do adversário |

Os pontos vão para um **arremessador** escolhido por uso (`shooting + threePoint +
speed`), então estrelas pontuam mais e o box score fica vivo. Os times históricos
pontuam em nível de equipe (`offense` vs. defesa agregada do quinteto).

- **Clutch factor:** nos ~2 minutos finais, a diferença de `clutch` entre ataque e
  defesa entra nas probabilidades de acerto — jogos apertados se decidem no fim.
- **Vantagem do quinteto:** 5 estrelas jogam acima da média individual (um bônus
  calibrado), então você bate os times fracos e tem chance real contra os
  juggernauts — sem nunca ser favorito garantido.

Calibrado num CHECKPOINT lendo dezenas de play-by-plays: placares **~95–110 por
time**, arremessos de 3 por era, e um gradiente de força crível (o melhor time
de todos os tempos ganha mais, mas não sempre). Cada jogo simula em **< 5 ms**.

### Série e bracket — [`series.ts`](src/engine/series.ts) · [`bracket.ts`](src/engine/bracket.ts)
- `simulateSeries` joga **melhor de 7** (cada jogo com sua própria seed derivada);
  empates de placar são resolvidos por prorrogação até haver um vencedor.
- `simulateBracket` carrega os 4 adversários do dia e simula as séries em
  sequência, parando na derrota. `champion` = venceu as quatro.

---

## 🏗️ Arquitetura

```
UI (components/ · hooks/)  ──importa──▶  engine/ (TS puro)
        │                                    ▲
        └────────── lib/ (storage, share) ───┘
```

**Regra inviolável:** `engine/` nunca importa de React, do DOM ou da UI — a
direção é sempre **UI → engine**. Isso é garantido por um guardrail de ESLint
(`no-restricted-imports` + `no-restricted-globals` em `src/engine/**`), não só por
convenção.

| Camada | Papel |
|--------|------|
| [`src/engine/`](src/engine/) | motor puro: tipos, dados, seed, RNG, draft, simulação, bracket |
| [`src/lib/`](src/lib/) | `storage` (localStorage), `share`/`challenge` (Wordle + link), `badges` |
| [`src/hooks/`](src/hooks/) | `usePlayoff` orquestra draft → trava → simulação → persistência |
| [`src/components/`](src/components/) | `DraftScreen`, `BracketView`, `GameFeed`, `ResultModal`, `Onboarding` |

---

## 🧱 Stack

Vite · React · TypeScript (modo `strict`) · TailwindCSS v4 · Vitest. Visual
retrô anos 90, mobile-first, tema claro/escuro do sistema.

## 🚀 Rodando localmente

```bash
npm install
npm run dev        # servidor de desenvolvimento
npm run test:run   # roda os testes uma vez (Vitest)
npm run coverage   # testes + cobertura
npm run build      # gera dist/ (typecheck + build de produção)
```

O motor é coberto por testes determinísticos; a UI por testes em jsdom
(Testing Library). **53 testes** no total.

## ☁️ Deploy

Site estático (SPA) na **Vercel** — `vercel.json` faz o rewrite de todas as rotas
para `index.html`. `npm run deploy` publica via Vercel CLI; conectando o repo no
dashboard, cada push na `main` republica automaticamente.

## ⚖️ Nota

Projeto de hobby/portfólio, **sem monetização**. Usa nomes, posições e eras de
jogadores reais com ratings autorais — **sem fotos nem logos**. Não afiliado à NBA.
