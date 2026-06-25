/**
 * Elencos (starting 5) dos times históricos — a fonte do draft.
 *
 * Engine puro (sem DOM). Para cada time de `teams.ts`, um quinteto titular real
 * (PG·SG·SF·PF·C) com ratings 0–100 refletindo o nível do jogador naquele time.
 * Fivés plausíveis (aproximações onde a memória falha). Sem fotos/logos.
 *
 * `id` = `${teamId}-${sobrenome}` (único; o mesmo jogador em times diferentes é
 * uma entrada distinta, com ratings daquele ano).
 */
import type { Era, Player, PlayerSilhouette, Position } from '../types'
import { TEAMS } from './teams'

/** [speed, shooting, threePoint, defense, passing, rebounding, clutch] */
type R = [number, number, number, number, number, number, number]

const SIL: Record<string, PlayerSilhouette> = {
  Jordan:    { height: 'medium', build: 'average', skin: 'medium', number: 23, features: [] },
  Bird:      { height: 'tall',   build: 'average', skin: 'light',  number: 33, features: [] },
  Magic:     { height: 'tall',   build: 'average', skin: 'dark',   number: 32, features: [] },
  Kareem:    { height: 'tall',   build: 'slim',    skin: 'dark',   number: 33, features: [] },
  Wilt:      { height: 'tall',   build: 'stocky',  skin: 'dark',   number: 13, features: [] },
  Russell:   { height: 'tall',   build: 'slim',    skin: 'dark',   number:  6, features: [] },
  Shaq:      { height: 'tall',   build: 'stocky',  skin: 'dark',   number: 34, features: ['bald'] },
  Iverson:   { height: 'short',  build: 'slim',    skin: 'dark',   number:  3, features: ['headband', 'tattoo', 'wristband'] },
  Malone:    { height: 'tall',   build: 'stocky',  skin: 'dark',   number: 32, features: [] },
  Stockton:  { height: 'short',  build: 'average', skin: 'light',  number: 12, features: [] },
  Duncan:    { height: 'tall',   build: 'average', skin: 'medium', number: 21, features: [] },
  LeBron:    { height: 'tall',   build: 'stocky',  skin: 'dark',   number: 23, features: ['tattoo', 'wristband'] },
  Kobe:      { height: 'medium', build: 'average', skin: 'medium', number: 24, features: ['tattoo'] },
  Curry:     { height: 'medium', build: 'slim',    skin: 'medium', number: 30, features: [] },
  Durant:    { height: 'tall',   build: 'slim',    skin: 'dark',   number: 35, features: [] },
  Garnett:   { height: 'tall',   build: 'slim',    skin: 'dark',   number: 21, features: [] },
  Hakeem:    { height: 'tall',   build: 'average', skin: 'dark',   number: 34, features: [] },
  Barkley:   { height: 'medium', build: 'stocky',  skin: 'medium', number: 34, features: [] },
  Pippen:    { height: 'tall',   build: 'average', skin: 'medium', number: 33, features: [] },
  Wade:      { height: 'medium', build: 'average', skin: 'medium', number:  3, features: ['tattoo', 'wristband'] },
  Nowitzki:  { height: 'tall',   build: 'average', skin: 'light',  number: 41, features: [] },
  Thomas:    { height: 'short',  build: 'average', skin: 'medium', number: 11, features: [] },
  Robinson:  { height: 'tall',   build: 'average', skin: 'medium', number: 50, features: [] },
  Rodman:    { height: 'medium', build: 'slim',    skin: 'medium', number: 91, features: ['tattoo'] },
  West:      { height: 'medium', build: 'average', skin: 'light',  number: 44, features: [] },
  Robertson: { height: 'medium', build: 'average', skin: 'medium', number: 14, features: [] },
  Frazier:   { height: 'medium', build: 'average', skin: 'medium', number: 10, features: [] },
  Reed:      { height: 'tall',   build: 'average', skin: 'medium', number: 19, features: [] },
  Walton:    { height: 'tall',   build: 'average', skin: 'light',  number: 32, features: ['afro'] },
  Nash:      { height: 'medium', build: 'slim',    skin: 'light',  number: 13, features: [] },
  Parker:    { height: 'medium', build: 'slim',    skin: 'medium', number:  9, features: [] },
  Ginóbili:  { height: 'medium', build: 'average', skin: 'medium', number: 20, features: [] },
  Allen:     { height: 'medium', build: 'average', skin: 'dark',   number: 20, features: ['tattoo'] },
  Pierce:    { height: 'medium', build: 'average', skin: 'dark',   number: 34, features: [] },
  Paul:      { height: 'short',  build: 'average', skin: 'medium', number:  3, features: [] },
  Harden:    { height: 'medium', build: 'average', skin: 'medium', number: 13, features: ['beard', 'tattoo'] },
  Westbrook: { height: 'medium', build: 'average', skin: 'medium', number:  0, features: ['headband', 'wristband'] },
  Leonard:   { height: 'tall',   build: 'stocky',  skin: 'medium', number:  2, features: [] },
  Giannis:   { height: 'tall',   build: 'slim',    skin: 'dark',   number: 34, features: [] },
  Jokić:     { height: 'tall',   build: 'stocky',  skin: 'light',  number: 15, features: [] },
  Davis:     { height: 'tall',   build: 'slim',    skin: 'dark',   number: 23, features: [] },
  Lillard:   { height: 'medium', build: 'average', skin: 'medium', number:  0, features: [] },
  McGrady:   { height: 'tall',   build: 'average', skin: 'dark',   number:  1, features: [] },
  Yao:       { height: 'tall',   build: 'stocky',  skin: 'medium', number: 11, features: [] },
  Kidd:      { height: 'medium', build: 'average', skin: 'dark',   number:  5, features: [] },
  Mutombo:   { height: 'tall',   build: 'slim',    skin: 'dark',   number: 55, features: [] },
  Miller:    { height: 'medium', build: 'slim',    skin: 'light',  number: 31, features: [] },
  Havlicek:  { height: 'medium', build: 'average', skin: 'light',  number: 17, features: [] },
  Erving:    { height: 'medium', build: 'average', skin: 'dark',   number:  6, features: ['afro'] },
  Irving:    { height: 'medium', build: 'slim',    skin: 'dark',   number: 11, features: [] },
  James:     { height: 'tall',   build: 'stocky',  skin: 'dark',   number: 23, features: ['tattoo', 'wristband'] },
  Bryant:    { height: 'medium', build: 'average', skin: 'medium', number: 24, features: ['tattoo'] },
  Johnson:   { height: 'tall',   build: 'average', skin: 'dark',   number: 32, features: [] },
  Anthony:   { height: 'medium', build: 'average', skin: 'dark',   number:  7, features: [] },
  Olajuwon:  { height: 'tall',   build: 'average', skin: 'dark',   number: 34, features: [] },
  Antetokounmpo: { height: 'tall', build: 'slim',  skin: 'dark',   number: 34, features: [] },
  // Aliases por sobrenome — silFor() usa lastName; estes nomes não batem com as chaves acima
  "Abdul-Jabbar": { height: 'tall', build: 'slim',    skin: 'dark', number: 33, features: [] },
  "Chamberlain":  { height: 'tall', build: 'stocky',  skin: 'dark', number: 13, features: [] },
  "O'Neal":       { height: 'tall', build: 'stocky',  skin: 'dark', number: 34, features: ['bald'] },
}

function deriveSilhouette(position: Position, era: Era): PlayerSilhouette {
  const isOld = era === '1960s' || era === '1970s' || era === '1980s'
  const tall  = position === 'C' || position === 'PF'
  const short = position === 'PG'
  return {
    height:   tall ? 'tall' : short ? 'short' : 'medium',
    build:    tall && isOld ? 'stocky' : 'average',
    skin:     'medium',
    features: [],
  }
}

function silFor(name: string, position: Position, era: Era): PlayerSilhouette {
  const lastName = name.trim().split(/\s+/).at(-1) ?? ''
  return SIL[lastName] ?? deriveSilhouette(position, era)
}

function p(id: string, name: string, position: Position, era: Era, r: R): Player {
  return {
    id,
    name,
    position,
    era,
    ratings: {
      speed: r[0],
      shooting: r[1],
      threePoint: r[2],
      defense: r[3],
      passing: r[4],
      rebounding: r[5],
      clutch: r[6],
    },
    silhouette: silFor(name, position, era),
  }
}

const _rawRosters: Record<string, Player[]> = {
  // ── Anos 60-70 ─────────────────────────────────────────────────────────────
  'celtics-1964': [
    p('celtics-1964-kcjones', 'K.C. Jones', 'PG', '1960s', [80, 62, 10, 90, 80, 50, 80]),
    p('celtics-1964-samjones', 'Sam Jones', 'SG', '1960s', [82, 86, 12, 72, 64, 55, 90]),
    p('celtics-1964-heinsohn', 'Tom Heinsohn', 'SF', '1960s', [74, 82, 15, 70, 60, 76, 80]),
    p('celtics-1964-sanders', 'Tom Sanders', 'PF', '1960s', [74, 66, 10, 86, 55, 76, 68]),
    p('celtics-1964-russell', 'Bill Russell', 'C', '1960s', [78, 58, 10, 97, 74, 95, 90]),
  ],
  'celtics-1969': [
    p('celtics-1969-siegfried', 'Larry Siegfried', 'PG', '1960s', [76, 80, 15, 72, 70, 48, 78]),
    p('celtics-1969-samjones', 'Sam Jones', 'SG', '1960s', [80, 86, 12, 70, 62, 54, 90]),
    p('celtics-1969-havlicek', 'John Havlicek', 'SF', '1960s', [88, 84, 15, 84, 78, 68, 90]),
    p('celtics-1969-howell', 'Bailey Howell', 'PF', '1960s', [74, 80, 10, 76, 56, 80, 74]),
    p('celtics-1969-russell', 'Bill Russell', 'C', '1960s', [76, 56, 10, 96, 74, 94, 90]),
  ],
  'sixers-1967': [
    p('sixers-1967-walijones', 'Wali Jones', 'PG', '1960s', [80, 78, 12, 70, 72, 46, 72]),
    p('sixers-1967-greer', 'Hal Greer', 'SG', '1960s', [82, 86, 14, 76, 74, 52, 86]),
    p('sixers-1967-walker', 'Chet Walker', 'SF', '1960s', [78, 82, 12, 72, 60, 68, 80]),
    p('sixers-1967-jackson', 'Luke Jackson', 'PF', '1960s', [72, 68, 10, 82, 58, 82, 68]),
    p('sixers-1967-wilt', 'Wilt Chamberlain', 'C', '1960s', [84, 80, 10, 90, 78, 97, 80]),
  ],
  'lakers-1972': [
    p('lakers-1972-west', 'Jerry West', 'PG', '1970s', [86, 90, 18, 86, 88, 56, 95]),
    p('lakers-1972-goodrich', 'Gail Goodrich', 'SG', '1970s', [84, 86, 15, 68, 72, 48, 82]),
    p('lakers-1972-mcmillian', 'Jim McMillian', 'SF', '1970s', [78, 80, 12, 72, 60, 66, 74]),
    p('lakers-1972-hairston', 'Happy Hairston', 'PF', '1970s', [74, 70, 10, 78, 54, 84, 70]),
    p('lakers-1972-wilt', 'Wilt Chamberlain', 'C', '1970s', [78, 72, 10, 94, 76, 96, 82]),
  ],
  'knicks-1970': [
    p('knicks-1970-frazier', 'Walt Frazier', 'PG', '1970s', [86, 84, 15, 90, 86, 58, 92]),
    p('knicks-1970-barnett', 'Dick Barnett', 'SG', '1970s', [80, 82, 12, 74, 66, 48, 80]),
    p('knicks-1970-bradley', 'Bill Bradley', 'SF', '1970s', [74, 80, 16, 74, 76, 56, 82]),
    p('knicks-1970-debusschere', 'Dave DeBusschere', 'PF', '1970s', [76, 76, 14, 88, 64, 82, 80]),
    p('knicks-1970-reed', 'Willis Reed', 'C', '1970s', [74, 82, 12, 86, 62, 86, 90]),
  ],
  'knicks-1973': [
    p('knicks-1973-frazier', 'Walt Frazier', 'PG', '1970s', [86, 84, 15, 90, 86, 58, 90]),
    p('knicks-1973-monroe', 'Earl Monroe', 'SG', '1970s', [84, 86, 14, 70, 72, 50, 86]),
    p('knicks-1973-bradley', 'Bill Bradley', 'SF', '1970s', [72, 80, 16, 74, 76, 54, 80]),
    p('knicks-1973-debusschere', 'Dave DeBusschere', 'PF', '1970s', [74, 76, 14, 88, 64, 82, 78]),
    p('knicks-1973-reed', 'Willis Reed', 'C', '1970s', [70, 80, 12, 84, 60, 82, 86]),
  ],
  'bucks-1971': [
    p('bucks-1971-oscar', 'Oscar Robertson', 'PG', '1970s', [82, 86, 15, 80, 92, 72, 90]),
    p('bucks-1971-mcglocklin', 'Jon McGlocklin', 'SG', '1970s', [76, 84, 16, 64, 66, 44, 76]),
    p('bucks-1971-dandridge', 'Bob Dandridge', 'SF', '1970s', [80, 82, 12, 80, 62, 70, 80]),
    p('bucks-1971-gregsmith', 'Greg Smith', 'PF', '1970s', [76, 64, 10, 78, 54, 76, 66]),
    p('bucks-1971-kareem', 'Kareem Abdul-Jabbar', 'C', '1970s', [78, 92, 15, 88, 76, 90, 92]),
  ],
  'blazers-1977': [
    p('blazers-1977-hollins', 'Lionel Hollins', 'PG', '1970s', [84, 78, 14, 82, 76, 48, 78]),
    p('blazers-1977-twardzik', 'Dave Twardzik', 'SG', '1970s', [78, 78, 12, 70, 70, 44, 74]),
    p('blazers-1977-gross', 'Bob Gross', 'SF', '1970s', [78, 74, 12, 78, 68, 62, 72]),
    p('blazers-1977-lucas', 'Maurice Lucas', 'PF', '1970s', [76, 80, 14, 84, 62, 84, 82]),
    p('blazers-1977-walton', 'Bill Walton', 'C', '1970s', [76, 80, 12, 90, 86, 90, 86]),
  ],

  // ── Anos 80 ────────────────────────────────────────────────────────────────
  'lakers-1985': [
    p('lakers-1985-magic', 'Magic Johnson', 'PG', '1980s', [82, 80, 62, 78, 95, 82, 90]),
    p('lakers-1985-scott', 'Byron Scott', 'SG', '1980s', [84, 84, 78, 72, 62, 48, 80]),
    p('lakers-1985-worthy', 'James Worthy', 'SF', '1980s', [86, 84, 55, 74, 72, 66, 86]),
    p('lakers-1985-rambis', 'Kurt Rambis', 'PF', '1980s', [68, 58, 10, 80, 50, 80, 66]),
    p('lakers-1985-kareem', 'Kareem Abdul-Jabbar', 'C', '1980s', [66, 90, 20, 84, 72, 82, 88]),
  ],
  'lakers-1987': [
    p('lakers-1987-magic', 'Magic Johnson', 'PG', '1980s', [82, 82, 64, 78, 96, 80, 92]),
    p('lakers-1987-scott', 'Byron Scott', 'SG', '1980s', [84, 86, 80, 72, 62, 48, 80]),
    p('lakers-1987-worthy', 'James Worthy', 'SF', '1980s', [86, 86, 55, 74, 72, 66, 88]),
    p('lakers-1987-acgreen', 'A.C. Green', 'PF', '1980s', [74, 68, 20, 80, 52, 82, 68]),
    p('lakers-1987-kareem', 'Kareem Abdul-Jabbar', 'C', '1980s', [62, 88, 18, 82, 70, 80, 86]),
  ],
  'lakers-1988': [
    p('lakers-1988-magic', 'Magic Johnson', 'PG', '1980s', [80, 82, 66, 78, 95, 80, 92]),
    p('lakers-1988-scott', 'Byron Scott', 'SG', '1980s', [84, 88, 80, 72, 62, 48, 82]),
    p('lakers-1988-worthy', 'James Worthy', 'SF', '1980s', [86, 86, 55, 74, 72, 66, 90]),
    p('lakers-1988-acgreen', 'A.C. Green', 'PF', '1980s', [74, 70, 22, 80, 52, 82, 68]),
    p('lakers-1988-kareem', 'Kareem Abdul-Jabbar', 'C', '1980s', [60, 86, 18, 80, 68, 78, 84]),
  ],
  'celtics-1984': [
    p('celtics-1984-dj', 'Dennis Johnson', 'PG', '1980s', [80, 78, 40, 88, 78, 52, 86]),
    p('celtics-1984-ainge', 'Danny Ainge', 'SG', '1980s', [80, 82, 80, 72, 68, 46, 78]),
    p('celtics-1984-bird', 'Larry Bird', 'SF', '1980s', [68, 92, 86, 78, 90, 82, 95]),
    p('celtics-1984-mchale', 'Kevin McHale', 'PF', '1980s', [64, 88, 30, 86, 62, 82, 84]),
    p('celtics-1984-parish', 'Robert Parish', 'C', '1980s', [68, 82, 15, 80, 58, 84, 78]),
  ],
  'celtics-1986': [
    p('celtics-1986-dj', 'Dennis Johnson', 'PG', '1980s', [80, 78, 42, 88, 78, 52, 86]),
    p('celtics-1986-ainge', 'Danny Ainge', 'SG', '1980s', [80, 84, 82, 72, 68, 46, 80]),
    p('celtics-1986-bird', 'Larry Bird', 'SF', '1980s', [68, 92, 88, 78, 90, 82, 95]),
    p('celtics-1986-mchale', 'Kevin McHale', 'PF', '1980s', [64, 90, 32, 88, 62, 84, 86]),
    p('celtics-1986-parish', 'Robert Parish', 'C', '1980s', [68, 82, 15, 82, 58, 84, 80]),
  ],
  'celtics-1987': [
    p('celtics-1987-dj', 'Dennis Johnson', 'PG', '1980s', [78, 78, 42, 86, 78, 50, 86]),
    p('celtics-1987-ainge', 'Danny Ainge', 'SG', '1980s', [80, 84, 82, 72, 68, 46, 80]),
    p('celtics-1987-bird', 'Larry Bird', 'SF', '1980s', [66, 92, 88, 78, 90, 82, 95]),
    p('celtics-1987-mchale', 'Kevin McHale', 'PF', '1980s', [64, 90, 32, 88, 62, 84, 86]),
    p('celtics-1987-parish', 'Robert Parish', 'C', '1980s', [66, 82, 15, 80, 56, 82, 78]),
  ],
  'sixers-1983': [
    p('sixers-1983-cheeks', 'Maurice Cheeks', 'PG', '1980s', [84, 76, 20, 88, 84, 50, 82]),
    p('sixers-1983-toney', 'Andrew Toney', 'SG', '1980s', [82, 86, 40, 72, 72, 46, 86]),
    p('sixers-1983-erving', 'Julius Erving', 'SF', '1980s', [88, 84, 30, 80, 76, 72, 88]),
    p('sixers-1983-bobbyjones', 'Bobby Jones', 'PF', '1980s', [80, 74, 20, 88, 64, 72, 78]),
    p('sixers-1983-moses', 'Moses Malone', 'C', '1980s', [70, 84, 12, 82, 52, 94, 84]),
  ],
  'pistons-1989': [
    p('pistons-1989-isiah', 'Isiah Thomas', 'PG', '1980s', [88, 82, 30, 76, 88, 50, 90]),
    p('pistons-1989-dumars', 'Joe Dumars', 'SG', '1980s', [78, 82, 40, 86, 72, 46, 86]),
    p('pistons-1989-aguirre', 'Mark Aguirre', 'SF', '1980s', [76, 84, 40, 66, 68, 64, 80]),
    p('pistons-1989-mahorn', 'Rick Mahorn', 'PF', '1980s', [64, 68, 10, 86, 52, 80, 72]),
    p('pistons-1989-laimbeer', 'Bill Laimbeer', 'C', '1980s', [58, 80, 60, 82, 58, 86, 82]),
  ],
  'pistons-1990': [
    p('pistons-1990-isiah', 'Isiah Thomas', 'PG', '1990s', [88, 82, 32, 76, 88, 50, 90]),
    p('pistons-1990-dumars', 'Joe Dumars', 'SG', '1990s', [78, 82, 42, 86, 72, 46, 86]),
    p('pistons-1990-aguirre', 'Mark Aguirre', 'SF', '1990s', [74, 82, 40, 66, 66, 62, 78]),
    p('pistons-1990-rodman', 'Dennis Rodman', 'PF', '1990s', [80, 50, 20, 92, 56, 92, 68]),
    p('pistons-1990-laimbeer', 'Bill Laimbeer', 'C', '1990s', [56, 80, 62, 80, 58, 84, 80]),
  ],

  // ── Anos 90 ────────────────────────────────────────────────────────────────
  'bulls-1992': [
    p('bulls-1992-paxson', 'John Paxson', 'PG', '1990s', [74, 80, 80, 68, 72, 40, 80]),
    p('bulls-1992-jordan', 'Michael Jordan', 'SG', '1990s', [92, 93, 78, 92, 80, 72, 96]),
    p('bulls-1992-pippen', 'Scottie Pippen', 'SF', '1990s', [86, 80, 68, 92, 84, 74, 84]),
    p('bulls-1992-grant', 'Horace Grant', 'PF', '1990s', [78, 72, 15, 84, 62, 82, 74]),
    p('bulls-1992-cartwright', 'Bill Cartwright', 'C', '1990s', [58, 74, 10, 76, 52, 72, 68]),
  ],
  'bulls-1996': [
    p('bulls-1996-harper', 'Ron Harper', 'PG', '1990s', [78, 74, 55, 84, 72, 54, 76]),
    p('bulls-1996-jordan', 'Michael Jordan', 'SG', '1990s', [90, 93, 80, 92, 82, 72, 97]),
    p('bulls-1996-pippen', 'Scottie Pippen', 'SF', '1990s', [84, 80, 72, 92, 84, 74, 84]),
    p('bulls-1996-rodman', 'Dennis Rodman', 'PF', '1990s', [78, 48, 25, 93, 56, 95, 66]),
    p('bulls-1996-longley', 'Luc Longley', 'C', '1990s', [52, 72, 10, 74, 56, 72, 64]),
  ],
  'bulls-1998': [
    p('bulls-1998-harper', 'Ron Harper', 'PG', '1990s', [74, 72, 52, 82, 70, 54, 74]),
    p('bulls-1998-jordan', 'Michael Jordan', 'SG', '1990s', [86, 92, 78, 90, 82, 70, 97]),
    p('bulls-1998-pippen', 'Scottie Pippen', 'SF', '1990s', [82, 80, 70, 90, 84, 72, 84]),
    p('bulls-1998-rodman', 'Dennis Rodman', 'PF', '1990s', [76, 46, 22, 92, 54, 94, 64]),
    p('bulls-1998-longley', 'Luc Longley', 'C', '1990s', [50, 72, 10, 74, 56, 72, 64]),
  ],
  'rockets-1994': [
    p('rockets-1994-kennysmith', 'Kenny Smith', 'PG', '1990s', [82, 80, 82, 66, 74, 42, 78]),
    p('rockets-1994-maxwell', 'Vernon Maxwell', 'SG', '1990s', [80, 78, 75, 70, 66, 46, 76]),
    p('rockets-1994-horry', 'Robert Horry', 'SF', '1990s', [78, 74, 76, 82, 66, 68, 86]),
    p('rockets-1994-thorpe', 'Otis Thorpe', 'PF', '1990s', [74, 76, 10, 80, 58, 84, 72]),
    p('rockets-1994-hakeem', 'Hakeem Olajuwon', 'C', '1990s', [80, 86, 15, 94, 72, 88, 92]),
  ],
  'rockets-1995': [
    p('rockets-1995-kennysmith', 'Kenny Smith', 'PG', '1990s', [80, 80, 82, 66, 74, 42, 78]),
    p('rockets-1995-drexler', 'Clyde Drexler', 'SG', '1990s', [86, 84, 72, 80, 78, 72, 84]),
    p('rockets-1995-horry', 'Robert Horry', 'SF', '1990s', [78, 74, 78, 82, 66, 68, 88]),
    p('rockets-1995-elie', 'Mario Elie', 'PF', '1990s', [76, 76, 76, 78, 64, 58, 82]),
    p('rockets-1995-hakeem', 'Hakeem Olajuwon', 'C', '1990s', [80, 88, 18, 94, 74, 88, 94]),
  ],
  'spurs-1999': [
    p('spurs-1999-avery', 'Avery Johnson', 'PG', '1990s', [80, 74, 30, 76, 82, 40, 80]),
    p('spurs-1999-elie', 'Mario Elie', 'SG', '1990s', [74, 76, 76, 78, 64, 54, 82]),
    p('spurs-1999-elliott', 'Sean Elliott', 'SF', '1990s', [74, 80, 78, 72, 64, 62, 80]),
    p('spurs-1999-duncan', 'Tim Duncan', 'PF', '1990s', [70, 84, 15, 90, 76, 90, 88]),
    p('spurs-1999-robinson', 'David Robinson', 'C', '1990s', [80, 82, 15, 92, 68, 88, 82]),
  ],
  'jazz-1997': [
    p('jazz-1997-stockton', 'John Stockton', 'PG', '1990s', [76, 80, 80, 82, 95, 52, 86]),
    p('jazz-1997-hornacek', 'Jeff Hornacek', 'SG', '1990s', [76, 84, 84, 70, 74, 44, 82]),
    p('jazz-1997-russell', 'Bryon Russell', 'SF', '1990s', [80, 72, 74, 80, 58, 60, 72]),
    p('jazz-1997-malone', 'Karl Malone', 'PF', '1990s', [80, 86, 52, 82, 72, 86, 82]),
    p('jazz-1997-ostertag', 'Greg Ostertag', 'C', '1990s', [48, 58, 10, 78, 42, 76, 58]),
  ],
  'suns-1993': [
    p('suns-1993-kj', 'Kevin Johnson', 'PG', '1990s', [90, 80, 50, 72, 86, 46, 84]),
    p('suns-1993-majerle', 'Dan Majerle', 'SG', '1990s', [80, 78, 80, 80, 66, 58, 78]),
    p('suns-1993-dumas', 'Richard Dumas', 'SF', '1990s', [84, 76, 40, 66, 56, 58, 68]),
    p('suns-1993-barkley', 'Charles Barkley', 'PF', '1990s', [80, 86, 62, 76, 76, 90, 86]),
    p('suns-1993-west', 'Mark West', 'C', '1990s', [56, 60, 5, 80, 40, 76, 58]),
  ],
  'sonics-1996': [
    p('sonics-1996-payton', 'Gary Payton', 'PG', '1990s', [84, 80, 72, 93, 84, 58, 84]),
    p('sonics-1996-hawkins', 'Hersey Hawkins', 'SG', '1990s', [76, 80, 82, 76, 66, 48, 76]),
    p('sonics-1996-schrempf', 'Detlef Schrempf', 'SF', '1990s', [72, 82, 78, 74, 76, 68, 80]),
    p('sonics-1996-kemp', 'Shawn Kemp', 'PF', '1990s', [86, 78, 30, 82, 58, 86, 82]),
    p('sonics-1996-ervinjohnson', 'Ervin Johnson', 'C', '1990s', [58, 56, 5, 80, 44, 78, 60]),
  ],
  'magic-1995': [
    p('magic-1995-penny', 'Penny Hardaway', 'PG', '1990s', [86, 82, 72, 80, 86, 60, 82]),
    p('magic-1995-anderson', 'Nick Anderson', 'SG', '1990s', [80, 78, 76, 76, 64, 56, 72]),
    p('magic-1995-scott', 'Dennis Scott', 'SF', '1990s', [68, 78, 86, 62, 58, 50, 74]),
    p('magic-1995-grant', 'Horace Grant', 'PF', '1990s', [76, 74, 20, 84, 62, 82, 74]),
    p('magic-1995-shaq', "Shaquille O'Neal", 'C', '1990s', [72, 86, 5, 86, 58, 90, 78]),
  ],
  'knicks-1994': [
    p('knicks-1994-harper', 'Derek Harper', 'PG', '1990s', [80, 78, 72, 80, 80, 46, 80]),
    p('knicks-1994-starks', 'John Starks', 'SG', '1990s', [80, 78, 78, 78, 66, 46, 80]),
    p('knicks-1994-charlessmith', 'Charles Smith', 'SF', '1990s', [72, 74, 20, 72, 56, 68, 68]),
    p('knicks-1994-oakley', 'Charles Oakley', 'PF', '1990s', [70, 72, 15, 86, 62, 88, 76]),
    p('knicks-1994-ewing', 'Patrick Ewing', 'C', '1990s', [70, 84, 18, 88, 60, 86, 84]),
  ],

  // ── Anos 2000 ──────────────────────────────────────────────────────────────
  'lakers-2000': [
    p('lakers-2000-harper', 'Ron Harper', 'PG', '2000s', [70, 72, 52, 78, 68, 50, 72]),
    p('lakers-2000-kobe', 'Kobe Bryant', 'SG', '2000s', [88, 90, 76, 86, 76, 62, 90]),
    p('lakers-2000-rice', 'Glen Rice', 'SF', '2000s', [72, 84, 86, 62, 58, 54, 80]),
    p('lakers-2000-acgreen', 'A.C. Green', 'PF', '2000s', [66, 64, 30, 76, 48, 76, 64]),
    p('lakers-2000-shaq', "Shaquille O'Neal", 'C', '2000s', [72, 92, 5, 88, 62, 92, 84]),
  ],
  'lakers-2001': [
    p('lakers-2001-fisher', 'Derek Fisher', 'PG', '2000s', [78, 78, 78, 76, 72, 42, 82]),
    p('lakers-2001-kobe', 'Kobe Bryant', 'SG', '2000s', [88, 92, 78, 88, 78, 64, 92]),
    p('lakers-2001-fox', 'Rick Fox', 'SF', '2000s', [74, 74, 72, 76, 68, 58, 74]),
    p('lakers-2001-grant', 'Horace Grant', 'PF', '2000s', [66, 70, 20, 78, 58, 76, 70]),
    p('lakers-2001-shaq', "Shaquille O'Neal", 'C', '2000s', [72, 92, 5, 88, 64, 92, 86]),
  ],
  'lakers-2002': [
    p('lakers-2002-fisher', 'Derek Fisher', 'PG', '2000s', [78, 78, 78, 76, 72, 42, 82]),
    p('lakers-2002-kobe', 'Kobe Bryant', 'SG', '2000s', [88, 92, 80, 88, 80, 64, 93]),
    p('lakers-2002-fox', 'Rick Fox', 'SF', '2000s', [72, 74, 72, 76, 68, 58, 74]),
    p('lakers-2002-horry', 'Robert Horry', 'PF', '2000s', [72, 72, 78, 80, 62, 68, 90]),
    p('lakers-2002-shaq', "Shaquille O'Neal", 'C', '2000s', [70, 92, 5, 88, 64, 90, 86]),
  ],
  'spurs-2003': [
    p('spurs-2003-parker', 'Tony Parker', 'PG', '2000s', [88, 80, 55, 68, 80, 46, 80]),
    p('spurs-2003-jackson', 'Stephen Jackson', 'SG', '2000s', [80, 76, 74, 74, 64, 54, 76]),
    p('spurs-2003-bowen', 'Bruce Bowen', 'SF', '2000s', [74, 66, 76, 90, 52, 52, 70]),
    p('spurs-2003-duncan', 'Tim Duncan', 'PF', '2000s', [68, 86, 18, 92, 78, 90, 90]),
    p('spurs-2003-robinson', 'David Robinson', 'C', '2000s', [68, 76, 10, 86, 60, 82, 78]),
  ],
  'spurs-2005': [
    p('spurs-2005-parker', 'Tony Parker', 'PG', '2000s', [90, 82, 58, 70, 82, 46, 82]),
    p('spurs-2005-manu', 'Manu Ginóbili', 'SG', '2000s', [82, 84, 78, 80, 80, 56, 90]),
    p('spurs-2005-bowen', 'Bruce Bowen', 'SF', '2000s', [74, 66, 78, 90, 52, 52, 72]),
    p('spurs-2005-duncan', 'Tim Duncan', 'PF', '2000s', [68, 86, 18, 92, 78, 90, 90]),
    p('spurs-2005-nazr', 'Nazr Mohammed', 'C', '2000s', [58, 68, 5, 74, 44, 78, 62]),
  ],
  'spurs-2007': [
    p('spurs-2007-parker', 'Tony Parker', 'PG', '2000s', [90, 84, 60, 70, 82, 48, 86]),
    p('spurs-2007-manu', 'Manu Ginóbili', 'SG', '2000s', [82, 84, 80, 80, 80, 56, 90]),
    p('spurs-2007-bowen', 'Bruce Bowen', 'SF', '2000s', [72, 66, 78, 90, 52, 50, 72]),
    p('spurs-2007-duncan', 'Tim Duncan', 'PF', '2000s', [66, 86, 18, 92, 76, 88, 90]),
    p('spurs-2007-oberto', 'Fabricio Oberto', 'C', '2000s', [58, 66, 5, 74, 52, 76, 60]),
  ],
  'pistons-2004': [
    p('pistons-2004-billups', 'Chauncey Billups', 'PG', '2000s', [78, 82, 80, 78, 80, 48, 90]),
    p('pistons-2004-hamilton', 'Richard Hamilton', 'SG', '2000s', [84, 84, 60, 76, 66, 46, 82]),
    p('pistons-2004-prince', 'Tayshaun Prince', 'SF', '2000s', [78, 74, 68, 86, 64, 64, 76]),
    p('pistons-2004-rasheed', 'Rasheed Wallace', 'PF', '2000s', [74, 82, 74, 86, 66, 78, 76]),
    p('pistons-2004-benwallace', 'Ben Wallace', 'C', '2000s', [74, 48, 5, 94, 50, 92, 68]),
  ],
  'heat-2006': [
    p('heat-2006-jwill', 'Jason Williams', 'PG', '2000s', [82, 76, 72, 64, 84, 44, 74]),
    p('heat-2006-wade', 'Dwyane Wade', 'SG', '2000s', [90, 86, 60, 84, 80, 60, 92]),
    p('heat-2006-walker', 'Antoine Walker', 'SF', '2000s', [72, 76, 68, 66, 66, 72, 72]),
    p('heat-2006-haslem', 'Udonis Haslem', 'PF', '2000s', [68, 74, 20, 80, 52, 82, 72]),
    p('heat-2006-shaq', "Shaquille O'Neal", 'C', '2000s', [66, 88, 5, 84, 62, 86, 80]),
  ],
  'celtics-2008': [
    p('celtics-2008-rondo', 'Rajon Rondo', 'PG', '2000s', [90, 68, 25, 84, 88, 60, 78]),
    p('celtics-2008-rayallen', 'Ray Allen', 'SG', '2000s', [80, 88, 93, 70, 68, 52, 90]),
    p('celtics-2008-pierce', 'Paul Pierce', 'SF', '2000s', [76, 88, 80, 78, 76, 62, 90]),
    p('celtics-2008-garnett', 'Kevin Garnett', 'PF', '2000s', [78, 84, 55, 94, 78, 88, 82]),
    p('celtics-2008-perkins', 'Kendrick Perkins', 'C', '2000s', [54, 62, 5, 84, 46, 80, 62]),
  ],
  'suns-2005': [
    p('suns-2005-nash', 'Steve Nash', 'PG', '2000s', [82, 90, 88, 55, 95, 48, 90]),
    p('suns-2005-joejohnson', 'Joe Johnson', 'SG', '2000s', [80, 84, 80, 72, 72, 54, 80]),
    p('suns-2005-qrich', 'Quentin Richardson', 'SF', '2000s', [74, 74, 80, 68, 56, 66, 70]),
    p('suns-2005-marion', 'Shawn Marion', 'PF', '2000s', [88, 76, 72, 84, 64, 84, 76]),
    p('suns-2005-amare', "Amar'e Stoudemire", 'C', '2000s', [82, 84, 30, 62, 52, 80, 80]),
  ],
  'kings-2002': [
    p('kings-2002-bibby', 'Mike Bibby', 'PG', '2000s', [80, 82, 80, 68, 78, 44, 88]),
    p('kings-2002-christie', 'Doug Christie', 'SG', '2000s', [78, 72, 72, 86, 68, 52, 74]),
    p('kings-2002-peja', 'Peja Stojaković', 'SF', '2000s', [68, 86, 90, 62, 60, 60, 82]),
    p('kings-2002-webber', 'Chris Webber', 'PF', '2000s', [80, 84, 55, 78, 84, 86, 78]),
    p('kings-2002-divac', 'Vlade Divac', 'C', '2000s', [58, 76, 40, 76, 84, 80, 76]),
  ],
  'nets-2003': [
    p('nets-2003-kidd', 'Jason Kidd', 'PG', '2000s', [84, 70, 72, 86, 94, 72, 82]),
    p('nets-2003-kittles', 'Kerry Kittles', 'SG', '2000s', [80, 76, 76, 76, 60, 50, 72]),
    p('nets-2003-jefferson', 'Richard Jefferson', 'SF', '2000s', [84, 76, 68, 74, 62, 62, 74]),
    p('nets-2003-kmart', 'Kenyon Martin', 'PF', '2000s', [80, 72, 20, 84, 56, 80, 76]),
    p('nets-2003-collins', 'Jason Collins', 'C', '2000s', [50, 58, 5, 78, 48, 74, 58]),
  ],
  'sixers-2001': [
    p('sixers-2001-snow', 'Eric Snow', 'PG', '2000s', [78, 64, 30, 82, 78, 44, 72]),
    p('sixers-2001-iverson', 'Allen Iverson', 'SG', '2000s', [95, 86, 70, 72, 74, 40, 92]),
    p('sixers-2001-lynch', 'George Lynch', 'SF', '2000s', [74, 64, 40, 78, 52, 66, 66]),
    p('sixers-2001-hill', 'Tyrone Hill', 'PF', '2000s', [66, 60, 5, 78, 48, 82, 66]),
    p('sixers-2001-mutombo', 'Dikembe Mutombo', 'C', '2000s', [56, 60, 5, 92, 44, 88, 70]),
  ],
  'pacers-2000': [
    p('pacers-2000-mjackson', 'Mark Jackson', 'PG', '2000s', [70, 70, 68, 74, 88, 56, 78]),
    p('pacers-2000-miller', 'Reggie Miller', 'SG', '2000s', [74, 84, 90, 74, 62, 48, 92]),
    p('pacers-2000-rose', 'Jalen Rose', 'SF', '2000s', [78, 80, 72, 70, 70, 56, 76]),
    p('pacers-2000-daledavis', 'Dale Davis', 'PF', '2000s', [68, 60, 5, 82, 48, 84, 70]),
    p('pacers-2000-smits', 'Rik Smits', 'C', '2000s', [54, 80, 30, 78, 54, 76, 76]),
  ],
  'nuggets-2009': [
    p('nuggets-2009-billups', 'Chauncey Billups', 'PG', '2000s', [74, 82, 82, 80, 80, 48, 90]),
    p('nuggets-2009-djones', 'Dahntay Jones', 'SG', '2000s', [78, 62, 50, 80, 46, 50, 64]),
    p('nuggets-2009-melo', 'Carmelo Anthony', 'SF', '2000s', [80, 88, 74, 70, 70, 64, 84]),
    p('nuggets-2009-kmart', 'Kenyon Martin', 'PF', '2000s', [80, 70, 20, 84, 54, 80, 74]),
    p('nuggets-2009-nene', 'Nenê', 'C', '2000s', [72, 78, 20, 80, 60, 80, 72]),
  ],
  'rockets-2008': [
    p('rockets-2008-alston', 'Rafer Alston', 'PG', '2000s', [80, 70, 72, 72, 74, 42, 70]),
    p('rockets-2008-mcgrady', 'Tracy McGrady', 'SG', '2000s', [86, 86, 78, 76, 80, 64, 86]),
    p('rockets-2008-battier', 'Shane Battier', 'SF', '2000s', [70, 70, 78, 86, 56, 58, 76]),
    p('rockets-2008-scola', 'Luis Scola', 'PF', '2000s', [66, 78, 40, 74, 58, 80, 74]),
    p('rockets-2008-yao', 'Yao Ming', 'C', '2000s', [50, 86, 50, 84, 56, 88, 80]),
  ],

  // ── Anos 2010 ──────────────────────────────────────────────────────────────
  'heat-2012': [
    p('heat-2012-chalmers', 'Mario Chalmers', 'PG', '2010s', [78, 76, 76, 72, 68, 44, 76]),
    p('heat-2012-wade', 'Dwyane Wade', 'SG', '2010s', [88, 86, 58, 82, 78, 58, 90]),
    p('heat-2012-lebron', 'LeBron James', 'SF', '2010s', [88, 86, 70, 86, 90, 80, 88]),
    p('heat-2012-bosh', 'Chris Bosh', 'PF', '2010s', [72, 84, 68, 78, 64, 80, 80]),
    p('heat-2012-anthony', 'Joel Anthony', 'C', '2010s', [58, 46, 5, 82, 40, 72, 56]),
  ],
  'heat-2013': [
    p('heat-2013-chalmers', 'Mario Chalmers', 'PG', '2010s', [78, 76, 78, 72, 68, 44, 78]),
    p('heat-2013-wade', 'Dwyane Wade', 'SG', '2010s', [86, 86, 58, 80, 78, 56, 90]),
    p('heat-2013-lebron', 'LeBron James', 'SF', '2010s', [88, 88, 76, 88, 90, 80, 92]),
    p('heat-2013-bosh', 'Chris Bosh', 'PF', '2010s', [72, 84, 74, 78, 62, 78, 80]),
    p('heat-2013-haslem', 'Udonis Haslem', 'C', '2010s', [60, 72, 30, 78, 48, 76, 68]),
  ],
  'warriors-2015': [
    p('warriors-2015-curry', 'Stephen Curry', 'PG', '2010s', [84, 92, 94, 68, 86, 52, 92]),
    p('warriors-2015-klay', 'Klay Thompson', 'SG', '2010s', [78, 88, 92, 82, 58, 52, 86]),
    p('warriors-2015-barnes', 'Harrison Barnes', 'SF', '2010s', [78, 76, 74, 76, 52, 60, 72]),
    p('warriors-2015-draymond', 'Draymond Green', 'PF', '2010s', [80, 66, 62, 92, 86, 82, 80]),
    p('warriors-2015-bogut', 'Andrew Bogut', 'C', '2010s', [56, 62, 5, 86, 72, 82, 64]),
  ],
  'warriors-2016': [
    p('warriors-2016-curry', 'Stephen Curry', 'PG', '2010s', [84, 94, 96, 68, 88, 52, 92]),
    p('warriors-2016-klay', 'Klay Thompson', 'SG', '2010s', [78, 88, 93, 82, 58, 52, 86]),
    p('warriors-2016-barnes', 'Harrison Barnes', 'SF', '2010s', [78, 76, 74, 76, 52, 60, 70]),
    p('warriors-2016-draymond', 'Draymond Green', 'PF', '2010s', [80, 68, 64, 93, 88, 82, 80]),
    p('warriors-2016-bogut', 'Andrew Bogut', 'C', '2010s', [54, 62, 5, 86, 72, 82, 62]),
  ],
  'warriors-2017': [
    p('warriors-2017-curry', 'Stephen Curry', 'PG', '2010s', [84, 92, 95, 68, 88, 52, 92]),
    p('warriors-2017-klay', 'Klay Thompson', 'SG', '2010s', [78, 88, 92, 82, 58, 52, 86]),
    p('warriors-2017-durant', 'Kevin Durant', 'SF', '2010s', [80, 94, 90, 82, 78, 74, 92]),
    p('warriors-2017-draymond', 'Draymond Green', 'PF', '2010s', [80, 66, 62, 94, 88, 82, 80]),
    p('warriors-2017-zaza', 'Zaza Pachulia', 'C', '2010s', [50, 64, 5, 74, 56, 76, 58]),
  ],
  'cavaliers-2016': [
    p('cavaliers-2016-kyrie', 'Kyrie Irving', 'PG', '2010s', [86, 90, 88, 66, 82, 46, 90]),
    p('cavaliers-2016-jrsmith', 'J.R. Smith', 'SG', '2010s', [78, 78, 82, 72, 56, 50, 74]),
    p('cavaliers-2016-lebron', 'LeBron James', 'SF', '2010s', [86, 88, 74, 84, 90, 80, 92]),
    p('cavaliers-2016-love', 'Kevin Love', 'PF', '2010s', [64, 84, 80, 68, 72, 88, 78]),
    p('cavaliers-2016-tristan', 'Tristan Thompson', 'C', '2010s', [68, 58, 5, 80, 44, 88, 66]),
  ],
  'spurs-2014': [
    p('spurs-2014-parker', 'Tony Parker', 'PG', '2010s', [86, 84, 72, 68, 84, 46, 84]),
    p('spurs-2014-dgreen', 'Danny Green', 'SG', '2010s', [78, 76, 84, 84, 56, 54, 76]),
    p('spurs-2014-kawhi', 'Kawhi Leonard', 'SF', '2010s', [80, 82, 78, 90, 62, 68, 82]),
    p('spurs-2014-duncan', 'Tim Duncan', 'PF', '2010s', [62, 82, 18, 88, 74, 84, 86]),
    p('spurs-2014-splitter', 'Tiago Splitter', 'C', '2010s', [60, 68, 5, 78, 54, 78, 62]),
  ],
  'mavericks-2011': [
    p('mavericks-2011-kidd', 'Jason Kidd', 'PG', '2010s', [72, 72, 80, 80, 90, 58, 82]),
    p('mavericks-2011-terry', 'Jason Terry', 'SG', '2010s', [80, 82, 82, 66, 68, 40, 86]),
    p('mavericks-2011-marion', 'Shawn Marion', 'SF', '2010s', [78, 72, 58, 84, 58, 76, 74]),
    p('mavericks-2011-dirk', 'Dirk Nowitzki', 'PF', '2010s', [64, 92, 86, 62, 68, 76, 94]),
    p('mavericks-2011-chandler', 'Tyson Chandler', 'C', '2010s', [68, 62, 5, 86, 46, 88, 76]),
  ],
  'thunder-2012': [
    p('thunder-2012-westbrook', 'Russell Westbrook', 'PG', '2010s', [94, 78, 60, 78, 84, 72, 80]),
    p('thunder-2012-thabo', 'Thabo Sefolosha', 'SG', '2010s', [78, 66, 68, 86, 52, 54, 66]),
    p('thunder-2012-durant', 'Kevin Durant', 'SF', '2010s', [80, 92, 88, 76, 76, 72, 90]),
    p('thunder-2012-ibaka', 'Serge Ibaka', 'PF', '2010s', [72, 74, 60, 88, 46, 80, 72]),
    p('thunder-2012-perkins', 'Kendrick Perkins', 'C', '2010s', [50, 58, 5, 80, 44, 76, 58]),
  ],
  'raptors-2019': [
    p('raptors-2019-lowry', 'Kyle Lowry', 'PG', '2010s', [78, 80, 80, 82, 84, 54, 84]),
    p('raptors-2019-dgreen', 'Danny Green', 'SG', '2010s', [76, 74, 84, 84, 54, 52, 76]),
    p('raptors-2019-kawhi', 'Kawhi Leonard', 'SF', '2010s', [80, 88, 82, 92, 70, 70, 92]),
    p('raptors-2019-siakam', 'Pascal Siakam', 'PF', '2010s', [82, 80, 68, 82, 66, 74, 76]),
    p('raptors-2019-gasol', 'Marc Gasol', 'C', '2010s', [56, 80, 68, 86, 82, 78, 78]),
  ],
  'blazers-2019': [
    p('blazers-2019-lillard', 'Damian Lillard', 'PG', '2010s', [82, 86, 86, 70, 78, 48, 92]),
    p('blazers-2019-mccollum', 'CJ McCollum', 'SG', '2010s', [80, 84, 80, 72, 64, 50, 80]),
    p('blazers-2019-harkless', 'Maurice Harkless', 'SF', '2010s', [78, 66, 64, 78, 50, 60, 68]),
    p('blazers-2019-aminu', 'Al-Farouq Aminu', 'PF', '2010s', [72, 64, 70, 82, 52, 78, 68]),
    p('blazers-2019-kanter', 'Enes Kanter', 'C', '2010s', [54, 80, 30, 60, 50, 86, 70]),
  ],

  // ── Anos 2020 ──────────────────────────────────────────────────────────────
  'lakers-2020': [
    p('lakers-2020-lebron', 'LeBron James', 'PG', '2020s', [82, 86, 74, 82, 92, 76, 90]),
    p('lakers-2020-kcp', 'Kentavious Caldwell-Pope', 'SG', '2020s', [80, 76, 82, 78, 54, 46, 76]),
    p('lakers-2020-dgreen', 'Danny Green', 'SF', '2020s', [72, 72, 80, 82, 52, 50, 74]),
    p('lakers-2020-davis', 'Anthony Davis', 'PF', '2020s', [80, 86, 68, 92, 62, 86, 84]),
    p('lakers-2020-mcgee', 'JaVale McGee', 'C', '2020s', [62, 64, 5, 80, 40, 80, 58]),
  ],
  'bucks-2021': [
    p('bucks-2021-jrue', 'Jrue Holiday', 'PG', '2020s', [82, 78, 74, 90, 80, 52, 82]),
    p('bucks-2021-donte', 'Donte DiVincenzo', 'SG', '2020s', [78, 74, 78, 78, 58, 60, 72]),
    p('bucks-2021-middleton', 'Khris Middleton', 'SF', '2020s', [72, 88, 84, 76, 76, 62, 88]),
    p('bucks-2021-giannis', 'Giannis Antetokounmpo', 'PF', '2020s', [90, 82, 50, 90, 80, 90, 84]),
    p('bucks-2021-brook', 'Brook Lopez', 'C', '2020s', [52, 78, 74, 86, 48, 72, 70]),
  ],
  'warriors-2022': [
    p('warriors-2022-curry', 'Stephen Curry', 'PG', '2020s', [82, 92, 95, 70, 88, 52, 94]),
    p('warriors-2022-klay', 'Klay Thompson', 'SG', '2020s', [74, 86, 90, 78, 56, 50, 84]),
    p('warriors-2022-wiggins', 'Andrew Wiggins', 'SF', '2020s', [84, 80, 76, 82, 56, 66, 76]),
    p('warriors-2022-draymond', 'Draymond Green', 'PF', '2020s', [78, 62, 58, 93, 86, 80, 80]),
    p('warriors-2022-looney', 'Kevon Looney', 'C', '2020s', [54, 58, 5, 80, 56, 84, 64]),
  ],
  'nuggets-2023': [
    p('nuggets-2023-murray', 'Jamal Murray', 'PG', '2020s', [82, 86, 82, 72, 80, 48, 90]),
    p('nuggets-2023-kcp', 'Kentavious Caldwell-Pope', 'SG', '2020s', [80, 76, 82, 80, 54, 46, 78]),
    p('nuggets-2023-mpj', 'Michael Porter Jr.', 'SF', '2020s', [76, 82, 82, 68, 52, 72, 74]),
    p('nuggets-2023-gordon', 'Aaron Gordon', 'PF', '2020s', [84, 76, 60, 84, 64, 78, 76]),
    p('nuggets-2023-jokic', 'Nikola Jokić', 'C', '2020s', [56, 90, 76, 76, 95, 90, 90]),
  ],
  'celtics-2024': [
    p('celtics-2024-jrue', 'Jrue Holiday', 'PG', '2020s', [80, 78, 76, 88, 78, 54, 82]),
    p('celtics-2024-white', 'Derrick White', 'SG', '2020s', [80, 78, 82, 86, 72, 50, 80]),
    p('celtics-2024-brown', 'Jaylen Brown', 'SF', '2020s', [86, 84, 76, 82, 64, 64, 82]),
    p('celtics-2024-tatum', 'Jayson Tatum', 'PF', '2020s', [82, 86, 82, 82, 76, 76, 86]),
    p('celtics-2024-porzingis', 'Kristaps Porziņģis', 'C', '2020s', [60, 82, 80, 84, 50, 78, 76]),
  ],
  'suns-2021': [
    p('suns-2021-cp3', 'Chris Paul', 'PG', '2020s', [78, 84, 80, 84, 92, 50, 92]),
    p('suns-2021-booker', 'Devin Booker', 'SG', '2020s', [80, 90, 82, 72, 78, 52, 88]),
    p('suns-2021-bridges', 'Mikal Bridges', 'SF', '2020s', [82, 76, 80, 86, 54, 58, 76]),
    p('suns-2021-crowder', 'Jae Crowder', 'PF', '2020s', [70, 72, 78, 80, 56, 66, 74]),
    p('suns-2021-ayton', 'Deandre Ayton', 'C', '2020s', [68, 80, 30, 80, 52, 86, 74]),
  ],
  'heat-2020': [
    p('heat-2020-dragic', 'Goran Dragić', 'PG', '2020s', [80, 80, 74, 70, 76, 46, 80]),
    p('heat-2020-drobinson', 'Duncan Robinson', 'SG', '2020s', [72, 78, 90, 62, 50, 44, 74]),
    p('heat-2020-butler', 'Jimmy Butler', 'SF', '2020s', [82, 82, 60, 88, 78, 64, 90]),
    p('heat-2020-crowder', 'Jae Crowder', 'PF', '2020s', [70, 72, 78, 80, 54, 64, 74]),
    p('heat-2020-bam', 'Bam Adebayo', 'C', '2020s', [82, 76, 30, 88, 76, 82, 78]),
  ],
}

// Injeta `teamAbbr` (dado visual da jersey) em cada jogador, derivado do time de
// origem — sem tocar nos ~300 calls p(...). `teams.ts` só importa um tipo daqui,
// então não há ciclo de import.
const _abbrByTeam = new Map(TEAMS.map((t) => [t.id, t.abbr]))
export const ROSTERS: Record<string, Player[]> = Object.fromEntries(
  Object.entries(_rawRosters).map(([teamId, players]) => [
    teamId,
    players.map((pl) => ({ ...pl, teamAbbr: _abbrByTeam.get(teamId) ?? '' })),
  ]),
)

const BY_ID: Map<string, Player> = new Map(
  Object.values(ROSTERS)
    .flat()
    .map((player) => [player.id, player]),
)

/** Busca um jogador de elenco pelo id (para recompor o time draftado). */
export function playerById(id: string): Player | undefined {
  return BY_ID.get(id)
}
