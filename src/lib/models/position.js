import mongoose from 'mongoose';

const positionSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true,
    index: true 
  },
  deviceId: { 
    type: String, 
    required: true,
    index: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  lat: { 
    type: Number, 
    required: true 
  },
  lng: { 
    type: Number, 
    required: true 
  },
  accuracy: { 
    type: Number, 
    default: null 
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true 
  }
});

// Índices para mejor performance
positionSchema.index({ deviceId: 1, timestamp: -1 });
positionSchema.index({ userId: 1, timestamp: -1 });
positionSchema.index({ timestamp: -1 });

export default mongoose.models.Position || mongoose.model('Position', positionSchema);