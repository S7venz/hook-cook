package backend.config

import org.springframework.boot.web.servlet.FilterRegistrationBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.Ordered
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter

@Configuration
class CorsConfig {

    @Bean
    FilterRegistrationBean<CorsFilter> corsFilter() {
        CorsConfiguration config = new CorsConfiguration()
        // Bearer tokens in Authorization header — no cookies, credentials not needed.
        config.allowCredentials = false
        config.allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']
        config.allowedHeaders = ['Authorization', 'Content-Type', 'Accept', 'Origin']
        config.allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
        config.exposedHeaders = ['Authorization']
        config.maxAge = 3600L

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration('/api/**', config)

        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source))
        bean.order = Ordered.HIGHEST_PRECEDENCE
        bean
    }
}
