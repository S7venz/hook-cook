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
        config.allowCredentials = true
        config.addAllowedOrigin('http://localhost:5173')
        config.addAllowedOrigin('http://127.0.0.1:5173')
        config.addAllowedHeader('*')
        config.addAllowedMethod('*')
        config.addExposedHeader('Authorization')
        config.maxAge = 3600L

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration('/api/**', config)

        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source))
        bean.order = Ordered.HIGHEST_PRECEDENCE
        bean
    }
}
