export const ThemeInterface = Object.freeze({
    BLANC: "blanc",
    GRIS_CLAIR: "gris-clair",
    GRIS_FONCE: "gris-fonce",
    NOIR: "noir"
});

export function estThemeInterfaceValide(theme) {
    return Object.values(ThemeInterface).includes(theme);
}