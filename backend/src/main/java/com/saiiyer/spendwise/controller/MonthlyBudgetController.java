
package com.saiiyer.spendwise.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.saiiyer.spendwise.dto.MonthlyBudgetResponse;
import com.saiiyer.spendwise.dto.SetMonthlyBudgetRequest;
import com.saiiyer.spendwise.service.MonthlyBudgetService;

import jakarta.validation.Valid;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/budgets")
public class MonthlyBudgetController {

    private final MonthlyBudgetService monthlyBudgetService;

    public MonthlyBudgetController(
            MonthlyBudgetService monthlyBudgetService) {
        this.monthlyBudgetService = monthlyBudgetService;
    }

    @GetMapping("/current")
    public MonthlyBudgetResponse getCurrentBudget() {
        return monthlyBudgetService.getCurrentBudget();
    }

    @GetMapping
    public MonthlyBudgetResponse getBudgetForMonth(
            @RequestParam String month) {
        return monthlyBudgetService.getBudgetForMonth(month);
    }

    @PutMapping("/current")
    public MonthlyBudgetResponse setCurrentBudget(
            @Valid @RequestBody SetMonthlyBudgetRequest request) {
        return monthlyBudgetService.setCurrentBudget(request);
    }
}
