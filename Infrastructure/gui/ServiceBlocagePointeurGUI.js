/**
 * Bloque ou débloque l'interaction avec le modèle 3D
 * lorsque la souris entre ou sort de l'interface.
 */
export class ServiceBlocagePointeurGUI {
    brancherBlocage({
                        controle,
                        bloquerCameraUC,
                        debloquerCameraUC,
                        serviceCameraBabylon,
                        etatApplication
                    }) {
        if (!controle) {
            throw new Error("Contrôle GUI introuvable pour le blocage du pointeur.");
        }

        controle.onPointerEnterObservable.add(() => {
            const parametres = bloquerCameraUC.executer();

            if (etatApplication.camera.cameraBabylon) {
                serviceCameraBabylon.bloquer(etatApplication.camera.cameraBabylon);
            }

            return parametres;
        });

        controle.onPointerOutObservable.add(() => {
            const parametres = debloquerCameraUC.executer();

            if (etatApplication.camera.cameraBabylon) {
                serviceCameraBabylon.debloquer(
                    etatApplication.camera.cameraBabylon,
                    etatApplication.canvas
                );
            }

            return parametres;
        });
    }
}