package com.jbr.middletier.recipe.dto.mapper;

import com.jbr.middletier.recipe.dto.TagDto;
import com.jbr.middletier.recipe.model.Tag;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TagMapper {
    TagDto toDto(Tag tag);
    Tag toEntity(TagDto dto);
    List<TagDto> toDtoList(List<Tag> tags);
}
