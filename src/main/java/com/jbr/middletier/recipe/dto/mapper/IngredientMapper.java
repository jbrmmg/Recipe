package com.jbr.middletier.recipe.dto.mapper;

import com.jbr.middletier.recipe.dto.IngredientDto;
import com.jbr.middletier.recipe.model.Ingredient;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface IngredientMapper {
    IngredientDto toDto(Ingredient ingredient);
    Ingredient toEntity(IngredientDto dto);
    List<IngredientDto> toDtoList(List<Ingredient> ingredients);
}
