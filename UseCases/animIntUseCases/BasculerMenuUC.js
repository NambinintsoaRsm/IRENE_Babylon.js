export class BasculerMenuUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer() {
        const etatMenu = this.etatApplication.animation.menuLateral;

        etatMenu.basculer();

        return {
            estOuvert: etatMenu.estOuvert,
            positionMenu: etatMenu.positionMenu,
            positionFleche: etatMenu.positionFleche
        };
    }
}