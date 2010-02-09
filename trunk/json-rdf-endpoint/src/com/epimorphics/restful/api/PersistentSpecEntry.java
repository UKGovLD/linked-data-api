/*
	(c) Copyright 2010 Epimorphics Limited
	[see end of file]
	$Id$
*/

package com.epimorphics.restful.api;

import java.io.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.appengine.api.datastore.*;
import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.ModelFactory;

public class PersistentSpecEntry
    {
    protected static final String KIND = PersistentSpecEntry.class.getSimpleName();
    
    protected String uri;
    protected String userKey;
    protected byte [] keyDigest;
    protected Text modelAsNTriples;

    static Logger log = LoggerFactory.getLogger( PersistentSpecEntry.class );
    
    PersistentSpecEntry( String uri, String userKey, Model model )
        {
        this.uri = uri;
        this.userKey = userKey;
        this.keyDigest = SpecUtils.digestKey( uri, userKey );
        this.modelAsNTriples = new Text( asNTriples( model ) );
        }
    
    private static String asNTriples( Model model )
        {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        model.write( bos, "N-TRIPLES" );
        return bos.toString();
        }
    
    public Model getModel()
        { return getModelFromText( modelAsNTriples ); }

    private static Model getModelFromText( Text modelText )
        {
        try
            {
            String modelString = modelText.getValue();
            log.info( ">> the model string is\n" + modelString );
            InputStream in = new ByteArrayInputStream( modelString.getBytes( "UTF-8" ) );
            Model result = ModelFactory.createDefaultModel();
            result.read( in, "", "N-TRIPLES" );
            return result;
            }
        catch (UnsupportedEncodingException e)
            { throw new RuntimeException( e ); }
        }

    /**
        Persist this entry in the datastore
    */
    public void persist()
        {
        log.info( ">> persisting " + uri + " in the datastore." );
        Entity representation = new Entity( KIND, uri );
        representation.setProperty( "uri", uri );
        representation.setProperty( "userKey", userKey );
        representation.setProperty( "modelAsNTriples", modelAsNTriples );
        DatastoreServiceFactory.getDatastoreService().put( representation );
        log.info( ">> well, that should have worked." );
        }

    /**
        Remove this entry from the datastore.
    */
    public void unpersist()
        {
        log.info( ">> removing " + uri + " from the datastore." );
        Key key = KeyFactory.createKey( KIND, uri );
        DatastoreServiceFactory.getDatastoreService().delete( key );
        }

    public static PersistentSpecEntry find( String uri )
        {
        log.info( ">> looking for " + uri + " in the datastore." );
        Key key = KeyFactory.createKey( KIND, uri );
        Entity representation = lookup( key );
        if (representation == null) return null; // throw new NotFoundException( KIND + "(" + uri + ")" );
        log.info( ">> we found it! making the matching Jva object." );
        return new PersistentSpecEntry( uri, uri, getModelFromText( (Text) representation.getProperty( "modelAsNTriples" ) ) );
        }

    private static Entity lookup( Key key )
        {
        try { return DatastoreServiceFactory.getDatastoreService().get( key ); }
        catch (EntityNotFoundException e) { return null; }
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
