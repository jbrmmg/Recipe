package com.jbr.middletier.recipe.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class MealDto {

    @NotBlank
    private String name;

    private String notes;

    @Valid
    private List<MealRecipeDto> recipes = new ArrayList<>();
}
