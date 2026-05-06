const { DataTypes } = require('sequelize');
const { sequelize } = require('../../shared/database/sequelize');

/**
 * VetClinic Model
 * Veteriner klinik ağı - PostGIS konum ve mesafe hesaplamaları
 */
const VetClinic = sequelize.define('vet_clinics', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  // Contact
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  website: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  // Address
  address: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  postal_code: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  // PostGIS Geometry (POINT)
  // Stored as geography type for accurate distance calculations
  location: {
    type: DataTypes.GEOMETRY('POINT', 4326),
    allowNull: false,
    comment: 'PostGIS point geometry for spatial queries (SRID 4326)',
  },
  // Clinic details
  services: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'e.g., surgery, vaccination, dental, emergency',
  },
  specializations: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  accepted_species: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: ['dog', 'cat'],
  },
  // Operating hours
  operating_hours: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: '{ "monday": { "open": "09:00", "close": "18:00" }, ... }',
  },
  is_24h_emergency: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // PawPati partnership
  is_partner: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'PawPati partner clinics get priority in listings',
  },
  partner_discount_percent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  qr_code_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    comment: 'Dynamic QR code identifier for dashboard',
  },
  // Ratings
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    validate: { min: 0, max: 5 },
  },
  review_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Media
  image_urls: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['city'] },
    { fields: ['is_partner'] },
    { fields: ['is_active'] },
    { fields: ['is_24h_emergency'] },
    // PostGIS spatial index - created via raw SQL in migration
  ],
});

module.exports = VetClinic;
