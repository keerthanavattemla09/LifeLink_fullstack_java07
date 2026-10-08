package com.lifelink.repository;
import com.lifelink.model.OrganRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface OrganRequestRepository extends JpaRepository<OrganRequest,Long>{
    List<OrganRequest> findByUserIdOrderByIdDesc(Long userId);
    long countByUserId(Long userId);
}
