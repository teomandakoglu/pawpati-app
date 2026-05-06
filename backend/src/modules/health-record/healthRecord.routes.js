const express = require('express');
const router = express.Router();
const { authenticate } = require('../../shared/middleware');
const { HealthRecord, Feedback } = require('./healthRecord.model');
const Pet = require('../user/pet.model');
const VetClinic = require('../veterinary/vetClinic.model');
const { Order, Product } = require('../../shared/database/models');
const VetOCRPostProcessor = require('./vetOCRPostProcessor');

const ocrProcessor = new VetOCRPostProcessor();

/**
 * GET /api/v1/health-records/:petId
 * Get all health records for a pet
 */
router.get('/:petId', authenticate, async (req, res, next) => {
  try {
    const pet = await Pet.findOne({
      where: { id: req.params.petId, user_id: req.userId },
    });

    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    const records = await HealthRecord.findAll({
      where: { pet_id: pet.id },
      include: [{ model: VetClinic, as: 'clinic' }],
      order: [['record_date', 'DESC']],
    });

    res.json({
      success: true,
      data: { records },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/health-records/:petId
 * Create a health record (with optional OCR processing)
 */
router.post('/:petId', authenticate, async (req, res, next) => {
  try {
    const pet = await Pet.findOne({
      where: { id: req.params.petId, user_id: req.userId },
    });

    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    const record = await HealthRecord.create({
      ...req.body,
      pet_id: pet.id,
    });

    // If OCR text provided (from Cloud Vision), post-process with Vertex AI
    if (req.body.ocr_raw_text) {
      const ocrResult = await ocrProcessor.processOCRText(
        req.body.ocr_raw_text,
        {
          species: pet.species,
          breed: pet.breed,
          name: pet.name,
          allergies: pet.allergies,
        }
      );

      if (ocrResult.success) {
        await record.update({
          ocr_extracted_text: req.body.ocr_raw_text,
          ocr_processed: true,
          ocr_confidence: ocrResult.data.confidence_score,
          medications: ocrResult.data.medications || [],
          vitals: ocrResult.data.vitals || {},
          lab_results: ocrResult.data.lab_results || {},
          ai_analysis: ocrResult.data,
        });
      } else {
        await record.update({
          ocr_extracted_text: req.body.ocr_raw_text,
          ocr_processed: false,
        });
      }
    } else if (req.body.document_urls?.length > 0) {
      // Mark as pending OCR — Cloud Vision will process async
      await record.update({ ocr_processed: false });
    }

    // If record affects health profile, trigger AI re-evaluation
    if (req.body.affects_subscription) {
      await pet.update({
        ai_profile_version: pet.ai_profile_version + 1,
      });
    }

    res.status(201).json({
      success: true,
      data: { record },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/health-records/feedback
 * Submit product feedback (T+72h after delivery)
 */
router.post('/feedback', authenticate, async (req, res, next) => {
  try {
    const { order_id, product_id, pet_id, rating, comment, pet_liked, would_reorder } = req.body;

    // Verify order belongs to user
    const order = await Order.findOne({
      where: { id: order_id, user_id: req.userId },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const feedback = await Feedback.create({
      user_id: req.userId,
      order_id,
      product_id,
      pet_id,
      rating,
      comment,
      pet_liked,
      would_reorder,
    });

    res.status(201).json({
      success: true,
      data: { feedback, message: 'Geri bildiriminiz için teşekkürler! AI önerileriniz güncelleniyor.' },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/health-records/:petId/process-ocr/:recordId
 * Re-process OCR text for an existing health record via Vertex AI
 */
router.post('/:petId/process-ocr/:recordId', authenticate, async (req, res, next) => {
  try {
    const pet = await Pet.findOne({
      where: { id: req.params.petId, user_id: req.userId },
    });

    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found' });
    }

    const record = await HealthRecord.findOne({
      where: { id: req.params.recordId, pet_id: pet.id },
    });

    if (!record) {
      return res.status(404).json({ success: false, error: 'Health record not found' });
    }

    const rawText = req.body.ocr_raw_text || record.ocr_extracted_text;
    if (!rawText) {
      return res.status(400).json({ success: false, error: 'No OCR text available to process' });
    }

    const ocrResult = await ocrProcessor.processOCRText(rawText, {
      species: pet.species,
      breed: pet.breed,
      name: pet.name,
      allergies: pet.allergies,
    });

    if (ocrResult.success) {
      await record.update({
        ocr_extracted_text: rawText,
        ocr_processed: true,
        ocr_confidence: ocrResult.data.confidence_score,
        medications: ocrResult.data.medications || [],
        vitals: ocrResult.data.vitals || {},
        lab_results: ocrResult.data.lab_results || {},
        ai_analysis: ocrResult.data,
      });
    }

    res.json({
      success: ocrResult.success,
      data: {
        structured_data: ocrResult.data,
        model: ocrResult.model,
        token_count: ocrResult.tokenCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
