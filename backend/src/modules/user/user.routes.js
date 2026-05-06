const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const config = require('../../config');
const User = require('./user.model');
const Pet = require('./pet.model');
const { authenticate, validate } = require('../../shared/middleware');

// ============================================================
//  AUTH ROUTES
// ============================================================

/**
 * POST /api/v1/users/register
 * Register a new user
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, phone, kvkk_consent } = req.body;

    if (!kvkk_consent) {
      return res.status(400).json({
        success: false,
        error: 'KVKK onayı zorunludur',
        code: 'KVKK_CONSENT_REQUIRED',
      });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Bu e-posta adresi zaten kayıtlı',
        code: 'EMAIL_EXISTS',
      });
    }

    const user = await User.create({
      email,
      password_hash: password,
      first_name,
      last_name,
      phone,
      kvkk_consent,
      kvkk_consent_date: new Date(),
      data_processing_consent: true,
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.status(201).json({
      success: true,
      data: { user: user.toJSON(), token },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/users/login
 * Login with email/password
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email, status: 'active' } });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz e-posta veya şifre',
        code: 'INVALID_CREDENTIALS',
      });
    }

    await user.update({ last_login_at: new Date() });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      success: true,
      data: { user: user.toJSON(), token },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  USER PROFILE ROUTES (Authenticated)
// ============================================================

/**
 * GET /api/v1/users/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, {
      include: [{ model: Pet, as: 'pets' }],
    });

    res.json({
      success: true,
      data: { user: user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/users/me
 * Update current user profile
 */
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const allowedFields = ['first_name', 'last_name', 'phone', 'avatar_url',
      'address_line', 'city', 'district', 'postal_code', 'marketing_consent'];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    await req.user.update(updates);

    res.json({
      success: true,
      data: { user: req.user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  PET ROUTES (Authenticated)
// ============================================================

/**
 * POST /api/v1/users/pets
 * Add a new pet
 */
router.post('/pets', authenticate, async (req, res, next) => {
  try {
    const pet = await Pet.create({
      ...req.body,
      user_id: req.userId,
    });

    res.status(201).json({
      success: true,
      data: { pet },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/users/pets
 * Get all pets for current user
 */
router.get('/pets', authenticate, async (req, res, next) => {
  try {
    const pets = await Pet.findAll({
      where: { user_id: req.userId },
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: { pets },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/users/pets/:petId
 * Update pet profile
 */
router.put('/pets/:petId', authenticate, async (req, res, next) => {
  try {
    const pet = await Pet.findOne({
      where: { id: req.params.petId, user_id: req.userId },
    });

    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found',
      });
    }

    await pet.update(req.body);

    res.json({
      success: true,
      data: { pet },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/users/quiz
 * Submit onboarding quiz responses (6 questions)
 */
router.post('/quiz', authenticate, async (req, res, next) => {
  try {
    const { pet_id, responses } = req.body;

    if (!responses || responses.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Quiz must contain exactly 6 responses',
      });
    }

    const pet = await Pet.findOne({
      where: { id: pet_id, user_id: req.userId },
    });

    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    // Update pet with quiz data
    await pet.update({
      quiz_responses: responses,
      health_profile: {
        ...pet.health_profile,
        quiz_based: true,
        last_quiz_date: new Date().toISOString(),
      },
    });

    // Mark user quiz as completed
    await req.user.update({
      quiz_completed: true,
      onboarding_data: { responses, completed_at: new Date() },
    });

    res.json({
      success: true,
      data: {
        message: 'Quiz completed successfully! AI is generating your personalized recommendations.',
        pet,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
