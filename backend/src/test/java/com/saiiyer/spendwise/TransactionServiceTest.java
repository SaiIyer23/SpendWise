
package com.saiiyer.spendwise;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.saiiyer.spendwise.dto.CreateTransactionRequest;
import com.saiiyer.spendwise.dto.TransactionResponse;
import com.saiiyer.spendwise.dto.UpdateTransactionRequest;
import com.saiiyer.spendwise.repository.TransactionRepository;
import com.saiiyer.spendwise.service.TransactionService;

@SpringBootTest
@Transactional
class TransactionServiceTest {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Test
    void createTransactionSavesCorrectDetails() {
        CreateTransactionRequest request =
            new CreateTransactionRequest(
                "Lunch",
                new BigDecimal("250.00"),
                "Food",
                LocalDate.of(2026, 10, 13),
                "Lunch at cafe"
            );

        TransactionResponse response =
            transactionService.createTransaction(request);

        assertNotNull(response.id());
        assertEquals("Lunch", response.description());
        assertEquals(
            0,
            new BigDecimal("250.00").compareTo(response.amount())
        );
        assertEquals("Food", response.category());
        assertEquals(LocalDate.of(2026, 10, 13), response.transactionDate());
        assertEquals("Lunch at cafe", response.notes());

        assertTrue(
            transactionRepository.findById(response.id()).isPresent()
        );
    }

    @Test
    void updateTransactionChangesSavedDetails() {
        TransactionResponse created =
            transactionService.createTransaction(
                new CreateTransactionRequest(
                    "Lunch",
                    new BigDecimal("250.00"),
                    "Food",
                    LocalDate.of(2026, 10, 13),
                    "Original note"
                )
            );

        UpdateTransactionRequest request =
            new UpdateTransactionRequest(
                "Groceries",
                new BigDecimal("350.50"),
                "Shopping",
                LocalDate.of(2026, 10, 14),
                "Updated note"
            );

        TransactionResponse updated =
            transactionService.updateTransaction(created.id(), request);

        assertEquals(created.id(), updated.id());
        assertEquals("Groceries", updated.description());
        assertEquals(
            0,
            new BigDecimal("350.50").compareTo(updated.amount())
        );
        assertEquals("Shopping", updated.category());
        assertEquals(LocalDate.of(2026, 10, 14), updated.transactionDate());
        assertEquals("Updated note", updated.notes());
    }

    @Test
    void deleteTransactionRemovesSavedRecord() {
        TransactionResponse created =
            transactionService.createTransaction(
                new CreateTransactionRequest(
                    "Test expense",
                    new BigDecimal("100.00"),
                    "Food",
                    LocalDate.of(2026, 10, 13),
                    null
                )
            );

        transactionService.deleteTransaction(created.id());

        assertFalse(
            transactionRepository.findById(created.id()).isPresent()
        );
    }

    @Test
    void updateMissingTransactionReturnsNotFound() {
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> transactionService.updateTransaction(
                -999L,
                new UpdateTransactionRequest(
                    "Updated",
                    new BigDecimal("100.00"),
                    "Food",
                    LocalDate.of(2026, 10, 13),
                    null
                )
            )
        );

        assertEquals(404, exception.getStatusCode().value());
    }

    @Test
    void deleteMissingTransactionReturnsNotFound() {
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> transactionService.deleteTransaction(-999L)
        );

        assertEquals(404, exception.getStatusCode().value());
    }
}
