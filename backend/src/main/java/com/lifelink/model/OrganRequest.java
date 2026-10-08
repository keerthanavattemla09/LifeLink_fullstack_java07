package com.lifelink.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name="organ_requests")
public class OrganRequest {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional=false)
    private User user;

    @ManyToOne(optional=false)
    private Organ organ;

    @ManyToOne(optional=false)
    private Hospital hospital;

    private String status;
    private Double priorityScore;
    private LocalDateTime createdAt;

    public OrganRequest() {}
    public OrganRequest(User user,Organ organ,Hospital hospital,String status,Double priorityScore){
        this.user=user;this.organ=organ;this.hospital=hospital;
        this.status=status;this.priorityScore=priorityScore;
        this.createdAt=LocalDateTime.now();
    }
    @PrePersist
    void beforeSave(){ if(createdAt==null) createdAt=LocalDateTime.now(); }

    public Long getId(){return id;}
    public User getUser(){return user;}
    public Organ getOrgan(){return organ;}
    public Hospital getHospital(){return hospital;}
    public String getStatus(){return status;}
    public Double getPriorityScore(){return priorityScore;}
    public LocalDateTime getCreatedAt(){return createdAt;}
    public void setId(Long v){id=v;}
    public void setUser(User v){user=v;}
    public void setOrgan(Organ v){organ=v;}
    public void setHospital(Hospital v){hospital=v;}
    public void setStatus(String v){status=v;}
    public void setPriorityScore(Double v){priorityScore=v;}
    public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
