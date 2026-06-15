/**
 * Strings da interface, centralizadas em PT.
 *
 * Para adicionar EN depois: renomeie este objeto para `pt`, crie um `en` com a
 * MESMA forma e troque o export por um seletor de locale, ex.:
 *   const strings = navigator.language.startsWith('en') ? en : pt
 * Os componentes já consomem tudo via `strings.*`, então nada mais muda.
 */
import type { PlayerRatings, Position } from '../engine/types'

export const strings = {
  appName: '🏀 Longshot',

  a11y: {
    stats: 'Estatísticas',
    help: 'Como jogar',
    resultDialog: 'Resultado e estatísticas',
  },

  positions: {
    PG: 'Armador',
    SG: 'Ala-armador',
    SF: 'Ala',
    PF: 'Ala-pivô',
    C: 'Pivô',
  } as Record<Position, string>,

  ratings: {
    speed: 'VEL',
    shooting: 'ARR',
    threePoint: '3PT',
    defense: 'DEF',
    passing: 'PAS',
    rebounding: 'REB',
    clutch: 'CLU',
  } as Record<keyof PlayerRatings, string>,

  teamRatings: {
    offense: 'Ataque',
    defense: 'Defesa',
    pace: 'Ritmo',
    threePointRate: 'Bola de 3',
    clutch: 'Clutch',
  },

  rounds: {
    names: ['First Round', 'Second Round', 'Conf. Finals', 'Finais'],
    tags: ['1R', '2R', 'CF', 'F'],
  },

  badges: {
    emoji: ['🥉', '🥈', '🥇', '🏆'],
    labels: ['First Round Survivor', 'Conference Semis', 'Conference Finals', 'Champion!'],
  },

  draft: {
    path: 'Seu caminho até o título',
    ovr: 'ovr',
    summaryLabel: 'Seu quinteto:',
    irreversible: 'Decisão irreversível — você não pode refazer hoje.',
    start: 'Iniciar Playoff →',
    progress: (chosen: number, total: number) => `Escolha seu quinteto — ${chosen}/${total}`,
    beat: (target: string) => `🎯 Supere: ${target}`,
    choose: (pos: string) => `Escolha seu ${pos}`,
    stepOf: (n: number, total: number) => `${n} de ${total}`,
    pickPlayer: 'Escolha um jogador',
    reroll: '🔀 Re-sortear time',
    posTaken: 'já escolhido',
  },

  bracket: {
    title: 'Seu Playoff',
    champion: '🏆 Campeão!',
    championTitle: 'Campeão!',
    championSub: 'Você venceu as 4 rodadas',
    lineup: 'Seu quinteto',
    sweep: 'Varrida',
    mvp: 'Cestinha',
    campaignTotals: 'Totais da campanha',
    points: 'Pontos',
    games: 'Jogos',
    recordGame: 'Maior jogo',
    ppg: 'pts/jg',
    eliminated: 'Eliminado no First Round',
    won: 'venceu ✓',
    lost: 'perdeu ✗',
    wonShort: 'V',
    lostShort: 'D',
    back: '← Bracket',
    exit: 'Voltar ao draft',
    game: (n: number) => `Jogo ${n}`,
    vs: (name: string) => `vs ${name}`,
    toPlay: 'A jogar',
    hidden: '🔒',
    playByGame: 'Partida por partida',
    simRound: 'Simular round',
    fastForward: '⏩ Acelerar pro fim',
    nextRound: 'Próximo round →',
    seeResult: 'Ver resultado',
  },

  game: {
    of: (n: number, total: number) => `Jogo ${n} de ${total}`,
    only: (n: number) => `Jogo ${n}`,
    yourTeam: 'Seu time',
    plays: 'Lances',
    boxScore: 'Box score',
    backToSeries: 'Ver Série',
    next: 'Próximo Jogo →',
  },

  result: {
    eliminated: 'Eliminado no First Round',
    streak: 'streak',
    best: 'melhor',
    badgesTitle: 'Selos conquistados',
    nextDraft: 'Próximo draft em',
    share: 'Compartilhar',
    viewBracket: 'Ver Bracket',
    close: 'Fechar',
    // Histórico de jogadores (acumulado entre dias)
    playersTitle: 'Jogadores da carreira',
    scorers: 'Cestinhas (todos os tempos)',
    usage: 'Resumo',
    used: 'jogadores',
    favorite: 'favorito',
    careerPoints: 'pontos',
    days: 'dias',
    records: 'Recordes',
    recordGame: 'Maior jogo',
    bestCampaign: 'Melhor campanha',
    ppg: 'pts/jg',
    picks: (n: number) => `×${n}`,
    emptyHistory: 'Jogue alguns dias para acumular estatísticas dos jogadores.',
  },

  level: {
    tag: (n: number) => `Nv ${n}`,
    word: 'Nível',
    rank: 'Patente',
    xp: 'XP',
    toNext: (a: number, b: number) => `${a} / ${b} XP`,
    leveledUp: 'Subiu de nível!',
    todayXp: (n: number) => `+${n} XP hoje`,
    badgeAria: (n: number) => `Nível ${n} — abrir progresso e estatísticas`,
  },

  cosmetics: {
    skins: 'Visual',
    frames: 'Moldura do quinteto',
    locked: (lvl: number) => `🔒 Nv ${lvl}`,
    accent: 'acento',
    theme: 'tema',
    apply: 'Aplicar',
  },

  tactics: {
    fichas: (n: number) => `📋 ${n}`,
    fichasLabel: 'Fichas do técnico',
    prepare: 'Prancheta · prepare a série',
    scheme: 'Esquema',
    schemes: {
      acelerar: 'Acelerar',
      travar: 'Travar',
      isolar: 'Isolar craque',
      garrafao: 'Garrafão',
    } as Record<'acelerar' | 'travar' | 'isolar' | 'garrafao', string>,
    schemeDesc: {
      acelerar: '+Ritmo · −Defesa',
      travar: '+Defesa · −Ritmo',
      isolar: '+Astro · −Coletivo',
      garrafao: '+Garrafão · −Bola de 3',
    } as Record<'acelerar' | 'travar' | 'isolar' | 'garrafao', string>,
    timeout: '⏱️ Timeout',
    timeoutHint: 'Turbina os próximos jogos da série (+clutch, +cesta, +defesa)',
    takeover: '👑 Takeover',
    takeoverHint: 'Seu craque assume o próximo jogo (muito mais pontos e clutch)',
    sub: '🔄 Sexto homem',
    subActive: (name: string) => `🔄 ${name} em quadra`,
    subHint: 'Entra no lugar do titular da posição pelo resto da série',
    cost: '1 ficha',
    costToken: '1 📋',
    down: (pw: number, ow: number) => `Atrás ${pw}-${ow}! Hora de reagir:`,
    reactWhen: '⏱️ Timeout e 👑 Takeover ficam disponíveis quando você está atrás na série.',
    noTokens: 'Sem fichas',
    noSixth: 'Escale um reserva no draft',
    help: 'Como funciona',
    // Passo do draft
    sixthManStep: 'Sexto homem (opcional)',
    sixthManExplain: 'Escolha um reserva para poder substituí-lo numa série — ou pule.',
    skip: 'Pular',
    chosen: (name: string) => `Reserva: ${name}`,
    // Guia da prancheta
    guide: {
      title: '📋 Prancheta do técnico',
      budget: 'Você tem 3 fichas no playoff inteiro. Cada ação custa 1 — escolha bem.',
      items: [
        {
          icon: '🧩',
          name: 'Esquema da série',
          effect: 'Um foco com trade-off: acelerar, travar, isolar o craque ou dominar o garrafão.',
          when: 'No card do round, antes de jogar.',
        },
        {
          icon: '⏱️',
          name: 'Timeout',
          effect: 'Turbina os próximos jogos da série (+clutch, +cesta, +defesa).',
          when: 'Quando você está atrás na série.',
        },
        {
          icon: '👑',
          name: 'Takeover do craque',
          effect: 'Seu astro assume o próximo jogo (muito mais pontos e clutch).',
          when: 'Quando está atrás · 1× no playoff.',
        },
        {
          icon: '🔄',
          name: 'Sexto homem',
          effect: 'O reserva entra no lugar do titular da posição pelo resto da série.',
          when: 'Se você escalou um reserva no draft.',
        },
      ],
      gotIt: 'Entendi',
    },
  },

  onboarding: {
    title: '🏀 Como jogar',
    rule: 'Escolha seu quinteto. Enfrente os maiores times da história.',
    detail:
      'Todo dia você drafta 5 jogadores e sobe 4 rodadas de playoff (melhor de 7) contra times lendários. Cada rodada vencida vale um selo.',
    coachTitle: '📋 Prancheta do técnico',
    coach:
      'Você tem 3 fichas no playoff para virar uma série: Esquema, Timeout, Takeover e Sexto homem. Use quando estiver perdendo.',
    gotIt: 'Entendi',
  },
}
