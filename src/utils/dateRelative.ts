const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

function toBnNum(n: number): string {
  return String(n).replace(/\d/g, (d) => bnDigits[parseInt(d)]);
}

export function relativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return 'এইমাত্র';
  if (diffMinutes < 60) return `${toBnNum(diffMinutes)} মিনিট আগে`;
  if (diffHours < 24) return `${toBnNum(diffHours)} ঘণ্টা আগে`;
  if (diffDays === 1) return 'গতকাল';
  if (diffDays < 7) return `${toBnNum(diffDays)} দিন আগে`;
  if (diffWeeks < 4) return `${toBnNum(diffWeeks)} সপ্তাহ আগে`;
  if (diffMonths < 12) return `${toBnNum(diffMonths)} মাস আগে`;
  return `${toBnNum(Math.floor(diffMonths / 12))} বছর আগে`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('bn-BD', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
