package com.jbr.middletier.recipe.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class IngredientDto {
    private Long id;

    @NotBlank
    private String name;

    @NotNull
    private String defaultUnit;

    @Positive
    private double purchaseQuantity;

    @NotNull
    private String purchaseUnit;

    @NotNull
    private String category;
}
