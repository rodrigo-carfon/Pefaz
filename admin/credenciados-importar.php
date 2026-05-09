<?php
require_once __DIR__ . '/_auth.php';

$flash = consume_flash();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();

    $csv_content = '';
    if (!empty($_FILES['arquivo']['tmp_name']) && is_uploaded_file($_FILES['arquivo']['tmp_name'])) {
        $csv_content = file_get_contents($_FILES['arquivo']['tmp_name']);
    } elseif (!empty(trim($_POST['csv_text'] ?? ''))) {
        $csv_content = $_POST['csv_text'];
    }

    if ($csv_content === '') {
        set_flash('error', 'Faça upload de um arquivo CSV OU cole o conteúdo no campo de texto.');
        header('Location: credenciados-importar.php');
        exit;
    }

    // Remove BOM se vier de Excel salvo como UTF-8 BOM
    if (substr($csv_content, 0, 3) === "\xEF\xBB\xBF") {
        $csv_content = substr($csv_content, 3);
    }

    $lines = preg_split('/\r\n|\n|\r/', trim($csv_content));
    if (count($lines) < 2) {
        set_flash('error', 'CSV precisa ter ao menos a linha de cabeçalho e uma linha de dados.');
        header('Location: credenciados-importar.php');
        exit;
    }

    // Detecta separador olhando a primeira linha
    $first = $lines[0];
    $separator = substr_count($first, ';') > substr_count($first, ',') ? ';' : ',';

    $header = array_map('strtolower', array_map('trim', str_getcsv($first, $separator)));

    if (!in_array('nome', $header, true)) {
        set_flash('error', 'O CSV precisa ter uma coluna chamada "nome". Cabeçalho recebido: ' . implode(', ', $header));
        header('Location: credenciados-importar.php');
        exit;
    }

    // Faz parsing das linhas de dados
    $entries = [];
    $skipped_invalid = 0;
    for ($i = 1; $i < count($lines); $i++) {
        $line = $lines[$i];
        if (trim($line) === '') continue;
        $cols = str_getcsv($line, $separator);
        $row = [];
        foreach ($header as $idx => $h) {
            $row[$h] = isset($cols[$idx]) ? trim($cols[$idx]) : '';
        }
        if (empty($row['nome'])) {
            $skipped_invalid++;
            continue;
        }
        $entries[] = [
            'nome'          => $row['nome'] ?? '',
            'registro'      => $row['registro'] ?? '',
            'estado'        => strtoupper(substr(trim($row['estado'] ?? ''), 0, 2)),
            'cidade'        => $row['cidade'] ?? '',
            'especialidade' => $row['especialidade'] ?? '',
            'email'         => $row['email'] ?? '',
            'whatsapp'      => preg_replace('/\D/', '', $row['whatsapp'] ?? ''),
            'instagram'     => $row['instagram'] ?? '',
            'site'          => $row['site'] ?? '',
        ];
    }

    if (empty($entries)) {
        set_flash('error', 'Nenhuma linha válida encontrada (precisa ter "nome" preenchido em cada linha).');
        header('Location: credenciados-importar.php');
        exit;
    }

    // Mescla com os existentes, ignorando duplicatas (mesmo nome + registro)
    $existing = load_credenciados();
    $existing_keys = [];
    foreach ($existing as $e) {
        $key = mb_strtolower(trim($e['nome'] ?? '')) . '|' . trim($e['registro'] ?? '');
        $existing_keys[$key] = true;
    }

    $added = 0;
    $skipped_dup = 0;
    foreach ($entries as $entry) {
        $key = mb_strtolower(trim($entry['nome'])) . '|' . trim($entry['registro']);
        if (isset($existing_keys[$key])) {
            $skipped_dup++;
            continue;
        }
        $existing[] = $entry;
        $existing_keys[$key] = true;
        $added++;
    }

    save_credenciados($existing);

    $msg = "✓ Importação concluída: $added " . ($added === 1 ? 'adicionado' : 'adicionados');
    if ($skipped_dup > 0) {
        $msg .= ", $skipped_dup já existiam (ignorados)";
    }
    if ($skipped_invalid > 0) {
        $msg .= ", $skipped_invalid sem nome (ignorados)";
    }
    $msg .= '.';
    set_flash('success', $msg);
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Importar CSV — Allaser Admin</title>
<link rel="stylesheet" href="admin.css">
</head>
<body>

<?php $active_page = 'credenciados'; include __DIR__ . '/_header.php'; ?>

<main class="adm-main">

  <div class="adm-page-head">
    <div>
      <h1>Importar credenciados via CSV</h1>
      <p class="muted"><a href="index.php">← Voltar para a lista</a></p>
    </div>
  </div>

  <?php if ($flash): ?>
    <div class="adm-flash adm-flash--<?= h($flash['type']) ?>"><?= h($flash['msg']) ?></div>
  <?php endif; ?>

  <form method="post" enctype="multipart/form-data" class="adm-form">
    <input type="hidden" name="_csrf" value="<?= h(csrf_token()) ?>">

    <h2 style="font-family:'Outfit',sans-serif;font-size:1.05rem;margin-bottom:6px;color:var(--dark-800)">Formato esperado do CSV</h2>
    <p class="muted" style="margin-bottom:14px">A primeira linha precisa ser o cabeçalho com os nomes das colunas. Aceita separador <code>,</code> ou <code>;</code> (Excel BR usa ponto-e-vírgula).</p>

    <pre style="background:var(--gray-50);border:1px solid var(--gray-100);border-radius:8px;padding:12px 14px;font-size:0.78rem;color:var(--dark-700);overflow-x:auto;margin-bottom:24px;font-family:'SF Mono',Consolas,monospace;line-height:1.6">nome,registro,estado,cidade,especialidade,email,whatsapp,instagram,site
Maria Silva Exemplo,CRO 12345,SP,São Paulo,Odontologia,maria@exemplo.com,5511999998888,https://instagram.com/maria,https://maria.com
João Santos Exemplo,CRM 67890,RJ,Rio de Janeiro,Medicina,joao@exemplo.com,5521988887777,,</pre>

    <p class="muted" style="margin-bottom:18px;font-size:0.82rem">
      ✅ <strong>Apenas <code>nome</code> é obrigatório</strong>, todas as outras colunas podem ficar em branco.<br>
      ✅ <strong>Anti-duplicata</strong>: linhas com mesmo nome+registro de credenciados existentes são ignoradas automaticamente.<br>
      ✅ <strong>Backup automático</strong> do JSON é feito antes da importação (em <code>admin/backups/</code>).
    </p>

    <h2 style="font-family:'Outfit',sans-serif;font-size:1.05rem;margin-bottom:14px;margin-top:8px;color:var(--dark-800)">Opção 1 — Upload de arquivo</h2>
    <div class="adm-form-grid">
      <label class="adm-form-row adm-form-row--full">
        <span>Arquivo CSV (.csv)</span>
        <input name="arquivo" type="file" accept=".csv,text/csv" style="padding:8px 10px">
      </label>
    </div>

    <p style="text-align:center;color:var(--gray-300);margin:18px 0;font-size:0.78rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">— OU —</p>

    <h2 style="font-family:'Outfit',sans-serif;font-size:1.05rem;margin-bottom:14px;color:var(--dark-800)">Opção 2 — Colar conteúdo CSV</h2>
    <div class="adm-form-grid">
      <label class="adm-form-row adm-form-row--full">
        <span>Cole aqui o conteúdo CSV</span>
        <textarea name="csv_text" rows="10" placeholder="nome,registro,estado,cidade,especialidade,email,whatsapp,instagram,site&#10;Maria Silva,CRO 12345,SP,São Paulo,Odontologia,maria@exemplo.com,5511999998888,," style="padding:10px 14px;border:1.5px solid var(--gray-200);border-radius:8px;font-family:'SF Mono',Consolas,monospace;font-size:0.84rem;color:var(--dark-700);background:var(--white);outline:none;resize:vertical"></textarea>
      </label>
    </div>

    <div class="adm-form-actions">
      <a href="index.php" class="adm-btn adm-btn--ghost">Cancelar</a>
      <button type="submit" class="adm-btn adm-btn--primary">Importar credenciados</button>
    </div>
  </form>

</main>

</body>
</html>
