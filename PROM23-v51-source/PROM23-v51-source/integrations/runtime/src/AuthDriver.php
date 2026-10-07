<?php
declare(strict_types=1);
namespace Prom23\Runtime;

/** Source ConfirmationCodes keeps rate/expiry/attempt rules; confirm provider acceptance too. */
final class CheckedConfirmationCodes extends \Prom\Model\ConfirmationCodes {
    public bool $accepted = false;
    public function sendNewCode($login, $method, $code, $sendEmail = false): bool {
        if ($method === 'phone') {
            $result = (new \Prom\Controllers\ServiceVerification())->quickSendCodeAction($login, $code);
            $this->accepted = ($result['success'] ?? false) === true;
        } elseif ($method === 'email' && $sendEmail) {
            $this->accepted = (int)\CEvent::Send('AUTH_CONFIRM_CODE', SITE_ID, ['EMAIL_TO'=>$login, 'CODE'=>$code]) > 0;
        }
        return $this->accepted;
    }
}

/** Pending credentials never enter URL, response, ledger or plaintext session storage. */
final class ChallengeVault {
    public function __construct(private string $key) {}
    public function create(string $nextForm, array $values, int $retry = 0): array {
        $_SESSION['PROM23_CHALLENGES'] ??= [];
        foreach ($_SESSION['PROM23_CHALLENGES'] as $id => $item) if (($item['expires'] ?? 0) < time()) unset($_SESSION['PROM23_CHALLENGES'][$id]);
        if (count($_SESSION['PROM23_CHALLENGES']) >= 8) throw new RuntimeExceptionCode('RATE_LIMITED', 429);
        $id = bin2hex(random_bytes(24)); $nonce = random_bytes(12); $tag = '';
        $encoded = openssl_encrypt(json_encode($values, JSON_THROW_ON_ERROR), 'aes-256-gcm', hash_hkdf('sha256', $this->key, 32, 'prom23-auth-challenge'), OPENSSL_RAW_DATA, $nonce, $tag, $nextForm);
        if ($encoded === false) throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
        $_SESSION['PROM23_CHALLENGES'][$id] = ['next'=>$nextForm,'expires'=>time()+600,'retry'=>time()+$retry,'cipher'=>base64_encode($nonce.$tag.$encoded)];
        return ['status'=>'next-step','nextFormId'=>$nextForm,'challengeId'=>$id,'retryAfterSeconds'=>$retry];
    }
    public function read(string $id, string $form): array {
        $record = $_SESSION['PROM23_CHALLENGES'][$id] ?? null;
        if (!$record || $record['next'] !== $form || $record['expires'] < time()) throw new RuntimeExceptionCode('CODE_EXPIRED', 409);
        $raw = base64_decode($record['cipher'], true);
        if ($raw === false || strlen($raw) < 28) throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
        $value = openssl_decrypt(substr($raw,28), 'aes-256-gcm', hash_hkdf('sha256',$this->key,32,'prom23-auth-challenge'), OPENSSL_RAW_DATA, substr($raw,0,12), substr($raw,12,16), $form);
        if ($value === false) throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
        return json_decode($value, true, 32, JSON_THROW_ON_ERROR);
    }
    public function remove(string $id): void { unset($_SESSION['PROM23_CHALLENGES'][$id]); }
    public function retry(string $id): int { return max(0, (int)($_SESSION['PROM23_CHALLENGES'][$id]['retry'] ?? 0) - time()); }
}

final class AuthDriver {
    private ChallengeVault $vault;
    public function __construct(private array $config) { $this->vault = new ChallengeVault($config['key']); }
    private function phone($value): string {
        $digits = preg_replace('/\D/', '', (string)$value);
        if (!preg_match('/^[78][0-9]{10}$/D', $digits)) throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        return substr($digits,1);
    }
    private function password(array $values): void {
        if (!is_string($values['password'] ?? null) || strlen($values['password']) > 500 || mb_strlen($values['password']) < 8 ||
            !preg_match('/[A-ZА-ЯЁ]/u',$values['password']) || !preg_match('/[a-zа-яё]/u',$values['password']) || !preg_match('/[0-9]/',$values['password']) ||
            ($values['password_repeat'] ?? null) !== $values['password']) throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
    }
    private function authorized(int $id): array {
        global $USER;
        $record = \CUser::GetByID($id)->Fetch(); if (!is_array($record)) throw new RuntimeExceptionCode('AUTH_REQUIRED',401);
        Protocol::activeUser($record);
        if (!$USER->Authorize($id, false)) throw new RuntimeExceptionCode('AUTH_REQUIRED',401);
        unset($_SESSION['SELECT_ORGANIZATION'],$_SESSION['ORGANIZATION_ID'],$_SESSION['PROM23_CHALLENGES']);
        return ['status'=>'authenticated','authenticated'=>true];
    }
    public function context(array $payload, string $revision): array {
        $form = $payload['formId']; $value = ['formId'=>$form,'revision'=>$revision];
        if (isset($payload['challengeId'])) {
            $pending = $this->vault->read($payload['challengeId'],$form);
            $value['challengeId']=$payload['challengeId']; $value['retryAfterSeconds']=$this->vault->retry($payload['challengeId']);
            $value['initialValues']=array_intersect_key($pending,array_flip(['email','phone']));
        } elseif (in_array($form,['auth-otp','auth-register-phone','auth-register-otp'],true)) throw new RuntimeExceptionCode('CODE_EXPIRED',409);
        return $value;
    }
    public function run(string $operation, array $payload, array $actor): array {
        global $USER;
        if ($operation === 'auth.session') return ['authenticated'=>$actor['userId']>0];
        if ($operation === 'auth.logout') { require_once __DIR__.'/PaymentHandoff.php'; if(($this->config['pdo']??null) instanceof \PDO)PaymentHandoff::revokeIfExists($this->config['pdo'],$actor['sessionKey']); $USER->Logout(); unset($_SESSION['PROM23_CHALLENGES']); return ['loggedOut'=>true]; }
        $form = $payload['formId']; $values = $payload['values'] ?? []; $id = $payload['challengeId'] ?? '';
        $rest = new \Prom\Lib\Rest();
        if ($form === 'auth-login') {
            $login = trim((string)($values['login'] ?? ''));
            if (filter_var($login,FILTER_VALIDATE_EMAIL)) return $this->vault->create('auth-email',['email'=>$login]);
            $phone = $this->phone($login); return $this->vault->create('auth-phone',['phone'=>'7'.$phone]);
        }
        if ($form === 'auth-email') {
            $email = trim((string)($values['email'] ?? '')); $password = (string)($values['password'] ?? '');
            if (!filter_var($email,FILTER_VALIDATE_EMAIL) || strlen($password)>500) throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            // Same CUser::Login path as RestAuthController; no second REST connection or archive credential.
            $result = $USER->Login($email,$password,'N'); $found = $rest->findUserByLogin($email,'email');
            if ($result != '1' || !$found) throw new RuntimeExceptionCode('AUTH_REQUIRED',401);
            try { return $this->authorized((int)$found['ID']); } catch (\Throwable $error) { $USER->Logout(); throw $error; }
        }
        if ($form === 'auth-register') {
            $this->password($values);
            if (!filter_var($values['email'] ?? '',FILTER_VALIDATE_EMAIL)) throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            return $this->vault->create('auth-register-phone',array_intersect_key($values,array_flip(['email','password','password_repeat'])));
        }
        if (in_array($form,['auth-phone','auth-register-phone'],true)) {
            $pending = $id ? $this->vault->read($id,$form) : [];
            $phone = $this->phone($values['phone'] ?? $pending['phone'] ?? '');
            if ($form==='auth-register-phone') {
                $this->password($pending);
                if ($rest->findUserByLogin($pending['email'],'email') || $rest->findUserByLogin($phone,'phone')) throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            }
            $codes = new CheckedConfirmationCodes(); $issued = $codes->createNewCode($phone,'phone');
            // Source ConfirmationCodes::createNewCode always returns retry_after (not just on rate_limited); surface it, don't hardcode.
            $retryAfter = (int)($issued['retry_after'] ?? 60);
            if (!empty($issued['rate_limited'])) throw new RuntimeExceptionCode('RATE_LIMITED',429,[],$retryAfter);
            if (empty($issued['status']) || !$codes->accepted) throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
            if ($id) $this->vault->remove($id);
            return $this->vault->create($form==='auth-phone'?'auth-otp':'auth-register-otp',[...$pending,'phone'=>'7'.$phone,'hash'=>$issued['hash']],$retryAfter);
        }
        if (in_array($form,['auth-otp','auth-register-otp'],true)) {
            $pending=$this->vault->read($id,$form); $phone=$this->phone($pending['phone']); $code=(string)($values['code']??'');
            if (!preg_match('/^[0-9]{6}$/D',$code) || !(new \Prom\Model\ConfirmationCodes())->validateCode($phone,$pending['hash'],$code)) throw new RuntimeExceptionCode('INVALID_CODE',422);
            $found=$rest->findUserByLogin($phone,'phone');
            if ($form==='auth-register-otp' && ($found || $rest->findUserByLogin($pending['email'],'email'))) throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            if (!$found) {
                $password = $pending['password'] ?? \Helper::generatePassword(12);
                // Source RestAuthController: phone-only signup LOGIN is the bare local number (no country digit), matching UF_PHONE; email signup LOGIN is the email.
                $fields=['LOGIN'=>$pending['email']??$phone,'LID'=>'ru','ACTIVE'=>'Y','PASSWORD'=>$password,'CONFIRM_PASSWORD'=>$pending['password_repeat']??$password,'UF_PHONE'=>$phone];
                if (isset($pending['email'])) $fields['EMAIL']=$pending['email'];
                $created=(new \CUser())->Add($fields); if (!(int)$created) throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
                return $this->authorized((int)$created);
            }
            return $this->authorized((int)$found['ID']);
        }
        if ($form==='auth-recovery') {
            $email=(string)($values['email']??''); if (!filter_var($email,FILTER_VALIDATE_EMAIL)) throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            $user=$rest->findUserByLogin($email,'email');
            if ($user) \Prom\Model\User::recoveryPassword($user['ID'],$user['EMAIL']);
            // Receipt confirms that the request was processed; never disclose whether an email exists/delivered.
            return (new SubmissionReceipt($this->config))->record($payload,$actor,'source-recovery-accepted');
        }
        throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
    }
}
