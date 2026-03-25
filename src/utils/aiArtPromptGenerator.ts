/**
 * AI Art Prompt Generator
 *
 * Generates contextual DALL-E and Midjourney prompts for verified purchases.
 * Supports multiple style variants and caches prompts to avoid regeneration.
 */

import { ArtStyle, PurchaseData, AIArtPromptResult } from '../types/social';

// ---------------------------------------------------------------------------
// In-memory prompt cache (replace with Redis in production)
// Key: `ai-prompt:${itemName}:${style}`, Value: { result, expiresAt }
// ---------------------------------------------------------------------------
interface CacheEntry {
  result: AIArtPromptResult;
  expiresAt: number;
}

const promptCache = new Map<string, CacheEntry>();

// 30-day TTL matches the specification. Adjust to a shorter value
// (e.g. 7 * 24 * 60 * 60 * 1000) if prompt templates update frequently.
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getCached(key: string): AIArtPromptResult | null {
  const entry = promptCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    promptCache.delete(key);
    return null;
  }
  return entry.result;
}

function setCache(key: string, result: AIArtPromptResult): void {
  promptCache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ---------------------------------------------------------------------------
// Style keyword banks
// ---------------------------------------------------------------------------
const STYLE_KEYWORDS: Record<ArtStyle, string[]> = {
  cinematic: [
    'cinematic lighting',
    'Hollywood production quality',
    'dramatic shadows',
    'anamorphic lens flare',
    '8K ultra-detail',
    'film grain',
  ],
  luxury: [
    'luxury brand photography',
    'Vogue aesthetic',
    'high-end fashion magazine',
    'gold accents',
    'marble background',
    'premium lifestyle',
  ],
  minimalist: [
    'clean composition',
    'white studio background',
    'modern sophistication',
    'negative space',
    'sharp focus',
    'Swiss design',
  ],
  dreamy: [
    'soft bokeh',
    'ethereal glow',
    'romantic atmosphere',
    'pastel tones',
    'dreamy haze',
    'fairy-light ambience',
  ],
};

// Render time estimates in seconds
const RENDER_TIME = {
  dalleHD: 60,
  midjourney: 45,
} as const;

// ---------------------------------------------------------------------------
// Category-specific prompt builders
// ---------------------------------------------------------------------------

function buildJewelryPrompts(
  data: PurchaseData,
  style: ArtStyle,
): Pick<AIArtPromptResult, 'dallEPrompt' | 'midjourneyPrompt'> {
  const desc = data.description ?? `${data.itemName}`;
  const styleBase =
    style === 'dreamy'
      ? 'soft ethereal glow, pastel crystal background'
      : style === 'minimalist'
      ? 'clean white studio background, sharp focus'
      : style === 'luxury'
      ? 'marble background, gold-leaf surface, Vogue editorial'
      : 'dramatic cinematic lighting, dark velvet background';

  return {
    dallEPrompt:
      `Ultra-luxury jewelry photography: ${desc} floating in a crystalline nebula. ` +
      `Golden light refracting through the diamond creating rainbow sparkles. ` +
      `${styleBase}, professional lighting, magazine-quality product photography, ` +
      `8K, shallow depth of field, ultra-detailed, luxury brand photography.`,
    midjourneyPrompt:
      `${desc} suspended in a golden nebula, sparkling brilliantly, ` +
      `surrounded by crystalline formations, luxury product photography, ` +
      `${styleBase}, 8K quality, professional jewelry photography style, ` +
      `magazine cover quality --ar 1:1 --quality 2 --style raw`,
  };
}

function buildTravelPrompts(
  data: PurchaseData,
  style: ArtStyle,
): Pick<AIArtPromptResult, 'dallEPrompt' | 'midjourneyPrompt'> {
  const location = data.location ?? 'a breathtaking destination';
  const timeOfDay =
    style === 'dreamy'
      ? 'blue hour'
      : style === 'minimalist'
      ? 'overcast soft light'
      : 'golden hour';

  return {
    dallEPrompt:
      `Cinematic travel photography of ${location} at ${timeOfDay}. ` +
      `Iconic landmarks glowing at sunset, romantic streets with warm ambient lighting, ` +
      `luxury boutique hotel facade, sophisticated wanderlust aesthetic, ` +
      `travel magazine quality, 8K, cinematic color grading, dreamy bokeh background, ` +
      `aspirational luxury travel imagery.`,
    midjourneyPrompt:
      `${location} at ${timeOfDay}: iconic landmarks glowing, romantic street scene, ` +
      `luxury hotel, sophistication and wanderlust, cinematic travel photography, ` +
      `warm golden lighting, dreamy color grading, magazine cover quality ` +
      `--ar 16:9 --quality 2 --niji 6`,
  };
}

function buildAutomotivePrompts(
  data: PurchaseData,
  style: ArtStyle,
): Pick<AIArtPromptResult, 'dallEPrompt' | 'midjourneyPrompt'> {
  const location = data.location ?? 'Premium Auto Center';
  const aesthetic =
    style === 'luxury'
      ? 'upscale showroom with polished marble floors'
      : style === 'minimalist'
      ? 'clean white garage, minimal aesthetic'
      : style === 'dreamy'
      ? 'golden light streaming through industrial windows'
      : 'modern professional service bay with dramatic lighting';

  return {
    dallEPrompt:
      `Professional automotive service center scene at ${location}: ` +
      `Luxury car on precision lift, expert mechanic in professional uniform ` +
      `using advanced diagnostic tools, ${aesthetic}, trust and expertise conveyed, ` +
      `professional automotive photography, 8K, sharp focus, automotive magazine quality.`,
    midjourneyPrompt:
      `Premium automotive service at ${location}: luxury car on precision lift, ` +
      `expert mechanic with diagnostic tools, ${aesthetic}, ` +
      `precision and excellence, trust and quality, 8K professional automotive photography ` +
      `--ar 16:9 --quality 2`,
  };
}

function buildAchievementPrompts(
  data: PurchaseData,
  style: ArtStyle,
): Pick<AIArtPromptResult, 'dallEPrompt' | 'midjourneyPrompt'> {
  const milestone = data.itemName;
  const background =
    style === 'dreamy'
      ? 'pastel cosmic dreamscape with soft clouds'
      : style === 'minimalist'
      ? 'clean gradient from deep navy to gold'
      : 'cosmic space filled with stars and particle effects';

  return {
    dallEPrompt:
      `Celebratory achievement visualization for "${milestone}": ` +
      `Golden trophy or medal floating in ${background}, ` +
      `gold and purple gradient, sparkles and light rays, ` +
      `success and accomplishment theme, cinematic lighting, 8K, ` +
      `motivational imagery, luxury aesthetic celebration.`,
    midjourneyPrompt:
      `Cosmic celebration of achievement "${milestone}": Golden trophy in ${background}, ` +
      `particle effects and sparkles, gold and purple gradients, ` +
      `success and accomplishment, cinematic celebration imagery, 8K quality ` +
      `--ar 1:1 --quality 2 --niji 6`,
  };
}

function buildGenericPrompts(
  data: PurchaseData,
  style: ArtStyle,
): Pick<AIArtPromptResult, 'dallEPrompt' | 'midjourneyPrompt'> {
  const styleDesc =
    style === 'cinematic'
      ? 'Hollywood cinematic'
      : style === 'luxury'
      ? 'Vogue luxury editorial'
      : style === 'minimalist'
      ? 'clean minimalist studio'
      : 'soft dreamy ethereal';

  return {
    dallEPrompt:
      `${styleDesc} product photography: ${data.itemName}, ` +
      `professional studio lighting, premium lifestyle aesthetic, ` +
      `8K resolution, magazine quality, sophisticated composition, ` +
      `luxury brand photography style, ultra-detailed.`,
    midjourneyPrompt:
      `${data.itemName} in ${styleDesc} style, premium product photography, ` +
      `professional lighting, luxury aesthetic, magazine quality, ` +
      `8K ultra-detail --ar 1:1 --quality 2 --style raw`,
  };
}

// ---------------------------------------------------------------------------
// Prompt length validation
// ---------------------------------------------------------------------------
function validatePromptLength(prompt: string, platform: string): string {
  // Approximate characters per token (GPT/OpenAI tokenizer benchmark on English prose).
const CHARS_PER_TOKEN = 4;
  // The 75–150 token target is the documented sweet-spot for DALL-E and Midjourney
  // prompt quality — short enough to avoid truncation, long enough for detail.
  const approxTokens = Math.ceil(prompt.length / CHARS_PER_TOKEN);
  if (approxTokens < 75 || approxTokens > 150) {
    console.warn(
      `[aiArtPromptGenerator] ${platform} prompt token count (~${approxTokens}) ` +
        `is outside optimal range (75-150). Consider adjusting the template.`,
    );
  }
  return prompt;
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

/**
 * Generates contextual AI art prompts for verified purchases.
 *
 * @param purchaseData  - Details about the purchased item.
 * @param style         - Visual style variant (default: 'cinematic').
 * @returns             - DALL-E prompt, Midjourney prompt, style keywords, and render time.
 */
export function generateAIArtPrompt(
  purchaseData: PurchaseData,
  style: ArtStyle = 'cinematic',
): AIArtPromptResult {
  const cacheKey = `ai-prompt:${purchaseData.itemName}:${style}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  const category = (purchaseData.category ?? '').toLowerCase();
  let prompts: Pick<AIArtPromptResult, 'dallEPrompt' | 'midjourneyPrompt'>;

  if (category.includes('jewelry') || category.includes('diamond') || category.includes('ring')) {
    prompts = buildJewelryPrompts(purchaseData, style);
  } else if (category.includes('travel') || category.includes('hotel') || category.includes('booking')) {
    prompts = buildTravelPrompts(purchaseData, style);
  } else if (category.includes('automotive') || category.includes('auto') || category.includes('car')) {
    prompts = buildAutomotivePrompts(purchaseData, style);
  } else if (category.includes('achievement') || category.includes('milestone')) {
    prompts = buildAchievementPrompts(purchaseData, style);
  } else {
    prompts = buildGenericPrompts(purchaseData, style);
  }

  const result: AIArtPromptResult = {
    dallEPrompt: validatePromptLength(prompts.dallEPrompt, 'DALL-E'),
    midjourneyPrompt: validatePromptLength(prompts.midjourneyPrompt, 'Midjourney'),
    styleKeywords: STYLE_KEYWORDS[style],
    estimatedRenderTime: RENDER_TIME.dalleHD,
  };

  setCache(cacheKey, result);
  return result;
}

export default generateAIArtPrompt;
