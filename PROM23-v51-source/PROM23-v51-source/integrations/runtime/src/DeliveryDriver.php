<?php
declare(strict_types=1);
namespace Prom23\Runtime;

/** Read-only provider discovery + binding to an unsaved Sale order. Never creates a shipment at a carrier. */
final class DeliveryDriver
{
    private array $config;
    private $http;
    private array $points = [];
    private ?string $cdekAccess = null;

    /** $http is an isolated-test transport, not a required deployment callback. */
    public function __construct(array $config = [], ?callable $http = null)
    {
        $this->config = $config['delivery'] ?? [];
        $this->http = $http;
    }

    /** Merge these concrete callbacks into CommerceDriver's server-only configuration. */
    public function callbacks(): array
    {
        $out = ['deliveryMethods'=>[], 'pointResolvers'=>[], 'deliveryBinders'=>[]];
        foreach ($this->config['services'] ?? [] as $id => $unused) {
            $id = self::serviceId($id); $service = $this->service($id);
            $out['deliveryMethods'][$id] = $service['method'];
            if ($service['method'] !== 'courier') {
                $out['pointResolvers'][$id] = fn(string $gar, string $locationCode, $shipment, array $scope): array => $this->resolvePoints($id, $gar, $locationCode, $scope);
            }
            $out['deliveryBinders'][$id] = fn($order, $shipment, array $point, array $scope): bool => $this->bind($id, $order, $shipment, $point, $scope);
        }
        return $out;
    }

    public function resolvePoints(int $id, string $gar, string $locationCode, array $scope): array
    {
        $service = $this->service($id); $map = $this->mapping($gar, $locationCode, $scope);
        if ($service['method'] === 'courier') self::fail('DELIVERY_METHOD_INVALID', 422);
        $key = self::cacheKey($id, $gar, $scope);
        // Instance is request-scoped. A quote/submit request gets a fresh driver and fresh provider list.
        if (isset($this->points[$key])) return $this->points[$key];
        if ($service['provider'] === 'cdek') $rows = $this->cdekPoints($map, $scope);
        elseif ($service['provider'] === 'yandex') $rows = $this->yandexPoints($service, $map, $scope);
        else $rows = $this->salePoints($id, $service, $map);
        if (count($rows) > 500) self::fail('DELIVERY_POINTS_LIMIT', 409);
        $seen = [];
        foreach ($rows as $point) {
            if (isset($seen[$point['pointId']])) self::fail('DELIVERY_POINTS_AMBIGUOUS');
            $seen[$point['pointId']] = true;
        }
        return $this->points[$key] = $rows;
    }

    public function bind(int $id, $order, $shipment, array $option, array $scope): bool
    {
        $service = $this->service($id);
        if ((string)($option['sourceId'] ?? '') !== (string)$id || ($option['method'] ?? '') !== $service['method'] || (int)$shipment->getField('DELIVERY_ID') !== $id) self::fail('DELIVERY_SELECTION_INVALID', 409);
        $props = [];
        foreach ($order->getPropertyCollection() as $prop) {
            $code = $prop->getField('CODE');
            if (isset($props[$code])) self::fail('DELIVERY_PROPERTY_AMBIGUOUS');
            $props[$code] = $prop;
        }
        $locationCode = isset($props['LOCATION']) ? (string)$props['LOCATION']->getValue() : '';
        $gar = $scope['settlementId'] ?? '';
        $map = $this->mapping($gar, $locationCode, $scope);
        $values = ['LOCATION'=>$locationCode];
        if ($service['method'] === 'courier') {
            $address = self::text($scope['address'] ?? '', 500);
            if ($address === '') self::fail('ADDRESS_REQUIRED', 422);
            $choices = $this->addressChoices($gar, $address, $locationCode, $scope);
            $matches = array_values(array_filter($choices, static fn(array $row): bool => self::sameAddress($address, $row['address']) || self::sameAddress($address, $row['fullAddress'])));
            if (count($matches) !== 1) self::fail('ADDRESS_CONFIRMATION_REQUIRED', 422);
            $point = $matches[0];
            $values += ['ADDRESS'=>$address];
            $bindings = ['latitude'=>$point['latitude'], 'longitude'=>$point['longitude'], 'houseId'=>$point['houseId']];
            if ($point['postalCode'] !== '') $bindings['postalCode'] = $point['postalCode'];
        } else {
            $points = $this->resolvePoints($id, $gar, $locationCode, $scope);
            $matches = array_values(array_filter($points, static fn(array $row): bool => $row['pointId'] === ($option['pointId'] ?? null)));
            if (count($matches) !== 1) self::fail('DELIVERY_POINT_NOT_AVAILABLE', 409);
            $point = $matches[0];
            if (($option['address'] ?? '') !== $point['address'] || ($option['name'] ?? '') !== $point['name']) self::fail('DELIVERY_POINT_CHANGED', 409);
            // Source checkout preserved CDEK point code in the address; retain this plus an explicit carrier property.
            $values['ADDRESS'] = ($service['provider'] === 'cdek' ? $point['pointId'].' ' : '').$point['address'];
            $bindings = ['pointId'=>$point['pointId'], 'latitude'=>$point['latitude'], 'longitude'=>$point['longitude']];
        }
        if (isset($map['cdekCityCode']) && $service['provider'] === 'cdek') $bindings['cityCode'] = (string)$map['cdekCityCode'];
        if (isset($map['yandexGeoId']) && $service['provider'] === 'yandex') $bindings['geoId'] = (string)$map['yandexGeoId'];
        foreach (['pod','etag','office','comment'] as $key) if (($scope[$key] ?? '') !== '') $bindings[$key] = self::text($scope[$key], 500);
        $codes = $service['propertyCodes'] ?? [];
        // A written address alone does not configure an installed provider's point/coordinates.
        foreach ($service['method'] === 'courier' ? ['latitude','longitude'] : ['pointId'] as $required) if (empty($codes[$required])) self::fail('DELIVERY_PROPERTY_MAPPING_REQUIRED');
        foreach ($codes as $semantic => $code) {
            if (!in_array($semantic, ['pointId','latitude','longitude','cityCode','geoId','houseId','postalCode','pod','etag','office','comment'], true) || !is_string($code) || !preg_match('/^[A-Z][A-Z0-9_]{0,63}$/D', $code) || in_array($code, ['LOCATION','ADDRESS','FIO','EMAIL','PHONE','COMPANY','INN','KPP','ORGANIZATION_ID'], true)) self::fail('DELIVERY_PROPERTY_MAPPING_INVALID');
            if (isset($bindings[$semantic])) {
                if (isset($values[$code])) self::fail('DELIVERY_PROPERTY_MAPPING_INVALID');
                $values[$code] = (string)$bindings[$semantic];
            }
        }
        // Validate the entire property map before any setValue on the transient order.
        foreach ($values as $code => $value) if (!isset($props[$code])) self::fail('DELIVERY_PROPERTY_MAPPING_REQUIRED');
        foreach ($values as $code => $value) {
            $result = $props[$code]->setValue($value);
            if (!is_object($result) || !method_exists($result, 'isSuccess') || !$result->isSuccess()) self::fail('DELIVERY_PROPERTY_WRITE_FAILED');
        }
        return true;
    }

    /** Runtime operation checkout.addresses; only the signed dispatcher supplies actor. */
    public function addressSuggestions(array $payload, array $actor): array
    {
        if (!is_int($actor['userId'] ?? null) || $actor['userId'] < 0 || !preg_match('/^[a-f0-9]{64}$/D', $actor['sessionKey'] ?? '') || !hash_equals($actor['sessionKey'], (string)($payload['sessionKey'] ?? ''))) self::fail('AUTH_REQUIRED', 401);
        $context=$payload['context'] ?? '';
        if (!is_string($context) || !is_string($payload['settlementId'] ?? null) || !is_string($payload['query'] ?? null)) self::fail('DELIVERY_SCOPE_INVALID',409);
        if ($context==='business') self::fail('ORGANIZATION_REQUIRED',409);
        if ($context==='personal') {
            if (!empty($payload['organizationId']) || !empty($actor['organizationId'])) self::fail('FORBIDDEN',403);
        } elseif (!preg_match('/^organization:([1-9][0-9]*)$/D',$context,$m) || $actor['userId']<1 || ((int)$m[1]!==($actor['organizationId']??0) || (isset($payload['organizationId']) && (int)$payload['organizationId']!==(int)$m[1]))) self::fail('FORBIDDEN',403);
        $gar=$payload['settlementId'] ?? '';
        $locationCode=$this->config['settlementMap'][$gar]['locationCode'] ?? '';
        $scope=$payload; $scope['contextKey']=hash('sha256',json_encode([$actor['userId'],$context,$gar,$payload['locationVersion']??null],JSON_THROW_ON_ERROR));
        $rows=$this->addressChoices($gar,$payload['query']??'',$locationCode,$scope);
        return ['suggestions'=>array_slice(array_map(static fn(array $r):array=>['address'=>$r['address']],$rows),0,10)];
    }

    /** Suggestions must be explicitly selected by the buyer. Never silently accept provider's first guess. */
    private function addressChoices(string $gar, string $query, string $locationCode, array $scope): array
    {
        $this->mapping($gar, $locationCode, $scope); $query = self::text($query, 500);
        if (strlen($query) < 3) self::fail('ADDRESS_REQUIRED', 422);
        $response = $this->request('POST', 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', ['Authorization: Token '.$this->credential('dadata', 'token')], ['query'=>$query, 'count'=>10, 'locations'=>[['fias_id'=>$gar]], 'restrict_value'=>true, 'from_bound'=>['value'=>'house'], 'to_bound'=>['value'=>'flat']]);
        if (!is_array($response['suggestions'] ?? null) || !array_is_list($response['suggestions']) || count($response['suggestions']) > 20) self::fail('DELIVERY_ADDRESS_RESPONSE_INVALID');
        $out=[];
        foreach ($response['suggestions'] as $row) {
            if (!is_array($row)) self::fail('DELIVERY_ADDRESS_RESPONSE_INVALID');
            $d = $row['data'] ?? [];
            $parent = !empty($d['settlement_fias_id']) ? $d['settlement_fias_id'] : ($d['city_fias_id'] ?? '');
            if (strtolower((string)$parent) !== $gar || ($d['country_iso_code'] ?? '') !== 'RU' || empty($d['house']) || !preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/Di', (string)($d['house_fias_id'] ?? ''))) continue;
            if (!is_numeric($d['geo_lat'] ?? null) || !is_numeric($d['geo_lon'] ?? null)) continue;
            $coords = self::coordinates($d['geo_lat'], $d['geo_lon']);
            $address = self::text($row['value'] ?? '', 500); $full = self::text($row['unrestricted_value'] ?? $address, 500);
            if ($address === '') continue;
            $out[] = ['address'=>$address, 'fullAddress'=>$full, 'settlementId'=>$gar, 'houseId'=>strtolower($d['house_fias_id']), 'latitude'=>$coords[0], 'longitude'=>$coords[1], 'postalCode'=>preg_match('/^[0-9]{6}$/D', (string)($d['postal_code'] ?? '')) ? $d['postal_code'] : ''];
        }
        return $out;
    }

    private function cdekPoints(array $map, array $scope): array
    {
        $city = $map['cdekCityCode'] ?? null;
        if (!is_int($city) || $city < 1) self::fail('CDEK_CITY_MAPPING_REQUIRED');
        if ($this->cdekAccess === null) {
            $auth = $this->request('POST', 'https://api.cdek.ru/v2/oauth/token', [], ['grant_type'=>'client_credentials','client_id'=>$this->credential('cdek','clientId'),'client_secret'=>$this->credential('cdek','clientSecret')], true);
            if (!is_string($auth['access_token'] ?? null) || !preg_match('/^[A-Za-z0-9._~-]{10,4096}$/D', $auth['access_token'])) self::fail('DELIVERY_PROVIDER_AUTH_FAILED');
            $this->cdekAccess = $auth['access_token'];
        }
        $rows = $this->request('GET', 'https://api.cdek.ru/v2/deliverypoints?'.http_build_query(['city_code'=>$city,'type'=>'PVZ']), ['Authorization: Bearer '.$this->cdekAccess]);
        if (!array_is_list($rows)) self::fail('DELIVERY_POINTS_RESPONSE_INVALID');
        $out=[];
        foreach ($rows as $row) {
            if (!is_array($row)) self::fail('DELIVERY_POINTS_RESPONSE_INVALID');
            if (($row['type'] ?? '') !== 'PVZ' || (int)($row['location']['city_code'] ?? 0) !== $city) continue;
            if (($scope['payment'] ?? '') === 'receipt' && ($row['have_cashless'] ?? false) !== true && ($row['have_cash'] ?? false) !== true) continue;
            $loc = $row['location']; $address = $loc['address_full'] ?? $loc['address'] ?? '';
            $out[] = self::point($row['code'] ?? '', $row['name'] ?? $address, $address, $loc['latitude'] ?? null, $loc['longitude'] ?? null);
        }
        return $out;
    }

    private function yandexPoints(array $service, array $map, array $scope): array
    {
        $geo = $map['yandexGeoId'] ?? null;
        if (!is_int($geo) || $geo < 1) self::fail('YANDEX_GEO_MAPPING_REQUIRED');
        $type = $service['pointType'] ?? 'pickup_point';
        if (!in_array($type, ['pickup_point','terminal'], true)) self::fail('YANDEX_POINT_TYPE_INVALID');
        $payment = ($scope['payment'] ?? '') === 'receipt' ? ($service['receiptPaymentMethod'] ?? null) : 'already_paid';
        if (!in_array($payment, ['already_paid','card_on_receipt','postpay'], true)) self::fail('YANDEX_PAYMENT_MAPPING_REQUIRED');
        $body = ['geo_id'=>$geo, 'type'=>$type, 'available_for_dropoff'=>false, 'payment_method'=>$payment, 'operator_ids'=>['market_l4g']];
        $data = $this->request('POST', 'https://b2b-authproxy.taxi.yandex.net/api/b2b/platform/pickup-points/list', ['Authorization: Bearer '.$this->credential('yandex','token')], $body);
        if (!is_array($data['points'] ?? null) || !array_is_list($data['points'])) self::fail('DELIVERY_POINTS_RESPONSE_INVALID');
        $out=[];
        foreach ($data['points'] as $row) {
            if (!is_array($row)) self::fail('DELIVERY_POINTS_RESPONSE_INVALID');
            if (($row['type'] ?? '') !== $type || !empty($row['is_post_office']) || (isset($row['address']['geoId']) && (int)$row['address']['geoId'] !== $geo)) continue;
            if (!is_array($row['payment_methods'] ?? null) || !in_array($payment, $row['payment_methods'], true)) continue;
            $address = $row['address']['full_address'] ?? implode(', ', array_filter([$row['address']['locality'] ?? '', $row['address']['street'] ?? '', $row['address']['house'] ?? '']));
            $out[] = self::point($row['id'] ?? '', $row['name'] ?? '', $address, $row['position']['latitude'] ?? null, $row['position']['longitude'] ?? null);
        }
        return $out;
    }

    private function salePoints(int $id, array $service, array $map): array
    {
        if (!class_exists('CIBlockElement')) self::fail('BITRIX_MODULE_UNAVAILABLE');
        $iblock = $service['pointIblockId'] ?? null; $ids = $map['salePointIds'][$id] ?? null; $addressCode = $service['addressPropertyCode'] ?? 'ADRES';
        if (!is_int($iblock) || $iblock < 1 || !is_array($ids) || !array_is_list($ids) || count($ids) > 500 || !preg_match('/^[A-Z][A-Z0-9_]{0,63}$/D', $addressCode)) self::fail('SALE_POINTS_MAPPING_REQUIRED');
        foreach ($ids as $pointId) if (!is_int($pointId) || $pointId < 1) self::fail('SALE_POINTS_MAPPING_REQUIRED');
        if (!$ids) return [];
        $cursor = \CIBlockElement::GetList(['SORT'=>'ASC','ID'=>'ASC'], ['IBLOCK_ID'=>$iblock,'ID'=>$ids,'ACTIVE'=>'Y','ACTIVE_DATE'=>'Y'], false, false, []); $out=[];
        while ($entity = $cursor->GetNextElement()) {
            $f=$entity->GetFields(); $p=$entity->GetProperties();
            if (!in_array((int)$f['ID'], $ids, true) || (int)$f['IBLOCK_ID'] !== $iblock) self::fail('SALE_POINTS_RESPONSE_INVALID');
            $coords=explode(',', (string)($p['MAP']['VALUE'] ?? ''));
            if (count($coords) !== 2) self::fail('DELIVERY_COORDINATES_REQUIRED');
            $out[]=self::point((string)$f['ID'], $f['NAME'], $p[$addressCode]['VALUE'] ?? '', trim($coords[0]), trim($coords[1]));
        }
        return $out;
    }

    private function service(int $id): array
    {
        self::serviceId($id); $s = $this->config['services'][$id] ?? null;
        if (!is_array($s) || !in_array($s['provider'] ?? '', ['cdek','yandex','sale'], true) || !in_array($s['method'] ?? '', ['pvz','terminal','courier'], true)) self::fail('DELIVERY_SERVICE_MAPPING_REQUIRED');
        return $s;
    }
    private function mapping(string $gar, string $locationCode, array $scope): array
    {
        if (!preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/D', $gar) || ($scope['settlementId'] ?? '') !== $gar || !is_int($scope['locationVersion'] ?? null) || $scope['locationVersion'] < 1 || !preg_match('/^[a-f0-9]{64}$/D', $scope['contextKey'] ?? '') || !preg_match('/^(personal|organization:[1-9][0-9]*)$/D', $scope['context'] ?? '')) self::fail('DELIVERY_SCOPE_INVALID', 409);
        $map=$this->config['settlementMap'][$gar] ?? null;
        if (!is_array($map) || !is_string($map['locationCode'] ?? null) || $map['locationCode'] === '' || $locationCode !== $map['locationCode']) self::fail('DELIVERY_LOCATION_MAPPING_REQUIRED');
        return $map;
    }
    private function credential(string $provider, string $field): string
    {
        $v=$this->config[$provider][$field] ?? null;
        if (!is_string($v) || $v === '' || strlen($v)>4096 || preg_match('/[\x00-\x20\x7f]/', $v)) self::fail('DELIVERY_PROVIDER_CONFIG_REQUIRED');
        return $v;
    }
    private static function point($id, $name, $address, $lat, $lon): array
    {
        if (!is_string($id) || !preg_match('/^[A-Za-z0-9_.:-]{1,200}$/D', $id)) self::fail('DELIVERY_POINT_ID_INVALID');
        $name=self::text($name,500); $address=self::text($address,500);
        if ($name==='' || $address==='') self::fail('DELIVERY_POINT_ADDRESS_INVALID');
        $coords=self::coordinates($lat,$lon);
        return ['pointId'=>$id,'name'=>$name,'address'=>$address,'latitude'=>$coords[0],'longitude'=>$coords[1]];
    }
    private static function coordinates($lat,$lon): array
    {
        if (!is_numeric($lat)||!is_numeric($lon)||!is_finite((float)$lat)||!is_finite((float)$lon)||abs((float)$lat)>90||abs((float)$lon)>180||((float)$lat===0.0&&(float)$lon===0.0)) self::fail('DELIVERY_COORDINATES_REQUIRED');
        return [(float)$lat,(float)$lon];
    }
    private static function cacheKey(int $id,string $gar,array $scope): string { return hash('sha256',json_encode([$id,$gar,$scope['contextKey'],$scope['locationVersion'],$scope['payment']??''],JSON_THROW_ON_ERROR)); }
    private static function sameAddress(string $a,string $b): bool { return preg_replace('/\s+/u',' ',trim($a)) === preg_replace('/\s+/u',' ',trim($b)); }
    private static function serviceId($id): int { if (!(is_int($id)||(is_string($id)&&ctype_digit($id))) || (int)$id<1 || (int)$id>2147483647) self::fail('DELIVERY_SERVICE_MAPPING_REQUIRED'); return (int)$id; }
    private static function text($value,int $max): string { if (!is_string($value)||strlen($value)>$max*4||preg_match('/[\x00-\x1f\x7f<>]/',$value)||!preg_match('//u',$value)) self::fail('DELIVERY_FIELD_INVALID',422); return trim($value); }
    private static function fail(string $code,int $status=503): never { throw new RuntimeExceptionCode($code,$status); }

    private function request(string $method,string $url,array $headers=[],array $data=[],bool $form=false): array
    {
        $parts=parse_url($url); $allowed=['api.cdek.ru','b2b-authproxy.taxi.yandex.net','suggestions.dadata.ru'];
        if (!$parts || ($parts['scheme']??'')!=='https' || !in_array($parts['host']??'', $allowed, true) || isset($parts['user']) || isset($parts['pass']) || isset($parts['port']) || isset($parts['fragment'])) self::fail('DELIVERY_PROVIDER_URL_INVALID');
        $body=$method==='POST'?($form?http_build_query($data):json_encode($data,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)):null;
        $headers[]='Accept: application/json'; if ($body!==null) $headers[]='Content-Type: '.($form?'application/x-www-form-urlencoded':'application/json');
        if ($this->http) { $response=($this->http)($method,$url,$headers,$body); }
        else {
            if (!function_exists('curl_init')) self::fail('DELIVERY_HTTP_UNAVAILABLE');
            $response=['status'=>0,'body'=>'']; $ch=curl_init($url);
            if ($ch===false) self::fail('DELIVERY_HTTP_UNAVAILABLE');
            curl_setopt_array($ch,[CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_HTTPHEADER=>$headers,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_MAXREDIRS=>0,CURLOPT_TIMEOUT=>8,CURLOPT_CONNECTTIMEOUT=>3,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,CURLOPT_WRITEFUNCTION=>static function($handle,string $chunk)use(&$response):int{if(strlen($response['body'])+strlen($chunk)>4194304)return 0;$response['body'].=$chunk;return strlen($chunk);}]);
            if ($body!==null) curl_setopt($ch,CURLOPT_POSTFIELDS,$body);
            try { $ok=curl_exec($ch); $response['status']=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE); if ($ok===false) self::fail('DELIVERY_PROVIDER_UNAVAILABLE'); }
            finally { curl_close($ch); }
        }
        if (!is_array($response)||($response['status']??0)!==200||!is_string($response['body']??null)||strlen($response['body'])>4194304) self::fail('DELIVERY_PROVIDER_UNAVAILABLE');
        try { $decoded=json_decode($response['body'],true,32,JSON_THROW_ON_ERROR); } catch (\Throwable $e) { self::fail('DELIVERY_PROVIDER_RESPONSE_INVALID'); }
        if (!is_array($decoded)) self::fail('DELIVERY_PROVIDER_RESPONSE_INVALID');
        return $decoded;
    }
}
