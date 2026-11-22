"use strict";

const TABLETOP = (() => {
  const sides = { cp: "Central Powers", ap: "Allies" };
  const nations = { ge: "German", ah: "Austro-Hungarian", fr: "French", br: "British", ru: "Russian" };
  const turns = ["August 1914", "September 1914", "Fall 1914"];
  const junctions = new Set([
    "Stanislau", "Lemberg", "Lodz", "Przemysl", "Cracow", "Breslau", "Posen",
    "Czernowitz", "Lublin", "Warsaw", "Lutsk", "Liege", "Sedan", "Cambrai",
    "Chateau Thierry", "Metz", "Nancy", "Verdun", "Szeged", "Budapest", "Belgrade"
  ]);

  const lanes = {
    belgium: {
      front: "Western Front", goal: "Break into Belgium and northern France",
      orders: [
        ["Liege", "Brussels"], ["Metz", "Sedan"], ["Koblenz", "Sedan"],
        ["Sedan", "Cambrai"], ["Brussels", "Antwerp"], ["Liege", "Sedan"],
        ["Sedan", "Chateau Thierry"], ["Strasbourg", "Nancy"], ["Aachen", "Liege"],
        ["Cambrai", "Chateau Thierry"], ["Metz", "Verdun"], ["Brussels", "Ostend"]
      ]
    },
    poland: {
      front: "Eastern Front", goal: "Pressure Poland and cover Galicia",
      orders: [
        ["Przemysl", "Lublin"], ["Tarnow", "Ivangorod"], ["Lemberg", "Lutsk"],
        ["Breslau", "Lodz"], ["Posen", "Lodz"], ["Stanislau", "Czernowitz"],
        ["Lodz", "Warsaw"], ["Lublin", "Ivangorod"], ["Przemysl", "Lemberg"],
        ["Insterberg", "Kovno"], ["Tarnow", "Cracow"], ["Czernowitz", "Tarnopol"]
      ]
    },
    france: {
      front: "Western Front", goal: "Secure victory spaces in northern France",
      orders: [
        ["Sedan", "Cambrai"], ["Chateau Thierry", "Melun"], ["Metz", "Verdun"],
        ["Liege", "Brussels"], ["Brussels", "Cambrai"], ["Nancy", "Bar le Duc"],
        ["Bar le Duc", "Dijon"], ["Chateau Thierry", "Paris"], ["Sedan", "Chateau Thierry"],
        ["Brussels", "Antwerp"], ["Strasbourg", "Nancy"], ["Koblenz", "Sedan"]
      ]
    },
    galicia: {
      front: "Eastern Front", goal: "Take the Galician junctions",
      orders: [
        ["Kamenets-Podolski", "Czernowitz"], ["Dubno", "Tarnopol"], ["Lublin", "Przemysl"],
        ["Lutsk", "Lemberg"], ["Tarnopol", "Lemberg"], ["Ivangorod", "Tarnow"],
        ["Czernowitz", "Stanislau"], ["Lemberg", "Stanislau"], ["Warsaw", "Lodz"],
        ["Stanislau", "Munkacs"], ["Czernowitz", "Munkacs"], ["Munkacs", "Cluj"]
      ]
    },
    counter: {
      front: "Western Front", goal: "Hold France and retake Sedan or Brussels",
      orders: [
        ["Verdun", "Sedan"], ["Cambrai", "Sedan"], ["Chateau Thierry", "Sedan"],
        ["Bar le Duc", "Chateau Thierry"], ["Brussels", "Liege"], ["Nancy", "Metz"],
        ["Belfort", "Mulhouse"], ["Sedan", "Brussels"], ["Antwerp", "Brussels"],
        ["Paris", "Chateau Thierry"], ["Chateau Thierry", "Bar le Duc"], ["Nancy", "Strasbourg"]
      ]
    },
    carpathians: {
      front: "Eastern Front", goal: "Press from Galicia into Hungary",
      orders: [
        ["Lemberg", "Stanislau"], ["Czernowitz", "Stanislau"], ["Stanislau", "Munkacs"],
        ["Munkacs", "Cluj"], ["Cluj", "Debrecen"], ["Warsaw", "Lodz"],
        ["Kamenets-Podolski", "Czernowitz"], ["Lublin", "Przemysl"], ["Lutsk", "Lemberg"],
        ["Ivangorod", "Tarnow"], ["Czestochowa", "Cracow"], ["Tarnopol", "Lemberg"]
      ]
    }
  };
  const campaign = { cp: ["belgium", "poland", "france"], ap: ["galicia", "counter", "carpathians"] };
  const launchSites = {
    belgium: ["Liege", "Sedan", "Brussels", "Cambrai", "Metz", "Koblenz"],
    poland: ["Lemberg", "Stanislau", "Przemysl", "Lodz", "Tarnow", "Cracow", "Insterberg"],
    france: ["Cambrai", "Chateau Thierry", "Sedan", "Verdun", "Brussels", "Metz", "Nancy", "Bar le Duc"],
    galicia: ["Lemberg", "Tarnopol", "Lutsk", "Lublin", "Czernowitz", "Dubno", "Ivangorod", "Kamenets-Podolski"],
    counter: ["Sedan", "Chateau Thierry", "Cambrai", "Verdun", "Nancy", "Bar le Duc", "Brussels", "Paris"],
    carpathians: ["Lemberg", "Stanislau", "Tarnopol", "Czernowitz", "Kamenets-Podolski", "Lublin", "Dubno", "Warsaw", "Ivangorod"]
  };
  const offensives = {
    ge: [["Metz", "Verdun"], ["Sedan", "Cambrai"], ["Liege", "Brussels"], ["Strasbourg", "Nancy"], ["Koblenz", "Sedan"]],
    ah: [["Novi Sad", "Belgrade"], ["Przemysl", "Lublin"], ["Sarajevo", "Valjevo"], ["Tarnow", "Ivangorod"], ["Stanislau", "Czernowitz"]],
    fr: [["Verdun", "Sedan"], ["Nancy", "Metz"], ["Cambrai", "Sedan"], ["Belfort", "Mulhouse"], ["Chateau Thierry", "Sedan"]],
    br: [["Brussels", "Liege"], ["Cambrai", "Sedan"], ["Calais", "Cambrai"], ["Antwerp", "Brussels"], ["Sedan", "Brussels"]],
    ru: [["Lutsk", "Lemberg"], ["Dubno", "Tarnopol"], ["Lublin", "Przemysl"], ["Kovno", "Insterberg"], ["Czernowitz", "Stanislau"]]
  };
  const cover = {
    cp: [["Villach", "Budapest", ["Graz", "Vienna", "Budapest"]], ["Oppeln", "Breslau"], ["Cracow", "Tarnow"]],
    ap: [["Bar le Duc", "Chateau Thierry"], ["Paris", "Amiens"], ["Kamenets-Podolski", "Czernowitz"]]
  };

  function makeOrder([from, to, path = [to]], kind = "pressure", mandate = null) {
    return { from, to, path, kind, mandate, guard: junctions.has(from) };
  }

  const drill = [
    makeOrder(["Stanislau", "Cluj", ["Munkacs", "Cluj"]], "cover"),
    makeOrder(cover.cp[0], "cover")
  ];

  function mission(side, turn) {
    return lanes[campaign[side][turn - 1]];
  }

  function ordersFor(side, turn, round, mandate, tried, limit = 3, alternateFront = false) {
    const main = mission(side, turn).orders;
    const offset = ((round - 1) * 2) % main.length;
    const sorted = [...main.slice(offset), ...main.slice(0, offset)];
    const urgent = mandate && round >= 4 ? offensives[mandate] : [];
    const moOffset = ((round - 4) * 2) % (urgent.length || 1);
    const mo = urgent.length ? [...urgent.slice(moOffset), ...urgent.slice(0, moOffset)] : [];
    const support = round === 6 ? cover[side].filter(entry => !tried.includes(entry.join("/"))) : [];
    const primary = [
      ...mo.slice(0, 2).map(order => makeOrder(order, "mandate", mandate)),
      ...support.slice(0, urgent.length ? 0 : 1).map(order => makeOrder(order, "cover")),
      ...sorted.map(order => makeOrder(order))
    ];
    if (!alternateFront || limit <= 3) return primary.slice(0, limit);
    const reserve = mission(side, turn === 2 ? 3 : 2);
    const alternate = [...reserve.orders.slice(offset), ...reserve.orders.slice(0, offset)];
    return [...primary.slice(0, 3), ...alternate.slice(0, limit - 3).map(order => ({
      ...makeOrder(order), reserveFront: reserve.front, reserveGoal: reserve.goal
    }))];
  }

  function launchList(side, turn, round, excluded = [], limit = 3) {
    const main = campaign[side][turn - 1];
    const reserve = campaign[side][turn === 2 ? 2 : 1];
    const at = (key, index) => launchSites[key][index % launchSites[key].length];
    const offset = (round - 1) * 2;
    return [at(main, offset), at(main, offset + 1), at(reserve, round - 1)]
      .filter(name => !excluded.includes(name)).slice(0, limit);
  }

  function launchOrders(side, turn, from, links) {
    const main = campaign[side][turn - 1];
    const key = launchSites[main].includes(from) ? main : campaign[side][turn === 2 ? 2 : 1];
    const lane = lanes[key];
    const namedTargets = new Set(lane.orders.map(([, target]) => target));
    const score = target => Number(target.vp) * 4 + Number(target.supply) * 2 +
      Number(target.side !== side) * 2 + Number(namedTargets.has(target.name)) * 2 +
      Number(junctions.has(target.name)) - Number(target.fort > 1) * 2;
    return [...links[from]].sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name, "en"))
      .map(target => ({
        ...makeOrder([from, target.name]), launch: true,
        ...(key !== main ? { reserveFront: lane.front, reserveGoal: lane.goal } : {})
      }));
  }

  function afterLaunch(pinned, checked, side, turn, from, links, remaining) {
    const seen = new Set(checked.filter(order => order.kind === "pressure").map(order => order.from + "/" + order.to));
    const nearby = from ? launchOrders(side, turn, from, links) : [];
    const options = [...nearby, ...pinned];
    return options.filter(order => {
      const key = order.from + "/" + order.to;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, remaining);
  }

  function chooseOps(hand, cost, cards) {
    if (cost === 1) return { mode: "ops", card: null };
    const card = hand.map(id => cards[id]).filter(c => c.ops >= cost)
      .sort((a, b) => a.ops - b.ops || Number(a.reinf) - Number(b.reinf) || a.num - b.num)[0];
    return card ? { mode: "ops", card: card.id } : null;
  }

  function chooseRp(hand, cards) {
    const card = hand.map(id => cards[id]).sort((a, b) => b.rpTotal - a.rpTotal || a.num - b.num)[0];
    return card ? { mode: "rp", card: card.id } : null;
  }

  function fallback(hand, cards, turn, last, depleted) {
    if (depleted && turn < 3 && last !== "rp") {
      const rp = chooseRp(hand, cards);
      if (rp) return rp;
    }
    return { mode: "ops", card: null, hold: true };
  }

  function random(state) {
    state.rng = (state.rng + 0x6d2b79f5) >>> 0;
    let x = state.rng;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  }

  function shuffle(state, list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(random(state) * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function fill(state) {
    while (state.hand.length < 7) {
      if (!state.deck.length) state.deck = shuffle(state, state.discard.splice(0));
      if (!state.deck.length) break;
      state.hand.push(state.deck.pop());
    }
  }

  function start(side, seed, cards) {
    const state = {
      side, rng: seed >>> 0, turn: 1, round: 1, mandate: "", phase: "mandate", probe: 0,
      hand: side === "cp" ? ["C1"] : [], deck: [], discard: [], removed: [],
      last: null, pending: null, log: [], coverUsed: []
    };
    state.deck = shuffle(state, Object.values(cards).filter(c => c.side === side && !state.hand.includes(c.id)).map(c => c.id));
    fill(state);
    return state;
  }

  function complete(state, play, cards) {
    if (play.card) {
      if (!state.hand.includes(play.card)) throw Error("Card is unavailable.");
      state.hand = state.hand.filter(id => id !== play.card);
      state[play.mode === "event" && cards[play.card].star ? "removed" : "discard"].push(play.card);
    }
    state.last = play.mode;
    if (play.order?.kind === "cover") {
      const o = play.order;
      state.coverUsed.push([o.from, o.to, ...(o.path.length > 1 ? [o.path] : [])].join("/"));
    }
  }

  return {
    sides, nations, turns, mission, ordersFor, chooseOps, fallback, start, fill, complete, drill, junctions,
    launchNames: [...new Set(Object.values(launchSites).flat())], launchList, afterLaunch
  };
})();

