<?php
require_once('Client.php');
require_once('./GrantType/IGrantType.php');
require_once('./GrantType/AuthorizationCode.php');
require_once('./GrantType/RefreshToken.php');
require_once('./GrantType/ClientCredentials.php');
require_once('config.php');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$client = new OAuth2\Client(CLIENT_ID, CLIENT_SECRET);

// Authentication check
if (!isset($_SESSION['ACCESS_TOKEN']) || !isset($_SESSION['ID_TOKEN'])) {
    if (!isset($_GET['code'])) {
        // Proof Key for Code Exchange (PKCE)
        $verifierBytes = random_bytes(64);
        $code_verifier = trim(strtr(base64_encode($verifierBytes), "+/", "-_"), "=");
        $challenge_bytes = hash("sha256", $code_verifier, true);
        $code_challenge = trim(strtr(base64_encode($challenge_bytes), "+/", "-_"), "=");
        
        $_SESSION['CODE_VERIFIER'] = $code_verifier;

        // CSRF State protection
        $state = bin2hex(random_bytes(16));
        $_SESSION['OAUTH2_STATE'] = $state;

        $auth_url = $client->getAuthenticationUrl(
            AUTHORIZATION_ENDPOINT, 
            REDIRECT_URI, 
            array('scope' => USER_SCOPE, 'state' => $state), 
            $code_challenge
        );
        header('Location: ' . $auth_url);
        exit(0);
    } else {
        // Callback handling
        if (isset($_SESSION['CODE_VERIFIER']) && isset($_GET['code'])) {
            // Verify CSRF State
            $receivedState = $_GET['state'] ?? '';
            $savedState = $_SESSION['OAUTH2_STATE'] ?? '';
            unset($_SESSION['OAUTH2_STATE']);

            if (empty($receivedState) || $receivedState !== $savedState) {
                unset($_SESSION['CODE_VERIFIER']);
                header('Location: ./logout.php?error=invalid_state');
                exit(0);
            }

            $params = array(
                'code' => $_GET['code'], 
                'redirect_uri' => REDIRECT_URI, 
                'code_verifier' => $_SESSION['CODE_VERIFIER']
            );
            
            try {
                $response = $client->getAccessToken(TOKEN_ENDPOINT, 'authorization_code', $params);
                unset($_SESSION['CODE_VERIFIER']);
                
                if (isset($response['result']['access_token']) && isset($response['result']['id_token'])) {
                    $client->setAccessToken($response['result']['access_token']);
                    $_SESSION['ACCESS_TOKEN'] = $response['result']['access_token'];
                    $_SESSION['ID_TOKEN'] = $response['result']['id_token'];

                    header("Location: ./getinfo.php");
                    exit(0);
                } else {
                    header('Location: ./logout.php?error=token_exchange_failed');
                    exit(0);
                }
            } catch (Exception $e) {
                unset($_SESSION['CODE_VERIFIER']);
                header('Location: ./logout.php?error=' . urlencode($e->getMessage()));
                exit(0);
            }
        } else {
            header('Location: ./logout.php?error=missing_verifier');
            exit(0);
        }
    }
} else {
    header('Location: ./getinfo.php');
    exit(0);
}
