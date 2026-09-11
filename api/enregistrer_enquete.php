<?php
declare(strict_types=1);

/**
 * API d'enregistrement du questionnaire ANNA.
 *
 * - reçoit un JSON par POST ;
 * - enregistre une copie JSON et une copie CSV dans un dossier privé ;
 * - tente d'envoyer le CSV par e-mail si la fonction mail() du serveur est opérationnelle ;
 * - ne stocke volontairement ni adresse IP, ni user-agent, ni identité utilisateur ;
 * - garantit qu'un même identifiant de réponse ne crée pas plusieurs participations.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

const TAILLE_MAX_REQUETE = 262144; // 256 Kio, largement suffisant pour le questionnaire.
const EMAIL_DESTINATAIRE_DEFAUT = 'dominique.groux@u-picardie.fr';
const DOSSIER_REPONSES_DEFAUT = '/var/lib/anna/reponses_enquete';

function repondre(int $statut, array $donnees): never
{
    http_response_code($statut);
    echo json_encode($donnees, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function valeurEnv(string $nom, string $defaut = ''): string
{
    $valeur = getenv($nom);
    if ($valeur === false) {
        return $defaut;
    }

    $valeur = trim((string) $valeur);
    return $valeur !== '' ? $valeur : $defaut;
}

function booleenEnv(string $nom, bool $defaut): bool
{
    $valeur = getenv($nom);
    if ($valeur === false || trim((string) $valeur) === '') {
        return $defaut;
    }

    return filter_var($valeur, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $defaut;
}

function chargerConfiguration(): array
{
    $chemin = __DIR__ . DIRECTORY_SEPARATOR . 'config_enquete.php';
    if (!is_file($chemin)) {
        return [];
    }

    $configuration = require $chemin;
    return is_array($configuration) ? $configuration : [];
}

function nettoyerIdentifiant(string $identifiant): string
{
    $identifiant = preg_replace('/[^a-zA-Z0-9._-]/', '-', $identifiant) ?? '';
    $identifiant = trim($identifiant, '.-_');

    if ($identifiant === '') {
        $identifiant = bin2hex(random_bytes(16));
    }

    return substr($identifiant, 0, 100);
}

function aplatirReponses(mixed $valeur, string $prefixe = ''): array
{
    $resultat = [];

    if (is_array($valeur)) {
        foreach ($valeur as $cle => $sousValeur) {
            $nom = $prefixe === '' ? (string) $cle : $prefixe . ' > ' . (string) $cle;
            $resultat += aplatirReponses($sousValeur, $nom);
        }
        return $resultat;
    }

    if (is_bool($valeur)) {
        $texte = $valeur ? 'Oui' : 'Non';
    } elseif ($valeur === null) {
        $texte = '';
    } elseif (is_scalar($valeur)) {
        $texte = (string) $valeur;
    } else {
        $texte = json_encode($valeur, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '';
    }

    $resultat[$prefixe !== '' ? $prefixe : 'reponse'] = $texte;
    return $resultat;
}

function securiserCelluleCsv(string $valeur): string
{
    // Évite qu'un commentaire commençant par =, +, - ou @ soit interprété
    // comme une formule lors de l'ouverture du CSV dans un tableur.
    if ($valeur !== '' && preg_match('/^[=+\-@]/u', $valeur) === 1) {
        return "'" . $valeur;
    }

    return $valeur;
}

function creerCsv(array $donnees): string
{
    $flux = fopen('php://temp', 'r+');
    if ($flux === false) {
        throw new RuntimeException('Impossible de préparer le fichier CSV.');
    }

    // BOM UTF-8 pour une ouverture correcte dans Excel/LibreOffice.
    fwrite($flux, "\xEF\xBB\xBF");

    fputcsv($flux, ['Champ', 'Réponse'], ';');
    fputcsv($flux, ['Identifiant', securiserCelluleCsv((string) ($donnees['identifiant'] ?? ''))], ';');
    fputcsv($flux, ['Date UTC', securiserCelluleCsv((string) ($donnees['dateUTC'] ?? ''))], ';');
    fputcsv($flux, ['Version', securiserCelluleCsv((string) ($donnees['version'] ?? ''))], ';');
    fputcsv($flux, ['', ''], ';');

    $reponses = aplatirReponses($donnees['reponses'] ?? []);
    foreach ($reponses as $champ => $reponse) {
        fputcsv(
            $flux,
            [securiserCelluleCsv((string) $champ), securiserCelluleCsv((string) $reponse)],
            ';'
        );
    }

    rewind($flux);
    $csv = stream_get_contents($flux);
    fclose($flux);

    if ($csv === false) {
        throw new RuntimeException('Impossible de générer le contenu CSV.');
    }

    return $csv;
}

function enregistrerFichier(string $chemin, string $contenu): void
{
    $octets = file_put_contents($chemin, $contenu, LOCK_EX);
    if ($octets === false) {
        throw new RuntimeException('Impossible d’écrire le fichier de réponse sur le serveur.');
    }

    @chmod($chemin, 0640);
}

function lireJsonExistant(string $chemin): ?array
{
    if (!is_file($chemin)) {
        return null;
    }

    $contenu = file_get_contents($chemin);
    if ($contenu === false || trim($contenu) === '') {
        return null;
    }

    try {
        $donnees = json_decode($contenu, true, 64, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        return null;
    }

    return is_array($donnees) ? $donnees : null;
}

function enregistrementsEquivalents(array $existant, array $nouveau): bool
{
    return (string) ($existant['identifiant'] ?? '') === (string) ($nouveau['identifiant'] ?? '')
        && (string) ($existant['dateUTC'] ?? '') === (string) ($nouveau['dateUTC'] ?? '')
        && (string) ($existant['version'] ?? '') === (string) ($nouveau['version'] ?? '')
        && ($existant['reponses'] ?? []) == ($nouveau['reponses'] ?? []);
}

function envoyerCsvParMail(
    string $csv,
    string $nomFichier,
    string $identifiant,
    array $configurationEmail = []
): bool {
    $actifConfig = (bool) ($configurationEmail['actif'] ?? true);
    if (!booleenEnv('ANNA_SURVEY_EMAIL_ENABLED', $actifConfig)) {
        return false;
    }

    $destinataireConfig = trim((string) ($configurationEmail['destinataire'] ?? EMAIL_DESTINATAIRE_DEFAUT));
    if ($destinataireConfig === '') {
        $destinataireConfig = EMAIL_DESTINATAIRE_DEFAUT;
    }

    // Une variable d'environnement peut toujours surcharger le fichier de configuration.
    $destinataire = valeurEnv('ANNA_SURVEY_MAIL_TO', $destinataireConfig);
    if (!filter_var($destinataire, FILTER_VALIDATE_EMAIL)) {
        error_log('[ANNA enquête] Adresse e-mail destinataire invalide : ' . $destinataire);
        return false;
    }

    $nomHote = preg_replace('/[^a-zA-Z0-9.-]/', '', gethostname() ?: 'localhost') ?: 'localhost';
    $expediteurConfig = trim((string) ($configurationEmail['expediteur'] ?? ''));
    $expediteurDefaut = $expediteurConfig !== '' ? $expediteurConfig : 'anna@' . $nomHote;
    $expediteur = valeurEnv('ANNA_SURVEY_MAIL_FROM', $expediteurDefaut);
    if (!filter_var($expediteur, FILTER_VALIDATE_EMAIL)) {
        $expediteur = 'anna@localhost.localdomain';
    }

    $sujet = 'Réponse anonyme – Questionnaire ANNA – ' . $identifiant;
    $frontiere = 'anna_' . bin2hex(random_bytes(12));

    $entetes = [
        'From: ANNA <' . $expediteur . '>',
        'MIME-Version: 1.0',
        'Content-Type: multipart/mixed; boundary="' . $frontiere . '"'
    ];

    $message = '';
    $message .= '--' . $frontiere . "\r\n";
    $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $message .= "Une nouvelle réponse anonyme au questionnaire ANNA a été enregistrée.\r\n";
    $message .= "Identifiant : " . $identifiant . "\r\n";
    $message .= "Le fichier CSV est joint à ce message.\r\n\r\n";

    $message .= '--' . $frontiere . "\r\n";
    $message .= 'Content-Type: text/csv; charset=UTF-8; name="' . $nomFichier . '"' . "\r\n";
    $message .= "Content-Transfer-Encoding: base64\r\n";
    $message .= 'Content-Disposition: attachment; filename="' . $nomFichier . '"' . "\r\n\r\n";
    $message .= chunk_split(base64_encode($csv)) . "\r\n";
    $message .= '--' . $frontiere . "--\r\n";

    $envoye = @mail($destinataire, $sujet, $message, implode("\r\n", $entetes));

    if (!$envoye) {
        error_log(
            '[ANNA enquête] Le fichier CSV a été enregistré, mais l’envoi du mail vers '
            . $destinataire
            . ' a échoué.'
        );
    }

    return $envoye;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    repondre(405, [
        'ok' => false,
        'message' => 'Cette route accepte uniquement les requêtes POST.'
    ]);
}

$longueur = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
if ($longueur > TAILLE_MAX_REQUETE) {
    repondre(413, [
        'ok' => false,
        'message' => 'La réponse envoyée est trop volumineuse.'
    ]);
}

$typeContenu = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
if ($typeContenu !== '' && !str_contains($typeContenu, 'application/json')) {
    repondre(415, [
        'ok' => false,
        'message' => 'Le contenu doit être envoyé au format JSON.'
    ]);
}

$brut = file_get_contents('php://input');
if ($brut === false || trim($brut) === '') {
    repondre(400, [
        'ok' => false,
        'message' => 'Aucune réponse n’a été reçue.'
    ]);
}

if (strlen($brut) > TAILLE_MAX_REQUETE) {
    repondre(413, [
        'ok' => false,
        'message' => 'La réponse envoyée est trop volumineuse.'
    ]);
}

try {
    $donnees = json_decode($brut, true, 64, JSON_THROW_ON_ERROR);
} catch (JsonException) {
    repondre(400, [
        'ok' => false,
        'message' => 'Le JSON reçu est invalide.'
    ]);
}

if (!is_array($donnees) || !isset($donnees['reponses']) || !is_array($donnees['reponses'])) {
    repondre(422, [
        'ok' => false,
        'message' => 'La structure de la réponse est invalide.'
    ]);
}

$identifiant = nettoyerIdentifiant((string) ($donnees['identifiant'] ?? ''));
$dateUTC = (string) ($donnees['dateUTC'] ?? gmdate(DATE_ATOM));
$version = substr((string) ($donnees['version'] ?? 'ANNA-survey-1'), 0, 50);

// On reconstruit volontairement l'objet enregistré pour ne conserver que
// les champs prévus et éviter l'enregistrement de données supplémentaires.
$enregistrement = [
    'identifiant' => $identifiant,
    'dateUTC' => $dateUTC,
    'version' => $version,
    'anonyme' => true,
    'reponses' => $donnees['reponses']
];

$configuration = chargerConfiguration();
$dossierConfig = trim((string) ($configuration['dossier_reponses'] ?? DOSSIER_REPONSES_DEFAUT));
if ($dossierConfig === '') {
    $dossierConfig = DOSSIER_REPONSES_DEFAUT;
}
$dossier = valeurEnv('ANNA_SURVEY_DIR', $dossierConfig);
$configurationEmail = is_array($configuration['email'] ?? null) ? $configuration['email'] : [];

try {
    if (!is_dir($dossier) && !mkdir($dossier, 0750, true) && !is_dir($dossier)) {
        throw new RuntimeException('Impossible de créer le dossier privé des réponses.');
    }

    if (!is_writable($dossier)) {
        throw new RuntimeException('Le dossier privé des réponses n’est pas accessible en écriture.');
    }

    $base = 'enquete-' . $identifiant;
    $racine = rtrim($dossier, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $base;
    $cheminJson = $racine . '.json';
    $cheminCsv = $racine . '.csv';
    $cheminVerrou = $racine . '.lock';

    // Un verrou par identifiant évite que deux requêtes simultanées créent
    // deux écritures concurrentes pour la même participation.
    $verrou = fopen($cheminVerrou, 'c');
    if ($verrou === false || !flock($verrou, LOCK_EX)) {
        throw new RuntimeException('Impossible de verrouiller l’enregistrement de la réponse.');
    }

    try {
        $jsonAttendu = json_encode(
            $enregistrement,
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
        ) . PHP_EOL;
        $csvAttendu = creerCsv($enregistrement);

        $jsonExiste = is_file($cheminJson);
        $csvExiste = is_file($cheminCsv);
        $dejaEnregistree = false;
        $fichierRepare = false;

        if ($jsonExiste) {
            $existant = lireJsonExistant($cheminJson);
            if ($existant === null || !enregistrementsEquivalents($existant, $enregistrement)) {
                flock($verrou, LOCK_UN);
                fclose($verrou);
                @unlink($cheminVerrou);

                repondre(409, [
                    'ok' => false,
                    'message' => 'Cet identifiant existe déjà avec un contenu différent.'
                ]);
            }

            $dejaEnregistree = true;
        }

        if ($csvExiste) {
            $csvExistant = file_get_contents($cheminCsv);

            if ($jsonExiste) {
                // Le JSON correspondant est notre source de vérité : si le CSV a été
                // interrompu ou altéré, on le reconstruit au lieu de créer un doublon.
                if ($csvExistant === false || $csvExistant !== $csvAttendu) {
                    enregistrerFichier($cheminCsv, $csvAttendu);
                    $fichierRepare = true;
                }
            } elseif ($csvExistant === false || $csvExistant !== $csvAttendu) {
                flock($verrou, LOCK_UN);
                fclose($verrou);
                @unlink($cheminVerrou);

                repondre(409, [
                    'ok' => false,
                    'message' => 'Un fichier CSV existe déjà pour cet identifiant avec un contenu différent.'
                ]);
            }
        }

        if (!$jsonExiste) {
            enregistrerFichier($cheminJson, $jsonAttendu);
            if ($csvExiste) {
                $fichierRepare = true;
            }
        }

        if (!$csvExiste) {
            enregistrerFichier($cheminCsv, $csvAttendu);
            if ($jsonExiste) {
                $fichierRepare = true;
            }
        }

        // Si JSON + CSV existaient déjà et étaient cohérents, il s'agit simplement
        // d'une nouvelle tentative du même envoi. On ne crée aucun fichier et on
        // ne renvoie pas le même e-mail une seconde fois.
        if ($dejaEnregistree && $csvExiste && !$fichierRepare) {
            flock($verrou, LOCK_UN);
            fclose($verrou);
            @unlink($cheminVerrou);

            repondre(200, [
                'ok' => true,
                'sauvegardeServeur' => true,
                'emailEnvoye' => false,
                'dejaEnregistree' => true,
                'identifiant' => $identifiant,
                'message' => 'Cette réponse était déjà enregistrée sur le serveur. Aucun doublon n’a été créé.'
            ]);
        }

        $emailEnvoye = envoyerCsvParMail(
            $csvAttendu,
            basename($cheminCsv),
            $identifiant,
            $configurationEmail
        );

        flock($verrou, LOCK_UN);
        fclose($verrou);
        @unlink($cheminVerrou);

        repondre(200, [
            'ok' => true,
            'sauvegardeServeur' => true,
            'emailEnvoye' => $emailEnvoye,
            'dejaEnregistree' => $dejaEnregistree,
            'fichierRepare' => $fichierRepare,
            'identifiant' => $identifiant,
            'message' => $emailEnvoye
                ? 'Réponse enregistrée et envoyée par e-mail.'
                : 'Réponse enregistrée sur le serveur. L’envoi par e-mail n’est pas disponible ou n’a pas abouti.'
        ]);
    } finally {
        if (is_resource($verrou)) {
            @flock($verrou, LOCK_UN);
            @fclose($verrou);
        }
        @unlink($cheminVerrou);
    }
} catch (Throwable $erreur) {
    error_log('[ANNA enquête] ' . $erreur->getMessage());

    repondre(500, [
        'ok' => false,
        'message' => 'Le serveur n’a pas pu enregistrer la réponse.'
    ]);
}
