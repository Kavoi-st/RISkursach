package com.marketplace.presentation.controllers;

import com.marketplace.domain.entities.Category;
import com.marketplace.infrastructure.repositories.CategoryRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<List<CategoryDto>> listCategories() {
        List<CategoryDto> list = categoryRepository.findAll().stream()
                .map(CategoryDto::from)
                .toList();
        return ResponseEntity.ok(list);
    }

    @Data
    public static class CategoryDto {
        private UUID id;
        private String name;
        private String slug;

        public static CategoryDto from(Category c) {
            CategoryDto dto = new CategoryDto();
            dto.setId(c.getId());
            dto.setName(c.getName());
            dto.setSlug(c.getSlug());
            return dto;
        }
    }
}
