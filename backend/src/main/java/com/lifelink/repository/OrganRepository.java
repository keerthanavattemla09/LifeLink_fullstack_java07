package com.lifelink.repository;
import com.lifelink.model.Organ;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface OrganRepository extends JpaRepository<Organ,Long>{
    List<Organ> findByStatusAndQuantityGreaterThan(String status,Integer quantity);
    List<Organ> findByOrganTypeAndStatusAndQuantityGreaterThan(String organType,String status,Integer quantity);
}
