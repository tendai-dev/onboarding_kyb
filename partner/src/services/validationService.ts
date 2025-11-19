"use client";

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  data?: any;
  confidence?: number;
}

export interface ExternalValidationConfig {
  endpoint: string;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheExpiry?: number; // in milliseconds
}

class ValidationService {
  private cache = new Map<string, { result: ValidationResult; timestamp: number }>();

  async validateCompanyRegistration(
    registrationNumber: string,
    country: string,
    config?: ExternalValidationConfig
  ): Promise<ValidationResult> {
    const cacheKey = `company_${country}_${registrationNumber}`;
    
    // Check cache first
    if (config?.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < (config.cacheExpiry || 300000)) {
        return cached.result;
      }
    }

    try {
      // Mock Companies House API call
      const result = await this.mockCompaniesHouseValidation(registrationNumber, country);
      
      // Cache result
      if (config?.cache) {
        this.cache.set(cacheKey, { result, timestamp: Date.now() });
      }
      
      return result;
    } catch (error) {
      return {
        isValid: false,
        message: 'Unable to verify company registration. Please check the number and try again.',
        confidence: 0
      };
    }
  }

  async validateTaxNumber(
    taxNumber: string,
    country: string,
    config?: ExternalValidationConfig
  ): Promise<ValidationResult> {
    const cacheKey = `tax_${country}_${taxNumber}`;
    
    if (config?.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < (config.cacheExpiry || 300000)) {
        return cached.result;
      }
    }

    try {
      const result = await this.mockTaxValidation(taxNumber, country);
      
      if (config?.cache) {
        this.cache.set(cacheKey, { result, timestamp: Date.now() });
      }
      
      return result;
    } catch (error) {
      return {
        isValid: false,
        message: 'Unable to verify tax number. Please check the number and try again.',
        confidence: 0
      };
    }
  }

  async validateBankAccount(
    accountNumber: string,
    bankCode: string,
    country: string,
    config?: ExternalValidationConfig
  ): Promise<ValidationResult> {
    const cacheKey = `bank_${country}_${bankCode}_${accountNumber}`;
    
    if (config?.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < (config.cacheExpiry || 300000)) {
        return cached.result;
      }
    }

    try {
      const result = await this.mockBankValidation(accountNumber, bankCode, country);
      
      if (config?.cache) {
        this.cache.set(cacheKey, { result, timestamp: Date.now() });
      }
      
      return result;
    } catch (error) {
      return {
        isValid: false,
        message: 'Unable to verify bank account. Please check the details and try again.',
        confidence: 0
      };
    }
  }

  async validateEmail(email: string, config?: ExternalValidationConfig): Promise<ValidationResult> {
    const cacheKey = `email_${email}`;
    
    if (config?.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < (config.cacheExpiry || 300000)) {
        return cached.result;
      }
    }

    try {
      const result = await this.mockEmailValidation(email);
      
      if (config?.cache) {
        this.cache.set(cacheKey, { result, timestamp: Date.now() });
      }
      
      return result;
    } catch (error) {
      return {
        isValid: false,
        message: 'Unable to verify email address. Please check and try again.',
        confidence: 0
      };
    }
  }

  async validatePhoneNumber(
    phoneNumber: string,
    country: string,
    config?: ExternalValidationConfig
  ): Promise<ValidationResult> {
    const cacheKey = `phone_${country}_${phoneNumber}`;
    
    if (config?.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < (config.cacheExpiry || 300000)) {
        return cached.result;
      }
    }

    try {
      const result = await this.mockPhoneValidation(phoneNumber, country);
      
      if (config?.cache) {
        this.cache.set(cacheKey, { result, timestamp: Date.now() });
      }
      
      return result;
    } catch (error) {
      return {
        isValid: false,
        message: 'Unable to verify phone number. Please check and try again.',
        confidence: 0
      };
    }
  }

  // Mock implementations - replace with actual API calls
  private async mockCompaniesHouseValidation(
    registrationNumber: string,
    country: string
  ): Promise<ValidationResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock validation logic based on country patterns
    const patterns = {
      'UK': /^[0-9]{8}$/,
      'ZA': /^\d{4}\/\d{6}\/\d{2}$/,
      'US': /^\d{2}-\d{7}$/,
      'ZW': /^[A-Z]{2}\d{6}$/,
      'BW': /^BW\d{8}$/
    };

    const pattern = patterns[country as keyof typeof patterns];
    if (!pattern || !pattern.test(registrationNumber)) {
      return {
        isValid: false,
        message: `Invalid ${country} registration number format`,
        confidence: 0
      };
    }

    // Mock successful validation with company data
    return {
      isValid: true,
      message: 'Company registration verified successfully',
      data: {
        companyName: 'Example Company Ltd',
        status: 'Active',
        incorporationDate: '2020-01-15',
        address: '123 Business Street, London, UK',
        directors: ['John Smith', 'Jane Doe'],
        lastUpdated: new Date().toISOString()
      },
      confidence: 0.95
    };
  }

  private async mockTaxValidation(
    taxNumber: string,
    country: string
  ): Promise<ValidationResult> {
    await new Promise(resolve => setTimeout(resolve, 1200));

    const patterns = {
      'UK': /^\d{10}$/,
      'ZA': /^\d{10}$/,
      'US': /^\d{2}-\d{7}$/,
      'ZW': /^\d{8}$/,
      'BW': /^[A-Z]\d{8}$/
    };

    const pattern = patterns[country as keyof typeof patterns];
    if (!pattern || !pattern.test(taxNumber)) {
      return {
        isValid: false,
        message: `Invalid ${country} tax number format`,
        confidence: 0
      };
    }

    return {
      isValid: true,
      message: 'Tax number verified successfully',
      data: {
        registeredName: 'Example Company Ltd',
        status: 'Active',
        registrationDate: '2020-01-15'
      },
      confidence: 0.90
    };
  }

  private async mockBankValidation(
    accountNumber: string,
    bankCode: string,
    country: string
  ): Promise<ValidationResult> {
    await new Promise(resolve => setTimeout(resolve, 1800));

    const patterns = {
      'UK': /^\d{8}$/,
      'ZA': /^\d{9,11}$/,
      'US': /^\d{9,12}$/,
      'ZW': /^\d{10,13}$/,
      'BW': /^\d{10}$/
    };

    const pattern = patterns[country as keyof typeof patterns];
    if (!pattern || !pattern.test(accountNumber)) {
      return {
        isValid: false,
        message: `Invalid ${country} bank account format`,
        confidence: 0
      };
    }

    return {
      isValid: true,
      message: 'Bank account verified successfully',
      data: {
        accountName: 'Example Company Ltd',
        bankName: 'Example Bank',
        accountType: 'Business',
        branchCode: bankCode
      },
      confidence: 0.85
    };
  }

  private async mockEmailValidation(email: string): Promise<ValidationResult> {
    await new Promise(resolve => setTimeout(resolve, 800));

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        message: 'Invalid email format',
        confidence: 0
      };
    }

    // Mock domain validation
    const domain = email.split('@')[1];
    const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
    
    if (disposableDomains.includes(domain)) {
      return {
        isValid: false,
        message: 'Disposable email addresses are not allowed',
        confidence: 0.95
      };
    }

    return {
      isValid: true,
      message: 'Email address verified successfully',
      data: {
        domain: domain,
        type: 'business',
        deliverable: true
      },
      confidence: 0.80
    };
  }

  private async mockPhoneValidation(
    phoneNumber: string,
    country: string
  ): Promise<ValidationResult> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const patterns = {
      'UK': /^(\+44|0)[1-9]\d{8,9}$/,
      'ZA': /^(\+27|0)[1-9]\d{8}$/,
      'US': /^(\+1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/,
      'ZW': /^(\+263|0)[1-9]\d{6,8}$/,
      'BW': /^(\+267|0)[2-7]\d{6}$/
    };

    const pattern = patterns[country as keyof typeof patterns];
    if (!pattern || !pattern.test(phoneNumber)) {
      return {
        isValid: false,
        message: `Invalid ${country} phone number format`,
        confidence: 0
      };
    }

    return {
      isValid: true,
      message: 'Phone number verified successfully',
      data: {
        country: country,
        type: 'mobile',
        carrier: 'Example Carrier'
      },
      confidence: 0.75
    };
  }

  // Utility methods
  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  // Batch validation for multiple fields
  async validateBatch(
    validations: Array<{
      type: 'company' | 'tax' | 'bank' | 'email' | 'phone';
      data: any;
      config?: ExternalValidationConfig;
    }>
  ): Promise<ValidationResult[]> {
    const promises = validations.map(async (validation) => {
      switch (validation.type) {
        case 'company':
          return this.validateCompanyRegistration(
            validation.data.registrationNumber,
            validation.data.country,
            validation.config
          );
        case 'tax':
          return this.validateTaxNumber(
            validation.data.taxNumber,
            validation.data.country,
            validation.config
          );
        case 'bank':
          return this.validateBankAccount(
            validation.data.accountNumber,
            validation.data.bankCode,
            validation.data.country,
            validation.config
          );
        case 'email':
          return this.validateEmail(validation.data.email, validation.config);
        case 'phone':
          return this.validatePhoneNumber(
            validation.data.phoneNumber,
            validation.data.country,
            validation.config
          );
        default:
          return { isValid: false, message: 'Unknown validation type' };
      }
    });

    return Promise.all(promises);
  }
}

// Export singleton instance
export const validationService = new ValidationService();

// Export hook for React components
export function useValidation() {
  return {
    validateCompanyRegistration: validationService.validateCompanyRegistration.bind(validationService),
    validateTaxNumber: validationService.validateTaxNumber.bind(validationService),
    validateBankAccount: validationService.validateBankAccount.bind(validationService),
    validateEmail: validationService.validateEmail.bind(validationService),
    validatePhoneNumber: validationService.validatePhoneNumber.bind(validationService),
    validateBatch: validationService.validateBatch.bind(validationService),
    clearCache: validationService.clearCache.bind(validationService),
    getCacheSize: validationService.getCacheSize.bind(validationService)
  };
}
