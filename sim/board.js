// Board knowledge used by the bot: fronts, objectives, distances, fire-table expectations.
// Everything here is information printed on the bot's reference sheet.
"use strict"
const data = require('../engine/data.js')

const N = 282 // map spaces 1..281
const byName = {}
for (let i = 1; i < data.spaces.length; i++) if (data.spaces[i] && data.spaces[i].name) byName[data.spaces[i].name] = i
function S(name) { const i = byName[name]; if (!i) throw new Error('No space ' + name); return i }

// --- adjacency (generic, ignoring nation-limited links except where all nations allowed) ---
const adj = []
for (let i = 0; i < N; i++) adj.push([])
for (let i = 1; i < N; i++) {
  const sp = data.spaces[i]
  for (const j of sp.connections || []) { if (j < N && !adj[i].includes(j)) adj[i].push(j); if (j < N && !adj[j].includes(i)) adj[j].push(i) }
}
function bfs(from) {
  const d = new Array(N).fill(99); d[from] = 0; const q = [from]
  while (q.length) { const x = q.shift(); for (const y of adj[x]) if (d[y] === 99) { d[y] = d[x] + 1; q.push(y) } }
  return d
}
const DIST = []
for (let i = 0; i < N; i++) DIST.push(i === 0 ? null : bfs(i))
function dist(a, b) { if (!a || !b || a >= N || b >= N) return 99; return DIST[a][b] }

// --- Fronts (by nation, with named exceptions) ---
const ITALY_AH = ['Trent', 'Trieste', 'Innsbruck', 'Spittal', 'Villach', 'Zagreb', 'Graz', 'Banja Luka'].map(S)
const BALKAN_AH = ['Mostar', 'Sarajevo', 'Novi Sad', 'Pecs'].map(S)
const EAST_GE = ['Oppeln', 'Breslau', 'Posen', 'Thorn', 'Danzig', 'Konigsberg', 'Tannenberg', 'Insterberg', 'Memel', 'Kolberg', 'Stettin', 'Cottbus', 'Berlin', 'Dresden'].map(S)
const TU_EUROPE = ['Adrianople', 'Gallipoli', 'Cana Kale', 'Constantinople'].map(S)
const CAUCASUS_RU = ['Batum', 'Kars', 'Poti', 'Grozny', 'Petrovsk', 'Tbilisi', 'Elizabethpol', 'Baku', 'Erivan', 'Caucasus'].map(S)
const FRONT = new Array(N).fill(null)
for (let i = 1; i < N; i++) {
  const n = data.spaces[i].nation
  let f
  if (['fr', 'be', 'br'].includes(n)) f = 'WEST'
  else if (n === 'ge') f = EAST_GE.includes(i) ? 'EAST' : 'WEST'
  else if (n === 'it') f = 'ITALY'
  else if (n === 'ah') f = ITALY_AH.includes(i) ? 'ITALY' : BALKAN_AH.includes(i) ? 'BALKANS' : 'EAST'
  else if (n === 'ru') f = CAUCASUS_RU.includes(i) ? 'NEAREAST' : 'EAST'
  else if (n === 'ro') f = 'EAST'
  else if (['sb', 'mn', 'al', 'gr', 'bu'].includes(n)) f = 'BALKANS'
  else if (n === 'tu') f = TU_EUROPE.includes(i) ? 'BALKANS' : 'NEAREAST'
  else if (['pe', 'ar', 'eg'].includes(n)) f = 'NEAREAST'
  else f = data.spaces[i].name.startsWith('MEF') ? 'BALKANS' : 'WEST'
  FRONT[i] = f
}
const FRONTS = ['WEST', 'EAST', 'ITALY', 'BALKANS', 'NEAREAST']

// --- Objectives: first space on the list not controlled by the bot is the front's objective ---
const OBJ = {
  cp: {
    WEST: ['Liege', 'Brussels', 'Sedan', 'Cambrai', 'Amiens', 'Verdun', 'Paris', 'Calais', 'Ostend', 'Antwerp', 'Nancy', 'Chateau Thierry', 'Melun', 'Rouen', 'Bar le Duc', 'Belfort', 'Dijon', 'Le Havre', 'Orleans'],
    EAST: ['Konigsberg', 'Lemberg', 'Czernowitz', 'Cracow', 'Lodz', 'Warsaw', 'Ivangorod', 'Kovno', 'Grodno', 'Vilna', 'Riga', 'Brest Litovsk', 'Lutsk', 'Rovno', 'Minsk', 'Kiev', 'Bucharest', 'Ploesti', 'Odessa'],
    ITALY: ['Trent', 'Trieste', 'Udine', 'Venice', 'Asiago', 'Verona', 'Milan', 'Bologna', 'Genoa', 'Florence'],
    BALKANS: ['Belgrade', 'Valjevo', 'Nis', 'Skopje', 'Cetinje', 'Monastir', 'Bucharest', 'Constanta', 'Salonika', 'Florina'],
    NEAREAST: ['Basra', 'Baghdad', 'Kars', 'Batum', 'Erivan', 'Sinai', 'Port Said', 'Cairo', 'Baku'],
  },
  ap: {
    WEST: ['Paris', 'Calais', 'Amiens', 'Verdun', 'Nancy', 'Ostend', 'Cambrai', 'Sedan', 'Brussels', 'Liege', 'Antwerp', 'Metz', 'Strasbourg', 'Aachen', 'Koblenz', 'Essen', 'Frankfurt'],
    EAST: ['Warsaw', 'Lodz', 'Riga', 'Kovno', 'Vilna', 'Lemberg', 'Przemysl', 'Czernowitz', 'Cracow', 'Konigsberg', 'Breslau', 'Posen', 'Danzig', 'Budapest', 'Debrecen', 'Cluj'],
    ITALY: ['Trent', 'Trieste', 'Villach', 'Zagreb', 'Innsbruck'],
    BALKANS: ['Belgrade', 'Nis', 'Skopje', 'Monastir', 'Sofia', 'Strumitsa', 'Philippoli', 'Adrianople', 'Constantinople'],
    NEAREAST: ['Basra', 'Qurna', 'Kut', 'Baghdad', 'Gaza', 'Jerusalem', 'Beersheba', 'Damascus', 'Erzerum', 'Trebizond', 'Mosul', 'Constantinople'],
  },
}
for (const side in OBJ) for (const f in OBJ[side]) OBJ[side][f] = OBJ[side][f].map(S)

// Fire tables: expected hits per column (printed on the reference card).
function expectedTable(tbl) { return tbl.map(c => c.result.reduce((a, b) => a + b, 0) / 6) }

const CAPITALS = { cp: ['Berlin', 'Vienna', 'Constantinople', 'Sofia'].map(S), ap: ['Paris', 'London', 'Petrograd', 'Rome', 'Belgrade', 'Bucharest'].map(S) }

// Map y-coordinate (north = smaller) for the Tie rule.
const Y = require('./coords_y.json')
function ycoord(s) { return Y[s] !== undefined ? Y[s] : 9999 }

module.exports = { data, N, S, byName, adj, dist, FRONT, FRONTS, OBJ, expectedTable, CAPITALS, ycoord }
