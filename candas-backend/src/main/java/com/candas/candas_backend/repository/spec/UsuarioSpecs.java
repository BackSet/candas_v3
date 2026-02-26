package com.candas.candas_backend.repository.spec;

import com.candas.candas_backend.entity.Usuario;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

/**
 * Specifications para filtrado opcional del listado de usuarios (search unificado o username, email, activo).
 */
public final class UsuarioSpecs {

    private UsuarioSpecs() {
    }

    public static Specification<Usuario> withFilters(String search, String username, String email, Boolean activo) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("username")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern),
                    cb.like(cb.lower(root.get("nombreCompleto")), pattern)
                ));
            } else {
                if (username != null && !username.isBlank()) {
                    predicates.add(cb.like(cb.lower(root.get("username")), "%" + username.trim().toLowerCase() + "%"));
                }
                if (email != null && !email.isBlank()) {
                    predicates.add(cb.like(cb.lower(root.get("email")), "%" + email.trim().toLowerCase() + "%"));
                }
                if (activo != null) {
                    predicates.add(cb.equal(root.get("activo"), activo));
                }
            }
            return predicates.isEmpty() ? null : cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
