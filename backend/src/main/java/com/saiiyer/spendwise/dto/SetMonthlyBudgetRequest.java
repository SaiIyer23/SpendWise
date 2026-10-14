
package com.saiiyer.spendwise.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

public record SetMonthlyBudgetRequest(
    @NotNull(message = "Budget amount is required.")
    @DecimalMin(
        value = "0.01",
        message = "Monthly budget must be greater than zero."
    )
    @Digits(
        integer = 10,
        fraction = 2,
        message = "Budget can have up to 10 integer digits and 2 decimal places."
    )
    BigDecimal amount
) {
}
