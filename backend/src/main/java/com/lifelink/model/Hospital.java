package com.lifelink.model;

import jakarta.persistence.*;

@Entity
@Table(name="hospitals")
public class Hospital {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String city;
    private String phone;
    private Double lat;
    private Double lng;

    public Hospital() {}
    public Hospital(String name,String city,String phone,Double lat,Double lng){
        this.name=name;this.city=city;this.phone=phone;this.lat=lat;this.lng=lng;
    }
    public Long getId(){return id;}
    public String getName(){return name;}
    public String getCity(){return city;}
    public String getPhone(){return phone;}
    public Double getLat(){return lat;}
    public Double getLng(){return lng;}
    public void setId(Long v){id=v;}
    public void setName(String v){name=v;}
    public void setCity(String v){city=v;}
    public void setPhone(String v){phone=v;}
    public void setLat(Double v){lat=v;}
    public void setLng(Double v){lng=v;}
}
