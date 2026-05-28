import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { authenticateUser } from '../middleware/authUser';
import { User } from '../models/User';
import { PendingPairing } from '../models/PendingPairing';
import { validate } from '../middleware/validate';

// A pot must have announced itself within this window to be claimable.
const ANNOUNCE_FRESHNESS_MS = 2 * 60 * 1000;

const router = Router();

function generateDeviceToken(deviceId: string): string {
  return jwt.sign({ deviceId }, process.env.JWT_SECRET!);
}

// POST /api/users/devices
router.post('/devices', authenticateUser, async (req: Request, res: Response) => {
  const error = validate(req.body, {
    name:        { type: 'string' },
    pairingCode: { type: 'string' },
  });
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const { name, pairingCode } = req.body;

  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const code = pairingCode.trim().toUpperCase();

    // Zkontroluj jestli pairing code už není použitý
    const existingUser = await User.findOne({ 'devices.pairingCode': code });
    if (existingUser) {
      res.status(409).json({ error: 'This pairing code is already linked to a device' });
      return;
    }

    // Backend only accepts codes that a real pot has recently announced.
    const pending = await PendingPairing.findOne({ pairingCode: code });
    const fresh = pending && Date.now() - pending.lastSeenAt.getTime() < ANNOUNCE_FRESHNESS_MS;
    if (!fresh) {
      res.status(404).json({
        error: 'No pot is broadcasting that code. Make sure your pot is powered on and connected to WiFi.',
      });
      return;
    }

    const deviceId = randomUUID();
    const token = generateDeviceToken(deviceId);

    user.devices.push({
      deviceId,
      name: name.trim(),
      token,
      pairingCode: code,
    });
    await user.save();

    await PendingPairing.deleteOne({ pairingCode: code });

    res.status(201).json({ devices: user.devices });
  } catch (err) {
    console.error('[add device]', err);
    res.status(500).json({ error: 'Failed to add device' });
  }
});

// GET /api/users/devices
router.get('/devices', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId).select('devices');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ devices: user.devices });
  } catch (err) {
    console.error('[get devices]', err);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

// PUT /api/users/devices/:deviceId/profile
router.put('/devices/:deviceId/profile', authenticateUser, async (req: Request, res: Response) => {
  const { profileId } = req.body;
  if (!profileId || typeof profileId !== 'string') {
    res.status(400).json({ error: 'profileId is required' });
    return;
  }

  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const device = user.devices.find((d) => d.deviceId === req.params.deviceId);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    device.activeProfileId = profileId;
    await user.save();

    res.json({ devices: user.devices });
  } catch (err) {
    console.error('[set device profile]', err);
    res.status(500).json({ error: 'Failed to set profile' });
  }
});

// DELETE /api/users/devices/:deviceId/profile
router.delete('/devices/:deviceId/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const device = user.devices.find((d) => d.deviceId === req.params.deviceId);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    device.activeProfileId = undefined;
    await user.save();

    res.json({ devices: user.devices });
  } catch (err) {
    console.error('[remove device profile]', err);
    res.status(500).json({ error: 'Failed to remove profile' });
  }
});

// POST /api/users/devices/:deviceId/regenerate-token
router.post('/devices/:deviceId/regenerate-token', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const device = user.devices.find((d) => d.deviceId === req.params.deviceId);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    device.token = generateDeviceToken(device.deviceId);
    await user.save();

    res.json({ deviceId: device.deviceId, name: device.name, token: device.token });
  } catch (err) {
    console.error('[regenerate token]', err);
    res.status(500).json({ error: 'Failed to regenerate token' });
  }
});

export default router;
