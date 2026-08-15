package com.jbr.middletier.recipe.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    // Forward Angular routes to index.html. Excludes API paths and any path containing
    // a dot (file extensions) so static resources are served by the default handler.
    @RequestMapping(value = {
        "/{path:^(?!api|actuator|h2|swagger-ui|v3)(?!.*\\.)[^\\s]*}",
        "/{path:^(?!api|actuator|h2|swagger-ui|v3)(?!.*\\.)[^\\s]*}/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
