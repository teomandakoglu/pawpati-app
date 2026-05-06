const express = require('express');
const router = express.Router();
const { authenticate } = require('../../shared/middleware');
const SubscriptionService = require('./subscriptionService');
const Subscription = require('./subscription.model');
const Pet = require('../user/pet.model');

const subscriptionService = new SubscriptionService();

/**
 * GET /api/v1/subscriptions
 * Get all subscriptions for current user
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const subscriptions = await Subscription.findAll({
      where: { user_id: req.userId },
      include: [{ model: Pet, as: 'pet' }],
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: { subscriptions },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/subscriptions
 * Create a new subscription
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { pet_id, plan_type, plan_name } = req.body;

    const pet = await Pet.findOne({
      where: { id: pet_id, user_id: req.userId },
    });

    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    // Check for existing active subscription for this pet
    const existing = await Subscription.findOne({
      where: {
        pet_id,
        user_id: req.userId,
        status: ['active', 'trial', 'paused'],
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Bu evcil hayvan için zaten aktif bir abonelik var',
      });
    }

    const priceMap = {
      monthly: 29900, // 299 TRY
      quarterly: 79900,
      biannual: 149900,
      annual: 269900,
    };

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

    const subscription = await Subscription.create({
      user_id: req.userId,
      pet_id,
      plan_type: plan_type || 'monthly',
      plan_name: plan_name || 'PawPati Essential',
      price_cents: priceMap[plan_type] || priceMap.monthly,
      status: 'trial',
      trial_ends_at: trialEnd,
      current_period_start: new Date(),
      current_period_end: trialEnd,
      next_billing_date: trialEnd,
    });

    res.status(201).json({
      success: true,
      data: { subscription },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/subscriptions/:id/pause
 * Pause subscription (retention strategy)
 */
router.post('/:id/pause', authenticate, async (req, res, next) => {
  try {
    const { duration_months } = req.body;
    const result = await subscriptionService.pauseSubscription(
      req.params.id,
      duration_months || 1
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/subscriptions/:id/resume
 * Resume a paused subscription
 */
router.post('/:id/resume', authenticate, async (req, res, next) => {
  try {
    const result = await subscriptionService.resumeSubscription(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/subscriptions/:id/cancel
 * Initiate cancellation (shows KVKK warning + pause offer)
 */
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const result = await subscriptionService.initiateCancellation(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/subscriptions/:id/cancel/confirm
 * Confirm cancellation after KVKK warning
 */
router.post('/:id/cancel/confirm', authenticate, async (req, res, next) => {
  try {
    const result = await subscriptionService.confirmCancellation(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
