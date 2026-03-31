package com.candas.candas_backend.repository.spec;

import com.candas.candas_backend.entity.LoteRecepcion;
import com.candas.candas_backend.entity.enums.TipoLote;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

/**
 * Specifications para filtrado opcional del listado de lotes de recepción (search, tipoLote).
 */
public final class LoteRecepcionSpecs {

    private LoteRecepcionSpecs() {
    }

    public static Specification<LoteRecepcion> withFilters(String search, TipoLote tipoLote, Long idAgenciaRestringida) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                var usuarioJoin = root.join("usuarioRegistro", jakarta.persistence.criteria.JoinType.LEFT);
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("numeroRecepcion")), pattern),
                    cb.like(cb.lower(usuarioJoin.get("username")), pattern),
                    cb.like(cb.lower(usuarioJoin.get("nombreCompleto")), pattern)
                ));
            }
            if (tipoLote != null) {
                predicates.add(cb.equal(root.get("tipoLote"), tipoLote));
            }
            if (idAgenciaRestringida != null) {
                predicates.add(cb.equal(root.get("agencia").get("idAgencia"), idAgenciaRestringida));
            }
            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
