export class ParametresCamera {
    constructor({
                    alpha = Math.PI / 2,
                    beta = Math.PI / 2.5,
                    rayon = 5,
                    cible = { x: 0, y: 0, z: 0 },

                    zoom = 1,
                    wheelPrecision = 2,
                    sensibiliteRotation = 2000,

                    distanceMin = 0.0001,
                    distanceMax = 10,

                    estBloquee = false
                } = {}) {
        this.alpha = alpha;
        this.beta = beta;
        this.rayon = rayon;
        this.cible = cible;

        this.zoom = zoom;
        this.wheelPrecision = wheelPrecision;
        this.sensibiliteRotation = sensibiliteRotation;

        this.distanceMin = distanceMin;
        this.distanceMax = distanceMax;

        this.estBloquee = estBloquee;

        this.valider();
    }

    valider() {
        if (!Number.isFinite(this.alpha)) {
            throw new Error("Alpha caméra invalide.");
        }

        if (!Number.isFinite(this.beta)) {
            throw new Error("Beta caméra invalide.");
        }

        if (!Number.isFinite(this.rayon) || this.rayon <= 0) {
            throw new Error("Rayon caméra invalide.");
        }

        if (!this.cible || !Number.isFinite(this.cible.x) || !Number.isFinite(this.cible.y) || !Number.isFinite(this.cible.z)) {
            throw new Error("Cible caméra invalide.");
        }

        if (!Number.isFinite(this.zoom) || this.zoom <= 0) {
            throw new Error("Zoom caméra invalide.");
        }

        if (!Number.isFinite(this.wheelPrecision) || this.wheelPrecision <= 0) {
            throw new Error("Précision de molette invalide.");
        }

        if (!Number.isFinite(this.sensibiliteRotation) || this.sensibiliteRotation <= 0) {
            throw new Error("Sensibilité de rotation invalide.");
        }

        if (!Number.isFinite(this.distanceMin) || this.distanceMin <= 0) {
            throw new Error("Distance minimale caméra invalide.");
        }

        if (!Number.isFinite(this.distanceMax) || this.distanceMax <= 0) {
            throw new Error("Distance maximale caméra invalide.");
        }

        if (this.distanceMin >= this.distanceMax) {
            throw new Error("La distance minimale doit être inférieure à la distance maximale.");
        }

        if (this.rayon < this.distanceMin || this.rayon > this.distanceMax) {
            throw new Error("Le rayon caméra doit être compris entre la distance minimale et maximale.");
        }

        if (typeof this.estBloquee !== "boolean") {
            throw new Error("État de blocage caméra invalide.");
        }
    }

    copierAvec(nouveauxParametres = {}) {
        return new ParametresCamera({
            alpha: nouveauxParametres.alpha ?? this.alpha,
            beta: nouveauxParametres.beta ?? this.beta,
            rayon: nouveauxParametres.rayon ?? this.rayon,
            cible: nouveauxParametres.cible ?? this.cible,

            zoom: nouveauxParametres.zoom ?? this.zoom,
            wheelPrecision: nouveauxParametres.wheelPrecision ?? this.wheelPrecision,
            sensibiliteRotation: nouveauxParametres.sensibiliteRotation ?? this.sensibiliteRotation,

            distanceMin: nouveauxParametres.distanceMin ?? this.distanceMin,
            distanceMax: nouveauxParametres.distanceMax ?? this.distanceMax,

            estBloquee: nouveauxParametres.estBloquee ?? this.estBloquee
        });
    }

    bloquer() {
        this.estBloquee = true;
    }

    debloquer() {
        this.estBloquee = false;
    }

    changerZoom(zoom) {
        if (!Number.isFinite(zoom) || zoom <= 0) {
            throw new Error("Zoom caméra invalide.");
        }

        this.zoom = zoom;
    }

    changerWheelPrecision(wheelPrecision) {
        if (!Number.isFinite(wheelPrecision) || wheelPrecision <= 0) {
            throw new Error("Précision de molette invalide.");
        }

        this.wheelPrecision = wheelPrecision;
    }

    changerSensibiliteRotation(sensibiliteRotation) {
        if (!Number.isFinite(sensibiliteRotation) || sensibiliteRotation <= 0) {
            throw new Error("Sensibilité de rotation invalide.");
        }

        this.sensibiliteRotation = sensibiliteRotation;
    }

    changerDistanceMin(distanceMin) {
        if (!Number.isFinite(distanceMin) || distanceMin <= 0) {
            throw new Error("Distance minimale caméra invalide.");
        }

        if (distanceMin >= this.distanceMax) {
            throw new Error("La distance minimale doit être inférieure à la distance maximale.");
        }

        this.distanceMin = distanceMin;

        if (this.rayon < this.distanceMin) {
            this.rayon = this.distanceMin;
        }
    }

    changerDistanceMax(distanceMax) {
        if (!Number.isFinite(distanceMax) || distanceMax <= 0) {
            throw new Error("Distance maximale caméra invalide.");
        }

        if (distanceMax <= this.distanceMin) {
            throw new Error("La distance maximale doit être supérieure à la distance minimale.");
        }

        this.distanceMax = distanceMax;

        if (this.rayon > this.distanceMax) {
            this.rayon = this.distanceMax;
        }
    }

    changerRayon(rayon) {
        if (!Number.isFinite(rayon) || rayon <= 0) {
            throw new Error("Rayon caméra invalide.");
        }

        if (rayon < this.distanceMin || rayon > this.distanceMax) {
            throw new Error("Le rayon caméra doit être compris entre la distance minimale et maximale.");
        }

        this.rayon = rayon;
    }

    changerCible(cible) {
        if (!cible || !Number.isFinite(cible.x) || !Number.isFinite(cible.y) || !Number.isFinite(cible.z)) {
            throw new Error("Cible caméra invalide.");
        }

        this.cible = cible;
    }
}