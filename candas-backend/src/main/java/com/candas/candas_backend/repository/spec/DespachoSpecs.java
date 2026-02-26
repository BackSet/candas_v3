package com.candas.candas_backend.repository.spec;

import com.candas.candas_backend.entity.Despacho;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Specifications para filtrado opcional del listado de despachos (search, fechas, tipo destino).
 */
public final class DespachoSpecs {

    private DespachoSpecs() {
    }

    public static Specification<Despacho> withFilters(
            String search,
            LocalDateTime fechaDesde,
            LocalDateTime fechaHasta,
            String tipoDestino) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("numeroManifiesto")), pattern),
                    cb.like(cb.lower(root.get("usuarioRegistro")), pattern)
                ));
            }
            if (fechaDesde != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("fechaDespacho"), fechaDesde));
            }
            if (fechaHasta != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("fechaDespacho"), fechaHasta));
            }
            if (tipoDestino != null && !tipoDestino.isBlank()) {
                if ("AGENCIA".equalsIgnoreCase(tipoDestino.trim())) {
                    predicates.add(cb.isNotNull(root.get("agencia")));
                } else if ("DIRECTO".equalsIgnoreCase(tipoDestino.trim())) {
                    predicates.add(cb.isNotNull(root.get("destinatarioDirecto")));
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
