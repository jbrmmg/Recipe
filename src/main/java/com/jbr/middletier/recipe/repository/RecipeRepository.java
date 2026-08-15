package com.jbr.middletier.recipe.repository;

import com.jbr.middletier.recipe.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    List<Recipe> findByTitleContainingIgnoreCase(String title);

    @Query("SELECT DISTINCT r FROM Recipe r JOIN r.tags t WHERE t.id = :tagId")
    List<Recipe> findByTagId(@Param("tagId") Long tagId);

    @Query("""
            SELECT r FROM Recipe r
            WHERE (SELECT COUNT(DISTINCT ri.ingredient.id) FROM RecipeIngredient ri
                   WHERE ri.recipe = r AND ri.ingredient.id IN :ingredientIds)
                  = :ingredientCount
            """)
    List<Recipe> findByAllIngredients(@Param("ingredientIds") List<Long> ingredientIds,
                                      @Param("ingredientCount") long ingredientCount);
}
