"use strict";

const workspace = document.getElementById("workspace");
const missionBox = document.getElementById("mission");
const historyBox = document.getElementById("history");
const storageKey = "paths-of-glory-tabletop-1914-v01";
const phaseNames = ["mandate", "board", "probe", "launch", "rp", "order", "turn-end", "finished"];
const firstOrders = 3;
const esc = value => String(value).replace(/[&<>"']/g, ch => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[ch]);

function readSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (!stored || !Object.hasOwn(TABLETOP.sides, stored.side) || !phaseNames.includes(stored.phase)) return null;
    if (![1, 2, 3].includes(stored.turn) || ![1, 2, 3, 4, 5, 6].includes(stored.round)) return null;
    if (![3, 6].includes(stored.limit) || !Number.isInteger(stored.probe) || stored.probe < 0 || stored.probe > stored.limit) return null;
    if (!Number.isInteger(stored.rng) || typeof stored.mandate !== "string") return null;
    const ids = [stored.hand, stored.deck, stored.discard, stored.removed].flat();
    if (ids.length !== 14 || new Set(ids).size !== 14 || !ids.every(id => CARDS[id]?.side === stored.side)) return null;
    if (!Array.isArray(stored.log) || !Array.isArray(stored.coverUsed) || !Number.isInteger(stored.totalChecks)) return null;
    const search = stored.search;
    if (search && (!Number.isInteger(search.lookups) || search.lookups < 0 || search.lookups > 2 ||
        typeof search.follow !== "boolean" || search.from && !Object.hasOwn(LAUNCH_LINKS, search.from))) return null;
    if (stored.phase === "launch" && (!search || stored.side !== "cp" || stored.turn !== 3 || !stored.localInFall)) return null;
    if (stored.phase === "order" && (!stored.pending ||
        (stored.pending.card !== null && !stored.hand.includes(stored.pending.card)))) return null;
    return { localInFall: false, search: null, totalSiteChecks: 0, ...stored };
  } catch {
    return null;
  }
}

let state = readSession();
let practice = false;
let tableSession = null;
let notice = "";

function save() {
  if (practice) return;
  try {
    if (state) localStorage.setItem(storageKey, JSON.stringify(state));
    else localStorage.removeItem(storageKey);
  } catch {
    // The pilot also works when browser storage is disabled.
  }
}

const button = (label, action, value = "", style = "secondary") =>
  `<button type="button" class="${style}" data-action="${action}" data-value="${esc(value)}">${esc(label)}</button>`;
const controls = (...buttons) => `<div class="actions">${buttons.join("")}</div>`;
const heading = (title, description = "") =>
  `<h2 tabindex="-1">${esc(title)}</h2>${description ? `<p>${esc(description)}</p>` : ""}`;
const stamp = () => `${TABLETOP.turns[state.turn - 1]} · Action ${state.round}`;
const routes = order => `<ol class="orders" aria-label="Route">${[order.from, ...order.path]
  .map(place => `<li>${esc(place)}</li>`).join("")}</ol>`;

function fixedOrders() {
  return TABLETOP.ordersFor(state.side, state.turn, state.round, state.mandate, state.coverUsed, state.limit, state.limit === 6);
}

function candidates() {
  if (practice) return TABLETOP.drill;
  const fixed = fixedOrders();
  if (!state.search) return fixed;
  const initial = fixed.slice(0, firstOrders);
  if (!state.search.follow) return initial;
  return TABLETOP.afterLaunch(fixed.slice(firstOrders), initial, state.side, state.turn,
    state.search.from, LAUNCH_LINKS, state.limit - firstOrders - state.search.lookups);
}

function launchPlaces() {
  const excluded = fixedOrders().slice(0, firstOrders).map(order => order.from);
  return TABLETOP.launchList(state.side, state.turn, state.round, excluded, state.limit - firstOrders - 1);
}

function setLaunch(from, lookups = 0) {
  state.search = { from, lookups, follow: true };
  state.totalSiteChecks += lookups;
  state.probe = 0;
  if (candidates().length) state.phase = "probe";
  else showFallback();
}

function nextProbe() {
  state.probe++;
  if (state.probe < candidates().length) return;
  if (!state.search || state.search.follow) showFallback();
  else if (state.search.from || !launchPlaces().length) setLaunch(state.search.from);
  else state.phase = "launch";
}

function newGame(side, limit) {
  state = {
    ...TABLETOP.start(side, Date.now(), CARDS), limit, totalChecks: 0, checksAtStart: 0,
    localInFall: side === "cp" && limit === 6, totalSiteChecks: 0, search: null
  };
  practice = false;
  save();
}

function beginDrill() {
  if (practice) return;
  tableSession = state;
  state = { ...TABLETOP.start("cp", 530433, CARDS), round: 6, limit: 3, phase: "probe", totalChecks: 0, checksAtStart: 0 };
  practice = true;
}

function showOrder(play) {
  state.pending = play;
  state.phase = "order";
}

function showFallback() {
  const replacements = state.turn < 3 && state.last !== "rp" && state.hand.length;
  if (replacements) state.phase = "rp";
  else showOrder(TABLETOP.fallback(state.hand, CARDS, state.turn, state.last, false));
}

function currentProbe() {
  return candidates()[state.probe];
}

function startAction() {
  state.probe = 0;
  state.checksAtStart = state.totalChecks;
  state.search = state.localInFall && state.turn === 3 ? { from: "", lookups: 0, follow: false } : null;
  if (state.side === "cp" && state.turn === 1 && state.round === 1 && state.hand.includes("C1")) {
    showOrder({ mode: "event", card: "C1" });
  } else state.phase = "probe";
}

function recordOrder() {
  const play = state.pending;
  TABLETOP.complete(state, play, CARDS);
  if (play.order?.kind === "mandate") state.mandate = "";
  const description = play.order ? `${play.operation === "attack" ? "Attack" : "March"} ${play.order.from} → ${play.order.to}` :
    play.hold ? "Automatic Operation · no activations" : play.mode === "rp" ? "Bank replacements" : "Guns of August";
  state.log.push({ label: stamp(), description, checks: state.totalChecks - state.checksAtStart,
    lookups: state.search?.lookups ?? 0 });
  state.pending = null;
  state.search = null;
  if (practice) state.phase = "finished";
  else if (state.round === 6) state.phase = "turn-end";
  else {
    state.round++;
    state.phase = "board";
  }
}

function renderSetup() {
  return heading("Run the bot on your board",
    "Set up the 1914 Introductory Scenario as usual. Choose which side the companion plays. It will manage the bot’s hand and ask you to check named orders on the physical board.") +
    `<fieldset class="settings"><legend>Order search limit</legend>
      <label><input name="limit" type="radio" value="6" checked> 6 · broader search</label>
      <label><input name="limit" type="radio" value="3"> 3 · shorter</label>
    </fieldset>` +
    '<p class="meta">The six-check option searches two fronts. In Fall, the Central Powers can reuse a supplied stack and try nearby destinations.</p>' +
    controls(button("Central Powers bot", "start", "cp", "primary"), button("Allied bot", "start", "ap")) +
    '<p class="meta">You move the pieces, roll dice and apply the printed rules. Start with the Cluj drill to try an action without setting up.</p>';
}

function renderMandate() {
  const possible = state.side === "cp" ? ["ge", "ah"] : ["fr", "br", "ru"];
  const setup = state.turn === 1 && state.side === "cp" ?
    '<div class="callout"><p>The Central Powers bot starts with Guns of August in its hand and will play it on its first action.</p></div>' : "";
  return heading("Read the bot’s mandate", "Roll the mandated offensive on the physical board and select the nation shown on the bot’s marker.") + setup +
    controls(...possible.map(n => button(TABLETOP.nations[n], "mandate", n)), button("None", "mandate"));
}

function renderBoard() {
  const instruction = state.side === "ap" ?
    "Resolve the Central Powers action for this round. When the Allied marker is next, start the bot action." :
    state.round === 1 ? "When the first Central Powers action is due, start the bot action." :
      "Resolve the Allied action from the previous round. Then start the next Central Powers action.";
  return heading("Check the action marker", instruction) + controls(
    button("Start bot action", "begin", "", "primary"),
    state.mandate ? button("Mandate already met", "mandate-met", "", "quiet") : "");
}

function renderProbe() {
  const order = currentProbe();
  const { from, to, kind, guard, mandate } = order;
  const introduction = kind === "mandate" ? `Check a legal ${TABLETOP.nations[mandate]} attack against an enemy combat unit that fulfills the mandate.` :
    kind === "cover" ? `March a supplied corps group to ${to} if it is friendly-controlled and empty.` :
      `Attack if ${to} has an enemy combat unit or an unbesieged enemy fort. Otherwise march only if ${to} is enemy-controlled.`;
  const guardText = guard ? `<p><strong>Guard ${esc(from)}.</strong> If an enemy combat unit is adjacent, leave a friendly combat unit at ${esc(from)} when marching.</p>` : "";
  const vignette = practice ? (state.probe === 0 ?
    '<div class="callout"><p>August, action 6. Stanislau has one Austro-Hungarian corps. The Russian 8th Army is adjacent at Czernowitz. The route through Munkacs to empty Cluj is otherwise legal at 1 OPS.</p></div>' :
    '<div class="callout"><p>A supplied Austro-Hungarian corps is at Villach. The route through Graz and Vienna to friendly, empty Budapest is legal and supplied. Villach costs 1 OPS to activate.</p></div>') : "";
  const modes = kind === "cover" ? ["move"] : kind === "mandate" ? ["attack"] : ["move", "attack"];
  const offers = modes.map(mode => {
    const label = mode === "move" ? "Legal march" : "Legal attack";
    return `<div class="order-modes"><h3>${label}</h3><div class="choices">
      ${[1, 2, 3, 4].map(cost => button(`${cost} OPS`, "offer", `${mode}/${cost}`)).join("")}</div></div>`;
  }).join("");
  const reportStack = state.search && !state.search.follow && !state.search.from && Object.hasOwn(LAUNCH_LINKS, from);
  const rejected = reportStack ? controls(
    button("Blocked · supplied stack present", "skip", "present", "quiet"),
    button("No supplied unit", "skip", "", "quiet")) : controls(button("Blocked or unsafe", "skip", "", "quiet"));
  const title = order.launch ? "Check a nearby destination" :
    kind === "cover" ? "Check a cover order" : kind === "mandate" ? "Check a mandated attack" : "Check an objective order";
  return heading(title, introduction) +
    routes(order) + vignette + (guardText ? `<div class="callout">${guardText}</div>` : "") +
    '<p class="meta">Check the whole space’s activation cost. For a march, check supply at the destination. Use the unit order under “Choosing a group.”</p>' +
    offers + rejected;
}

function renderLaunch() {
  return heading("Find the first supplied stack",
    "Check these spaces in the order shown. Select the first with at least one supplied Central Powers army or corps.") +
    controls(...launchPlaces().map((name, index) => button(`${index + 1}. ${name}`, "launch", name)),
      button("None of these spaces", "launch", "", "quiet"));
}

function renderOrder() {
  const play = state.pending;
  const card = CARDS[play.card];
  const name = card ? `#${card.num} ${card.name}` : "Automatic Operation · 1 OPS";
  let instruction;
  if (play.mode === "event") {
    instruction = "Play the event and apply the card. If legal, attack Sedan with GE 1, GE 2 and GE 3 together. Otherwise attack Brussels from Liege with GE 1 and GE 2 if legal. Use the bot’s combat decisions under “At the table.”";
  } else if (play.mode === "rp") {
    instruction = "Play the card for replacements and mark the RPs on the General Records Track. Spend them in the Replacement Phase using the priorities under “At the table.”";
  } else if (play.hold) {
    instruction = "Use the cardless 1-OPS action and spend zero OPS this round.";
  } else if (play.operation === "attack") {
    instruction = `Activate ${play.order.from} for combat. Attack ${play.order.to} with the group you checked. Follow the bot’s combat decisions.`;
  } else {
    instruction = `Activate ${play.order.from} for movement. March the group you checked along the named route.`;
  }
  return heading("Execute the bot order", instruction) +
    `<div class="callout"><p><strong>${esc(name)}</strong> · ${play.mode === "event" ? "Event" : play.mode.toUpperCase()}</p></div>` +
    (play.order ? routes(play.order) : "") + controls(
      button(practice ? "Finish drill" : "Order resolved", "done", "", "primary"),
      play.order ? button("Back to check", "back", "", "quiet") : "");
}

function renderTurnEnd() {
  const after = state.side === "cp" ? "Resolve the last Allied action, then " : "";
  const end = state.turn === 3;
  return heading(end ? "Finish the scenario" : "Resolve turn end",
    `${after}${after ? "follow" : "Follow"} the printed turn-end sequence. Spend the bot’s replacements using the priorities under “At the table.”`) +
    (end ? '<p>Read the final VP marker. The Central Powers win at 14 or more, the Allies at 10 or fewer, and 11–13 is a draw.</p>' :
      '<p>When the physical turn is complete, the bot will draw its next hand.</p>') +
    controls(end ? button("Finish game", "finish", "", "primary") : button("Draw and start next turn", "next", "", "primary"),
      end ? "" : button("Game ended", "finish", "", "quiet"));
}

function renderFinished() {
  const siteChecks = state.totalSiteChecks ? ` and ${state.totalSiteChecks} stack checks` : "";
  return practice ? heading("Stanislau stays guarded",
    "The bot rejected the Cluj march and used a corps from Villach to cover Budapest. The guard check used the pieces next to Stanislau.") +
    controls(button("Back to table", "leave-drill", "", "primary")) :
    heading("Scenario complete", `The bot used ${state.totalChecks} order checks${siteChecks} across ${state.log.length} actions. Read the result from the physical board.`) +
    controls(button("New game", "setup", "", "primary"), button("Try the Cluj drill", "drill"));
}

function render(focus = false) {
  let body;
  if (!state) body = renderSetup();
  else {
    const panels = {
      mandate: renderMandate, board: renderBoard, probe: renderProbe, launch: renderLaunch, order: renderOrder,
      rp: () => heading("Check for replacements", "Do you see a supplied reduced unit or a legally rebuildable unit that could use the bot’s replacements?") +
        controls(button("Yes · bank replacements", "rp", "yes", "primary"), button("None eligible", "rp")),
      "turn-end": renderTurnEnd, finished: renderFinished
    };
    const label = state.phase === "probe" ? ` · Check ${state.probe + 1} of ${candidates().length}` : "";
    body = `<p class="kicker">${practice ? "Cluj drill" : TABLETOP.sides[state.side]} · ${stamp()}${label}</p>` + panels[state.phase]();
  }
  workspace.innerHTML = body + (notice ? `<p class="status" role="status">${esc(notice)}</p>` : "");
  missionBox.hidden = !state;
  if (state) {
    const assignment = TABLETOP.mission(state.side, state.turn);
    const order = state.phase === "probe" ? currentProbe() : state.pending?.order;
    const goal = practice ? "Keep the supply junction guarded" : order?.reserveGoal ?? assignment.goal;
    const front = practice ? "Eastern Front" : order?.reserveFront ? `Reserve · ${order.reserveFront}` : assignment.front;
    missionBox.innerHTML = `<p class="kicker">${esc(front)}</p><h2>${esc(goal)}</h2>` +
      (state.mandate ? `<p class="meta">Outstanding mandate · ${TABLETOP.nations[state.mandate] ?? ""}</p>` : "");
  }
  historyBox.hidden = !state?.log.length;
  if (!historyBox.hidden) {
    historyBox.innerHTML = '<h2>Recent bot orders</h2><ul class="history-list">' + state.log.slice(-5).reverse().map(entry => {
      const stackChecks = entry.lookups ? ` + ${esc(entry.lookups)} stack` : "";
      return `<li><strong>${esc(entry.description)}</strong><br><span class="meta">${esc(entry.label)} · ${esc(entry.checks)} order${stackChecks} checks</span></li>`;
    }).join("") + "</ul>";
  }
  if (focus) workspace.querySelector("h2")?.focus({ preventScroll: true });
}

document.addEventListener("click", event => {
  const target = event.target.closest("button[data-action]");
  if (!target) return;
  const { action, value } = target.dataset;
  notice = "";
  if (action === "setup") {
    if (practice) state = tableSession;
    if (state && state.phase !== "finished" && !window.confirm("Start over and discard the current tabletop session?")) {
      practice = false;
      render();
      return;
    }
    state = null;
    practice = false;
  } else if (action === "drill") {
    beginDrill();
  } else if (action === "leave-drill") {
    state = tableSession;
    tableSession = null;
    practice = false;
  } else if (action === "start" && !state) {
    newGame(value, Number(workspace.querySelector("input[name=limit]:checked").value));
  } else if (state) {
    if (action === "mandate" && state.phase === "mandate") {
      state.mandate = value;
      state.phase = "board";
    } else if (action === "mandate-met" && state.phase === "board") state.mandate = "";
    else if (action === "begin" && state.phase === "board") startAction();
    else if (state.phase === "probe" && (action === "offer" || action === "skip")) {
      if (practice && (state.probe === 0 && action === "offer" ||
          state.probe === 1 && (action === "skip" || value !== "move/1"))) {
        notice = state.probe === 0 ? "Leaving Stanislau empty would break the guard rule. Mark the order blocked." :
          "The Villach corps has a legal march costing 1 OPS.";
      } else {
        state.totalChecks++;
        const [operation, amount] = value.split("/");
        const play = action === "offer" && TABLETOP.chooseOps(state.hand, Number(amount), CARDS);
        if (play) showOrder({ ...play, operation, order: currentProbe() });
        else {
          const from = currentProbe().from;
          if (state.search && !state.search.follow && !state.search.from &&
              Object.hasOwn(LAUNCH_LINKS, from) && (value === "present" || action === "offer")) state.search.from = from;
          notice = action === "offer" ? "The bot’s hand cannot cover that activation." : "";
          if (practice) notice = "The corps holds Stanislau. Try the backup order.";
          nextProbe();
        }
      }
    } else if (action === "launch" && state.phase === "launch") {
      const places = launchPlaces();
      if (value === "" || places.includes(value)) setLaunch(value, value ? places.indexOf(value) + 1 : places.length);
    } else if (action === "rp" && state.phase === "rp") {
      showOrder(TABLETOP.fallback(state.hand, CARDS, state.turn, state.last, value === "yes"));
    } else if (action === "back" && state.phase === "order" && state.pending.order) {
      state.totalChecks--;
      state.pending = null;
      state.phase = "probe";
    } else if (action === "done" && state.phase === "order") recordOrder();
    else if (action === "next" && state.phase === "turn-end" && state.turn < 3) {
      TABLETOP.fill(state);
      state.turn++;
      state.round = 1;
      state.last = null;
      state.mandate = "";
      state.coverUsed = [];
      state.phase = "mandate";
    } else if (action === "finish" && state.phase === "turn-end") state.phase = "finished";
  }
  save();
  render(true);
});

render();
