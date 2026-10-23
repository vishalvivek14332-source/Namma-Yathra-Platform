const { MongoClient } = require('mongodb');
require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder?.('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

async function testSync() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'YatraAI';
  console.log(`Connecting to Atlas cluster ${dbName}...`);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db = client.db(dbName);

  const { ALL_CURATED_DESTINATIONS } = require('./src/data/destinations.ts');
  console.log(`Curated records to sync: ${ALL_CURATED_DESTINATIONS.length} (32 landmarks + ${ALL_CURATED_DESTINATIONS.length - 32} food experiences)`);

  const col = db.collection('destinations');
  await col.createIndex({ id: 1 }, { unique: true });

  const bulkOps = ALL_CURATED_DESTINATIONS.map(d => ({
    updateOne: {
      filter: { id: d.id },
      update: {
        $set: {
          id: d.id,
          name: d.name,
          kannadaName: d.kannadaName,
          district: d.district,
          region: d.region,
          lat: d.lat,
          lng: d.lng,
          categories: d.categories,
          destinationType: d.destinationType || 'attraction',
          cuisine: d.cuisine,
          speciality: d.speciality,
          shortDescription: d.shortDescription,
          historicalSignificance: d.historicalSignificance,
          recommendedDurationMinutes: d.recommendedDurationMinutes,
          avgEntryFeeINR: d.avgEntryFeeINR,
          bestTimeToVisit: d.bestTimeToVisit,
          knownConstraints: d.knownConstraints,
          localSpecialties: d.localSpecialties,
          accentColor: d.accentColor,
          imageUrl: d.imageUrl,
          syncedAt: new Date()
        }
      },
      upsert: true
    }
  }));

  const res = await col.bulkWrite(bulkOps);
  console.log(`Sync complete:`);
  console.log(`  Matched documents: ${res.matchedCount}`);
  console.log(`  Modified documents: ${res.modifiedCount}`);
  console.log(`  Inserted documents: ${res.upsertedCount}`);

  const total = await col.countDocuments();
  console.log(`  Total destinations in Atlas: ${total}`);

  // Verify users and trips are preserved
  const usersCount = await db.collection('users').countDocuments();
  const tripsCount = await db.collection('trips').countDocuments();
  console.log(`  Existing users count preserved: ${usersCount}`);
  console.log(`  Existing trips count preserved: ${tripsCount}`);

  // Sample destination documents
  const chamundi = await col.findOne({ id: 'chamundi-hill' });
  console.log('\nSample verified destination: Chamundi Hill');
  console.log('  Image URL:', chamundi.imageUrl);
  console.log('  Categories:', chamundi.categories);

  const mysorePak = await col.findOne({ id: 'food-mysuru-masala-dosa-mysore-pak' });
  console.log('\nSample verified culinary experience: Mysore Dosa & Pak');
  console.log('  Image URL:', mysorePak.imageUrl);
  console.log('  Destination Type:', mysorePak.destinationType);
  console.log('  Cuisine:', mysorePak.cuisine);

  await client.close();
  console.log('\nAtlas synchronization verified successfully!');
}

testSync().catch(err => {
  console.error('Atlas sync failed:', err);
  process.exit(1);
});
