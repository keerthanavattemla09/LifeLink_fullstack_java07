package com.lifelink.controller;

import com.lifelink.model.*;
import com.lifelink.repository.*;
import com.lifelink.service.MatchingService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
public class AppController {
    private final UserRepository users;
    private final HospitalRepository hospitals;
    private final OrganRepository organs;
    private final OrganRequestRepository requests;
    private final MatchingService matching;

    public AppController(UserRepository users,HospitalRepository hospitals,OrganRepository organs,
                         OrganRequestRepository requests,MatchingService matching){
        this.users=users;this.hospitals=hospitals;this.organs=organs;this.requests=requests;this.matching=matching;
    }

    private User currentUser(HttpSession s){
        Object id=s.getAttribute("userId");
        return id==null?null:users.findById((Long)id).orElse(null);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(HttpSession s){
        User u=currentUser(s);
        if(u==null) return ResponseEntity.status(401).build();
        long organCount=organs.findByStatusAndQuantityGreaterThan("Available",0)
                .stream().mapToLong(o->o.getQuantity()).sum();
        return ResponseEntity.ok(Map.of(
            "user",Map.of("fullName",u.getFullName(),"bloodGroup",u.getBloodGroup()==null?"-":u.getBloodGroup(),
                          "age",u.getAge()==null?0:u.getAge(),"requiredOrgan",u.getRequiredOrgan()==null?"-":u.getRequiredOrgan()),
            "availableOrgans",organCount,
            "hospitals",hospitals.count(),
            "requests",requests.countByUserId(u.getId())
        ));
    }

    @GetMapping("/organs")
    public ResponseEntity<?> organs(HttpSession s){
        if(currentUser(s)==null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(organs.findByStatusAndQuantityGreaterThan("Available",0));
    }

    @GetMapping("/matching")
    public ResponseEntity<?> matching(HttpSession s,@RequestParam(required=false) String organ){
        User u=currentUser(s);
        if(u==null) return ResponseEntity.status(401).build();
        String required=(organ==null||organ.isBlank())?u.getRequiredOrgan():organ;
        return ResponseEntity.ok(matching.rank(u,organs.findByOrganTypeAndStatusAndQuantityGreaterThan(required,"Available",0)));
    }

    @PostMapping("/requests/{organId}")
    public ResponseEntity<?> createRequest(@PathVariable Long organId,HttpSession s){
        User u=currentUser(s);
        if(u==null) return ResponseEntity.status(401).build();

        Organ o=organs.findById(organId).orElse(null);
        if(o==null || o.getQuantity()<=0) return ResponseEntity.badRequest().body(Map.of("message","Organ unavailable"));

        double score=matching.calculateScore(u,o);
        OrganRequest r=requests.save(new OrganRequest(u,o,o.getHospital(),"Pending",score));
        return ResponseEntity.ok(Map.of("id",r.getId(),"status",r.getStatus(),"score",r.getPriorityScore()));
    }

    @GetMapping("/requests")
    public ResponseEntity<?> myRequests(HttpSession s){
        User u=currentUser(s);
        if(u==null) return ResponseEntity.status(401).build();
        List<Map<String,Object>> out=new ArrayList<>();
        for(OrganRequest r:requests.findByUserIdOrderByIdDesc(u.getId())){
            out.add(Map.of("id",r.getId(),"organ",r.getOrgan().getOrganType(),
                "bloodGroup",r.getOrgan().getBloodGroup(),"hospital",r.getHospital().getName(),
                "city",r.getHospital().getCity(),"priorityScore",r.getPriorityScore(),
                "status",r.getStatus(),"createdAt",r.getCreatedAt().toString()));
        }
        return ResponseEntity.ok(out);
    }

    @GetMapping("/hospitals")
    public ResponseEntity<?> hospitals(HttpSession s){
        if(currentUser(s)==null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(hospitals.findAll());
    }
}
