/**
 * Fonctions GLSL communes au contour couleur, au highlight couleur et à la loupe.
 *
 * Le shader appelant doit déclarer avant ce bloc :
 *     vec3 getColorPerceptual(vec2 uv)
 *
 * Cette lecture doit renvoyer une couleur sRGB comprise entre 0 et 1.
 */
export const FONCTIONS_GRADIENT_COULEUR_PERCEPTUEL_GLSL = `
        vec3 srgbVersLineairePerceptuel(vec3 couleur) {
            vec3 basse = couleur / 12.92;
            vec3 haute = pow((couleur + vec3(0.055)) / 1.055, vec3(2.4));
            return mix(basse, haute, step(vec3(0.04045), couleur));
        }

        vec3 rgbLineaireVersOklabPerceptuel(vec3 couleur) {
            float l = 0.4122214708 * couleur.r + 0.5363325363 * couleur.g + 0.0514459929 * couleur.b;
            float m = 0.2119034982 * couleur.r + 0.6806995451 * couleur.g + 0.1073969566 * couleur.b;
            float s = 0.0883024619 * couleur.r + 0.2817188376 * couleur.g + 0.6299787005 * couleur.b;

            float lRacine = pow(max(l, 0.0), 1.0 / 3.0);
            float mRacine = pow(max(m, 0.0), 1.0 / 3.0);
            float sRacine = pow(max(s, 0.0), 1.0 / 3.0);

            return vec3(
                0.2104542553 * lRacine + 0.7936177850 * mRacine - 0.0040720468 * sRacine,
                1.9779984951 * lRacine - 2.4285922050 * mRacine + 0.4505937099 * sRacine,
                0.0259040371 * lRacine + 0.7827717662 * mRacine - 0.8086757660 * sRacine
            );
        }

        vec3 lireOklabPerceptuel(vec2 uv) {
            vec3 srgb = clamp(getColorPerceptual(clamp(uv, vec2(0.001), vec2(0.999))), 0.0, 1.0);
            return rgbLineaireVersOklabPerceptuel(srgbVersLineairePerceptuel(srgb));
        }

        float distanceOklabPondereePerceptuelle(
            vec3 couleurA,
            vec3 couleurB,
            float poidsLuminance,
            float poidsChromatique
        ) {
            vec3 difference = couleurA - couleurB;
            float energieLuminance = difference.x * difference.x;
            float energieChromatique = difference.y * difference.y + difference.z * difference.z;

            return sqrt(
                max(0.0, poidsLuminance) * energieLuminance +
                max(0.0, poidsChromatique) * energieChromatique
            );
        }

        vec2 normaleDirectionCouleurPerceptuelle(float direction) {
            // Huit directions espacées de 22,5 degrés. Cette quantification plus fine
            // évite que les contours obliques disparaissent quand le modèle tourne.
            if (direction < 0.5) return vec2( 1.00000000,  0.00000000);
            if (direction < 1.5) return vec2( 0.92387953,  0.38268343);
            if (direction < 2.5) return vec2( 0.70710678,  0.70710678);
            if (direction < 3.5) return vec2( 0.38268343,  0.92387953);
            if (direction < 4.5) return vec2( 0.00000000,  1.00000000);
            if (direction < 5.5) return vec2(-0.38268343,  0.92387953);
            if (direction < 6.5) return vec2(-0.70710678,  0.70710678);
            return vec2(-0.92387953,  0.38268343);
        }

        vec2 tangenteDirectionCouleurPerceptuelle(float direction) {
            vec2 normale = normaleDirectionCouleurPerceptuelle(direction);
            return vec2(-normale.y, normale.x);
        }

        float reponsePaireCouleurPerceptuelle(
            vec2 uv,
            vec2 decalage,
            float poidsLuminance,
            float poidsChromatique
        ) {
            vec3 couleurA = lireOklabPerceptuel(uv - decalage);
            vec3 couleurB = lireOklabPerceptuel(uv + decalage);

            return distanceOklabPondereePerceptuelle(
                couleurA,
                couleurB,
                poidsLuminance,
                poidsChromatique
            );
        }

        float reponseDirectionCouleurPerceptuelle(
            vec2 uv,
            vec2 texel,
            float direction,
            float rayonEchantillonnage,
            float poidsLuminance,
            float poidsChromatique
        ) {
            vec2 normale = normaleDirectionCouleurPerceptuelle(direction);
            return reponsePaireCouleurPerceptuelle(
                uv,
                texel * normale * rayonEchantillonnage,
                poidsLuminance,
                poidsChromatique
            );
        }

        float directionDominanteCouleurPerceptuelle(
            vec2 uv,
            vec2 texel,
            float rayonEchantillonnage,
            float poidsLuminance,
            float poidsChromatique
        ) {
            float direction = 0.0;
            float maximum = reponseDirectionCouleurPerceptuelle(
                uv, texel, 0.0, rayonEchantillonnage, poidsLuminance, poidsChromatique
            );

            float reponse1 = reponseDirectionCouleurPerceptuelle(uv, texel, 1.0, rayonEchantillonnage, poidsLuminance, poidsChromatique);
            if (reponse1 > maximum) { maximum = reponse1; direction = 1.0; }

            float reponse2 = reponseDirectionCouleurPerceptuelle(uv, texel, 2.0, rayonEchantillonnage, poidsLuminance, poidsChromatique);
            if (reponse2 > maximum) { maximum = reponse2; direction = 2.0; }

            float reponse3 = reponseDirectionCouleurPerceptuelle(uv, texel, 3.0, rayonEchantillonnage, poidsLuminance, poidsChromatique);
            if (reponse3 > maximum) { maximum = reponse3; direction = 3.0; }

            float reponse4 = reponseDirectionCouleurPerceptuelle(uv, texel, 4.0, rayonEchantillonnage, poidsLuminance, poidsChromatique);
            if (reponse4 > maximum) { maximum = reponse4; direction = 4.0; }

            float reponse5 = reponseDirectionCouleurPerceptuelle(uv, texel, 5.0, rayonEchantillonnage, poidsLuminance, poidsChromatique);
            if (reponse5 > maximum) { maximum = reponse5; direction = 5.0; }

            float reponse6 = reponseDirectionCouleurPerceptuelle(uv, texel, 6.0, rayonEchantillonnage, poidsLuminance, poidsChromatique);
            if (reponse6 > maximum) { maximum = reponse6; direction = 6.0; }

            float reponse7 = reponseDirectionCouleurPerceptuelle(uv, texel, 7.0, rayonEchantillonnage, poidsLuminance, poidsChromatique);
            if (reponse7 > maximum) { direction = 7.0; }

            return direction;
        }

        float masqueSeuilFaibleCouleurPerceptuelle(
            float reponse,
            float seuilFaible,
            float lissageBas,
            float lissageHaut
        ) {
            return smoothstep(
                seuilFaible * lissageBas,
                seuilFaible * lissageHaut,
                reponse
            );
        }

        float masqueSeuilFortCouleurPerceptuelle(
            float reponse,
            float seuilFort,
            float lissageBas,
            float lissageHaut
        ) {
            return smoothstep(
                seuilFort * lissageBas,
                seuilFort * lissageHaut,
                reponse
            );
        }

        void accumulerSupportCouleurPerceptuelle(
            vec2 uv,
            vec2 texel,
            vec2 tangente,
            float distanceChaine,
            float rayonRecherche,
            float direction,
            float rayonEchantillonnage,
            float seuilFaible,
            float seuilFort,
            float lissageBas,
            float lissageHaut,
            float poidsLuminance,
            float poidsChromatique,
            inout float nombreEchantillons,
            inout float nombreSupports,
            inout float supportsCotePositif,
            inout float supportsCoteNegatif,
            inout float presenceForte
        ) {
            if (abs(distanceChaine) > rayonRecherche + 0.01) {
                return;
            }

            vec2 uvEchantillon = uv + texel * tangente * distanceChaine;
            float reponse = reponseDirectionCouleurPerceptuelle(
                uvEchantillon,
                texel,
                direction,
                rayonEchantillonnage,
                poidsLuminance,
                poidsChromatique
            );

            float support = step(
                0.5,
                masqueSeuilFaibleCouleurPerceptuelle(
                    reponse,
                    seuilFaible,
                    lissageBas,
                    lissageHaut
                )
            );

            float fort = masqueSeuilFortCouleurPerceptuelle(
                reponse,
                seuilFort,
                lissageBas,
                lissageHaut
            );

            nombreEchantillons += 1.0;
            nombreSupports += support;
            if (distanceChaine > 0.0) supportsCotePositif += support;
            if (distanceChaine < 0.0) supportsCoteNegatif += support;
            presenceForte = max(presenceForte, fort);
        }

        float masqueChaineCouleurPerceptuelle(
            vec2 uv,
            vec2 texel,
            float rayonEchantillonnage,
            float seuilFaible,
            float seuilFort,
            float lissageBas,
            float lissageHaut,
            float poidsLuminance,
            float poidsChromatique,
            float rayonRecherche,
            float supportsMin,
            float supportsMinParCote,
            float trousMax,
            float multiplicateurTresFort,
            float reductionSupportsTresFort,
            float reductionSupportsParCoteTresFort,
            float validationBruitActive,
            float rayonValidationBruit,
            float forceValidationBruitMin,
            float continuiteActive,
            float continuiteForceMinPont,
            float continuiteSupportsMinPont,
            float continuiteSupportsMinParCotePont,
            float continuiteTrousMaxPont,
            float puissanceMasque
        ) {
            float direction = directionDominanteCouleurPerceptuelle(
                uv,
                texel,
                rayonEchantillonnage,
                poidsLuminance,
                poidsChromatique
            );

            float reponseCentre = reponseDirectionCouleurPerceptuelle(
                uv,
                texel,
                direction,
                rayonEchantillonnage,
                poidsLuminance,
                poidsChromatique
            );

            float validationBruit = 1.0;
            if (validationBruitActive > 0.5) {
                float rayonLarge = rayonEchantillonnage * max(1.05, rayonValidationBruit);
                float reponseLarge = reponseDirectionCouleurPerceptuelle(
                    uv,
                    texel,
                    direction,
                    rayonLarge,
                    poidsLuminance,
                    poidsChromatique
                );

                float ratioLargeLocal = reponseLarge / max(reponseCentre, 0.0001);
                float validationRatio = smoothstep(
                    forceValidationBruitMin * 0.72,
                    forceValidationBruitMin,
                    ratioLargeLocal
                );
                float validationForce = masqueSeuilFaibleCouleurPerceptuelle(
                    reponseLarge,
                    seuilFaible * 0.78,
                    lissageBas,
                    lissageHaut
                );

                validationBruit = clamp(validationRatio * validationForce, 0.0, 1.0);
            }

            float masqueCentre = masqueSeuilFaibleCouleurPerceptuelle(
                reponseCentre,
                seuilFaible,
                lissageBas,
                lissageHaut
            );

            // Fermeture directionnelle des petites coupures : on autorise un pixel
            // faiblement détecté à devenir un pont uniquement s'il est entouré
            // par une chaîne cohérente. Cela reconnecte les bases interrompues
            // sans abaisser les seuils globaux du contour couleur.
            float masquePontCentre = 0.0;
            if (continuiteActive > 0.5) {
                masquePontCentre = masqueSeuilFaibleCouleurPerceptuelle(
                    reponseCentre,
                    max(0.000001, continuiteForceMinPont),
                    lissageBas,
                    lissageHaut
                );
            }

            float masqueCentreOuPont = max(masqueCentre, masquePontCentre * continuiteActive);
            if (masqueCentreOuPont <= 0.001) {
                return 0.0;
            }

            vec2 tangente = tangenteDirectionCouleurPerceptuelle(direction);
            float rayon = clamp(floor(rayonRecherche + 0.5), 1.0, 6.0);

            float nombreEchantillons = 1.0;
            float nombreSupports = step(0.5, masqueCentre);
            float supportsCotePositif = 0.0;
            float supportsCoteNegatif = 0.0;
            float presenceForte = masqueSeuilFortCouleurPerceptuelle(
                reponseCentre,
                seuilFort,
                lissageBas,
                lissageHaut
            );

            accumulerSupportCouleurPerceptuelle(uv, texel, tangente,  1.0, rayon, direction, rayonEchantillonnage, seuilFaible, seuilFort, lissageBas, lissageHaut, poidsLuminance, poidsChromatique, nombreEchantillons, nombreSupports, supportsCotePositif, supportsCoteNegatif, presenceForte);
            accumulerSupportCouleurPerceptuelle(uv, texel, tangente, -1.0, rayon, direction, rayonEchantillonnage, seuilFaible, seuilFort, lissageBas, lissageHaut, poidsLuminance, poidsChromatique, nombreEchantillons, nombreSupports, supportsCotePositif, supportsCoteNegatif, presenceForte);
            accumulerSupportCouleurPerceptuelle(uv, texel, tangente,  2.0, rayon, direction, rayonEchantillonnage, seuilFaible, seuilFort, lissageBas, lissageHaut, poidsLuminance, poidsChromatique, nombreEchantillons, nombreSupports, supportsCotePositif, supportsCoteNegatif, presenceForte);
            accumulerSupportCouleurPerceptuelle(uv, texel, tangente, -2.0, rayon, direction, rayonEchantillonnage, seuilFaible, seuilFort, lissageBas, lissageHaut, poidsLuminance, poidsChromatique, nombreEchantillons, nombreSupports, supportsCotePositif, supportsCoteNegatif, presenceForte);
            accumulerSupportCouleurPerceptuelle(uv, texel, tangente,  3.0, rayon, direction, rayonEchantillonnage, seuilFaible, seuilFort, lissageBas, lissageHaut, poidsLuminance, poidsChromatique, nombreEchantillons, nombreSupports, supportsCotePositif, supportsCoteNegatif, presenceForte);
            accumulerSupportCouleurPerceptuelle(uv, texel, tangente, -3.0, rayon, direction, rayonEchantillonnage, seuilFaible, seuilFort, lissageBas, lissageHaut, poidsLuminance, poidsChromatique, nombreEchantillons, nombreSupports, supportsCotePositif, supportsCoteNegatif, presenceForte);
            accumulerSupportCouleurPerceptuelle(uv, texel, tangente,  4.0, rayon, direction, rayonEchantillonnage, seuilFaible, seuilFort, lissageBas, lissageHaut, poidsLuminance, poidsChromatique, nombreEchantillons, nombreSupports, supportsCotePositif, supportsCoteNegatif, presenceForte);
            accumulerSupportCouleurPerceptuelle(uv, texel, tangente, -4.0, rayon, direction, rayonEchantillonnage, seuilFaible, seuilFort, lissageBas, lissageHaut, poidsLuminance, poidsChromatique, nombreEchantillons, nombreSupports, supportsCotePositif, supportsCoteNegatif, presenceForte);
            accumulerSupportCouleurPerceptuelle(uv, texel, tangente,  5.0, rayon, direction, rayonEchantillonnage, seuilFaible, seuilFort, lissageBas, lissageHaut, poidsLuminance, poidsChromatique, nombreEchantillons, nombreSupports, supportsCotePositif, supportsCoteNegatif, presenceForte);
            accumulerSupportCouleurPerceptuelle(uv, texel, tangente, -5.0, rayon, direction, rayonEchantillonnage, seuilFaible, seuilFort, lissageBas, lissageHaut, poidsLuminance, poidsChromatique, nombreEchantillons, nombreSupports, supportsCotePositif, supportsCoteNegatif, presenceForte);
            accumulerSupportCouleurPerceptuelle(uv, texel, tangente,  6.0, rayon, direction, rayonEchantillonnage, seuilFaible, seuilFort, lissageBas, lissageHaut, poidsLuminance, poidsChromatique, nombreEchantillons, nombreSupports, supportsCotePositif, supportsCoteNegatif, presenceForte);
            accumulerSupportCouleurPerceptuelle(uv, texel, tangente, -6.0, rayon, direction, rayonEchantillonnage, seuilFaible, seuilFort, lissageBas, lissageHaut, poidsLuminance, poidsChromatique, nombreEchantillons, nombreSupports, supportsCotePositif, supportsCoteNegatif, presenceForte);

            float nombreTrous = max(0.0, nombreEchantillons - nombreSupports);

            float tresFort = smoothstep(
                seuilFort * max(1.01, multiplicateurTresFort) * lissageBas,
                seuilFort * max(1.01, multiplicateurTresFort) * lissageHaut,
                reponseCentre
            );

            float supportsMinEffectif = max(
                1.0,
                supportsMin - tresFort * max(0.0, reductionSupportsTresFort)
            );
            float supportsCoteEffectif = max(
                0.0,
                supportsMinParCote - tresFort * max(0.0, reductionSupportsParCoteTresFort)
            );

            float utilisePont = continuiteActive
                * step(masqueCentre, 0.5)
                * step(0.01, masquePontCentre);
            supportsMinEffectif = mix(
                supportsMinEffectif,
                min(supportsMinEffectif, max(1.0, continuiteSupportsMinPont)),
                utilisePont
            );
            supportsCoteEffectif = mix(
                supportsCoteEffectif,
                min(supportsCoteEffectif, max(0.0, continuiteSupportsMinParCotePont)),
                utilisePont
            );
            float trousMaxEffectif = mix(
                trousMax,
                max(trousMax, continuiteTrousMaxPont),
                utilisePont
            );

            float supportAccepte = smoothstep(
                max(0.0, supportsMinEffectif - 0.5),
                supportsMinEffectif + 0.5,
                nombreSupports
            );

            float cotePositifAccepte = 1.0;
            float coteNegatifAccepte = 1.0;
            if (supportsCoteEffectif > 0.01) {
                cotePositifAccepte = smoothstep(
                    max(0.0, supportsCoteEffectif - 0.5),
                    supportsCoteEffectif + 0.5,
                    supportsCotePositif
                );
                coteNegatifAccepte = smoothstep(
                    max(0.0, supportsCoteEffectif - 0.5),
                    supportsCoteEffectif + 0.5,
                    supportsCoteNegatif
                );
            }

            float trousAcceptes = 1.0 - step(trousMaxEffectif + 0.5, nombreTrous);
            float ancreForte = smoothstep(0.08, 0.60, presenceForte);
            float masque = masqueCentreOuPont
                * supportAccepte
                * cotePositifAccepte
                * coteNegatifAccepte
                * trousAcceptes
                * ancreForte
                * validationBruit;

            return pow(clamp(masque, 0.0, 1.0), max(0.05, puissanceMasque));
        }
`;
