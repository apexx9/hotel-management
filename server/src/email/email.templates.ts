/**
 * Email templates. Pure functions: no I/O, no Nest dependencies.
 * All styles are inline because most email clients strip <style> blocks.
 * Brand colors (primaryColor / accentColor) come from Settings > Hotel >
 * "Email & Branding" and are passed down through the EmailService.
 *
 * Design language: clean, modern transactional email inspired by Stripe /
 * Linear / Booking.com confirmations — generous whitespace, a large rounded
 * card, an eyebrow + headline hierarchy, and scannable stat blocks.
 */

export type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

type Branding = {
  hotelName?: string | null;
  hotelAddress?: string | null;
  hotelPhone?: string | null;
  hotelEmail?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
};

const DEFAULT_PRIMARY = '#1900ff';
const DEFAULT_ACCENT = '#0ea5e9';

// Neutral palette (email-safe, custom colors only tint accents)
const INK = '#0f172a';
const BODY = '#475569';
const MUTED = '#94a3b8';
const BORDER = '#e7e9ee';
const PAGE = '#f5f7fa';
const RAISED = '#f8fafc';

const escapeHtml = (value: unknown): string =>
  String((value as string | number | boolean | null | undefined) ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** Small uppercase label above headlines — Stripe-style. */
const renderEyebrow = (label: string, color: string): string => `
<p style="margin:0 0 6px; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:${color};">${escapeHtml(
  label,
)}</p>`;

/** Bold headline in the primary brand color. */
const renderHeading = (label: string, color: string): string => `
<h1 style="margin:0 0 14px; font-size:24px; line-height:1.35; font-weight:800; color:${color};">${escapeHtml(
  label,
)}</h1>`;

/** Main body copy. */
const renderLead = (children: string): string => `
<p style="margin:0 0 22px; font-size:15px; line-height:1.7; color:${BODY};">${children}</p>`;

/** Rounded, soft container used for codes, reference chips and totals. */
const renderPanel = (inner: string, extraStyle = ''): string => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
  <tr>
    <td style="background-color:${RAISED}; border:1px solid ${BORDER}; border-radius:14px; padding:20px 22px; ${extraStyle}">${inner}</td>
  </tr>
</table>`;

/** Modern code box: oversized letters on a soft panel. */
const renderCodeBox = (code: string, color: string): string => {
  const groups = (code.replace(/\s+/g, '') || code).match(/.{1,4}/g) ?? [code];
  return renderPanel(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="letter-spacing:4px; font-size:30px; line-height:1.3; font-weight:800; color:${color};">${groups
          .map((g) => escapeHtml(g))
          .join(
            '<span style="letter-spacing:4px; color:#cbd5e1;">&thinsp;·&thinsp;</span>',
          )}</td>
      </tr>
    </table>`,
  );
};

/** Primary pill button with soft depth. */
const renderButton = (href: string, label: string, color: string): string => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
  <tr>
    <td align="center" style="padding:10px 0;">
      <a href="${escapeHtml(href)}" style="display:inline-block; background-color:${color}; color:#ffffff; text-decoration:none; font-size:15px; font-weight:700; padding:15px 36px; border-radius:12px;">${escapeHtml(
        label,
      )}</a>
    </td>
  </tr>
</table>`;

/** Small muted helper text. */
const renderNote = (children: string): string => `
<p style="margin:18px 0 0; font-size:13px; line-height:1.7; color:${MUTED};">${children}</p>`;

/** Reference chip with accent bar, used in confirmations & cancellations. */
const renderReferenceChip = (
  reference: string,
  statusLabel: string | null,
  primary: string,
  accent: string,
): string => {
  const status = statusLabel
    ? `<td align="right" style="padding:14px 18px; color:${accent}; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:1px; white-space:nowrap;">${escapeHtml(
        statusLabel,
      )}</td>`
    : '';
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 4px;">
  <tr>
    <td style="background-color:#ffffff; border:1px solid ${BORDER}; border-left:4px solid ${primary}; border-radius:12px; overflow:hidden;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:14px 18px;">
            <p style="margin:0 0 2px; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:${MUTED};">Reference</p>
            <p style="margin:0; font-size:16px; font-weight:800; color:${INK};">${escapeHtml(
              reference,
            )}</p>
          </td>
          ${status}
        </tr>
      </table>
    </td>
  </tr>
</table>`;
};

/**
 * Shared layout shell. A thin brand-colored strip sits on top of a large
 * rounded card: centered logo + hotel name, then eyebrowed content and a
 * clean footer with the hotel's contact details.
 */
const renderLayout = (contentHtml: string, branding: Branding): string => {
  const primaryColor = branding.primaryColor || DEFAULT_PRIMARY;
  const hotelName = escapeHtml(branding.hotelName) || 'Hotel Management';
  const contactParts = [branding.hotelPhone, branding.hotelEmail]
    .filter(Boolean)
    .join(' · ');
  const logoHtml = branding.logoUrl
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
        <tr>
          <td align="center"><img src="${escapeHtml(
            branding.logoUrl,
          )}" alt="${hotelName} logo" style="max-height:44px; max-width:200px; height:auto; display:block;" /></td>
        </tr>
      </table>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${hotelName}</title>
</head>
<body style="margin:0; padding:0; background-color:${PAGE}; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${PAGE};">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:18px; overflow:hidden; border:1px solid ${BORDER}; box-shadow:0 1px 3px rgba(15,23,42,0.05), 0 12px 32px -12px rgba(15,23,42,0.12);">
          <tr>
            <td style="background-color:${primaryColor}; height:6px; font-size:0; line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td align="center" style="padding:30px 36px 6px;">
              ${logoHtml}
              <p style="margin:0; font-size:19px; font-weight:800; letter-spacing:0.2px; color:${INK};">${hotelName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 36px 32px;">${contentHtml}</td>
          </tr>
          <tr>
            <td class="footer" style="padding:22px 36px 24px; background-color:${RAISED}; border-top:1px solid ${BORDER};">
              ${
                branding.hotelAddress
                  ? `<p style="margin:0 0 6px; font-size:13px; line-height:1.6; color:${BODY}; text-align:center;">${escapeHtml(
                      branding.hotelAddress,
                    )}</p>`
                  : ''
              }
              ${
                contactParts
                  ? `<p style="margin:0 0 10px; font-size:13px; line-height:1.6; color:${BODY}; text-align:center;">${escapeHtml(
                      contactParts,
                    )}</p>`
                  : ''
              }
              <p style="margin:0; font-size:12px; line-height:1.7; color:${MUTED}; text-align:center;">This is an automated message from ${hotelName}. If you did not expect this email, you can ignore it or contact the hotel directly.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const renderVerificationCode = (
  branding: Branding,
  code: string,
): EmailContent => {
  const subject = `Verify your account`;
  const text = `Your verification code is: ${code}`;
  const primaryColor = branding.primaryColor || DEFAULT_PRIMARY;
  const accentColor = branding.accentColor || DEFAULT_ACCENT;
  const html = renderLayout(
    `
  ${renderEyebrow('Account verification', accentColor)}
  ${renderHeading('Confirm your email', primaryColor)}
  ${renderLead(
    `Welcome to ${escapeHtml(
      branding.hotelName || 'us',
    )} — please confirm your email address to activate your account.`,
  )}
  ${renderCodeBox(code, primaryColor)}
  ${renderNote(
    'This code expires in <strong style="color:#64748b;">24 hours</strong>. If you did not create this account, you can safely ignore this email.',
  )}
`,
    branding,
  );
  return { subject, html, text };
};

export const renderPasswordReset = (
  branding: Branding,
  code: string,
): EmailContent => {
  const subject = 'Reset your password';
  const text = `Your password reset code is: ${code}`;
  const primaryColor = branding.primaryColor || DEFAULT_PRIMARY;
  const accentColor = branding.accentColor || DEFAULT_ACCENT;
  const html = renderLayout(
    `
  ${renderEyebrow('Security', accentColor)}
  ${renderHeading('Reset your password', primaryColor)}
  ${renderLead(
    `We received a request to reset the password for your ${escapeHtml(
      branding.hotelName || 'account',
    )} account. Enter the code below to set a new password.`,
  )}
  ${renderCodeBox(code, primaryColor)}
  ${renderNote(
    'This code expires in <strong style="color:#64748b;">20 minutes</strong>. If you did not request this, you can safely ignore this email — your password will not change.',
  )}
`,
    branding,
  );
  return { subject, html, text };
};

export const renderStaffInvitation = (
  branding: Branding,
  data: {
    inviteUrl: string;
    role: string;
    inviterName?: string | null;
    expiresAt?: string | Date | null;
  },
): EmailContent => {
  const subject = `You're invited to join ${escapeHtml(
    branding.hotelName || 'the hotel',
  )}`;
  const expiryText = data.expiresAt
    ? `${new Date(data.expiresAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`
    : '7 days from now';
  const text = `You have been invited to join the hotel workspace as ${data.role}. Visit ${data.inviteUrl} to accept the invitation.`;
  const primaryColor = branding.primaryColor || DEFAULT_PRIMARY;
  const accentColor = branding.accentColor || DEFAULT_ACCENT;
  const html = renderLayout(
    `
  ${renderEyebrow('Team invitation', accentColor)}
  ${renderHeading("You've been invited", primaryColor)}
  ${renderLead(
    `${
      data.inviterName ? escapeHtml(data.inviterName) + ' has' : 'Someone has'
    } invited you to join <strong style="color:${INK};">${escapeHtml(
      branding.hotelName || 'the hotel',
    )}</strong> as <strong style="color:${INK};">${escapeHtml(
      data.role,
    )}</strong>.`,
  )}
  ${renderPanel(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:2px 14px 2px 0; width:45%;">
          <p style="margin:0 0 4px; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:${MUTED};">Role</p>
          <p style="margin:0; font-size:15px; font-weight:700; color:${INK};">${escapeHtml(
            data.role,
          )}</p>
        </td>
        <td style="padding:2px 0;">
          <p style="margin:0 0 4px; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:${MUTED};">Link expires</p>
          <p style="margin:0; font-size:15px; font-weight:700; color:${INK};">${escapeHtml(
            expiryText,
          )}</p>
        </td>
      </tr>
    </table>`,
  )}
  ${renderButton(data.inviteUrl, 'Accept invitation', primaryColor)}
  ${renderNote(
    'If you were not expecting this invitation, you can ignore this email — the link will expire on its own.',
  )}
`,
    branding,
  );
  return { subject, html, text };
};

export type ReservationEmailData = {
  guestName?: string | null;
  reference: string;
  roomNumber?: string | null;
  roomType?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  nights?: number;
  guests?: number;
  total: string;
  amountPaid: string;
  outstanding: string;
  checkInTime?: string | null;
  status?: string | null;
  currency: string;
};

/** One stat cell (label over value) for the confirmation grid. */
const renderStat = (label: string, value: string, color?: string): string => `
<td style="padding:14px 20px; width:50%;">
  <p style="margin:0 0 4px; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:${MUTED};">${escapeHtml(
    label,
  )}</p>
  <p style="margin:0; font-size:15px; font-weight:700; color:${color ?? INK};">${value}</p>
</td>`;

/** Two stat cells in a single row with a bottom hairline. */
const renderStatRow = (
  left: [string, string],
  right: [string, string],
): string => `
<tr>
  ${renderStat(left[0], left[1])}
  ${renderStat(right[0], right[1])}
</tr>
<tr>
  <td colspan="2" style="height:1px; border-bottom:1px solid ${BORDER}; font-size:0; line-height:0;">&nbsp;</td>
</tr>`;

/** Full-width label/value row used for room, guest, etc. */
const renderDetailRow = (
  label: string,
  value: string,
  accent = false,
): string => `
<tr>
  <td style="padding:12px 20px; width:45%; color:${MUTED}; font-size:14px;">${escapeHtml(
    label,
  )}</td>
  <td style="padding:12px 20px; width:55%; text-align:right; font-size:14px; font-weight:600; color:${accent ? INK : INK};">${value}</td>
</tr>`;

/** Sticky total block with the outstanding balance highlighted. */
const renderTotals = (
  currency: string,
  total: string,
  amountPaid: string,
  outstanding: string,
  accent: string,
): string => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:2px 0 0;">
  ${renderDetailRow('Total', `${currency} ${escapeHtml(total)}`)}
  <tr>
    <td style="padding:12px 20px; width:45%; color:${MUTED}; font-size:14px;">Amount paid</td>
    <td style="padding:12px 20px; width:55%; text-align:right; font-size:14px; font-weight:600; color:#16a34a;">${currency} ${escapeHtml(
      amountPaid,
    )}</td>
  </tr>
  <tr>
    <td style="padding:12px 20px; width:45%; color:${MUTED}; font-size:14px; border-top:1px solid ${BORDER};">Due at checkout</td>
    <td style="padding:12px 20px; width:55%; text-align:right; font-size:15px; font-weight:800; color:${accent}; border-top:1px solid ${BORDER};">${currency} ${escapeHtml(
      outstanding,
    )}</td>
  </tr>
</table>`;

/** Modern booking summary: reference chip + stat grid + totals. */
const renderBookingSummary = (
  data: ReservationEmailData,
  primary: string,
  accent: string,
): string => {
  const checkIn = `${escapeHtml(data.checkIn ?? '—')}${
    data.checkInTime ? ` · ${escapeHtml(data.checkInTime)}` : ''
  }`;
  const status = data.status
    ? escapeHtml(data.status.replace(/_/g, ' '))
    : 'Confirmed';

  return `
${renderReferenceChip(data.reference, status, primary, accent)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px; background-color:#ffffff; border:1px solid ${BORDER}; border-radius:14px; overflow:hidden;">
  ${renderStatRow(['Check-in', checkIn], ['Check-out', escapeHtml(data.checkOut ?? '—')])}
  ${renderStatRow(['Nights', String(data.nights ?? 1)], ['Guests', String(data.guests ?? 1)])}
  ${renderStatRow(
    [
      'Room',
      data.roomNumber
        ? `Room ${escapeHtml(data.roomNumber)}`
        : escapeHtml(data.roomType ?? '—'),
    ],
    ['Room type', escapeHtml(data.roomType ?? '—')],
  )}
  ${renderTotals(data.currency, data.total, data.amountPaid, data.outstanding, accent)}
</table>`;
};

export const renderBookingConfirmation = (
  branding: Branding,
  data: ReservationEmailData,
): EmailContent => {
  const subject = `Reservation confirmed — ${data.reference}`;
  const text = `Dear ${
    data.guestName || 'guest'
  }, your reservation ${data.reference} is confirmed. Check-in: ${
    data.checkIn ?? '—'
  } · Check-out: ${data.checkOut ?? '—'} · Total: ${data.currency} ${
    data.total
  }`;
  const primaryColor = branding.primaryColor || DEFAULT_PRIMARY;
  const accentColor = branding.accentColor || DEFAULT_ACCENT;
  const html = renderLayout(
    `
  ${renderEyebrow('Reservation', accentColor)}
  ${renderHeading("You're all set", primaryColor)}
  ${renderLead(
    `Dear ${escapeHtml(
      data.guestName || 'guest',
    )}, thank you for choosing ${escapeHtml(
      branding.hotelName || 'our hotel',
    )}. Your reservation is confirmed and we look forward to welcoming you.`,
  )}
  ${renderBookingSummary(data, primaryColor, accentColor)}
  ${renderNote(
    `Need to make changes or have questions? Reply to this email or contact ${escapeHtml(
      branding.hotelName || 'the hotel',
    )} directly.`,
  )}
`,
    branding,
  );
  return { subject, html, text };
};

export const renderBookingCancellation = (
  branding: Branding,
  data: Pick<
    ReservationEmailData,
    'guestName' | 'reference' | 'total' | 'currency'
  >,
): EmailContent => {
  const subject = `Reservation cancelled — ${data.reference}`;
  const text = `Dear ${
    data.guestName || 'guest'
  }, your reservation ${data.reference} has been cancelled.`;
  const primaryColor = branding.primaryColor || DEFAULT_PRIMARY;
  const accentColor = branding.accentColor || DEFAULT_ACCENT;
  const html = renderLayout(
    `
  ${renderEyebrow('Reservation', accentColor)}
  ${renderHeading('Reservation cancelled', primaryColor)}
  ${renderLead(
    `Dear ${escapeHtml(
      data.guestName || 'guest',
    )}, your reservation has been cancelled and no further charges will be made.`,
  )}
  ${renderReferenceChip(data.reference, 'Cancelled', primaryColor, accentColor)}
  ${
    data.total && Number(data.total) > 0
      ? renderPanel(
          `<p style="margin:0; font-size:14px; line-height:1.7; color:${BODY};">Any amount already paid (<strong style="color:${INK};">${escapeHtml(
            data.currency,
          )} ${escapeHtml(data.total)}</strong>) is handled per the hotel refund policy.</p>`,
        )
      : ''
  }
  ${renderNotThis(branding)}
`,
    branding,
  );
  return { subject, html, text };
};

/** CTA block for cancellations: revisit / contact the hotel. */
const renderNotThis = (branding: Branding): string => `
  ${renderNote(
    `If you need to book again or have any questions, contact ${escapeHtml(
      branding.hotelName || 'the hotel',
    )} directly.`,
  )}`;
