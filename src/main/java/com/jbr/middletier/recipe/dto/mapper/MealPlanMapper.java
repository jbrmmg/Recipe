package com.jbr.middletier.recipe.dto.mapper;

import com.jbr.middletier.recipe.dto.MealPlanDetailDto;
import com.jbr.middletier.recipe.dto.MealPlanEntryDto;
import com.jbr.middletier.recipe.dto.MealPlanSummaryDto;
import com.jbr.middletier.recipe.model.MealPlan;
import com.jbr.middletier.recipe.model.MealPlanEntry;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface MealPlanMapper {

    @Mapping(target = "entryCount", expression = "java(mealPlan.getEntries().size())")
    @Mapping(target = "date", source = "date")
    MealPlanSummaryDto toSummaryDto(MealPlan mealPlan);

    List<MealPlanSummaryDto> toSummaryDtoList(List<MealPlan> plans);

    @Mapping(target = "entries", source = "entries")
    @Mapping(target = "date", source = "date")
    MealPlanDetailDto toDetailDto(MealPlan mealPlan);

    @Mapping(target = "mealId",   source = "meal.id")
    @Mapping(target = "mealName", source = "meal.name")
    MealPlanEntryDto toEntryDto(MealPlanEntry entry);
}
