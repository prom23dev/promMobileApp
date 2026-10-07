<?php
// Merge only into a private runtime config, never mobile/public config. Do not use archive credentials.
return ['payment'=>[
    'enabled'=>false,
    'environment'=>'sandbox',
    'apiKeyFile'=>'/absolute/private/prom23-runtime/new-yandex-key',
    'merchantId'=>'',
    'orderPrefix'=>'prom23-mobile',
    // Operator verifies the merchant agreement/configuration. This is not personal credit approval.
    'splitMerchantEnabled'=>false,
    // Requires a real reviewed receipt workflow for this direct API integration. No default VAT assumptions.
    'merchantReceiptsConfirmed'=>false,
    // Signed payment.status can synchronize only verified CAPTURED -> existing Sale payment.
    'reconcileEnabled'=>false,
    'paymentAllowedHosts'=>[],
    'returnAllowedHosts'=>[],
    'redirectUrls'=>['onSuccess'=>'','onAbort'=>'','onError'=>''],
    // No source cookies; sanitized text/tables only. Full PDF/stamp fidelity is a separate remaining adapter.
    'invoiceEnabled'=>false,
    'handoff'=>['url'=>'','allowedHosts'=>[]],
]];
