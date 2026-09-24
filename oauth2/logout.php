<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once('config.php');

$params = [
    'post_logout_redirect_uri' => LOGOUT_REDIRECT_URI,
    'id_token_hint' => $_SESSION['ID_TOKEN'] ?? '',
];

$logout_alllogin = END_SESSION_ENDPOINT . '?' . http_build_query($params);

// Clear session variables
$_SESSION = array();

// Clear session cookie if set
if (ini_get("session.use_cookies")) {
    $cookieParams = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $cookieParams["path"], $cookieParams["domain"],
        $cookieParams["secure"], $cookieParams["httponly"]
    );
}

session_destroy();

header("Location: $logout_alllogin");
exit(0);
