export const BD_PHONE_REGEX = /^\+8801[3-9][0-9]{8}$/;

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

// Bangla keyboards can emit Bangla numerals for number-pad/phone-pad inputs;
// normalize to ASCII so validation regexes (which only match \d) still work.
export function toEnglishDigits(input: string): string {
  return input.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

export function isValidBDPhone(phone: string): boolean {
  return BD_PHONE_REGEX.test(phone);
}

export function formatPhoneForDisplay(phone: string): string {
  // +8801XXXXXXXXX -> +৮৮০১XXXXXXXXX (Bengali digits)
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return phone.replace(/\d/g, (d) => bnDigits[parseInt(d)]);
}
