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

    public static Specification<LoteRecepcion> withFilters(String search, TipoLote tipoLote) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("numeroRecepcion")), pattern),
                    cb.like(cb.lower(root.get("usuarioRegistro")), pattern)
                ));
            }
            if (tipoLote != null) {
                predicates.add(cb.equal(root.get("tipoLote"), tipoLote));
            }
            return predicates.isEmpty() ? null : cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
