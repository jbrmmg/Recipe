package com.jbr.middletier.recipe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class ShoppingPlanInfo {
    private String name;
    private LocalDate date;
}
