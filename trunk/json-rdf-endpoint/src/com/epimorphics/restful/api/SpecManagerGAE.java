/*
	(c) Copyright 2010 Epimorphics Limited
	[see end of file]
	$Id$
*/

package com.epimorphics.restful.api;

import static com.epimorphics.restful.api.SpecUtils.keyMatches;

import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.hp.hpl.jena.rdf.model.Model;

public class SpecManagerGAE implements SpecManager
    {
    static final Logger log = LoggerFactory.getLogger(SpecManagerGAE.class);
    
    final protected EndpointToAPIMapper endpointMapper;
    
    protected Map<String, SpecEntry> specs = new HashMap<String, SpecEntry>();
    
    final protected Router router;
    
    private SpecManagerGAE( Router router )
        {
        this.router = router;
        this.endpointMapper = new EndpointToAPIMapper( "myTag" );
        }
    
    /**
        Create a new SpecManager that persists its data in the GAE 
        darastore. Set the manager's router to that supplied.
    */
    public static SpecManager create( Router router )
        { return new SpecManagerGAE( router ); }
    
    static class SpecEntry 
        {
        APISpec spec;
        Model specModel;
    
        SpecEntry( APISpec spec, Model specModel) {
            this.spec = spec;
            this.specModel = specModel;
        } 
    }
    
    /**
        Discard any existing specification for the given uri. Install a new
        specification with the given model.
     */
    @Override public APISpec addSpec( String uri, String userKey, Model spec ) throws APISecurityException
        {        
        removeExistingEntries( uri, userKey );
        return addNewEntry( uri, userKey, spec );
        }
    
    /**
        Remove any existing spec at the given uri from both the transient and
        persistent records.
    */
    private void removeExistingEntries( String uri, String userKey ) throws APISecurityException
        {
        PersistentSpecEntry current = PersistentSpecEntry.find( uri );
        if (current != null) 
            {
            deleteSpec( uri, userKey );
            current.unpersist();
            }
        }

    /**
        Add a new spec entry at the given uri with the given spec model
        to both the transient and persistent records.
    */
    private APISpec addNewEntry( String uri, String userKey, Model spec )
        {
        new PersistentSpecEntry( uri, userKey, spec ).persist();
        APISpec apiSpec = new APISpec( spec.getResource( uri ) );
        synchronized (specs) { specs.put( uri, new SpecEntry( apiSpec, spec ) ); }
        APIFactory.registerApi( router, apiSpec );
        synchronized (this) { endpointMapper.put(apiSpec); }
        return apiSpec;
        }
    
    /**
        Delete any spec at the given URI from both the persistent and 
        transient records.
    */
    @Override public void deleteSpec( String uri, String userKey ) throws APISecurityException
        {
        PersistentSpecEntry current = PersistentSpecEntry.find( uri );
        if (current == null)
            {
            throw new APISecurityException( "API does not exist: " + uri );
            }
//        else if (!keyMatches( uri, userKey, current.keyDigest ))
//            {
//            throw new APISecurityException("This key is not permited to modify API " + uri);
//            }
        removeEndpoints( uri );
        current.unpersist();
        }

    /**
        Remove all the endpoints for the spec at the given uri, if there are
        any.
    */
    private void removeEndpoints( String uri )
        {
        SpecEntry entry = null;
        synchronized (specs) { 
            entry = specs.remove( uri );
            if (entry == null)
                {
                log.info( ">> attempted to remove non-existent API " + uri );
                // throw new APIException("Attempted to remove non-existent API " + uri);
                return;
                }
        }
        synchronized (this) 
            { endpointMapper.remove(entry.spec, router); }
        }

    /**
        load the spec for the given url.
    */
    @Override public void loadSpecFor( String url ) 
        {        
        log.info("Trying to unpick encoding " + url);
        String uri = getAPIURIforEndpointURL(url);
        log.info("Mapped this to API " + uri);
        PersistentSpecEntry current = PersistentSpecEntry.find( uri );
        if (current == null) 
            {
            log.error("Failed to find spec for " + url);
            } 
        else
            {
            log.info("Success");
            Model m = current.getModel();
            APISpec aSpec = new APISpec( m.getResource( uri ) );     
            APIFactory.registerApi( router, aSpec );
            synchronized (specs) { specs.put( uri, new SpecEntry( aSpec, m) ); }
            }
        }

    @Override public APISpec updateSpec( String uri, String key, Model spec ) throws APISecurityException
        {
        deleteSpec( uri, key );
        return addSpec( uri, key, spec );
        }

    @Override public Model getSpecForAPI( String api ) 
        {
        SpecEntry entry = specs.get(api);
        return entry == null ? null : entry.specModel;
        }

    @Override public Model getSpecForEndpoint( String url ) 
        {
        String apiURI = getAPIURIforEndpointURL(url);
        return (apiURI == null) ? null : getSpecForAPI( apiURI );
        }
    
    public String getAPIURIforEndpointURL( String url ) 
        { return endpointMapper.findAPI( url ); }
    
    }

    
/*
    (c) Copyright 2010 Epimorphics Limited
    All rights reserved.

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

    1. Redistributions of source code must retain the above copyright
       notice, this list of conditions and the following disclaimer.

    2. Redistributions in binary form must reproduce the above copyright
       notice, this list of conditions and the following disclaimer in the
       documentation and/or other materials provided with the distribution.

    3. The name of the author may not be used to endorse or promote products
       derived from this software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
    IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
    IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
    INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
    NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
    DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
    THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
