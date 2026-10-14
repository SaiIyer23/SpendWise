
package com.saiiyer.spendwise;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;

import com.saiiyer.spendwise.dto.CreateTransactionRequest;
import com.saiiyer.spendwise.dto.UpdateTransactionRequest;

@SpringBootTest
class TransactionRequestValidationTest {

    @Autowired
    private Validator validator;

    @Test
    void createRequestRejectsInvalidFields() {
        CreateTransactionRequest request =
            new CreateTransactionRequest(
                " ",
                new BigDecimal("0.00"),
                "",
                null,
                "x".repeat(501)
            );

        Set<ConstraintViolation<CreateTransactionRequest>> violations =
            validator.validate(request);

        Set<String> invalidFields = violations.stream()
            .map(violation -> violation.getPropertyPath().toString())
            .collect(Collectors.toSet());

        assertFalse(violations.isEmpty());
        assertTrue(invalidFields.contains("description"));
        assertTrue(invalidFields.contains("amount"));
        assertTrue(invalidFields.contains("category"));
        assertTrue(invalidFields.contains("transactionDate"));
        assertTrue(invalidFields.contains("notes"));
    }

    @Test
    void updateRequestRejectsInvalidFields() {
        UpdateTransactionRequest request =
            new UpdateTransactionRequest(
                "",
                new BigDecimal("-10.00"),
                " ",
                null,
                "x".repeat(501)
            );

        Set<ConstraintViolation<UpdateTransactionRequest>> violations =
            validator.validate(request);

        Set<String> invalidFields = violations.stream()
            .map(violation -> violation.getPropertyPath().toString())
            .collect(Collectors.toSet());

        assertFalse(violations.isEmpty());
        assertTrue(invalidFields.contains("description"));
        assertTrue(invalidFields.contains("amount"));
        assertTrue(invalidFields.contains("category"));
        assertTrue(invalidFields.contains("transactionDate"));
        assertTrue(invalidFields.contains("notes"));
    }

    @Test
    void validCreateRequestPassesValidation() {
        CreateTransactionRequest request =
            new CreateTransactionRequest(
                "Lunch",
                new BigDecimal("250.00"),
                "Food",
                LocalDate.of(2026, 10, 13),
                "Lunch at cafe"
            );

        Set<ConstraintViolation<CreateTransactionRequest>> violations =
            validator.validate(request);

        assertTrue(violations.isEmpty());
    }
}
