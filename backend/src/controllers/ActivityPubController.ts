import { Request, Response } from 'express';
import { ActivityPubActor, ActivityPubActivity } from '../types/activitypub';

export class ActivityPubController {
    // WebFinger discovery endpoint
    webfinger(req: Request, res: Response): void {
        const { resource } = req.query;
        
        // Check if resource parameter exists
        if (!resource || typeof resource !== 'string') {
            res.status(400).json({ error: 'Missing resource parameter' });
            return;
        }
        
        // Check if resource is in the correct format (acct:username@domain)
        const resourceRegex = /^acct:([^@]+)@(.+)$/;
        const match = resource.match(resourceRegex);
        
        if (!match) {
            res.status(400).json({ error: 'Invalid resource format' });
            return;
        }
        
        const [, username, domain] = match;
        
        // Check if the domain matches our server
        const federationDomain = process.env.FEDERATION_DOMAIN || 'localhost:3001';
        if (domain !== federationDomain) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        
        // Return WebFinger response
        res.status(200).json({
            subject: resource,
            aliases: [
                `https://${domain}/users/${username}`
            ],
            links: [
                {
                    rel: 'self',
                    type: 'application/activity+json',
                    href: `https://${domain}/users/${username}`
                },
                {
                    rel: 'http://webfinger.net/rel/profile-page',
                    type: 'text/html',
                    href: `https://${domain}/@${username}`
                }
            ]
        });
    }
    
    // Get actor profile
    getActor(req: Request, res: Response): void {
        const { username } = req.params;
        
        // mock actor object
        const federationDomain = process.env.FEDERATION_DOMAIN || 'localhost:3001';
        const actor: ActivityPubActor = {
            '@context': [
                'https://www.w3.org/ns/activitystreams',
                'https://w3id.org/security/v1'
            ],
            type: 'Person',
            id: `https://${federationDomain}/users/${username}`,
            preferredUsername: username,
            name: `${username} User`,
            summary: `I'm ${username} on Non-Relational Nation`,
            icon: {
                type: 'Image',
                url: `https://${federationDomain}/avatars/${username}.jpg`
            },
            inbox: `https://${federationDomain}/users/${username}/inbox`,
            outbox: `https://${federationDomain}/users/${username}/outbox`,
            followers: `https://${federationDomain}/users/${username}/followers`,
            following: `https://${federationDomain}/users/${username}/following`,
            publicKey: {
                id: `https://${federationDomain}/users/${username}#main-key`,
                owner: `https://${federationDomain}/users/${username}`,
                publicKeyPem: ``
            }
        };
        
        res.status(200).json(actor);
    }
    
    // Handle incoming activities
    inbox(req: Request, res: Response): void {
        const { username } = req.params;
        const activity: ActivityPubActivity = req.body;
        
        // In a real implementation, you would:
        // 1. Verify the signature of the incoming activity
        // 2. Validate the activity
        // 3. Process the activity (e.g., store it in a database)
        // 4. Forward to followers if appropriate
        
        // For now, we'll just acknowledge receipt
        console.log(`Received activity for user ${username}:`, activity);
        
        // Send a 202 Accepted response
        res.status(202).json({ 
            message: 'Activity received and will be processed',
            activityId: activity.id 
        });
    }
    
    // Get user's outbox (public activities)
    outbox(req: Request, res: Response): void {
        const { username } = req.params;
        
        // In a real implementation, you would fetch activities from a database
        // For now, we'll return a mock outbox
        const federationDomain = process.env.FEDERATION_DOMAIN || 'localhost:3001';
        const outbox = {
            '@context': 'https://www.w3.org/ns/activitystreams',
            id: `https://${federationDomain}/users/${username}/outbox`,
            type: 'OrderedCollection',
            totalItems: 0,
            orderedItems: []
        };
        
        res.status(200).json(outbox);
    }
    
    // Get user's followers
    followers(req: Request, res: Response): void {
        const { username } = req.params;
        
        // In a real implementation, you would fetch followers from a database
        // For now, we'll return a mock followers collection
        const federationDomain = process.env.FEDERATION_DOMAIN || 'localhost:3001';
        const followers = {
            '@context': 'https://www.w3.org/ns/activitystreams',
            id: `https://${federationDomain}/users/${username}/followers`,
            type: 'OrderedCollection',
            totalItems: 0,
            orderedItems: []
        };
        
        res.status(200).json(followers);
    }
    
    // Get user's following
    following(req: Request, res: Response): void {
        const { username } = req.params;
        
        // In a real implementation, you would fetch following from a database
        // For now, we'll return a mock following collection
        const federationDomain = process.env.FEDERATION_DOMAIN || 'localhost:3001';
        const following = {
            '@context': 'https://www.w3.org/ns/activitystreams',
            id: `https://${federationDomain}/users/${username}/following`,
            type: 'OrderedCollection',
            totalItems: 0,
            orderedItems: []
        };
        
        res.status(200).json(following);
    }
    
    // Handle incoming activities for the shared inbox
    sharedInbox(req: Request, res: Response): void {
        const activity: ActivityPubActivity = req.body;
        
        // In a real implementation, you would:
        // 1. Verify the signature of the incoming activity
        // 2. Validate the activity
        // 3. Process the activity (e.g., store it in a database)
        // 4. Forward to relevant users if appropriate
        
        // For now, we'll just acknowledge receipt
        console.log('Received activity for shared inbox:', activity);
        
        // Send a 202 Accepted response
        res.status(202).json({ 
            message: 'Activity received and will be processed',
            activityId: activity.id 
        });
    }
    
    // Other methods will be implemented later
}
