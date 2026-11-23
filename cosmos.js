// Find Yo Zen — astrology + Human Design math. Needs the global `Astronomy` (astronomy-engine 2.1.19).
const A = () => globalThis.Astronomy;
const norm = d => ((d % 360) + 360) % 360;
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;

export const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
export const SIGN_GLYPH = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"].map(g => g + "︎");
export const SIGN_WORDS = ["bold, pioneering, direct","steady, sensual, loyal","curious, quick, social","nurturing, intuitive, protective","radiant, generous, creative","precise, helpful, grounded","harmonious, fair, graceful","intense, deep, transformative","free, adventurous, wise","ambitious, patient, masterful","original, visionary, humane","dreamy, compassionate, mystical"];
export const SIGN_ELEMENT = ["Fire","Earth","Air","Water"];
export const BODIES = [
  ["sun","Sun","☉","core self and life force"],["moon","Moon","☽","emotions and inner world"],["mercury","Mercury","☿","mind and communication"],
  ["venus","Venus","♀","love, beauty and values"],["mars","Mars","♂","drive and desire"],["jupiter","Jupiter","♃","growth and luck"],
  ["saturn","Saturn","♄","lessons and structure"],["uranus","Uranus","♅","awakening and change"],["neptune","Neptune","♆","dreams and spirit"],
  ["pluto","Pluto","♇","power and rebirth"],["node","North Node","☊","soul direction"]
].map(([k,n,g,m]) => ({ k, n, g: g + "︎", m }));

function meanNode(date) { // mean lunar ascending node, ecliptic of date
  const T = (A().MakeTime(date).tt) / 36525;
  return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441);
}
export function longitude(k, date) {
  const X = A();
  if (k === "sun") return norm(X.SunPosition(date).elon);
  if (k === "moon") return norm(X.EclipticGeoMoon(date).lon);
  if (k === "node") return meanNode(date);
  const body = k[0].toUpperCase() + k.slice(1);
  const v = X.GeoVector(X.Body[body], date, true);
  const r = X.RotateVector(X.Rotation_EQJ_ECT(date), v);
  return norm(X.SphereFromVector(r).lon);
}
export function positions(date) { const o = {}; for (const b of BODIES) o[b.k] = longitude(b.k, date); return o; }

export function angles(date, lat, lon) {
  const X = A(), t = X.MakeTime(date), T = t.tt / 36525;
  const eps = rad(23.4392911 - 0.0130042 * T);
  const ramc = rad(norm(X.SiderealTime(date) * 15 + lon));
  const asc = norm(deg(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(rad(lat)) * Math.sin(eps)))));
  const mc = norm(deg(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps))));
  return { asc, mc };
}
export const signOf = l => Math.floor(norm(l) / 30);
export const fmtDeg = l => { const d = norm(l) % 30, m = Math.floor((d % 1) * 60); return `${Math.floor(d)}°${String(m).padStart(2, "0")}′`; };

const ASPECTS = [["Conjunction",0,8,"#f6dc8f"],["Sextile",60,5,"#4fb487"],["Square",90,7,"#e5483f"],["Trine",120,7,"#3a8fe0"],["Opposition",180,8,"#f07fb6"]];
export function aspects(pos) {
  const ks = Object.keys(pos), out = [];
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
    let d = Math.abs(pos[ks[i]] - pos[ks[j]]); if (d > 180) d = 360 - d;
    for (const [n, a, orb, c] of ASPECTS) if (Math.abs(d - a) <= orb) out.push({ a: ks[i], b: ks[j], n, c, orb: Math.abs(d - a) });
  }
  return out;
}

/* ---------- Human Design ---------- */
const WHEEL = [41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,27,24,2,23,8,20,16,35,45,12,15,52,39,53,62,56,31,33,7,4,29,59,40,64,47,6,46,18,48,57,32,50,28,44,1,43,14,34,9,5,26,11,10,58,38,54,61,60];
export function gateLine(l) { const x = norm(l - 302), i = Math.floor(x / 5.625); return { gate: WHEEL[i], line: Math.floor((x - i * 5.625) / 0.9375) + 1 }; }
export const CENTERS = {
  head:{n:"Head",g:[64,61,63]}, ajna:{n:"Ajna",g:[47,24,4,17,43,11]}, throat:{n:"Throat",g:[62,23,56,35,12,45,33,8,31,20,16]},
  g:{n:"G / Identity",g:[7,1,13,10,25,15,46,2]}, heart:{n:"Heart / Ego",g:[21,40,26,51]}, sacral:{n:"Sacral",g:[5,14,29,59,9,3,42,27,34]},
  sp:{n:"Solar Plexus",g:[36,22,37,6,49,55,30]}, spleen:{n:"Spleen",g:[48,57,44,50,32,28,18]}, root:{n:"Root",g:[53,60,52,19,39,41,58,38,54]}
};
export const CHANNELS = [[64,47],[61,24],[63,4],[17,62],[43,23],[11,56],[16,48],[20,57],[20,10],[20,34],[31,7],[8,1],[33,13],[45,21],[35,36],[12,22],[10,57],[10,34],[25,51],[15,5],[2,14],[46,29],[26,44],[40,37],[34,57],[27,50],[59,6],[3,60],[9,52],[42,53],[32,54],[28,38],[18,58],[19,49],[39,55],[41,30]];
export const centerOf = g => Object.keys(CENTERS).find(c => CENTERS[c].g.includes(g));
const HD_BODIES = [["sun","Sun"],["earth","Earth"],["moon","Moon"],["node","North Node"],["snode","South Node"],["mercury","Mercury"],["venus","Venus"],["mars","Mars"],["jupiter","Jupiter"],["saturn","Saturn"],["uranus","Uranus"],["neptune","Neptune"],["pluto","Pluto"]];
function hdActivations(date) {
  const p = positions(date);
  return HD_BODIES.map(([k, n]) => {
    const l = k === "earth" ? p.sun + 180 : k === "snode" ? p.node + 180 : p[k];
    return { k, n, ...gateLine(l) };
  });
}
export function designDate(birth) { // when the Sun was 88° of arc earlier
  const target = norm(longitude("sun", birth) - 88);
  let t = new Date(birth.getTime() - 88.6 * 864e5);
  for (let i = 0; i < 8; i++) {
    let diff = norm(longitude("sun", t) - target); if (diff > 180) diff -= 360;
    t = new Date(t.getTime() - diff / 0.9856 * 864e5);
    if (Math.abs(diff) < 1e-5) break;
  }
  return t;
}
export function humanDesign(birth) {
  const dd = designDate(birth), pers = hdActivations(birth), des = hdActivations(dd);
  const gates = new Set([...pers, ...des].map(a => a.gate));
  const chans = CHANNELS.filter(([a, b]) => gates.has(a) && gates.has(b));
  const defined = new Set(chans.flatMap(([a, b]) => [centerOf(a), centerOf(b)]));
  // components among defined centers
  const parent = {}; defined.forEach(c => parent[c] = c);
  const find = c => parent[c] === c ? c : (parent[c] = find(parent[c]));
  chans.forEach(([a, b]) => { parent[find(centerOf(a))] = find(centerOf(b)); });
  const comps = new Set([...defined].map(find)).size;
  const linked = (x, y) => defined.has(x) && defined.has(y) && find(x) === find(y);
  const motorToThroat = ["sacral","heart","sp","root"].some(m => linked(m, "throat"));
  let type;
  if (!defined.size) type = "Reflector";
  else if (defined.has("sacral")) type = motorToThroat ? "Manifesting Generator" : "Generator";
  else type = motorToThroat ? "Manifestor" : "Projector";
  let authority;
  if (type === "Reflector") authority = "Lunar";
  else if (defined.has("sp")) authority = "Emotional (Solar Plexus)";
  else if (defined.has("sacral")) authority = "Sacral";
  else if (defined.has("spleen")) authority = "Splenic";
  else if (defined.has("heart")) authority = linked("heart","throat") ? "Ego Manifested" : "Ego Projected";
  else if (defined.has("g") && linked("g","throat")) authority = "Self-Projected";
  else authority = "Mental / Environmental";
  const STRAT = { "Generator":"Wait to respond", "Manifesting Generator":"Wait to respond, then inform", "Manifestor":"Inform before you act", "Projector":"Wait for the invitation", "Reflector":"Wait a lunar cycle before big decisions" };
  const NOT = { "Generator":"Frustration", "Manifesting Generator":"Frustration and anger", "Manifestor":"Anger", "Projector":"Bitterness", "Reflector":"Disappointment" };
  const SIG = { "Generator":"Satisfaction", "Manifesting Generator":"Satisfaction and peace", "Manifestor":"Peace", "Projector":"Success", "Reflector":"Surprise" };
  const ps = pers[0], ds = des[0];
  return {
    type, authority, strategy: STRAT[type], notSelf: NOT[type], signature: SIG[type],
    profile: `${ps.line}/${ds.line}`, definition: ["None","Single","Split","Triple split","Quadruple split"][comps] || "Split",
    cross: `${ps.gate}/${pers[1].gate} | ${ds.gate}/${des[1].gate}`,
    pers, des, gates, chans, defined, designDate: dd
  };
}

/* ---------- time zones ---------- */
export function zonedToUTC(y, mo, d, h, mi, tz) { // local wall time in an IANA zone -> Date (UTC)
  let guess = Date.UTC(y, mo - 1, d, h, mi);
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(guess)).map(p => [p.type, p.value]));
    const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute);
    guess += Date.UTC(y, mo - 1, d, h, mi) - asUTC;
  }
  return new Date(guess);
}
