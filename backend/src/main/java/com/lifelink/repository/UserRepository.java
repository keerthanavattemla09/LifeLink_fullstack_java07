package com.lifelink.repository;
import com.lifelink.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface UserRepository extends JpaRepository<User,Long>{
    Optional<User> findByUsernameAndPasswordAndRole(String username,String password,String role);
}
