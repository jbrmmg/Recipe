package com.jbr.middletier.recipe.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    // Forward all non-API requests to index.html so Angular routing works
    @RequestMapping(value = {"/{path:^(?!api|actuator|h2|swagger-ui|v3).*}", "/{path:^(?!api|actuator|h2|swagger-ui|v3).*}/**"})
    public String forward() {
        return "forward:/index.html";
    }
}
