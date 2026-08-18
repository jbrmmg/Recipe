package com.jbr.middletier.recipe.dto;

import lombok.Data;

import java.util.List;

@Data
public class MealPlanDetailDto {
    private Long id;
    private String name;
    private List<MealPlanEntryDto> entries;
}
