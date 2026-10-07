<?php
declare(strict_types=1);
use Prom23\Runtime\{RequestLedger,RuntimeExceptionCode,PaymentHandoff};
require_once __DIR__.'/src/Protocol.php';require_once __DIR__.'/src/PaymentHandoff.php';
ini_set('display_errors','0');umask(0077);
try{
    $path=getenv('PROM23_RUNTIME_CONFIG_FILE')?:'';$real=realpath($path);
    if(!$real||is_link($path)||!is_file($real)||(fileperms($real)&0077))throw new RuntimeExceptionCode('NOT_FOUND',404);
    $config=require$real;$payment=$config['payment']??[];
    if(($payment['invoiceEnabled']??false)!==true)throw new RuntimeExceptionCode('NOT_FOUND',404);
    $url=PaymentHandoff::endpoint($payment['handoff']??[]);$u=parse_url($url);
    if(($_SERVER['REQUEST_URI']??'')!==$u['path'])throw new RuntimeExceptionCode('NOT_FOUND',404);
    $state=realpath($config['stateDirectory']??'');$root=realpath($config['siteRoot']??'');
    foreach([$state,$real]as$p)if(!$root||!$p||$p===$root||str_starts_with($p,$root.DIRECTORY_SEPARATOR))throw new RuntimeExceptionCode('NOT_FOUND',404);
    if(!is_dir($state)||(fileperms($state)&0077)||is_link($config['stateDirectory']))throw new RuntimeExceptionCode('NOT_FOUND',404);
    $method=$_SERVER['REQUEST_METHOD']??'';
    if($method==='GET'){
        $nonce=base64_encode(random_bytes(18));foreach(PaymentHandoff::headers($nonce)as$k=>$v)header($k.': '.$v);
        header('Content-Type: text/html; charset=utf-8');
        // Only this fixed script executes. The opaque token stays out of URLs sent to servers, source cookies and provider scripts.
        echo '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Счёт на оплату</title><body><p id="status">Открываем счёт…</p><script nonce="'.$nonce.'">(async()=>{const token=location.hash.slice(1);history.replaceState(null,"",location.pathname);try{if(!/^[a-f0-9]{64}$/.test(token))throw 0;const r=await fetch(location.pathname,{method:"POST",credentials:"omit",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})});if(!r.ok)throw 0;const html=await r.text();const doc=new DOMParser().parseFromString(html,"text/html");document.title=doc.title;document.body.replaceWith(doc.body);for(const s of doc.querySelectorAll("style"))document.head.append(s);}catch(e){document.getElementById("status").textContent="Ссылка устарела. Откройте счёт снова из заказа."}})();</script></body></html>';
    }elseif($method==='POST'){
        if(($_SERVER['HTTP_ORIGIN']??'')!=='https://'.$u['host']||isset($_SERVER['HTTP_CONTENT_ENCODING'])||strtolower(trim(explode(';',$_SERVER['CONTENT_TYPE']??'')[0]))!=='application/json')throw new RuntimeExceptionCode('FORBIDDEN',403);
        $raw=file_get_contents('php://input',false,null,0,257);if($raw===false||strlen($raw)>256)throw new RuntimeExceptionCode('INVALID_BODY',400);
        $body=json_decode($raw,true,4,JSON_THROW_ON_ERROR);if(!is_array($body)||array_keys($body)!==['token']||!is_string($body['token']))throw new RuntimeExceptionCode('INVALID_BODY',400);
        $db=(new RequestLedger($state.'/runtime.sqlite'))->pdo();
        $html=(new PaymentHandoff($db,$payment['handoff']))->consume($body['token']);
        foreach(PaymentHandoff::headers()as$k=>$v)header($k.': '.$v);header('Content-Type: text/html; charset=utf-8');echo$html;
    }else throw new RuntimeExceptionCode('METHOD_NOT_ALLOWED',405);
}catch(\Throwable $e){foreach(PaymentHandoff::headers()as$k=>$v)header($k.': '.$v);http_response_code($e instanceof RuntimeExceptionCode?$e->status:503);header('Content-Type: text/plain; charset=utf-8');echo'Счёт недоступен. Откройте его снова из заказа.';}
