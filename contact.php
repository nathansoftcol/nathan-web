<?php
/** Envío del formulario con PHPMailer → smtp.gmail.com (cuenta nathansoftcol@gmail.com). */

declare(strict_types=1);
ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

if (!extension_loaded('openssl')) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'PHP necesita la extensión openssl para Gmail. En php.ini descomenta: extension=openssl',
    ]);
    exit;
}

// ============================================================
// Gmail SMTP — Google no acepta correo sin cifrado hacia smtp.gmail.com
// (TLS/SSL es distinto del HTTPS del sitio; en local puedes usar http://localhost).
// ============================================================
$SMTP_HOST   = 'smtp.gmail.com';
$SMTP_USER   = 'nathansoftcol@gmail.com';
// Contraseña de aplicación (16 caracteres). Puedes dejarla con espacios; se quitan solos:
$SMTP_PASSWORD = preg_replace('/\s+/', '', 'yadk ukyl vnjz foyt');

// Si el puerto 465 falla en tu red, pon true (entonces 587 + STARTTLS):
$USE_STARTTLS_587 = false;
if ($USE_STARTTLS_587) {
    $SMTP_PORT   = 587;
    $SMTP_SECURE = 'tls';
} else {
    $SMTP_PORT   = 465;
    $SMTP_SECURE = 'ssl';
}

$FROM_EMAIL  = 'nathansoftcol@gmail.com';
$FROM_NAME   = 'Nathan Soft Web';
$TO_PRIMARY  = 'nathansoftcol@gmail.com';
$TO_CC       = 'contact@nathansoft.com.co';
$SITE_URL    = 'https://nathansoft.com.co';
// ============================================================

require_once __DIR__ . '/vendor/PHPMailer/src/Exception.php';
require_once __DIR__ . '/vendor/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/vendor/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// ---------- Helpers ----------
function clean(string $s, int $max = 500): string {
    $s = trim($s);
    $s = strip_tags($s);
    $s = preg_replace("/[\r\n]+/", " ", $s) ?? '';
    if (mb_strlen($s) > $max) $s = mb_substr($s, 0, $max);
    return $s;
}
function clean_multiline(string $s, int $max = 5000): string {
    $s = trim($s);
    $s = strip_tags($s);
    if (mb_strlen($s) > $max) $s = mb_substr($s, 0, $max);
    return $s;
}
function rate_limited(string $ip): bool {
    $dir = sys_get_temp_dir() . '/nathansoft_rate';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $file = $dir . '/' . md5($ip);
    $now  = time();
    $rec  = ['count' => 0, 'first' => $now];
    if (is_file($file)) {
        $j = @json_decode((string)file_get_contents($file), true);
        if (is_array($j)) $rec = array_merge($rec, $j);
    }
    if ($now - (int)$rec['first'] > 900) { // ventana de 15 minutos
        $rec = ['count' => 0, 'first' => $now];
    }
    $rec['count']++;
    @file_put_contents($file, json_encode($rec));
    return $rec['count'] > 5; // máx 5 envíos / 15 min por IP
}

// ---------- Method check ----------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

// ---------- Anti-spam: honeypot ----------
if (!empty($_POST['website'])) {
    echo json_encode(['success' => true]);
    exit;
}

// ---------- Rate-limit por IP ----------
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
if (rate_limited($ip)) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.']);
    exit;
}

// ---------- Inputs ----------
$name    = clean((string)($_POST['name']    ?? ''), 100);
$email   = clean((string)($_POST['email']   ?? ''), 120);
$company = clean((string)($_POST['company'] ?? ''), 120);
$phone   = clean((string)($_POST['phone']   ?? ''), 30);
$subject = clean((string)($_POST['subject'] ?? ''), 60);
$message = clean_multiline((string)($_POST['message'] ?? ''), 3000);
$lang    = clean((string)($_POST['lang']    ?? 'es'), 4);
$consent = isset($_POST['consent']);

// ---------- Validación ----------
$errors = [];
if (mb_strlen($name) < 2)                              $errors[] = 'name';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))        $errors[] = 'email';
if (mb_strlen($message) < 10)                          $errors[] = 'message';
if (!$consent)                                         $errors[] = 'consent';

if ($errors) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Por favor revisa los campos del formulario.', 'fields' => $errors]);
    exit;
}

// ---------- Construcción del correo ----------
$subjectMap = [
    'custom-software' => 'Software a la medida',
    'ai-automation'   => 'Automatización con IA',
    'ai-agents'       => 'Agentes IA para empresas',
    'possly-einvoicing' => 'Possly - Facturación electrónica',
    'business-websites' => 'Páginas web para empresas',
    'outsourcing'     => 'Outsourcing y staff augmentation',
    'cloud-devops'    => 'Cloud & DevOps',
    'other'           => 'Otro'
];
$subjectLabel = $subjectMap[$subject] ?? 'Consulta general';
$mailSubject  = "[Nathan Soft] {$subjectLabel} — {$name}";

$bodyHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:Segoe UI,Roboto,Arial,sans-serif;background:#f4f6fb;padding:24px;color:#0A2540;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6eaf2;">
    <div style="background:linear-gradient(135deg,#1366B1,#0A2540);color:#fff;padding:22px 28px;">
      <h1 style="margin:0;font-size:20px;letter-spacing:.04em;">NATHAN SOFT</h1>
      <p style="margin:4px 0 0;font-size:13px;opacity:.85;">Nuevo contacto desde el sitio web</p>
    </div>
    <div style="padding:24px 28px;">
      <h2 style="margin:0 0 12px;font-size:16px;color:#0A2540;">' . htmlspecialchars($subjectLabel, ENT_QUOTES, 'UTF-8') . '</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#5a6b80;width:140px;">Nombre</td><td style="padding:8px 0;"><strong>' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . '</strong></td></tr>
        <tr><td style="padding:8px 0;color:#5a6b80;">Email</td><td style="padding:8px 0;"><a href="mailto:' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . '" style="color:#1366B1;">' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . '</a></td></tr>
        <tr><td style="padding:8px 0;color:#5a6b80;">Empresa</td><td style="padding:8px 0;">' . htmlspecialchars($company !== '' ? $company : '—', ENT_QUOTES, 'UTF-8') . '</td></tr>
        <tr><td style="padding:8px 0;color:#5a6b80;">Teléfono</td><td style="padding:8px 0;">' . htmlspecialchars($phone !== '' ? $phone : '—', ENT_QUOTES, 'UTF-8') . '</td></tr>
        <tr><td style="padding:8px 0;color:#5a6b80;">Idioma</td><td style="padding:8px 0;">' . htmlspecialchars(strtoupper($lang), ENT_QUOTES, 'UTF-8') . '</td></tr>
        <tr><td style="padding:8px 0;color:#5a6b80;">IP</td><td style="padding:8px 0;color:#8794a8;">' . htmlspecialchars($ip, ENT_QUOTES, 'UTF-8') . '</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #e6eaf2;margin:18px 0;">
      <h3 style="margin:0 0 8px;font-size:14px;color:#0A2540;">Mensaje</h3>
      <div style="white-space:pre-wrap;font-size:14px;line-height:1.55;color:#1a2a40;">'
        . nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8')) .
      '</div>
    </div>
    <div style="background:#f7f9fc;color:#5a6b80;font-size:12px;padding:14px 28px;border-top:1px solid #e6eaf2;">
      Enviado desde ' . htmlspecialchars($SITE_URL, ENT_QUOTES, 'UTF-8') . ' · ' . date('Y-m-d H:i:s') . '
    </div>
  </div>
</body></html>';

$bodyText = "Nuevo contacto desde nathansoft.com.co\n\n"
          . "Asunto: {$subjectLabel}\n"
          . "Nombre: {$name}\n"
          . "Email: {$email}\n"
          . "Empresa: {$company}\n"
          . "Teléfono: {$phone}\n"
          . "Idioma: " . strtoupper($lang) . "\n"
          . "IP: {$ip}\n\n"
          . "Mensaje:\n{$message}\n";

// ---------- Envío vía Gmail SMTP ----------
$mail = new PHPMailer(true);
try {
    // Servidor
    $mail->isSMTP();
    $mail->Host       = $SMTP_HOST;
    $mail->Port       = $SMTP_PORT;
    $mail->SMTPAuth   = true;
    $mail->Username   = $SMTP_USER;
    $mail->Password   = $SMTP_PASSWORD;
    $mail->SMTPSecure = ($SMTP_SECURE === 'tls') ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
    $mail->CharSet    = 'UTF-8';
    $mail->Encoding   = 'base64';
    $mail->Timeout    = 15;
    // Si tu hosting tiene certificados SSL desactualizados:
    $mail->SMTPOptions = [
        'ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'allow_self_signed' => false]
    ];

    // Remitente / destinatarios
    $mail->setFrom($FROM_EMAIL, $FROM_NAME);
    $mail->addAddress($TO_PRIMARY);
    if (!empty($TO_CC) && filter_var($TO_CC, FILTER_VALIDATE_EMAIL)) {
        $mail->addCC($TO_CC);
    }
    $mail->addReplyTo($email, $name);

    // Contenido
    $mail->isHTML(true);
    $mail->Subject = $mailSubject;
    $mail->Body    = $bodyHtml;
    $mail->AltBody = $bodyText;

    $mail->send();
    echo json_encode(['success' => true, 'message' => 'OK']);
} catch (Exception $e) {
    // Failsafe — guardamos el lead en /leads/ para no perderlo
    $logDir = __DIR__ . '/leads';
    if (!is_dir($logDir)) @mkdir($logDir, 0700, true);
    @file_put_contents(
        $logDir . '/' . date('Ymd_His_') . substr(md5($email), 0, 6) . '.txt',
        $bodyText . "\n\n[ERROR SMTP] " . $mail->ErrorInfo
    );

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'No se pudo enviar el correo. Hemos guardado tu mensaje y te contactaremos pronto.',
    ]);
}
