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
    
    static Logger log = LoggerFactory.getLogger(SpecManagerGAE.class);
    
    protected EndpointToAPIMapper endpointMapper;
    
    protected Map<String, SpecEntry> specs = new HashMap<String, SpecEntry>();
    
    protected Router router;
    
    private SpecManagerGAE( EndpointToAPIMapper mapper )
        {
        this.endpointMapper = mapper;
        }
    
    static class SpecEntry 
        {
        String uri;
        APISpec spec;
        byte[] keyDigest;
        Model specModel;
    
        SpecEntry(String uri, String key, APISpec spec, Model specModel) {
            this.uri = uri;
            this.keyDigest = SpecUtils.digestKey(uri, key);
            this.spec = spec;
            this.specModel = specModel;
        } 
    }
    
    @Override public APISpec addSpec( String uri, String userKey, Model spec ) throws APISecurityException
        {        
        removeExistingEntries( uri, userKey );
        return addNewEntry( uri, userKey, spec );
        }

    private void removeExistingEntries( String uri, String userKey ) throws APISecurityException
        {
        PersistentSpecEntry current = PersistentSpecEntry.find( uri );
        if (current != null) 
            {
            deleteSpec( uri, userKey );
            current.unpersist();
            }
        }

    private APISpec addNewEntry( String uri, String userKey, Model spec )
        {
        new PersistentSpecEntry( uri, userKey, spec ).persist();
        APISpec apiSpec = new APISpec( spec.getResource( uri ) );
        synchronized (specs) { specs.put( uri, new SpecEntry( uri, userKey, apiSpec, spec ) ); }
        APIFactory.registerApi( router, apiSpec );
        synchronized (this) 
            {
            // TOODO make persistent
            endpointMapper.put(apiSpec);
            }
        return apiSpec;
        }
    
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
        synchronized (this) {
            endpointMapper.remove(entry.spec, router);
            // TODO make (un)persistent
            }
        }

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
            synchronized (specs) { specs.put( uri, new SpecEntry( uri, current.userKey, aSpec, m) ); }
            }
        }

    @Override public APISpec updateSpec( String uri, String key, Model spec ) throws APISecurityException
        {
        deleteSpec( uri, key );
        return addSpec( uri, key, spec );
        }
    
    /**
        Create a new persistent SpecManager, or load the existing one.
        Set the router field to that supplied.
    */
    public static SpecManager create( Router router )
        {
        EndpointToAPIMapper epm = new EndpointToAPIMapper();
        // TODO make it persistent ...
        SpecManagerGAE result = new SpecManagerGAE( epm );
        result.router = router;
        return result;
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
