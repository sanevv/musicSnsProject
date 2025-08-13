package com.github.musicsnsproject.config.properties.swagger;

import com.github.musicsnsproject.config.properties.server.ServerUrlProperties;
import com.github.musicsnsproject.config.web.swagger.SwaggerConfig;
import io.swagger.v3.oas.models.servers.Server;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.List;

@Profile("default")
@Configuration
@RequiredArgsConstructor
public class SwaggerDefault extends SwaggerConfig {

    private final ServerUrlProperties serverUrlProperties;


    @Override
    protected List<Server> createServers() {
        Server httpsServer = new Server()
                .url(serverUrlProperties.getHttps())
                .description("HTTPS Production Server");
        Server baseServer = new Server()
                .url(serverUrlProperties.getBase())
                .description("HTTP Base Server");
        return List.of(httpsServer, baseServer);
    }
}
