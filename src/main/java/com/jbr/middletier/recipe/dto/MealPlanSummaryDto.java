package com.jbr.middletier.recipe.dto;

import lombok.Data;

@Data
public class MealPlanSummaryDto {
    private Long id;
    private String name;
    private int entryCount;
}
