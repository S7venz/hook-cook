// CodeNarc — ruleset pour Hook & Cook.
//
// Focus : bugs probables (priorité 1-2) + sécurité + imports / unused.
// Le style cosmétique (longueur de ligne, espaces, etc.) est volontairement
// relâché pour ne pas faire de bruit sur du code Grails idiomatique
// (signatures longues, GORM dynamic finders, closures imbriquées).
//
// Documentation des rulesets : https://codenarc.org/codenarc-rule-index.html

ruleset {
    description 'Règles CodeNarc — Hook & Cook backend Grails/Groovy'

    // ── Bugs probables ─────────────────────────────────────────────────
    // ConstantIfExpression, EmptyCatchBlock, EmptyClass, EqualsAndHashCode,
    // ExplicitGarbageCollection, ReturnFromFinallyBlock, ...
    ruleset('rulesets/basic.xml')

    // ── Gestion des exceptions ────────────────────────────────────────
    // CatchException, ThrowRuntimeException, ReturnNullFromCatchBlock, ...
    ruleset('rulesets/exceptions.xml') {
        // On utilise volontairement RuntimeException dans quelques services
        // (rate limit, validation) pour interrompre le flux sans exposer
        // de stack interne au client REST.
        exclude 'ThrowRuntimeException'
        exclude 'CatchException'
    }

    // ── Sécurité ───────────────────────────────────────────────────────
    // InsecureRandom (utilisation de java.util.Random pour des tokens),
    // FileCreateTempFile, JavaIoPackageAccess, NonFinalPublicField, ...
    ruleset('rulesets/security.xml') {
        // openhtmltopdf et le service d'upload utilisent légitimement
        // java.io.File / FileInputStream — pas une faille en soi.
        exclude 'JavaIoPackageAccess'
        // Les domain classes Grails ont des champs publics par design
        // (mapping GORM). Les marquer final casserait l'instanciation.
        exclude 'NonFinalPublicField'
    }

    // ── Imports ────────────────────────────────────────────────────────
    // DuplicateImport, UnnecessaryGroovyImport, UnusedImport
    ruleset('rulesets/imports.xml')

    // ── Code mort / inutilisé ──────────────────────────────────────────
    ruleset('rulesets/unused.xml') {
        // Trop bruyant sur les variables temporaires utilisées pour
        // débugger / clarifier. L'IDE les détecte déjà.
        exclude 'UnusedVariable'
    }

    // ── Logging ────────────────────────────────────────────────────────
    // LoggerForDifferentClass, MultipleLoggers, LoggingSwallowsStacktrace
    ruleset('rulesets/logging.xml') {
        // BootStrap et seed scripts utilisent println pour les rapports
        // de démarrage (visibles dans docker logs).
        exclude 'Println'
        exclude 'PrintStackTrace'
        exclude 'SystemOutPrint'
        exclude 'SystemErrPrint'
    }

    // ── Conventions de nommage ─────────────────────────────────────────
    // ClassName, MethodName, PackageName, VariableName, FieldName
    ruleset('rulesets/naming.xml') {
        exclude 'FactoryMethodName'  // GORM static finders triggerent
        exclude 'PropertyName'       // domain classes ont des propriétés mixtes
    }

    // ── Concurrence ────────────────────────────────────────────────────
    ruleset('rulesets/concurrency.xml')
}
