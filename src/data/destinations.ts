/**
 * Curated Karnataka Destination Dataset
 * 
 * Verified geographic coordinates, regional categorizations, visit durations,
 * and travel constraints.
 * Data sources: Karnataka Tourism (KSTDC), Archaeological Survey of India (ASI).
 * Last verified: 2026.
 */

export type DestinationType =
  | 'attraction'
  | 'restaurant'
  | 'cafe'
  | 'bakery'
  | 'street_food'
  | 'food_market'
  | 'food_experience';

export interface Destination {
  id: string;
  name: string;
  kannadaName?: string;
  district: string;
  region: 'Bengaluru & South' | 'Mysuru & Cauvery' | 'Western Ghats & Hills' | 'Coastal Karnataka' | 'Central & Heritage' | 'Northern Heritage';
  lat: number;
  lng: number;
  categories: Array<'Heritage' | 'Nature' | 'Adventure' | 'Beaches' | 'Food & Culture' | 'Spiritual'>;
  destinationType?: DestinationType;
  cuisine?: string;
  speciality?: string;
  shortDescription: string;
  historicalSignificance?: string;
  recommendedDurationMinutes: number;
  avgEntryFeeINR: number;
  bestTimeToVisit: string;
  knownConstraints?: string[];
  localSpecialties?: string[];
  accentColor: string; // Hex for badge/card accent
  imageUrl: string;
  objectPosition?: string;
}

export const KARNATAKA_DESTINATIONS: Destination[] = [
  // 1. Bengaluru & South
  {
    id: 'bangalore-palace',
    name: 'Bengaluru Palace',
    kannadaName: 'ಬೆಂಗಳೂರು ಅರಮನೆ',
    district: 'Bengaluru Urban',
    region: 'Bengaluru & South',
    lat: 12.9988,
    lng: 77.5921,
    categories: ['Heritage', 'Food & Culture'],
    shortDescription: 'Tudor-style royal residence built by Chamaraja Wodeyar in 1887 with fortified towers and wood carvings.',
    historicalSignificance: 'Inspired by Windsor Castle, showcasing 19th-century royal lifestyle of the Wadiyar dynasty.',
    recommendedDurationMinutes: 120,
    avgEntryFeeINR: 250,
    bestTimeToVisit: '10:00 AM - 5:30 PM (Year-round)',
    knownConstraints: ['Camera fee applicable', 'Audio guide recommended', 'Allow 30 min for parking in peak traffic'],
    localSpecialties: ['Filter Coffee', 'Benne Dosa at nearby Malleshwaram'],
    accentColor: '#173D2E',
    imageUrl: '/images/bengaluru.jpg',
    objectPosition: 'center 20%'
  },
  {
    id: 'lalbagh-botanical-garden',
    name: 'Lalbagh Botanical Garden & Glass House',
    kannadaName: 'ಲಾಲ್‌ಬಾಗ್ ಸಸ್ಯಶಾಸ್ತ್ರೀಯ ಉದ್ಯಾನ',
    district: 'Bengaluru Urban',
    region: 'Bengaluru & South',
    lat: 12.9507,
    lng: 77.5848,
    categories: ['Nature', 'Heritage'],
    shortDescription: '240-acre botanical garden commissioned by Hyder Ali in 1760 with rare tropical flora and iconic London Crystal Palace-inspired Glass House.',
    historicalSignificance: 'Houses 1,854 species of plants and a 3,000-million-year-old Peninsular Gneiss rock.',
    recommendedDurationMinutes: 120,
    avgEntryFeeINR: 30,
    bestTimeToVisit: '6:00 AM - 9:00 AM or 4:00 PM - 6:30 PM',
    knownConstraints: ['Heavy morning walking crowd', 'Flower shows occur during Republic Day and Independence Day weeks'],
    localSpecialties: ['MTR (Mavalli Tiffin Room) near West Gate for Rava Idli'],
    accentColor: '#102D23',
    imageUrl: '/images/lalbagh.jpg'
  },
  {
    id: 'tipu-sultan-summer-palace',
    name: "Tipu Sultan's Summer Palace",
    kannadaName: 'ಟಿಪ್ಪು ಸುಲ್ತಾನರ ಬೇಸಿಗೆ ಅರಮನೆ',
    district: 'Bengaluru Urban',
    region: 'Bengaluru & South',
    lat: 12.9593,
    lng: 77.5737,
    categories: ['Heritage'],
    shortDescription: 'Indo-Islamic wooden summer residence completed in 1791 by Tipu Sultan, built entirely of teakwood with carved pillars.',
    historicalSignificance: 'Headquarters of Tipu Sultan during the Anglo-Mysore wars.',
    recommendedDurationMinutes: 60,
    avgEntryFeeINR: 25,
    bestTimeToVisit: '9:00 AM - 5:00 PM',
    knownConstraints: ['Narrow old city streets; best approached via metro (KR Market) or cab'],
    localSpecialties: ['KR Market flower market visit nearby in early morning'],
    destinationType: 'attraction',
    accentColor: '#B9684B',
    imageUrl: '/images/tipu_palace.jpg'
  },

  // 2. Mysuru & Cauvery Belt
  {
    id: 'mysuru-palace',
    name: 'Mysuru Palace (Amba Vilas)',
    kannadaName: 'ಮೈಸೂರು ಅರಮನೆ',
    district: 'Mysuru',
    region: 'Mysuru & Cauvery',
    lat: 12.3052,
    lng: 76.6552,
    categories: ['Heritage', 'Food & Culture'],
    shortDescription: 'Spectacular Indo-Saracenic royal palace designed by Henry Irwin with dome pavilions, stained glass, and Durbar halls.',
    historicalSignificance: 'Seat of the Kingdom of Mysore and royal residence of the Wadiyars.',
    recommendedDurationMinutes: 150,
    avgEntryFeeINR: 100,
    bestTimeToVisit: '10:00 AM - 5:30 PM; Illuminated on Sundays & public holidays from 7:00 PM to 7:45 PM',
    knownConstraints: ['Footwear must be deposited outside', 'Security screening required', 'High festival footfall during Dasara'],
    localSpecialties: ['Authentic Mysore Pak (Guru Sweet Mart)', 'Mylari Dosa at Nazarbad'],
    accentColor: '#D8A735',
    imageUrl: '/images/mysore_palace.jpg'
  },
  {
    id: 'srirangapatna-fort',
    name: 'Srirangapatna Island Fortress & Ranganathaswamy Temple',
    kannadaName: 'ಶ್ರೀರಂಗಪಟ್ಟಣ',
    district: 'Mandya',
    region: 'Mysuru & Cauvery',
    lat: 12.4237,
    lng: 76.6833,
    categories: ['Heritage', 'Spiritual'],
    shortDescription: 'Historic river island formed by the Cauvery, featuring 9th-century Sri Ranganathaswamy Temple, Tipu Sultan’s Gumbaz, and battle ruins.',
    historicalSignificance: 'De facto capital of Mysore under Hyder Ali and Tipu Sultan; siege site of 1799.',
    recommendedDurationMinutes: 150,
    avgEntryFeeINR: 30,
    bestTimeToVisit: '8:30 AM - 5:30 PM (Morning preferred for temple)',
    knownConstraints: ['Temple dress code required in inner sanctum', 'Spread across multiple points on the island'],
    localSpecialties: ['Maddur Vada along the old Bengaluru-Mysuru highway'],
    accentColor: '#B9684B',
    imageUrl: '/images/srirangapatna.jpg'
  },
  {
    id: 'chamundi-hill',
    name: 'Chamundeshwari Temple & Nandi Bull',
    kannadaName: 'ಚಾಮುಂಡಿ ಬೆಟ್ಟ',
    district: 'Mysuru',
    region: 'Mysuru & Cauvery',
    lat: 12.2743,
    lng: 76.6708,
    categories: ['Spiritual', 'Heritage'],
    shortDescription: 'Sacred hilltop shrine dedicated to Goddess Chamundeshwari overlooking Mysuru city, featuring a monolithic 16-foot Nandi bull.',
    historicalSignificance: 'Centuries-old patron deity of the Mysore royal kings.',
    recommendedDurationMinutes: 90,
    avgEntryFeeINR: 0,
    bestTimeToVisit: '6:30 AM - 1:00 PM or 4:00 PM - 8:30 PM',
    knownConstraints: ['Winding ghat road', '1,000 steps option available for pilgrims', 'Long queues during weekends'],
    localSpecialties: ['Panoramas of Mysuru city from View Point'],
    accentColor: '#D8A735',
    imageUrl: '/images/chamundeshwari_temple.jpg',
    objectPosition: 'center 20%'
  },
  {
    id: 'somnathpur-chennakesava-temple',
    name: 'Chennakesava Temple at Somanathapura',
    kannadaName: 'ಸೋಮನಾಥಪುರ ಕೇಶವ ದೇವಾಲಯ',
    district: 'Mysuru',
    region: 'Mysuru & Cauvery',
    lat: 12.2762,
    lng: 76.8816,
    categories: ['Heritage'],
    shortDescription: 'UNESCO World Heritage Site; pristine 13th-century trikuta Hoysala star-shaped temple with intricate soapstone friezes.',
    historicalSignificance: 'Built in 1258 CE by General Somanatha under Hoysala King Narasimha III.',
    recommendedDurationMinutes: 90,
    avgEntryFeeINR: 25,
    bestTimeToVisit: '9:00 AM - 5:30 PM (Soft morning light ideal for photography)',
    knownConstraints: ['No active worship inside; footwear deposit mandatory', 'About 35 km east of Mysuru city'],
    localSpecialties: ['Country jaggery and tender coconut along Bannur road'],
    accentColor: '#173D2E',
    imageUrl: '/images/somanathapura.jpg'
  },

  // 3. Central & Hoysala Heritage
  {
    id: 'belur-chennakeshava-temple',
    name: 'Belur Chennakeshava Temple',
    kannadaName: 'ಬೇಲೂರು ಚೆನ್ನಕೇಶವ ದೇವಾಲಯ',
    district: 'Hassan',
    region: 'Central & Heritage',
    lat: 13.1627,
    lng: 75.8601,
    categories: ['Heritage', 'Spiritual'],
    shortDescription: 'UNESCO World Heritage Hoysala masterpiece built in 1117 CE celebrating King Vishnuvardhana’s victory, famed for bracket Madanika sculptures.',
    historicalSignificance: 'Took 103 years to complete; pinnacle of Hoysala stone carving craft.',
    recommendedDurationMinutes: 120,
    avgEntryFeeINR: 0,
    bestTimeToVisit: '7:30 AM - 7:30 PM (Late afternoon lighting is sublime)',
    knownConstraints: ['Hiring an ASI-certified guide is strongly recommended to decode friezes'],
    localSpecialties: ['Malnad Akki Roti with bamboo shoot curry (seasonal)'],
    accentColor: '#B9684B',
    imageUrl: '/images/belur.jpg'
  },
  {
    id: 'halebidu-hoysaleswara-temple',
    name: 'Halebidu Hoysaleswara Temple',
    kannadaName: 'ಹಳೇಬೀಡು ಹೊಯ್ಸಳೇಶ್ವರ ದೇವಾಲಯ',
    district: 'Hassan',
    region: 'Central & Heritage',
    lat: 13.2166,
    lng: 75.9939,
    categories: ['Heritage'],
    shortDescription: 'Twin temple dedicated to Hoysaleswara and Shantaleswara with over 20,000 relief panels depicting epic Ramayana and Mahabharata episodes.',
    historicalSignificance: 'Ancient capital of the Hoysala Empire, formerly known as Dorasamudra.',
    recommendedDurationMinutes: 120,
    avgEntryFeeINR: 25,
    bestTimeToVisit: '8:00 AM - 6:00 PM',
    knownConstraints: ['16 km from Belur; best combined in a single day excursion'],
    localSpecialties: ['Fresh tender coconut, local jackfruit chips'],
    accentColor: '#102D23',
    imageUrl: '/images/halebidu.jpg'
  },
  {
    id: 'shravanabelagola-gommateshwara',
    name: 'Shravanabelagola Gommateshwara Colossus',
    kannadaName: 'ಶ್ರವಣಬೆಳಗೊಳ ಗೊಮ್ಮಟೇಶ್ವರ',
    district: 'Hassan',
    region: 'Central & Heritage',
    lat: 12.8576,
    lng: 76.4862,
    categories: ['Heritage', 'Spiritual'],
    shortDescription: '57-foot world’s tallest monolithic free-standing stone statue of Lord Bahubali carved in 981 CE atop Vindhyagiri hill.',
    historicalSignificance: 'Commissioned by Chavundaraya, prime minister of the Western Ganga Dynasty; sacred Jain pilgrimage.',
    recommendedDurationMinutes: 150,
    avgEntryFeeINR: 0,
    bestTimeToVisit: '6:30 AM - 10:30 AM or 4:30 PM - 6:30 PM (Granite steps get hot under sun)',
    knownConstraints: ['650 rock-cut steps without footwear; socks recommended on sunny days; doli (palanquin) available for elders'],
    localSpecialties: ['Traditional Satvik meals in pilgrim dharamsalas'],
    accentColor: '#D8A735',
    imageUrl: '/images/shravanabelagola.jpg'
  },

  // 4. Hampi & Northern World Heritage
  {
    id: 'hampi-vijaya-vittala',
    name: 'Vijaya Vittala Temple & Stone Chariot',
    kannadaName: 'ವಿಜಯ ವಿಠ್ಠಲ ದೇವಾಲಯ ಮತ್ತು ಕಲ್ಲಿನ ರಥ',
    district: 'Vijayanagara',
    region: 'Northern Heritage',
    lat: 15.3350,
    lng: 76.4789,
    categories: ['Heritage'],
    shortDescription: 'UNESCO World Heritage epicenter featuring the world-famous Stone Chariot, musical granite pillared hall, and vast boulder landscapes.',
    historicalSignificance: 'Pinnacle of Vijayanagara architecture built during the reign of King Devaraya II and expanded by Krishnadevaraya.',
    recommendedDurationMinutes: 150,
    avgEntryFeeINR: 40,
    bestTimeToVisit: '8:30 AM - 5:00 PM (October to February optimal)',
    knownConstraints: ['Private vehicles must park 1 km away; battery buggies transport visitors to temple'],
    localSpecialties: ['Banana leaf thali at Mango Tree restaurant in Hampi bazaar'],
    accentColor: '#B9684B',
    imageUrl: '/images/hampi_stone_chariot.jpg'
  },
  {
    id: 'hampi-virupaksha-temple',
    name: 'Virupaksha Temple & Hampi Bazaar',
    kannadaName: 'ವಿರೂಪಾಕ್ಷ ದೇವಾಲಯ',
    district: 'Vijayanagara',
    region: 'Northern Heritage',
    lat: 15.3353,
    lng: 76.4601,
    categories: ['Heritage', 'Spiritual'],
    shortDescription: 'Seventh-century active temple with a 160-foot gopuram dedicated to Lord Shiva on the southern bank of the holy Tungabhadra River.',
    historicalSignificance: 'One of India’s oldest continuously functioning temples, preceding the Vijayanagara empire.',
    recommendedDurationMinutes: 90,
    avgEntryFeeINR: 25,
    bestTimeToVisit: '6:00 AM - 1:00 PM or 5:00 PM - 8:00 PM',
    knownConstraints: ['Temple elephant Lakshmi blessings in morning', 'Temple pinhole camera reflection inside ceiling chamber'],
    localSpecialties: ['Coracle boat ride on Tungabhadra river from riverside ghats'],
    accentColor: '#173D2E',
    imageUrl: '/images/hampi.jpg'
  },
  {
    id: 'matanga-hill-sunrise',
    name: 'Matanga Hill Sunrise Viewpoint',
    kannadaName: 'ಮಾತಂಗ ಬೆಟ್ಟ',
    district: 'Vijayanagara',
    region: 'Northern Heritage',
    lat: 15.3312,
    lng: 76.4678,
    categories: ['Adventure', 'Nature', 'Heritage'],
    shortDescription: 'Highest vantage point in central Hampi offering panoramic 360-degree sunrise and sunset views across the Tungabhadra and ruins.',
    historicalSignificance: 'Associated in the Ramayana with Sage Matanga’s hermitage in Kishkindha.',
    recommendedDurationMinutes: 120,
    avgEntryFeeINR: 0,
    bestTimeToVisit: '5:30 AM for sunrise or 5:00 PM for sunset',
    knownConstraints: ['Moderate trek over rocky trail and stairs; carry a headlamp for dawn descent'],
    localSpecialties: ['South Indian filter coffee at sunrise in Hampi village'],
    destinationType: 'attraction',
    accentColor: '#D8A735',
    imageUrl: '/images/matanga_hill.jpg'
  },
  {
    id: 'badami-cave-temples',
    name: 'Badami Rock-Cut Cave Temples & Agastya Lake',
    kannadaName: 'ಬಾದಾಮಿ ಗುಹಾ ದೇವಾಲಯಗಳು',
    district: 'Bagalkot',
    region: 'Northern Heritage',
    lat: 15.9189,
    lng: 75.6841,
    categories: ['Heritage', 'Adventure'],
    shortDescription: 'Four ancient 6th-century sandstone rock-cut cave shrines overlooking emerald Agastya Lake and Bhutanatha Temples.',
    historicalSignificance: 'Capital of the Early Chalukya dynasty from 540 to 757 CE.',
    recommendedDurationMinutes: 150,
    avgEntryFeeINR: 25,
    bestTimeToVisit: '9:00 AM - 5:30 PM (Winter months)',
    knownConstraints: ['Stairs between caves; watch out for inquisitive monkeys', 'Red sandstone gets warm by midday'],
    localSpecialties: ['Jowar Rotti (Sorghum flatbread) with Yennegayi (stuffed brinjal curry)'],
    accentColor: '#B9684B',
    imageUrl: '/images/badami.jpg',
    objectPosition: 'center 35%'
  },
  {
    id: 'pattadakal-monuments',
    name: 'Pattadakal Temple Complex',
    kannadaName: 'ಪಟ್ಟದಕಲ್ಲು ಸ್ಮಾರಕಗಳು',
    district: 'Bagalkot',
    region: 'Northern Heritage',
    lat: 15.9490,
    lng: 75.8160,
    categories: ['Heritage'],
    shortDescription: 'UNESCO World Heritage site with 10 harmonious temples blending northern Rekha-Nagara and southern Dravidian architectural styles.',
    historicalSignificance: 'Sacred coronation site (Pattada-Kisuvolal) for Chalukya monarchs.',
    recommendedDurationMinutes: 120,
    avgEntryFeeINR: 40,
    bestTimeToVisit: '8:30 AM - 5:30 PM',
    knownConstraints: ['22 km from Badami; best paired with Aihole in a single heritage circuit'],
    localSpecialties: ['Local Kadak Rotti with Shenga Chutney (peanut podi)'],
    accentColor: '#173D2E',
    imageUrl: '/images/pattadakal.jpg'
  },
  {
    id: 'aihole-durga-temple',
    name: 'Aihole Durga Temple & Heritage Complex',
    kannadaName: 'ಐಹೊಳೆ ದುರ್ಗಾ ದೇವಾಲಯ',
    district: 'Bagalkot',
    region: 'Northern Heritage',
    lat: 16.0197,
    lng: 75.8821,
    categories: ['Heritage'],
    shortDescription: 'The "Cradle of Indian Temple Architecture" featuring over 120 stone temples, highlighted by the apsidal horse-shoe shaped 7th-century Durga Temple.',
    historicalSignificance: 'Experimental laboratory where master sculptors forged temple architectural idioms between 450 and 700 CE.',
    recommendedDurationMinutes: 120,
    avgEntryFeeINR: 25,
    bestTimeToVisit: '9:00 AM - 5:00 PM',
    knownConstraints: ['Archaeological museum inside complex closed on Fridays'],
    localSpecialties: ['North Karnataka Holige and spicy buttermilk'],
    accentColor: '#B9684B',
    imageUrl: '/images/aihole.jpg'
  },

  // 5. Coorg & Western Ghats Hill Country
  {
    id: 'rajas-seat-madikeri',
    name: "Raja's Seat & Madikeri Fort",
    kannadaName: 'ರಾಜಾಸೀಟ್ ಮಡಿಕೇರಿ',
    district: 'Kodagu (Coorg)',
    region: 'Western Ghats & Hills',
    lat: 12.4206,
    lng: 75.7364,
    categories: ['Nature', 'Heritage'],
    shortDescription: 'Scenic clifftop garden where the Rajas of Kodagu watched crimson sunsets across misty valley layers and rolling Western Ghats.',
    historicalSignificance: 'Seat of the Haleri kings who ruled Kodagu from the 17th to 19th centuries.',
    recommendedDurationMinutes: 75,
    avgEntryFeeINR: 20,
    bestTimeToVisit: '4:30 PM - 7:00 PM for sunset & musical fountain',
    knownConstraints: ['Fog can obscure the view during monsoon months July-August', 'Limited evening parking'],
    localSpecialties: ['Traditional Kodava Pandi Curry, Bamboo Shoot curry, and homemade passion fruit wine'],
    destinationType: 'attraction',
    accentColor: '#173D2E',
    imageUrl: '/images/rajas_seat.jpg',
    objectPosition: 'center 45%'
  },
  {
    id: 'abbey-falls-coorg',
    name: 'Abbey Falls (Abbi)',
    kannadaName: 'ಅಬ್ಬಿ ಜಲಪಾತ',
    district: 'Kodagu (Coorg)',
    region: 'Western Ghats & Hills',
    lat: 12.4533,
    lng: 75.7178,
    categories: ['Nature'],
    shortDescription: 'Dramatic 70-foot waterfall cascading between private coffee plantations and spice estates of black pepper and cardamom.',
    historicalSignificance: 'Formerly named Jessy Falls by British chaplain in memory of his daughter.',
    recommendedDurationMinutes: 90,
    avgEntryFeeINR: 30,
    bestTimeToVisit: '9:00 AM - 5:00 PM (Post-monsoon September to January for peak water volume)',
    knownConstraints: ['Approx 200 downward steps to view platform; walking back up requires reasonable fitness', 'Swimming strictly prohibited'],
    localSpecialties: ['Freshly harvested Kodagu Arabica coffee beans and Coorg honey'],
    accentColor: '#102D23',
    imageUrl: '/images/abbey_falls.jpg'
  },
  {
    id: 'talacauvery-origin',
    name: 'Talacauvery & Brahmagiri Hills',
    kannadaName: 'ತಲಕಾವೇರಿ',
    district: 'Kodagu (Coorg)',
    region: 'Western Ghats & Hills',
    lat: 12.3882,
    lng: 75.4925,
    categories: ['Spiritual', 'Nature', 'Adventure'],
    shortDescription: 'Sacred birthplace of the holy River Cauvery high on the slopes of the Brahmagiri hill range at 1,276 meters altitude.',
    historicalSignificance: 'One of South India’s holiest river origins; Cauvery Theerthodbhava annual festival in October.',
    recommendedDurationMinutes: 120,
    avgEntryFeeINR: 0,
    bestTimeToVisit: '6:30 AM - 1:00 PM or 3:00 PM - 6:00 PM',
    knownConstraints: ['Trek to Brahmagiri peak requires forest permit and approx 360 stone steps', 'Modest attire expected'],
    localSpecialties: ['Temple prasadam and aromatic wild herbs'],
    destinationType: 'attraction',
    accentColor: '#173D2E',
    imageUrl: '/images/talacauvery.jpg'
  },
  {
    id: 'dubare-elephant-camp',
    name: 'Dubare Reserve Forest & Cauvery River',
    kannadaName: 'ದುಬಾರೆ ಆನೆ ಶಿಬಿರ',
    district: 'Kodagu (Coorg)',
    region: 'Western Ghats & Hills',
    lat: 12.3683,
    lng: 75.9048,
    categories: ['Nature', 'Adventure'],
    shortDescription: 'Eco-tourism elephant camp on the banks of River Cauvery managed by the Karnataka Forest Department with river rafting.',
    historicalSignificance: 'Historical training ground for the magnificent elephants of the Mysuru Dasara festival.',
    recommendedDurationMinutes: 150,
    avgEntryFeeINR: 100,
    bestTimeToVisit: 'Morning session 9:00 AM - 11:30 AM (Elephant bathing & feeding)',
    knownConstraints: ['Cauvery river crossing by boat depends on water level', 'Strict visiting time slots'],
    localSpecialties: ['River rafting (seasonal) and birdwatching'],
    accentColor: '#102D23',
    imageUrl: '/images/dubare.jpg'
  },

  // 6. Chikkamagaluru & Malnad
  {
    id: 'mullayanagiri-peak',
    name: 'Mullayanagiri Peak',
    kannadaName: 'ಮುಳ್ಳಯ್ಯನಗಿರಿ',
    district: 'Chikkamagaluru',
    region: 'Western Ghats & Hills',
    lat: 13.3912,
    lng: 75.7214,
    categories: ['Adventure', 'Nature'],
    shortDescription: 'The highest peak in Karnataka at 1,930 meters (6,330 ft), offering sea-of-clouds vistas and refreshing mountain breezes.',
    historicalSignificance: 'Named after Sage Mulappa who meditated in the caves near the summit.',
    recommendedDurationMinutes: 150,
    avgEntryFeeINR: 0,
    bestTimeToVisit: '6:00 AM - 9:30 AM for clear sunrise above clouds; avoid midday heat',
    knownConstraints: ['Steep single-lane ghat road; narrow passing points; 450 summit stairs from upper parking area'],
    localSpecialties: ['Single-origin Chikmagalur roasted coffee at hill cafes'],
    destinationType: 'attraction',
    accentColor: '#173D2E',
    imageUrl: '/images/mullayanagiri.jpg'
  },
  {
    id: 'baba-budangiri-dattapeetha',
    name: 'Baba Budangiri (Dattagiri Range)',
    kannadaName: 'ಬಾಬಾ ಬುಡನ್‌ಗಿರಿ',
    district: 'Chikkamagaluru',
    region: 'Western Ghats & Hills',
    lat: 13.4225,
    lng: 75.7664,
    categories: ['Heritage', 'Spiritual', 'Nature'],
    shortDescription: 'Sacred mountain range famous as the historic cradle of Indian coffee, where Sufi saint Baba Budan planted 7 raw coffee beans from Yemen in 1670.',
    historicalSignificance: 'Syncretic pilgrimage site revering both Sufi saint Hazrat Dada Hayat Mir Qalandar and Guru Dattatreya.',
    recommendedDurationMinutes: 120,
    avgEntryFeeINR: 0,
    bestTimeToVisit: '8:00 AM - 5:00 PM',
    knownConstraints: ['Winding high-altitude roads; mist can reduce visibility'],
    localSpecialties: ['Chikmagalur Arabica coffee beans and homemade spices'],
    destinationType: 'attraction',
    accentColor: '#B9684B',
    imageUrl: '/images/baba_budangiri.jpg'
  },
  {
    id: 'kudremukh-national-park',
    name: 'Kudremukh National Park & Peak',
    kannadaName: 'ಕುದುರೆಮುಖ ರಾಷ್ಟ್ರೀಯ ಉದ್ಯಾನವನ',
    district: 'Chikkamagaluru',
    region: 'Western Ghats & Hills',
    lat: 13.2167,
    lng: 75.2500,
    categories: ['Adventure', 'Nature'],
    shortDescription: 'UNESCO Natural World Heritage expanse named for its horse-face shaped mountain peak (1,894m) surrounded by pristine shola grasslands.',
    historicalSignificance: 'Biodiversity hotspot home to Bengal tigers, leopards, and lion-tailed macaques.',
    recommendedDurationMinutes: 300,
    avgEntryFeeINR: 500,
    bestTimeToVisit: 'October to February; strictly 6:00 AM start for registered summit treks',
    knownConstraints: ['Mandatory online forest permit (limited to 50 trekkers per day)', 'Plastic-free strict zone'],
    localSpecialties: ['Steaming Neer Dosa with coconut chutney in Kalasa village'],
    destinationType: 'attraction',
    accentColor: '#102D23',
    imageUrl: '/images/kudremukh.jpg'
  },

  // 7. Coastal Karnataka & Karavali
  {
    id: 'gokarna-om-beach',
    name: 'Gokarna Om Beach & Kudle Beach',
    kannadaName: 'ಗೋಕರ್ಣ ಓಂ ಬೀಚ್',
    district: 'Uttara Kannada',
    region: 'Coastal Karnataka',
    lat: 14.5161,
    lng: 74.3168,
    categories: ['Beaches', 'Adventure', 'Nature'],
    shortDescription: 'Naturally shaped in the sacred Hindu symbol "Om", this crescent double-cove features granite cliffs, tranquil waters, and golden sunsets.',
    historicalSignificance: 'Adjacent to ancient temple town of Gokarna, revered as Dakshina Kashi.',
    recommendedDurationMinutes: 180,
    avgEntryFeeINR: 0,
    bestTimeToVisit: 'October to March; late afternoon 4:00 PM - 7:00 PM for sunset',
    knownConstraints: ['Beach trek trail links Kudle, Om, Half Moon, and Paradise beaches; wear sturdy sandals', 'Lifeguards on designated zones'],
    localSpecialties: ['Fresh seafood thali, wood-fired coastal pizza at cliffside shacks'],
    accentColor: '#173D2E',
    imageUrl: '/images/gokarna.jpg',
    objectPosition: 'center 40%'
  },
  {
    id: 'murudeshwar-temple-shiva',
    name: 'Murudeshwar Temple & Giant Shiva Statue',
    kannadaName: 'ಮುರುಡೇಶ್ವರ ದೇವಾಲಯ',
    district: 'Uttara Kannada',
    region: 'Coastal Karnataka',
    lat: 14.0942,
    lng: 74.4899,
    categories: ['Spiritual', 'Heritage', 'Beaches'],
    shortDescription: 'The world’s second-tallest Shiva statue (123 ft) perched on Kanduka Hill surrounded on three sides by the turquoise Arabian Sea, beside a 20-storey Raja Gopura.',
    historicalSignificance: 'Origin legend tied to the Atmalinga of Lord Shiva dropped by Ravana.',
    recommendedDurationMinutes: 120,
    avgEntryFeeINR: 20,
    bestTimeToVisit: '6:00 AM - 1:00 PM or 4:00 PM - 8:30 PM (Elevator to 18th floor open till 7:00 PM)',
    knownConstraints: ['Lift inside Rajagopura has a small queue during holidays; beach water sports available nearby'],
    localSpecialties: ['Karavali coastal fish curry meals, fresh tender coconut'],
    accentColor: '#102D23',
    imageUrl: '/images/murudeshwar.jpg',
    objectPosition: 'center 20%'
  },
  {
    id: 'udupi-sri-krishna-matha',
    name: 'Udupi Sri Krishna Matha & Malpe Beach',
    kannadaName: 'ಉಡುಪಿ ಶ್ರೀ ಕೃಷ್ಣ ಮಠ',
    district: 'Udupi',
    region: 'Coastal Karnataka',
    lat: 13.3409,
    lng: 74.7516,
    categories: ['Spiritual', 'Food & Culture', 'Beaches'],
    shortDescription: 'Famed 13th-century temple founded by Saint Madhvacharya where the deity is worshipped through a silver-plated 9-holed window (Kanakana Kindi).',
    historicalSignificance: 'Birthplace of the Dvaita school of Vedanta philosophy and iconic global Udupi cuisine.',
    recommendedDurationMinutes: 120,
    avgEntryFeeINR: 0,
    bestTimeToVisit: '5:30 AM - 1:30 PM or 5:00 PM - 9:00 PM (Free traditional lunch served at noon)',
    knownConstraints: ['Traditional dress code (men remove shirts before inner sanctum); boat ferry to St. Mary’s Island from Malpe runs 9 AM - 5 PM'],
    localSpecialties: ['Authentic Udupi Sambar, Goli Baje, Mangalore Buns, and Gadbad ice cream at Diana'],
    accentColor: '#D8A735',
    imageUrl: '/images/udupi.jpg'
  },
  {
    id: 'st-marys-island-malpe',
    name: "St. Mary's Island Columnar Basalt Rocks",
    kannadaName: 'ಸೇಂಟ್ ಮೇರಿಸ್ ದ್ವೀಪ',
    district: 'Udupi',
    region: 'Coastal Karnataka',
    lat: 13.3794,
    lng: 74.6738,
    categories: ['Nature', 'Beaches'],
    shortDescription: 'National Geological Monument featuring hexagonal columnar basaltic lava pillars formed 88 million years ago when Madagascar split from India.',
    historicalSignificance: 'Vasco da Gama landed here in 1498 and erected a cross, dedicating the island to Mother Mary.',
    recommendedDurationMinutes: 150,
    avgEntryFeeINR: 350,
    bestTimeToVisit: '9:30 AM - 4:30 PM (Closed during monsoon June-September)',
    knownConstraints: ['Boats operate from Malpe Beach; plastic bags strictly confiscated at boat point; no overnight stays allowed'],
    localSpecialties: ['Beachside tender coconut and fresh roasted corn'],
    accentColor: '#173D2E',
    imageUrl: '/images/st_marys_island.jpg'
  },

  // 8. Shivamogga & Western Ghats Waterfalls
  {
    id: 'jog-falls-shivamogga',
    name: 'Jog Falls (Gerosoppa)',
    kannadaName: 'ಜೋಗ ಜಲಪಾತ',
    district: 'Shivamogga',
    region: 'Western Ghats & Hills',
    lat: 14.2285,
    lng: 74.8124,
    categories: ['Nature'],
    shortDescription: 'India’s second-highest plunge waterfall, dropping 253 meters (830 ft) in four distinct cascades: Raja, Roarer, Rocket, and Rani on the Sharavathi River.',
    historicalSignificance: 'Powers the Mahatma Gandhi Hydroelectric Project commissioned in 1948.',
    recommendedDurationMinutes: 150,
    avgEntryFeeINR: 50,
    bestTimeToVisit: 'Monsoon and post-monsoon (August to December) for roaring water curtains; laser light show at 7:00 PM',
    knownConstraints: ['Steps to the bottom of the gorge are open subject to monsoon safety regulations'],
    localSpecialties: ['Malnad Jackfruit Kadubu, steamed patrode, and hot tea'],
    accentColor: '#102D23',
    imageUrl: '/images/jog_falls.jpg',
    objectPosition: 'center 20%'
  },
  {
    id: 'agumbe-rainforest-sunset',
    name: 'Agumbe Rainforest & Sunset Viewpoint',
    kannadaName: 'ಆಗುಂಬೆ ಮಳೆಕಾಡು',
    district: 'Shivamogga',
    region: 'Western Ghats & Hills',
    lat: 13.5074,
    lng: 75.0924,
    categories: ['Nature', 'Adventure'],
    shortDescription: 'Known as the "Cherrapunji of South India", this dense evergreen canopy hosts the world’s only King Cobra research sanctuary and misty ghat sunsets.',
    historicalSignificance: 'Filming location for R.K. Narayan’s celebrated TV adaptation of Malgudi Days (Doddamane).',
    recommendedDurationMinutes: 150,
    avgEntryFeeINR: 20,
    bestTimeToVisit: 'October to February for clear sunset vistas; July-August for extreme monsoon photography',
    knownConstraints: ['Sunset point can get crowded on weekends; leeches active in forest trails during rain (wear salt socks)'],
    localSpecialties: ['Kashaya (traditional herbal spiced milk brew) and homemade banana chips'],
    accentColor: '#173D2E',
    imageUrl: '/images/agumbe.jpg'
  },

  // 9. North Karnataka Sultanate & Deccan
  {
    id: 'gol-gumbaz-vijayapura',
    name: 'Gol Gumbaz & Ibrahim Rouza',
    kannadaName: 'ಗೋಲ್ ಗುಂಬಜ್ ವಿಜಯಪುರ',
    district: 'Vijayapura',
    region: 'Northern Heritage',
    lat: 16.8306,
    lng: 75.7360,
    categories: ['Heritage'],
    shortDescription: 'Tomb of King Mohammed Adil Shah featuring the second-largest unsupported dome in the world (44m diameter) with an acoustical Whispering Gallery.',
    historicalSignificance: 'Completed in 1656 CE; an architectural marvel of the Adil Shahi Sultanate.',
    recommendedDurationMinutes: 120,
    avgEntryFeeINR: 25,
    bestTimeToVisit: '9:00 AM - 5:30 PM (Early morning arrival avoids noise in the Whispering Gallery)',
    knownConstraints: ['Climb up spiral staircase in corner minarets to the gallery; can echo footsteps up to 11 times'],
    localSpecialties: ['Vijayapura dry fruits, Jowar rotis with stuffed brinjals'],
    accentColor: '#B9684B',
    imageUrl: '/images/gol_gumbaz.jpg'
  },
  {
    id: 'bidar-fort-mahmud-gawan',
    name: 'Bidar Fort & Mahmud Gawan Madrasa',
    kannadaName: 'ಬೀದರ್ ಕೋಟೆ',
    district: 'Bidar',
    region: 'Northern Heritage',
    lat: 17.9274,
    lng: 77.5303,
    categories: ['Heritage', 'Food & Culture'],
    shortDescription: 'Vast 15th-century Persian-influenced Bahmani Sultanate fortress surrounded by triple-moats cut into red laterite rock, Rangin Mahal tiles, and Solah Khamba Mosque.',
    historicalSignificance: 'Capital of the Bahmani and Barid Shahi Sultanates; historic Bidriware metal handicraft center.',
    recommendedDurationMinutes: 180,
    avgEntryFeeINR: 25,
    bestTimeToVisit: '9:00 AM - 5:00 PM (November to February)',
    knownConstraints: ['Sprawling 3 km circumference; comfortable walking shoes mandatory'],
    localSpecialties: ['Bidriware silver-inlaid zinc/copper souvenirs, authentic Hyderabadi-style Biryani'],
    accentColor: '#173D2E',
    imageUrl: '/images/bidar.jpg'
  },
  {
    id: 'dandeli-wildlife-rafting',
    name: 'Dandeli Wildlife Sanctuary & Kali River Rafting',
    kannadaName: 'ದಾಂಡೇಲಿ ವನ್ಯಜೀವಿ ಅಭಯಾರಣ್ಯ',
    district: 'Uttara Kannada',
    region: 'Western Ghats & Hills',
    lat: 15.2415,
    lng: 74.6229,
    categories: ['Adventure', 'Nature'],
    shortDescription: 'Premier whitewater rafting destination on River Kali, featuring Class 3 rapids, hornbill birdwatching, and dense teak forests.',
    historicalSignificance: 'Part of the Anshi Dandeli Tiger Reserve (Kali Tiger Reserve).',
    recommendedDurationMinutes: 240,
    avgEntryFeeINR: 1200,
    bestTimeToVisit: 'October to May for rafting; forest safari morning 6:00 AM and afternoon 3:30 PM',
    knownConstraints: ['Rafting depends on dam water discharge; life jackets and safety orientation mandatory'],
    localSpecialties: ['North Canara local home-cooked thali and bamboo shoot pickle'],
    accentColor: '#102D23',
    imageUrl: '/images/dandeli.jpg'
  }
];

// Verified Curated Karnataka Food Experiences
export const KARNATAKA_FOOD_EXPERIENCES: Destination[] = [
  {
    id: 'food-mysuru-masala-dosa-mysore-pak',
    name: 'Mysuru Masala Dosa & Mysore Pak Heritage',
    kannadaName: 'ಮೈಸೂರು ಮಸಾಲ ದೋಸೆ ಮತ್ತು ಮೈಸೂರು ಪಾಕ್',
    district: 'Mysuru',
    region: 'Mysuru & Cauvery',
    lat: 12.3052,
    lng: 76.6552,
    destinationType: 'food_experience',
    categories: ['Food & Culture'],
    cuisine: 'Royal Mysuru & South Indian',
    speciality: 'Ghee-roasted red chutney crispy dosa & traditional melt-in-mouth gram-flour sweet',
    shortDescription: 'Centuries-old royal culinary traditions born in the kitchens of Amba Vilas Palace, celebrated for the authentic Mysore Pak and buttery crisp dosa.',
    historicalSignificance: 'Created in 1935 during Maharaja Nalwadi Krishnaraja Wadiyar’s reign by royal chef Kakasura Madappa.',
    recommendedDurationMinutes: 60,
    avgEntryFeeINR: 150,
    bestTimeToVisit: '7:30 AM - 11:30 AM or 4:30 PM - 8:30 PM',
    localSpecialties: ['Mysore Pak at Guru Sweets (original inventor family)', 'Mylari Dosa at Nazarbad', 'Filter Coffee'],
    accentColor: '#D8A735',
    imageUrl: '/images/food_mysore_dosa.jpg'
  },
  {
    id: 'food-udupi-vegetarian-cuisine',
    name: 'Udupi Satvik Vegetarian Culinary Experience',
    kannadaName: 'ಉಡುಪಿ ಸಾತ್ತ್ವಿಕ ಅಡುಗೆ ಮತ್ತು ಮಠದ ಊಟ',
    district: 'Udupi',
    region: 'Coastal Karnataka',
    lat: 13.3409,
    lng: 74.7421,
    destinationType: 'food_experience',
    categories: ['Food & Culture'],
    cuisine: 'Satvik Coastal Karnataka Vegetarian (Ashta Matha tradition)',
    speciality: 'Udupi Sambar, Rasam, Saaru, Kosambari & temple Bhojana served on plantain leaves',
    shortDescription: 'World-renowned satvik vegetarian cuisine originating from the Madhwa Brahmin kitchens of Sri Krishna Matha, using native spices, jaggery, and coconut.',
    historicalSignificance: 'Formulated in the 13th century by Sri Madhvacharya; the foundation of South Indian vegetarian restaurant culture.',
    recommendedDurationMinutes: 60,
    avgEntryFeeINR: 120,
    bestTimeToVisit: '11:30 AM - 2:30 PM for traditional midday meal',
    localSpecialties: ['Temple Anna Santharpana', 'Goli Baje', 'Patrode', 'Kadubu'],
    accentColor: '#173D2E',
    imageUrl: '/images/food_udupi_meal.jpg'
  },
  {
    id: 'food-mangaluru-seafood-coastal',
    name: 'Mangaluru Coastal Seafood & Tuluva Heritage',
    kannadaName: 'ಮಂಗಳೂರು ಕರಾವಳಿ ಮೀನಿನ ಊಟ ಮತ್ತು ಕೋರಿ ರೊಟ್ಟಿ',
    district: 'Dakshina Kannada',
    region: 'Coastal Karnataka',
    lat: 12.8698,
    lng: 74.8430,
    destinationType: 'food_experience',
    categories: ['Food & Culture'],
    cuisine: 'Coastal Tuluva, Bunt & Mangalorean Catholic',
    speciality: 'Kori Rotti, Anjal fish fry, Marwai Sukka, Mangalore Buns & Neer Dosa',
    shortDescription: 'Distinctive coastal cuisine characterized by freshly grated coconut, Byadagi chillies, tamarind, and fresh Arabian Sea catch.',
    historicalSignificance: 'Rich ancient maritime trade heritage infusing local Tuluva recipes with unique spice blends.',
    recommendedDurationMinutes: 75,
    avgEntryFeeINR: 350,
    bestTimeToVisit: '12:00 PM - 3:30 PM or 7:00 PM - 10:30 PM',
    localSpecialties: ['Kori Rotti with chicken gassi', 'Anjal (Kingfish) tawa fry', 'Mangalore Buns with chutney'],
    accentColor: '#B9684B',
    imageUrl: '/images/food_mangaluru_neer_dosa.jpg'
  },
  {
    id: 'food-dharwad-peda',
    name: 'Dharwad Peda & Mishrikoti Heritage Sweets',
    kannadaName: 'ಧಾರವಾಡ ಪೇಡಾ ಪರಂಪರೆ',
    district: 'Dharwad',
    region: 'Northern Heritage',
    lat: 15.4589,
    lng: 75.0078,
    destinationType: 'food_experience',
    categories: ['Food & Culture'],
    cuisine: 'North Karnataka Confectionery',
    speciality: 'GI-tagged slow-caramelized buffalo milk khoa rolled in castor sugar',
    shortDescription: 'GI-tagged caramelized milk sweet originated in the 19th century by Ram Ratan Singh Thakur, renowned for its granular texture and rich aroma.',
    historicalSignificance: 'Awarded Geographical Indication (GI) status in India; over 175 years of heritage.',
    recommendedDurationMinutes: 45,
    avgEntryFeeINR: 100,
    bestTimeToVisit: '10:00 AM - 8:00 PM',
    localSpecialties: ['Line Bazaar Babu Singh Thakur Peda', 'Mishrikoti Dharwad Peda', 'Mirchi Bajji with Mandakki'],
    accentColor: '#D8A735',
    imageUrl: '/images/food_dharwad_peda.jpg'
  },
  {
    id: 'food-north-karnataka-jolada-rotti',
    name: 'North Karnataka Jolada Rotti Oota',
    kannadaName: 'ಉತ್ತರ ಕರ್ನಾಟಕ ಜೋಳದ ರೊಟ್ಟಿ ಮತ್ತು ಎಣ್ಣೆಗಾಯಿ ಊಟ',
    district: 'Bagalkot',
    region: 'Northern Heritage',
    lat: 15.9189,
    lng: 75.6841,
    destinationType: 'food_experience',
    categories: ['Food & Culture'],
    cuisine: 'North Karnataka Desi Bhojana',
    speciality: 'Hand-patted sorghum flatbreads with stuffed baby brinjal (Yennegayi), Shenga Chutney & Jhunka',
    shortDescription: 'Rustic and hearty millet-based culinary tradition of the Deccan plains, emphasizing nutrition, roasted groundnuts, and fiery flaxseed pudis.',
    historicalSignificance: 'Ancient agrarian diet of North Karnataka going back to Chalukyan times.',
    recommendedDurationMinutes: 60,
    avgEntryFeeINR: 120,
    bestTimeToVisit: '12:00 PM - 3:00 PM or 7:30 PM - 10:00 PM',
    localSpecialties: ['Sajje Rotti', 'Yennegayi (brinjal curry)', 'Shenga Chutney Pudi with curd', 'Shenga Holige'],
    accentColor: '#173D2E',
    imageUrl: '/images/food_jolada_rotti.jpg'
  },
  {
    id: 'food-coorg-regional-cuisine',
    name: 'Kodava (Coorg) Highland Cuisine',
    kannadaName: 'ಕೊಡವ ಸಾಂಪ್ರದಾಯಿಕ ಅಡುಗೆ ಮತ್ತು ಪಾಂಡಿ ಕರಿ',
    district: 'Kodagu (Coorg)',
    region: 'Western Ghats & Hills',
    lat: 12.4244,
    lng: 75.7382,
    destinationType: 'food_experience',
    categories: ['Food & Culture'],
    cuisine: 'Kodava Highland Plantation',
    speciality: 'Kachampuli (wild Garcinia vinegar) braised specialities, Akki Rotti, Kadambuttu & Bamboo Shoot',
    shortDescription: 'Unique indigenous culinary culture of the Kodagu hills, flavored with dark sour Garcinia gummi-gutta extract, native bird’s eye chillies, and freshly picked estate spices.',
    historicalSignificance: 'Traditional warrior and agrarian cuisine of the Kodava community.',
    recommendedDurationMinutes: 75,
    avgEntryFeeINR: 300,
    bestTimeToVisit: '12:30 PM - 3:30 PM or 7:30 PM - 10:00 PM',
    localSpecialties: ['Authentic Pandi Curry with Kadambuttu', 'Akki Rotti with Ellu Pajji', 'Baimbale (Bamboo shoot) curry'],
    accentColor: '#102D23',
    imageUrl: '/images/food_coorg_akki_rotti.jpg'
  },
  {
    id: 'food-bengaluru-darshini',
    name: 'Bengaluru Darshini & Filter Coffee Culture',
    kannadaName: 'ಬೆಂಗಳೂರು ದರ್ಶಿನಿ ತಿಂಡಿ ಮತ್ತು ಫಿಲ್ಟರ್ ಕಾಫಿ',
    district: 'Bengaluru Urban',
    region: 'Bengaluru & South',
    lat: 12.9716,
    lng: 77.5946,
    destinationType: 'food_experience',
    categories: ['Food & Culture'],
    cuisine: 'Bengaluru Quick-Service Tiffin & Coffee',
    speciality: 'Benne Khara Bath, Crispy Masala Dosa, steaming Idli-Vada dip sambar & brass davarah filter coffee',
    shortDescription: 'The legendary quick-service breakfast movement born in 1983, redefining urban South Indian dining with fast-moving counters and aromatic chicory-blended filter coffee.',
    historicalSignificance: 'Pioneered by Cafe Darshini in Jayanagar in 1983, revolutionizing working-class Bangalore breakfast.',
    recommendedDurationMinutes: 45,
    avgEntryFeeINR: 100,
    bestTimeToVisit: '6:30 AM - 10:30 AM or 4:00 PM - 7:30 PM',
    localSpecialties: ['Mavalli Tiffin Room (MTR) Rava Idli', 'Vidyarthi Bhavan Masala Dosa', 'Brahmins Coffee Bar Chutney'],
    accentColor: '#D8A735',
    imageUrl: '/images/food_bengaluru_darshini.jpg'
  }
];

// All curated destinations including cultural landmarks and verified food experiences
export const ALL_CURATED_DESTINATIONS: Destination[] = [
  ...KARNATAKA_DESTINATIONS,
  ...KARNATAKA_FOOD_EXPERIENCES
];

// Quick index lookups
export const DESTINATIONS_MAP = new Map<string, Destination>(
  ALL_CURATED_DESTINATIONS.map(d => [d.id, d])
);

export function getDestinationById(id: string): Destination | undefined {
  return DESTINATIONS_MAP.get(id);
}

export const REGIONS: Destination['region'][] = [
  'Bengaluru & South',
  'Mysuru & Cauvery',
  'Western Ghats & Hills',
  'Coastal Karnataka',
  'Central & Heritage',
  'Northern Heritage'
];

export const EXPERIENCE_CATEGORIES: Destination['categories'][number][] = [
  'Heritage',
  'Nature',
  'Adventure',
  'Beaches',
  'Food & Culture',
  'Spiritual'
];

export const SUPPORTED_ORIGINS = [
  'Bengaluru',
  'Mysuru',
  'Hubballi-Dharwad',
  'Mangaluru',
  'Belagavi',
  'Kalaburagi',
  'Shivamogga',
  'Davangere',
  'Ballari',
  'Udupi',
  'Goa (Border)',
  'Hyderabad (Border)',
  'Chennai (Border)'
];

export const DESTINATION_FALLBACK_IMAGE = '';

export interface PopularHub {
  name: string;
  district: string;
  lat: number;
  lng: number;
  isAllKarnataka?: boolean;
}

export const POPULAR_HUBS: PopularHub[] = [
  { name: 'All Karnataka', district: 'Statewide', lat: 14.5204, lng: 75.7224, isAllKarnataka: true },
  { name: 'Bengaluru', district: 'Bengaluru Urban', lat: 12.9716, lng: 77.5946 },
  { name: 'Mysuru', district: 'Mysuru', lat: 12.2958, lng: 76.6394 },
  { name: 'Hampi', district: 'Vijayanagara', lat: 15.3350, lng: 76.4600 },
  { name: 'Madikeri / Coorg', district: 'Kodagu', lat: 12.4244, lng: 75.7382 },
  { name: 'Chikkamagaluru', district: 'Chikkamagaluru', lat: 13.3161, lng: 75.7720 },
  { name: 'Mangaluru', district: 'Dakshina Kannada', lat: 12.9141, lng: 74.8560 },
  { name: 'Gokarna', district: 'Uttara Kannada', lat: 14.5479, lng: 74.3188 },
  { name: 'Badami & North', district: 'Bagalkot', lat: 15.9189, lng: 75.6841 }
];

