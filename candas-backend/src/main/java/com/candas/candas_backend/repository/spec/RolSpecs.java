package com.candas.candas_backend.repository.spec;

import com.candas.candas_backend.entity.Rol;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Specifications para filtrado opcional del listado de roles (search por nombre/descripción, activo).
 */
public final class RolSpecs {

    private RolSpecs() {
    }

    public static Specification<Rol> withFilters(String search, Boolean activo) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(cb.coalesce(root.get("nombre"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("descripcion"), "")), pattern)
                ));
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
