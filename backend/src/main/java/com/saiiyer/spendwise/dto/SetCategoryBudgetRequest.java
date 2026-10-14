
package com.saiiyer.spendwise.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SetCategoryBudgetRequest(

    @NotBlank(message = "Category is required.")
    @Size(max = 50, message = "Category must not exceed 50 characters.")
    String category,

    @NotNull(message = "Budget amount is required.")
    @DecimalMin(
        value = "0.00",
        message = "Budget cannot be negative."
    )
    @Digits(
        integer = 10,
        fraction = 2,
        message = "Budget can have up to 10 integer digits and 2 decimal places."
    )
    BigDecimal amount

) {
}
