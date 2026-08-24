package com.jbr.middletier.recipe.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class MealPlanDetailDto {
    private Long id;
    private String name;
    private LocalDate date;
    private Long shoppingListId;
    private List<MealPlanEntryDto> entries;
}
