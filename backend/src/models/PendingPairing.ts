import mongoose, { Document, Schema } from 'mongoose';

export interface IPendingPairing extends Document {
  pairingCode: string;
  lastSeenAt: Date;
}

const pendingPairingSchema = new Schema<IPendingPairing>(
  {
    pairingCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    lastSeenAt:  { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

// TTL: drop announcements that haven't refreshed in 10 minutes
pendingPairingSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 600 });

export const PendingPairing = mongoose.model<IPendingPairing>('PendingPairing', pendingPairingSchema);
