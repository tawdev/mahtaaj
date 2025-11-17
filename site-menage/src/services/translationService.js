// services/translationService.js
import axios from 'axios';

class TranslationService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    this.apiClient = axios.create({
      baseURL: `${this.baseURL}/api/translations`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // إضافة interceptor لإرسال اللغة مع كل طلب
    this.apiClient.interceptors.request.use((config) => {
      const currentLanguage = localStorage.getItem('i18nextLng') || 'fr';
      config.headers['Accept-Language'] = currentLanguage;
      return config;
    });
  }

  /**
   * الحصول على جميع الترجمات مع إمكانية التصفية
   */
  async getTranslations(params = {}) {
    try {
      const response = await this.apiClient.get('/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching translations:', error);
      throw error;
    }
  }

  /**
   * الحصول على ترجمة محددة
   */
  async getTranslation(id) {
    try {
      const response = await this.apiClient.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching translation:', error);
      throw error;
    }
  }

  /**
   * إنشاء ترجمة جديدة
   */
  async createTranslation(translationData) {
    try {
      const response = await this.apiClient.post('/', translationData);
      return response.data;
    } catch (error) {
      console.error('Error creating translation:', error);
      throw error;
    }
  }

  /**
   * تحديث ترجمة موجودة
   */
  async updateTranslation(id, translationData) {
    try {
      const response = await this.apiClient.put(`/${id}`, translationData);
      return response.data;
    } catch (error) {
      console.error('Error updating translation:', error);
      throw error;
    }
  }

  /**
   * حذف ترجمة
   */
  async deleteTranslation(id) {
    try {
      const response = await this.apiClient.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting translation:', error);
      throw error;
    }
  }

  /**
   * الحصول على ترجمات نموذج معين
   */
  async getModelTranslations(model, modelId, locale = null) {
    try {
      const params = locale ? { locale } : {};
      const response = await this.apiClient.get(`/model/${model}/${modelId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching model translations:', error);
      throw error;
    }
  }

  /**
   * إعادة ترجمة نموذج معين
   */
  async retranslateModel(model, modelId, options = {}) {
    try {
      const response = await this.apiClient.post(`/model/${model}/${modelId}/retranslate`, options);
      return response.data;
    } catch (error) {
      console.error('Error retranslating model:', error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات الترجمة
   */
  async getTranslationStats() {
    try {
      const response = await this.apiClient.get('/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching translation stats:', error);
      throw error;
    }
  }

  /**
   * اختبار خدمة الترجمة
   */
  async testTranslation(text, from, to) {
    try {
      const response = await this.apiClient.post('/test', {
        text,
        from,
        to
      });
      return response.data;
    } catch (error) {
      console.error('Error testing translation:', error);
      throw error;
    }
  }

  /**
   * الحصول على اللغات المدعومة
   */
  async getSupportedLanguages() {
    try {
      const response = await this.apiClient.get('/languages');
      return response.data;
    } catch (error) {
      console.error('Error fetching supported languages:', error);
      throw error;
    }
  }

  /**
   * تحديث اللغة في جميع الطلبات
   */
  setLanguage(language) {
    localStorage.setItem('i18nextLng', language);
    this.apiClient.defaults.headers['Accept-Language'] = language;
  }

  /**
   * الحصول على اللغة الحالية
   */
  getCurrentLanguage() {
    return localStorage.getItem('i18nextLng') || 'fr';
  }
}

const translationService = new TranslationService();
export default translationService;
