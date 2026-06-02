export class ParametresCamera {
    constructor({
                    alpha = Math.PI / 2,
                    beta = Math.PI / 2.5,
                    rayon = 5,
                    cible = { x: 0, y: 0, z: 0 },
                    zoom = 1,
                    wheelPrecision = 50,
                    estBloquee = false
                } = {}) {
        this.alpha = alpha;
        this.beta = beta;
        this.rayon = rayon;
        this.cible = cible;
        this.zoom = zoom;
        this.wheelPrecision = wheelPrecision;
        this.estBloquee = estBloquee;

        this.valider();
    }

    valider() {
        if (!Number.isFinite(this.alpha)) {
            throw new Error("Le paramètre alpha de la caméra est invalide.");
        }

        if (!Number.isFinite(this.beta)) {
            throw new Error("Le paramètre beta de la caméra est invalide.");
        }

        if (!Number.isFinite(this.rayon) || this.rayon <= 0) {
            throw new Error("Le rayon de la caméra est invalide.");
        }

        if (
            !this.cible ||
            !Number.isFinite(this.cible.x) ||
            !Number.isFinite(this.cible.y) ||
            !Number.isFinite(this.cible.z)
        ) {
            throw new Error("La cible de la caméra est invalide.");
        }

        if (!Number.isFinite(this.zoom) || this.zoom <= 0) {
            throw new Error("Le zoom de la caméra est invalide.");
        }

        if (!Number.isFinite(this.wheelPrecision) || this.wheelPrecision <= 0) {
            throw new Error("La précision de la molette de la caméra est invalide.");
        }

        if (typeof this.estBloquee !== "boolean") {
            throw new Error("L'état de blocage de la caméra doit être un booléen.");
        }
    }

    bloquer() {
        this.estBloquee = true;
    }

    debloquer() {
        this.estBloquee = false;
    }

    changerZoom(zoom) {
        if (!Number.isFinite(zoom) || zoom <= 0) {
            throw new Error("Le zoom de la caméra est invalide.");
        }

        this.zoom = zoom;
    }

    changerWheelPrecision(wheelPrecision) {
        if (!Number.isFinite(wheelPrecision) || wheelPrecision <= 0) {
            throw new Error("La précision de la molette de la caméra est invalide.");
        }

        this.wheelPrecision = wheelPrecision;
    }
}