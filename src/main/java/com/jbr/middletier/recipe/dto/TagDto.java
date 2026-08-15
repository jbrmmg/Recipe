package com.jbr.middletier.recipe.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TagDto {
    private Long id;

    @NotBlank
    private String name;
}
