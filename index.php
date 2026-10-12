<?php
/**
 * Algunos hostings ejecutan index.php antes que index.html.
 * Redirige al sitio estático real (sin lógica extra).
 */
header('Location: /', true, 301);
exit;
