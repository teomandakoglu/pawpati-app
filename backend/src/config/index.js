require('dotenv').config();

module.exports = {
  app: {
    port: parseInt(process.env.PORT, 10) || 8080,
    env: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1',
    url: process.env.APP_URL || 'http://localhost:3000',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'pawpati_dev',
    user: process.env.DB_USER || 'pawpati_admin',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    dialect: 'postgres',
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    keyPrefix: 'pawpati:',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  vertexAI: {
    projectId: process.env.GCP_PROJECT_ID,
    location: process.env.GCP_LOCATION || 'europe-west1',
    // Cloud Run: ADC (Application Default Credentials) kullanılır.
    // Lokal geliştirme: GOOGLE_APPLICATION_CREDENTIALS env var ile .json yolu verilir.
    // credentialsPath artık gereksiz — SDK otomatik ADC kullanır.
    models: {
      recommendation: process.env.VERTEX_AI_MODEL_RECO || 'gemini-1.5-flash',
      ocrPostProcess: process.env.VERTEX_AI_MODEL_OCR || 'gemini-1.5-pro',
    },
    generationConfig: {
      recommendation: {
        maxOutputTokens: 2048,
        temperature: 0.4,
        topP: 0.9,
        responseMimeType: 'application/json',
      },
      ocrPostProcess: {
        maxOutputTokens: 4096,
        temperature: 0.2,
        topP: 0.8,
        responseMimeType: 'application/json',
      },
    },
  },

  iyzico: {
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    baseUrl: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },

  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@pawpati.com',
  },

  netgsm: {
    username: process.env.NETGSM_USERNAME,
    password: process.env.NETGSM_PASSWORD,
    header: process.env.NETGSM_HEADER || 'PAWPATI',
  },
};
