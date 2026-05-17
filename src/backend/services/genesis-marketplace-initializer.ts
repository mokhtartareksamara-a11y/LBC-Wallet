// Genesis Marketplace Initializer
// Populates the LBC Hub marketplace with foundational products on first launch.

export interface SellerInfo {
  id: string;
  name: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  logo: string;
}

export interface SpotlightInfo {
  rank: number;
  badge: string;
  salesVolume: number;
  monthlyTransactions: number;
}

export interface GenesisProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  currency: string;
  seller: {
    sellerId: string;
    sellerName: string;
    verified: boolean;
    rating: number;
    reviewCount: number;
  };
  images: string[];
  featured: boolean;
  genesisProduct: true;
  spotlight: SpotlightInfo;
  createdAt: Date;
}

export interface InitializationResult {
  success: boolean;
  productsCreated: number;
  sellersCreated: number;
  timestamp: Date;
  genesisProductIds: string[];
}

export interface GenesisMarketplaceInit {
  initializeGenesis(): Promise<InitializationResult>;
  getGenesisProducts(): Promise<GenesisProduct[]>;
  pinGenesisProducts(): Promise<void>;
}

// ─── Static Genesis Product Definitions ────────────────────────────────────

export const GENESIS_PRODUCTS = {
  LAB_DIAMOND: {
    id: 'product_lab_diamond_001',
    name: 'Lab Diamond Gold Ring - 2.5CT Brilliant Cut',
    category: 'Jewelry',
    description: `Exquisite 2.5-carat lab-grown diamond set in 18K gold.
Brilliant cut with rainbow sparkle effects.
Certified by the Gemological Institute.
A symbol of modern luxury and ethical craftsmanship.`,
    price: 4500,
    currency: 'USD',
    seller: {
      sellerId: 'seller_lab_diamond_co',
      sellerName: 'Lab Diamond Co.',
      verified: true,
      rating: 4.95,
      reviewCount: 2347,
    },
    images: [
      'https://cdn.lbchub.com/genesis/lab-diamond-ring-1.jpg',
      'https://cdn.lbchub.com/genesis/lab-diamond-ring-2.jpg',
      'https://cdn.lbchub.com/genesis/lab-diamond-ring-3.jpg',
    ],
    featured: true as const,
    genesisProduct: true as const,
    spotlight: {
      rank: 1,
      badge: 'TOP_SELLER',
      salesVolume: 2_450_000,
      monthlyTransactions: 542,
    },
  },

  TERRY_FOX_AUTO: {
    id: 'product_terry_fox_auto_001',
    name: 'Premium Vehicle Service Package',
    category: 'Automotive',
    description: `Comprehensive vehicle maintenance including:
✓ Full synthetic oil change
✓ Premium tire rotation
✓ Fluid system inspection
✓ Advanced diagnostic scan
✓ Belt and hose inspection

Trust Terry Fox Auto Center since 1985.
Excellence in every service.`,
    price: 850,
    currency: 'USD',
    seller: {
      sellerId: 'seller_terry_fox_auto',
      sellerName: 'Terry Fox Auto Center',
      verified: true,
      rating: 4.85,
      reviewCount: 1823,
    },
    images: [
      'https://cdn.lbchub.com/genesis/terry-fox-auto-1.jpg',
      'https://cdn.lbchub.com/genesis/terry-fox-auto-2.jpg',
      'https://cdn.lbchub.com/genesis/terry-fox-auto-3.jpg',
    ],
    featured: true as const,
    genesisProduct: true as const,
    spotlight: {
      rank: 2,
      badge: 'TOP_SELLER',
      salesVolume: 892_500,
      monthlyTransactions: 1050,
    },
  },
} as const;

// ─── Genesis Marketplace Initializer Service ────────────────────────────────

export class GenesisMarketplaceInitializer implements GenesisMarketplaceInit {
  private genesisProducts: GenesisProduct[] = [];
  private sellers: Map<string, SellerInfo> = new Map();

  /**
   * Create or update a seller record.
   */
  private async createOrUpdateSeller(info: SellerInfo): Promise<SellerInfo> {
    this.sellers.set(info.id, info);
    return info;
  }

  /**
   * Persist a product and return it with a creation timestamp.
   */
  private async createProduct(
    product: Omit<GenesisProduct, 'createdAt'>
  ): Promise<GenesisProduct> {
    const record: GenesisProduct = { ...product, createdAt: new Date() };
    this.genesisProducts.push(record);
    return record;
  }

  /**
   * Mark products as pinned to the featured section.
   * In a real implementation this would write to a database.
   */
  private async pinToFeatured(productIds: string[]): Promise<void> {
    productIds.forEach((id) => {
      const product = this.genesisProducts.find((p) => p.id === id);
      if (product) {
        product.featured = true;
      }
    });
  }

  /**
   * Set spotlight rankings for the given products.
   * In a real implementation this would write to a database.
   */
  private async initializeSpotlightRankings(
    rankings: Array<{ productId: string; rank: number }>
  ): Promise<void> {
    rankings.forEach(({ productId, rank }) => {
      const product = this.genesisProducts.find((p) => p.id === productId);
      if (product) {
        product.spotlight.rank = rank;
      }
    });
  }

  /**
   * Attach the "genesis" badge to a product.
   * In a real implementation this would update the database record.
   */
  private async markAsGenesisProduct(productId: string): Promise<void> {
    const product = this.genesisProducts.find((p) => p.id === productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }
    // genesisProduct flag is already set; this step creates the badge metadata.
    console.info(`[Genesis] Badge applied to product ${productId}`);
  }

  // ─── Public Interface ─────────────────────────────────────────────────────

  /**
   * Run the full genesis initialization sequence.
   */
  async initializeGenesis(): Promise<InitializationResult> {
    try {
      console.info('🌟 Initializing LBC Hub Genesis Marketplace...');

      // Step 1: Create sellers
      const labDiamondSeller = await this.createOrUpdateSeller({
        id: 'seller_lab_diamond_co',
        name: 'Lab Diamond Co.',
        verified: true,
        rating: 4.95,
        reviewCount: 2347,
        logo: 'https://cdn.lbchub.com/sellers/lab-diamond-logo.png',
      });

      const terryFoxSeller = await this.createOrUpdateSeller({
        id: 'seller_terry_fox_auto',
        name: 'Terry Fox Auto Center',
        verified: true,
        rating: 4.85,
        reviewCount: 1823,
        logo: 'https://cdn.lbchub.com/sellers/terry-fox-logo.png',
      });

      // Step 2: Create products
      const labDiamondProduct = await this.createProduct({
        ...GENESIS_PRODUCTS.LAB_DIAMOND,
        images: [...GENESIS_PRODUCTS.LAB_DIAMOND.images],
        seller: {
          sellerId: labDiamondSeller.id,
          sellerName: labDiamondSeller.name,
          verified: labDiamondSeller.verified,
          rating: labDiamondSeller.rating,
          reviewCount: labDiamondSeller.reviewCount,
        },
      });

      const terryFoxProduct = await this.createProduct({
        ...GENESIS_PRODUCTS.TERRY_FOX_AUTO,
        images: [...GENESIS_PRODUCTS.TERRY_FOX_AUTO.images],
        seller: {
          sellerId: terryFoxSeller.id,
          sellerName: terryFoxSeller.name,
          verified: terryFoxSeller.verified,
          rating: terryFoxSeller.rating,
          reviewCount: terryFoxSeller.reviewCount,
        },
      });

      // Step 3: Pin to featured section
      await this.pinToFeatured([labDiamondProduct.id, terryFoxProduct.id]);

      // Step 4: Initialize spotlight rankings
      await this.initializeSpotlightRankings([
        { productId: labDiamondProduct.id, rank: 1 },
        { productId: terryFoxProduct.id, rank: 2 },
      ]);

      // Step 5: Create genesis badge metadata
      await this.markAsGenesisProduct(labDiamondProduct.id);
      await this.markAsGenesisProduct(terryFoxProduct.id);

      console.info('✅ Genesis Marketplace initialized successfully');

      return {
        success: true,
        productsCreated: 2,
        sellersCreated: 2,
        timestamp: new Date(),
        genesisProductIds: [labDiamondProduct.id, terryFoxProduct.id],
      };
    } catch (error) {
      console.error('❌ Genesis Marketplace initialization failed', error);
      throw error;
    }
  }

  /**
   * Return all genesis products currently registered.
   */
  async getGenesisProducts(): Promise<GenesisProduct[]> {
    return this.genesisProducts.filter((p) => p.genesisProduct);
  }

  /**
   * Ensure all genesis products are pinned to the featured section.
   */
  async pinGenesisProducts(): Promise<void> {
    const ids = this.genesisProducts
      .filter((p) => p.genesisProduct)
      .map((p) => p.id);
    await this.pinToFeatured(ids);
  }
}

export default GenesisMarketplaceInitializer;
