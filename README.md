# 🏀 Longshot

**Jogo diário de basquete.** Todo dia aparece o **starting 5 de times históricos
sorteados** e você monta seu quinteto escolhendo **1 jogador de cada time** (uma
posição por vez), conhece os adversários **antes** de escolher, e assiste seu time
tentar vencer um **playoff melhor de 7** — 4 rodadas (First Round → Second Round →
Conference Finals → Finals) contra times históricos. Simulação automática estilo
2K, com box score, play-by-play resumido e momentum — e uma **prancheta de técnico**
para virar a série quando a coisa aperta. Igual ao Wordle: **os mesmos adversários
para todo mundo no dia**, fácil de comparar e compartilhar.

> **▶️ Jogar:** **[playlongshot.vercel.app](https://playlongshot.vercel.app)**
>
> Sem backend, sem login, sem banco. Estado 100% em `localStorage`. Adversários
> determinísticos pela data; o resultado é reproduzível por **time + data + táticas**.

---

## 🎮 Como jogar

1. **Conheça o caminho.** Os 4 adversários do dia (em escalada de dificuldade)
   aparecem no topo, com os ratings do First Round à mostra.
2. **Drafte por elenco** (~30s): aparece o starting 5 de um time histórico; escolha
   **1 jogador**. A posição trava e o próximo time não a oferece mais — até montar
   os 5 (um por posição). Não gostou? **Re-sorteie** o time (1× por dia). Opcional:
   escale um **sexto homem** (reserva) para poder substituir durante uma série.
3. **Inicie o Playoff** — decisão irreversível por hoje.
4. **Assista no seu ritmo:** avance **round a round**; em cada um veja o **scouting
   do adversário** (com traços tipo *Ritmo alto* · *Defesa elite*) e jogue **partida por
   partida** (placar, play-by-play e **box score com pontos, rebotes e assistências**, com
   "acelerar pro fim") ou **simule o round inteiro**. Rounds não alcançados ficam ocultos.
5. **Use a prancheta** (3 fichas no playoff inteiro): **Esquema da série**, **Timeout**
   (comeback quando está perdendo), **Takeover do craque** e **Sexto homem** — cada ação
   tem um custo e um trade-off. Leia os **traços do adversário e do seu time** para escolher.
6. **Evolua e colecione:** ganhe **XP/níveis** (patentes de carreira), desbloqueie um
   **mural de conquistas**, colecione **selos** por rodada máxima vencida (🥉🥈🥇🏆) e
   **cosméticos** (cores, temas, molduras), proteja o **streak** com **escudos** e
   **compartilhe** estilo Wordle — tudo com **som e confete** nos grandes momentos.

### ⚔️ Modo Gauntlet (roguelike infinito)

Um modo livre, à parte do diário (**não afeta streak/stats**): drafte um quinteto
rápido e encare uma **escalada infinita** de adversários cada vez mais fortes. A cada
rodada vencida, escolha **1 de 3 boons** que valem pela run inteira — buffs de time,
**escudos** (sobrevivem a uma derrota) ou um **Reforço** que troca seu elo fraco por um
craque. Os boons têm **teto por atributo** (o build plateia) e a dificuldade não para de
subir, então **toda run tem fim** — vale o **recorde** de rodadas. Motor puro em
[`engine/endless.ts`](src/engine/endless.ts); regras/dinâmicas em
[`lib/gauntletRun.ts`](src/lib/gauntletRun.ts), boons em
[`lib/gauntletBoons.ts`](src/lib/gauntletBoons.ts), capitão em
[`lib/gauntletCaptain.ts`](src/lib/gauntletCaptain.ts).

- **Monte sua run (setup):** escolha a **intensidade** (Tranquilo → Lendário), ligue
  **mutadores** (sem escudos / relâmpago melhor-de-1 / chefes em dobro / só ataque) e
  pegue o **código da run** (base36 da seed) para **encarar o mesmo gauntlet** que um amigo.
- **Dinâmicas:** a **ascensão** (derivada do recorde, crescendo ao longo da run) deixa
  tudo mais difícil de forma permanente; **rodadas-chefe** (a cada 5, melhor de 5);
  **modificadores** por rodada (azarão, mão fria, dia de 3…); e **eventos** (descanso / aposta).
- **Capitão** (meta-progressão): ao bater **recorde ≥ 50 em intensidade Padrão+** você
  escolhe **um jogador fixo** (escolha única) que entra em todo time, e ganha **boosts
  permanentes** cumprindo desafios (Veterano · Matador de gigantes · Astro · Lenda).

Tudo determinístico pela **seed da run** + escolhas; o motor segue puro (`opts` opcional
em `simulateGauntletRound` → sem opts, baseline idêntico).

---

## 🧠 O motor (a estrela do portfólio)

Todo o miolo do jogo vive em [`src/engine/`](src/engine/) — **TypeScript puro,
sem nenhuma dependência de DOM/React**. É a parte que mais importa.

### Determinismo e comparabilidade social
Nada de `Math.random`. O acaso vem de um RNG **semeado**:

- [`seed.ts`](src/engine/seed.ts) — `hashString` (xmur3) transforma uma string em
  um inteiro de 32 bits. A seed de cada série = `hash(data + ids do time + índice
  da rodada)`.
- [`rng.ts`](src/engine/rng.ts) — `mulberry32` gera um fluxo reproduzível de
  números a partir da seed; `shuffle` é um Fisher-Yates determinístico.

Os **adversários** são definidos só pela data (iguais para todos — sustentam o
"todo mundo enfrentou o Bulls 96 nas Finals" do share), enquanto a **sequência de
times do draft** (**62 times** com elencos em [`data/rosters.ts`](src/engine/data/rosters.ts))
é sorteada por jogador. Resultado: **mesmo time + data + táticas → mesmo bracket, sempre**.

### Simulação de um jogo — [`sim.ts`](src/engine/sim.ts)
`simulateGame(playerTeam, opponent, seed, adjust?)` joga **~100 posses por time** (o
ritmo escala com o `pace` do time histórico) e devolve placar, play-by-play e box score.

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
- **Vantagem do quinteto:** o time montado joga um pouco acima da média individual
  (um bônus calibrado), então você bate os times fracos e tem chance real contra os
  juggernauts — sem nunca ser favorito garantido.

### Táticas determinísticas — [`tactics.ts`](src/engine/tactics.ts)
O parâmetro **opcional** `adjust?: GameAdjust` aplica deltas ao time naquele jogo
(defesa/ritmo/clutch/acerto/3pt, foco no craque, troca pelo sexto homem). As
"táticas" do jogador (`SeriesTactics`/`BracketTactics`) viram esses ajustes por jogo
de forma determinística — **sem táticas, o resultado é byte-a-byte igual ao baseline**,
então a prancheta nunca compromete a reprodutibilidade.

### Série e bracket — [`series.ts`](src/engine/series.ts) · [`bracket.ts`](src/engine/bracket.ts)
- `simulateSeries` joga **melhor de 7** (cada jogo com sua própria seed derivada);
  empates de placar são resolvidos por prorrogação até haver um vencedor.
- `simulateBracket(team, date, tactics?, sixthMan?)` carrega os 4 adversários do dia e
  simula as séries em sequência, parando na derrota. `champion` = venceu as quatro.

### Química & escalada infinita — [`synergy.ts`](src/engine/synergy.ts) · [`endless.ts`](src/engine/endless.ts)
- **Sinergia de era:** um quinteto com **3+ jogadores da mesma década** ganha um bônus
  determinístico (clutch/acerto) — recompensa montar um time coeso, e entra como um
  `GameAdjust` no `simulateBracket`.
- **Gauntlet infinito:** `endlessOpponent` gera adversários numa escalada sem fim
  (clones turbinados dos mais fortes além do topo do pool) e `simulateGauntletRound`
  joga uma rodada **melhor de 3** combinando a química com os **boons** da run.

---

## ✨ Progressão & meta

Tudo **derivado do histórico** (nada de simulação é persistido), em `localStorage`:

- **Overall "índice de craque"** — média dos melhores ratings, esticada: lendas passam
  de 90, reservas ficam nos 60, dando impacto ao draft ([`lib/playerStats.ts`](src/lib/playerStats.ts)).
- **Leitura de matchup** ([`lib/scouting.ts`](src/lib/scouting.ts)): traços do adversário
  (*Ritmo alto*, *Defesa elite*, *Pouca bola de 3*…) e do seu quinteto (*Craque*, *Bom de
  3*…), derivados dos ratings, para escolher o esquema sem o jogo entregar a resposta.
- **Estatísticas da campanha** (na tela final): destaque de cada jogador (cestinha = PPG,
  os demais = melhor atributo), MVP, e totais — pontos, **pts/jogo**, **saldo**,
  **aproveitamento** e **maior vitória**.
- **Conquista Invicto 🐐 (16-0)**: campeão sem perder nenhum jogo (as 4 séries varridas) —
  destaque no hero do campeão, marca 🐐 no share e contagem nos recordes.
- **Mural de conquistas** ([`lib/achievements.ts`](src/lib/achievements.ts)): ~29 metas em
  três categorias (Carreira · Estatísticas · Gauntlet), derivadas do histórico, com barra
  de progresso nas bloqueadas e celebração ao desbloquear.
- **Histórico de jogadores** (no 📊): cestinhas de todos os tempos, mais escalados,
  recordes e resumo de uso, **re-simulando** cada dia com as táticas usadas
  ([`lib/playerHistory.ts`](src/lib/playerHistory.ts)).
- **Curiosidades dos jogadores** no draft ([`lib/playerFacts.ts`](src/lib/playerFacts.ts)):
  uma frase de contexto para as lendas, dando identidade às escolhas.
- **Escudos de streak**: ganhos a cada 10 dias, protegem a sequência quando você pula um dia.
- **Som & confete** ([`lib/sound.ts`](src/lib/sound.ts) — Web Audio sintetizado, sem dep —
  e [`lib/confetti.ts`](src/lib/confetti.ts)): respeitam `prefers-reduced-motion` e têm
  toggle de mudo.
- **Níveis & XP** ([`lib/level.ts`](src/lib/level.ts)): XP por quão longe você foi no
  playoff; patentes de carreira (Rookie → … → G.O.A.T.).
- **Cosméticos desbloqueáveis por nível**: cores de acento e **temas completos**
  ([`lib/skins.ts`](src/lib/skins.ts), via variáveis CSS `data-theme`) e **molduras**
  de card ([`lib/frames.ts`](src/lib/frames.ts)).
- **Share Wordle-style** ([`lib/share.ts`](src/lib/share.ts)): 🟩/🟥 por rodada + selo +
  prévia do seu quinteto e link limpo, **sem revelar os adversários**; marca 📋 quando usou
  a prancheta e 🐐 quando foi 16-0.

---

## 🏗️ Arquitetura

```
UI (components/ · hooks/)  ──importa──▶  engine/ (TS puro)
        │                                    ▲
        └────────── lib/ (storage, share…) ──┘
```

**Regra inviolável:** `engine/` nunca importa de React, do DOM ou da UI — a
direção é sempre **UI → engine**. Isso é garantido por um guardrail de ESLint
(`no-restricted-imports` + `no-restricted-globals` em `src/engine/**`), não só por
convenção.

| Camada | Papel |
|--------|------|
| [`src/engine/`](src/engine/) | motor puro: tipos, dados (elencos + times), seed, RNG, draft, simulação, **táticas**, série, bracket, **sinergia**, **gauntlet** |
| [`src/lib/`](src/lib/) | `storage`, `share`/`challenge`, `badges`, `playerStats`, `playerHistory`, `scouting`, `level`, `skins`, `frames`, `tactics`, `achievements`, `gauntletRun`/`gauntletBoons`/`gauntletCaptain`, `playerFacts`, `sound`, `confetti` |
| [`src/hooks/`](src/hooks/) | `usePlayoff` orquestra draft → trava → simulação reativa (táticas) → persistência |
| [`src/components/`](src/components/) | `DraftScreen`, `BracketView`, `GameFeed`, `TeamStats`, `CoachActions`, `CoachGuide`, `LevelBadge`, `ResultModal`, `Onboarding`, `GauntletScreen` |

---

## 🧱 Stack

Vite · React · TypeScript (modo `strict`) · TailwindCSS v4 · Vitest · canvas-confetti.
PWA (instalável, offline). Mobile-first, tema claro/escuro do sistema. As cores são
**tokens semânticos** (variáveis CSS via `@theme` + `light-dark()`); o visual padrão é o
**Hardwood clássico** e há **skins desbloqueáveis** (`data-theme`).

## 🚀 Rodando localmente

```bash
npm install
npm run dev        # servidor de desenvolvimento
npm run test:run   # roda os testes uma vez (Vitest)
npm run coverage   # testes + cobertura
npm run build      # gera dist/ (typecheck + build de produção)
```

O motor é coberto por testes determinísticos (incluindo uma **guarda de equilíbrio**
do Gauntlet); a UI por testes em jsdom (Testing Library). **128 testes** no total.

## ☁️ Deploy

Site estático (SPA) na **Vercel** — `vercel.json` faz o rewrite de todas as rotas
para `index.html`. `npm run deploy` publica via Vercel CLI; conectando o repo no
dashboard, cada push na `main` republica automaticamente.

## ⚖️ Nota

Projeto de hobby/portfólio, **sem monetização**. Usa nomes, posições e eras de
jogadores reais com ratings autorais — **sem fotos nem logos**. Não afiliado à NBA.
