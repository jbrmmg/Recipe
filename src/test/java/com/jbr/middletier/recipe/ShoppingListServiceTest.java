package com.jbr.middletier.recipe;

import com.jbr.middletier.recipe.dto.ShoppingListDetailDto;
import com.jbr.middletier.recipe.dto.ShoppingListSummaryDto;
import com.jbr.middletier.recipe.exception.ResourceNotFoundException;
import com.jbr.middletier.recipe.model.*;
import com.jbr.middletier.recipe.repository.MealPlanRepository;
import com.jbr.middletier.recipe.repository.ShoppingListRepository;
import com.jbr.middletier.recipe.service.ShoppingListService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShoppingListServiceTest {

    @Mock
    private ShoppingListRepository shoppingListRepository;

    @Mock
    private MealPlanRepository mealPlanRepository;

    @InjectMocks
    private ShoppingListService shoppingListService;

    private ShoppingList shoppingListWithItems(Long id, String name, Long mealPlanId, int itemCount) {
        ShoppingList sl = new ShoppingList();
        sl.setId(id);
        sl.setName(name);
        sl.setMealPlanId(mealPlanId);
        sl.setCreatedDate(LocalDateTime.now());
        List<ShoppingListItem> items = new ArrayList<>();
        for (int i = 0; i < itemCount; i++) {
            ShoppingListItem item = new ShoppingListItem();
            item.setIngredientId((long) i + 1);
            item.setIngredientName("Ingredient " + i);
            item.setCategory("PRODUCE");
            item.setUnit("GRAM");
            item.setQuantity(100.0);
            items.add(item);
        }
        sl.setItems(items);
        return sl;
    }

    private MealPlan buildMealPlan(Long id, String name) {
        return MealPlan.builder()
                .id(id)
                .name(name)
                .date(LocalDate.now())
                .entries(new ArrayList<>())
                .build();
    }

    private MealPlanEntry buildEntry(MealPlan plan, Meal meal) {
        return MealPlanEntry.builder()
                .mealPlan(plan)
                .meal(meal)
                .dayLabel("Monday")
                .displayOrder(1)
                .build();
    }

    private Ingredient buildIngredient(Long id, String name) {
        return Ingredient.builder()
                .id(id)
                .name(name)
                .defaultUnit(MeasurementUnit.GRAM)
                .purchaseQuantity(500.0)
                .purchaseUnit(MeasurementUnit.GRAM)
                .category(IngredientCategory.PRODUCE)
                .build();
    }

    private RecipeIngredient buildRecipeIngredient(Recipe recipe, Ingredient ingredient, double quantity, MeasurementUnit unit) {
        return RecipeIngredient.builder()
                .recipe(recipe)
                .ingredient(ingredient)
                .quantity(quantity)
                .unit(unit)
                .build();
    }

    private Recipe buildRecipe(Long id, int baseServings, List<RecipeIngredient> ingredients) {
        Recipe recipe = Recipe.builder()
                .id(id)
                .title("Recipe " + id)
                .baseServings(baseServings)
                .ingredients(ingredients)
                .build();
        return recipe;
    }

    private MealRecipe buildMealRecipe(Meal meal, Recipe recipe, int servings) {
        return MealRecipe.builder()
                .meal(meal)
                .recipe(recipe)
                .servings(servings)
                .displayOrder(1)
                .build();
    }

    @Test
    void findAll_delegatesToRepository_returnsMappedSummaries() {
        ShoppingList sl1 = shoppingListWithItems(1L, "Week 1", 10L, 3);
        ShoppingList sl2 = shoppingListWithItems(2L, "Week 2", 11L, 5);
        when(shoppingListRepository.findAllByOrderByCreatedDateDesc()).thenReturn(List.of(sl1, sl2));

        List<ShoppingListSummaryDto> result = shoppingListService.findAll();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("Week 1");
        assertThat(result.get(0).getItemCount()).isEqualTo(3);
        assertThat(result.get(1).getName()).isEqualTo("Week 2");
        assertThat(result.get(1).getItemCount()).isEqualTo(5);
    }

    @Test
    void findById_found_returnsDetailDto() {
        ShoppingList sl = shoppingListWithItems(1L, "Week 1", 10L, 2);
        when(shoppingListRepository.findById(1L)).thenReturn(Optional.of(sl));

        ShoppingListDetailDto result = shoppingListService.findById(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("Week 1");
        assertThat(result.getItems()).hasSize(2);
    }

    @Test
    void findById_notFound_throwsResourceNotFoundException() {
        when(shoppingListRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> shoppingListService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void delete_found_deletesEntity() {
        ShoppingList sl = shoppingListWithItems(1L, "Week 1", 10L, 0);
        when(shoppingListRepository.findById(1L)).thenReturn(Optional.of(sl));

        shoppingListService.delete(1L);

        verify(shoppingListRepository).delete(sl);
    }

    @Test
    void delete_notFound_throwsResourceNotFoundException() {
        when(shoppingListRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> shoppingListService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createFromMealPlan_mealPlanNotFound_throwsResourceNotFoundException() {
        when(mealPlanRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> shoppingListService.createFromMealPlan(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void createFromMealPlan_noExistingList_createsNewListWithPlanName() {
        MealPlan plan = buildMealPlan(10L, "Week Plan");
        when(mealPlanRepository.findById(10L)).thenReturn(Optional.of(plan));
        when(shoppingListRepository.findByMealPlanId(10L)).thenReturn(Optional.empty());
        when(shoppingListRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ArgumentCaptor<ShoppingList> captor = ArgumentCaptor.forClass(ShoppingList.class);

        shoppingListService.createFromMealPlan(10L);

        verify(shoppingListRepository).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Week Plan");
        assertThat(captor.getValue().getMealPlanId()).isEqualTo(10L);
    }

    @Test
    void createFromMealPlan_existingList_deletesOldBeforeSavingNew() {
        MealPlan plan = buildMealPlan(10L, "Week Plan");
        ShoppingList existing = shoppingListWithItems(5L, "Old List", 10L, 0);
        when(mealPlanRepository.findById(10L)).thenReturn(Optional.of(plan));
        when(shoppingListRepository.findByMealPlanId(10L)).thenReturn(Optional.of(existing));
        when(shoppingListRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        shoppingListService.createFromMealPlan(10L);

        verify(shoppingListRepository).delete(existing);
        verify(shoppingListRepository).save(any(ShoppingList.class));
    }

    @Test
    void createFromMealPlan_sameIngredientAcrossEntries_aggregatesQuantity() {
        Ingredient flour = buildIngredient(1L, "Flour");

        Recipe recipe1 = buildRecipe(1L, 4, new ArrayList<>());
        RecipeIngredient ri1 = buildRecipeIngredient(recipe1, flour, 200.0, MeasurementUnit.GRAM);
        recipe1.getIngredients().add(ri1);

        Recipe recipe2 = buildRecipe(2L, 4, new ArrayList<>());
        RecipeIngredient ri2 = buildRecipeIngredient(recipe2, flour, 400.0, MeasurementUnit.GRAM);
        recipe2.getIngredients().add(ri2);

        Meal meal = Meal.builder()
                .id(1L)
                .name("Dinner")
                .mealRecipes(new ArrayList<>())
                .build();
        MealRecipe mr1 = buildMealRecipe(meal, recipe1, 4);
        MealRecipe mr2 = buildMealRecipe(meal, recipe2, 4);
        meal.getMealRecipes().add(mr1);
        meal.getMealRecipes().add(mr2);

        MealPlan plan = buildMealPlan(10L, "Week Plan");
        MealPlanEntry entry = buildEntry(plan, meal);
        plan.getEntries().add(entry);

        when(mealPlanRepository.findById(10L)).thenReturn(Optional.of(plan));
        when(shoppingListRepository.findByMealPlanId(10L)).thenReturn(Optional.empty());
        when(shoppingListRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ArgumentCaptor<ShoppingList> captor = ArgumentCaptor.forClass(ShoppingList.class);
        shoppingListService.createFromMealPlan(10L);

        verify(shoppingListRepository).save(captor.capture());
        ShoppingList saved = captor.getValue();
        assertThat(saved.getItems()).hasSize(1);
        assertThat(saved.getItems().get(0).getIngredientName()).isEqualTo("Flour");
        assertThat(saved.getItems().get(0).getQuantity()).isEqualTo(600.0);
    }
}
