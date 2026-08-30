/* ==========================================
   TENDENCIA INMOBILIARIA - ALPINE.JS ANIMATED NAVBAR MODULE
   Reactive Mobile Drawer with Alpine x-transition & Scrolled State
   ========================================== */

import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';

export function initAnimatedNavbar() {
    if (!window.Alpine) {
        Alpine.plugin(collapse);
        window.Alpine = Alpine;
        Alpine.start();
    }
}
