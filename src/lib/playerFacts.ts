/**
 * Curiosidades curtas dos jogadores (sabor/identidade), por NOME — estável entre
 * times/anos. Só de UI; o motor não lê isto. Cobertura parcial (lendas e estrelas);
 * quem não tem fato simplesmente não exibe linha. Fatos amplamente conhecidos,
 * em uma frase.
 */

const FACTS: Record<string, string> = {
  'Michael Jordan': '6 títulos, 6 MVPs das Finals — nunca perdeu uma decisão.',
  'LeBron James': 'Maior cestinha da história da NBA.',
  'Kareem Abdul-Jabbar': 'Dono do skyhook; 6 vezes MVP da liga.',
  'Magic Johnson': 'Armador de 2,06m que jogava as cinco posições.',
  'Larry Bird': 'Três MVPs seguidos (1984–86).',
  'Bill Russell': '11 títulos em 13 anos — recorde absoluto.',
  'Wilt Chamberlain': 'Único a marcar 100 pontos num único jogo.',
  'Tim Duncan': 'O Big Fundamental: 5 títulos com os Spurs.',
  'Kobe Bryant': 'Marcou 81 pontos num jogo, em 2006.',
  "Shaquille O'Neal": 'Uma das forças mais dominantes no garrafão.',
  'Stephen Curry': 'Maior arremessador de 3 da história.',
  'Hakeem Olajuwon': 'O Sonho: bicampeão e mestre do Dream Shake.',
  'Kevin Durant': 'Pontuador nato; MVP da liga em 2014.',
  'Giannis Antetokounmpo': 'O Greek Freak — MVP e campeão em 2021.',
  'Nikola Jokić': 'Pivô-armador sérvio, várias vezes MVP.',
  'Dirk Nowitzki': 'Alemão pioneiro; campeão em 2011 com o fadeaway.',
  'Kevin Garnett': 'Defensor do Ano em 2008; intensidade lendária.',
  'Charles Barkley': 'Round Mound of Rebound; MVP em 1993.',
  'Karl Malone': 'O Carteiro — um dos maiores pontuadores da história.',
  'John Stockton': 'Recordista de assistências e roubos da NBA.',
  'Isiah Thomas': 'Cérebro dos Bad Boys; campeão em 89 e 90.',
  'Scottie Pippen': 'Asa defensiva perfeita ao lado de Jordan.',
  'Dennis Rodman': 'Reboteiro obsessivo; líder de rebotes 7 vezes seguidas.',
  'Jerry West': 'A silhueta do logo da NBA.',
  'Oscar Robertson': 'O Big O — 1º a tirar média de triplo-duplo na temporada.',
  'Julius Erving': 'Dr. J levou a enterrada à arte.',
  'Patrick Ewing': 'Pivô-âncora dos Knicks dos anos 90.',
  'David Robinson': 'O Almirante; MVP e Defensor do Ano.',
  'Dwyane Wade': 'Flash; carregou o Heat ao título de 2006.',
  'Chris Paul': 'CP3 — maestro com mãos rápidas no roubo.',
  'Russell Westbrook': 'Recordista de triplos-duplos na história.',
  'Kawhi Leonard': 'The Claw — FMVP por dois times diferentes.',
  'Jason Kidd': 'Triplo-duplo ambulante; campeão em 2011.',
  'Steve Nash': 'Bicampeão de MVP (2005–06) e maestro do ataque.',
  'Ray Allen': 'Lenda dos 3; o de 2013 salvou o título do Heat.',
  'Paul Pierce': 'The Truth — campeão e FMVP em 2008.',
  'Klay Thompson': 'Splash Brother; 37 pontos num único quarto.',
  'Draymond Green': 'Motor defensivo dos Warriors campeões.',
  'Manu Ginóbili': 'Popularizou o euro-step na NBA.',
  'Tony Parker': 'Francês veloz; FMVP das Finals em 2007.',
  'Marc Gasol': 'Espanhol; Defensor do Ano em 2013 e campeão em 2019.',
  'Moses Malone': 'Reboteiro feroz; tricampeão de MVP.',
  'Willis Reed': 'Capitão herói do jogo 7 dos Knicks em 1970.',
  'Walt Frazier': 'Clyde — elegância no ataque, mãos de veludo na defesa.',
  'Jayson Tatum': 'Asa pontuadora dos Celtics campeões de 2024.',
  'Devin Booker': 'Marcou 70 pontos num jogo aos 21 anos.',
  'Jamal Murray': 'Decisivo no título do Denver em 2023.',
}

/** Curiosidade do jogador (por nome), ou `undefined` se não houver. */
export function factFor(name: string): string | undefined {
  return FACTS[name]
}
