// ActivityPub specific types and interfaces

export interface ActivityPubActor {
  '@context': string | string[];
  type: 'Person' | 'Service' | 'Organization';
  id: string; // Actor URI (https://yourserver.com/users/username)
  preferredUsername: string;
  name: string;
  summary?: string;
  icon?: {
    type: 'Image';
    url: string;
  };
  image?: {
    type: 'Image';
    url: string;
  };
  inbox: string; // Where to send activities to this actor
  outbox: string; // Actor's public activities
  following?: string; // Following collection URI
  followers?: string; // Followers collection URI
  publicKey: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
}

export interface ActivityPubActivity {
  '@context': string | string[];
  id: string; // Unique activity ID
  type: 'Create' | 'Update' | 'Delete' | 'Follow' | 'Accept' | 'Reject' | 'Like' | 'Announce';
  actor: string; // Actor URI who performed the activity
  object: string | ActivityPubObject; // What the activity is about
  target?: string; // Target of the activity
  to?: string[]; // Recipients
  cc?: string[]; // Carbon copy recipients
  published: string; // ISO timestamp
}

export interface ActivityPubObject {
  '@context': string | string[];
  id: string;
  type: 'Note' | 'Article' | 'Image' | 'Video';
  attributedTo: string; // Actor who created this
  content: string;
  contentMap?: { [lang: string]: string };
  mediaType?: string;
  attachment?: ActivityPubAttachment[];
  tag?: ActivityPubTag[];
  inReplyTo?: string; // For threaded conversations
  to?: string[];
  cc?: string[];
  published: string;
  url?: string;
}

export interface ActivityPubAttachment {
  type: 'Document' | 'Image' | 'Video' | 'Audio';
  url: string;
  mediaType: string;
  name?: string;
}

export interface ActivityPubTag {
  type: 'Mention' | 'Hashtag';
  name: string;
  href?: string; // For mentions, the actor URI
}

export interface FederationConfig {
  domain: string; // Your server's domain
  publicKey: string;
  privateKey: string;
  userAgent: string;
}

export interface RemoteServer {
  id: string;
  domain: string;
  software?: string; // mastodon, pleroma, etc.
  version?: string;
  lastSeen: Date;
  blocked: boolean;
}
