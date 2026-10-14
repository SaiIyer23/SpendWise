package com.saiiyer.spendwise.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saiiyer.spendwise.dto.CreateTransactionRequest;
import com.saiiyer.spendwise.dto.TransactionResponse;
import com.saiiyer.spendwise.entity.Transaction;
import com.saiiyer.spendwise.repository.TransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.saiiyer.spendwise.dto.UpdateTransactionRequest;

@Service
@Transactional
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(
            TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public TransactionResponse createTransaction(
            CreateTransactionRequest request) {

        Transaction transaction = new Transaction();

        transaction.setDescription(request.description().trim());
        transaction.setAmount(request.amount());
        transaction.setCategory(request.category().trim());
        transaction.setTransactionDate(request.transactionDate());

        transaction.setNotes(
                request.notes() == null
                        ? null
                        : request.notes().trim()
        );

        Transaction saved = transactionRepository.save(transaction);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getAllTransactions() {
        return transactionRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

public TransactionResponse updateTransaction(
        Long id,
        UpdateTransactionRequest request) {

    Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Transaction not found with id: " + id
            ));

    transaction.setDescription(request.description().trim());
    transaction.setAmount(request.amount());
    transaction.setCategory(request.category().trim());
    transaction.setTransactionDate(request.transactionDate());

    transaction.setNotes(
            request.notes() == null
                    ? null
                    : request.notes().trim()
    );

    Transaction updated = transactionRepository.save(transaction);

    return toResponse(updated);
}


public void deleteTransaction(Long id) {
    Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Transaction not found with id: " + id
            ));

    transactionRepository.delete(transaction);
}

    private TransactionResponse toResponse(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getDescription(),
                transaction.getAmount(),
                transaction.getCategory(),
                transaction.getTransactionDate(),
                transaction.getNotes()
        );
    }
}