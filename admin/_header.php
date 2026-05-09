<?php
// admin/_header.php — Header compartilhado do painel
// Uso: $active_page = 'credenciados' (ou 'usuarios', 'meus-dados', '');
//      include __DIR__ . '/_header.php';
$active_page = $active_page ?? '';
?>
<header class="adm-header">
  <div class="adm-header-inner">
    <a href="index.php" class="adm-logo" aria-label="Allaser Admin">
      <img src="/assets/images/logo-allaser.webp" alt="Allaser" class="adm-logo__img">
      <span class="adm-logo__badge">Admin</span>
    </a>
    <nav class="adm-nav" aria-label="Navegação do admin">
      <a href="index.php" class="adm-nav-link<?= $active_page === 'credenciados' ? ' is-active' : '' ?>">Credenciados</a>
      <span class="adm-nav-link is-disabled" title="Em breve">Professores</span>
      <a href="usuarios.php" class="adm-nav-link<?= $active_page === 'usuarios' ? ' is-active' : '' ?>">Usuários</a>
    </nav>
    <div class="adm-userbox">
      <a href="meus-dados.php" class="adm-username<?= $active_page === 'meus-dados' ? ' is-active' : '' ?>" title="Meus dados">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span><?= h(current_user_name()) ?></span>
      </a>
      <a href="logout.php" class="adm-logout">Sair</a>
    </div>
  </div>
</header>
