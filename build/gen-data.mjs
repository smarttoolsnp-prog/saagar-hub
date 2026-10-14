/* ===========================================================
   SAAGAR — content data generator
   Run:  node build/gen-data.mjs
   Outputs 1000+ item datasets into assets/data/
   Sources (fetched at build time only — nothing loads at runtime):
     quotes.json          JamesFT/Database-Quotes-JSON
     shortjokes.csv       amoudgl/short-jokes-dataset
     countries.json       mledoze/countries
     PeriodicTableJSON    Bowserinator/Periodic-Table-JSON
   =========================================================== */
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'assets/data';
fs.mkdirSync(OUT, { recursive: true });

const SRC = {
  quotes: 'https://cdn.jsdelivr.net/gh/JamesFT/Database-Quotes-JSON@master/quotes.json',
  jokes: 'https://raw.githubusercontent.com/amoudgl/short-jokes-dataset/master/shortjokes.csv',
  countries: 'https://cdn.jsdelivr.net/gh/mledoze/countries@master/countries.json',
  elements: 'https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/master/PeriodicTableJSON.json'
};

async function grab(url, name) {
  const cache = path.join('build', '.cache', name);
  fs.mkdirSync(path.dirname(cache), { recursive: true });
  if (fs.existsSync(cache)) return fs.readFileSync(cache, 'utf8');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const txt = await res.text();
  fs.writeFileSync(cache, txt);
  return txt;
}

/* ---------------- helpers ---------------- */
let seed = 20260926;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function dedupe(arr) {
  const seen = new Set(), out = [];
  for (const v of arr) { const k = String(v).toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, ''); if (k.length < 6 || seen.has(k)) continue; seen.add(k); out.push(v); }
  return out;
}
function clean(s) {
  return String(s).replace(/\s+/g, ' ').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").trim();
}
function num(n) { return Number(n).toLocaleString('en-US'); }
function js(name, varName, payload, comment) {
  const body = '/* ' + comment + ' */\nwindow.' + varName + '=' + JSON.stringify(payload) + ';\n';
  fs.writeFileSync(path.join(OUT, name), body);
  const n = payload.length;
  console.log(`${name.padEnd(16)} ${String(n).padStart(5)} items  ${(body.length / 1024).toFixed(0)} KB`);
  return n;
}

/* ---------------- 1. philosophy (quote + giver) ---------------- */
async function philosophy() {
  const raw = JSON.parse(await grab(SRC.quotes, 'quotes.json'));
  const out = [];
  for (const q of raw) {
    const text = clean(q.quoteText || '');
    const author = clean(q.quoteAuthor || '');
    if (!text || !author) continue;
    if (text.length < 55 || text.length > 240) continue;
    if (author.length > 42) continue;
    if (/^(unknown|anonymous|n\/a|-)$/i.test(author)) continue;
    out.push([text, author]);
  }
  let uniq = dedupe(out.map(o => o[0]));
  const keep = shuffle(out.filter(o => uniq.includes(o[0])));
  return js('philosophy.js', 'SAAGAR_DATA_PHILOSOPHY', keep, 'philosophy [text, giver] — 999+');
}

/* ---------------- 2. jokes ---------------- */
const NEPALI_JOKES = [
  'बुढाले डाक्टरलाई भने — "निद्रा पर्दैन।" डाक्टर — "मोबाइल कहिले राख्नुहुन्छ?" बुढा — "निद्रा नलागेपछि।" 😴',
  'टिचर: "तिम्रो कमजोरी भन।" विद्यार्थी: "साढे तीन बजे पछिको मेरो आँखा।" 😅',
  'साथीले सोध्यो — "पैसा बढ्दै छ कि घट्दै छ?" जवाफ — "बैंकमा घट्दै, सपिङमा बढ्दै।" 💸',
  'बा: "किन ढिलो भयो?" छोरो: "बाटोमा चिनो थियो — School, Slow. त्यसैले स्लो गएँ।" 🐢',
  'होटलमा — "वेटर, सुपमा झिँगा छ!" वेटर: "सर, त्यो फ्री प्रोटिन बोनस हो।" 🍜',
  'आमा: "मोबाइल त्यहीँ राख!" छोरो: "किन?" आमा: "तिम्रो भविष्य त्यहीँ बन्दैछ!" 📱',
  'सर: "तिमी जापान जान्छौ?" विद्यार्थी: "होस्, तर जापानीज आउँदैन।" सर: "जापानमा नेपाली धेरै छन्, के गाह्रो।" ✈️',
  'डाक्टर: "के भाको?" बिरामी: "प्याज काट्दा आँसु आउँछ।" डाक्टर: "त्यो त स्वाभाविक।" 🧅',
  'बुढा: "म तिमीलाई भेट्नु अघि संसारकै खुशी मान्छे थिएँ।" श्रीमती: "अनि अहिले?" बुढा: "त्यो कुरा बिर्सौ न।" 😂',
  'छोरो: "बा, म डाक्टर बन्छु।" बा: "पढ त।" छोरो: "पढ्नु नै छैन, बन्नु छ।" 🩺',
  'साथी: "मेरो बोस भन्छन् मन परेसम्म काम गर।" अर्को: "राम्रो त!" साथी: "उनले मलाई मन पराउन छोडिसके।" 💼',
  'एउटा केटो भन्छ — "मलाई पैसा भन्दा इज्जत ठूलो।" अर्को — "त्यसैले त तेरो खाता खाली छ।" 🏦',
  'नेपाली स्टुडेन्ट: "सर होमवर्क नबुझे।" सर: "कुन प्रश्न?" स्टुडेन्ट: "पहिलो प्रश्न — टाइप गर्नुहोस् भन्ने।" 💻',
  'मोबाइल भन्छ — "म बिना ब्याट्री मर्छु।" तिम्रो बौद्धिकता भन्छ — "म पनि।" 🔋',
  'रिक्सावाला: "कहाँ जाने?" यात्रु: "जहाँ सस्तो हो।" रिक्सावाला: "त्यो त मेरै घर हो।" 🛺',
  'विद्यार्थी: "सर परीक्षामा के आउँछ?" सर: "जे पढ्यो त्यही।" विद्यार्थी: "त्यसो भए म नपढेको पनि आउँछ?" 📚',
  'आमा: "खाना खा।" छोरो: "पछि।" आमा: "पछि त तिमी हजुरआमा हुन्छौ।" 🍚',
  'बजारमा — "भाइ, यो तरकारी ताजा छ?" दोकानदार: "यो भन्दा ताजा त यहाँ आउने मान्छे हो।" 🥬',
  'टिचर: "दुई सर्वनाम भन।" विद्यार्थी: "को, म?" 😆',
  'साथी: "मैले वजन घटाएँ।" अर्को: "कति?" साथी: "स्केलमा भएको ब्याट्री।" ⚖️',
  '"तेरो नाम के हो?" "पहिले त्यो भन जसले धेरै फोन गर्छ।" 📞',
  'हजुरबा: "हाम्रो जमानामा मोबाइल थिएन।" नाति: "त्यसैले त हजुरबा खुशी हुनुहुन्थ्यो।" 👴',
  'सर: "गृहकार्य किन गरेनौ?" विद्यार्थी: "इन्टरनेट थिएन।" सर: "टिकटक कसरी चल्यो?" विद्यार्थी: "त्यसमा इन्टरनेट चाहिँदैन।" 📶',
  'ड्राइभर: "हेलमेट लगाउनुहोस्।" यात्रु: "किन?" ड्राइभर: "पुलिसको चस्मा नबिग्रियोस्।" 🪖',
  '"भाइ, यो स्कुटर कति दिन्छ?" "सर, तेल हाल्नुभयो भने दिन्छ।" 🛵',
  'छोरी: "बा, मलाई ल्यापटप किनिदिनु।" बा: "किन?" छोरी: "पढ्न।" बा: "त्यसो भए किताब किन ल्यापटप?" 💻',
  'कर्मचारी: "सर, तलब बढाउनु।" मालिक: "तिमी कति दिन आउँछौ?" कर्मचारी: "त्यो त सोमबार आउँदा भन्छु।" 📅',
  'एक जना भन्छन् — "म सधैं सत्य बोल्छु।" अर्को — "त्यो पनि एउटा झुट हो।" 🤥',
  'विद्यार्थी: "सर, मैले पढेको बिर्सें।" सर: "कहिले पढ्यौ?" विद्यार्थी: "त्यो पनि बिर्सें।" 🧠',
  'पसले: "के चाहियो?" ग्राहक: "रु. ५ को सामान।" पसले: "त्यसका लागि रु. १० चाहिन्छ।" 🛒',
  'छोरो: "बा, बाइक किन्नु।" बा: "पहिले लाइसेन्स।" छोरो: "चाबी भए पुग्छ नि।" 🏍️',
  'सर: "तिमी सधैं ढिलो किन?" विद्यार्थी: "सर, सधैं भनेको त ३० दिन हो।" ⏰',
  'यात्रु: "बस, यो सिट खाली छ?" कन्डक्टर: "छ, तर तपाईंको बजेटले भरिँदैन।" 🚌',
  'ज्वाइँ: "ससुरा, मलाई जग्गा दिनु।" ससुरा: "मैले त आकाश मागेको थिएँ।" 🌤️',
  '"डाक्टर, मलाई भात खान मन लाग्छ।" "किन खाँदैनौ?" "कसैले पकाउँदैन।" 🍛',
  'आमा: "तिमी सुत्ने बेला भयो।" छोरो: "अनि तिमी किन जागा छौ?" आमा: "म त आमा हुँ।" 🌙',
  'साथी: "मैले जिम जोइन गरें।" अर्को: "कति दिन गयौ?" साथी: "जोइन गरेको दिन।" 🏋️',
  'टिचर: "नेपालको राजधानी?" विद्यार्थी: "सर, काठमाडौं हो कि काठमाडौँ?" टिचर: "यही समस्या भएर मैले पढाउन छोडें।" 🏙️',
  'ग्राहक: "यो मोबाइलमा पानी पस्दैन?" पसले: "पस्दैन।" ग्राहक: "त्यसो भए भिजेको मोबाइल फिर्ता।" 💧'
];

async function jokes() {
  const csv = await grab(SRC.jokes, 'shortjokes.csv');
  const lines = csv.split('\n');
  const picked = [];
  for (let i = 1; i < lines.length && picked.length < 6000; i++) {
    const line = lines[i];
    if (!line) continue;
    const c = line.indexOf(',');
    if (c < 0) continue;
    let j = line.slice(c + 1).trim();
    if (j.startsWith('"')) {
      j = j.slice(1);
      if (j.endsWith('"')) j = j.slice(0, -1);
      j = j.replace(/""/g, '"');
    }
    j = clean(j);
    if (j.length < 45 || j.length > 175) continue;
    if (/https?:|www\.|@|\.com|reddit|@"|\?\?/.test(j)) continue;
    if (!/[a-z]/.test(j)) continue;
    picked.push(j);
  }
  let list = dedupe(picked);
  list = shuffle(list).slice(0, 1200);
  const all = NEPALI_JOKES.concat(list);
  return js('jokes.js', 'SAAGAR_DATA_JOKES', dedupe(all), 'jokes — 999+ (Nepali + English)');
}

/* ---------------- 3. facts ---------------- */
const CORE_FACTS = [
  '🦈 Sharks are older than trees and older than Saturn\u2019s rings.',
  '🍯 Honey never spoils — 3,000-year-old honey from Egyptian tombs was still edible.',
  '🐙 An octopus has three hearts, blue blood and nine brains.',
  '🥵 A day on Venus is longer than its year.',
  '🍌 Bananas are berries. Strawberries are not.',
  '🌌 There are more stars in the universe than grains of sand on every beach on Earth.',
  '⚡ A lightning bolt is about five times hotter than the surface of the Sun.',
  '❤️ Your heart beats about 100,000 times a day — 2.5 billion times in a lifetime.',
  '🧊 Antarctica is the largest desert on Earth — deserts are about rainfall, not heat.',
  '🔺 Nepal\u2019s flag is the only non-rectangular national flag in the world.',
  '🧠 Your brain is about 2% of your body weight but burns 20% of your energy.',
  '💧 Hot water can freeze faster than cold water — the Mpemba effect.',
  '🌍 Earth is the only planet not named after a god.',
  '🐘 An elephant\u2019s trunk has around 40,000 muscles — your whole body has about 600.',
  '🌞 Light from the Sun takes 8 minutes 20 seconds to reach you.',
  '🌙 The Moon drifts about 3.8 cm further from Earth every year.',
  '🕳️ A black hole\u2019s gravity is so strong that not even light escapes.',
  '🌊 More than 80% of the ocean is unexplored.',
  '🦴 A human baby is born with about 300 bones; adults have 206.',
  '👀 Your eyes can distinguish about 10 million colours.',
  '🦷 Tooth enamel is the hardest substance your body makes.',
  '🫀 Your blood vessels stretched end to end would circle Earth about 2.5 times.',
  '🧬 Humans share roughly 60% of their DNA with bananas and 98.8% with chimpanzees.',
  '🐝 Bees can recognise human faces.',
  '🐦 A hummingbird\u2019s heart can beat over 1,200 times a minute.',
  '🦐 The pistol shrimp\u2019s snap is louder than a jet engine and creates light.',
  '🐌 A snail can sleep for three years.',
  '🦩 Flamingos are pink because of the shrimp they eat.',
  '🐜 Ants never sleep and can lift 50 times their body weight.',
  '🦈 Sharks can detect a single drop of blood in 100 litres of water.',
  '🌋 The Pacific Ring of Fire holds about 75% of the world\u2019s volcanoes.',
  '🏔️ Everest grows about 4 mm taller every year.',
  '🌡️ The coldest place on Earth, Antarctica, hit \u221289.2\u00B0C in 1983.',
  '🔥 The hottest recorded air temperature was 56.7\u00B0C in Death Valley, USA.',
  '🌧️ Mawsynram in India is the wettest place on Earth — about 11,870 mm of rain a year.',
  '🏜️ The Sahara is roughly the size of the United States.',
  '🗺️ Russia is wider than Pluto.',
  '🇨🇦 Canada has more lakes than the rest of the world combined.',
  '🇦🇺 Australia is wider than the Moon.',
  '🌏 Only about 5% of the ocean floor has been mapped in detail.',
  '📚 The Library of Congress holds over 170 million items.',
  '🗼 The Eiffel Tower grows about 15 cm taller in summer.',
  '🏛️ The Great Wall of China is over 21,000 km long including all branches.',
  '⚔️ The shortest war in history lasted 38 minutes — Britain vs Zanzibar, 1896.',
  '👑 Cleopatra lived closer to the invention of the iPhone than to the building of the Great Pyramid.',
  '🦕 Stegosaurus lived further from T. rex than T. rex is from you.',
  '🎓 Oxford University is older than the Aztec Empire.',
  '🧱 The Great Pyramid was the tallest building on Earth for 3,800 years.',
  '🏰 France has more time zones than Russia — 12 to 11.',
  '🌐 The first website went live in 1991.',
  '📧 The first email was sent in 1971.',
  '💾 The first 1 GB hard drive (1980) weighed over 200 kg and cost $40,000.',
  '📱 Your phone has more computing power than all of NASA had in 1969.',
  '🎮 The first video game, Tennis for Two, came out in 1958.',
  '🖥️ A single modern smartphone chip holds over 15 billion transistors.',
  '🔋 The first solar cell was built in 1883.',
  '💡 An average LED bulb uses 90% less energy than an incandescent one.',
  '🚀 Escape velocity from Earth is 11.2 km per second.',
  '🛰️ About 6,000 satellites orbit Earth — most of them dead.',
  '🌕 Twelve people have walked on the Moon.',
  '🇳🇵 Nepal was never colonised by any country.',
  '🏔️ Eight of the world\u2019s ten highest peaks sit in Nepal.',
  '🕉️ Lumbini in Nepal is the birthplace of Gautama Buddha.',
  '⏱️ Nepal\u2019s time zone is UTC+5:45 — one of only three :45 offsets on Earth.',
  '📅 The Bikram Sambat calendar runs about 56.7 years ahead of the Gregorian.',
  '🐂 The one-horned rhinoceros in Chitwan was brought back from under 100 animals.',
  '🌸 Nepal has over 6,000 species of flowering plants.',
  '🐦 Nepal has over 880 species of birds — more than all of Europe.',
  '🏞️ Nepal\u2019s Kali Gandaki is among the deepest gorges on Earth.',
  '🗻 Nepal contains 1,310 peaks above 6,000 m.',
  '🌊 The Karnali is Nepal\u2019s longest river.',
  '🏛️ Kathmandu Valley has seven UNESCO World Heritage sites.',
  '🐆 Snow leopards in the Himalayas can leap six times their body length.',
  '🧗 Sagarmatha National Park was Nepal\u2019s first national park.',
  '🫁 Lungs are the only organ that can float on water.',
  '🦵 Your femur is stronger than concrete of the same weight.',
  '🧂 Your body contains enough salt to fill a small salt shaker.',
  '💤 You spend about a third of your life asleep.',
  '🥶 Goosebumps are a leftover reflex from when our ancestors had fur.',
  '🦷 You will produce about 20,000 litres of saliva in a lifetime.',
  '👃 Your nose can remember 50,000 different scents.',
  '👁️ You blink about 20 times a minute — 10 million times a year.',
  '🩸 Red blood cells travel your whole body in about 60 seconds.',
  '🍽️ Your stomach lining replaces itself every few days so it does not digest itself.',
  '🧊 Ice is 9% less dense than water, which is why it floats.',
  '🌈 A rainbow is actually a full circle — the ground hides the rest.',
  '🌩️ Thunder is caused by lightning heating air 5x hotter than the Sun.',
  '☀️ The Sun is 99.86% of all the mass in the solar system.',
  '🌑 If the Sun vanished, we would not know for 8 minutes.',
  '🪐 Saturn would float in water.',
  '🔭 A day on Jupiter lasts under 10 hours — the fastest spin of any planet.',
  '☄️ Halley\u2019s Comet returns every 76 years; it comes back in 2061.',
  '🌠 About 100 tonnes of space dust hits Earth every day.',
  '🧲 Earth\u2019s magnetic north has drifted over 1,000 km in the last century.',
  '🌊 The tallest waterfall, Angel Falls, drops 979 m.',
  '🏝️ There are more than 30,000 islands in Indonesia.',
  '🐜 Termites build mounds taller than a human, relative to their own size.',
  '🦋 Butterflies taste with their feet.',
  '🐍 Some snakes can go two years without eating.',
  '🦜 Parrots can live over 80 years.',
  '🐻 Polar bear skin is black and its fur is transparent.',
  '🦒 A giraffe has the same number of neck bones as you — seven.',
  '🐳 A blue whale\u2019s heart is the size of a small car.',
  '🐯 A tiger\u2019s skin is striped, not just its fur.',
  '🦉 Owls cannot move their eyeballs — they turn their heads up to 270\u00B0.',
  '🐧 Emperor penguins can dive deeper than 500 m.',
  '🐢 Some tortoises live over 180 years.',
  '🌱 Bamboo can grow almost 1 metre in a day.',
  '🌵 A cactus can store thousands of litres of water.',
  '🌳 A single mature tree can release 100,000 litres of oxygen a year.',
  '🍄 The largest living organism on Earth is a fungus in Oregon, 9 km² wide.',
  '🌾 Rice feeds more than half the world\u2019s population.',
  '🐝 One bee visits 50\u2013100 flowers per trip and makes a twelfth of a teaspoon of honey in its life.',
  '☕ Coffee is the second-most traded commodity after oil in some rankings.',
  '🍫 Chocolate was used as currency by the Aztecs.',
  '🧊 About 2 billion people drink water from a source contaminated with faeces.',
  '🚂 The first passenger railway opened in 1825 in England.',
  '✈️ A plane\u2019s cabin air is refreshed every 2\u20133 minutes.',
  '🚗 The first car crash happened in 1891 at 6 km/h.',
  '🛳️ The Titanic\u2019s whistle could be heard 16 km away.',
  '🚄 Japan\u2019s Shinkansen has carried over 10 billion passengers with zero fatal derailments.',
  '🎹 A grand piano has over 12,000 parts.',
  '🎻 Stradivarius violins are over 300 years old and still unmatched.',
  '🖌️ The Mona Lisa has no eyebrows.',
  '🗿 Mount Rushmore took 14 years to carve.',
  '📷 The first photograph took 8 hours of exposure.',
  '🎬 The first feature film was made in 1906.',
  '🎵 Music can lower cortisol, your stress hormone.',
  '😀 It takes 17 muscles to smile and 43 to frown.',
  '🛌 You are about 1 cm taller in the morning than at night.',
  '🧠 Your brain generates about 20 watts of power — enough for a dim bulb.',
  '🗣️ There are about 7,000 living languages on Earth.',
  '📖 English adds roughly 1,000 new words every year.',
  '🧮 Zero was formalised as a number in India in the 7th century.',
  '🔢 A googol is 1 followed by 100 zeros.',
  '♾️ There are infinitely many prime numbers — Euclid proved it 2,300 years ago.',
  '🎲 The chances of a perfect March Madness bracket are 1 in 9.2 quintillion.',
  '🃏 A deck of cards has more shuffles than atoms in the Milky Way.',
  '⏳ One million seconds is 11.5 days; one billion is 31.7 years.',
  '💸 Compound interest doubles money roughly every 72/years(rate) years.',
  '🏦 Nepal\u2019s VAT rate is 13%.',
  '⚖️ In Nepal, 1 tola of gold is 11.6638 grams.',
  '🗺️ One ropani of land equals 16 aana, or about 508.74 m².',
  '📐 One bigha equals 13.31 ropani — about 6,772 m².',
  '🕰️ A year on Mercury lasts 88 Earth days.',
  '🌧️ The smell of rain on dry earth is called petrichor.',
  '🔊 Sound travels about 4 times faster in water than in air.',
  '🧊 Cold water is denser than warm water — except below 4\u00B0C.',
  '🌡️ Absolute zero is \u2212273.15\u00B0C — colder than anywhere in the universe.',
  '⚛️ An atom is 99.9999999999996% empty space.',
  '🧪 Water is the only common substance found naturally as solid, liquid and gas.',
  '🌍 Earth spins at about 1,670 km/h at the equator.',
  '🌑 You would weigh about one-sixth as much on the Moon.',
  '🚀 A rocket must reach 28,000 km/h to stay in Earth orbit.',
  '🕳️ The deepest point in the ocean, Challenger Deep, is about 11 km down.',
  '🏔️ Mauna Kea in Hawaii is taller than Everest measured from its base.',
  '🌐 The internet carries over 400 terabits per second of traffic.',
  '📊 There are over 1.1 billion websites on the internet.',
  '🔍 Google processes around 100,000 searches every second.',
  '📲 There are more mobile phones on Earth than people.',
  '⌨️ The QWERTY layout was designed to slow typists down.',
  '🐛 The first computer "bug" was a real moth, found in 1947.',
  '🖱️ The computer mouse was invented in 1964.',
  '📺 The average person watches about 3 hours of video a day.',
  '🎧 Headphones were invented for telephone operators.',
  '💾 A QR code can hold up to 4,296 characters.'
];

async function facts() {
  const countries = JSON.parse(await grab(SRC.countries, 'countries.json'));
  const gen = [];
  const push = (s) => { if (s && s.length > 20 && !s.includes('undefined') && !s.includes('null')) gen.push(s); };
  for (const c of countries) {
    const n = c.name.common;
    const cap = (c.capital || [])[0];
    const cur = Object.values(c.currencies || {})[0];
    const langs = Object.values(c.languages || {});
    const cc = (c.callingCodes || c.idd && c.idd.root ? (c.idd.suffixes && c.idd.suffixes.length === 1 ? [c.idd.root + c.idd.suffixes[0]] : [c.idd.root]) : [])[0];
    const pop = c.population;
    const area = c.area;
    const dem = c.demonyms && c.demonyms.eng && c.demonyms.eng.m;
    if (cap) push(`🏙️ The capital of ${n} is ${cap}.`);
    if (cur) push(`💰 ${n} uses the ${cur.name} (${cur.symbol || 'no symbol'}) as currency.`);
    if (langs.length) push(`🗣️ Official language${langs.length > 1 ? 's' : ''} of ${n}: ${langs.slice(0, 4).join(', ')}.`);
    if (cc) push(`☎️ The international dialling code for ${n} is +${cc}.`);
    if (pop) push(`👥 About ${num(pop)} people live in ${n}.`);
    if (area) push(`🗺️ ${n} covers ${num(area)} km² of land.`);
    if (c.borders) push(`🧭 ${n} shares a land border with ${c.borders.length} ${c.borders.length === 1 ? 'country' : 'countries'}.`);
    if (c.car && c.car.side) push(`🚗 In ${n}, traffic drives on the ${c.car.side} side of the road.`);
    if (derived(c)) push(`🌐 ${n} uses .${c.tld[0].replace('.', '')} as its internet country code.`);
    if (dem) push(`🪪 People of ${n} are called ${dem}.`);
    if (c.region) push(`📍 ${n} sits in ${c.subregion || c.region}.`);
    if (c.fifa) push(`⚽ The FIFA code for ${n} is ${c.fifa}.`);
  }
  const seedFacts = CORE_FACTS.map(f => f);
  let list = shuffle(dedupe(seedFacts)).slice(0, 160)
    .concat(shuffle(dedupe(gen)));
  return js('facts.js', 'SAAGAR_DATA_FACTS', list, 'WOW facts — 999+');
}
function derived(c) { return c.tld && c.tld.length; }

/* ---------------- 4. GK (question / answer pairs) ---------------- */
const NEPAL_GK = [
  ['What is the highest mountain in the world?', 'Mount Everest (Sagarmatha) — 8,848.86 m'],
  ['What is the capital city of Nepal?', 'Kathmandu'],
  ['What is Nepal\u2019s national flower?', 'Rhododendron (Lali Gurans)'],
  ['What is Nepal\u2019s national bird?', 'Himalayan Monal (Danphe)'],
  ['What is Nepal\u2019s national colour?', 'Crimson (Simrik)'],
  ['What is Nepal\u2019s national animal?', 'Cow'],
  ['How many UNESCO World Heritage sites are in the Kathmandu Valley?', 'Seven'],
  ['Where was Gautama Buddha born?', 'Lumbini, Nepal'],
  ['Which calendar does Nepal officially follow?', 'Bikram Sambat'],
  ['What is Nepal\u2019s time zone?', 'UTC+5:45'],
  ['Which is Nepal\u2019s longest river?', 'Karnali'],
  ['Which is the largest lake in Nepal?', 'Rara Lake'],
  ['Which is Nepal\u2019s largest national park?', 'Bardiya National Park'],
  ['How many provinces does Nepal have?', 'Seven'],
  ['When did Nepal become a federal republic?', '2008'],
  ['What does Sagarmatha mean?', 'Forehead of the sky'],
  ['Which district is Mount Everest in?', 'Solukhumbu'],
  ['What is Nepal\u2019s official currency?', 'Nepalese Rupee (NPR)'],
  ['What is the national sport of Nepal?', 'Volleyball'],
  ['Which language is Nepal\u2019s official language?', 'Nepali'],
  ['What is the one-horned rhinoceros\u2019 main home in Nepal?', 'Chitwan National Park'],
  ['Which is the deepest gorge in Nepal?', 'Kali Gandaki Gorge'],
  ['What is the name of Nepal\u2019s parliament?', 'Federal Parliament (Sansad)'],
  ['Which city is called the City of Lakes?', 'Pokhara'],
  ['What is the highest waterfall in Nepal?', 'Hyatrung Jharana'],
  ['How many peaks above 8,000 m are in Nepal?', 'Eight'],
  ['Which is Nepal\u2019s smallest district by area?', 'Bhaktapur'],
  ['What is the Nepali name for Mount Everest?', 'Sagarmatha'],
  ['When is Nepali New Year?', 'Mid-April (Baisakh 1)'],
  ['What is Dashain\u2019s biggest festival day called?', 'Vijaya Dashami'],
  ['Which festival is the festival of lights in Nepal?', 'Tihar (Deepawali)'],
  ['What does "Himalaya" mean?', 'Abode of snow'],
  ['Which river forms part of Nepal\u2019s border with India?', 'Mechi and Mahakali'],
  ['What is Nepal\u2019s national anthem called?', 'Sayaun Thunga Phulka'],
  ['How many districts does Nepal have?', '77'],
  ['What is the currency symbol of Nepal?', 'रु / Rs'],
  ['Which is the highest lake in Nepal?', 'Tilicho Lake'],
  ['What percentage of Nepal is forest?', 'About 45%'],
  ['Which is Nepal\u2019s busiest international airport?', 'Tribhuvan International Airport'],
  ['What is the name of Nepal\u2019s central bank?', 'Nepal Rastra Bank'],
  ['Which is Nepal\u2019s national highway, longest east-west road?', 'Mahendra Highway (East–West Highway)'],
  ['Which animal is the symbol of Nepal\u2019s government?', 'Cow (national animal)'],
  ['What is the Hindu holy site in Nepal with the Pashupatinath temple?', 'Pashupatinath, Kathmandu'],
  ['Which Nepali sport is played with a small ball and a paddle?', 'Dandi Biyo / Kabaddi variants'],
  ['What is the Nepali greeting word during Dashain for elders\u2019 blessings?', 'Dashain ko Tika'],
  ['Which is the oldest city in Nepal?', 'Kathmandu (Kantipur)'],
  ['What is the name of Nepal\u2019s biggest festival of the Newar community?', 'Bisket Jatra'],
  ['Which is the highest pass in Nepal?', 'Thorong La'],
  ['What is Nepal\u2019s area in square kilometres?', '147,516 km²'],
  ['Which country is south of Nepal?', 'India'],
  ['Which country is north of Nepal?', 'China (Tibet)']
];

async function gk() {
  const countries = JSON.parse(await grab(SRC.countries, 'countries.json'));
  const elementsRaw = JSON.parse(await grab(SRC.elements, 'elements.json'));
  const elements = Array.isArray(elementsRaw) ? elementsRaw : (elementsRaw.elements || []);
  const out = [];
  const add = (q, a) => { if (q && a && a !== 'undefined') out.push([q, a]); };

  NEPAL_GK.forEach(p => add(p[0], p[1]));

  for (const c of countries) {
    const n = c.name.common;
    const cap = (c.capital || [])[0];
    const cur = Object.values(c.currencies || {})[0];
    const langs = Object.values(c.languages || {});
    const cc = c.idd && c.idd.suffixes && c.idd.suffixes.length === 1 ? c.idd.root + c.idd.suffixes[0] : (c.idd ? c.idd.root : null);
    const dem = c.demonyms && c.demonyms.eng && c.demonyms.eng.m;
    if (cap) add(`What is the capital of ${n}?`, cap);
    if (cur) add(`What currency does ${n} use?`, `${cur.name} (${cur.symbol || '—'})`);
    if (langs.length) add(`Which language is official in ${n}?`, langs.slice(0, 3).join(', '));
    if (cc) add(`Which country has the dialling code ${cc}?`, n);
    if (dem) add(`What are people from ${n} called?`, dem);
    if (c.car && c.car.side) add(`Which side of the road does ${n} drive on?`, c.car.side);
    if (c.borders && c.borders.length) add(`How many countries border ${n}?`, String(c.borders.length));
    if (c.region) add(`Which continent/region is ${n} in?`, c.subregion || c.region);
  }

  for (const e of elements) {
    add(`What is the chemical symbol for ${e.name}?`, e.symbol);
    add(`What is the atomic number of ${e.name}?`, String(e.number));
    add(`Which element has atomic number ${e.number}?`, e.name);
    if (e.category) add(`What category of element is ${e.name}?`, e.category);
    if (e.phase) add(`At room temperature, ${e.name} is a…`, e.phase);
  }

  const list = shuffle(out).slice(0, 1300);
  return js('gk.js', 'SAAGAR_DATA_GK', list, 'GK question/answer pairs — 999+');
}

/* ---------------- run ---------------- */
const p = await philosophy();
const f = await facts();
const j = await jokes();
const g = await gk();
console.log('\ncounts:', { philosophy: p, facts: f, jokes: j, gk: g });
if (p < 999 || f < 999 || j < 999 || g < 999) { console.error('!! below 999 in at least one dataset'); process.exit(1); }
