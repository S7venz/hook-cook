package backend

import grails.converters.JSON

import java.time.LocalDate

class LeaderboardController {

    static responseFormats = ['json']
    static allowedMethods = [monthly: 'GET', summary: 'GET']

    LeaderboardService leaderboardService

    /**
     * GET /api/leaderboard/monthly?species=truite&year=2026&month=4&limit=10
     * Tous les params sont optionnels. Par défaut : mois courant, limit 10,
     * toutes espèces confondues.
     */
    def monthly() {
        String species = params.species ?: null
        LocalDate now = LocalDate.now()
        int year = params.int('year') ?: now.year
        int month = params.int('month') ?: now.monthValue
        int limit = Math.min(50, Math.max(1, params.int('limit') ?: 10))
        render(leaderboardService.monthly(species, year, month, limit) as JSON)
    }

    /**
     * GET /api/leaderboard/summary — compact pour la homepage.
     */
    def summary() {
        render(leaderboardService.currentMonthSummary() as JSON)
    }
}
