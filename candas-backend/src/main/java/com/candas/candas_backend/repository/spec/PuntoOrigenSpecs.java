package com.candas.candas_backend.repository.spec;

import com.candas.candas_backend.entity.PuntoOrigen;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Specifications para filtrado opcional del listado de puntos de origen (search por nombre, activo).
 */
public final class PuntoOrigenSpecs {

    private PuntoOrigenSpecs() {
    }

    public static Specification<PuntoOrigen> withFilters(String search, Boolean activo) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(cb.coalesce(root.get("nombrePuntoOrigen"), "")), pattern));
            }
            if (activo != null) {
                predicates.add(cb.equal(root.get("activo"), activo));
            }
            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
