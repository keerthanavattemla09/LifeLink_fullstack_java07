package com.lifelink.repository;
import com.lifelink.model.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
public interface HospitalRepository extends JpaRepository<Hospital,Long>{}
