package com.jbr.middletier.recipe.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class RecipeDto {
    @NotBlank
    private String title;

    private String description;

    @Positive
    private int baseServings;

    private Integer prepTime;
    private Integer cookTime;
    private String imagePath;

    private List<Long> tagIds = new ArrayList<>();

    @Valid
    private List<RecipeIngredientDto> ingredients = new ArrayList<>();

    @Valid
    private List<RecipeStepDto> steps = new ArrayList<>();
}
