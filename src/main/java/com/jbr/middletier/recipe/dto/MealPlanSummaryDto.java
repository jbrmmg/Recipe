package com.jbr.middletier.recipe.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class MealPlanSummaryDto {
    private Long id;
    private String name;
    private LocalDate date;
    private int entryCount;
    private Long shoppingListId;
}
