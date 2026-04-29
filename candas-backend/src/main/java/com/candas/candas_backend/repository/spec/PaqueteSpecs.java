package com.candas.candas_backend.repository.spec;

import com.candas.candas_backend.entity.Paquete;
import com.candas.candas_backend.entity.enums.EstadoPaquete;
import com.candas.candas_backend.entity.enums.TipoPaquete;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Specifications para filtrado opcional del listado de paquetes.
 * 
 * Filtros de fecha optimizados:
 * - Si solo hay fechaDesde: fechaRegistro >= fechaDesde (desde esa fecha en adelante)
 * - Si solo hay fechaHasta: fechaRegistro <= fechaHasta (hasta esa fecha)
 * - Si hay ambos: rango completo
 * 
 * Usa JpaSpecificationExecutor para evitar problemas con parámetros null en JPQL.
 */
public final class PaqueteSpecs {

    private PaqueteSpecs() {
    }

    public static Specification<Paquete> withFilters(
            String search,
            EstadoPaquete estado,
            TipoPaquete tipo,
            Long idAgencia,
            Long idLote,
            LocalDateTime fechaDesde,
            LocalDateTime fechaHasta) {
        return (Root<Paquete> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Filtro de búsqueda por número de guía o REF
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("numeroGuia")), pattern),
                        cb.like(cb.lower(root.get("ref")), pattern)
                ));
            }

            // Filtro por estado
            if (estado != null) {
                predicates.add(cb.equal(root.get("estado"), estado));
            }

            // Filtro por tipo
            if (tipo != null) {
                predicates.add(cb.equal(root.get("tipoPaquete"), tipo));
            }

            // Filtro por agencia destino
            if (idAgencia != null) {
                predicates.add(cb.equal(
                        root.join("agenciaDestino", JoinType.LEFT).get("idAgencia"),
                        idAgencia
                ));
            }

            // Filtro por lote de recepción
            if (idLote != null) {
                predicates.add(cb.equal(
                        root.join("loteRecepcion", JoinType.LEFT).get("idLoteRecepcion"),
                        idLote
                ));
            }

            // Filtro de fecha optimizado: soporte para rangos parciales
            if (fechaDesde != null && fechaHasta != null) {
                predicates.add(cb.between(root.get("fechaRegistro"), fechaDesde, fechaHasta));
            } else if (fechaDesde != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("fechaRegistro"), fechaDesde));
            } else if (fechaHasta != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("fechaRegistro"), fechaHasta));
            }

            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}