package backend

import grails.converters.JSON
import org.springframework.web.multipart.MultipartFile

import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption

class UploadController {

    static responseFormats = ['json']
    static allowedMethods = [upload: 'POST', serve: 'GET']

    AuthService authService

    private static final List<String> ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']
    private static final long MAX_BYTES = 8L * 1024 * 1024 // 8 MB

    private Path uploadDir() {
        Path dir = Paths.get(System.getProperty('user.dir'), 'uploads').toAbsolutePath()
        Files.createDirectories(dir)
        dir
    }

    def upload() {
        Map check = authService.userFromRequest(request)
        if (!check.user) {
            response.status = 401
            render([error: 'Authentification requise.'] as JSON)
            return
        }

        MultipartFile file = request.getFile('file')
        if (!file || file.empty) {
            response.status = 400
            render([error: 'Aucun fichier reçu (champ attendu : "file").'] as JSON)
            return
        }
        if (file.size > MAX_BYTES) {
            response.status = 413
            render([error: "Fichier trop lourd (max ${MAX_BYTES / 1024 / 1024} Mo)."] as JSON)
            return
        }
        String original = file.originalFilename ?: 'upload'
        String ext = (original.contains('.') ? original.substring(original.lastIndexOf('.') + 1) : 'bin').toLowerCase()
        if (!ALLOWED_EXT.contains(ext)) {
            response.status = 415
            render([error: "Extension non supportée. Autorisées : ${ALLOWED_EXT.join(', ')}"] as JSON)
            return
        }

        // Validation par magic bytes — évite qu'un .php renommé .jpg passe
        byte[] head = new byte[12]
        int read
        file.inputStream.withStream { stream ->
            read = stream.read(head)
        }
        if (read < 4 || !isKnownImageSignature(head, ext)) {
            response.status = 415
            render([error: 'Le contenu du fichier ne correspond pas à une image valide.'] as JSON)
            return
        }

        // UUID complet (128 bits) — impossible à brute-forcer
        String name = "${UUID.randomUUID().toString()}.${ext}"
        Path target = uploadDir().resolve(name)
        try {
            file.inputStream.withStream { stream ->
                Files.copy(stream, target, StandardCopyOption.REPLACE_EXISTING)
            }
        } catch (IOException e) {
            response.status = 500
            render([error: "Enregistrement impossible : ${e.message}"] as JSON)
            return
        }

        String baseUrl = "${request.scheme}://${request.serverName}:${request.serverPort}"
        String url = "${baseUrl}/api/uploads/${name}"
        response.status = 201
        render([url: url, filename: name, size: file.size] as JSON)
    }

    def serve() {
        String filename = params.filename
        if (!filename || filename.contains('/') || filename.contains('..')) {
            response.status = 400
            render([error: 'Nom de fichier invalide.'] as JSON)
            return
        }
        Path path = uploadDir().resolve(filename)
        if (!Files.exists(path)) {
            response.status = 404
            render([error: 'Fichier introuvable.'] as JSON)
            return
        }

        // Si ce fichier est référencé comme pièce justificative d'un permis,
        // l'accès exige une authentification + propriété (ou admin). Sinon
        // c'est un visuel produit/hero/espèce → accès public.
        Permit sensitive = Permit.createCriteria().get {
            or {
                ilike('idDocUrl', "%/${filename}")
                ilike('photoDocUrl', "%/${filename}")
            }
        }

        if (sensitive) {
            Map check = authService.userFromRequest(request)
            if (!check.user) {
                response.status = 401
                render([error: 'Authentification requise.'] as JSON)
                return
            }
            boolean isAdmin = check.user.role == 'ROLE_ADMIN' || check.role == 'ROLE_ADMIN'
            if (!isAdmin && sensitive.user.id != check.user.id) {
                response.status = 403
                render([error: 'Accès non autorisé.'] as JSON)
                return
            }
            // Pas de cache public pour les docs sensibles
            response.setHeader('Cache-Control', 'private, no-store')
        } else {
            response.setHeader('Cache-Control', 'public, max-age=31536000')
        }

        String contentType = Files.probeContentType(path) ?: 'application/octet-stream'
        response.contentType = contentType
        response.outputStream.withStream { out ->
            Files.copy(path, out)
            out.flush()
        }
    }

    /**
     * Validation de signature binaire (magic bytes). Rejette un fichier
     * dont le contenu ne commence pas par une en-tête d'image valide,
     * même si l'extension semble OK. Couvre JPEG, PNG, GIF, WebP, AVIF.
     */
    private static boolean isKnownImageSignature(byte[] h, String ext) {
        if (h.length < 4) return false
        // JPEG : FF D8 FF
        if (h[0] == (byte) 0xFF && h[1] == (byte) 0xD8 && h[2] == (byte) 0xFF) return true
        // PNG : 89 50 4E 47 0D 0A 1A 0A
        if (h[0] == (byte) 0x89 && h[1] == (byte) 0x50 && h[2] == (byte) 0x4E && h[3] == (byte) 0x47) return true
        // GIF : 47 49 46 38
        if (h[0] == (byte) 0x47 && h[1] == (byte) 0x49 && h[2] == (byte) 0x46 && h[3] == (byte) 0x38) return true
        // WebP : RIFF....WEBP
        if (h.length >= 12 &&
                h[0] == (byte) 0x52 && h[1] == (byte) 0x49 && h[2] == (byte) 0x46 && h[3] == (byte) 0x46 &&
                h[8] == (byte) 0x57 && h[9] == (byte) 0x45 && h[10] == (byte) 0x42 && h[11] == (byte) 0x50) return true
        // AVIF/HEIC/MP4 box ftyp (bytes 4-7)
        if (h.length >= 8 &&
                h[4] == (byte) 0x66 && h[5] == (byte) 0x74 && h[6] == (byte) 0x79 && h[7] == (byte) 0x70) return true
        return false
    }
}
