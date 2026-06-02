export const PositionMenu = Object.freeze({
    GAUCHE: "gauche",
    DROITE: "droite"
});

export function estPositionMenuValide(position) {
    return Object.values(PositionMenu).includes(position);
}