const express = require('express');
const router = express.Router();
const { authenticate } = require('../../shared/middleware');
const VetClinic = require('./vetClinic.model');
const { sequelize } = require('../../shared/database/sequelize');
const { Op } = require('sequelize');

/**
 * GET /api/v1/veterinary/clinics
 * Search vet clinics with optional PostGIS proximity
 */
router.get('/clinics', authenticate, async (req, res, next) => {
  try {
    const { lat, lng, radius_km = 10, city, species, emergency_only, partner_only } = req.query;

    let clinics;

    if (lat && lng) {
      // PostGIS distance query - find clinics within radius
      const point = `POINT(${parseFloat(lng)} ${parseFloat(lat)})`;
      const radiusMeters = parseFloat(radius_km) * 1000;

      clinics = await sequelize.query(`
        SELECT 
          *,
          ST_Distance(
            location::geography,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
          ) as distance_meters
        FROM vet_clinics
        WHERE is_active = true
          AND deleted_at IS NULL
          AND ST_DWithin(
            location::geography,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :radius
          )
          ${emergency_only === 'true' ? 'AND is_24h_emergency = true' : ''}
          ${partner_only === 'true' ? 'AND is_partner = true' : ''}
          ${species ? "AND :species = ANY(accepted_species)" : ''}
          ${city ? 'AND city = :city' : ''}
        ORDER BY distance_meters ASC
        LIMIT 50
      `, {
        replacements: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          radius: radiusMeters,
          species,
          city,
        },
        type: sequelize.QueryTypes.SELECT,
      });

      // Convert distance to km
      clinics = clinics.map(c => ({
        ...c,
        distance_km: (c.distance_meters / 1000).toFixed(2),
      }));
    } else {
      // Standard query without location
      const where = { is_active: true };
      if (city) where.city = city;
      if (emergency_only === 'true') where.is_24h_emergency = true;
      if (partner_only === 'true') where.is_partner = true;
      if (species) where.accepted_species = { [Op.contains]: [species] };

      clinics = await VetClinic.findAll({
        where,
        order: [['is_partner', 'DESC'], ['rating', 'DESC']],
        limit: 50,
      });
    }

    res.json({
      success: true,
      data: {
        clinics,
        count: clinics.length,
        search_params: { lat, lng, radius_km, city },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/veterinary/clinics/:id
 * Get clinic details
 */
router.get('/clinics/:id', authenticate, async (req, res, next) => {
  try {
    const clinic = await VetClinic.findByPk(req.params.id);
    if (!clinic) {
      return res.status(404).json({ success: false, error: 'Clinic not found' });
    }

    res.json({
      success: true,
      data: { clinic },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/veterinary/clinics/:id/qr
 * Generate dynamic QR code data for a clinic
 */
router.get('/clinics/:id/qr', authenticate, async (req, res, next) => {
  try {
    const clinic = await VetClinic.findByPk(req.params.id);
    if (!clinic) {
      return res.status(404).json({ success: false, error: 'Clinic not found' });
    }

    // Generate QR code data with user context
    const qrData = {
      type: 'pawpati_vet_visit',
      clinic_id: clinic.id,
      clinic_name: clinic.name,
      user_id: req.userId,
      timestamp: new Date().toISOString(),
      discount: clinic.is_partner ? clinic.partner_discount_percent : 0,
      url: `${process.env.APP_URL}/vet/${clinic.slug}?ref=${req.userId}`,
    };

    res.json({
      success: true,
      data: {
        qr_data: JSON.stringify(qrData),
        clinic: {
          name: clinic.name,
          address: clinic.address,
          phone: clinic.phone,
          is_partner: clinic.is_partner,
          discount: clinic.partner_discount_percent,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
