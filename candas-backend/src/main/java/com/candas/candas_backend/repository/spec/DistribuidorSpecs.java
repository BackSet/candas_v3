package com.candas.candas_backend.repository.spec;

import com.candas.candas_backend.entity.Distribuidor;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Specifications para filtrado opcional del listado de distribuidores (search por nombre/código/email, activa).
 */
public final class DistribuidorSpecs {

    private DistribuidorSpecs() {
    }

    public static Specification<Distribuidor> withFilters(String search, Boolean activa) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(cb.coalesce(root.get("nombre"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("codigo"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("email"), "")), pattern)
                ));
            }
            if (activa != null) {
                predicates.add(cb.equal(root.get("activa"), activa));
            }
            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
