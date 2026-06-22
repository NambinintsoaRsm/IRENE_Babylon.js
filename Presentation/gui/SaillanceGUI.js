export function creerBoutonSaillanceFallback(advancedTexture) {
    if (!advancedTexture) {
        return { panneau: null, bouton: null, texteResultat: null };
    }

    const panneau = new BABYLON.GUI.StackPanel("SaillancePanel");
    panneau.width = "260px";
    panneau.height = "105px";
    panneau.isVertical = true;
    panneau.spacing = 8;
    panneau.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    panneau.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    panneau.left = "250px";
    panneau.top = "-20px";
    panneau.zIndex = 9000;
    panneau.isPointerBlocker = true;

    const bouton = BABYLON.GUI.Button.CreateSimpleButton("SaillanceBtn", "Tester saillance");
    bouton.width = "240px";
    bouton.height = "45px";
    bouton.background = "#FFFFFFFF";
    bouton.color = "#000000FF";
    bouton.thickness = 2;
    bouton.fontSize = "18px";
    bouton.isPointerBlocker = true;

    const texteResultat = new BABYLON.GUI.TextBlock("SaillanceTxt");
    texteResultat.text = "Vue saillance : --";
    texteResultat.width = "240px";
    texteResultat.height = "40px";
    texteResultat.background = "#FFFFFFFF";
    texteResultat.color = "#000000FF";
    texteResultat.fontSize = "16px";
    texteResultat.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    texteResultat.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    texteResultat.metadata = { texteDynamique: true };

    panneau.addControl(bouton);
    panneau.addControl(texteResultat);
    advancedTexture.addControl(panneau);

    return { panneau, bouton, texteResultat };
}
