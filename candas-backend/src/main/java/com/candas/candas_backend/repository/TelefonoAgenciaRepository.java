package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.Agencia;
import com.candas.candas_backend.entity.TelefonoAgencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TelefonoAgenciaRepository extends JpaRepository<TelefonoAgencia, Long> {
    List<TelefonoAgencia> findByAgencia(Agencia agencia);
    Optional<TelefonoAgencia> findByAgenciaAndPrincipalTrue(Agencia agencia);
}
