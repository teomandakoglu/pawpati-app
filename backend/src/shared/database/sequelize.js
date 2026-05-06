const { Sequelize } = require('sequelize');
const config = require('../../config');

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging,
    pool: config.database.pool,
    dialectOptions: config.database.ssl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true, // Soft delete for KVKK compliance
      freezeTableName: true,
    },
  }
);

/**
 * Initialize PostGIS extension
 * Required for vet clinic spatial queries and distance calculations
 */
async function initPostGIS() {
  try {
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // PostGIS GIST spatial index for vet_clinics.location
    // Critical for ST_DWithin and ST_Distance query performance
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vet_clinics_location_gist'
        ) THEN
          CREATE INDEX idx_vet_clinics_location_gist
          ON vet_clinics USING GIST (location);
        END IF;
      END $$;
    `);

    console.log('✅ PostGIS & UUID extensions initialized');
    console.log('✅ GIST spatial index on vet_clinics.location verified');
  } catch (error) {
    console.error('❌ PostGIS initialization failed:', error.message);
  }
}

module.exports = { sequelize, initPostGIS };
