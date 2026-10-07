<?php
declare(strict_types=1);
namespace Prom23\Runtime;

/** Calls allowlisted original handlers as the already verified Bitrix session.
 * No REST/admin credentials. Never returns cookies, HTML or provider errors to mobile.
 */
final class SourceHttp {
    public function __construct(private array $config) {}
    public function call(string $path,array $query,array $fields,array $files=[]): string {
        $origin=$this->config['sourceOrigin']??'';$parts=parse_url($origin);
        if(!$parts||($parts['scheme']??'')!=='https'||isset($parts['user'])||isset($parts['pass'])||isset($parts['query'])||isset($parts['fragment'])||
            (isset($parts['path'])&&$parts['path']!=='')||!in_array($origin,$this->config['sourceAllowedOrigins']??[],true)||preg_match('/(^|\.)zavod-antibpla\.ru$/i',$parts['host']??''))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
        if(!preg_match('#^/(?:local/(?:ajax|include/forms)/[A-Za-z0-9_./-]+\.php|suppliers/|franchise/)$#D',$path)||str_contains($path,'..'))throw new RuntimeExceptionCode('FORBIDDEN',403);
        $name=session_name();$id=session_id();
        if(!preg_match('/^[A-Za-z0-9_-]{1,100}$/D',$name)||!preg_match('/^[A-Za-z0-9,-]{1,128}$/D',$id))throw new RuntimeExceptionCode('AUTH_EXPIRED',401);
        $fields['sessid']=bitrix_sessid();
        // Release the source session lock before this same session enters its original HTTP handler.
        if(session_status()===PHP_SESSION_ACTIVE)session_write_close();
        $url=$origin.$path.($query?'?'.http_build_query($query):'');$result='';$curl=curl_init($url);
        if(!$curl)throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
        $post=$fields;
        if($files){
            $post=[];$flatten=static function($value,string $key)use(&$flatten,&$post):void {if(is_array($value))foreach($value as $i=>$v)$flatten($v,$key.'['.$i.']');else $post[$key]=(string)$value;};
            foreach($fields as $key=>$value)$flatten($value,$key);
            foreach($files as $key=>$file)$post[$key]=new \CURLFile($file['tmp_name'],$file['type'],$file['name']);
        }
        curl_setopt_array($curl,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>$files?$post:http_build_query($post),CURLOPT_COOKIE=>$name.'='.$id,
            CURLOPT_FOLLOWLOCATION=>false,CURLOPT_MAXREDIRS=>0,CURLOPT_TIMEOUT=>8,CURLOPT_CONNECTTIMEOUT=>3,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,
            CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,CURLOPT_WRITEFUNCTION=>static function($handle,string $chunk)use(&$result):int{if(strlen($result)+strlen($chunk)>1048576)return 0;$result.=$chunk;return strlen($chunk);},
            CURLOPT_HTTPHEADER=>['Accept: application/json, text/html','X-Prom23-Source-Adapter: 1','X-Requested-With: XMLHttpRequest']]);
        try {$ok=curl_exec($curl);$status=curl_getinfo($curl,CURLINFO_RESPONSE_CODE);if($ok===false||$status<200||$status>=300)throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');}
        finally {curl_close($curl);if(session_status()!==PHP_SESSION_ACTIVE)session_start();}
        return $result;
    }
}
