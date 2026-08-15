package com.jbr.middletier.recipe.controller;

import com.jbr.middletier.recipe.dto.TagDto;
import com.jbr.middletier.recipe.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tag")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public List<TagDto> getAll() {
        return tagService.findAll();
    }

    @GetMapping("/{id}")
    public TagDto getById(@PathVariable Long id) {
        return tagService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TagDto create(@Valid @RequestBody TagDto dto) {
        return tagService.create(dto);
    }

    @PutMapping("/{id}")
    public TagDto update(@PathVariable Long id, @Valid @RequestBody TagDto dto) {
        return tagService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        tagService.delete(id);
    }
}
