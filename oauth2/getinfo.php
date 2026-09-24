<?php
require_once('Client.php');
require_once('config.php');

$isDirect = (realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'] ?? ''));

if ($isDirect) {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (!isset($_SESSION['ACCESS_TOKEN'])) {
        header('Location: ./logout.php?error=missing_token');
        exit(0);
    }

    // Fetch user info from KU-AllLogin
    $client = new OAuth2\Client(CLIENT_ID, CLIENT_SECRET);
    $client->setAccessToken($_SESSION['ACCESS_TOKEN']);
    $client->setAccessTokenType(OAuth2\Client::ACCESS_TOKEN_BEARER);

    try {
        $response = $client->fetch(USER_INFO);
        if (isset($response['code']) && $response['code'] === 200 && is_array($response['result'])) {
            $userProfile = $response['result'];
            $_SESSION['USER_PROFILE'] = $userProfile;
            
            // Extract common fields for general session usage
            $_SESSION['user'] = $userProfile['preferred_username'] ?? '';
            $_SESSION['email'] = $userProfile['email'] ?? '';
            $_SESSION['name'] = $userProfile['name'] ?? '';

            // If integrated within a Laravel project, perform Laravel-specific user mapping and login
            if (class_exists('App\Models\User') && function_exists('auth')) {
                $email = $userProfile['email'] ?? '';
                $username = $userProfile['preferred_username'] ?? '';
                $emails = array_filter([$email, $username . '@ku.ac.th', $username . '@ku.th']);

                $user = \App\Models\User::query()
                    ->where('status', 'active')
                    ->where('auth_type', 'ku_alllogin')
                    ->where(function ($query) use ($emails) {
                        foreach ($emails as $emailCandidate) {
                            $query->orWhereRaw('LOWER(email) = ?', [strtolower($emailCandidate)]);
                        }
                    })
                    ->first();

                if ($user) {
                    auth()->login($user);
                } else {
                    // User not found or inactive in the local database
                    header('Location: ./logout.php?error=unauthorized_user');
                    exit(0);
                }
            }

            // Redirect to main index/dashboard
            header("Location: " . REDIRECT_URI_INDEX);
            exit(0);
        } else {
            header("Location: ./logout.php?error=userinfo_fetch_failed");
            exit(0);
        }
    } catch (Exception $e) {
        header("Location: ./logout.php?error=" . urlencode($e->getMessage()));
        exit(0);
    }
} else {
    // Return the Laravel resolver closure for integration
    return static function (array $emailCandidates): ?\App\Models\User {
        if ($emailCandidates === []) {
            return null;
        }

        return \App\Models\User::query()
            ->where('status', 'active')
            ->where('auth_type', 'ku_alllogin')
            ->where(function ($query) use ($emailCandidates) {
                foreach ($emailCandidates as $email) {
                    $query->orWhereRaw('LOWER(email) = ?', [$email]);
                }
            })
            ->first();
    };
}
