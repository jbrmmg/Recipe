package com.jbr.middletier.recipe.dto;

import lombok.Data;

import java.util.List;

@Data
public class ShoppingListDto {
    private List<ShoppingPlanInfo> plans;
    private List<ShoppingListItemDto> items;
}
