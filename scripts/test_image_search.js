const destinations = [
  { id: 'bangalore-palace', query: 'Bangalore Palace', filename: 'bengaluru.jpg' },
  { id: 'lalbagh-botanical-garden', query: 'Lalbagh Glass House', filename: 'lalbagh.jpg' },
  { id: 'tipu-sultan-summer-palace', query: "Tipu Sultan's Summer Palace, Bangalore", filename: 'tipu_palace.jpg' },
  { id: 'mysuru-palace', query: 'Mysore Palace', filename: 'mysore_palace.jpg' },
  { id: 'srirangapatna-fort', query: 'Ranganathaswamy Temple Srirangapatna', filename: 'srirangapatna.jpg' },
  { id: 'chamundi-hill', query: 'Chamundeshwari Temple Mysore', filename: 'chamundeshwari_temple.jpg' },
  { id: 'somnathpur-chennakesava-temple', query: 'Chennakesava Temple Somanathapura', filename: 'somanathapura.jpg' },
  { id: 'belur-chennakeshava-temple', query: 'Chennakeshava Temple Belur', filename: 'belur.jpg' },
  { id: 'halebidu-hoysaleswara-temple', query: 'Hoysaleswara Temple Halebidu', filename: 'halebidu.jpg' },
  { id: 'shravanabelagola-gommateshwara', query: 'Gommateshwara statue Shravanabelagola', filename: 'shravanabelagola.jpg' },
  { id: 'hampi-vijaya-vittala', query: 'Stone Chariot Hampi', filename: 'hampi_stone_chariot.jpg' },
  { id: 'hampi-virupaksha-temple', query: 'Virupaksha Temple Hampi', filename: 'hampi.jpg' },
  { id: 'matanga-hill-sunrise', query: 'Matanga Hill Hampi', filename: 'matanga_hill.jpg' },
  { id: 'badami-cave-temples', query: 'Badami cave temples', filename: 'badami.jpg' },
  { id: 'pattadakal-monuments', query: 'Pattadakal temple complex', filename: 'pattadakal.jpg' },
  { id: 'aihole-durga-temple', query: 'Durga Temple Aihole', filename: 'aihole.jpg' },
  { id: 'rajas-seat-madikeri', query: "Raja's Seat Madikeri", filename: 'rajas_seat.jpg' },
  { id: 'abbey-falls-coorg', query: 'Abbey Falls Coorg', filename: 'abbey_falls.jpg' },
  { id: 'talacauvery-origin', query: 'Talakaveri temple', filename: 'talacauvery.jpg' },
  { id: 'dubare-elephant-camp', query: 'Dubare elephant camp', filename: 'dubare.jpg' },
  { id: 'mullayanagiri-peak', query: 'Mullayanagiri peak Chikmagalur', filename: 'mullayanagiri.jpg' },
  { id: 'baba-budangiri-dattapeetha', query: 'Baba Budangiri Chikmagalur', filename: 'baba_budangiri.jpg' },
  { id: 'kudremukh-national-park', query: 'Kudremukh peak', filename: 'kudremukh.jpg' },
  { id: 'gokarna-om-beach', query: 'Om Beach Gokarna', filename: 'gokarna.jpg' },
  { id: 'murudeshwar-temple-shiva', query: 'Murudeshwar Shiva Statue', filename: 'murudeshwar.jpg' },
  { id: 'udupi-sri-krishna-matha', query: 'Udupi Sri Krishna Matha', filename: 'udupi.jpg' },
  { id: 'st-marys-island-malpe', query: "St. Mary's Islands", filename: 'st_marys_island.jpg' },
  { id: 'jog-falls-shivamogga', query: 'Jog Falls', filename: 'jog_falls.jpg' },
  { id: 'agumbe-rainforest-sunset', query: 'Agumbe sunset viewpoint', filename: 'agumbe.jpg' },
  { id: 'gol-gumbaz-vijayapura', query: 'Gol Gumbaz Bijapur', filename: 'gol_gumbaz.jpg' },
  { id: 'bidar-fort-mahmud-gawan', query: 'Bidar Fort', filename: 'bidar.jpg' },
  { id: 'dandeli-wildlife-rafting', query: 'Kali River Dandeli rafting', filename: 'dandeli.jpg' }
];

async function searchCommons(query) {
  // Try Wikipedia search or Commons search
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|size|extmetadata|user&iiurlwidth=1280&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'NammaYatraAuditor/1.0 (https://nammayatra.ai)' } });
  const data = await res.json();
  if (!data.query || !data.query.pages) return null;
  const pages = Object.values(data.query.pages);
  // filter for jpg/png and width > 600
  for (const page of pages) {
    if (!page.imageinfo || !page.imageinfo[0]) continue;
    const info = page.imageinfo[0];
    const mime = info.mime || '';
    if (mime.includes('jpeg') || mime.includes('png')) {
      return {
        title: page.title,
        width: info.width,
        height: info.height,
        thumbUrl: info.thumburl || info.url,
        origUrl: info.url,
        descriptionUrl: info.descriptionurl,
        user: info.user,
        license: info.extmetadata?.LicenseShortName?.value || 'CC BY-SA',
        licenseUrl: info.extmetadata?.LicenseUrl?.value || 'https://creativecommons.org/licenses/',
        artist: (info.extmetadata?.Artist?.value || info.user || '').replace(/<[^>]*>/g, '').trim(),
        credit: (info.extmetadata?.Credit?.value || '').replace(/<[^>]*>/g, '').trim()
      };
    }
  }
  return null;
}

async function testAll() {
  console.log('Testing image queries for all 32 destinations...');
  const results = [];
  for (const dest of destinations) {
    const item = await searchCommons(dest.query);
    if (item) {
      console.log(`[OK] ${dest.id}: Found "${item.title}" by ${item.artist} (${item.license})`);
      results.push({ dest, item });
    } else {
      console.log(`[FAILED] ${dest.id}: No image found for "${dest.query}"`);
    }
    // slight delay to be polite to Wikipedia API
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\nFound ${results.length} / ${destinations.length} destination photos.`);
}

testAll();
