package com.jbr.middletier.recipe.dto;

import lombok.Data;

import java.util.List;

@Data
public class MealDetailDto {
    private Long id;
    private String name;
    private String notes;
    private List<MealRecipeDto> recipes;
}
