package com.saiiyer.spendwise.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionResponse(
        Long id,
        String description,
        BigDecimal amount,
        String category,
        LocalDate transactionDate,
        String notes
) {
}