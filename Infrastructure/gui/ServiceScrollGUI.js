/**
 * Gère les réglages techniques des zones de scroll GUI.
 *
 * Attention : le wheelPrecision d'un ScrollViewer n'est pas celui de la caméra.
 */
export class ServiceScrollGUI {
    appliquerPrecisionScroll(scrollViewer, precision) {
        if (!scrollViewer) {
            return;
        }

        if (!Number.isFinite(precision) || precision <= 0) {
            throw new Error("Précision de scroll invalide.");
        }

        scrollViewer.wheelPrecision = precision;
    }

    masquerBarreSiInutile(scrollViewer) {
        if (!scrollViewer) {
            return;
        }

        if ("barSize" in scrollViewer) {
            scrollViewer.barSize = scrollViewer.barSize ?? 10;
        }
    }

    remettreEnHaut(scrollViewer) {
        if (!scrollViewer) {
            return;
        }

        if ("verticalBar" in scrollViewer && scrollViewer.verticalBar) {
            scrollViewer.verticalBar.value = 0;
        }
    }
}