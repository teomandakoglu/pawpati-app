const { DataTypes } = require('sequelize');
const { sequelize } = require('../../shared/database/sequelize');
const bcrypt = require('bcryptjs');

/**
 * User Model
 * Core user entity with KVKK consent tracking
 */
const User = sequelize.define('users', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^(\+90|0)?[0-9]{10}$/i,
    },
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  firebase_uid: {
    type: DataTypes.STRING(128),
    allowNull: true,
    unique: true,
  },
  // KVKK Compliance
  kvkk_consent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  kvkk_consent_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  marketing_consent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  data_processing_consent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Address
  address_line: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  postal_code: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  // Status
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended', 'deleted'),
    defaultValue: 'active',
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  quiz_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  onboarding_data: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'AI Quiz responses stored as JSON',
  },
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    },
  },
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['firebase_uid'] },
    { fields: ['status'] },
    { fields: ['city'] },
  ],
});

/**
 * Instance method to verify password
 */
User.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password_hash);
};

/**
 * Remove sensitive fields from JSON output
 */
User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password_hash;
  return values;
};

module.exports = User;
