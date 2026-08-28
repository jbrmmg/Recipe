package com.jbr.middletier.recipe;

import com.jbr.middletier.recipe.dto.RecipeDetailDto;
import com.jbr.middletier.recipe.dto.RecipeDto;
import com.jbr.middletier.recipe.dto.RecipeStepDto;
import com.jbr.middletier.recipe.dto.mapper.RecipeMapper;
import com.jbr.middletier.recipe.exception.ResourceNotFoundException;
import com.jbr.middletier.recipe.model.Recipe;
import com.jbr.middletier.recipe.repository.IngredientRepository;
import com.jbr.middletier.recipe.repository.RecipeRepository;
import com.jbr.middletier.recipe.repository.TagRepository;
import com.jbr.middletier.recipe.service.RecipeService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecipeServiceTest {

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private IngredientRepository ingredientRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private RecipeMapper recipeMapper;

    @InjectMocks
    private RecipeService recipeService;

    private RecipeDto minimalDto(String title) {
        RecipeDto dto = new RecipeDto();
        dto.setTitle(title);
        dto.setBaseServings(2);
        dto.setIngredients(List.of());
        dto.setTagIds(List.of());
        return dto;
    }

    private RecipeStepDto cookStep(int durationSeconds, Integer parallelGroup) {
        RecipeStepDto step = new RecipeStepDto();
        step.setPhase("COOK");
        step.setDescription("step");
        step.setDurationSeconds(durationSeconds);
        step.setParallelGroup(parallelGroup);
        return step;
    }

    private RecipeStepDto prepStep(int durationSeconds) {
        RecipeStepDto step = new RecipeStepDto();
        step.setPhase("PREP");
        step.setDescription("prep step");
        step.setDurationSeconds(durationSeconds);
        return step;
    }

    private void stubSaveAndMapper() {
        when(recipeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(recipeMapper.toDetailDto(any())).thenReturn(new RecipeDetailDto());
    }

    @Test
    void create_noSteps_cookTimeIsZero() {
        stubSaveAndMapper();
        RecipeDto dto = minimalDto("Pasta");
        dto.setSteps(List.of());

        recipeService.create(dto);

        ArgumentCaptor<Recipe> captor = ArgumentCaptor.forClass(Recipe.class);
        org.mockito.Mockito.verify(recipeRepository).save(captor.capture());
        assertThat(captor.getValue().getCookTime()).isZero();
    }

    @Test
    void create_twoSequentialCookSteps_summedAndConvertedToMinutes() {
        stubSaveAndMapper();
        RecipeDto dto = minimalDto("Stew");
        dto.setSteps(List.of(cookStep(600, null), cookStep(900, null)));

        recipeService.create(dto);

        ArgumentCaptor<Recipe> captor = ArgumentCaptor.forClass(Recipe.class);
        org.mockito.Mockito.verify(recipeRepository).save(captor.capture());
        assertThat(captor.getValue().getCookTime()).isEqualTo(25);
    }

    @Test
    void create_prepStepsOnly_cookTimeIsZero() {
        stubSaveAndMapper();
        RecipeDto dto = minimalDto("Salad");
        dto.setSteps(List.of(prepStep(600), prepStep(900)));

        recipeService.create(dto);

        ArgumentCaptor<Recipe> captor = ArgumentCaptor.forClass(Recipe.class);
        org.mockito.Mockito.verify(recipeRepository).save(captor.capture());
        assertThat(captor.getValue().getCookTime()).isZero();
    }

    @Test
    void create_twoParallelCookSteps_usesMaxNotSum() {
        stubSaveAndMapper();
        RecipeDto dto = minimalDto("Roast");
        dto.setSteps(List.of(cookStep(600, 1), cookStep(900, 1)));

        recipeService.create(dto);

        ArgumentCaptor<Recipe> captor = ArgumentCaptor.forClass(Recipe.class);
        org.mockito.Mockito.verify(recipeRepository).save(captor.capture());
        assertThat(captor.getValue().getCookTime()).isEqualTo(15);
    }

    @Test
    void create_mixedSequentialAndParallelCookSteps_combinedCorrectly() {
        stubSaveAndMapper();
        RecipeDto dto = minimalDto("Mixed");
        // Sequential 600s + parallel group with 300s and 900s → (600 + 900) / 60 = 25
        dto.setSteps(List.of(cookStep(600, null), cookStep(300, 1), cookStep(900, 1)));

        recipeService.create(dto);

        ArgumentCaptor<Recipe> captor = ArgumentCaptor.forClass(Recipe.class);
        org.mockito.Mockito.verify(recipeRepository).save(captor.capture());
        assertThat(captor.getValue().getCookTime()).isEqualTo(25);
    }

    @Test
    void create_fractionalMinutes_roundedUp() {
        stubSaveAndMapper();
        RecipeDto dto = minimalDto("Quick");
        dto.setSteps(List.of(cookStep(70, null)));

        recipeService.create(dto);

        ArgumentCaptor<Recipe> captor = ArgumentCaptor.forClass(Recipe.class);
        org.mockito.Mockito.verify(recipeRepository).save(captor.capture());
        assertThat(captor.getValue().getCookTime()).isEqualTo(2);
    }

    @Test
    void findById_notFound_throwsResourceNotFoundException() {
        when(recipeRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> recipeService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void delete_notFound_throwsResourceNotFoundException() {
        when(recipeRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> recipeService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
