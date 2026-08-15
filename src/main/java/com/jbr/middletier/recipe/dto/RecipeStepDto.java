package com.jbr.middletier.recipe.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RecipeStepDto {
    private Long id;

    @NotNull
    private String phase;

    private int stepOrder;

    private Integer parallelGroup;

    @NotBlank
    private String description;

    private int durationSeconds;

    private boolean timerRequired;
}
