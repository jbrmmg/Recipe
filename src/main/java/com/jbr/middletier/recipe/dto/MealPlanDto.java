package com.jbr.middletier.recipe.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class MealPlanDto {

    @NotBlank
    private String name;

    @Valid
    private List<MealPlanEntryDto> entries = new ArrayList<>();
}
