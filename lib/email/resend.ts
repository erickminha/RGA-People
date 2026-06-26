import { Resend } from "resend";

/**
 * Cliente Resend para envio de emails transacionais.
 * ⚠️ USAR APENAS no servidor — nunca expor ao cliente.
 */
export function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Variável de ambiente RESEND_API_KEY ausente.");
  }
  return new Resend(apiKey);
}

// ============================================================
// TEMPLATES DE EMAIL
// ============================================================

/**
 * Envia email de convite para novo colaborador.
 */
export async function enviarEmailConvite({
  para,
  nomeColaborador,
  nomeEmpresa,
  linkConvite,
  expiracaoHoras = 168, // 7 dias
}: {
  para: string;
  nomeColaborador: string;
  nomeEmpresa: string;
  linkConvite: string;
  expiracaoHoras?: number;
}) {
  const resend = createResendClient();
  const diasExpiracao = Math.round(expiracaoHoras / 24);

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Convite RGA People</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#3730a3);padding:40px 40px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">RGA People</h1>
              <p style="margin:8px 0 0;color:#c7d2fe;font-size:14px;">Sistema de Gestão de Pessoas</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#111827;font-size:22px;font-weight:600;">Olá, ${nomeColaborador}! 👋</h2>
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">
                Você foi convidado(a) para acessar o portal de colaboradores da <strong>${nomeEmpresa}</strong> no RGA People.
              </p>
              <p style="margin:0 0 32px;color:#374151;font-size:16px;line-height:1.6;">
                Clique no botão abaixo para criar sua conta e começar a usar o sistema:
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background:#4f46e5;border-radius:8px;padding:14px 32px;">
                    <a href="${linkConvite}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;display:block;">
                      Aceitar Convite e Criar Conta →
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Info box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">INFORMAÇÕES DO CONVITE</p>
                    <p style="margin:0 0 4px;color:#374151;font-size:14px;">📧 <strong>Email:</strong> ${para}</p>
                    <p style="margin:0 0 4px;color:#374151;font-size:14px;">🏢 <strong>Empresa:</strong> ${nomeEmpresa}</p>
                    <p style="margin:0;color:#374151;font-size:14px;">⏰ <strong>Validade:</strong> ${diasExpiracao} dias a partir de agora</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.5;">
                Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
              </p>
              <p style="margin:0;word-break:break-all;">
                <a href="${linkConvite}" style="color:#4f46e5;font-size:13px;">${linkConvite}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                Este email foi enviado automaticamente pelo RGA People. Se você não esperava este convite, pode ignorá-lo com segurança.
              </p>
              <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} RGA Consultoria. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "RGA People <noreply@rgapeople.com.br>",
    to: [para],
    subject: `Convite para o portal ${nomeEmpresa} — RGA People`,
    html,
  });
}

/**
 * Envia email de notificação de aprovação de férias.
 */
export async function enviarEmailFeriasAprovadas({
  para,
  nomeColaborador,
  dataInicio,
  dataFim,
  diasTotal,
  nomeEmpresa,
}: {
  para: string;
  nomeColaborador: string;
  dataInicio: string;
  dataFim: string;
  diasTotal: number;
  nomeEmpresa: string;
}) {
  const resend = createResendClient();

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><title>Férias Aprovadas</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#059669,#047857);padding:40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">🎉 Férias Aprovadas!</h1>
              <p style="margin:8px 0 0;color:#a7f3d0;font-size:14px;">RGA People — ${nomeEmpresa}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;">Olá, <strong>${nomeColaborador}</strong>!</p>
              <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
                Sua solicitação de férias foi <strong style="color:#059669;">aprovada</strong> pelo RH. Confira os detalhes abaixo:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;color:#374151;font-size:15px;">📅 <strong>Início:</strong> ${dataInicio}</p>
                    <p style="margin:0 0 8px;color:#374151;font-size:15px;">📅 <strong>Retorno:</strong> ${dataFim}</p>
                    <p style="margin:0;color:#374151;font-size:15px;">🏖️ <strong>Total:</strong> ${diasTotal} dias</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#6b7280;font-size:14px;">Boas férias! 🌴</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} RGA Consultoria. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "RGA People <noreply@rgapeople.com.br>",
    to: [para],
    subject: `✅ Suas férias foram aprovadas — ${nomeEmpresa}`,
    html,
  });
}

/**
 * Envia email de notificação de rejeição de férias.
 */
export async function enviarEmailFeriasRejeitadas({
  para,
  nomeColaborador,
  dataInicio,
  dataFim,
  motivo,
  nomeEmpresa,
}: {
  para: string;
  nomeColaborador: string;
  dataInicio: string;
  dataFim: string;
  motivo: string;
  nomeEmpresa: string;
}) {
  const resend = createResendClient();

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><title>Solicitação de Férias</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#3730a3);padding:40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">RGA People</h1>
              <p style="margin:8px 0 0;color:#c7d2fe;font-size:14px;">${nomeEmpresa}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;">Olá, <strong>${nomeColaborador}</strong>!</p>
              <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
                Infelizmente, sua solicitação de férias para o período <strong>${dataInicio}</strong> a <strong>${dataFim}</strong> não pôde ser aprovada no momento.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;color:#991b1b;font-size:13px;font-weight:600;text-transform:uppercase;">Motivo</p>
                    <p style="margin:0;color:#374151;font-size:15px;">${motivo}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#6b7280;font-size:14px;">Em caso de dúvidas, entre em contato com o RH.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} RGA Consultoria. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "RGA People <noreply@rgapeople.com.br>",
    to: [para],
    subject: `Atualização sobre sua solicitação de férias — ${nomeEmpresa}`,
    html,
  });
}
