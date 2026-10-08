package com.lifelink.config;

import com.lifelink.model.*;
import com.lifelink.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {
    @Bean
    CommandLineRunner seed(UserRepository users, HospitalRepository hospitals, OrganRepository organs) {
        return args -> {
            if (users.count() == 0) {
                users.save(new User("user","user123","user","Demo Recipient","A+",45,"Kidney"));
                users.save(new User("hospital","hosp123","hospital","Apollo Demo Hospital",null,null,null));
                users.save(new User("admin","admin123","admin","LifeLink Administrator",null,null,null));
            }

            if (hospitals.count() == 0) {
                Hospital a = hospitals.save(new Hospital("Apollo Demo Hospital","Chennai","+91 90000 11111",13.0827,80.2707));
                Hospital m = hospitals.save(new Hospital("MGM Demo Healthcare","Chennai","+91 90000 22222",13.0569,80.2425));
                Hospital i = hospitals.save(new Hospital("MIOT Demo Hospital","Chennai","+91 90000 33333",13.0108,80.2068));
                Hospital f = hospitals.save(new Hospital("Fortis Demo Centre","Chennai","+91 90000 44444",13.0358,80.2490));

                organs.save(new Organ("Kidney","A+",2,"Available",a));
                organs.save(new Organ("Kidney","O+",1,"Available",a));
                organs.save(new Organ("Liver","A+",1,"Available",a));
                organs.save(new Organ("Cornea","AB+",3,"Available",a));
                organs.save(new Organ("Heart","O+",1,"Available",m));
                organs.save(new Organ("Kidney","B+",2,"Available",m));
                organs.save(new Organ("Lungs","A+",1,"Available",i));
                organs.save(new Organ("Kidney","O+",1,"Available",i));
            }
        };
    }
}
