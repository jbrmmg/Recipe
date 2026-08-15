package com.jbr.middletier.recipe.service;

import com.jbr.middletier.recipe.dto.TagDto;
import com.jbr.middletier.recipe.dto.mapper.TagMapper;
import com.jbr.middletier.recipe.exception.ResourceNotFoundException;
import com.jbr.middletier.recipe.model.Tag;
import com.jbr.middletier.recipe.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final TagMapper tagMapper;

    public List<TagDto> findAll() {
        return tagMapper.toDtoList(tagRepository.findAll());
    }

    public TagDto findById(Long id) {
        return tagMapper.toDto(getOrThrow(id));
    }

    @Transactional
    public TagDto create(TagDto dto) {
        tagRepository.findByNameIgnoreCase(dto.getName()).ifPresent(t -> {
            throw new IllegalArgumentException("Tag already exists: " + dto.getName());
        });
        dto.setId(null);
        return tagMapper.toDto(tagRepository.save(tagMapper.toEntity(dto)));
    }

    @Transactional
    public TagDto update(Long id, TagDto dto) {
        getOrThrow(id);
        dto.setId(id);
        return tagMapper.toDto(tagRepository.save(tagMapper.toEntity(dto)));
    }

    @Transactional
    public void delete(Long id) {
        tagRepository.delete(getOrThrow(id));
    }

    private Tag getOrThrow(Long id) {
        return tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found: " + id));
    }
}
