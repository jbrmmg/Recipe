package com.jbr.middletier.recipe.dto;

import lombok.Data;

@Data
public class MealSummaryDto {
    private Long id;
    private String name;
    private String notes;
    private int recipeCount;
}
