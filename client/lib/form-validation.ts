export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export function validateField(value: string, rules: ValidationRule): string | null {
  if (rules.required && !value.trim()) {
    return "This field is required";
  }

  if (rules.minLength && value.length < rules.minLength) {
    return `Minimum ${rules.minLength} characters required`;
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    return `Maximum ${rules.maxLength} characters allowed`;
  }

  if (rules.pattern && !rules.pattern.test(value)) {
    return "Invalid format";
  }

  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
}

export function validateForm(values: Record<string, string>, rules: ValidationRules): ValidationErrors {
  const errors: ValidationErrors = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = values[field] || "";
    const error = validateField(value, fieldRules);
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

export const commonRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  } as ValidationRule,
  phone: {
    required: true,
    pattern: /^[+]?[\d\s-()]+$/,
  } as ValidationRule,
  required: {
    required: true,
  } as ValidationRule,
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  } as ValidationRule,
};
