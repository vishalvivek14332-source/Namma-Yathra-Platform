import { MongoClient } from 'mongodb';
import 'dotenv/config';
import dns from 'dns';
import { ALL_CURATED_DESTINATIONS } from '../src/data/destinations';

dns.setDefaultResultOrder?.('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

async function testSync() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined in environment');
  const dbName = process.env.MONGODB_DB_NAME || 'YatraAI';
  console.log(`Connecting to Atlas database: ${dbName}...`);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db = client.db(dbName);

  console.log(`Total curated destinations & culinary experiences: ${ALL_CURATED_DESTINATIONS.length}`);
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
  console.log('MongoDB Atlas Destination Sync Results:');
  console.log(`  Matched existing records: ${res.matchedCount}`);
  console.log(`  Updated records: ${res.modifiedCount}`);
  console.log(`  Inserted new records: ${res.upsertedCount}`);

  const total = await col.countDocuments();
  console.log(`  Total destinations now in Atlas: ${total}`);

  const usersCount = await db.collection('users').countDocuments();
  const tripsCount = await db.collection('trips').countDocuments();
  console.log(`  Preserved users in Atlas: ${usersCount}`);
  console.log(`  Preserved trips in Atlas: ${tripsCount}`);

  const chamundi = await col.findOne({ id: 'chamundi-hill' });
  console.log('\nVerified destination in Atlas:');
  console.log(`  Chamundi Hill image: ${chamundi?.imageUrl}`);
  console.log(`  Categories: ${JSON.stringify(chamundi?.categories)}`);

  const srirangapatna = await col.findOne({ id: 'srirangapatna-fort' });
  console.log(`  Srirangapatna image: ${srirangapatna?.imageUrl}`);

  const mysorePak = await col.findOne({ id: 'food-mysuru-masala-dosa-mysore-pak' });
  console.log('\nVerified culinary experience in Atlas:');
  console.log(`  Name: ${mysorePak?.name}`);
  console.log(`  Image: ${mysorePak?.imageUrl}`);
  console.log(`  Cuisine: ${mysorePak?.cuisine}`);

  await client.close();
  console.log('\nMongoDB Atlas synchronization completed successfully!');
}

testSync().catch(err => {
  console.error('Atlas sync error:', err);
  process.exit(1);
});
