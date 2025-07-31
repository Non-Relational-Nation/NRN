import mongoose from 'mongoose';

const actorSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  uri: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v: string) => v !== '',
      message: 'URI must not be empty'
    }
  },
  handle: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v: string) => v !== '',
      message: 'Handle must not be empty'
    }
  },
  name: {
    type: String
  },
  inbox_url: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v: string) => /^https?:\/\//.test(v),
      message: 'Inbox URL must start with http:// or https://'
    }
  },
  shared_inbox_url: {
    type: String,
    validate: {
      validator: (v: string) => !v || /^https?:\/\//.test(v),
      message: 'Shared Inbox URL must start with http:// or https://'
    }
  },
  url: {
    type: String,
    validate: {
      validator: (v: string) => !v || /^https?:\/\//.test(v),
      message: 'URL must start with http:// or https://'
    }
  },
  created: {
    type: String,
    required: true,
    default: () => new Date().toISOString(),
    validate: {
      validator: (v: string) => v !== '',
      message: 'Created date must not be empty'
    }
  }
});

export const ActorModel = mongoose.model('Actor', actorSchema);
