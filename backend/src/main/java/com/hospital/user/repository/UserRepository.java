package com.hospital.user.repository;

import com.hospital.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Optional<User> findByUsername(String username);

    @Query("SELECT u FROM User u JOIN FETCH u.role WHERE u.username = :username")
    Optional<User> findByUsernameWithRoleFetched(@Param("username") String username);

    @Query(
            """
            SELECT u FROM User u JOIN FETCH u.role
            WHERE u.role.name = :roleName AND UPPER(u.state) = 'ACTIVO'
            """)
    List<User> findActiveByRoleName(@Param("roleName") String roleName);
}
