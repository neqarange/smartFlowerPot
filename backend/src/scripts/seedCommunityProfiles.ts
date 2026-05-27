import 'dotenv/config';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { FlowerProfile, IThresholdRange } from '../models/FlowerProfile';

interface Preset {
  flowerName: string;
  temp: IThresholdRange;
  humidity: IThresholdRange;
  light: IThresholdRange;
}

const COMMUNITY_USERNAME = 'community';
const COMMUNITY_EMAIL = 'community@smartpot.local';

const PRESETS: Preset[] = [
  {
    flowerName: 'Monstera deliciosa',
    temp:     { ok: [18, 27], warn: [12, 32] },
    humidity: { ok: [50, 70], warn: [35, 85] },
    light:    { ok: [500, 10000], warn: [200, 20000] },
  },
  {
    flowerName: 'Snake plant (Sansevieria)',
    temp:     { ok: [16, 27], warn: [10, 32] },
    humidity: { ok: [30, 50], warn: [20, 70] },
    light:    { ok: [100, 15000], warn: [50, 40000] },
  },
  {
    flowerName: 'Peace lily',
    temp:     { ok: [18, 26], warn: [13, 30] },
    humidity: { ok: [50, 80], warn: [40, 90] },
    light:    { ok: [200, 2500], warn: [100, 8000] },
  },
  {
    flowerName: 'Basil',
    temp:     { ok: [18, 26], warn: [12, 32] },
    humidity: { ok: [40, 60], warn: [30, 75] },
    light:    { ok: [5000, 30000], warn: [2000, 60000] },
  },
  {
    flowerName: 'Succulent (Echeveria)',
    temp:     { ok: [18, 27], warn: [10, 35] },
    humidity: { ok: [20, 50], warn: [10, 65] },
    light:    { ok: [8000, 50000], warn: [3000, 80000] },
  },
  {
    flowerName: 'Cherry tomato',
    temp:     { ok: [20, 27], warn: [14, 32] },
    humidity: { ok: [50, 70], warn: [40, 85] },
    light:    { ok: [10000, 50000], warn: [4000, 80000] },
  },
];

async function ensureCommunityUser(): Promise<mongoose.Types.ObjectId> {
  const existing = await User.findOne({ username: COMMUNITY_USERNAME });
  if (existing) {
    console.log(`Community user exists (${existing._id})`);
    return existing._id as mongoose.Types.ObjectId;
  }
  const randomPassword = crypto.randomBytes(32).toString('hex');
  const user = await new User({
    username: COMMUNITY_USERNAME,
    email: COMMUNITY_EMAIL,
    name: 'Smart Pot',
    surname: 'Community',
    password: randomPassword,
    tokens: [],
    devices: [],
  }).save();
  console.log(`Created community user (${user._id})`);
  return user._id as mongoose.Types.ObjectId;
}

async function upsertPreset(userId: mongoose.Types.ObjectId, preset: Preset): Promise<'created' | 'updated'> {
  const existing = await FlowerProfile.findOne({ userId, flowerName: preset.flowerName });
  if (existing) {
    existing.public = true;
    existing.temp = preset.temp;
    existing.humidity = preset.humidity;
    existing.light = preset.light;
    await existing.save();
    return 'updated';
  }
  await new FlowerProfile({
    userId,
    flowerName: preset.flowerName,
    public: true,
    temp: preset.temp,
    humidity: preset.humidity,
    light: preset.light,
  }).save();
  return 'created';
}

async function main(): Promise<void> {
  await connectDatabase();

  const userId = await ensureCommunityUser();

  let created = 0;
  let updated = 0;
  for (const preset of PRESETS) {
    const result = await upsertPreset(userId, preset);
    if (result === 'created') created++;
    else updated++;
    console.log(`  ${result === 'created' ? '✓ created' : '↻ updated'}: ${preset.flowerName}`);
  }

  console.log(`\nDone. ${created} created, ${updated} updated.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
