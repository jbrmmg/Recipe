package com.jbr.middletier.recipe.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class RecipeIngredientDto {
    private Long id;

    @NotNull
    private Long ingredientId;

    private String ingredientName;

    @Positive
    private double quantity;

    @NotNull
    private String unit;

    private String notes;
}
