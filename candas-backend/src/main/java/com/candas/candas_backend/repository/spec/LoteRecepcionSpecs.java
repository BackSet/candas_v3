package com.candas.candas_backend.repository.spec;

import com.candas.candas_backend.entity.LoteRecepcion;
import com.candas.candas_backend.entity.enums.TipoLote;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Specifications para filtrado opcional del listado de lotes de recepción.
 * Soporta search (numeroRecepcion / usuario), tipoLote, agencia (filtro adicional o restricción de seguridad)
 * y rango de fechaRecepcion.
 */
public final class LoteRecepcionSpecs {

    private LoteRecepcionSpecs() {
    }

    /** Versión legacy con solo idAgenciaRestringida (mantener para no romper consumidores). */
    public static Specification<LoteRecepcion> withFilters(String search, TipoLote tipoLote, Long idAgenciaRestringida) {
        return withFilters(search, tipoLote, null, null, null, idAgenciaRestringida);
    }

    public static Specification<LoteRecepcion> withFilters(
            String search,
            TipoLote tipoLote,
            Long idAgencia,
            LocalDateTime fechaDesde,
            LocalDateTime fechaHasta,
            Long idAgenciaRestringida) {
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
            if (idAgencia != null) {
                predicates.add(cb.equal(root.get("agencia").get("idAgencia"), idAgencia));
            }
            if (fechaDesde != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("fechaRecepcion"), fechaDesde));
            }
            if (fechaHasta != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("fechaRecepcion"), fechaHasta));
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
