
package com.saiiyer.spendwise.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.saiiyer.spendwise.dto.CategoryBudgetResponse;
import com.saiiyer.spendwise.dto.SetCategoryBudgetRequest;
import com.saiiyer.spendwise.service.CategoryBudgetService;

import jakarta.validation.Valid;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/budgets/categories")
public class CategoryBudgetController {

    private final CategoryBudgetService categoryBudgetService;

    public CategoryBudgetController(
            CategoryBudgetService categoryBudgetService) {
        this.categoryBudgetService = categoryBudgetService;
    }

    @GetMapping("/current")
    public List<CategoryBudgetResponse> getCurrentCategoryBudgets() {
        return categoryBudgetService.getCurrentCategoryBudgets();
    }

    @GetMapping
    public List<CategoryBudgetResponse> getCategoryBudgetsForMonth(
            @RequestParam String month) {
        return categoryBudgetService.getCategoryBudgetsForMonth(month);
    }

    @PutMapping("/current")
    public CategoryBudgetResponse setCurrentCategoryBudget(
            @Valid @RequestBody SetCategoryBudgetRequest request) {
        return categoryBudgetService.setCurrentCategoryBudget(request);
    }
}
