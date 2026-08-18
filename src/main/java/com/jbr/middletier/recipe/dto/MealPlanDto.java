package com.jbr.middletier.recipe.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
public class MealPlanDto {

    @NotBlank
    private String name;

    @NotNull
    private LocalDate date;

    @Valid
    private List<MealPlanEntryDto> entries = new ArrayList<>();
}
