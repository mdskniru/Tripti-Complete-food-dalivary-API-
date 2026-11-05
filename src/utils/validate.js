export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());

export const isPhone = (value) => {
  const digits = String(value).replace(/[^0-9]/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

export function validateAccount(data) {
  const errors = {};
  if (!data.name?.trim()) errors.name = 'Please enter your name';
  if (!isEmail(data.email || '')) errors.email = 'Enter a valid email address';
  if (!data.password || data.password.length < 6) errors.password = 'Password must be at least 6 characters';
  if (!isPhone(data.phone || '')) errors.phone = 'Enter a valid phone number';
  if (!data.address?.trim()) errors.address = 'Please enter your address';
  return errors;
}

export function validateLogin(email, password) {
  const errors = {};
  if (!isEmail(email)) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Please enter your password';
  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
