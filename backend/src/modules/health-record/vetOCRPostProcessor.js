const { VertexAI } = require('@google-cloud/vertexai');
const config = require('../../config');

/**
 * Veterinary OCR Post-Processor — Vertex AI (Gemini 1.5 Pro)
 * 
 * Cloud Vision'dan gelen ham OCR metnini alır ve:
 * 1. Türkçe veteriner terminolojisine göre normalize eder
 * 2. Yapılandırılmış veri çıkarır (ilaçlar, dozajlar, teşhisler)
 * 3. Sağlık kaydı için JSON formatında döndürür
 * 
 * Gemini 1.5 Pro kullanılır çünkü:
 * - Uzun doküman context window (1M token)
 * - Daha yüksek doğruluk gerektiren medikal terminoloji
 * - Yapılandırılmış veri çıkarımı
 */
class VetOCRPostProcessor {
  constructor() {
    this.vertexAI = new VertexAI({
      project: config.vertexAI.projectId,
      location: config.vertexAI.location,
    });

    // Gemini 1.5 Pro for OCR post-processing — higher accuracy for medical terms
    this.model = this.vertexAI.getGenerativeModel({
      model: config.vertexAI.models.ocrPostProcess,
      generationConfig: config.vertexAI.generationConfig.ocrPostProcess,
      systemInstruction: {
        role: 'system',
        parts: [{
          text: `Sen Türkiye'de görev yapan deneyimli bir veteriner hekim ve tıbbi belge analiz uzmanısın.

GÖREV: Veteriner belgelerinden OCR ile çıkarılan ham metni analiz ederek yapılandırılmış tıbbi veri üret.

ZORUNLU KURALLAR:
1. Tüm ilaç isimlerini Türkiye'de ruhsatlı veteriner ilaç isimlerine normalize et.
2. Dozajları standart birime çevir (mg, ml, IU).
3. Teşhis kodlarını mümkünse ICD-Vet kodlarıyla eşleştir.
4. Belirsiz veya okunamayan kısımları "[okunamadı]" olarak işaretle, tahmin YAPMA.
5. Yanıtı her zaman geçerli JSON formatında ver.
6. Türkçe veteriner terminolojisini kullan.

JSON ÇIKTI FORMATI:
{
  "document_type": "vaccination_card|lab_result|prescription|discharge_report|other",
  "clinic_name": "string|null",
  "veterinarian": "string|null",
  "date": "YYYY-MM-DD|null",
  "patient": {
    "species": "string|null",
    "breed": "string|null",
    "name": "string|null"
  },
  "diagnoses": [
    { "name": "string", "icd_vet_code": "string|null", "severity": "mild|moderate|severe|null" }
  ],
  "medications": [
    { "name": "string", "normalized_name": "string", "dosage": "string", "frequency": "string", "duration": "string", "route": "oral|injection|topical|null" }
  ],
  "vaccinations": [
    { "name": "string", "batch_number": "string|null", "next_due": "YYYY-MM-DD|null" }
  ],
  "vitals": {
    "weight_kg": "number|null",
    "temperature_c": "number|null",
    "heart_rate": "number|null",
    "respiratory_rate": "number|null"
  },
  "lab_results": [
    { "test_name": "string", "value": "string", "unit": "string", "reference_range": "string|null", "status": "normal|abnormal|critical|null" }
  ],
  "notes": "string|null",
  "confidence_score": 0.0-1.0,
  "unreadable_sections": ["string"]
}`
        }],
      },
    });
  }

  /**
   * Process raw OCR text from Cloud Vision
   * @param {string} rawOCRText - Raw text extracted by Cloud Vision
   * @param {Object} petContext - Optional pet context for better interpretation
   * @returns {Object} Structured veterinary record data
   */
  async processOCRText(rawOCRText, petContext = null) {
    if (!rawOCRText || rawOCRText.trim().length === 0) {
      return {
        success: false,
        error: 'Empty OCR text provided',
        data: null,
      };
    }

    const prompt = this._buildOCRPrompt(rawOCRText, petContext);

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = result.response;
      const textContent = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textContent) {
        throw new Error('Empty response from Gemini for OCR processing');
      }

      const structuredData = JSON.parse(textContent);

      return {
        success: true,
        data: structuredData,
        tokenCount: response.usageMetadata?.totalTokenCount || null,
        model: config.vertexAI.models.ocrPostProcess,
      };
    } catch (error) {
      console.error('Vertex AI OCR post-processing error:', error);
      return {
        success: false,
        error: error.message,
        data: null,
        rawText: rawOCRText,
      };
    }
  }

  /**
   * Build OCR processing prompt
   */
  _buildOCRPrompt(rawText, petContext) {
    let prompt = `Aşağıdaki veteriner belgesinin OCR ile çıkarılmış ham metnini analiz et ve yapılandırılmış JSON formatına dönüştür.

HAM OCR METNİ:
---
${rawText}
---`;

    if (petContext) {
      prompt += `

HASTA BAĞLAMI (doğrulama için kullan):
- Tür: ${petContext.species || 'Bilinmiyor'}
- Irk: ${petContext.breed || 'Bilinmiyor'}
- İsim: ${petContext.name || 'Bilinmiyor'}
- Yaş: ${petContext.age || 'Bilinmiyor'}
- Bilinen Alerjiler: ${petContext.allergies?.join(', ') || 'Yok'}`;
    }

    prompt += `

Metni analiz et ve zorunlu JSON formatında yanıt ver. İlaç isimlerini Türkiye veteriner ilaç terminolojisine normalize et.`;

    return prompt;
  }

  /**
   * Batch process multiple OCR documents
   * @param {Array} documents - Array of { rawText, petContext }
   * @returns {Array} Processed results
   */
  async batchProcess(documents) {
    const results = [];
    for (const doc of documents) {
      const result = await this.processOCRText(doc.rawText, doc.petContext);
      results.push(result);
      // Rate limiting: small delay between Vertex AI calls
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    return results;
  }
}

module.exports = VetOCRPostProcessor;
