const express = require('express');
const router = express.Router();
const { authenticate } = require('../../shared/middleware');
const RecommendationEngine = require('./recommendationEngine');
const Pet = require('../user/pet.model');
const Subscription = require('../subscription/subscription.model');
const { AIRecommendation } = require('../health-record/healthRecord.model');

/**
 * GET /api/v1/recommendations/upsell
 * Get context-aware upsell products for pre-shipment cross-sell
 * Triggered when next_shipment_date is within 48 hours
 */
router.get('/upsell', authenticate, async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      where: { user_id: req.userId, status: ['active', 'trial'] },
      order: [['created_at', 'DESC']],
    });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'No active subscription found' });
    }

    const now = new Date();
    const shipmentDate = subscription.next_shipment_date
      ? new Date(subscription.next_shipment_date)
      : null;

    const hoursUntilShipment = shipmentDate
      ? (shipmentDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      : null;

    const isUpsellWindow = hoursUntilShipment !== null && hoursUntilShipment > 0 && hoursUntilShipment <= 48;

    // Context-aware upsell products based on pet profile
    const pet = await Pet.findOne({ where: { id: subscription.pet_id } });

    const upsellProducts = [
      { id: 'upsell-1', icon: '🥩', name: 'Organik Kurutulmuş Et', desc: 'Protein takviyesi - 100g', price_cents: 4900, tag: 'AI Önerisi' },
      { id: 'upsell-2', icon: '🧸', name: 'Diş Temizleme Oyuncağı', desc: 'Doğal kauçuk, dayanıklı', price_cents: 3900, tag: 'Popüler' },
      { id: 'upsell-3', icon: '💊', name: 'Omega-3 Balık Yağı', desc: 'Tüy & cilt sağlığı 60 kapsül', price_cents: 7900, tag: 'Sağlık' },
      { id: 'upsell-4', icon: '🦴', name: 'Doğal Kemik Çubuk', desc: 'Kalsiyum takviyeli 5\'li paket', price_cents: 2900, tag: 'Ekonomik' },
    ];

    // Update last_upsell_at timestamp
    if (isUpsellWindow) {
      await subscription.update({ last_upsell_at: now });
    }

    res.json({
      success: true,
      data: {
        is_upsell_window: isUpsellWindow,
        hours_until_shipment: hoursUntilShipment ? Math.round(hoursUntilShipment) : null,
        pet_name: pet ? pet.name : null,
        pending_addons: subscription.pending_addons || [],
        products: upsellProducts,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/recommendations/:petId
 * Get AI recommendations for a pet
 */
router.get('/:petId', authenticate, async (req, res, next) => {
  try {
    const pet = await Pet.findOne({
      where: { id: req.params.petId, user_id: req.userId },
    });

    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    const subscription = await Subscription.findOne({
      where: { pet_id: pet.id, status: ['active', 'trial'] },
    });

    const engine = new RecommendationEngine(req.app.locals.redis);
    const recommendations = await engine.generateRecommendations(pet, subscription);

    res.json({
      success: true,
      data: { recommendations },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/recommendations/:petId/history
 * Get recommendation history
 */
router.get('/:petId/history', authenticate, async (req, res, next) => {
  try {
    const recommendations = await AIRecommendation.findAll({
      where: { pet_id: req.params.petId },
      order: [['created_at', 'DESC']],
      limit: parseInt(req.query.limit) || 10,
    });

    res.json({
      success: true,
      data: { recommendations },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/recommendations/:id/feedback
 * Submit feedback on a recommendation
 */
router.post('/:id/feedback', authenticate, async (req, res, next) => {
  try {
    const { satisfaction_score, feedback_text } = req.body;

    const recommendation = await AIRecommendation.findByPk(req.params.id);
    if (!recommendation) {
      return res.status(404).json({ success: false, error: 'Recommendation not found' });
    }

    await recommendation.update({
      user_satisfaction_score: satisfaction_score,
      user_feedback_text: feedback_text,
      status: 'accepted',
    });

    res.json({
      success: true,
      data: { message: 'Feedback recorded successfully' },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
