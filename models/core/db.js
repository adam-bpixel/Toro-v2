'use strict';
const { MongoClient } = require('mongodb');

let client = null;
let db = null;

async function connect() {
  if (db) return db;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Set MONGODB_URI in your .env file first (copy .env.example).');
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(process.env.MONGODB_DB || 'toro');
  await db.collection('users').createIndex({ userId: 1 }, { unique: true });
  await db.collection('users').createIndex({ totalXp: -1 });
  await db.collection('guildConfig').createIndex({ guildId: 1 }, { unique: true });
  await db.collection('userPrefixes').createIndex({ userId: 1 }, { unique: true });
  await db.collection('jailLogs').createIndex({ guildId: 1, userId: 1 });
  await db.collection('alertLogs').createIndex({ guildId: 1, userId: 1 });
  await db.collection('warnings').createIndex({ guildId: 1, userId: 1 });
  await db.collection('inviteJoins').createIndex({ guildId: 1, memberId: 1 }, { unique: true });
  await db.collection('inviteJoins').createIndex({ guildId: 1, inviterId: 1 });
  await db.collection('guildStats').createIndex({ guildId: 1, userId: 1 }, { unique: true });
  await db.collection('clans').createIndex({ guildId: 1, clanId: 1 }, { unique: true });
  await db.collection('clans').createIndex({ guildId: 1, memberIds: 1 });
  await db.collection('profiles').createIndex({ profileId: 1 }, { unique: true });
  await db.collection('profileOwnership').createIndex({ userId: 1, profileId: 1 }, { unique: true });
  return db;
}

function getDb() {
  if (!db) throw new Error('MongoDB not connected yet - call connect() at startup first.');
  return db;
}

async function isConnected() {
  if (!db) return false;
  try {
    await db.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

async function close() {
  if (client) await client.close();
  client = null;
  db = null;
}

module.exports = { connect, getDb, isConnected, close };
