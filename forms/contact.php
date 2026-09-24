<?php
/**
 * Contact form handler for the Alex Smith portfolio.
 *
 * Real email sending needs the "PHP Email Form" library from the pro version
 * of this template, uploaded to:
 *   assets/vendor/php-email-form/php-email-form.php
 *
 * Without that file this script still validates the request and answers with a
 * clear message instead of a fatal error, and the front-end offers a mailto
 * fallback so a visitor is never stranded.
 */

// Replace with the address that should receive the messages.
$receiving_email_address = 'hello@alexsmith.design';

header('Content-Type: text/plain; charset=utf-8');

if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo 'Method not allowed - please submit the contact form.';
  exit;
}

/** Read a single POST field safely (missing keys and arrays become the default). */
function post_value($key, $default = '')
{
  if (!isset($_POST[$key]) || is_array($_POST[$key])) {
    return $default;
  }
  return trim((string) $_POST[$key]);
}

$name    = post_value('name');
$email   = post_value('email');
$subject = post_value('subject');
$message = post_value('message');
$honey   = post_value('company'); // honeypot: must stay empty

// ---- Honeypot: answer like a success and drop the spam silently ------------
if ($honey !== '') {
  echo 'OK';
  exit;
}

// ---- Validation ------------------------------------------------------------
$errors = array();

if ($name === '') {
  $errors[] = 'Please tell me your name.';
}
if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
  $errors[] = 'Please enter a valid email address.';
}
if ($subject === '') {
  $errors[] = 'Please add a short subject.';
}
if ($message === '') {
  $errors[] = 'Please add a message.';
}

if (!empty($errors)) {
  echo implode(' ', $errors);
  exit;
}

// ---- Send ------------------------------------------------------------------
$library = dirname(__DIR__) . '/assets/vendor/php-email-form/php-email-form.php';

if (is_file($library)) {
  require $library;

  $contact = new PHP_Email_Form;
  $contact->ajax = true;
  $contact->to = $receiving_email_address;
  $contact->from_name = $name;
  $contact->from_email = $email;
  $contact->subject = $subject;

  // Uncomment and fill in to send through SMTP instead of PHP mail().
  /*
  $contact->smtp = array(
    'host' => 'example.com',
    'username' => 'example',
    'password' => 'secret',
    'port' => '587',
    'SMTPSecure' => 'tls'
  );
  */

  $contact->add_message($name, 'From');
  $contact->add_message($email, 'Email');
  $contact->add_message($message, 'Message', 10);

  echo $contact->send();
  exit;
}

// The pro library is not installed: answer clearly instead of dying, so the
// front-end can show its direct-email fallback.
http_response_code(503);
echo 'Unable to load the PHP Email Form library - the mail service is not configured on this host.';

