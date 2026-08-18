package com.jbr.middletier.recipe.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MealPlanEntryDto {
    private Long id;

    @NotNull
    private Long mealId;

    private String mealName;
    private String dayLabel;
    private int displayOrder;
}
