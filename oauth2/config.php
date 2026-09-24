<?php
// Load .env configuration if present
$envFiles = [__DIR__ . '/.env', dirname(__DIR__) . '/.env'];
foreach ($envFiles as $envFile) {
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value, " \t\n\r\0\x0B\"'");
                if (getenv($key) === false) {
                    putenv("{$key}={$value}");
                    $_ENV[$key] = $value;
                    $_SERVER[$key] = $value;
                }
            }
        }
        break;
    }
}

$projectName = basename(dirname(__DIR__));
$appUrl = rtrim(getenv('APP_URL') ?: "https://service.csc.ku.ac.th/edocs", '/');

define('CLIENT_ID', getenv('KU_ALLLOGIN_CLIENT_ID') ?: 'csc-it-service');
define('CLIENT_SECRET', getenv('KU_ALLLOGIN_CLIENT_SECRET') ?: 'wtDtbff5rcZTKOeyPQC2AWGEAq8ZvQh6');
define('USER_SCOPE', getenv('KU_ALLLOGIN_SCOPE') ?: 'basic openid');
define('REDIRECT_URI', getenv('KU_ALLLOGIN_REDIRECT_URI') ?: $appUrl . '/oauth2');
define('LOGOUT_REDIRECT_URI', getenv('KU_ALLLOGIN_LOGOUT_REDIRECT_URI') ?: $appUrl);
define('REDIRECT_URI_INDEX', $appUrl);

define('AUTHORIZATION_ENDPOINT', getenv('KU_ALLLOGIN_AUTHORIZATION_URL') ?: 'https://alllogin.ku.ac.th/realms/KU-Alllogin/protocol/openid-connect/auth');
define('TOKEN_ENDPOINT', getenv('KU_ALLLOGIN_TOKEN_URL') ?: 'https://alllogin.ku.ac.th/realms/KU-Alllogin/protocol/openid-connect/token');
define('USER_INFO', getenv('KU_ALLLOGIN_USERINFO_URL') ?: 'https://alllogin.ku.ac.th/realms/KU-Alllogin/protocol/openid-connect/userinfo');
define('END_SESSION_ENDPOINT', getenv('KU_ALLLOGIN_END_SESSION_URL') ?: 'https://alllogin.ku.ac.th/realms/KU-Alllogin/protocol/openid-connect/logout');
