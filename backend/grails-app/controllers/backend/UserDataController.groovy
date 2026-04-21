package backend

import grails.converters.JSON
import java.time.LocalDate

/**
 * Endpoints RGPD pour l'utilisateur connecté :
 *   GET    /api/users/me/export     → download JSON de toutes ses données
 *   DELETE /api/users/me            → anonymisation (ne peut pas être annulée)
 */
class UserDataController {

    static responseFormats = ['json']
    static allowedMethods = [export: 'GET', remove: 'DELETE']

    AuthService authService
    UserDataService userDataService

    def export() {
        User user = requireUser()
        if (!user) return
        String json = userDataService.exportUserDataAsJson(user)
        String filename = "hook-cook-export-${user.id}-${LocalDate.now()}.json"
        response.contentType = 'application/json; charset=UTF-8'
        response.setHeader('Content-Disposition', "attachment; filename=\"${filename}\"")
        response.outputStream.withStream { out ->
            out.write(json.getBytes('UTF-8'))
            out.flush()
        }
    }

    def remove() {
        User user = requireUser()
        if (!user) return
        Map result = userDataService.anonymizeUser(user)
        if (result.error) {
            response.status = 400
            render([error: result.error] as JSON)
            return
        }
        render(result as JSON)
    }

    private User requireUser() {
        Map check = authService.userFromRequest(request)
        if (!check.user) {
            response.status = 401
            render([error: 'Authentification requise.'] as JSON)
            return null
        }
        check.user
    }
}
