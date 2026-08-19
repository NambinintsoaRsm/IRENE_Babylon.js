# Documentation – Configuration de l’envoi des réponses du questionnaire ANNA

## 1. Objectif

Le questionnaire de satisfaction intégré à ANNA enregistre les réponses côté serveur sous forme de fichiers JSON et CSV. Une fois l’enregistrement terminé, le fichier CSV peut être envoyé automatiquement par e-mail au destinataire défini dans la configuration de l’application.

Le code ANNA et le script PHP sont déjà prévus pour effectuer cet envoi. La partie qui dépend de l’environnement serveur est le transport du mail : PHP utilise la fonction `mail()`, qui s’appuie elle-même sur un service de messagerie installé et configuré sur le serveur Debian.

L’objectif de cette procédure est donc de configurer le serveur afin que PHP puisse transmettre les e-mails correctement.

## 2. Point important : ne pas utiliser des identifiants personnels sans validation

Sur une machine locale, il est possible de tester l’envoi avec son propre compte UPJV. En revanche, pour le serveur définitif, il est préférable de ne pas stocker les identifiants personnels d’un étudiant ou d’un membre de l’équipe.

Avant la mise en production, il faut donc demander aux responsables du serveur ou du laboratoire les informations nécessaires pour l’envoi SMTP.

Il faut leur demander soit :

- un compte technique dédié à ANNA ou au laboratoire ;
- des identifiants SMTP prévus pour les applications ;
- ou l’adresse d’un relais SMTP institutionnel autorisé à envoyer des mails depuis le serveur sans identifiants personnels.

Les informations à demander sont idéalement :

- l’adresse du serveur SMTP ;
- le port à utiliser ;
- le type de chiffrement demandé (STARTTLS/TLS) ;
- l’identifiant SMTP ;
- le mot de passe associé, si une authentification est nécessaire ;
- l’adresse d’expéditeur autorisée ;
- et, si disponible, la possibilité d’utiliser un relais SMTP basé sur l’adresse IP du serveur.

## 3. Configuration du destinataire dans ANNA

Le destinataire du questionnaire est configuré dans :

`api/config_enquete.php`

Exemple :

```php
'email' => [
    'actif' => true,
    'destinataire' => 'dominique.groux@u-picardie.fr',
    'expediteur' => '',
],
```

Pour changer le destinataire, il suffit de modifier :

```php
'destinataire' => 'dominique.groux@u-picardie.fr',
```

Aucune modification du questionnaire ou du JavaScript n’est nécessaire.

## 4. Préparation du serveur Debian/Apache

1. Vérifier que PHP est installé et que la fonction `mail()` existe :

```bash
php -v
php -r 'var_dump(function_exists("mail"));'
```

Le second test doit retourner :

```text
bool(true)
```

2. Vérifier la configuration utilisée par PHP :

```bash
php -i | grep sendmail_path
```

Une valeur courante est :

```text
/usr/sbin/sendmail -t -i
```

3. Vérifier si un programme compatible `sendmail` existe :

```bash
which sendmail
ls -l /usr/sbin/sendmail
```

Si aucun résultat n’est retourné, il faut installer et configurer un transport de messagerie.

4. Installer `msmtp` et son interface compatible `sendmail` si cette solution est retenue :

```bash
sudo apt update
sudo apt install msmtp msmtp-mta
```

5. Créer la configuration SMTP système, généralement dans :

```text
/etc/msmtprc
```

Exemple de structure :

```text
defaults
auth on
tls on
tls_starttls on
tls_trust_file /etc/ssl/certs/ca-certificates.crt

account anna
host SERVEUR_SMTP_FOURNI_PAR_LES_RESPONSABLES
port PORT_FOURNI

from ADRESSE_EXPEDITEUR_AUTORISEE
user IDENTIFIANT_SMTP_FOURNI
password MOT_DE_PASSE_FOURNI

account default : anna
```

Les valeurs doivent être celles fournies par les responsables du laboratoire ou du serveur.

Si un relais SMTP sans authentification est fourni, les lignes `user` et `password` ne sont pas nécessaires.

6. Protéger le fichier de configuration :

```bash
sudo chown root:www-data /etc/msmtprc
sudo chmod 640 /etc/msmtprc
```

Cela permet à Apache/PHP de lire la configuration sans rendre les identifiants accessibles aux autres utilisateurs.

7. Tester l’envoi avec l’utilisateur Apache :

```bash
echo -e "Subject: Test ANNA\n\nTest d'envoi depuis le serveur." \
| sudo -u www-data msmtp VOTRE_ADRESSE_DE_TEST
```

Il est préférable d’utiliser d’abord sa propre adresse pour les tests, puis de passer à l’adresse définitive lorsque le fonctionnement est validé.

8. Tester ensuite PHP :

```bash
php -r 'var_dump(mail(
    "VOTRE_ADRESSE_DE_TEST",
    "Test PHP ANNA",
    "Test depuis PHP"
));'
```

Si la fonction retourne :

```text
bool(true)
```

et que le mail est reçu, le transport est opérationnel.

## 5. Test depuis ANNA

Une fois le transport SMTP configuré, lancer ANNA depuis le serveur puis remplir le questionnaire.

Après l’envoi, le serveur doit :

- créer le fichier JSON ;
- créer le fichier CSV ;
- envoyer le CSV par e-mail ;
- retourner une réponse avec `emailEnvoye: true`.

En cas d’échec du mail, les fichiers JSON et CSV restent sauvegardés. Les réponses ne sont donc pas perdues.

## 6. Cas du serveur sans identifiants personnels

La solution préférable pour la mise en production est :

```text
ANNA
   ↓
PHP / mail()
   ↓
service mail du serveur
   ↓
relais SMTP institutionnel
   ↓
destinataire
```

Dans ce cas, ANNA ne contient aucun mot de passe SMTP.

Il faut demander aux responsables si le serveur peut utiliser :

- un relais SMTP autorisé par l’adresse IP du serveur ;
- ou un compte technique dédié.

Cette solution est plus adaptée qu’un compte étudiant personnel pour un service destiné à rester en production.

## 7. Résumé

Le destinataire se règle dans `api/config_enquete.php`.

Le code ANNA ne doit pas contenir les identifiants SMTP.

Les paramètres SMTP doivent être configurés au niveau du serveur.

Avant la mise en production, il faut demander aux responsables du laboratoire ou du serveur les identifiants SMTP, un compte technique, ou l’accès à un relais institutionnel.

Une fois ces informations obtenues, il suffit de configurer le transport mail du serveur puis de vérifier l’envoi avec l’utilisateur `www-data` et avec PHP.
