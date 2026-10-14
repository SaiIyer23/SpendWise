
package com.saiiyer.spendwise.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.saiiyer.spendwise.entity.Transaction;

public interface TransactionRepository
        extends JpaRepository<Transaction, Long> {

}
