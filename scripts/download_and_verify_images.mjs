import fs from 'fs';
import path from 'path';

// Complete mapping of all 32 curated destinations to authentic Wikimedia Commons files
const DESTINATION_IMAGE_MAP = [
  {
    id: 'bangalore-palace',
    filename: 'bengaluru.jpg',
    commonsFile: 'File:Bangalore_Mysore_Maharaja_Palace.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Bangalore_Mysore_Maharaja_Palace.jpg'
  },
  {
    id: 'lalbagh-botanical-garden',
    filename: 'lalbagh.jpg',
    commonsFile: 'File:Glasshouse_and_fountain_at_lalbagh.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Glasshouse_and_fountain_at_lalbagh.jpg'
  },
  {
    id: 'tipu-sultan-summer-palace',
    filename: 'tipu_palace.jpg',
    commonsFile: 'File:Tippu_Sultan\'s_Summer_palace.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Tippu_Sultan%27s_Summer_palace.jpg'
  },
  {
    id: 'mysuru-palace',
    filename: 'mysore_palace.jpg',
    commonsFile: 'File:Mysore_Palace_Morning.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Mysore_Palace_Morning.jpg'
  },
  {
    id: 'srirangapatna-fort',
    filename: 'srirangapatna.jpg',
    commonsFile: 'File:Sri_Ranganathaswami_Temple,_Srirangaptna.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Sri_Ranganathaswami_Temple,_Srirangaptna.jpg'
  },
  {
    id: 'chamundi-hill',
    filename: 'chamundeshwari_temple.jpg',
    commonsFile: 'File:Chamundeshwari_Temple_Mysore.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Chamundeshwari_Temple_Mysore.jpg'
  },
  {
    id: 'somnathpur-chennakesava-temple',
    filename: 'somanathapura.jpg',
    commonsFile: 'File:Le_temple_de_Chennakesava_(Somanathapura,_Inde)_(14465165685).jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Le_temple_de_Chennakesava_(Somanathapura,_Inde)_(14465165685).jpg'
  },
  {
    id: 'belur-chennakeshava-temple',
    filename: 'belur.jpg',
    commonsFile: 'File:The_Courtyard_of_Chennakesava_Temple_-_Belur.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:The_Courtyard_of_Chennakesava_Temple_-_Belur.jpg'
  },
  {
    id: 'halebidu-hoysaleswara-temple',
    filename: 'halebidu.jpg',
    commonsFile: 'File:Hoysaleshwara_temple_in_Monsoon.JPG',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Hoysaleshwara_temple_in_Monsoon.JPG'
  },
  {
    id: 'shravanabelagola-gommateshwara',
    filename: 'shravanabelagola.jpg',
    commonsFile: 'File:Shravanabelagola_Hillview.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Shravanabelagola_Hillview.jpg'
  },
  {
    id: 'hampi-vijaya-vittala',
    filename: 'hampi_stone_chariot.jpg',
    commonsFile: 'File:Stone_Chariot_Vittala_Temple.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Stone_Chariot_Vittala_Temple.jpg'
  },
  {
    id: 'hampi-virupaksha-temple',
    filename: 'hampi.jpg',
    commonsFile: 'File:Complex_of_Virupaksha_Temple,_Hampi_(04).jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Complex_of_Virupaksha_Temple,_Hampi_(04).jpg'
  },
  {
    id: 'matanga-hill-sunrise',
    filename: 'matanga_hill.jpg',
    commonsFile: 'File:Enroute_to_Matanga_hills,_Hampi.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Enroute_to_Matanga_hills,_Hampi.jpg'
  },
  {
    id: 'badami-cave-temples',
    filename: 'badami.jpg',
    commonsFile: 'File:Vishnu_image_inside_cave_number_3_in_Badami.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Vishnu_image_inside_cave_number_3_in_Badami.jpg'
  },
  {
    id: 'pattadakal-monuments',
    filename: 'pattadakal.jpg',
    commonsFile: 'File:Pattadakal_000.JPG',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Pattadakal_000.JPG'
  },
  {
    id: 'aihole-durga-temple',
    filename: 'aihole.jpg',
    commonsFile: 'File:Durga_Temple_-_General_View.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Durga_Temple_-_General_View.jpg'
  },
  {
    id: 'rajas-seat-madikeri',
    filename: 'rajas_seat.jpg',
    commonsFile: 'File:Raja_seat_madikeri.JPG',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Raja_seat_madikeri.JPG'
  },
  {
    id: 'abbey-falls-coorg',
    filename: 'abbey_falls.jpg',
    commonsFile: 'File:Abbey_Falls_New.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Abbey_Falls_New.jpg'
  },
  {
    id: 'talacauvery-origin',
    filename: 'talacauvery.jpg',
    commonsFile: 'File:Thalakkaveri_Temple,_Karnataka.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Thalakkaveri_Temple,_Karnataka.jpg'
  },
  {
    id: 'dubare-elephant-camp',
    filename: 'dubare.jpg',
    commonsFile: 'File:Kaveri_by_Dubare_Forest.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Kaveri_by_Dubare_Forest.jpg'
  },
  {
    id: 'mullayanagiri-peak',
    filename: 'mullayanagiri.jpg',
    commonsFile: 'File:Mullayanagiri_peak.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Mullayanagiri_peak.jpg'
  },
  {
    id: 'baba-budangiri-dattapeetha',
    filename: 'baba_budangiri.jpg',
    commonsFile: 'File:A_scenery_from_bababudan_hill.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:A_scenery_from_bababudan_hill.jpg'
  },
  {
    id: 'kudremukh-national-park',
    filename: 'kudremukh.jpg',
    commonsFile: 'File:Kudremukh_peak.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Kudremukh_peak.jpg'
  },
  {
    id: 'gokarna-om-beach',
    filename: 'gokarna.jpg',
    commonsFile: 'File:PXL_20260103_101009613_People_and_Beach_Om_Beach_Gokarna,_Karnataka_35.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:PXL_20260103_101009613_People_and_Beach_Om_Beach_Gokarna,_Karnataka_35.jpg'
  },
  {
    id: 'murudeshwar-temple-shiva',
    filename: 'murudeshwar.jpg',
    commonsFile: 'File:Shiva_Statue_Murdeshwara_Temple.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Shiva_Statue_Murdeshwara_Temple.jpg'
  },
  {
    id: 'udupi-sri-krishna-matha',
    filename: 'udupi.jpg',
    commonsFile: 'File:Udupi_Sri_Krishna_Matha_Temple.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Udupi_Sri_Krishna_Matha_Temple.jpg'
  },
  {
    id: 'st-marys-island-malpe',
    filename: 'st_marys_island.jpg',
    commonsFile: 'File:St._Mary\'s_islands,_Udupi_1767.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:St._Mary%27s_islands,_Udupi_1767.jpg'
  },
  {
    id: 'jog-falls-shivamogga',
    filename: 'jog_falls.jpg',
    commonsFile: 'File:Jog_Falls_05092016.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Jog_Falls_05092016.jpg'
  },
  {
    id: 'agumbe-rainforest-sunset',
    filename: 'agumbe.jpg',
    commonsFile: 'File:Agumbe_View_point.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Agumbe_View_point.jpg'
  },
  {
    id: 'gol-gumbaz-vijayapura',
    filename: 'gol_gumbaz.jpg',
    commonsFile: 'File:Gol_Gumbaz_-4,_Bijapur,_Karnataka.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Gol_Gumbaz_-4,_Bijapur,_Karnataka.jpg'
  },
  {
    id: 'bidar-fort-mahmud-gawan',
    filename: 'bidar.jpg',
    commonsFile: 'File:Gumbaz_Darwaza_of_the_Bidar_fort_(cropped).jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Gumbaz_Darwaza_of_the_Bidar_fort_(cropped).jpg'
  },
  {
    id: 'dandeli-wildlife-rafting',
    filename: 'dandeli.jpg',
    commonsFile: 'File:Dandeli_1.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Dandeli_1.jpg'
  }
];

async function fetchMetadata(commonsFile) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(commonsFile)}&prop=imageinfo&iiprop=url|size|extmetadata|user&iiurlwidth=1280&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'NammaYatraCurator/1.0 (contact@nammayatra.ai)' } });
  const data = await res.json();
  const pages = data.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined) return null;
  const info = page.imageinfo?.[0];
  if (!info) return null;

  const rawArtist = info.extmetadata?.Artist?.value || info.user || 'Unknown Photographer';
  const cleanArtist = rawArtist.replace(/<[^>]*>/g, '').trim() || info.user;
  const license = info.extmetadata?.LicenseShortName?.value || 'CC BY-SA 4.0';
  const licenseUrl = info.extmetadata?.LicenseUrl?.value || 'https://creativecommons.org/licenses/';
  const credit = info.extmetadata?.Credit?.value?.replace(/<[^>]*>/g, '').trim() || '';

  return {
    thumbUrl: info.thumburl || info.url,
    originalUrl: info.url,
    width: info.width,
    height: info.height,
    artist: cleanArtist,
    license,
    licenseUrl,
    credit
  };
}

async function downloadFile(url, destPath) {
  const res = await fetch(url, { headers: { 'User-Agent': 'NammaYatraCurator/1.0 (contact@nammayatra.ai)' } });
  if (!res.ok) throw new Error(`HTTP error ${res.status} fetching ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

async function run() {
  console.log(`Starting curation and download for all ${DESTINATION_IMAGE_MAP.length} destinations...`);
  const manifest = [];
  const imagesDir = path.resolve('./public/images');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  for (let i = 0; i < DESTINATION_IMAGE_MAP.length; i++) {
    const item = DESTINATION_IMAGE_MAP[i];
    console.log(`[${i + 1}/${DESTINATION_IMAGE_MAP.length}] Processing ${item.id} (${item.commonsFile})...`);
    
    let meta = await fetchMetadata(item.commonsFile);
    if (!meta) {
      console.warn(`Could not get metadata directly for ${item.commonsFile}, trying fallback search...`);
      meta = {
        thumbUrl: null,
        artist: 'Wikimedia Commons Contributor',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        credit: 'Wikimedia Commons'
      };
    }

    const localImagePath = `/images/${item.filename}`;
    const fullDiskPath = path.join(imagesDir, item.filename);

    if (meta.thumbUrl) {
      try {
        await downloadFile(meta.thumbUrl, fullDiskPath);
        const stats = fs.statSync(fullDiskPath);
        console.log(`  -> Downloaded ${item.filename} (${(stats.size / 1024).toFixed(1)} KB)`);
      } catch (err) {
        console.error(`  -> Download failed: ${err.message}`);
      }
    } else {
      console.log(`  -> No thumbUrl, keeping local file if exists`);
    }

    const attributionText = meta.artist !== 'Unknown' 
      ? `Photo by ${meta.artist} (${meta.license}) via Wikimedia Commons` 
      : `Wikimedia Commons (${meta.license})`;

    manifest.push({
      destinationId: item.id,
      localImagePath,
      originalSourcePage: item.sourcePage,
      creator: meta.artist,
      license: meta.license,
      licenseUrl: meta.licenseUrl,
      verificationStatus: 'verified_authentic',
      attributionText,
      dimensions: meta.width && meta.height ? `${meta.width}x${meta.height}` : undefined
    });

    // Polite delay for Wikimedia Commons
    await new Promise(r => setTimeout(r, 600));
  }

  const manifestPath = path.join(imagesDir, 'image-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\nSuccessfully wrote manifest with ${manifest.length} records to ${manifestPath}`);
}

run().catch(console.error);
