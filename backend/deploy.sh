#!/usr/bin/env bash
# ============================================================
# PawPati Cloud Run Deploy Script
# Usage: ./deploy.sh [--prod | --staging]
# ============================================================
set -euo pipefail

# ============================================================
#  CONFIGURATION — Buraya gerçek değerlerini yaz
# ============================================================
PROJECT_ID="pawpati-prod"
REGION="europe-west1"
SERVICE_NAME="pawpati-backend"
SERVICE_ACCOUNT="vertex-runner@${PROJECT_ID}.iam.gserviceaccount.com"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# --- Kaynak Limitleri ---
MEMORY="512Mi"
CPU="1"
MIN_INSTANCES="0"
MAX_INSTANCES="10"
CONCURRENCY="80"
TIMEOUT="300"

# --- Environment (staging/prod) ---
ENV="production"
if [[ "${1:-}" == "--staging" ]]; then
  ENV="staging"
  SERVICE_NAME="${SERVICE_NAME}-staging"
  MIN_INSTANCES="0"
  MAX_INSTANCES="3"
  echo "🟡 Staging deployment"
else
  echo "🟢 Production deployment"
fi

# ============================================================
#  ENVIRONMENT VARIABLES — Cloud Run'a inject edilecek
# ============================================================
ENV_VARS=$(cat <<EOF
NODE_ENV=${ENV},\
API_VERSION=v1,\
GCP_PROJECT_ID=${PROJECT_ID},\
GCP_LOCATION=${REGION},\
VERTEX_AI_MODEL_RECO=gemini-1.5-flash,\
VERTEX_AI_MODEL_OCR=gemini-1.5-pro,\
DB_HOST=/cloudsql/${PROJECT_ID}:${REGION}:pawpati-db,\
DB_PORT=5432,\
DB_NAME=pawpati_prod,\
DB_USER=pawpati_admin,\
DB_SSL=true,\
REDIS_HOST=,\
REDIS_PORT=6379,\
JWT_EXPIRES_IN=7d,\
JWT_REFRESH_EXPIRES_IN=30d,\
IYZICO_BASE_URL=https://api.iyzipay.com,\
SENDGRID_FROM_EMAIL=noreply@pawpati.com,\
NETGSM_HEADER=PAWPATI,\
APP_URL=https://${SERVICE_NAME}-HASH.a.run.app,\
CORS_ORIGIN=https://pawpati.com
EOF
)

# ============================================================
#  SECRET MANAGER — Hassas değerler Secret Manager'dan çekilir
#  Önce şu secret'ları oluştur:
#    gcloud secrets create db-password --data-file=- <<< "SIFRE"
#    gcloud secrets create jwt-secret --data-file=- <<< "SECRET"
#    gcloud secrets create iyzico-api-key --data-file=- <<< "KEY"
#    gcloud secrets create iyzico-secret-key --data-file=- <<< "KEY"
#    gcloud secrets create sendgrid-api-key --data-file=- <<< "KEY"
#    gcloud secrets create firebase-private-key --data-file=- <<< "KEY"
#    gcloud secrets create netgsm-password --data-file=- <<< "PASS"
# ============================================================
SECRETS="\
DB_PASSWORD=db-password:latest,\
JWT_SECRET=jwt-secret:latest,\
IYZICO_API_KEY=iyzico-api-key:latest,\
IYZICO_SECRET_KEY=iyzico-secret-key:latest,\
SENDGRID_API_KEY=sendgrid-api-key:latest,\
FIREBASE_PRIVATE_KEY=firebase-private-key:latest,\
NETGSM_PASSWORD=netgsm-password:latest"

# ============================================================
#  PRE-FLIGHT CHECKS
# ============================================================
echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  🐾 PawPati Cloud Run Deploy                     ║"
echo "╠═══════════════════════════════════════════════════╣"
echo "║  Project:  ${PROJECT_ID}                         "
echo "║  Region:   ${REGION}                             "
echo "║  Service:  ${SERVICE_NAME}                       "
echo "║  Image:    ${IMAGE}                              "
echo "║  Env:      ${ENV}                                "
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# gcloud CLI check
if ! command -v gcloud &> /dev/null; then
  echo "❌ gcloud CLI bulunamadı. Kur: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

# Docker check
if ! command -v docker &> /dev/null; then
  echo "⚠️  Docker bulunamadı — Cloud Build kullanılacak (uzaktan build)"
fi

# Proje ayarla
gcloud config set project "${PROJECT_ID}" 2>/dev/null

# Gerekli API'leri etkinleştir
echo "🔧 API'ler etkinleştiriliyor..."
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  aiplatform.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com \
  --quiet

# ============================================================
#  STEP 1: BUILD & PUSH
# ============================================================
echo ""
echo "📦 Step 1/3: Image oluşturuluyor (Cloud Build)..."
echo "   ${IMAGE}:latest"
echo ""

gcloud builds submit \
  --tag "${IMAGE}:latest" \
  --timeout=600 \
  --quiet

# Tag with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
echo "🏷️  Tagging: ${IMAGE}:${TIMESTAMP}"
gcloud container images add-tag \
  "${IMAGE}:latest" \
  "${IMAGE}:${TIMESTAMP}" \
  --quiet 2>/dev/null || true

# ============================================================
#  STEP 2: DEPLOY TO CLOUD RUN
# ============================================================
echo ""
echo "🚀 Step 2/3: Cloud Run'a deploy ediliyor..."
echo ""

gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}:latest" \
  --region "${REGION}" \
  --platform managed \
  --service-account "${SERVICE_ACCOUNT}" \
  --set-env-vars "${ENV_VARS}" \
  --set-secrets "${SECRETS}" \
  --memory "${MEMORY}" \
  --cpu "${CPU}" \
  --min-instances "${MIN_INSTANCES}" \
  --max-instances "${MAX_INSTANCES}" \
  --concurrency "${CONCURRENCY}" \
  --timeout "${TIMEOUT}" \
  --port 8080 \
  --allow-unauthenticated \
  --quiet

# ============================================================
#  STEP 3: VERIFY & OUTPUT
# ============================================================
echo ""
echo "✅ Step 3/3: Deploy doğrulanıyor..."
echo ""

# Cloud Run URL'ini al
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --format "value(status.url)")

# Health check
echo "🏥 Health check: ${SERVICE_URL}/health"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}/health" || echo "000")

if [[ "${HTTP_STATUS}" == "200" ]]; then
  HEALTH="✅ HEALTHY"
else
  HEALTH="⚠️  Status ${HTTP_STATUS} (Cold start olabilir, 30sn bekleyin)"
fi

# Son rapor
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║  🐾 PawPati Deploy Tamamlandı!                            ║"
echo "║                                                           ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║                                                           ║"
echo "║  🌐 URL:     ${SERVICE_URL}"
echo "║  📡 API:     ${SERVICE_URL}/api/v1"
echo "║  🏥 Health:  ${SERVICE_URL}/health"
echo "║  📊 Status:  ${HEALTH}"
echo "║  🕐 Deploy:  $(date '+%Y-%m-%d %H:%M:%S')"
echo "║  🏷️  Tag:     ${TIMESTAMP}"
echo "║                                                           ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║  Logları izle:                                            ║"
echo "║  gcloud run logs read ${SERVICE_NAME} --region ${REGION}  ║"
echo "║                                                           ║"
echo "║  Geri al (rollback):                                      ║"
echo "║  gcloud run services update-traffic ${SERVICE_NAME} \\     ║"
echo "║    --to-revisions=PREVIOUS --region ${REGION}             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
