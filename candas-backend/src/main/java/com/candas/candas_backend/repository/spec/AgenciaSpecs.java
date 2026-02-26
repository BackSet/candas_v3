package com.candas.candas_backend.repository.spec;

import com.candas.candas_backend.entity.Agencia;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

/**
 * Specifications para filtrado opcional del listado de agencias (search unificado o nombre, codigo, activo).
 */
public final class AgenciaSpecs {

    private AgenciaSpecs() {
    }

    public static Specification<Agencia> withFilters(String search, String nombre, String codigo, Boolean activo) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("nombre")), pattern),
                    cb.like(cb.lower(root.get("codigo")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern),
                    cb.like(cb.lower(root.get("canton")), pattern)
                ));
            } else {
                if (nombre != null && !nombre.isBlank()) {
                    predicates.add(cb.like(cb.lower(root.get("nombre")), "%" + nombre.trim().toLowerCase() + "%"));
                }
                if (codigo != null && !codigo.isBlank()) {
                    predicates.add(cb.like(cb.lower(root.get("codigo")), "%" + codigo.trim().toLowerCase() + "%"));
                }
                if (activo != null) {
                    predicates.add(cb.equal(root.get("activa"), activo));
                }
            }
            return predicates.isEmpty() ? null : cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
