/*
	(c) Copyright 2010 Epimorphics Limited
	[see end of file]
	$Id$
*/

package com.epimorphics.restful.api;

import static com.epimorphics.restful.api.SpecUtils.keyMatches;

import java.util.*;

import javax.jdo.*;
import javax.jdo.annotations.*;

import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;

import com.hp.hpl.jena.rdf.model.Model;

@PersistenceCapable(identityType = IdentityType.APPLICATION) public class SpecManagerGAE implements SpecManager
    {
    private SpecManagerGAE( Key key )
        {
        this.key = key;
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
    
    @NotPersistent protected static Map<String, SpecEntry> specs = new HashMap<String, SpecEntry>();

    @Override public APISpec addSpec( String uri, String userKey, Model spec ) throws APISecurityException
        {        
        PersistenceManager pm = pmf.getPersistenceManager();
        removeExistingEntries( pm, uri, userKey );
        APISpec apiSpec = addNewEntry( pm, uri, userKey, spec );
        pm.close();
        return apiSpec;
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
        return apiSpec;
        }
    
    @Override public void deleteSpec( String uri, String key ) throws APISecurityException
        {        
        PersistenceManager pm = pmf.getPersistenceManager();
        PersistentSpecEntry current = getExistingSpec(pm, SPEC_KEY );
        if (current == null)
            {
            pm.close();         // TODO check this should be in here
            throw new APISecurityException( "API does not exist: " + uri );
            }
        else if (!keyMatches( uri, key, current.keyDigest ))
            {
            pm.close();         // TODO check this should be in here
            throw new APISecurityException("This key is not permited to modify API " + uri);
            }
        removeEndpoints( uri );
        pm.deletePersistent( current );
        pm.close();         // TODO check this should be in here
    }

    private void removeEndpoints( String uri )
        {
        SpecEntry entry = specs.get( uri );
        for (APISpec.APIEndpointSpec eps : entry.spec.getEndpoints()) 
            router.unregister( eps.getURITemplate() );
        synchronized (specs) { specs.remove(uri); }
        }

    @Override public void loadSpecFor( String uri ) 
        {        
        PersistenceManager pm = pmf.getPersistenceManager();
        PersistentSpecEntry current = getExistingSpec(pm, SPEC_KEY + "/" + uri );
        pm.close();         // TODO check this should be in here
        if (current == null)
            throw new RuntimeException( new APISecurityException( "API does not exist: " + uri ) );
        else
            {
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
    
    @NotPersistent protected Router router;
    
    @PrimaryKey @Persistent(valueStrategy = IdGeneratorStrategy.IDENTITY) private Key key;
    
    /**
        Create a new persistent SpecManager, or load the existing one.
        Set the router field to that supplied.
    */
    public static SpecManager loadOrCreate( Router router )
        {
        PersistenceManager pm = pmf.getPersistenceManager();
        System.err.println( ">> about to load (or create) a SpecManagerGAE." );
        SpecManagerGAE answer = findExistingSpecManager( pm );
        System.err.println( ">> could not find one, try to create one." );
        if (answer == null) answer = createAndSaveNewSpecManager( pm );
        System.err.println( ">> created one, hooray!" );
        answer.router = router;
        pm.close();         // TODO check this should be in here
        return answer;
        }

    private static SpecManagerGAE createAndSaveNewSpecManager( PersistenceManager pm )
        {
        Key key = KeyFactory.createKey( SpecManagerGAE.class.getSimpleName(), MANAGER_KEY );
        SpecManagerGAE result = new SpecManagerGAE( key );
        pm.makePersistent( result );
        return result;
        }

    @Persistent static final String SPEC_KEY = "spec-key-from:eh@epicmorphics.com"; // TODO
    
    @Persistent static final String MANAGER_KEY = "spec-manager-key-from:eh@epicmorphics.com"; // TODO

    private static SpecManagerGAE findExistingSpecManager( PersistenceManager pm )
        { 
        try { return pm.getObjectById( SpecManagerGAE.class, MANAGER_KEY ); }    
        catch (Exception e) { return null; }
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
        if (entry != null) 
            return entry.specModel;
        return null;
    }

    @Override
    public Model getSpecForEndpoint(String url) {
        Match match = router.getMatch(url);
        if (match != null) {
            String apiURI = match.getEndpoint().getSpec().getAPISpec().getSpecURI();
            return getSpecForAPI(apiURI);
        } 
        return null;
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
