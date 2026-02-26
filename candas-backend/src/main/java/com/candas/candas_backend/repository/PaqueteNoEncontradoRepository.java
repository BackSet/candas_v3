package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.PaqueteNoEncontrado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaqueteNoEncontradoRepository extends JpaRepository<PaqueteNoEncontrado, Long> {
    List<PaqueteNoEncontrado> findByLoteRecepcionIdLoteRecepcion(Long idLoteRecepcion);
}
