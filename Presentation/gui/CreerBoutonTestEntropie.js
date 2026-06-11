export function creerBoutonTestEntropie(advancedTexture) {
    if (!advancedTexture) {
        return {
            panneau: null,
            bouton: null,
            texteResultat: null
        };
    }

    const panneau = new BABYLON.GUI.StackPanel("EntropieTestPanel");
    panneau.width = "260px";
    panneau.height = "120px";
    panneau.isVertical = true;
    panneau.spacing = 8;
    panneau.background = "#FFFFFFFF";
    panneau.color = "#000000FF";
    panneau.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    panneau.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    panneau.left = "-25px";
    panneau.top = "-25px";
    panneau.zIndex = 9999;
    panneau.isPointerBlocker = true;
    panneau.isHitTestVisible = true;

    const bouton = BABYLON.GUI.Button.CreateSimpleButton(
        "EntropieTestBtn",
        "Tester entropie"
    );

    bouton.width = "240px";
    bouton.height = "45px";
    bouton.background = "#FFFFFFFF";
    bouton.color = "#000000FF";
    bouton.thickness = 2;
    bouton.cornerRadius = 4;
    bouton.fontSize = "18px";
    bouton.zIndex = 10000;
    bouton.isPointerBlocker = true;
    bouton.isHitTestVisible = true;

    const texteResultat = new BABYLON.GUI.TextBlock("EntropieResultTxt");
    texteResultat.text = "Vue optimale : --";
    texteResultat.width = "240px";
    texteResultat.height = "45px";
    texteResultat.color = "#000000FF";
    texteResultat.background = "#F2F2F2FF";
    texteResultat.fontSize = "16px";
    texteResultat.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    texteResultat.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    texteResultat.zIndex = 10000;
    texteResultat.isVisible = true;
    texteResultat.isPointerBlocker = false;

    texteResultat.metadata = texteResultat.metadata || {};
    texteResultat.metadata.texteDynamique = true;

    panneau.addControl(bouton);
    panneau.addControl(texteResultat);

    advancedTexture.addControl(panneau);

    console.log("[Entropie GUI] Bouton créé", {
        panneau,
        bouton,
        texteResultat
    });

    return {
        panneau,
        bouton,
        texteResultat
    };
}