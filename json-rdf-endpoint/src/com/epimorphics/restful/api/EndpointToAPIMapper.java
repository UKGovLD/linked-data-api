/******************************************************************
 * File:        EndpointToAPIMapper.java
 * Created by:  Dave Reynolds
 * Created on:  8 Feb 2010
 * 
 * (c) Copyright 2010, Epimorphics Limited
 * $Id:  $
 *****************************************************************/

package com.epimorphics.restful.api;

import java.util.HashMap;
import java.util.Map;

import javax.jdo.annotations.IdGeneratorStrategy;
import javax.jdo.annotations.IdentityType;
import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

import com.google.appengine.api.datastore.Key;
import com.sun.jersey.api.uri.UriTemplate;

/**
 * Stores a persistable map from endpoint URLs to API URIs.
 * 
 * @author <a href="mailto:der@hplb.hpl.hp.com">Dave Reynolds</a>
 * @version $Revision: $
 */
@PersistenceCapable(identityType = IdentityType.APPLICATION, detachable="true")
public class EndpointToAPIMapper {
    
    @Persistent(serialized="true") protected Map<String,  String> endpointToAPI = new HashMap<String, String>();

    @PrimaryKey
    @Persistent(valueStrategy = IdGeneratorStrategy.IDENTITY)
    private Key key;

    public void setKey(Key key) {
        this.key = key;
    }        

    /**
     * Record all the endpoints URLs for this API
     */
    synchronized void put(APISpec spec) {
        for (APISpec.APIEndpointSpec eps : spec.getEndpoints()) {
            endpointToAPI.put(eps.getURITemplate(), spec.getSpecURI());
        }
    }
    
    /**
     * Remove all the endpoint URLS for this API, and unregister from the router
     */
    synchronized void remove(APISpec spec, Router router) {
        for (APISpec.APIEndpointSpec eps : spec.getEndpoints()) {
            String template = eps.getURITemplate();
            router.unregister( template );
            endpointToAPI.remove( template );
        }
    }
    
    /**
     * Find the API which best matches the given call URL and
     * return its URI
     */
    synchronized String findAPI(String path) {
        String apiURI = endpointToAPI.get(path);
        if (apiURI != null) return apiURI;
        
        // Might be a template in which case we have to do a more expensive match process
        int matchlen = 0;
        String match = null;
        Map<String, String> bindings = new HashMap<String, String>();
        for (Map.Entry<String, String> e : endpointToAPI.entrySet()) {
            UriTemplate template = new UriTemplate(e.getKey());
            if (template.match( path, bindings )) {
                int len = e.getKey().length();
                if (len > matchlen) {
                    matchlen = len;
                    match = e.getValue();
                }
            }
        }
        return match;
    }
    
}

