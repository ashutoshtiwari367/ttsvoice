/**
 * Fraud Prevention & Disposable Email Validation
 * Protects free tier character quotas from being abused via throwaway,
 * temporary, or bot-generated disposable email accounts.
 */

const DISPOSABLE_DOMAINS = new Set<string>([
  // Popular throwaway & temp mail domains
  '10minutemail.com',
  '10minutemail.net',
  '10minmail.com',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  'tempmailo.com',
  'tempmail.net',
  'tempail.com',
  'tmailor.com',
  'tmpmail.net',
  'tmpmail.org',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'pokemail.net',
  'spam4.me',
  'mailinator.com',
  'mailinator2.com',
  'mailin8r.com',
  'binkmail.com',
  'bobmail.info',
  'chammy.info',
  'devnullmail.com',
  'letthemeatspam.com',
  'mailinater.com',
  'notmailinator.com',
  'reallymymail.com',
  'reconmail.com',
  'safetymail.info',
  'sendspamhere.com',
  'sogetthis.com',
  'spambooger.com',
  'spamherelots.com',
  'spamhereplease.com',
  'streetwisemail.com',
  'suremail.info',
  'thisisnotmyrealemail.com',
  'tradermail.info',
  'veryrealemail.com',
  'zippymail.info',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'cool.fr.nf',
  'jetable.fr.nf',
  'nospam.ze.tc',
  'nomail.xl.cx',
  'mega.zik.dj',
  'speed.1s.fr',
  'courriel.fr.nf',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'trash-mail.com',
  'rcpt.at',
  'curryjunk.com',
  'throwawaymail.com',
  'throwaway.email',
  'dispostable.com',
  'getairmail.com',
  'airmail.news',
  'fakemailgenerator.com',
  'fakeinbox.com',
  'fakemail.net',
  'nada.ltd',
  'getnada.com',
  'mohmal.com',
  'mohmal.in',
  'mohmal.tech',
  'burnermail.io',
  'burnmail.io',
  'crazymailing.com',
  'mytemp.email',
  'emailondeck.com',
  'minuteinbox.com',
  'mailcatch.com',
  'maildrop.cc',
  'mailnesia.com',
  'spamgourmet.com',
  'harakirimail.com',
  'generator.email',
  'inboxes.com',
  'mailpoof.com',
  'inboxkitten.com',
  'mytempemail.com',
  'tempr.email',
  'discard.email',
  'discardmail.com',
  'spambog.com',
  'spambog.de',
  'spambog.ru',
  'trashymail.com',
  'mailscrap.com',
  'mytempmail.org',
  'dropmail.me',
  '10mail.org',
  '20minutemail.com',
  'getairmail.cf',
  'getairmail.ga',
  'getairmail.gq',
  'getairmail.ml',
  'getairmail.tk',
  'zillamail.com',
  'trashmail.org',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'trashmail.at',
  'anonaddy.com',
  'anonaddy.me',
]);

export interface EmailValidationResult {
  valid: boolean;
  error?: string;
  normalizedEmail?: string;
}

export function validateEmailForSignup(rawEmail: string): EmailValidationResult {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return { valid: false, error: 'Please enter a valid email address.' };
  }

  const email = rawEmail.trim().toLowerCase();

  // 1. Basic format RFC check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(email) || email.length > 254) {
    return { valid: false, error: 'Please enter a valid email address format.' };
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid email address.' };
  }

  const [localPart, domain] = parts;

  // 2. TLD check (must have valid domain with at least 2 chars TLD)
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (domainParts.length < 2 || !tld || tld.length < 2) {
    return { valid: false, error: 'Please enter an email with a valid domain.' };
  }

  // 3. Disposable / Temporary email block
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      error: 'Temporary or disposable email services are not permitted. Please use a valid personal or work email (e.g. Gmail, Outlook, Yahoo).',
    };
  }

  // 4. Check for known wildcard throwaway subdomains (e.g. *.yopmail.com, *.mailinator.com)
  for (const blocked of DISPOSABLE_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) {
      return {
        valid: false,
        error: 'Temporary or disposable email domains are not allowed. Please use a verified personal or business email.',
      };
    }
  }

  return {
    valid: true,
    normalizedEmail: `${localPart}@${domain}`,
  };
}
