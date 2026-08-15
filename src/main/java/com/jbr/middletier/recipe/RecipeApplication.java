package com.jbr.middletier.recipe;

import com.jbr.middletier.recipe.config.DefaultProfileUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RecipeApplication {
    private static final Logger log = LoggerFactory.getLogger(RecipeApplication.class);

    public static void main(String[] args) {
        log.info("Starting up");
        SpringApplication app = new SpringApplication(RecipeApplication.class);
        DefaultProfileUtil.addDefaultProfile(app);
        app.run(args);
    }
}
