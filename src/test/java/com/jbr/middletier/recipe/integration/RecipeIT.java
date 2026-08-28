package com.jbr.middletier.recipe.integration;

import com.jbr.middletier.recipe.dto.RecipeDetailDto;
import com.jbr.middletier.recipe.dto.RecipeStepDto;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import com.jbr.middletier.recipe.RecipeApplication;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.MariaDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, classes = RecipeApplication.class)
@ActiveProfiles("it")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class RecipeIT {

    @Container
    @ServiceConnection
    static MariaDBContainer<?> mariadb = new MariaDBContainer<>("mariadb:11");

    @Autowired
    TestRestTemplate restTemplate;

    static Long recipeId;

    private Map<String, Object> minimalRecipeRequest(String title) {
        return Map.of(
                "title", title,
                "baseServings", 4,
                "tagIds", List.of(),
                "ingredients", List.of(),
                "steps", List.of()
        );
    }

    @Test
    @Order(1)
    void create_minimalRecipe_returns201WithIdAndTitle() {
        ResponseEntity<RecipeDetailDto> response = restTemplate.postForEntity(
                "/api/v1/recipe",
                minimalRecipeRequest("Test Pasta"),
                RecipeDetailDto.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getId()).isNotNull();
        assertThat(response.getBody().getTitle()).isEqualTo("Test Pasta");
        recipeId = response.getBody().getId();
    }

    @Test
    @Order(2)
    void getById_existingRecipe_returns200WithCorrectTitle() {
        ResponseEntity<RecipeDetailDto> response = restTemplate.getForEntity(
                "/api/v1/recipe/{id}", RecipeDetailDto.class, recipeId
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getTitle()).isEqualTo("Test Pasta");
    }

    @Test
    @Order(3)
    void update_withTwoSequentialCookSteps_cookTimeIs25() {
        RecipeStepDto step1 = new RecipeStepDto();
        step1.setPhase("COOK");
        step1.setDescription("Boil water");
        step1.setDurationSeconds(600);
        step1.setStepOrder(1);

        RecipeStepDto step2 = new RecipeStepDto();
        step2.setPhase("COOK");
        step2.setDescription("Cook pasta");
        step2.setDurationSeconds(900);
        step2.setStepOrder(2);

        Map<String, Object> updateRequest = Map.of(
                "title", "Test Pasta",
                "baseServings", 4,
                "tagIds", List.of(),
                "ingredients", List.of(),
                "steps", List.of(step1, step2)
        );

        ResponseEntity<RecipeDetailDto> response = restTemplate.exchange(
                "/api/v1/recipe/{id}",
                HttpMethod.PUT,
                new HttpEntity<>(updateRequest),
                RecipeDetailDto.class,
                recipeId
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCookTime()).isEqualTo(25);
    }

    @Test
    @Order(4)
    void update_withParallelCookSteps_cookTimeUsesMaxNotSum() {
        RecipeStepDto step1 = new RecipeStepDto();
        step1.setPhase("COOK");
        step1.setDescription("Roast vegetables");
        step1.setDurationSeconds(1200);
        step1.setStepOrder(1);
        step1.setParallelGroup(1);

        RecipeStepDto step2 = new RecipeStepDto();
        step2.setPhase("COOK");
        step2.setDescription("Cook sauce");
        step2.setDurationSeconds(600);
        step2.setStepOrder(2);
        step2.setParallelGroup(1);

        Map<String, Object> updateRequest = Map.of(
                "title", "Test Pasta",
                "baseServings", 4,
                "tagIds", List.of(),
                "ingredients", List.of(),
                "steps", List.of(step1, step2)
        );

        ResponseEntity<RecipeDetailDto> response = restTemplate.exchange(
                "/api/v1/recipe/{id}",
                HttpMethod.PUT,
                new HttpEntity<>(updateRequest),
                RecipeDetailDto.class,
                recipeId
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        // max(1200, 600) = 1200 seconds = 20 minutes
        assertThat(response.getBody().getCookTime()).isEqualTo(20);
    }

    @Test
    @Order(5)
    void getAll_returnsListContainingCreatedRecipe() {
        ResponseEntity<RecipeDetailDto[]> response = restTemplate.getForEntity(
                "/api/v1/recipe", RecipeDetailDto[].class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).extracting(RecipeDetailDto::getId).contains(recipeId);
    }

    @Test
    @Order(6)
    void delete_existingRecipe_returns204() {
        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/v1/recipe/{id}",
                HttpMethod.DELETE,
                null,
                Void.class,
                recipeId
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @Order(7)
    void getById_afterDelete_returns404() {
        ResponseEntity<String> response = restTemplate.getForEntity(
                "/api/v1/recipe/{id}", String.class, recipeId
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
