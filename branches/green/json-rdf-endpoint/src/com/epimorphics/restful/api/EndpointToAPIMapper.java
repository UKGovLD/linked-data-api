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

import com.google.appengine.api.datastore.*;

import com.google.appengine.api.datastore.Key;
import com.sun.jersey.api.uri.UriTemplate;

/**
 * Stores a persistable map from endpoint URLs to API URIs.
 * 
 * @author <a href="mailto:der@hplb.hpl.hp.com">Dave Reynolds</a>
 * @version $Revision: $
 */

public class EndpointToAPIMapper {
    
    protected Map<String, String> endpointToAPI = new HashMap<String, String>();

    static final String KIND = EndpointToAPIMapper.class.getName();
    
    protected final Entity myEntity;
    
    public EndpointToAPIMapper( String tag )
        {
        myEntity = findOrCreate( tag );
        Map <String, Object> properties = myEntity.getProperties();
        for (String key: properties.keySet())
            endpointToAPI.put( key, (String) properties.get( key ) );
        }

    private Entity findOrCreate( String tag )
        {
        DatastoreService ds = DatastoreServiceFactory.getDatastoreService();
        Key key = KeyFactory.createKey( KIND, tag );
        try 
            { return ds.get( key ); }
        catch (EntityNotFoundException e) 
            { 
            Entity fresh = new Entity( KIND, tag );
            ds.put( fresh );
            return fresh; 
            }
        }
    
    private void persist()
        {
        clearEntity();
        setEntity();
        DatastoreServiceFactory.getDatastoreService().put( myEntity );
        }

    private void setEntity()
        {
        for (String key: endpointToAPI.keySet())
            myEntity.setProperty( key, endpointToAPI.get( key ) );
        }

    private void clearEntity()
        {
        for (String key: myEntity.getProperties().keySet())
            myEntity.removeProperty( key );
        }

    /**
     * Record all the endpoints URLs for this API
     */
    synchronized void put(APISpec spec) {
        for (APISpec.APIEndpointSpec eps : spec.getEndpoints()) {
            endpointToAPI.put(eps.getURITemplate(), spec.getSpecURI());
        }
        persist();
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
        persist();
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

