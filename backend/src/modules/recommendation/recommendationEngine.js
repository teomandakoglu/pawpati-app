const { VertexAI } = require('@google-cloud/vertexai');
const config = require('../../config');
const { Product, Feedback, AIRecommendation } = require('../../shared/database/models');
const { Op } = require('sequelize');

/**
 * AI Recommendation Engine — Vertex AI (Gemini 1.5 Flash)
 * 
 * Pipeline:
 * 1. Vertex AI Gemini 1.5 Flash → Raw product recommendations (JSON enforced)
 * 2. Turkish Veterinary Product Taxonomy → Taxonomy-weighted re-ranking
 * 3. User feedback loop → Feedback-adjusted re-ranking
 * 4. Redis cache (TTL: 24h) → Final ranked list
 * 
 * Migration Note: Replaced OpenAI GPT-4 with Google Cloud Vertex AI.
 * Gemini 1.5 Flash is used for cost-effective, low-latency recommendations.
 * JSON output is enforced via responseMimeType: 'application/json'.
 */
class RecommendationEngine {
  constructor(redisClient) {
    this.redis = redisClient;
    this.CACHE_TTL = 86400; // 24 hours

    // Initialize Vertex AI client
    this.vertexAI = new VertexAI({
      project: config.vertexAI.projectId,
      location: config.vertexAI.location,
    });

    // Gemini 1.5 Flash for recommendations — fast & cost-effective
    this.generativeModel = this.vertexAI.getGenerativeModel({
      model: config.vertexAI.models.recommendation,
      generationConfig: config.vertexAI.generationConfig.recommendation,
      systemInstruction: {
        role: 'system',
        parts: [{
          text: `Sen Türkiye'deki evcil hayvanlar için uzmanlaşmış bir veteriner beslenme ve sağlık ürünü öneri motorusun.

ZORUNLU KURALLAR:
1. Her zaman geçerli JSON formatında yanıt ver.
2. Yanıtın bir JSON nesnesi olmalı ve "recommendations" anahtarı altında bir dizi içermeli.
3. Her öneri şu alanları içermeli: product_id (string), score (0.0-1.0 arası float), reason (Türkçe kısa açıklama).
4. Kontrendikasyonları dikkatle değerlendir — alerjik ürünleri ASLA önerme.
5. Türk Veteriner Ürün Taksonomisi sınıflandırmasına uygun değerlendir.
6. En uygun 5-8 ürün seç.`
        }],
      },
    });
  }

  /**
   * Generate recommendations for a pet
   * @param {Object} pet - Pet model instance with health_profile
   * @param {Object} subscription - Active subscription
   * @returns {Object} Ranked product recommendations
   */
  async generateRecommendations(pet, subscription) {
    // Check cache first
    const cacheKey = `recommendations:${pet.id}:v${pet.ai_profile_version}`;
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    // Step 1: Get Gemini raw recommendations
    const geminiResponse = await this._getGeminiRecommendations(pet);

    // Step 2: Taxonomy-weighted re-ranking
    const taxonomyScored = await this._applyTaxonomyWeighting(geminiResponse, pet);

    // Step 3: Feedback-based re-ranking
    const feedbackScored = await this._applyFeedbackReranking(taxonomyScored, pet);

    // Step 4: Create final ranked list
    const finalRanked = this._createFinalRanking(feedbackScored);

    // Save recommendation record
    const recommendation = await AIRecommendation.create({
      pet_id: pet.id,
      subscription_id: subscription?.id,
      gpt_raw_response: geminiResponse, // Field name kept for backward compat
      gpt_model_used: config.vertexAI.models.recommendation,
      gpt_tokens_used: geminiResponse.tokenCount || null,
      taxonomy_weighted_scores: taxonomyScored,
      feedback_adjusted_scores: feedbackScored,
      final_ranked_products: finalRanked,
      status: 'generated',
    });

    // Cache result
    if (this.redis) {
      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify({
        recommendation_id: recommendation.id,
        products: finalRanked,
        generated_at: new Date().toISOString(),
      }));
    }

    return {
      recommendation_id: recommendation.id,
      products: finalRanked,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Step 1: Get raw Gemini 1.5 Flash recommendations
   * Uses structured JSON output via responseMimeType
   */
  async _getGeminiRecommendations(pet) {
    // Get available products from database
    const availableProducts = await Product.findAll({
      where: {
        is_active: true,
        is_quarantined: false,
        target_species: { [Op.contains]: [pet.species] },
        stock_quantity: { [Op.gt]: 0 },
      },
      attributes: ['id', 'name', 'category', 'taxonomy_code', 'taxonomy_tags',
        'health_benefits', 'contraindications', 'ai_recommendation_score'],
    });

    const prompt = this._buildPrompt(pet, availableProducts);

    try {
      const result = await this.generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = result.response;
      const textContent = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textContent) {
        throw new Error('Empty response from Gemini');
      }

      const parsed = JSON.parse(textContent);

      return {
        recommendations: parsed.recommendations || parsed || [],
        tokenCount: response.usageMetadata?.totalTokenCount || null,
        model: config.vertexAI.models.recommendation,
        raw_prompt: prompt,
      };
    } catch (error) {
      console.error('Gemini recommendation error:', error);
      // Fallback: Use base AI scores from products
      return {
        recommendations: availableProducts.map(p => ({
          product_id: p.id,
          name: p.name,
          score: parseFloat(p.ai_recommendation_score) || 0.5,
          reason: 'Fallback: ürün baz skoruna dayalı öneri',
        })),
        tokenCount: null,
        fallback: true,
      };
    }
  }

  /**
   * Build Gemini prompt with pet health profile context
   */
  _buildPrompt(pet, products) {
    return `HASTA PROFİLİ:
- Tür: ${pet.species}
- Irk: ${pet.breed || 'Melez'}
- Yaş: ${this._calculateAge(pet.birth_date)}
- Ağırlık: ${pet.weight_kg} kg
- Aktivite Seviyesi: ${pet.activity_level}
- Kısırlaştırılmış: ${pet.is_neutered ? 'Evet' : 'Hayır'}
- Alerjiler: ${pet.allergies?.join(', ') || 'Yok'}
- Kronik Durumlar: ${pet.chronic_conditions?.join(', ') || 'Yok'}
- Sağlık Profili: ${JSON.stringify(pet.health_profile || {})}
- Diyet Tercihleri: ${JSON.stringify(pet.dietary_preferences || {})}

MEVCUT ÜRÜNLER:
${products.map(p => `- ID: ${p.id} | Ad: ${p.name} | Kategori: ${p.category} | Faydalar: ${p.health_benefits?.join(', ')} | Kontrendikasyonlar: ${p.contraindications?.join(', ')}`).join('\n')}

GÖREV: Bu evcil hayvanın aylık abonelik kutusu için en uygun 5-8 ürünü seç.

Yanıtı şu JSON formatında ver:
{
  "recommendations": [
    { "product_id": "uuid", "score": 0.95, "reason": "Türkçe açıklama" }
  ]
}`;
  }

  /**
   * Step 2: Apply Turkish Veterinary Product Taxonomy weighting
   */
  async _applyTaxonomyWeighting(geminiResponse, pet) {
    const recommendations = geminiResponse.recommendations || [];

    // Load taxonomy rules from database
    const productIds = recommendations.map(r => r.product_id);
    const products = await Product.findAll({
      where: { id: productIds },
      attributes: ['id', 'taxonomy_code', 'taxonomy_tags', 'contraindications'],
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    return recommendations.map(rec => {
      const product = productMap.get(rec.product_id);
      if (!product) return { ...rec, taxonomy_score: 0 };

      let taxonomyMultiplier = 1.0;

      // Boost products matching pet health needs
      if (pet.chronic_conditions?.length > 0 && product.taxonomy_tags) {
        const matchingTags = product.taxonomy_tags.filter(tag =>
          pet.chronic_conditions.some(condition =>
            tag.toLowerCase().includes(condition.toLowerCase())
          )
        );
        taxonomyMultiplier += matchingTags.length * 0.1;
      }

      // Penalize products with matching contraindications
      if (pet.allergies?.length > 0 && product.contraindications) {
        const conflicts = product.contraindications.filter(c =>
          pet.allergies.some(a => c.toLowerCase().includes(a.toLowerCase()))
        );
        if (conflicts.length > 0) {
          taxonomyMultiplier = 0; // Exclude completely
        }
      }

      return {
        ...rec,
        taxonomy_score: Math.min(rec.score * taxonomyMultiplier, 1.0),
        taxonomy_multiplier: taxonomyMultiplier,
      };
    }).filter(r => r.taxonomy_score > 0); // Remove contraindicated products
  }

  /**
   * Step 3: Re-rank based on historical user feedback
   */
  async _applyFeedbackReranking(taxonomyScored, pet) {
    // Get user's past feedback for this pet
    const feedbacks = await Feedback.findAll({
      where: {
        pet_id: pet.id,
        rating: { [Op.not]: null },
      },
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'category', 'taxonomy_tags'],
      }],
      order: [['created_at', 'DESC']],
      limit: 50,
    });

    if (feedbacks.length === 0) return taxonomyScored;

    // Build preference profile from feedback
    const categoryPreferences = {};
    const productScores = {};

    feedbacks.forEach(fb => {
      if (fb.product) {
        // Track product-level scores
        productScores[fb.product_id] = fb.rating / 5.0;

        // Track category preferences
        const cat = fb.product.category;
        if (!categoryPreferences[cat]) {
          categoryPreferences[cat] = { total: 0, count: 0 };
        }
        categoryPreferences[cat].total += fb.rating;
        categoryPreferences[cat].count += 1;
      }
    });

    return taxonomyScored.map(rec => {
      let feedbackMultiplier = 1.0;

      // Direct product feedback
      if (productScores[rec.product_id]) {
        feedbackMultiplier *= (0.5 + productScores[rec.product_id] * 0.5);
      }

      // Pet liked boost
      const directFeedback = feedbacks.find(f => f.product_id === rec.product_id);
      if (directFeedback?.pet_liked === true) {
        feedbackMultiplier *= 1.2;
      } else if (directFeedback?.pet_liked === false) {
        feedbackMultiplier *= 0.5;
      }

      return {
        ...rec,
        feedback_score: Math.min(rec.taxonomy_score * feedbackMultiplier, 1.0),
        feedback_multiplier: feedbackMultiplier,
      };
    });
  }

  /**
   * Step 4: Create final ranked product list
   */
  _createFinalRanking(scoredProducts) {
    return scoredProducts
      .sort((a, b) => (b.feedback_score || b.taxonomy_score || b.score) -
                       (a.feedback_score || a.taxonomy_score || a.score))
      .map((product, index) => ({
        product_id: product.product_id,
        rank: index + 1,
        score: product.feedback_score || product.taxonomy_score || product.score,
        reason: product.reason,
        scoring_breakdown: {
          gemini_base: product.score,
          taxonomy_weighted: product.taxonomy_score,
          feedback_adjusted: product.feedback_score,
        },
      }));
  }

  _calculateAge(birthDate) {
    if (!birthDate) return 'Bilinmiyor';
    const now = new Date();
    const birth = new Date(birthDate);
    const months = (now.getFullYear() - birth.getFullYear()) * 12 +
                   (now.getMonth() - birth.getMonth());
    if (months < 12) return `${months} aylık`;
    return `${Math.floor(months / 12)} yıl ${months % 12} aylık`;
  }
}

module.exports = RecommendationEngine;
