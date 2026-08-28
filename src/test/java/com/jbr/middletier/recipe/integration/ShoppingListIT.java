package com.jbr.middletier.recipe.integration;

import com.jbr.middletier.recipe.RecipeApplication;
import com.jbr.middletier.recipe.dto.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.MariaDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, classes = RecipeApplication.class)
@ActiveProfiles("it")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ShoppingListIT {

    @Container
    @ServiceConnection
    static MariaDBContainer<?> mariadb = new MariaDBContainer<>("mariadb:11");

    @Autowired
    TestRestTemplate restTemplate;

    static Long ingredientId;
    static Long recipeId;
    static Long mealId;
    static Long mealPlanId;
    static Long shoppingListId;

    @Test
    @Order(1)
    void setup_createIngredient() {
        IngredientDto dto = new IngredientDto();
        dto.setName("Tomato");
        dto.setDefaultUnit("GRAM");
        dto.setPurchaseQuantity(500.0);
        dto.setPurchaseUnit("GRAM");
        dto.setCategory("PRODUCE");

        ResponseEntity<IngredientDto> response = restTemplate.postForEntity(
                "/api/v1/ingredient", dto, IngredientDto.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        ingredientId = response.getBody().getId();
        assertThat(ingredientId).isNotNull();
    }

    @Test
    @Order(2)
    void setup_createRecipeWithIngredient() {
        RecipeIngredientDto ri = new RecipeIngredientDto();
        ri.setIngredientId(ingredientId);
        ri.setQuantity(200.0);
        ri.setUnit("GRAM");

        Map<String, Object> request = Map.of(
                "title", "Tomato Soup",
                "baseServings", 4,
                "tagIds", List.of(),
                "ingredients", List.of(ri),
                "steps", List.of()
        );

        ResponseEntity<RecipeDetailDto> response = restTemplate.postForEntity(
                "/api/v1/recipe", request, RecipeDetailDto.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        recipeId = response.getBody().getId();
        assertThat(recipeId).isNotNull();
    }

    @Test
    @Order(3)
    void setup_createMealWithRecipe() {
        MealRecipeDto mealRecipe = new MealRecipeDto();
        mealRecipe.setRecipeId(recipeId);
        mealRecipe.setServings(4);
        mealRecipe.setDisplayOrder(1);

        MealDto dto = new MealDto();
        dto.setName("Soup Dinner");
        dto.setRecipes(List.of(mealRecipe));

        ResponseEntity<MealDetailDto> response = restTemplate.postForEntity(
                "/api/v1/meal", dto, MealDetailDto.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        mealId = response.getBody().getId();
        assertThat(mealId).isNotNull();
    }

    @Test
    @Order(4)
    void setup_createMealPlanWithMeal() {
        MealPlanEntryDto entry = new MealPlanEntryDto();
        entry.setMealId(mealId);
        entry.setDayLabel("Monday");
        entry.setDisplayOrder(1);

        MealPlanDto dto = new MealPlanDto();
        dto.setName("Week One");
        dto.setDate(LocalDate.of(2026, 9, 1));
        dto.setEntries(List.of(entry));

        ResponseEntity<MealPlanDetailDto> response = restTemplate.postForEntity(
                "/api/v1/meal-plan", dto, MealPlanDetailDto.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        mealPlanId = response.getBody().getId();
        assertThat(mealPlanId).isNotNull();
    }

    @Test
    @Order(5)
    void createFromMealPlan_createsShoppingListWithIngredients() {
        ResponseEntity<ShoppingListDetailDto> response = restTemplate.postForEntity(
                "/api/v1/shopping-list/meal-plan/{mealPlanId}",
                null,
                ShoppingListDetailDto.class,
                mealPlanId
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getName()).isEqualTo("Week One");
        assertThat(response.getBody().getMealPlanId()).isEqualTo(mealPlanId);
        assertThat(response.getBody().getItems()).isNotEmpty();
        assertThat(response.getBody().getItems())
                .extracting(ShoppingListItemDto::getIngredientName)
                .contains("Tomato");
        shoppingListId = response.getBody().getId();
        assertThat(shoppingListId).isNotNull();
    }

    @Test
    @Order(6)
    void getAll_returnsOneShoppingList() {
        ResponseEntity<ShoppingListSummaryDto[]> response = restTemplate.getForEntity(
                "/api/v1/shopping-list", ShoppingListSummaryDto[].class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody()[0].getName()).isEqualTo("Week One");
    }

    @Test
    @Order(7)
    void getById_returnsDetailWithItems() {
        ResponseEntity<ShoppingListDetailDto> response = restTemplate.getForEntity(
                "/api/v1/shopping-list/{id}", ShoppingListDetailDto.class, shoppingListId
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getId()).isEqualTo(shoppingListId);
        assertThat(response.getBody().getItems()).isNotEmpty();
    }

    @Test
    @Order(8)
    void createFromMealPlan_again_replacesExistingList() {
        ResponseEntity<ShoppingListDetailDto> response = restTemplate.postForEntity(
                "/api/v1/shopping-list/meal-plan/{mealPlanId}",
                null,
                ShoppingListDetailDto.class,
                mealPlanId
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<ShoppingListSummaryDto[]> listResponse = restTemplate.getForEntity(
                "/api/v1/shopping-list", ShoppingListSummaryDto[].class
        );
        assertThat(listResponse.getBody()).isNotNull();
        assertThat(listResponse.getBody()).hasSize(1);

        shoppingListId = response.getBody().getId();
    }

    @Test
    @Order(9)
    void delete_existingShoppingList_returns204() {
        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/v1/shopping-list/{id}",
                HttpMethod.DELETE,
                null,
                Void.class,
                shoppingListId
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @Order(10)
    void getById_afterDelete_returns404() {
        ResponseEntity<String> response = restTemplate.getForEntity(
                "/api/v1/shopping-list/{id}", String.class, shoppingListId
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
