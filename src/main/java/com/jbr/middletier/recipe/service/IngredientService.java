package com.jbr.middletier.recipe.service;

import com.jbr.middletier.recipe.dto.IngredientDto;
import com.jbr.middletier.recipe.dto.mapper.IngredientMapper;
import com.jbr.middletier.recipe.exception.ResourceNotFoundException;
import com.jbr.middletier.recipe.model.Ingredient;
import com.jbr.middletier.recipe.repository.IngredientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IngredientService {

    private final IngredientRepository ingredientRepository;
    private final IngredientMapper ingredientMapper;

    public List<IngredientDto> findAll(String search) {
        List<Ingredient> ingredients = (search != null && !search.isBlank())
                ? ingredientRepository.findByNameContainingIgnoreCase(search)
                : ingredientRepository.findAll();
        return ingredientMapper.toDtoList(ingredients);
    }

    public IngredientDto findById(Long id) {
        return ingredientMapper.toDto(getOrThrow(id));
    }

    @Transactional
    public IngredientDto create(IngredientDto dto) {
        dto.setId(null);
        return ingredientMapper.toDto(ingredientRepository.save(ingredientMapper.toEntity(dto)));
    }

    @Transactional
    public IngredientDto update(Long id, IngredientDto dto) {
        getOrThrow(id);
        dto.setId(id);
        return ingredientMapper.toDto(ingredientRepository.save(ingredientMapper.toEntity(dto)));
    }

    @Transactional
    public void delete(Long id) {
        ingredientRepository.delete(getOrThrow(id));
    }

    private Ingredient getOrThrow(Long id) {
        return ingredientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ingredient not found: " + id));
    }
}
