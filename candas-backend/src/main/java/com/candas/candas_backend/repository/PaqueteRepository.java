package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.Paquete;
import com.candas.candas_backend.entity.enums.EstadoPaquete;
import com.candas.candas_backend.entity.enums.TipoPaquete;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaqueteRepository extends JpaRepository<Paquete, Long>, JpaSpecificationExecutor<Paquete> {
    @EntityGraph(attributePaths = { "puntoOrigen", "clienteRemitente", "clienteDestinatario", "agenciaDestino",
            "destinatarioDirecto", "loteRecepcion", "paqueteSacas", "paqueteSacas.saca", "paqueteSacas.saca.despacho", "paquetePadre" })
    java.util.Optional<Paquete> findByNumeroGuia(String numeroGuia);

    @EntityGraph(attributePaths = { "puntoOrigen", "clienteRemitente", "clienteDestinatario", "agenciaDestino",
            "destinatarioDirecto", "loteRecepcion", "paqueteSacas", "paqueteSacas.saca", "paqueteSacas.saca.despacho", "paqueteSacas.saca.despacho.agencia",
            "paqueteSacas.saca.despacho.destinatarioDirecto", "paquetePadre" })
    @Query("SELECT p FROM Paquete p WHERE LOWER(p.numeroGuia) = LOWER(:numeroGuia)")
    java.util.Optional<Paquete> findByNumeroGuiaIgnoreCase(@Param("numeroGuia") String numeroGuia);

    @EntityGraph(attributePaths = { "puntoOrigen", "clienteRemitente", "clienteDestinatario", "agenciaDestino",
            "destinatarioDirecto", "loteRecepcion", "paqueteSacas", "paqueteSacas.saca", "paqueteSacas.saca.despacho", "paqueteSacas.saca.despacho.agencia", "paqueteSacas.saca.despacho.destinatarioDirecto", "paquetePadre" })
    @Query("SELECT p FROM Paquete p WHERE p.paquetePadre.idPaquete = :idPaquetePadre")
    java.util.List<Paquete> findByPaquetePadreIdPaquete(@Param("idPaquetePadre") Long idPaquetePadre);

    /** Hijos de varios padres (batch); mismo EntityGraph que findByPaquetePadreIdPaquete para evitar N+1. */
    @EntityGraph(attributePaths = { "puntoOrigen", "clienteRemitente", "clienteDestinatario", "agenciaDestino",
            "destinatarioDirecto", "loteRecepcion", "paqueteSacas", "paqueteSacas.saca", "paqueteSacas.saca.despacho", "paqueteSacas.saca.despacho.agencia", "paqueteSacas.saca.despacho.destinatarioDirecto", "paquetePadre" })
    @Query("SELECT p FROM Paquete p WHERE p.paquetePadre.idPaquete IN :idPaquetePadres")
    java.util.List<Paquete> findByPaquetePadreIdPaqueteIn(@Param("idPaquetePadres") List<Long> idPaquetePadres);

    /**
     * Listado paginado: sin {@code paqueteSacas} en el EntityGraph para que Hibernate
     * aplique LIMIT/OFFSET en SQL (HHH90003004 si se combina paginación con fetch de colección).
     * Las sacas se cargan en batch vía {@code @BatchSize} en la entidad.
     */
    @Override
    @EntityGraph(attributePaths = { "puntoOrigen", "clienteRemitente", "clienteDestinatario", "agenciaDestino",
            "destinatarioDirecto", "loteRecepcion", "paquetePadre" })
    Page<Paquete> findAll(Pageable pageable);

    @EntityGraph(attributePaths = { "puntoOrigen", "clienteRemitente", "clienteDestinatario", "agenciaDestino",
            "destinatarioDirecto", "loteRecepcion", "paquetePadre" })
    Page<Paquete> findByNumeroGuiaContainingIgnoreCase(String numeroGuia, Pageable pageable);

    /** Lista paginada con filtros opcionales: búsqueda por guía, estado, tipo, agencia destino, lote y rango de fechaRegistro. Parámetros null = sin filtrar. */
    @EntityGraph(attributePaths = { "puntoOrigen", "clienteRemitente", "clienteDestinatario", "agenciaDestino",
            "destinatarioDirecto", "loteRecepcion", "paquetePadre" })
    @Query("SELECT p FROM Paquete p WHERE "
            + "(:search IS NULL OR :search = '' OR LOWER(p.numeroGuia) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(COALESCE(p.ref, '')) LIKE LOWER(CONCAT('%', :search, '%'))) AND "
            + "(:estado IS NULL OR p.estado = :estado) AND "
            + "(:tipo IS NULL OR p.tipoPaquete = :tipo) AND "
            + "(:idAgencia IS NULL OR (p.agenciaDestino IS NOT NULL AND p.agenciaDestino.idAgencia = :idAgencia)) AND "
            + "(:idLote IS NULL OR (p.loteRecepcion IS NOT NULL AND p.loteRecepcion.idLoteRecepcion = :idLote)) AND "
            + "(CAST(:fechaDesde AS timestamp) IS NULL OR p.fechaRegistro >= :fechaDesde) AND "
            + "(CAST(:fechaHasta AS timestamp) IS NULL OR p.fechaRegistro <= :fechaHasta)")
    Page<Paquete> findAllFiltered(@Param("search") String search, @Param("estado") EstadoPaquete estado,
            @Param("tipo") TipoPaquete tipo,
            @Param("idAgencia") Long idAgencia,
            @Param("idLote") Long idLote,
            @Param("fechaDesde") java.time.LocalDateTime fechaDesde,
            @Param("fechaHasta") java.time.LocalDateTime fechaHasta,
            Pageable pageable);

    @Override
    @EntityGraph(attributePaths = { "puntoOrigen", "clienteRemitente", "clienteDestinatario", "agenciaDestino",
            "destinatarioDirecto", "loteRecepcion", "paqueteSacas", "paqueteSacas.saca", "paqueteSacas.saca.despacho", "paquetePadre" })
    java.util.Optional<Paquete> findById(Long id);

    /** Para alcance atención: agencia destino y agencia del lote de recepción. */
    @EntityGraph(attributePaths = { "agenciaDestino", "loteRecepcion", "loteRecepcion.agencia" })
    @Query("SELECT p FROM Paquete p WHERE p.idPaquete = :id")
    java.util.Optional<Paquete> findByIdWithAlcanceAtencion(@Param("id") Long id);

    // Consultas para ensacado
    @EntityGraph(attributePaths = { "paqueteSacas", "paqueteSacas.saca", "paqueteSacas.saca.despacho", "clienteDestinatario", "agenciaDestino",
            "destinatarioDirecto" })
    @Query("SELECT p FROM Paquete p JOIN p.paqueteSacas ps WHERE ps.saca.idSaca = :idSaca")
    List<Paquete> findBySacaIdSaca(@Param("idSaca") Long idSaca);

    /** Paquetes de una saca ordenados por orden_en_saca (orden tipiado); nulls al final, luego por id. */
    @EntityGraph(attributePaths = { "paqueteSacas", "paqueteSacas.saca", "paqueteSacas.saca.despacho", "clienteDestinatario", "agenciaDestino",
            "destinatarioDirecto" })
    @Query("SELECT p FROM Paquete p JOIN p.paqueteSacas ps WHERE ps.saca.idSaca = :idSaca ORDER BY COALESCE(ps.ordenEnSaca, 999999) ASC, p.idPaquete ASC")
    List<Paquete> findBySacaIdSacaOrderByOrdenEnSacaAsc(@Param("idSaca") Long idSaca);

    @EntityGraph(attributePaths = { "paqueteSacas", "paqueteSacas.saca", "paqueteSacas.saca.despacho", "clienteDestinatario", "agenciaDestino",
            "destinatarioDirecto" })
    @Query("SELECT p FROM Paquete p JOIN p.paqueteSacas ps WHERE ps.saca.despacho.idDespacho = :idDespacho")
    List<Paquete> findBySacaDespachoIdDespacho(@Param("idDespacho") Long idDespacho);

    @EntityGraph(attributePaths = { "paqueteSacas", "paqueteSacas.saca", "paqueteSacas.saca.despacho", "clienteDestinatario", "agenciaDestino",
            "destinatarioDirecto" })
    @Query("SELECT p FROM Paquete p JOIN p.paqueteSacas ps WHERE ps.saca.despacho.idDespacho = :idDespacho AND p.estado = :estado")
    List<Paquete> findBySacaDespachoIdDespachoAndEstado(@Param("idDespacho") Long idDespacho,
            @Param("estado") EstadoPaquete estado);

    @EntityGraph(attributePaths = { "paqueteSacas", "paqueteSacas.saca", "paqueteSacas.saca.despacho", "clienteDestinatario", "agenciaDestino",
            "destinatarioDirecto" })
    @Query("SELECT p FROM Paquete p JOIN p.paqueteSacas ps WHERE ps.saca.idSaca = :idSaca AND p.estado = :estado")
    List<Paquete> findBySacaIdSacaAndEstado(@Param("idSaca") Long idSaca, @Param("estado") EstadoPaquete estado);

    // Buscar paquetes por múltiples números de guía
    @EntityGraph(attributePaths = { "loteRecepcion" })
    @Query("SELECT p FROM Paquete p WHERE p.numeroGuia IN :numerosGuia")
    List<Paquete> findByNumeroGuiaIn(@Param("numerosGuia") List<String> numerosGuia);

    // Verificar qué paquetes CLEMENTINA tienen hijos (batch)
    @Query("SELECT DISTINCT p.idPaquete FROM Paquete p WHERE p.idPaquete IN :ids AND p.tipoPaquete = 'CLEMENTINA' AND EXISTS (SELECT 1 FROM Paquete h WHERE h.paquetePadre.idPaquete = p.idPaquete)")
    List<Long> findClementinaConHijos(@Param("ids") List<Long> ids);

    // Obtener paquetes de un lote de recepción con todas las relaciones necesarias,
    // incluyendo paquetePadre
    @EntityGraph(attributePaths = { "puntoOrigen", "clienteRemitente", "clienteDestinatario", "agenciaDestino",
            "destinatarioDirecto", "loteRecepcion", "paqueteSacas", "paqueteSacas.saca", "paqueteSacas.saca.despacho", "paqueteSacas.saca.despacho.agencia", "paqueteSacas.saca.despacho.destinatarioDirecto", "paquetePadre" })
    @Query("SELECT p FROM Paquete p WHERE p.loteRecepcion.idLoteRecepcion = :idLoteRecepcion")
    List<Paquete> findByLoteRecepcionIdLoteRecepcion(@Param("idLoteRecepcion") Long idLoteRecepcion);

    // Listas etiquetadas: paquetes con ref (GEO, MIA, VARIAS, etc.)
    @EntityGraph(attributePaths = { "loteRecepcion" })
    List<Paquete> findByRef(String ref);

    @EntityGraph(attributePaths = { "loteRecepcion" })
    @Query("SELECT p FROM Paquete p WHERE p.ref IS NOT NULL ORDER BY p.numeroGuia")
    List<Paquete> findAllListasEtiquetadas();
}
