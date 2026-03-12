package com.candas.candas_backend.config;

import com.candas.candas_backend.entity.*;
import com.candas.candas_backend.repository.*;
import com.candas.candas_backend.util.PermissionConstants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.Optional;

@Component
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final PermisoRepository permisoRepository;
    private final RolRepository rolRepository;
    private final RolPermisoRepository rolPermisoRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioRolRepository usuarioRolRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            PermisoRepository permisoRepository,
            RolRepository rolRepository,
            RolPermisoRepository rolPermisoRepository,
            UsuarioRepository usuarioRepository,
            UsuarioRolRepository usuarioRolRepository,
            PasswordEncoder passwordEncoder) {
        this.permisoRepository = permisoRepository;
        this.rolRepository = rolRepository;
        this.rolPermisoRepository = rolPermisoRepository;
        this.usuarioRepository = usuarioRepository;
        this.usuarioRolRepository = usuarioRolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Iniciando DataInitializer...");

        // 1. Inicializar Permisos
        initializePermissions();

        // 2. Inicializar Roles
        Rol rolAdmin = initializeRole("ADMIN", "Administrador del sistema - Acceso total");
        rolRepository.findByNombre("OPERARIO")
                .orElseThrow(() -> new RuntimeException("Error: Rol OPERARIO no encontrado."));

        // 3. Asignar todos los permisos al rol ADMIN
        assignAllPermissionsToRole(rolAdmin);

        // 4. Crear usuario ADMIN por defecto
        initializeAdminUser(rolAdmin);

        log.info("DataInitializer completado.");
    }

    private void initializePermissions() {
        Field[] fields = PermissionConstants.class.getDeclaredFields();
        for (Field field : fields) {
            try {
                if (field.getType().equals(String.class)) {
                    String permissionName = (String) field.get(null);
                    createPermisoIfNotFound(permissionName);
                }
            } catch (IllegalAccessException e) {
                log.error("Error al acceder al campo de permiso: {}", field.getName(), e);
            }
        }
    }

    private void createPermisoIfNotFound(String nombre) {
        if (!permisoRepository.existsByNombre(nombre)) {
            Permiso permiso = new Permiso();
            permiso.setNombre(nombre);

            // Intentar inferir recurso y acción del nombre (ej: "paquetes:ver")
            String[] parts = nombre.split(":");
            if (parts.length == 2) {
                permiso.setRecurso(parts[0]);
                permiso.setAccion(parts[1]);
                permiso.setDescripcion("Permiso para " + parts[1] + " en " + parts[0]);
            } else {
                permiso.setDescripcion("Permiso " + nombre);
            }

            permisoRepository.save(permiso);
            log.info("Permiso creado: {}", nombre);
        }
    }

    private Rol initializeRole(String nombre, String descripcion) {
        Optional<Rol> rolOpt = rolRepository.findByNombre(nombre);
        if (rolOpt.isPresent()) {
            return rolOpt.get();
        }

        Rol rol = new Rol();
        rol.setNombre(nombre);
        rol.setDescripcion(descripcion);
        rol.setActivo(true);
        rol.setFechaCreacion(LocalDateTime.now());
        rol = rolRepository.save(rol);
        log.info("Rol creado: {}", nombre);
        return rol;
    }

    private void assignAllPermissionsToRole(Rol rol) {
        // Obtener todos los permisos actuales en BD (que acabamos de asegurar que
        // existen)
        java.util.List<Permiso> allPermissions = permisoRepository.findAll();

        for (Permiso permiso : allPermissions) {
            if (!rolPermisoRepository.existsByRolIdRolAndPermisoIdPermiso(rol.getIdRol(), permiso.getIdPermiso())) {
                RolPermiso rolPermiso = new RolPermiso();
                rolPermiso.setRol(rol);
                rolPermiso.setPermiso(permiso);
                rolPermiso.setFechaAsignacion(LocalDateTime.now());
                rolPermisoRepository.save(rolPermiso);
            }
        }
        log.info("Todos los permisos asignados al rol {}", rol.getNombre());
    }

    private void initializeAdminUser(Rol rolAdmin) {
        if (!usuarioRepository.existsByUsername("admin")) {
            Usuario admin = new Usuario();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123")); // Contraseña por defecto
            admin.setEmail("admin@candas.com");
            admin.setNombreCompleto("Administrador del Sistema");
            admin.setActivo(true);
            admin.setCuentaNoExpirada(true);
            admin.setCuentaNoBloqueada(true);
            admin.setCredencialesNoExpiradas(true);
            admin.setFechaRegistro(LocalDateTime.now());

            admin = usuarioRepository.save(admin);

            // Asignar rol ADMIN
            UsuarioRol usuarioRol = new UsuarioRol();
            usuarioRol.setUsuario(admin);
            usuarioRol.setRol(rolAdmin);
            usuarioRol.setActivo(true);
            usuarioRol.setFechaAsignacion(LocalDateTime.now());
            usuarioRolRepository.save(usuarioRol);

            log.info("Usuario ADMIN creado por defecto con contraseña 'admin123'");
        }
    }
}
