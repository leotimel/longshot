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

  onboarding: {
    title: '🏀 Como jogar',
    rule: 'Escolha seu quinteto. Enfrente os maiores times da história.',
    detail:
      'Todo dia você drafta 5 jogadores e sobe 4 rodadas de playoff (melhor de 7) contra times lendários. Cada rodada vencida vale um selo.',
    gotIt: 'Entendi',
  },
}
