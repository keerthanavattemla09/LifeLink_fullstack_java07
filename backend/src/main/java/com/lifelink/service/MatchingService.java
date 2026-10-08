package com.lifelink.service;

import com.lifelink.model.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class MatchingService {

    public double calculateScore(User user, Organ organ) {
        double score = 0;

        if (Objects.equals(user.getBloodGroup(), organ.getBloodGroup())) score += 45;
        else if ("O-".equals(organ.getBloodGroup())) score += 25;
        else score += 10;

        if (user.getRequiredOrgan() != null &&
            user.getRequiredOrgan().equalsIgnoreCase(organ.getOrganType())) score += 30;
        else score -= 50;

        int age = user.getAge() == null ? 40 : user.getAge();
        score += Math.max(0, 15 - Math.abs(age - 40) / 4.0);
        score += 10;

        return Math.max(0, Math.min(100, Math.round(score * 10) / 10.0));
    }

    public List<Map<String,Object>> rank(User user, List<Organ> organs) {
        List<Map<String,Object>> result = new ArrayList<>();
        for (Organ o : organs) {
            double score = calculateScore(user,o);
            Map<String,Object> m = new LinkedHashMap<>();
            m.put("id",o.getId());
            m.put("organType",o.getOrganType());
            m.put("bloodGroup",o.getBloodGroup());
            m.put("quantity",o.getQuantity());
            m.put("hospital",o.getHospital().getName());
            m.put("city",o.getHospital().getCity());
            m.put("phone",o.getHospital().getPhone());
            m.put("score",score);
            m.put("reasons", reasons(user,o));
            result.add(m);
        }
        result.sort((a,b)->Double.compare((Double)b.get("score"),(Double)a.get("score")));
        return result;
    }

    private List<String> reasons(User user, Organ o){
        List<String> r = new ArrayList<>();
        if (Objects.equals(user.getBloodGroup(),o.getBloodGroup())) r.add("Exact blood-group match");
        else r.add("Blood-group compatibility requires verification");
        if (user.getRequiredOrgan()!=null &&
            user.getRequiredOrgan().equalsIgnoreCase(o.getOrganType())) r.add("Required organ matches");
        r.add("Recipient priority factor");
        r.add("Hospital availability factor");
        return r;
    }
}
