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
        if (!authService.isAdmin(request)) {
            response.status = 403
            render([error: 'Accès réservé aux administrateurs.'] as JSON)
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

        String name = "${System.currentTimeMillis()}-${UUID.randomUUID().toString().take(8)}.${ext}"
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
        String contentType = Files.probeContentType(path) ?: 'application/octet-stream'
        response.contentType = contentType
        response.setHeader('Cache-Control', 'public, max-age=31536000')
        response.outputStream.withStream { out ->
            Files.copy(path, out)
            out.flush()
        }
    }
}
