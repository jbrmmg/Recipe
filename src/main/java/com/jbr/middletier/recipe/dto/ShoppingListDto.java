package com.jbr.middletier.recipe.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ShoppingListDto {
    private String planName;
    private LocalDate date;
    private List<ShoppingListItemDto> items;
}
