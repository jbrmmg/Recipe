package com.jbr.middletier.recipe.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ShoppingListDetailDto {
    private Long id;
    private String name;
    private Long mealPlanId;
    private LocalDateTime createdDate;
    private List<ShoppingListItemDto> items;
}
