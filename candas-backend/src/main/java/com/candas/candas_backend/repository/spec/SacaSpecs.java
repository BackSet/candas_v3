package com.candas.candas_backend.repository.spec;

import com.candas.candas_backend.entity.Agencia;
import com.candas.candas_backend.entity.Despacho;
import com.candas.candas_backend.entity.Saca;
import com.candas.candas_backend.entity.Usuario;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

/**
 * Sacas cuyo despacho asociado fue registrado por un usuario de la agencia indicada.
 */
public final class SacaSpecs {

    private SacaSpecs() {
    }

    public static Specification<Saca> despachoRegistradorEnAgencia(Long idAgenciaRestringida) {
        return (root, query, cb) -> {
            Join<Saca, Despacho> despachoJoin = root.join("despacho", JoinType.INNER);
            Subquery<Integer> sq = query.subquery(Integer.class);
            Root<Usuario> u = sq.from(Usuario.class);
            sq.select(cb.literal(1));
            Join<Usuario, Agencia> ag = u.join("agencia", JoinType.INNER);
            sq.where(
                    cb.equal(u.get("username"), despachoJoin.get("usuarioRegistro")),
                    cb.equal(ag.get("idAgencia"), idAgenciaRestringida)
            );
            return cb.exists(sq);
        };
    }
}
