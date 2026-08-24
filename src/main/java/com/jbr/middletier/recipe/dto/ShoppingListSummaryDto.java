package com.jbr.middletier.recipe.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ShoppingListSummaryDto {
    private Long id;
    private String name;
    private Long mealPlanId;
    private LocalDateTime createdDate;
    private int itemCount;
}
