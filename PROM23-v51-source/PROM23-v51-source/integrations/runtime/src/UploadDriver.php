<?php
declare(strict_types=1);
namespace Prom23\Runtime;

final class UploadDriver {
    private \PDO $db;
    private string $directory;
    public function __construct(private array $config) {
        $this->db=$config['pdo']; $this->directory=realpath($config['uploadDirectory'] ?? '') ?: '';
        if (!$this->directory || !is_dir($this->directory) || is_link($config['uploadDirectory']) || (fileperms($this->directory)&0077)) throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
        $this->db->exec('CREATE TABLE IF NOT EXISTS prom23_uploads(id TEXT PRIMARY KEY, scope TEXT, field TEXT, name TEXT, size INTEGER, offset INTEGER, expires INTEGER, token_hash TEXT UNIQUE, mime TEXT, status TEXT)');
    }
    private function scope(array $payload): string { return hash('sha256',json_encode([$payload['sessionKey'],$payload['context'],$payload['formId'],$payload['target']??[]],JSON_THROW_ON_ERROR)); }
    private function row(array $payload): array {
        if (!preg_match('/^[a-f0-9]{48}$/D',$payload['uploadId']??'')) throw new RuntimeExceptionCode('NOT_FOUND',404);
        $s=$this->db->prepare('SELECT * FROM prom23_uploads WHERE id=? AND scope=? AND expires>?'); $s->execute([$payload['uploadId'],$this->scope($payload),time()]);
        $row=$s->fetch(\PDO::FETCH_ASSOC); if (!$row) throw new RuntimeExceptionCode('NOT_FOUND',404); return $row;
    }
    private function rules(string $formId,string $field): array {
        $form=$this->config['formContracts'][$formId]??null; if (!$form) throw new RuntimeExceptionCode('NOT_FOUND',404);
        foreach ($form['fields']??[] as $f) if ($f['name']===$field && $f['type']==='file') return $f;
        foreach ($form['repeatedFields']??[] as $g) foreach ($g['fields'] as $f) {
            if ($f['type']==='file' && preg_match('/^'.preg_quote($g['name'],'/').':[A-Za-z0-9_-]{1,80}:'.preg_quote($f['name'],'/').'$/D',$field)) return $f;
        }
        throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
    }
    public function run(string $operation,array $payload,array $actor): array {
        if ($operation==='uploads.create') {
            $rules=$this->rules($payload['formId'],$payload['fieldName']??'');
            $name=$payload['name']??''; $size=$payload['size']??0;
            $extension=strtolower(pathinfo($name,PATHINFO_EXTENSION));
            if (!is_string($name)||strlen($name)>240||preg_match('/[\\\\\/\x00-\x1f]/',$name)||!is_int($size)||$size<1||$size>($rules['maxBytes']??20971520)||
                !in_array($extension,array_map(static fn($v)=>ltrim(strtolower($v),'.'),$rules['acceptedExtensions']??[]),true)) throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            $expired=$this->db->query('SELECT id FROM prom23_uploads WHERE expires<'.time())->fetchAll(\PDO::FETCH_COLUMN);
            foreach ($expired as $id) { @unlink($this->directory.'/'.$id.'.part'); $this->db->prepare('DELETE FROM prom23_uploads WHERE id=?')->execute([$id]); }
            $s=$this->db->prepare('SELECT count(*) FROM prom23_uploads WHERE scope=? AND field=?');$s->execute([$this->scope($payload),$payload['fieldName']]);
            $total=(int)$this->db->query('SELECT coalesce(sum(size),0) FROM prom23_uploads')->fetchColumn();
            if ((int)$s->fetchColumn()>=10 || $total+$size>($this->config['uploadStorageLimitBytes']??536870912)) throw new RuntimeExceptionCode('RATE_LIMITED',429);
            $id=bin2hex(random_bytes(24));$path=$this->directory.'/'.$id.'.part';$handle=fopen($path,'x+b');if (!$handle)throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');fclose($handle);chmod($path,0600);
            $this->db->prepare('INSERT INTO prom23_uploads VALUES(?,?,?,?,?,0,?,NULL,NULL,?)')->execute([$id,$this->scope($payload),$payload['fieldName'],$name,$size,time()+1800,'pending']);
            return ['uploadId'=>$id];
        }
        $row=$this->row($payload);$path=$this->directory.'/'.$row['id'].'.part';
        if ($operation==='uploads.delete') { @unlink($path);$this->db->prepare('DELETE FROM prom23_uploads WHERE id=?')->execute([$row['id']]);return ['deleted'=>true]; }
        if ($row['status']!=='pending') throw new RuntimeExceptionCode('IDEMPOTENCY_CONFLICT',409);
        if ($operation==='uploads.chunk') {
            $chunk=base64_decode($payload['base64']??'',true); $offset=$payload['offset']??-1;
            if ($chunk===false || !strlen($chunk) || strlen($chunk)>16384 || !is_int($offset) || $offset!==(int)$row['offset'] || $offset+strlen($chunk)>(int)$row['size']) throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            $handle=fopen($path,'r+b');if(!$handle||!flock($handle,LOCK_EX))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
            try { if(fstat($handle)['size']!==$offset)throw new RuntimeExceptionCode('IDEMPOTENCY_CONFLICT',409);fseek($handle,$offset);if(fwrite($handle,$chunk)!==strlen($chunk))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');fflush($handle); }
            finally {flock($handle,LOCK_UN);fclose($handle);}
            $offset+=strlen($chunk);$this->db->prepare('UPDATE prom23_uploads SET offset=? WHERE id=?')->execute([$offset,$row['id']]);return ['nextOffset'=>$offset];
        }
        if($operation!=='uploads.complete'||(int)$row['offset']!==(int)$row['size']||filesize($path)!==(int)$row['size'])throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        $mime=(new \finfo(FILEINFO_MIME_TYPE))->file($path);$ext=strtolower(pathinfo($row['name'],PATHINFO_EXTENSION));
        $types=['jpg'=>['image/jpeg'],'jpeg'=>['image/jpeg'],'png'=>['image/png'],'gif'=>['image/gif'],'webp'=>['image/webp'],'pdf'=>['application/pdf'],
            'txt'=>['text/plain'],'csv'=>['text/plain','text/csv'],'doc'=>['application/msword','application/x-ole-storage'],'xls'=>['application/vnd.ms-excel','application/x-ole-storage'],
            'docx'=>['application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/zip'],'xlsx'=>['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/zip'],
            'mp4'=>['video/mp4'],'avi'=>['video/x-msvideo'],'mov'=>['video/quicktime'],'wmv'=>['video/x-ms-wmv'],'flv'=>['video/x-flv'],'webm'=>['video/webm']];
        if(!in_array($mime,$types[$ext]??[],true))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        if(str_starts_with($mime,'image/')&&!getimagesize($path))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        if(in_array($ext,['docx','xlsx'],true)) {
            if(!class_exists(\ZipArchive::class))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
            $zip=new \ZipArchive();if($zip->open($path)!==true)throw new RuntimeExceptionCode('VALIDATION_ERROR',422);$expanded=0;
            try {if($zip->numFiles>1000||$zip->locateName('[Content_Types].xml')===false||$zip->locateName($ext==='docx'?'word/document.xml':'xl/workbook.xml')===false)throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
                for($i=0;$i<$zip->numFiles;$i++){ $entry=$zip->statIndex($i);$expanded+=$entry['size'];if($expanded>104857600||preg_match('#(^/|\.\./|vbaProject\.bin)#i',$entry['name']))throw new RuntimeExceptionCode('VALIDATION_ERROR',422); }
            } finally {$zip->close();}
        }
        if(str_starts_with($mime,'video/')) {
            $probe=$this->config['ffprobePath']??'';
            if(!$probe||!is_executable($probe))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
            $process=proc_open([$probe,'-v','quiet','-show_entries','format=duration','-of','json',$path],[1=>['pipe','w'],2=>['file','/dev/null','w']],$pipes);
            if(!is_resource($process))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
            stream_set_blocking($pipes[1],false);$output='';$deadline=microtime(true)+5;
            do{$output.=stream_get_contents($pipes[1],16384);$status=proc_get_status($process);if(strlen($output)>16384||microtime(true)>$deadline){proc_terminate($process,9);break;}if($status['running'])usleep(10000);}while($status['running']);
            fclose($pipes[1]);proc_close($process);$duration=json_decode($output,true)['format']['duration']??null;
            if(!is_numeric($duration)||!is_finite((float)$duration)||(float)$duration<=0||(float)$duration>60)throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        }
        $token=bin2hex(random_bytes(24));$this->db->prepare('UPDATE prom23_uploads SET status=?,token_hash=?,mime=? WHERE id=?')->execute(['verified',hash('sha256',$token),$mime,$row['id']]);
        return ['uploadToken'=>$token,'name'=>$row['name'],'size'=>(int)$row['size']];
    }
    public function resolve(array $payload,string $field,string $token): array {
        $s=$this->db->prepare('SELECT * FROM prom23_uploads WHERE token_hash=? AND scope=? AND field=? AND status=? AND expires>?');
        $s->execute([hash('sha256',$token),$this->scope($payload),$field,'verified',time()]);$row=$s->fetch(\PDO::FETCH_ASSOC);if(!$row)throw new RuntimeExceptionCode('FORBIDDEN',403);
        return ['tmp_name'=>$this->directory.'/'.$row['id'].'.part','name'=>$row['name'],'type'=>$row['mime'],'size'=>(int)$row['size'],'error'=>UPLOAD_ERR_OK];
    }
}
