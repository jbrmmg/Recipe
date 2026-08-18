package com.jbr.middletier.recipe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ShoppingListItemDto {
    private Long ingredientId;
    private String ingredientName;
    private String category;
    private String unit;
    private double quantity;
}
