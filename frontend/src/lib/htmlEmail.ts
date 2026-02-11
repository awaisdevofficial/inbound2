/**
 * Converts plain text email body into a beautiful, responsive HTML email.
 * Supports multiple design styles and {{variable}} highlighting in preview mode.
 */

export type EmailDesignStyle = "modern" | "minimal" | "bold" | "elegant" | "classic";

export interface EmailDesignOptions {
  accentColor?: string;
  style?: EmailDesignStyle;
  companyName?: string;
  previewMode?: boolean;
}

export const DESIGN_STYLES: { value: EmailDesignStyle; label: string; description: string }[] = [
  { value: "modern", label: "Modern", description: "Clean gradient header with rounded corners" },
  { value: "minimal", label: "Minimal", description: "Simple, clean layout with thin accent line" },
  { value: "bold", label: "Bold", description: "Full-width colored header, strong contrast" },
  { value: "elegant", label: "Elegant", description: "Soft tones, serif fonts, refined feel" },
  { value: "classic", label: "Classic", description: "Traditional email layout, centered logo area" },
];

export const ACCENT_COLORS = [
  { value: "#4F46E5", label: "Indigo" },
  { value: "#2563EB", label: "Blue" },
  { value: "#0891B2", label: "Cyan" },
  { value: "#059669", label: "Emerald" },
  { value: "#D97706", label: "Amber" },
  { value: "#DC2626", label: "Red" },
  { value: "#9333EA", label: "Purple" },
  { value: "#DB2777", label: "Pink" },
  { value: "#1F2937", label: "Charcoal" },
  { value: "#0F766E", label: "Teal" },
];

export function convertToHtmlEmail(
  subject: string,
  body: string,
  options?: EmailDesignOptions
): string {
  const {
    accentColor = "#4F46E5",
    style = "modern",
    companyName = "",
    previewMode = false,
  } = options || {};

  // Convert plain text body to HTML paragraphs
  const htmlBody = textToHtmlParagraphs(body, style);

  // Highlight variables in preview mode
  const processedBody = previewMode
    ? htmlBody.replace(
        /\{\{(\w+)\}\}/g,
        `<span style="background: ${hexToRgba(accentColor, 0.1)}; color: ${accentColor}; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 13px; border: 1px solid ${hexToRgba(accentColor, 0.3)};">{{$1}}</span>`
      )
    : htmlBody;

  switch (style) {
    case "minimal":
      return buildMinimalTemplate(subject, processedBody, accentColor, companyName);
    case "bold":
      return buildBoldTemplate(subject, processedBody, accentColor, companyName);
    case "elegant":
      return buildElegantTemplate(subject, processedBody, accentColor, companyName);
    case "classic":
      return buildClassicTemplate(subject, processedBody, accentColor, companyName);
    case "modern":
    default:
      return buildModernTemplate(subject, processedBody, accentColor, companyName);
  }
}

// ─── Text to HTML ────────────────────────────────────────────────────────────

function textToHtmlParagraphs(body: string, style: EmailDesignStyle): string {
  const fontFamily = style === "elegant"
    ? "'Georgia', 'Times New Roman', Times, serif"
    : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  const fontSize = style === "elegant" ? "16px" : "15px";
  const lineHeight = style === "elegant" ? "1.8" : "1.7";

  return body
    .split("\n\n")
    .map((paragraph) => {
      const lines = paragraph
        .split("\n")
        .map((line) => escapeHtml(line))
        .join("<br>");
      if (!lines.trim()) return "";
      return `<p style="margin: 0 0 16px 0; line-height: ${lineHeight}; color: #374151; font-size: ${fontSize}; font-family: ${fontFamily};">${lines}</p>`;
    })
    .filter(Boolean)
    .join("\n              ");
}

// ─── Template: Modern ────────────────────────────────────────────────────────

function buildModernTemplate(subject: string, body: string, accent: string, company: string): string {
  return wrapHtml(subject, `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="background: linear-gradient(135deg, ${accent}, ${adjustColor(accent, -30)}); padding: 32px 40px; border-radius: 12px 12px 0 0;">
              ${company ? `<p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85); text-transform: uppercase; letter-spacing: 1px;">${escapeHtml(company)}</p>` : ""}
              <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #FFFFFF; line-height: 1.3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${escapeHtml(subject)}</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color: #FFFFFF; padding: 40px; border-left: 1px solid #E5E7EB; border-right: 1px solid #E5E7EB;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px 40px; border-radius: 0 0 12px 12px; border: 1px solid #E5E7EB; border-top: none;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF; line-height: 1.5;">
                This email was sent ${company ? `by ${escapeHtml(company)}` : "to you"}. If you have any questions, please reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`);
}

// ─── Template: Minimal ───────────────────────────────────────────────────────

function buildMinimalTemplate(subject: string, body: string, accent: string, company: string): string {
  return wrapHtml(subject, `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF;">
    <tr>
      <td align="center" style="padding: 48px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">
          ${company ? `<tr><td style="padding-bottom: 24px;"><p style="margin: 0; font-size: 14px; font-weight: 600; color: ${accent}; letter-spacing: 0.5px;">${escapeHtml(company)}</p></td></tr>` : ""}
          <tr>
            <td style="border-top: 3px solid ${accent}; padding-top: 24px;">
              <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #111827; line-height: 1.3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${escapeHtml(subject)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 32px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid #E5E7EB; padding-top: 20px;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF; line-height: 1.5;">
                ${company ? escapeHtml(company) + " · " : ""}If you have any questions, please reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`);
}

// ─── Template: Bold ──────────────────────────────────────────────────────────

function buildBoldTemplate(subject: string, body: string, accent: string, company: string): string {
  return wrapHtml(subject, `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background-color: ${accent}; padding: 48px 40px; text-align: center;">
              ${company ? `<p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 2px;">${escapeHtml(company)}</p>` : ""}
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #FFFFFF; line-height: 1.2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${escapeHtml(subject)}</h1>
            </td>
          </tr>
        </table>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="background-color: #FFFFFF; padding: 48px 40px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="background-color: #1F2937; padding: 24px 40px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF; line-height: 1.5;">
                ${company ? `&copy; ${new Date().getFullYear()} ${escapeHtml(company)}. ` : ""}All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`);
}

// ─── Template: Elegant ───────────────────────────────────────────────────────

function buildElegantTemplate(subject: string, body: string, accent: string, company: string): string {
  const softAccent = hexToRgba(accent, 0.08);
  return wrapHtml(subject, `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF9F7;">
    <tr>
      <td align="center" style="padding: 48px 16px;">
        <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width: 580px; width: 100%;">
          ${company ? `<tr><td style="text-align: center; padding-bottom: 32px;"><p style="margin: 0; font-size: 18px; font-weight: 400; color: ${accent}; font-family: 'Georgia', 'Times New Roman', serif; letter-spacing: 2px; text-transform: uppercase;">${escapeHtml(company)}</p></td></tr>` : ""}
          <tr>
            <td style="text-align: center; padding: 0 40px 16px;">
              <div style="width: 60px; height: 2px; background-color: ${accent}; margin: 0 auto 24px;"></div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 400; color: #1F2937; line-height: 1.4; font-family: 'Georgia', 'Times New Roman', Times, serif;">${escapeHtml(subject)}</h1>
              <div style="width: 60px; height: 2px; background-color: ${accent}; margin: 24px auto 0;"></div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #FFFFFF; padding: 40px; border: 1px solid #E8E5E0; border-radius: 4px; margin-top: 24px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="text-align: center; padding-top: 32px;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF; line-height: 1.6; font-family: 'Georgia', 'Times New Roman', serif; font-style: italic;">
                ${company ? escapeHtml(company) + " · " : ""}Sent with care
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`);
}

// ─── Template: Classic ───────────────────────────────────────────────────────

function buildClassicTemplate(subject: string, body: string, accent: string, company: string): string {
  return wrapHtml(subject, `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #EAEAEA;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; border: 1px solid #D1D5DB; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #FFFFFF; padding: 24px 32px; border-bottom: 2px solid ${accent}; text-align: center;">
              ${company ? `<p style="margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: ${accent}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${escapeHtml(company)}</p>` : ""}
              <p style="margin: 0; font-size: 12px; color: #6B7280;">━━━</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #FFFFFF; padding: 32px;">
              <h1 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 600; color: #1F2937; line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${escapeHtml(subject)}</h1>
              ${body}
            </td>
          </tr>
          <tr>
            <td style="background-color: #F9FAFB; padding: 20px 32px; border-top: 1px solid #E5E7EB;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 12px; color: #9CA3AF; line-height: 1.5;">
                      ${company ? `&copy; ${new Date().getFullYear()} ${escapeHtml(company)} · ` : ""}If you have any questions, reply to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wrapHtml(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  ${content}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
