package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.ClienteDTO;
import com.candas.candas_backend.service.ClienteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.candas.candas_backend.util.PermissionConstants;

@RestController
@RequestMapping("/api/v1/clientes")
@Tag(name = "Clientes", description = "Endpoints para gestión de clientes")
@CrossOrigin(origins = "*")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @GetMapping
    @Operation(summary = "Listar clientes", description = "Obtiene una lista paginada de todos los clientes. Parámetros opcionales: search (texto en nombre/documento/email/etc.), nombre, documento, email, activo.")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.CLIENTES_LISTAR + "') or hasAuthority('" + PermissionConstants.CLIENTES_VER + "')")
    public ResponseEntity<Page<ClienteDTO>> findAll(
            Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String documento,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Boolean activo) {
        return ResponseEntity.ok(clienteService.findAll(pageable, search, nombre, documento, email, activo));
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar clientes", description = "Busca clientes por nombre, documento, email, teléfono o dirección")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.CLIENTES_VER + "')")
    public ResponseEntity<List<ClienteDTO>> search(@RequestParam String query) {
        return ResponseEntity.ok(clienteService.search(query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener cliente por ID", description = "Obtiene los detalles de un cliente específico")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.CLIENTES_VER + "')")
    public ResponseEntity<ClienteDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(clienteService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear cliente", description = "Crea un nuevo cliente")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.CLIENTES_CREAR + "')")
    public ResponseEntity<ClienteDTO> create(@Valid @RequestBody ClienteDTO dto) {
        return new ResponseEntity<>(clienteService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar cliente", description = "Actualiza la información de un cliente existente")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.CLIENTES_EDITAR + "')")
    public ResponseEntity<ClienteDTO> update(@PathVariable Long id, @Valid @RequestBody ClienteDTO dto) {
        return ResponseEntity.ok(clienteService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar cliente", description = "Elimina un cliente (soft delete)")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('" + PermissionConstants.CLIENTES_ELIMINAR + "')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        clienteService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
