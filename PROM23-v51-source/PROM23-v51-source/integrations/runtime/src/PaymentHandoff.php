<?php
declare(strict_types=1);
namespace Prom23\Runtime;

/** Short-lived one-use capability for a sanitized invoice. No source cookies, provider scripts or new bank data. */
final class PaymentHandoff
{
    public function __construct(private \PDO $db,private array $config)
    {
        $db->exec('CREATE TABLE IF NOT EXISTS prom23_invoice_tickets(hash TEXT PRIMARY KEY,session_key TEXT,order_id TEXT,html TEXT,expires INTEGER,user_id INTEGER NOT NULL DEFAULT 0)');
        if(!in_array('user_id',array_column($db->query('PRAGMA table_info(prom23_invoice_tickets)')->fetchAll(\PDO::FETCH_ASSOC),'name'),true)){$db->exec('DELETE FROM prom23_invoice_tickets');$db->exec('ALTER TABLE prom23_invoice_tickets ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0');}
    }
    public function issue($sourceHtml,array $actor,string $orderId):string
    {
        if(!is_int($actor['userId']??null)||$actor['userId']<1||!preg_match('/^[a-f0-9]{64}$/D',$actor['sessionKey']??'')||!preg_match('/^[1-9][0-9]{0,15}$/D',$orderId))self::fail('FORBIDDEN',403);
        $url=self::endpoint($this->config);
        $html=self::sanitize($sourceHtml);$now=time();
        $this->db->prepare('DELETE FROM prom23_invoice_tickets WHERE expires<=?')->execute([$now]);
        if((int)$this->db->query('SELECT COUNT(*) FROM prom23_invoice_tickets')->fetchColumn()>=100)self::fail('RATE_LIMITED',429);
        $token=bin2hex(random_bytes(32));
        $this->db->prepare('INSERT INTO prom23_invoice_tickets VALUES(?,?,?,?,?,?)')->execute([hash('sha256',$token),$actor['sessionKey'],$orderId,$html,$now+120,$actor['userId']]);
        // Fragment is not sent in browser HTTP requests or web server access logs.
        return $url.'#'.$token;
    }
    public function consume(string $token):string
    {
        if(!preg_match('/^[a-f0-9]{64}$/D',$token))self::fail('NOT_FOUND',404);
        $hash=hash('sha256',$token);$this->db->exec('BEGIN IMMEDIATE');$active=true;
        try{
            $s=$this->db->prepare('SELECT * FROM prom23_invoice_tickets WHERE hash=?');$s->execute([$hash]);$row=$s->fetch(\PDO::FETCH_ASSOC);
            $this->db->prepare('DELETE FROM prom23_invoice_tickets WHERE hash=?')->execute([$hash]);
            if(!$row||(int)$row['expires']<=time()){ $this->db->exec('COMMIT');$active=false;self::fail('NOT_FOUND',404); }
            // Explicit logout hooks revoke these tickets. A missing binding is an additional rejection.
            $s=$this->db->prepare('SELECT 1 FROM prom23_session_bindings WHERE session_key=?');$s->execute([$row['session_key']]);$binding=(bool)$s->fetchColumn();
            $this->db->exec('COMMIT');$active=false;if(!$binding)self::fail('NOT_FOUND',404);
            return $row['html'];
        }catch(\Throwable $e){if($active)$this->db->exec('ROLLBACK');throw$e;}
    }
    public static function revokeIfExists(\PDO $db,string $sessionKey):void
    {
        if(!preg_match('/^[a-f0-9]{64}$/D',$sessionKey))self::fail('FORBIDDEN',403);
        if($db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='prom23_invoice_tickets'")->fetchColumn())$db->prepare('DELETE FROM prom23_invoice_tickets WHERE session_key=?')->execute([$sessionKey]);
    }
    public static function revokeUserIfExists(\PDO $db,int $userId):void
    {
        if($userId<1)self::fail('FORBIDDEN',403);
        if($db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='prom23_invoice_tickets'")->fetchColumn()){
            $columns=array_column($db->query('PRAGMA table_info(prom23_invoice_tickets)')->fetchAll(\PDO::FETCH_ASSOC),'name');
            if(!in_array('user_id',$columns,true))$db->exec('DELETE FROM prom23_invoice_tickets');
            else $db->prepare('DELETE FROM prom23_invoice_tickets WHERE user_id=?')->execute([$userId]);
        }
    }
    public static function endpoint(array $config):string
    {
        $url=$config['url']??'';$p=is_string($url)?parse_url($url):false;
        if(!$p||($p['scheme']??'')!=='https'||isset($p['query'])||isset($p['fragment'])||isset($p['user'])||isset($p['pass'])||(isset($p['port'])&&$p['port']!==443)||preg_match('/[\x00-\x20\\\\]/',$url)||!in_array(strtolower($p['host']??''),$config['allowedHosts']??[],true)||!preg_match('~^/[A-Za-z0-9/_-]+\.php$~D',$p['path']??''))self::fail('PAYMENT_HANDOFF_ADAPTER_REQUIRED');
        return$url;
    }
    public static function sanitize($source):string
    {
        if(!is_string($source)||strlen($source)>262144||trim($source)==='')self::fail('PAYMENT_TEMPLATE_INVALID');
        if(!class_exists(\DOMDocument::class))self::fail('PAYMENT_HTML_PARSER_REQUIRED');
        $dom=new \DOMDocument();$old=libxml_use_internal_errors(true);
        try{$ok=$dom->loadHTML('<?xml encoding="UTF-8">'.$source,LIBXML_NONET|LIBXML_NOERROR|LIBXML_NOWARNING);}finally{libxml_clear_errors();libxml_use_internal_errors($old);}
        if(!$ok)self::fail('PAYMENT_TEMPLATE_INVALID');
        $drop=['script','style','iframe','object','embed','svg','math','template','noscript','meta','link','base','input','button','select','textarea','form','img','video','audio','source'];
        $allow=['p','div','span','br','hr','h1','h2','h3','h4','table','thead','tbody','tfoot','tr','td','th','strong','b','em','i','u','small','ul','ol','li','pre'];
        $visit=function(\DOMNode $node,int $depth=0)use(&$visit,$drop,$allow):string{
            if($depth>80)self::fail('PAYMENT_TEMPLATE_INVALID');
            if($node instanceof \DOMText)return htmlspecialchars($node->nodeValue,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');
            if(!($node instanceof \DOMElement))return'';
            $tag=strtolower($node->tagName);if(in_array($tag,$drop,true))return'';
            $content='';foreach($node->childNodes as$child)$content.=$visit($child,$depth+1);
            if(!in_array($tag,$allow,true))return$content;
            $attrs='';if(in_array($tag,['td','th'],true))foreach(['colspan','rowspan']as$a){$v=$node->getAttribute($a);if(preg_match('/^[1-9][0-9]?$/D',$v))$attrs.=' '.$a.'="'.$v.'"';}
            return '<'.$tag.$attrs.'>'.$content.(in_array($tag,['br','hr'],true)?'':'</'.$tag.'>');
        };
        $body=$dom->getElementsByTagName('body')->item(0);if(!$body)self::fail('PAYMENT_TEMPLATE_INVALID');
        $safe=$visit($body);if(trim(html_entity_decode(strip_tags($safe),ENT_QUOTES,'UTF-8'))==='')self::fail('PAYMENT_TEMPLATE_INVALID');
        return '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Счёт на оплату</title><style>body{font:16px system-ui;margin:20px;color:#17212b}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccd2d9;padding:6px}pre{white-space:pre-wrap}@media print{body{margin:0}}</style><body>'.$safe.'</body></html>';
    }
    public static function headers(?string $nonce=null):array
    {
        return ['Cache-Control'=>'no-store, private','Pragma'=>'no-cache','X-Content-Type-Options'=>'nosniff','X-Frame-Options'=>'DENY','Referrer-Policy'=>'no-referrer','X-Robots-Tag'=>'noindex, nofollow','Content-Security-Policy'=>"default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; style-src 'unsafe-inline'; connect-src 'self'; script-src ".($nonce?"'nonce-".$nonce."'":"'none'")];
    }
    private static function fail(string $code,int $status=503):never{throw new RuntimeExceptionCode($code,$status);}
}
