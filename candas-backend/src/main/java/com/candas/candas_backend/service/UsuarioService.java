package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.UsuarioDTO;
import com.candas.candas_backend.dto.PerfilUsuarioUpdateDTO;
import com.candas.candas_backend.entity.*;
import com.candas.candas_backend.exception.BadRequestException;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.*;
import com.candas.candas_backend.repository.spec.UsuarioSpecs;
import org.hibernate.Hibernate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final AgenciaRepository agenciaRepository;
    private final RolRepository rolRepository;
    private final UsuarioRolRepository usuarioRolRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            ClienteRepository clienteRepository,
            AgenciaRepository agenciaRepository,
            RolRepository rolRepository,
            UsuarioRolRepository usuarioRolRepository,
            PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.agenciaRepository = agenciaRepository;
        this.rolRepository = rolRepository;
        this.usuarioRolRepository = usuarioRolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Page<UsuarioDTO> findAll(Pageable pageable, String search, String username, String email, Boolean activo) {
        var spec = UsuarioSpecs.withFilters(search, username, email, activo);
        if (spec == null) {
            return usuarioRepository.findAll(pageable).map(this::toDTO);
        }
        return usuarioRepository.findAll(spec, pageable).map(this::toDTO);
    }

    public UsuarioDTO findById(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
        return toDTO(usuario);
    }

    public List<UsuarioDTO> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        List<Long> ids = usuarioRepository.searchIds(query.trim());
        if (ids.isEmpty()) {
            return List.of();
        }
        List<Usuario> usuarios = usuarioRepository.findAllById(ids);
        // Inicializar relaciones lazy manualmente para evitar problemas
        for (Usuario usuario : usuarios) {
            Hibernate.initialize(usuario.getUsuarioRoles());
            if (usuario.getUsuarioRoles() != null) {
                usuario.getUsuarioRoles().forEach(ur -> {
                    Hibernate.initialize(ur.getRol());
                });
            }
        }
        return usuarios.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public UsuarioDTO create(UsuarioDTO dto) {
        if (usuarioRepository.existsByUsername(dto.getUsername())) {
            throw new BadRequestException("El username ya existe");
        }
        if (usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("El email ya existe");
        }
        
        Usuario usuario = toEntity(dto);
        usuario.setFechaRegistro(LocalDateTime.now());
        usuario.setActivo(true);
        usuario.setCuentaNoExpirada(true);
        usuario.setCuentaNoBloqueada(true);
        usuario.setCredencialesNoExpiradas(true);
        
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        } else {
            throw new BadRequestException("La contraseña es obligatoria");
        }
        
        Usuario saved = usuarioRepository.save(usuario);
        
        // Asignar roles si se proporcionan
        if (dto.getRoles() != null && !dto.getRoles().isEmpty()) {
            asignarRoles(saved.getIdUsuario(), dto.getRoles());
        }
        
        return toDTO(saved);
    }

    public UsuarioDTO update(Long id, UsuarioDTO dto) {
        Usuario usuario = usuarioRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));

        if (dto.getUsername() != null && !dto.getUsername().isBlank()) {
            String username = dto.getUsername().trim();
            if (!username.equals(usuario.getUsername()) && usuarioRepository.existsByUsername(username)) {
                throw new BadRequestException("El username ya existe");
            }
            usuario.setUsername(username);
        }
        
        if (dto.getEmail() != null && !dto.getEmail().equals(usuario.getEmail())) {
            if (usuarioRepository.existsByEmail(dto.getEmail())) {
                throw new BadRequestException("El email ya existe");
            }
            usuario.setEmail(dto.getEmail().trim());
        }
        
        if (dto.getNombreCompleto() != null && !dto.getNombreCompleto().isBlank()) {
            usuario.setNombreCompleto(dto.getNombreCompleto().trim());
        }
        if (dto.getActivo() != null) usuario.setActivo(dto.getActivo());
        if (dto.getCuentaNoExpirada() != null) usuario.setCuentaNoExpirada(dto.getCuentaNoExpirada());
        if (dto.getCuentaNoBloqueada() != null) usuario.setCuentaNoBloqueada(dto.getCuentaNoBloqueada());
        if (dto.getCredencialesNoExpiradas() != null) usuario.setCredencialesNoExpiradas(dto.getCredencialesNoExpiradas());
        
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        
        if (dto.getIdCliente() != null) {
            usuario.setCliente(clienteRepository.findById(dto.getIdCliente())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", dto.getIdCliente())));
        } else {
            usuario.setCliente(null);
        }
        
        if (dto.getIdAgencia() != null) {
            usuario.setAgencia(agenciaRepository.findById(dto.getIdAgencia())
                .orElseThrow(() -> new ResourceNotFoundException("Agencia", dto.getIdAgencia())));
        } else {
            usuario.setAgencia(null);
        }
        aplicarAgenciasMultiples(usuario, dto.getIdAgencias(), dto.getIdAgencia());
        
        return toDTO(usuarioRepository.save(usuario));
    }

    public Usuario actualizarPerfilPropio(String usernameActual, PerfilUsuarioUpdateDTO dto) {
        Usuario usuario = usuarioRepository.findByUsername(usernameActual)
                .orElseThrow(() -> new BadRequestException("Usuario autenticado no encontrado"));

        String nuevoUsername = dto.getUsername().trim();
        if (!nuevoUsername.equals(usuario.getUsername()) && usuarioRepository.existsByUsername(nuevoUsername)) {
            throw new BadRequestException("El username ya existe");
        }

        String nuevoEmail = dto.getEmail().trim();
        if (!nuevoEmail.equals(usuario.getEmail()) && usuarioRepository.existsByEmail(nuevoEmail)) {
            throw new BadRequestException("El email ya existe");
        }

        usuario.setUsername(nuevoUsername);
        usuario.setEmail(nuevoEmail);
        usuario.setNombreCompleto(dto.getNombreCompleto().trim());

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        return usuarioRepository.save(usuario);
    }

    public void delete(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
    }

    public void asignarRoles(Long idUsuario, List<Long> idRoles) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario", idUsuario));
        
        // Desactivar roles actuales
        usuarioRolRepository.findByUsuarioIdUsuario(idUsuario).forEach(ur -> {
            ur.setActivo(false);
            usuarioRolRepository.save(ur);
        });
        
        // Asignar nuevos roles
        for (Long idRol : idRoles) {
            Rol rol = rolRepository.findById(idRol)
                .orElseThrow(() -> new ResourceNotFoundException("Rol", idRol));
            
            UsuarioRol usuarioRol = usuarioRolRepository
                .findByUsuarioIdUsuarioAndRolIdRol(idUsuario, idRol)
                .orElse(new UsuarioRol());
            
            usuarioRol.setUsuario(usuario);
            usuarioRol.setRol(rol);
            usuarioRol.setFechaAsignacion(LocalDateTime.now());
            usuarioRol.setActivo(true);
            usuarioRolRepository.save(usuarioRol);
        }
    }

    public List<Long> obtenerRoles(Long idUsuario) {
        return usuarioRolRepository.findByUsuarioIdUsuarioAndActivoTrue(idUsuario)
            .stream()
            .map(ur -> ur.getRol().getIdRol())
            .collect(Collectors.toList());
    }

    public List<Long> obtenerAgencias(Long idUsuario) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", idUsuario));
        Set<Long> ids = new HashSet<>();
        if (usuario.getAgencias() != null) {
            usuario.getAgencias().stream()
                    .map(Agencia::getIdAgencia)
                    .forEach(ids::add);
        }
        if (usuario.getAgencia() != null) {
            ids.add(usuario.getAgencia().getIdAgencia());
        }
        return ids.stream().toList();
    }

    public void asignarAgencias(Long idUsuario, List<Long> idAgencias) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", idUsuario));
        aplicarAgenciasMultiples(
                usuario,
                idAgencias,
                usuario.getAgencia() != null ? usuario.getAgencia().getIdAgencia() : null
        );
        usuarioRepository.save(usuario);
    }

    private UsuarioDTO toDTO(Usuario usuario) {
        UsuarioDTO dto = new UsuarioDTO();
        dto.setIdUsuario(usuario.getIdUsuario());
        dto.setUsername(usuario.getUsername());
        dto.setEmail(usuario.getEmail());
        dto.setNombreCompleto(usuario.getNombreCompleto());
        dto.setActivo(usuario.getActivo());
        dto.setCuentaNoExpirada(usuario.getCuentaNoExpirada());
        dto.setCuentaNoBloqueada(usuario.getCuentaNoBloqueada());
        dto.setCredencialesNoExpiradas(usuario.getCredencialesNoExpiradas());
        dto.setFechaRegistro(usuario.getFechaRegistro());
        dto.setUltimoAcceso(usuario.getUltimoAcceso());
        if (usuario.getCliente() != null) {
            dto.setIdCliente(usuario.getCliente().getIdCliente());
        }
        if (usuario.getAgencia() != null) {
            dto.setIdAgencia(usuario.getAgencia().getIdAgencia());
        }
        Set<Long> agencias = new HashSet<>();
        if (usuario.getAgencias() != null) {
            usuario.getAgencias().stream().map(Agencia::getIdAgencia).forEach(agencias::add);
        }
        if (usuario.getAgencia() != null) {
            agencias.add(usuario.getAgencia().getIdAgencia());
        }
        dto.setIdAgencias(new ArrayList<>(agencias));
        dto.setRoles(obtenerRoles(usuario.getIdUsuario()));
        return dto;
    }

    private Usuario toEntity(UsuarioDTO dto) {
        Usuario usuario = new Usuario();
        usuario.setUsername(dto.getUsername());
        usuario.setEmail(dto.getEmail());
        usuario.setNombreCompleto(dto.getNombreCompleto());
        if (dto.getIdCliente() != null) {
            usuario.setCliente(clienteRepository.findById(dto.getIdCliente())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", dto.getIdCliente())));
        }
        if (dto.getIdAgencia() != null) {
            usuario.setAgencia(agenciaRepository.findById(dto.getIdAgencia())
                .orElseThrow(() -> new ResourceNotFoundException("Agencia", dto.getIdAgencia())));
        }
        aplicarAgenciasMultiples(usuario, dto.getIdAgencias(), dto.getIdAgencia());
        return usuario;
    }

    private void aplicarAgenciasMultiples(Usuario usuario, List<Long> idAgencias, Long idAgenciaLegacy) {
        Set<Long> ids = new HashSet<>();
        if (idAgencias != null) {
            ids.addAll(idAgencias);
        }
        if (idAgenciaLegacy != null) {
            ids.add(idAgenciaLegacy);
        }
        if (ids.isEmpty()) {
            usuario.setAgencias(Set.of());
            usuario.setAgencia(null);
            return;
        }
        List<Agencia> agencias = ids.stream()
                .map(id -> agenciaRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Agencia", id)))
                .toList();
        usuario.setAgencias(new LinkedHashSet<>(agencias));
        usuario.setAgencia(agencias.get(0));
    }
}
