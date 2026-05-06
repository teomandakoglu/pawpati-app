const { DataTypes } = require('sequelize');
const { sequelize } = require('../../shared/database/sequelize');

/**
 * Pet Model
 * Evcil hayvan profili - AI quiz sonuçları ve sağlık verileri
 */
const Pet = sequelize.define('pets', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  species: {
    type: DataTypes.ENUM('dog', 'cat', 'bird', 'other'),
    allowNull: false,
  },
  breed: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  birth_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'unknown'),
    defaultValue: 'unknown',
  },
  weight_kg: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: { min: 0.1, max: 200 },
  },
  is_neutered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  // AI Health Profile
  health_profile: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'AI-generated health profile from quiz + vet records',
  },
  allergies: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  chronic_conditions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  activity_level: {
    type: DataTypes.ENUM('low', 'moderate', 'high', 'very_high'),
    defaultValue: 'moderate',
  },
  dietary_preferences: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
  },
  // Quiz data
  quiz_responses: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '6-question onboarding quiz responses',
  },
  ai_profile_version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Version of AI health profile for tracking updates',
  },
}, {
  indexes: [
    { fields: ['user_id'] },
    { fields: ['species'] },
    { fields: ['breed'] },
  ],
});

module.exports = Pet;
