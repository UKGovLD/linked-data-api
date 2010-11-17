/*
	(c) Copyright 2010 Epimorphics Limited
	[see end of file]
	$Id$
*/

package com.epimorphics.restful.api;

import javax.jdo.*;
import javax.jdo.annotations.*;

import com.google.appengine.api.datastore.KeyFactory;
import com.hp.hpl.jena.rdf.model.Model;

import static com.epimorphics.restful.api.SpecUtils.keyMatches;

import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.appengine.api.datastore.Key;

@PersistenceCapable(identityType = IdentityType.APPLICATION) public class OldSpecManagerGAE implements SpecManager
    {
    
    @NotPersistent static Logger log = LoggerFactory.getLogger(SpecManagerGAE.class);
    
    @NotPersistent      // Actually it *is* persistent but we have to manage it explicitly to do the updates
    protected EndpointToAPIMapper endpointMapper;
    
    @NotPersistent protected Map<String, SpecEntry> specs = new HashMap<String, SpecEntry>();
    
    @NotPersistent protected Router router;
    
    @PrimaryKey @Persistent(valueStrategy = IdGeneratorStrategy.IDENTITY) private Key key;

    @Persistent static final String SPEC_KEY = "spec-key-from:eh@epicmorphics.com"; // TODO
    @Persistent static final String MANAGER_KEY = "spec-manager-key-from:eh@epicmorphics.com"; // TODO
    @Persistent static final String ENDPOINT_MAP_KEY = "endpoint-map-key-from:eh@epicmorphics.com"; 
    
    private OldSpecManagerGAE( Key key, EndpointToAPIMapper mapper )
        {
        this.key = key;
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
        PersistenceManager pm = pmf.getPersistenceManager();
        try {
            removeExistingEntries( pm, uri, userKey );
            APISpec apiSpec = addNewEntry( pm, uri, userKey, spec );
            return apiSpec;
        } finally {  pm.close(); }
        }

    private void removeExistingEntries( PersistenceManager pm, String uri, String userKey ) throws APISecurityException
        {
        PersistentSpecEntry current = getExistingSpec(pm, SPEC_KEY + "/" + uri );
        if (current != null) 
            {
            deleteSpec( uri, userKey );
            pm.deletePersistent( current );
            }
        }

    private APISpec addNewEntry( PersistenceManager pm, String uri, String userKey, Model spec )
        {
        PersistentSpecEntry fresh = new PersistentSpecEntry( uri, userKey, spec );
        pm.makePersistent( fresh );
        APISpec apiSpec = new APISpec( spec.getResource( uri ) );
        synchronized (specs) { specs.put( uri, new SpecEntry( uri, userKey, apiSpec, spec ) ); }
        APIFactory.registerApi( router, apiSpec );
        synchronized (this) {
            endpointMapper.put(apiSpec);
            endpointMapper = pm.detachCopy( pm.makePersistent(endpointMapper) );
        }
        return apiSpec;
        }
    
    @Override public void deleteSpec( String uri, String key ) throws APISecurityException
        {        
        PersistenceManager pm = pmf.getPersistenceManager();
        try {
            PersistentSpecEntry current = getExistingSpec(pm, SPEC_KEY );
            if (current == null)
                {
                throw new APISecurityException( "API does not exist: " + uri );
                }
            else if (!keyMatches( uri, key, current.keyDigest ))
                {
                throw new APISecurityException("This key is not permited to modify API " + uri);
                }
            removeEndpoints( pm, uri );
            pm.deletePersistent( current );
        } finally {
            pm.close();
        }
    }

    private void removeEndpoints( PersistenceManager pm,  String uri )
        {
        SpecEntry entry = null;
        synchronized (specs) { 
            entry = specs.remove( uri );
            if (entry == null)
                throw new APIException("Attempted to remove non-existent API " + uri);
        }
        synchronized (this) {
            endpointMapper.remove(entry.spec, router);
            endpointMapper = pm.detachCopy( pm.makePersistent(endpointMapper) );
        }
        }

    @Override public void loadSpecFor( String url ) 
        {        
        log.info("Trying to unpick encoding " + url);
        String uri = getAPIURIforEndpointURL(url);
        log.info("Mapped this to API " + uri);
        PersistenceManager pm = pmf.getPersistenceManager();
        try {
            PersistentSpecEntry current = getExistingSpec(pm, SPEC_KEY + "/" + uri );
            if (current == null) {
                log.error("Failed to find spec for " + url);
                return;
            } else
                {
                log.info("Success");
                Model m = current.getModel();
                APISpec aSpec = new APISpec( m.getResource( uri ) );     
                APIFactory.registerApi( router, aSpec );
                synchronized (specs) { specs.put( uri, new SpecEntry( uri, current.userKey, aSpec, m) ); }
                }
        } finally { pm.close(); }
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
    public static SpecManager loadOrCreate( Router router )
        {
        PersistenceManager pm = pmf.getPersistenceManager();
        try {
            log.info( ">> about to load (or create) a SpecManagerGAE." );
            OldSpecManagerGAE answer = findExistingSpecManager( pm );
            if (answer == null) {
                log.info( ">> could not find one, try to create one." );
                answer = createAndSaveNewSpecManager( pm );
                if (answer == null) {
                    pm.close();
                    throw new APIException("Failed to create SpecManager");
                }
                log.info( ">> created one, hooray!" );
            }
            answer.router = router;
            return answer;
        } finally { pm.close(); }
        }

    private static OldSpecManagerGAE createAndSaveNewSpecManager( PersistenceManager pm )
        {
        Key mapkey = KeyFactory.createKey(EndpointToAPIMapper.class.getSimpleName(), ENDPOINT_MAP_KEY);
        // EndpointToAPIMapper endpointMapper = new EndpointToAPIMapper();
       // endpointMapper.setKey(mapkey);
        // pm.makePersistent(endpointMapper);
        // endpointMapper = pm.detachCopy(endpointMapper);   // Detach to allow future update

        Key key = KeyFactory.createKey( SpecManagerGAE.class.getSimpleName(), MANAGER_KEY );
//        OldSpecManagerGAE result = new OldSpecManagerGAE( key, endpointMapper );
//        pm.makePersistent( result );
        return null; // result;
        }

    private static OldSpecManagerGAE findExistingSpecManager( PersistenceManager pm ) {
        try {
            OldSpecManagerGAE sm = pm.getObjectById( OldSpecManagerGAE.class, MANAGER_KEY);
            log.info(">> Restoring endpoint mapper ...");
            EndpointToAPIMapper mapper = pm.getObjectById( EndpointToAPIMapper.class, ENDPOINT_MAP_KEY);
            mapper = pm.detachCopy( mapper );
            sm.endpointMapper = mapper;
            log.info(">> ... restored");
            return sm;
        } catch (Exception e) {
            return null;
        }
    }
    
    @NotPersistent static final PersistenceManagerFactory pmf = JDOHelper.getPersistenceManagerFactory("transactions-optional");

    private PersistentSpecEntry getExistingSpec(PersistenceManager pm, String key) {
        try {
            return pm.getObjectById( PersistentSpecEntry.class, key );
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public Model getSpecForAPI(String api) {
        SpecEntry entry = specs.get(api);
        if (entry != null) return entry.specModel;
        return null;
    }

    @Override
    public Model getSpecForEndpoint(String url) {
        String apiURI = getAPIURIforEndpointURL(url);
        return (apiURI != null) ? getSpecForAPI(apiURI) : null;
    }
    
    public String getAPIURIforEndpointURL(String url) {
        return endpointMapper.findAPI(url);
    }
    
    

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
