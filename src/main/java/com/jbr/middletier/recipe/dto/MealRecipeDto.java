package com.jbr.middletier.recipe.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MealRecipeDto {
    private Long id;

    @NotNull
    private Long recipeId;

    private String recipeTitle;
    private Integer recipePrepTime;
    private Integer recipeCookTime;
    private Integer recipeBaseServings;

    @Min(1)
    private int servings;

    private int displayOrder;
}
