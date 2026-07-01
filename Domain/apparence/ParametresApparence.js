export class ParametresApparence {
    constructor({
                    contraste = 1,
                    luminosite = 0,
                    saturation = 1,
                    nettete = 0,
                    textureActive = null,
                    textureMotifTaille = 0,
                    materiauActif = null,
                    fondScene = 0
                } = {}) {
        this.contraste = contraste;
        this.luminosite = luminosite;
        this.saturation = saturation;
        this.nettete = nettete;
        this.textureActive = textureActive;
        this.textureMotifTaille = textureMotifTaille;
        this.materiauActif = materiauActif;
        this.fondScene = fondScene;

        this.valider();
    }

    valider() {
        if (!Number.isFinite(this.contraste) || this.contraste < 0) {
            throw new Error("Le contraste est invalide.");
        }

        if (!Number.isFinite(this.luminosite)) {
            throw new Error("La luminosité est invalide.");
        }

        if (!Number.isFinite(this.saturation) || this.saturation < 0) {
            throw new Error("La saturation est invalide.");
        }

        if (!Number.isFinite(this.nettete) || this.nettete < 0) {
            throw new Error("La netteté est invalide.");
        }

        if (!Number.isFinite(this.textureMotifTaille)) {
            throw new Error("La taille du motif de texture est invalide.");
        }

        if (!Number.isFinite(this.fondScene) || this.fondScene < 0 || this.fondScene > 100) {
            throw new Error("Le fond de scène est invalide.");
        }
    }

    copierAvec(nouveauxParametres = {}) {
        return new ParametresApparence({
            contraste: nouveauxParametres.contraste ?? this.contraste,
            luminosite: nouveauxParametres.luminosite ?? this.luminosite,
            saturation: nouveauxParametres.saturation ?? this.saturation,
            nettete: nouveauxParametres.nettete ?? this.nettete,
            textureActive: nouveauxParametres.textureActive ?? this.textureActive,
            textureMotifTaille: nouveauxParametres.textureMotifTaille ?? this.textureMotifTaille,
            materiauActif: nouveauxParametres.materiauActif ?? this.materiauActif,
            fondScene: nouveauxParametres.fondScene ?? this.fondScene
        });
    }
}