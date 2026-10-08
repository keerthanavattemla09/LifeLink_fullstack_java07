package com.lifelink.model;

import jakarta.persistence.*;

@Entity
@Table(name="organs")
public class Organ {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    private String organType;
    private String bloodGroup;
    private Integer quantity;
    private String status;

    @ManyToOne(optional=false)
    private Hospital hospital;

    public Organ() {}
    public Organ(String organType,String bloodGroup,Integer quantity,String status,Hospital hospital){
        this.organType=organType;this.bloodGroup=bloodGroup;this.quantity=quantity;
        this.status=status;this.hospital=hospital;
    }
    public Long getId(){return id;}
    public String getOrganType(){return organType;}
    public String getBloodGroup(){return bloodGroup;}
    public Integer getQuantity(){return quantity;}
    public String getStatus(){return status;}
    public Hospital getHospital(){return hospital;}
    public void setId(Long v){id=v;}
    public void setOrganType(String v){organType=v;}
    public void setBloodGroup(String v){bloodGroup=v;}
    public void setQuantity(Integer v){quantity=v;}
    public void setStatus(String v){status=v;}
    public void setHospital(Hospital v){hospital=v;}
}
