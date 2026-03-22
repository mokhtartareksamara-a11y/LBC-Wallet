// Lumina AI Genesis Greeting System
// Sends personalized, AI-style welcome messages to the first 1,000 users.

export interface UserInterests {
  travel?: string[];
  shopping?: string[];
  services?: string[];
  technology?: string[];
  other?: string[];
}

export interface NewUser {
  id: string;
  name: string;
  email: string;
  bio?: string;
}

export interface LuminaGreeting {
  id: string;
  userId: string;
  userName: string;
  message: string;
  personalizedElements: {
    interests: UserInterests;
    favoriteDestinations: string[];
    aiArtReference?: string;
    callToAction: string;
  };
  sentAt: Date;
  opened: boolean;
  openedAt?: Date;
}

export interface GenesisAnalytics {
  totalSent: number;
  totalOpened: number;
  openRate: number;
  topInterests: string[];
}

// ─── In-memory store (replace with a real DB in production) ─────────────────

const greetingStore = new Map<string, LuminaGreeting>();
let genesisUserCount = 0;
const MAX_GENESIS_USERS = 1000;

// ─── Lumina Genesis Greeting Service ────────────────────────────────────────

export class LuminaGenesisGreeting {
  /**
   * Send a personalized welcome greeting to a new user.
   * Only the first MAX_GENESIS_USERS users receive a genesis greeting.
   */
  async sendWelcomeGreeting(user: NewUser): Promise<LuminaGreeting | null> {
    try {
      genesisUserCount = await this.trackFirstThousandUsers();

      if (genesisUserCount > MAX_GENESIS_USERS) {
        console.info('[Lumina] Genesis greeting limit reached', {
          userCount: genesisUserCount,
        });
        return null;
      }

      const interests = this.inferUserInterests(user);
      const message = await this.generatePersonalizedMessage(
        user.name,
        interests
      );

      const greeting: LuminaGreeting = {
        id: `greeting_${Date.now()}_${user.id}`,
        userId: user.id,
        userName: user.name,
        message,
        personalizedElements: {
          interests,
          favoriteDestinations: interests.travel ?? [],
          aiArtReference: interests.technology?.includes('AI')
            ? 'AI-generated celebration posts'
            : undefined,
          callToAction: 'Explore the Platform',
        },
        sentAt: new Date(),
        opened: false,
      };

      // Persist greeting
      greetingStore.set(greeting.id, greeting);

      console.info('✨ Lumina Genesis greeting sent', {
        userId: user.id,
        userName: user.name,
        genesisNumber: genesisUserCount,
      });

      return greeting;
    } catch (error) {
      console.error('[Lumina] Failed to send greeting', error);
      throw error;
    }
  }

  /**
   * Generate a personalized welcome message based on user interests.
   * In production this calls an AI model (e.g. Claude).  Here it uses
   * deterministic templates so the service works without external deps.
   */
  async generatePersonalizedMessage(
    userName: string,
    interests: UserInterests
  ): Promise<string> {
    const hasTravel = (interests.travel?.length ?? 0) > 0;
    const hasAI = interests.technology?.includes('AI');
    const hasJewelry = interests.shopping?.includes('Jewelry');
    const hasAuto = interests.services?.includes('Auto Care');

    if (hasTravel && hasAI) {
      return this.renderTemplate(GREETING_TEMPLATES.TRAVEL_AI, userName, interests);
    }
    if (hasJewelry) {
      return this.renderTemplate(GREETING_TEMPLATES.JEWELRY, userName, interests);
    }
    if (hasAuto) {
      return this.renderTemplate(GREETING_TEMPLATES.AUTO, userName, interests);
    }
    return this.renderTemplate(GREETING_TEMPLATES.DEFAULT, userName, interests);
  }

  /**
   * Return the current count of users who have received a genesis greeting.
   */
  async trackFirstThousandUsers(): Promise<number> {
    return greetingStore.size;
  }

  /**
   * Mark a greeting as opened and record the timestamp.
   */
  async trackGreetingOpen(greetingId: string): Promise<void> {
    const greeting = greetingStore.get(greetingId);
    if (!greeting) {
      throw new Error(`Greeting not found: ${greetingId}`);
    }
    greeting.opened = true;
    greeting.openedAt = new Date();
    greetingStore.set(greetingId, greeting);
    console.info('[Lumina] Greeting opened', { greetingId });
  }

  /**
   * Return aggregate analytics for all sent genesis greetings.
   */
  async getGenesisAnalytics(): Promise<GenesisAnalytics> {
    const all = Array.from(greetingStore.values());
    const totalSent = all.length;
    const totalOpened = all.filter((g) => g.opened).length;

    return {
      totalSent,
      totalOpened,
      openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      topInterests: await this.getTopInterests(),
    };
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  /**
   * Infer user interests from profile bio text.
   */
  private inferUserInterests(user: NewUser): UserInterests {
    const interests: UserInterests = {};
    const bio = (user.bio ?? '').toLowerCase();

    if (bio.includes('paris') || bio.includes('travel')) {
      interests.travel = ['Paris', 'Travel'];
    }
    if (bio.includes('ai') || bio.includes('artificial intelligence') || bio.includes('art')) {
      interests.technology = ['AI', 'AI Art'];
    }
    if (bio.includes('jewelry') || bio.includes('diamond') || bio.includes('luxury')) {
      interests.shopping = ['Jewelry', 'Luxury'];
    }
    if (bio.includes('auto') || bio.includes('vehicle') || bio.includes('car')) {
      interests.services = ['Auto Care'];
    }

    return interests;
  }

  /**
   * Replace template placeholders with actual user data.
   */
  private renderTemplate(
    template: string,
    userName: string,
    interests: UserInterests
  ): string {
    return template
      .replace(/\[Name\]/g, userName)
      .replace(
        /\[Travel\]/g,
        interests.travel?.join(', ') ?? 'exciting destinations'
      );
  }

  /**
   * Derive the subject line from the user's inferred interests.
   */
  generateSubject(interests: UserInterests): string {
    if (
      interests.travel?.includes('Paris') &&
      interests.technology?.includes('AI')
    ) {
      return 'Welcome to LBC Hub, Visionary! ✨ Your Paris + AI Art Await';
    }
    if (interests.shopping?.includes('Jewelry')) {
      return 'Discover Lab Diamond Luxury in LBC Hub 💍';
    }
    if (interests.services?.includes('Auto Care')) {
      return 'Premium Vehicle Care Now in LBC Hub 🚗';
    }
    return 'Welcome to LBC Hub! ✨';
  }

  /**
   * Render an HTML email body for the given greeting.
   */
  renderGreetingHTML(greeting: LuminaGreeting): string {
    const paragraphs = greeting.message
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => `<p>${line}</p>`)
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; background: #0f0a28; color: #e2e8f0; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { text-align: center; margin-bottom: 30px; }
      .header h1 { color: #f59e0b; font-size: 28px; }
      .content { line-height: 1.7; color: #c4b5fd; }
      .cta-button {
        display: inline-block;
        padding: 12px 24px;
        margin: 20px 0;
        background: linear-gradient(to right, #8b5cf6, #ec4899);
        color: white;
        text-decoration: none;
        border-radius: 8px;
        font-weight: bold;
      }
      .signature { margin-top: 30px; color: #6b7280; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>✨ Welcome to LBC Hub</h1>
      </div>
      <div class="content">
        ${paragraphs}
        <a href="https://app.lbchub.com/marketplace" class="cta-button">
          Explore Marketplace
        </a>
      </div>
      <div class="signature">
        <p>Genesis User #${greetingStore.size} | LBC Hub Community</p>
      </div>
    </div>
  </body>
</html>`;
  }

  /** Return the most common interests across all sent greetings. */
  private async getTopInterests(): Promise<string[]> {
    const counts = new Map<string, number>();
    Array.from(greetingStore.values()).forEach((greeting) => {
      const { interests } = greeting.personalizedElements;
      (Object.values(interests) as string[][]).forEach((list) => {
        list.forEach((item) => {
          counts.set(item, (counts.get(item) ?? 0) + 1);
        });
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([item]) => item);
  }
}

// ─── Greeting Templates ──────────────────────────────────────────────────────

const GREETING_TEMPLATES = {
  TRAVEL_AI: `Dear [Name],

I'm Lumina, your AI guide through the LBC Hub ecosystem.

We noticed your passion for exploration and creation.
With interests in [Travel] ✈️ and AI art 🎨,
the LBC Hub was designed with visionaries like you in mind.

Here's what awaits:

💍 Lab Diamond Gold Rings - Celebrate milestones with lab-grown luxury
🚗 Terry Fox Auto Center - Premium care for your vehicles
✈️ Travel Marketplace - Book dream destinations like Paris
🎨 AI-Generated Posts - Your achievements, artistically celebrated

Your first verified purchase will automatically generate an
AI-enhanced celebration post on your Social Hub profile.

Ready to begin your journey?

With visionary regards,
Lumina AI ✨
LBC Hub Community Guide`,

  JEWELRY: `Hi [Name],

We've curated something special for you.

Your interest in premium jewelry caught our attention.
Lab Diamond Co. has just listed an exquisite collection
exclusively on LBC Hub—with verified seller status and
a 4.95/5 rating from 2,347 reviews.

When you purchase your first piece, celebrate it on your
Social Hub profile with AI-generated photography.

Browse the collection and make it yours today.

Best regards,
Lumina AI ✨`,

  AUTO: `Hello [Name],

Terry Fox Auto Center—trusted since 1985—is now available
on LBC Hub for seamless booking and payment.

Book your premium service package and post about it on your
Social Hub. Every booking generates a celebratory post with
real-time status updates.

Your vehicle deserves the best.

Lumina AI ✨`,

  DEFAULT: `Hey [Name],

You're entering a platform where blockchain meets social.
Every transaction is verified. Every achievement is celebrated.
Every user is a founder in their own story.

Explore verified products. Share your journey.
Build your reputation score.

This is LBC Hub. This is your ecosystem.

Lumina ✨`,
};

export default LuminaGenesisGreeting;
