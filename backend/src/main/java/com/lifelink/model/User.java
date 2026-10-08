package com.lifelink.model;

import jakarta.persistence.*;

@Entity
@Table(name="users")
public class User {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Column(unique=true, nullable=false)
    private String username;
    private String password;
    private String role;
    private String fullName;
    private String bloodGroup;
    private Integer age;
    private String requiredOrgan;

    public User() {}

    public User(String username, String password, String role, String fullName,
                String bloodGroup, Integer age, String requiredOrgan) {
        this.username=username; this.password=password; this.role=role;
        this.fullName=fullName; this.bloodGroup=bloodGroup; this.age=age;
        this.requiredOrgan=requiredOrgan;
    }

    public Long getId(){return id;}
    public String getUsername(){return username;}
    public String getPassword(){return password;}
    public String getRole(){return role;}
    public String getFullName(){return fullName;}
    public String getBloodGroup(){return bloodGroup;}
    public Integer getAge(){return age;}
    public String getRequiredOrgan(){return requiredOrgan;}

    public void setId(Long id){this.id=id;}
    public void setUsername(String v){this.username=v;}
    public void setPassword(String v){this.password=v;}
    public void setRole(String v){this.role=v;}
    public void setFullName(String v){this.fullName=v;}
    public void setBloodGroup(String v){this.bloodGroup=v;}
    public void setAge(Integer v){this.age=v;}
    public void setRequiredOrgan(String v){this.requiredOrgan=v;}
}
